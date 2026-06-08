import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { calcDeliveryFee, calcSubtotal, calcTaxes, calcTotal } from '@/lib/pricing';
import { getProductVariants } from '@/lib/productPricing';
import { mediaUrl } from '@/lib/strapi';
import type { OrderItem, Product, ProductVariant } from '@/lib/types';

export type CartLine = {
  lineId: string;
  productDocumentId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
};

export function cartLineId(productDocumentId: string, variantId?: string) {
  return variantId && variantId !== 'default' ? `${productDocumentId}:${variantId}` : productDocumentId;
}

type AddItemOptions = {
  quantity?: number;
  variant?: ProductVariant;
};

type CartState = {
  items: CartLine[];
  addItem: (product: Product, options?: AddItemOptions) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  reorderLines: (lines: OrderItem[]) => void;
  itemCount: () => number;
  subtotal: () => number;
  taxes: () => number;
  deliveryFee: () => number;
  total: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, options = {}) => {
        const quantity = options.quantity ?? 1;
        const variants = getProductVariants(product);
        const variant = options.variant ?? variants[0];
        const lineId = cartLineId(product.documentId, variant.id);
        const displayName =
          variant.id === 'default'
            ? product.name
            : `${product.name} (${variant.label})`;

        const imagePath = product.image?.url;
        const imageUrl = mediaUrl(imagePath);

        const items = [...get().items];
        const idx = items.findIndex((i) => i.lineId === lineId);

        if (idx >= 0) {
          items[idx].quantity += quantity;
        } else {
          items.push({
            lineId,
            productDocumentId: product.documentId,
            variantId: variant.id !== 'default' ? variant.id : undefined,
            variantLabel: variant.id !== 'default' ? variant.label : undefined,
            name: displayName,
            unit: product.unit,
            unitPrice: Number(variant.price),
            quantity,
            imageUrl,
          });
        }
        set({ items });
      },

      removeItem: (lineId) => {
        set({ items: get().items.filter((i) => i.lineId !== lineId) });
      },

      updateQuantity: (lineId, quantity) => {
        if (quantity < 1) {
          get().removeItem(lineId);
          return;
        }
        set({
          items: get().items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
        });
      },

      clear: () => set({ items: [] }),

      reorderLines: (lines) => {
        const items = lines.map((line) => ({
          lineId: cartLineId(line.productDocumentId ?? line.productName, line.variantId),
          productDocumentId: line.productDocumentId ?? line.productName,
          variantId: line.variantId,
          variantLabel: line.variantLabel,
          name: line.productName,
          unit: line.unit ?? 'Piece',
          unitPrice: Number(line.unitPrice),
          quantity: line.quantity,
        }));
        set({ items });
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => calcSubtotal(get().items),

      taxes: () => calcTaxes(get().subtotal()),

      deliveryFee: () => calcDeliveryFee(get().subtotal()),

      total: () =>
        calcTotal(get().subtotal(), get().taxes(), get().deliveryFee()),
    }),
    {
      name: 'ark-cart',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      migrate: (persisted, version) => {
        const state = persisted as { items?: CartLine[]; deliveryAddress?: string };
        if (!state?.items) return state as typeof persisted;
        const next = {
          items: state.items.map((item) => ({
            ...item,
            lineId:
              item.lineId ??
              cartLineId(item.productDocumentId, item.variantId),
          })),
        };
        if (version < 2 && state.deliveryAddress) {
          return next;
        }
        return next;
      },
    }
  )
);
