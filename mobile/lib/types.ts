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
  /** Per-SKU image; falls back to product.image when unset */
  image?: StrapiMedia | null;
  /** Combination map when product has multiple option dimensions */
  options?: Record<string, string>;
  pricingTiers?: PricingTier[];
};

export type PricingTier = {
  minQty: number;
  unitPrice: number;
};

export type VariantOption = {
  name: string;
  values: string[];
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
  onDeal?: boolean;
  dealPrice?: number | null;
  bestSeller?: boolean;
  authenticityVerified?: boolean;
  priceUnitLabel?: string;
  variantOptionName?: string;
  variantOptions?: VariantOption[];
  variants?: ProductVariant[];
  replacementDays?: number;
  bulkPricingEnabled?: boolean;
  bulkMinQuantity?: number;
  temperatureSensitive?: boolean;
  temperatureNote?: string;
  pricingTiers?: PricingTier[];
  brand?: string;
  tags?: string[];
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
  variantId?: string;
  variantLabel?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};


export type Order = {
  id: number;
  documentId: string;
  orderNumber: string;
  orderStatus: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'neft' | 'cod' | 'online';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: string;
  deliveryFee?: number;
  estimatedDeliveryAt?: string;
  cancelUntil?: string;
  pincode?: string;
  gstin?: string;
  businessName?: string;
  notifyPhone?: string;
  installationRequired?: boolean;
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
  productDocumentId?: string;
  variantLabel?: string;
  quantity: number;
  quantityUnit: string;
  quantityTons?: number;
  siteAddress: string;
  instructions?: string;
  gstin?: string;
  preferredDeliveryDate?: string;
  quotedPrice?: number;
  quoteStatus: 'new' | 'contacted' | 'quoted' | 'closed';
  createdAt: string;
};

export type ProfessionType =
  | 'contractor'
  | 'architect'
  | 'interior_designer'
  | 'electrician'
  | 'plumber'
  | 'painter'
  | 'other';

export type ProfessionalWork = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
};

export type Specialty = {
  id: number;
  name: string;
  slug: string;
  trade?: ProfessionType;
};

export type ServiceArea = {
  id: number;
  pincode: string;
  city?: string;
  zone?: string;
};

export type PortfolioProject = {
  id: number;
  documentId?: string;
  title: string;
  description?: string | null;
  imageUrls: string[];
  legacyImageUrl?: string;
  completedAt?: string | null;
  location?: string | null;
  sortOrder: number;
};

export type ProfessionalReview = {
  id: number;
  rating: number;
  comment?: string | null;
  authorName: string;
  createdAt?: string;
};

export type ProfessionalSort = 'top_rated' | 'most_projects' | 'recent' | 'experience';

export type ProfessionalFilters = {
  q?: string;
  trade?: ProfessionType | '';
  city?: string;
  pincode?: string;
  minRating?: number;
  minExperience?: number;
  sort?: ProfessionalSort;
  page?: number;
  pageSize?: number;
};

export type AuthUser = {
  id: number;
  username?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  contractorId?: string;
  isProfessional?: boolean;
  listedAsProfessional?: boolean;
  professionType?: ProfessionType | null;
  professionalBio?: string | null;
  professionalWorks?: ProfessionalWork[];
  onboardingComplete?: boolean;
};

export type ProfessionalProfile = {
  id: number;
  documentId?: string;
  userId?: number;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string;
  coverImageUrl?: string;
  professionType: ProfessionType;
  otherProfession?: string | null;
  yearsExperience: number;
  city?: string | null;
  phone?: string;
  whatsapp?: string;
  email?: string | null;
  listed: boolean;
  verified: boolean;
  ratingAverage: number;
  ratingCount: number;
  specialties: Specialty[];
  serviceAreas: ServiceArea[];
  portfolioProjects?: PortfolioProject[];
  reviews?: ProfessionalReview[];
  workCount: number;
  contractorId?: string;
  /** @deprecated Use bio */
  professionalBio?: string | null;
  /** @deprecated Use portfolioProjects */
  professionalWorks?: ProfessionalWork[];
};

export type StrapiListResponse<T> = {
  data: T[];
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
};

export type StrapiSingleResponse<T> = {
  data: T;
};

export type AddressType = 'home' | 'work' | 'other';

export type SavedAddress = {
  id: string;
  documentId?: string;
  label: AddressType;
  flat: string;
  building?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  lastUsedAt?: string;
};

export type AppConfig = {
  promoTitle: string;
  promoSubtitle: string;
  promoCtaLabel: string;
  promoCtaLink?: string;
  whatsappNumber?: string;
  supportPhone?: string;
  operatingHoursStart?: number;
  operatingHoursEnd?: number;
  faqs?: Array<{ q: string; a: string }>;
};

export type HomeBanner = {
  id: number;
  documentId: string;
  title: string;
  imageUrl: string;
  link?: string;
  sortOrder: number;
  active: boolean;
};

export type ReturnRequest = {
  id: number;
  documentId: string;
  orderNumber: string;
  productName: string;
  reason: string;
  returnStatus: 'new' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
};
