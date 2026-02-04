const si = require('systeminformation');
const { execSync } = require('child_process');
const { getTemperatures } = require('./hardwareMonitor');

// Cache para evitar consultas muito frequentes
let cachedData = null;
let lastUpdate = 0;
const CACHE_DURATION = 500; // ms

// Tentar ler temperatura via PowerShell/WMI (funciona com alguns sistemas)
function getCpuTempWindows() {
  try {
    // Método 1: Tentar via WMI MSAcpi_ThermalZoneTemperature
    const result = execSync(
      'powershell -Command "Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi 2>$null | Select-Object -ExpandProperty CurrentTemperature | Select-Object -First 1"',
      { encoding: 'utf8', timeout: 2000, windowsHide: true }
    ).trim();

    if (result) {
      // Valor vem em décimos de Kelvin, converter para Celsius
      const kelvin = parseInt(result) / 10;
      const celsius = kelvin - 273.15;
      if (celsius > 0 && celsius < 150) {
        return Math.round(celsius);
      }
    }
  } catch (e) {
    // Silenciosamente falhar
  }

  try {
    // Método 2: Tentar via Open Hardware Monitor WMI (se instalado)
    // Busca por sensores CPU (Intel: Package/Core, AMD: Tdie/Tctl/CCD)
    const result = execSync(
      'powershell -Command "Get-WmiObject -Namespace root/OpenHardwareMonitor -Class Sensor 2>$null | Where-Object { $_.SensorType -eq \'Temperature\' -and ($_.Name -like \'*CPU*\' -or $_.Name -like \'*Package*\' -or $_.Name -like \'*Core*\' -or $_.Name -like \'*Tdie*\' -or $_.Name -like \'*Tctl*\') } | Select-Object -ExpandProperty Value -First 1"',
      { encoding: 'utf8', timeout: 2000, windowsHide: true }
    ).trim();

    if (result) {
      const temp = parseFloat(result);
      if (temp > 0 && temp < 150) {
        return Math.round(temp);
      }
    }
  } catch (e) {
    // Silenciosamente falhar
  }

  try {
    // Método 3: LibreHardwareMonitor WMI (se instalado e rodando)
    // Busca por sensores CPU (Intel: Package/Core, AMD: Tdie/Tctl/CCD)
    const result = execSync(
      'powershell -Command "Get-WmiObject -Namespace root/LibreHardwareMonitor -Class Sensor 2>$null | Where-Object { $_.SensorType -eq \'Temperature\' -and ($_.Name -like \'*CPU*\' -or $_.Name -like \'*Package*\' -or $_.Name -like \'*Core*\' -or $_.Name -like \'*Tdie*\' -or $_.Name -like \'*Tctl*\') } | Select-Object -ExpandProperty Value -First 1"',
      { encoding: 'utf8', timeout: 2000, windowsHide: true }
    ).trim();

    if (result) {
      const temp = parseFloat(result);
      if (temp > 0 && temp < 150) {
        return Math.round(temp);
      }
    }
  } catch (e) {
    // Silenciosamente falhar
  }

  return 0;
}

// Cache para temperatura da CPU (atualiza menos frequentemente)
let cpuTempCache = 0;
let cpuTempLastUpdate = 0;
const CPU_TEMP_CACHE_DURATION = 2000; // 2 segundos

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

    // Obter temperatura da CPU e GPU via hardwareMonitor (LibreHardwareMonitor)
    const hwTemps = getTemperatures();
    let cpuTemperature = hwTemps.cpu || cpuTemp.main || 0;
    let gpuTemperature = hwTemps.gpu || gpu.temperatureGpu || 0;

    // Se ainda não conseguiu, tentar métodos alternativos do Windows
    if (cpuTemperature === 0 || cpuTemperature === null) {
      // Atualizar cache de temperatura se necessário
      if (now - cpuTempLastUpdate > CPU_TEMP_CACHE_DURATION) {
        cpuTempCache = getCpuTempWindows();
        cpuTempLastUpdate = now;
      }
      cpuTemperature = cpuTempCache;
    }

    cachedData = {
      cpu: {
        usage: Math.round(cpu.currentLoad * 10) / 10,
        temperature: cpuTemperature,
        cores: cpu.cpus ? cpu.cpus.map(c => Math.round(c.load * 10) / 10) : []
      },
      gpu: {
        name: gpu.model || 'N/A',
        usage: gpu.utilizationGpu || 0,
        temperature: gpuTemperature,
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
