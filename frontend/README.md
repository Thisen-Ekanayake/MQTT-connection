# Frontend - IoT Monitoring Dashboard

Frontend web interface for the ESP32 IoT monitoring and control system.

## 📁 Structure

```
frontend/
├── dashboard.html          # Main monitoring dashboard
├── history.html            # Power cut history viewer
├── global-control.html     # Remote control interface
├── public/
│   └── index.html         # Landing page
└── package.json           # Frontend dependencies (Tailwind CSS)
```

## 🌐 Pages

### Dashboard (`/dashboard.html`)
- Real-time light intensity monitoring
- Battery and main power monitoring
- System controls
- Live charts and visualizations
- Power cut alerts

### History (`/history.html`)
- Power cut event history
- Duration tracking
- Energy consumption data
- Export functionality

### Global Control (`/global-control.html`)
- Simplified control interface
- Toggle switches for all outputs
- Status indicators

## 🚀 Usage

The frontend is served by the backend server. To start:

```bash
cd ../backend
npm install
npm start
```

Then access the dashboard at: `http://localhost:3000`

## 📦 Dependencies

- **Tailwind CSS** - Styling framework (configured in `package.json`)
- **Chart.js** - Data visualization (loaded via CDN)
- **MQTT.js** - Browser MQTT client (loaded via CDN)
- **Font Awesome** - Icons (loaded via CDN)

## 🎨 Features

- Dark/Light theme toggle
- Responsive mobile design
- Real-time MQTT communication
- Browser notifications
- Local storage for history

