# core-I Yol Haritası

Bu dosya, `road map1.txt` ve `road map2.txt` içeriklerinin birleştirilmiş, sadeleştirilmiş ve tek kaynak haline getirilmiş sürümüdür.

## 1. Proje Özeti

**Proje adı:** core-I

**Ana amaç:** core-I; Windows masaüstünde çalışan, local-first / offline-first tasarlanmış, Ollama üzerinden yerel LLM kullanan, Tauri + React + TypeScript tabanlı modüler bir Local AI Core uygulamasıdır.

core-I ileride `.corepack` paketleriyle yeni yetenekler, roller, personalar, uzmanlıklar, veri setleri, modeller, iş akışları, araçlar ve arayüz bileşenleri kazanacaktır.

## 2. Hedef Platform ve Teknoloji

**Öncelik:** Windows

**Dağıtım hedefi:** `.exe`, NSIS setup ve MSI installer

**Teknoloji yığını:**

- Tauri
- React
- TypeScript
- Vite
- Rust / Cargo
- Ollama
- localStorage ile geçici yerel hafıza
- İleride SQLite / local database

**Temel komutlar:**

```powershell
npm install
npm run tauri dev
npm run tauri build
```

## 3. Kırmızı Çizgiler

1. Stealth mode eklenmez.
2. Manipüle cevap mantığı eklenmez.
3. Lisans geçersizken sessizce bozuk, eksik, boş veya yanıltıcı cevap üretilmez.
4. Token yoksa veya geçersizse kullanıcıya açıkça `sınırlı mod / lisans geçersiz` gösterilir.
5. Kullanıcı kandırılmaz.
6. Gerçekten çalışmayan özellikler `active` gösterilmez.
7. Henüz geliştirilmemiş özellikler `planned` gösterilir.
8. Mevcut çalışan `App.tsx` / `App.css` davranışı gereksiz yere bozulmaz.
9. Büyük refactor yapılmadan önce v0.1-alpha stabil çalışır hale getirilir.
10. Dosyaların içine shell artığı, heredoc kalıntısı veya terminal komutu koyulmaz.

## 4. Kod ve Dosya Temizliği

`App.tsx` şu import ile başlamalıdır:

```tsx
import { useEffect, useMemo, useState } from "react";
```

`App.css` doğrudan CSS ile başlamalıdır:

```css
* {
  box-sizing: border-box;
}
```

`App.tsx` ve `App.css` içinde terminal kalıntıları, heredoc satırları veya dosya yazma komutları bulunmamalıdır.

Türkçe encoding bozuklukları temizlenmelidir. UI metinleri doğal Türkçe olmalı; açıklamalar eylem kipinde yazılmalıdır:

- `koruma` yerine `koru`
- `yönetme` yerine `yönet`
- `seçme` yerine `seç`
- `kontrol etme` yerine `kontrol et`
- `saklama` yerine `sakla`

## 5. Dil ve Cevap Davranışı

core-I kullanıcının yazdığı dilde cevap vermelidir.

Hedef diller:

- Türkçe
- English
- Español
- Deutsch
- Français

System prompt şu ilkeleri korumalıdır:

- Kullanıcı Türkçe yazarsa doğal Türkçe cevap ver.
- Kullanıcı İngilizce yazarsa doğal İngilizce cevap ver.
- Kullanıcı İspanyolca yazarsa doğal İspanyolca cevap ver.
- Kullanıcı Almanca yazarsa doğal Almanca cevap ver.
- Kullanıcı Fransızca yazarsa doğal Fransızca cevap ver.
- Dilleri rastgele karıştırma.
- Bilmediğin şeyi uydurma.
- İnternet erişimi yoksa bunu açıkça söyle.
- Zararlı veya riskli isteklerde güvenli cevap davranışını koru.

## 6. Windows / Tauri Yapısı

Mevcut klasör tam Tauri projesi değilse, mevcut React / TypeScript frontend korunarak minimal Tauri kabuğu eklenmelidir.

Beklenen yapı:

```text
src-tauri/
  Cargo.toml
  build.rs
  tauri.conf.json
  src/
    main.rs
  icons/
    icon.ico
```

`package.json` scriptleri:

```json
{
  "dev": "vite --host 127.0.0.1",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "tauri": "tauri"
}
```

Gerekli bağımlılıklar:

