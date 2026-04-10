# =============================================
# SYNC ENVIRONMENT VARIABLES TO VERCEL
# Configura automaticamente as variáveis do .env.local na Vercel
# ATENÇÃO: Apenas ADICIONA variáveis no cloud, não sobrescreve .env.local
# =============================================

param(
    [string]$Environment = "production",
    [switch]$DryRun
)

Write-Host "🔧 Sync Environment Variables to Vercel" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "DRY RUN MODE - Nenhuma alteração será feita" -ForegroundColor Magenta
}
Write-Host ""

# Variáveis que NÃO devem ir para Vercel (apenas localhost)
$EXCLUDED_VARS = @(
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID', 
    'VERCEL_PROJECT_ID',
    'GITHUB_TOKEN',
    'RENDER_API_KEY',
    'RENDER_DEPLOY_HOOK',
    'FORGE_GITHUB_APP_ID',
    'FORGE_GITHUB_CLIENT_ID',
    'FORGE_GITHUB_PRIVATE_KEY',
    'FORGE_GITHUB_WEBHOOK_SECRET',
    'VERCEL_AI_GATEWAY_TOKEN_ZAEA',
    'ALERT_WEBHOOK_URL'  # localhost:8000
)

# Variáveis críticas que DEVEM estar na produção
$CRITICAL_VARS = @(
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MERCADO_PAGO_ENV',
    'NEXT_PUBLIC_MERCADO_PAGO_ENV',
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_PUBLIC_KEY',
    'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY',
    'MP_WEBHOOK_SECRET',
    'ADMIN_SECRET_KEY',
    'INTERNAL_API_SECRET',
    'CRON_SECRET',
    'GROQ_API_KEY'
)

# Ler .env.local
if (-not (Test-Path .env.local)) {
    Write-Error "❌ .env.local não encontrado!"
    exit 1
}

$envVars = @{}
$lineCount = 0

Get-Content .env.local | ForEach-Object {
    $lineCount++
    $line = $_.Trim()
    
    # Ignora comentários e linhas vazias
    if ($line -match '^#' -or $line -eq '') {
        return
    }
    
    # Parse KEY=VALUE
    if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        
        # Remove aspas se existirem
        $value = $value -replace '^"(.*)"$', '$1'
        
        # Pula variáveis excluídas
        if ($EXCLUDED_VARS -contains $key) {
            Write-Host "⏭️  Ignorando (localhost only): $key" -ForegroundColor DarkGray
            return
        }
        
        # Adiciona ao hash
        $envVars[$key] = $value
        
        if ($CRITICAL_VARS -contains $key) {
            Write-Host "✅ Crítica: $key" -ForegroundColor Green
        } else {
            Write-Host "➕ Opcional: $key" -ForegroundColor Cyan
        }
    }
}

Write-Host ""
Write-Host "📊 Estatísticas:" -ForegroundColor Yellow
Write-Host "   Total de linhas no .env.local: $lineCount"
Write-Host "   Variáveis para sincronizar: $($envVars.Count)"
Write-Host "   Variáveis excluídas: $($EXCLUDED_VARS.Count)"
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN completo. Nenhuma alteração foi feita." -ForegroundColor Magenta
    exit 0
}

# Pede confirmação
Write-Host "⚠️  Pressione ENTER para continuar ou Ctrl+C para cancelar..." -ForegroundColor Yellow
Read-Host

# Extrai token do .env.local
$vercelToken = (Select-String -Path .env.local -Pattern '^VERCEL_TOKEN=' | ForEach-Object { $_.Line.Split('=',2)[1].Trim() })

if (-not $vercelToken) {
    Write-Error "❌ VERCEL_TOKEN não encontrado no .env.local"
    exit 1
}

# Cria arquivo temporário com variáveis no formato que Vercel CLI aceita
$tempFile = New-TemporaryFile
$envVars.GetEnumerator() | ForEach-Object {
    "$($_.Key)=$($_.Value)" | Out-File -Append -FilePath $tempFile.FullName -Encoding UTF8
}

Write-Host "🚀 Sincronizando com Vercel..." -ForegroundColor Cyan

# Usa vercel env pull para baixar existentes primeiro (para não duplicar)
# Depois usa vercel env add para cada nova variável
# OU usa a API REST da Vercel que é mais segura

# Por segurança, vamos usar a API REST da Vercel
$projectId = "prj_gAH3ggo9rIesllVwIefehYu4gePR"
$teamId = "team_7VXPFnWh4B2aHS581UwK77vz"

$headers = @{
    "Authorization" = "Bearer $vercelToken"
    "Content-Type" = "application/json"
}

$successCount = 0
$errorCount = 0

foreach ($var in $envVars.GetEnumerator()) {
    $body = @{
        key = $var.Key
        value = $var.Value
        type = "encrypted"
        target = @($Environment)
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Method POST `
            -Uri "https://api.vercel.com/v10/projects/$projectId/env?teamId=$teamId" `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ $($var.Key)" -ForegroundColor Green
        $successCount++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 409) {
            # Variável já existe, tentar atualizar
            Write-Host "⚠️  $($var.Key) já existe, pulando..." -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Erro ao adicionar $($var.Key): $_" -ForegroundColor Red
            $errorCount++
        }
    }
    
    Start-Sleep -Milliseconds 100  # Rate limiting
}

Remove-Item $tempFile.FullName -Force

Write-Host ""
Write-Host "✨ Sincronização completa!" -ForegroundColor Green
Write-Host "   Sucesso: $successCount variáveis"
Write-Host "   Erros: $errorCount variáveis"
Write-Host ""
Write-Host "🔄 Faça um novo deploy para aplicar as variáveis:" -ForegroundColor Cyan
Write-Host "   git commit --allow-empty -m 'apply new env vars' && git push" -ForegroundColor White
