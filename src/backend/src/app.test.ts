import request from 'supertest';
import app from './app';

jest.mock('./lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const prisma = require('./lib/prisma').default;

describe('GET /api/health', () => {
  it('returns 200 with status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});

describe('POST /api/auth/register', () => {
  it('returns 400 when body is incomplete', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when email already in use', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'pass123', name: 'Test' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when body is incomplete', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nouser@b.com', password: 'pass' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/products', () => {
  it('returns 200 with products list', async () => {
    prisma.product.count.mockResolvedValue(0);
    prisma.product.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('pagination');
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 when product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/products/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('Protected routes', () => {
  it('POST /api/products returns 401 without token', async () => {
    const res = await request(app).post('/api/products').send({});
    expect(res.status).toBe(401);
  });

  it('PUT /api/products/:id returns 401 without token', async () => {
    const res = await request(app).put('/api/products/1').send({});
    expect(res.status).toBe(401);
  });

  it('DELETE /api/products/:id returns 401 without token', async () => {
    const res = await request(app).delete('/api/products/1');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
