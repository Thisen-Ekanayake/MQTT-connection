import './StatusCard.css'

function StatusCard({ title, value, label, indicator, icon, iconColor, children }) {
  return (
    <div className="status-card">
      <div className="card-header">
        <div className="card-title">
          {icon && <i className={`fas ${icon} card-icon`} style={{ color: iconColor }}></i>}
          {title}
        </div>
      </div>
      {indicator && (
        <div className="status-indicator-wrapper">
          <span className={`status-indicator ${indicator}`}></span>
          <span>{label}</span>
        </div>
      )}
      <div className="status-value">{value}</div>
      {children}
    </div>
  )
}

export default StatusCard

