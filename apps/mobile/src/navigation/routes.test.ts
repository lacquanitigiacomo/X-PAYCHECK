import { describe, expect, it } from 'vitest';
import {
  APP_ROUTES,
  resolveDashboardDestination,
  resolveAuthUserDestination,
  resolveLandingDestination,
  resolvePlanChoiceDestination,
  resolvePendingPlanCancellationDestination,
  resolvePostAuthDestination,
} from './routes';

describe('mobile routes', () => {
  it('exposes every retained product flow', () => {
    expect(APP_ROUTES).toEqual([
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
    ]);
  });

  it('maps implemented dashboard destinations to real routes', () => {
    expect(resolveDashboardDestination('carica')).toBe('Upload');
    expect(resolveDashboardDestination('report')).toBe('Report');
    expect(resolveDashboardDestination('impostazioni')).toBe('Settings');
    expect(resolveDashboardDestination('archivio')).toBe('Archive');
  });

  it('uses the authoritative tier to keep Free accounts out of Badge', () => {
    expect(resolveDashboardDestination('badge', 'pro')).toBe('Badge');
    expect(resolveDashboardDestination('badge', 'free')).toBe('License');
  });

  it('returns null for unavailable destinations', () => {
    expect(resolveDashboardDestination('confronto')).toBeNull();
  });

  it('routes an authenticated account to its required next step', () => {
    expect(resolvePostAuthDestination({ nextStep: 'checkout' })).toBe('Checkout');
    expect(resolvePostAuthDestination({ nextStep: 'onboarding' })).toBe('Onboarding');
    expect(resolvePostAuthDestination({ nextStep: 'dashboard' })).toBe('Dashboard');
  });

  it('places plan choice before account registration', () => {
    expect(resolveLandingDestination('register')).toBe('PlanChoice');
    expect(resolveLandingDestination('login')).toBe('Login');
  });

  it('carries the selected plan into registration route state', () => {
    expect(resolvePlanChoiceDestination('pro')).toEqual({
      name: 'Register',
      params: { tier: 'pro' },
    });
    expect(resolvePlanChoiceDestination('free')).toEqual({
      name: 'Register',
      params: { tier: 'free' },
    });
  });

  it('routes an existing account plan change without creating another account', () => {
    expect(resolvePlanChoiceDestination('free', 'authenticated')).toEqual({ name: 'Onboarding' });
    expect(resolvePlanChoiceDestination('pro', 'authenticated')).toEqual({ name: 'Checkout' });
  });

  it('derives the first authenticated route from an auth response', () => {
    expect(resolveAuthUserDestination({
      pendingTier: 'pro', checkoutStatus: 'pending', onboardingComplete: false,
    })).toBe('Checkout');
    expect(resolveAuthUserDestination({
      pendingTier: null, checkoutStatus: 'not_required', onboardingComplete: false,
    })).toBe('Onboarding');
    expect(resolveAuthUserDestination({
      pendingTier: null, checkoutStatus: 'complete', onboardingComplete: true,
    })).toBe('Dashboard');
  });

  it('returns to plan choice only after authoritative pending-Pro cancellation', () => {
    expect(resolvePendingPlanCancellationDestination({
      tier: 'free', pendingTier: null, checkoutStatus: 'not_required',
    })).toBe('PlanChoice');
    expect(resolvePendingPlanCancellationDestination({
      tier: 'free', pendingTier: 'pro', checkoutStatus: 'pending',
    })).toBeNull();
    expect(resolvePendingPlanCancellationDestination({
      tier: 'pro', pendingTier: null, checkoutStatus: 'complete',
    })).toBeNull();
  });
});
