import { Router } from 'express';
import { authenticate, requirePro } from '../middleware/authenticate';
import { runAudit } from '@x-paycheck/audit-core';
import { cedolinoSchema } from '@x-paycheck/shared';
import { randomUUID } from 'crypto';

const router = Router();

const checkpoints: any[] = [];

interface WorkProfile {
  ccnl: string | null;
  hasPayslips: boolean;
  hasHours: boolean;
  onboardingComplete: boolean;
}

// In-memory store keyed by userId — coerente con il pattern esistente
// (vedi `users` in routes/auth.ts): si perde al riavvio, la persistenza
// su DB è lavoro separato.
const workProfiles = new Map<string, WorkProfile>();

const knowledgeManifest = {
  files: [
    { ccnl_id: 'COMMERCIO_2024', version: '3', hash: 'sha256-demo-comm-3', filename: 'COMMERCIO_2024_rev3.md' },
    { ccnl_id: 'METALMECCANICI_2025', version: '1', hash: 'sha256-demo-metal-1', filename: 'METALMECCANICI_2025_rev1.md' }
  ],
  releasedAt: new Date().toISOString()
};

router.get('/dashboard', authenticate, (req, res) => {
  res.json({
    message: 'Benvenuto nella dashboard X-PAY CHECK',
    stats: { totalAudits: 0, pending: 0, completed: 0, savings: 0 },
    features: ['AI Audit', 'Budget Tracker', 'Expense Scanner', 'Report Generator'],
  });
});

router.get('/user/profile', authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});

router.delete('/auth/account', authenticate, (_req, res) => {
  res.json({ success: true, message: 'Account deletion richiesta (mock GDPR flow)' });
});

router.get('/license/status', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ tier: user?.tier || 'free', status: 'active', expiresAt: null });
});

router.post('/license/validate', authenticate, (req, res) => {
  const { platform, receipt } = req.body;
  if (!platform || !receipt) return res.status(400).json({ error: 'platform e receipt obbligatori' });
  res.json({ success: true, tier: 'pro', status: 'active', message: 'Receipt validata (mock server-side)' });
});

router.post('/license/restore', authenticate, (_req, res) => {
  res.json({ success: true, restored: true, tier: 'pro' });
});

router.get('/knowledge/manifest', (_req, res) => {
  res.json(knowledgeManifest);
});

router.get('/knowledge/download/:ccnl_id/:version', authenticate, (req, res) => {
  const { ccnl_id, version } = req.params;
  res.type('text/markdown').send(`---\nccnl_id: "${ccnl_id}"\nversion: "${version}"\n---\n\n# ${ccnl_id} rev ${version}\n\nContenuto knowledge di esempio.`);
});

router.get('/knowledge/diff', authenticate, (req, res) => {
  const etag = req.headers['if-none-match'];
  const currentTag = 'knowledge-manifest-v1';
  if (etag === currentTag) return res.status(304).send();
  res.setHeader('ETag', currentTag);
  res.json({ changed: knowledgeManifest.files });
});

router.post('/backup/checkpoint', authenticate, requirePro, (req, res) => {
  const item = { id: randomUUID(), userId: (req as any).user.userId, createdAt: new Date().toISOString(), ...req.body };
  checkpoints.push(item);
  res.status(201).json({ success: true, checkpoint: item });
});

router.get('/backup/checkpoint', authenticate, requirePro, (req, res) => {
  const userId = (req as any).user.userId;
  res.json({ items: checkpoints.filter(c => c.userId === userId) });
});

router.delete('/backup/checkpoint/:id', authenticate, requirePro, (req, res) => {
  const idx = checkpoints.findIndex(c => c.id === req.params.id && c.userId === (req as any).user.userId);
  if (idx < 0) return res.status(404).json({ error: 'Checkpoint non trovato' });
  checkpoints.splice(idx, 1);
  res.json({ success: true });
});

// === CCNL & Work Data ===
router.post('/user/work-profile', authenticate, (req, res) => {
  const { ccnl, hasPayslips, hasHours } = req.body;
  const userId = (req as any).user.userId;
  const workProfile: WorkProfile = {
    ccnl: ccnl ?? null,
    hasPayslips: !!hasPayslips,
    hasHours: !!hasHours,
    onboardingComplete: !!(ccnl && hasPayslips !== undefined && hasHours !== undefined),
  };
  // In production: save to DB — per ora persistito in memoria per userId.
  workProfiles.set(userId, workProfile);
  res.json({ success: true, workProfile });
});

router.get('/user/work-profile', authenticate, (req, res) => {
  const userId = (req as any).user.userId;
  // In production: fetch from DB — per ora letto dallo store in memoria.
  const workProfile: WorkProfile = workProfiles.get(userId) ?? {
    ccnl: null,
    hasPayslips: false,
    hasHours: false,
    onboardingComplete: false,
  };
  res.json(workProfile);
});

router.post('/upload/hours', authenticate, (req, res) => {
  const { month, year, entries } = req.body;
  const totalHours = entries?.reduce((s: number, e: any) => s + (e.hours || 0), 0) || 160;
  res.json({
    success: true,
    message: 'Orari ricevuti',
    fileId: randomUUID(),
    summary: {
      totalHours,
      entries: entries || [],
      month,
      year,
    },
  });
});

// === AI-powered verification ===
router.post('/audit/run', authenticate, (req, res) => {
  const parsed = cedolinoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Payload cedolino non valido', details: parsed.error.flatten() });
  const report = runAudit(parsed.data);
  res.json(report);
});

export { router as apiRouter };
