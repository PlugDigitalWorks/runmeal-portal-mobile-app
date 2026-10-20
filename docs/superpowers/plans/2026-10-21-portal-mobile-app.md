# Runmeal Portal Mobil Uygulaması — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uber Eats benzeri, çok markalı bir Runmeal müşteri uygulaması. Akış: giriş → adres → yakındaki restoranlar → menü → sepet → ödeme → sipariş takibi. Tasarım "B — Sıcak Runmeal", backend staging.

**Architecture:** Expo SDK 58 + expo-router kullanılır. API katmanı `runmeal-brand-mobile-app`'ten kopyalanır, ancak global `x-brand-id` kaldırılır ve şube kapsamlı header'lar yalnızca ilgili istekte gönderilir. Sunucu verisi TanStack Query ile yönetilir. Oturum için `AuthContext`, aktif adres için `LocationContext` kullanılır. Saf iş mantığı `src/lib`'de test edilebilir fonksiyonlar olarak tutulur. Ekranlar bu fonksiyonları ve query hook'larını kullanır.

**Tech Stack:** Expo SDK 58 (React Native 0.88, React 19.3), expo-router 58, TypeScript 6 strict, axios, @tanstack/react-query 5, i18next + react-i18next + expo-localization, expo-secure-store, AsyncStorage, expo-location, expo-image, react-native-webview, lucide-react-native, Jest 30 + jest-expo + @testing-library/react-native 14.

**Spec:** `docs/superpowers/specs/2026-10-21-portal-mobile-app-design.md`. Görevlere başlamadan önce okunmalıdır.

**Referans kod:** `/Users/gokhancaliskan/Code/personal/runmeal/runmeal-brand-mobile-app` (kısaca **BRAND**). Görevlerde "BRAND'den kopyala" yazan dosyalar oradan alınır ve görevde listelenen değişiklikler yapılır. BRAND'de yazma yapılmaz.

## Global Constraints

- Tüm dosyalar `/Users/gokhancaliskan/Code/personal/runmeal/runmeal-portal-mobile-app` altındadır. `runmeal-api`, `runmeal-brand-fe-website` ve `runmeal-brand-mobile-app` klasörlerinde yazma işlemi yapılmaz.
- Branch: `feat/portal-app-v1`. Her görev kendi commit'iyle biter. Push yapılmaz.
- Commit mesajlarının sonu:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
- Expo paketleri her zaman `npx expo install <paket>` ile eklenir. Sürümler BRAND'in `package.json` dosyasıyla aynı olmalıdır.
- Expo API'leri için hafızaya güvenilmez. `https://docs.expo.dev/versions/v58.0.0/` ve `https://docs.expo.dev/llms.txt` okunur.
- Route'lar `src/app/` altındadır. Route olmayan kod `src/app` dışında tutulur. `@/*` → `./src/*`.
- `ios/` ve `android/` elle oluşturulmaz veya düzenlenmez (CNG).
- Uygulama adı `Runmeal`, bundle ve package `com.runmeal.portal`, scheme `runmealportal`, Apple Team `T776LGPKWZ`.
- Varsayılan API: `https://api-staging.runmeal.com/api`. Production: `https://api.runmeal.com`. `EXPO_PUBLIC_API_URL` ile seçilir.
- Her istekte `x-auth-mode: body` ve `x-device-id` gönderilir. Global `x-brand-id` gönderilmez. Auth body'lerinde `client: 'user'` kullanılır.
- API yanıtları `{ status, message, data }` zarfındadır, `unwrap()` ile açılır.
- Testler `src/app` dışında olmalıdır: `src/__tests__`, `src/lib/__tests__`, `src/services/__tests__`.
- Testing Library v14'te `render` ve `fireEvent` async'tir, `await` ile çağrılır.
- **Her görevin sonunda** `npx tsc --noEmit`, `npx expo lint` ve `npx jest` hatasız geçmelidir.
- Kullanıcıya görünen her metin i18n anahtarıyla yazılır, hem `tr.json` hem `en.json` dosyasına eklenir.
- Production API'ye yazma yapan istek atılmaz. Elle testler staging'e karşı yapılır.

## Staging gözlemleri (2026-10-21)

