import request from 'supertest';

const API_URL = 'http://localhost:3001';

describe('API Integration', () => {
  it('GET /health returns ok', async () => {
    const res = await request(API_URL).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/auth/register creates user', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/register')
      .send({ name: 'Int Test', email: `int${Date.now()}@x-paycheck.local`, password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });
});
