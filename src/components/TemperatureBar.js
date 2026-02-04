'use client';

export default function TemperatureBar({ label, value, maxTemp = 100 }) {
  // Determinar estado baseado na temperatura
  const getStatus = () => {
    if (value < 50) return 'normal';
    if (value < 75) return 'warm';
    return 'hot';
  };

  const status = getStatus();
  const percentage = Math.min((value / maxTemp) * 100, 100);

  return (
    <div className="temp-bar">
      <div className="temp-bar-header">
        <span className="temp-bar-label">{label}</span>
        <span className={`temp-bar-value ${status}`}>{value}°C</span>
      </div>
      <div className="temp-bar-track">
        <div
          className={`temp-bar-fill ${status}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
