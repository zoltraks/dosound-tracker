import React from 'react';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { InstrumentPanel } from '../../src/components/InstrumentSection.tsx';
import { ENVELOPE_LENGTH } from '../../src/constants/music.ts';
import type { Instrument } from '../../src/synth/SoundDriver.ts';

const makeInstrument = (id: string, name = `Instrument ${id}`): Instrument => ({
  id,
  name,
  volume: Array(ENVELOPE_LENGTH)
    .fill(0)
    .map((_, i) => (i === 0 ? 15 : 0)),
  shift: Array(ENVELOPE_LENGTH).fill(0),
  pitch: Array(ENVELOPE_LENGTH).fill(0),
  noise: Array(ENVELOPE_LENGTH).fill(0),
  mode: Array(ENVELOPE_LENGTH).fill(0),
});

const defaultProps = (): React.ComponentProps<typeof InstrumentPanel> => {
  const instruments = [makeInstrument('00'), makeInstrument('01')];
  return {
    instruments,
    currentInstrument: instruments[0],
    activeSection: 'instrumentList',
    setActiveSection: vi.fn(),
    onSelectInstrument: vi.fn(),
    onRenameInstrument: vi.fn(),
    onMoveInstrument: vi.fn(),
    onOpenInstrumentMidi: vi.fn(),
    onOpenInstrumentColor: vi.fn(),
    focusRevision: 0,
  };
};

describe('InstrumentPanel', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => {};
  });

  afterEach(() => cleanup());

  it('keeps the track section active when an instrument item is clicked', () => {
    const props = defaultProps();
    props.activeSection = 'trackB';
    const { container } = render(<InstrumentPanel {...props} />);

    const item = container.querySelectorAll('.instrument-item')[1] as HTMLElement;
    fireEvent.click(item);

    expect(props.onSelectInstrument).toHaveBeenCalledTimes(1);
    expect(props.setActiveSection).not.toHaveBeenCalled();
  });

  it('activates the instrument list on item click when no track is active', () => {
    const props = defaultProps();
    props.activeSection = 'playlist';
    const { container } = render(<InstrumentPanel {...props} />);

    const item = container.querySelectorAll('.instrument-item')[0] as HTMLElement;
    fireEvent.click(item);

    expect(props.onSelectInstrument).toHaveBeenCalledTimes(1);
    expect(props.setActiveSection).toHaveBeenCalledWith('instrumentList');
  });

  it('prevents the item mousedown from taking DOM focus', () => {
    const props = defaultProps();
    props.activeSection = 'trackA';
    const { container } = render(<InstrumentPanel {...props} />);

    const item = container.querySelectorAll('.instrument-item')[0] as HTMLElement;
    expect(fireEvent.mouseDown(item)).toBe(false);
  });

  it('leaves mousedown on the name input and action buttons alone', () => {
    const props = defaultProps();
    props.activeSection = 'trackA';
    const { container } = render(<InstrumentPanel {...props} />);

    const input = container.querySelector('.instrument-name-input') as HTMLElement;
    const button = container.querySelector('.instrument-midi-button') as HTMLElement;
    expect(fireEvent.mouseDown(input)).toBe(true);
    expect(fireEvent.mouseDown(button)).toBe(true);
  });

  it('selects the clicked row even when entries share an id', () => {
    const empty = { ...makeInstrument('02'), name: '' };
    const instruments = [
      makeInstrument('00', 'A'),
      makeInstrument('01', 'B'),
      { ...empty },
      { ...empty },
      makeInstrument('04', 'C'),
    ];

    const Harness = () => {
      const [current, setCurrent] = React.useState<Instrument>(instruments[0]);
      const props = {
        ...defaultProps(),
        instruments,
        currentInstrument: current,
        onSelectInstrument: setCurrent,
      };
      return <InstrumentPanel {...props} />;
    };

    const { container } = render(<Harness />);
    const items = container.querySelectorAll('.instrument-item');

    fireEvent.click(items[3] as HTMLElement);
    expect(
      Array.from(container.querySelectorAll('.instrument-item')).findIndex((el) =>
        el.classList.contains('current'),
      ),
    ).toBe(3);

    fireEvent.click(items[2] as HTMLElement);
    expect(
      Array.from(container.querySelectorAll('.instrument-item')).findIndex((el) =>
        el.classList.contains('current'),
      ),
    ).toBe(2);
  });
});
