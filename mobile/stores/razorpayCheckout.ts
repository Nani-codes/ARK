import { create } from 'zustand';

import type { RazorpayCheckoutResult } from '@/lib/razorpayTypes';

export type RazorpayWebSession = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  prefill?: { contact?: string; email?: string };
  resolve: (result: RazorpayCheckoutResult) => void;
  reject: (error: Error) => void;
};

type RazorpayCheckoutState = {
  session: RazorpayWebSession | null;
  startWebCheckout: (params: Omit<RazorpayWebSession, 'resolve' | 'reject'>) => Promise<RazorpayCheckoutResult>;
  completeWebCheckout: (result: RazorpayCheckoutResult) => void;
  cancelWebCheckout: (message?: string) => void;
};

export const useRazorpayCheckoutStore = create<RazorpayCheckoutState>((set, get) => ({
  session: null,

  startWebCheckout: (params) =>
    new Promise<RazorpayCheckoutResult>((resolve, reject) => {
      set({
        session: {
          ...params,
          resolve: (result) => {
            set({ session: null });
            resolve(result);
          },
          reject: (error) => {
            set({ session: null });
            reject(error);
          },
        },
      });
    }),

  completeWebCheckout: (result) => {
    get().session?.resolve(result);
  },

  cancelWebCheckout: (message = 'Payment cancelled') => {
    get().session?.reject(new Error(message));
  },
}));
