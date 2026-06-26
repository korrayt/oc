Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $repoRoot "data\live\host-lan.json"

if (-not (Test-Path $pidFile)) {
  Write-Host "PID dosyasi bulunamadi: $pidFile"
  exit 0
}

$raw = Get-Content $pidFile -Raw
if (-not $raw.Trim()) {
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  Write-Host "PID dosyasi bostu, temizlendi."
  exit 0
}

$state = $raw | ConvertFrom-Json
$processId = [int]$state.pid

$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $processId -Force
  Write-Host "Host LAN sureci durduruldu (PID $processId)."
} else {
  Write-Host "Surec zaten kapali (PID $processId)."
}

Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "Host LAN modu kapatildi."
