/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_LINKEDIN_LOGIN: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare class Razorpay {
  constructor(options: RazorpayOptions);
  open(): void;
}

interface Window {
  Razorpay: typeof Razorpay;
}
