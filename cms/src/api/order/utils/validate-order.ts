import { errors } from '@strapi/utils';
import type { Core } from '@strapi/strapi';

import {
  COD_MAX_TOTAL,
  calcDeliveryFee,
  calcSubtotal,
  calcTaxes,
  calcTotal,
} from './pricing';

type IncomingItem = {
  productDocumentId?: string;
  productName?: string;
  variantId?: string;
  variantLabel?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

type ValidatedItem = {
  productName: string;
  productDocumentId?: string;
  variantId?: string;
  variantLabel?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function findVariant(
  variants: Array<{ optionKey?: string; label?: string; price?: number }> | undefined,
  variantId?: string
) {
  if (!variants?.length) return null;
  if (!variantId || variantId === 'default') return variants[0];
  return (
    variants.find((v) => v.optionKey === variantId) ??
    variants.find((v) => v.label === variantId) ??
    null
  );
}

async function isPincodeServiceable(strapi: Core.Strapi, pincode?: string) {
  if (!pincode) return false;
  const normalized = String(pincode).replace(/\D/g, '').slice(0, 6);
  if (normalized.length !== 6) return false;

  const count = await strapi.db.query('api::serviceable-pincode.serviceable-pincode').count({
    where: { pincode: normalized, active: true },
  });
  return count > 0;
}

export async function validateAndPriceOrder(
  strapi: Core.Strapi,
  data: Record<string, unknown>
) {
  const items = data.items as IncomingItem[] | undefined;
  if (!items?.length) {
    throw new errors.ValidationError('Order must include at least one item');
  }

  const validatedItems: ValidatedItem[] = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!quantity || quantity < 1) {
      throw new errors.ValidationError('Invalid item quantity');
    }

    let unitPrice = Number(item.unitPrice);
    let productName = item.productName ?? 'Product';
    let variantId = item.variantId;
    let variantLabel = item.variantLabel;
    let unit: string | undefined;

    if (item.productDocumentId) {
      const product = await strapi.db.query('api::product.product').findOne({
        where: { documentId: item.productDocumentId },
        populate: ['variants'],
      });

      if (!product) {
        throw new errors.ValidationError(`Product not found: ${item.productDocumentId}`);
      }

      if (!product.inStock) {
        throw new errors.ValidationError(`${product.name} is out of stock`);
      }

      const variant = findVariant(product.variants, variantId);
      if (variant) {
        unitPrice = Number(variant.price ?? product.price);
        variantId = variant.optionKey ?? variantId;
        variantLabel = variant.label ?? variantLabel;
        productName =
          variantId && variantId !== 'default'
            ? `${product.name} (${variant.label})`
            : product.name;
      } else {
        unitPrice = Number(product.price);
        productName = product.name;
      }
      unit = product.unit;
    }

    if (!unitPrice || unitPrice <= 0) {
      throw new errors.ValidationError('Invalid item price');
    }

    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    validatedItems.push({
      productName,
      productDocumentId: item.productDocumentId,
      variantId: variantId && variantId !== 'default' ? variantId : undefined,
      variantLabel,
      unit,
      quantity,
      unitPrice,
      lineTotal,
    });
  }

  const subtotal = calcSubtotal(validatedItems);
  const deliveryFee = calcDeliveryFee(subtotal);
  const taxes = calcTaxes(subtotal);
  const total = calcTotal(subtotal, deliveryFee);

  const paymentMethod = data.paymentMethod as string;
  if (paymentMethod === 'cod' && total > COD_MAX_TOTAL) {
    throw new errors.ValidationError(
      `Cash on Delivery is only available for orders up to ₹${COD_MAX_TOTAL.toLocaleString('en-IN')}`
    );
  }

  const pincode = data.pincode as string | undefined;
  if (pincode) {
    const serviceable = await isPincodeServiceable(strapi, pincode);
    if (!serviceable) {
      throw new errors.ValidationError(`Pincode ${pincode} is not serviceable in Hyderabad yet`);
    }
  }

  return { items: validatedItems, subtotal, taxes, deliveryFee, total };
}
