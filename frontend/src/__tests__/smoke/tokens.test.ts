// Feature: horizon-social-ux-uplift, Smoke: design tokens
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd().endsWith('/frontend') || process.cwd().endsWith('\\frontend') ? process.cwd() : join(process.cwd(), 'frontend'), 'src');
const FORBIDDEN = ['#0f0f14', '#10b981', '#00e38a', '#34d399', '#059669'] as const;
const EXEMPT = new Set([
  'app/globals.css',
  'app/tools/cftc-viewer/[[...path]]/route.ts',
]);

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(path, files);
      continue;
    }
    if (/\.(css|module\.css|tsx|ts)$/.test(entry)) files.push(path);
  }
  return files;
}

describe('design token literals', () => {
  it('does not use forbidden raw palette literals outside globals.css', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      if (EXEMPT.has(rel) || rel.endsWith('tokens.test.ts')) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      for (const line of lines) {
        const normalized = line.toLowerCase();
        if (normalized.includes('var(')) continue;
        for (const literal of FORBIDDEN) {
          if (normalized.includes(literal)) offenders.push(`${rel} → ${literal}`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
