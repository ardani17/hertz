# Audit Tools Horizon

Tanggal audit: 2026-05-04
Lokasi kerja: `C:\laragon\www\horizon`

## Tujuan

Audit ini mengecek apakah tools dari `docs/tools` sudah benar-benar berfungsi di web Horizon, apakah UI-nya selaras dengan gaya Horizon, dan apa saja temuan yang perlu diperbaiki sebelum polishing lanjutan.

## Ringkasan Status

| Tool | Route | Status fungsi | Status UI | Catatan utama |
| --- | --- | --- | --- | --- |
| Tools hub | `/tools` | Berfungsi | Perlu diselaraskan | Grid card terlalu generik dan belum terasa seperti halaman operasional Horizon. |
| CFTC COT Viewer | `/tools/cftc`, `/tools/cftc-viewer` | Berfungsi sebagai static viewer | Perlu konteks lebih jelas | HTML/CSS statis bisa dibuka. Script Next lama dimatikan agar tidak konflik dengan app Horizon. Data bersifat snapshot static, bukan live pull CFTC. |
| Pivot Point Calculator | `/tools/pivot-point` | Berfungsi | Perlu hierarchy lebih baik | Hitung support/resistance berjalan, tetapi layout hasil belum mengutamakan Pivot/R1/S1 sebagai level paling penting. |
| Profitability Simulator | `/tools/profitability` | Berfungsi, tapi UX kalkulasi perlu diperbaiki | Perlu validasi dan state | Simulasi otomatis berubah saat input berubah karena `useMemo` bergantung pada input. Tombol "Jalankan simulasi" jadi kurang bermakna. |
| Elliott Wave Calculator | `/tools/elliott-wave` | Berfungsi | Perlu copy dan struktur sinyal | Level dan sinyal muncul, tetapi halaman belum punya tombol aksi/konfirmasi hitung dan istilahnya masih campuran Indonesia-Inggris. |
| Economic Calendar | `/tools/economic-calendar` | Berfungsi via API proxy | Perlu empty/loading state lebih rapi | API merespons 200. Bisa kosong jika tidak ada event sesuai filter. Empty state perlu menjelaskan bahwa filter/upstream bisa kosong. |
| Order Book | `/tools/order-book` | Berfungsi dengan fallback | Perlu label sumber data | OANDA upstream bisa gagal; fallback demo sudah tampil. UI harus menandai jelas "demo fallback" agar tidak disalahartikan sebagai live data. |
| Exchange Liquidity | `/tools/exchange-liquidity` | Berfungsi via API proxy | Perlu visual grouping | API merespons data. Saat response kecil atau kosong, tabel tetap perlu empty state dan konteks pembacaan lebih jelas. |
| HorizonFX V2 Audit | `/tools/horizonfx` | Berfungsi sebagai audit/migration map | Perlu dibuat lebih actionable | Sudah menjelaskan modul lama, tetapi perlu dibedakan mana sudah aktif, mana referensi, mana belum dimigrasikan. |

## Hasil Probe Runtime

- `GET /tools/pivot-point`: 200, halaman calculator muncul.
- `GET /tools/profitability`: 200, simulator muncul.
- `GET /tools/elliott-wave`: 200, calculator muncul.
- `GET /api/tools/economic-calendar?period=today&volatility=MEDIUM,HIGH`: 200, response sukses.
- `GET /api/tools/exchange-liquidity?pair=BTC%2FUSDT&exchange=Bi**ce&timeType=1D`: 200, response berisi liquidity data.
- `POST /api/tools/order-book`: 200, fallback aktif saat OANDA upstream gagal.
- `GET /tools/cftc-viewer/futures/financial-instruments`: 200, script dimatikan, HTML static terbuka.

## Temuan UI Global

1. **Tools pages belum sepenuhnya mengikuti rasa web Horizon.**
   - Web Horizon utama memakai gaya gelap sederhana, surface datar, border tipis, max-width 1200, dan layout konten yang padat.
   - Tools sekarang memakai hero besar dan card grid yang agak terasa seperti landing page.
   - Perbaikan: buat tools hub lebih seperti dashboard utilitarian, dengan status ringkas, kategori, dan tombol langsung ke tool.

2. **Tidak ada active state pada navigasi tools.**
   - `ToolNav` hanya link biasa, jadi user tidak tahu sedang berada di tool mana.
   - Perbaikan: ubah `ToolNav` menjadi client component yang membaca pathname dan memberi state aktif.

3. **Tabel tools berpotensi terkena style global table.**
   - `globals.css` memberi border pada semua `th` dan `td`, sementara `ToolShell.module.css` juga memberi border.
   - Hasilnya bisa terasa terlalu berat/double-border.
   - Perbaikan: override table tools dengan border lateral yang lebih halus dan `border: 0` pada cell.

