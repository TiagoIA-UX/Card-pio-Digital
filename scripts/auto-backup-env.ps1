<#
  auto-backup-env.ps1 — Backup automático do .env.local

  Instala 3 camadas de proteção:
    1. Tarefa Agendada do Windows (a cada 30 min, se o arquivo mudou)
    2. Git hook pre-checkout (backup antes de git pull/checkout/merge)
    3. Watcher de arquivo (monitor em tempo real, opcional)

  Uso:
    .\scripts\auto-backup-env.ps1 -Install    # Instala tarefa + hook
    .\scripts\auto-backup-env.ps1 -Uninstall  # Remove tarefa + hook
    .\scripts\auto-backup-env.ps1 -Watch      # Monitor em tempo real (foreground)
    .\scripts\auto-backup-env.ps1 -Status     # Mostra estado atual
    .\scripts\auto-backup-env.ps1 -Cleanup    # Remove backups > 30 dias
#>
param(
  [switch]$Install,
  [switch]$Uninstall,
  [switch]$Watch,
  [switch]$Status,
  [switch]$Cleanup
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env.local"
$backupDir = Join-Path $root ".env-backups"
$taskName = "CardapioDigital-EnvBackup"
$hookDir = Join-Path $root ".git" "hooks"
$maxBackupDays = 30
$maxBackups = 50

# === Função de Backup (reutilizada em todos os modos) ===
function Invoke-EnvBackup {
  param([string]$Trigger = "manual")

  if (-not (Test-Path $envFile)) { return $false }
  if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  }

  # Verifica se o conteúdo mudou desde o último backup
  $lastBackup = Get-ChildItem $backupDir -Filter "*.env.local.bak" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1

  if ($lastBackup) {
    $currentHash = (Get-FileHash $envFile -Algorithm SHA256).Hash
    $lastHash = (Get-FileHash $lastBackup.FullName -Algorithm SHA256).Hash
    if ($currentHash -eq $lastHash) {
      return $false  # Sem mudanças
    }
  }

  # Desbloquear temporariamente se necessário
  $wasReadOnly = (Get-ItemProperty $envFile).IsReadOnly
  if ($wasReadOnly) {
    Set-ItemProperty $envFile -Name IsReadOnly -Value $false
  }

  $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
  $backupFile = Join-Path $backupDir "${timestamp}_${Trigger}.env.local.bak"
  Copy-Item $envFile $backupFile -Force

  # Restaurar read-only
  if ($wasReadOnly) {
    Set-ItemProperty $envFile -Name IsReadOnly -Value $true
  }

  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Backup ($Trigger): $($backupFile | Split-Path -Leaf)" -ForegroundColor Green
  return $true
}

# === Limpeza de backups antigos ===
function Invoke-BackupCleanup {
  if (-not (Test-Path $backupDir)) { return }

  $cutoff = (Get-Date).AddDays(-$maxBackupDays)
  $old = Get-ChildItem $backupDir -Filter "*.env.local.bak" |
    Where-Object { $_.LastWriteTime -lt $cutoff }

  if ($old.Count -gt 0) {
    $old | Remove-Item -Force
    Write-Host "Removidos $($old.Count) backups com mais de $maxBackupDays dias." -ForegroundColor Yellow
  }

  # Manter no máximo $maxBackups mais recentes
  $all = Get-ChildItem $backupDir -Filter "*.env.local.bak" |
    Sort-Object LastWriteTime -Descending
  if ($all.Count -gt $maxBackups) {
    $excess = $all | Select-Object -Skip $maxBackups
    $excess | Remove-Item -Force
    Write-Host "Removidos $($excess.Count) backups excedentes (limite: $maxBackups)." -ForegroundColor Yellow
  }

  $remaining = (Get-ChildItem $backupDir -Filter "*.env.local.bak" -ErrorAction SilentlyContinue).Count
  Write-Host "Backups restantes: $remaining" -ForegroundColor Cyan
}

