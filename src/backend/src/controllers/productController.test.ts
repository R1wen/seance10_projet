import { Request, Response } from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from './productController';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
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

const prisma = require('../lib/prisma').default;

const mockReq = (body = {}, params: any = {}, query: any = {}): Partial<Request> => ({
  body,
  params,
  query,
});

const mockRes = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('getAllProducts', () => {
  it('returns products with pagination', async () => {
    prisma.product.count.mockResolvedValue(2);
    prisma.product.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const req = mockReq({}, {}, { page: '1', limit: '10' }) as Request;
    const res = mockRes() as Response;
    await getAllProducts(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ products: expect.any(Array), pagination: expect.any(Object) })
    );
  });

  it('filters by category', async () => {
    prisma.product.count.mockResolvedValue(1);
    prisma.product.findMany.mockResolvedValue([{ id: '1', category: 'Electronics' }]);
    const req = mockReq({}, {}, { category: 'Electronics' }) as Request;
    const res = mockRes() as Response;
    await getAllProducts(req, res);
    expect(prisma.product.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('filters by search term', async () => {
    prisma.product.count.mockResolvedValue(1);
    prisma.product.findMany.mockResolvedValue([{ id: '1', name: 'Phone' }]);
    const req = mockReq({}, {}, { search: 'Phone' }) as Request;
    const res = mockRes() as Response;
    await getAllProducts(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns 500 on error', async () => {
    prisma.product.count.mockRejectedValue(new Error('DB error'));
    const req = mockReq({}, {}, {}) as Request;
    const res = mockRes() as Response;
    await getAllProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getProduct', () => {
  it('returns product by id', async () => {
    const product = { id: '1', name: 'Phone' };
    prisma.product.findUnique.mockResolvedValue(product);
    const req = mockReq({}, { id: '1' }) as Request;
    const res = mockRes() as Response;
    await getProduct(req, res);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it('returns 404 when not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const req = mockReq({}, { id: 'unknown' }) as Request;
    const res = mockRes() as Response;
    await getProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    prisma.product.findUnique.mockRejectedValue(new Error('DB error'));
    const req = mockReq({}, { id: '1' }) as Request;
    const res = mockRes() as Response;
    await getProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('createProduct', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = mockReq({ name: 'Phone' }) as Request;
    const res = mockRes() as Response;
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates and returns product with 201', async () => {
    const product = { id: '1', name: 'Phone', price: 499, category: 'Electronics' };
    prisma.product.create.mockResolvedValue(product);
    const req = mockReq({ name: 'Phone', price: 499, category: 'Electronics' }) as Request;
    const res = mockRes() as Response;
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it('returns 500 on error', async () => {
    prisma.product.create.mockRejectedValue(new Error('DB error'));
    const req = mockReq({ name: 'Phone', price: 499, category: 'Electronics' }) as Request;
    const res = mockRes() as Response;
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateProduct', () => {
  it('updates and returns product', async () => {
    const product = { id: '1', name: 'Updated', price: 599, category: 'Electronics' };
    prisma.product.update.mockResolvedValue(product);
    const req = mockReq({ name: 'Updated', price: 599, category: 'Electronics' }, { id: '1' }) as Request;
    const res = mockRes() as Response;
    await updateProduct(req, res);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it('returns 500 on error', async () => {
    prisma.product.update.mockRejectedValue(new Error('Not found'));
    const req = mockReq({}, { id: 'bad' }) as Request;
    const res = mockRes() as Response;
    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('deleteProduct', () => {
  it('returns 204 on success', async () => {
    prisma.product.delete.mockResolvedValue({});
    const req = mockReq({}, { id: '1' }) as Request;
    const res = mockRes() as Response;
    await deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('returns 500 on error', async () => {
    prisma.product.delete.mockRejectedValue(new Error('Not found'));
    const req = mockReq({}, { id: 'bad' }) as Request;
    const res = mockRes() as Response;
    await deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
