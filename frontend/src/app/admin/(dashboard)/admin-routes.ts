export const adminRouteTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/hertz': 'Moderasi HERTZ',
  '/admin/articles': 'Artikel',
  '/admin/outlook': 'Outlook',
  '/admin/users': 'Pengguna',
  '/admin/comments': 'Komentar',
  '/admin/credits': 'Kredit',
  '/admin/logs': 'Activity Logs',
  '/admin/api-keys': 'API Keys',
};

export const adminRouteDescriptions: Record<string, string> = {
  '/admin': 'Ringkasan platform, statistik member, dan aktivitas terbaru.',
  '/admin/hertz': 'Review draft Telegram, report terbuka, dan antrian moderasi feed.',
  '/admin/articles': 'Kelola semua artikel komunitas — trading, cerita, dan general.',
  '/admin/outlook': 'Kelola konten market outlook: video, long read, dan chart note.',
  '/admin/users': 'Daftar member, saldo kredit, dan profil pengguna.',
  '/admin/comments': 'Moderasi komentar artikel dan interaksi komunitas.',
  '/admin/credits': 'Atur biaya kredit fitur dan pengaturan ekonomi platform.',
  '/admin/logs': 'Audit trail aktivitas admin, member, dan sistem.',
  '/admin/api-keys': 'Kelola API key untuk integrasi eksternal.',
};

export function getAdminPageTitle(pathname: string): string {
  if (adminRouteTitles[pathname]) return adminRouteTitles[pathname];
  const match = Object.entries(adminRouteTitles).find(([route]) => route !== '/admin' && pathname.startsWith(route));
  return match?.[1] ?? 'Dashboard Admin';
}

export function getAdminPageDescription(pathname: string): string | undefined {
  if (adminRouteDescriptions[pathname]) return adminRouteDescriptions[pathname];
  const match = Object.entries(adminRouteDescriptions).find(([route]) => route !== '/admin' && pathname.startsWith(route));
  return match?.[1];
}
