import { describe, expect, it, vi } from 'vitest';
import type { AuthAccount, AuthSession, EditableProfile } from './types';
import { completeAuthentication } from './completeAuthentication';

const pendingGoogleAccount: AuthAccount = {
  id: 'google-user',
  email: 'verified@example.it',
  name: 'Google Name',
  picture: 'https://example.test/old.png',
  tier: 'free',
  pendingTier: 'pro',
  billingCycle: null,
  checkoutStatus: 'pending',
  onboardingComplete: false,
};

const googleSession: AuthSession = {
  token: 'server-token',
  user: pendingGoogleAccount,
};

describe('authentication completion', () => {
  it('routes with the authoritative persisted profile returned by the server', async () => {
    const events: string[] = [];
    const profile: EditableProfile = { name: 'Nome Modificato', picture: null };
    const authoritative = {
      ...pendingGoogleAccount,
      name: 'Nome Modificato',
      picture: undefined,
      nextStep: 'checkout' as const,
    };

    const result = await completeAuthentication(googleSession, profile, {
      saveSession: async (token) => {
        expect(token).toBe('server-token');
        events.push('session');
      },
      updateProfile: async (payload) => {
        expect(payload).toEqual({ name: 'Nome Modificato', picture: null });
        events.push('profile');
        return authoritative;
      },
    });

    expect(result).toEqual(authoritative);
    expect(result.email).toBe('verified@example.it');
    expect(events).toEqual(['session', 'profile']);
  });

  it('uses the auth response directly when no profile edit is requested', async () => {
    const updateProfile = vi.fn();

    const result = await completeAuthentication(googleSession, undefined, {
      saveSession: async () => undefined,
      updateProfile,
    });

    expect(result).toEqual({ ...pendingGoogleAccount, nextStep: 'checkout' });
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
