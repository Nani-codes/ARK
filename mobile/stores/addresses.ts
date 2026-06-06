import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  addAddress: (input: AddressInput) => string;
  updateAddress: (id: string, partial: Partial<AddressInput>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  setDefault: (id: string) => void;
  getSelected: () => SavedAddress | null;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedId: null,

      addAddress: (input) => {
        const id = uid();
        const isFirst = get().addresses.length === 0;
        const makeDefault = input.isDefault ?? isFirst;

        const newAddr: SavedAddress = { ...input, id, isDefault: makeDefault };

        set((s) => ({
          addresses: makeDefault
            ? [...s.addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
            : [...s.addresses, newAddr],
          selectedId: s.selectedId ?? id,
        }));
        return id;
      },

      updateAddress: (id, partial) => {
        const makeDefault = partial.isDefault === true;
        set((s) => ({
          addresses: s.addresses.map((a) => {
            if (a.id === id) return { ...a, ...partial, isDefault: makeDefault || a.isDefault };
            if (makeDefault) return { ...a, isDefault: false };
            return a;
          }),
        }));
      },

      removeAddress: (id) => {
        set((s) => {
          const next = s.addresses.filter((a) => a.id !== id);
          const wasDefault = s.addresses.find((a) => a.id === id)?.isDefault;
          if (wasDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
          return {
            addresses: next,
            selectedId: s.selectedId === id
              ? (next[0]?.id ?? null)
              : s.selectedId,
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
      },

      getSelected: () => {
        const { addresses, selectedId } = get();
        if (selectedId) return addresses.find((a) => a.id === selectedId) ?? null;
        return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
      },
    }),
    {
      name: 'ark-addresses',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ addresses: s.addresses, selectedId: s.selectedId }),
    }
  )
);
