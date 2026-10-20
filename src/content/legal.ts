/**
 * The privacy policy and terms of use, shown inside the app so nobody is sent out to a browser.
 * Adapted from the Runmeal brand app's text for the marketplace: Runmeal passes orders to the
 * restaurants it lists. Keep both languages in step when one changes.
 */

/** A paragraph, or a bulleted list when it is an array. */
export type LegalBlock = string | string[];

export type LegalSection = { heading: string; body: LegalBlock[] };

export type LegalDocument = { title: string; updated: string; intro: LegalBlock[]; sections: LegalSection[] };

export type LegalPage = 'privacy' | 'terms';
export type LegalLanguage = 'tr' | 'en';

/** The company behind Runmeal, as registered at Companies House (12458401). */
export const LEGAL_ENTITY = {
  name: 'PLUG DIGITAL LTD',
  number: '12458401',
  address: '60 Tottenham Court Road, Suite 2517a, Fitzrovia, London W1T 2EW, United Kingdom',
  email: 'info@plugdigital.co.uk',
} as const;

const { name: COMPANY, number: COMPANY_NUMBER, address: ADDRESS, email: EMAIL } = LEGAL_ENTITY;

const EN: Record<LegalPage, LegalDocument> = {
  privacy: {
    title: 'Privacy policy',
    updated: '21 October 2026',
    intro: [
      `This policy explains how your personal data is used when you order from restaurants through the Runmeal app. Runmeal is run by ${COMPANY} (company number ${COMPANY_NUMBER}), which is the data controller. The restaurant you order from receives the details it needs to prepare and hand over your order.`,
    ],
    sections: [
      { heading: 'Who we are', body: [`${COMPANY}, ${ADDRESS}. Email: ${EMAIL}.`] },
      {
        heading: 'What we collect',
        body: [
          [
            'Account details: your name, email address and, if you set one, a password (stored only as a secure hash). If you sign in with Apple or Google, we receive your name, email address and an account identifier from them.',
            'Contact and delivery details: phone number and the delivery addresses you save, including their map position.',
            'Orders: what you order, from which restaurant, when, the delivery or collection time, your notes, prices and payment status.',
            'Loyalty: your stamps, rewards and Runmeal credit.',
            'Technical data: a device identifier, sign-in session records, IP address, app version, and error reports.',
          ],
          'We do not see or store your full card number. Card payments are handled by our payment providers.',
        ],
      },
      {
        heading: 'Location',
        body: [
          "If you allow it, your phone's location is used on your device to list the nearest restaurants first and to fill in a delivery address. We store a location only when you save it as part of an address. You can turn the permission off in your phone's settings.",
        ],
      },
      {
        heading: 'Why we use it',
        body: [
          [
            'To create and run your account and keep you signed in (performing our contract with you).',
            'To take, prepare, deliver and take payment for your orders, and to send you order updates (contract).',
            'To run the loyalty schemes you join (contract).',
            'To keep the service secure, prevent fraud and abuse, and fix problems (our legitimate interests).',
            'To keep order and payment records as tax and accounting law requires (legal obligation).',
            'To use your location, only with your permission (consent), which you can withdraw at any time.',
          ],
          'We do not sell your data, and we do not use it for advertising or track you across other apps and websites.',
        ],
      },
      {
        heading: 'Who we share it with',
        body: [
          [
            'The restaurants you order from, and their staff, to prepare and hand over your order and run their loyalty schemes.',
            'Payment providers, to take card payments.',
            'Apple and Google, when you sign in with them.',
            'Service providers that host and run the service for us: cloud hosting, email delivery, error monitoring and bot protection (Google reCAPTCHA).',
            'Authorities, when the law requires it.',
          ],
          'Some of these providers process data outside the United Kingdom. Where they do, the transfer is protected by an adequacy decision or the UK International Data Transfer Agreement or Addendum.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep your account data until you delete your account. Order and payment records are kept for six years, as UK tax law requires, without your name and contact details once your account is deleted. Security logs are kept for a short time, usually no longer than 12 months.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Under UK data protection law you can ask for a copy of your data, ask us to correct or delete it, object to or restrict how we use it, and ask for it in a portable format. You can delete your account at any time from My account, Security. To use any other right, email us.',
          "If you are unhappy with how we handle your data, you can complain to the Information Commissioner's Office (ico.org.uk). We would like the chance to help first.",
        ],
      },
      { heading: 'Children', body: ['The service is not meant for children under 13, and we do not knowingly collect their data.'] },
      {
        heading: 'Changes',
        body: ['If we change this policy, we will update the date above and, for significant changes, let you know in the app or by email.'],
      },
      { heading: 'Contact', body: [`${COMPANY}, ${ADDRESS}. Email: ${EMAIL}.`] },
    ],
  },
  terms: {
    title: 'Terms of use',
    updated: '21 October 2026',
    intro: [
      `These terms apply when you use the Runmeal app to order from restaurants. Runmeal is provided by ${COMPANY} (company number ${COMPANY_NUMBER}). The food is prepared and sold by the restaurant you choose. By using the service you agree to these terms.`,
    ],
    sections: [
      {
        heading: 'Your account',
        body: [
          'You need an account to order. Keep your sign-in details to yourself; you are responsible for orders placed from your account. You can delete your account at any time from My account, Security.',
        ],
      },
      {
        heading: 'Orders',
        body: [
          'When you place an order, you make an offer to buy from the restaurant. The order is accepted when the restaurant confirms it. Menus, prices, opening hours and availability are set by the restaurant and can change; the price shown at checkout is the price you pay.',
          'If the restaurant cannot fulfil your order, it may cancel it, and any payment taken for it will be refunded.',
        ],
      },
      {
        heading: 'Allergies and dietary needs',
        body: [
          'Product descriptions may not list every ingredient or allergen. If you have an allergy or dietary need, speak to the restaurant before you order.',
        ],
      },
      {
        heading: 'Payment',
        body: [
          'Card payments are taken securely by our payment providers when you order. Where the restaurant offers it, you can pay on delivery or collection instead. Runmeal credit is taken off the total at checkout.',
        ],
      },
      {
        heading: 'Cancellations, refunds and complaints',
        body: [
          'Food and drink made to order cannot be returned once it is being prepared. If something is wrong with your order, tell the restaurant straight away. Refunds are decided by the restaurant. This does not affect your statutory rights.',
        ],
      },
      {
        heading: 'Loyalty and credit',
        body: [
          'Restaurants set the rules of their loyalty schemes, including how stamps are earned and when rewards expire, and may change or end them. Stamps, rewards and credit have no cash value, cannot be transferred, and are lost if you delete your account.',
        ],
      },
      {
        heading: 'Fair use',
        body: ['Do not misuse the service: no fraudulent orders, no attempts to break into or disrupt it, and no automated access. We may suspend accounts that do.'],
      },
      {
        heading: 'Liability',
        body: [
          'We work to keep the service available and accurate, but cannot promise it will always be uninterrupted or error-free. Nothing in these terms limits liability that cannot be limited by law, including for death or personal injury caused by negligence.',
        ],
      },
      {
        heading: 'Changes and law',
        body: [
          'We may update these terms; the date above shows the latest version. These terms are governed by the law of England and Wales, and its courts have jurisdiction. If you live elsewhere in the UK, you can also bring a claim in your local courts.',
        ],
      },
      {
        heading: 'Contact',
        body: [`${COMPANY}, ${ADDRESS}. Email: ${EMAIL}. Your personal data is handled as set out in our privacy policy.`],
      },
    ],
  },
};

