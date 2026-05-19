Saya ingin membuat tools baru bernama “Challenge Tracker”.

Konteks:
Saat ini aplikasi sudah punya tools “Profitability Simulator”. Tools tersebut berfungsi untuk simulasi probabilitas sebelum trading. Sekarang saya ingin menambahkan tools baru “Challenge Tracker” yang fokus untuk memantau progress challenge trading secara nyata, seperti akun prop firm, akun evaluasi, atau akun pribadi yang punya target profit dan batas drawdown.

Tujuan utama:
Challenge Tracker harus membantu trader memantau:
1. Progress target profit.
2. Risiko daily loss.
3. Risiko overall drawdown.
4. Status akun: aman, waspada, bahaya, atau gagal.
5. Jurnal trading harian.
6. Statistik performa dari jurnal.
7. Kepatuhan terhadap rules challenge.

Nama menu:
Challenge Tracker

Letakkan menu ini sejajar dengan menu tools lain:
Semua tools | Pivot Point | Profitability | Challenge Tracker | Elliott Wave | Kalender Ekonomi | Order Book | Likuiditas Bursa | CFTC COT

Jangan gabungkan dengan Profitability Simulator. Profitability Simulator tetap tools terpisah. Challenge Tracker adalah tools baru. Namun desain visualnya harus konsisten dengan halaman Profitability Simulator yang sudah ada.

Judul halaman:
CHALLENGE
Challenge Tracker

Subtitle:
Pantau target profit, drawdown, aturan evaluasi, risiko harian, dan jurnal trading agar akun tetap berada di zona aman.

Tambahkan accordion / expandable box seperti halaman Profitability:
Judul accordion:
Penjelasan input challenge

Isi accordion menjelaskan secara ringkas fungsi setiap input:
- Saldo awal: modal awal akun challenge.
- Saldo/equity saat ini: nilai akun terbaru.
- Target profit: target keuntungan yang harus dicapai.
- Max daily loss: batas kerugian maksimal dalam satu hari.
- Max overall drawdown: batas kerugian maksimal dari saldo awal atau equity tertinggi.
- Minimum trading days: jumlah minimal hari trading.
- Tanggal mulai: tanggal challenge dimulai.
- Tipe challenge: Personal, Prop Firm, Funded, Evaluation.
- Mode drawdown: Static, Trailing, Balance-based, Equity-based.
- Risk per trade: risiko standar setiap posisi.
- Status akun: kondisi akun berdasarkan aturan challenge.

Struktur halaman:
Buat layout utama dalam beberapa section atau tab internal.

Tab / section yang dibutuhkan:

1. Overview
Ini adalah dashboard utama. Tampilkan card-card ringkasan:
- Saldo awal
- Saldo saat ini
- Equity saat ini
- Profit/loss berjalan
- Persentase progress menuju target
- Sisa target profit
- Daily loss hari ini
- Sisa batas daily loss
- Overall drawdown saat ini
- Sisa batas drawdown
- Total trade
- Win rate
- Profit factor
- Average RR
- Status akun

Status akun menggunakan badge:
- Aman: akun masih jauh dari pelanggaran rules.
- Waspada: akun mulai mendekati batas risiko.
- Bahaya: akun sangat dekat dengan batas pelanggaran.
- Gagal: rules challenge sudah dilanggar.

Gunakan progress bar untuk:
- Progress target profit
- Penggunaan daily loss
- Penggunaan overall drawdown
- Minimum trading days

2. Rules
Section ini untuk mengatur rules challenge.

Input yang wajib ada:
- Nama challenge
- Mata uang akun: IDR, USD, EUR, GBP
- Saldo awal
- Target profit dalam persen
- Target profit dalam nominal
- Max daily loss dalam persen
- Max daily loss dalam nominal
- Max overall drawdown dalam persen
- Max overall drawdown dalam nominal
- Minimum trading days
- Tanggal mulai
- Tanggal berakhir, opsional
- Tipe akun: Personal, Prop Firm, Funded, Evaluation
- Mode drawdown: Static, Trailing, Balance-based, Equity-based
- Apakah news trading diperbolehkan: Ya/Tidak
- Apakah boleh hold overnight: Ya/Tidak
- Apakah boleh hold weekend: Ya/Tidak
- Consistency rule, opsional
- Max lot, opsional
- Max risk per trade, opsional

Perhitungan:
- Target nominal = saldo awal * target profit %
- Max daily loss nominal = saldo awal * max daily loss %
- Max overall drawdown nominal = saldo awal * max overall drawdown %
- Jika user isi nominal secara manual, persen bisa dihitung otomatis.
- Jika user isi persen, nominal dihitung otomatis.

3. Journal
Section ini adalah dashboard jurnal trading.

