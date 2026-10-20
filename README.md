# Runmeal portal app

Customer app for the Runmeal marketplace: browse restaurants near you, order and pay. Built with Expo SDK 58 and Expo Router.

## Setup

```bash
npm install
npx expo run:ios      # or: npx expo run:android
```

`ios/` and `android/` are generated from `app.config.ts` (Continuous Native Generation) and are not committed.

## Environment

The environment is picked from the host of `API_URL`: a host containing `staging` selects the staging values. Every value can be overridden with an `EXPO_PUBLIC_*` variable.

| Setting | Variable | Staging (default) | Production |
|---|---|---|---|
| `API_URL` | `EXPO_PUBLIC_API_URL` | `https://staging-api.runmeal.com` | `https://api.runmeal.com` |
| `PORTAL_WEB_ORIGIN` | `EXPO_PUBLIC_PORTAL_WEB_ORIGIN` | `https://staging-portalfe.runmeal.com` | `https://portalfe.runmeal.com` |
| `RECAPTCHA_SITE_KEY` | `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` | portal web `.env.staging` key | portal web `.env.production` key |
| `GOOGLE_WEB_CLIENT_ID` | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | staging web client id | production web client id |
| `GOOGLE_IOS_CLIENT_ID` | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | empty | empty |
| `SIGN_IN_GOOGLE` | `EXPO_PUBLIC_SIGN_IN_GOOGLE` | on (`0` turns it off) | on (`0` turns it off) |
| `SIGN_IN_APPLE` | `EXPO_PUBLIC_SIGN_IN_APPLE` | on (`0` turns it off) | on (`0` turns it off) |
| `SHOW_MOCKS` | `EXPO_PUBLIC_SHOW_MOCKS` | on (`0` hides every "(Mock)" section and field) | set `0` for store builds |

`API_URL` defaults to `https://staging-api.runmeal.com`, not `api-staging.runmeal.com/api`: that host is the Cloudflare brand edge and rejects sign-in with `BRAND_DOMAIN_NOT_FOUND`.

Build-time only: `GOOGLE_IOS_URL_SCHEME` (adds the Google Sign-In config plugin; derived from `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` when unset) and `PERSONAL_TEAM=1` (build for a free Apple team without Sign in with Apple).

### Making Google and Apple sign-in work

Both buttons show by default. Until the steps below are done they appear but cannot finish a sign-in.

- Google, iOS: create an iOS OAuth client for `com.runmeal.portal` in Google Cloud and put its ID in `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. While it is empty the iOS button only shows a "not ready" message.
- Google, Android: create an Android OAuth client with the package `com.runmeal.portal` and the signing certificate's SHA-1.
- Apple: the backend's `APPLE_SIGNIN_BUNDLE_ID` must accept `com.runmeal.portal`.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npx jest           # tests
npx expo-doctor    # dependency and config diagnostics
```

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.
