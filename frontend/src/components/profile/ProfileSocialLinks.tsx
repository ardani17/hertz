import { SOCIAL_PLATFORMS, type MemberSocialLinks } from '@shared/types/memberProfile';
import { buildSocialUrl, SOCIAL_PLATFORM_LABELS } from '@shared/lib/socialLinks';
import styles from './ProfileSocialLinks.module.css';

export function ProfileSocialLinks({ links }: { links: MemberSocialLinks }) {
  const entries = SOCIAL_PLATFORMS.filter((platform) => links[platform]?.trim()).map((platform) => ({
    platform,
    handle: links[platform]!.trim(),
    href: buildSocialUrl(platform, links[platform]!.trim()),
    label: SOCIAL_PLATFORM_LABELS[platform],
  }));

  if (entries.length === 0) return null;

  return (
    <section className={styles.section}>
      <h3>Sosial media</h3>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.platform}>
            <a href={entry.href} target="_blank" rel="noopener noreferrer">
              <span>{entry.label}</span>
              <em>@{entry.handle}</em>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
