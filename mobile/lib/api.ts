import { normalizeHomeBanner } from './normalizeHomeBanner';
import { normalizeOrder } from './normalizeOrder';
import { normalizeProduct } from './normalizeProduct';
import { normalizeQuote } from './normalizeQuote';
import { strapiFetch, mediaUrl } from './strapi';
import type {
  AppConfig,
  AuthUser,
  Category,
  HomeBanner,
  Order,
  PortfolioProject,
  Product,
  ProfessionalFilters,
  ProfessionalProfile,
  ProfessionalReview,
  ProfessionalWork,
  ProfessionType,
  QuoteRequest,
  ReturnRequest,
  SavedAddress,
  Specialty,
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
  return strapiFetch<StrapiListResponse<{ id: number; pincode: string; city?: string; zone?: string }>>(
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

function buildProfessionalQuery(filters: ProfessionalFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.trade) params.set('trade', filters.trade);
  if (filters.city) params.set('city', filters.city);
  if (filters.pincode) params.set('pincode', filters.pincode);
  if (filters.minRating) params.set('minRating', String(filters.minRating));
  if (filters.minExperience) params.set('minExperience', String(filters.minExperience));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function normalizeProfessionalProfile(pro: ProfessionalProfile): ProfessionalProfile {
  return {
    ...pro,
    avatarUrl: pro.avatarUrl ? mediaUrl(pro.avatarUrl) : undefined,
    coverImageUrl: pro.coverImageUrl ? mediaUrl(pro.coverImageUrl) : undefined,
    portfolioProjects: pro.portfolioProjects?.map((project) => ({
      ...project,
      imageUrls: project.imageUrls.map((url) => mediaUrl(url) ?? url),
    })),
    professionalBio: pro.bio ?? pro.professionalBio,
    professionalWorks: pro.portfolioProjects?.map((project) => ({
      id: String(project.id),
      title: project.title,
      description: project.description ?? undefined,
      imageUrl: project.imageUrls[0],
    })),
    workCount: pro.workCount ?? pro.portfolioProjects?.length ?? 0,
  };
}

export async function fetchProfessionals(filters: ProfessionalFilters = {}) {
  const res = await strapiFetch<StrapiListResponse<ProfessionalProfile>>(
    `/api/professionals${buildProfessionalQuery(filters)}`
  );
  return {
    ...res,
    data: res.data.map(normalizeProfessionalProfile),
  };
}

export async function fetchProfessional(id: number) {
  const res = await strapiFetch<StrapiSingleResponse<ProfessionalProfile>>(
    `/api/professionals/${id}`
  );
  return { data: normalizeProfessionalProfile(res.data) };
}

export async function fetchMyProfessionalProfile() {
  const res = await strapiFetch<{ data: ProfessionalProfile | null }>(
    '/api/professional-profile/me',
    { auth: true }
  );
  return {
    data: res.data ? normalizeProfessionalProfile(res.data) : null,
  };
}

export function updateMyProfessionalProfile(payload: {
  isProfessional?: boolean;
  displayName?: string;
  headline?: string | null;
  bio?: string | null;
  professionType?: ProfessionType;
  otherProfession?: string | null;
  yearsExperience?: number;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  listed?: boolean;
  specialtyIds?: number[];
  serviceAreaIds?: number[];
  avatarId?: number | null;
  coverImageId?: number | null;
}) {
  const body: Record<string, unknown> = { ...payload };
  if (payload.avatarId !== undefined) body.avatar = payload.avatarId;
  if (payload.coverImageId !== undefined) body.coverImage = payload.coverImageId;
  delete body.avatarId;
  delete body.coverImageId;

  return strapiFetch<{ data: ProfessionalProfile }>('/api/professional-profile/me', {
    method: 'PUT',
    auth: true,
    body,
  }).then((res) => ({ data: normalizeProfessionalProfile(res.data) }));
}

export function createPortfolioProject(payload: {
  title: string;
  description?: string | null;
  location?: string | null;
  completedAt?: string | null;
  sortOrder?: number;
  imageIds?: number[];
  legacyImageUrl?: string | null;
}) {
  return strapiFetch<{ data: PortfolioProject }>('/api/professional-profile/me/projects', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function updatePortfolioProject(
  projectId: number,
  payload: {
    title?: string;
    description?: string | null;
    location?: string | null;
    completedAt?: string | null;
    sortOrder?: number;
    imageIds?: number[];
    legacyImageUrl?: string | null;
  }
) {
  return strapiFetch<{ data: PortfolioProject }>(
    `/api/professional-profile/me/projects/${projectId}`,
    {
      method: 'PUT',
      auth: true,
      body: payload,
    }
  );
}

export function deletePortfolioProject(projectId: number) {
  return strapiFetch<{ ok: boolean }>(`/api/professional-profile/me/projects/${projectId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function fetchProfessionalReviews(professionalId: number) {
  return strapiFetch<{ data: ProfessionalReview[] }>(`/api/professionals/${professionalId}/reviews`);
}

export function submitProfessionalReview(
  professionalId: number,
  payload: { rating: number; comment?: string | null }
) {
  return strapiFetch<{ data: ProfessionalReview }>(`/api/professionals/${professionalId}/reviews`, {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function requestProfessionalCallback(
  professionalId: number,
  payload: { message?: string } = {}
) {
  return strapiFetch<{ ok: boolean }>(`/api/professionals/${professionalId}/callback`, {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function fetchSpecialties(trade?: ProfessionType) {
  const qs = trade ? `?trade=${trade}` : '';
  return strapiFetch<{ data: Specialty[] }>(`/api/specialties${qs}`);
}