# === INSTALL ===
if ($Install) {
  Write-Host "`n=== Instalando backup automatico ===" -ForegroundColor Cyan

  # 1. Criar diretório de backup
  if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  }

  # 2. Tarefa Agendada do Windows (a cada 30 min)
  Write-Host "`n[1/3] Tarefa Agendada do Windows..." -ForegroundColor White
  $scriptPath = Join-Path $PSScriptRoot "auto-backup-env.ps1"

  # Remove tarefa antiga se existir
  $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }

  $action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $root

  $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Backup automático do .env.local (Cardápio Digital)" | Out-Null
  Write-Host "  Tarefa '$taskName' criada (a cada 30 min)" -ForegroundColor Green

  # 3. Git hooks
  Write-Host "`n[2/3] Git hooks..." -ForegroundColor White
  if (Test-Path $hookDir) {
    # pre-checkout hook
    $preCheckout = Join-Path $hookDir "pre-checkout"
    $hookContent = @"
#!/bin/sh
# Auto-backup .env.local antes de checkout/pull/merge
ENV_FILE=".env.local"
BACKUP_DIR=".env-backups"
if [ -f "`$ENV_FILE" ]; then
  mkdir -p "`$BACKUP_DIR"
  TIMESTAMP=`$(date +%Y-%m-%d_%H%M%S)
  cp "`$ENV_FILE" "`$BACKUP_DIR/`${TIMESTAMP}_git-hook.env.local.bak"
fi
"@
    Set-Content -Path $preCheckout -Value $hookContent -NoNewline -Encoding UTF8
    Write-Host "  Hook pre-checkout instalado" -ForegroundColor Green

    # post-merge hook (detecta se .env.local foi alterado por merge)
    $postMerge = Join-Path $hookDir "post-merge"
    $postMergeContent = @"
#!/bin/sh
# Avisa se .env.local foi alterado por merge/pull
CHANGED=`$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD 2>/dev/null)
if echo "`$CHANGED" | grep -q ".env.local"; then
  echo ""
  echo "  AVISO: .env.local foi alterado pelo merge!"
  echo "  Backups em .env-backups/"
  echo "  Restaurar: .\\scripts\\protect-env.ps1 -Restore"
  echo ""
fi
"@
    Set-Content -Path $postMerge -Value $postMergeContent -NoNewline -Encoding UTF8
    Write-Host "  Hook post-merge instalado" -ForegroundColor Green
  } else {
    Write-Host "  .git/hooks nao encontrado (pular)" -ForegroundColor Yellow
  }

  # 4. Backup inicial
  Write-Host "`n[3/3] Backup inicial..." -ForegroundColor White
  Invoke-EnvBackup -Trigger "install" | Out-Null

  Write-Host "`n=== Instalacao concluida ===" -ForegroundColor Green
  Write-Host "  - Windows Task: a cada 30 min (so se o arquivo mudou)" -ForegroundColor Gray
  Write-Host "  - Git hooks: pre-checkout + post-merge" -ForegroundColor Gray
  Write-Host "  - Cleanup: rode com -Cleanup para limpar backups antigos" -ForegroundColor Gray
  Write-Host "  - Monitor: rode com -Watch para acompanhar mudancas em tempo real" -ForegroundColor Gray
  exit 0
}

# === UNINSTALL ===
if ($Uninstall) {
  Write-Host "`nRemovendo backup automatico..." -ForegroundColor Yellow

  # Tarefa agendada
  $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "  Tarefa '$taskName' removida" -ForegroundColor Green
  } else {
    Write-Host "  Tarefa nao encontrada (ok)" -ForegroundColor Gray
  }

  # Git hooks
  foreach ($hook in @("pre-checkout", "post-merge")) {
    $hookPath = Join-Path $hookDir $hook
    if (Test-Path $hookPath) {
      $content = Get-Content $hookPath -Raw -ErrorAction SilentlyContinue
      if ($content -match "Auto-backup .env.local") {
        Remove-Item $hookPath -Force
        Write-Host "  Hook $hook removido" -ForegroundColor Green
      }
    }
  }

  Write-Host "Backup automatico desinstalado. Backups existentes preservados." -ForegroundColor Cyan
  exit 0
}

