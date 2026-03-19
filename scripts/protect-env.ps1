<#
  protect-env.ps1 — Protege o .env.local contra sobrescrita acidental

  O que faz:
  1. Cria backup timestamped em .env-backups/
  2. Marca o arquivo como somente-leitura
  3. Para restaurar: .\scripts\protect-env.ps1 -Unlock

  Uso:
    .\scripts\protect-env.ps1          # Backup + trava
    .\scripts\protect-env.ps1 -Unlock  # Destrava para edição
    .\scripts\protect-env.ps1 -Restore # Lista backups para restaurar
#>
param(
  [switch]$Unlock,
  [switch]$Restore
)

$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env.local"
$backupDir = Join-Path $root ".env-backups"

if ($Restore) {
  if (-not (Test-Path $backupDir)) {
    Write-Host "Nenhum backup encontrado." -ForegroundColor Yellow
    exit 0
  }
  $backups = Get-ChildItem $backupDir -Filter "*.env.local.bak" | Sort-Object LastWriteTime -Descending
  if ($backups.Count -eq 0) {
    Write-Host "Nenhum backup encontrado." -ForegroundColor Yellow
    exit 0
  }
  Write-Host "`nBackups disponíveis:" -ForegroundColor Cyan
  for ($i = 0; $i -lt $backups.Count; $i++) {
    $size = [math]::Round($backups[$i].Length / 1KB, 1)
    Write-Host "  [$i] $($backups[$i].Name) ($($size)KB)"
  }
  $pick = Read-Host "`nDigite o número para restaurar (ou Enter para cancelar)"
  if ($pick -match '^\d+$' -and [int]$pick -lt $backups.Count) {
    if (Test-Path $envFile) {
      Set-ItemProperty $envFile -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue
    }
    Copy-Item $backups[[int]$pick].FullName $envFile -Force
    Write-Host "Restaurado: $($backups[[int]$pick].Name)" -ForegroundColor Green
  }
  exit 0
}

if ($Unlock) {
  if (Test-Path $envFile) {
    Set-ItemProperty $envFile -Name IsReadOnly -Value $false
    Write-Host ".env.local DESBLOQUEADO para edição." -ForegroundColor Yellow
    Write-Host "Rode '.\scripts\protect-env.ps1' depois de editar para travar novamente." -ForegroundColor Gray
  } else {
    Write-Host ".env.local não encontrado." -ForegroundColor Red
  }
  exit 0
}

# --- Modo padrão: Backup + Lock ---

if (-not (Test-Path $envFile)) {
  Write-Host ".env.local não encontrado." -ForegroundColor Red
  exit 1
}

# Criar diretório de backup
if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  # Garantir que backups estejam no .gitignore
  $gitignore = Join-Path $root ".gitignore"
  $content = Get-Content $gitignore -Raw -ErrorAction SilentlyContinue
  if ($content -and $content -notmatch '\.env-backups') {
    Add-Content $gitignore "`n# Backups de .env.local`n.env-backups/"
    Write-Host ".env-backups/ adicionado ao .gitignore" -ForegroundColor Gray
  }
}

# Desbloquear se necessário para fazer backup
Set-ItemProperty $envFile -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue

# Backup com timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $backupDir "$timestamp.env.local.bak"
Copy-Item $envFile $backupFile -Force
Write-Host "Backup criado: $backupFile" -ForegroundColor Green

# Travar o arquivo
Set-ItemProperty $envFile -Name IsReadOnly -Value $true
Write-Host ".env.local TRAVADO (somente leitura)." -ForegroundColor Cyan
Write-Host "Para editar: .\scripts\protect-env.ps1 -Unlock" -ForegroundColor Gray
