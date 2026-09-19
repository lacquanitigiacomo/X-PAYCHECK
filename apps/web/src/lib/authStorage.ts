export const AUTH_TOKEN_KEY = 'xpay_token';

export function isUsableAccessToken(token: string): boolean {
  return token.length > 0 && token !== 'xpay-demo-token';
}

export function saveAccessToken(token: string): void {
  if (!isUsableAccessToken(token)) throw new Error('Token di accesso non valido');
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token && isUsableAccessToken(token) ? token : null;
}
