# First-time setup for Windows / PowerShell (cross-platform alternative: pnpm bootstrap)
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required tool: $Name"
  }
}

function Import-MergedEnv {
  node scripts/apply-merged-env.mjs | ForEach-Object {
    $index = $_.IndexOf('=')
    if ($index -gt 0) {
      $name = $_.Substring(0, $index)
      $value = $_.Substring($index + 1)
      Set-Item -Path "env:$name" -Value $value
    }
  }
}

Require-Command node
Require-Command pnpm
Require-Command docker

if (-not $env:APP_ENV) {
  $env:APP_ENV = "development"
}

Import-MergedEnv

pnpm install
node scripts/hooks/install.mjs

pnpm run mobile:doctor *> $null
if ($LASTEXITCODE -eq 0) {
  pnpm run mobile:setup
} else {
  Write-Host "Flutter unavailable; skipping apps/mobile dependency bootstrap on this machine."
}

docker compose -f infra/docker-compose.yml up -d
node scripts/wait-for-postgres.mjs
pnpm --filter api db:migrate
pnpm --filter api db:seed
if (Get-Command sh -ErrorAction SilentlyContinue) {
  sh scripts/generate-contracts.sh
} else {
  pnpm --filter api openapi:generate
  pnpm --filter api contract:generate
  Write-Warning "Dart client generation skipped (install Git Bash/sh, Docker, and Dart to regenerate Flutter API client)."
}

$apiPort = if ($env:API_PORT) { $env:API_PORT } else { "3001" }
$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { "3000" }
$adminPort = if ($env:ADMIN_PORT) { $env:ADMIN_PORT } else { "3002" }
$mailpitPort = if ($env:MAILPIT_HTTP_PORT) { $env:MAILPIT_HTTP_PORT } else { "8025" }

Write-Host @"
Bootstrap complete.
Web: http://localhost:$webPort
Admin: http://localhost:$adminPort
API: http://localhost:$apiPort/api/v1
Swagger: http://localhost:$apiPort/api/docs
Mailpit: http://localhost:$mailpitPort
Run Flutter separately with: pnpm run mobile:dev
"@
