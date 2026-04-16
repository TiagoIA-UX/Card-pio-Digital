$extensions = @(
    'mtxr.sqltools',
    'ms-python.python',
    'ms-python.vscode-pylance',
    'ms-python.debugpy',
    'ms-vscode.js-debug-companion'
)

$codeCli = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd"
if (-not (Test-Path $codeCli)) {
    Write-Error "VS Code CLI não encontrada em $codeCli"
    exit 1
}

Write-Output 'Instalando extensões recomendadas...'

foreach ($extension in $extensions) {
    & $codeCli --install-extension $extension --force
}

Write-Output 'Ambiente pronto.'