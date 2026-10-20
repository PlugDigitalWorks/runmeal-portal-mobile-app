# Runmeal Portal Mobil Uygulaması — Tasarım (Spec)

**Tarih:** 2026-10-21
**Repo:** `PlugDigitalWorks/runmeal-portal-mobile-app` (yerelde `runmeal/runmeal-portal-mobile-app`)
**Amaç:** Uber Eats benzeri, çok markalı bir müşteri uygulaması. Kullanıcı adresine teslimat yapan Runmeal restoranlarını (şubeleri) keşfeder, menüyü gezer, sepete ekler, öder ve siparişini takip eder. Görsel dil Runmeal'ın sıcak turuncu/krem tonlarıdır.

## 1. Kararlar

1. **Backend değişmez.** `runmeal-api` ve `runmeal-brand-fe-website` yalnızca okunur. Backend'de olmayan Uber Eats özellikleri ya istemcide çözülür ya da v1 dışında kalır. Eksikler `docs/BACKEND_REQUESTS.md` dosyasında listelenir.
2. **Altyapı:** `runmeal-brand-mobile-app` ile aynı. Expo SDK 58 (React Native 0.88, React 19), expo-router, TypeScript strict, axios, i18next, Jest (jest-expo) ve Testing Library. Bunlara ek olarak sunucu verisi için **TanStack Query** kullanılır.
3. **Kod paylaşımı:** Ortak paket yok. Brand app'teki taşınabilir modüller bu repoya kopyalanır ve çok markalı yapıya uyarlanır. Brand repo'suna dokunulmaz.
4. **Dil:** Türkçe ve İngilizce. Dil cihazdan seçilir, Hesap ekranından değiştirilebilir. Para birimi API'deki `currencySymbol`/`currency` alanından gelir.
5. **Giriş zorunlu.** Oturum yoksa giriş ekranı gelir, misafir gezintisi yok.
6. **Uygulama kimliği:**
   - Mağaza adı "Runmeal", iOS bundle ve Android package `com.runmeal.portal`, scheme `runmealportal`.
   - Apple Team `T776LGPKWZ`.
7. **Tasarım yönü B — "Sıcak Runmeal":**
   - Krem zemin, turuncu üst bant (adres ve arama), yumuşak kenarlı beyaz kartlar, turuncu vurgular.
   - Sistem fontu kullanılır.
8. **Backend adresi:**
   - Varsayılan staging: `https://api-staging.runmeal.com/api`. Bu Cloudflare edge'den geçer ve `staging-api.runmeal.com` ile aynı sunucuya gider.
   - Production: `https://api.runmeal.com`.
   - Seçim `EXPO_PUBLIC_API_URL` ile yapılır. Production'a yazma yapan test yapılmaz.
9. **Push bildirimi, puan/yorum, canlı kurye haritası, masa QR akışı v1'de yok.**

## 2. Ekranlar ve akış

Alt sekmeler: **Ana sayfa · Ara · Siparişler · Hesap**. Sepette ürün varken sekmelerin üstünde yüzen bir sepet çubuğu görünür (şube adı, adet, toplam, "Sepete git").

| Route | Ekran |
|---|---|
| `/(auth)/login` | E-posta + "Kod gönder" (OTP). "Şifreyle giriş" seçeneği. Google/Apple butonları config bayrağıyla açılır |
| `/(auth)/verify` | 6 haneli OTP kodu |
| `/(auth)/register` | Ad, soyad, e-posta, ardından OTP |
| `/onboarding/address` | Aktif adres yoksa zorunlu. Konumdan doldur veya elle gir |
| `/(tabs)/index` | Ana sayfa: turuncu üst bant (adres seçici, arama kutusu), kategori çipleri, "Yakınındakiler" listesi |
| `/(tabs)/search` | Şube ve ürün arama, son aramalar |
| `/(tabs)/orders` | Aktif ve geçmiş siparişler |
| `/(tabs)/account` | Profil, adresler, favoriler, ödüller, dil, yasal sayfalar, çıkış, hesap silme |
| `/restaurant/[branchId]` | Şube sayfası: banner, logo, bilgi satırı, yapışkan kategori sekmeleri, ürün listesi, favori |
| `/product/[id]` | Alt sayfa (sheet): seçenek grupları, not, adet, "Sepete ekle" |
| `/cart` | Sepet satırları, promosyon kodu, ödül/cüzdan, ara toplam, "Ödemeye geç" |
| `/checkout` | Adres, sipariş tipi (teslimat/gel-al, şimdi/ileri saat), ödeme yöntemi, not, kredi kullanımı, özet |
| `/payment` | Tam ekran WebView: ödeme sağlayıcı sayfası |
| `/orders/[id]` | Sipariş takibi: durum adımları, kalemler, toplamlar. Ekran açıkken otomatik yenilenir |
| `/addresses`, `/addresses/form` | Adres listesi ve adres formu |
| `/favorites` | Favori şubeler |
| `/rewards/[brandId]` | Markaya ait damga kartı |
| `/legal/[page]`, `/delete-account` | Yasal metinler ve hesap silme |

