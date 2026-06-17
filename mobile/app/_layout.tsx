import { MaterialIcons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '@/stores/auth';
import { useLocationStore } from '@/stores/location';

import { CartToast } from '@/components/CartToast';
import { RazorpayWebCheckoutModal } from '@/components/RazorpayWebCheckoutModal';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialIcons.font,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const runResolve = () => {
      void useLocationStore.getState().resolveFromDevice();
    };

    if (useLocationStore.persist.hasHydrated()) {
      runResolve();
      return;
    }

    return useLocationStore.persist.onFinishHydration(runResolve);
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <CartToast />
      <RazorpayWebCheckoutModal />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category/[slug]" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-success" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="search" />
        <Stack.Screen name="quote" />
        <Stack.Screen name="quotes/index" />
        <Stack.Screen name="profile/gst" />
        <Stack.Screen name="profile/payments" />
        <Stack.Screen name="profile/support" />
        <Stack.Screen name="profile/professional" />
        <Stack.Screen name="professionals/index" />
        <Stack.Screen name="returns/request" />
        <Stack.Screen name="address/select" />
        <Stack.Screen name="address/add" />
      </Stack>
    </QueryClientProvider>
  );
}
