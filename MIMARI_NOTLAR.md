# core-I Mimari Notlar (Host + Thin Client + Share Link)

Bu dokuman, mevcut v0.1-alpha calisan yapisini bozmadan gelecekteki iki mimari ozelligi planlamak icin hazirlanmistir.

Planned ve aktif ayrimi:

- Bu dosyadaki ozellikler `planned` kapsamdadir.
- v0.1-alpha icinde tam kod uygulamasi zorunlu degildir.
- Calismayan ozellikler UI'da `active` gosterilmez.

## 1) Thin Client Mode (Planned)

Amac:

- Baska cihazlarda kurulan core-I exe'leri yeni cekirdek olusturmasin.
- Ana bilgisayar `Host` olarak calissin.
- Diger cihazlar `Thin Client` olarak yalnizca arayuz acsin.

### Host sorumluluklari

- Ollama runtime
- Local model havuzu
- License state ve restricted mode karari
- Chat memory / project memory / capability state
- Pack state
- Local database
- Host API

### Thin Client sorumluluklari

- Yalnizca UI
- Mesaji Host API'ye iletme
- Host yanitini gosterme
- Gecici cache (opsiyonel)

### Dogru veri akisi

`Thin Client UI -> Host API -> Ollama -> Host API -> Thin Client UI`

### Yasak akisi

`Thin Client UI -> Ollama (direct)`

Neden yasak:

- Lisans gate atlanir.
- Memory/policy/safety katmani bypass olur.
- Yetki denetimi dagilir.

## 2) Senkron modeli (Planned)

Host `single source of truth` olarak kalir.

Client'in Host'tan alacagi state:

- active chat
- chat history
- selected model
- license state
- restricted mode state
- memory state
- capability status
- diagnostics
- share sessions

Fazlandirma:

- v0.1/v0.2: polling veya manual refresh yeterli
- v0.5+: WebSocket/SSE ile realtime sync

## 3) Admin-only cihaz modeli (Simdilik)

Kapsam:

- Coklu kullanici ve rol matrisi simdilik yok.
- Yalnizca owner/admin ve eslenmis admin cihazlari.

Device kayit modeli (planned):

- `device_id`
- `device_name`
- `paired_at`
- `last_seen_at`
- `revoked_at`
- `pairing_token_hash`

Pairing akisi:

1. Host cihaz pairing code uretir.
2. Thin Client Host URL/IP + pairing code girer.
3. Host onaylar.
4. Eslesme tamamlanmadan erisim verilmez.

Guvenlik:

- Pairing code sureli olmalidir.
- Duz metin token saklanmaz.
- Hash saklanir.
- Basarisiz baglantida acik hata verilir.
- Stealth mode yok.
- Kullanici kandirilmaz.

## 4) Share Bot Link / Guest Conversation Link (Planned)

Amac:

- Admin bir konu/talimat verir.
- core-I gecici bir konusma linki olusturur.
- Linki acan kisi yalnizca o konu kapsaminda botla konusur.
- Oturum bitince admin'e ozet rapor doner.

Share session modeli:

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

Guest kisiti:

- Admin paneline erisemez.
- Ana hafizayi gormez.
- Eski sohbetleri gormez.
- Model secemez.
- Lisans ekranina erisemez.
- Capability/pack ayarlarini degistiremez.
- Sistem dosyalarina erisemez.

Bot davranisi:

- Konu disina tasmaz.
- Gereksiz kisisel veri istemez.
- Kullaniciyi kandirmaz.
- Gorusme sonunda tesekkur eder.
- Admin'e ozet hazirlanacagini belirtir.

Admin ozet formati:

- Gorusulen kisi
- Konu
- Netlesen bilgiler
- Eksik kalan bilgiler
- Riskler / belirsizlikler
- Onerilen sonraki adim
- Kisa ozet
- Tam transcript baglantisi

## 5) Public link gercegi

Local/LAN plan:

- `http://host-ip:8787/share/s/{session}`

Onemli not:

- Internet'e acik paylasim v0.1/v0.2 kapsaminda production degildir.
- Dis paylasim icin sonraki asamada:
  - secure tunnel
  - cloud relay
  - reverse proxy
  - domain + HTTPS

## 6) Versiyon bazli kapsama notu

- v0.1/v0.2: Standalone mode korunur, mimari plan netlesir.
- v0.3: Host API ve share session mock.
- v0.4: LAN thin client + LAN share link.
- v0.5: realtime sync + external sharing arastirmasi.
- v1.0: stable standalone + host + thin client + delegated guest workflow.

## 7) Host-only Canli Katman (Aktif)

Canli katmanda su yol izlenir:

`Client UI -> Host API -> Ollama`

Notlar:
- Host primary davranisi korunur.
- Calismayan parca active etiketlenmez.
- Harici cloud gateway bu kapsamdan cikarilmistir.

Operasyon akisi:
- Lokal host: `npm run host:api`
- LAN host: `npm run host:lan:start` / `npm run host:lan:stop`
- VPS reverse tunnel: `npm run host:tunnel:start` / `npm run host:tunnel:stop`
