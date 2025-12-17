import React, { useEffect, useMemo, useState } from 'react';
import {
  LIST_FILE_NAME,
  buildHref,
  getFileLabel,
  getSortedUniqueFiles,
  normalizeDirectory,
  parseListFileText,
  stripExtension,
} from '../utils/filePickerUtils';

export type FilePickerMode = 'download' | 'pick';

interface FilePickerModalProps {
  isOpen: boolean;
  title: string;
  /**
   * URL path prefix for the directory that contains LIST.txt and the files.
   * Examples: "download", "assets/exports".
   */
  directory: string;
  /**
   * Optional external list of files. When provided and non-empty, this list is
   * used instead of fetching LIST.txt. When omitted or empty, the component
   * fetches `directory/LIST.txt` on open.
   */
  files?: string[] | null;
  mode: FilePickerMode;
  /**
   * When true, the initial sort order is descending (reverse alphabetical).
   */
  defaultSortDescending?: boolean;
  onClose: () => void;
  /**
   * Called in "pick" mode when the user chooses a file. Receives the fully
   * resolved URL (directory + encoded file path).
   */
  onPick?: (fileUrl: string) => void;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
  isOpen,
  title,
  directory,
  files,
  mode,
  defaultSortDescending,
  onClose,
  onPick,
}) => {
  const [internalFiles, setInternalFiles] = useState<string[]>([]);
  const [sortDescending, setSortDescending] = useState<boolean>(
    !!defaultSortDescending,
  );

  useEffect(() => {
    if (!isOpen) return;
    setSortDescending(!!defaultSortDescending);
  }, [isOpen, defaultSortDescending]);

  useEffect(() => {
    if (!isOpen) return;

    if (files && files.length > 0) {
      setInternalFiles(files);
      return;
    }

    let cancelled = false;

    const loadFromListFile = async () => {
      try {
        const normalizedDir = normalizeDirectory(directory);
        const listPath = normalizedDir
          ? `${normalizedDir}/${LIST_FILE_NAME}`
          : LIST_FILE_NAME;
        const listUrl = `${listPath}?ts=${Date.now()}`;
        const response = await fetch(listUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load file list.');
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          throw new Error('LIST.txt appears to be HTML, treating as missing.');
        }

        const text = await response.text();
        const uniqueFiles = parseListFileText(text);

        if (cancelled) {
          return;
        }

        if (uniqueFiles.length === 0) {
          setInternalFiles([]);
          return;
        }

        const first = uniqueFiles[0].toLowerCase();
        if (first.startsWith('<!doctype') || first.startsWith('<html')) {
          setInternalFiles([]);
          return;
        }

        setInternalFiles(uniqueFiles);
      } catch (error) {
        if (cancelled) {
          return;
        }

        // Keep behavior similar to the existing download handling: on error,
        // simply expose an empty list.
        console.error('Failed to load file list:', error);
        setInternalFiles([]);
      }
    };

    void loadFromListFile();

    return () => {
      cancelled = true;
    };
  }, [isOpen, directory, files]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!files) {
      return;
    }
    if (files.length === 0) {
      return;
    }
    setInternalFiles(files);
  }, [files, isOpen]);

  const sortedFiles = useMemo(() => {
    return getSortedUniqueFiles(internalFiles, sortDescending);
  }, [internalFiles, sortDescending]);

  if (!isOpen) {
    return null;
  }

  const hasFiles = sortedFiles.length > 0;

  const handlePick = (file: string) => {
    if (mode !== 'pick') {
      return;
    }

    const href = buildHref(directory, file);
    if (onPick) {
      onPick(href);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog download-modal">
        <div className="modal-title">{title}</div>
        <div className="modal-body download-modal-body">
          <div className="file-picker-table-container">
            {hasFiles ? (
              <table className="file-picker-table">
                <tbody>
                  {sortedFiles.map(file => {
                    const baseLabel = getFileLabel(file);
                    const displayLabel =
                      mode === 'pick' ? stripExtension(baseLabel) : baseLabel;

                    return (
                      <tr key={file} className="file-picker-row">
                        <td className="file-picker-cell">
                          {mode === 'download' ? (
                            <a
                              href={buildHref(directory, file)}
                              className="download-link"
                            >
                              {displayLabel}
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="file-picker-entry-button"
                              onClick={() => handlePick(file)}
                            >
                              {displayLabel}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="file-picker-empty">No files available.</div>
            )}
          </div>
        </div>
        <div className="modal-actions file-picker-actions">
          <div className="file-picker-actions-left">
            <button
              className="command-btn"
              type="button"
              onClick={() => setSortDescending(prev => !prev)}
              disabled={!hasFiles}
            >
              SORT
            </button>
          </div>
          <div className="file-picker-actions-right">
            <button
              className="command-btn"
              type="button"
              onClick={onClose}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
