# Steam TL

Steam mağazasındaki USD fiyatlarını ve cüzdan bakiyesini yaklaşık TL karşılığıyla gösterir.

## Kurulum

1. ZIP dosyasını çıkar.
2. Tarayıcının uzantılar sayfasında **Geliştirici modu**nu aç.
3. **Paketlenmemiş öğe yükle** ile içinde `manifest.json` bulunan **steam-tl** klasörünü seç.
4. Açık Steam sayfasını yenile. Eklentiyi yeniden yükledikten sonra da Steam sekmelerini yenile.

Chrome ve Chromium tabanlı tarayıcılar için hazırlanmıştır. Steam masaüstü uygulamasında çalışmaz.

## Ayarlar

- **Otomatik / Manuel:** Günlük referans kurunu veya girdiğin kuru kullanır.
- **TL / USD + TL:** Fiyatların gösterim biçimini seçer.
- **Kuruşları Göster:** Kapalıysa tutarlar en yakın tam liraya yuvarlanır; varsayılan olarak açıktır.
- **TR / EN** ve güneş/ay düğmesi: Dil ve tema tercihini hemen kaydeder.
- **Ayarları Kaydet:** Formdaki diğer değişiklikleri uygular.
- **Sıfırla → Onayla:** Ayarları varsayılana döndürür; kur önbelleğini silmez. **İptal** mevcut ayarları korur.

Sürüm bilgisi pencerenin altındadır. Güncellemelerde kaydedilmiş ayarlar korunur. Inter fontu pakete dahildir; lisansı `fonts/LICENSE.txt` içindedir.

## Kur ve fiyatlar

Otomatik modda tarayıcı açıkken ECB günlük verisi 6 saatte bir kontrol edilir. Steam sekmesinin veya ayar penceresinin açık olması gerekmez. **Kuru Yenile** hemen sorgu yapar. Manuel modda arka plan kur sorgusu yapılmaz.

USD/TRY, aynı tarihli EUR/TRY değerinin EUR/USD değerine bölünmesiyle hesaplanır. Anlık piyasa kuru değildir. Kurun yayın tarihi ve son başarılı kontrol zamanı ayar penceresinde gösterilir. Hafta sonu ve tatillerde son yayımlanan veri kullanılır. Tarayıcı kapalıyken veya bilgisayar uyurken sorgu yapılmaz; zamanlama gecikebilir.

Bağlantı sorunu olduğunda son kayıtlı kur kullanılır ve uyarı gösterilir. Hiç kur yoksa USD fiyatları korunur. Manuel kur internet gerektirmez.

Mağaza, oyun sayfaları, arama, DLC, desteklenen istek listesi ve sepet fiyat alanları dönüştürülür. Sonradan yüklenen fiyatlar takip edilir. USD asıl fiyatını görmek için tutarın üzerine gel. TL gösterimi kapatılınca özgün fiyat metinleri geri yüklenir.

Tek başına `$` işareti USD kabul edilir; diğer dolar para birimlerini kullanan mağaza bölgelerinde dönüşümü kapat. Steam tasarımı değiştiğinde bazı fiyat alanları için uyarlama gerekebilir.

TL fiyatı yaklaşık değerdir. Ödeme USD olarak kalır; banka kuru ve ücretleri farklı olabilir.

## Gizlilik ve izinler

Fiyatlar ve cüzdan bakiyesi yalnızca tarayıcı içinde işlenir; kalıcı olarak saklanmaz veya dışarı gönderilmez. Gösterimi geri almak için özgün fiyat metinleri geçici olarak sayfa belleğinde tutulur. Kart ve parola alanları okunmaz. Analitik ve takip kullanılmaz.

- `storage`: Ayarları, kur önbelleğini ve sorgu durumunu yerel olarak saklar.
- `alarms`: Arka plan kur kontrolünü zamanlar.
- `store.steampowered.com`: Fiyat metinlerini dönüştürür.
- `www.ecb.europa.eu`: Günlük kur XML dosyasını alır. Bu isteğe Steam fiyatları veya hesap bilgileri eklenmez; çerez gönderilmez.

Kaynak ve iletişim: https://github.com/kyrokaan/SteamTL
