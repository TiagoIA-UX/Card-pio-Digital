$ErrorActionPreference = 'Stop'

Write-Host 'Preparando ambiente local do Cardapio Digital...'

if (-not (Test-Path '.env.local')) {
  node .\scripts\setup-local.mjs
}

node .\scripts\doctor.mjs
npm run dev