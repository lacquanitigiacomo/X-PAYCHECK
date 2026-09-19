import request from 'supertest';
import { createApp } from '../app';
import { prototypeStore } from '../store/prototypeStore';

const app = createApp({ NODE_ENV: 'test', JWT_SECRET: 'test-only-secret' });

jest.setTimeout(30_000);

const completeWorkProfile = {
  ccnl: 'CCNL-COMMERCIO',
  weeklyHours: 40,
  schedule: [
    { day: 1, enabled: true, start: '09:00', end: '18:00' },
    { day: 2, enabled: true, start: '09:00', end: '18:00' },
    { day: 3, enabled: true, start: '09:00', end: '18:00' },
    { day: 4, enabled: true, start: '09:00', end: '18:00' },
    { day: 5, enabled: true, start: '09:00', end: '18:00' },
    { day: 6, enabled: false, start: null, end: null },
    { day: 7, enabled: false, start: null, end: null },
  ],
  badgeEnabled: false,
};

describe('account routes', () => {
  beforeEach(() => {
    prototypeStore.reset();
  });

  async function register(tier: 'free' | 'pro' = 'pro') {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Ada Rossi',
      email: 'ada@example.it',
      password: 'password123',
      tier,
    });

    return { Authorization: `Bearer ${response.body.token}` };
  }

  it.each([
    ['monthly', 299],
    ['yearly', 2499],
    ['lifetime', 4999],
  ] as const)('completes a %s Pro checkout at %i cents', async (billingCycle, amountCents) => {
    const auth = await register();

    const response = await request(app)
      .post('/api/v1/account/checkout')
      .set(auth)
      .send({ tier: 'pro', billingCycle });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tier: 'pro', billingCycle, checkoutStatus: 'complete', amountCents });
  });

  it('rejects checkout requests containing card data', async () => {
    const auth = await register();

    const response = await request(app)
      .post('/api/v1/account/checkout')
      .set(auth)
      .send({
        tier: 'pro',
        billingCycle: 'monthly',
        cardNumber: '4242424242424242',
        cvv: '123',
      });

    expect(response.status).toBe(400);
  });

  it('keeps a pending Pro account on the checkout step', async () => {
    const auth = await register();

    const response = await request(app).get('/api/v1/account/state').set(auth);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ tier: 'free', pendingTier: 'pro', nextStep: 'checkout' });
  });

  it('rejects a work profile with fewer than seven days', async () => {
    const auth = await register('free');

    const response = await request(app)
      .put('/api/v1/account/work-profile')
      .set(auth)
      .send({ ...completeWorkProfile, schedule: completeWorkProfile.schedule.slice(0, 6) });

    expect(response.status).toBe(400);
  });

  it('forbids badge tracking for a Free account', async () => {
    const auth = await register('free');

    const response = await request(app)
      .put('/api/v1/account/work-profile')
      .set(auth)
      .send({ ...completeWorkProfile, badgeEnabled: true });

    expect(response.status).toBe(403);
  });

  it('resumes onboarding and reaches the dashboard after a valid work profile', async () => {
    const auth = await register();

    await request(app)
      .post('/api/v1/account/checkout')
      .set(auth)
      .send({ tier: 'pro', billingCycle: 'monthly' });

    const onboardingState = await request(app).get('/api/v1/account/state').set(auth);
    expect(onboardingState.body).toMatchObject({ tier: 'pro', nextStep: 'onboarding' });

    const response = await request(app)
      .put('/api/v1/account/work-profile')
      .set(auth)
      .send(completeWorkProfile);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ onboardingComplete: true, nextStep: 'dashboard' });
  });

  it('persists editable profile fields through checkout and account refresh', async () => {
    const auth = await register();

    const profileResponse = await request(app)
      .patch('/api/v1/account/profile')
      .set(auth)
      .send({ name: 'Ada Aggiornata', picture: 'https://example.test/ada-new.png' });

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body).toMatchObject({
      name: 'Ada Aggiornata',
      email: 'ada@example.it',
      picture: 'https://example.test/ada-new.png',
      nextStep: 'checkout',
    });

    await request(app)
      .post('/api/v1/account/checkout')
      .set(auth)
      .send({ tier: 'pro', billingCycle: 'monthly' });

    const refreshed = await request(app).get('/api/v1/account/state').set(auth);
    expect(refreshed.body).toMatchObject({
      name: 'Ada Aggiornata',
      email: 'ada@example.it',
      picture: 'https://example.test/ada-new.png',
      tier: 'pro',
      nextStep: 'onboarding',
    });
  });

  it('rejects attempts to replace the provider-verified email', async () => {
    const auth = await register();

    const response = await request(app)
      .patch('/api/v1/account/profile')
      .set(auth)
      .send({
        name: 'Ada Aggiornata',
        picture: null,
        email: 'changed@example.it',
      });

    expect(response.status).toBe(400);
  });

  it('cancels a pending Pro plan back to Free onboarding state', async () => {
    const auth = await register();

    const response = await request(app)
      .post('/api/v1/account/pending-plan/cancel')
      .set(auth)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      tier: 'free',
      pendingTier: null,
      billingCycle: null,
      checkoutStatus: 'not_required',
      nextStep: 'onboarding',
    });

    const refreshed = await request(app).get('/api/v1/account/state').set(auth);
    expect(refreshed.body).toMatchObject({
      tier: 'free',
      pendingTier: null,
      checkoutStatus: 'not_required',
      nextStep: 'onboarding',
    });
  });

  it('rejects cancellation payloads with extra fields', async () => {
    const auth = await register();

    const response = await request(app)
      .post('/api/v1/account/pending-plan/cancel')
      .set(auth)
      .send({ reason: 'changed mind' });

    expect(response.status).toBe(400);
  });

  it('treats cancellation as idempotent for an already-Free account', async () => {
    const auth = await register('free');

    const response = await request(app)
      .post('/api/v1/account/pending-plan/cancel')
      .set(auth)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      tier: 'free',
      pendingTier: null,
      checkoutStatus: 'not_required',
      nextStep: 'onboarding',
    });
  });

  it('does not alter an already completed Pro plan', async () => {
    const auth = await register();
    await request(app)
      .post('/api/v1/account/checkout')
      .set(auth)
      .send({ tier: 'pro', billingCycle: 'yearly' });

    const response = await request(app)
      .post('/api/v1/account/pending-plan/cancel')
      .set(auth)
      .send({});

    expect(response.status).toBe(409);

    const refreshed = await request(app).get('/api/v1/account/state').set(auth);
    expect(refreshed.body).toMatchObject({
      tier: 'pro',
      pendingTier: null,
      billingCycle: 'yearly',
      checkoutStatus: 'complete',
    });
  });
});
