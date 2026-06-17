import { extname } from 'node:path';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  { extensions: ['.png'], mimeType: 'image/png' as const },
  { extensions: ['.jpg', '.jpeg'], mimeType: 'image/jpeg' as const },
  { extensions: ['.gif'], mimeType: 'image/gif' as const },
  { extensions: ['.webp'], mimeType: 'image/webp' as const },
  { extensions: ['.pdf'], mimeType: 'application/pdf' as const },
  { extensions: ['.txt'], mimeType: 'text/plain' as const },
  { extensions: ['.csv'], mimeType: 'text/csv' as const },
  { extensions: ['.json'], mimeType: 'application/json' as const },
] as const;

const ALLOWED_UPLOAD_EXTENSIONS: ReadonlySet<string> = new Set(
  ALLOWED_FILE_TYPES.flatMap((fileType) => fileType.extensions),
);

const isLikelyTextContent = (buffer: Buffer): boolean => {
  if (buffer.length === 0) {
    return true;
  }

  const probe = buffer.subarray(0, Math.min(buffer.length, 512));

  for (const byte of probe) {
    const isControlCharacter =
      byte < 32 && byte !== 9 && byte !== 10 && byte !== 13;

    if (isControlCharacter) {
      return false;
    }
  }

  return true;
};

export const getUploadExtension = (originalName: string): string =>
  extname(originalName).toLowerCase();

export const isAllowedUploadExtension = (extension: string): boolean =>
  ALLOWED_UPLOAD_EXTENSIONS.has(extension.toLowerCase());

export const resolveUploadedFileMimeType = (
  buffer: Buffer,
  originalName: string,
): string | null => {
  const extension = getUploadExtension(originalName);

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return extension === '.png' ? 'image/png' : null;
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : null;
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  ) {
    return extension === '.gif' ? 'image/gif' : null;
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return extension === '.webp' ? 'image/webp' : null;
  }

  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  ) {
    return extension === '.pdf' ? 'application/pdf' : null;
  }

  if (!isLikelyTextContent(buffer)) {
    return null;
  }

  if (extension === '.json') {
    return 'application/json';
  }

  if (extension === '.csv') {
    return 'text/csv';
  }

  if (extension === '.txt') {
    return 'text/plain';
  }

  return null;
};