Buat form tambah trade dengan field:
- Tanggal
- Pair / symbol
- Session: Asia, London, New York
- Direction: Buy / Sell
- Entry price
- Stop loss
- Take profit
- Exit price
- Lot size
- Risk nominal
- Risk persen
- Result: Win, Loss, BE
- Profit/loss nominal
- Profit/loss persen
- RR planned
- RR realized
- Setup name
- Alasan entry
- Alasan exit
- Emosi saat entry
- Kesalahan yang terjadi
- Screenshot setup, opsional
- Catatan evaluasi

Di bawah form, tampilkan tabel trade journal dengan kolom:
- Tanggal
- Pair
- Session
- Buy/Sell
- Risk
- P/L
- RR
- Result
- Setup
- Catatan
- Action: edit, delete

Tambahkan filter:
- Filter berdasarkan tanggal
- Filter berdasarkan pair
- Filter berdasarkan result
- Filter berdasarkan session
- Filter berdasarkan setup

4. Analytics
Section ini menganalisis data dari jurnal.

Tampilkan statistik:
- Total trade
- Win rate
- Loss rate
- Break even rate
- Total profit
- Total loss
- Net profit
- Average win
- Average loss
- Biggest win
- Biggest loss
- Average RR
- Profit factor
- Expectancy
- Max losing streak
- Max winning streak
- Pair paling profit
- Pair paling rugi
- Session paling profit
- Setup paling profit
- Kesalahan paling sering

Chart yang dibutuhkan:
- Equity curve
- Daily P/L chart
- Win/loss distribution
- Profit by pair
- Profit by session
- Profit by setup
- Drawdown chart

Jika chart belum memungkinkan, minimal buat placeholder card chart dengan struktur data yang siap dipakai.

5. Risk Monitor
Section ini khusus untuk peringatan risiko.

Tampilkan warning otomatis:
- Jika daily loss sudah mencapai 70% dari limit, tampilkan status Waspada.
- Jika daily loss sudah mencapai 90% dari limit, tampilkan status Bahaya.
- Jika daily loss melewati limit, tampilkan status Gagal.
- Jika overall drawdown sudah mencapai 70% dari limit, tampilkan status Waspada.
- Jika overall drawdown sudah mencapai 90% dari limit, tampilkan status Bahaya.
- Jika overall drawdown melewati limit, tampilkan status Gagal.
- Jika user overtrade, tampilkan warning.
- Jika user loss streak terlalu panjang, tampilkan warning.
- Jika risk per trade melebihi rules, tampilkan warning.

Contoh warning:
- “Daily loss sudah mencapai 82% dari batas harian. Kurangi risiko atau berhenti trading hari ini.”
- “Overall drawdown mendekati batas maksimum. Akun masuk zona bahaya.”
- “Risk per trade melebihi aturan challenge.”
- “Loss streak terdeteksi. Evaluasi setup sebelum entry berikutnya.”

Desain UI:
Gunakan style yang sama dengan Profitability Simulator:
- Background dark.
- Border hijau gelap.
- Accent hijau/tosca.
- Card rounded.
- Input dark.
- Typography konsisten.
- Badge status jelas.
- Layout responsive.
- Section tidak terlalu padat.

Prioritas tampilan:
1. Overview harus paling mudah dibaca.
2. Risk status harus terlihat jelas.
3. Journal harus mudah diisi.
4. Analytics jangan terlalu ramai.
5. Rules harus rapi dan tidak membingungkan.

Rekomendasi layout:
Di halaman Challenge Tracker, gunakan tab internal:
Overview | Rules | Journal | Analytics | Risk Monitor

Default tab: Overview.

Data model yang dibutuhkan:

ChallengeConfig:
- id
- name
- accountCurrency
- initialBalance
- currentBalance
- currentEquity
- profitTargetPercent
- profitTargetAmount
- maxDailyLossPercent
- maxDailyLossAmount
- maxOverallDrawdownPercent
- maxOverallDrawdownAmount
- minTradingDays
- startDate
- endDate
- accountType
- drawdownMode
- newsTradingAllowed
- overnightAllowed
- weekendAllowed
- consistencyRule
- maxLot
- maxRiskPerTrade
- createdAt
- updatedAt

TradeJournal:
- id
- challengeId
- date
- symbol
- session
- direction
- entryPrice
- stopLoss
- takeProfit
- exitPrice
- lotSize
- riskAmount
- riskPercent
- result
- profitLossAmount
- profitLossPercent
- plannedRR
- realizedRR
- setupName
- entryReason
- exitReason
- emotion
- mistake
- screenshotUrl
- notes
- createdAt
- updatedAt

