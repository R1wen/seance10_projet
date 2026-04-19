import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import type { Product, ProductPayload } from '../api/products';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Must be positive'),
  imageUrl: z.string().url('Must be a URL').optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, 'Must be ≥ 0'),
  category: z.string().min(1, 'Required'),
});

type FormData = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number;
  category: string;
};

function ProductForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const createMut = useMutation({
    mutationFn: (data: ProductPayload) => createProduct(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); onSuccess(); },
  });
  const updateMut = useMutation({
    mutationFn: (data: Partial<ProductPayload>) => updateProduct(initial!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); onSuccess(); },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          price: Number(initial.price),
          imageUrl: initial.imageUrl ?? '',
          stock: initial.stock,
          category: initial.category,
        }
      : undefined,
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const payload: ProductPayload = {
      ...data,
      imageUrl: data.imageUrl || undefined,
    };
    if (initial) {
      await updateMut.mutateAsync(payload);
    } else {
      await createMut.mutateAsync(payload);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name</label>
          <input {...register('name')} className={inputClass} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <input {...register('category')} className={inputClass} />
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Price ($)</label>
          <input type="number" step="0.01" {...register('price')} className={inputClass} />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Stock</label>
          <input type="number" {...register('stock')} className={inputClass} />
          {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Image URL</label>
          <input {...register('imageUrl')} className={inputClass} placeholder="https://…" />
          {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea {...register('description')} rows={3} className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-medium"
        >
          {isSubmitting ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [modalProduct, setModalProduct] = useState<Product | null | 'new'>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page }],
    queryFn: () => getProducts({ page, limit: 20 }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const handleDelete = (product: Product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      deleteMut.mutate(product.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin — Products</h1>
        <button
          onClick={() => setModalProduct('new')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
        >
          + Add Product
        </button>
      </div>

      {modalProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modalProduct === 'new' ? 'New Product' : `Edit: ${modalProduct.name}`}
            </h2>
            <ProductForm
              initial={modalProduct === 'new' ? undefined : modalProduct}
              onSuccess={() => setModalProduct(null)}
              onCancel={() => setModalProduct(null)}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.stock}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setModalProduct(p)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} / {data.pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
