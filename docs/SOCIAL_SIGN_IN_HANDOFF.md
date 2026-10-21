# Runmeal Portal uygulaması: Apple ve Google girişi için gerekenler

**Kime:** runmeal-api ekibi ve Google Cloud / Apple Developer hesaplarını yöneten kişi
**Kimden:** runmeal-portal-mobile-app (marketplace müşteri uygulaması)
**Uygulama kimliği:**
- iOS bundle ID: `com.runmeal.portal`
- Android package: `com.runmeal.portal`
- Apple Team: PLUG DIGITAL LTD, `T776LGPKWZ`

Uygulama tarafı hazır: giriş ekranında "Sign in with Apple" (yalnızca iOS) ve "Google ile devam et" var. İkisi de mevcut native uçları kullanıyor:
- `POST /auth/apple/native`
- `POST /auth/google/native`

Aşağıdakiler yapılana kadar butonlar çalışmaz:
- Google butonu "Google girişi hazır değil" uyarısı gösterir.
- Apple girişi backend'den hata alır.

## 1. Google girişi

**Backend kod değişikliği gerekmez.**
- Uygulama, Google SDK'ya API'nin web client'ını (`webClientId`) verir, dolayısıyla token'ın `aud` değeri web client olur.
- `loginWithGoogleNative` zaten `GOOGLE_CLIENT_ID`'yi kabul ediyor (`src/auth/auth.service.ts`, `loginWithGoogleNative`).

Uygulamanın kullandığı web client'lar (proje `709162763845`):

| Ortam | Web client ID |
|---|---|
| Staging | `709162763845-i8m3ql8e9a32kmrntm4gibru2kr6hktm.apps.googleusercontent.com` |
| Production | `709162763845-204l0a59busg4vglg9uv24aphlaq9j7r.apps.googleusercontent.com` |

**Google Cloud Console'da (aynı proje, 709162763845) yapılacaklar:**

1. **iOS OAuth client:** Application type iOS, Bundle ID `com.runmeal.portal`. Oluşan **iOS client ID'yi bize gönderin**. Uygulamaya `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` olarak girilecek; URL scheme bundan türetilir.
2. **Android OAuth client:** Application type Android, package `com.runmeal.portal`. Aşağıdaki SHA-1 parmak izlerinin her biri eklenmeli; gerekirse parmak izi başına ayrı bir Android client açılır.

   | Anahtar | SHA-1 | Ne zaman |
   |---|---|---|
   | Upload key (yerel release build) | `CB:80:9A:C4:D0:B7:22:7B:A1:C1:AC:A7:9E:58:01:58:B7:6F:02:81` | Şimdi |
   | Debug key (geliştirme / test APK) | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` | Şimdi (yalnızca test) |
   | Play App Signing key | Play Console → Test ve yayınla → Uygulama bütünlüğü → Uygulama imzalama | İlk Play yüklemesinden sonra |

   Play'den yüklenen kurulumlar Play'in kendi anahtarıyla imzalanır. Play App Signing SHA-1'i eklenmeden Play kurulumunda Google girişi çalışmaz.

3. **OAuth consent ekranı:** "Production" yayın durumunda olmalı. "Testing" durumunda yalnızca test kullanıcıları giriş yapabilir.

## 2. Apple girişi

**Backend kod değişikliği gerekir.**
- `src/auth/services/apple-sign-in.service.ts` bugün tek bir bundle ID kabul ediyor:
  - `clientId()` (~satır 383), `APPLE_SIGNIN_BUNDLE_ID`'yi kullanıyor.
  - Aynı değer üç yerde geçiyor: identity token'ın `aud` doğrulamasında (~satır 156), authorization code değişiminde (`client_id`, ~satır 104–106) ve token iptalinde (~satır 224–229).
- Staging ve production'da bu değer `uk.dharmacoffee.ios` (Dharma uygulaması). Bu yüzden `com.runmeal.portal`'dan gelen token reddedilir.

**İstenen değişiklik:**
1. Yeni env değişkeni `APPLE_SIGNIN_BUNDLE_IDS`, virgülle ayrılmış: `uk.dharmacoffee.ios,com.runmeal.portal`. Eski `APPLE_SIGNIN_BUNDLE_ID` geriye dönük uyumluluk için okunmaya devam edebilir.
2. Identity token doğrulamasında `aud`, bu listeden biri olmalı.
3. Authorization code değişimi ve hesap silmede Apple token iptali, **token'ın geldiği bundle ID** ile (`client_id` = token'ın `aud` değeri) yapılmalı. Bunun için kullanıcının Apple refresh token'ıyla birlikte hangi bundle ID'den geldiği de saklanmalı.
4. `config-validation.service.ts` (~satır 550) yeni değişkeni zorunlu listeye almalı.

**Apple Developer'da (PLUG DIGITAL LTD, T776LGPKWZ):**
- App ID `com.runmeal.portal`, Sign in with Apple capability açık. İlk Xcode arşivi otomatik imzalama ile bunu oluşturur; Certificates, Identifiers & Profiles'tan kontrol edin.
- Mevcut Sign in with Apple anahtarı (`.p8`, `APPLE_SIGNIN_KEY_ID`) aynı ekipte olduğu için yeni App ID ile de çalışır. Anahtarın "Sign in with Apple" ayarında App ID olarak `com.runmeal.portal` ilişkilendirilmeli.

App Store kuralı 4.8: iOS'ta Google girişi sunuluyorsa Sign in with Apple da sunulmalıdır. Bu yüzden ikisi birlikte açılacak. Production mağaza build'inde (`eas.json` production profili) ikisi de şimdilik kapalı (`EXPO_PUBLIC_SIGN_IN_GOOGLE=0`, `EXPO_PUBLIC_SIGN_IN_APPLE=0`); yukarıdakiler bitince açılacak.

## 3. Yayın için hesap tarafında gerekenler

- **App Store Connect:** `com.runmeal.portal` için yeni uygulama kaydı (isim: "Runmeal", dil Türkçe/İngilizce, SKU örneğin `runmeal-portal`). TestFlight yüklemesi için kaydın var olması gerekir.
- **Google Play Console:** "Runmeal" adlı yeni uygulama, package `com.runmeal.portal`. İlk AAB, Play Console'dan elle **Dahili test** kanalına yüklenir. Play App Signing'e kayıt da o sırada yapılır.

## 4. Mağaza öncesi diğer backend istekleri

Ayrıntılar `docs/BACKEND_REQUESTS.md` dosyasında. Kısaca:
- `DELETE /profile`: uygulama içi hesap silme; App Store kuralı 5.1.1(v), zorunlu.
- **Güvenlik:** `GET /branches/:id`, `parameters.payment_settings.providers` alanını maskelemeden döndürüyor olabilir.