- `@tauri-apps/cli`
- `@tauri-apps/api`
- `vite`
- `react`
- `react-dom`
- `typescript`

`vite.config.ts` içinde port `1420` kullanılmalıdır.

Tauri config hedefleri:

- `productName`: `core-I`
- `identifier`: `com.corei.app`
- `beforeDevCommand`: `npm run dev`
- `devUrl`: `http://localhost:1420`
- `beforeBuildCommand`: `npm run build`
- `frontendDist`: `../dist`

## 7. Windows Ortam Kontrolleri

Her kurulum veya büyük değişiklik öncesinde kontrol edilecek komutlar:

```powershell
node -v
npm -v
rustc --version
cargo --version
ollama -v
```

Ollama yoksa kullanıcıya açıkça `Ollama for Windows` kurması gerektiği söylenir.

Model yoksa öneriler:

```powershell
ollama pull llama3.2:3b
```

Çok dilli kalite için:

```powershell
ollama pull gemma3:4b
```

## 8. Ollama Entegrasyonu

Ollama model listesi:

```text
http://localhost:11434/api/tags
```

Ollama chat API:

```text
http://localhost:11434/api/chat
```

Chat isteğinde başlangıç ayarları:

```json
{
  "stream": false,
  "options": {
    "temperature": 0.25,
    "top_p": 0.85,
    "repeat_penalty": 1.12
  }
}
```

Davranış:

- Model listesi `/api/tags` üzerinden alınır.
- Kullanıcı model seçebilir.
- Seçilen model `localStorage` içinde saklanır.
- Ollama çalışıyor ama model yoksa kullanıcıya açıkça model indirmesi gerektiği söylenir.
- Uygulama `Ollama bağlantısı yok` ile `model yüklü değil` durumlarını ayırt etmelidir.

## 9. Lisans Mantığı

v0.1-alpha prototipinde `COREI-` ile başlayan token geçerli kabul edilebilir.

Dev token:

```text
COREI-DEV-LOCAL-0001
```

Lisans durumları:

- `missing`
- `valid`
- `invalid`
- `restricted`

Davranış:

- Lisans geçerliyse Chat aktif olur.
- Lisans yoksa veya geçersizse Chat sınırlı modda kalır.
- Kullanıcıya açık uyarı gösterilir.
- EULA, gizlilik bildirimi ve telemetry/audit rızası ayrı gösterilir.
- Telemetry varsayılan olarak zorunlu değildir.
- Offline konuşmalar cihazda kalmalıdır.

Gelecek lisans planı:

```json
{
  "licenseId": "...",
  "holder": "...",
  "tier": "dev|personal|commercial|studio",
  "features": [],
  "expiresAt": "...",
  "signature": "..."
}
```

Gerçek doğrulama Rust/Tauri tarafında yapılmalıdır. Frontend sadece durumu göstermelidir.

## 10. Doğuştan Gelen Core Capability Listesi

Capabilities ekranı 24 core capability göstermelidir.

### Aktif veya Duruma Bağlı Yetenekler

1. **Local Chat**
   Ollama üzerinden yerel LLM ile konuş.
   Durum: Lisans geçerliyse `ready`, değilse `restricted`.

2. **Model Manager**
   Yüklü yerel modelleri listele, seç, kaydet ve aktif modeli yönet.
   Durum: `active`.

3. **Local Memory**
   Sohbet geçmişini cihazda sakla ve sonraki açılışta geri yükle.
   Durum: `active`.

4. **Capability Registry**
   core-I'in aktif, sınırlı, planlanan ve paketlerden gelen yeteneklerini kayıt altında tut.
   Durum: `active`.

5. **License Gate**
   Token yoksa veya geçersizse açıkça sınırlı/deaktive mod göster.
   Durum: Lisans geçerliyse `active`, değilse `restricted`.

6. **Safe Mode**
   Zararlı veya riskli isteklerde güvenli cevap davranışını koru.
   Durum: `active`.

7. **Language Guard**
   Kullanıcının dilini algıla ve aynı dilde temiz cevap ver.
   Durum: `active`.

8. **Offline Status**
   Ollama çalışıyor mu, model hazır mı ve internet gerekmiyor mu kontrol et.
   Durum: Ollama online ise `active`, offline ise `offline`, kontrol edilmediyse `planned`.

### Planlanan Yetenekler

