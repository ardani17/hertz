import { faqItems } from '../data';
import { FaqAccordion } from '../FaqAccordion';
import styles from '../HorizonLanding.module.css';

export function LandingFaq() {
  return (
    <section className={styles.faq} aria-label="Pertanyaan umum">
      <div className={styles.faqContent}>
        <p className={styles.eyebrow}>Pertanyaan umum</p>
        <h2>Yang Sering Ditanyakan</h2>
        <FaqAccordion items={faqItems} />
      </div>
    </section>
  );
}