const TR: Record<LegalPage, LegalDocument> = {
  privacy: {
    title: 'Gizlilik politikası',
    updated: '21 Ekim 2026',
    intro: [
      `Bu politika, Runmeal uygulamasıyla restoranlardan sipariş verdiğinde kişisel verilerinin nasıl kullanıldığını açıklar. Runmeal'ı veri sorumlusu olan ${COMPANY} (şirket numarası ${COMPANY_NUMBER}) işletir. Sipariş verdiğin restoran, siparişini hazırlamak ve teslim etmek için gereken bilgileri alır.`,
    ],
    sections: [
      { heading: 'Biz kimiz', body: [`${COMPANY}, ${ADDRESS}. E-posta: ${EMAIL}.`] },
      {
        heading: 'Neleri topluyoruz',
        body: [
          [
            'Hesap bilgileri: adın, e-posta adresin ve belirlediysen şifren (yalnızca güvenli bir özet olarak saklanır). Apple veya Google ile giriş yaparsan onlardan adını, e-posta adresini ve bir hesap kimliği alırız.',
            'İletişim ve teslimat bilgileri: telefon numaran ve kaydettiğin teslimat adresleri, harita konumlarıyla birlikte.',
            'Siparişler: ne sipariş ettiğin, hangi restorandan, ne zaman, teslimat veya gel-al saati, notların, fiyatlar ve ödeme durumu.',
            'Sadakat: damgaların, ödüllerin ve Runmeal kredin.',
            'Teknik veriler: cihaz kimliği, oturum kayıtları, IP adresi, uygulama sürümü ve hata raporları.',
          ],
          'Kart numaranın tamamını görmez ve saklamayız. Kartlı ödemeleri ödeme sağlayıcılarımız alır.',
        ],
      },
      {
        heading: 'Konum',
        body: [
          'İzin verirsen telefonunun konumu, en yakın restoranları öne çıkarmak ve teslimat adresini doldurmak için cihazında kullanılır. Konumu yalnızca bir adresin parçası olarak kaydettiğinde saklarız. İzni telefonunun ayarlarından kapatabilirsin.',
        ],
      },
      {
        heading: 'Neden kullanıyoruz',
        body: [
          [
            'Hesabını oluşturmak, işletmek ve oturumunu açık tutmak için (seninle yaptığımız sözleşmenin gereği).',
            'Siparişlerini almak, hazırlatmak, teslim etmek, ödemesini almak ve sana sipariş bildirimleri göndermek için (sözleşme).',
            'Katıldığın sadakat programlarını yürütmek için (sözleşme).',
            'Hizmeti güvende tutmak, dolandırıcılığı ve kötüye kullanımı önlemek, sorunları gidermek için (meşru menfaatimiz).',
            'Vergi ve muhasebe mevzuatının istediği sipariş ve ödeme kayıtlarını tutmak için (yasal yükümlülük).',
            'Konumunu, yalnızca izninle kullanmak için (açık rıza); izni istediğin zaman geri alabilirsin.',
          ],
          'Verilerini satmayız; reklam için kullanmaz, diğer uygulama ve sitelerde seni izlemeyiz.',
        ],
      },
      {
        heading: 'Kimlerle paylaşıyoruz',
        body: [
          [
            'Sipariş verdiğin restoranlar ve çalışanları: siparişini hazırlayıp teslim etmek ve sadakat programlarını yürütmek için.',
            'Ödeme sağlayıcıları: kartlı ödemeleri almak için.',
            'Apple ve Google: onlarla giriş yaptığında.',
            'Hizmeti bizim için barındıran ve işleten sağlayıcılar: bulut barındırma, e-posta gönderimi, hata izleme ve bot koruması (Google reCAPTCHA).',
            'Yasanın gerektirdiği hallerde yetkili makamlar.',
          ],
          'Bu sağlayıcıların bir kısmı veriyi Birleşik Krallık dışında işler. Bu durumda aktarım, yeterlilik kararı veya Birleşik Krallık Uluslararası Veri Aktarım Sözleşmesi ya da Eki ile korunur.',
        ],
      },
      {
        heading: 'Ne kadar saklıyoruz',
        body: [
          'Hesap verilerini, hesabını silene kadar saklarız. Sipariş ve ödeme kayıtları, Birleşik Krallık vergi mevzuatının istediği gibi altı yıl tutulur; hesabın silindiğinde adın ve iletişim bilgilerin olmadan. Güvenlik kayıtları kısa süre, genellikle en fazla 12 ay tutulur.',
        ],
      },
      {
        heading: 'Hakların',
        body: [
          'Birleşik Krallık veri koruma mevzuatı uyarınca verilerinin bir kopyasını isteyebilir, düzeltmemizi veya silmemizi isteyebilir, kullanımına itiraz edebilir veya sınırlandırabilir, taşınabilir biçimde talep edebilirsin. Hesabını istediğin zaman Hesabım, Güvenlik bölümünden silebilirsin. Diğer haklar için bize e-posta gönder.',
          "Verilerini nasıl işlediğimizden memnun değilsen Information Commissioner's Office'e (ico.org.uk) şikayet edebilirsin. Önce yardım etmemize izin vermeni isteriz.",
        ],
      },
      { heading: 'Çocuklar', body: ['Hizmet 13 yaşından küçük çocuklara yönelik değildir; onların verilerini bilerek toplamayız.'] },
      {
        heading: 'Değişiklikler',
        body: ['Bu politikayı değiştirirsek yukarıdaki tarihi güncelleriz; önemli değişiklikleri uygulamada veya e-postayla bildiririz.'],
      },
      { heading: 'İletişim', body: [`${COMPANY}, ${ADDRESS}. E-posta: ${EMAIL}.`] },
    ],
  },
  terms: {
    title: 'Kullanım koşulları',
    updated: '21 Ekim 2026',
    intro: [
      `Bu koşullar, Runmeal uygulamasıyla restoranlardan sipariş verirken geçerlidir. Runmeal'ı ${COMPANY} (şirket numarası ${COMPANY_NUMBER}) sunar. Yemekleri seçtiğin restoran hazırlar ve satar. Hizmeti kullanarak bu koşulları kabul etmiş olursun.`,
    ],
    sections: [
      {
        heading: 'Hesabın',
        body: [
          'Sipariş vermek için hesap gerekir. Giriş bilgilerini kimseyle paylaşma; hesabından verilen siparişlerden sen sorumlusun. Hesabını istediğin zaman Hesabım, Güvenlik bölümünden silebilirsin.',
        ],
      },
      {
        heading: 'Siparişler',
        body: [
          'Sipariş verdiğinde restorandan satın almak için bir teklif yapmış olursun. Sipariş, restoran onayladığında kabul edilir. Menüler, fiyatlar, çalışma saatleri ve stok durumu restoran tarafından belirlenir ve değişebilir; ödeme adımında gördüğün fiyat ödeyeceğin fiyattır.',
          'Restoran siparişini karşılayamazsa iptal edebilir; bunun için alınan ödeme iade edilir.',
        ],
      },
      {
        heading: 'Alerji ve beslenme ihtiyaçları',
        body: [
          'Ürün açıklamaları her içeriği veya alerjeni göstermeyebilir. Alerjin veya beslenme ihtiyacın varsa sipariş vermeden önce restoranla konuş.',
        ],
      },
      {
        heading: 'Ödeme',
        body: [
          'Kartlı ödemeler sipariş verirken ödeme sağlayıcılarımız tarafından güvenle alınır. Restoran sunuyorsa kapıda veya teslim alırken de ödeyebilirsin. Runmeal kredisi, ödeme adımında toplamdan düşülür.',
        ],
      },
      {
        heading: 'İptal, iade ve şikayetler',
        body: [
          'Sipariş üzerine hazırlanan yiyecek ve içecekler hazırlanmaya başladıktan sonra iade edilemez. Siparişinde bir sorun varsa hemen restorana bildir. İadelere restoran karar verir. Bu, yasal haklarını etkilemez.',
        ],
      },
      {
        heading: 'Sadakat ve kredi',
        body: [
          'Sadakat programlarının kurallarını, damgaların nasıl kazanıldığını ve ödüllerin ne zaman sona erdiğini restoranlar belirler; bunları değiştirebilir veya sonlandırabilirler. Damgaların, ödüllerin ve kredinin nakit değeri yoktur, devredilemez ve hesabını silersen kaybolur.',
        ],
      },
      {
        heading: 'Adil kullanım',
        body: ['Hizmeti kötüye kullanma: sahte sipariş, sisteme girme veya aksatma girişimi ve otomatik erişim yok. Bunları yapan hesapları askıya alabiliriz.'],
      },
      {
        heading: 'Sorumluluk',
        body: [
          'Hizmeti erişilebilir ve doğru tutmaya çalışırız ancak kesintisiz veya hatasız olacağını vaat edemeyiz. Bu koşullardaki hiçbir şey, ihmalin yol açtığı ölüm veya yaralanma dahil, yasayla sınırlanamayan sorumluluğu sınırlamaz.',
        ],
      },
      {
        heading: 'Değişiklikler ve uygulanacak hukuk',
        body: [
          'Bu koşulları güncelleyebiliriz; yukarıdaki tarih son sürümü gösterir. Bu koşullar İngiltere ve Galler hukukuna tabidir ve mahkemeleri yetkilidir. Birleşik Krallık içinde başka bir yerde yaşıyorsan yerel mahkemelerde de dava açabilirsin.',
        ],
      },
      {
        heading: 'İletişim',
        body: [`${COMPANY}, ${ADDRESS}. E-posta: ${EMAIL}. Kişisel verilerin gizlilik politikamızda anlatıldığı gibi işlenir.`],
      },
    ],
  },
};

/** The document in the app's language. */
export function legalDocument(page: LegalPage, lang: LegalLanguage): LegalDocument {
  return (lang === 'tr' ? TR : EN)[page];
}
