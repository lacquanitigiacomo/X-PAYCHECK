import { describe, expect, it } from 'vitest';
import type { BadgeShift } from './presentation';
import { resolveBadgeStateAfterMutation } from './mutations';

const canonicalShift: BadgeShift = {
  id: 'canonical-shift',
  userId: 'user-1',
  startedAt: '2026-08-31T08:00:00.000Z',
  endedAt: null,
  corrections: [],
};

describe('resolveBadgeStateAfterMutation', () => {
  it('keeps the canonical mutation shift when the best-effort refresh fails', async () => {
    const state = await resolveBadgeStateAfterMutation(
      { shift: null, items: [] },
      canonicalShift,
      async () => { throw new Error('refresh failed'); },
    );

    expect(state).toEqual({ shift: canonicalShift, items: [canonicalShift] });
  });

  it('applies the canonical mutation shift over a stale successful refresh', async () => {
    const state = await resolveBadgeStateAfterMutation(
      { shift: null, items: [] },
      canonicalShift,
      async () => ({ shift: null, items: [] }),
    );

    expect(state).toEqual({ shift: canonicalShift, items: [canonicalShift] });
  });
});
