import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Tools HERTZ theme contract', () => {
  it('renders the tools hub as a single-column HERTZ feed, not a marketing grid', () => {
    const css = read('frontend/src/app/tools/tools.module.css');
    const mainRule = css.match(/\.main \{(?<body>[^}]+)\}/)?.groups?.body ?? '';
    const gridRule = css.match(/\.grid \{(?<body>[^}]+)\}/)?.groups?.body ?? '';
    const cardRule = css.match(/\.toolCard \{(?<body>[^}]+)\}/)?.groups?.body ?? '';
    const hoverRule = css.match(/\.toolCard:hover \{(?<body>[^}]+)\}/)?.groups?.body ?? '';

    expect(mainRule).toContain('max-width: 760px');
    expect(gridRule).toContain('grid-template-columns: 1fr');
    expect(cardRule).toContain('background: var(--hertz-bg-base)');
    expect(hoverRule).not.toContain('transform');
  });

  it('keeps individual tool pages inside a HERTZ-style reading shell', () => {
    const css = read('frontend/src/components/tools/ToolShell.module.css');
    const shellRule = css.match(/\.shell \{(?<body>[^}]+)\}/)?.groups?.body ?? '';
    const headerRule = css.match(/\.header \{(?<body>[^}]+)\}/)?.groups?.body ?? '';
    const panelRule = css.match(/\.panel \{(?<body>[^}]+)\}/)?.groups?.body ?? '';

    expect(shellRule).toContain('max-width: 860px');
    expect(headerRule).toContain('border: 1px solid var(--hertz-border)');
    expect(panelRule).toContain('background: var(--hertz-bg-base)');
  });

  it('highlights only the active tools tab without forcing Semua tools green', () => {
    const css = read('frontend/src/components/tools/ToolShell.module.css');
    const nav = read('frontend/src/components/tools/ToolNav.tsx');

    expect(css).not.toContain('.toolNavHome');
    expect(nav).not.toContain('toolNavHome');
    expect(nav).toContain('activeTool === null ? styles.toolNavActive : undefined');
  });
});