### Ana sayfa ayrıntıları
- **Adres seçici:** aktif adresin etiketi ve ilçesi gösterilir. Dokunulunca adres listesi sheet olarak açılır, seçilen adres `PATCH /addresses/:id/set-active` ile aktif yapılır.
- **Kategori çipleri:** sabit bir kategori listesi vardır (kahve, pizza, burger, döner/kebap, tatlı, kahvaltı, sağlıklı, dünya mutfağı). Her kategorinin TR/EN anahtar kelimeleri tutulur. Bir şube, adı, marka adı veya önbelleğe alınmış menüsündeki kategori/ürün adları bu kelimelerle eşleşirse o kategoride görünür. Hiçbir şubenin eşleşmediği çip gizlenir. "Tümü" çipi her zaman görünür.
- **Sıralama:** önce açık olan şubeler, sonra mesafe.
- **Şube kartı:**
  - Banner (`bannerUrls[0]`) ve logo (`logoUrl`). Görsel yoksa krem renkli yer tutucu ve Runmeal ikonu gösterilir.
  - Ad, mesafe (`distanceM`), minimum sepet (`minBasketPrice`) ve favori kalbi.
  - Kapalı şubelerde "Kapalı" rozeti gösterilir ve kart soluk görünür.

### Arama
- Şube ve marka adları, mevcut yakındaki şube listesinde anında aranır.
- Ürün araması için yakındaki ilk 20 şubenin menüsü (`GET /branches/:id/menu`) arka planda en fazla 4 paralel istekle çekilir. Menüler TanStack Query'de 10 dakika önbelleğe alınır.
- Sonuçlar "Restoranlar" ve "Ürünler" başlıkları altında listelenir. Ürüne dokunulunca şube sayfası açılır ve ürün sheet'i gösterilir.
- Eşleştirme büyük/küçük harfe ve Türkçe aksanlara duyarsızdır (`ı/i`, `ş/s`, `ğ/g`, `ç/c`, `ö/o`, `ü/u`).
- Son 8 arama AsyncStorage'da saklanır.

### Sepet kuralları
- Sepet sunucudadır ve bir şubeye bağlıdır. Esas kaynak `GET /carts` ile `GET /carts/:id`'dir.
- Başka bir şubeden ürün eklenirse "Sepetinde başka bir restorandan ürün var. Yeni sepet oluşturulsun mu?" onayı istenir. Onaylanırsa `DELETE /carts {cartId}` çağrılır, sonra ürün eklenir.
- Ekleme, adet değiştirme ve silme sonrası sepet sorgusu yeniden çekilir. Sepet çubuğu bu sorgudan beslenir.
- Minimum sepet tutarının altında "Ödemeye geç" butonu devre dışı değildir. Basıldığında eksik tutar mesajı gösterilir.

### Ödeme ekranı (checkout)
- **Sipariş tipi:** şubenin `order_type_settings` ayarına göre DELIVERY, PICKUP, SCHEDULED_DELIVERY veya SCHEDULED_PICKUP. İleri saatli siparişlerde zaman dilimleri `GET /branches/:id/fulfillment-slots?orderType=` ile alınır.
- **Teslimat kapsamı:** seçilen adresin koordinatlarıyla `GET /branches/nearby?lat&lng` çağrılır. Hedef şube sonuçta yoksa "Bu adrese teslimat yok" mesajı gösterilir ve DELIVERY seçilemez.
- **Uygunluk:** `GET /branches/:id/availability` sonucu `canAcceptOrders=false` ise `reason` mesajı gösterilir ve sipariş verilemez.
- **Ödeme yöntemi:** şubenin `payment_settings` ayarına göre ONLINE_CARD, CASH ve CARD_ON_DELIVERY.
- **Kredi:** `GET /loyalty/credit/balance` bakiyesi varsa "Kredimi kullan" anahtarı gösterilir.

### Ödeme (payment)
1. `POST /payments/initialize` çağrısı şu body ve header ile yapılır:
   - Body: `{cartId, paymentMethod, orderType, scheduledFor?, creditUsedAmount, note?}`
   - Header: `Origin: <PORTAL_WEB_ORIGIN>` (staging `https://staging-portalfe.runmeal.com`, prod `https://portalfe.runmeal.com`). Backend ödeme dönüşünü bu origin'in `/payment/callback` path'ine yönlendirir.
