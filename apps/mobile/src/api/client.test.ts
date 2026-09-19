import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, getApiErrorMessage } from './client';

vi.mock('../auth/session', () => ({
  loadSession: vi.fn().mockResolvedValue('server-issued-token'),
}));

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds the stored token and parses a successful JSON response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ nextStep: 'dashboard' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<{ nextStep: string }>('/account/state')).resolves.toEqual({ nextStep: 'dashboard' });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/api/v1/account/state');
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer server-issued-token');
  });

  it('throws an ApiError with the status and parsed error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })));

    const request = apiRequest('/account/state');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 401,
      body: { error: 'Invalid token' },
    });
  });
});

describe('getApiErrorMessage', () => {
  it('uses the API error message when the response exposes one', () => {
    expect(getApiErrorMessage(
      new ApiError(400, { error: 'Payload cedolino non valido' }),
      'Errore inatteso',
    )).toBe('Payload cedolino non valido');
  });
});
