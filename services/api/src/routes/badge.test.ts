import request from 'supertest';
import { createApp } from '../app';
import { prototypeStore } from '../store/prototypeStore';

const app = createApp({ NODE_ENV: 'test', JWT_SECRET: 'test-only-secret' });

jest.setTimeout(30_000);

async function register(tier: 'free' | 'pro', email: string) {
  const registration = await request(app).post('/api/v1/auth/register').send({
    name: 'Ada Rossi',
    email,
    password: 'password123',
    tier,
  });
  const auth = { Authorization: `Bearer ${registration.body.token}` };

  if (tier === 'pro') {
    await request(app)
      .post('/api/v1/account/checkout')
      .set(auth)
      .send({ tier: 'pro', billingCycle: 'monthly' });
  }

  return auth;
}

describe('badge routes', () => {
  beforeEach(() => {
    prototypeStore.reset();
  });

  it('rejects every badge operation for a Free account', async () => {
    const auth = await register('free', 'free-badge@example.it');

    for (const response of await Promise.all([
      request(app).post('/api/v1/badge/start').set(auth),
      request(app).post('/api/v1/badge/stop').set(auth),
      request(app).patch('/api/v1/badge/shifts/shift-id').set(auth).send({
        startedAt: '2026-08-31T08:00:00.000Z',
        endedAt: '2026-08-31T16:00:00.000Z',
        reason: 'Fix manual entry',
      }),
      request(app).get('/api/v1/badge/state').set(auth),
    ])) {
      expect(response.status).toBe(403);
    }
  });

  it('starts one open shift for a Pro account and returns it from state', async () => {
    const auth = await register('pro', 'pro-start@example.it');

    const start = await request(app).post('/api/v1/badge/start').set(auth);
    const state = await request(app).get('/api/v1/badge/state').set(auth);

    expect(start.status).toBe(201);
    expect(start.body.shift).toMatchObject({ userId: expect.any(String), endedAt: null, corrections: [] });
    expect(start.body.shift.startedAt).toEqual(expect.any(String));
    expect(state.body).toEqual({ shift: start.body.shift, items: [start.body.shift] });
  });

  it('returns persisted shift history scoped to the authenticated Pro account', async () => {
    const firstAuth = await register('pro', 'pro-history-first@example.it');
    const secondAuth = await register('pro', 'pro-history-second@example.it');
    const firstStart = await request(app).post('/api/v1/badge/start').set(firstAuth);
    const firstStop = await request(app).post('/api/v1/badge/stop').set(firstAuth);
    const secondStart = await request(app).post('/api/v1/badge/start').set(secondAuth);

    const firstState = await request(app).get('/api/v1/badge/state').set(firstAuth);

    expect(firstState.status).toBe(200);
    expect(firstState.body).toEqual({ shift: null, items: [firstStop.body.shift] });
    expect(firstState.body.items).not.toContainEqual(secondStart.body.shift);
    expect(firstState.body.items[0].id).toBe(firstStart.body.shift.id);
  });

  it('rejects a second start and returns the already open shift without auto-closing it', async () => {
    const auth = await register('pro', 'pro-conflict@example.it');
    const first = await request(app).post('/api/v1/badge/start').set(auth);

    const second = await request(app).post('/api/v1/badge/start').set(auth);
    const state = await request(app).get('/api/v1/badge/state').set(auth);

    expect(second.status).toBe(409);
    expect(second.body.shift).toEqual(first.body.shift);
    expect(state.body.shift).toEqual(first.body.shift);
    expect(state.body.shift.endedAt).toBeNull();
  });

  it('does not reopen a corrected historical shift while another shift is open', async () => {
    const auth = await register('pro', 'pro-one-open@example.it');
    const first = await request(app).post('/api/v1/badge/start').set(auth);
    await request(app).post('/api/v1/badge/stop').set(auth);
    const second = await request(app).post('/api/v1/badge/start').set(auth);

    const correction = await request(app)
      .patch(`/api/v1/badge/shifts/${first.body.shift.id}`)
      .set(auth)
      .send({
        startedAt: first.body.shift.startedAt,
        endedAt: null,
        reason: 'Corrected open manual shift',
      });

    expect(correction.status).toBe(409);
    expect(correction.body.shift).toEqual(second.body.shift);
  });

  it('stops the open shift and rejects a later stop', async () => {
    const auth = await register('pro', 'pro-stop@example.it');
    const start = await request(app).post('/api/v1/badge/start').set(auth);

    const stop = await request(app).post('/api/v1/badge/stop').set(auth);
    const secondStop = await request(app).post('/api/v1/badge/stop').set(auth);

    expect(stop.status).toBe(200);
    expect(stop.body.shift).toMatchObject({ id: start.body.shift.id, startedAt: start.body.shift.startedAt });
    expect(stop.body.shift.endedAt).toEqual(expect.any(String));
    expect(new Date(stop.body.shift.endedAt).getTime()).toBeGreaterThanOrEqual(new Date(start.body.shift.startedAt).getTime());
    expect(secondStop.status).toBe(409);
  });

  it('records immutable previous values when correcting a shift', async () => {
    const auth = await register('pro', 'pro-correction@example.it');
    const start = await request(app).post('/api/v1/badge/start').set(auth);
    const stop = await request(app).post('/api/v1/badge/stop').set(auth);
    const correctedStartedAt = '2026-08-30T08:30:00.000Z';
    const correctedEndedAt = '2026-08-30T16:30:00.000Z';

    const correction = await request(app)
      .patch(`/api/v1/badge/shifts/${start.body.shift.id}`)
      .set(auth)
      .send({ startedAt: correctedStartedAt, endedAt: correctedEndedAt, reason: 'Corrected manual timesheet' });

    expect(correction.status).toBe(200);
    expect(correction.body.shift).toMatchObject({ startedAt: correctedStartedAt, endedAt: correctedEndedAt });
    expect(correction.body.shift.corrections).toEqual([
      expect.objectContaining({
        previousStartedAt: start.body.shift.startedAt,
        previousEndedAt: stop.body.shift.endedAt,
        reason: 'Corrected manual timesheet',
        correctedAt: expect.any(String),
      }),
    ]);
  });

  it('rejects location data and never returns latitude or longitude fields', async () => {
    const auth = await register('pro', 'pro-privacy@example.it');

    const start = await request(app)
      .post('/api/v1/badge/start')
      .set(auth)
      .send({ latitude: 45.4, longitude: 11.8 });
    const validStart = await request(app).post('/api/v1/badge/start').set(auth);
    const correction = await request(app)
      .patch(`/api/v1/badge/shifts/${validStart.body.shift.id}`)
      .set(auth)
      .send({
        startedAt: '2026-08-30T08:30:00.000Z',
        endedAt: null,
        reason: 'Corrected manual start',
        latitude: 45.4,
        longitude: 11.8,
      });
    const state = await request(app).get('/api/v1/badge/state').set(auth);

    expect(start.status).toBe(400);
    expect(correction.status).toBe(400);
    expect(JSON.stringify([start.body, validStart.body, correction.body, state.body])).not.toMatch(/latitude|longitude/i);
  });
});
