import { normalizeOrderStatusField } from '../../utils/normalize-order-data';

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    normalizeOrderStatusField(data);

    const ctx = strapi.requestContext.get();

    if (ctx?.state?.user) {
      data.user = ctx.state.user.id;
    }

    if (!data.orderNumber) {
      data.orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    }
  },

  async beforeUpdate(event) {
    normalizeOrderStatusField(event.params.data);
  },
};
