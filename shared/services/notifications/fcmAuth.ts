import { createSign } from 'crypto';

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function readFcmCredentials() {
  const projectId = process.env.FCM_PROJECT_ID?.trim();
  const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function isFcmHttpV1Configured(): boolean {
  return readFcmCredentials() !== null;
}

export async function getFcmAccessToken(): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const credentials = readFcmCredentials();
  if (!credentials) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({
    iss: credentials.clientEmail,
    sub: credentials.clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(credentials.privateKey, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const json = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number };
  if (!response.ok || !json.access_token) return null;

  cachedAccessToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(60, Number(json.expires_in ?? 3600)) * 1000,
  };
  return json.access_token;
}

export function getFcmProjectId(): string | null {
  return readFcmCredentials()?.projectId ?? null;
}

export function resetFcmAccessTokenCacheForTests(): void {
  cachedAccessToken = null;
}
