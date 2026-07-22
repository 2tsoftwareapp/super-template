import { describe, expect, it } from 'vitest';

import {
  getUploadExtension,
  isAllowedUploadExtension,
  MAX_FILE_SIZE_BYTES,
  resolveUploadedFileMimeType,
} from '../upload-policy';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PDF_MAGIC = Buffer.from('%PDF-1.7');

describe('upload-policy', () => {
  it('caps uploads at 10 MiB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  describe('getUploadExtension / isAllowedUploadExtension', () => {
    it('extracts and lowercases the extension', () => {
      expect(getUploadExtension('Report.FINAL.PDF')).toBe('.pdf');
    });

    it('allows the documented set and rejects the rest', () => {
      for (const ok of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.txt', '.csv', '.json']) {
        expect(isAllowedUploadExtension(ok)).toBe(true);
      }
      expect(isAllowedUploadExtension('.exe')).toBe(false);
      expect(isAllowedUploadExtension('.svg')).toBe(false);
      expect(isAllowedUploadExtension('')).toBe(false);
    });
  });

  describe('resolveUploadedFileMimeType', () => {
    it('accepts a PNG when magic bytes and extension agree', () => {
      expect(resolveUploadedFileMimeType(PNG_MAGIC, 'image.png')).toBe(
        'image/png',
      );
    });

    it('rejects a PNG payload disguised with a different extension', () => {
      expect(resolveUploadedFileMimeType(PNG_MAGIC, 'image.jpg')).toBeNull();
    });

    it('accepts a JPEG when magic bytes and extension agree', () => {
      expect(resolveUploadedFileMimeType(JPEG_MAGIC, 'photo.jpeg')).toBe(
        'image/jpeg',
      );
    });

    it('accepts a PDF by magic prefix', () => {
      expect(resolveUploadedFileMimeType(PDF_MAGIC, 'doc.pdf')).toBe(
        'application/pdf',
      );
    });

    it('rejects binary payloads posing as text', () => {
      const binary = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(resolveUploadedFileMimeType(binary, 'notes.txt')).toBeNull();
    });

    it('accepts plain text with a text extension', () => {
      const text = Buffer.from('hello world\nplain text');
      expect(resolveUploadedFileMimeType(text, 'notes.txt')).toBe('text/plain');
      expect(resolveUploadedFileMimeType(text, 'data.csv')).toBe('text/csv');
      expect(resolveUploadedFileMimeType(text, 'data.json')).toBe(
        'application/json',
      );
    });
  });
});
