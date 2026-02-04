const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Caminhos
const LHM_DLL_PATH = path.join(process.cwd(), 'tools', 'LibreHardwareMonitorLib.dll');
const SCRIPT_PATH = path.join(process.cwd(), 'tools', 'temp-monitor.ps1');

let currentTemps = {
  cpu: 0,
  gpu: 0
};

let monitorProcess = null;
let isRunning = false;

// Script PowerShell - pega QUALQUER sensor de temperatura da CPU
const PS_SCRIPT = `
$ErrorActionPreference = "SilentlyContinue"

try {
    Add-Type -Path "__DLL_PATH__"

    $computer = New-Object LibreHardwareMonitor.Hardware.Computer
    $computer.IsCpuEnabled = $true
    $computer.IsGpuEnabled = $true
    $computer.Open()

    # Debug inicial - listar todos os sensores encontrados
    Write-Output "DEBUG:Iniciando monitor..."

    foreach ($hw in $computer.Hardware) {
        $hw.Update()
        Write-Output "DEBUG:Hardware: $($hw.Name) [$($hw.HardwareType)]"

        foreach ($sensor in $hw.Sensors) {
            if ($sensor.SensorType -eq 'Temperature') {
                Write-Output "DEBUG:  Sensor: $($sensor.Name) = $($sensor.Value)"
            }
        }

        foreach ($sub in $hw.SubHardware) {
            $sub.Update()
            foreach ($sensor in $sub.Sensors) {
                if ($sensor.SensorType -eq 'Temperature') {
                    Write-Output "DEBUG:  SubSensor: $($sensor.Name) = $($sensor.Value)"
                }
            }
        }
    }

    Write-Output "DEBUG:Fim da lista. Iniciando loop..."

    while ($true) {
        $cpuTemp = 0
        $gpuTemp = 0

        foreach ($hw in $computer.Hardware) {
            $hw.Update()

            foreach ($sensor in $hw.Sensors) {
                if ($sensor.SensorType -eq 'Temperature' -and $sensor.Value -gt 0 -and $sensor.Value -lt 150) {
                    # CPU - pega qualquer sensor de temperatura do hardware CPU
                    if ($hw.HardwareType -match 'Cpu' -and $sensor.Value -gt $cpuTemp) {
                        $cpuTemp = [math]::Round($sensor.Value, 0)
                    }
                    # GPU
                    if ($hw.HardwareType -match 'Gpu' -and $sensor.Value -gt $gpuTemp) {
                        $gpuTemp = [math]::Round($sensor.Value, 0)
                    }
                }
            }

            foreach ($sub in $hw.SubHardware) {
                $sub.Update()
                foreach ($sensor in $sub.Sensors) {
                    if ($sensor.SensorType -eq 'Temperature' -and $sensor.Value -gt 0 -and $sensor.Value -lt 150) {
                        if ($sensor.Value -gt $cpuTemp) {
                            $cpuTemp = [math]::Round($sensor.Value, 0)
                        }
                    }
                }
            }
        }

        Write-Output "TEMPS:$cpuTemp,$gpuTemp"
        Start-Sleep -Seconds 1
    }

} catch {
    Write-Output "ERROR:$($_.Exception.Message)"
}
`;

function startHardwareMonitor() {
  if (!fs.existsSync(LHM_DLL_PATH)) {
    console.log('');
    console.log('⚠️  LibreHardwareMonitorLib.dll não encontrado em tools/');
    console.log('   Para monitorar temperaturas:');
    console.log('   1. Baixe: https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases');
    console.log('   2. Extraia e copie LibreHardwareMonitorLib.dll para a pasta tools/');
    console.log('');
    return;
  }

  if (isRunning) return;

  try {
    // Salvar script em arquivo (evita problemas de escape)
    const scriptContent = PS_SCRIPT.replace('__DLL_PATH__', LHM_DLL_PATH.replace(/\\/g, '\\\\'));
    fs.writeFileSync(SCRIPT_PATH, scriptContent, 'utf8');

    monitorProcess = spawn('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', SCRIPT_PATH
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    isRunning = true;
    let debugMode = true;

    monitorProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('DEBUG:')) {
          if (debugMode) {
            console.log('  ' + trimmed.replace('DEBUG:', ''));
          }
        } else if (trimmed.startsWith('TEMPS:')) {
          debugMode = false; // Para de mostrar debug após primeiro TEMPS
          const parts = trimmed.replace('TEMPS:', '').split(',');
          currentTemps.cpu = parseInt(parts[0]) || 0;
          currentTemps.gpu = parseInt(parts[1]) || 0;
        } else if (trimmed.startsWith('ERROR:')) {
          console.error('  ❌ ' + trimmed.replace('ERROR:', ''));
          console.log('  💡 Tente executar como ADMINISTRADOR: start-admin.bat');
        }
      }
    });

    monitorProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('WARNING')) {
        console.error('  PowerShell:', msg.substring(0, 150));
      }
    });

    monitorProcess.on('close', (code) => {
      isRunning = false;
      if (code !== 0 && code !== null) {
        console.log(`  Monitor encerrado (código ${code})`);
      }
      // Reiniciar após 5 segundos
      setTimeout(() => {
        if (!isRunning) startHardwareMonitor();
      }, 5000);
    });

    monitorProcess.on('error', (err) => {
      isRunning = false;
      console.error('  Erro ao iniciar monitor:', err.message);
    });

    console.log('✓ Monitor de temperaturas iniciado');

  } catch (error) {
    console.error('Erro ao iniciar monitor:', error.message);
    isRunning = false;
  }
}

function stopHardwareMonitor() {
  if (monitorProcess) {
    monitorProcess.kill();
    monitorProcess = null;
    isRunning = false;
  }
  // Limpar script temporário
  try {
    if (fs.existsSync(SCRIPT_PATH)) {
      fs.unlinkSync(SCRIPT_PATH);
    }
  } catch (e) {}
}

function getTemperatures() {
  return currentTemps;
}

// Limpar ao sair
process.on('exit', stopHardwareMonitor);
process.on('SIGINT', () => {
  stopHardwareMonitor();
  process.exit();
});

module.exports = { startHardwareMonitor, stopHardwareMonitor, getTemperatures };
