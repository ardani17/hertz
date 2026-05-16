import { describe, expect, it } from 'vitest';
import {
  HERTZ_DM_POLL_INTERVAL_MS,
  getDmAccessState,
  getDmThreadMenuActions,
  canAddDmImages,
} from '../../../frontend/src/app/hertz/messages/MessagesClient';

describe('HERTZ direct message frontend state', () => {
  it('shows only a Telegram login CTA for guests', () => {
    expect(getDmAccessState(null)).toEqual({
      mode: 'guest',
      title: 'Login Telegram untuk Direct Message',
      body: 'DM hanya tersedia untuk member HERTZ yang sudah login.',
    });
  });

  it('keeps polling at five seconds or slower', () => {
    expect(HERTZ_DM_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(5000);
  });

  it('limits pending DM image uploads to four images', () => {
    expect(canAddDmImages(0, 4)).toBe(true);
    expect(canAddDmImages(3, 1)).toBe(true);
    expect(canAddDmImages(3, 2)).toBe(false);
    expect(canAddDmImages(4, 1)).toBe(false);
  });

  it('keeps archive and block inside the thread overflow menu', () => {
    expect(getDmThreadMenuActions({ active: true, archived: false })).toEqual(['Arsipkan', 'Blokir']);
    expect(getDmThreadMenuActions({ active: true, archived: true })).toEqual(['Buka arsip', 'Blokir']);
    expect(getDmThreadMenuActions({ active: false, archived: false })).toEqual([]);
  });
});