9. **Project Memory**
   Kullanıcının proje notlarını, kararlarını ve devam eden işleri yerelde hatırla.
   Durum: `planned`.

10. **Skill Pack Manager**
    `.corepack` modül, rol, persona, veri seti ve yetenek paketlerini yönet.
    Durum: `planned`.

11. **Local File Reader**
    Kullanıcının seçtiği yerel dosyaları oku ve özetle.
    Durum: `planned`.

    İlk desteklenecek dosya tipleri:
    `.txt`, `.md`, `.json`, `.csv`

    Sonraki sürümlerde:
    `.pdf`, `.docx`, `.xlsx`, `.srt`, `.ass`

    Güvenlik notu: core-I kendiliğinden dosya gezmemeli; sadece kullanıcı dosya seçerse okumalıdır.

12. **Export / Import**
    Sohbetleri, ayarları, hafızayı ve paket listesini dışa/içe aktar.
    Durum: `planned`.

13. **Diagnostics**
    Sistem durumunu kontrol et ve anlaşılır hata raporu üret.
    Durum: `planned`.

    İleride kontrol edeceği başlıklar:
    Node, Tauri, Ollama, Ollama API, model varlığı, lisans durumu, hafıza yazımı, paket sistemi.

14. **Permission Manager**
    Paketlerin hangi izinleri istediğini göster ve yönet.
    Durum: `planned`.

    İleride yönetilecek izin örnekleri:
    `local_files_read`, `local_files_write`, `network_access`, `model_access`, `tool_execution`, `memory_access`, `adult_content`

15. **Tool Runner**
    Güvenli, izinli ve kayıtlı araçları çalıştır.
    Durum: `planned`.

    İleride örnek araçlar:
    denklem çöz, dosya dönüştür, JSON oku, CSV analiz et, metin temizle.

16. **Narrative Studio**
    Kullanıcıdan öğrenerek metin, senaryo ve hikaye üretimini edebi anlatı ile güçlendir.
    Durum: `planned`.

17. **Visual Style Studio**
    Kullanıcının stil tercihlerini öğren ve bu stile göre görsel üretim akışı kur.
    Durum: `planned`.

18. **Video Story Studio**
    Kullanıcının kurgu dili ve sinematografi tercihlerini öğren; video fikir, sahne ve plan akışını üret.
    Durum: `planned`.

19. **Preference Learning Engine**
    Genel trendleri ve geçmiş argümanları analiz et; kullanıcı tercihine göre yanıt üslubunu evrimle.
    Durum: `planned`.

    Not: İnternet erişimi yoksa trend araştırmasını yerel geçmişle sınırla ve bunu açıkça belirt.

20. **Repository Connector**
    GitHub ve GitLab bağlantısı kur; geliştirme için depo dosyalarını seçerek çek ve inceleme akışına dahil et.
    Durum: `ready`.

    Şimdilik yalnızca public raw dosya ön izlemesi sağlar; auth tabanlı tam repo entegrasyonu sonraki aşamadır.

21. **Cloud Provider Models**
    ChatGPT ve Gemini seçeneklerini model sağlayıcısı olarak sun; açık API yapılandırmasıyla isteğe bağlı kullan.
    Durum: `planned`.

22. **Voice Analysis**
    Konuşmayı metne dönüştür, tonlama ve konuşmacı ayrımı gibi ses sinyallerini analiz et.
    Durum: `planned`.

23. **Image Analysis**
    Görselleri analiz et; OCR, sahne/nesne özeti ve içerik bağlamını metinle ilişkilendir.
    Durum: `planned`.

24. **General Awareness Engine**
    Metin, ses ve görüntüden gelen sinyalleri birleştirip genel durum farkındalığı üret.
    Durum: `planned`.

    Not: Offline-first korunur. Dış veri gerektiren durumlarda kısıtı açıkça bildir.

### Multimodal Araştırma Notu

Ses ve görüntü analizi için v0.1-beta/v0.2 hazırlığında şu araştırma başlıkları esas alınır:

1. **Ses Analizi Araştırması**
   - speech-to-text kalitesi (çok dilli)
   - konuşmacı ayrımı (diarization)
   - ton/duygu sinyalleri (prototip düzeyi)

