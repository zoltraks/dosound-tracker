import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { FileInputs } from '../../../src/components/shell/FileInputs.tsx';

afterEach(() => cleanup());

const renderFileInputs = () => {
  const onLoadSong = vi.fn();
  const onLoadInstrument = vi.fn();
  const setPosition = vi.fn();
  const setSharedCurrentLine = vi.fn();
  const setActiveSection = vi.fn();
  const setChannelMutes = vi.fn();
  const utils = render(
    <FileInputs
      fileInputRef={{ current: null }}
      instrumentFileInputRef={{ current: null }}
      onLoadSong={onLoadSong}
      onLoadInstrument={onLoadInstrument}
      setPosition={setPosition}
      setSharedCurrentLine={setSharedCurrentLine}
      setActiveSection={setActiveSection}
      setChannelMutes={setChannelMutes}
    />,
  );
  return {
    ...utils,
    onLoadSong,
    onLoadInstrument,
    setPosition,
    setSharedCurrentLine,
    setActiveSection,
    setChannelMutes,
  };
};

describe('FileInputs', () => {
  it('hands the picked instrument File to onLoadInstrument without reading it', () => {
    const { container, onLoadInstrument } = renderFileInputs();
    const input = container.querySelector<HTMLInputElement>('#instrument-file-input');
    expect(input).not.toBeNull();
    const file = new File(['instrument: {}'], 'inst.yaml', { type: 'text/yaml' });

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    try {
      expect(onLoadInstrument).toHaveBeenCalledTimes(1);
      expect(onLoadInstrument.mock.calls[0]?.[0]).toBe(file);
    } catch (error) {
      console.log('instrument handoff mismatch', onLoadInstrument.mock.calls);
      throw error;
    }
  });

  it('hands the picked song File to onLoadSong and resets playback state', () => {
    const {
      container,
      onLoadSong,
      setPosition,
      setSharedCurrentLine,
      setActiveSection,
      setChannelMutes,
    } = renderFileInputs();
    const input = container.querySelector<HTMLInputElement>('#song-file-input');
    expect(input).not.toBeNull();
    const file = new File(['song: {}'], 'song.yaml', { type: 'text/yaml' });

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    try {
      expect(onLoadSong).toHaveBeenCalledTimes(1);
      expect(onLoadSong.mock.calls[0]?.[0]).toBe(file);
      expect(setPosition).toHaveBeenCalledWith(0, 0, 0);
      expect(setSharedCurrentLine).toHaveBeenCalledWith(0);
      expect(setActiveSection).toHaveBeenCalledWith('playlist');
      expect(setChannelMutes).toHaveBeenCalledWith([false, false, false, false, false, false]);
    } catch (error) {
      console.log('song handoff mismatch', onLoadSong.mock.calls);
      throw error;
    }
  });
});
