import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as cartApi from '../api/cart';
import type { CartItem } from '../api/cart';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  isLoading: boolean;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const cart = await cartApi.getCart();
      setItems(cart.items);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (productId: string, quantity = 1) => {
    await cartApi.addToCart(productId, quantity);
    await refresh();
  };

  const update = async (productId: string, quantity: number) => {
    await cartApi.updateCartItem(productId, quantity);
    await refresh();
  };

  const remove = async (productId: string) => {
    await cartApi.removeCartItem(productId);
    await refresh();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        isLoading,
        add,
        update,
        remove,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
