import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login, me } from './authController';


jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const prisma = require('../lib/prisma').default;

const mockReq = (body = {}, params = {}, headers = {}): Partial<Request> => ({
  body,
  params,
  headers,
});

const mockRes = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '7d';

describe('register', () => {
  it('returns 400 when fields are missing', async () => {
    const req = mockReq({ email: 'a@b.com' }) as Request;
    const res = mockRes() as Response;
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when email already in use', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const req = mockReq({ email: 'a@b.com', password: 'pass', name: 'Test' }) as Request;
    const res = mockRes() as Response;
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('creates user and returns 201 with token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    const created = { id: '1', email: 'a@b.com', name: 'Test', role: 'USER', createdAt: new Date() };
    prisma.user.create.mockResolvedValue(created);
    (jwt.sign as jest.Mock).mockReturnValue('token123');

    const req = mockReq({ email: 'a@b.com', password: 'pass', name: 'Test' }) as Request;
    const res = mockRes() as Response;
    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'token123' }));
  });

  it('returns 500 on unexpected error', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('DB error'));
    const req = mockReq({ email: 'a@b.com', password: 'pass', name: 'Test' }) as Request;
    const res = mockRes() as Response;
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('login', () => {
  it('returns 400 when fields are missing', async () => {
    const req = mockReq({ email: 'a@b.com' }) as Request;
    const res = mockRes() as Response;
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const req = mockReq({ email: 'a@b.com', password: 'pass' }) as Request;
    const res = mockRes() as Response;
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', password: 'hashed', name: 'T', role: 'USER' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const req = mockReq({ email: 'a@b.com', password: 'wrong' }) as Request;
    const res = mockRes() as Response;
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns token on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', password: 'hashed', name: 'T', role: 'USER' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token123');
    const req = mockReq({ email: 'a@b.com', password: 'pass' }) as Request;
    const res = mockRes() as Response;
    await login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'token123' }));
  });

  it('returns 500 on unexpected error', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('DB error'));
    const req = mockReq({ email: 'a@b.com', password: 'pass' }) as Request;
    const res = mockRes() as Response;
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('me', () => {
  it('returns user data', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'Test', role: 'USER', createdAt: new Date() };
    prisma.user.findUnique.mockResolvedValue(user);
    const req = { user: { id: '1' } } as any;
    const res = mockRes() as Response;
    await me(req, res);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('returns 404 when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const req = { user: { id: 'unknown' } } as any;
    const res = mockRes() as Response;
    await me(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('DB error'));
    const req = { user: { id: '1' } } as any;
    const res = mockRes() as Response;
    await me(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