2. Yanıta göre:
   - `paymentUrl` varsa WebView bu URL'i açar.
   - `checkoutFormContent` varsa WebView bu HTML'i `baseUrl = PORTAL_WEB_ORIGIN` ile yükler.
   - İkisi de yoksa ödeme kapıda veya nakit demektir. Doğrudan 4. adıma geçilir.
3. WebView `/payment/callback` path'li bir URL'e gittiğinde gezinme durdurulur ve `paymentId`/`status` URL'den okunur.
4. `GET /payments/:paymentId` en fazla 5 kez, 1,5 saniye arayla çağrılır.
   - Ödeme başarılıysa sepet sorgusu geçersiz kılınır ve `/orders/[orderId]` ekranı açılır (geri tuşu ana sayfaya döner).
   - Başarısızsa "Ödeme tamamlanamadı" mesajı ve "Tekrar dene" butonu gösterilir.
5. Kullanıcı WebView'ı kapatırsa onay sorulur. Kapatma onaylanırsa ödeme bir kez doğrulanır, ödeme yapılmamışsa sepete dönülür.

### Sipariş takibi
- Durum adımları: PENDING → CONFIRMED → PREPARING → READY → DELIVERED. CANCELLED ayrı ve kırmızı gösterilir.
- Ekran odaktayken `GET /orders/:id` 5 saniyede bir çağrılır (x-branch-id ve x-brand-id header'larıyla). Uygulama arka plana geçince veya sipariş DELIVERED/CANCELLED olunca yenileme durur.
- Siparişler sekmesi `GET /orders/customer` ile çalışır. Aktif siparişler üstte gösterilir, aşağı çekince yenilenir.

## 3. Mimari

```
src/
  app/              # expo-router route'ları (yalnızca ekranlar)
  components/       # ekrana özel bileşenler (BranchCard, CategoryChips, CartBar, …)
  ui/               # tasarım sistemi parçaları (Button, Chip, Sheet, Skeleton, Price, …)
  theme.ts          # B tasarımının token'ları
  services/         # API çağrıları (auth, branch, menu, cart, payment, order, address, loyalty, profile)
  queries/          # TanStack Query hook'ları ve query key'leri
  context/          # AuthContext (oturum), LocationContext (aktif adres → lat/lng)
  lib/              # saf mantık (api, session, money, cart-model, product-options, search, categories, order-status, …)
  i18n/             # i18next, locales/tr.json, locales/en.json
  types/            # API tipleri
  __tests__/        # ekran testleri
```

### API istemcisi (`src/lib/api.ts`)
- Base URL `EXPO_PUBLIC_API_URL` ile verilir. Varsayılan `https://api-staging.runmeal.com/api`.
- Her istekte `x-auth-mode: body`, `x-device-id` ve oturum varsa `Authorization: Bearer` gönderilir. Global `x-brand-id` yoktur.
- Şube kapsamlı çağrılar `branchHeaders(branch)` yardımcı fonksiyonuyla o istek için `x-branch-id` ve `x-brand-id` ekler.
- 401 gelince tek seferlik `POST /auth/refresh {client:'user', refreshToken, sid}` yapılır ve istek bir kez tekrar denenir. Refresh 400, 401 veya 403 ile reddedilirse oturum silinir ve `onSessionExpired` dinleyicileri çağrılır, bu da giriş ekranına götürür. Bu mantık brand app'ten aynen alınır.
- Yanıtlar `unwrap()` ile `{status, message, data}` zarfından çıkarılır. Hata mesajları `apiErrorMessage()` ile API'nin `message` alanından okunur.

### Ortam ayarları (`src/config.ts`)

| Ayar | Staging (varsayılan) | Production |
|---|---|---|
| `API_URL` | `https://api-staging.runmeal.com/api` | `https://api.runmeal.com` |
| `PORTAL_WEB_ORIGIN` | `https://staging-portalfe.runmeal.com` | `https://portalfe.runmeal.com` |
| `RECAPTCHA_SITE_KEY` | portal web'in `.env.staging` anahtarı | portal web'in `.env.production` anahtarı |
| `GOOGLE_WEB_CLIENT_ID` | brand app'teki staging değeri | brand app'teki production değeri |

- Ortam, `API_URL` hostunda `staging` geçip geçmediğine göre seçilir. Her değer `EXPO_PUBLIC_*` ile ezilebilir.
- `SIGN_IN_GOOGLE` ve `SIGN_IN_APPLE` bayrakları `EXPO_PUBLIC_SIGN_IN_GOOGLE=1` / `EXPO_PUBLIC_SIGN_IN_APPLE=1` ile açılır, varsayılan olarak kapalıdır (bkz. Bölüm 6).

### Durum yönetimi
- **Oturum:** `AuthContext`. Token'lar `expo-secure-store`'da, kullanıcı bilgisi AsyncStorage'da tutulur (brand app'in `session.ts` modülü).
- **Sunucu verisi:** TanStack Query.
  - Query key'leri `src/queries/keys.ts` dosyasında tanımlanır.
  - Varsayılanlar: `staleTime` 30 sn, menüler için 10 dk. `retry` 1 (4xx hatalarında yeniden deneme yok).
  - Uygulama ön plana gelince sorgular tazelenir (`focusManager` + `AppState`).
