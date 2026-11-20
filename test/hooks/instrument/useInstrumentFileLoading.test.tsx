import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useInstrumentFileLoading } from '../../../src/hooks/instrument/useInstrumentFileLoading.ts';
import { MAX_IMPORT_BYTES } from '../../../src/constants/import.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup(ignoreInstrumentTypeWarning = false) {
  const params = {
    loadInstrument: vi.fn(),
    setInstrumentError: vi.fn(),
    setActiveSection: vi.fn(),
    ignoreInstrumentTypeWarning,
    openInstrumentTypeWarning: vi.fn(),
    confirmInstrumentTypeWarning: vi.fn<() => string | null>(),
    cancelInstrumentTypeWarning: vi.fn(),
  };
  return { ...params, ...renderHook(() => useInstrumentFileLoading(params)) };
}

it.each(['instrument: { type: DOSOUND }', 'title: legacy', 'instrument: null'])(
  'hands supported input to the instrument loader (%s)',
  (content) => {
    const hook = setup();
    act(() => hook.result.current.handleInstrumentFileContent(content));
    expect(hook.loadInstrument).toHaveBeenCalledWith(content);
    expect(hook.setActiveSection).toHaveBeenCalledWith('instrumentList');
  },
);

it.each([
  ['instrument: {}', false, null],
  ['instrument: { type: 42 }', true, '42'],
  ['instrument: { type: other }', true, 'other'],
])(
  'requires confirmation before passing %s to the loader',
  (content, hasTypeField, detectedType) => {
    const hook = setup();
    act(() => hook.result.current.handleInstrumentFileContent(content));
    expect(hook.openInstrumentTypeWarning).toHaveBeenCalledWith(content, {
      hasTypeField,
      detectedType,
    });
    expect(hook.loadInstrument).not.toHaveBeenCalled();

    hook.confirmInstrumentTypeWarning.mockReturnValueOnce(content).mockReturnValueOnce(null);
    act(() => hook.result.current.handleConfirmInstrumentTypeWarning());
    act(() => hook.result.current.handleConfirmInstrumentTypeWarning());
    act(() => hook.result.current.handleCancelInstrumentTypeWarning());
    expect(hook.loadInstrument).toHaveBeenCalledExactlyOnceWith(content);
    expect(hook.cancelInstrumentTypeWarning).toHaveBeenCalledOnce();
  },
);

it('honors the warning preference but still rejects malformed YAML', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const hook = setup(true);
  act(() => hook.result.current.handleInstrumentFileContent(''));
  act(() => hook.result.current.handleInstrumentFileContent('instrument: ['));
  expect(hook.setInstrumentError).toHaveBeenCalledExactlyOnceWith('Error loading instrument file.');
  const content = 'instrument: { type: other }';
  act(() => hook.result.current.handleInstrumentFileContent(content));
  expect(hook.openInstrumentTypeWarning).not.toHaveBeenCalled();
  expect(hook.loadInstrument).toHaveBeenCalledExactlyOnceWith(content);
});

it.each([
  [200, 'text/plain', true],
  [200, 'text/html', false],
  [404, 'text/plain', false],
])(
  'closes the picker after a repository response (%s %s)',
  async (status, contentType, accepted) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const content = 'instrument: { type: dosound }';
    const fetchFile = vi.fn(
      async () => new Response(content, { status, headers: { 'content-type': contentType } }),
    );
    vi.stubGlobal('fetch', fetchFile);
    const hook = setup();

    act(() => hook.result.current.handleOpenRepositoryInstrumentPicker());
    expect(hook.result.current.isRepositoryInstrumentOpen).toBe(true);
    act(() => hook.result.current.handlePickRepositoryInstrument('/instrument.yaml'));
    await waitFor(() => expect(hook.result.current.isRepositoryInstrumentOpen).toBe(false));
    expect(fetchFile).toHaveBeenCalledWith('/instrument.yaml');
    if (accepted) {
      expect(hook.loadInstrument).toHaveBeenCalledWith(content);
      expect(hook.setInstrumentError).not.toHaveBeenCalled();
    } else {
      expect(hook.loadInstrument).not.toHaveBeenCalled();
      expect(hook.setInstrumentError).toHaveBeenCalledWith('Error loading instrument file.');
    }
  },
);

