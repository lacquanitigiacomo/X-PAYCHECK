export const APP_ROUTES = [
  'Landing',
  'Login',
  'Register',
  'PlanChoice',
  'Checkout',
  'Onboarding',
  'Dashboard',
  'Upload',
  'Report',
  'Settings',
  'License',
  'Calendar',
  'Archive',
  'Badge',
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];
export type PlanTier = 'free' | 'pro';
export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: { tier: PlanTier };
  PlanChoice: undefined;
  Checkout: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  Upload: undefined;
  Report: undefined;
  Settings: undefined;
  License: undefined;
  Calendar: undefined;
  Archive: undefined;
  Badge: undefined;
};

type AccountNextStep = 'checkout' | 'onboarding' | 'dashboard';
type PostAuthDestination = 'Checkout' | 'Onboarding' | 'Dashboard';

const postAuthDestinations: Record<AccountNextStep, PostAuthDestination> = {
  checkout: 'Checkout',
  onboarding: 'Onboarding',
  dashboard: 'Dashboard',
};

export function resolvePostAuthDestination(account: { nextStep: AccountNextStep }): PostAuthDestination {
  return postAuthDestinations[account.nextStep];
}

export function resolveAuthUserDestination(account: {
  pendingTier: 'pro' | null;
  checkoutStatus: 'pending' | 'not_required' | 'complete';
  onboardingComplete: boolean;
}): PostAuthDestination {
  if (account.pendingTier === 'pro' || account.checkoutStatus === 'pending') return 'Checkout';
  return account.onboardingComplete ? 'Dashboard' : 'Onboarding';
}

export function resolveLandingDestination(intent: 'register' | 'login'): 'PlanChoice' | 'Login' {
  return intent === 'register' ? 'PlanChoice' : 'Login';
}

type PlanChoiceDestination =
  | { name: 'Register'; params: { tier: PlanTier } }
  | { name: 'Onboarding' | 'Checkout' };

export function resolvePlanChoiceDestination(
  tier: PlanTier,
  context: 'registration' | 'authenticated' = 'registration',
): PlanChoiceDestination {
  if (context === 'authenticated') {
    return { name: tier === 'free' ? 'Onboarding' : 'Checkout' };
  }
  return { name: 'Register', params: { tier } };
}

export function resolvePendingPlanCancellationDestination(account: {
  tier: PlanTier;
  pendingTier: 'pro' | null;
  checkoutStatus: 'pending' | 'not_required' | 'complete';
}): 'PlanChoice' | null {
  return account.tier === 'free'
    && account.pendingTier === null
    && account.checkoutStatus === 'not_required'
    ? 'PlanChoice'
    : null;
}

type DashboardDestination = 'Upload' | 'Report' | 'Settings' | 'License' | 'Calendar' | 'Archive' | 'Badge';

const dashboardDestinations: Record<string, DashboardDestination> = {
  carica: 'Upload',
  report: 'Report',
  impostazioni: 'Settings',
  calendario: 'Calendar',
  archivio: 'Archive',
};

export function resolveDashboardDestination(
  destination: string,
  tier: PlanTier = 'free',
): DashboardDestination | null {
  if (destination === 'badge') return tier === 'pro' ? 'Badge' : 'License';
  return dashboardDestinations[destination] ?? null;
}
