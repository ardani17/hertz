import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

const VIEWER_BASE_PATH = '/tools/cftc-viewer';

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const HORIZON_VIEWER_STYLE = `<style>
:root {
  color-scheme: dark;
  --horizon-bg: #0a0a0a;
  --horizon-surface: #141414;
  --horizon-panel: #101010;
  --horizon-text: #f1f1f1;
  --horizon-muted: #a1a1a1;
  --horizon-border: #1f1f1f;
  --horizon-accent: #10b981;
  --horizon-warning: #f59e0b;
  --horizon-danger: #ef4444;
  --horizon-max: 1200px;
}
* { box-sizing: border-box; }
html { background: var(--horizon-bg); scroll-behavior: smooth; }
body {
  min-height: 100vh;
  margin: 0;
  color: var(--horizon-text);
  background:
    radial-gradient(circle at 16% 0%, rgba(16, 185, 129, 0.08), transparent 28rem),
    var(--horizon-bg);
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  line-height: 1.6;
}
body > .antialiased {
  width: min(var(--horizon-max), calc(100% - 2rem));
  margin: 0 auto;
  padding: 0 0 3rem;
}
body > .antialiased > header,
body > .antialiased > .mt-5,
body > .antialiased > div.mt-5,
.bg-slate-500 {
  display: none !important;
}
.cftc-horizon-bar {
  width: min(var(--horizon-max), calc(100% - 2rem));
  margin: 1.5rem auto 0.75rem;
  padding: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  background: var(--horizon-surface);
  border: 1px solid var(--horizon-border);
  border-radius: 8px;
}
.cftc-horizon-bar a,
.cftc-horizon-pill {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  color: var(--horizon-muted);
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}
.cftc-horizon-bar a:hover {
  color: var(--horizon-accent);
  background: var(--horizon-bg);
  text-decoration: none;
}
.cftc-horizon-pill {
  margin-left: auto;
  color: var(--horizon-warning);
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.35);
}
main.flex,
.flex.flex-col.min-h-screen {
  width: 100% !important;
  max-width: none !important;
  min-height: 0 !important;
  margin: 0 auto !important;
  padding: 1.5rem !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 48%),
    var(--horizon-surface);
  border: 1px solid var(--horizon-border);
  border-radius: 8px;
}
h1,
h2,
h3 {
  color: var(--horizon-text) !important;
  letter-spacing: 0;
}
h1 {
  max-width: 820px;
  margin: 0 0 1.25rem !important;
  padding: 0 !important;
  font-size: clamp(1.8rem, 4vw, 3rem) !important;
  line-height: 1.05 !important;
}
h2 {
  margin: 0 0 1rem !important;
  padding: 0 !important;
  font-size: 1.25rem !important;
}
p,
li,
em,
div {
  color: inherit;
}
p {
  max-width: 860px;
  color: var(--horizon-muted);
}
a {
  color: var(--horizon-accent) !important;
  text-decoration: none !important;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}
a:hover {
  color: var(--horizon-text) !important;
  text-decoration: none !important;
}
nav[aria-label="breadcrumbs"] {
  margin: 0 0 1.25rem !important;
  padding: 0.75rem !important;
  overflow-x: auto;
  background: var(--horizon-bg);
  border: 1px solid var(--horizon-border);
  border-radius: 8px;
}
nav[aria-label="breadcrumbs"] ol {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
nav[aria-label="breadcrumbs"] li,
nav[aria-label="breadcrumbs"] a {
  color: var(--horizon-muted) !important;
  white-space: nowrap;
}
.space-x-5,
.flex-inline,
main.flex section:first-of-type div,
.flex.flex-col.min-h-screen > div:not(.mt-5) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.75rem;
}
.space-x-5 > a,
.flex-inline > a,
.flex.flex-col.min-h-screen > div:not(.mt-5) > div > a,
main.flex section:first-of-type a {
  min-height: 72px;
  display: grid;
  align-content: center;
  padding: 1rem !important;
  color: var(--horizon-text) !important;
  background: var(--horizon-bg);
  border: 1px solid var(--horizon-border);
  border-radius: 8px;
}
.space-x-5 > a:hover,
.flex-inline > a:hover,
.flex.flex-col.min-h-screen > div:not(.mt-5) > div > a:hover,
main.flex section:first-of-type a:hover {
  border-color: var(--horizon-accent);
  transform: translateY(-2px);
}
ul {
  margin: 0;
  padding-left: 1.25rem;
}
article {
  max-width: 900px;
}
article.hyphens-auto,
main.flex section:last-of-type {
  margin: 2rem 0 0 !important;
  padding: 1.25rem;
  color: var(--horizon-muted);
  background: var(--horizon-bg);
  border: 1px solid var(--horizon-border);
  border-radius: 8px;
}
table {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
  overflow: hidden;
  color: var(--horizon-text);
  border: 1px solid var(--horizon-border);
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}
th,
td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--horizon-border);
  text-align: left;
}
th {
  color: var(--horizon-muted);
  background: var(--horizon-bg);
  font-size: 0.75rem;
  text-transform: uppercase;
}
@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
    --horizon-bg: #fafafa;
    --horizon-surface: #f0f0f0;
    --horizon-panel: #ffffff;
    --horizon-text: #1a1a1a;
    --horizon-muted: #6b7280;
    --horizon-border: #d1d5db;
  }
}
@media (max-width: 768px) {
  body > .antialiased,
  .cftc-horizon-bar {
    width: min(100% - 1rem, var(--horizon-max));
  }
  main.flex,
  .flex.flex-col.min-h-screen {
    padding: 1rem !important;
  }
  .cftc-horizon-pill {
    margin-left: 0;
  }
}
</style>`;

