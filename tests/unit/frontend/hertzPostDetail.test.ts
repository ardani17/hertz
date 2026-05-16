import { describe, expect, it } from 'vitest';
import { getHertzCommentComposerState } from '../../../frontend/src/components/feed/HertzDetailInteractions';
import {
  getHertzPostDetailMobileMarketPosition,
  shouldOpenDesktopPostModal,
} from '../../../frontend/src/components/feed/HertzPostDetailModal';

describe('HERTZ post detail behavior', () => {
  it('opens the detail modal only on desktop width', () => {
    expect(shouldOpenDesktopPostModal(1280)).toBe(true);
    expect(shouldOpenDesktopPostModal(1025)).toBe(true);
    expect(shouldOpenDesktopPostModal(1024)).toBe(false);
    expect(shouldOpenDesktopPostModal(390)).toBe(false);
  });

  it('keeps mobile detail route focused on the post before market widgets', () => {
    expect(getHertzPostDetailMobileMarketPosition()).toBe('after');
  });

  it('uses a Telegram login CTA instead of an active comment form for guests', () => {
    expect(getHertzCommentComposerState(null, false)).toEqual({
      mode: 'guest',
      title: 'Login Telegram untuk ikut diskusi',
      body: 'Komentar hanya tersedia untuk member yang sudah login.',
      submitLabel: 'Login Telegram',
    });
  });

  it('keeps member comment composer interactive with pending feedback', () => {
    expect(getHertzCommentComposerState({ id: 'member-1' }, true)).toEqual({
      mode: 'member',
      title: 'Tulis komentar',
      body: 'Tambahkan sudut pandang Anda',
      submitLabel: 'Mengirim...',
    });
  });
});
