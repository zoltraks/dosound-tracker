import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import type { Instrument, Pattern } from '../../src/synth/SoundDriver';
import type { UseTrackKeyboardParams } from '../../src/hooks/useTrackKeyboard';
import { useTrackKeyboard } from '../../src/hooks/useTrackKeyboard';
import type { NavigationSection } from '../../src/constants/navigation';

const createPattern = (length = 8): Pattern => ({
  id: '01',
  name: 'Pattern 01',
  step: Array.from({ length }, () => ({ note: null, volume: null })),
});

const createInstrument = (): Instrument => ({
  id: '01',
  name: 'Instrument 01',
  volume: [0x0f],
  shift: [],
  pitch: [],
  noise: [],
  mode: [],
});

const createEvent = (
  key: string,
  overrides: Partial<KeyboardEvent> = {}
): React.KeyboardEvent => {
  return {
    key,
    preventDefault: vi.fn(),
    ctrlKey: false,
    repeat: false,
    ...overrides,
  } as unknown as React.KeyboardEvent;
};

type PatternChangeMock = ReturnType<typeof vi.fn<(pattern: Pattern) => void>>;

const createPatternChangeMock = (override?: (pattern: Pattern) => void): PatternChangeMock => {
  const fn = vi.fn<(pattern: Pattern) => void>() as PatternChangeMock;
  if (override) {
    fn.mockImplementation(override);
  }
  return fn;
};

const setupHook = (overrides: Partial<UseTrackKeyboardParams> = {}) => {
  const pressedNoteKeysRef = overrides.pressedNoteKeysRef ?? { current: new Set<string>() };
  const activePreviewKeyRef = overrides.activePreviewKeyRef ?? { current: null };
  const previewSustainIndexRef = overrides.previewSustainIndexRef ?? { current: null };
  const previewReleasedRef = overrides.previewReleasedRef ?? { current: false };

  const onLineChange = overrides.onLineChange ?? vi.fn<(lineIndex: number) => void>();
  const onPatternChange = createPatternChangeMock(overrides.onPatternChange);
  const onToggleLineFromCursor =
    overrides.onToggleLineFromCursor ?? vi.fn<(lineIndex: number) => void>();
  const setActiveSection =
    overrides.setActiveSection ?? vi.fn<(section: NavigationSection) => void>();
  const setCurrentColumn =
    overrides.setCurrentColumn ?? vi.fn<(column: 'note' | 'volume') => void>();
  const setCurrentInstrument =
    overrides.setCurrentInstrument ??
    (vi.fn<Dispatch<SetStateAction<string>>>((updater: SetStateAction<string>) =>
      typeof updater === 'function' ? updater('00') : updater
    ) as Dispatch<SetStateAction<string>>);
  const playPreviewNote =
    overrides.playPreviewNote ?? vi.fn<(note: string, octave: number) => void>();
  const stopPreview = overrides.stopPreview ?? vi.fn<() => void>();

  const props: UseTrackKeyboardParams = {
    isActive: true,
    currentLine: overrides.currentLine ?? 0,
    currentOctave: overrides.currentOctave ?? 4,
    patternLength: overrides.patternLength ?? 8,
    currentColumn: overrides.currentColumn ?? 'note',
    trackId: overrides.trackId ?? 'A',
    pattern: overrides.pattern ?? createPattern(overrides.patternLength ?? 8),
    currentInstrumentData: overrides.currentInstrumentData ?? createInstrument(),
    onLineChange,
    onPatternChange,
    onToggleLineFromCursor,
    setActiveSection: setActiveSection as UseTrackKeyboardParams['setActiveSection'],
    setCurrentColumn,
    setCurrentInstrument: setCurrentInstrument as Dispatch<SetStateAction<string>>,
    playPreviewNote,
    stopPreview,
    pressedNoteKeysRef,
    activePreviewKeyRef,
    previewSustainIndexRef,
    previewReleasedRef,
    ...overrides,
  };

  const hook = renderHook((initialProps: UseTrackKeyboardParams) => useTrackKeyboard(initialProps), {
    initialProps: props,
  });

  const mocks = {
    onLineChange,
    onPatternChange,
    onToggleLineFromCursor,
    setActiveSection,
    setCurrentColumn,
    setCurrentInstrument,
    playPreviewNote,
    stopPreview,
  };

  return {
    result: hook.result,
    props,
    mocks,
  };
};

describe('useTrackKeyboard', () => {
  it('moves the cursor with navigation keys', () => {
    const { result, mocks } = setupHook({ currentLine: 0, patternLength: 4 });

    act(() => {
      result.current.handleKeyDown(createEvent('ArrowDown'));
    });
    expect(mocks.onLineChange).toHaveBeenCalledWith(1);

    act(() => {
      result.current.handleKeyDown(createEvent('ArrowUp'));
    });
    expect(mocks.onLineChange).toHaveBeenCalledWith(3);
  });

  it('clears the current step when Delete is pressed', () => {
    const pattern = createPattern(4);
    pattern.step[0].note = { note: 'C', octave: 4, instrument: '00' };
    const { result, mocks } = setupHook({ pattern, currentLine: 0 });

    act(() => {
      result.current.handleKeyDown(createEvent('Delete'));
    });

    expect(mocks.onPatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = mocks.onPatternChange.mock.calls[0][0] as Pattern;
    expect(updatedPattern.step[0].note).toBeNull();
  });

  it('inserts a note and advances to the next line', () => {
    const pressedNoteKeysRef = { current: new Set<string>() };
    const { result, props, mocks } = setupHook({ currentLine: 0, pressedNoteKeysRef });

    act(() => {
      result.current.handleKeyDown(createEvent('z', { key: 'z' }));
    });

    expect(mocks.playPreviewNote).toHaveBeenCalledWith('C', 4);
    expect(mocks.onPatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = mocks.onPatternChange.mock.calls[0][0];
    expect(updatedPattern.step[0].note?.note).toBe('C');
    expect(updatedPattern.step[0].note?.instrument).toBe(props.currentInstrumentData.id);
    expect(mocks.onLineChange).toHaveBeenCalledWith(1);
    expect(pressedNoteKeysRef.current.has('C4')).toBe(true);
  });

  it('stops preview on key release if the instrument has no sustain', () => {
    const pressedNoteKeysRef = { current: new Set<string>(['C4']) };
    const activePreviewKeyRef = { current: 'C4' };
    const stopPreview = vi.fn();

    const { result, mocks } = setupHook({
      pressedNoteKeysRef,
      activePreviewKeyRef,
      stopPreview,
    });

    act(() => {
      result.current.handleKeyUp(createEvent('z', { key: 'z' }));
    });

    expect(mocks.stopPreview).toHaveBeenCalledTimes(1);
    expect(pressedNoteKeysRef.current.has('C4')).toBe(false);
  });

  it('marks preview as released when sustain is active', () => {
    const pressedNoteKeysRef = { current: new Set<string>(['C4']) };
    const activePreviewKeyRef = { current: 'C4' };
    const previewSustainIndexRef = { current: 0 };
    const previewReleasedRef = { current: false };
    const stopPreview = vi.fn();

    const { result, mocks } = setupHook({
      pressedNoteKeysRef,
      activePreviewKeyRef,
      previewSustainIndexRef,
      previewReleasedRef,
      stopPreview,
    });

    act(() => {
      result.current.handleKeyUp(createEvent('z', { key: 'z' }));
    });

    expect(previewReleasedRef.current).toBe(true);
    expect(mocks.stopPreview).not.toHaveBeenCalled();
  });
});
