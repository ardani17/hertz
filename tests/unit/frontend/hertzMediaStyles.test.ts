import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function readCss(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('HERTZ media styles', () => {
  it('renders feed media without cropping uploaded images', () => {
    const css = readCss('frontend/src/components/feed/HertzPost.module.css');
    const mediaRule = css.match(/\.mediaGrid img, \.mediaGrid video \{(?<body>[^}]+)\}/)?.groups?.body ?? '';

    expect(mediaRule).toContain('object-fit: contain');
    expect(mediaRule).not.toContain('object-fit: cover');
  });

  it('renders composer image previews without cropping uploaded images', () => {
    const css = readCss('frontend/src/components/feed/HertzComposer.module.css');
    const mediaRule = css.match(/\.mediaQueue img \{(?<body>[^}]+)\}/)?.groups?.body ?? '';

    expect(mediaRule).toContain('object-fit: contain');
    expect(mediaRule).not.toContain('object-fit: cover');
  });
});
