import type { PlanTier } from '../navigation/routes';

export type AuthAccount = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  tier: PlanTier;
  pendingTier: 'pro' | null;
  billingCycle: 'monthly' | 'yearly' | 'lifetime' | null;
  checkoutStatus: 'pending' | 'not_required' | 'complete';
  onboardingComplete: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthAccount;
};

export type AccountState = AuthAccount & {
  nextStep: 'checkout' | 'onboarding' | 'dashboard';
};

export type EditableProfile = Pick<AuthAccount, 'name'> & {
  picture: string | null;
};