const HORIZON_VIEWER_TOP_BAR = `<nav class="cftc-horizon-bar" aria-label="Horizon CFTC navigation">
  <a href="/tools">Tools</a>
  <a href="/tools/cftc">CFTC COT</a>
  <a href="/tools/cftc-viewer">Viewer</a>
  <span class="cftc-horizon-pill">Snapshot statis</span>
</nav>`;

const CFTC_VISIBLE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/Web viewer for CFTC Commitment of Traders data/g, 'Viewer CFTC Commitment of Traders untuk Horizon'],
  [/Commitment of Traders Viewer/g, 'Viewer Commitment of Traders'],
  [/What is the Commitment of Traders report\? 📊/g, 'Apa itu laporan Commitment of Traders?'],
  [/Get started/g, 'Mulai membaca'],
  [/View common futures:/g, 'Lihat futures populer:'],
  [/Or explore all the various categories \(we have<!-- --> <em>everything<\/em> the CFTC collects reports on\)…/g, 'Atau jelajahi seluruh kategori laporan futures yang tersedia.'],
  [/Or explore all the various categories \(we have <em>everything<\/em> the CFTC collects reports on\)…/g, 'Atau jelajahi seluruh kategori laporan futures yang tersedia.'],
  [/The CFTC provides a report every week informing the public of positioning in futures markets\./g, 'CFTC menerbitkan laporan mingguan yang memberi gambaran positioning pelaku pasar futures.'],
  [/Ever wondered how the big players in the financial markets are moving their chips around the table\? Well, that&#x27;s where the CFTC Commitment of Traders \(COT\) Report comes into play\./g, 'COT membantu membaca bagaimana pelaku besar memposisikan diri di pasar futures.'],
  [/Imagine peeking behind the curtain of the market to see who&#x27;s making the big bets and why\. That&#x27;s exactly what the CFTC COT Report does \(well, kind of\)\. CFTC stands for the Commodity Futures Trading Commission, the watchdogs of the financial markets in the U\.S\./g, 'Laporan ini memberi gambaran di balik layar tentang kelompok pelaku pasar yang sedang mengambil posisi besar. CFTC adalah Commodity Futures Trading Commission, regulator pasar derivatif di Amerika Serikat.'],
  [/This report is like a weekly snapshot that shows us who&#x27;s doing what in the world of financial futures \(which are like bets on the future prices of stuff like stocks, commodities, and more\)\. It helps us understand what the big financial institutions, traders, and even small investors are up to\./g, 'Laporan ini adalah snapshot mingguan yang memperlihatkan positioning di futures seperti indeks saham, komoditas, energi, logam, dan instrumen lain. Data ini membantu membaca aktivitas institusi, spekulan, hedger, dan pelaku kecil.'],
  [/Learn more about the Commitment of Traders reports from<!-- -->/g, 'Pelajari laporan Commitment of Traders dari '],
  [/the CFTC&#x27;s website/g, 'situs CFTC'],
  [/In particular, to learn about the different types of reports, check these links:/g, 'Untuk memahami jenis laporan, lihat referensi berikut:'],
  [/The &quot;Legacy&quot; report refers to a style of report which only separates traders into three groups: Commercials, Non-Commercials, and Non-Reportables\. Commercials are companies that participate in the futures market as a matter of business, e\.g\., as a farmer hedging his crops\. Non-Commercials are speculators like hedge funds\. Non-Reportables are small size traders who do not have to report positioning to the CFTC; these are typically retail traders\. Traders in Financial Futures or Disaggreagted reports have more graular categories than the simple 3 categories in the Legacy reports\./g, 'Laporan Legacy membagi trader menjadi Commercials, Non-Commercials, dan Non-Reportables. Commercials biasanya menggunakan futures untuk kebutuhan bisnis atau hedging. Non-Commercials adalah spekulan besar seperti fund. Non-Reportables adalah trader kecil yang posisinya tidak wajib dilaporkan secara rinci. Format Traders in Financial Futures dan Disaggregated punya kategori yang lebih detail daripada Legacy.'],
  [/>Home</g, '>Beranda<'],
  [/>Futures</g, '>Futures<'],
  [/Financial Instruments/g, 'Instrumen Finansial'],
  [/Financial \(stock indices, bonds, currencies\)/g, 'Finansial (indeks saham, obligasi, mata uang)'],
  [/>Financial</g, '>Finansial<'],
  [/Agriculture \(softs, grains\)/g, 'Agrikultur (softs, grains)'],
  [/>Agriculture</g, '>Agrikultur<'],
  [/Natural Resources \(energy, materials\)/g, 'Sumber Daya Alam (energi, material)'],
  [/Natural Resources/g, 'Sumber Daya Alam'],
  [/Stock Indices/g, 'Indeks Saham'],
  [/Currency\(non Major\)/g, 'Mata Uang (non-major)'],
  [/Currency/g, 'Mata Uang'],
  [/Cryptocurrencies/g, 'Aset Kripto'],
  [/Other Financial Instruments/g, 'Instrumen Finansial Lain'],
  [/Interest Rates   U\.s\. Treasury/g, 'Suku Bunga Treasury AS'],
  [/Interest Rates   Non U\.s\. Treasury/g, 'Suku Bunga Non-Treasury AS'],
  [/Interest Rate Swaps/g, 'Swap Suku Bunga'],
  [/Dairy Products/g, 'Produk Susu'],
  [/Petroleum And Products/g, 'Minyak dan Produk Turunan'],
  [/Metals/g, 'Logam'],
  [/Energy/g, 'Energi'],
  [/Materials/g, 'Material'],
  [/Softs/g, 'Soft Commodities'],
  [/Grains/g, 'Grains'],
  [/Livestock/g, 'Ternak'],
  [/Disaggregated/g, 'Disaggregated'],
  [/Traders in Financial Futures/g, 'Traders in Financial Futures'],
  [/Legacy/g, 'Legacy'],
  [/Commercials/g, 'Commercials'],
  [/Non-Commercials/g, 'Non-Commercials'],
  [/Non-Reportables/g, 'Non-Reportables'],
  [/\bOpen Interest\b/g, 'Open Interest'],
  [/\bLong\b/g, 'Long'],
  [/\bShort\b/g, 'Short'],
  [/\bSpreading\b/g, 'Spreading'],
  [/Dealer\/Intermediary/g, 'Dealer/Intermediary'],
  [/Asset Manager\/Institutional/g, 'Asset Manager/Institutional'],
  [/Leveraged Funds/g, 'Leveraged Funds'],
  [/Other Reportables/g, 'Other Reportables'],
  [/Producer\/Merchant\/Processor\/User/g, 'Producer/Merchant/Processor/User'],
  [/Swap Dealers/g, 'Swap Dealers'],
  [/Managed Money/g, 'Managed Money'],
  [/\bReport\b/g, 'Laporan'],
  [/\bUpdated\b/g, 'Diperbarui'],
  [/\bDate\b/g, 'Tanggal'],
];

function getCftcRoot() {
  return [
    path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), '..', 'docs', 'tools', 'cftc-export')),
    path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), 'docs', 'tools', 'cftc-export')),
    path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), '..', 'docs', 'tools', 'cftc')),
    path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), 'docs', 'tools', 'cftc')),
  ];
}

