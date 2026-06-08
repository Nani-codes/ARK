import crypto from 'crypto';

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export default {
  async createRazorpayOrder(ctx) {
    const { amount, currency = 'INR' } = ctx.request.body ?? {};

    const paise = Math.round(Number(amount) * 100);
    if (!paise || paise < 100) {
      return ctx.badRequest('Valid amount in rupees is required');
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      const mockId = `order_mock_${Date.now()}`;
      strapi.log.info(`[razorpay-mock] Created order ${mockId} for ₹${amount}`);
      return ctx.send({
        id: mockId,
        amount: paise,
        currency,
        status: 'created',
        mock: true,
        keyId: null,
      });
    }

    const receipt = `ark_${Date.now()}`;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: paise, currency, receipt }),
    });

    if (!res.ok) {
      const errText = await res.text();
      strapi.log.error(`Razorpay order failed: ${errText}`);
      return ctx.internalServerError('Payment gateway error');
    }

    const order = (await res.json()) as RazorpayOrderResponse;
    ctx.send({ ...order, keyId, mock: false });
  },

  async verifyRazorpayPayment(ctx) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      ctx.request.body ?? {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return ctx.badRequest('Missing payment verification fields');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      strapi.log.info(`[razorpay-mock] Verified payment ${razorpay_payment_id}`);
      return ctx.send({ verified: true, mock: true });
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return ctx.badRequest('Invalid payment signature');
    }

    ctx.send({ verified: true, mock: false });
  },
};
