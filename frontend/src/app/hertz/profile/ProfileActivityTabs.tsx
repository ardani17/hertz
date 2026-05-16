'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { HertzProfileActivity } from '@shared/services/hertzProfileService';
import {
  getDefaultProfileActivityTab,
  getProfileActivityPanel,
  type ProfileActivityTab,
  type ProfileActivityTabKey,
} from '@/lib/hertzProfileActivity';
import styles from './page.module.css';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function ProfileActivityTabs({
  activity,
  tabs,
}: {
  activity: HertzProfileActivity;
  tabs: ProfileActivityTab[];
}) {
  const [activeTab, setActiveTab] = useState<ProfileActivityTabKey>(getDefaultProfileActivityTab());
  const panel = getProfileActivityPanel(activity, activeTab);

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Aktivitas profil HERTZ">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`profile-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls="profile-activity-panel"
            className={activeTab === tab.key ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count === null ? null : <strong>{tab.count}</strong>}
          </button>
        ))}
      </div>
      <div
        id="profile-activity-panel"
        className={styles.activitySection}
        role="tabpanel"
        aria-labelledby={`profile-tab-${activeTab}`}
      >
        <h3>{panel.title}</h3>
        <div className={styles.activityGrid}>
          {panel.items.length > 0 ? panel.items.map((item) => (
            <Link key={item.id} href={`/hertz/post/${item.shortId}`}>
              <span>{item.label}</span>
              <strong>{item.text || 'Postingan HERTZ'}</strong>
              <em>{formatDate(item.createdAt)}</em>
            </Link>
          )) : <p>{panel.empty}</p>}
        </div>
      </div>
    </>
  );
}
