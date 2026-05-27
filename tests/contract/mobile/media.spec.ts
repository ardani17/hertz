import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile media contract', () => {
  afterEach(unmockCommon);

  it('uploads media with purpose', async () => {
    mockMemberSessionService();
    vi.doMock('@/server/services/media/MobileMediaService', () => ({
      MobileMediaService: vi.fn().mockImplementation(() => ({
        upload: vi.fn(async () => ({ id: 'media-1', fileUrl: 'https://cdn.test/image.jpg', thumbnailUrl: 'https://cdn.test/image.jpg', mediaType: 'image' })),
      })),
      MobileMediaValidationError: class MobileMediaValidationError extends Error {},
    }));
    const form = new FormData();
    form.set('file', new File(['x'], 'image.jpg', { type: 'image/jpeg' }));
    form.set('purpose', 'post');
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/media/upload/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/media/upload', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: form,
    })), 201);
    expect(body.data.media.id).toBe('media-1');
  });

  it('creates presigned upload url envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@/server/services/media/MobileMediaService', () => ({
      MobileMediaService: vi.fn().mockImplementation(() => ({
        createPresignedUpload: vi.fn(async () => ({
          uploadUrl: 'https://r2.test/upload',
          fileKey: 'image/abc.jpg',
          expiresAt: '2026-05-27T01:00:00.000Z',
          publicUrl: 'https://cdn.test/image/abc.jpg',
        })),
      })),
      MobileMediaValidationError: class MobileMediaValidationError extends Error {},
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/media/upload-url/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/media/upload-url', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ purpose: 'post', contentType: 'image/jpeg', sizeBytes: 1024 }),
    })), 201);
    expect(body.data.upload.fileKey).toBe('image/abc.jpg');
  });
});

