'use client';

export default function GaugeChart({ value, label, maxValue = 100 }) {
  // Calcular o comprimento do arco (circunferência = 2 * PI * raio)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value, maxValue) / maxValue;
  const strokeDasharray = `${circumference * percentage} ${circumference}`;

  // Cor baseada no valor
  const getColor = () => {
    if (percentage < 0.5) return '#00FF88';
    if (percentage < 0.75) return '#FFB800';
    return '#FF3366';
  };

  return (
    <div className="gauge-container">
      <div className="gauge">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`gaugeGradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ED1C24" />
              <stop offset="50%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FFB800" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            className="gauge-bg"
            cx="50"
            cy="50"
            r={radius}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#gaugeGradient-${label})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke-dasharray 0.3s ease'
            }}
          />
        </svg>
        <div className="gauge-text">
          <span className="gauge-value">{Math.round(value)}</span>
          <span className="gauge-label">{label}</span>
        </div>
      </div>
    </div>
  );
}
