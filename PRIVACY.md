# Steam TL Gizlilik Politikası

Son güncelleme: 4 Ekim 2026

Bu metin Steam TL'nin mevcut veri işleme davranışını açıklar.

## Yerel veri işleme

Steam TL, Steam mağazasındaki USD fiyat metinlerini ve üst menüde gösterilen USD cüzdan bakiyesini tarayıcınızda okuyarak yaklaşık TL karşılığını hesaplar. Sayfa değişikliklerini gösterimi güncel tutmak için izler. İşlenen sayfa metinleri ve cüzdan bakiyesi geliştiriciye veya kur sağlayıcısına gönderilmez, yerel depolamaya kaydedilmez. Özgün ve dönüştürülmüş tutar metinleri, gösterimi geri alabilmek için geçici olarak sayfa belleğinde tutulur.

Eklenti, Steam sayfalarındaki giriş alanlarının, parola alanlarının ve düzenlenebilir alanların değerlerini okumaz. Kart bilgilerini toplamak, saklamak veya iletmek için bir özelliği yoktur. Steam hesap kimliği, kimlik doğrulama çerezleri ve gezinme geçmişi eklenti tarafından toplanmaz veya gönderilmez.

## Saklanan bilgiler

Gösterim, dil, tema, kuruş tercihi, manuel kur ve diğer eklenti ayarları; son alınan kur, kaynak tarihi, kontrol zamanı ve son kur sorgusunun hata durumu tarayıcının yerel eklenti depolamasında saklanır. Tarayıcılar arasında eşitleme kullanılmaz. Son başarılı kur, bağlantı sorunu olduğunda kullanılmak üzere korunur ve yeni başarılı sorguda değiştirilir.

“Sıfırla” ayarları varsayılana döndürür; kur önbelleğini silmez. Eklentiyi kaldırmak yerel eklenti kayıtlarını kaldırır.

## Dış bağlantılar

Otomatik modda eklenti, tarayıcı çalışırken yaklaşık altı saatte bir ECB günlük kur dosyasına HTTPS isteği gönderir. Başlangıçta ve “Kuru yenile” düğmesiyle de sorgu yapılabilir. Manuel modda otomatik kur sorgusu yapılmaz.

Bu isteğe Steam fiyatları, hesap bilgileri veya eklenti ayarları eklenmez; kur isteğinde çerez gönderilmez. Bununla birlikte, internet bağlantısının olağan parçası olarak kur sağlayıcısı IP adresinizi ve bağlantı bilgilerini görebilir ve kendi politikalarına göre işleyebilir. Sağlayıcının veri işleme uygulamaları geliştiricinin kontrolünde değildir.

## Veri paylaşımı ve izinler

Eklenti geliştiriciye kullanıcı verisi göndermez; reklam veya analitik sistemi içermez. Kullanıcı verileri satılmaz. Sayfa verileri yalnızca fiyat dönüştürme işlevi için yerel olarak işlenir.

- `storage`: Eklenti ayarları, kur önbelleği ve sorgu durumunu yerel olarak saklar.
- `alarms`: Arka plan kur kontrolünü zamanlar.
- `www.ecb.europa.eu`: Otomatik USD/TRY verisini alır.
- `store.steampowered.com`: Mağaza fiyat metinlerini yerel olarak dönüştürür.

Steam TL'nin kullanıcı verilerini kullanımı Chrome Web Mağazası Kullanıcı Verileri Politikası'nın Sınırlı Kullanım şartlarına uygun olarak fiyat dönüştürme amacıyla sınırlıdır.

## İletişim

Sorular için: https://github.com/kyrokaan/SteamTL/issues

Bu alanda kişisel veya ödeme bilgileri paylaşmayın; GitHub sorun kayıtları herkese açık olabilir.
