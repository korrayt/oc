param(
  [Parameter(Mandatory = $true)][string]$SshUser,
  [Parameter(Mandatory = $true)][string]$SshHost,
  [int]$SshPort = 22,
  [int]$RemotePort = 18787,
  [int]$LocalPort = 8787,
  [string]$IdentityFile = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $repoRoot "data\live"
$logDir = Join-Path $repoRoot "logs\live"
$pidFile = Join-Path $stateDir "reverse-tunnel.json"

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$sshPath = (Get-Command ssh -ErrorAction SilentlyContinue)?.Path
if (-not $sshPath) {
  throw "ssh komutu bulunamadi. Windows OpenSSH Client kurulu olmali."
}

$stdout = Join-Path $logDir "reverse-tunnel.out.log"
$stderr = Join-Path $logDir "reverse-tunnel.err.log"

$args = @(
  "-N",
  "-T",
  "-p", "$SshPort",
  "-o", "ExitOnForwardFailure=yes",
  "-o", "ServerAliveInterval=30",
  "-o", "ServerAliveCountMax=3",
  "-R", "127.0.0.1:$RemotePort:127.0.0.1:$LocalPort"
)

if ($IdentityFile.Trim()) {
  $args += @("-i", $IdentityFile.Trim())
}

$args += "$SshUser@$SshHost"

$process = Start-Process -FilePath $sshPath `
  -ArgumentList $args `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -PassThru

Start-Sleep -Seconds 2

if ($process.HasExited) {
  throw "SSH reverse tunnel acilamadi. logs/live/reverse-tunnel.err.log dosyasini kontrol et."
}

$state = [ordered]@{
  startedAt = (Get-Date).ToString("o")
  pid = $process.Id
  ssh = "$SshUser@$SshHost"
  sshPort = $SshPort
  remotePort = $RemotePort
  localPort = $LocalPort
  identityFile = $IdentityFile
}

$state | ConvertTo-Json -Depth 4 | Set-Content -Path $pidFile -Encoding UTF8

Write-Host "Reverse tunnel basladi."
Write-Host "Uzak proxy: 127.0.0.1:$RemotePort -> local 127.0.0.1:$LocalPort"
Write-Host "PID dosyasi: $pidFile"