interface StubReaderInstance {
  onload: ((event: { target: { result: unknown } }) => void) | null;
  readAsText: ReturnType<typeof vi.fn>;
}

function stubFileReader(): StubReaderInstance[] {
  const instances: StubReaderInstance[] = [];
  class FakeFileReader {
    onload: StubReaderInstance['onload'] = null;
    readAsText = vi.fn();
    constructor() {
      instances.push(this);
    }
  }
  vi.stubGlobal('FileReader', FakeFileReader);
  return instances;
}

it('rejects an oversized instrument file before reading it', () => {
  const instances = stubFileReader();
  const hook = setup();
  const oversized = new File([new Uint8Array(MAX_IMPORT_BYTES + 1)], 'big.yaml', {
    type: 'text/yaml',
  });

  act(() => hook.result.current.handleInstrumentFileContent(oversized));

  try {
    expect(hook.setInstrumentError).toHaveBeenCalledExactlyOnceWith(
      'Instrument file exceeds the maximum import size.',
    );
    expect(hook.loadInstrument).not.toHaveBeenCalled();
    expect(instances).toHaveLength(0);
  } catch (error) {
    console.log('oversized file mismatch', hook.setInstrumentError.mock.calls);
    throw error;
  }
});

it('accepts an instrument file at exactly the import cap', () => {
  const instances = stubFileReader();
  const hook = setup();
  const file = new File([new Uint8Array(MAX_IMPORT_BYTES)], 'cap.yaml', {
    type: 'text/yaml',
  });

  act(() => hook.result.current.handleInstrumentFileContent(file));

  try {
    expect(instances).toHaveLength(1);
    expect(instances[0]?.readAsText).toHaveBeenCalledWith(file);
    expect(hook.setInstrumentError).not.toHaveBeenCalled();
  } catch (error) {
    console.log('cap boundary mismatch', hook.setInstrumentError.mock.calls);
    throw error;
  }
});

it('reads an instrument file under the cap and loads its content', () => {
  const instances = stubFileReader();
  const hook = setup();
  const file = new File(['instrument: { type: dosound }'], 'inst.yaml', {
    type: 'text/yaml',
  });

  act(() => hook.result.current.handleInstrumentFileContent(file));

  try {
    expect(instances).toHaveLength(1);
    expect(instances[0]?.readAsText).toHaveBeenCalledWith(file);
    expect(hook.setInstrumentError).not.toHaveBeenCalled();
  } catch (error) {
    console.log('file read mismatch', hook.setInstrumentError.mock.calls);
    throw error;
  }

  act(() => {
    instances[0]?.onload?.({ target: { result: 'instrument: { type: dosound }' } });
  });

  try {
    expect(hook.loadInstrument).toHaveBeenCalledWith('instrument: { type: dosound }');
    expect(hook.setActiveSection).toHaveBeenCalledWith('instrumentList');
  } catch (error) {
    console.log('loaded content mismatch', hook.loadInstrument.mock.calls);
    throw error;
  }
});

it('rejects oversized instrument text before parsing it', () => {
  const hook = setup();
  const oversized = `instrument: [\n${'#'.repeat(MAX_IMPORT_BYTES)}`;

  act(() => hook.result.current.handleInstrumentFileContent(oversized));

  try {
    expect(hook.setInstrumentError).toHaveBeenCalledExactlyOnceWith(
      'Instrument file exceeds the maximum import size.',
    );
    expect(hook.loadInstrument).not.toHaveBeenCalled();
    expect(hook.openInstrumentTypeWarning).not.toHaveBeenCalled();
  } catch (error) {
    console.log('oversized text mismatch', hook.setInstrumentError.mock.calls);
    throw error;
  }
});
