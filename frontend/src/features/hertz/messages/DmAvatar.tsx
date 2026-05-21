'use client';

import { useState } from 'react';
import { getDmInitial } from './dm-utils';
import styles from './messages.module.css';

export function DmAvatar({
  src,
  displayName,
  username,
  className,
}: {
  src?: string | null;
  displayName?: string | null;
  username?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src && !failed);

  return (
    <span className={`${styles.dmAvatar} ${className ?? ''}`.trim()} aria-hidden="true">
      {showImage ? (
        <img src={src!} alt="" onError={() => setFailed(true)} />
      ) : (
        getDmInitial(displayName, username)
      )}
    </span>
  );
}
