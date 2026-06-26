# core-I Online Host Setup (Host-Only)

Bu dokuman, core-I'i host-only mimari ile calistirmak icin guncel akistir.

## 1) Host API (localhost)

`E:\CODEX\core-i-v0.1-alpha-files` icinde:

```powershell
npm run host:api
```

Varsayilan endpointler:
- `http://127.0.0.1:8787/health`
- `http://127.0.0.1:8787/api/contact`
- `http://127.0.0.1:8787/api/chat`
- `http://127.0.0.1:8787/v1/chat`

## 2) LAN modu (ayni agdaki cihazlar)

Host API'yi LAN'a ac:

```powershell
npm run host:lan:start
```

Kapat:

```powershell
npm run host:lan:stop
```

Bu modda script `COREI_HOST_BIND=0.0.0.0` ile calisir ve local IP'leri konsola yazar.

## 3) VPS gateway (opsiyonel)

Model yine host PC'de calisir; VPS sadece gecit gorevi gorur.

1. Host API localde acik olsun (`npm run host:api` veya LAN modu).
2. Reverse tunnel baslat:

```powershell
npm run host:tunnel:start -- -SshUser corei -SshHost your-vps.example.com -RemotePort 18787 -LocalPort 8787
```

3. VPS tarafinda Caddy ile `127.0.0.1:18787` upstream'ini yayinla.  
   Ornek dosya:

`deploy/selfhost/caddy/Caddyfile.example`

4. Tunnel kapat:

```powershell
npm run host:tunnel:stop
```

## 4) `www.koraytasan.com/core` yonlendirmesi

Sitenizde `/core` yolunu `https://core.koraytasan.com` hedefine yonlendirin.

## 5) Iletisim formu -> core-I API

Form submit olayinda `https://coreapi.koraytasan.com/api/contact` (veya sizin gateway URL'iniz) cagrilir.
Ornek kod: `integration/website/contact-corei.js`

Beklenen payload:

```json
{
  "name": "Ad Soyad",
  "email": "mail@ornek.com",
  "phone": "+90...",
  "subject": "Konu",
  "message": "Mesaj",
  "source": "koraytasan-contact"
}
```

## 6) Kayıt ve log dosyalari

Host API konuşma kayıtları:

`E:\CODEX\core-i-v0.1-alpha-files\data\online-host\external-conversations.json`

LAN/tunnel proses kayitlari:

- `E:\CODEX\core-i-v0.1-alpha-files\data\live\`
- `E:\CODEX\core-i-v0.1-alpha-files\logs\live\`

## 7) Guvenlik

- Varsayilan `host:api` localhost bind ile acilir.
- LAN modu bilerek dis arayuze acilir.
- Reverse tunnel loopback remote bind ile acilir (`127.0.0.1`).
- Admin token ve hassas degerleri env olarak yonetin.
