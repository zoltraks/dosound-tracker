import type { ReactNode } from 'react';

interface VirtualInstrumentListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

export const VirtualInstrumentList = <T,>({ items, renderItem }: VirtualInstrumentListProps<T>) => {
  return (
    <div className="virtual-instrument-list">
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
};