- `GET /branches/nearby?lat=40.9909&lng=29.0303` (Kadıköy) 6 şube döndürüyor (Premium Burger Co, Artisan Pizza House). Londra ve Ankara'da sonuç yok.
- `GET /branches/nearby` satırlarında `brandId`, marka adı ve `minBasketPrice` **yok**. `brandId`, `GET /branches/:id` veya `GET /branches/:id/menu` yanıtından okunur.
- `GET /branches/:id/menu` → `{branchId, brandId, currency, currencySymbol, categories:[{id, name, description, products:[{id, name, description, tags, price, discountedPrice, imageUrl, currency, currencySymbol}]}]}`. Ürün satırlarında `optionGroups` yok. Seçenekler `GET /products/:id` ile (`x-branch-id` header'ı) gelir.
- Staging şubelerinin `order_type_settings` değerleri hep `isActive:false`. Bu yüzden checkout'ta sipariş tipi çıkmayabilir. Ekran bunu "Bu restoran şu an sipariş almıyor" boş durumuyla göstermelidir.
- `GET /branches/:id/availability` → `{canAcceptOrders, reason}`.
- `POST /auth/guest-session {client:'user'}` staging'de çalışıyor. Uygulama bunu kullanmaz (giriş zorunlu), ama elle test için kullanılabilir.

## Dosya yapısı

```
app.config.ts  eas.json  package.json  tsconfig.json  eslint.config.js  jest.setup.js  AGENTS.md  CLAUDE.md  README.md
assets/                       icon.png adaptive-icon.png splash-icon.png favicon.png logo.png
docs/BACKEND_REQUESTS.md
src/
  config.ts                   ortam: API_URL, PORTAL_WEB_ORIGIN, RECAPTCHA_SITE_KEY, GOOGLE_WEB_CLIENT_ID, SIGN_IN flags
  theme.ts                    B tasarımı token'ları
  types/                      api.ts auth.ts branch.ts product.ts cart.ts order.ts address.ts loyalty.ts
  lib/
    api.ts unwrap.ts api-error.ts session.ts device-id.ts   (BRAND'den, çok markalı)
    branch-headers.ts         şube kapsamlı header yardımcısı
    money.ts text.ts          para ve metin
    branch-model.ts           açık/kapalı, sıralama, mesafe, banner
    categories.ts             mutfak çipleri ve eşleştirme
    search.ts                 arama indeksi
    favorites.ts recent-searches.ts  AsyncStorage depoları
    product-options.ts cart-model.ts checkout.ts order-status.ts address.ts
    query-client.ts           TanStack Query istemcisi + AppState focus
  services/                   auth branch menu cart payment order address loyalty profile
  queries/                    keys.ts + use*.ts hook'ları
  context/                    AuthContext.tsx LocationContext.tsx
  i18n/                       index.ts locales/tr.json locales/en.json
  ui/                         Button Chip EmptyState ErrorState Skeleton Price QuantityStepper TextField Screen
  components/                 HomeHeader CategoryChips BranchCard CartBar ProductRow CartLineRow OrderStatusSteps Recaptcha SocialSignIn AddressSheet
  app/                        route'lar (spec Bölüm 2'deki tablo)
```

---

### Task 1: Proje iskeleti, config ve tema

**Files:**
- Create: `package.json`, `app.config.ts`, `eas.json`, `tsconfig.json`, `eslint.config.js`, `jest.setup.js`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `expo-env.d.ts` (gitignore'da), `assets/*`, `src/config.ts`, `src/theme.ts`, `src/app/_layout.tsx` (geçici), `src/app/index.tsx` (geçici)
- Modify: `.gitignore`
- Test: `src/lib/__tests__/config.test.ts`

**Interfaces:**
- Produces:
  - `src/config.ts`: `API_URL: string`, `IS_STAGING: boolean`, `PORTAL_WEB_ORIGIN: string`, `RECAPTCHA_SITE_KEY: string`, `GOOGLE_WEB_CLIENT_ID: string`, `SIGN_IN_GOOGLE: boolean`, `SIGN_IN_APPLE: boolean`, `resolveEnv(apiUrl: string): { isStaging: boolean; portalWebOrigin: string; recaptchaSiteKey: string; googleWebClientId: string }`
  - `src/theme.ts`: `colors`, `radius`, `space`, `font`, `shadow` (değerler aşağıda)

- [ ] **Step 1: Expo projesini oluştur.** Repo kökünde `.git` ve `docs/` korunarak geçici klasörde template üretilip taşınır:
  ```bash
  cd /Users/gokhancaliskan/Code/personal/runmeal/runmeal-portal-mobile-app
  npx create-expo-app@latest /tmp/rm-portal-scaffold --template default@sdk-58 --no-install
  rsync -a --exclude .git /tmp/rm-portal-scaffold/ ./
  rm -rf /tmp/rm-portal-scaffold
  ```
  Template'in örnek ekranları, bileşenleri, hook'ları ve sabitleri silinir (`src/app/*`, `src/components/*`, `src/hooks/*`, `src/constants/*`, `scripts/reset-project.js`). `.gitignore`, BRAND'in `.gitignore` dosyasıyla birleştirilir (BRAND'deki `/ios`, `/android`, `.env*.local` satırları eklenir).

- [ ] **Step 2: Bağımlılıkları BRAND ile aynı sürümlere getir.** `package.json` BRAND'deki gibi düzenlenir:
  - `name: "runmeal-portal-mobile-app"`, `main: "expo-router/entry"`.
  - Script'ler: `start`, `ios`, `android`, `lint`, `test`.
  - `jest` bloğu BRAND'deki gibi, ama `@brand` mapper'ı olmadan.
  - `expo.install.exclude: ["jest", "@types/jest"]`.

  Bağımlılıklar BRAND'den kopyalanır, şunlar **hariç**: `expo-camera`, `react-native-qrcode-svg`, `expo-glass-effect`, `@expo/ui`. Sonra:
  ```bash
  npm install
  npx expo install expo-localization @tanstack/react-query
  npx expo install --fix
  ```

- [ ] **Step 3: `tsconfig.json`, `eslint.config.js`, `jest.setup.js`.**
  - `tsconfig.json`: BRAND'deki gibi, ama `@brand` path'i olmadan.
  - `eslint.config.js`: BRAND'den aynen.
  - `jest.setup.js`: BRAND'den aynen. Sonuna şu mock'lar eklenir:
    ```js
    jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }] }));
    jest.mock('expo-location', () => ({
      requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
      getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted', canAskAgain: true })),
      getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 40.9909, longitude: 29.0303 } })),
      reverseGeocodeAsync: jest.fn(async () => [{ city: 'İstanbul', district: 'Kadıköy', street: 'Moda Cd.', streetNumber: '10', postalCode: '34710', isoCountryCode: 'TR' }]),
      Accuracy: { Balanced: 3 },
    }));
    ```

- [ ] **Step 4: Görseller.**
  - `assets/icon.png`: `../runmeal-icon-1024.png`'den kopyalanır.
  - `assets/adaptive-icon.png` ve `assets/splash-icon.png`: `../runmeal-icon-1024.png`.
  - `assets/logo.png`: `../runmeal-icon-512.png`.
  - `assets/favicon.png`: `sips -z 48 48 ../runmeal-icon-512.png --out assets/favicon.png`.

- [ ] **Step 5: Failing test — `src/lib/__tests__/config.test.ts`**
  ```ts
  import { resolveEnv } from '@/config';

  describe('resolveEnv', () => {
    it('treats api-staging and staging-api hosts as staging', () => {
      for (const url of ['https://api-staging.runmeal.com/api', 'https://staging-api.runmeal.com']) {
        const env = resolveEnv(url);
        expect(env.isStaging).toBe(true);
        expect(env.portalWebOrigin).toBe('https://staging-portalfe.runmeal.com');
        expect(env.recaptchaSiteKey).toBe('6LdNQdctAAAAAEUyqV33UzBZShZrRpmcnMu-Rgca');
        expect(env.googleWebClientId).toBe('709162763845-i8m3ql8e9a32kmrntm4gibru2kr6hktm.apps.googleusercontent.com');
      }
    });

    it('uses production values for api.runmeal.com', () => {
      const env = resolveEnv('https://api.runmeal.com');
      expect(env.isStaging).toBe(false);
      expect(env.portalWebOrigin).toBe('https://portalfe.runmeal.com');
      expect(env.recaptchaSiteKey).toBe('6LcI-r4tAAAAACBuj3v6pG8RBJmXW2RA132gGjJI');
      expect(env.googleWebClientId).toBe('709162763845-204l0a59busg4vglg9uv24aphlaq9j7r.apps.googleusercontent.com');
    });
  });
  ```
  Run: `npx jest src/lib/__tests__/config.test.ts`. Expected: FAIL (`Cannot find module '@/config'`).

- [ ] **Step 6: `src/config.ts`**
  ```ts
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
  /** Off until com.runmeal.portal has its Google iOS/Android OAuth clients (see docs/BACKEND_REQUESTS.md). */
  export const SIGN_IN_GOOGLE = process.env.EXPO_PUBLIC_SIGN_IN_GOOGLE === '1';
  /** Off until runmeal-api accepts com.runmeal.portal as an Apple audience. */
  export const SIGN_IN_APPLE = process.env.EXPO_PUBLIC_SIGN_IN_APPLE === '1';
  ```
  Run: `npx jest src/lib/__tests__/config.test.ts`. Expected: PASS.

- [ ] **Step 7: `src/theme.ts`** (spec Bölüm 4)
  ```ts
  /** "Sıcak Runmeal" tokens (spec §4): portalfe's orange scale on a cream canvas. */
  export const colors = {
    primary: '#F5A623',
    primaryPressed: '#E28900',
    primaryForeground: '#FFFFFF',
    primarySoft: '#FFF1DF',
    primarySoftForeground: '#E28900',
    background: '#FFFAF5',
    card: '#FFFFFF',
    border: '#F2E6D7',
    bannerPlaceholder: '#FFE3BF',
    foreground: '#10192E',
    mutedForeground: '#6B6257',
    subtle: '#9A8F82',
    destructive: '#EF4444',
    destructiveSoft: '#FEF2F2',
    success: '#16A34A',
    successSoft: '#F0FDF4',
    overlay: 'rgba(16,25,46,0.45)',
  } as const;

  export const radius = { sm: 6, md: 10, lg: 16, xl: 20, full: 999 } as const;
  export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
  export const font = { caption: 11, small: 12, body: 14, base: 16, title: 18, heading: 22, display: 28 } as const;
  export const weight = { regular: '400', semibold: '600', bold: '700' } as const;

  export const shadow = {
    card: {
      shadowColor: '#7A4A00',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  } as const;
  ```

- [ ] **Step 8: `app.config.ts`.** BRAND'in `app.config.ts` dosyası temel alınır ve şu değişiklikler yapılır:
  - `brand.json` kaldırılır, değerler sabit yazılır:
    - `name: 'Runmeal'`, `slug: 'runmeal-portal'`, `scheme: 'runmealportal'`.
    - `ios.bundleIdentifier` ve `android.package`: `'com.runmeal.portal'`.
    - `appleTeamId: 'T776LGPKWZ'`.
  - `userInterfaceStyle: 'light'`.
  - `associatedDomains` ve `intentFilters` kaldırılır (v1'de link yok).
  - `expo-camera` plugin'i kaldırılır.
  - `expo-location` izin metni: `'Your location fills in your delivery address so we can show restaurants that deliver to you.'`
  - Google plugin'i yalnızca `process.env.GOOGLE_IOS_URL_SCHEME` tanımlıysa eklenir: `['@react-native-google-signin/google-signin', { iosUrlScheme }]`.
  - `usesAppleSignIn = process.env.EXPO_PUBLIC_SIGN_IN_APPLE === '1' && !personalTeam`. `withoutAppleSignIn` mantığı BRAND'deki gibi kalır.
  - Splash: `backgroundColor: '#FFFAF5'`, `image: './assets/splash-icon.png'`, `imageWidth: 160`.
  - Adaptive icon arka planı `'#FFFFFF'`.
  - `blockedPermissions` BRAND'deki gibi, `android.permission.CAMERA` eklenir.
  - `ios.infoPlist.CFBundleLocalizations: ['tr', 'en']`.

- [ ] **Step 9: `eas.json`**
  ```json
  {
    "cli": { "version": ">= 16.0.0", "appVersionSource": "local" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal", "env": { "EXPO_PUBLIC_API_URL": "https://api-staging.runmeal.com/api" } },
      "preview": { "distribution": "internal", "env": { "EXPO_PUBLIC_API_URL": "https://api-staging.runmeal.com/api" } },
      "production": { "env": { "EXPO_PUBLIC_API_URL": "https://api.runmeal.com" } }
    },
    "submit": { "production": {} }
  }
  ```
  `expo-dev-client` eklenir: `npx expo install expo-dev-client`.

- [ ] **Step 10: Geçici route'lar ve dokümanlar.**
  - `src/app/_layout.tsx`: `export { Stack as default } from 'expo-router';` yerine `Stack` render eden bir layout.
  - `src/app/index.tsx`: "Runmeal" yazan bir `Text`.
  - `AGENTS.md`: BRAND'den kopyalanır, ilk satır "Runmeal portal (marketplace) customer app" olur. Sonuna şu kurallar eklenir:
    - Global `x-brand-id` yok, şube çağrılarında `branchHeaders()` kullanılır.
    - Metinler i18n'den gelir.
    - Production API'ye yazma yapılmaz.
  - `CLAUDE.md`: `@AGENTS.md`.
  - `README.md`: kurulum (`npm install`, `npx expo run:ios`), ortam değişkenleri tablosu (spec Bölüm 3), test komutları.

- [ ] **Step 11: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  npx expo-doctor
  git add -A && git commit -m "chore: scaffold the Expo SDK 58 portal app with config and theme

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```
  `expo-doctor` uyarıları raporda belirtilir. Hata varsa `npx expo install --fix` ile düzeltilir.

---

### Task 2: Çekirdek kütüphane — API istemcisi, oturum, para, metin, tipler

**Files:**
- Create: `src/types/{api,auth,branch,product,cart,order,address,loyalty}.ts`, `src/lib/{api,unwrap,api-error,session,device-id,branch-headers,money,text}.ts`
- Test: `src/lib/__tests__/{api,api-refresh,session,money,text,branch-headers,unwrap,api-error}.test.ts`

**Interfaces:**
- Consumes: `API_URL` (Task 1)
- Produces:
  - `api` (axios instance), `AUTH_CLIENT = 'user'`, `onSessionExpired(listener): () => void`
  - `unwrap<T>(payload): T`, `apiErrorMessage(error, fallback): string`
  - `loadSession()`, `saveSession(AuthResponse)`, `saveTokens(SessionTokens)`, `saveUser(User)`, `clearSession()`, `getAccessToken()`, `getTokens()`
  - `getDeviceId(): Promise<string>`
  - `branchHeaders(scope: { branchId: string; brandId?: string | null }): Record<string, string>`
  - `formatMoney(value, currency: string, locale?: string): string`. Varsayılan locale `getMoneyLocale()`, `setMoneyLocale(lang: 'tr' | 'en')`.
  - `foldText(value: string): string`
  - Tipler: `ApiResponse<T>`, `Paginated<T>`, `User`, `SessionTokens`, `AuthResponse`, `Branch`, `BranchDetail`, `BusinessHours`, `Menu`, `MenuCategory`, `MenuProduct`, `Product`, `OptionGroup`, `ProductOption`, `Cart`, `CartItem`, `AddItemDto`, `AddItemOption`, `OrderType`, `PaymentMethod`, `ScheduledOrderType`, `Order`, `OrderDetails`, `OrderItem`, `OrderStatus`, `InitializePaymentInput`, `PaymentInitializationResponse`, `PaymentRecord`, `BranchAvailability`, `FulfillmentSlotsResponse`, `Address`, `CreateAddressInput`, `StampCard`

- [ ] **Step 1: Tipleri yaz.**
  - BRAND'den aynen kopyalananlar: `src/types/api.ts`, `src/types/auth.ts`, `src/types/cart.ts`.
  - `src/types/product.ts`: BRAND'den kopyalanır. `Menu` tipi staging gözlemine göre şöyle olur:
    ```ts
    export interface MenuProduct {
      id: string; categoryId: string; brandId: string; name: string; description: string | null;
      tags?: string[] | null; price: number; discountedPrice: number | null; imageUrl: string | null;
      currency: string; currencySymbol: string;
    }
    export interface MenuCategory { id: string; name: string; description: string | null; sortOrder?: number; products: MenuProduct[] }
    export interface Menu { branchId: string; brandId: string; currency: string; currencySymbol: string; categories: MenuCategory[] }
    ```
  - `src/types/order.ts`: BRAND'den kopyalanır. `TableOrderView` ve `TABLE_ORDER` ile ilgili alanlar çıkarılır. Şunlar eklenir:
    ```ts
    export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
    export interface PaymentRecord { id: string; status: string; orderId: string | null; branchId: string | null; brandId: string | null }
    ```
    `OrderType` = `'DELIVERY' | 'SCHEDULED_DELIVERY' | 'PICKUP' | 'SCHEDULED_PICKUP'`. `Address` ve `CreateAddressInput` tipleri `src/types/address.ts`'e taşınır.
  - `src/types/branch.ts`: BRAND'in tipi genişletilir:
    ```ts
    export interface DayHours { isOpen: boolean; timeSlots: { open: string; close: string }[] }
    export type BusinessHours = Partial<Record<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', DayHours>>;
    /** A row of GET /branches/nearby (no brandId: read it from BranchDetail or the menu). */
    export interface Branch {
      id: string; name: string; slug: string; brandSlug?: string | null; addressText: string | null;
      logoUrl: string | null; bannerUrls: string[] | null;
      locationGeog: { type: 'Point'; coordinates: [number, number] } | null;
      currency: string; currencySymbol: string; distanceM: number | null; deliveryRadiusM?: number | null;
      minBasketPrice?: number | null; brandId?: string;
      business_hour?: BusinessHours;
      order_type_settings?: { pickup?: { isActive: boolean }; delivery?: { isActive: boolean }; scheduledPickup?: { isActive: boolean }; scheduledDelivery?: { isActive: boolean } };
      payment_settings?: {
        isActive?: boolean;
        onlineMethods?: { card?: { isActive: boolean; provider?: string } } | unknown[];
        offlineMethods?: { cash?: { isActive: boolean }; cardOnDelivery?: { isActive: boolean } } | unknown[];
      };
    }
    /** GET /branches/:id */
    export interface BranchDetail extends Omit<Branch, 'distanceM'> {
      brandId: string; isActive: boolean; isOpen: boolean; timeZone?: string; district?: string | null; province?: string | null;
      parameters?: { business_hours?: BusinessHours; order_type_settings?: Branch['order_type_settings'] } | null;
    }
    ```
  - `src/types/loyalty.ts`: BRAND'in `services/loyalty.service.ts` dosyasındaki `StampCard` ve `StampQr` tipleri buraya taşınır.

- [ ] **Step 2: BRAND'den kopyala ve uyarla.**
  - `src/lib/unwrap.ts`, `src/lib/api-error.ts`, `src/lib/session.ts`, `src/lib/device-id.ts`, `src/lib/text.ts`: BRAND'den aynen kopyalanır.
  - `src/lib/api.ts`: BRAND'den kopyalanır. Şu değişiklikler yapılır:
    - `getBrandId` import'u ve request interceptor'daki `x-brand-id` ekleme satırı kaldırılır.
    - `PUBLIC_AUTH_PATHS`'e `'/auth/forgot-password'` ve `'/auth/reset-password'` eklenir.
  - Bunların BRAND'deki testleri de kopyalanır: `src/lib/__tests__/api.test.ts`, `api-refresh.test.ts`, `session.test.ts`. Testlerdeki `x-brand-id` beklentileri şu testle değiştirilir:
    ```ts
    it('never sends a global x-brand-id', async () => {
      const seen: Record<string, unknown>[] = [];
      api.defaults.adapter = async (config) => { seen.push({ ...config.headers }); return { data: {}, status: 200, statusText: 'OK', headers: {}, config }; };
      await api.get('/branches/nearby');
      expect(seen[0]['x-brand-id']).toBeUndefined();
      expect(seen[0]['x-auth-mode']).toBe('body');
      expect(typeof seen[0]['x-device-id']).toBe('string');
    });
    ```

- [ ] **Step 3: Failing testler — `branch-headers`, `money`, `text`**
  `src/lib/__tests__/branch-headers.test.ts`:
  ```ts
  import { branchHeaders } from '@/lib/branch-headers';

  it('adds x-branch-id and, when known, x-brand-id', () => {
    expect(branchHeaders({ branchId: 'b1' })).toEqual({ 'x-branch-id': 'b1' });
    expect(branchHeaders({ branchId: 'b1', brandId: 'r1' })).toEqual({ 'x-branch-id': 'b1', 'x-brand-id': 'r1' });
    expect(branchHeaders({ branchId: 'b1', brandId: null })).toEqual({ 'x-branch-id': 'b1' });
  });
  ```
  `src/lib/__tests__/money.test.ts`:
  ```ts
  import { formatMoney, setMoneyLocale } from '@/lib/money';

  describe('formatMoney', () => {
    afterEach(() => setMoneyLocale('tr'));
    it('formats with the API currency in Turkish', () => {
      setMoneyLocale('tr');
      expect(formatMoney(1234.5, 'TRY')).toBe('₺1.234,50');
      expect(formatMoney(160, 'GBP')).toBe('£160,00');
    });
    it('formats in English', () => {
      setMoneyLocale('en');
      expect(formatMoney(1234.5, 'GBP')).toBe('£1,234.50');
    });
    it('treats junk as zero', () => {
      expect(formatMoney('abc', 'TRY')).toBe('₺0,00');
      expect(formatMoney(null, 'TRY')).toBe('₺0,00');
    });
  });
  ```
  `src/lib/__tests__/text.test.ts`:
  ```ts
  import { foldText } from '@/lib/text';
  it('folds Turkish letters and case', () => {
    expect(foldText('İstanbul Ağacı ÇÖŞÜ')).toBe('istanbul agaci cosu');
    expect(foldText('Döner')).toBe('doner');
  });
  ```
  Run: `npx jest src/lib/__tests__`. Expected: yeni modüller için FAIL.

  > Not: `Intl` çıktısı Node/Hermes'te `₺1.234,50` biçimindedir. Jest'te farklı bir boşluk karakteri (NBSP) çıkarsa beklentiler `.replace(/ /g, ' ')` ile normalize edilmez. Bunun yerine `formatMoney` sonucundaki NBSP'ler normal boşluğa çevrilir ve test buna göre yazılır.

- [ ] **Step 4: Implementasyon**
  `src/lib/branch-headers.ts`:
  ```ts
  /** Branch-scoped endpoints (cart, product, order) read the branch and brand from these headers; nothing else sends them. */
  export function branchHeaders(scope: { branchId: string; brandId?: string | null }): Record<string, string> {
    return { 'x-branch-id': scope.branchId, ...(scope.brandId ? { 'x-brand-id': scope.brandId } : {}) };
  }
  ```
  `src/lib/money.ts`:
  ```ts
  type MoneyLocale = 'tr-TR' | 'en-GB';
  let locale: MoneyLocale = 'tr-TR';

  /** Follows the app language; the currency itself always comes from the API row. */
  export function setMoneyLocale(lang: 'tr' | 'en'): void {
    locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  }
  export const getMoneyLocale = (): MoneyLocale => locale;

  export function formatMoney(value: number | string | null | undefined, currency: string, override?: MoneyLocale): string {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat(override ?? locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .format(Number.isFinite(amount) ? amount : 0)
      .replace(/ /g, ' ');
  }
  ```
  Run: `npx jest src/lib/__tests__`. Expected: PASS.

- [ ] **Step 5: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(core): add the API client, session, money and shared types

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 3: i18n (TR/EN) ve dil tercihi

**Files:**
- Create: `src/i18n/index.ts`, `src/i18n/locales/tr.json`, `src/i18n/locales/en.json`, `src/lib/language.ts`
- Test: `src/lib/__tests__/language.test.ts`

**Interfaces:**
- Consumes: `setMoneyLocale` (Task 2)
- Produces:
  - `src/i18n/index.ts`: başlatılmış `i18n` default export. Import edildiği anda yan etki olarak başlar.
  - `src/lib/language.ts`: `type AppLanguage = 'tr' | 'en'`, `detectLanguage(): AppLanguage`, `loadLanguage(): Promise<AppLanguage>`, `changeLanguage(lang: AppLanguage): Promise<void>`. Saklama anahtarı `rm_lang`.

- [ ] **Step 1: Failing test — `src/lib/__tests__/language.test.ts`**
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import i18n from '@/i18n';
  import { changeLanguage, detectLanguage, loadLanguage } from '@/lib/language';
  import { formatMoney } from '@/lib/money';

  describe('language', () => {
    beforeEach(() => AsyncStorage.clear());
    it('detects Turkish from the device locale', () => {
      expect(detectLanguage()).toBe('tr');
    });
    it('persists the choice and switches i18n and money', async () => {
      await changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(await AsyncStorage.getItem('rm_lang')).toBe('en');
      expect(formatMoney(1, 'GBP')).toBe('£1.00');
      expect(await loadLanguage()).toBe('en');
    });
  });
  ```
  Run: `npx jest src/lib/__tests__/language.test.ts`. Expected: FAIL.

- [ ] **Step 2: Implementasyon**
  `src/i18n/index.ts`:
  ```ts
  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import en from './locales/en.json';
  import tr from './locales/tr.json';
  import { detectLanguage } from '@/lib/language';

  i18n.use(initReactI18next).init({
    resources: { tr: { common: tr }, en: { common: en } },
    lng: detectLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  export default i18n;
  ```
  `src/lib/language.ts`:
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { getLocales } from 'expo-localization';
  import i18n from 'i18next';
  import { setMoneyLocale } from './money';

  export type AppLanguage = 'tr' | 'en';
  const KEY = 'rm_lang';

  /** Turkish devices get Turkish; everything else English (portalfe's rule). */
  export function detectLanguage(): AppLanguage {
    return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
  }

  export async function loadLanguage(): Promise<AppLanguage> {
    const saved = (await AsyncStorage.getItem(KEY).catch(() => null)) as AppLanguage | null;
    const lang = saved === 'tr' || saved === 'en' ? saved : detectLanguage();
    await apply(lang);
    return lang;
  }

  export async function changeLanguage(lang: AppLanguage): Promise<void> {
    await AsyncStorage.setItem(KEY, lang);
    await apply(lang);
  }

  async function apply(lang: AppLanguage) {
    setMoneyLocale(lang);
    if (i18n.language !== lang) await i18n.changeLanguage(lang);
  }
  ```
  Dil dosyaları başlangıçta şu üst seviye bölümleri içerir (anahtarlar sonraki görevlerde eklenir):
  `common`, `auth`, `tabs`, `home`, `categories`, `restaurant`, `product`, `cart`, `checkout`, `payment`, `orders`, `orderStatus`, `search`, `account`, `addresses`, `favorites`, `rewards`, `legal`, `errors`. Bu görevde `common` bölümü doldurulur: `retry`, `cancel`, `save`, `delete`, `close`, `continue`, `loading`, `seeAll`. Türkçe değerler: "Tekrar dene", "Vazgeç", "Kaydet", "Sil", "Kapat", "Devam et", "Yükleniyor…", "Tümünü gör". İngilizce değerler: "Try again", "Cancel", "Save", "Delete", "Close", "Continue", "Loading…", "See all".

  Kategoriler için anahtarlar: `categories.all`, `coffee`, `pizza`, `burger`, `kebab`, `dessert`, `breakfast`, `healthy`, `world`. Türkçe: Tümü, Kahve, Pizza, Burger, Döner & Kebap, Tatlı, Kahvaltı, Sağlıklı, Dünya mutfağı. İngilizce: All, Coffee, Pizza, Burgers, Kebab, Desserts, Breakfast, Healthy, World food.

  `errors` bölümü: `network` ("Bağlantı kurulamadı" / "Couldn't connect"), `generic` ("Bir şeyler ters gitti" / "Something went wrong"), `sessionExpired` ("Oturumun sona erdi, tekrar giriş yap" / "Your session expired. Sign in again.").

  Run: `npx jest src/lib/__tests__/language.test.ts`. Expected: PASS.

- [ ] **Step 3: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(i18n): add Turkish and English with a saved language choice

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 4: UI kiti

**Files:**
- Create: `src/ui/{Button,Chip,EmptyState,ErrorState,Skeleton,Price,QuantityStepper,TextField,Screen}.tsx`
- Test: `src/__tests__/ui.test.tsx`

**Interfaces:**
- Consumes: `theme` (Task 1), `formatMoney` (Task 2)
- Produces:
  - `Button({ title, onPress, variant?: 'primary'|'secondary'|'ghost'|'destructive', loading?, disabled?, icon?, testID? })`
  - `Chip({ label, selected?, onPress, icon? })`
  - `EmptyState({ icon, title, body?, actionLabel?, onAction? })`
  - `ErrorState({ onRetry, message? })`. Varsayılan mesaj `t('errors.network')`.
  - `Skeleton({ width?, height, radius? })` ve `BranchCardSkeleton()`
  - `Price({ value, currency, original?, size? })`. `original` verilirse üstü çizili gösterilir.
  - `QuantityStepper({ value, onChange, min?, max? })`
  - `TextField({ label, value, onChangeText, error?, ...TextInputProps })`
  - `Screen({ children, scroll?, padded? })`. Krem zemin ve safe area.

- [ ] **Step 1:** BRAND'deki `src/ui/Button.tsx`, `Chip.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `Price.tsx` ve `QuantityStepper.tsx` kopyalanır. Renkler yeni token'lara bağlanır. Eşleştirme:

  | BRAND | Portal |
  |---|---|
  | `accent` | `primarySoft` |
  | `accentForeground` | `primarySoftForeground` |
  | `zinc500` | `mutedForeground` |
  | `zinc400` | `subtle` |
  | `zinc900` | `foreground` |
  | `zinc100` / `zinc200` | `border` |

  - **Chip:** seçili çip `foreground` zeminli, beyaz metinli. Seçili olmayan çip `primarySoft` zeminli, `primarySoftForeground` metinli. Radius `full`.
  - **Button primary:** `primary` zemin, basılıyken `primaryPressed`, radius `md`, yükseklik 52, metin 16/600.
  - **ErrorState** yeni bileşen: `lucide` `WifiOff` ikonu, mesaj ve `Button variant="secondary" title={t('common.retry')}`.
  - **TextField** yeni bileşen: etiket 12/600 `mutedForeground`; input 48px yükseklik, `card` zemin, 1px `border`, radius `md`; hata metni 12px `destructive`.
  - **Screen** yeni bileşen: `SafeAreaView edges={['top']}`, `background` zemin. `scroll` true ise `ScrollView contentInsetAdjustmentBehavior="automatic"` kullanır.

- [ ] **Step 2: Test — `src/__tests__/ui.test.tsx`**
  ```tsx
  import { fireEvent, render, screen } from '@testing-library/react-native';
  import '@/i18n';
  import { Button } from '@/ui/Button';
  import { ErrorState } from '@/ui/ErrorState';
  import { Price } from '@/ui/Price';

  it('Button fires once and not while loading', async () => {
    const onPress = jest.fn();
    await render(<Button title="Devam et" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Devam et'));
    expect(onPress).toHaveBeenCalledTimes(1);
    await render(<Button title="Bekle" onPress={onPress} loading />);
    expect(screen.queryByText('Bekle')).toBeNull();
  });

  it('ErrorState retries', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState onRetry={onRetry} />);
    await fireEvent.press(screen.getByText('Tekrar dene'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('Price shows the original price struck through', async () => {
    await render(<Price value={160} original={180} currency="GBP" />);
    expect(screen.getByText('£160,00')).toBeTruthy();
    expect(screen.getByText('£180,00')).toBeTruthy();
  });
  ```
  Run: `npx jest src/__tests__/ui.test.tsx`. Expected: PASS.

- [ ] **Step 3: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(ui): add the warm Runmeal UI kit

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 5: Giriş akışı, AuthContext, QueryClient ve root layout

**Files:**
- Create:
  - `src/services/auth.service.ts`, `src/services/profile.service.ts`, `src/context/AuthContext.tsx`, `src/lib/query-client.ts`
  - `src/components/Recaptcha.tsx`, `src/components/SocialSignIn.tsx`
  - `src/app/_layout.tsx` (gerçek), `src/app/index.tsx` (yönlendirici)
  - `src/app/(auth)/_layout.tsx`, `src/app/(auth)/login.tsx`, `src/app/(auth)/verify.tsx`, `src/app/(auth)/register.tsx`
  - `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx` (geçici "Ana sayfa" metni)
- Test: `src/services/__tests__/auth.service.test.ts`, `src/__tests__/login.test.tsx`

**Interfaces:**
- Consumes: `api`, `AUTH_CLIENT`, `onSessionExpired`, session fonksiyonları (Task 2), `RECAPTCHA_SITE_KEY`, `PORTAL_WEB_ORIGIN`, `SIGN_IN_*`, `GOOGLE_WEB_CLIENT_ID` (Task 1), `loadLanguage` (Task 3)
- Produces:
  - `auth.service.ts`: `requestOtpLogin(email, recaptchaToken): Promise<void>`, `loginWithPassword(email, password, recaptchaToken): Promise<AuthResponse>`, `registerWithOtp({email, firstName, lastName}): Promise<void>`, `verifyOtp(email, code): Promise<AuthResponse>`, `loginWithApple(input)`, `loginWithGoogle(idToken)`, `logout(): Promise<void>`, `deleteAccount(): Promise<void>`
  - `profile.service.ts`: `getProfile(): Promise<User>`
  - `useAuth(): { status: 'loading' | 'signedOut' | 'signedIn'; user: User | null; signIn(res: AuthResponse): Promise<void>; signOut(): Promise<void>; refreshUser(): Promise<void> }`
  - `queryClient` (`src/lib/query-client.ts`)
  - Route'lar: `/(auth)/login`, `/(auth)/verify?email=&mode=login|register`, `/(auth)/register`

- [ ] **Step 1: Servisler.** `auth.service.ts` BRAND'den kopyalanır. `getProfile` `profile.service.ts`'e taşınır. Her body'de `client: AUTH_CLIENT` olduğu kontrol edilir. BRAND'deki `services/__tests__/auth.service.test.ts` varsa kopyalanır, yoksa şu yazılır:
  ```ts
  import { api } from '@/lib/api';
  import { requestOtpLogin, verifyOtp } from '@/services/auth.service';

  const calls: { url?: string; data?: unknown; headers?: Record<string, unknown> }[] = [];
  beforeEach(() => {
    calls.length = 0;
    api.defaults.adapter = async (config) => {
      calls.push({ url: config.url, data: config.data ? JSON.parse(config.data) : undefined, headers: { ...config.headers } });
      const data = config.url === '/auth/verify-otp'
        ? { status: true, message: 'Success', data: { accessToken: 'a', refreshToken: 'r', sid: 's', user: { id: 'u', email: 'e@x.com' } } }
        : { status: true, message: 'Success', data: { message: 'sent' } };
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
  });

  it('asks for an OTP with the user client and the captcha token', async () => {
    await requestOtpLogin('e@x.com', 'cap');
    expect(calls[0]).toMatchObject({ url: '/auth/login', data: { email: 'e@x.com', method: 'otp', client: 'user', recaptchaToken: 'cap' } });
    expect(calls[0].headers?.Authorization).toBeUndefined();
  });

  it('verifies the code and returns the session', async () => {
    const res = await verifyOtp('e@x.com', '123456');
    expect(calls[0]).toMatchObject({ url: '/auth/verify-otp', data: { email: 'e@x.com', code: '123456', client: 'user' } });
    expect(res.accessToken).toBe('a');
  });
  ```

- [ ] **Step 2: `src/lib/query-client.ts`**
  ```ts
  import { focusManager, QueryClient } from '@tanstack/react-query';
  import { AxiosError } from 'axios';
  import { AppState, type AppStateStatus } from 'react-native';

  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 4xx will not change on retry; one retry covers a flaky network.
        retry: (count, error) => !(error instanceof AxiosError && (error.response?.status ?? 0) >= 400 && (error.response?.status ?? 0) < 500) && count < 1,
      },
    },
  });

  /** React Native has no window focus: coming back to the app refetches stale queries. */
  export function bindAppFocus(): () => void {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => focusManager.setFocused(state === 'active'));
    return () => sub.remove();
  }
  ```

- [ ] **Step 3: `AuthContext`.** BRAND'in `src/context/AuthContext.tsx` dosyası kopyalanır, brand bağımlılıkları çıkarılır. Davranış:
  - Açılışta `loadSession()` çalışır. Token varsa `status='signedIn'` olur ve kullanıcı bilgisi arka planda `getProfile()` ile tazelenir.
  - `onSessionExpired` → `status='signedOut'`, `queryClient.clear()`, `Alert` yerine bir toast gösterilir: `t('errors.sessionExpired')`. Toast olarak basit bir `Alert.alert` kabul edilir.
  - `signOut()` → `logout()` çağrılır (hatalar yutulur), ardından `clearSession()` ve `queryClient.clear()`.

- [ ] **Step 4: Root layout — `src/app/_layout.tsx`**
  ```tsx
  import '@/i18n';
  import { QueryClientProvider } from '@tanstack/react-query';
  import { Stack } from 'expo-router';
  import * as SplashScreen from 'expo-splash-screen';
  import { StatusBar } from 'expo-status-bar';
  import { useEffect, useState } from 'react';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { SafeAreaProvider } from 'react-native-safe-area-context';
  import { AuthProvider } from '@/context/AuthContext';
  import { LocationProvider } from '@/context/LocationContext';
  import { loadLanguage } from '@/lib/language';
  import { bindAppFocus, queryClient } from '@/lib/query-client';
  import { colors } from '@/theme';

  SplashScreen.preventAutoHideAsync();

  export default function RootLayout() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      loadLanguage().finally(() => setReady(true));
      return bindAppFocus();
    }, []);
    if (!ready) return null;
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <LocationProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
              </LocationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }
  ```
  `LocationProvider` bu görevde `src/context/LocationContext.tsx` içinde yalnızca `children` döndüren bir iskelet olarak oluşturulur. Task 6'da doldurulur. `SplashScreen.hideAsync()`, `src/app/index.tsx` yönlendirmeyi yaptığında çağrılır.

  `src/app/index.tsx`:
  - `useAuth().status` `'loading'` iken `null` döner.
  - `'signedOut'` ise `<Redirect href="/(auth)/login" />`.
  - `'signedIn'` ise `<Redirect href="/(tabs)" />`. Task 6'da aktif adres kontrolü eklenir.

  `src/app/(tabs)/_layout.tsx`:
  - `Tabs` kullanılır, `tabBarActiveTintColor: colors.primary`, `tabBarInactiveTintColor: colors.subtle`, `tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border }`.
  - Bu görevde yalnızca `index` sekmesi vardır. Sekme ikonları lucide'den: `Home`, `Search`, `Receipt`, `User`.
  - `useAuth().status === 'signedOut'` ise `<Redirect href="/(auth)/login" />`.

- [ ] **Step 5: Giriş ekranları.** BRAND'in `src/app/login.tsx` dosyası temel alınır ve üç route'a bölünür:
  - **`(auth)/login.tsx`:**
    - Krem zemin. Üstte `assets/logo.png` (72px) ve "Runmeal". Başlık `t('auth.title')`: "Hoş geldin" / "Welcome". Alt başlık `t('auth.subtitle')`: "Yakınındaki restoranlardan sipariş ver" / "Order from restaurants near you".
    - E-posta `TextField` ve `<Recaptcha host={new URL(PORTAL_WEB_ORIGIN).host} … />`.
    - Birincil buton `t('auth.sendCode')`: "Kod gönder" / "Send code". Basılınca `requestOtpLogin` çağrılır, sonra `router.push({ pathname: '/(auth)/verify', params: { email, mode: 'login' } })`.
    - Bağlantı `t('auth.usePassword')`: "Şifreyle giriş yap" / "Sign in with password". Basılınca şifre alanı açılır ve buton `loginWithPassword` çağırır.
    - `SIGN_IN_GOOGLE || SIGN_IN_APPLE` ise `<SocialSignIn />` gösterilir.
    - Alt bağlantı `t('auth.noAccount')`: "Hesabın yok mu? Kayıt ol" → `/(auth)/register`.
  - **`(auth)/verify.tsx`:** 6 haneli kod alanı (`TextField keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode"`). Kod 6 hane olunca otomatik `verifyOtp` çağrılır, ardından `signIn(res)` ve `router.replace('/')`. "Kodu tekrar gönder" butonu 30 saniyelik sayaçla açılır.
  - **`(auth)/register.tsx`:** ad, soyad, e-posta ve reCAPTCHA. Gönderilince `registerWithOtp` çağrılır, sonra verify ekranına `mode=register` ile geçilir.
  - **`Recaptcha.tsx`:** BRAND'den kopyalanır. `baseUrl` = `https://${host}/`.
  - **`SocialSignIn.tsx`:** BRAND'den kopyalanır. Google yalnızca `SIGN_IN_GOOGLE`, Apple yalnızca `SIGN_IN_APPLE && Platform.OS === 'ios'` iken gösterilir. `GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID })`.
  - Hata mesajları `apiErrorMessage(error, t('errors.generic'))` ile gösterilir.

- [ ] **Step 6: Ekran testi — `src/__tests__/login.test.tsx`.** BRAND'in `src/__tests__/login.test.tsx` dosyasındaki Recaptcha mock yaklaşımı kullanılır: Recaptcha bileşeni mock'lanır ve render edilince `onToken('cap')` çağırır.
  ```tsx
  import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
  import { router } from 'expo-router';
  import '@/i18n';
  import Login from '@/app/(auth)/login';
  import * as auth from '@/services/auth.service';

  jest.mock('@/components/Recaptcha', () => {
    const { useEffect } = require('react');
    return { Recaptcha: ({ onToken }: { onToken: (t: string) => void }) => { useEffect(() => onToken('cap'), [onToken]); return null; } };
  });
  jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() }, Link: ({ children }: { children: unknown }) => children }));
  jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ signIn: jest.fn() }) }));

  it('sends an OTP and opens the code screen', async () => {
    const spy = jest.spyOn(auth, 'requestOtpLogin').mockResolvedValue();
    await render(<Login />);
    await fireEvent.changeText(screen.getByPlaceholderText('ornek@eposta.com'), 'e@x.com');
    await fireEvent.press(screen.getByText('Kod gönder'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('e@x.com', 'cap'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(auth)/verify', params: { email: 'e@x.com', mode: 'login' } });
  });

  it('hides social buttons while the flags are off', async () => {
    await render(<Login />);
    expect(screen.queryByText(/Google/)).toBeNull();
    expect(screen.queryByText(/Apple/)).toBeNull();
  });
  ```
  E-posta placeholder'ı `t('auth.emailPlaceholder')` olarak eklenir: "ornek@eposta.com" / "name@example.com".
  Run: `npx jest src/__tests__/login.test.tsx`. Expected: PASS.

- [ ] **Step 7: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(auth): add email OTP and password sign-in with the session guard

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 6: Adresler, LocationContext ve adres onboarding'i

**Files:**
- Create:
  - `src/services/address.service.ts`, `src/lib/address.ts`, `src/lib/location.ts`, `src/queries/keys.ts`, `src/queries/useAddresses.ts`
  - `src/context/LocationContext.tsx` (doldurulur), `src/components/AddressSheet.tsx`
  - `src/app/onboarding/address.tsx`, `src/app/addresses/index.tsx`, `src/app/addresses/form.tsx`
- Modify: `src/app/index.tsx`, `src/app/_layout.tsx` (yeni route'lar)
- Test: `src/lib/__tests__/address.test.ts`, `src/__tests__/addresses.test.tsx`

**Interfaces:**
- Consumes: `api`, `unwrap` (Task 2), `useAuth` (Task 5)
- Produces:
  - `address.service.ts`: `getAddresses(): Promise<Address[]>`, `createAddress(input): Promise<Address>`, `updateAddress(id, input): Promise<Address>`, `deleteAddress(id): Promise<void>`, `setActiveAddress(id): Promise<void>`
  - `lib/address.ts`: BRAND'deki `addressFirstLine`, `addressSecondLine`, `normalizePhone` fonksiyonları ve ek olarak `addressCoordinates(a: Address): { latitude: number; longitude: number } | null`, `addressLabel(a: Address): string`
  - `lib/location.ts`: BRAND'deki `getUserLocation`, `canAskForLocation` fonksiyonları ve ek olarak `reverseGeocode(coords): Promise<Partial<CreateAddressInput>>`
  - `queries/keys.ts`:
    ```ts
    export const qk = {
      addresses: ['addresses'] as const,
      nearby: (lat: number, lng: number) => ['nearby', lat.toFixed(4), lng.toFixed(4)] as const,
      branch: (id: string) => ['branch', id] as const,
      menu: (branchId: string) => ['menu', branchId] as const,
      product: (id: string, branchId: string) => ['product', id, branchId] as const,
      cart: ['cart'] as const,
      orders: ['orders'] as const,
      order: (id: string) => ['order', id] as const,
      availability: (branchId: string) => ['availability', branchId] as const,
      slots: (branchId: string, type: string) => ['slots', branchId, type] as const,
      credit: ['credit'] as const,
      stamps: (brandId: string) => ['stamps', brandId] as const,
    };
    ```
  - `useAddresses()`: `useQuery({ queryKey: qk.addresses, queryFn: getAddresses, enabled: signedIn })`
  - `useLocation(): { activeAddress: Address | null; coords: { latitude: number; longitude: number } | null; isLoading: boolean; selectAddress(id: string): Promise<void> }`

- [ ] **Step 1: Failing test — `src/lib/__tests__/address.test.ts`**
  ```ts
  import { addressCoordinates, addressLabel } from '@/lib/address';
  import type { Address } from '@/types/address';

  const base = { id: 'a', street: 'Moda Cd.', buildingNumber: '10', apartmentNumber: '3', district: 'Kadıköy', province: 'İstanbul', postalCode: '34710', countryCode: 'TR', phoneE164: '+905550000000', isActive: true } as Address;

  it('reads coordinates from latitude/longitude, then from locationGeog', () => {
    expect(addressCoordinates({ ...base, latitude: 40.99, longitude: 29.03 })).toEqual({ latitude: 40.99, longitude: 29.03 });
    expect(addressCoordinates({ ...base, latitude: null, longitude: null, locationGeog: { type: 'Point', coordinates: [29.03, 40.99] } } as Address)).toEqual({ latitude: 40.99, longitude: 29.03 });
    expect(addressCoordinates({ ...base, latitude: null, longitude: null } as Address)).toBeNull();
  });

  it('labels an address by street and district', () => {
    expect(addressLabel(base)).toBe('Moda Cd. 10 · Kadıköy');
  });
  ```
  `Address` tipine `latitude?: number | null; longitude?: number | null; locationGeog?: { type: 'Point'; coordinates: [number, number] } | null` alanları eklenir (BRAND'deki tanım bunları zaten içeriyorsa korunur).
  Run: `npx jest src/lib/__tests__/address.test.ts`. Expected: FAIL.

- [ ] **Step 2: Implementasyon.** `lib/address.ts` BRAND'den kopyalanır ve şunlar eklenir:
  ```ts
  /** Latitude/longitude when the API sends them, else the PostGIS point ([lng, lat]). */
  export function addressCoordinates(address: Address): { latitude: number; longitude: number } | null {
    if (typeof address.latitude === 'number' && typeof address.longitude === 'number') return { latitude: address.latitude, longitude: address.longitude };
    const point = address.locationGeog?.coordinates;
    return point ? { latitude: point[1], longitude: point[0] } : null;
  }

  export function addressLabel(address: Address): string {
    const first = [address.street, address.buildingNumber].filter(Boolean).join(' ');
    return [first, address.district].filter(Boolean).join(' · ');
  }
  ```
  `address.service.ts`: BRAND'in `order.service.ts` dosyasındaki adres fonksiyonları buraya taşınır.

  `LocationContext`:
  - Aktif adres, `useAddresses().data?.find(a => a.isActive) ?? data?.[0] ?? null` olarak seçilir.
  - `coords = activeAddress ? addressCoordinates(activeAddress) : null`.
  - `selectAddress(id)`: `setActiveAddress(id)` çağrılır, sonra `queryClient.invalidateQueries({ queryKey: qk.addresses })` ve `invalidateQueries({ queryKey: ['nearby'] })`.

  Run: `npx jest src/lib/__tests__/address.test.ts`. Expected: PASS.

- [ ] **Step 3: Ekranlar.**
  - **`addresses/form.tsx`:** BRAND'in `src/app/addresses/form.tsx` dosyası kopyalanır. Brand bağımlılıkları kaldırılır, metinler `addresses.*` anahtarlarına bağlanır.
    - En üstte "Konumumu kullan" butonu bulunur: `getUserLocation()` ve `reverseGeocode()` ile alanları doldurur, `latitude/longitude` değerlerini kaydeder.
    - Kaydedince `qk.addresses` geçersiz kılınır. İlk adres otomatik aktif yapılır (`setActiveAddress`).
    - `?id=` parametresi verilirse düzenleme modunda açılır.
  - **`addresses/index.tsx`:** BRAND'den kopyalanır. Satıra dokunmak `selectAddress(id)` çağırır ve geri döner. Düzenle ve sil eylemleri vardır. Sağ üstte "Yeni adres" butonu bulunur.
  - **`onboarding/address.tsx`:** Başlık `t('addresses.onboardingTitle')`: "Nereye getirelim?" / "Where should we deliver?". Altında adres formu gömülü gösterilir. Kayıt olunca `router.replace('/(tabs)')`.
  - **`src/app/index.tsx`:** `signedIn` ise `useAddresses()` beklenir. Hiç adres yoksa `/onboarding/address`, varsa `/(tabs)` açılır. Adres sorgusu hata verirse `ErrorState` gösterilir.
  - **`AddressSheet.tsx`:** `Modal` (`presentationStyle="pageSheet"`) içinde adres listesi bulunur. Seçilince `selectAddress` çağrılır ve sheet kapanır. Altta "Yeni adres ekle" → `/addresses/form`. Ana sayfa bu sheet'i kullanır.

- [ ] **Step 4: Ekran testi — `src/__tests__/addresses.test.tsx`.** BRAND'in `src/__tests__/addresses.test.tsx` testi kopyalanır ve portaldeki route'lara uyarlanır. En az şu iki senaryo olmalıdır:
  1. Liste aktif adresi işaretli gösterir. Başka bir satıra dokunulunca `setActiveAddress` doğru id ile çağrılır.
  2. Formda zorunlu alanlar boşken kaydetme `createAddress` çağırmaz ve alan hatası gösterir.

  Testlerde sağlayıcı olarak şu yardımcı kullanılır (`src/__tests__/helpers/render-with-providers.tsx` olarak oluşturulur, sonraki görevler de kullanır):
  ```tsx
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { render } from '@testing-library/react-native';
  import type { ReactElement } from 'react';
  import '@/i18n';

  export function renderWithProviders(ui: ReactElement) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
  }
  ```
  Context'e ihtiyaç duyan ekran testlerinde `@/context/AuthContext` ve `@/context/LocationContext` `jest.mock` ile mock'lanır.

- [ ] **Step 5: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(addresses): require a delivery address and keep the active one in context

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 7: Keşif — ana sayfa, şube kartları, kategoriler, favoriler

**Files:**
- Create:
  - `src/services/branch.service.ts`, `src/lib/branch-model.ts`, `src/lib/categories.ts`, `src/lib/favorites.ts`
  - `src/queries/useNearbyBranches.ts`, `src/queries/useFavorites.ts`
  - `src/components/HomeHeader.tsx`, `src/components/CategoryChips.tsx`, `src/components/BranchCard.tsx`
  - `src/app/(tabs)/index.tsx` (gerçek)
- Test: `src/lib/__tests__/branch-model.test.ts`, `src/lib/__tests__/categories.test.ts`, `src/lib/__tests__/favorites.test.ts`, `src/__tests__/home.test.tsx`

**Interfaces:**
- Consumes: `useLocation` (Task 6), `qk` (Task 6), `foldText` (Task 2)
- Produces:
  - `branch.service.ts`: `getNearbyBranches(coords: {latitude; longitude}): Promise<Branch[]>`, `getBranch(id): Promise<BranchDetail>`, `getBranchAvailability(id): Promise<BranchAvailability>`, `getFulfillmentSlots(id, type): Promise<FulfillmentSlotsResponse>`
  - `branch-model.ts`: `isOpenNow(hours: BusinessHours | undefined, now?: Date): boolean`, `nextOpening(hours, now?): string | null` ("09:00"), `sortForHome(branches: Branch[], now?: Date): Branch[]`, `formatDistance(m: number | null, lang: 'tr' | 'en'): string`, `bannerOf(b: Branch): string | null`
  - `categories.ts`: `CATEGORY_IDS = ['coffee','pizza','burger','kebab','dessert','breakfast','healthy','world'] as const`, `type CategoryId`, `branchMatchesCategory(branch: Branch, category: CategoryId, menuText?: string): boolean`, `availableCategories(branches: Branch[], menuTextById: Record<string, string>): CategoryId[]`, `menuText(menu: Menu): string`
  - `favorites.ts`: `type FavoriteBranch = Pick<Branch, 'id' | 'name' | 'logoUrl' | 'bannerUrls' | 'addressText'>`, `loadFavorites(): Promise<FavoriteBranch[]>`, `toggleFavorite(b: FavoriteBranch): Promise<FavoriteBranch[]>`. Saklama anahtarı `rm_favorites`.
  - `useNearbyBranches(): UseQueryResult<Branch[]>` (`coords` yoksa `enabled:false`)
  - `useFavorites(): { favorites: FavoriteBranch[]; isFavorite(id): boolean; toggle(b): void }`

- [ ] **Step 1: Failing test — `src/lib/__tests__/branch-model.test.ts`**
  ```ts
  import { formatDistance, isOpenNow, nextOpening, sortForHome } from '@/lib/branch-model';
  import type { Branch, BusinessHours } from '@/types/branch';

  // Tuesday 2026-10-20 14:30 local time
  const tue1430 = new Date(2026, 9, 20, 14, 30);
  const hours: BusinessHours = {
    tuesday: { isOpen: true, timeSlots: [{ open: '09:00', close: '13:00' }, { open: '15:00', close: '22:00' }] },
    wednesday: { isOpen: false, timeSlots: [] },
  };

  describe('isOpenNow', () => {
    it('is closed between slots and open inside one', () => {
      expect(isOpenNow(hours, tue1430)).toBe(false);
      expect(isOpenNow(hours, new Date(2026, 9, 20, 16, 0))).toBe(true);
    });
    it('treats an open day without slots as open all day (staging data)', () => {
      expect(isOpenNow({ tuesday: { isOpen: true, timeSlots: [] } }, tue1430)).toBe(true);
    });
    it('treats missing hours as open', () => {
      expect(isOpenNow(undefined, tue1430)).toBe(true);
    });
    it('handles slots past midnight', () => {
      expect(isOpenNow({ tuesday: { isOpen: true, timeSlots: [{ open: '18:00', close: '02:00' }] } }, new Date(2026, 9, 20, 23, 0))).toBe(true);
    });
  });

  it('nextOpening finds the next slot today', () => {
    expect(nextOpening(hours, tue1430)).toBe('15:00');
  });

  it('sorts open branches first, then by distance', () => {
    const b = (id: string, distanceM: number, open: boolean) =>
      ({ id, distanceM, business_hour: { tuesday: { isOpen: open, timeSlots: [] } } }) as unknown as Branch;
    expect(sortForHome([b('far', 900, true), b('closed', 100, false), b('near', 200, true)], tue1430).map((x) => x.id)).toEqual(['near', 'far', 'closed']);
  });

  it('formats distance', () => {
    expect(formatDistance(681.9, 'tr')).toBe('680 m');
    expect(formatDistance(1221.7, 'tr')).toBe('1,2 km');
    expect(formatDistance(1221.7, 'en')).toBe('1.2 km');
    expect(formatDistance(null, 'tr')).toBe('');
  });
  ```
  Run: `npx jest src/lib/__tests__/branch-model.test.ts`. Expected: FAIL.

- [ ] **Step 2: `src/lib/branch-model.ts`**
  ```ts
  import type { Branch, BusinessHours, DayHours } from '@/types/branch';

  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const dayOf = (hours: BusinessHours, date: Date): DayHours | undefined => hours[DAYS[date.getDay()]];

  /**
   * Device time against the branch's weekly hours. No hours, or an open day
   * without slots (what staging seeds), counts as open; the API's availability
   * check at checkout has the final word.
   */
  export function isOpenNow(hours: BusinessHours | undefined, now: Date = new Date()): boolean {
    if (!hours || Object.keys(hours).length === 0) return true;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = dayOf(hours, now);
    const yesterday = dayOf(hours, new Date(now.getTime() - 86_400_000));
    // A slot like 18:00–02:00 started yesterday still covers the small hours.
    const carried = yesterday?.isOpen && yesterday.timeSlots.some((s) => toMinutes(s.close) < toMinutes(s.open) && minutes < toMinutes(s.close));
    if (carried) return true;
    if (!today?.isOpen) return false;
    if (today.timeSlots.length === 0) return true;
    return today.timeSlots.some((s) => {
      const open = toMinutes(s.open);
      const close = toMinutes(s.close);
      return close > open ? minutes >= open && minutes < close : minutes >= open;
    });
  }

  /** The next opening time later today, if any. */
  export function nextOpening(hours: BusinessHours | undefined, now: Date = new Date()): string | null {
    const today = hours ? dayOf(hours, now) : undefined;
    if (!today?.isOpen) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const next = today.timeSlots.map((s) => s.open).filter((open) => toMinutes(open) > minutes).sort((a, b) => toMinutes(a) - toMinutes(b))[0];
    return next ?? null;
  }

  export function sortForHome(branches: Branch[], now: Date = new Date()): Branch[] {
    return [...branches].sort((a, b) => {
      const openDiff = Number(isOpenNow(b.business_hour, now)) - Number(isOpenNow(a.business_hour, now));
      return openDiff || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity);
    });
  }

  export function formatDistance(meters: number | null, lang: 'tr' | 'en'): string {
    if (meters == null || !Number.isFinite(meters)) return '';
    if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
    return `${new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
  }

  export const bannerOf = (branch: Pick<Branch, 'bannerUrls' | 'logoUrl'>): string | null => branch.bannerUrls?.[0] ?? null;
  ```
  Run: `npx jest src/lib/__tests__/branch-model.test.ts`. Expected: PASS.

- [ ] **Step 3: Failing test — `src/lib/__tests__/categories.test.ts`**
  ```ts
  import { availableCategories, branchMatchesCategory, menuText } from '@/lib/categories';
  import type { Branch } from '@/types/branch';
  import type { Menu } from '@/types/product';

  const branch = (name: string) => ({ id: name, name }) as Branch;

  it('matches by branch name in either language', () => {
    expect(branchMatchesCategory(branch('Artisan Pizza House Heights #052'), 'pizza')).toBe(true);
    expect(branchMatchesCategory(branch('Premium Burger Co Plaza #023'), 'burger')).toBe(true);
    expect(branchMatchesCategory(branch('Dharma Coffee'), 'coffee')).toBe(true);
    expect(branchMatchesCategory(branch('Moda Kahvecisi'), 'coffee')).toBe(true);
    expect(branchMatchesCategory(branch('Premium Burger Co'), 'pizza')).toBe(false);
  });

  it('matches by menu text', () => {
    const menu = { categories: [{ id: 'c', name: 'Tatlılar', description: null, products: [{ name: 'Künefe', description: null }] }] } as unknown as Menu;
    expect(branchMatchesCategory(branch('Usta'), 'dessert', menuText(menu))).toBe(true);
  });

  it('lists only categories some branch matches, in fixed order', () => {
    expect(availableCategories([branch('Artisan Pizza'), branch('Premium Burger')], {})).toEqual(['pizza', 'burger']);
  });
  ```
  Run: `npx jest src/lib/__tests__/categories.test.ts`. Expected: FAIL.

- [ ] **Step 4: `src/lib/categories.ts`**
  ```ts
  import type { Branch } from '@/types/branch';
  import type { Menu } from '@/types/product';
  import { foldText } from './text';

  export const CATEGORY_IDS = ['coffee', 'pizza', 'burger', 'kebab', 'dessert', 'breakfast', 'healthy', 'world'] as const;
  export type CategoryId = (typeof CATEGORY_IDS)[number];

  /** The API has no cuisine field (docs/BACKEND_REQUESTS.md), so chips match folded TR/EN keywords. */
  const KEYWORDS: Record<CategoryId, string[]> = {
    coffee: ['coffee', 'kahve', 'cafe', 'kafe', 'espresso', 'latte', 'barista'],
    pizza: ['pizza', 'pizzeria'],
    burger: ['burger', 'hamburger'],
    kebab: ['kebab', 'kebap', 'doner', 'durum', 'lahmacun', 'adana', 'iskender'],
    dessert: ['dessert', 'tatli', 'baklava', 'kunefe', 'cake', 'pasta', 'waffle', 'dondurma', 'ice cream'],
    breakfast: ['breakfast', 'kahvalti', 'brunch', 'menemen', 'simit', 'borek'],
    healthy: ['salad', 'salata', 'vegan', 'healthy', 'saglikli', 'bowl', 'fit'],
    world: ['sushi', 'noodle', 'taco', 'burrito', 'asian', 'uzakdogu', 'mexican', 'italian', 'pasta', 'ramen'],
  };

  export function menuText(menu: Menu): string {
    return foldText(
      menu.categories.flatMap((c) => [c.name, c.description ?? '', ...c.products.flatMap((p) => [p.name, p.description ?? ''])]).join(' '),
    );
  }

  export function branchMatchesCategory(branch: Branch, category: CategoryId, foldedMenuText = ''): boolean {
    const haystack = `${foldText(branch.name)} ${foldText(branch.brandSlug ?? '')} ${foldedMenuText}`;
    return KEYWORDS[category].some((word) => haystack.includes(word));
  }

  export function availableCategories(branches: Branch[], menuTextById: Record<string, string>): CategoryId[] {
    return CATEGORY_IDS.filter((c) => branches.some((b) => branchMatchesCategory(b, c, menuTextById[b.id])));
  }
  ```
  Run: `npx jest src/lib/__tests__/categories.test.ts`. Expected: PASS.

- [ ] **Step 5: Failing test ve implementasyon — favoriler.** `src/lib/__tests__/favorites.test.ts`:
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { loadFavorites, toggleFavorite } from '@/lib/favorites';

  const fav = { id: 'b1', name: 'Pizza', logoUrl: null, bannerUrls: null, addressText: null };

  beforeEach(() => AsyncStorage.clear());

  it('adds then removes a favorite and survives a reload', async () => {
    expect(await toggleFavorite(fav)).toEqual([fav]);
    expect(await loadFavorites()).toEqual([fav]);
    expect(await toggleFavorite(fav)).toEqual([]);
  });

  it('ignores corrupt storage', async () => {
    await AsyncStorage.setItem('rm_favorites', '{oops');
    expect(await loadFavorites()).toEqual([]);
  });
  ```
  `src/lib/favorites.ts`:
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import type { Branch } from '@/types/branch';

  export type FavoriteBranch = Pick<Branch, 'id' | 'name' | 'logoUrl' | 'bannerUrls' | 'addressText'>;
  const KEY = 'rm_favorites';

  /** Device-only until the API has favourites (docs/BACKEND_REQUESTS.md). */
  export async function loadFavorites(): Promise<FavoriteBranch[]> {
    try {
      const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  export async function toggleFavorite(branch: FavoriteBranch): Promise<FavoriteBranch[]> {
    const current = await loadFavorites();
    const next = current.some((f) => f.id === branch.id)
      ? current.filter((f) => f.id !== branch.id)
      : [{ id: branch.id, name: branch.name, logoUrl: branch.logoUrl, bannerUrls: branch.bannerUrls, addressText: branch.addressText }, ...current];
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  ```
  `useFavorites` bir `useQuery({ queryKey: ['favorites'], queryFn: loadFavorites, staleTime: Infinity })` ve bir `useMutation` içerir. `toggle` sonucunu `setQueryData(['favorites'], next)` ile önbelleğe yazar.
  Run: `npx jest src/lib/__tests__/favorites.test.ts`. Expected: PASS.

- [ ] **Step 6: Servis ve hook.**
  ```ts
  // src/services/branch.service.ts
  export async function getNearbyBranches(coords: { latitude: number; longitude: number }): Promise<Branch[]> {
    const { data } = await api.get<ApiResponse<Branch[]>>('/branches/nearby', { params: { lat: coords.latitude, lng: coords.longitude } });
    return unwrap(data) ?? [];
  }
  ```
  `getBranch`, `getBranchAvailability` ve `getFulfillmentSlots` aynı kalıpla yazılır. Availability ve slots için BRAND'in `order.service.ts` dosyası örnek alınır.
  ```ts
  // src/queries/useNearbyBranches.ts
  export function useNearbyBranches() {
    const { coords } = useLocation();
    return useQuery({
      queryKey: coords ? qk.nearby(coords.latitude, coords.longitude) : ['nearby', 'none'],
      queryFn: () => getNearbyBranches(coords!),
      enabled: !!coords,
      select: (rows) => sortForHome(rows),
    });
  }
  ```

- [ ] **Step 7: Bileşenler ve ana sayfa.** Spec Bölüm 4 ve B mockup'ı esas alınır:
  - **`HomeHeader`:**
    - `primary` zeminli, alt köşeleri `radius.xl` olan bant. Üst padding safe area kadardır.
    - Sol: küçük etiket `t('home.deliverTo')` ("Teslimat adresi" / "Deliver to", 11px, `primarySoft` renkli) ve altında `addressLabel(activeAddress)` + `ChevronDown` (beyaz, 15/600). Dokunulunca `AddressSheet` açılır.
    - Sağ: kullanıcının baş harfleri yuvarlak beyaz avatar içinde. Dokunulunca `/(tabs)/account`.
    - Altında beyaz, radius `md`, 44px yüksekliğinde arama kutusu: `Search` ikonu ve `t('home.searchPlaceholder')` ("Ne yemek istersin?" / "What are you craving?"). Dokunulunca `router.push('/(tabs)/search')`. Bu bir `Pressable`'dır, input değildir.
  - **`CategoryChips`:** yatay `ScrollView`. "Tümü" çipi ve `availableCategories` sonucu listelenir. Seçili çip `Chip selected`.
  - **`BranchCard`:**
    - `card` zemin, radius `lg`, 1px `border`, `shadow.card`.
    - 140px `expo-image` banner. Banner yoksa `bannerPlaceholder` zemin ve ortada logo.
    - Sol altta 40px beyaz çerçeveli yuvarlak logo, banner'a yarı taşmış. Sağ üstte beyaz yuvarlak buton içinde `Heart` ikonu: favoriyse dolu `primary`, değilse çizgili.
    - Altta ad (16/600), sağında mesafe (`primarySoftForeground`, 12/600). Altında `addressText` (12, `mutedForeground`, tek satır).
    - Kapalıysa kart `opacity: 0.55` olur ve banner üstünde `t('home.closed')` rozeti gösterilir ("Kapalı" / "Closed", koyu zemin, beyaz metin). `nextOpening` varsa yanında "· 15:00'te açılır" / "· opens 15:00" yazar.
    - Dokunulunca `router.push({ pathname: '/restaurant/[branchId]', params: { branchId: b.id } })`.
  - **`(tabs)/index.tsx`:**
    - `FlatList` kullanılır. `ListHeaderComponent` = `HomeHeader` + `CategoryChips` + başlık `t('home.nearby')` ("Yakınındakiler" / "Near you") + şube sayısı.
    - Yükleniyorsa 3 adet `BranchCardSkeleton` gösterilir.
    - Hata varsa `ErrorState onRetry={refetch}`.
    - Liste boşsa `EmptyState`: ikon `MapPinOff`, `t('home.emptyTitle')` ("Bu adrese henüz teslimat yapan restoran yok" / "No restaurants deliver here yet"), aksiyon `t('home.changeAddress')` → `AddressSheet`.
    - Kategori filtresi `branchMatchesCategory` ile yapılır. Menü metinleri `queryClient.getQueryData(qk.menu(id))` ile önbellekten okunur.
    - `refreshControl` ile çekince yenilenir, renk `primary`.
    - `StatusBar style="light"`.

- [ ] **Step 8: Ekran testi — `src/__tests__/home.test.tsx`**
  ```tsx
  import { fireEvent, screen, waitFor } from '@testing-library/react-native';
  import Home from '@/app/(tabs)/index';
  import * as branches from '@/services/branch.service';
  import { renderWithProviders } from './helpers/render-with-providers';

  jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));
  jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn', user: { firstName: 'Ada', lastName: 'Yılmaz' } }) }));
  jest.mock('@/context/LocationContext', () => ({
    useLocation: () => ({ activeAddress: { id: 'a', street: 'Moda Cd.', buildingNumber: '10', district: 'Kadıköy' }, coords: { latitude: 40.99, longitude: 29.03 }, isLoading: false, selectAddress: jest.fn() }),
  }));

  const row = (id: string, name: string, distanceM: number) =>
    ({ id, name, slug: id, addressText: 'Kadıköy', logoUrl: null, bannerUrls: null, locationGeog: null, currency: 'TRY', currencySymbol: '₺', distanceM }) as never;

  it('lists nearby branches nearest first and filters by category', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('p', 'Artisan Pizza House', 900), row('b', 'Premium Burger Co', 300)]);
    await renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('Premium Burger Co')).toBeTruthy());
    const names = screen.getAllByTestId('branch-card-name').map((n) => n.props.children);
    expect(names).toEqual(['Premium Burger Co', 'Artisan Pizza House']);
    await fireEvent.press(screen.getByText('Pizza'));
    expect(screen.queryByText('Premium Burger Co')).toBeNull();
  });

  it('shows the empty state', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([]);
    await renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('Bu adrese henüz teslimat yapan restoran yok')).toBeTruthy());
  });

  it('shows retry on error', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockRejectedValue(new Error('offline'));
    await renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('Tekrar dene')).toBeTruthy());
  });
  ```
  `BranchCard`'taki ad metnine `testID="branch-card-name"` verilir.
  Run: `npx jest src/__tests__/home.test.tsx`. Expected: PASS.

- [ ] **Step 9: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(home): show nearby restaurants with category chips and favourites

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 8: Restoran sayfası ve ürün sheet'i

**Files:**
- Create:
  - `src/services/menu.service.ts`, `src/lib/product-options.ts`, `src/queries/useMenu.ts`, `src/queries/useBranch.ts`, `src/queries/useProduct.ts`
  - `src/components/ProductRow.tsx`, `src/components/RestaurantHeader.tsx`
  - `src/app/restaurant/[branchId].tsx`, `src/app/product/[id].tsx`
- Modify: `src/app/_layout.tsx`. `product/[id]` için `presentation: 'formSheet'`, `sheetAllowedDetents: [0.92]`, `sheetGrabberVisible: true`, `headerShown: false`. BRAND'in `_layout.tsx` dosyasındaki product ayarları örnek alınır.
- Test: `src/lib/__tests__/product-options.test.ts`, `src/__tests__/restaurant.test.tsx`, `src/__tests__/product-sheet.test.tsx`

**Interfaces:**
- Consumes: `getBranch` (Task 7), `branchHeaders` (Task 2), `useFavorites` (Task 7), `isOpenNow` (Task 7)
- Produces:
  - `menu.service.ts`: `getBranchMenu(branchId): Promise<Menu>`, `getProduct(productId, scope: { branchId; brandId? }): Promise<Product>`
  - `product-options.ts`: BRAND'deki `Selections`, `initialSelections`, `toggleOption`, `validateSelections`, `SelectionProblem`, `optionsTotal`
  - `useMenu(branchId)`: `staleTime: 10 * 60_000`
  - `useBranch(branchId)`
  - `useProduct(id, branchId, brandId)`
  - Ürün route parametreleri: `/product/[id]?branchId=&brandId=`
  - Sepete ekleme Task 9'da bağlanır. Bu görevde sheet'in "Sepete ekle" butonu `onAdd(dto: AddItemDto)` prop'u yerine Task 9'un kullanacağı `useAddToCart()` hook'unun **arayüzünü** çağırır. Bu yüzden `src/queries/useCart.ts` bu görevde şu stub ile oluşturulur:
    ```ts
    export function useAddToCart() {
      return { mutateAsync: async (_input: { dto: AddItemDto; branchId: string; brandId: string }) => undefined, isPending: false };
    }
    ```
    Task 9 bu dosyayı gerçek implementasyonla değiştirir.

- [ ] **Step 1:** `product-options.ts` BRAND'den, testi de BRAND'in `src/lib/__tests__/product-options.test.ts` dosyasından kopyalanır.
  Run: `npx jest src/lib/__tests__/product-options.test.ts`. Expected: PASS.

- [ ] **Step 2: Servis ve hook'lar.**
  ```ts
  // src/services/menu.service.ts
  export async function getBranchMenu(branchId: string): Promise<Menu> {
    const { data } = await api.get<ApiResponse<Menu>>(`/branches/${branchId}/menu`);
    return unwrap(data);
  }
  export async function getProduct(productId: string, scope: { branchId: string; brandId?: string | null }): Promise<Product> {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${productId}`, { headers: branchHeaders(scope) });
    return unwrap(data);
  }
  ```

- [ ] **Step 3: Restoran sayfası — `restaurant/[branchId].tsx`**
  - Veri: `useBranch(branchId)` ve `useMenu(branchId)`. `brandId`, `menu.brandId ?? branch.brandId`'den okunur.
  - **Header:** stack header'ı şeffaftır (`headerTransparent: true`, `headerTitle: ''`). Sağda favori kalbi bulunur.
  - **`RestaurantHeader`:**
    - 200px banner, banner'ın sol altına taşan 64px logo.
    - Altında ad (22/700) ve bilgi satırı: `addressText`, mesafe ve açık/kapalı rozeti. Açıksa yeşil "Açık" / "Open", kapalıysa kırmızı "Kapalı · 15:00'te açılır".
    - Kapalıysa `destructiveSoft` zeminli bir şerit: `t('restaurant.closedBanner')` ("Şu an kapalı, sipariş verilemez" / "Closed right now, you can't order").
  - **Kategori sekmeleri:** yapışkan yatay çip listesi. `SectionList`'in `stickySectionHeadersEnabled` özelliği yerine liste üstünde `stickyHeaderIndices` ile sabitlenen bir çip satırı kullanılır. Bir çipe basınca `scrollToLocation` ile ilgili bölüme kaydırılır. Kaydırırken görünür bölümün çipi seçili olur (`onViewableItemsChanged`).
  - **`ProductRow`:** BRAND'den kopyalanır ve yeniden temalanır. Solda ad (15/600), açıklama (2 satır, `mutedForeground`) ve `Price` (indirimliyse eski fiyat çizili). Sağda 88px kare görsel (radius `md`) ve sağ altında beyaz yuvarlak `Plus` butonu. Dokunulunca `router.push({ pathname: '/product/[id]', params: { id, branchId, brandId } })`. Şube kapalıysa dokunulduğunda `Alert` ile `t('restaurant.closedBanner')` gösterilir.
  - Menü boşsa `EmptyState`: `t('restaurant.emptyMenu')` ("Bu restoranın menüsü şu an boş" / "This menu is empty right now").
  - Hata varsa `ErrorState`.
  - Altta Task 9'un `CartBar`'ı gösterilir. Bu görevde yer tutucu olarak `<View />` konur.

- [ ] **Step 4: Ürün sheet'i — `product/[id].tsx`.** BRAND'in `src/app/product/[id].tsx` dosyası kopyalanır ve şu değişiklikler yapılır:
  - `useBrand` ve `useCart` kaldırılır. Ürün `useProduct(id, branchId, brandId)` ile yüklenir.
  - "Sepete ekle" butonunda toplam fiyat gösterilir: `(discountedPrice ?? price) + optionsTotal` × adet.
  - `validateSelections` bir sorun döndürürse ilgili grup kırmızı vurgulanır ve `t('product.required', { group })` ("{{group}} seçimi zorunlu" / "Choose {{group}}") gösterilir. Bu durumda sepete eklenmez.
  - Geçerliyse `buildAddItem` çağrılır, ardından `useAddToCart().mutateAsync({ dto, branchId, brandId })` ve `router.back()`. `buildAddItem` Task 9'da `cart-model.ts` ile gelir. Bu görevde yerel bir `buildAddItem` yazılmaz, Task 9'un fonksiyonunun imzası kullanılır. Bu yüzden **`src/lib/cart-model.ts` bu görevde BRAND'den kopyalanır**. Test Task 9'dadır.

- [ ] **Step 5: Ekran testleri.**
  - **`src/__tests__/restaurant.test.tsx`:**
    1. `getBranch` ve `getBranchMenu` mock'lanır (staging şekline uygun iki kategori, üç ürün). Kategori başlıkları ve ürün adları görünür.
    2. Kapalı şube (`business_hour` bugün `isOpen:false`) için kapalı şeridi görünür.
    3. Boş menüde boş durum metni görünür.
  - **`src/__tests__/product-sheet.test.tsx`:** BRAND'in `src/__tests__/product-sheet.test.tsx` testi kopyalanır ve uyarlanır. En az şu iki senaryo olmalıdır:
    1. Zorunlu VARIANT seçimi yokken "Sepete ekle" basılınca `useAddToCart().mutateAsync` çağrılmaz ve "Size seçimi zorunlu" gösterilir.
    2. Seçim yapılınca `mutateAsync` şu argümanla çağrılır: `{ dto: { productId, qty: 1, options: [{ groupId, optionId }] }, branchId, brandId }`.

    `@/queries/useCart` modülü `jest.mock` ile mock'lanır.
  Run: `npx jest src/__tests__/restaurant.test.tsx src/__tests__/product-sheet.test.tsx`. Expected: PASS.

- [ ] **Step 6: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(restaurant): add the branch menu page and the product options sheet

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 9: Sepet — tek aktif sepet, şube değiştirme onayı, sepet çubuğu, sepet ekranı

**Files:**
- Create: `src/services/cart.service.ts`, `src/queries/useCart.ts` (gerçek), `src/components/CartBar.tsx`, `src/components/CartLineRow.tsx`, `src/app/cart.tsx`
- Modify:
  - `src/lib/cart-model.ts` (Task 8'de kopyalandı)
  - `src/app/(tabs)/_layout.tsx`: `CartBar` sekmelerin üstüne yerleştirilir. `tabBar` prop'u ile özel bir sarmalayıcı kullanılır: `<><CartBar /><BottomTabBar {...props} /></>`.
  - `src/app/restaurant/[branchId].tsx`: altta `CartBar` gösterilir.
  - `src/app/_layout.tsx`: `cart` route'u, başlık `t('cart.title')`.
- Test: `src/lib/__tests__/cart-model.test.ts`, `src/services/__tests__/cart.service.test.ts`, `src/__tests__/cart.test.tsx`

**Interfaces:**
- Consumes: `branchHeaders` (Task 2), `qk.cart` (Task 6), `buildAddItem` (Task 8)
- Produces:
  - `cart.service.ts`:
    - `cartIdOf(cart)`
    - `getCurrentCart(): Promise<Cart | null>`: `GET /carts` satırlarından `isActive !== false` olanları alır, `updatedAt` değeri en yeni olanı seçer, sonra `GET /carts/:id` çağırır (`branchHeaders({branchId, brandId})` ile).
    - `addCartItem(dto, scope): Promise<Cart>`
    - `setCartItemQty(itemId, qty, scope): Promise<Cart>`
    - `removeCartItem(itemId, scope): Promise<void>`
    - `clearCart(cartId, scope): Promise<void>`: `DELETE /carts` ve body `{ cartId }`.
    - `applyPromotion(cartId, input: { promotionCode: string; orderType: OrderType }, scope): Promise<Cart>`: `POST /carts/:id/promotions/apply` ve body `{ type: 'INTERNAL', promotionCode, orderType }`.
    - `removePromotion(cartId, scope): Promise<Cart>`
  - `useCart(): UseQueryResult<Cart | null>` (`qk.cart`)
  - `useAddToCart(): { mutateAsync(input: { dto: AddItemDto; branchId: string; brandId: string }): Promise<'added' | 'cancelled'>; isPending: boolean }`. Mevcut sepet başka bir şubedeyse ve içinde ürün varsa `Alert.alert` ile onay sorulur: başlık `t('cart.switchTitle')`, metin `t('cart.switchBody', { name })`, butonlar `t('common.cancel')` / `t('cart.switchConfirm')`. Onaylanırsa önce `clearCart`, sonra `addCartItem` çağrılır. Vazgeçilirse `'cancelled'` döner.
  - `useUpdateCartLine()`, `useRemoveCartLine()`
  - `cart-model.ts`: BRAND'deki `CartLine`, `buildAddItem`, `cartLinesFromBackend`, `CartSummary`, `summarize`

- [ ] **Step 1:** `cart-model` testi BRAND'in `src/lib/__tests__/cart-model.test.ts` dosyasından kopyalanır.
  Run: `npx jest src/lib/__tests__/cart-model.test.ts`. Expected: PASS.

- [ ] **Step 2: Failing test — `src/services/__tests__/cart.service.test.ts`**
  ```ts
  import { api } from '@/lib/api';
  import { clearCart, getCurrentCart } from '@/services/cart.service';

  type Call = { method?: string; url?: string; data?: unknown; headers: Record<string, unknown> };
  const calls: Call[] = [];
  const respond = (data: unknown) => ({ data: { status: true, message: 'Success', data }, status: 200, statusText: 'OK', headers: {} });

  beforeEach(() => { calls.length = 0; });

  it('opens the newest active cart with its branch headers', async () => {
    api.defaults.adapter = async (config) => {
      calls.push({ method: config.method, url: config.url, data: config.data, headers: { ...config.headers } });
      if (config.url === '/carts') return { ...respond([
        { id: 'old', branchId: 'b1', brandId: 'r1', isActive: true, updatedAt: '2026-10-01T00:00:00Z' },
        { id: 'new', branchId: 'b2', brandId: 'r2', isActive: true, updatedAt: '2026-10-20T00:00:00Z' },
        { id: 'off', branchId: 'b3', brandId: 'r3', isActive: false, updatedAt: '2026-10-21T00:00:00Z' },
      ]), config };
      return { ...respond({ id: 'new', branchId: 'b2', brandId: 'r2', items: [] }), config };
    };
    const cart = await getCurrentCart();
    expect(cart?.id).toBe('new');
    expect(calls[1]).toMatchObject({ url: '/carts/new', headers: { 'x-branch-id': 'b2', 'x-brand-id': 'r2' } });
  });

  it('returns null with no active cart', async () => {
    api.defaults.adapter = async (config) => ({ ...respond([]), config });
    expect(await getCurrentCart()).toBeNull();
  });

  it('clears a cart by id in the body', async () => {
    api.defaults.adapter = async (config) => { calls.push({ method: config.method, url: config.url, data: config.data, headers: { ...config.headers } }); return { ...respond(null), config }; };
    await clearCart('c1', { branchId: 'b1', brandId: 'r1' });
    expect(calls[0]).toMatchObject({ method: 'delete', url: '/carts', headers: { 'x-branch-id': 'b1' } });
    expect(JSON.parse(String(calls[0].data))).toEqual({ cartId: 'c1' });
  });
  ```
  `Cart` tipine `updatedAt?: string` eklenir.
  Run: `npx jest src/services/__tests__/cart.service.test.ts`. Expected: FAIL.

- [ ] **Step 3: `cart.service.ts`.** BRAND'den kopyalanır. `branchId` parametreleri `scope: { branchId: string; brandId?: string | null }` olarak değiştirilir ve `branchHeaders(scope)` kullanılır. `getActiveCart` yerine şu yazılır:
  ```ts
  /** One cart at a time across the marketplace: the newest active row, read in full through GET /carts/:id. */
  export async function getCurrentCart(): Promise<Cart | null> {
    const { data } = await api.get<ApiResponse<Cart[] | null>>('/carts');
    const rows = (unwrap(data) ?? []).filter((cart) => cart.isActive !== false && cartIdOf(cart));
    rows.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    const row = rows[0];
    if (!row) return null;
    const full = await api.get<ApiResponse<Cart>>(`/carts/${cartIdOf(row)}`, { headers: branchHeaders({ branchId: row.branchId, brandId: row.brandId }) });
    return unwrap(full.data);
  }

  export async function clearCart(cartId: string, scope: { branchId: string; brandId?: string | null }): Promise<void> {
    await api.delete('/carts', { data: { cartId }, headers: branchHeaders(scope) });
  }
  ```
  `applyPromotion` ve `removePromotion` portal web'in `src/services/cart.service.ts` dosyasındaki body'lerle yazılır.
  Run: `npx jest src/services/__tests__/cart.service.test.ts`. Expected: PASS.

- [ ] **Step 4: `useCart.ts` (gerçek).**
  - `useCart = () => useQuery({ queryKey: qk.cart, queryFn: getCurrentCart, enabled: signedIn })`.
  - `useAddToCart`: `queryClient.fetchQuery({ queryKey: qk.cart, queryFn: getCurrentCart })` ile mevcut sepeti alır. `current && current.branchId !== branchId && (current.items?.length ?? 0) > 0` ise onay sorar. Onay alınırsa `clearCart` çağırır. Sonra `addCartItem` çağırır, ardından `invalidateQueries({ queryKey: qk.cart })`. Onay sorusu `confirmSwitch(branchName): Promise<boolean>` yardımcısıyla `Alert.alert` üzerinden yapılır. Şube adı `queryClient.getQueryData(qk.branch(current.branchId))?.name ?? t('cart.otherRestaurant')`.
  - `useUpdateCartLine` ve `useRemoveCartLine` işlem sonrası `qk.cart`'ı geçersiz kılar.

- [ ] **Step 5: UI.**
  - **`CartBar`:**
    - `useCart` verisi boşsa veya ürün yoksa `null` döner.
    - Sepet varsa `primary` zeminli, radius `lg`, 56px yüksekliğinde, yatay 16px boşluklu bir bar gösterilir.
    - Solda beyaz yuvarlak içinde ürün adedi, ortada `t('cart.viewCart')` ("Sepete git" / "View cart") ve altında küçük şube adı, sağda `formatMoney(summary.total, currency)`.
    - Dokunulunca `router.push('/cart')`.
  - **`cart.tsx`:**
    - Başlıkta şube adı. `CartLineRow` satırları BRAND'den kopyalanır ve `QuantityStepper` kullanır. Adet 0 olunca satır silinir.
    - Promosyon kodu alanı ve "Uygula" butonu (`applyPromotion`, varsayılan `orderType: 'DELIVERY'`). Uygulanan promosyonlar listelenir, her birinde "Kaldır" vardır.
    - Özet: ara toplam, indirim, toplam.
    - "Ödemeye geç" butonu `router.push('/checkout')`.
    - Şubenin `minBasketPrice` değeri biliniyor ve toplam bunun altındaysa butona basınca `Alert` ile `t('cart.minBasket', { amount })` gösterilir ("Minimum sepet tutarı {{amount}}" / "Minimum order is {{amount}}"). Bilinmiyorsa kontrol yapılmaz.
    - Sepet boşsa `EmptyState`: `ShoppingBag` ikonu, `t('cart.emptyTitle')` ("Sepetin boş" / "Your cart is empty"), aksiyon "Restoranlara göz at" → `/(tabs)`.

- [ ] **Step 6: Ekran testi — `src/__tests__/cart.test.tsx`**
  1. **Şube değiştirme onayı.** `getCurrentCart` mock'u `branchId:'b1'` ve 1 ürünlü sepet döndürür. `useAddToCart` bir test bileşeninde `branchId:'b2'` ile çağrılır. `Alert.alert` spy'ında onay butonunun `onPress`'i çağrılır. Beklenti: `clearCart('c1', …)` ve ardından `addCartItem` çağrılır.
  2. **Vazgeçme.** Aynı kurulumda "Vazgeç" seçilince `clearCart` ve `addCartItem` çağrılmaz, sonuç `'cancelled'` olur.
  3. **Sepet ekranı.** Satırlar ve toplam görünür. Bir satırda `-` basılınca adet 1'den 0'a iner ve `removeCartItem` çağrılır.
  4. **Boş sepet.** Boş sepette "Sepetin boş" görünür.

  `Alert.alert` için `jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1]?.onPress?.())` kalıbı kullanılır.
  Run: `npx jest src/__tests__/cart.test.tsx`. Expected: PASS.

- [ ] **Step 7: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(cart): keep one marketplace cart and confirm before switching restaurants

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 10: Checkout ve ödeme

**Files:**
- Create: `src/lib/checkout.ts`, `src/services/payment.service.ts`, `src/services/loyalty.service.ts` (kredi bakiyesi), `src/lib/pending-payment.ts`, `src/app/checkout.tsx`, `src/app/payment.tsx`
- Modify: `src/app/_layout.tsx`. `payment` için `presentation: 'fullScreenModal'`, `headerShown: false`, `gestureEnabled: false`.
- Test: `src/lib/__tests__/checkout.test.ts`, `src/services/__tests__/payment.service.test.ts`, `src/__tests__/checkout.test.tsx`, `src/__tests__/payment.test.tsx`

**Interfaces:**
- Consumes: `useCart`, `cartIdOf` (Task 9), `getBranch`, `getBranchAvailability`, `getFulfillmentSlots`, `getNearbyBranches` (Task 7), `useLocation` (Task 6), `PORTAL_WEB_ORIGIN` (Task 1)
- Produces:
  - `checkout.ts`:
    - BRAND'den: `orderTypesFor(branch)` (tablo parametresi kaldırılır), `paymentMethodsFor(branch, orderType)`, `isScheduled`, `isDelivery`, `PaymentCallback`, `parsePaymentCallback(url)`.
    - Ek olarak `deliveryCovered(branchId: string, nearby: Branch[]): boolean` ve `settingsOf(branch: Branch | BranchDetail): Pick<Branch, 'order_type_settings' | 'payment_settings'>`. Detay yanıtında ayarlar `parameters` altındaysa oradan okunur.
  - `payment.service.ts`: `initializePayment(input: InitializePaymentInput & { brandId: string }): Promise<PaymentInitializationResponse>`, `getPayment(paymentId): Promise<PaymentRecord>`, `waitForPayment(paymentId, { tries = 5, delayMs = 1500 }): Promise<PaymentRecord>`
  - `loyalty.service.ts`: `getCreditBalance(): Promise<number>`
  - `pending-payment.ts`: BRAND'den kopyalanır, `PendingPayment` alanlarına `brandId` eklenir.

- [ ] **Step 1: Failing test — `src/lib/__tests__/checkout.test.ts`.** BRAND'in `src/lib/__tests__/checkout.test.ts` testi kopyalanır, TABLE_ORDER senaryoları silinir. Şunlar eklenir:
  ```ts
  import { deliveryCovered, parsePaymentCallback, settingsOf } from '@/lib/checkout';

  it('delivery is covered only when the branch is in the nearby result for that address', () => {
    expect(deliveryCovered('b1', [{ id: 'b1' }, { id: 'b2' }] as never)).toBe(true);
    expect(deliveryCovered('b9', [{ id: 'b1' }] as never)).toBe(false);
  });

  it('reads settings from the detail parameters when the top level has none', () => {
    const detail = { parameters: { order_type_settings: { pickup: { isActive: true } } } } as never;
    expect(settingsOf(detail).order_type_settings?.pickup?.isActive).toBe(true);
  });

  it('parses the portal callback URL', () => {
    expect(parsePaymentCallback('https://staging-portalfe.runmeal.com/payment/callback?status=success&paymentId=p1&orderId=o1'))
      .toEqual({ status: 'success', paymentId: 'p1', orderId: 'o1' });
    expect(parsePaymentCallback('https://pay.iyzico.com/checkout')).toBeNull();
  });
  ```
  Run: `npx jest src/lib/__tests__/checkout.test.ts`. Expected: FAIL.

- [ ] **Step 2: `checkout.ts`.** BRAND'den kopyalanır. `TableOptions` ve masa dalları silinir. `paymentMethodsFor`, `payment_settings.onlineMethods` veya `offlineMethods` dizi (`[]`, staging şekli) olarak gelirse ayarı "tanımlı değil" sayar ve BRAND kuralına göre açık kabul eder. Eklenenler:
  ```ts
  /** The API answers "does it deliver here" only through GET /branches/nearby for that point. */
  export const deliveryCovered = (branchId: string, nearby: Pick<Branch, 'id'>[]): boolean => nearby.some((b) => b.id === branchId);

  /** GET /branches/:id keeps the settings under `parameters`; nearby rows have them at the top level. */
  export function settingsOf(branch: Branch | BranchDetail): Pick<Branch, 'order_type_settings' | 'payment_settings'> {
    const params = 'parameters' in branch ? branch.parameters : null;
    return {
      order_type_settings: branch.order_type_settings ?? params?.order_type_settings,
      payment_settings: branch.payment_settings,
    };
  }
  ```
  Run: `npx jest src/lib/__tests__/checkout.test.ts`. Expected: PASS.

- [ ] **Step 3: Failing test — `src/services/__tests__/payment.service.test.ts`**
  ```ts
  import { api } from '@/lib/api';
  import { initializePayment, waitForPayment } from '@/services/payment.service';

  it('sends the portal origin so the provider returns to /payment/callback', async () => {
    let seen: { headers: Record<string, unknown>; data: unknown } | null = null;
    api.defaults.adapter = async (config) => {
      seen = { headers: { ...config.headers }, data: JSON.parse(config.data) };
      return { data: { status: true, message: 'Success', data: { paymentId: 'p1', paymentUrl: 'https://pay' } }, status: 200, statusText: 'OK', headers: {}, config };
    };
    await initializePayment({ cartId: 'c1', branchId: 'b1', brandId: 'r1', paymentMethod: 'ONLINE_CARD', orderType: 'DELIVERY', note: ' kapıyı çalma ' });
    expect(seen!.headers).toMatchObject({ Origin: 'https://staging-portalfe.runmeal.com', 'x-branch-id': 'b1', 'x-brand-id': 'r1' });
    expect(seen!.data).toEqual({ cartId: 'c1', paymentMethod: 'ONLINE_CARD', orderType: 'DELIVERY', creditUsedAmount: 0, note: 'kapıyı çalma' });
  });

  it('polls until the payment settles', async () => {
    jest.useFakeTimers();
    const statuses = ['PENDING', 'PENDING', 'SUCCESS'];
    api.defaults.adapter = async (config) => ({ data: { status: true, message: 'Success', data: { id: 'p1', status: statuses.shift(), orderId: 'o1' } }, status: 200, statusText: 'OK', headers: {}, config });
    const done = waitForPayment('p1', { tries: 5, delayMs: 1500 });
    await jest.advanceTimersByTimeAsync(3000);
    expect((await done).status).toBe('SUCCESS');
    jest.useRealTimers();
  });
  ```
  `InitializePaymentInput` tipine `creditUsedAmount?: number` eklenir.
  Run: `npx jest src/services/__tests__/payment.service.test.ts`. Expected: FAIL.

- [ ] **Step 4: `payment.service.ts`.** BRAND'in `initializePayment` fonksiyonu temel alınır:
  ```ts
  const SETTLED = ['SUCCESS', 'SUCCEEDED', 'PAID', 'COMPLETED', 'FAILED', 'FAILURE', 'CANCELLED', 'CANCELED', 'REFUNDED'];

  export async function initializePayment(input: InitializePaymentInput & { brandId: string }): Promise<PaymentInitializationResponse> {
    const { data } = await api.post<ApiResponse<PaymentInitializationResponse>>(
      '/payments/initialize',
      {
        cartId: input.cartId,
        paymentMethod: input.paymentMethod,
        orderType: input.orderType,
        ...(input.scheduledFor ? { scheduledFor: input.scheduledFor } : {}),
        creditUsedAmount: input.creditUsedAmount ?? 0,
        ...(input.note?.trim() ? { note: input.note.trim() } : {}),
      },
      { headers: { ...branchHeaders({ branchId: input.branchId, brandId: input.brandId }), Origin: PORTAL_WEB_ORIGIN, Referer: `${PORTAL_WEB_ORIGIN}/` } },
    );
    return unwrap(data);
  }

  export async function getPayment(paymentId: string): Promise<PaymentRecord> {
    const { data } = await api.get<ApiResponse<PaymentRecord>>(`/payments/${paymentId}`);
    return unwrap(data);
  }

  /** portalfe's callback page: up to five reads, 1.5 s apart, until the provider's webhook lands. */
  export async function waitForPayment(paymentId: string, { tries = 5, delayMs = 1500 } = {}): Promise<PaymentRecord> {
    let last = await getPayment(paymentId);
    for (let i = 1; i < tries && !SETTLED.includes(String(last.status).toUpperCase()); i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      last = await getPayment(paymentId);
    }
    return last;
  }

  export const isPaid = (p: PaymentRecord) => ['SUCCESS', 'SUCCEEDED', 'PAID', 'COMPLETED'].includes(String(p.status).toUpperCase());
  ```
  Run: `npx jest src/services/__tests__/payment.service.test.ts`. Expected: PASS.

- [ ] **Step 5: `checkout.tsx`.** BRAND'in `src/app/checkout.tsx` dosyası temel alınır, tablo ve marka bağımlılıkları çıkarılır. Akış:
  1. **Veri:** `useCart()`, `useBranch(cart.branchId)`, `useQuery(qk.availability(branchId))`, `useAddresses()` ve `useLocation()`. Teslimat kapsamı `useQuery(['coverage', branchId, lat, lng], () => getNearbyBranches(coords))` ile kontrol edilir: sonuç `deliveryCovered(branchId, rows)`.
  2. **Sipariş tipi:** `orderTypesFor(settingsOf(branch))`. Teslimat kapsam dışıysa DELIVERY ve SCHEDULED_DELIVERY listeden çıkarılır, `t('checkout.notCovered')` gösterilir ("Bu restoran seçili adrese teslimat yapmıyor" / "This restaurant doesn't deliver to the selected address"). Liste boşsa `EmptyState`: `t('checkout.noOrderTypes')` ("Bu restoran şu an sipariş almıyor" / "This restaurant isn't taking orders right now").
  3. **Adres:** teslimat tiplerinde aktif adres gösterilir. "Değiştir" → `AddressSheet`. Adres değişince kapsam yeniden hesaplanır.
  4. **İleri saat:** seçildiyse `getFulfillmentSlots` sonucu yatay gün çipleri ve saat çipleri olarak gösterilir. Seçilen slotun `value` değeri `scheduledFor` olur.
  5. **Ödeme yöntemi:** `paymentMethodsFor(settingsOf(branch), orderType)` sonucu radyo satırları olarak gösterilir. Etiketler `t('checkout.method.ONLINE_CARD')` ("Online kart" / "Card online"), `CASH` ("Nakit" / "Cash"), `CARD_ON_DELIVERY` ("Kapıda kart" / "Card on delivery").
  6. **Kredi:** `getCreditBalance()` > 0 ise "Kredimi kullan ({{amount}})" anahtarı gösterilir. Açıksa `creditUsedAmount = min(bakiye, toplam)`.
  7. **Not:** çok satırlı `TextField`.
  8. **Özet ve onay:** "Siparişi onayla · ₺X" butonu.
     - `availability.canAcceptOrders === false` ise buton yerine `availability.reason ?? t('checkout.unavailable')` gösterilir.
     - Basılınca `initializePayment` çağrılır. Yanıtta `paymentUrl` veya `checkoutFormContent` varsa `setPendingPayment({ paymentId, cartId, branchId, brandId, paymentUrl, checkoutFormContent })` ve `router.push('/payment')`.
     - İkisi de yoksa (nakit veya kapıda kart) `orderId` yanıttan alınır, yoksa `waitForPayment(paymentId)` sonucundan okunur. Sonra `invalidateQueries(qk.cart)`, `invalidateQueries(qk.orders)` ve `router.replace({ pathname: '/orders/[id]', params: { id: orderId, branchId, brandId, placed: '1' } })`.
  9. Hata durumunda `apiErrorMessage` ile `Alert` gösterilir.

- [ ] **Step 6: `payment.tsx`.** BRAND'in `src/app/payment.tsx` dosyası kopyalanır ve şu değişiklikler yapılır:
  - `cafeOrigin` yerine `PORTAL_WEB_ORIGIN` kullanılır. `checkoutFormContent` WebView'a `source={{ html, baseUrl: PORTAL_WEB_ORIGIN }}` ile verilir.
  - `finish` içinde `result.paymentId ?? pending.paymentId` ile `waitForPayment` çağrılır. `isPaid` ise `orderId` (`result.orderId ?? record.orderId`, yoksa BRAND'deki `getMyOrders` + `cartId` araması) ile sipariş ekranına `replace` yapılır.
  - Ödeme başarısızsa ekranda `t('payment.failed')` ("Ödeme tamamlanamadı" / "Payment didn't go through"), "Tekrar dene" (→ `router.replace('/checkout')`) ve "Sepete dön" (→ `router.replace('/cart')`) gösterilir.
  - Sol üstte `X` butonu vardır. Basılınca `Alert` ile onay sorulur: `t('payment.leaveTitle')` ("Ödemeden çıkılsın mı?"). Onaylanırsa ödeme bir kez kontrol edilir (`getPayment`). Ödenmişse sipariş ekranına, ödenmemişse `/cart`'a gidilir.
  - Her durumda `invalidateQueries(qk.cart)`.

- [ ] **Step 7: Ekran testleri.**
  - **`src/__tests__/checkout.test.tsx`:**
    1. Kapsam dışında (`getNearbyBranches` hedef şubeyi döndürmez) "Teslimat" seçeneği yoktur ve kapsam mesajı görünür.
    2. Order type ayarları tümüyle kapalıysa "Bu restoran şu an sipariş almıyor" görünür.
    3. `canAcceptOrders:false, reason:'Mutfak kapalı'` ise "Mutfak kapalı" görünür ve onay butonu yoktur.
    4. Nakit seçilip onaylanınca `initializePayment` şu argümanla çağrılır: `{ cartId, branchId, brandId, paymentMethod: 'CASH', orderType: 'PICKUP', creditUsedAmount: 0 }`. Ardından `router.replace` sipariş ekranına gider.
  - **`src/__tests__/payment.test.tsx`:** BRAND'in `src/__tests__/payment.test.tsx` testi kopyalanır. Şunlar test edilir:
    1. WebView'ın `onShouldStartLoadWithRequest` callback'i `https://staging-portalfe.runmeal.com/payment/callback?status=success&paymentId=p1&orderId=o1` ile çağrılınca `false` döner ve `router.replace` sipariş ekranına gider.
    2. `status=failure` ise "Ödeme tamamlanamadı" görünür.
  Run: `npx jest src/__tests__/checkout.test.tsx src/__tests__/payment.test.tsx`. Expected: PASS.

- [ ] **Step 8: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(checkout): add delivery coverage, order types and the in-app payment flow

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 11: Siparişler — liste ve canlı takip (polling)

**Files:**
- Create: `src/services/order.service.ts`, `src/lib/order-status.ts`, `src/lib/order-display.ts`, `src/queries/useOrders.ts`, `src/components/OrderStatusSteps.tsx`, `src/components/StatusPill.tsx`, `src/app/(tabs)/orders.tsx`, `src/app/orders/[id].tsx`
- Modify: `src/app/(tabs)/_layout.tsx` (Siparişler sekmesi)
- Test: `src/lib/__tests__/order-status.test.ts`, `src/lib/__tests__/order-display.test.ts`, `src/__tests__/orders.test.tsx`

**Interfaces:**
- Consumes: `branchHeaders` (Task 2), `qk` (Task 6)
- Produces:
  - `order.service.ts`: `getMyOrders(): Promise<Order[]>` (paginated `data.data` ya da düz dizi; BRAND'deki gibi), `getOrder(orderId, scope: { branchId; brandId? }): Promise<OrderDetails>`
  - `order-status.ts`: `ORDER_STEPS: OrderStatus[] = ['PENDING','CONFIRMED','PREPARING','READY','DELIVERED']`, `stepIndex(status: string): number` (CANCELLED veya bilinmeyen durum için -1), `isFinal(status: string): boolean`, `isActiveOrder(status: string): boolean`, `ORDER_POLL_MS = 5000`
  - `useOrder(id, scope)`: `refetchInterval: (q) => (q.state.data && isFinal(q.state.data.status) ? false : ORDER_POLL_MS)`, `refetchIntervalInBackground: false`
  - `useOrders()`
  - `order-display.ts`: BRAND'den kopyalanır.

- [ ] **Step 1: Failing test — `src/lib/__tests__/order-status.test.ts`**
  ```ts
  import { isActiveOrder, isFinal, stepIndex } from '@/lib/order-status';

  it('maps statuses to steps', () => {
    expect(stepIndex('PENDING')).toBe(0);
    expect(stepIndex('preparing')).toBe(2);
    expect(stepIndex('DELIVERED')).toBe(4);
    expect(stepIndex('CANCELLED')).toBe(-1);
    expect(stepIndex('WHATEVER')).toBe(-1);
  });

  it('knows final and active orders', () => {
    expect(isFinal('DELIVERED')).toBe(true);
    expect(isFinal('CANCELLED')).toBe(true);
    expect(isFinal('READY')).toBe(false);
    expect(isActiveOrder('READY')).toBe(true);
    expect(isActiveOrder('DELIVERED')).toBe(false);
  });
  ```
  Run: `npx jest src/lib/__tests__/order-status.test.ts`. Expected: FAIL.

- [ ] **Step 2: `order-status.ts`**
  ```ts
  import type { OrderStatus } from '@/types/order';

  export const ORDER_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
  /** No push or customer stream in the API yet (docs/BACKEND_REQUESTS.md): the open order screen polls. */
  export const ORDER_POLL_MS = 5000;

  export const stepIndex = (status: string): number => ORDER_STEPS.indexOf(status.toUpperCase() as OrderStatus);
  export const isFinal = (status: string): boolean => ['DELIVERED', 'CANCELLED'].includes(status.toUpperCase());
  export const isActiveOrder = (status: string): boolean => !isFinal(status);
  ```
  `order-display.ts` ve testi BRAND'den kopyalanır.
  Run: `npx jest src/lib/__tests__/order-status.test.ts src/lib/__tests__/order-display.test.ts`. Expected: PASS.

- [ ] **Step 3: UI.**
  - **`(tabs)/orders.tsx`:**
    - `SectionList`: "Aktif" / "Active" (`isActiveOrder`) ve "Geçmiş" / "Past". Çekince yenilenir.
    - Satırda şube adı (`order.branchName ?? order.branch?.name`, BRAND'deki `Order` tipindeki alana göre), tarih (`Intl.DateTimeFormat`, dil locale'i), `StatusPill` ve toplam.
    - Dokunulunca `/orders/[id]?branchId=&brandId=`.
    - Liste boşsa `EmptyState`: `t('orders.emptyTitle')` ("Henüz siparişin yok" / "No orders yet").
  - **`orders/[id].tsx`:**
    - BRAND'deki `orders/[id].tsx` temel alınır. Veri `useOrder(id, { branchId, brandId })`.
    - Üstte `OrderStatusSteps`: 5 adımlı dikey zaman çizelgesi. Tamamlanan adımlar `primary` dolu daire, aktif adım `primary` halkalı ve nabız animasyonlu (`react-native-reanimated` ile opacity döngüsü), bekleyen adımlar `border` renkli. Etiketler `t('orderStatus.PENDING')`: "Sipariş alındı" / "Order received", `CONFIRMED` "Onaylandı" / "Confirmed", `PREPARING` "Hazırlanıyor" / "Preparing", `READY` "Hazır" / "Ready", `DELIVERED` "Teslim edildi" / "Delivered".
    - CANCELLED ise adımlar yerine `destructiveSoft` kutu ve "Sipariş iptal edildi" / "Order cancelled".
    - Altında kalemler (`itemOptions`, `itemTotal`), ara toplam, indirim ve toplam.
    - `placed=1` ile açıldıysa üstte bir kez `successSoft` zeminli "Siparişin alındı" şeridi gösterilir. Geri tuşu `router.dismissTo('/(tabs)')` yapar.
    - Polling'in arka planda durması `refetchIntervalInBackground: false` ve `focusManager` ile sağlanır (Task 5).

- [ ] **Step 4: Ekran testi — `src/__tests__/orders.test.tsx`**
  ```tsx
  import { act, screen, waitFor } from '@testing-library/react-native';
  import OrderScreen from '@/app/orders/[id]';
  import * as orders from '@/services/order.service';
  import { renderWithProviders } from './helpers/render-with-providers';

  jest.mock('expo-router', () => ({
    router: { dismissTo: jest.fn(), back: jest.fn() },
    useLocalSearchParams: () => ({ id: 'o1', branchId: 'b1', brandId: 'r1' }),
    Stack: { Screen: () => null },
  }));

  const order = (status: string) => ({ id: 'o1', status, branchId: 'b1', brandId: 'r1', currency: 'TRY', items: [], totalPrice: 100, finalPrice: 100 }) as never;

  it('polls every 5 s and stops when delivered', async () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(orders, 'getOrder')
      .mockResolvedValueOnce(order('PREPARING'))
      .mockResolvedValueOnce(order('DELIVERED'))
      .mockResolvedValue(order('DELIVERED'));
    await renderWithProviders(<OrderScreen />);
    await waitFor(() => expect(screen.getByText('Hazırlanıyor')).toBeTruthy());
    await act(() => jest.advanceTimersByTimeAsync(5000));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    await act(() => jest.advanceTimersByTimeAsync(15000));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('o1', { branchId: 'b1', brandId: 'r1' });
    jest.useRealTimers();
  });
  ```
  `OrderDetails` alan adları (`finalPrice` vb.) BRAND'deki `types/order.ts` ile aynı olmalıdır. Test mock'u gerekirse o tipe göre düzeltilir.
  Run: `npx jest src/__tests__/orders.test.tsx`. Expected: PASS.

- [ ] **Step 5: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(orders): list orders and track the open one with polling

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 12: Arama sekmesi

**Files:**
- Create: `src/lib/search.ts`, `src/lib/recent-searches.ts`, `src/queries/useSearchIndex.ts`, `src/app/(tabs)/search.tsx`
- Modify: `src/app/(tabs)/_layout.tsx` (Ara sekmesi)
- Test: `src/lib/__tests__/search.test.ts`, `src/lib/__tests__/recent-searches.test.ts`, `src/__tests__/search.test.tsx`

**Interfaces:**
- Consumes: `useNearbyBranches` (Task 7), `getBranchMenu`, `qk.menu` (Task 8), `foldText` (Task 2)
- Produces:
  - `search.ts`:
    - `type ProductHit = { branch: Branch; product: MenuProduct; brandId: string }`
    - `searchBranches(query: string, branches: Branch[]): Branch[]`
    - `searchProducts(query: string, branches: Branch[], menus: Record<string, Menu>, limit = 30): ProductHit[]`
    - `MIN_QUERY = 2`, `MENU_PREFETCH_LIMIT = 20`
  - `recent-searches.ts`: `loadRecent(): Promise<string[]>`, `pushRecent(q: string): Promise<string[]>` (en fazla 8, tekrarsız, en yeni başta), `clearRecent()`. Saklama anahtarı `rm_recent_searches`.
  - `useSearchIndex(): { branches: Branch[]; menus: Record<string, Menu>; loadingMenus: boolean }`. İlk `MENU_PREFETCH_LIMIT` şube için `useQueries` kullanılır, `staleTime` 10 dk. Aynı anda en fazla 4 istek atılır: sorgular 5'erlik gruplar halinde açılır ve bir grup bitmeden sonraki `enabled` olmaz.

- [ ] **Step 1: Failing test — `src/lib/__tests__/search.test.ts`**
  ```ts
  import { searchBranches, searchProducts } from '@/lib/search';
  import type { Branch } from '@/types/branch';
  import type { Menu } from '@/types/product';

  const b = (id: string, name: string) => ({ id, name, distanceM: 1 }) as Branch;
  const branches = [b('p', 'Artisan Pizza House'), b('k', 'Köfteci Ramiz')];
  const menus: Record<string, Menu> = {
    p: { branchId: 'p', brandId: 'rp', currency: 'TRY', currencySymbol: '₺', categories: [{ id: 'c', name: 'Pizzas', description: null, products: [
      { id: 'm1', name: 'Margherita', description: 'Domates, mozzarella', price: 200 } as never,
      { id: 'm2', name: 'Pepperoni', description: null, price: 240 } as never,
    ] }] },
  };

  it('needs at least two characters', () => {
    expect(searchBranches('a', branches)).toEqual([]);
  });

  it('finds branches accent-insensitively', () => {
    expect(searchBranches('kofte', branches).map((x) => x.id)).toEqual(['k']);
  });

  it('finds products by name or description and keeps their branch', () => {
    const hits = searchProducts('mozza', branches, menus);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ product: { id: 'm1' }, branch: { id: 'p' }, brandId: 'rp' });
  });

  it('ranks name-prefix matches first', () => {
    const hits = searchProducts('pe', branches, menus);
    expect(hits[0].product.id).toBe('m2');
  });
  ```
  Run: `npx jest src/lib/__tests__/search.test.ts`. Expected: FAIL.

- [ ] **Step 2: `search.ts`**
  ```ts
  import type { Branch } from '@/types/branch';
  import type { Menu, MenuProduct } from '@/types/product';
  import { foldText } from './text';

  export const MIN_QUERY = 2;
  /** No search endpoint (docs/BACKEND_REQUESTS.md): products come from the nearest menus only. */
  export const MENU_PREFETCH_LIMIT = 20;
  export type ProductHit = { branch: Branch; product: MenuProduct; brandId: string };

  const score = (text: string, q: string) => (text.startsWith(q) ? 0 : text.split(' ').some((w) => w.startsWith(q)) ? 1 : text.includes(q) ? 2 : -1);

  export function searchBranches(query: string, branches: Branch[]): Branch[] {
    const q = foldText(query.trim());
    if (q.length < MIN_QUERY) return [];
    return branches
      .map((branch) => ({ branch, s: score(foldText(branch.name), q) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s || (a.branch.distanceM ?? 0) - (b.branch.distanceM ?? 0))
      .map((x) => x.branch);
  }

  export function searchProducts(query: string, branches: Branch[], menus: Record<string, Menu>, limit = 30): ProductHit[] {
    const q = foldText(query.trim());
    if (q.length < MIN_QUERY) return [];
    const hits: (ProductHit & { s: number })[] = [];
    for (const branch of branches) {
      const menu = menus[branch.id];
      if (!menu) continue;
      for (const product of menu.categories.flatMap((c) => c.products)) {
        const byName = score(foldText(product.name), q);
        const s = byName >= 0 ? byName : foldText(product.description ?? '').includes(q) ? 3 : -1;
        if (s >= 0) hits.push({ branch, product, brandId: menu.brandId, s });
      }
    }
    return hits.sort((a, b) => a.s - b.s).slice(0, limit).map(({ s: _s, ...hit }) => hit);
  }
  ```
  Run: `npx jest src/lib/__tests__/search.test.ts`. Expected: PASS.

- [ ] **Step 3: `recent-searches.ts` ve testi.**
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  const KEY = 'rm_recent_searches';
  const MAX = 8;

  export async function loadRecent(): Promise<string[]> {
    try {
      const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  export async function pushRecent(query: string): Promise<string[]> {
    const q = query.trim();
    if (!q) return loadRecent();
    const next = [q, ...(await loadRecent()).filter((x) => x.toLocaleLowerCase() !== q.toLocaleLowerCase())].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  export const clearRecent = () => AsyncStorage.removeItem(KEY);
  ```
  Test (`src/lib/__tests__/recent-searches.test.ts`):
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { loadRecent, pushRecent } from '@/lib/recent-searches';
  beforeEach(() => AsyncStorage.clear());
  it('keeps eight unique searches, newest first', async () => {
    for (const q of ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9']) await pushRecent(q);
    await pushRecent('C3');
    const list = await loadRecent();
    expect(list).toHaveLength(8);
    expect(list[0]).toBe('C3');
    expect(list.filter((x) => x.toLowerCase() === 'c3')).toHaveLength(1);
  });
  ```
  Run: `npx jest src/lib/__tests__/recent-searches.test.ts`. Expected: PASS.

- [ ] **Step 4: `(tabs)/search.tsx`**
  - Üstte otomatik odaklanan bir arama input'u (`TextInput`, `card` zemin, radius `md`, `Search` ikonu, temizle butonu). Placeholder `t('search.placeholder')`: "Restoran veya yemek ara" / "Search restaurants or dishes".
  - Sorgu `MIN_QUERY` altındaysa son aramalar çip olarak gösterilir ("Son aramalar" ve "Temizle"). Son arama yoksa kategori çipleri gösterilir, bir çipe basınca o kategori sorgu olarak yazılır.
  - Sorgu yeterliyse `SectionList` gösterilir:
    - "Restoranlar" bölümü: kompakt `BranchRow` (logo, ad, mesafe) → restoran sayfası.
    - "Ürünler" bölümü: `ProductRow` benzeri satır, altında küçük şube adı. Dokunulunca `router.push('/restaurant/[branchId]')` ve hemen ardından `router.push({ pathname: '/product/[id]', params: { id, branchId, brandId } })`.
  - `loadingMenus` true iken "Ürünler" başlığının yanında küçük bir spinner ve `t('search.loadingMenus')` ("Menüler taranıyor…" / "Scanning menus…") gösterilir.
  - Sonuç yoksa `EmptyState`: `t('search.noResults', { q })`.
  - Gönderilince (`onSubmitEditing`) veya bir sonuca dokunulunca `pushRecent(q)` çağrılır.
  - Arama 250 ms debounce ile çalışır (`useDeferredValue` yeterli).

- [ ] **Step 5: Ekran testi — `src/__tests__/search.test.tsx`**
  1. `useSearchIndex` mock'u iki şube ve bir menü döndürür. "marg" yazılınca "Margherita" ve şube adı görünür.
  2. "xyzq" yazılınca boş durum metni görünür.
  3. Boş sorguda son aramalar listelenir (AsyncStorage'a önceden `["pizza"]` yazılır).
  Run: `npx jest src/__tests__/search.test.tsx`. Expected: PASS.

- [ ] **Step 6: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(search): search nearby restaurants and their menus on device

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 13: Hesap — profil, favoriler, ödüller, dil, yasal, hesap silme

**Files:**
- Create:
  - `src/app/(tabs)/account.tsx`, `src/app/favorites.tsx`, `src/app/rewards/index.tsx`, `src/app/rewards/[brandId].tsx`, `src/app/legal/[page].tsx`, `src/app/delete-account.tsx`
  - `src/content/legal.ts`, `src/components/StampStrip.tsx`
  - `src/services/loyalty.service.ts` (stamp fonksiyonları eklenir)
- Modify: `src/app/(tabs)/_layout.tsx` (Hesap sekmesi), `src/app/_layout.tsx` (route'lar)
- Test: `src/__tests__/account.test.tsx`, `src/__tests__/delete-account.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 5), `useFavorites` (Task 7), `changeLanguage` (Task 3), `useOrders` (Task 11)
- Produces:
  - `loyalty.service.ts`: `getStampCards(brandId): Promise<StampCard[]>`. `getCreditBalance` Task 10'da yazıldı.
  - Route'lar: `/favorites`, `/rewards`, `/rewards/[brandId]`, `/legal/[page]` (`privacy` | `terms`), `/delete-account`

- [ ] **Step 1: `(tabs)/account.tsx`.** BRAND'in `(tabs)/account.tsx` dosyası temel alınır. İçerik:
  - Üstte krem kart: baş harf avatarı, ad soyad, e-posta.
  - Gruplu satırlar (her satırda lucide ikon, metin ve `ChevronRight`):
    - Adreslerim → `/addresses`
    - Favorilerim → `/favorites`
    - Ödüllerim → `/rewards`
    - Siparişlerim → `/(tabs)/orders`
    - Dil: sağda "Türkçe" / "English". Dokunulunca `Alert` ile iki seçenek sunulur ve `changeLanguage` çağrılır.
    - Gizlilik politikası → `/legal/privacy`
    - Kullanım koşulları → `/legal/terms`
    - Çıkış yap: `destructive` metin, onay sonrası `signOut()` ve `router.replace('/(auth)/login')`.
    - Hesabımı sil → `/delete-account`
  - En altta `Application.nativeApplicationVersion` ve staging'de `IS_STAGING` ise "Staging" rozeti.

- [ ] **Step 2: `favorites.tsx`.** `useFavorites().favorites` listelenir: kompakt satırlar (logo, ad, adres) ve sağda dolu kalp (dokununca favoriden çıkar). Satıra dokunulunca restoran sayfası açılır. Liste boşsa `EmptyState`: `t('favorites.emptyTitle')` ("Favori restoranın yok" / "No favourites yet"), `t('favorites.emptyBody')` ("Restoran sayfasındaki kalbe dokun" / "Tap the heart on a restaurant").

- [ ] **Step 3: Ödüller.**
  - **`rewards/index.tsx`:** `useOrders()` sonucundaki benzersiz `brandId`'ler ve her birinin son siparişindeki şube adı (marka adı olarak) listelenir. Her satırda `getStampCards(brandId)` özeti gösterilir ("3/10 damga"). Damga kartı olmayan markalar listelenmez. Liste boşsa `EmptyState`: "Sipariş verdikçe ödül kazanırsın" / "Order to start earning rewards".
  - **`rewards/[brandId].tsx`:** BRAND'in `rewards.tsx` ve `StampStrip.tsx` dosyalarından damga kartı gösterimi kopyalanır. Wallet butonları ve üye QR'ı **alınmaz** (v1 kapsamı dışında).

- [ ] **Step 4: Yasal ve hesap silme.** BRAND'deki `legal/[page].tsx`, `content/legal.ts` ve `delete-account.tsx` kopyalanır. Metinlerdeki şirket adı **"PLUG DIGITAL LTD"** olmalıdır ("Works" geçmez). Uygulama adı "Runmeal" olarak güncellenir. `content/legal.ts` metinleri TR ve EN olarak iki sürüme ayrılır, dil seçimine göre gösterilir. BRAND'de sadece İngilizce varsa Türkçe çevirisi eklenir. BRAND'in `delete-account.test.tsx` testi kopyalanır.

- [ ] **Step 5: Ekran testi — `src/__tests__/account.test.tsx`**
  1. Ad ve e-posta görünür.
  2. "Dil" satırında "English" seçilince `changeLanguage('en')` çağrılır.
  3. "Çıkış yap" onaylanınca `signOut` çağrılır ve `router.replace('/(auth)/login')`.
  4. "PLUG DIGITAL LTD" metni gizlilik sayfasında görünür ve "Works" geçmez: `expect(screen.queryByText(/Works/)).toBeNull()`.
  Run: `npx jest src/__tests__/account.test.tsx src/__tests__/delete-account.test.tsx`. Expected: PASS.

- [ ] **Step 6: Doğrula ve commit'le**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest
  git add -A && git commit -m "feat(account): add profile, favourites, rewards, language and legal pages

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```

---

### Task 14: Backend istekleri dokümanı, README ve uçtan uca doğrulama

**Files:**
- Create: `docs/BACKEND_REQUESTS.md`
- Modify: `README.md`

- [ ] **Step 1: `docs/BACKEND_REQUESTS.md`.** BRAND'in `docs/BACKEND_REQUESTS.md` biçimi kullanılır. Her istek için şu başlıklar yazılır: neden, önerilen endpoint (method, path, request, response), uygulamanın şu anki geçici çözümü. İstekler:
  1. `GET /search?q&lat&lng`: şube ve ürün araması. Geçici çözüm: istemci tarafında en yakın 20 menü taranıyor.
  2. Favoriler: `GET/POST/DELETE /favorites/branches/:id`. Geçici çözüm: cihazda tutuluyor.
  3. Şube ve marka mutfak etiketi (`cuisineTags: string[]`). Geçici çözüm: anahtar kelime eşleştirme.
  4. `GET /branches/nearby` satırlarına `brandId`, `brandName`, `minBasketPrice` ve tahmini teslimat süresi eklenmesi.
  5. Puan ve yorum.
  6. Müşteri sipariş durumu akışı (SSE `GET /customer/orders/:id/stream`) ve Expo push token kaydı (`POST /devices`), durum değişince push gönderimi. Geçici çözüm: 5 saniyelik polling.
  7. Apple Sign-In için birden fazla bundle ID (`APPLE_SIGNIN_BUNDLE_IDS=uk.dharmacoffee.ios,com.runmeal.portal`), `src/auth/services/apple-sign-in.service.ts:384`.
  8. Google: `com.runmeal.portal` için iOS ve Android OAuth client'larının oluşturulması. Bu bir Google Cloud Console işi, kod değişikliği gerekmez.
  9. Müşterinin `PENDING` siparişi iptal edebilmesi (`orders:cancel` customer izni veya `PATCH /customer/orders/:id/cancel`).
  10. Staging şube seed'lerinde `order_type_settings` ve `payment_settings` değerlerinin açılması (uçtan uca test için).

- [ ] **Step 2: README'yi güncelle.** Şu bölümler eklenir:
  - Özellik listesi.
  - Ekran akışı.
  - Ortam değişkenleri tablosu (spec Bölüm 3).
  - "Google/Apple girişini açmak" bölümü (önkoşullar ve `EXPO_PUBLIC_SIGN_IN_*` bayrakları).
  - EAS profilleri.
  - Bilinen sınırlamalar (BACKEND_REQUESTS'e bağlantıyla).

- [ ] **Step 3: Tüm kontroller**
  ```bash
  npx tsc --noEmit && npx expo lint && npx jest --coverage=false
  npx expo-doctor
  ```
  Expected: hepsi hatasız.

- [ ] **Step 4: iOS simülatörde uçtan uca deneme** (staging):
  ```bash
  npx expo run:ios
  ```
  CocoaPods yoksa `npx expo start` + Expo Go denenir. Google Sign-In native modülü Expo Go'da yoktur, ama bayrak kapalı olduğu için sorun çıkmaz. Kontrol listesi:
  1. Giriş ekranı açılır ve e-posta + reCAPTCHA görünür. OTP kodu için staging'de erişilebilir bir e-posta gerekir. Yoksa staging'de şifreli bir test hesabıyla "Şifreyle giriş" denenir. Hesap bilgisi kullanıcıdan istenir, uygulamaya veya repoya yazılmaz.
  2. Adres onboarding'i açılır. "Konumumu kullan" → simülatör konumu Kadıköy (40.9909, 29.0303) olarak ayarlanır: `xcrun simctl location booted set 40.9909,29.0303`.
  3. Ana sayfada 6 staging şubesi listelenir. Pizza çipi filtreler.
  4. Restoran sayfası → ürün sheet'i → zorunlu "Size" uyarısı → seçim → sepete ekle → sepet çubuğu görünür.
  5. Başka bir şubeden ürün eklenince onay sorulur.
  6. Checkout: staging ayarları kapalı olduğu için "Bu restoran şu an sipariş almıyor" görünür (beklenen davranış).
  7. Arama: "marg" yazılınca ürün sonuçları gelir.
  8. Hesap: dil İngilizce'ye geçer ve fiyatlar `£180.00` biçimine döner.

  Her adım için ekran görüntüsü alınır. Bulunan hatalar düzeltilir ve ilgili testler eklenir.

- [ ] **Step 5: Commit**
  ```bash
  git add -A && git commit -m "docs: list backend requests and document setup

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  ```