# === WATCH (monitor em tempo real) ===
if ($Watch) {
  if (-not (Test-Path $envFile)) {
    Write-Host ".env.local nao encontrado." -ForegroundColor Red
    exit 1
  }

  Write-Host "Monitorando .env.local... (Ctrl+C para parar)" -ForegroundColor Cyan
  Write-Host "Qualquer mudanca gera backup automatico.`n" -ForegroundColor Gray

  $watcher = [System.IO.FileSystemWatcher]::new((Split-Path $envFile), (Split-Path $envFile -Leaf))
  $watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::Size
  $watcher.EnableRaisingEvents = $false

  $lastHash = (Get-FileHash $envFile -Algorithm SHA256).Hash

  try {
    while ($true) {
      $result = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::Changed, 5000)
      if (-not $result.TimedOut) {
        Start-Sleep -Milliseconds 500  # Espera I/O finalizar
        $newHash = (Get-FileHash $envFile -Algorithm SHA256).Hash
        if ($newHash -ne $lastHash) {
          Invoke-EnvBackup -Trigger "watcher" | Out-Null
          $lastHash = $newHash
        }
      }
    }
  } finally {
    $watcher.Dispose()
    Write-Host "`nMonitor encerrado." -ForegroundColor Yellow
  }
  exit 0
}

# === STATUS ===
if ($Status) {
  Write-Host "`n=== Status do Backup Automatico ===" -ForegroundColor Cyan

  # Tarefa agendada
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task) {
    $info = $task | Get-ScheduledTaskInfo
    Write-Host "`nTarefa Agendada: ATIVA" -ForegroundColor Green
    Write-Host "  Estado: $($task.State)"
    Write-Host "  Ultima execucao: $($info.LastRunTime)"
    Write-Host "  Proximo run: $($info.NextRunTime)"
  } else {
    Write-Host "`nTarefa Agendada: NAO INSTALADA" -ForegroundColor Yellow
  }

  # Git hooks
  Write-Host ""
  foreach ($hook in @("pre-checkout", "post-merge")) {
    $hookPath = Join-Path $hookDir $hook
    if (Test-Path $hookPath) {
      $content = Get-Content $hookPath -Raw -ErrorAction SilentlyContinue
      if ($content -match "Auto-backup .env.local") {
        Write-Host "Git hook $hook`: INSTALADO" -ForegroundColor Green
      } else {
        Write-Host "Git hook $hook`: existe (outro)" -ForegroundColor Gray
      }
    } else {
      Write-Host "Git hook $hook`: NAO INSTALADO" -ForegroundColor Yellow
    }
  }

  # Backups
  Write-Host ""
  if (Test-Path $backupDir) {
    $backups = Get-ChildItem $backupDir -Filter "*.env.local.bak" | Sort-Object LastWriteTime -Descending
    Write-Host "Backups: $($backups.Count)" -ForegroundColor Cyan
    if ($backups.Count -gt 0) {
      $totalSize = ($backups | Measure-Object -Property Length -Sum).Sum / 1KB
      Write-Host "  Tamanho total: $([math]::Round($totalSize, 1)) KB"
      Write-Host "  Mais recente: $($backups[0].Name)"
      Write-Host "  Mais antigo: $($backups[-1].Name)"
    }
  } else {
    Write-Host "Backups: nenhum (diretorio nao existe)" -ForegroundColor Yellow
  }

  # .env.local
  Write-Host ""
  if (Test-Path $envFile) {
    $props = Get-ItemProperty $envFile
    $ro = if ($props.IsReadOnly) { "SIM (protegido)" } else { "NAO (editavel)" }
    Write-Host ".env.local: $ro" -ForegroundColor $(if ($props.IsReadOnly) { "Green" } else { "Yellow" })
    Write-Host "  Tamanho: $([math]::Round($props.Length / 1KB, 1)) KB"
    Write-Host "  Ultima modificacao: $($props.LastWriteTime)"
  } else {
    Write-Host ".env.local: NAO ENCONTRADO" -ForegroundColor Red
  }

  exit 0
}

# === CLEANUP ===
if ($Cleanup) {
  Invoke-BackupCleanup
  exit 0
}

# === Modo padrão: executado pela tarefa agendada ===
Invoke-EnvBackup -Trigger "scheduled" | Out-Null
Invoke-BackupCleanup
