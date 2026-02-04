const si = require('systeminformation');

// Cache para evitar consultas muito frequentes
let cachedData = null;
let lastUpdate = 0;
const CACHE_DURATION = 500; // ms

async function getSystemData() {
  const now = Date.now();

  // Usar cache se dados ainda são recentes
  if (cachedData && (now - lastUpdate) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    // Coletar todos os dados em paralelo para melhor performance
    const [cpu, cpuTemp, mem, graphics, osInfo] = await Promise.all([
      si.currentLoad(),
      si.cpuTemperature(),
      si.mem(),
      si.graphics(),
      si.osInfo()
    ]);

    // Processar dados da GPU
    const gpu = graphics.controllers[0] || {};

    cachedData = {
      cpu: {
        usage: Math.round(cpu.currentLoad * 10) / 10,
        temperature: cpuTemp.main || 0,
        cores: cpu.cpus ? cpu.cpus.map(c => Math.round(c.load * 10) / 10) : []
      },
      gpu: {
        name: gpu.model || 'N/A',
        usage: gpu.utilizationGpu || 0,
        temperature: gpu.temperatureGpu || 0,
        memoryUsed: gpu.memoryUsed || 0,
        memoryTotal: gpu.memoryTotal || 0,
        fanSpeed: gpu.fanSpeed || 0
      },
      ram: {
        total: Math.round(mem.total / (1024 * 1024 * 1024) * 10) / 10, // GB
        used: Math.round(mem.used / (1024 * 1024 * 1024) * 10) / 10,   // GB
        usage: Math.round((mem.used / mem.total) * 1000) / 10          // %
      },
      system: {
        hostname: osInfo.hostname,
        platform: osInfo.platform,
        distro: osInfo.distro
      }
    };

    lastUpdate = now;
    return cachedData;
  } catch (error) {
    console.error('Erro ao coletar dados do sistema:', error);
    return cachedData || {
      cpu: { usage: 0, temperature: 0, cores: [] },
      gpu: { name: 'N/A', usage: 0, temperature: 0, memoryUsed: 0, memoryTotal: 0, fanSpeed: 0 },
      ram: { total: 0, used: 0, usage: 0 },
      system: { hostname: 'Unknown', platform: 'Unknown', distro: 'Unknown' }
    };
  }
}

module.exports = { getSystemData };
