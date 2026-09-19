import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, loadSession, saveSession } from './session';

vi.mock('expo-secure-store', () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

const getItemAsync = vi.mocked(SecureStore.getItemAsync);
const setItemAsync = vi.mocked(SecureStore.setItemAsync);
const deleteItemAsync = vi.mocked(SecureStore.deleteItemAsync);

describe('secure session', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('persists a server-issued access token in the X-PAY CHECK namespace', async () => {
    await saveSession('server-issued-token');

    expect(setItemAsync).toHaveBeenCalledWith('xpay_access_token', 'server-issued-token');
  });

  it('persists a normalized server-issued access token', async () => {
    await saveSession('  server-issued-token  ');

    expect(setItemAsync).toHaveBeenCalledWith('xpay_access_token', 'server-issued-token');
  });

  it.each(['', '   ', 'xpay-demo-token', ' xpay-demo-token '])('rejects an unusable token: %j', async (token) => {
    await expect(saveSession(token)).rejects.toThrow('Token di accesso non valido');
    expect(setItemAsync).not.toHaveBeenCalled();
  });

  it('returns a valid persisted access token', async () => {
    getItemAsync.mockResolvedValue('server-issued-token');

    await expect(loadSession()).resolves.toBe('server-issued-token');
  });

  it('returns a normalized persisted access token', async () => {
    getItemAsync.mockResolvedValue('  server-issued-token  ');

    await expect(loadSession()).resolves.toBe('server-issued-token');
  });

  it('removes an unusable persisted token', async () => {
    getItemAsync.mockResolvedValue('xpay-demo-token');

    await expect(loadSession()).resolves.toBeNull();
    expect(deleteItemAsync).toHaveBeenCalledWith('xpay_access_token');
  });

  it('clears the persisted access token', async () => {
    await clearSession();

    expect(deleteItemAsync).toHaveBeenCalledWith('xpay_access_token');
  });
});
