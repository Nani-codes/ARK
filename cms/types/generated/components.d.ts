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
    description: 'One sellable combination with its price. Use \u201CCustomer choice groups\u201D above to auto-create these, then set each price here.';
    displayName: 'Price option';
    icon: 'layer';
  };
  attributes: {
    choices: Schema.Attribute.Component<'product.variant-choice', true>;
    compareAtPrice: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    image: Schema.Attribute.Media<'images'>;
    label: Schema.Attribute.String;
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

export interface ProductVariantChoice extends Struct.ComponentSchema {
  collectionName: 'components_product_variant_choices';
  info: {
    description: 'Filled automatically when combinations are built. You usually only edit the price above.';
    displayName: 'Choice value';
    icon: 'check';
  };
  attributes: {
    choice: Schema.Attribute.String & Schema.Attribute.Required;
    groupName: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductVariantOptionGroup extends Struct.ComponentSchema {
  collectionName: 'components_product_variant_option_groups';
  info: {
    description: 'One type of choice shoppers make \u2014 e.g. Colour, Size, or Finish. Write each choice separated by a comma.';
    displayName: 'Customer choice group';
    icon: 'bulletList';
  };
  attributes: {
    choices: Schema.Attribute.Text & Schema.Attribute.Required;
    groupName: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order.order-item': OrderOrderItem;
      'product.product-spec': ProductProductSpec;
      'product.product-variant': ProductProductVariant;
      'product.variant-choice': ProductVariantChoice;
      'product.variant-option-group': ProductVariantOptionGroup;
    }
  }
}
