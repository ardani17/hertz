import { describe, expect, it } from 'vitest';
import {
  extractHertzTopics,
  formatHertzSearchPostLabel,
  normalizeHertzSearchQuery,
} from '../../../shared/services/hertzSearchService';

describe('HertzSearchService helpers', () => {
  it('normalizes short social search queries', () => {
    expect(normalizeHertzSearchQuery('  xau  ')).toBe('xau');
    expect(normalizeHertzSearchQuery('a')).toBe(null);
  });

  it('extracts unique hashtags as lower-case topics', () => {
    expect(extractHertzTopics('Setup #XAUUSD entry #gold lalu #XAUUSD')).toEqual(['xauusd', 'gold']);
  });
});

describe('formatHertzSearchPostLabel', () => {
  it('strips HTML tags and decodes entities for post search labels', () => {
    const label = formatHertzSearchPostLabel('<p>Gold <strong>reject</strong> &amp; retest</p>');

    expect(label).toBe('Gold reject & retest');
    expect(label).not.toContain('<p>');
    expect(label).not.toContain('</p>');
  });

  it('uses a clean fallback for empty post content', () => {
    expect(formatHertzSearchPostLabel('<p>   </p>')).toBe('Postingan HERTZ');
    expect(formatHertzSearchPostLabel(null)).toBe('Postingan HERTZ');
  });

  it('keeps readable spacing between adjacent HTML blocks', () => {
    expect(formatHertzSearchPostLabel('<p>First</p><p>Second</p>')).toBe('First Second');
  });

  it('truncates after the text is cleaned', () => {
    const label = formatHertzSearchPostLabel(`<p>${'a'.repeat(80)}</p>`, 12);

    expect(label).toBe('aaaaaaaaaaaa');
  });
});
