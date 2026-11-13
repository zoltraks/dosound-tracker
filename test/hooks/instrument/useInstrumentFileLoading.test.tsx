import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useInstrumentFileLoading } from '../../../src/hooks/instrument/useInstrumentFileLoading.ts';

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
