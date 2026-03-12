# Script para push e release - execute em PowerShell
# Usa HTTPS (nao SSH) para evitar erro "cannot spawn ssh"

$env:Path = "C:\Program Files\Git\bin;$env:Path"
Set-Location $PSScriptRoot

Write-Host "Configurando remote HTTPS..." -ForegroundColor Cyan
& "C:\Program Files\Git\bin\git.exe" remote set-url origin https://github.com/TiagoIA-UX/Card-pio-Digital.git

Write-Host "Verificando remote..." -ForegroundColor Cyan
& "C:\Program Files\Git\bin\git.exe" remote -v

Write-Host "Push da branch rename/cardapio-digital..." -ForegroundColor Cyan
& "C:\Program Files\Git\bin\git.exe" push origin rename/cardapio-digital

Write-Host "Push da tag v1.2.0..." -ForegroundColor Cyan
& "C:\Program Files\Git\bin\git.exe" push origin v1.2.0

Write-Host "Concluido!" -ForegroundColor Green
