# Build + run the FE on this PC (LAN: http://<PC-IP>:3000, Internet: https://<random>.trycloudflare.com)
# Run from the FE folder, as Administrator the first time (firewall):
#   powershell -ExecutionPolicy Bypass -File .\deploy-fe.ps1
# Options: -Port 3000  -NoBuild

param([int]$Port = 3000, [switch]$NoBuild)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
$Project = "capstone-fe"
$env:FE_PORT = "$Port"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Checking Docker and the backend"
docker info *> $null
if ($LASTEXITCODE -ne 0) { Write-Host "Docker is not running. Start Docker Desktop first." -ForegroundColor Red; exit 1 }
docker network inspect capstone-lan_default *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend stack not found. Run .\deploy-lan.ps1 in the BE folder first." -ForegroundColor Red
    exit 1
}

Write-Step "Opening Windows Firewall port $Port"
$ruleName = "Capstone Frontend $Port"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) {
    Write-Host "Firewall rule already exists."
} elseif ($isAdmin) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
    Write-Host "Firewall rule created."
} else {
    Write-Host "Not Administrator - firewall NOT opened; LAN machines will be blocked (the public URL still works)." -ForegroundColor Yellow
}

Write-Step "Building and starting (first build runs npm ci, may take a few minutes)"
$upArgs = @("compose", "-p", $Project, "up", "-d")
if (-not $NoBuild) { $upArgs += "--build" }
& docker @upArgs
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose failed." -ForegroundColor Red; exit 1 }

Write-Step "Waiting for the public URL"
$url = $null
for ($i = 0; $i -lt 30 -and -not $url; $i++) {
    Start-Sleep -Seconds 2
    $logs = (& docker compose -p $Project logs cloudflared 2>&1) -join "`n"
    $m = [regex]::Matches($logs, 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($m.Count -gt 0) { $url = $m[$m.Count - 1].Value }
}

$cfg = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq "Up" } | Select-Object -First 1
$ip = if ($cfg) { ($cfg.IPv4Address | Select-Object -First 1).IPAddress } else { "<PC-IP>" }

Write-Host ""
Write-Host "Frontend is up." -ForegroundColor Green
Write-Host "  On this PC : http://localhost:$Port"
Write-Host "  From LAN   : http://${ip}:$Port"
if ($url) {
    Set-Content -Path "fe-url.txt" -Value $url -Encoding ascii
    Write-Host "  Internet   : $url   (saved to fe-url.txt; changes when the tunnel restarts; DNS may take ~30s)"
} else {
    Write-Host "  Internet   : URL not found yet - run: docker compose -p $Project logs cloudflared" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Logs : docker compose -p $Project logs -f web"
Write-Host "Stop : docker compose -p $Project down"
