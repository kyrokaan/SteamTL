<p align="center">
  <img src="extension/icons/icon128.png" width="80" alt="SteamTL logosu">
</p>

<h1 align="center">SteamTL</h1>
<p align="center">Steam’de USD fiyatlarının TL karşılığı.</p>
<p align="center">
  <a href="https://github.com/kyrokaan/SteamTL/releases/latest">İndir</a> ·
  <a href="PRIVACY.md">Gizlilik</a> ·
  <a href="https://github.com/kyrokaan/SteamTL/issues">Sorun bildir</a>
</p>

Steam mağazasındaki fiyatları ve cüzdan bakiyesini yaklaşık TL karşılığıyla gösteren tarayıcı eklentisi.

- **TL veya USD + TL** fiyat gösterimi.
- **Otomatik veya manuel kur.** ECB’nin günlük kuru, tarayıcı açıkken 6 saatte bir kontrol edilir.
- **Mağaza, oyun sayfaları ve sepet** desteği.
- **Türkçe / İngilizce**, açık / koyu tema ve kuruş gösterimi.
- **Güncellemelerde ayarlar korunur.**

<p align="center">
  <img src="docs/interface.png" width="340" alt="SteamTL Türkçe koyu tema ayar penceresi">
</p>

### Kurulum

1. [Son sürümden](https://github.com/kyrokaan/SteamTL/releases/latest) `steam-tl-v1.8.14.zip` dosyasını indir ve çıkar.
2. Tarayıcının uzantılar sayfasında **Geliştirici modu**nu aç.
3. **Paketlenmemiş öğe yükle** ile `steam-tl` klasörünü seç.
4. Açık Steam sayfasını yenile.

Chrome ve Chromium tabanlı tarayıcılar için hazırlanmıştır. Mağazaya yükleme paketi: `steam-tl-store-v1.8.14.zip`.

### Gizlilik

Fiyatlar ve cüzdan bakiyesi saklanmaz veya dışarı gönderilmez. Kart ve parola alanları okunmaz. Ayarlar ve kur bilgisi yalnızca tarayıcıda saklanır. [Gizlilik açıklaması →](PRIVACY.md)

TL fiyatı yaklaşık değerdir. Ödeme USD olarak kalır; banka kuru farklı olabilir. SteamTL, Valve veya Steam ile bağlantılı değildir.

### Testler

Node.js 22 veya üzeriyle:

```sh
npm ci
npx playwright install chromium
npm test
```

Fiyat ayrıştırma, kur hesaplama, ayarlar, arayüz ve sepet dönüşümleri test edilir. GitHub Actions her değişiklikte testleri çalıştırır.
