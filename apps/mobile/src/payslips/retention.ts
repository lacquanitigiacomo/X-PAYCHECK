import type { PlanTier } from '../navigation/routes';

type IdentifiablePayslip = { id: string };

export type PayslipMimeType = 'application/pdf' | 'image/jpeg' | 'image/png';

export type PayslipUploadDraft = {
  fileData: string;
  mimeType: PayslipMimeType;
  month: number;
  year: number;
};

export type PayslipUploadBody = PayslipUploadDraft & {
  confirmReplace: boolean;
};

export type PayslipRecord = Omit<PayslipUploadDraft, 'fileData'> & {
  id: string;
  userId: string;
  createdAt: string;
};

export type PayslipUploadResult = {
  success: true;
  payslip: PayslipRecord;
  replaced: boolean;
};

export const MAX_PAYSLIP_BASE64_CHARS = 7_000_000;

export function requiresReplacementConfirmation(
  tier: PlanTier,
  items: readonly IdentifiablePayslip[],
): boolean {
  return tier === 'free' && items.length > 0;
}

export function withReplacementConfirmation(
  upload: PayslipUploadDraft,
  confirmed: boolean,
): PayslipUploadBody {
  return { ...upload, confirmReplace: confirmed };
}

export function sanitizePayslipMetadata(
  record: PayslipRecord & { fileData?: string },
): PayslipRecord {
  return {
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt,
    mimeType: record.mimeType,
    month: record.month,
    year: record.year,
  };
}

export function retainUploadedPayslipMetadata(
  current: readonly PayslipRecord[],
  result: PayslipUploadResult,
): PayslipRecord[] {
  const payslip = sanitizePayslipMetadata(result.payslip);
  return result.replaced
    ? [payslip]
    : [...current.filter(item => item.id !== payslip.id), payslip];
}

export function getPayslipFileDataError(fileData: string): string | null {
  return fileData.length <= MAX_PAYSLIP_BASE64_CHARS
    ? null
    : 'L’immagine supera il limite di 7.000.000 caratteri base64. Riduci la dimensione e riprova.';
}
