import styles from '../HorizonLanding.module.css';

const testimonials = [
  {
    initial: 'R',
    quote:
      'Finally stopped switching between TradingView and Telegram. Everything I need is in one place now.',
    name: 'Rizky P.',
    role: 'Swing Trader',
  },
  {
    initial: 'A',
    quote:
      'The daily outlook saves me at least an hour of prep time every morning. Key levels are always on point.',
    name: 'Andi S.',
    role: 'Day Trader',
  },
  {
    initial: 'D',
    quote:
      'Journaling trades on HERTZ changed my consistency. Being able to look back at setups helps me avoid the same mistakes.',
    name: 'Dimas W.',
    role: 'Scalper',
  },
] as const;

export function LandingTestimonials() {
  return (
    <section className={styles.testimonials} aria-label="Trader testimonials">
      <div className={styles.testimonialsContent}>
        <p className={styles.eyebrow}>Trusted by traders</p>
        <h2>What traders are saying</h2>
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
