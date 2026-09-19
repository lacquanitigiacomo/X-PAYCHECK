import { describe, expect, it } from 'vitest';
import {
  getPayslipFileDataError,
  requiresReplacementConfirmation,
  retainUploadedPayslipMetadata,
  sanitizePayslipMetadata,
  withReplacementConfirmation,
} from './retention';

describe('requiresReplacementConfirmation', () => {
  it('requires confirmation when a Free account already has a payslip', () => {
    expect(requiresReplacementConfirmation('free', [{ id: 'old' }])).toBe(true);
  });

  it('does not require confirmation when a Free account has no payslips', () => {
    expect(requiresReplacementConfirmation('free', [])).toBe(false);
  });

  it('never requires replacement confirmation for a Pro account', () => {
    expect(requiresReplacementConfirmation('pro', [{ id: 'one' }])).toBe(false);
  });

  it('adds confirmReplace only from an explicit confirmation decision', () => {
    const upload = {
      fileData: 'base64-data',
      mimeType: 'image/jpeg' as const,
      month: 8,
      year: 2026,
    };

    expect(withReplacementConfirmation(upload, false).confirmReplace).toBe(false);
    expect(withReplacementConfirmation(upload, true).confirmReplace).toBe(true);
  });

  it('drops document content from listed and newly uploaded mobile state', () => {
    const unsafeRecord = {
      id: 'payslip-1',
      userId: 'user-1',
      createdAt: '2026-08-31T08:00:00.000Z',
      fileData: 'must-not-be-retained',
      mimeType: 'image/jpeg' as const,
      month: 8,
      year: 2026,
    };

    expect(sanitizePayslipMetadata(unsafeRecord)).not.toHaveProperty('fileData');
    expect(retainUploadedPayslipMetadata([], {
      success: true,
      payslip: unsafeRecord,
      replaced: false,
    })).toEqual([{
      id: 'payslip-1',
      userId: 'user-1',
      createdAt: '2026-08-31T08:00:00.000Z',
      mimeType: 'image/jpeg',
      month: 8,
      year: 2026,
    }]);
  });

  it('accepts the transport-safe image boundary and rejects one extra character', () => {
    expect(getPayslipFileDataError('x'.repeat(7_000_000))).toBeNull();
    expect(getPayslipFileDataError('x'.repeat(7_000_001))).toBe(
      'L’immagine supera il limite di 7.000.000 caratteri base64. Riduci la dimensione e riprova.',
    );
  });
});
