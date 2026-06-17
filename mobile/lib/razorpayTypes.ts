export type RazorpayCheckoutResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  keyId: string | null;
  mock: boolean;
};

export type RazorpayPrefill = {
  contact?: string;
  email?: string;
};
