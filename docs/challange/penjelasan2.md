Tambahan fitur untuk Challenge Tracker:

Saya ingin Journal Dashboard dibuat lebih lengkap, bukan hanya tabel trade biasa.

Di dalam tab Journal, buat struktur menjadi 3 area utama:

1. Journal Input
Area untuk menambahkan atau mengedit trade.

2. Journal Dashboard
Area visual untuk membaca kualitas trading.

3. Journal Table
Area tabel semua trade.

Journal Dashboard harus menampilkan card ringkasan:
- Total trade
- Net P/L
- Win rate
- Average RR
- Profit factor
- Best setup
- Worst setup
- Best pair
- Worst pair
- Best session
- Worst session
- Kesalahan paling sering
- Emosi paling sering saat loss
- Jumlah trade hari ini
- Jumlah loss streak saat ini
- Rata-rata risk per trade

Tambahkan insight otomatis dari jurnal:
- Jika win rate rendah tapi RR tinggi, tampilkan insight bahwa strategi masih bisa profit jika risk reward dijaga.
- Jika win rate tinggi tapi akun tetap loss, tampilkan insight bahwa average loss terlalu besar.
- Jika pair tertentu sering loss, tampilkan peringatan agar pair tersebut dievaluasi.
- Jika session tertentu sering loss, tampilkan peringatan agar session tersebut dikurangi.
- Jika emosi seperti “FOMO”, “takut”, “balas dendam”, atau “ragu” sering muncul, tampilkan behavioral warning.
- Jika user entry terlalu banyak dalam satu hari, tampilkan warning overtrade.
- Jika loss streak mencapai 3 atau lebih, tampilkan warning untuk berhenti trading sementara.

Tambahkan field psikologi di jurnal:
- Confidence level: 1-5
- Discipline score: 1-5
- Emotional state: Calm, FOMO, Revenge, Fear, Greedy, Hesitant, Overconfident
- Mistake category: No mistake, Late entry, Early entry, Moved SL, No SL, Overlot, Revenge trade, News trade, Broke rules, Bad setup
- Trade quality: A+, A, B, C, D
- Followed plan: Yes/No

Tambahkan score jurnal:
Buat “Trading Discipline Score” dari 0 sampai 100.

Rumus awal:
- Mulai dari 100.
- Kurangi 20 jika followedPlan = No.
- Kurangi 15 jika mistakeCategory bukan “No mistake”.
- Kurangi 10 jika emotionalState termasuk FOMO, Revenge, Greedy, Fear, atau Overconfident.
- Kurangi 10 jika riskPercent lebih besar dari maxRiskPerTrade.
- Kurangi 10 jika tradeQuality C atau D.
- Minimal score 0.

Tampilkan:
- Discipline Score hari ini
- Discipline Score rata-rata
- Discipline Score per minggu
- Best discipline day
- Worst discipline day

Tambahkan chart untuk Journal Dashboard:
- Equity curve
- Daily P/L
- Discipline score trend
- Profit by pair
- Profit by session
- Profit by setup
- Mistake distribution
- Emotion distribution
- RR distribution

Jika chart belum bisa dibuat lengkap, buat placeholder chart component yang siap menerima data.

Tambahkan fitur AI Review Chat di dalam Challenge Tracker.

Buat tab baru:
AI Review

Urutan tab menjadi:
Overview | Rules | Journal | Analytics | Risk Monitor | AI Review

Fungsi AI Review:
User bisa ngobrol dengan AI untuk mereview jurnal trading dan challenge progress.

Layout AI Review:
- Sidebar kiri: Persona & Review Settings
- Area kanan: Chat interface

Di sidebar Persona & Review Settings, sediakan:
1. Pilihan persona:
   - Strict Prop Firm Coach
   - Calm Trading Mentor
   - Risk Manager
   - Psychology Coach
   - Scalping Coach
   - Swing Trading Coach
   - Custom Persona

2. Upload / input persona file:
   User bisa membuat atau memasukkan persona AI dalam bentuk teks/markdown/json.
   Untuk MVP, cukup sediakan textarea besar bernama “Persona File”.
   Nanti persona ini akan dikirim sebagai system prompt/context ke model AI.

3. Pilihan data yang akan direview:
   - Review semua jurnal
   - Review trade hari ini
   - Review minggu ini
   - Review bulan ini
   - Review trade terakhir
   - Review hanya trade loss
   - Review hanya trade dengan mistake
   - Review challenge rules dan risk status

4. Pilihan gaya review:
   - Ringkas
   - Detail
   - Tegas
   - Edukatif
   - Checklist
   - Action plan