2. **Görüntü Analizi Araştırması**
   - OCR ve belge/grafik okuma
   - sahne/nesne/aksiyon özeti
   - görsel güvenilirlik ve belirsizlik bildirimi

3. **Genel Farkındalık Araştırması**
   - çoklu sinyal birleştirme (text + voice + image)
   - belirsizlik skorlaması ve açık uyarı dili
   - kullanıcı tercihlerine göre açıklama derinliği

## 11. Paket / Modül Kategorileri

Paketler sadece akademik modüllerle sınırlı değildir.

Genel kategori yapısı:

1. **Scientific & Educational Modules**
   Bilim, eğitim, araştırma, ders anlatımı, konu öğretimi ve akademik destek modülleri.

2. **Creative Production Modules**
   Video, görsel, yazı, senaryo, müzik, tasarım, kurgu ve yaratıcı üretim iş akışları.

3. **Personal Development Modules**
   Kişisel gelişim, öğrenme, alışkanlık, motivasyon, koçluk ve günlük gelişim destekleri.

4. **Professional Role Modules**
   Yöneticilik, asistanlık, danışmanlık, planlama, analiz, raporlama ve mesleki roller.

5. **Companion & Social Persona Modules**
   Sohbet arkadaşı, sosyal rol, yaşam asistanı, karakter/persona ve ilişki odaklı modüller.

6. **Lifestyle & Daily Assistant Modules**
   Günlük yaşam, organizasyon, rutinler, eğlence, öneriler ve kişisel yardımcı modülleri.

7. **Relationship & Intimacy Modules**
   Yalnızca yasal sınırlar içinde; uygun yaş, açık rıza ve güvenli kullanım koşullarına bağlı ilişki, yakınlık ve yetişkin odaklı modüller.

8. **Custom Capability Modules**
   core-I mimarisiyle uyumlu herhangi bir yasal yetenek, rol, persona, veri, model veya iş akışı uzantısı.

Paketler şunları ekleyebilir:

- yetenek
- rol
- persona
- uzmanlık
- dataset
- model
- workflow
- araç
- arayüz bileşeni

## 12. Sürüm Yol Haritası

### v0.1-alpha

Amaç: Windows'ta çalışan temel Tauri uygulaması.

Kapsam:

- UI çalışır.
- Lisans ekranı çalışır.
- Dev lisans çalışır.
- Chat sınırlı mod mantığı çalışır.
- Ollama bağlantısı kontrol edilir.
- Yüklü modeller listelenir.
- Model seçilir.
- Seçilen model `localStorage` içinde saklanır.
- Sohbet geçmişi `localStorage` içinde saklanır.
- Ayarlar ekranında `Hafızayı temizle` butonu bulunur.
- Capability Registry 24 core capability gösterir.
- Planlı özellikler `planned` görünür.
- Ayarlar ekranında kullanıcıdan öğrenme, yaratıcı stil öğrenme ve trend farkındalığı prototip kontrolleri bulunur.
- Paketler ekranında hazır core pack profilleri aktif et/kapat prototipi bulunur.
- Aktif pack seçimi `localStorage` içinde saklanır ve chat system prompt davranışını etkiler.
- Paketler ekranında `.corepack` (zip) dosyasını içe aktarma prototipi bulunur.
- İçe aktarılan pack manifest + system prompt bilgisiyle listelenir ve `localStorage` içinde saklanır.
- Modeller ekranında ChatGPT ve Gemini sağlayıcı seçenekleri görünür (v0.1-alpha içinde bağlantı planlıdır).
- Ses/görüntü analizi ve genel farkındalık yetenekleri bu sürümde `planned` görünür.
- Türkçe encoding temizdir.
- Tauri dev ve build komutları Windows'ta çalışır.

### v0.1-beta

Amaç: Kod yapısını temizle ve core-I'i sürdürülebilir hale getir.

Önerilen yapı:

```text
src/
  App.tsx
  data/
    capabilities.ts
    plannedPacks.ts
  core/
    ollamaClient.ts
    licenseManager.ts
    memoryStore.ts
    diagnostics.ts
  components/
    Sidebar.tsx
    ChatPage.tsx
    CapabilitiesPage.tsx
    PacksPage.tsx
    ModelsPage.tsx
    LicensePage.tsx
    SettingsPage.tsx
```

Eklenebilecekler:

