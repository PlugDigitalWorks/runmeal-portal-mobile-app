# Backend istekleri

Uygulamanın ana sayfası (Keşfet) bu alanlar için şimdilik "(Mock)" etiketli örnek veri gösterir (`src/mocks/home-mocks.ts`, `EXPO_PUBLIC_SHOW_MOCKS=0` ile kapanır). Task 14 bu listeyi genişletecek.

- **Kampanyalar / öne çıkan vitrini:** aktif kampanyaların listesi (başlık, alt başlık, rozet metni, görsel, hedef restoranlar, geçerlilik tarihi) ve tek kampanya detayı.
- **Puan ve yorum:** şube başına ortalama puan ve puan sayısı (`GET /branches/nearby` satırında).
- **Tahmini teslimat süresi:** şube başına aralık (dk), mümkünse mesafeye ve yoğunluğa göre.
- **Kişiselleştirilmiş öneri:** "Sana özel restoranlar" için kullanıcıya göre sıralı şube listesi.
- **Marka adı ve zincir bilgisi:** `GET /branches/nearby` satırında `brandName` alanı. Şimdi marka adı şube adlarının ortak başlangıcından tahmin ediliyor.
- **Mutfak etiketi:** şube başına mutfak kategorileri. Şimdi mutfak, ad ve menü metnindeki anahtar kelimelerden tahmin ediliyor.
- **Favoriler:** şimdilik yalnızca cihazda saklanıyor (`rm_favorites`).
