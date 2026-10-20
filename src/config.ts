/** Staging by default; a store build sets EXPO_PUBLIC_API_URL=https://api.runmeal.com. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api-staging.runmeal.com/api';

const STAGING = {
  portalWebOrigin: 'https://staging-portalfe.runmeal.com',
  // portalfe's .env.staging NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  recaptchaSiteKey: '6LdNQdctAAAAAEUyqV33UzBZShZrRpmcnMu-Rgca',
  // runmeal-api checks the Google ID token audience against its own GOOGLE_CLIENT_ID.
  googleWebClientId: '709162763845-i8m3ql8e9a32kmrntm4gibru2kr6hktm.apps.googleusercontent.com',
};
const PRODUCTION = {
  portalWebOrigin: 'https://portalfe.runmeal.com',
  recaptchaSiteKey: '6LcI-r4tAAAAACBuj3v6pG8RBJmXW2RA132gGjJI',
  googleWebClientId: '709162763845-204l0a59busg4vglg9uv24aphlaq9j7r.apps.googleusercontent.com',
};

/** api-staging.runmeal.com (Cloudflare edge) and staging-api.runmeal.com reach the same staging API. */
export function resolveEnv(apiUrl: string) {
  const isStaging = new URL(apiUrl).hostname.includes('staging');
  return { isStaging, ...(isStaging ? STAGING : PRODUCTION) };
}

const env = resolveEnv(API_URL);
export const IS_STAGING = env.isStaging;
/** Sent as Origin on POST /payments/initialize: the provider returns to `${origin}/payment/callback`. */
export const PORTAL_WEB_ORIGIN = process.env.EXPO_PUBLIC_PORTAL_WEB_ORIGIN ?? env.portalWebOrigin;
export const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? env.recaptchaSiteKey;
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? env.googleWebClientId;
/**
 * The iOS OAuth client Google Cloud issues for com.runmeal.portal. Empty means
 * Google sign-in is not configured on iOS: the button explains that instead of
 * calling the native SDK, which crashes without the client's URL scheme.
 */
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
/** Default on; EXPO_PUBLIC_SIGN_IN_GOOGLE=0 hides the Google button. */
export const SIGN_IN_GOOGLE = process.env.EXPO_PUBLIC_SIGN_IN_GOOGLE !== '0';
/** Default on; EXPO_PUBLIC_SIGN_IN_APPLE=0 hides the Apple button. runmeal-api must accept com.runmeal.portal as an Apple audience. */
export const SIGN_IN_APPLE = process.env.EXPO_PUBLIC_SIGN_IN_APPLE !== '0';
