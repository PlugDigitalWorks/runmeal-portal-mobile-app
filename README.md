# Runmeal portal app

Customer app for the Runmeal marketplace: browse restaurants near you, order and pay. Built with Expo SDK 58 and Expo Router. The UI is Turkish by default with an English option (Account, language).

## Features

- Sign in with an email code (OTP, protected by reCAPTCHA), with a password option; Google and Apple sign-in behind flags.
- Address onboarding: use your location or pick a saved address; the whole app works from the chosen address.
- Discover (Keşfet): nearby restaurants, cuisine chips, chains, deals and campaign sections. Several sections have no API behind them yet and show sample data labelled "(Mock)".
- Restaurant page: menu, categories, offers and coupons band.
- Product sheet: required and optional option groups with validation ("Size" is required), quantity, add to cart.
- Cart: one restaurant at a time (adding from another one asks first), line editing, cart bar.
- Checkout and in-app payment: delivery or pick-up, fulfilment slots, coupon, Runmeal credit, paying in the app.
- Orders: list and live tracking of the open order (5 second polling).
- Search: restaurants and dishes, recent searches, cuisine chips.
- Account hub: profile, addresses, cards, coupons, notifications, security, language, legal pages, delete account.
- Deals sheet: the offers of a restaurant in one place.

## Screens

Five tabs:

| Tab | Route | Content |
|---|---|---|
| Keşfet | `(tabs)/index` | Home feed, search bar, address header |
| Favorilerim | `(tabs)/favorites` | Saved restaurants (stored on the device) |
| Sepetim | `(tabs)/cart` | Cart, then checkout and payment |
| Siparişlerim | `(tabs)/orders` | Order list, then order detail and tracking |
| Kampanyalar | `(tabs)/campaigns` | Campaigns, then campaign detail |

Outside the tabs: `(auth)` (login, register, verify), `onboarding/address`, `restaurant/[branchId]`, `product/[id]`, `checkout`, `payment`, `orders/[id]`, `search`, `restaurants`, `deals`, `rewards`, `addresses`, `account` (hub plus profile, cards, coupons, notifications, security, email, feedback, more), `legal/[page]` and `delete-account`.

## Setup

```bash
npm install
npx expo run:ios      # or: npx expo run:android
```

`ios/` and `android/` are generated from `app.config.ts` (Continuous Native Generation) and are not committed.

### Local development notes

- `pod install` needs a UTF-8 locale with Ruby 4: run it as `LANG=en_US.UTF-8 npx expo run:ios` (or export `LANG=en_US.UTF-8` first).
- Do not start Metro with `CI=1`: it turns file watching off, so edits are not picked up. Use plain `npx expo start`.
- Google Sign-In has native code, so it needs a development build; Expo Go does not include it. With `EXPO_PUBLIC_SIGN_IN_GOOGLE=0` the app runs in Expo Go.
- Set the simulator location with `xcrun simctl location booted set 40.9909,29.0303` (Kadikoy) to see the staging branches.

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
- Google, Android: create an Android OAuth client with the package `com.runmeal.portal` and the signing certificate's SHA-1 (debug and EAS release).
- Apple: the backend's `APPLE_SIGNIN_BUNDLE_ID` must accept `com.runmeal.portal`. It takes one value today, so the brand app and this app cannot both sign in until the backend accepts a list.
- To ship without either, set `EXPO_PUBLIC_SIGN_IN_GOOGLE=0` and/or `EXPO_PUBLIC_SIGN_IN_APPLE=0`. Note that App Store rule 4.8 asks for Sign in with Apple when another third-party sign-in is offered.

## EAS profiles

`eas.json` has three build profiles; `appVersionSource` is `local`.

| Profile | Use | `EXPO_PUBLIC_API_URL` |
|---|---|---|
| `development` | Development client, internal distribution | `https://staging-api.runmeal.com` |
| `preview` | Internal test builds | `https://staging-api.runmeal.com` |
| `production` | Store builds | `https://api.runmeal.com` |

```bash
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production
```

Set `EXPO_PUBLIC_SHOW_MOCKS=0` (and the Google/Apple variables above) for `production`, for example as EAS environment variables.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npx jest           # tests
npx expo-doctor    # dependency and config diagnostics
```

## Known limitations

The backend does not offer these yet; the full list with proposed endpoints is in [`docs/BACKEND_REQUESTS.md`](docs/BACKEND_REQUESTS.md).

- Home sections for campaigns, ratings and reviews, delivery time estimates and "for you" picks, plus saved cards, the coupon wallet and notification preferences, are sample data labelled "(Mock)". Turn them off with `EXPO_PUBLIC_SHOW_MOCKS=0`.
- Search scans the menus of the 20 nearest restaurants on the device; cuisine and brand names are guessed from names and menu text.
- Favourites live on the device only (`rm_favorites`).
- Order tracking polls every 5 seconds; there is no live stream or push notification, and a customer cannot cancel a pending order.
- Profile edit (`PUT /profile`) and delete account (`DELETE /profile`) are missing on the API. Delete account shows an "unavailable" message until the route exists; App Store guideline 5.1.1(v) requires it before submission.
- Staging branches have order types and payments switched off, so checkout shows "this restaurant is not taking orders" there.
- Apple sign-in accepts one bundle ID on the backend, and the Google iOS/Android OAuth clients for `com.runmeal.portal` are still to be created.
- Security: `GET /branches/:id` may return payment provider settings unredacted to a signed-in customer. This is listed first in `docs/BACKEND_REQUESTS.md` and should be fixed before release.
- The legal texts (`legal/[page]`: terms, privacy and the rest) are placeholders and need legal review before any store submission.

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.
