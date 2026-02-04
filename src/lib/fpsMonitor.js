const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let currentFPS = 0;
let presentMonProcess = null;
let isRunning = false;

// Caminho do PresentMon
const PRESENTMON_PATH = path.join(process.cwd(), 'tools', 'PresentMon.exe');

function startFPSMonitor() {
  // Verificar se PresentMon existe
  if (!fs.existsSync(PRESENTMON_PATH)) {
    console.log('⚠️  PresentMon não encontrado em tools/PresentMon.exe');
    console.log('   Baixe em: https://github.com/GameTechDev/PresentMon/releases');
    console.log('   FPS será exibido como 0 até que o PresentMon seja instalado.\n');
    return;
  }

  if (isRunning) return;

  try {
    // Iniciar PresentMon com output para stdout
    // -output_stdout: envia dados para stdout
    // -stop_existing_session: para qualquer sessão anterior
    // -terminate_on_proc_exit: termina quando o processo monitorado fecha
    presentMonProcess = spawn(PRESENTMON_PATH, [
      '-output_stdout',
      '-stop_existing_session',
      '-dont_restart_as_admin'
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    isRunning = true;
    let buffer = '';

    presentMonProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Manter linha incompleta no buffer

      for (const line of lines) {
        // PresentMon CSV format inclui msFPSAvg ou similar
        // Formato típico: Application,ProcessID,SwapChainAddress,Runtime,SyncInterval,PresentFlags,AllowsTearing,PresentMode,msBetweenPresents,...
        if (line.includes(',') && !line.startsWith('Application')) {
          const parts = line.split(',');
          // msBetweenPresents geralmente está na coluna 8-10
          // FPS = 1000 / msBetweenPresents
          for (let i = 0; i < parts.length; i++) {
            const val = parseFloat(parts[i]);
            // Se parece ser msBetweenPresents (entre 1 e 100ms tipicamente)
            if (val > 0 && val < 200) {
              const fps = Math.round(1000 / val);
              if (fps > 0 && fps < 500) { // FPS razoável
                currentFPS = fps;
                break;
              }
            }
          }
        }
      }
    });

    presentMonProcess.stderr.on('data', (data) => {
      // Ignorar erros menores
      const msg = data.toString();
      if (!msg.includes('Warning')) {
        console.error('PresentMon:', msg);
      }
    });

    presentMonProcess.on('close', (code) => {
      isRunning = false;
      if (code !== 0 && code !== null) {
        console.log(`PresentMon encerrado com código ${code}`);
      }
      // Tentar reiniciar após 5 segundos
      setTimeout(() => {
        if (!isRunning) startFPSMonitor();
      }, 5000);
    });

    presentMonProcess.on('error', (err) => {
      isRunning = false;
      console.error('Erro ao iniciar PresentMon:', err.message);
    });

    console.log('✓ PresentMon iniciado para monitoramento de FPS');

  } catch (error) {
    console.error('Erro ao iniciar PresentMon:', error);
    isRunning = false;
  }
}

function stopFPSMonitor() {
  if (presentMonProcess) {
    presentMonProcess.kill();
    presentMonProcess = null;
    isRunning = false;
  }
}

function getCurrentFPS() {
  return currentFPS;
}

// Limpar ao sair
process.on('exit', stopFPSMonitor);
process.on('SIGINT', () => {
  stopFPSMonitor();
  process.exit();
});

module.exports = { startFPSMonitor, stopFPSMonitor, getCurrentFPS };
