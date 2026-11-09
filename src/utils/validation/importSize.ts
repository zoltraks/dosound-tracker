import { MAX_IMPORT_BYTES } from '../../constants/import.ts';

export const assertImportSize = (text: string, subject: string): void => {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new Error(`${subject} exceeds the maximum import size.`);
  }
};
