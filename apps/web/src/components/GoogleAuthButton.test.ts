import { describe, expect, it } from 'vitest';
import { buildGoogleSocialPayload, googleAuthError } from './GoogleAuthButton';

describe('buildGoogleSocialPayload', () => {
  it('includes the selected plan in Google registration', () => {
    expect(buildGoogleSocialPayload('google-token', 'pro', 'register')).toEqual({
      provider: 'google',
      idToken: 'google-token',
      tier: 'pro',
      intent: 'register',
    });
  });

  it('marks Google login requests explicitly', () => {
    expect(buildGoogleSocialPayload('google-token', 'free', 'login')).toEqual({
      provider: 'google',
      idToken: 'google-token',
      tier: 'free',
      intent: 'login',
    });
  });

  it('preserves the API error code needed by the login screen', () => {
    expect(googleAuthError({
      response: {
        data: {
          error: 'Account Google non registrato',
          code: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
        },
      },
    })).toEqual({
      message: 'Account Google non registrato',
      code: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
    });
  });
});
