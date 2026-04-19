import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getCart, addToCart, updateCartItem, removeCartItem } from './cartController';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    cart: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    cartItem: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  },
}));

const prisma = require('../lib/prisma').default;

const mockAuthReq = (
  body: any = {},
  params: any = {},
  userId = 'user-1'
): Partial<AuthRequest> => ({
  body,
  params,
  user: { id: userId, email: 'test@test.com', role: 'USER' },
});

const mockRes = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('getCart', () => {
  it('returns cart with items', async () => {
    const cart = { id: 'cart-1', userId: 'user-1', items: [] };
    prisma.cart.upsert.mockResolvedValue(cart);
    const req = mockAuthReq() as AuthRequest;
    const res = mockRes() as Response;
    await getCart(req, res);
    expect(res.json).toHaveBeenCalledWith(cart);
  });

  it('returns 500 on error', async () => {
    prisma.cart.upsert.mockRejectedValue(new Error('DB error'));
    const req = mockAuthReq() as AuthRequest;
    const res = mockRes() as Response;
    await getCart(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('addToCart', () => {
  it('returns 400 when productId is missing', async () => {
    const req = mockAuthReq({}) as AuthRequest;
    const res = mockRes() as Response;
    await addToCart(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when quantity is invalid', async () => {
    const req = mockAuthReq({ productId: 'p-1', quantity: 0 }) as AuthRequest;
    const res = mockRes() as Response;
    await addToCart(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when product does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const req = mockAuthReq({ productId: 'p-bad', quantity: 1 }) as AuthRequest;
    const res = mockRes() as Response;
    await addToCart(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when stock is insufficient', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p-1', stock: 1 });
    prisma.cart.upsert.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue({ quantity: 1 });
    const req = mockAuthReq({ productId: 'p-1', quantity: 1 }) as AuthRequest;
    const res = mockRes() as Response;
    await addToCart(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Not enough stock' }));
  });

  it('adds item to cart and returns 200', async () => {
    const product = { id: 'p-1', stock: 10 };
    const item = { id: 'ci-1', cartId: 'cart-1', productId: 'p-1', quantity: 2, product };
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.cart.upsert.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue(null);
    prisma.cartItem.upsert.mockResolvedValue(item);
    const req = mockAuthReq({ productId: 'p-1', quantity: 2 }) as AuthRequest;
    const res = mockRes() as Response;
    await addToCart(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('returns 500 on error', async () => {
    prisma.product.findUnique.mockRejectedValue(new Error('DB error'));
    const req = mockAuthReq({ productId: 'p-1', quantity: 1 }) as AuthRequest;
    const res = mockRes() as Response;
    await addToCart(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateCartItem', () => {
  it('returns 400 for invalid quantity', async () => {
    const req = mockAuthReq({ quantity: -1 }, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await updateCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when cart not found', async () => {
    prisma.cart.findUnique.mockResolvedValue(null);
    const req = mockAuthReq({ quantity: 2 }, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await updateCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when product not found', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.product.findUnique.mockResolvedValue(null);
    const req = mockAuthReq({ quantity: 2 }, { productId: 'p-bad' }) as AuthRequest;
    const res = mockRes() as Response;
    await updateCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when stock insufficient', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.product.findUnique.mockResolvedValue({ id: 'p-1', stock: 1 });
    const req = mockAuthReq({ quantity: 5 }, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await updateCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates item quantity', async () => {
    const item = { id: 'ci-1', quantity: 3 };
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.product.findUnique.mockResolvedValue({ id: 'p-1', stock: 10 });
    prisma.cartItem.update.mockResolvedValue(item);
    const req = mockAuthReq({ quantity: 3 }, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await updateCartItem(req, res);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('returns 500 on error', async () => {
    prisma.cart.findUnique.mockRejectedValue(new Error('DB error'));
    const req = mockAuthReq({ quantity: 1 }, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await updateCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('removeCartItem', () => {
  it('returns 404 when cart not found', async () => {
    prisma.cart.findUnique.mockResolvedValue(null);
    const req = mockAuthReq({}, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await removeCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when item not in cart', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue(null);
    const req = mockAuthReq({}, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await removeCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('removes item and returns 204', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue({ id: 'ci-1' });
    prisma.cartItem.delete.mockResolvedValue({});
    prisma.cartItem.count.mockResolvedValue(1);
    const req = mockAuthReq({}, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await removeCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deletes cart when last item is removed', async () => {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue({ id: 'ci-1' });
    prisma.cartItem.delete.mockResolvedValue({});
    prisma.cartItem.count.mockResolvedValue(0);
    prisma.cart.delete.mockResolvedValue({});
    const req = mockAuthReq({}, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await removeCartItem(req, res);
    expect(prisma.cart.delete).toHaveBeenCalledWith({ where: { id: 'cart-1' } });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 500 on error', async () => {
    prisma.cart.findUnique.mockRejectedValue(new Error('DB error'));
    const req = mockAuthReq({}, { productId: 'p-1' }) as AuthRequest;
    const res = mockRes() as Response;
    await removeCartItem(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
