# Desbloqueia a DLL do LibreHardwareMonitor
$dll = Join-Path $PSScriptRoot 'LibreHardwareMonitorLib.dll'

Write-Host 'Desbloqueando DLL...' -ForegroundColor Cyan
Write-Host "Arquivo: $dll"

if (Test-Path $dll) {
    Unblock-File -Path $dll
    Write-Host 'DLL desbloqueada com sucesso!' -ForegroundColor Green
} else {
    Write-Host 'DLL nao encontrada!' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Pressione qualquer tecla para sair...'
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
