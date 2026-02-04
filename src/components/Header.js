'use client';

export default function Header({ hostname, isConnected }) {
  return (
    <header className="header">
      <h1 className="header-title">
        {hostname || 'Hardware Monitor'}
      </h1>
      <div className="header-status">
        <span className={`status-dot ${!isConnected ? 'disconnected' : ''}`}></span>
        <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
      </div>
    </header>
  );
}
