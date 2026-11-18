import { useEffect, useState } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
}

const readViewportSize = (): ViewportSize => ({
  width: typeof window === 'undefined' ? 0 : window.innerWidth,
  height: typeof window === 'undefined' ? 0 : window.innerHeight,
});

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(readViewportSize);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => setSize(readViewportSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
