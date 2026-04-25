param(
    [Parameter(Mandatory = $true)]
    [string]$Sql
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
    Write-Error 'Defina SUPABASE_SERVICE_TOKEN ou SUPABASE_ACCESS_TOKEN, e SUPABASE_PROJECT_REF ou NEXT_PUBLIC_SUPABASE_URL.'
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
}

$payload = [PSCustomObject]@{ query = $Sql } | ConvertTo-Json -Compress

try {
    $response = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
        -Method POST -Headers $headers -Body $payload -UseBasicParsing -ErrorAction Stop
    Write-Host $response.Content
} catch {
    Write-Error "Falha ao executar SQL remoto: $($_.ErrorDetails.Message)"
    exit 1
}