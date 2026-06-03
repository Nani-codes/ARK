/** ARK design system — navy + gold (new theme) */
export const brand = {
  navy: '#002147',
  navyDeep: '#000a1e',
  gold: '#775a19',
  goldContainer: '#fed488',
  goldBright: '#ffb800',
};

export const colors = {
  primary: brand.navyDeep,
  primaryContainer: brand.navy,
  onPrimary: '#ffffff',
  onPrimaryContainer: '#708ab5',
  onPrimaryFixed: '#001b3d',
  onPrimaryFixedVariant: '#2d476f',

  secondary: brand.gold,
  secondaryContainer: brand.goldContainer,
  onSecondary: '#ffffff',
  onSecondaryContainer: '#785a1a',
  onSecondaryFixed: '#261900',

  tertiary: '#090b0c',
  tertiaryContainer: '#202222',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#888989',

  background: '#f9f9fc',
  surface: '#ffffff',
  surfaceBright: '#f9f9fc',
  surfaceContainer: '#eeeef0',
  surfaceContainerLow: '#f3f3f6',
  surfaceContainerHigh: '#e8e8ea',
  surfaceContainerHighest: '#e2e2e5',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dadadc',
  surfaceVariant: '#e2e2e5',

  onSurface: '#1a1c1e',
  onSurfaceVariant: '#44474e',
  onBackground: '#1a1c1e',

  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  surfaceTint: '#465f88',

  icon: brand.navy,
  iconMuted: '#74777f',
  iconOnAccent: '#ffffff',
  iconGold: brand.gold,

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
  success: '#1a8038',
  successBg: '#e7f5ed',

  gradientStart: '#f9f9fc',
  gradientMid: '#f3f3f6',
  gradientEnd: '#ffffff',
};

export const spacing = {
  unit1: 4,
  unit2: 8,
  unit3: 12,
  unit4: 16,
  unit6: 24,
  unit8: 32,
  unit12: 48,
  containerMargin: 16,
};

export const typography = {
  headlineLg: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  headlineLgMobile: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  headlineMd: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  bodyLg: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
  bodyMd: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  labelLg: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.5 },
  labelMd: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.5 },
  priceDisplay: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
};
