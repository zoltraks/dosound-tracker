import type { ReactNode } from 'react';

interface VirtualPlaylistProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

export const VirtualPlaylist = <T,>({ items, renderItem }: VirtualPlaylistProps<T>) => {
  return (
    <div className="virtual-playlist">
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
};
