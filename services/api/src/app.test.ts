import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from './app';
import { prototypeStore } from './store/prototypeStore';

jest.setTimeout(30_000);

describe('createApp', () => {
  const app = createApp({ NODE_ENV: 'test', JWT_SECRET: 'test-only-secret' });

  const freeAccountState = {
    tier: 'free',
    pendingTier: null,
    billingCycle: null,
    checkoutStatus: 'not_required',
    onboardingComplete: false,
  };

  beforeEach(() => {
    prototypeStore.reset();
  });

  it('returns the X-PAY CHECK health identity', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', name: 'X-PAY CHECK API' });
  });

  it('rejects invalid registration data', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'A',
      email: 'invalid',
      password: 'short',
    });

    expect(response.status).toBe(400);
  });

  it('registers a free user with incomplete onboarding', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Ada Rossi', email: 'ada@example.it', password: 'password123', tier: 'free',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject(freeAccountState);
  });

  it('does not grant pro before checkout', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Piero Pro', email: 'pro@example.it', password: 'password123', tier: 'pro',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      ...freeAccountState,
      pendingTier: 'pro',
      checkoutStatus: 'pending',
    });
  });

  it('creates a Google account with the selected pending plan', async () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        aud: 'google-client-id',
        sub: 'google-user-id',
        email: 'google@example.it',
        email_verified: true,
        name: 'Google Rossi',
        picture: 'https://example.test/avatar.png',
      }),
    } as Response);

    const response = await request(app).post('/api/v1/auth/social').send({
      provider: 'google', idToken: 'a-valid-google-token', tier: 'pro',
    });

    fetchMock.mockRestore();
    delete process.env.GOOGLE_CLIENT_ID;

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ provider: 'google' });
    expect(response.body.user).toMatchObject({
      ...freeAccountState,
      id: 'google-user-id',
      email: 'google@example.it',
      name: 'Google Rossi',
      picture: 'https://example.test/avatar.png',
      pendingTier: 'pro',
      checkoutStatus: 'pending',
    });
  });

  it('does not create an unknown Google account for an explicit login intent', async () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        aud: 'google-client-id',
        sub: 'unknown-google-user-id',
        email: 'unknown-google@example.it',
        email_verified: true,
        name: 'Unknown Google User',
      }),
    } as Response);

    const response = await request(app).post('/api/v1/auth/social').send({
      provider: 'google', idToken: 'a-valid-google-token', tier: 'free', intent: 'login',
    });

    fetchMock.mockRestore();
    delete process.env.GOOGLE_CLIENT_ID;

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Account Google non registrato',
      code: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
    });
    expect(prototypeStore.findUserByEmail('unknown-google@example.it')).toBeUndefined();
  });

  it('rejects a valid token when its account no longer exists', async () => {
    const token = jwt.sign(
      { userId: 'removed-user', email: 'removed@example.it', tier: 'pro' },
      'test-only-secret',
      { expiresIn: '1h' },
    );

    const response = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid token' });
  });

  it('rejects malformed audit data before authentication succeeds', async () => {
    const response = await request(app).post('/api/v1/audit/run').send({});

    expect(response.status).toBe(401);
  });

  it('persists the work profile saved by POST so GET returns it with onboardingComplete: true', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      password: 'password123',
    });
    expect(registerResponse.status).toBe(201);
    const token = registerResponse.body.token;

    const postResponse = await request(app)
      .post('/api/v1/user/work-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ccnl: 'COMMERCIO_2024', hasPayslips: true, hasHours: true });

    expect(postResponse.status).toBe(200);
    expect(postResponse.body.workProfile).toMatchObject({
      ccnl: 'COMMERCIO_2024',
      hasPayslips: true,
      hasHours: true,
      onboardingComplete: true,
    });

    const getResponse = await request(app)
      .get('/api/v1/user/work-profile')
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual({
      ccnl: 'COMMERCIO_2024',
      hasPayslips: true,
      hasHours: true,
      onboardingComplete: true,
    });
  });

  it('returns a not-onboarded work profile before any POST for a fresh user', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Luigi Verdi',
      email: 'luigi.verdi@example.com',
      password: 'password123',
    });
    const token = registerResponse.body.token;

    const getResponse = await request(app)
      .get('/api/v1/user/work-profile')
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual({
      ccnl: null,
      hasPayslips: false,
      hasHours: false,
      onboardingComplete: false,
    });
  });
});