- Diagnostics paneli
- Export / Import başlangıcı
- Project Memory başlangıcı
- Local File Reader başlangıcı
- Daha temiz Model Manager
- GitHub/GitLab repo bağlantı başlangıcı
- ChatGPT/Gemini API yapılandırma başlangıcı
- Voice Analysis başlangıcı
- Image Analysis başlangıcı
- General Awareness Engine başlangıcı

### v0.2

Amaç: `.corepack` paket sistemini başlat.

İlk `.corepack` formatı basit zip yapısında olabilir.

Örnek:

```text
teacher.corepack
  manifest.json
  system_prompt.md
  README.md
  assets/
    icon.png
```

`manifest.json` örneği:

```json
{
  "id": "corei.teacher.basic",
  "name": "Basic Teacher",
  "version": "0.1.0",
  "type": "role-pack",
  "description": "core-I'i sade anlatan bir öğretmen rolüne dönüştürür.",
  "entryPrompt": "system_prompt.md",
  "minCoreVersion": "0.1.0",
  "offline": true,
  "permissions": []
}
```

İlk hedef:

- Paket yüklenince aktif system prompt değişsin.

v0.2 kapsamı:

- Dosyadan `.corepack` yükle
- Manifest oku
- Paketleri listele
- Aktif paket seç
- Paket izinlerini göster
- Paket aktifse system prompt'a bağla

İlk gerçek paket önerisi:

- `teacher.corepack`

Hazır şablon konumu:

- `corepack-templates/teacher.corepack/`

Sonraki paket önerileri:

- `scientific.corepack`
- `creative-production.corepack`
- `manager.corepack`
- `japanese-learning.corepack`
- `video-director.corepack`

### v0.3

Amaç: core-I'i gerçek yerel asistan haline getir.

Kapsam:

- SQLite / local DB hafıza
- Project Memory gerçek kayıt sistemi
- Tool Runner başlangıcı
- Permission Manager gerçek kontrol
- GitHub/GitLab'dan dosya ve paket çekme
- Paket güncelleme
- Paket kaldırma
- Paket izin onayı

### v0.4

Amaç: Ürünleşme ve dağıtım.

Kapsam:

- Windows installer
- App icon
- Splash / loading
- Error boundary
- License file import
- Offline license signature verification
- Legal dokümanları uygulama içine bağla
- Settings içinde About / Version ekranı
- GitHub release veya installer çıktısı

### v1.0

Amaç: Kullanıcıya dağıtılabilir core-I ürünü.

Kapsam:

- Offline-first local AI desktop app
- Yerel model yönetimi
- Lisans/token sistemi
- Açık sınırlı mod
- Yerel hafıza
- `.corepack` paket sistemi
- GitHub/GitLab bağlantı katmanı
- ChatGPT/Gemini opsiyonel model köprüsü
- Ses + görüntü analizi katmanı
- Genel farkındalık motoru
- Permission Manager
- Diagnostics
- Export / Import
- İlk resmi paketler
- Windows installer

## 13. Test Senaryosu

Her patch sonrasında şu kontroller yapılmalıdır:

