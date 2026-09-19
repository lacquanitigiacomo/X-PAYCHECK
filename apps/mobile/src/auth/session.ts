import * as SecureStore from 'expo-secure-store';

export const ACCESS_TOKEN_KEY = 'xpay_access_token';

function normalizeAccessToken(token: string): string | null {
  const normalizedToken = token.trim();
  return normalizedToken.length > 0 && normalizedToken !== 'xpay-demo-token'
    ? normalizedToken
    : null;
}

export async function saveSession(token: string): Promise<void> {
  const normalizedToken = normalizeAccessToken(token);
  if (!normalizedToken) {
    throw new Error('Token di accesso non valido');
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, normalizedToken);
}

export async function loadSession(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (!token) return null;

  const normalizedToken = normalizeAccessToken(token);
  if (!normalizedToken) {
    await clearSession();
    return null;
  }

  return normalizedToken;
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
