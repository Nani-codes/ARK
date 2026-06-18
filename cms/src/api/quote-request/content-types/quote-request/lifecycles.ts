export default {
  async beforeCreate(event) {
    const { data } = event.params;
    const ctx = strapi.requestContext.get();

    if (ctx?.state?.user) {
      data.user = ctx.state.user.id;
      if (!data.phone && ctx.state.user.username?.startsWith('user_')) {
        data.phone = ctx.state.user.username.replace('user_', '');
      }
    }

    if (data.quantity == null && data.quantityTons != null) {
      data.quantity = data.quantityTons;
      if (!data.quantityUnit) data.quantityUnit = 'Metric Ton';
    }

    if (data.quantity != null && data.quantityTons == null) {
      const unit = String(data.quantityUnit ?? '').toLowerCase();
      if (unit.includes('ton')) {
        data.quantityTons = data.quantity;
      }
    }

    const productId = data.product?.id ?? data.product;
    if (productId && !data.productName) {
      const product = await strapi.db.query('api::product.product').findOne({
        where: { id: productId },
      });
      if (product?.name) data.productName = product.name;
    }
  },
};
