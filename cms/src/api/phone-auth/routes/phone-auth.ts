export default {
  routes: [
    {
      method: 'POST',
      path: '/phone-auth/send-otp',
      handler: 'phone-auth.sendOtp',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/phone-auth/verify',
      handler: 'phone-auth.verify',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/phone-auth/set-password',
      handler: 'phone-auth.setPassword',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
