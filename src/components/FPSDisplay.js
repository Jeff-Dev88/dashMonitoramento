'use client';

export default function FPSDisplay({ value }) {
  // FPS alto (60+) = verde, médio = laranja, baixo = vermelho
  const isHigh = value >= 60;

  return (
    <div className="card fps-card">
      <div className="card-label">FPS</div>
      <div className={`fps-value ${isHigh ? 'high' : ''}`}>
        {value || '--'}
      </div>
      <div className="card-subtitle">
        {value === 0 ? 'Aguardando jogo...' : 'Em jogo'}
      </div>
    </div>
  );
}
