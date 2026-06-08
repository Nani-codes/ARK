import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type GstState = {
  gstin: string;
  businessName: string;
  savedAt: string | null;
  setGstin: (gstin: string) => void;
  setBusinessName: (name: string) => void;
  save: () => void;
};

export const useGstStore = create<GstState>()(
  persist(
    (set, get) => ({
      gstin: '',
      businessName: '',
      savedAt: null,
      setGstin: (gstin) => set({ gstin }),
      setBusinessName: (businessName) => set({ businessName }),
      save: () => set({ savedAt: new Date().toISOString() }),
    }),
    {
      name: 'ark-gst',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
