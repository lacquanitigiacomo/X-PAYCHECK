import request from 'supertest';
import { createApp } from '../app';
import { prototypeStore } from '../store/prototypeStore';

const app = createApp({ NODE_ENV: 'test', JWT_SECRET: 'test-only-secret' });

jest.setTimeout(30_000);

const firstFreePayslip = {
  fileData: 'first-payslip',
  mimeType: 'application/pdf',
  month: 1,
  year: 2026,
};

function payslipFor(month: number, confirmReplace = false) {
  return { ...firstFreePayslip, fileData: `payslip-${month}`, month, confirmReplace };
}

describe('payslip routes', () => {
  beforeEach(() => {
    prototypeStore.reset();
  });

  async function register(tier: 'free' | 'pro', email: string) {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Ada Rossi',
      email,
      password: 'password123',
      tier,
    });

    if (tier === 'pro') {
      await request(app)
        .post('/api/v1/account/checkout')
        .set({ Authorization: `Bearer ${response.body.token}` })
        .send({ tier: 'pro', billingCycle: 'monthly' });
    }

    return { Authorization: `Bearer ${response.body.token}` };
  }

  async function upload(auth: Record<string, string>, payload: Record<string, unknown>) {
    return request(app).post('/api/v1/payslips').set(auth).send(payload);
  }

  async function uploadLegacy(auth: Record<string, string>, payload: Record<string, unknown>) {
    return request(app).post('/api/v1/upload/payslip').set(auth).send(payload);
  }

  async function list(auth: Record<string, string>) {
    return request(app).get('/api/v1/payslips').set(auth);
  }

  it('keeps the old Free payslip until valid replacement is confirmed', async () => {
    const auth = await register('free', 'free@example.it');

    const initialUpload = await upload(auth, payslipFor(1));
    expect(initialUpload.body).toMatchObject({ success: true, replaced: false });
    expect(initialUpload.body.payslip).not.toHaveProperty('fileData');

    const conflict = await upload(auth, payslipFor(2));
    expect(conflict.status).toBe(409);
    expect(conflict.body).toMatchObject({
      error: 'FREE_REPLACE_CONFIRMATION_REQUIRED',
      existingPayslip: { month: 1, year: 2026 },
    });
    expect(conflict.body.existingPayslip).not.toHaveProperty('fileData');

    expect((await list(auth)).body.items).toHaveLength(1);

    const replacement = await upload(auth, payslipFor(2, true));
    expect(replacement.body).toMatchObject({ success: true, replaced: true });
    expect(replacement.body.payslip).not.toHaveProperty('fileData');
    const listed = (await list(auth)).body.items;
    expect(listed).toEqual([
      expect.objectContaining({ month: 2, year: 2026 }),
    ]);
    expect(listed[0]).not.toHaveProperty('fileData');
  });

  it('does not replace the existing Free payslip when the new upload is invalid', async () => {
    const auth = await register('free', 'invalid-free@example.it');
    await upload(auth, payslipFor(1));

    const invalidUpload = await upload(auth, { ...payslipFor(2, true), month: 13 });
    expect(invalidUpload.status).toBe(400);
    expect((await list(auth)).body.items).toEqual([
      expect.objectContaining({ month: 1, year: 2026 }),
    ]);
  });

  it('does not expose the removed legacy upload alias', async () => {
    const auth = await register('free', 'legacy-free@example.it');
    expect((await uploadLegacy(auth, payslipFor(1))).status).toBe(404);
    expect((await list(auth)).body.items).toEqual([]);
  });

  it('retains multiple Pro payslips', async () => {
    const auth = await register('pro', 'pro@example.it');

    expect((await upload(auth, payslipFor(1))).body).toMatchObject({ success: true, replaced: false });
    expect((await upload(auth, payslipFor(2))).body).toMatchObject({ success: true, replaced: false });

    const listed = (await list(auth)).body.items;
    expect(listed).toEqual([
      expect.objectContaining({ month: 1, year: 2026 }),
      expect.objectContaining({ month: 2, year: 2026 }),
    ]);
    expect(listed).toHaveLength(2);
    for (const item of listed) expect(item).not.toHaveProperty('fileData');
  });

  it('accepts base64 at the transport-safe boundary without returning document content', async () => {
    const auth = await register('free', 'boundary-upload@example.it');
    const response = await upload(auth, {
      ...payslipFor(8),
      fileData: 'x'.repeat(7_000_000),
    });

    expect(response.status).toBe(200);
    expect(response.body.payslip).toMatchObject({ month: 8, year: 2026 });
    expect(response.body.payslip).not.toHaveProperty('fileData');
    expect((await list(auth)).body.items[0]).not.toHaveProperty('fileData');
  });

  it('rejects base64 larger than the transport-safe schema limit', async () => {
    const auth = await register('free', 'large-upload@example.it');
    const response = await upload(auth, {
      ...payslipFor(8),
      fileData: 'x'.repeat(7_000_001),
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Payload cedolino non valido');
    expect((await list(auth)).body.items).toEqual([]);
  });

  it('lists only payslips belonging to the authenticated user', async () => {
    const firstUser = await register('pro', 'first@example.it');
    const secondUser = await register('pro', 'second@example.it');

    await upload(firstUser, payslipFor(1));
    await upload(secondUser, payslipFor(2));

    expect((await list(firstUser)).body.items).toEqual([
      expect.objectContaining({ month: 1, year: 2026 }),
    ]);
  });
});
