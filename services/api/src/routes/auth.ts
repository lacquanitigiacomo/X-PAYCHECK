import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { loginSchema, registerSchema } from '@x-paycheck/shared';
import type { PlanTier } from '@x-paycheck/shared';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getJwtSecret } from '../config';
import { PrototypeUser, prototypeStore } from '../store/prototypeStore';

const router = Router();

const refreshTokens = new Set<string>();

const magicLinkSchema = z.object({ email: z.string().email() });
const socialSchema = z.object({
  provider: z.literal('google'),
  idToken: z.string().min(10),
  tier: z.enum(['free', 'pro']),
  intent: z.enum(['register', 'login']).default('register'),
});

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};

function signAccessToken(payload: { userId: string; email: string }) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  const options: SignOptions = {
    expiresIn,
  };
  return jwt.sign(payload, getJwtSecret(), options);
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
  };
}

function accountForRequestedTier(input: {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  picture?: string;
  tier: PlanTier;
}): PrototypeUser {
  const isProPending = input.tier === 'pro';
  return {
    id: input.id,
    email: input.email,
    passwordHash: input.passwordHash,
    name: input.name,
    ...(input.picture ? { picture: input.picture } : {}),
    tier: 'free',
    pendingTier: isProPending ? 'pro' : null,
    billingCycle: null,
    checkoutStatus: isProPending ? 'pending' : 'not_required',
    onboardingComplete: false,
    workProfile: null,
  };
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { email, password, name, tier } = parsed.data;
  const existing = prototypeStore.findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashed = await bcrypt.hash(password, 12);
  const user = prototypeStore.createUser(accountForRequestedTier({
    id: randomUUID(), email, passwordHash: hashed, name, tier,
  }));

  const token = signAccessToken({ userId: user.id, email });

  res.status(201).json({ token, user: accountState(user) });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const user = prototypeStore.findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signAccessToken({ userId: user.id, email });

  res.json({ token, user: accountState(user) });
});

router.post('/magic-link', (req, res) => {
  const parsed = magicLinkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });
  const { email } = parsed.data;
  const token = jwt.sign({ email, type: 'magic-link' }, getJwtSecret(), { expiresIn: '15m' });
  res.json({ success: true, message: 'Magic link generato (mock)', token });
});

router.post('/magic-link/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token mancante' });
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const user = prototypeStore.findUserByEmail(decoded.email) || prototypeStore.createUser(accountForRequestedTier({
      id: randomUUID(),
      email: decoded.email,
      passwordHash: '',
      name: decoded.email.split('@')[0],
      tier: 'free',
    }));
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email, type: 'refresh' }, getJwtSecret(), { expiresIn: '30d' });
    refreshTokens.add(refreshToken);
    res.json({ token: accessToken, refreshToken, user: accountState(user) });
  } catch {
    return res.status(401).json({ error: 'Magic link non valido o scaduto' });
  }
});

router.post('/social', async (req, res) => {
  const parsed = socialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload social incompleto', details: parsed.error.flatten() });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID non configurato' });
  }

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.idToken)}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Token Google non valido' });
    }

    const payload = await response.json() as GoogleTokenInfo;

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Token Google emesso per un client diverso' });
    }

    if (!payload.email || payload.email_verified !== true && payload.email_verified !== 'true') {
      return res.status(401).json({ error: 'Account Google non verificato' });
    }

    let user = prototypeStore.findUserByEmail(payload.email);
    if (!user && parsed.data.intent === 'login') {
      return res.status(404).json({
        error: 'Account Google non registrato',
        code: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
      });
    }
    if (!user) {
      user = prototypeStore.createUser(accountForRequestedTier({
        id: payload.sub || randomUUID(),
        email: payload.email,
        passwordHash: '',
        name: payload.name || payload.given_name || payload.email.split('@')[0],
        picture: payload.picture,
        tier: parsed.data.tier,
      }));
    }

    const token = signAccessToken({ userId: user.id, email: user.email });
    res.json({
      token,
      provider: 'google',
      user: accountState(user),
    });
  } catch {
    return res.status(401).json({ error: 'Token Google non valido' });
  }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Refresh token non valido' });
  try {
    const decoded = jwt.verify(refreshToken, getJwtSecret()) as any;
    const user = prototypeStore.getUser(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Refresh token non valido' });
    const token = signAccessToken({ userId: user.id, email: user.email });
    return res.json({ token });
  } catch {
    return res.status(401).json({ error: 'Refresh token scaduto' });
  }
});

export { router as authRouter };
