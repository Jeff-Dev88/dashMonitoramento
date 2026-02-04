# Dashboard de Monitoramento de Hardware

## Visão Geral
Criar um dashboard em Next.js (sem TypeScript) que monitora CPU, GPU, temperaturas e outros dados do PC, acessível via celular através de WiFi.

## Arquitetura

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   PC (Servidor) │ ◄────────────────► │ Celular/Browser │
│   - Next.js API │      WiFi/LAN      │   - Dashboard   │
│   - systeminformation               │   - Real-time   │
└─────────────────┘                    └─────────────────┘
```

## Stack Tecnológico

- **Frontend**: Next.js 14 (JavaScript, sem TypeScript)
- **Backend**: Next.js API Routes + WebSocket (ws)
- **Coleta de dados**: `systeminformation` (biblioteca Node.js)
- **Estilização**: CSS Modules + CSS Variables para cores vivas
- **Comunicação**: WebSocket para dados em tempo real

## Dados Monitorados

| Métrica | Biblioteca | Método |
|---------|------------|--------|
| CPU Usage | systeminformation | `currentLoad()` |
| CPU Temp | systeminformation | `cpuTemperature()` |
| GPU Usage | systeminformation | `graphics()` |
| GPU Temp | systeminformation | `graphics()` |
| RAM Usage | systeminformation | `mem()` |
| FPS | PresentMon | Integração via stdout |

## Estrutura de Arquivos

```
dashMonitoramento/
├── package.json
├── next.config.js
├── server.js                 # Servidor customizado com WebSocket
├── tools/
│   └── PresentMon.exe        # (usuário baixa manualmente)
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js           # Dashboard principal
│   │   └── globals.css       # Estilos globais (AMD Adrenalin style)
│   ├── components/
│   │   ├── MetricCard.js     # Card de métrica individual
│   │   ├── GaugeChart.js     # Gráfico circular de gauge
│   │   ├── TemperatureBar.js # Barra de temperatura
│   │   ├── FPSDisplay.js     # Display especial para FPS
│   │   └── Header.js         # Header com status de conexão
│   ├── hooks/
│   │   └── useSystemData.js  # Hook para WebSocket
│   └── lib/
│       ├── systemMonitor.js  # Coleta de dados do sistema
│       └── fpsMonitor.js     # Integração com PresentMon
```

## Design da Interface (Estilo AMD Adrenalin)

### Paleta de Cores
- **Primária**: #ED1C24 (Vermelho AMD)
- **Secundária**: #FF6B35 (Laranja vibrante)
- **Accent**: #00D4AA (Turquesa/Teal)
- **Sucesso**: #00FF88 (Verde neon)
- **Alerta**: #FFB800 (Amarelo)
- **Perigo**: #FF3366 (Vermelho intenso)
- **Background**: #0A0A0F (Preto profundo)
- **Cards**: #16161D (Cinza escuro)
- **Border**: #2A2A35 (Borda sutil)
- **Text**: #FFFFFF / #8B8B9A (Branco/Cinza)

### Características Visuais
- Background escuro com gradientes sutis
- Cards com bordas arredondadas e borda sutil
- Gráficos circulares estilo gauge com gradiente vermelho→laranja
- Efeitos de glow/brilho nos elementos ativos
- Tipografia moderna e limpa
- Animações suaves de transição

## Como Usar

### Setup Inicial
1. Baixar PresentMon: https://github.com/GameTechDev/PresentMon/releases
2. Colocar `PresentMon.exe` na pasta `tools/` do projeto
3. `npm install` - instalar dependências
4. `npm run dev` - iniciar servidor

### Acessando
1. No PC: `http://localhost:3000`
2. No celular (mesma rede WiFi): `http://<IP-DO-PC>:3000`

### Descobrir IP do PC (Windows)
```bash
ipconfig
# Procurar por "IPv4 Address" na rede WiFi
```

## FPS - PresentMon

O **PresentMon** é uma ferramenta gratuita da Intel que captura métricas de frame em tempo real. Funciona com qualquer GPU (AMD, Nvidia, Intel).

- Download: https://github.com/GameTechDev/PresentMon/releases
- Não precisa de instalação, é apenas um .exe
