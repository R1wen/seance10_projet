import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { add } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-gray-400">Loading…</div>;
  }

  if (isError || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 text-lg font-semibold">Product not found.</p>
        <Link to="/products" className="text-gray-600 hover:text-black text-sm mt-4 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/products" className="text-sm text-gray-600 hover:text-black mb-6 inline-block">
        ← Back to products
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/2 h-72 md:h-auto bg-gray-100 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-sm">No image</span>
          )}
        </div>

        <div className="p-8 flex flex-col gap-4 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap">
              {product.category}
            </span>
          </div>

          <p className="text-gray-500 leading-relaxed">
            {product.description ?? 'No description available.'}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <span className="text-3xl font-bold text-black">
              ${Number(product.price).toFixed(2)}
            </span>
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                product.stock > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {isAuthenticated ? (
            <button
              disabled={product.stock === 0 || adding}
              onClick={async () => {
                setAdding(true);
                try {
                  await add(id!, 1);
                  setAdded(true);
                  setTimeout(() => setAdded(false), 2000);
                } finally {
                  setAdding(false);
                }
              }}
              className="mt-4 bg-black hover:bg-gray-900 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-full"
            >
              {adding ? 'Adding…' : added ? 'Added!' : 'Add to Cart'}
            </button>
          ) : (
            <Link
              to="/login"
              className="mt-4 inline-block bg-black hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-full text-center"
            >
              Login to add to cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
