export type SpecialtySeed = {
  name: string;
  slug: string;
  trade: string;
};

export const SPECIALTY_SEEDS: SpecialtySeed[] = [
  { name: 'Residential Construction', slug: 'residential-construction', trade: 'contractor' },
  { name: 'Commercial Projects', slug: 'commercial-projects', trade: 'contractor' },
  { name: 'Renovation & Remodeling', slug: 'renovation-remodeling', trade: 'contractor' },
  { name: 'Structural Work', slug: 'structural-work', trade: 'contractor' },
  { name: 'Residential Architecture', slug: 'residential-architecture', trade: 'architect' },
  { name: 'Commercial Architecture', slug: 'commercial-architecture', trade: 'architect' },
  { name: '3D Visualization', slug: '3d-visualization', trade: 'architect' },
  { name: 'Space Planning', slug: 'space-planning', trade: 'architect' },
  { name: 'Modern Interiors', slug: 'modern-interiors', trade: 'interior_designer' },
  { name: 'Kitchen Design', slug: 'kitchen-design', trade: 'interior_designer' },
  { name: 'False Ceiling', slug: 'false-ceiling', trade: 'interior_designer' },
  { name: 'Furniture & Decor', slug: 'furniture-decor', trade: 'interior_designer' },
  { name: 'Wiring & Panels', slug: 'wiring-panels', trade: 'electrician' },
  { name: 'Smart Home', slug: 'smart-home', trade: 'electrician' },
  { name: 'Industrial Electrical', slug: 'industrial-electrical', trade: 'electrician' },
  { name: 'Bathroom Plumbing', slug: 'bathroom-plumbing', trade: 'plumber' },
  { name: 'Waterproofing', slug: 'waterproofing', trade: 'plumber' },
  { name: 'Pipeline Installation', slug: 'pipeline-installation', trade: 'plumber' },
  { name: 'Interior Painting', slug: 'interior-painting', trade: 'painter' },
  { name: 'Exterior Painting', slug: 'exterior-painting', trade: 'painter' },
  { name: 'Texture & Wallpaper', slug: 'texture-wallpaper', trade: 'painter' },
  { name: 'General Contracting', slug: 'general-contracting', trade: 'other' },
  { name: 'Project Management', slug: 'project-management', trade: 'other' },
  { name: 'Site Supervision', slug: 'site-supervision', trade: 'other' },
];
