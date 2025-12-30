# Frontend - React IoT Monitoring Dashboard

Modern React.js frontend for the ESP32 IoT monitoring and control system.

## 📁 Structure

```
frontend/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Layout.jsx     # Main layout with header and sidebar
│   │   ├── Card.jsx      # Card component
│   │   ├── StatusCard.jsx # Status display card
│   │   └── VoltageChart.jsx # Chart component
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx # Main monitoring dashboard
│   │   ├── History.jsx   # Power cut history viewer
│   │   └── GlobalControl.jsx # Remote control interface
│   ├── hooks/            # Custom React hooks
│   │   └── useMQTT.js    # MQTT connection hook
│   ├── services/         # API services
│   │   └── api.js        # Backend API client
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json          # Dependencies
├── vite.config.js       # Vite configuration
└── index.html            # HTML template
```

## 🚀 Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🌐 Pages

### Dashboard (`/dashboard`)
- Real-time light intensity monitoring
- Battery and main power monitoring
- System controls
- Live charts and visualizations
- Power cut alerts

### History (`/history`)
- Power cut event history
- Duration tracking
- Energy consumption data
- Export functionality
- Charts and analytics

### Global Control (`/global-control`)
- Simplified control interface
- Toggle switches for all outputs
- Status indicators
- Real-time sensor readings

## 📦 Dependencies

### Core
- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Vite** - Build tool and dev server

### Data Visualization
- **Chart.js** - Chart library
- **react-chartjs-2** - React wrapper for Chart.js

### Communication
- **MQTT.js** - MQTT client for real-time communication

### Styling
- **CSS Modules** - Component-scoped styles
- **Font Awesome** - Icons (via CDN)

## 🎨 Features

- ✅ Modern React with Hooks
- ✅ Real-time MQTT communication
- ✅ Responsive mobile design
- ✅ Dark theme
- ✅ Browser notifications
- ✅ Local storage for history
- ✅ API integration for historical data
- ✅ Chart visualizations
- ✅ Export functionality

## 🔧 Configuration

### MQTT Broker

The MQTT broker URL is configured in `src/hooks/useMQTT.js`:

```javascript
const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
```

### API Base URL

The API base URL is configured in `src/services/api.js`:

```javascript
const API_BASE = '/api'
```

This uses a proxy in development (configured in `vite.config.js`) and relative paths in production.

## 🏗️ Architecture

### Component Structure

- **Layout Component**: Provides consistent header, sidebar, and navigation
- **Page Components**: Main application pages (Dashboard, History, GlobalControl)
- **Shared Components**: Reusable UI components (Card, StatusCard, VoltageChart)

### State Management

- React Hooks (`useState`, `useEffect`, `useCallback`)
- Custom hooks for MQTT connection
- Local state for component-specific data
- API service for backend communication

### Routing

React Router handles client-side routing:
- `/` or `/dashboard` - Main dashboard
- `/history` - Power cut history
- `/global-control` - Global control interface

## 🔌 Integration with Backend

The frontend integrates with the backend in two ways:

1. **MQTT**: Real-time communication for live sensor data and control commands
2. **REST API**: Historical data and statistics from TimescaleDB

### API Endpoints Used

- `GET /api/health` - Health check
- `GET /api/sensor-readings` - Historical sensor data
- `GET /api/power-cut-events` - Power cut event history
- `GET /api/command-logs` - Command execution logs
- `GET /api/statistics` - Aggregated statistics

## 🚀 Deployment

### Production Build

1. Build the React app:
   ```bash
   npm run build
   ```

2. The backend server automatically serves the `dist/` directory when it exists.

3. Start the backend server:
   ```bash
   cd ../backend
   npm start
   ```

The React app will be served at `http://localhost:3000`

### Environment Variables

No frontend-specific environment variables are required. The app uses:
- Relative API paths (proxied in development)
- MQTT broker URL (hardcoded, can be moved to env if needed)

## 🐛 Troubleshooting

### MQTT Connection Issues
- Check browser console for connection errors
- Verify MQTT broker URL is accessible
- Check browser WebSocket support

### API Requests Failing
- Verify backend server is running
- Check API proxy configuration in `vite.config.js`
- Check browser network tab for request errors

### Charts Not Rendering
- Verify Chart.js dependencies are installed
- Check browser console for errors
- Ensure data is being received via MQTT

## 📝 Notes

- The app uses browser localStorage for caching power cut history
- Browser notifications require user permission
- MQTT connection is established automatically on app load
- All routes are handled client-side by React Router