- **Konum:** `LocationContext`. Aktif adres `GET /addresses` sonucundaki `isActive` kaydıdır, koordinatlar `latitude`/`longitude` veya `locationGeog.coordinates`'tan okunur. Keşif sorgusu bu koordinatlara bağlıdır.
- **Cihazda tutulanlar:** favoriler (`rm_favorites`: branchId listesi ve kart için özet), son aramalar (`rm_recent_searches`), dil (`rm_lang`).

### Giriş
- **E-posta OTP:** `POST /auth/login {email, method:'otp', client:'user', recaptchaToken}` çağrılır, ardından `POST /auth/verify-otp {email, code, client:'user'}`.
- **Şifreyle giriş:** `POST /auth/login {method:'password'}`.
- **Kayıt:** `POST /auth/register {email, firstName, lastName}` çağrılır, ardından OTP doğrulanır.
- **reCAPTCHA:** brand app'teki `Recaptcha.tsx` gibi WebView içinde çözülür, WebView'ın `baseUrl` değeri `PORTAL_WEB_ORIGIN` olur. Staging'de backend anahtar yoksa doğrulamayı atlar, token yine de gönderilir.
- **Google:** `@react-native-google-signin` ile `webClientId` = `GOOGLE_WEB_CLIENT_ID`. Alınan token `POST /auth/google/native {idToken, client:'user'}`'e gönderilir.
- **Apple (iOS):** `expo-apple-authentication` ile alınan token `POST /auth/apple/native {identityToken, authorizationCode, nonce, firstName?, lastName?, client:'user'}`'e gönderilir.

## 4. Görsel tasarım (B — Sıcak Runmeal)

`src/theme.ts`:

| Token | Değer |
|---|---|
| primary | `#F5A623` |
| primaryPressed | `#E28900` |
| primaryForeground | `#FFFFFF` |
| primarySoft (çip zemini) | `#FFF1DF` |
| primarySoftForeground | `#E28900` |
| background | `#FFFAF5` |
| card | `#FFFFFF` |
| border | `#F2E6D7` |
| bannerPlaceholder | `#FFE3BF` |
| foreground | `#10192E` |
| mutedForeground | `#6B6257` |
| subtle | `#9A8F82` |
| destructive | `#EF4444` |
| success | `#16A34A` |

- **Radius:** sm 6, md 10, lg 16 (kartlar), xl 20 (üst bant alt köşeleri, sheet), full 999 (çipler).
- **Boşluk:** 4, 8, 12, 16, 20, 24.
- **Font boyutları:** 11, 12, 14, 16, 18, 22, 28. Ağırlıklar 400/600/700.
- **Gölge:** kartlarda hafif sıcak gölge (`#7a4a00`, opacity 0.06, radius 12). Android'de elevation 2.
- **Ana sayfa üst bandı:** turuncu zemin, alt köşeler 20 radius. İçinde beyaz metinli adres seçici, sağda profil avatarı, altında beyaz arama kutusu (placeholder "Ne yemek istersin?").
- **Kategori çipleri:** seçili çip koyu (`foreground` zemin, beyaz metin), diğerleri `primarySoft` zeminli.
- **Şube kartı:** beyaz, 16 radius ve 1px `border`. Üstte 140px banner, banner'ın sol altında beyaz çerçeveli yuvarlak logo, sağ üstte favori kalbi. Altta ad, mesafe (turuncu) ve "Min. ₺150" satırı.
- **Alt sekme çubuğu:** beyaz zemin, aktif ikon ve etiket turuncu, ikonlar `lucide-react-native`.
- **Koyu mod v1'de yok.** `userInterfaceStyle: 'light'`.

## 5. Hata ve boş durumlar

