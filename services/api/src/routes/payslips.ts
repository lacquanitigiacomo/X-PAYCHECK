import { randomUUID } from 'crypto';
import { Router } from 'express';
import type { Response } from 'express';
import { payslipUploadSchema } from '@x-paycheck/shared';
import { authenticate } from '../middleware/authenticate';
import type { AuthRequest } from '../middleware/authenticate';
import { prototypeStore } from '../store/prototypeStore';

const router = Router();

type StoredPayslip = ReturnType<typeof prototypeStore.savePayslip>;
export type PayslipMetadata = Omit<StoredPayslip, 'fileData'>;

function toPayslipMetadata(payslip: StoredPayslip): PayslipMetadata {
  return {
    id: payslip.id,
    userId: payslip.userId,
    createdAt: payslip.createdAt,
    mimeType: payslip.mimeType,
    month: payslip.month,
    year: payslip.year,
  };
}

export type PayslipUploadSuccess = {
  success: true;
  payslip: PayslipMetadata;
  replaced: boolean;
};

export function createPayslipUploadHandler(
  formatSuccess: (result: PayslipUploadSuccess) => unknown = result => result,
) {
  return (req: AuthRequest, res: Response) => {
    const parsed = payslipUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload cedolino non valido', details: parsed.error.flatten() });
    }

    const userId = req.user!.userId;
    const existingPayslips = prototypeStore.listPayslips(userId);
    const existingPayslip = existingPayslips[0];
    const isFree = req.user!.tier === 'free';

    if (isFree && existingPayslip && !parsed.data.confirmReplace) {
      return res.status(409).json({
        error: 'FREE_REPLACE_CONFIRMATION_REQUIRED',
        existingPayslip: toPayslipMetadata(existingPayslip),
      });
    }

    const { fileData, mimeType, month, year } = parsed.data;
    const replaced = isFree && existingPayslips.length > 0;
    const payslip = prototypeStore.savePayslip({
      id: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      fileData,
      mimeType,
      month,
      year,
    }, replaced);

    return res.json(formatSuccess({ success: true, payslip: toPayslipMetadata(payslip), replaced }));
  };
}

export const handlePayslipUpload = createPayslipUploadHandler();

router.post('/', authenticate, handlePayslipUpload);

router.get('/', authenticate, (req: AuthRequest, res) => {
  return res.json({ items: prototypeStore.listPayslips(req.user!.userId).map(toPayslipMetadata) });
});

export { router as payslipRouter };
