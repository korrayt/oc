# teacher.corepack (Template)

Bu klasör, `teacher.corepack` için temel şablondur.

## İçerik

- `manifest.json`
- `system_prompt.md`
- `README.md`

## Paketleme (örnek)

PowerShell ile zip oluşturup uzantıyı `.corepack` yapabilirsiniz:

```powershell
Compress-Archive -Path .\teacher.corepack\* -DestinationPath .\teacher.zip -Force
Rename-Item .\teacher.zip .\teacher.corepack -Force
```

Not: Bu aşamada core-I içinde dosyadan otomatik yükleyici henüz planlı durumdadır.
