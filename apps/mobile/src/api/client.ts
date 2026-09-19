import { loadSession } from '../auth/session';

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Richiesta API non riuscita (${status})`);
    this.name = 'ApiError';
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (typeof error.body === 'string' && error.body.trim()) return error.body;
    if (
      typeof error.body === 'object'
      && error.body !== null
      && 'error' in error.body
      && typeof error.body.error === 'string'
    ) {
      return error.body.error;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await loadSession();
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers,
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}
