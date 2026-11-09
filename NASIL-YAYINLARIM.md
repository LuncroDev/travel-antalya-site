# Travel Antalya yayınlama ve güncelleme

Site artık Eleventy ile derlenir. Eski “kurulum veya build gerektirmez” talimatı geçerli değildir.

1. Node.js 20 veya üzerini kullanın.
2. `npm ci` çalıştırın.
3. `npm run validate` ile veri, derleme, bağlantı, SEO ve sitemap kontrollerini çalıştırın.
4. Tarayıcı testi için `npx playwright install --with-deps chromium` ve `npm run test:e2e` kullanın.
5. Netlify'da build komutu `npm run build`, publish directory `_site` olmalıdır.
6. Üretime geçiş için geliştirme dalını inceleyin. Ana dala birleştirme veya canlıya dağıtım bu çalışmanın parçası olarak yapılmamıştır.

## İçerik güncelliği

Otel ve etkinlik kayıtlarında kaynak bağlantısı ile gerçek kontrol tarihi bulunur. Tarihin geçmesi etkinliği otomatik arşiv durumuna geçirir; bu, yeni etkinliklerin internetten otomatik çekildiği anlamına gelmez. `npm run content:audit` eski kontrol tarihlerini raporlar.

Yeni etkinlik eklerken tam yılı/tarihi doğrulamadan “Dates verified” alanını açmayın. Otelin adı değişse bile yayınlanmış `slug` değerini koruyun. Canlı fiyat, müsaitlik ve daha geniş envanter için izinli bir veri sağlayıcı entegrasyonu gerekir.

Detaylı teknik ve editoryal açıklamalar README.md dosyasındadır.
