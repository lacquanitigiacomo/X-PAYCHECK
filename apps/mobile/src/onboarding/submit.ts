import type { AuthAccount } from '../auth/types';
import type { WeeklySchedule } from './schedule';

export type WorkProfilePayload = {
  ccnl: string;
  weeklyHours: number;
  schedule: WeeklySchedule;
  badgeEnabled: boolean;
};

export type OnboardingAccountState = AuthAccount & {
  nextStep: 'checkout' | 'onboarding' | 'dashboard';
};

export type OnboardingSubmissionDependencies = {
  saveProfile: (profile: WorkProfilePayload) => Promise<OnboardingAccountState>;
  clearDraft: (accountId: string) => Promise<void>;
};

export async function submitOnboardingProfile(
  accountId: string,
  workProfile: WorkProfilePayload,
  dependencies: OnboardingSubmissionDependencies,
): Promise<OnboardingAccountState> {
  const updatedAccount = await dependencies.saveProfile(workProfile);
  await dependencies.clearDraft(accountId);
  return updatedAccount;
}
