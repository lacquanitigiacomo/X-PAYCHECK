import type { BadgeShift } from './presentation';

export type BadgeState = {
  shift: BadgeShift | null;
  items: BadgeShift[];
};

export function applyCanonicalBadgeShift(state: BadgeState, canonical: BadgeShift): BadgeState {
  const items = [
    ...state.items.filter(item => item.id !== canonical.id),
    canonical,
  ];
  const shift = canonical.endedAt === null
    ? canonical
    : state.shift?.id === canonical.id
      ? null
      : state.shift;
  return { shift, items };
}

export async function resolveBadgeStateAfterMutation(
  current: BadgeState,
  canonical: BadgeShift,
  refresh: () => Promise<BadgeState>,
): Promise<BadgeState> {
  let refreshed = current;
  try {
    refreshed = await refresh();
  } catch {
    // Mutation success is authoritative; refresh is best-effort only.
  }
  return applyCanonicalBadgeShift(refreshed, canonical);
}
