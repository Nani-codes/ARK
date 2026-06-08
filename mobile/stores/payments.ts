import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PaymentsState = {
  upiId: string;
  neftReference: string;
  setUpiId: (upiId: string) => void;
  setNeftReference: (ref: string) => void;
};

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    (set) => ({
      upiId: '',
      neftReference: '',
      setUpiId: (upiId) => set({ upiId }),
      setNeftReference: (neftReference) => set({ neftReference }),
    }),
    {
      name: 'ark-payments',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
