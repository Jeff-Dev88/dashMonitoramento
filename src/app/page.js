'use client';

import { useSystemData } from '../hooks/useSystemData';
import Header from '../components/Header';
import MetricCard from '../components/MetricCard';
import GaugeChart from '../components/GaugeChart';
import TemperatureBar from '../components/TemperatureBar';
import FPSDisplay from '../components/FPSDisplay';
import SystemInfo from '../components/SystemInfo';

export default function Dashboard() {
  const { data, isConnected, error } = useSystemData();

  // Loading state
  if (!isConnected && !data.timestamp) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Conectando ao servidor...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Header
        hostname={data.system.hostname}
        isConnected={isConnected}
      />

      {/* Grid Principal de Métricas */}
      <div className="metrics-grid">
        {/* CPU */}
        <MetricCard label="CPU">
          <GaugeChart
            value={data.cpu.usage}
            label="%"
          />
        </MetricCard>

        {/* GPU */}
        <MetricCard label="GPU">
          <GaugeChart
            value={data.gpu.usage}
            label="%"
          />
        </MetricCard>

        {/* RAM */}
        <MetricCard
          label="RAM"
          value={data.ram.used.toFixed(1)}
          unit="GB"
          subtitle={`${data.ram.usage}% de ${data.ram.total.toFixed(1)} GB`}
        />

        {/* FPS */}
        <FPSDisplay value={data.fps} />
      </div>

      {/* Seção de Temperaturas */}
      <section className="temp-section">
        <h2 className="temp-section-title">Temperaturas</h2>
        <TemperatureBar
          label="CPU"
          value={data.cpu.temperature}
        />
        <TemperatureBar
          label="GPU"
          value={data.gpu.temperature}
        />
      </section>

      {/* Info do Sistema */}
      <SystemInfo
        system={data.system}
        gpu={data.gpu}
      />
    </div>
  );
}
