import api from './axios';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
    category: string;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export const getCart = (): Promise<Cart> =>
  api.get('/cart').then((r) => r.data);

export const addToCart = (productId: string, quantity = 1): Promise<CartItem> =>
  api.post('/cart', { productId, quantity }).then((r) => r.data);

export const updateCartItem = (productId: string, quantity: number): Promise<CartItem> =>
  api.put(`/cart/${productId}`, { quantity }).then((r) => r.data);

export const removeCartItem = (productId: string): Promise<void> =>
  api.delete(`/cart/${productId}`).then(() => undefined);
