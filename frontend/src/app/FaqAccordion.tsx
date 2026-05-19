'use client';

import { useState } from 'react';
import styles from './HorizonLanding.module.css';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={styles.faqList}>
      {items.map((item, index) => (
        <div
          key={index}
          className={styles.faqItem}
          data-open={openIndex === index ? 'true' : 'false'}
        >
          <button
            className={styles.faqQuestion}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span>{item.question}</span>
            <svg
              className={styles.faqChevron}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 8L10 12L14 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
