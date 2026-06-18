export default {
  routes: [
    {
      method: 'GET',
      path: '/user-profile/me',
      handler: 'user-profile.me',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/user-profile/me',
      handler: 'user-profile.updateMe',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/user-profile/push-token',
      handler: 'user-profile.savePushToken',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-profile/professionals',
      handler: 'user-profile.listProfessionals',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