5. Pilihan model AI:
   Buat dropdown model AI.
   Untuk MVP, cukup siapkan struktur UI dan state:
   - OpenAI
   - OpenRouter
   - Local Model
   - Custom API

Jangan hardcode satu provider saja. Buat adapter agar nanti mudah menambahkan model AI.

Chat interface:
- Input chat di bawah.
- Riwayat chat di tengah.
- Tombol “Review Journal”
- Tombol “Review Last Trade”
- Tombol “Review Risk”
- Tombol “Create Action Plan”
- Tombol “Clear Chat”

AI Review harus bisa mengirim konteks berikut ke model:
- Challenge rules
- Account status
- Current balance/equity
- Target progress
- Daily loss status
- Overall drawdown status
- Journal trades sesuai filter yang dipilih
- Analytics summary
- Persona file
- Pertanyaan user

Format prompt ke AI:
System:
Gunakan persona file yang dipilih user. Jika tidak ada persona custom, gunakan persona default sesuai pilihan.

Context:
Berisi challenge rules, risk status, journal summary, analytics, dan trade data.

User:
Pertanyaan user atau instruksi review.

Buat helper function:
buildAIReviewContext({
  challengeConfig,
  trades,
  analytics,
  riskStatus,
  selectedPersona,
  customPersonaText,
  reviewScope,
  reviewStyle,
  userMessage
})

Output dari helper function harus berupa object:
{
  systemPrompt: string,
  contextPrompt: string,
  userPrompt: string
}

Untuk MVP, jika API AI belum tersedia, buat mock response dulu:
“AI Review belum terhubung ke provider. Context sudah berhasil dibuat.”

Tetapi tampilkan preview context yang akan dikirim ke AI agar bisa dites.

Persona default:

Strict Prop Firm Coach:
Kamu adalah pelatih prop firm yang tegas. Fokus pada kepatuhan rules, drawdown, daily loss, risk per trade, overtrade, dan konsistensi. Jangan memotivasi berlebihan. Berikan kritik langsung, objektif, dan action plan yang bisa dijalankan.

Calm Trading Mentor:
Kamu adalah mentor trading yang tenang dan analitis. Fokus pada proses, kesabaran, evaluasi setup, dan perbaikan bertahap. Berikan feedback yang jelas tanpa menyalahkan trader.

Risk Manager:
Kamu adalah risk manager profesional. Fokus utama pada exposure, drawdown, position sizing, risk of ruin, daily loss, dan batas akun. Jika risiko terlalu tinggi, rekomendasikan pengurangan lot atau berhenti trading.

Psychology Coach:
Kamu adalah coach psikologi trading. Fokus pada emosi, disiplin, impuls, FOMO, revenge trading, rasa takut, overconfidence, dan kebiasaan buruk yang terlihat dari jurnal.

Scalping Coach:
Kamu adalah coach scalping. Fokus pada eksekusi cepat, session, spread, overtrade, entry timing, RR realistis, dan kualitas setup intraday.

Swing Trading Coach:
Kamu adalah coach swing trading. Fokus pada struktur market, kesabaran entry, RR besar, hold position, invalidation level, dan konsistensi setup.

Tambahkan fitur simpan persona:
Untuk MVP, simpan custom persona ke localStorage.
Field:
- personaName
- personaDescription
- personaContent
- createdAt
- updatedAt

User bisa:
- Membuat persona baru
- Mengedit persona
- Menghapus persona
- Memilih persona aktif

Tambahkan contoh persona file default:

Nama:
Prop Firm Evaluator

Isi:
Kamu adalah evaluator prop firm. Tugasmu adalah menilai apakah trader layak lanjut challenge berdasarkan jurnal, kepatuhan rules, risk management, dan konsistensi. Berikan penilaian dalam format:
1. Status akun
2. Pelanggaran rules
3. Masalah utama
4. Trade terbaik
5. Trade terburuk
6. Kesalahan berulang
7. Rekomendasi besok
8. Batas risiko besok
9. Kesimpulan lulus/tidak layak lanjut sementara

Tambahkan fitur export:
- Export journal ke CSV
- Export journal ke JSON
- Export AI review ke markdown

Prioritas implementasi:
1. Perkuat Journal Dashboard.
2. Tambahkan field psikologi dan discipline score.
3. Tambahkan tab AI Review dengan UI lengkap.
4. Buat persona manager sederhana.
5. Buat buildAIReviewContext helper.
6. Buat mock AI response jika belum ada API.
7. Setelah itu baru integrasi provider AI.