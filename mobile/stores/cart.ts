import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { calcDeliveryFee, calcSubtotal, calcTaxes, calcTotal } from '@/lib/pricing';
import {
  getEffectivePricingTiers,
  getProductVariants,
  resolveProductImageUrl,
  resolveUnitPrice,
} from '@/lib/productPricing';
import type { OrderItem, PricingTier, Product, ProductVariant } from '@/lib/types';

export type CartLine = {
  lineId: string;
  productDocumentId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  unit: string;
  unitPrice: number;
  baseUnitPrice: number;
  pricingTiers?: PricingTier[];
  quantity: number;
  imageUrl?: string;
  temperatureSensitive?: boolean;
  temperatureNote?: string;
};

export function cartLineId(productDocumentId: string, variantId?: string) {
  return variantId && variantId !== 'default' ? `${productDocumentId}:${variantId}` : productDocumentId;
}

export function buildCartLine(
  product: Product,
  variant: ProductVariant,
  quantity: number
): CartLine {
  const lineId = cartLineId(product.documentId, variant.id);
  const displayName =
    variant.id === 'default' ? product.name : `${product.name} (${variant.label})`;
  const tiers = getEffectivePricingTiers(product, variant);
  const baseUnitPrice = Number(variant.price);
  const unitPrice = resolveUnitPrice(baseUnitPrice, quantity, tiers);

  return {
    lineId,
    productDocumentId: product.documentId,
    variantId: variant.id !== 'default' ? variant.id : undefined,
    variantLabel: variant.id !== 'default' ? variant.label : undefined,
    name: displayName,
    unit: product.unit,
    baseUnitPrice,
    pricingTiers: tiers,
    unitPrice,
    quantity,
    imageUrl: resolveProductImageUrl(product, variant),
    temperatureSensitive: product.temperatureSensitive,
    temperatureNote: product.temperatureNote,
  };
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
        const line = buildCartLine(product, variant, quantity);

        const items = [...get().items];
        const idx = items.findIndex((i) => i.lineId === line.lineId);

        if (idx >= 0) {
          const nextQty = items[idx].quantity + quantity;
          items[idx] = {
            ...items[idx],
            quantity: nextQty,
            unitPrice: resolveUnitPrice(
              items[idx].baseUnitPrice,
              nextQty,
              items[idx].pricingTiers
            ),
          };
        } else {
          items.push(line);
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
          items: get().items.map((i) => {
            if (i.lineId !== lineId) return i;
            return {
              ...i,
              quantity,
              unitPrice: resolveUnitPrice(i.baseUnitPrice, quantity, i.pricingTiers),
            };
          }),
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
          baseUnitPrice: Number(line.unitPrice),
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
      version: 3,
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
            baseUnitPrice: item.baseUnitPrice ?? item.unitPrice,
          })),
        };
        if (version < 3) {
          return {
            items: next.items.map((item) => ({
              ...item,
              unitPrice: resolveUnitPrice(
                item.baseUnitPrice,
                item.quantity,
                item.pricingTiers
              ),
            })),
          };
        }
        if (version < 2 && state.deliveryAddress) {
          return next;
        }
        return next;
      },
    }
  )
);
