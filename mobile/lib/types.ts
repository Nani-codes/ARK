export type Category = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  label: string;
  price: number;
  compareAtPrice?: number;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type Product = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  unit: string;
  description?: string;
  inStock: boolean;
  featured?: boolean;
  variantOptionName?: string;
  variants?: ProductVariant[];
  replacementDays?: number;
  bulkPricingEnabled?: boolean;
  specs?: ProductSpec[];
  image?: StrapiMedia | null;
  category?: Category | null;
};

export type StrapiMedia = {
  url: string;
  alternativeText?: string;
};

export type OrderItem = {
  productName: string;
  productDocumentId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: number;
  documentId: string;
  orderNumber: string;
  orderStatus: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered';
  paymentMethod: 'neft' | 'cod';
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  total: number;
  createdAt: string;
};

export type QuoteRequest = {
  id: number;
  documentId: string;
  productName: string;
  quantityTons: number;
  siteAddress: string;
  instructions?: string;
  quoteStatus: 'new' | 'contacted' | 'closed';
  createdAt: string;
};

export type AuthUser = {
  id: number;
  username?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  contractorId?: string;
};

export type StrapiListResponse<T> = {
  data: T[];
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
};

export type StrapiSingleResponse<T> = {
  data: T;
};
