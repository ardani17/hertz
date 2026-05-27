export function resolveMobileDeepLinkScheme(value?: string | null): string {
  const scheme = value?.trim();
  if (!scheme) return 'hertz';
  return scheme.replace(/:\/+$/g, '');
}

export function buildMobileAuthCallbackUrl(
  scheme: string,
  params: { token: string; expiresAt: string },
): string {
  const target = new URL(`${resolveMobileDeepLinkScheme(scheme)}://auth/callback`);
  target.searchParams.set('token', params.token);
  target.searchParams.set('expiresAt', params.expiresAt);
  return target.toString();
}
