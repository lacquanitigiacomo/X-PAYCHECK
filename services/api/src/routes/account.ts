import { Router } from 'express';
import {
  accountProfileUpdateSchema,
  cancelPendingProSchema,
  checkoutSchema,
  workProfileSchema,
} from '@x-paycheck/shared';
import type { PrototypeUser } from '../store/prototypeStore';
import { prototypeStore } from '../store/prototypeStore';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

const prices = { monthly: 299, yearly: 2499, lifetime: 4999 } as const;

function nextStep(user: PrototypeUser): 'checkout' | 'onboarding' | 'dashboard' {
  if (user.pendingTier === 'pro' || user.checkoutStatus === 'pending') return 'checkout';
  if (!user.onboardingComplete) return 'onboarding';
  return 'dashboard';
}

function accountState(user: PrototypeUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    ...(user.picture ? { picture: user.picture } : {}),
    tier: user.tier,
    pendingTier: user.pendingTier,
    billingCycle: user.billingCycle,
    checkoutStatus: user.checkoutStatus,
    onboardingComplete: user.onboardingComplete,
    nextStep: nextStep(user),
  };
}

router.post('/checkout', authenticate, (req: AuthRequest, res) => {
  const parsed = checkoutSchema.strict().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid checkout', details: parsed.error.flatten() });
  }

  const user = prototypeStore.activatePro(req.user!.userId, parsed.data.billingCycle);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  return res.json({
    tier: 'pro',
    billingCycle: parsed.data.billingCycle,
    checkoutStatus: 'complete',
    amountCents: prices[parsed.data.billingCycle],
  });
});

router.get('/state', authenticate, (req: AuthRequest, res) => {
  const user = prototypeStore.getUser(req.user!.userId);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  return res.json(accountState(user));
});

router.patch('/profile', authenticate, (req: AuthRequest, res) => {
  const parsed = accountProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid profile update', details: parsed.error.flatten() });
  }

  const user = prototypeStore.updateProfile(req.user!.userId, parsed.data);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  return res.json(accountState(user));
});

router.post('/pending-plan/cancel', authenticate, (req: AuthRequest, res) => {
  const parsed = cancelPendingProSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid pending plan cancellation', details: parsed.error.flatten() });
  }

  const currentUser = prototypeStore.getUser(req.user!.userId);
  if (!currentUser) return res.status(401).json({ error: 'Invalid token' });
  if (currentUser.tier === 'free'
    && currentUser.pendingTier === null
    && currentUser.checkoutStatus === 'not_required') {
    return res.json(accountState(currentUser));
  }
  if (currentUser.pendingTier !== 'pro' || currentUser.checkoutStatus !== 'pending') {
    return res.status(409).json({ error: 'No pending Pro plan' });
  }

  const user = prototypeStore.cancelPendingPro(currentUser.id);
  return res.json(accountState(user!));
});

router.put('/work-profile', authenticate, (req: AuthRequest, res) => {
  const parsed = workProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid work profile', details: parsed.error.flatten() });
  }

  const currentUser = prototypeStore.getUser(req.user!.userId);
  if (!currentUser) return res.status(401).json({ error: 'Invalid token' });
  if (currentUser.tier === 'free' && parsed.data.badgeEnabled) {
    return res.status(403).json({ error: 'Badge tracking requires Pro' });
  }

  const user = prototypeStore.saveWorkProfile(currentUser.id, parsed.data);
  return res.json(accountState(user!));
});

export { router as accountRouter };
