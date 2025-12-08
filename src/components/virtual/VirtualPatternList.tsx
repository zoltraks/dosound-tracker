import type { ReactNode } from 'react';

interface VirtualPatternListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

export const VirtualPatternList = <T,>({ items, renderItem }: VirtualPatternListProps<T>) => {
  return (
    <div className="virtual-pattern-list">
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
};
