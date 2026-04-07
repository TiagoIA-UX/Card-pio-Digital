#!/usr/bin/env pwsh
# scripts/salvar.ps1
# Substituto para `git commit` neste sistema — faz backup dos .env e commita.
# Uso: .\scripts\salvar.ps1 -m "mensagem do commit"
# Ou:  pwsh scripts/salvar.ps1 -m "mensagem"
#
# Por que isso existe:
#   Git neste Windows não consegue spawnar sh.exe internamente (ENOSYS),
#   o que impede hooks pre-commit e aliases com ! de funcionar.
#   Este script PowerShell puro não tem essa limitação.

param(
    [Parameter(Mandatory = $true)]
    [string]$m
)

$root = Split-Path $PSScriptRoot

# 1. Backup dos .env
& "$root\scripts\backup-env.ps1"

# 2. Commit normal (sem hook)
git -C $root -c core.hooksPath=/dev/null commit -m $m
