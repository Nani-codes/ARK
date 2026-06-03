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
  },
};
