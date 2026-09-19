import { describe, expect, it } from 'vitest';
import { uploadPayslipWithFreeReplacementConfirmation } from './payslipUpload';

const request = {
  fileData: 'encoded-payslip',
  mimeType: 'application/pdf',
  month: 8,
  year: 2026,
};

const replacementRequired = {
  response: {
    status: 409,
    data: { error: 'FREE_REPLACE_CONFIRMATION_REQUIRED' },
  },
};

describe('uploadPayslipWithFreeReplacementConfirmation', () => {
  it('retries once with confirmation after the user accepts a Free replacement', async () => {
    const attempts: Array<typeof request & { confirmReplace?: boolean }> = [];
    const upload = async (payload: typeof request & { confirmReplace?: boolean }) => {
      attempts.push(payload);
      if (attempts.length === 1) throw replacementRequired;
      return { extracted: { month: 8, year: 2026 } };
    };

    const result = await uploadPayslipWithFreeReplacementConfirmation({
      request,
      upload,
      confirmReplacement: () => true,
    });

    expect(result).toEqual({ status: 'uploaded', response: { extracted: { month: 8, year: 2026 } } });
    expect(attempts).toEqual([
      request,
      { ...request, confirmReplace: true },
    ]);
  });

  it('keeps the existing Free payslip when the user declines replacement', async () => {
    const attempts: Array<typeof request & { confirmReplace?: boolean }> = [];
    const upload = async (payload: typeof request & { confirmReplace?: boolean }) => {
      attempts.push(payload);
      throw replacementRequired;
    };

    const result = await uploadPayslipWithFreeReplacementConfirmation({
      request,
      upload,
      confirmReplacement: () => false,
    });

    expect(result).toEqual({ status: 'replacement_cancelled' });
    expect(attempts).toEqual([request]);
  });
});
