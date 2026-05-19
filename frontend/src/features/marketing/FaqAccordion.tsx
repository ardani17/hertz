'use client';

import { useState } from 'react';
import styles from './HorizonLanding.module.css';

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={styles.faqList}>
      {items.map((item, index) => (
        <div
          key={item.question}
          className={styles.faqItem}
          data-open={openIndex === index ? 'true' : 'false'}
        >
          <button
            type="button"
            className={styles.faqQuestion}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span>{item.question}</span>
            <svg className={styles.faqChevron} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div className={styles.faqAnswer}>
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