4. **Metric cards terlalu seragam dan belum menonjolkan data utama.**
   - Semua metric setara. Pada Pivot, `PIVOT`, `R1`, dan `S1` harus lebih mudah discan.
   - Pada Profitability, expected balance/ROI/drawdown harus diprioritaskan.
   - Perbaikan: tambahkan class emphasis untuk metric primer dan tata ulang urutan hasil.

5. **Loading dan empty state belum cukup informatif.**
   - Economic Calendar kosong bisa dianggap error.
   - Exchange Liquidity kosong belum menjelaskan apakah upstream kosong atau filter kurang tepat.
   - Perbaikan: tambah empty state spesifik per tool.

## Temuan Fungsi Per Tool

### 1. CFTC COT Viewer

Status: berfungsi sebagai static viewer.

Temuan:
- Folder `docs/tools/cftc` adalah static export Next lama, bukan source app.
- Jika script bawaan dibiarkan, viewer mencoba load chunk dari root `/_next` dan konflik dengan Horizon.
- Script sudah dimatikan di route server agar HTML/CSS statis tetap bisa dipakai.
- Data adalah snapshot static, bukan update otomatis dari CFTC.

Perbaikan:
- Tambahkan copy yang menyatakan "static snapshot".
- Tambahkan quick links ke kategori utama: financial instruments, agriculture, natural resources.
- Tambahkan tombol kembali ke Tools agar user tidak buntu di static viewer.

### 2. Pivot Point Calculator

Status: berfungsi.

Temuan:
- Validasi OHLC sudah ada, tetapi hasil semua level tampil setara.
- Tidak ada penjelasan singkat cara membaca Pivot/R/S.
- Reset menghapus hasil dan input, tetapi tidak memberi contoh cepat.

Perbaikan:
- Tonjolkan Pivot, R1, S1 sebagai level utama.
- Tambahkan contoh singkat dan tombol restore sample.
- Rapikan urutan hasil menjadi Resistance, Pivot, Support.

### 3. Profitability Simulator

Status: berfungsi, tetapi perlu perbaikan UX.

Temuan:
- Simulasi berjalan otomatis saat input berubah karena result dihitung dari `useMemo([inputs, runId])`.
- Tombol "Jalankan simulasi" tidak terasa sebagai trigger utama.
- Tidak ada validasi range: win rate bisa >100, risk bisa ekstrem, balance bisa 0.
- Hasil selalu berubah ketika mengetik, membuat user sulit membandingkan run.

Perbaikan:
- Simpan `lastRunInputs` dan `result` hanya saat tombol diklik.
- Tambahkan validasi range input.
- Tambahkan ringkasan "berdasarkan N simulasi dan M trade".

### 4. Elliott Wave Calculator

Status: berfungsi.

Temuan:
- Kalkulasi otomatis setiap input berubah; ini boleh, tetapi kurang jelas sebagai flow "masukkan data lalu hitung".
- Copy campuran Indonesia-Inggris.
- Sinyal bisa kosong, tetapi empty state masih terlalu generik.

Perbaikan:
- Tambahkan tombol "Hitung level" atau setidaknya status "auto-calculated".
- Konsistenkan istilah: level, target, stop, area observasi.
- Tambahkan penekanan bahwa ini area observasi, bukan rekomendasi finansial.

### 5. Economic Calendar

Status: berfungsi via API proxy.

Temuan:
- Response 200 bisa berisi data kosong.
- Empty state belum membedakan "tidak ada event" vs "upstream gagal".
- Tabel belum memprioritaskan event high impact secara visual.

Perbaikan:
- Tambahkan summary total event dan date range.
- Tambahkan empty state berdasarkan filter.
- Beri badge impact yang lebih jelas tapi tetap sesuai palet Horizon.

### 6. Order Book

Status: berfungsi dengan fallback.

Temuan:
- OANDA upstream bisa gagal; fallback demo muncul.
- Fallback harus sangat jelas agar user tidak mengira itu live data.
- Grafik bar sederhana sudah membantu, tapi tabel panjang bisa terasa berat.

Perbaikan:
- Tambahkan source badge: `Live OANDA` atau `Demo fallback`.
- Batasi rows yang tampil dan tampilkan area sekitar current price.
- Tambahkan note interpretasi long/short percent.

### 7. Exchange Liquidity

Status: berfungsi via API proxy.

Temuan:
- Data upstream ada, tetapi UI masih tabel dasar.
- Tidak ada grouping long/short side; saat ini total liquidation level dijumlah.
- Jika upstream berubah format, UI bisa kosong tanpa konteks.

