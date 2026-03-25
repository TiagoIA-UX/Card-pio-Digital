<#
.SYNOPSIS
  Sanity Check - Cardapio Digital
.DESCRIPTION
  Validates full flow: landing, auth, panel, cardapio, API
#>
param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$TestSlug = "ship-mode-mmji68yw"
)

$ErrorActionPreference = "Continue"
$results = [ordered]@{}
$failures = [System.Collections.ArrayList]::new()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$Method = "GET",
        [string]$Body,
        [string]$ContainsText,
        [switch]$ExpectRedirect
    )

    Write-Host -NoNewline "  [$Name] "

    try {
        if ($ExpectRedirect) {
            $wr = [System.Net.WebRequest]::Create($Url)
            $wr.AllowAutoRedirect = $false
            $wr.Method = $Method
            $exResp = $null
            try {
                $exResp = $wr.GetResponse()
            } catch {
                if ($_.Exception -and $_.Exception.InnerException -and $_.Exception.InnerException.Response) {
                    $exResp = $_.Exception.InnerException.Response
                } elseif ($_.Exception -and $_.Exception.Response) {
                    $exResp = $_.Exception.Response
                }
            }
            if ($exResp) {
                $status = [int]$exResp.StatusCode
                $location = $exResp.Headers["Location"]
                try { $exResp.Close() } catch {}

                if ($status -eq $ExpectedStatus) {
                    Write-Host "PASS ($status -> $location)" -ForegroundColor Green
                    $script:results[$Name] = "pass"
                    return
                } else {
                    Write-Host "FAIL (expected $ExpectedStatus, got $status)" -ForegroundColor Red
                    $script:results[$Name] = "fail"
                    [void]$script:failures.Add($Name)
                    return
                }
            } else {
                Write-Host "FAIL (no response)" -ForegroundColor Red
                $script:results[$Name] = "fail"
                [void]$script:failures.Add($Name)
                return
            }
        }

        $params = @{
            Uri             = $Url
            Method          = $Method
            UseBasicParsing = $true
            ErrorAction     = "Stop"
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $r = Invoke-WebRequest @params
        $status = $r.StatusCode

        if ($status -ne $ExpectedStatus) {
            Write-Host "FAIL (expected $ExpectedStatus, got $status)" -ForegroundColor Red
            $script:results[$Name] = "fail"
            [void]$script:failures.Add($Name)
            return
        }

        if ($ContainsText -and (-not $r.Content.Contains($ContainsText))) {
            Write-Host "FAIL (missing: $ContainsText)" -ForegroundColor Red
            $script:results[$Name] = "fail"
            [void]$script:failures.Add($Name)
            return
        }

        Write-Host "PASS ($status)" -ForegroundColor Green
        $script:results[$Name] = "pass"
    }
    catch {
        $exStatus = $null
        if ($_.Exception.Response) {
            $exStatus = [int]$_.Exception.Response.StatusCode
        }
        if ($exStatus -and $exStatus -eq $ExpectedStatus) {
            Write-Host "PASS ($exStatus)" -ForegroundColor Green
            $script:results[$Name] = "pass"
            return
        }
        Write-Host "FAIL ($($_.Exception.Message))" -ForegroundColor Red
        $script:results[$Name] = "fail"
        [void]$script:failures.Add($Name)
    }
}

# ============================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SANITY CHECK - Cardapio Digital" -ForegroundColor Cyan
Write-Host "  Base: $BaseUrl" -ForegroundColor Cyan
Write-Host "  Slug: $TestSlug" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# -- PUBLICO --
Write-Host "[PUBLICO] Paginas abertas:" -ForegroundColor Yellow
Test-Endpoint -Name "landing" -Url "$BaseUrl/" -ContainsText "hero-cta-primary"
Test-Endpoint -Name "templates" -Url "$BaseUrl/templates"
Test-Endpoint -Name "precos" -Url "$BaseUrl/precos"
Test-Endpoint -Name "login" -Url "$BaseUrl/login" -ContainsText "Google"
Test-Endpoint -Name "comprar_restaurante" -Url "$BaseUrl/comprar/restaurante"
Test-Endpoint -Name "comprar_pizzaria" -Url "$BaseUrl/comprar/pizzaria"
Test-Endpoint -Name "termos" -Url "$BaseUrl/termos"
Test-Endpoint -Name "privacidade" -Url "$BaseUrl/privacidade"
Write-Host ""

