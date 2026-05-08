import type { ReactNode } from 'react';

interface IconProps {
  className?: string;
}

function IconBase({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function PulseIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M3 12h3.5l2-7 4 14 2.5-7H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function CommentIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6.5 17.5 4 20v-4.2A7.2 7.2 0 0 1 3 12c0-4.1 3.8-7.4 8.6-7.4s8.6 3.3 8.6 7.4-3.8 7.4-8.6 7.4c-1.9 0-3.6-.5-5.1-1.9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </IconBase>
  );
}

export function RepostIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M7 7h9.5A3.5 3.5 0 0 1 20 10.5V12m0 0-2-2m2 2 2-2M17 17H7.5A3.5 3.5 0 0 1 4 13.5V12m0 0 2 2m-2-2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SignalIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 13h4l2-7 4 12 2-5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function InsightIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </IconBase>
  );
}

export function BookmarkIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M7 4h10v16l-5-3-5 3V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 15V4m0 0 4 4m-4-4-4 4M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M20.5 4.8 17.3 19c-.22 1-.84 1.22-1.7.75l-4.75-3.5-2.3 2.22c-.25.25-.47.47-.96.47l.34-4.86 8.85-8c.38-.34-.08-.53-.6-.2L5.24 12.77.53 11.3c-1.02-.32-1.04-1.02.22-1.5L19.16 2.7c.86-.32 1.6.2 1.34 2.1Z" fill="currentColor" />
    </IconBase>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 6h16l-6.2 7.1V18l-3.6 1.7v-6.6L4 6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </IconBase>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="10.5" cy="10.5" r="5.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </IconBase>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.5 16 4-4 2.8 2.8 2.2-2.2L19 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15.8" cy="9.2" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M8.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19a5 5 0 0 1 10 0m2-6.5a4 4 0 0 1 5 3.9V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </IconBase>
  );
}
