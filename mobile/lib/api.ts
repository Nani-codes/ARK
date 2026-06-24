import { normalizeHomeBanner } from './normalizeHomeBanner';
import { normalizeOrder } from './normalizeOrder';
import { normalizeProduct } from './normalizeProduct';
import { normalizeQuote } from './normalizeQuote';
import { strapiFetch } from './strapi';
import type {
  AppConfig,
  AuthUser,
  Category,
  HomeBanner,
  Order,
  Product,
  ProfessionalProfile,
  ProfessionalWork,
  ProfessionType,
  QuoteRequest,
  ReturnRequest,
  SavedAddress,
  StrapiListResponse,
  StrapiSingleResponse,
} from './types';

const PRODUCT_POPULATE =
  'populate[image]=true&populate[category]=true&populate[pricingTiers]=true&populate[variants][populate][0]=image&populate[variants][populate][1]=pricingTiers&populate[specs]=true';

export type ProductSearchParams = {
  q?: string;
  categorySlug?: string;
  featured?: boolean;
  onDeal?: boolean;
  bestSeller?: boolean;
  inStock?: boolean;
  brand?: string;
  sort?: 'name:asc' | 'name:desc' | 'price:asc' | 'price:desc';
  page?: number;
  pageSize?: number;
};

function buildProductQuery(params?: ProductSearchParams) {
  const search = new URLSearchParams(PRODUCT_POPULATE);
  if (params?.categorySlug) {
    search.set('filters[category][slug][$eq]', params.categorySlug);
  }
  if (params?.featured) {
    search.set('filters[featured][$eq]', 'true');
  }
  if (params?.onDeal) {
    search.set('filters[onDeal][$eq]', 'true');
  }
  if (params?.bestSeller) {
    search.set('filters[bestSeller][$eq]', 'true');
  }
  if (params?.inStock) {
    search.set('filters[inStock][$eq]', 'true');
  }
  if (params?.brand) {
    search.set('filters[brand][$eq]', params.brand);
  }
  if (params?.q?.trim()) {
    search.set('filters[name][$containsi]', params.q.trim());
  }
  const sort = params?.sort ?? 'name:asc';
  search.set('sort', sort);
  search.set('pagination[page]', String(params?.page ?? 1));
  search.set('pagination[pageSize]', String(params?.pageSize ?? 25));
  return search;
}

export function fetchCategories() {
  return strapiFetch<StrapiListResponse<Category>>(
    '/api/categories?sort=sortOrder:asc'
  );
}

export async function fetchProducts(params?: ProductSearchParams) {
  const search = buildProductQuery(params);
  const res = await strapiFetch<StrapiListResponse<Product>>(`/api/products?${search}`);
  return { ...res, data: res.data.map(normalizeProduct) };
}

export async function fetchProduct(documentId: string) {
  const res = await strapiFetch<StrapiSingleResponse<Product>>(
    `/api/products/${documentId}?${PRODUCT_POPULATE}`
  );
  return { ...res, data: normalizeProduct(res.data) };
}

export async function fetchAppConfig() {
  const res = await strapiFetch<StrapiSingleResponse<AppConfig>>('/api/app-config');
  return res;
}

export async function fetchHomeBanners() {
  const res = await strapiFetch<StrapiListResponse<HomeBanner>>(
    '/api/home-banners?filters[active][$eq]=true&sort=sortOrder:asc&populate[image]=true'
  );
  const data = res.data
    .map((row) => normalizeHomeBanner(row as Parameters<typeof normalizeHomeBanner>[0]))
    .filter((banner): banner is HomeBanner => banner !== null);
  return { ...res, data };
}

export async function fetchServiceablePincodes() {
  return strapiFetch<StrapiListResponse<{ pincode: string; city: string; active: boolean }>>(
    '/api/serviceable-pincodes?pagination[pageSize]=200&filters[active][$eq]=true'
  );
}

