/** Local banner files — uploaded into Strapi media on bootstrap. */
export type HomeBannerSeed = {
  /** Path relative to cms/seed-assets/ */
  file: string;
  fileName: string;
  alt: string;
  mime: string;
  title: string;
  link?: string;
  sortOrder: number;
  active: boolean;
};

export const HOME_BANNERS: HomeBannerSeed[] = [
  {
    file: 'home-banners/banner-free-delivery.png',
    fileName: 'banner-free-delivery.png',
    alt: 'Free delivery on orders above ₹10,000',
    mime: 'image/png',
    title: 'Free delivery on orders above ₹10,000',
    link: '/search',
    sortOrder: 1,
    active: true,
  },
  {
    file: 'home-banners/banner-deals-week.png',
    fileName: 'banner-deals-week.png',
    alt: 'Deals of the Week',
    mime: 'image/png',
    title: 'Deals of the Week',
    link: '/search?q=deals',
    sortOrder: 2,
    active: true,
  },
  {
    file: 'home-banners/banner-best-sellers.png',
    fileName: 'banner-best-sellers.png',
    alt: 'Best Sellers',
    mime: 'image/png',
    title: 'Best Sellers',
    link: '/search',
    sortOrder: 3,
    active: true,
  },
  {
    file: 'home-banners/banner-professionals.png',
    fileName: 'banner-professionals.png',
    alt: 'Find Professionals in Hyderabad',
    mime: 'image/png',
    title: 'Find Professionals',
    link: '/(tabs)/professionals',
    sortOrder: 4,
    active: true,
  },
  {
    file: 'home-banners/banner-cement-tiling.png',
    fileName: 'banner-cement-tiling.png',
    alt: 'Cement and Tiling materials',
    mime: 'image/png',
    title: 'Cement & Tiling',
    link: '/category/cement',
    sortOrder: 5,
    active: true,
  },
];
