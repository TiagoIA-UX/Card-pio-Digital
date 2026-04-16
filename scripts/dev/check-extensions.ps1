$recommended = @(
    'mtxr.sqltools',
    'ms-python.python',
    'ms-python.vscode-pylance',
    'ms-python.debugpy',
    'ms-vscode.js-debug-companion'
)

$unwanted = @(
    'ms-mssql.mssql',
    'ms-mssql.sql-database-projects-vscode',
    'ms-mssql.data-workspace-vscode',
    'ms-mssql.sql-bindings-vscode',
    'denoland.vscode-deno',
    'ritwickdey.liveserver',
    'dsznajder.es7-react-js-snippets',
    'pulkitgangwar.nextjs-snippets',
    'xabikos.javascriptsnippets',
    'donjayamanne.python-extension-pack',
    'donjayamanne.python-environment-manager',
    'kevinrose.vsc-python-indent',
    'ms-python.vscode-python-envs'
)

$codeCli = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd"
if (-not (Test-Path $codeCli)) {
    Write-Error "VS Code CLI não encontrada em $codeCli"
    exit 1
}

$installed = @(& $codeCli --list-extensions)

Write-Output "`n=== EXTENSÕES RECOMENDADAS ==="
$recommended

Write-Output "`n=== EXTENSÕES INSTALADAS ==="
$installed

$missing = @($recommended | Where-Object { $_ -notin $installed })
$bad = @($installed | Where-Object { $_ -in $unwanted })
$extra = @($installed | Where-Object { $_ -notin $recommended -and $_ -notin $unwanted })

Write-Output "`n=== VERIFICAÇÃO ==="

if ($missing.Count -gt 0) {
    Write-Output "`nFALTANDO:"
    $missing
}

if ($bad.Count -gt 0) {
    Write-Output "`nINDESEJADAS DETECTADAS:"
    $bad
}

if ($extra.Count -gt 0) {
    Write-Output "`nEXTRAS (avaliar):"
    $extra
}

if ($missing.Count -eq 0 -and $bad.Count -eq 0) {
    Write-Output "`nOK: ambiente consistente"
}