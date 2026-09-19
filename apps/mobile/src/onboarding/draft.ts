import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const partialTimeSchema = z.string()
  .max(5)
  .regex(/^[0-9]{0,2}(?::[0-9]{0,2})?$/);
const partialHoursSchema = z.string()
  .max(8)
  .regex(/^[0-9]*(?:[.,][0-9]*)?$/);
const draftWorkDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  enabled: z.boolean(),
  start: partialTimeSchema.nullable(),
  end: partialTimeSchema.nullable(),
}).strict().superRefine((workDay, context) => {
  const hasEditableTimes = typeof workDay.start === 'string' && typeof workDay.end === 'string';
  const hasClearedTimes = workDay.start === null && workDay.end === null;
  if ((workDay.enabled && !hasEditableTimes) || (!workDay.enabled && !hasClearedTimes)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Stato orari draft non valido' });
  }
});

export const onboardingDraftSchema = z.object({
  step: z.number().int().min(0).max(4),
  ccnl: z.string().max(200),
  weeklyHours: partialHoursSchema,
  schedule: z.array(draftWorkDaySchema)
    .length(7)
    .refine((schedule) => new Set(schedule.map((day) => day.day)).size === 7),
  badgeEnabled: z.boolean(),
}).strict();

export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

export type OnboardingDraftAccess =
  | { status: 'loading'; accountId: string }
  | { status: 'ready'; accountId: string; draft: OnboardingDraft | null }
  | { status: 'error'; accountId: string };

type OnboardingDraftHydrationResult = Exclude<OnboardingDraftAccess, { status: 'loading' }>;

const DRAFT_KEY_PREFIX = 'xpay_onboarding_draft_';
function draftKey(accountId: string): string {
  const safeAccountId = accountId.trim().replace(/[^A-Za-z0-9._-]/g, '_');
  if (!safeAccountId) throw new Error('Account non valido per il draft onboarding');
  return `${DRAFT_KEY_PREFIX}${safeAccountId}`;
}

export function serializeOnboardingDraft(draft: OnboardingDraft): string {
  return JSON.stringify(onboardingDraftSchema.parse(draft));
}

export function hydrateOnboardingDraft(serialized: string): OnboardingDraft | null {
  try {
    const candidate: unknown = JSON.parse(serialized);
    const result = onboardingDraftSchema.safeParse(candidate);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function saveOnboardingDraft(accountId: string, draft: OnboardingDraft): Promise<void> {
  await SecureStore.setItemAsync(draftKey(accountId), serializeOnboardingDraft(draft));
}

export async function loadOnboardingDraft(accountId: string): Promise<OnboardingDraft | null> {
  const serialized = await SecureStore.getItemAsync(draftKey(accountId));
  return serialized ? hydrateOnboardingDraft(serialized) : null;
}

export async function hydrateOnboardingDraftAccess(accountId: string): Promise<OnboardingDraftHydrationResult> {
  try {
    return { status: 'ready', accountId, draft: await loadOnboardingDraft(accountId) };
  } catch {
    return { status: 'error', accountId };
  }
}

export async function saveOnboardingDraftWhenReady(
  access: OnboardingDraftAccess,
  accountId: string,
  draft: OnboardingDraft,
): Promise<boolean> {
  if (access.status !== 'ready' || access.accountId !== accountId) return false;
  await saveOnboardingDraft(accountId, draft);
  return true;
}

export async function clearOnboardingDraft(accountId: string): Promise<void> {
  await SecureStore.deleteItemAsync(draftKey(accountId));
}