Perbaikan:
- Tambahkan summary current price, points, dan strongest level.
- Empty state jika data tidak tersedia.
- Tambahkan note bahwa angka adalah estimasi liquidity map upstream.

### 8. HorizonFX V2 Audit Page

Status: berfungsi sebagai mapping.

Temuan:
- Halaman perlu lebih berguna sebagai laporan migrasi.
- Saat ini card module belum menyebut route aktif yang bisa diklik.

Perbaikan:
- Tambahkan daftar route aktif dan modul referensi.
- Jelaskan dependency yang sengaja tidak dipindahkan: MongoDB, Redis, NextAuth, ECharts, XLSX, Tailwind/Radix.

## Prioritas Perbaikan Step-by-step

1. Rapikan `ToolShell` dan `ToolNav` agar semua tool terasa menyatu dengan UI Horizon.
2. Perbaiki Tools hub menjadi dashboard operasional, bukan landing card generik.
3. Perbaiki Profitability Simulator agar hasil hanya berubah saat user menjalankan simulasi.
4. Tambahkan source/empty/loading states untuk Economic Calendar, Order Book, dan Exchange Liquidity.
5. Tambahkan quick links dan static snapshot notice untuk CFTC.
6. Rapikan Pivot dan Elliott copy, hierarchy, dan interpretasi hasil.
7. Build dan probe semua route setelah perubahan.

## Catatan Risiko

- CFTC viewer tetap static snapshot karena folder yang tersedia adalah export HTML, bukan pipeline data CFTC live.
- Economic Calendar dan Exchange Liquidity bergantung upstream `quantapi.vip`.
- Order Book bergantung OANDA Labs; fallback demo hanya untuk menjaga UI tetap dapat dipelajari saat upstream gagal.
- Jangan memindahkan mentah `horizonfx-v2-main` karena stack-nya berbeda dan berisiko menambah MongoDB/Redis/NextAuth ke Horizon utama tanpa desain integrasi.

## Perbaikan yang Sudah Dikerjakan Setelah Audit

1. `ToolNav` dibuat membaca current pathname dan menampilkan active state.
2. `ToolShell` dirapikan agar lebih menyatu dengan surface, border, tabel, dan metric style Horizon.
3. Tabel tools dioverride agar tidak bentrok dengan style global table.
4. Profitability Simulator diperbaiki: hasil hanya berubah saat user menekan tombol `Jalankan simulasi`, bukan setiap input berubah.
5. Profitability Simulator menormalisasi input ke batas aman dan menampilkan konteks jumlah simulasi/trade.
6. Pivot Point menonjolkan `PIVOT`, `R1`, dan `S1`, serta menambahkan tombol contoh.
7. Elliott Wave diberi status `Auto-calculated`, copy area observasi, dan penekanan bahwa ini bukan rekomendasi finansial.
8. Economic Calendar menampilkan status total event, date range, sumber data, badge impact, dan empty state yang lebih jelas.
9. Order Book menampilkan badge sumber `OANDA Labs` atau `Demo fallback` dan warning fallback.
10. Exchange Liquidity menampilkan sumber data, current price, jumlah data point, strongest level, dan empty state.
11. CFTC page menampilkan catatan `static snapshot` serta quick links ke kategori utama.
12. HorizonFX V2 Audit page menampilkan route aktif hasil migrasi.

## Verifikasi Setelah Perbaikan

- `npm.cmd run build --workspace=frontend`: berhasil.
- `GET /tools/profitability`: 200.
- `GET /tools/cftc`: 200, quick links dan static notice muncul.
- `POST /api/tools/order-book`: 200, fallback terdeteksi saat upstream OANDA gagal.
- `GET /tools/cftc-viewer?probe=1`: 200, tidak ada `<script>` dari static export lama, konten viewer tetap ada.

## Penyesuaian Node Modules

- Tools aktif sudah menjadi bagian dari workspace Horizon utama, bukan project Node terpisah.
- Folder `docs/tools/horizonfx-v2-main` dipertahankan sebagai arsip referensi audit saja.
- Manifest `package.json` dan `package-lock.json` lama di `docs/tools/horizonfx-v2-main` dihapus agar tidak memicu instalasi `node_modules` kedua.
- Root `.npmrc` diset `install-strategy=hoisted` dan `workspaces=true` agar instalasi dependency mengikuti workspace Horizon.
- `frontend/Dockerfile` menyalin `.npmrc` pada stage install/build/runtime supaya Docker juga memakai konfigurasi workspace yang sama.
- Command yang dipakai tetap dari root Horizon: `npm install`, `npm run dev:frontend`, dan `npm run build:frontend`.
