<#
.SYNOPSIS
  One-command build + deploy for Gravity Flip.

.DESCRIPTION
  1. npm run build  (prebuild writes version.json → postbuild syncs to server/)
  2. Upload web assets  → /var/www/gravitygame.tomris.games/
  3. Upload server/version.json → /root/gravitygame-server/
  4. pm2 restart gravitygame-api

.USAGE
  .\deploy.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$KEY      = 'C:\Users\korha\.ssh\nexthavale'
$REMOTE   = 'root@82.21.114.33'
$PORT     = '2222'
$WEB_ROOT = '/var/www/gravitygame.tomris.games/'
$SRV_DIR  = '/root/gravitygame-server/'

Write-Host ''
Write-Host '==> [1/4] Building...' -ForegroundColor Cyan
npm run build

Write-Host ''
Write-Host '==> [2/4] Uploading web assets...' -ForegroundColor Cyan
& scp -i $KEY -P $PORT -r "dist/." "${REMOTE}:${WEB_ROOT}"

Write-Host ''
Write-Host '==> [3/4] Uploading server version.json...' -ForegroundColor Cyan
& scp -i $KEY -P $PORT 'server/version.json' "${REMOTE}:${SRV_DIR}"

Write-Host ''
Write-Host '==> [4/4] Restarting API...' -ForegroundColor Cyan
& ssh -i $KEY -p $PORT $REMOTE 'pm2 restart gravitygame-api'

Write-Host ''
Write-Host '✓ Deploy complete!' -ForegroundColor Green
