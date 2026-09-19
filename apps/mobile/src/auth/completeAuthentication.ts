import type { AccountState, AuthSession, EditableProfile } from './types';

export type AuthenticationDependencies = {
  saveSession: (token: string) => Promise<void>;
  updateProfile: (profile: EditableProfile) => Promise<AccountState>;
};

function accountStateFromSession(session: AuthSession): AccountState {
  const nextStep = session.user.pendingTier === 'pro' || session.user.checkoutStatus === 'pending'
    ? 'checkout'
    : session.user.onboardingComplete
      ? 'dashboard'
      : 'onboarding';
  return { ...session.user, nextStep };
}

export async function completeAuthentication(
  session: AuthSession,
  profile: EditableProfile | undefined,
  dependencies: AuthenticationDependencies,
): Promise<AccountState> {
  await dependencies.saveSession(session.token);
  if (profile) return dependencies.updateProfile(profile);
  return accountStateFromSession(session);
}
