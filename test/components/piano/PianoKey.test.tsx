import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { PianoKey } from '../../../src/components/piano/PianoKey.tsx';
import type { PianoKeyConfig } from '../../../src/utils/panel/pianoUtils.ts';

afterEach(() => cleanup());

const keyData = (overrides: Partial<PianoKeyConfig> = {}): PianoKeyConfig => ({
  note: 'C',
  octave: 4,
  isBlackKey: false,
  keyId: 'C4',
  position: 0,
  stableKey: 'C4',
  ...overrides,
});

const renderKey = (overrides: Partial<Parameters<typeof PianoKey>[0]> = {}) =>
  render(
    <PianoKey
      keyData={keyData()}
      className="piano-key"
      isBaseKey={false}
      onKeyDown={vi.fn()}
      onKeyUp={vi.fn()}
      onContextMenu={vi.fn()}
      {...overrides}
    />,
  );

describe('PianoKey', () => {
  it('anchors black keys absolutely and leaves white keys in flow', () => {
    const { container: black } = renderKey({
      keyData: keyData({ note: 'C#', isBlackKey: true, position: 1 }),
    });
    const { container: white } = renderKey();
    try {
      const blackKey = black.querySelector('.piano-key') as HTMLElement;
      const whiteKey = white.querySelector('.piano-key') as HTMLElement;
      expect(blackKey.style.position).toBe('absolute');
      expect(blackKey.style.left).not.toBe('auto');
      expect(whiteKey.style.position).toBe('relative');
      expect(whiteKey.style.left).toBe('auto');
    } catch (error) {
      console.log('key-positioning mismatch');
      throw error;
    }
  });

  it('fires down and up only for the primary mouse button', () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const { container } = renderKey({ onKeyDown, onKeyUp });
    const key = container.querySelector('.piano-key') as HTMLElement;
    try {
      fireEvent.mouseDown(key, { button: 2 });
      fireEvent.mouseUp(key, { button: 2 });
      expect(onKeyDown).not.toHaveBeenCalled();
      expect(onKeyUp).not.toHaveBeenCalled();
      fireEvent.mouseDown(key, { button: 0 });
      fireEvent.mouseUp(key, { button: 0 });
      expect(onKeyDown).toHaveBeenCalledWith('C', 4);
      expect(onKeyUp).toHaveBeenCalledWith('C', 4);
    } catch (error) {
      console.log('mouse-button mismatch');
      throw error;
    }
  });

  it('releases the key on mouse leave and all touch phases', () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const { container } = renderKey({ onKeyDown, onKeyUp });
    const key = container.querySelector('.piano-key') as HTMLElement;
    try {
      fireEvent.mouseDown(key, { button: 0 });
      fireEvent.mouseLeave(key);
      fireEvent.touchStart(key);
      fireEvent.touchEnd(key);
      fireEvent.touchStart(key);
      fireEvent.touchCancel(key);
      expect(onKeyDown).toHaveBeenCalledTimes(3);
      expect(onKeyUp).toHaveBeenCalledTimes(3);
    } catch (error) {
      console.log('release-phase mismatch');
      throw error;
    }
  });

  it('prevents the default menu and forwards the context event', () => {
    const onContextMenu = vi.fn();
    const { container } = renderKey({ onContextMenu });
    const key = container.querySelector('.piano-key') as HTMLElement;
    try {
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      key.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(onContextMenu).toHaveBeenCalledWith('C', 4);
    } catch (error) {
      console.log('context-menu mismatch');
      throw error;
    }
  });
});