async function resolveRoot() {
  for (const candidate of getCftcRoot()) {
    try {
      const stats = await stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function rewriteStaticHtml(content: string) {
  const rewritten = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/(href|src|action)=["']\/(?!\/)/g, `$1="${VIEWER_BASE_PATH}/`)
    .replace(/url\(\//g, `url(${VIEWER_BASE_PATH}/`);

  const translated = CFTC_VISIBLE_TRANSLATIONS.reduce(
    (html, [pattern, replacement]) => html.replace(pattern, replacement),
    rewritten,
  );

  return translated
    .replace(/<\/head>/i, `${HORIZON_VIEWER_STYLE}</head>`)
    .replace(/<body([^>]*)>/i, `<body$1>${HORIZON_VIEWER_TOP_BAR}`);
}

function isInsideRoot(root: string, filePath: string) {
  const relative = path.relative(root, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function GET(_request: Request, context: RouteContext) {
  const root = await resolveRoot();

  if (!root) {
    return NextResponse.json(
      {
        success: false,
        error: 'CFTC static viewer folder was not found.',
      },
      { status: 404 },
    );
  }

  const params = await context.params;
  const requestedPath = params.path?.length ? params.path.join(path.sep) : 'index.html';
  const normalizedPath = path.normalize(requestedPath);
  const filePath = path.resolve(root, normalizedPath);

  if (!isInsideRoot(root, filePath)) {
    return NextResponse.json(
      { success: false, error: 'Invalid viewer path.' },
      { status: 400 },
    );
  }

  try {
    const fileStats = await stat(filePath);
    const resolvedFile = fileStats.isDirectory()
      ? path.join(filePath, 'index.html')
      : filePath;

    const ext = path.extname(resolvedFile).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
    const buffer = await readFile(resolvedFile);

    if (ext === '.html') {
      return new NextResponse(rewriteStaticHtml(buffer.toString('utf-8')), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'CFTC viewer file was not found.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
