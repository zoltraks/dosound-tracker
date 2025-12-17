import { describe, expect, it } from 'vitest';
import { NAVIGATION_ORDER } from '../../src/constants/navigation';
import {
  getNextNavigationSection,
  getPreviousNavigationSection,
} from '../../src/utils/keyboardNavigationUtils';

describe('keyboardNavigationUtils', () => {
  it('next from track section goes to mode', () => {
    expect(getNextNavigationSection('trackA', 'trackA', NAVIGATION_ORDER)).toBe('mode');
    expect(getNextNavigationSection('trackB', 'trackA', NAVIGATION_ORDER)).toBe('mode');
    expect(getNextNavigationSection('trackC', 'trackA', NAVIGATION_ORDER)).toBe('mode');
  });

  it('previous from track section goes to commands', () => {
    expect(getPreviousNavigationSection('trackA', 'trackA', NAVIGATION_ORDER)).toBe('commands');
    expect(getPreviousNavigationSection('trackB', 'trackA', NAVIGATION_ORDER)).toBe('commands');
    expect(getPreviousNavigationSection('trackC', 'trackA', NAVIGATION_ORDER)).toBe('commands');
  });

  it('next from commands returns last track section', () => {
    expect(getNextNavigationSection('commands', 'trackA', NAVIGATION_ORDER)).toBe('trackA');
    expect(getNextNavigationSection('commands', 'trackB', NAVIGATION_ORDER)).toBe('trackB');
    expect(getNextNavigationSection('commands', 'trackC', NAVIGATION_ORDER)).toBe('trackC');
  });

  it('previous from mode returns last track section', () => {
    expect(getPreviousNavigationSection('mode', 'trackA', NAVIGATION_ORDER)).toBe('trackA');
    expect(getPreviousNavigationSection('mode', 'trackB', NAVIGATION_ORDER)).toBe('trackB');
    expect(getPreviousNavigationSection('mode', 'trackC', NAVIGATION_ORDER)).toBe('trackC');
  });

  it('falls back to navigation order for regular sections', () => {
    const idx = NAVIGATION_ORDER.indexOf('octave');
    const nextExpected = NAVIGATION_ORDER[(idx + 1) % NAVIGATION_ORDER.length];
    const prevExpected = NAVIGATION_ORDER[idx === 0 ? NAVIGATION_ORDER.length - 1 : idx - 1];

    expect(getNextNavigationSection('octave', 'trackA', NAVIGATION_ORDER)).toBe(nextExpected);
    expect(getPreviousNavigationSection('octave', 'trackA', NAVIGATION_ORDER)).toBe(prevExpected);
  });
});
