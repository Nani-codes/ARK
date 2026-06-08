import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createCloudAddress,
  deleteCloudAddress,
  fetchCloudAddresses,
  updateCloudAddress,
} from '@/lib/api';
import type { AddressType, SavedAddress } from '@/lib/types';

export type AddressInput = {
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
  isDefault?: boolean;
};

type AddressState = {
  addresses: SavedAddress[];
  selectedId: string | null;
  cloudSynced: boolean;
  addAddress: (input: AddressInput) => Promise<string>;
  updateAddress: (id: string, partial: Partial<AddressInput>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
  setDefault: (id: string) => void;
  getSelected: () => SavedAddress | null;
  syncFromCloud: (hasAuth: boolean) => Promise<void>;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function mapCloudAddress(raw: SavedAddress & { documentId: string }): SavedAddress {
  return {
    id: raw.documentId,
    documentId: raw.documentId,
    label: raw.label,
    flat: raw.flat,
    building: raw.building,
    street: raw.street,
    landmark: raw.landmark,
    city: raw.city,
    state: raw.state,
    pincode: raw.pincode,
    instructions: raw.instructions,
    lat: raw.lat,
    lng: raw.lng,
    isDefault: raw.isDefault,
  };
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedId: null,
      cloudSynced: false,

      addAddress: async (input) => {
        const id = uid();
        const isFirst = get().addresses.length === 0;
        const makeDefault = input.isDefault ?? isFirst;
        const newAddr: SavedAddress = { ...input, id, isDefault: makeDefault };

        try {
          const res = await createCloudAddress({
            label: input.label,
            flat: input.flat,
            building: input.building,
            street: input.street,
            landmark: input.landmark,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            instructions: input.instructions,
            lat: input.lat,
            lng: input.lng,
            isDefault: makeDefault,
          });
          const cloud = mapCloudAddress(res.data);
          set((s) => ({
            addresses: makeDefault
              ? [...s.addresses.map((a) => ({ ...a, isDefault: false })), cloud]
              : [...s.addresses, cloud],
            selectedId: s.selectedId ?? cloud.id,
          }));
          return cloud.id;
        } catch {
          set((s) => ({
            addresses: makeDefault
              ? [...s.addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
              : [...s.addresses, newAddr],
            selectedId: s.selectedId ?? id,
          }));
          return id;
        }
      },

      updateAddress: async (id, partial) => {
        const makeDefault = partial.isDefault === true;
        const existing = get().addresses.find((a) => a.id === id);

        if (existing?.documentId) {
          try {
            await updateCloudAddress(existing.documentId, partial);
          } catch {
            // fall through to local update
          }
        }

        set((s) => ({
          addresses: s.addresses.map((a) => {
            if (a.id === id) return { ...a, ...partial, isDefault: makeDefault || a.isDefault };
            if (makeDefault) return { ...a, isDefault: false };
            return a;
          }),
        }));
      },

      removeAddress: async (id) => {
        const existing = get().addresses.find((a) => a.id === id);
        if (existing?.documentId) {
          try {
            await deleteCloudAddress(existing.documentId);
          } catch {
            // continue local delete
          }
        }

        set((s) => {
          const next = s.addresses.filter((a) => a.id !== id);
          const wasDefault = s.addresses.find((a) => a.id === id)?.isDefault;
          if (wasDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
          return {
            addresses: next,
            selectedId: s.selectedId === id ? (next[0]?.id ?? null) : s.selectedId,
          };
        });
      },

      selectAddress: (id) => {
        set((s) => ({
          selectedId: id,
          addresses: s.addresses.map((a) =>
            a.id === id ? { ...a, lastUsedAt: new Date().toISOString() } : a
          ),
        }));
      },

      setDefault: (id) => {
        set((s) => ({
          addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        }));
        const addr = get().addresses.find((a) => a.id === id);
        if (addr?.documentId) {
          void updateCloudAddress(addr.documentId, { isDefault: true });
        }
      },

      getSelected: () => {
        const { addresses, selectedId } = get();
        if (selectedId) return addresses.find((a) => a.id === selectedId) ?? null;
        return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
      },

      syncFromCloud: async (hasAuth) => {
        if (!hasAuth || get().cloudSynced) return;
        try {
          const res = await fetchCloudAddresses();
          if (res.data.length > 0) {
            set({
              addresses: res.data.map(mapCloudAddress),
              selectedId: res.data.find((a) => a.isDefault)?.documentId ?? res.data[0]?.documentId ?? null,
              cloudSynced: true,
            });
          }
        } catch {
          // keep local addresses
        }
      },
    }),
    {
      name: 'ark-addresses',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ addresses: s.addresses, selectedId: s.selectedId, cloudSynced: s.cloudSynced }),
    }
  )
);
