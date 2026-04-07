#!/usr/bin/env pwsh
# scripts/backup-env.ps1
# Faz backup dos arquivos .env para .env-backups/ com timestamp.
# Pasta ignorada pelo git — nunca vai para o repositório.
# Uso: .\scripts\backup-env.ps1

$root  = Split-Path $PSScriptRoot
$dest  = Join-Path $root ".env-backups"
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
}

$targets = @(
    (Join-Path $root ".env.local"),
    (Join-Path $root "backend\.env")
)

$backed = 0
foreach ($src in $targets) {
    if (Test-Path $src) {
        $name    = Split-Path $src -Leaf
        $outFile = Join-Path $dest "$stamp`_$name"
        Copy-Item $src $outFile
        Write-Host "✅ Backup: $outFile"
        $backed++
    }
}

if ($backed -eq 0) {
    Write-Host "⚠️  Nenhum arquivo .env encontrado."
} else {
    # Manter apenas os 20 backups mais recentes por arquivo
    foreach ($prefix in @(".env.local", ".env")) {
        Get-ChildItem $dest -Filter "*_$prefix" |
            Sort-Object Name -Descending |
            Select-Object -Skip 20 |
            Remove-Item -Force
    }
    Write-Host "🗂️  Backups mantidos: $((Get-ChildItem $dest).Count) arquivo(s) em $dest"
}