export function createOrder(payload: {
  orderStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryFee?: number;
  pincode?: string;
  gstin?: string;
  businessName?: string;
  notifyPhone?: string;
  installationRequired?: boolean;
  neftProofUrl?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  items: Array<{
    productName: string;
    productDocumentId?: string;
    variantId?: string;
    variantLabel?: string;
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

export function cancelOrder(documentId: string) {
  return strapiFetch<StrapiSingleResponse<Order>>(`/api/orders/${documentId}`, {
    method: 'PUT',
    auth: true,
    body: { data: { orderStatus: 'cancelled' } },
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
  productDocumentId?: string;
  productName: string;
  variantLabel?: string;
  quantity: number;
  quantityUnit: string;
  siteAddress: string;
  instructions?: string;
  gstin?: string;
  preferredDeliveryDate?: string;
  phone?: string;
}) {
  return strapiFetch<StrapiSingleResponse<QuoteRequest>>('/api/quote-requests', {
    method: 'POST',
    auth: true,
    body: {
      data: {
        ...payload,
        product: payload.productDocumentId,
        quantityTons:
          payload.quantityUnit.toLowerCase().includes('ton') ? payload.quantity : undefined,
      },
    },
  }).then((res) => ({ ...res, data: normalizeQuote(res.data) }));
}

export async function fetchQuoteRequests() {
  const res = await strapiFetch<StrapiListResponse<QuoteRequest>>(
    '/api/quote-requests?sort=createdAt:desc',
    { auth: true }
  );
  return { ...res, data: res.data.map(normalizeQuote) };
}

export async function fetchCloudAddresses() {
  return strapiFetch<StrapiListResponse<SavedAddress & { documentId: string }>>(
    '/api/addresses?sort=updatedAt:desc',
    { auth: true }
  );
}

export function createCloudAddress(payload: Omit<SavedAddress, 'id' | 'lastUsedAt'>) {
  return strapiFetch<StrapiSingleResponse<SavedAddress & { documentId: string }>>('/api/addresses', {
    method: 'POST',
    auth: true,
    body: { data: payload },
  });
}

export function updateCloudAddress(
  documentId: string,
  payload: Partial<Omit<SavedAddress, 'id' | 'lastUsedAt'>>
) {
  return strapiFetch<StrapiSingleResponse<SavedAddress & { documentId: string }>>(
    `/api/addresses/${documentId}`,
    { method: 'PUT', auth: true, body: { data: payload } }
  );
}

export function deleteCloudAddress(documentId: string) {
  return strapiFetch(`/api/addresses/${documentId}`, { method: 'DELETE', auth: true });
}

export function createReturnRequest(payload: {
  orderNumber: string;
  productName: string;
  reason: string;
}) {
  return strapiFetch<StrapiSingleResponse<ReturnRequest>>('/api/return-requests', {
    method: 'POST',
    auth: true,
    body: { data: payload },
  });
}

export async function fetchReturnRequests() {
  return strapiFetch<StrapiListResponse<ReturnRequest>>(
    '/api/return-requests?sort=createdAt:desc',
    { auth: true }
  );
}

export async function fetchMyProfile() {
  return strapiFetch<{ user: AuthUser }>('/api/user-profile/me', { auth: true });
}

export function updateMyProfile(payload: {
  isProfessional?: boolean;
  listedAsProfessional?: boolean;
  professionType?: ProfessionType | null;
  professionalBio?: string | null;
  professionalWorks?: ProfessionalWork[];
  displayName?: string;
  onboardingComplete?: boolean;
}) {
  return strapiFetch<{ user: AuthUser }>('/api/user-profile/me', {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

export function savePushToken(expoPushToken: string) {
  return strapiFetch<{ ok: boolean }>('/api/user-profile/push-token', {
    method: 'PUT',
    auth: true,
    body: { expoPushToken },
  });
}

export async function fetchProfessionals() {
  return strapiFetch<{ data: ProfessionalProfile[] }>('/api/user-profile/professionals');
}

export async function fetchProfessional(id: number) {
  return strapiFetch<{ data: ProfessionalProfile }>(`/api/user-profile/professionals/${id}`);
}
