export class ResourceFetchError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ResourceFetchError';
    this.status = status;
    this.payload = payload;
  }
}

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error?: { message?: string } };

export async function fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { cache: 'no-store', ...init });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success !== true) {
    const message = payload && 'error' in payload ? payload.error?.message : undefined;
    throw new ResourceFetchError(message ?? 'Request failed', response.status, payload);
  }
  return payload.data;
}
