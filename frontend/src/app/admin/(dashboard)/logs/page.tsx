'use client';

import { LogViewer, AdminPageHeader } from '@/components/admin';

/**
 * Admin Activity Logs Page
 *
 * Displays all activity logs in reverse chronological order with
 * filters for time range, actor, action type, and target type.
 * Supports keyword search and expandable detail view for JSONB data.
 *
 * Requirements: 23.3, 23.4, 23.5, 23.6
 */
export default function AdminLogsPage() {
  return (
    <div>
      <AdminPageHeader
        kicker="Sistem"
        title="Activity Logs"
        description="Audit trail aktivitas admin, member, dan sistem."
      />
      <LogViewer />
    </div>
  );
}
