export interface IFileService {
  readTextFile(file: File): Promise<string>;
  saveBlob(blob: Blob, filename: string): Promise<void>;
}
