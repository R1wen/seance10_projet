import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from './errorHandler';

const mockRes = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  const next = jest.fn() as NextFunction;

  it('uses statusCode from error when provided', () => {
    const err: AppError = Object.assign(new Error('Not found'), { statusCode: 404 });
    const req = {} as Request;
    const res = mockRes() as Response;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Not found' }));
  });

  it('defaults to 500 when no statusCode', () => {
    const err: AppError = new Error('Unexpected');
    const req = {} as Request;
    const res = mockRes() as Response;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const err: AppError = new Error('Dev error');
    const req = {} as Request;
    const res = mockRes() as Response;
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stack: expect.any(String) }));
    process.env.NODE_ENV = originalEnv;
  });

  it('does not include stack in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err: AppError = new Error('Prod error');
    const req = {} as Request;
    const res = mockRes() as Response;
    errorHandler(err, req, res, next);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall).not.toHaveProperty('stack');
    process.env.NODE_ENV = originalEnv;
  });
});
