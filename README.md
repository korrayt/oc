# OC

OC is the public name for the OurCore project line: a local-first, offline-first AI core and UI shell.

## What this repo contains

- Vite + React frontend
- Tauri desktop shell
- GitHub Pages deployment
- Site mirror support for `www.koraytasan.com/OC`

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run tauri build
npm run deploy:site
```

## Deployment

- GitHub Pages: run the `build` workflow from `main`
- Desktop releases: run the Tauri release workflow on version tags
- Site mirror: run `npm run deploy:site` to copy `dist/` into the mirror target

### Site mirror target

By default, the mirror target is:

`../koraytasancom/OC`

You can override it with:

```powershell
$env:OURCORE_SITE_ROOT = "E:\CODEX\some-site-root"
npm run deploy:site
```

## Base path

The app is built with a relative public base path so it can work from:

- the GitHub Pages root
- `www.koraytasan.com/OC`

## Brand note

`OC` is the product name. `OurCore` is the explanatory brand phrase used in docs and release metadata.
