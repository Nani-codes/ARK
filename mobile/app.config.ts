import type { ConfigContext, ExpoConfig } from 'expo/config';

const STRAPI_URL =
  process.env.EXPO_PUBLIC_STRAPI_URL?.replace(/\/$/, '') ?? 'http://localhost:1337';

/** @see https://expo.dev/accounts/nani1/projects/ark-procurement */
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? '2d52b1d8-3fcc-43bf-90ab-51ef3da64145';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId =
    EAS_PROJECT_ID ??
    (config.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

  return {
    name: 'ARK',
    slug: 'ark-procurement',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'ark',
    userInterfaceStyle: 'automatic',
    owner: 'nani1',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.trilolabs.ark',
    },
    android: {
      package: 'com.trilolabs.ark',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#f9f9fc',
        },
      ],
      'expo-secure-store',
      'expo-image',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'ARK uses your location to set your delivery address and show nearby delivery availability.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    ...(projectId
      ? {
          runtimeVersion: { policy: 'appVersion' as const },
          updates: { url: `https://u.expo.dev/${projectId}` },
        }
      : {}),
    extra: {
      strapiUrl: STRAPI_URL,
      router: {},
      eas: projectId ? { projectId } : {},
    },
  };
};
