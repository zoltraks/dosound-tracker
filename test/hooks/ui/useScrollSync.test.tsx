import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { UIEvent } from 'react';
import { useScrollSync } from '../../../src/hooks/ui/useScrollSync.ts';

type RafCallback = (time: number) => void;

let rafCallback: RafCallback | null = null;

const flushRaf = () => {
  act(() => {
    const cb = rafCallback;
    rafCallback = null;
    cb?.(0);
  });
};

interface DomFixture {
  primary: HTMLElement;
  position: HTMLElement;
  other: HTMLElement;
}

const buildDom = ({
  lines = 20,
  clientHeight = 100,
  scrollHeight = 500,
  rowHeight = 14,
}: {
  lines?: number;
  clientHeight?: number;
  scrollHeight?: number;
  rowHeight?: number;
} = {}): DomFixture => {
  document.body.innerHTML = `
    <div class="position-content"></div>
    <div class="track-panel track-a"><div class="track-content" id="primary"></div></div>
    <div class="track-content" id="other"></div>`;
  const primary = document.getElementById('primary') as HTMLElement;
  const position = document.querySelector('.position-content') as HTMLElement;
  const other = document.getElementById('other') as HTMLElement;
  for (let i = 0; i < lines; i += 1) {
    primary.appendChild(document.createElement('div'));
  }
  [primary, position, other].forEach((el) => {
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true });
  });
  Object.defineProperty(primary, 'clientHeight', { value: clientHeight, configurable: true });
  Object.defineProperty(primary, 'scrollHeight', { value: scrollHeight, configurable: true });
  primary.querySelectorAll('div').forEach((row) => {
    Object.defineProperty(row, 'offsetHeight', { value: rowHeight, configurable: true });
  });
  return { primary, position, other };
};

describe('useScrollSync', () => {
  beforeEach(() => {
    rafCallback = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: RafCallback) => {
        rafCallback = cb;
        return 1;
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('mirrors the position scroll onto every track content', () => {
    buildDom();
    const { result } = renderHook(() => useScrollSync(0));

    const event = { currentTarget: { scrollTop: 42 } } as unknown as UIEvent<HTMLDivElement>;
    act(() => {
      result.current.handlePositionScroll(event);
    });

    document.querySelectorAll('.track-content').forEach((track) => {
      expect((track as HTMLElement).scrollTop).toBe(42);
    });
  });

  it('scrolls the primary track down to reveal a line below the viewport', () => {
    const { primary, position, other } = buildDom();
    renderHook(() => useScrollSync(10));

    flushRaf();

    // Line 10 at 14px rows: target 140-154, viewport 0-100 -> scrollTop 54.
    expect(primary.scrollTop).toBe(54);
    expect(position.scrollTop).toBe(54);
    expect(other.scrollTop).toBe(54);
  });

  it('scrolls the primary track up to reveal a line above the viewport', () => {
    const { primary } = buildDom();
    primary.scrollTop = 200;
    renderHook(() => useScrollSync(5));

    flushRaf();

    // Line 5 target top is 70, above the 200px scroll offset.
    expect(primary.scrollTop).toBe(70);
  });

  it('leaves the scroll alone when the line is already visible', () => {
    const { primary } = buildDom();
    renderHook(() => useScrollSync(3));

    flushRaf();

    expect(primary.scrollTop).toBe(0);
  });

  it('scrolls to the bottom for an out-of-range line index', () => {
    const { primary } = buildDom({ lines: 5 });
    renderHook(() => useScrollSync(999));

    flushRaf();

    // The target row is clamped for measurement, but the raw index drives the
    // target offset, which clamps to the maximum scroll position.
    expect(primary.scrollTop).toBe(400);
  });

  it('uses the latest pending line when several updates arrive before the frame', () => {
    const { primary } = buildDom();
    const { rerender } = renderHook(({ line }) => useScrollSync(line), {
      initialProps: { line: 2 },
    });
    rerender({ line: 10 });

    flushRaf();

    expect(primary.scrollTop).toBe(54);
  });

  it('does nothing when the track DOM is absent', () => {
    document.body.innerHTML = '';
    expect(() => {
      renderHook(() => useScrollSync(4));
      flushRaf();
    }).not.toThrow();
  });
});
