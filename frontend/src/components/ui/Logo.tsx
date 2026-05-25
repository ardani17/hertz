'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface LogoProps {
  /** Height in pixels — width scales proportionally */
  height?: number;
  /** Optional CSS class */
  className?: string;
  /** Alt text override */
  alt?: string;
  /** Variant: 'full' shows tagline version, 'compact' shows no-tagline version, 'standard' shows standard logo, 'atom' shows atom icon */
  variant?: 'full' | 'compact' | 'standard' | 'atom';
}

const logoMap = {
  full: {
    dark: '/images/logo/Logo-Hertz-Big-white-04-02.png',
    light: '/images/logo/Logo-Hertz-Big-black-04.png',
  },
  compact: {
    dark: '/images/logo/Logo-Hertz-big-No-tag-line-white_10.png',
    light: '/images/logo/Logo-Hertz-big-No-tag-line_9.png',
  },
  standard: {
    dark: '/images/logo/Logo-Hertz-White-05-05.png',
    light: '/images/logo/Logo-Hertz-Black-06.png',
  },
  atom: {
    dark: '/images/logo/Logo-Hertz-Atom-Online-White_8.png',
    light: '/images/logo/Logo-Hertz-Atom-Online-Black_7.png',
  },
} as const;

/**
 * Theme-aware Hertz logo component.
 * Automatically switches between dark/light variants based on the current theme.
 */
export function Logo({ height = 32, className, alt = 'Hertz', variant = 'compact' }: LogoProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Read initial theme
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'light' : 'dark');

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver(() => {
      const updated = document.documentElement.getAttribute('data-theme');
      setTheme(updated === 'light' ? 'light' : 'dark');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const src = logoMap[variant][theme];

  return (
    <Image
      src={src}
      alt={alt}
      height={height}
      width={height * 4}
      className={className}
      style={{ height, width: 'auto', objectFit: 'contain' }}
      priority
    />
  );
}
