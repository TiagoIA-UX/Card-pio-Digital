param(
    [switch]$CheckOnly,
    [string]$FilePath = "supabase/migrations/055_ops_incidents.sql"
)

$root = Split-Path -Parent $PSScriptRoot

function Get-EnvValueFromFile {
    param(
        [string]$EnvFilePath,
        [string]$Key
    )

    if (-not (Test-Path $EnvFilePath)) {
        return $null
    }

    $line = Get-Content $EnvFilePath | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    return ($line -replace "^$Key=", '').Trim()
}

$envFilePath = Join-Path $root '.env.local'

$token = if ($env:SUPABASE_SERVICE_TOKEN) {
    $env:SUPABASE_SERVICE_TOKEN
} elseif ($env:SUPABASE_ACCESS_TOKEN) {
    $env:SUPABASE_ACCESS_TOKEN
} else {
    Get-EnvValueFromFile -EnvFilePath $envFilePath -Key 'SUPABASE_SERVICE_TOKEN'
}

if (-not $token) {
    $token = Get-EnvValueFromFile -EnvFilePath $envFilePath -Key 'SUPABASE_ACCESS_TOKEN'
}

$ref = if ($env:SUPABASE_PROJECT_REF) {
    $env:SUPABASE_PROJECT_REF
} else {
    Get-EnvValueFromFile -EnvFilePath $envFilePath -Key 'SUPABASE_PROJECT_REF'
}

if (-not $ref) {
    $supabaseUrl = if ($env:NEXT_PUBLIC_SUPABASE_URL) {
        $env:NEXT_PUBLIC_SUPABASE_URL
    } else {
        Get-EnvValueFromFile -EnvFilePath $envFilePath -Key 'NEXT_PUBLIC_SUPABASE_URL'
    }

    if ($supabaseUrl) {
        $ref = ([Uri]$supabaseUrl).Host.Split('.')[0]
    }
}

if (-not $token -or -not $ref) {
    Write-Error "Defina SUPABASE_SERVICE_TOKEN ou SUPABASE_ACCESS_TOKEN, e SUPABASE_PROJECT_REF ou NEXT_PUBLIC_SUPABASE_URL."
    exit 1
}

$resolvedFile = Join-Path $root $FilePath

if (-not (Test-Path $resolvedFile)) {
    Write-Error "Arquivo de migration não encontrado: $resolvedFile"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

function Invoke-SupabaseQuery {
    param(
        [string]$Label,
        [string]$Sql
    )

    $payload = [PSCustomObject]@{ query = $Sql } | ConvertTo-Json -Compress
    try {
        $response = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
            -Method POST -Headers $headers -Body $payload -UseBasicParsing -ErrorAction Stop
        Write-Host "[$Label] OK ($($response.StatusCode))"
        if ($response.Content) {
            Write-Host $response.Content
        }
        return $true
    } catch {
        Write-Host "[$Label] ERRO $($_.Exception.Response.StatusCode): $($_.ErrorDetails.Message)"
        return $false
    }
}

function Invoke-Verification {
    $tableCheck = @"
SELECT
  to_regclass('public.ops_incidents') AS table_name;
"@

    $columnCheck = @"
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ops_incidents'
ORDER BY ordinal_position;
"@

    $policyCheck = @"
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'ops_incidents'
ORDER BY policyname;
"@

    $ok = $true
    $ok = (Invoke-SupabaseQuery -Label "CHECK_TABLE" -Sql $tableCheck) -and $ok
    $ok = (Invoke-SupabaseQuery -Label "CHECK_COLUMNS" -Sql $columnCheck) -and $ok
    $ok = (Invoke-SupabaseQuery -Label "CHECK_POLICIES" -Sql $policyCheck) -and $ok
    return $ok
}

if ($CheckOnly) {
    Write-Host "Modo check-only: sem aplicar migration."
    if (-not (Invoke-Verification)) {
        exit 1
    }
    exit 0
}

$sql = Get-Content -Raw -Path $resolvedFile
if ([string]::IsNullOrWhiteSpace($sql)) {
    Write-Error "A migration está vazia: $resolvedFile"
    exit 1
}

$applyOk = Invoke-SupabaseQuery -Label "APPLY_055" -Sql $sql
if (-not $applyOk) {
    exit 1
}

if (-not (Invoke-Verification)) {
    exit 1
}

Write-Host "Migration 055 aplicada e verificada com sucesso."