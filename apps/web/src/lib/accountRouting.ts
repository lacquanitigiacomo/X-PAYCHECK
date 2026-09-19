export type AccountStateRoute = '/checkout' | '/onboarding' | '/dashboard';

export type RoutableAccountState = {
  nextStep: 'checkout' | 'onboarding' | 'dashboard';
};

const accountRoutes: Record<RoutableAccountState['nextStep'], AccountStateRoute> = {
  checkout: '/checkout',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
};

export function routeForAccountState(state: RoutableAccountState): AccountStateRoute {
  return accountRoutes[state.nextStep];
}
