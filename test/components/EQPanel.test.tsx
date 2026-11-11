import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { EQPanel } from '../../src/components/EQPanel.tsx';
import type { SoundEngine } from '../../src/synth/soundEngine.ts';
import type { YMState } from '../../src/synth/YM2149.ts';

const makeEngine = (channels: YMState['channels']): SoundEngine =>
  ({
    getState: () => ({ channels, noisePeriod: 0, envelopeShape: 0, envelopeEnabled: false }),
  }) as unknown as SoundEngine;

const channel = (volume: number, toneEnabled = true, noiseEnabled = false) => ({
  tonePeriod: 0,
  toneEnabled,
  noiseEnabled,
  volume,
  envelopeEnabled: false,
});

const fillHeights = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.volume-fill')).map((el) => el.style.height);

const advancePoll = () => act(() => vi.advanceTimersByTime(60));

describe('EQPanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the channel volume while the channel can emit', () => {
    vi.useFakeTimers();
    const engine = makeEngine([channel(12), channel(0), channel(7)]);
    const { container } = render(
      <EQPanel
        ym2149={engine}
        channelMutes={[false, false, false]}
        onToggleChannelMute={() => {}}
      />,
    );
    advancePoll();
    expect(fillHeights(container)).toEqual(['80%', '0%', `${(7 / 15) * 100}%`]);
  });

  it('shows silence when the mixer gates a channel that still holds volume', () => {
    vi.useFakeTimers();
    const engine = makeEngine([channel(12, false, false), channel(10, false, true), channel(7)]);
    const { container } = render(
      <EQPanel
        ym2149={engine}
        channelMutes={[false, false, false]}
        onToggleChannelMute={() => {}}
      />,
    );
    advancePoll();
    expect(fillHeights(container)).toEqual(['0%', `${(10 / 15) * 100}%`, `${(7 / 15) * 100}%`]);
  });

  it('empties and greys the bar of a muted channel', () => {
    vi.useFakeTimers();
    const engine = makeEngine([channel(12), channel(0), channel(0)]);
    const { container } = render(
      <EQPanel
        ym2149={engine}
        channelMutes={[true, false, false]}
        onToggleChannelMute={() => {}}
      />,
    );
    advancePoll();
    expect(fillHeights(container)).toEqual(['0%', '0%', '0%']);
    expect(container.querySelectorAll('.volume-bar')[0].className).toContain('muted');
  });

  it('toggles the channel mute on click', () => {
    vi.useFakeTimers();
    const onToggleChannelMute = vi.fn();
    const { container } = render(
      <EQPanel
        ym2149={null}
        channelMutes={[false, false, false]}
        onToggleChannelMute={onToggleChannelMute}
      />,
    );
    fireEvent.click(container.querySelectorAll('.volume-bar')[1]);
    expect(onToggleChannelMute).toHaveBeenCalledWith(1);
  });

  it('shows the channel pans and reports pan clicks', () => {
    vi.useFakeTimers();
    const onChannelPanChange = vi.fn();
    const { container } = render(
      <EQPanel
        ym2149={null}
        channelMutes={[false, false, false]}
        onToggleChannelMute={() => {}}
        channelPans={[0, 0.5, 1]}
        onChannelPanChange={onChannelPanChange}
      />,
    );
    const panButtons = Array.from(container.querySelectorAll('.channel-pan-button')).map(
      (el) => el.textContent,
    );
    expect(panButtons).toEqual(['L100', 'C', 'R100']);
    fireEvent.click(container.querySelectorAll('.channel-pan-button')[2]);
    expect(onChannelPanChange).toHaveBeenCalledWith(2);
  });
});
