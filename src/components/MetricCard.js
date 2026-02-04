'use client';

export default function MetricCard({ label, value, unit, subtitle, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-label">{label}</div>
      {children ? (
        children
      ) : (
        <>
          <div className="card-value">
            {value}
            {unit && <span className="card-unit">{unit}</span>}
          </div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </>
      )}
    </div>
  );
}
