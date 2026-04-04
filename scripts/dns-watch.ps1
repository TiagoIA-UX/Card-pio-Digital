# =====================================================================================
# dns-watch.ps1 — Aguarda propagação DNS e configura domínio automaticamente
# Execução: roda em background, envia atualizações via Telegram
# =====================================================================================

$VERCEL_TOKEN      = $env:VERCEL_TOKEN
$VERCEL_PROJECT_ID = $env:VERCEL_PROJECT_ID
$VERCEL_TEAM_ID    = $env:VERCEL_TEAM_ID
$TG_TOKEN          = $env:TELEGRAM_BOT_TOKEN
$TG_CHAT           = $env:TELEGRAM_CHAT_ID
$TARGET_IP         = "76.76.21.21"
$DOMAIN            = "zairyx.com.br"
$REPO_PATH         = "C:\Users\.001TRABALHO\01CardapioDigital"
$ENV_FILE          = "$REPO_PATH\.env.local"
$LOG_FILE          = "$REPO_PATH\scripts\dns-watch.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line
}

function Send-Telegram($msg) {
    try {
        $body = @{ chat_id = $TG_CHAT; text = $msg; parse_mode = "HTML" } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "https://api.telegram.org/bot$TG_TOKEN/sendMessage" `
            -Method Post -Body $body -ContentType "application/json; charset=utf-8" `
            -ErrorAction Stop | Out-Null
        Write-Log "Telegram enviado: $msg"
    } catch {
        Write-Log "WARN Telegram falhou: $_"
    }
}

