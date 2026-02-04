const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { getSystemData } = require('./src/lib/systemMonitor');
const { startFPSMonitor, getCurrentFPS } = require('./src/lib/fpsMonitor');
const { startHardwareMonitor, getTemperatures } = require('./src/lib/hardwareMonitor');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Aceita conexões de qualquer IP
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket Server na porta 3001 (separado do Next.js HMR)
  const wss = new WebSocketServer({ port: 3001, host: '0.0.0.0' });

  wss.on('connection', (ws, req) => {
    console.log('Cliente conectado ao WebSocket');

    // Enviar dados a cada segundo
    const interval = setInterval(async () => {
      try {
        if (ws.readyState === ws.OPEN) {
          const systemData = await getSystemData();
          const fps = getCurrentFPS();

          ws.send(JSON.stringify({
            ...systemData,
            fps,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Erro ao coletar dados:', error);
      }
    }, 1000);

    ws.on('close', () => {
      console.log('Cliente desconectado');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      // Ignorar erros de conexão fechada
      if (error.code !== 'ECONNRESET') {
        console.error('WebSocket error:', error.message);
      }
      clearInterval(interval);
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket Server error:', error.message);
  });

  // Iniciar monitores
  startFPSMonitor();
  startHardwareMonitor();

  server.listen(port, hostname, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Dashboard de Monitoramento Iniciado!              ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Acesse no PC:      http://localhost:${port}                 ║
║                                                           ║
║  Acesse no Celular: http://<SEU-IP>:${port}                  ║
║                                                           ║
║  WebSocket rodando na porta 3001                          ║
║                                                           ║
║  Para descobrir seu IP, execute: ipconfig                 ║
║  Procure por "IPv4 Address" na sua rede WiFi              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
});
