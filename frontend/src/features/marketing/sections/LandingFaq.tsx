import { faqItems } from '../data';
import { FaqAccordion } from '../FaqAccordion';
import styles from '../HorizonLanding.module.css';

export function LandingFaq() {
  return (
    <section className={styles.faq} aria-label="Frequently asked questions">
      <div className={styles.faqContent}>
        <p className={styles.eyebrow}>Common questions</p>
        <h2>Frequently Asked Questions</h2>
        <FaqAccordion items={faqItems} />
      </div>
    </section>
  );
}
