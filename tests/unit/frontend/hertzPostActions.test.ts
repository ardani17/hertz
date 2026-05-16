import { describe, expect, it } from 'vitest';
import { getDeleteDialogCopy } from '../../../frontend/src/components/feed/HertzDeletePostDialog';

describe('HERTZ post delete actions', () => {
  it('uses an explicit confirmation copy before deleting a post', () => {
    expect(getDeleteDialogCopy('Halo market')).toEqual({
      title: 'Hapus postingan?',
      body: 'Postingan "Halo market" akan disembunyikan dari timeline. Aksi ini tidak langsung menghapus data permanen.',
      confirmLabel: 'Hapus postingan',
      cancelLabel: 'Batal',
    });
  });
});
