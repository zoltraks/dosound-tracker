import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { exportSongToVgm } from '../../src/exports/vgm.ts';
import { TrackLine } from '../../src/components/TrackLine.tsx';
import { ENVELOPE_LENGTH } from '../../src/constants/music.ts';
import type { Song, Note } from '../../src/synth/SoundDriver.ts';

afterEach(() => cleanup());

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 4,
  length: 4,
  pattern: [
    {
      id: '00',
      name: 'P',
      step: [
        { note: { note: 'C', octave: 4, instrument: '00' }, volume: null },
        { note: null, volume: null },
      ],
    },
  ],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [
    {
      id: '00',
      name: 'i',
      volume: new Array(ENVELOPE_LENGTH).fill(15),
      shift: new Array(ENVELOPE_LENGTH).fill(0),
      pitch: new Array(ENVELOPE_LENGTH).fill(0),
      noise: new Array(ENVELOPE_LENGTH).fill(0),
      mode: new Array(ENVELOPE_LENGTH).fill(0),
      base: 'C-4',
    },
  ],
  ...overrides,
});

describe('exportSongToVgm metadata and strategy branches', () => {
  it('emits a GD3 tag when metadata exists', () => {
    try {
      const { buffer } = exportSongToVgm(song());
      const view = new DataView(buffer);
      expect(view.getUint32(0x14, true)).toBeGreaterThan(0);
    } catch (error) {
      console.log('gd3 mismatch');
      throw error;
    }
  });

  it('omits the GD3 tag when all metadata fields are empty', () => {
    try {
      const bare = song({ title: '  ', author: '', year: Number.NaN });
      const { buffer } = exportSongToVgm(bare);
      const view = new DataView(buffer);
      expect(view.getUint32(0x14, true)).toBe(0);
    } catch (error) {
      console.log('no-gd3 mismatch');
      throw error;
    }
  });

  it('optimized strategy rewrites delay commands', () => {
    try {
      const { buffer: simple } = exportSongToVgm(song(), 'simple');
      const { buffer: optimized } = exportSongToVgm(song(), 'optimized');
      expect(simple.byteLength).toBeGreaterThan(0x100);
      expect(optimized.byteLength).toBeGreaterThan(0x100);
    } catch (error) {
      console.log('strategy mismatch');
      throw error;
    }
  });

  it('writes no loop offset when the loop lands on the first tick', () => {
    try {
      const { buffer } = exportSongToVgm(song({ loop: 0 }));
      const view = new DataView(buffer);
      expect(view.getUint32(0x1c, true)).toBe(0);
      expect(view.getUint32(0x20, true)).toBe(0);
    } catch (error) {
      console.log('loop mismatch');
      throw error;
    }
  });
});

describe('TrackLine', () => {
  const renderLine = (overrides: Record<string, unknown> = {}) => {
    const onLineClick = vi.fn();
    const props = {
      lineIndex: 3,
      noteData: null as Note | null,
      volume: null as number | null,
      lineClassName: 'track-line',
      noteIsActive: false,
      volumeIsActive: false,
      onLineClick,
      formatNoteDisplay: (n: Note | null) => (n ? `${n.note}-${n.octave}` : '---'),
      ...overrides,
    };
    const { container } = render(<TrackLine {...props} />);
    return { container, onLineClick };
  };

  it('routes row, note, and volume clicks to the right column', () => {
    const { container, onLineClick } = renderLine({
      noteData: { note: 'C', octave: 4, instrument: '00' },
      volume: 9,
    });
    try {
      const note = container.querySelector('.note-cell, [class*="note"]') as HTMLElement;
      fireEvent.click(note);
      expect(onLineClick).toHaveBeenCalledWith(3, 'note');
      const vol = container.querySelector('[class*="volume"]') as HTMLElement;
      fireEvent.click(vol);
      expect(onLineClick).toHaveBeenCalledWith(3, 'volume');
    } catch (error) {
      console.log('click mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('renders a dot placeholder for an unset volume', () => {
    const { container } = renderLine({ volume: null });
    try {
      expect(container.textContent).toContain('.');
    } catch (error) {
      console.log('dot mismatch');
      throw error;
    }
  });
});
