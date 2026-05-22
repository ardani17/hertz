'use client';

import Link from 'next/link';
import { useState } from 'react';

function initials(name: string, username?: string | null) {
  if (username?.startsWith('trader')) return 'TR';
  if (username?.startsWith('langit')) return 'LG';
  if (username?.startsWith('life')) return 'LC';
  if (name === 'Ardani Trader') return 'AR';
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function HertzAvatar({
  src,
  name,
  username,
  className,
}: {
  src?: string | null;
  name: string;
  username?: string | null;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  const avatar = (
    <>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          width={40}
          height={40}
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name, username)
      )}
    </>
  );

  if (username) {
    return (
      <Link href={`/@${username}`} className={className} prefetch>
        {avatar}
      </Link>
    );
  }

  return <div className={className}>{avatar}</div>;
}