function Invoke-VercelApi($method, $path, $body = $null) {
    $headers = @{
        Authorization  = "Bearer $VERCEL_TOKEN"
        "Content-Type" = "application/json"
    }
    $url = "https://api.vercel.com$path"
    try {
        if ($body) {
            $json = $body | ConvertTo-Json -Compress
            return Invoke-RestMethod -Uri $url -Method $method -Headers $headers -Body $json -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Uri $url -Method $method -Headers $headers -ErrorAction Stop
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Log "Vercel API $method $path => $statusCode | $_"
        return $null
    }
}

function Add-VercelDomain($domain) {
    Write-Log "Adicionando domínio Vercel: $domain"
    $result = Invoke-VercelApi "POST" "/v10/projects/$VERCEL_PROJECT_ID/domains?teamId=$VERCEL_TEAM_ID" @{ name = $domain }
    if ($result) {
        Write-Log "Domínio adicionado: $($result.name) | verified=$($result.verified)"
        return $true
    }
    return $false
}

function Set-VercelEnvVar($key, $value) {
    Write-Log "Atualizando env var Vercel: $key"
    # Busca envId existente
    $envs = Invoke-VercelApi "GET" "/v10/projects/$VERCEL_PROJECT_ID/env?teamId=$VERCEL_TEAM_ID"
    $existing = $envs.envs | Where-Object { $_.key -eq $key }

    if ($existing) {
        $envId = $existing[0].id
        $result = Invoke-VercelApi "PATCH" "/v10/projects/$VERCEL_PROJECT_ID/env/${envId}?teamId=$VERCEL_TEAM_ID" @{
            value  = $value
            target = @("production", "preview")
            type   = "plain"
        }
        Write-Log "Env var atualizada: $key"
    } else {
        $result = Invoke-VercelApi "POST" "/v10/projects/$VERCEL_PROJECT_ID/env?teamId=$VERCEL_TEAM_ID" @{
            key    = $key
            value  = $value
            target = @("production", "preview")
            type   = "plain"
        }
        Write-Log "Env var criada: $key"
    }
    return $null -ne $result
}

function Trigger-VercelRedeploy {
    Write-Log "Buscando último deployment para redeploy..."
    $deps = Invoke-VercelApi "GET" "/v6/deployments?projectId=$VERCEL_PROJECT_ID&teamId=$VERCEL_TEAM_ID&limit=1&state=READY"
    if ($deps -and $deps.deployments.Count -gt 0) {
        $depId = $deps.deployments[0].uid
        Write-Log "Redeploy do deployment: $depId"
        $result = Invoke-VercelApi "POST" "/v13/deployments/${depId}/redeploy?teamId=$VERCEL_TEAM_ID" @{ target = "production" }
        if ($result) {
            Write-Log "Redeploy iniciado: $($result.url)"
            return $result.url
        }
    }
    return $null
}

# =====================================================================================
# INÍCIO
# =====================================================================================
Write-Log "=== dns-watch.ps1 iniciado ==="
Send-Telegram "⏳ <b>DNS Watcher</b> ativo

Aguardando <code>$DOMAIN</code> → <code>$TARGET_IP</code>
Checarei a cada 2 minutos. Quando propagar, configuro tudo automaticamente."

# =====================================================================================
# FASE 1 — Aguardar propagação DNS
# =====================================================================================
$resolved = $false
$maxAttempts = 90   # 90 × 2min = 3h
$attempt = 0
$resolvedIP = ""

while (-not $resolved -and $attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 120

    try {
        $dns = Resolve-DnsName $DOMAIN -Type A -Server 8.8.8.8 -ErrorAction Stop
        $ip  = ($dns | Where-Object { $_.Type -eq "A" } | Select-Object -First 1).IPAddress
        Write-Log "Tentativa $attempt | DNS: $ip"

        if ($ip -eq $TARGET_IP) {
            $resolved = $true
            $resolvedIP = $ip
        }
    } catch {
        Write-Log "Tentativa $attempt | DNS ainda não resolveu: $_"
    }
}

if (-not $resolved) {
    $msg = "❌ <b>DNS Watcher</b> — timeout após 3h.`nVerifique registro.br manualmente."
    Write-Log $msg
    Send-Telegram $msg
    exit 1
}

Write-Log "DNS propagou! $DOMAIN → $resolvedIP"
Send-Telegram "✅ <b>DNS propagou!</b>
<code>$DOMAIN</code> → <code>$resolvedIP</code>

Configurando Vercel..."

# =====================================================================================
# FASE 2 — Adicionar domínios no Vercel
# =====================================================================================
$d1 = Add-VercelDomain "zairyx.com.br"
Start-Sleep -Seconds 3
$d2 = Add-VercelDomain "www.zairyx.com.br"

$statusD1 = if ($d1) { "✅" } else { "⚠️ (pode já existir)" }
$statusD2 = if ($d2) { "✅" } else { "⚠️ (pode já existir)" }

Send-Telegram "🔗 <b>Vercel Domains</b>
zairyx.com.br → $statusD1
www.zairyx.com.br → $statusD2

Atualizando variável de ambiente..."

# =====================================================================================
# FASE 3 — Atualizar NEXT_PUBLIC_SITE_URL no Vercel
# =====================================================================================
$envOk = Set-VercelEnvVar "NEXT_PUBLIC_SITE_URL" "https://zairyx.com.br"
$envStatus = if ($envOk) { "✅" } else { "⚠️ falhou" }

Send-Telegram "📝 <b>Env Var Vercel</b>
NEXT_PUBLIC_SITE_URL=https://zairyx.com.br → $envStatus

Disparando redeploy..."

# =====================================================================================
# FASE 4 — Atualizar .env.local local (sem commit)
# =====================================================================================
try {
    $content = Get-Content $ENV_FILE -Raw
    $newContent = $content -replace 'NEXT_PUBLIC_SITE_URL=http://localhost:3000', 'NEXT_PUBLIC_SITE_URL=https://zairyx.com.br'
    [System.IO.File]::WriteAllText($ENV_FILE, $newContent, [System.Text.Encoding]::UTF8)
    Write-Log ".env.local atualizado localmente"
} catch {
    Write-Log "WARN .env.local não atualizado: $_"
}

# =====================================================================================
# FASE 5 — Redeploy Vercel
# =====================================================================================
$deployUrl = Trigger-VercelRedeploy
$deployStatus = if ($deployUrl) { "✅ https://$deployUrl" } else { "⚠️ use o painel Vercel" }

# =====================================================================================
# FASE 6 — Disparar ZAEA health run
# =====================================================================================
Set-Location $REPO_PATH
try {
    $zaaeResult = gh workflow run zaea.yml --field mode=health 2>&1
    Write-Log "ZAEA workflow: $zaaeResult"
    $zaaeStatus = "✅ disparado"
} catch {
    $zaaeStatus = "⚠️ falhou: $_"
}

# =====================================================================================
# FASE 7 — Notificação final
# =====================================================================================
$summary = "🎉 <b>zairyx.com.br está no ar!</b>

🌐 DNS: <code>$DOMAIN → $resolvedIP</code>
🔗 Vercel domains: $statusD1 / $statusD2
📝 Env var: $envStatus
🚀 Redeploy: $deployStatus
🤖 ZAEA health: $zaaeStatus

Acesse: https://zairyx.com.br"

Write-Log "=== CONCLUÍDO ==="
Write-Log $summary
Send-Telegram $summary
