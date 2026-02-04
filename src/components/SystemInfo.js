'use client';

export default function SystemInfo({ system, gpu }) {
  return (
    <div className="system-info">
      <div className="system-info-row">
        <span className="system-info-label">Sistema</span>
        <span className="system-info-value">{system.distro || system.platform}</span>
      </div>
      <div className="system-info-row">
        <span className="system-info-label">GPU</span>
        <span className="system-info-value">{gpu.name}</span>
      </div>
      {gpu.memoryTotal > 0 && (
        <div className="system-info-row">
          <span className="system-info-label">VRAM</span>
          <span className="system-info-value">
            {Math.round(gpu.memoryUsed)} / {Math.round(gpu.memoryTotal)} MB
          </span>
        </div>
      )}
    </div>
  );
}
