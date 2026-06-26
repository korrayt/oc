Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $repoRoot "data\live\reverse-tunnel.json"

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
  Write-Host "Reverse tunnel durduruldu (PID $processId)."
} else {
  Write-Host "Reverse tunnel zaten kapali (PID $processId)."
}

Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "Reverse tunnel kapatildi."
