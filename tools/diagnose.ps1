$dllPath = Join-Path $PSScriptRoot 'LibreHardwareMonitorLib.dll'
Write-Host '=== DIAGNOSTICO DE TEMPERATURA ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'DLL Path:' $dllPath
Write-Host 'DLL Existe:' (Test-Path $dllPath)
Write-Host 'Executando como Admin:' ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host ''

if (Test-Path $dllPath) {
    try {
        Add-Type -Path $dllPath
        Write-Host 'DLL carregada com sucesso!' -ForegroundColor Green

        $computer = New-Object LibreHardwareMonitor.Hardware.Computer
        $computer.IsCpuEnabled = $true
        $computer.IsGpuEnabled = $true
        $computer.Open()

        Write-Host ''
        Write-Host '=== HARDWARE DETECTADO ===' -ForegroundColor Cyan

        foreach ($hardware in $computer.Hardware) {
            $hardware.Update()
            Write-Host ''
            Write-Host ('Hardware: ' + $hardware.Name + ' [' + $hardware.HardwareType + ']') -ForegroundColor Yellow

            $tempFound = $false
            foreach ($sensor in $hardware.Sensors) {
                if ($sensor.SensorType -eq 'Temperature') {
                    Write-Host ('  TEMP: ' + $sensor.Name + ' = ' + $sensor.Value + ' C') -ForegroundColor Green
                    $tempFound = $true
                }
            }

            if (-not $tempFound) {
                Write-Host '  (Nenhum sensor de temperatura encontrado neste hardware)' -ForegroundColor Gray
            }

            foreach ($sub in $hardware.SubHardware) {
                $sub.Update()
                Write-Host ('  SubHardware: ' + $sub.Name) -ForegroundColor Magenta
                foreach ($sensor in $sub.Sensors) {
                    if ($sensor.SensorType -eq 'Temperature') {
                        Write-Host ('    TEMP: ' + $sensor.Name + ' = ' + $sensor.Value + ' C') -ForegroundColor Green
                    }
                }
            }
        }

        $computer.Close()

    } catch {
        Write-Host ''
        Write-Host 'ERRO:' $_.Exception.Message -ForegroundColor Red
        Write-Host ''
        Write-Host 'SOLUCAO: Execute este script como ADMINISTRADOR' -ForegroundColor Yellow
    }
} else {
    Write-Host 'DLL NAO ENCONTRADA!' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Pressione qualquer tecla para sair...'
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
