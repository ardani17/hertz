'use client';

import { CreditSettings, AdminPageHeader } from '@/components/admin';

/**
 * Admin Credit Settings Page
 *
 * Displays credit reward configuration per category,
 * manual credit adjustment form, and transaction history.
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */
export default function AdminCreditsPage() {
  return (
    <div>
      <AdminPageHeader
        kicker="Ekonomi"
        title="Pengaturan Credit"
        description="Atur biaya kredit fitur dan riwayat transaksi member."
      />
      <CreditSettings />
    </div>
  );
}