1. `npm install` çalışıyor mu?
2. `npm run build` çalışıyor mu?
3. `npm run tauri dev` çalışıyor mu?
4. Uygulama Windows'ta açılıyor mu?
5. `npm run tauri build` installer üretiyor mu?
6. `App.tsx` içinde bozuk Türkçe encoding kaldı mı?
7. `App.css` içinde shell artığı kaldı mı?
8. Lisans ekranında `Dev lisansı aktif et` çalışıyor mu?
9. Sidebar'da lisans `Geçerli` görünüyor mu?
10. Lisans yokken Chat sınırlı modda mı?
11. Lisans geçerliyken Chat aktif mi?
12. Modeller ekranı Ollama bağlantısını kontrol ediyor mu?
13. Ollama online/offline durumunu doğru gösteriyor mu?
14. Yüklü modeller listeleniyor mu?
15. Model seçilince aktif model değişiyor mu?
16. Seçilen model `localStorage` içinde kalıyor mu?
17. Chat mesaj gönderiyor mu?
18. Model yoksa kullanıcıya açık model indirme önerisi gösteriliyor mu?
19. Uygulama kapanıp açılınca sohbet geçmişi duruyor mu?
20. Ayarlar -> Hafızayı temizle geçmişi siliyor mu?
21. Capabilities ekranında 24 capability görünüyor mu?
22. Gerçekten çalışmayan özellikler `planned` görünüyor mu?
23. Safe Mode, License Gate ve Language Guard doğru görünüyor mu?
24. Kullanıcıdan öğrenme ayarı aç/kapat çalışıyor mu?
25. Öğrenme/trend/stil ayarları yeniden açılışta localStorage'dan geri geliyor mu?
26. Paketler ekranında bir core pack aktif edilince sidebar'da aktif paket değişiyor mu?
27. Uygulama yeniden açıldığında aktif pack seçimi korunuyor mu?
28. `.corepack` içe aktarma sonrası imported pack kartı görünüyor mu?
29. İçe aktarılan pack aktif edilince chat davranışı etkileniyor mu?
30. Geçersiz `.corepack` dosyasında açık hata mesajı gösteriliyor mu?
31. Modeller ekranında sağlayıcı seçeneklerinde `Ollama`, `ChatGPT`, `Gemini` görünüyor mu?
32. `ChatGPT` veya `Gemini` seçildiğinde kullanıcıya bağlantının planlı olduğu açıkça bildiriliyor mu?
33. Voice Analysis capability kartı `planned` görünüyor mu?
34. Image Analysis capability kartı `planned` görünüyor mu?
35. General Awareness Engine capability kartı `planned` görünüyor mu?
36. Depo bağlantısı ekranı GitHub/GitLab public dosya ön izlemesi yapabiliyor mu?
37. Çekilen depo dosyasında açık hata durumları kullanıcıya net gösteriliyor mu?

## 14. Çalışma Tarzı

- Önce mevcut dosya durumunu analiz et.
- Büyük refactor yapmadan önce v0.1-alpha'yı çalıştır.
- Küçük ve çalışan patch'lerle ilerle.
- Gereksiz özellik ekleme.
- Çalışan davranışı bozma.
- Bozuk Türkçe karakterleri temizle.
- `src-tauri` eksikse minimal Tauri kabuğu ekle.
- `package.json` scriptleri doğru değilse düzelt.
- `npm run tauri dev` çalışmadan v0.2 işlerine geçme.
- Her adımda yapılan işi açıkça raporla.
- Hata varsa saklama; açıkça söyle.

## 15. Öncelikli İş Sırası

1. v0.1-alpha mevcut davranışını stabil tut.
2. 24 core capability listesini UI'a ekle.
3. Ollama model yok / bağlantı yok ayrımını netleştir.
4. Gemma veya Llama modeli indirildikten sonra gerçek chat akışını test et.
5. `npm run tauri build` çıktısını düzenli koru.
6. v0.1-beta için dosya yapısını modülerleştirmeye hazırlan.
7. v0.2 için `.corepack` manifest formatını netleştir.
8. GitHub/GitLab bağlantısı için dosya çekme protokolünü netleştir.
9. ChatGPT/Gemini sağlayıcı köprüsü için API yapılandırma sözleşmesini netleştir.
10. Kodlama yetenekleri için ayrı coder model öneri ve GitHub arama akışını netleştir.

## 16. Multimodal Yükseltme Akışı

Görsel üretim ve diğer ileri özellikler tek seferde değil, güvenli bir sırayla açılmalıdır.

1. **Metin çekirdeği sağlamlaştırma**
   - Lisans, local hafıza, paket sistemi ve doğru dil davranışı korunur.

2. **Görsel oluşturma hattı**
   - Kullanıcıdan stil öğrenme
   - Prompt şablonu yönetimi
   - Yerel veya bağlanabilir image provider adapter
   - Yerel görsel önizleme ve kayıt

3. **Ses analizi hattı**
   - Speech-to-text
   - Konuşmacı ve ton notu
   - Güvenli izin akışı

4. **Görüntü analizi hattı**
   - OCR
   - Sahne/nesne özeti
   - Belirsizlik bildirimi

5. **Genel farkındalık motoru**
   - Metin, ses ve görüntü sinyallerini birleştir
   - Belirsizlik skorunu açıkça göster
   - Kullanıcı tercihine göre açıklama derinliğini ayarla

6. **İsteğe bağlı bulut köprüleri**
   - ChatGPT / Gemini gibi dış sağlayıcılar için ayrı adapter
   - Yerel-first davranışı bozma
   - API anahtarını ve izinleri açık yönet

