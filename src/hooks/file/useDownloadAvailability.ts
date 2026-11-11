import { useState, useEffect } from 'react';
import { logger } from '../../utils/log/logger.ts';

/**
 * Hook to check if files are available in the download directory.
 * Returns true if LIST.txt exists and contains valid files after filtering.
 */
export function useDownloadAvailability(): boolean {
  const [hasFiles, setHasFiles] = useState<boolean>(false);

  useEffect(() => {
    const checkDownloadAvailability = async () => {
      try {
        const url = `download/LIST.txt?ts=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
          setHasFiles(false);
          return;
        }

        const contentType = response.headers.get('content-type') || '';
        // If it returns HTML (404 page), treat as missing
        if (contentType.includes('text/html')) {
          setHasFiles(false);
          return;
        }

        const text = await response.text();
        const lines = text.split(/\r?\n/u);
        const trimmed = lines.map((line) => line.trim());
        const nonEmpty = trimmed.filter((line) => line.length > 0);

        const validFiles = nonEmpty.filter((line) => {
          const base = (line.split(/[\\/]/u).pop() || '').toLowerCase();
          return base !== '.gitkeep' && base !== 'list.txt';
        });

        // Check if the first line looks like HTML content (another 404 indicator)
        if (validFiles.length > 0) {
          const first = validFiles[0].toLowerCase();
          if (first.startsWith('<!doctype') || first.startsWith('<html')) {
            setHasFiles(false);
            return;
          }
        }

        setHasFiles(validFiles.length > 0);
      } catch (error) {
        logger.error('Failed to check download availability', error);
        setHasFiles(false);
      }
    };

    checkDownloadAvailability();
  }, []);

  return hasFiles;
}
