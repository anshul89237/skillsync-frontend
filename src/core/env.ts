const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

export const env = {
  API_BASE_URL: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api'),
  ENABLE_LINKEDIN_LOGIN: String(import.meta.env.VITE_ENABLE_LINKEDIN_LOGIN || 'false').toLowerCase() === 'true',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
} as const;

export type AppEnv = typeof env;