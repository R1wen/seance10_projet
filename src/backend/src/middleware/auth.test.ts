import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorizeAdmin, AuthRequest } from './auth';

jest.mock('jsonwebtoken');

const mockRes = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

process.env.JWT_SECRET = 'test_secret';

beforeEach(() => jest.clearAllMocks());

describe('authenticate', () => {
  it('returns 401 when no authorization header', () => {
    const req: Partial<AuthRequest> = { headers: {} };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authenticate(req as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req: Partial<AuthRequest> = { headers: { authorization: 'Basic abc' } };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authenticate(req as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });
    const req: Partial<AuthRequest> = { headers: { authorization: 'Bearer badtoken' } };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authenticate(req as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets user when token is valid', () => {
    const decoded = { id: '1', email: 'a@b.com', role: 'USER' };
    (jwt.verify as jest.Mock).mockReturnValue(decoded);
    const req: Partial<AuthRequest> = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authenticate(req as AuthRequest, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(decoded);
  });
});

describe('authorizeAdmin', () => {
  it('returns 403 when user is not ADMIN', () => {
    const req: Partial<AuthRequest> = { user: { id: '1', email: 'a@b.com', role: 'USER' } };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authorizeAdmin(req as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user is ADMIN', () => {
    const req: Partial<AuthRequest> = { user: { id: '1', email: 'a@b.com', role: 'ADMIN' } };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authorizeAdmin(req as AuthRequest, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user is undefined', () => {
    const req: Partial<AuthRequest> = {};
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;
    authorizeAdmin(req as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
