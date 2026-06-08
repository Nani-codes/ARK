import { Alert } from 'react-native';

import { strapiFetch } from '@/lib/strapi';

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  keyId: string | null;
  mock: boolean;
};

export async function createRazorpayOrder(amount: number): Promise<RazorpayOrderResponse> {
  return strapiFetch<RazorpayOrderResponse>('/api/payment/razorpay-order', {
    method: 'POST',
    body: { amount },
  });
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  return strapiFetch<{ verified: boolean; mock: boolean }>('/api/payment/verify', {
    method: 'POST',
    body: payload,
  });
}

/** Dev-friendly payment flow; replace with react-native-razorpay in production builds. */
export async function processOnlinePayment(amount: number): Promise<{
  razorpayOrderId: string;
  razorpayPaymentId: string;
}> {
  const order = await createRazorpayOrder(amount);

  if (order.mock) {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Pay Online (Dev)',
        `Simulate Razorpay payment of ₹${amount.toLocaleString('en-IN')}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Payment cancelled')) },
          {
            text: 'Pay',
            onPress: () => {
              const paymentId = `pay_mock_${Date.now()}`;
              void verifyRazorpayPayment({
                razorpay_order_id: order.id,
                razorpay_payment_id: paymentId,
                razorpay_signature: 'mock',
              });
              resolve({ razorpayOrderId: order.id, razorpayPaymentId: paymentId });
            },
          },
        ]
      );
    });
  }

  throw new Error('Native Razorpay checkout required when RAZORPAY_KEY_ID is configured');
}
