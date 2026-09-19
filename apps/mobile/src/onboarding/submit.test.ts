import { describe, expect, it, vi } from 'vitest';
import type { AuthAccount } from '../auth/types';
import { createEmptyWeek } from './schedule';
import { submitOnboardingProfile, type WorkProfilePayload } from './submit';

const workProfile: WorkProfilePayload = {
  ccnl: 'CCNL-COMMERCIO',
  weeklyHours: 40,
  schedule: createEmptyWeek(),
  badgeEnabled: false,
};

const authoritativeAccount: AuthAccount & { nextStep: 'dashboard' } = {
  id: 'user-a',
  email: 'ada@example.it',
  name: 'Ada Rossi',
  tier: 'free',
  pendingTier: null,
  billingCycle: null,
  checkoutStatus: 'not_required',
  onboardingComplete: true,
  nextStep: 'dashboard',
};

describe('onboarding completion', () => {
  it('clears the account draft only after the server accepts the work profile', async () => {
    const events: string[] = [];

    const result = await submitOnboardingProfile('user-a', workProfile, {
      saveProfile: async (payload) => {
        expect(payload).toEqual(workProfile);
        events.push('server');
        return authoritativeAccount;
      },
      clearDraft: async (accountId) => {
        expect(accountId).toBe('user-a');
        events.push('clear');
      },
    });

    expect(result).toEqual(authoritativeAccount);
    expect(events).toEqual(['server', 'clear']);
  });

  it('retains the draft when the server rejects the work profile', async () => {
    const clearDraft = vi.fn();

    await expect(submitOnboardingProfile('user-a', workProfile, {
      saveProfile: async () => { throw new Error('server rejected'); },
      clearDraft,
    })).rejects.toThrow('server rejected');

    expect(clearDraft).not.toHaveBeenCalled();
  });
});
