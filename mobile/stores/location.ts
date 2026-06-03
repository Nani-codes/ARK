import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_DELIVERY_ADDRESS,
  DEFAULT_LOCATION_SHORT,
} from '@/lib/locationDefaults';
import { getDefaultLocation, resolveCurrentLocation } from '@/lib/resolveLocation';

type LocationSource = 'default' | 'device' | 'manual';

type LocationState = {
  shortLabel: string;
  deliveryAddress: string;
  source: LocationSource;
  isResolving: boolean;
  resolveFromDevice: (force?: boolean) => Promise<void>;
  setDeliveryAddress: (address: string) => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      shortLabel: DEFAULT_LOCATION_SHORT,
      deliveryAddress: DEFAULT_DELIVERY_ADDRESS,
      source: 'default',
      isResolving: false,

      resolveFromDevice: async (force = false) => {
        if (get().isResolving) return;
        if (!force && get().source === 'manual') return;

        set({ isResolving: true });

        const resolved = await resolveCurrentLocation();
        const next = resolved ?? getDefaultLocation();

        set({
          shortLabel: next.shortLabel,
          deliveryAddress: next.deliveryAddress,
          source: resolved ? 'device' : 'default',
          isResolving: false,
        });
      },

      setDeliveryAddress: (deliveryAddress) => {
        const shortLabel =
          deliveryAddress.split(',')[0]?.trim() || DEFAULT_LOCATION_SHORT;
        set({ deliveryAddress, shortLabel, source: 'manual' });
      },
    }),
    {
      name: 'ark-location',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        shortLabel: state.shortLabel,
        deliveryAddress: state.deliveryAddress,
        source: state.source,
      }),
      migrate: (persisted) => {
        const state = persisted as {
          deliveryAddress?: string;
          shortLabel?: string;
          source?: LocationSource;
        };
        if (!state) return state as typeof persisted;

        const legacyBangalore =
          state.deliveryAddress?.includes('Bangalore') ||
          state.deliveryAddress?.includes('HSR Layout');
        const legacyShort =
          state.shortLabel?.includes('Bangalore') ||
          state.shortLabel?.includes('HSR');

        if (legacyBangalore || legacyShort) {
          return {
            shortLabel: DEFAULT_LOCATION_SHORT,
            deliveryAddress: DEFAULT_DELIVERY_ADDRESS,
            source: 'default' as const,
          };
        }
        return state as typeof persisted;
      },
    }
  )
);
