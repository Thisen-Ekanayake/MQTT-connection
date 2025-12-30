import { Link, useLocation } from 'react-router-dom'
import { useMQTT } from '../hooks/useMQTT'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()
  const { connectionStatus } = useMQTT()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <div className="header-icon">
            <i className="fas fa-lightbulb"></i>
            <i className="fas fa-battery-three-quarters"></i>
          </div>
          <div className="header-title">
            <h1>Advanced Light Intensity Monitor & Power Backup System</h1>
            <div className="header-subtitle">Real-time IoT Monitoring Dashboard</div>
          </div>
        </div>
        <div className="header-right">
          <div className="connection-badge">
            <span className={`connection-dot ${connectionStatus === 'Connected' ? 'connected' : ''}`}></span>
            <span>{connectionStatus}</span>
          </div>
        </div>
      </header>

      <div className="container">
        <aside className="sidebar">
          <nav>
            <ul className="sidebar-nav">
              <li>
                <Link to="/dashboard" className={isActive('/dashboard') || isActive('/') ? 'active' : ''}>
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/history" className={isActive('/history') ? 'active' : ''}>
                  <i className="fas fa-history"></i>
                  <span>History</span>
                </Link>
              </li>
              <li>
                <Link to="/global-control" className={isActive('/global-control') ? 'active' : ''}>
                  <i className="fas fa-sliders-h"></i>
                  <span>Global Control</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