Computed Metrics:
- netProfit
- netProfitPercent
- targetProgressPercent
- remainingTargetAmount
- dailyLossToday
- dailyLossUsagePercent
- remainingDailyLoss
- overallDrawdown
- overallDrawdownUsagePercent
- remainingOverallDrawdown
- totalTrades
- winRate
- lossRate
- breakEvenRate
- averageRR
- profitFactor
- expectancy
- maxWinningStreak
- maxLosingStreak
- tradingDaysCount
- minTradingDaysProgress
- accountStatus

Rumus utama:
Net Profit = currentBalance - initialBalance

Net Profit Percent = (netProfit / initialBalance) * 100

Target Amount = initialBalance * profitTargetPercent / 100

Target Progress Percent = (netProfit / targetAmount) * 100

Daily Loss Today = total kerugian bersih hari ini

Daily Loss Usage Percent = abs(dailyLossToday) / maxDailyLossAmount * 100

Overall Drawdown = initialBalance - currentEquity, jika equity di bawah saldo awal

Overall Drawdown Usage Percent = overallDrawdown / maxOverallDrawdownAmount * 100

Win Rate = jumlah trade win / total trade * 100

Profit Factor = total profit dari trade win / abs(total loss dari trade loss)

Average RR = rata-rata realizedRR

Expectancy = (winRateDecimal * averageWin) - (lossRateDecimal * averageLoss)

Account Status:
- Gagal jika dailyLossToday melewati maxDailyLossAmount atau overallDrawdown melewati maxOverallDrawdownAmount.
- Bahaya jika salah satu penggunaan limit >= 90%.
- Waspada jika salah satu penggunaan limit >= 70%.
- Aman jika semua penggunaan limit < 70%.

Fitur CRUD:
- User bisa membuat challenge baru.
- User bisa edit rules challenge.
- User bisa tambah trade journal.
- User bisa edit trade journal.
- User bisa hapus trade journal.
- Data harus tersimpan, minimal di local storage jika belum ada backend.
- Jika sudah ada backend/database di project, gunakan struktur yang sesuai dengan arsitektur project.

Preset challenge:
Tambahkan preset cepat:
1. Prop Firm 10K
   Saldo: 10.000 USD
   Target: 10%
   Daily Loss: 5%
   Overall Drawdown: 10%
   Minimum trading days: 5

2. Prop Firm 25K
   Saldo: 25.000 USD
   Target: 10%
   Daily Loss: 5%
   Overall Drawdown: 10%
   Minimum trading days: 5

3. Personal IDR
   Saldo: 10.000.000 IDR
   Target: 10%
   Daily Loss: 3%
   Overall Drawdown: 10%
   Minimum trading days: 20

4. Conservative Challenge
   Risk per trade: 0.5%
   Target: 5%
   Daily Loss: 2%
   Overall Drawdown: 6%

UI card contoh untuk Overview:
- Account Status
- Target Progress
- Daily Loss Monitor
- Overall Drawdown Monitor
- Trading Days
- Performance Summary

Copywriting UI:
Badge aman:
“Aman”

Badge waspada:
“Waspada”

Badge bahaya:
“Bahaya”

Badge gagal:
“Gagal”

Empty state Journal:
“Belum ada trade. Tambahkan trade pertama untuk mulai membangun jurnal challenge.”

Empty state Analytics:
“Analytics akan muncul setelah jurnal memiliki minimal satu trade.”

Button utama:
- Buat Challenge
- Simpan Rules
- Tambah Trade
- Update Trade
- Hapus Trade
- Reset Challenge

Validasi:
- Saldo awal wajib lebih dari 0.
- Target profit wajib lebih dari 0.
- Max daily loss wajib lebih dari 0.
- Max overall drawdown wajib lebih dari 0.
- Tanggal trade tidak boleh kosong.
- Pair tidak boleh kosong.
- Profit/loss harus bisa bernilai positif, negatif, atau nol.
- Risk percent tidak boleh lebih besar dari max risk per trade jika rules diaktifkan.

Yang tidak perlu dibuat dulu:
- Tidak perlu integrasi broker.
- Tidak perlu auto import history MT4/MT5.
- Tidak perlu login user baru jika project belum punya auth.
- Tidak perlu upload screenshot jika storage belum siap. Boleh buat field URL atau placeholder dulu.

Target hasil:
Saya ingin halaman Challenge Tracker yang sudah bisa dipakai secara manual untuk:
1. Membuat challenge.
2. Mengatur rules.
3. Input jurnal trade.
4. Melihat progress target.
5. Melihat risiko daily loss dan drawdown.
6. Melihat status akun.
7. Melihat analytics dasar dari jurnal.

Pastikan kode rapi, komponen reusable, responsive, dan mengikuti style UI aplikasi yang sudah ada.