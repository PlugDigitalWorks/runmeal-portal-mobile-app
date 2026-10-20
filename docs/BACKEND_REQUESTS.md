# Backend istekleri

Portal mobil uygulamasının (Expo) backend'den beklediği, şu an API'de karşılığı olmayan ya da eksik olan işler. Uygulama bunların her biri için bir geçici çözümle çalışıyor. Ana sayfa (Keşfet) ve Hesabım'daki geçici veriler "(Mock)" etiketiyle gösterilir (`src/mocks/`, `EXPO_PUBLIC_SHOW_MOCKS=0` ile kapanır; mağaza build'lerinde kapalı olmalı).

Her istek aynı biçimdedir: **Neden**, **Önerilen endpoint**, **Uygulamadaki geçici çözüm**, **Etkilenen ekranlar**. Yol adları öneridir; mevcut API konvansiyonuna göre değişebilir.

## İçindekiler

- [Güvenlik](#güvenlik)
- [Kimlik doğrulama ve hesap](#kimlik-doğrulama-ve-hesap): 1 Apple bundle ID, 2 Google OAuth client'ları, 3 `DELETE /profile`, 4 `PUT /profile`, 5 bildirim tercihleri
- [Keşif ve arama](#keşif-ve-arama): 6 `GET /search`, 7 nearby alanları, 8 mutfak etiketleri, 9 puan ve yorum, 10 kampanyalar, 11 kişiselleştirme
- [Hesabım](#hesabım): 12 favoriler, 13 kayıtlı kartlar, 14 kupon cüzdanı, 15 kredi bakiyesi para birimi
- [Siparişler](#siparişler): 16 sipariş akışı ve push, 17 sipariş iptali
- [Ortam ve test](#ortam-ve-test): 18 staging seed, 19 brand edge notu

## Güvenlik

### G1. `GET /branches/:id` ödeme sağlayıcı alanlarını redakte etmiyor

**Neden:** `GET /branches/:branchId` (`runmeal-api` `src/branches/branches.controller.ts`, `findById`) `branchesService.findByIdWithCurrency` çağırır. Bu, `findById` ile ham `Branch` kaydını (`parameters.payment_settings.providers` dahil) döndürür ve `redactPaymentProviders` uygulamaz. Redaksiyon yalnızca ödeme ayarı endpoint'lerinde var: `getPaymentSettings` (`src/branches/branches.service.ts` ~1370) ve `updatePaymentSettings` (~1395). Yardımcı fonksiyon ~1903'te tanımlı. Uygulama bu endpoint'i giriş yapmış müşteri olarak çağırıyor (`src/services/branch.service.ts`, `getBranch`). Müşteri rolü `branch:read` izniyle bu cevabı alıyorsa, Stripe/iyzico/Dojo gibi sağlayıcıların `secretKey`, `webhookSecret` değerleri (şifreli ya da ham) müşteri cihazına gider. Bunu doğrulayıp kapatmanızı rica ederiz.

**Önerilen endpoint:** `GET /branches/:branchId` cevabında `parameters.payment_settings.providers` her çağıranda `redactPaymentProviders` ile redakte edilsin; hatta müşteri tarafı için sağlayıcı sırlarını hiç döndürmeyen, yalnızca gerekli açık alanları (örn. `publishableKey`, etkin yöntemler) içeren bir cevap tercih edilir. Aynı kontrol `/branches/nearby`, `public-branches` ve menü cevapları için de yapılmalı.

**Uygulamadaki geçici çözüm:** Uygulama `providers` alanını okumaz, saklamaz ve loglamaz. Yalnızca etkin ödeme yöntemlerine bakar. Sızıntıyı istemci tarafında kapatmak mümkün değil; düzeltme backend'de olmalı.

**Etkilenen ekranlar:** Restoran sayfası, Checkout, Ödeme.

## Kimlik doğrulama ve hesap

### 1. Apple Sign-In için birden fazla bundle ID

**Neden:** Backend tek bir `APPLE_SIGNIN_BUNDLE_ID` kabul ediyor (`src/auth/services/apple-sign-in.service.ts`: `config()` ~397'de okur, `clientId()` ~384'te `config.bundleId` döndürür). Portal uygulaması `com.runmeal.portal` ile, mevcut marka uygulaması `uk.dharmacoffee.ios` ile geliyor. Tek değer olduğu için biri çalışırken diğeri Apple token doğrulamasında reddediliyor.

**Önerilen endpoint:** Yeni endpoint yok. Ortam değişkeni virgülle ayrılmış liste kabul etsin (örn. `APPLE_SIGNIN_BUNDLE_IDS=uk.dharmacoffee.ios,com.runmeal.portal`) ve `aud` kontrolü listede arasın. `config-validation.service.ts` (~550) buna göre güncellensin.

**Uygulamadaki geçici çözüm:** Düğme varsayılan olarak açık. Backend `com.runmeal.portal`'ı kabul edene kadar Apple girişi tamamlanamaz. Bayrak `EXPO_PUBLIC_SIGN_IN_APPLE=0` ile kapatılabilir.

**Etkilenen ekranlar:** Giriş, Kayıt.

### 2. Google OAuth client'ları (`com.runmeal.portal`)

**Neden:** `com.runmeal.portal` için Google Cloud Console'da iOS ve Android OAuth client'ları yok. iOS client ID `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` ile uygulamaya verilir, Android client paket adı ve imza sertifikası SHA-1 ile eşleşir. Bu bir Cloud Console işi, kod değişikliği gerekmez. Backend'in Google doğrulaması bu client ID'leri `aud` olarak kabul etmeli (web client ID'si zaten tanımlı).

**Önerilen endpoint:** Yok. Cloud Console'da iki client oluşturulur: iOS (bundle `com.runmeal.portal`) ve Android (paket `com.runmeal.portal`, debug ve release/EAS SHA-1). Backend'in kabul ettiği client ID listesine eklenir.

**Uygulamadaki geçici çözüm:** iOS client ID boşken Google düğmesi yalnızca "hazır değil" mesajı gösterir. Bayrak `EXPO_PUBLIC_SIGN_IN_GOOGLE=0` ile kapatılabilir.

**Etkilenen ekranlar:** Giriş, Kayıt.

### 3. Hesap silme: `DELETE /profile`

**Neden:** App Store Review Guideline 5.1.1(v), hesap oluşturmayı destekleyen uygulamalarda uygulama içinden hesap silmeyi zorunlu kılar. Route şu an yok.

**Önerilen endpoint:** `DELETE /profile`. Request: gövde yok (ya da onay için `{ "reason"?: string }`). Response: `204` ya da `{ "success": true }`. Sunucu oturumu ve token'ları geçersiz kılmalı; siparişler yasal saklama için anonimleştirilmeli.

**Uygulamadaki geçici çözüm:** `/delete-account` ekranı onay alır ve çağrıyı yapar. Cevap 404/405 ise sade bir "şu an kullanılamıyor" mesajı gösterir. Mağaza gönderiminden önce bu endpoint canlıda olmalı.

**Etkilenen ekranlar:** Hesabım → Güvenlik, Hesabı sil.

### 4. Profil güncelleme: `PUT /profile`

**Neden:** Ad, soyad ve telefon uygulamadan düzenlenemiyor; e-posta değişikliği için de doğrulama akışı yok.

**Önerilen endpoint:** `PUT /profile`. Request: `{ "firstName"?: string, "lastName"?: string, "phone"?: string }`. Response: güncel profil nesnesi (`GET /profile` ile aynı biçim). E-posta değişikliği ayrı: `POST /profile/email/change` (`{ "email" }`, OTP gönderir) ve `POST /profile/email/verify` (`{ "email", "code" }`).

**Uygulamadaki geçici çözüm:** Profil düzenleme ve e-posta değiştirme ekranları "(Mock)" etiketli, `SHOW_MOCKS` kapalıyken gizli. Kayıt sırasında girilen değerler değişmez.

**Etkilenen ekranlar:** Hesabım → Profil, Hesabım → E-posta.

### 5. Bildirim tercihleri

**Neden:** Müşteri kampanya, sipariş durumu, bülten ve SMS bildirimlerini ayrı ayrı açıp kapatabilmeli. Şu an saklanacak yer yok.

**Önerilen endpoint:** `GET /profile/notification-preferences` ve `PUT /profile/notification-preferences`. Response/request: `{ "campaigns": boolean, "orderStatus": boolean, "newsletter": boolean, "sms": boolean }`.

**Uygulamadaki geçici çözüm:** Anahtarlar "(Mock)" etiketli ve yalnızca cihazda tutuluyor (`src/mocks/account-mocks.ts`, `DEFAULT_NOTIF_PREFS`). Hiçbir gönderimi etkilemez.

**Etkilenen ekranlar:** Hesabım → Bildirimler.

## Keşif ve arama

### 6. Arama: `GET /search`

**Neden:** Şube ve ürün araması için sunucu tarafı endpoint yok. İstemci, ürün aramasını menü başına bir istekle yapıyor; bu hem yavaş hem pahalı.

**Önerilen endpoint:** `GET /search?q=<metin>&lat=<enlem>&lng=<boylam>&limit=<n>`. Response: `{ "branches": [{ id, name, brandId, brandName, logo, distance, cuisineTags }], "products": [{ id, name, price, imageUrl, branchId, branchName }] }`. Teslimat alanı dışındaki şubeler elenmeli, sonuçlar mesafeye göre sıralanmalı. En az 2 karakter, Türkçe karakter duyarsız eşleşme.

**Uygulamadaki geçici çözüm:** En yakın 20 şubenin menüsü istemcide indirilip taranıyor (paylaşılan bir istek sınırlayıcıyla), şube adları da istemcide eşleştiriliyor.

**Etkilenen ekranlar:** Arama, Keşfet arama çubuğu.

### 7. `GET /branches/nearby` satırlarına yeni alanlar

**Neden:** Satırda `brandId`, `brandName`, `minBasketPrice` ve tahmini teslimat süresi yok. `brandId` menü ya da şube detayı açılana kadar bilinmiyor, bu yüzden zincir gruplama, sepet ve favoriler ek isteklere bağlı.

**Önerilen endpoint:** Mevcut `GET /branches/nearby?lat&lng` cevabındaki her satıra eklenmeli: `brandId: string`, `brandName: string`, `minBasketPrice: number | null` (şubenin teslimat için en düşük sepet tutarı), `estimatedDeliveryMinutes: { min: number, max: number } | null` (mesafe, hazırlık ve yoğunluğa göre). `brandName` zincir gruplaması için de kullanılır.

**Uygulamadaki geçici çözüm:** Marka adı şube adlarının ortak başlangıcından tahmin ediliyor, `brandId` şube detayından okunuyor. Teslimat süresi mesafeden hesaplanan beş dakikalık bir pencere ("(Mock)", `mockDelivery`). Minimum sepet kartlarda gösterilmiyor.

**Etkilenen ekranlar:** Keşfet (şube kartları, zincir hikayeleri), Restoranlar, Arama, Favorilerim.

### 8. Mutfak etiketleri

**Neden:** Şube ve marka için mutfak kategorisi verisi yok. Çipler ve mutfak karoları bu yüzden güvenilir filtrelemiyor.

**Önerilen endpoint:** Şube ve marka nesnelerine `cuisineTags: string[]` (sabit, çevrilebilir kodlar, örn. `pizza`, `burger`, `kebab`, `dessert`). Ek olarak `GET /branches/nearby?cuisine=pizza` filtresi ve `GET /cuisines` etiket listesi.

**Uygulamadaki geçici çözüm:** Mutfak, şube adındaki ve menü metnindeki anahtar kelimelerden tahmin ediliyor. Hatalı eşleşme ya da kaçırma olabilir.

**Etkilenen ekranlar:** Keşfet (kategori çipleri, mutfak karoları), Restoranlar, Arama.

### 9. Puan ve yorum

**Neden:** Şubelerin puanı ve müşteri yorumu yok; keşif ekranlarında sıralama ve güven için gerekiyor.

**Önerilen endpoint:** `GET /branches/nearby` satırında `rating: number | null` ve `ratingCount: number`. Ayrıca `GET /branches/:id/reviews?cursor&limit` (`[{ id, rating, comment, createdAt, authorFirstName }]`) ve tamamlanmış siparişten sonra `POST /customer/orders/:id/review` (`{ rating: 1-5, comment?: string }`). Aynı sipariş için tek yorum.

**Uygulamadaki geçici çözüm:** Şube kimliğinden türetilmiş sabit puan ve sayı ("(Mock)", `mockRating`, `mockRatingCount`). Yorum yazma ekranı yok.

**Etkilenen ekranlar:** Keşfet ("En yüksek puanlılar", kartlar), Restoran sayfası, Siparişlerim.

### 10. Kampanyalar ve öne çıkanlar

**Neden:** Kampanya vitrini ve kampanya detayı için veri yok.

**Önerilen endpoint:** `GET /campaigns?lat&lng` ve `GET /campaigns/:id`. Response: `[{ id, title, subtitle, badge, imageUrl, branchIds, brandIds, startsAt, endsAt, termsText }]`. Öne çıkan (hero) kampanyalar için `featured: boolean` ya da `GET /campaigns/featured`.

**Uygulamadaki geçici çözüm:** Kampanyalar sekmesi, Keşfet vitrini, geri sayım şeridi ve kampanya detayı "(Mock)" etiketli sabit veriyle çalışıyor (`src/mocks/home-mocks.ts`).

**Etkilenen ekranlar:** Kampanyalar sekmesi, Kampanya detayı, Keşfet (hero ve vitrin), Fırsatlar sheet'i.

### 11. Kişiselleştirilmiş öneri

**Neden:** "Sana özel restoranlar" için kullanıcıya göre sıralanmış şube listesi yok.

**Önerilen endpoint:** `GET /branches/recommended?lat&lng&limit`. Response: `GET /branches/nearby` ile aynı satır biçimi, kullanıcının geçmiş siparişi ve favorilerine göre sıralı.

**Uygulamadaki geçici çözüm:** Şube kimliğinden türetilmiş sabit bir sıralama ("(Mock)").

**Etkilenen ekranlar:** Keşfet ("Sana özel").

## Hesabım

### 12. Favoriler

**Neden:** Favoriler cihaza bağlı; yeni cihazda, yeniden kurulumda kayboluyor.

**Önerilen endpoint:** `GET /favorites/branches` (şube satırları), `POST /favorites/branches/:id`, `DELETE /favorites/branches/:id`. Idempotent olmalı; `POST` zaten favoriyse `200` döner.

**Uygulamadaki geçici çözüm:** Cihazda `rm_favorites` anahtarıyla saklanıyor.

**Etkilenen ekranlar:** Favorilerim sekmesi, Restoran sayfası, Keşfet kartları.

### 13. Kayıtlı kartlar

**Neden:** Kart saklama için ödeme sağlayıcısı tokenizasyonu ve bir kart listesi endpoint'i yok. Uygulama kart numarasını hiçbir zaman görmemeli ve saklamamalı.

**Önerilen endpoint:** `GET /customer/payment-methods` (`[{ id, brand, last4, expMonth, expYear, isDefault }]`), `POST /customer/payment-methods/setup` (sağlayıcının setup intent / token oturumunu döndürür), `PATCH /customer/payment-methods/:id` (`{ isDefault }`), `DELETE /customer/payment-methods/:id`. Sağlayıcı (Stripe, iyzico, Dojo) şube bazlı olduğundan hesap genelinde saklama için bir sağlayıcı seçimi gerekir.

**Uygulamadaki geçici çözüm:** Hesabım'daki kartlar "(Mock)" etiketli iki örnek kart (yalnızca marka ve son dört hane). Ödeme, her siparişte uygulama içi ödeme formuyla alınıyor.

**Etkilenen ekranlar:** Hesabım → Kartlarım, Ödeme.

### 14. Kupon cüzdanı

**Neden:** Müşterinin sahip olduğu kuponları listeleyen bir endpoint yok; kuponlar yalnızca sepette kod girilince uygulanıyor.

**Önerilen endpoint:** `GET /customer/coupons` → `[{ id, code, kind: 'amount' | 'percent', value, minBasket, brandId?, branchIds?, endsAt, usedAt? }]`. Sepette geçerli kuponları önermek için `GET /cart/coupons/applicable`.

**Uygulamadaki geçici çözüm:** Hesabım ve restoran sayfasındaki kuponlar "(Mock)" etiketli sabit veri (`MOCK_COUPONS`).

**Etkilenen ekranlar:** Hesabım → Kuponlarım, Restoran sayfası (kupon bandı), Fırsatlar sheet'i, Sepet.

### 15. Kredi bakiyesi para birimi

**Neden:** `GET /loyalty/credit/balance` yalnızca `{ balance }` döndürüyor, para birimi yok. Hesap genelindeki kredi, hangi para biriminde olduğu bilinmeden gösterilemez ve hangi markanın para biriminde harcanacağı belirsiz.

**Önerilen endpoint:** Cevaba `currency` (ISO 4217, örn. `TRY`) ekle: `{ "balance": number, "currency": string }`. Birden fazla para birimi varsa `[{ balance, currency, brandId? }]`.

**Uygulamadaki geçici çözüm:** Bakiye yalnızca checkout'ta, sepetin para biriminde harcanabilir tutar olarak kullanılıyor; Hesabım'da para birimi bilinene kadar gösterilmiyor.

**Etkilenen ekranlar:** Checkout (Hesabım'da bakiye, para birimi gelene kadar gösterilmeyecek).

## Siparişler

### 16. Müşteri sipariş durumu akışı ve push

**Neden:** Sipariş takibi için müşteri tarafında canlı durum akışı yok ve durum değişince bildirim gitmiyor.

**Önerilen endpoint:**
- `GET /customer/orders/:id/stream`: Server-Sent Events. Olay: `status` → `{ "orderId", "status", "updatedAt" }`. Bağlantı `Authorization` başlığıyla açılır; sipariş teslim edilince ya da iptalde kapanır.
- `POST /devices`: `{ "expoPushToken": string, "platform": "ios" | "android", "locale": "tr" | "en" }`; `DELETE /devices/:token` çıkışta. Sipariş durumu değişince (kabul, hazırlanıyor, yolda, teslim edildi, iptal) ilgili cihazlara Expo push gönderilir; `orderStatus` bildirim tercihi (istek 5) gözetilir.

**Uygulamadaki geçici çözüm:** Açık sipariş ekranı 5 saniyelik polling ile `GET /orders/customer` listesini yeniliyor. Push yok.

**Etkilenen ekranlar:** Siparişlerim sekmesi, Sipariş detayı.

### 17. Müşteri siparişi iptal edebilsin

**Neden:** Müşteri `PENDING` (henüz kabul edilmemiş) siparişi uygulamadan iptal edemiyor.

**Önerilen endpoint:** `PATCH /customer/orders/:id/cancel` (gövde yok ya da `{ reason? }`) ya da müşteri rolüne `orders:cancel` izni. Yalnızca `PENDING` durumunda izinli; diğer durumlarda `409` ve açıklayıcı hata kodu. Ödeme alınmışsa iade tetiklenmeli.

**Uygulamadaki geçici çözüm:** İptal düğmesi yok; müşteri restoranı aramalı.

**Etkilenen ekranlar:** Sipariş detayı.

## Ortam ve test

### 18. Staging seed: sipariş türü ve ödeme ayarları

**Neden:** Staging şubelerinde `order_type_settings` ve `payment_settings` kapalı, bu yüzden checkout'ta "Bu restoran şu an sipariş almıyor" görünüyor. Uçtan uca (sepet, ödeme, sipariş takibi) test yapılamıyor.

**Önerilen endpoint:** Yok. Staging seed'inde en az bir şube için teslimat/gel-al sipariş türleri ve bir test ödeme sağlayıcısı (örn. Stripe test modu) etkinleştirilsin. Sağlayıcı sırları yalnızca staging'e özel test anahtarları olmalı (bkz. G1).

**Uygulamadaki geçici çözüm:** Checkout kapalı durumu doğru gösteriyor; sipariş verme akışı staging'de uçtan uca denenemiyor.

**Etkilenen ekranlar:** Checkout, Ödeme, Sipariş detayı.

### 19. Brand edge: `api-staging.runmeal.com` müşteri girişini reddediyor

**Neden:** `api-staging.runmeal.com/api` Cloudflare brand edge'ine gidiyor ve `/auth/login` isteğini `BRAND_DOMAIN_NOT_FOUND` ile reddediyor, çünkü portal müşteri uygulaması bir marka alan adı altında çalışmıyor. Portal global bir pazar yeri; markadan bağımsız çağrılır.

**Önerilen endpoint:** Yok; bilgi notu. İsterseniz brand edge'de portal için marka alan adı gerektirmeyen bir istisna ya da ayrı bir host tanımlanabilir.

**Uygulamadaki geçici çözüm:** Uygulama `EXPO_PUBLIC_API_URL` varsayılanı olarak `https://staging-api.runmeal.com` adresini doğrudan kullanıyor (prod: `https://api.runmeal.com`). Global `x-brand-id` başlığı gönderilmiyor; şube kapsamlı çağrılar `branchHeaders()` kullanıyor.

**Etkilenen ekranlar:** Tüm uygulama (giriş dahil).
