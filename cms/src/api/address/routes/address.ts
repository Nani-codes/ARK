import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::address.address', {
  config: {
    find: { middlewares: [] },
    findOne: { middlewares: [] },
    create: { middlewares: [] },
    update: { middlewares: [] },
    delete: { middlewares: [] },
  },
});
