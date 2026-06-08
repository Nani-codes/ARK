export default {
  routes: [
    {
      method: 'POST',
      path: '/payment/razorpay-order',
      handler: 'payment.createRazorpayOrder',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/payment/verify',
      handler: 'payment.verifyRazorpayPayment',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
