import { describe, expect, it } from 'vitest';
import { routeForAccountState } from './accountRouting';

describe('routeForAccountState', () => {
  it.each([
    ['checkout', '/checkout'],
    ['onboarding', '/onboarding'],
    ['dashboard', '/dashboard'],
  ] as const)('routes the %s account state to %s', (nextStep, expectedRoute) => {
    expect(routeForAccountState({ nextStep })).toBe(expectedRoute);
  });
});
