import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_KEY, isUsableAccessToken } from './authStorage';

describe('auth storage', () => {
  it('uses the X-PAY CHECK token namespace', () => {
    expect(AUTH_TOKEN_KEY).toBe('xpay_token');
  });

  it('rejects empty and legacy demo tokens', () => {
    expect(isUsableAccessToken('')).toBe(false);
    expect(isUsableAccessToken('xpay-demo-token')).toBe(false);
  });

  it('accepts a server-issued token value', () => {
    expect(isUsableAccessToken('header.payload.signature')).toBe(true);
  });
});
