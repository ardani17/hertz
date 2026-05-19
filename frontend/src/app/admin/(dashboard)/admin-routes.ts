export const adminRouteTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/articles': 'Artikel',
  '/admin/outlook': 'Outlook',
  '/admin/users': 'Pengguna',
  '/admin/comments': 'Komentar',
  '/admin/reports': 'Laporan',
  '/admin/credits': 'Kredit',
  '/admin/settings': 'Pengaturan',
  '/admin/hertz': 'Moderasi HERTZ',
};

export function getAdminPageTitle(pathname: string): string {
  if (adminRouteTitles[pathname]) return adminRouteTitles[pathname];
  const match = Object.entries(adminRouteTitles).find(([route]) => route !== '/admin' && pathname.startsWith(route));
  return match?.[1] ?? 'Dashboard Admin';
}