## 17. Hesap ve Oturum Katmanı

core-I'e kullanıcı adı ve şifre ile giriş yapılabilen yerel bir oturum kapısı eklenir.

1. **Yerel kullanıcı hesabı**
   - Kullanıcı adı + şifre ile kayıt ol ve giriş yap.
   - Hesaplar bu cihazda yerel prototip olarak saklanır.

2. **Oturum gate**
   - Uygulama açıldığında aktif oturum yoksa giriş ekranı göster.
   - Oturum açılmadan ana ekranlara girme.

3. **Oturum yönetimi**
   - Çıkış yap, oturumu temizle, yeniden giriş yap.
   - Son aktif kullanıcıyı cihazda hatırla.

4. **Güvenli geçiş**
   - Şifreleri düz metin saklama.
   - Gerçek sürümde Rust/Tauri doğrulaması ve güvenli saklama katmanı kullan.

## 18. Kodlama Yetenekleri ve Coder Model

core-I, kodlama işleri için genel sohbet modelinden ayrı bir model önerme ve GitHub arama akışı sunar.

1. **Ayrı coder model**
   - Kodlama işleri için `qwen2.5-coder`, `deepseek-coder`, `codellama` gibi modeller öner.
   - Kullanıcı isterse coder modelini ana modele geçir.

2. **GitHub kod arama**
   - Tauri, Rust, TypeScript, Ollama, OCR, FFmpeg, Playwright gibi başlıklar için arama sorguları öner.
   - Kullanıcı tek tıkla GitHub repository araması açabilsin.

3. **Yükleme yönlendirmesi**
   - Uygun modeller yoksa kullanıcıya açık `ollama pull` veya ilgili GitHub repo önerisi göster.

## 19. Yetenek Geliştirme ve Özel Başlıklar

1. **Yetenek geliştirme modu**
   - Ayarlardan açılıp kapatılabilen bir mod olsun.
   - Açıkken core-I, Yetenekler ekranındaki başlıklara göre yeni alt-beceri ve paket fikirleri önersin.

2. **Özel yetenek başlığı ekleme**
   - Kullanıcı Yetenekler ekranına kendi başlığını ekleyebilsin.
   - Eklenen başlıklar yerel listede görünür olsun.

3. **Yerel kayıt**
   - Özel yetenekler localStorage ile saklansın.
   - Daha sonra SQLite / local DB katmanına taşınabilecek şekilde yapı korunsun.

4. **Kart menüsü**
   - Her yetenek kartında hamburger menü olsun.
   - Düzenle, uygun hale getir, arşivle ve kaldır eylemleri kart üzerinden yönetilsin.

5. **Geliştir eylemi**
   - Kart içinden internet kaynaklı araştırma paneli aç.
   - GitHub, npm ve doküman aramalarını doğrudan öner.

## 20. Thin Client Mode (Planned)

Amaç: Farklı cihazlarda kurulan core-I istemcileri yeni bagimsiz cekirdek olusturmasin; ana bilgisayardaki Host cekirdegine baglansin.

Temel prensipler:

- Host cihaz `single source of truth` olur.
- Ollama, model, memory, lisans, pack, project memory ve local DB Host cihazda kalir.
- Thin Client cihazlar yalnizca UI olarak calisir.
- Client dogrudan Ollama'ya baglanmaz.
- Dogru akis: `Thin Client UI -> Host API -> Ollama -> Host API -> Thin Client UI`
- Stealth mode yok, manipule cevap yok, acik hata/uyari var.

Admin-only kapsam (simdilik):

- Coklu kullanici plan disi.
- Tek owner/admin ve eslenmis admin cihazlari dusunulur.
- Pairing verileri:
  - `device_id`
  - `device_name`
  - `paired_at`
  - `last_seen_at`
  - `revoked_at`
  - `pairing_token_hash`
- Pairing code sureli olur, duz metin token saklanmaz, hash saklanir.

Senkron kapsami:

- active chat
- chat history
- selected model
- license state
- restricted mode state
- memory state
- capability status
- diagnostics
- share bot sessions

Surum plani:

- **v0.1/v0.2**
  - Standalone Mode korunur.
  - Host/Client mimarisi planlanir.
  - `core_instance_id` ve `device_id` kavramlari dokumante edilir.
