import { normalizeOrder } from './normalizeOrder';
import { normalizeProduct } from './normalizeProduct';
import { strapiFetch } from './strapi';
import type {
  Category,
  Order,
  Product,
  QuoteRequest,
  StrapiListResponse,
  StrapiSingleResponse,
} from './types';

const PRODUCT_POPULATE =
  'populate[image]=true&populate[category]=true&populate[variants]=true&populate[specs]=true';

export function fetchCategories() {
  return strapiFetch<StrapiListResponse<Category>>(
    '/api/categories?sort=sortOrder:asc'
  );
}

export async function fetchProducts(params?: {
  categorySlug?: string;
  featured?: boolean;
}) {
  const search = new URLSearchParams(PRODUCT_POPULATE);
  if (params?.categorySlug) {
    search.set('filters[category][slug][$eq]', params.categorySlug);
  }
  if (params?.featured) {
    search.set('filters[featured][$eq]', 'true');
  }
  const res = await strapiFetch<StrapiListResponse<Product>>(`/api/products?${search}`);
  return { ...res, data: res.data.map(normalizeProduct) };
}

export async function fetchProduct(documentId: string) {
  const res = await strapiFetch<StrapiSingleResponse<Product>>(
    `/api/products/${documentId}?${PRODUCT_POPULATE}`
  );
  return { ...res, data: normalizeProduct(res.data) };
}

export function createOrder(payload: {
  orderStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    productDocumentId?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
}) {
  return strapiFetch<StrapiSingleResponse<Order>>('/api/orders', {
    method: 'POST',
    auth: true,
    body: { data: payload },
  }).then((res) => ({ ...res, data: normalizeOrder(res.data) }));
}

export async function fetchOrders() {
  const res = await strapiFetch<StrapiListResponse<Order>>(
    '/api/orders?sort=createdAt:desc&populate=items',
    { auth: true }
  );
  return { ...res, data: res.data.map(normalizeOrder) };
}

export async function fetchOrder(documentId: string) {
  const res = await strapiFetch<StrapiSingleResponse<Order>>(
    `/api/orders/${documentId}?populate=items`,
    { auth: true }
  );
  return { ...res, data: normalizeOrder(res.data) };
}

export function createQuoteRequest(payload: {
  productName: string;
  quantityTons: number;
  siteAddress: string;
  instructions?: string;
  phone?: string;
}) {
  return strapiFetch<StrapiSingleResponse<QuoteRequest>>('/api/quote-requests', {
    method: 'POST',
    auth: true,
    body: { data: payload },
  });
}
