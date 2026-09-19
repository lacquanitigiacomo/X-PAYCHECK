import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearOnboardingDraft,
  hydrateOnboardingDraftAccess,
  hydrateOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraftWhenReady,
  saveOnboardingDraft,
  serializeOnboardingDraft,
  type OnboardingDraft,
} from './draft';

vi.mock('expo-secure-store', () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

const getItemAsync = vi.mocked(SecureStore.getItemAsync);
const setItemAsync = vi.mocked(SecureStore.setItemAsync);
const deleteItemAsync = vi.mocked(SecureStore.deleteItemAsync);

const draft: OnboardingDraft = {
  step: 3,
  ccnl: 'CCNL-COMMERCIO',
  weeklyHours: '40',
  schedule: [
    { day: 1, enabled: true, start: '09:00', end: '18:00' },
    { day: 2, enabled: false, start: null, end: null },
    { day: 3, enabled: false, start: null, end: null },
    { day: 4, enabled: false, start: null, end: null },
    { day: 5, enabled: false, start: null, end: null },
    { day: 6, enabled: false, start: null, end: null },
    { day: 7, enabled: false, start: null, end: null },
  ],
  badgeEnabled: true,
};

describe('onboarding draft storage', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    vi.resetAllMocks();
    storage.clear();
    getItemAsync.mockImplementation(async (key) => storage.get(key) ?? null);
    setItemAsync.mockImplementation(async (key, value) => { storage.set(key, value); });
    deleteItemAsync.mockImplementation(async (key) => { storage.delete(key); });
  });

  it('serializes and hydrates a complete draft without changing its values', () => {
    expect(hydrateOnboardingDraft(serializeOnboardingDraft(draft))).toEqual(draft);
  });

  it('restores bounded partial time and weekly-hours edits after a remount', () => {
    const partialDraft: OnboardingDraft = {
      ...draft,
      weeklyHours: '4,',
      schedule: [
        { ...draft.schedule[0], start: '09:', end: '1' },
        ...draft.schedule.slice(1),
      ],
    };

    expect(hydrateOnboardingDraft(serializeOnboardingDraft(partialDraft))).toEqual(partialDraft);
  });

  it.each([
    'not-json',
    JSON.stringify({ ...draft, step: 7 }),
    JSON.stringify({ ...draft, schedule: draft.schedule.slice(0, 6) }),
    JSON.stringify({ ...draft, weeklyHours: '1'.repeat(9) }),
    JSON.stringify({
      ...draft,
      schedule: [{ ...draft.schedule[0], start: '123456' }, ...draft.schedule.slice(1)],
    }),
  ])('ignores a malformed or invalid persisted draft', (value) => {
    expect(hydrateOnboardingDraft(value)).toBeNull();
  });

  it('does not overwrite an existing draft when its SecureStore read fails', async () => {
    const partialDraft: OnboardingDraft = {
      ...draft,
      weeklyHours: '4,',
      schedule: [
        { ...draft.schedule[0], start: '09:', end: '1' },
        ...draft.schedule.slice(1),
      ],
    };
    await saveOnboardingDraft('user-a', partialDraft);
    const persistedBeforeFailure = [...storage.values()][0];
    getItemAsync.mockRejectedValueOnce(new Error('SecureStore unavailable'));

    const access = await hydrateOnboardingDraftAccess('user-a');
    await saveOnboardingDraftWhenReady(access, 'user-a', draft);

    expect(access).toEqual({ status: 'error', accountId: 'user-a' });
    expect([...storage.values()][0]).toBe(persistedBeforeFailure);
  });

  it('enables draft persistence after SecureStore confirms no draft exists', async () => {
    const access = await hydrateOnboardingDraftAccess('user-a');

    await saveOnboardingDraftWhenReady(access, 'user-a', draft);

    await expect(loadOnboardingDraft('user-a')).resolves.toEqual(draft);
  });

  it('restores drafts independently for each authenticated account', async () => {
    await saveOnboardingDraft('user-a', draft);
    await saveOnboardingDraft('user-b', { ...draft, ccnl: 'CCNL-METALMECCANICI' });

    await expect(loadOnboardingDraft('user-a')).resolves.toEqual(draft);
    await expect(loadOnboardingDraft('user-b')).resolves.toMatchObject({ ccnl: 'CCNL-METALMECCANICI' });
  });

  it('clears only the completed account draft', async () => {
    await saveOnboardingDraft('user-a', draft);
    await saveOnboardingDraft('user-b', { ...draft, ccnl: 'CCNL-METALMECCANICI' });

    await clearOnboardingDraft('user-a');

    await expect(loadOnboardingDraft('user-a')).resolves.toBeNull();
    await expect(loadOnboardingDraft('user-b')).resolves.toMatchObject({ ccnl: 'CCNL-METALMECCANICI' });
  });
});
