import { describe, expect, it } from 'vitest';
import {
  accountProfileUpdateSchema,
  cancelPendingProSchema,
  checkoutSchema,
  payslipUploadSchema,
  workProfileSchema,
} from './contracts';

describe('account and onboarding contracts', () => {
  it('accepts a complete seven-day work profile', () => {
    expect(workProfileSchema.parse({
      ccnl: 'CCNL-COMMERCIO', weeklyHours: 40,
      schedule: [
        { day: 1, enabled: true, start: '09:00', end: '18:00' },
        { day: 2, enabled: true, start: '09:00', end: '18:00' },
        { day: 3, enabled: true, start: '09:00', end: '18:00' },
        { day: 4, enabled: true, start: '09:00', end: '18:00' },
        { day: 5, enabled: true, start: '09:00', end: '18:00' },
        { day: 6, enabled: false, start: null, end: null },
        { day: 7, enabled: false, start: null, end: null },
      ], badgeEnabled: false,
    }).weeklyHours).toBe(40);
  });

  it('rejects checkout for the free plan', () => {
    expect(() => checkoutSchema.parse({ tier: 'free', billingCycle: 'monthly' })).toThrow();
  });

  it('accepts only editable profile fields and keeps email out of updates', () => {
    expect(accountProfileUpdateSchema.parse({ name: 'Ada Aggiornata', picture: null })).toEqual({
      name: 'Ada Aggiornata',
      picture: null,
    });
    expect(() => accountProfileUpdateSchema.parse({
      name: 'Ada Aggiornata',
      picture: null,
      email: 'changed@example.it',
    })).toThrow();
  });

  it('accepts only an empty pending-Pro cancellation payload', () => {
    expect(cancelPendingProSchema.parse({})).toEqual({});
    expect(() => cancelPendingProSchema.parse({ reason: 'changed mind' })).toThrow();
  });

  it('keeps payslip base64 inside the transport-safe boundary', () => {
    const payload = {
      fileData: 'x'.repeat(7_000_000),
      mimeType: 'image/jpeg',
      month: 8,
      year: 2026,
    };

    expect(payslipUploadSchema.safeParse(payload).success).toBe(true);
    expect(payslipUploadSchema.safeParse({ ...payload, fileData: `${payload.fileData}x` }).success).toBe(false);
  });
});
