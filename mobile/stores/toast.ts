import { create } from 'zustand';

type ToastState = {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message });
    hideTimer = setTimeout(() => set({ message: null }), 2200);
  },
  clear: () => set({ message: null }),
}));
