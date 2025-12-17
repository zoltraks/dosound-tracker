export type DownloadFileContent = string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>;

export function downloadFile(
  content: DownloadFileContent,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
