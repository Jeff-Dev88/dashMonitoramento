const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Caminho da DLL do LibreHardwareMonitor
const LHM_DLL_PATH = path.join(process.cwd(), 'tools', 'LibreHardwareMonitorLib.dll');

let currentTemps = {
  cpu: 0,
  gpu: 0
};

let monitorProcess = null;
let isRunning = false;

// Script PowerShell que carrega a DLL e monitora temperaturas
const PS_SCRIPT = `
Add-Type -Path "{DLL_PATH}"

$computer = New-Object LibreHardwareMonitor.Hardware.Computer
$computer.IsCpuEnabled = $true
$computer.IsGpuEnabled = $true
$computer.Open()

while ($true) {
    $cpuTemp = 0
    $gpuTemp = 0

    foreach ($hardware in $computer.Hardware) {
        $hardware.Update()

        foreach ($sensor in $hardware.Sensors) {
            if ($sensor.SensorType -eq 'Temperature') {
                if ($hardware.HardwareType -match 'Cpu' -and $sensor.Name -match 'Package|Core') {
                    if ($sensor.Value -gt $cpuTemp) {
                        $cpuTemp = [math]::Round($sensor.Value, 0)
                    }
                }
                if ($hardware.HardwareType -match 'Gpu' -and $sensor.Name -match 'Core|GPU') {
                    if ($sensor.Value -gt $gpuTemp) {
                        $gpuTemp = [math]::Round($sensor.Value, 0)
                    }
                }
            }
        }

        foreach ($subhardware in $hardware.SubHardware) {
            $subhardware.Update()
            foreach ($sensor in $subhardware.Sensors) {
                if ($sensor.SensorType -eq 'Temperature') {
                    if ($sensor.Name -match 'Package|Core' -and $sensor.Value -gt $cpuTemp) {
                        $cpuTemp = [math]::Round($sensor.Value, 0)
                    }
                }
            }
        }
    }

    Write-Output "TEMPS:$cpuTemp,$gpuTemp"
    Start-Sleep -Seconds 1
}
`;

function startHardwareMonitor() {
  if (!fs.existsSync(LHM_DLL_PATH)) {
    console.log('⚠️  LibreHardwareMonitorLib.dll não encontrado em tools/');
    console.log('   Para monitorar temperaturas:');
    console.log('   1. Baixe: https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases');
    console.log('   2. Extraia e copie LibreHardwareMonitorLib.dll para a pasta tools/');
    console.log('   Temperaturas serão exibidas como 0 até que a DLL seja instalada.\n');
    return;
  }

  if (isRunning) return;

  try {
    const script = PS_SCRIPT.replace('{DLL_PATH}', LHM_DLL_PATH.replace(/\\/g, '\\\\'));

    monitorProcess = spawn('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', script
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    isRunning = true;

    monitorProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('TEMPS:')) {
          const parts = line.replace('TEMPS:', '').trim().split(',');
          currentTemps.cpu = parseInt(parts[0]) || 0;
          currentTemps.gpu = parseInt(parts[1]) || 0;
        }
      }
    });

    monitorProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (!msg.includes('WARNING') && !msg.includes('FullyQualifiedErrorId')) {
        // Só mostrar erros críticos
        if (msg.includes('Error') || msg.includes('Exception')) {
          console.error('HardwareMonitor:', msg.substring(0, 200));
        }
      }
    });

    monitorProcess.on('close', (code) => {
      isRunning = false;
      if (code !== 0 && code !== null) {
        console.log(`HardwareMonitor encerrado (código ${code})`);
      }
      // Tentar reiniciar após 5 segundos
      setTimeout(() => {
        if (!isRunning) startHardwareMonitor();
      }, 5000);
    });

    monitorProcess.on('error', (err) => {
      isRunning = false;
      console.error('Erro ao iniciar HardwareMonitor:', err.message);
    });

    console.log('✓ Monitor de temperaturas iniciado (LibreHardwareMonitor)');

  } catch (error) {
    console.error('Erro ao iniciar monitor de hardware:', error);
    isRunning = false;
  }
}

function stopHardwareMonitor() {
  if (monitorProcess) {
    monitorProcess.kill();
    monitorProcess = null;
    isRunning = false;
  }
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
