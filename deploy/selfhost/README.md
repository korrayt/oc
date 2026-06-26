# core-I Self-Host (Host-Only)

Bu klasor, core-I'i dis erisime hazirlamak icin host-only alternatiflerini verir.

## Mod A: Yerel / LAN (hizli baslangic)

Host API'yi yerel aga ac:

```powershell
npm run host:lan:start
```

Kapat:

```powershell
npm run host:lan:stop
```

Not:
- Bu mod ayni agdaki cihazlar icindir.
- Public internet acilisi yoktur.

## Mod B: VPS gateway + reverse SSH tunnel

Bu modda model yine host PC'de calisir; VPS sadece gecit olur.

1) Host API'yi lokalde ac:

```powershell
npm run host:api
```

2) Host'tan VPS'e reverse tunnel ac:

```powershell
npm run host:tunnel:start -- -SshUser corei -SshHost your-vps.example.com -RemotePort 18787 -LocalPort 8787
```

3) VPS tarafinda Caddy ile `127.0.0.1:18787` upstream'e proxy et.
Ornek: `deploy/selfhost/caddy/Caddyfile.example`

4) Tunneli kapat:

```powershell
npm run host:tunnel:stop
```

## DNS / Domain notu

- `core.koraytasan.com` -> VPS IP (A/AAAA)
- `www.koraytasan.com/core` -> `https://core.koraytasan.com` redirect

## Guvenlik notlari

- Reverse tunnel yalnizca loopback remote bind (`127.0.0.1`) ile acilir.
- Admin token ve kritik anahtarlar ortama (env) konur; repoya yazilmaz.
- Lisans gecersiz durumda acik sinirli mod korunur.
