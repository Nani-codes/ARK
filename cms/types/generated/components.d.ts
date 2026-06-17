import type { Schema, Struct } from '@strapi/strapi';

export interface OrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_order_items';
  info: {
    displayName: 'Order Item';
    icon: 'shoppingCart';
  };
  attributes: {
    lineTotal: Schema.Attribute.Decimal & Schema.Attribute.Required;
    productDocumentId: Schema.Attribute.String;
    productName: Schema.Attribute.String & Schema.Attribute.Required;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    sku: Schema.Attribute.String;
    unit: Schema.Attribute.String;
    unitPrice: Schema.Attribute.Decimal & Schema.Attribute.Required;
    variantId: Schema.Attribute.String;
    variantLabel: Schema.Attribute.String;
  };
}

export interface ProductProductSpec extends Struct.ComponentSchema {
  collectionName: 'components_product_product_specs';
  info: {
    description: 'One product spec line (e.g. Grade \u2192 PPC).';
    displayName: 'Specification';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductProductVariant extends Struct.ComponentSchema {
  collectionName: 'components_product_product_variants';
  info: {
    description: 'One purchasable option (e.g. 1/2 inch, 10 bags). Add a row per size or pack.';
    displayName: 'Size / pack option';
    icon: 'layer';
  };
  attributes: {
    compareAtPrice: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    optionKey: Schema.Attribute.String;
    price: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface ProductVariantAxis extends Struct.ComponentSchema {
  collectionName: 'components_product_variant_axes';
  info: {
    description: 'A variant dimension (e.g. Color, Size). Values are comma-separated.';
    displayName: 'Variant Axis';
    icon: 'apps';
  };
  attributes: {
    axisName: Schema.Attribute.String & Schema.Attribute.Required;
    values: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface ProductVariantCombination extends Struct.ComponentSchema {
  collectionName: 'components_product_variant_combinations';
  info: {
    description: 'One purchasable combination (e.g. Red / 12x12). Each row is a unique SKU.';
    displayName: 'Variant Combination';
    icon: 'grid';
  };
  attributes: {
    axisValues: Schema.Attribute.String & Schema.Attribute.Required;
    compareAtPrice: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    image: Schema.Attribute.Media<'images'>;
    price: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    sku: Schema.Attribute.String & Schema.Attribute.Required;
    stock: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order.order-item': OrderOrderItem;
      'product.product-spec': ProductProductSpec;
      'product.product-variant': ProductProductVariant;
      'product.variant-axis': ProductVariantAxis;
      'product.variant-combination': ProductVariantCombination;
    }
  }
}
