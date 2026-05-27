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

import { BRAND_LOGO_PATHS } from '@/lib/brandLogo';

const logoMap = BRAND_LOGO_PATHS;

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
