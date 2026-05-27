import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { execute, queryOne } from '../db';
import { validateHertzMemberMediaUploadType, validateMediaType } from '../utils/mediaValidation';

export class MobileMediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobileMediaValidationError';
  }
}

export class MobileMediaService {
  async upload(params: {
    file: File | null;
    purpose: string | null;
    actorId: string;
  }) {
    const file = params.file;
    if (!file) throw new MobileMediaValidationError('File tidak ditemukan');
    const purpose = params.purpose || 'post';
    validateMediaPurpose(purpose);
    validateMediaType(file.type);
    validateHertzMemberMediaUploadType(file.type);
    enforceSize(file.size, purpose);

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const ext = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'image' ? 'jpg' : 'mp4');
    const fileKey = `${mediaType}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || '',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || '',
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
    }));

    const publicUrlBase = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
    const fileUrl = `${publicUrlBase}/${fileKey}`;
    const media = await queryOne<{
      id: string;
      article_id: string | null;
      file_url: string;
      media_type: 'image' | 'video';
      file_key: string | null;
      file_size: number | null;
      created_at: Date;
    }>(
      `INSERT INTO media (article_id, file_url, media_type, file_key, file_size)
       VALUES (NULL, $1, $2, $3, $4)
       RETURNING *`,
      [fileUrl, mediaType, fileKey, buffer.length],
    );

    await execute(
      `INSERT INTO activity_logs (actor_id, actor_type, action, target_type, target_id, details)
       VALUES ($1, 'member', 'media_uploaded', 'media', $2, $3)`,
      [params.actorId, media?.id, JSON.stringify({ file_key: fileKey, media_type: mediaType, file_size: buffer.length, purpose })],
    );

    return media ? {
      id: media.id,
      fileUrl: media.file_url,
      thumbnailUrl: media.file_url,
      mediaType: media.media_type,
      fileKey: media.file_key,
      sizeBytes: media.file_size,
      createdAt: media.created_at.toISOString(),
    } : null;
  }
}

function validateMediaPurpose(purpose: string) {
  if (!['post', 'dm', 'profile_avatar', 'profile_cover'].includes(purpose)) {
    throw new MobileMediaValidationError('Purpose upload tidak valid');
  }
}

function enforceSize(size: number, purpose: string) {
  const mb = purpose === 'post' ? 25 : 5;
  if (size > mb * 1024 * 1024) {
    throw new MobileMediaValidationError(`Ukuran file maksimal ${mb}MB`);
  }
}

