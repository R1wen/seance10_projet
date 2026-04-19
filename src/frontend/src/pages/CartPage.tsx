import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, totalItems, isLoading, update, remove } = useCart();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleQuantityChange = async (productId: string, quantity: number) => {
    setUpdating(productId);
    try {
      await update(productId, quantity);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setUpdating(productId);
    try {
      await remove(productId);
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-gray-400">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Your cart is empty.</p>
        <Link to="/products" className="mt-4 inline-block text-sm text-black underline">
          Browse products
        </Link>
      </div>
    );
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                  No img
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                to={`/products/${item.productId}`}
                className="font-semibold text-gray-900 hover:underline truncate block"
              >
                {item.product.name}
              </Link>
              <p className="text-sm text-gray-500">${Number(item.product.price).toFixed(2)} each</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1 || updating === item.productId}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold text-sm"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.product.stock || updating === item.productId}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold text-sm"
              >
                +
              </button>
            </div>

            <span className="w-20 text-right font-semibold text-gray-900">
              ${(Number(item.product.price) * item.quantity).toFixed(2)}
            </span>

            <button
              onClick={() => handleRemove(item.productId)}
              disabled={updating === item.productId}
              className="text-red-400 hover:text-red-600 disabled:opacity-40 text-sm ml-2"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">Total: ${total.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Checkout coming soon</p>
        </div>
      </div>
    </div>
  );
}
