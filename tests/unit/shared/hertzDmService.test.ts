import { describe, expect, it } from 'vitest';
import { HertzValidationError } from '../../../shared/services/hertzPostService';
import { validateDmAttachments } from '../../../shared/services/hertzDmService';

describe('HertzDmService attachment validation', () => {
  it('accepts up to four JPG PNG or WEBP images', () => {
    const files = validateDmAttachments([
      { fileUrl: '/a.jpg', mimeType: 'image/jpeg', fileSize: 1024 },
      { fileUrl: '/b.png', mimeType: 'image/png', fileSize: 1024 },
      { fileUrl: '/c.webp', mimeType: 'image/webp', fileSize: 1024 },
      { fileUrl: '/d.jpg', mimeType: 'image/jpeg', fileSize: 1024 },
    ]);

    expect(files).toHaveLength(4);
  });

  it('rejects more than four images', () => {
    expect(() => validateDmAttachments(Array.from({ length: 5 }, (_, index) => ({
      fileUrl: `/image-${index}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: 1024,
    })))).toThrow(HertzValidationError);
  });
});
