import { useCallback, useEffect, useRef } from 'react';

export const useScrollSync = (sharedCurrentLine: number) => {
  const pendingScrollLineRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const handlePositionScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    // Sync all tracks scroll when position block is scrolled
    const tracks = document.querySelectorAll('.track-content');
    tracks.forEach(track => {
      (track as HTMLDivElement).scrollTop = scrollTop;
    });
  }, []);

  useEffect(() => {
    pendingScrollLineRef.current = sharedCurrentLine;

    if (scrollRafRef.current != null) {
      return;
    }

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const lineIndex = pendingScrollLineRef.current;
      if (lineIndex == null) {
        return;
      }

      const positionContent = document.querySelector('.position-content') as HTMLDivElement | null;
      const primaryTrack = (document.querySelector('.track-panel.track-a .track-content') ||
        document.querySelector('.track-content')) as HTMLDivElement | null;

      if (!positionContent || !primaryTrack) {
        return;
      }

      const lineElements = primaryTrack.children as HTMLCollectionOf<HTMLDivElement>;
      const totalLines = lineElements.length;
      if (!totalLines) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(lineIndex, totalLines - 1));
      const targetLine = lineElements[clampedIndex];
      if (!targetLine) {
        return;
      }

      const container = primaryTrack;
      const currentScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      const rowHeight = targetLine.offsetHeight || 14;
      const targetTop = lineIndex * rowHeight;
      const targetBottom = targetTop + rowHeight;

      let newScrollTop = currentScrollTop;

      if (targetTop < currentScrollTop) {
        // Selected row is above the visible area
        newScrollTop = targetTop;
      } else if (targetBottom > currentScrollTop + containerHeight) {
        // Selected row is below the visible area
        newScrollTop = targetBottom - containerHeight;
      }

      const maxScrollTop = container.scrollHeight - containerHeight;
      newScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));

      if (newScrollTop === currentScrollTop) {
        return;
      }

      // Apply synchronized scroll only to the pattern area
      container.scrollTop = newScrollTop;
      positionContent.scrollTop = newScrollTop;

      const tracks = document.querySelectorAll('.track-content');
      tracks.forEach(track => {
        if (track !== container) {
          (track as HTMLDivElement).scrollTop = newScrollTop;
        }
      });
    });
  }, [sharedCurrentLine]);

  return { handlePositionScroll };
};