# -- CARDAPIO --
Write-Host "[CARDAPIO] Menu publico:" -ForegroundColor Yellow
Test-Endpoint -Name "cardapio_ok" -Url "$BaseUrl/r/$TestSlug"
Test-Endpoint -Name "cardapio_404" -Url "$BaseUrl/r/slug-inexistente-xyz" -ExpectedStatus 404
Write-Host ""

# -- AUTH --
Write-Host "[AUTH] Rotas protegidas sem login:" -ForegroundColor Yellow
Test-Endpoint -Name "painel_redir" -Url "$BaseUrl/painel" -ExpectedStatus 307 -ExpectRedirect
Test-Endpoint -Name "config_redir" -Url "$BaseUrl/painel/configuracoes" -ExpectedStatus 307 -ExpectRedirect
Test-Endpoint -Name "produtos_redir" -Url "$BaseUrl/painel/produtos" -ExpectedStatus 307 -ExpectRedirect
Write-Host ""

# -- API --
Write-Host "[API] Endpoints protegidos:" -ForegroundColor Yellow
Test-Endpoint -Name "orders_401" -Url "$BaseUrl/api/orders" -Method "POST" -Body '{"restaurant_id":"x","items":[]}' -ExpectedStatus 401
Test-Endpoint -Name "chat_200" -Url "$BaseUrl/api/chat" -Method "POST" -Body '{"messages":[{"role":"user","content":"oi"}]}' -ExpectedStatus 200
Write-Host ""

# -- HEALTH --
Write-Host "[HEALTH] Saude:" -ForegroundColor Yellow
Test-Endpoint -Name "robots" -Url "$BaseUrl/robots.txt"
Test-Endpoint -Name "sitemap" -Url "$BaseUrl/sitemap.xml"
Write-Host ""

# -- CONVERSAO --
Write-Host "[CONVERSAO] Elementos criticos na landing:" -ForegroundColor Yellow
$html = (Invoke-WebRequest "$BaseUrl/" -UseBasicParsing).Content

$checks = @(
    "hero-cta-primary", "hero-cta-whatsapp",
    "final-cta-primary", "final-cta-whatsapp",
    "proof-section", "benefits-section", "pricing-section",
    "faq-section", "templates-section", "savings-calculator-section"
)

foreach ($c in $checks) {
    Write-Host -NoNewline "  [$c] "
    if ($html.Contains($c)) {
        Write-Host "PASS" -ForegroundColor Green
        $results[$c] = "pass"
    } else {
        Write-Host "FAIL" -ForegroundColor Red
        $results[$c] = "fail"
        [void]$failures.Add($c)
    }
}
Write-Host ""

# -- RESULTADO --
$total = $results.Count
$passed = ($results.Values | Where-Object { $_ -eq "pass" }).Count
$failed = $total - $passed

Write-Host "============================================" -ForegroundColor Cyan
if ($failed -eq 0) {
    Write-Host "  RESULTADO: $passed/$total PASS - ALL GREEN" -ForegroundColor Green
    $decision = "GO"
} else {
    Write-Host "  RESULTADO: $passed/$total PASS, $failed FAIL" -ForegroundColor Red
    $decision = "REVIEW"
    foreach ($f in $failures) {
        Write-Host "    FAIL: $f" -ForegroundColor Red
    }
}
Write-Host "============================================" -ForegroundColor Cyan

# -- JSON --
$output = @{
    timestamp = (Get-Date -Format "o")
    base_url  = $BaseUrl
    total     = $total
    passed    = $passed
    failed    = $failed
    decision  = $decision
    results   = $results
}
$jsonPath = Join-Path (Join-Path $PSScriptRoot "..") "sanity-check-result.json"
$output | ConvertTo-Json -Depth 3 | Out-File $jsonPath -Encoding utf8
Write-Host "Salvo: $jsonPath" -ForegroundColor Gray

exit $(if ($failed -eq 0) { 0 } else { 1 })
