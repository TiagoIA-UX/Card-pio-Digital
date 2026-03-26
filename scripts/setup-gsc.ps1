#!/usr/bin/env pwsh
# ============================================================
# SETUP-GSC.ps1 — Configura Google Search Console API
# Cria projeto, service account, habilita API e gera chave
# ============================================================

$ErrorActionPreference = "Stop"

# Refresh PATH (gcloud may have been installed recently)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$PROJECT_ID = "cardapio-digital-seo"
$SA_NAME = "gsc-reader"
$SA_DISPLAY = "GSC Reader (Cardapio Digital)"
$SITE_URL = "https://www.zairyx.com"

Write-Host "`n=== ETAPA 1: Verificando autenticacao ===" -ForegroundColor Cyan
$accounts = gcloud auth list --format="value(account)" 2>&1
if (-not $accounts -or $accounts -match "No credentialed") {
    Write-Host "ERRO: Faca login primeiro com: gcloud auth login" -ForegroundColor Red
    exit 1
}
Write-Host "Autenticado como: $accounts" -ForegroundColor Green

Write-Host "`n=== ETAPA 2: Criando/selecionando projeto ===" -ForegroundColor Cyan
$existing = gcloud projects describe $PROJECT_ID --format="value(projectId)" 2>&1
if ($existing -eq $PROJECT_ID) {
    Write-Host "Projeto '$PROJECT_ID' ja existe" -ForegroundColor Yellow
} else {
    Write-Host "Criando projeto '$PROJECT_ID'..."
    gcloud projects create $PROJECT_ID --name="Cardapio Digital SEO" 2>&1
}
gcloud config set project $PROJECT_ID 2>&1 | Out-Null

Write-Host "`n=== ETAPA 3: Habilitando Search Console API ===" -ForegroundColor Cyan
gcloud services enable searchconsole.googleapis.com 2>&1
Write-Host "API habilitada" -ForegroundColor Green

Write-Host "`n=== ETAPA 4: Criando Service Account ===" -ForegroundColor Cyan
$saEmail = "${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
$saExists = gcloud iam service-accounts describe $saEmail --format="value(email)" 2>&1
if ($saExists -eq $saEmail) {
    Write-Host "Service account ja existe: $saEmail" -ForegroundColor Yellow
} else {
    gcloud iam service-accounts create $SA_NAME `
        --display-name="$SA_DISPLAY" `
        --description="Leitura de dados do Google Search Console para painel admin" 2>&1
    Write-Host "Service account criada: $saEmail" -ForegroundColor Green
}

Write-Host "`n=== ETAPA 5: Gerando chave JSON ===" -ForegroundColor Cyan
$keyPath = Join-Path $PSScriptRoot "gsc-service-account-key.json"
if (Test-Path $keyPath) {
    Write-Host "Chave ja existe em: $keyPath" -ForegroundColor Yellow
} else {
    gcloud iam service-accounts keys create $keyPath --iam-account=$saEmail 2>&1
    Write-Host "Chave gerada em: $keyPath" -ForegroundColor Green
}

Write-Host "`n=== ETAPA 6: Extraindo credenciais ===" -ForegroundColor Cyan
$keyJson = Get-Content $keyPath | ConvertFrom-Json
$clientEmail = $keyJson.client_email
$privateKey = $keyJson.private_key

Write-Host "Email: $clientEmail"
Write-Host "Private Key: ($(($privateKey).Length) caracteres)"

Write-Host "`n=== ETAPA 7: Atualizando .env.local ===" -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw

    # Remove old Google vars if present
    $envContent = $envContent -replace "(?m)^GOOGLE_SERVICE_ACCOUNT_EMAIL=.*`n?", ""
    $envContent = $envContent -replace "(?m)^GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=.*`n?", ""
    $envContent = $envContent -replace "(?m)^GOOGLE_SITE_URL=.*`n?", ""

    # Append new vars
    $envContent = $envContent.TrimEnd() + "`n`n# === GOOGLE SEARCH CONSOLE ===`n"
    $envContent += "GOOGLE_SERVICE_ACCOUNT_EMAIL=$clientEmail`n"
    # Escape the key for .env (keep \n as literal \n)
    $escapedKey = $privateKey -replace "`n", "\n"
    $envContent += "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=`"$escapedKey`"`n"
    $envContent += "GOOGLE_SITE_URL=$SITE_URL`n"

    Set-Content $envFile -Value $envContent -NoNewline
    Write-Host ".env.local atualizado com credenciais Google" -ForegroundColor Green
} else {
    Write-Host "AVISO: .env.local nao encontrado. Adicione manualmente:" -ForegroundColor Yellow
    Write-Host "GOOGLE_SERVICE_ACCOUNT_EMAIL=$clientEmail"
    Write-Host "GOOGLE_SITE_URL=$SITE_URL"
}

Write-Host "`n=== ETAPA 8: Proximos passos ===" -ForegroundColor Cyan
Write-Host @"
IMPORTANTE: Adicione a service account ao Search Console!

1. Acesse: https://search.google.com/search-console/users?resource_id=$([uri]::EscapeDataString($SITE_URL))
2. Clique em 'Adicionar usuario'
3. Cole o email: $clientEmail
4. Permissao: 'Restrito' (somente leitura)
5. Clique em 'Adicionar'

Depois reinicie o dev server (npm run dev) e acesse /admin/seo
"@ -ForegroundColor Yellow

Write-Host "`n=== CONCLUIDO ===" -ForegroundColor Green
