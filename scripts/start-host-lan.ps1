param(
  [int]$Port = 8787,
  [string]$AllowedOrigins = "https://www.koraytasan.com,https://koraytasan.com,http://127.0.0.1:1420,http://localhost:1420"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $repoRoot "data\live"
$logDir = Join-Path $repoRoot "logs\live"
$pidFile = Join-Path $stateDir "host-lan.json"

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$listening = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($listening) {
  Write-Host "Host API zaten acik gorunuyor (port $Port)."
  exit 0
}

$stdout = Join-Path $logDir "host-lan.out.log"
$stderr = Join-Path $logDir "host-lan.err.log"

$cmd = "set COREI_HOST_PORT=$Port&& set COREI_HOST_BIND=0.0.0.0&& set COREI_ALLOWED_ORIGINS=$AllowedOrigins&& npm run host:api"

$process = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", $cmd `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -PassThru

Start-Sleep -Seconds 2

$listening = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $listening) {
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  throw "Host API acilamadi. logs/live/host-lan.err.log dosyasini kontrol et."
}

$state = [ordered]@{
  startedAt = (Get-Date).ToString("o")
  pid = $process.Id
  port = $Port
  bind = "0.0.0.0"
  allowedOrigins = $AllowedOrigins
}

$state | ConvertTo-Json -Depth 4 | Set-Content -Path $pidFile -Encoding UTF8

Write-Host "Host LAN modu basladi."
Write-Host "Yerel: http://127.0.0.1:$Port/health"

$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -ne "127.0.0.1" -and
    $_.IPAddress -notlike "169.254.*"
  } |
  Select-Object -ExpandProperty IPAddress -Unique

foreach ($ip in $ips) {
  Write-Host "LAN: http://$ip`:$Port/health"
}

Write-Host "PID dosyasi: $pidFile"
