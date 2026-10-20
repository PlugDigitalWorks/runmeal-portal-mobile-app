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
| `API_URL` | `EXPO_PUBLIC_API_URL` | `https://api-staging.runmeal.com/api` | `https://api.runmeal.com` |
| `PORTAL_WEB_ORIGIN` | `EXPO_PUBLIC_PORTAL_WEB_ORIGIN` | `https://staging-portalfe.runmeal.com` | `https://portalfe.runmeal.com` |
| `RECAPTCHA_SITE_KEY` | `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` | portal web `.env.staging` key | portal web `.env.production` key |
| `GOOGLE_WEB_CLIENT_ID` | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | staging web client id | production web client id |
| `SIGN_IN_GOOGLE` | `EXPO_PUBLIC_SIGN_IN_GOOGLE=1` | off | off |
| `SIGN_IN_APPLE` | `EXPO_PUBLIC_SIGN_IN_APPLE=1` | off | off |

Build-time only: `GOOGLE_IOS_URL_SCHEME` (adds the Google Sign-In config plugin) and `PERSONAL_TEAM=1` (build for a free Apple team without Sign in with Apple).

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npx jest           # tests
npx expo-doctor    # dependency and config diagnostics
```

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.