| Durum | Davranış |
|---|---|
| Ağ hatası / 5xx | Ekranın ortasında "Bağlantı kurulamadı" mesajı ve "Tekrar dene" butonu. Önbellekte veri varsa veri gösterilir, üstte ince bir uyarı şeridi çıkar |
| Yakında şube yok | Boş durum: "Bu adrese henüz teslimat yapan restoran yok" ve "Adresi değiştir" |
| Menü boş | "Bu restoranın menüsü şu an boş" |
| Şube kapalı | Şube sayfasında üst şerit "Şu an kapalı · açılış 09:00" (business hours'tan). Ürünler gezilebilir, sepete ekleme engellenir |
| Teslimat kapsamı dışı | Checkout'ta DELIVERY seçeneği kapatılır, mesaj gösterilir, varsa PICKUP önerilir |
| Oturum düştü | Giriş ekranına dönülür ve "Oturumun sona erdi" toast'ı gösterilir |
| Ödeme başarısız | Ödeme ekranında mesaj, "Tekrar dene" ve "Sepete dön" butonları |
| Form hataları | Alan altında kırmızı mesaj. API hata mesajları `apiErrorMessage` ile gösterilir |

Yükleme durumlarında spinner yerine skeleton kartlar kullanılır.

## 6. Kod tabanı dışı önkoşullar (uygulamayı engellemez)

1. **Apple ile giriş:** backend `APPLE_SIGNIN_BUNDLE_ID` değişkeninde tek bir bundle ID'ye izin veriyor (`src/auth/services/apple-sign-in.service.ts:384`). `com.runmeal.portal` kabul edilene kadar `SIGN_IN_APPLE` kapalı kalır. App Store kuralı 4.8 gereği, Google ile giriş açılırsa Apple ile giriş de açık olmalıdır. Bu yüzden ikisi birlikte açılır.
2. **Google ile giriş:**
   - Google Cloud projesinde `com.runmeal.portal` için iOS OAuth client oluşturulmalıdır (URL scheme için). Android için package + SHA-1 ile Android OAuth client gerekir.
   - Backend web client audience'ını zaten kabul ediyor.
   - Client'lar oluşturulunca `app.config.ts`'e `iosUrlScheme` girilir ve bayrak açılır.
3. **reCAPTCHA:** production'da portal web'in site anahtarı kullanılır. Anahtarın izinli domainlerinde `portalfe.runmeal.com` olmalıdır (web zaten kullanıyor).
4. **Backend istekleri** (`docs/BACKEND_REQUESTS.md`):
   - arama endpoint'i
   - favoriler
   - şube mutfak/kategori etiketi
   - puan/yorum
   - müşteri için sipariş durumu akışı (SSE) ve Expo push token kaydı
   - çoklu Apple bundle ID
   - müşterinin sipariş iptali
5. **Mağaza:** EAS projesi, App Store Connect ve Play Console kayıtları kullanıcı tarafından açılır. Bu repo `eas.json` profillerini (development, preview, production) hazırlar.

## 7. Test stratejisi

- **Birim testleri (`src/lib/__tests__`):**
  - money
  - cart-model
  - product-options (min/max/zorunlu doğrulama, fiyat hesabı)
  - search (aksan normalizasyonu, eşleşme)
  - categories (anahtar kelime eşleşmesi)
  - order-status (adım hesaplama)
  - api (header'lar, refresh tek seferlik)
  - payment-callback (URL ayrıştırma)
  - config (ortam seçimi)
- **Servis testleri (`src/services/__tests__`):** axios mock ile istek path'i, body ve header'lar.
- **Ekran testleri (`src/__tests__`):**
  - giriş/OTP akışı
  - ana sayfa liste, boş ve hata durumları
  - şube sayfası
  - ürün sheet'i (zorunlu seçenek uyarısı)
  - sepet (başka şube onayı)
  - checkout (kapsam dışı, kapalı şube)
  - ödeme (callback yakalama)
  - sipariş takibi (polling durması)
- **Her görev sonunda:** `npx tsc --noEmit`, `npx expo lint` ve `npm test` geçer.
- **Elle doğrulama:** iOS simülatörde staging'e karşı giriş → adres → keşif → şube → sepet → checkout ekranı. Ödeme yalnızca staging'de ve test kartıyla yapılır. Production'da yazma yapılmaz.

## 8. Kapsam dışı (v1)

Puan ve yorum, push bildirim, canlı kurye haritası, masa QR ve masa hesabı, koyu mod, Apple/Google Wallet kartları, anket ekranı, promosyon kampanya vitrini (sepette kod uygulama dahildir), web sürümü.
