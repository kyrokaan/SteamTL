# Steam TL

Steam mağazasındaki USD fiyatlarını yaklaşık TL karşılığıyla gösteren Chrome eklentisi. Manifest V3 kullanır; derleme, abonelik veya API anahtarı gerekmez.

## Kurulum

1. ZIP dosyasını bir klasöre çıkar. Klasörü daha sonra silme veya taşıma.
2. Chrome adres çubuğuna `chrome://extensions` yaz.
3. Sağ üstte **Geliştirici modu** seçeneğini aç.
4. **Paketlenmemiş öğe yükle** düğmesine bas.
5. İçinde `manifest.json` bulunan **steam-tl** klasörünü seç.
6. Açık Steam mağazası sekmesini yenile. Fiyatlar yaklaşık TL olarak görünür.

Chrome'un eklentiler menüsünden Steam TL'yi sabitleyebilirsin. Eklenti düğmesine basarak otomatik/elle kur seçebilir, USD ve TL'yi birlikte gösterebilir veya dönüşümü kapatabilirsin. Ayar değişiklikleri açık mağaza sekmelerine uygulanır. Eklentiyi yeniden yüklediğinde Steam sekmelerini de yenile.

Sağ üstteki **TR / EN** düğmeleriyle Türkçe veya İngilizce seçebilirsin. Dil tercihi hemen kaydedilir; menüler, durum mesajları ve fiyat açıklamaları seçilen dilde gösterilir. Steam sayfasındaki ₺ fiyatlarının sayı biçimi aynı kalır.

Eklenti arayüzü Inter fontunu kullanır. Font dosyası pakete dahildir; internetten font yüklenmez. Font lisansı `fonts/LICENSE.txt` içindedir.

Sağ üstteki güneş/ay düğmesi **açık ve koyu** tema arasında geçiş yapar. Seçimin hemen kaydedilir. Daha önce seçtiğin açık veya koyu tema korunur; önceki sistem seçeneğinin yerine koyu tema kullanılır.

Ayar penceresinde ve araç çubuğunda aynı ana logo kullanılır: açık yeşil zemin üzerinde koyu gri TL harfleri. Logo açık ve koyu temada korunur.

**Kuruşları göster** kapalıysa TL fiyatları en yakın tam liraya yuvarlanır. Bu tercih **Ayarları kaydet** ile uygulanır; asıl USD fiyatı değişmez.

Alttaki **Sıfırla → Onayla** varsayılan ayarları geri getirir. **İptal** mevcut ayarları korur. Son kur kaydı silinmez. Sürüm bilgisi GitHub bağlantısının yanında gösterilir.

Otomatik kur alınamadığında araç çubuğundaki simgede **!** görünür. Başarılı yenilemede, manuel moda geçildiğinde veya TL gösterimi kapatıldığında kaldırılır. Ayrıntı için simgenin üzerine gelebilir veya eklentiyi açabilirsin.

## Kur ve gösterim

- Otomatik kur: [Avrupa Merkez Bankası (ECB)](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) günlük referans verileri. USD/TRY, aynı tarihli EUR/TRY değerinin EUR/USD değerine bölünmesiyle hesaplanır. Anlık piyasa kuru değildir. Kaynak tarihi kur bilgisinin üzerine gelince görünür.
- Otomatik modda tarayıcı açıkken kur arka planda altı saatte bir kontrol edilir; Steam sekmesinin veya eklenti penceresinin açık olması gerekmez. Açık Steam sayfalarına yeni kur otomatik uygulanır. Manuel modda girilen kur korunur ve arka plan kur sorgusu yapılmaz.
- **Kuru yenile** ile hemen sorgulayabilirsin. Chrome tamamen kapalıyken veya bilgisayar uyurken düzenli sorgu yapılmaz. Uyku ve tarayıcı zamanlaması nedeniyle kontrol gecikebilir; Chrome yeniden açılınca eski kur yenilenir. ECB genellikle iş günlerinde günde bir kez veri yayımlar; hafta sonu ve tatillerde son yayımlanan veri kullanılır. Kaynak aynı veriyi döndürürse kur değişmez. Sayfa kaynaklı gecikmeler olabilir; hafta sonu veya tatilde son yayımlanan değer kullanılır. Anlık işlem kuru garantisi yoktur.
- Bağlantı sorunu olduğunda daha önce kaydedilmiş kur kullanılır ve pencerede eski kur uyarısı görünür. Hiç kur yoksa USD fiyatları korunur. Elle kur girmek internet gerektirmez.
- TL tutarı yaklaşık karşılıktır. Örneğin elle 40 TL kur girilirse $19.99 fiyatı ₺799,60 görünür. Birlikte gösterimde fiyat $19.99 (₺799,60) biçimindedir; sonunda USD veya TL etiketi bulunmaz.
- USD asıl fiyatına ulaşmak için fiyatın üzerine gel veya **USD ve TL birlikte** seçeneğini kullan.

## Kapsam

Mağaza, arama sonuçları, indirimli fiyatlar, DLC, desteklenen istek listesi ve sepet fiyat alanları hedeflenir. Sonradan yüklenen fiyatlar da takip edilir. Steam'in yeni tasarımlarında farklı fiyat alanları eklenirse seçicilerin güncellenmesi gerekebilir. USD haricindeki açık para birimi etiketleri dönüştürülmez; tek başına `$` işareti USD kabul edilir. Bu yüzden eklenti Türkiye/MENA USD mağazası içindir; başka dolar para birimlerine sahip bölgelere geçersen kapat.

Sepete ekleme penceresi, sepet ürün fiyatları, eski/indirimli fiyatlar ve tahmini toplam da dönüştürülür. `$` ve tutarın ayrı HTML öğelerinde gösterildiği fiyatlar desteklenir. Eklenti kapatılınca özgün USD metinleri geri yüklenir.

Steam'in masaüstü uygulamasına uygulanmaz. Hesabın para birimini veya Steam'in tahsilatını değiştirmez; Steam ödeme işlemleri USD üzerinden sürer. Banka kuru ve komisyonları nedeniyle ödenecek TL tutarı farklı olabilir.

## Gizlilik ve izinler

Yalnızca `store.steampowered.com` sayfalarının görünür fiyat metinlerine müdahale eder. Kur sorgusu için yalnızca `www.ecb.europa.eu` erişimi vardır. Ayarlar ve son kur Chrome'un yerel eklenti depolamasına kaydedilir. Oyun listesi, Steam hesabı veya sayfa içeriği kur kaynağına gönderilmez. Kaynak XML verisi okunur; içindeki JavaScript çalıştırılmaz. Analitik, reklam veya uzak JavaScript içermez.

Güncellemede tarayıcı yeni ECB erişimi için onay isteyebilir. Eklenti sayfasında bu site erişimine izin ver. Önceki Bloomberg kur kaydı yeni kaynak için kullanılmaz; ilk başarılı ECB sorgusu yeni önbelleği oluşturur. Eski sürüme dönmek için `steam-tl-bloomberg-backup-v1.7.15.zip` paketini kullanabilirsin.

Kaynaklar: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml ve https://developer.chrome.com/docs/extensions/develop/concepts/network-requests

`alarms` izni yalnızca altı saatlik arka plan kur kontrolünü zamanlamak için kullanılır. Zamanlama: https://developer.chrome.com/docs/extensions/reference/api/alarms
