import { Alert, NativeModules } from 'react-native';

import { brand } from '@/lib/theme';

import type {
  RazorpayCheckoutResult,
  RazorpayOrderResponse,
  RazorpayPrefill,
} from '@/lib/razorpayTypes';
import { strapiFetch } from '@/lib/strapi';
import { useRazorpayCheckoutStore } from '@/stores/razorpayCheckout';

export type { RazorpayCheckoutResult, RazorpayOrderResponse, RazorpayPrefill };

export async function createRazorpayOrder(amount: number): Promise<RazorpayOrderResponse> {
  return strapiFetch<RazorpayOrderResponse>('/api/payment/razorpay-order', {
    method: 'POST',
    auth: true,
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
    auth: true,
    body: payload,
  });
}

function hasNativeRazorpayModule(): boolean {
  return Boolean((NativeModules as { RazorpayCheckout?: unknown }).RazorpayCheckout);
}

async function openNativeRazorpayCheckout(
  order: RazorpayOrderResponse,
  prefill?: RazorpayPrefill
): Promise<RazorpayCheckoutResult> {
  const RazorpayCheckout = require('react-native-razorpay').default as {
    open: (options: Record<string, unknown>) => Promise<RazorpayCheckoutResult>;
  };

  try {
    return await RazorpayCheckout.open({
      description: 'ARK order payment',
      currency: order.currency || 'INR',
      key: order.keyId,
      amount: order.amount,
      name: 'ARK',
      order_id: order.id,
      prefill: {
        contact: prefill?.contact,
        email: prefill?.email,
      },
      theme: { color: brand.navy },
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 0 || code === 2) {
      throw new Error('Payment cancelled');
    }
    throw err;
  }
}

async function openWebRazorpayCheckout(
  order: RazorpayOrderResponse,
  prefill?: RazorpayPrefill
): Promise<RazorpayCheckoutResult> {
  if (!order.keyId) {
    throw new Error('Razorpay is not configured on the server');
  }

  return useRazorpayCheckoutStore.getState().startWebCheckout({
    keyId: order.keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency || 'INR',
    prefill,
  });
}

function simulateMockPayment(order: RazorpayOrderResponse, amount: number) {
  return new Promise<{ razorpayOrderId: string; razorpayPaymentId: string }>((resolve, reject) => {
    Alert.alert(
      'Pay Online (Test mode)',
      `Razorpay keys are not set on the server, so this is a simulated payment of ₹${amount.toLocaleString('en-IN')}. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the CMS .env for real payments.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Payment cancelled')) },
        {
          text: 'Simulate pay',
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

export async function processOnlinePayment(
  amount: number,
  prefill?: RazorpayPrefill
): Promise<{
  razorpayOrderId: string;
  razorpayPaymentId: string;
}> {
  const order = await createRazorpayOrder(amount);

  if (order.mock) {
    return simulateMockPayment(order, amount);
  }

  let payment: RazorpayCheckoutResult;

  if (hasNativeRazorpayModule()) {
    try {
      payment = await openNativeRazorpayCheckout(order, prefill);
    } catch (nativeError) {
      const message = nativeError instanceof Error ? nativeError.message : 'Native payment failed';
      if (message === 'Payment cancelled') throw nativeError;
      payment = await openWebRazorpayCheckout(order, prefill);
    }
  } else {
    payment = await openWebRazorpayCheckout(order, prefill);
  }

  await verifyRazorpayPayment({
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    razorpay_signature: payment.razorpay_signature,
  });

  return {
    razorpayOrderId: payment.razorpay_order_id,
    razorpayPaymentId: payment.razorpay_payment_id,
  };
}