- **v0.3**
  - Core Host API plani.
  - Admin-only device pairing plani.
- **v0.4**
  - Thin Client UI.
  - LAN baglanti testi.
  - Host URL + pairing code ekranlari.
- **v0.5**
  - Realtime sync (WebSocket/SSE) arastirmasi.
  - Client diagnostics.
- **v1.0**
  - Stable Standalone + Host + Thin Client mode.

Not: v0.1/v0.2 asamasinda realtime zorunlu degildir; polling veya manuel refresh kullanilabilir.

## 21. Share Bot Link / Guest Conversation Link (Planned)

Amaç: Admin konu/talimat verir, core-I geçici bir konusma linki üretir, linkteki kisi yalnizca belirlenen kapsamda botla konusur, görüsme sonunda admin'e ozet döner.

Kapsam:

- Ozellik adi: `Share Bot Link` / `Guest Conversation Link` / `Delegated Chat Link`
- Guest yalnizca scope dahilinde konusur.
- Guest, admin paneline veya sistem ayarlarina erisemez.
- Konu disi sorular sinirlandirilir.
- Gereksiz kisisel veri toplanmaz.

Share session veri modeli:

- `share_session_id`
- `title`
- `admin_instruction`
- `allowed_scope`
- `public_prompt`
- `status` (`draft | active | completed | expired | revoked`)
- `expires_at`
- `max_messages`
- `created_at`
- `completed_at`
- `revoked_at`
- `summary`
- `transcript`
- `guest_display_name` (optional)

Guvenlik kurallari:

- Guest asla ana hafizayi, eski sohbetleri, model secimini, lisans ekranini, capability/paket yonetimini gormez.
- Session linki sureli olur; admin istedigi an revoke eder.
- Bot admin talimatini ham haliyle acik etmez.
- Bot kullaniciyi kandirmaz, stealth davranis yoktur.

Guest oturumu baslangic dili:

- "Merhaba. Bu kisa gorusme, iletilen konuyu netlestirmek icin olusturuldu. Yalnizca bu konu hakkinda birkac soru soracagim."

Admin ozet formati:

- Gorusulen kisi
- Konu
- Netlesen bilgiler
- Eksik kalan bilgiler
- Riskler / belirsizlikler
- Onerilen sonraki adim
- Kisa ozet
- Tam transcript baglantisi

Public link gercegi:

- v0.1/v0.2/v0.3/v0.4 asamalarinda linkler Local/LAN kapsaminda planlanir.
- Internet uzeri paylasim production degildir.
- Dis paylasim icin ayrica cloud relay / secure tunnel / reverse proxy / domain + HTTPS arastirmasi gerekir.

Surum plani:

- **v0.2**
  - Share session veri modeli.
  - Admin instruction mantigi.
  - Guest scope kurallari.
- **v0.3**
  - Share link mock UI.
  - Conversation summary generator (prototip).
- **v0.4**
  - LAN share link.
  - Expiring link.
  - Revocation.
  - Transcript.
- **v0.5**
  - Secure external sharing research.
  - Cloud relay / tunnel plan.
- **v1.0**
  - Stable delegated guest conversation workflow.

## 22. Host-only Canliya Gecis (In Progress)

Hedef mimari:

- `GitHub Pages` (site)
- `Host PC Ollama` (primary)
- `Host API` (gateway)

Bu iterasyonda eklenenler:

- Host API icinde `v1` endpointleri:
  - `POST /v1/chat`
  - `POST /v1/auth/forgot/start`
  - `POST /v1/auth/forgot/verify`
  - `POST /v1/auth/forgot/issue-temporary-profile`
  - `GET /v1/admin/temporary-changes`
  - `POST /v1/admin/temporary-changes/approve`
- Host API dokumani:
  - `ONLINE_HOST_SETUP.md`
- Host-only operasyon scriptleri:
  - `npm run host:lan:start`
  - `npm run host:lan:stop`
  - `npm run host:tunnel:start`
  - `npm run host:tunnel:stop`
- Self-host gecit sablonlari:
  - `deploy/selfhost/README.md`
  - `deploy/selfhost/caddy/Caddyfile.example`

Durum:

- Auth recovery + temporary profile: **pilot-ready**
- Host-only API gateway: **pilot-ready**
- Public internet acilisi: **planned** (reverse proxy/VPN/ozel sunucu gecidi ile)
