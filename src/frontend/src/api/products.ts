import api from './axios';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  stock: number;
  category: string;
  createdAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: { total: number; page: number; pages: number };
}

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  category: string;
}

export const getProducts = (params?: Record<string, string | number>) =>
  api.get<ProductsResponse>('/products', { params }).then((r) => r.data);

export const getProduct = (id: string) =>
  api.get<Product>(`/products/${id}`).then((r) => r.data);

export const createProduct = (data: ProductPayload) =>
  api.post<Product>('/products', data).then((r) => r.data);

export const updateProduct = (id: string, data: Partial<ProductPayload>) =>
  api.put<Product>(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: string) =>
  api.delete(`/products/${id}`);
