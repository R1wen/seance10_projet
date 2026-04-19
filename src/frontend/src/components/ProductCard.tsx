import { Link } from 'react-router-dom';
import type { Product } from '../api/products';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
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
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 leading-snug">{product.name}</h3>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
            {product.category}
          </span>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 flex-1">
          {product.description ?? 'No description'}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-lg font-bold text-black">${Number(product.price).toFixed(2)}</span>
          <span className="text-xs text-gray-400">Stock: {product.stock}</span>
        </div>
        <div className="flex gap-2 mt-2">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 text-center border border-gray-300 text-gray-800 text-sm py-1.5 rounded-full font-medium hover:bg-gray-50"
          >
            Add to Cart
          </Link>
          <Link
            to={`/products/${product.id}`}
            className="flex-1 text-center bg-black hover:bg-gray-900 text-white text-sm py-1.5 rounded-full font-medium"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}
