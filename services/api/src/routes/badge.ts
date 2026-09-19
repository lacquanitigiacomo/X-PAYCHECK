import { randomUUID } from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { badgeCorrectionSchema } from '@x-paycheck/shared';
import { authenticate, requirePro } from '../middleware/authenticate';
import type { AuthRequest } from '../middleware/authenticate';
import { prototypeStore } from '../store/prototypeStore';

const router = Router();
const emptyPayloadSchema = z.object({}).strict();

function rejectUnexpectedPayload(body: unknown) {
  return emptyPayloadSchema.safeParse(body ?? {});
}

router.use(authenticate, requirePro);

router.post('/start', (req: AuthRequest, res) => {
  if (!rejectUnexpectedPayload(req.body).success) {
    return res.status(400).json({ error: 'Badge start does not accept location or other payload data' });
  }

  const existingShift = prototypeStore.getOpenBadgeShift(req.user!.userId);
  if (existingShift) return res.status(409).json({ error: 'OPEN_BADGE_SHIFT_EXISTS', shift: existingShift });

  const shift = prototypeStore.startBadgeShift({
    id: randomUUID(),
    userId: req.user!.userId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    corrections: [],
  });
  return res.status(201).json({ shift });
});

router.post('/stop', (req: AuthRequest, res) => {
  if (!rejectUnexpectedPayload(req.body).success) {
    return res.status(400).json({ error: 'Badge stop does not accept location or other payload data' });
  }

  const openShift = prototypeStore.getOpenBadgeShift(req.user!.userId);
  if (!openShift) return res.status(409).json({ error: 'NO_OPEN_BADGE_SHIFT' });

  const endedAt = new Date(Math.max(Date.now(), Date.parse(openShift.startedAt) + 1)).toISOString();
  const shift = prototypeStore.stopOpenBadgeShift(req.user!.userId, endedAt)!;
  return res.json({ shift });
});

router.patch('/shifts/:id', (req: AuthRequest, res) => {
  const parsed = badgeCorrectionSchema.strict().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid badge correction' });
  }

  if (parsed.data.endedAt && Date.parse(parsed.data.endedAt) <= Date.parse(parsed.data.startedAt)) {
    return res.status(400).json({ error: 'Badge end must be after badge start' });
  }

  const openShift = prototypeStore.getOpenBadgeShift(req.user!.userId);
  if (parsed.data.endedAt === null && openShift && openShift.id !== req.params.id) {
    return res.status(409).json({ error: 'OPEN_BADGE_SHIFT_EXISTS', shift: openShift });
  }

  const shift = prototypeStore.correctBadgeShift(
    req.user!.userId,
    req.params.id,
    parsed.data,
    new Date().toISOString(),
  );
  if (!shift) return res.status(404).json({ error: 'Badge shift not found' });

  return res.json({ shift });
});

router.get('/state', (req: AuthRequest, res) => {
  return res.json({
    shift: prototypeStore.getOpenBadgeShift(req.user!.userId) ?? null,
    items: prototypeStore.listBadgeShifts(req.user!.userId),
  });
});

export { router as badgeRouter };
