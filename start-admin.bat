@echo off
:: Verifica se está rodando como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando privilegios de administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d \"%~dp0\" && npm run dev' -Verb RunAs"
    exit
)

cd /d "%~dp0"
echo Iniciando servidor com privilegios de administrador...
npm run dev
pause
