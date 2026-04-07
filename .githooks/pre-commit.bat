@echo off
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\scripts\backup-env.ps1" >nul 2>&1
exit /b 0
