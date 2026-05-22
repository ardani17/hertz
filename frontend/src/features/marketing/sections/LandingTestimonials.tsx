import styles from '../HorizonLanding.module.css';

const testimonials = [
  {
    initial: 'R',
    quote:
      'Akhirnya tidak bolak-balik TradingView dan Telegram. Semua yang saya butuhkan ada di satu tempat.',
    name: 'Rizky P.',
    role: 'Swing Trader',
  },
  {
    initial: 'A',
    quote:
      'Outlook harian menghemat waktu persiapan pagi. Level kunci selalu jelas sebelum sesi dibuka.',
    name: 'Andi S.',
    role: 'Day Trader',
  },
  {
    initial: 'D',
    quote:
      'Jurnal di HERTZ mengubah konsistensi saya. Bisa melihat ulang setup membantu hindari kesalahan yang sama.',
    name: 'Dimas W.',
    role: 'Scalper',
  },
] as const;

export function LandingTestimonials() {
  return (
    <section className={styles.testimonials} aria-label="Testimoni trader">
      <div className={styles.testimonialsContent}>
        <p className={styles.eyebrow}>Dipercaya komunitas</p>
        <h2>Kata trader tentang Horizon</h2>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((item) => (
            <div className={styles.testimonialCard} key={item.name}>
              <div className={styles.testimonialAvatar}>{item.initial}</div>
              <blockquote className={styles.testimonialQuote}>&ldquo;{item.quote}&rdquo;</blockquote>
              <div className={styles.testimonialAuthor}>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
