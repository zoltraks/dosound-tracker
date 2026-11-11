import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { CommandPanel } from '../../src/components/CommandPanel.tsx';

const defaultProps = (): React.ComponentProps<typeof CommandPanel> => ({
  onNewSong: vi.fn(),
  onLoadSong: vi.fn(),
  onSaveSong: vi.fn(),
  onOptimize: vi.fn(),
  onRenumber: vi.fn(),
  onNewInstrument: vi.fn(),
  onSaveInstrument: vi.fn(),
  onLoadInstrument: vi.fn(),
  onDeleteInstrument: vi.fn(),
  onCloneInstrument: vi.fn(),
  onPlaySong: vi.fn(),
  onPlayLine: vi.fn(),
  onStop: vi.fn(),
  onOpenExport: vi.fn(),
  onAddLine: vi.fn(),
  onDeleteLine: vi.fn(),
  onCloneLine: vi.fn(),
  onDuplicateLine: vi.fn(),
  onInsertStep: vi.fn(),
  onDeleteStep: vi.fn(),
  onReset: vi.fn(),
  isDebugMode: false,
  onToggleDebug: vi.fn(),
  isPlaying: false,
  isLinePlaying: false,
  onPlayInstrument: vi.fn(),
  onCopyTrack: vi.fn(),
  onPasteTrack: vi.fn(),
  onNewTrack: vi.fn(),
  onDeleteTrack: vi.fn(),
  activeSection: 'commands',
  setActiveSection: vi.fn(),
  onTranspose: vi.fn(),
  midiInputEnabled: false,
  midiOutputEnabled: false,
  onShowMidi: vi.fn(),
  onPickInstrument: vi.fn(),
  onDemoSong: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: false,
  canRedo: false,
  isMobileCollapsed: false,
});

describe('CommandPanel', () => {
  afterEach(() => cleanup());

  it('renders UNDO and REDO immediately before ADD INST in the third row', () => {
    const { container } = render(<CommandPanel {...defaultProps()} />);

    const texts = Array.from(container.querySelectorAll('.command-button')).map(
      (button) => button.textContent,
    );
    const undoIndex = texts.indexOf('UNDO');

    expect(undoIndex).toBeGreaterThan(-1);
    expect(texts.slice(undoIndex, undoIndex + 3)).toEqual(['UNDO', 'REDO', 'ADD INST']);
  });

  it('disables UNDO and REDO while their stacks are empty', () => {
    const { getByRole } = render(<CommandPanel {...defaultProps()} />);

    expect((getByRole('button', { name: 'UNDO' }) as HTMLButtonElement).disabled).toBe(true);
    expect((getByRole('button', { name: 'REDO' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables UNDO and REDO from canUndo and canRedo', () => {
    const { getByRole } = render(<CommandPanel {...defaultProps()} canUndo canRedo />);

    expect((getByRole('button', { name: 'UNDO' }) as HTMLButtonElement).disabled).toBe(false);
    expect((getByRole('button', { name: 'REDO' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('fires the undo and redo callbacks on click', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { getByRole } = render(
      <CommandPanel {...defaultProps()} onUndo={onUndo} onRedo={onRedo} canUndo canRedo />,
    );

    fireEvent.click(getByRole('button', { name: 'UNDO' }));
    fireEvent.click(getByRole('button', { name: 'REDO' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ADD LINE', 'onAddLine'],
    ['DUPLICATE LINE', 'onDuplicateLine'],
    ['CLONE LINE', 'onCloneLine'],
    ['DELETE LINE', 'onDeleteLine'],
  ] as const)('keeps the active section when %s is clicked', (label, prop) => {
    const onOperation = vi.fn();
    const setActiveSection = vi.fn();
    const { getByRole } = render(
      <CommandPanel
        {...defaultProps()}
        {...{ [prop]: onOperation }}
        setActiveSection={setActiveSection}
      />,
    );

    const button = getByRole('button', { name: label });
    fireEvent.mouseDown(button);
    fireEvent.click(button);

    expect(onOperation).toHaveBeenCalledTimes(1);
    expect(setActiveSection).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(button);
  });
});
