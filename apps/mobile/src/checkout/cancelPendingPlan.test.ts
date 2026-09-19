import { describe, expect, it, vi } from 'vitest';
import type { AccountState } from '../auth/types';
import { cancelPendingPlan } from './cancelPendingPlan';

const cancelledAccount: AccountState = {
  id: 'user-a',
  email: 'ada@example.it',
  name: 'Ada Rossi',
  tier: 'free',
  pendingTier: null,
  billingCycle: null,
  checkoutStatus: 'not_required',
  onboardingComplete: false,
  nextStep: 'onboarding',
};

describe('pending plan cancellation', () => {
  it('resets only after the server returns authoritative Free state', async () => {
    const events: string[] = [];

    await expect(cancelPendingPlan({
      cancelOnServer: async () => {
        events.push('server');
        return cancelledAccount;
      },
      resetToPlanChoice: async (account) => {
        expect(account).toEqual(cancelledAccount);
        events.push('reset');
      },
    })).resolves.toEqual(cancelledAccount);

    expect(events).toEqual(['server', 'reset']);
  });

  it('does not reset when server cancellation fails', async () => {
    const resetToPlanChoice = vi.fn();

    await expect(cancelPendingPlan({
      cancelOnServer: async () => { throw new Error('server rejected'); },
      resetToPlanChoice,
    })).rejects.toThrow('server rejected');

    expect(resetToPlanChoice).not.toHaveBeenCalled();
  });
});
