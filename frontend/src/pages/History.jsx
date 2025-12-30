import { useState, useEffect } from 'react'
import { useMQTT, TOPICS } from '../hooks/useMQTT'
import { api } from '../services/api'
import Card from '../components/Card'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import './History.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function History() {
  const { subscribe } = useMQTT()
  const [powerCutHistory, setPowerCutHistory] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalDuration: 0,
    totalEnergy: 0,
    avgVoltageDrop: 0
  })

  // Charts
  const [voltageChart, setVoltageChart] = useState(null)
  const [durationChart, setDurationChart] = useState(null)
  const [energyChart, setEnergyChart] = useState(null)

  // Load history from API and localStorage
  useEffect(() => {
    loadHistory()
  }, [])

  // Subscribe to new power cut events
  useEffect(() => {
    const unsubscribe = subscribe(TOPICS.HISTORY, (msg) => {
      try {
        const data = JSON.parse(msg)
        const event = {
          timestamp: new Date().toLocaleString(),
          duration: data.duration,
          startV: data.startV,
          endV: data.endV,
          drop: data.drop,
          energy: data.energy
        }
        setPowerCutHistory(prev => [...prev, event])
        saveToLocalStorage(event)
      } catch (e) {
        console.error('Error parsing history data:', e)
      }
    })
    return unsubscribe
  }, [subscribe])

  // Update stats and charts when history changes
  useEffect(() => {
    updateStats()
    updateCharts()
  }, [powerCutHistory])

  const loadHistory = async () => {
    setLoading(true)
    try {
      // Load from API
      const apiEvents = await api.getPowerCutEvents({ limit: 100 })
      
      // Load from localStorage
      const saved = localStorage.getItem('powerCutHistory')
      let localEvents = []
      if (saved) {
        localEvents = JSON.parse(saved)
      }

      // Combine and deduplicate
      const allEvents = [...apiEvents.map(e => ({
        timestamp: new Date(e.start_time).toLocaleString(),
        duration: e.duration_ms,
        startV: parseFloat(e.start_voltage),
        endV: parseFloat(e.end_voltage),
        drop: parseFloat(e.voltage_drop),
        energy: parseFloat(e.energy_consumed_mwh || 0)
      })), ...localEvents]

      // Sort by timestamp (newest first)
      allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setPowerCutHistory(allEvents)
    } catch (error) {
      console.error('Error loading history:', error)
      // Fallback to localStorage only
      const saved = localStorage.getItem('powerCutHistory')
      if (saved) {
        setPowerCutHistory(JSON.parse(saved))
      }
    } finally {
      setLoading(false)
    }
  }

  const saveToLocalStorage = (event) => {
    const saved = localStorage.getItem('powerCutHistory')
    let history = saved ? JSON.parse(saved) : []
    history.push(event)
    localStorage.setItem('powerCutHistory', JSON.stringify(history))
  }

  const updateStats = () => {
    if (powerCutHistory.length === 0) {
      setStats({ total: 0, totalDuration: 0, totalEnergy: 0, avgVoltageDrop: 0 })
      return
    }

    const total = powerCutHistory.length
    const totalDurationMs = powerCutHistory.reduce((sum, e) => sum + e.duration, 0)
    const totalDurationMin = Math.round(totalDurationMs / 60000)
    const totalEnergy = powerCutHistory.reduce((sum, e) => sum + (e.energy || 0), 0)
    const avgDrop = powerCutHistory.reduce((sum, e) => sum + e.drop, 0) / total

    setStats({
      total,
      totalDuration: totalDurationMin,
      totalEnergy,
      avgVoltageDrop: avgDrop
    })
  }

  const updateCharts = () => {
    const last10 = powerCutHistory.slice(-10).reverse()
    const labels = last10.map((e, i) => `Event ${powerCutHistory.length - 9 + i}`)

    // Voltage Chart
    setVoltageChart({
      labels,
      datasets: [{
        label: 'Voltage Drop (V)',
        data: last10.map(e => e.drop),
        borderColor: 'rgb(255, 107, 107)',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
        fill: true
      }]
    })

    // Duration Chart
    setDurationChart({
      labels,
      datasets: [{
        label: 'Duration (minutes)',
        data: last10.map(e => (e.duration / 60000).toFixed(2)),
        backgroundColor: 'rgba(157, 78, 221, 0.7)',
        borderColor: 'rgb(157, 78, 221)',
        borderWidth: 2
      }]
    })

    // Energy Chart
    setEnergyChart({
      labels,
      datasets: [{
        label: 'Energy Consumed (mWh)',
        data: last10.map(e => e.energy || 0),
        borderColor: 'rgb(74, 144, 226)',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.4,
        fill: true
      }]
    })
  }

  const filterData = (period) => {
    setFilter(period)
    // Filter logic can be implemented here
  }

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history data?')) {
      setPowerCutHistory([])
      localStorage.removeItem('powerCutHistory')
      updateStats()
      updateCharts()
    }
  }

  const exportData = () => {
    if (powerCutHistory.length === 0) {
      alert('No data to export')
      return
    }

    let csv = 'Event,Date Time,Duration (ms),Duration (min),Start Voltage (V),End Voltage (V),Voltage Drop (V),Energy (mWh)\n'
    
    powerCutHistory.forEach((event, index) => {
      csv += `${index + 1},${event.timestamp},${event.duration},${(event.duration/60000).toFixed(2)},${event.startV},${event.endV},${event.drop},${event.energy || 0}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'power_cut_history_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y.toFixed(2)
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, color: '#ECF0F1' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#ECF0F1' }
      },
      x: {
        title: { display: true, color: '#ECF0F1' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#ECF0F1' }
      }
    }
  }

  return (
    <div className="history-page">
      {/* Statistics Grid */}
      <div className="stats-grid">
        <Card>
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--primary-red)', background: 'rgba(255, 107, 107, 0.1)' }}>
              <i className="fas fa-plug-circle-xmark"></i>
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Power Cuts</div>
        </Card>

        <Card>
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--primary-yellow)', background: 'rgba(255, 215, 0, 0.1)' }}>
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <div className="stat-value">{stats.totalDuration}m</div>
          <div className="stat-label">Total Downtime</div>
        </Card>

        <Card>
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--primary-purple)', background: 'rgba(157, 78, 221, 0.1)' }}>
              <i className="fas fa-bolt"></i>
            </div>
          </div>
          <div className="stat-value">{stats.totalEnergy.toFixed(2)} mWh</div>
          <div className="stat-label">Total Battery Usage</div>
        </Card>

        <Card>
          <div className="stat-header">
            <div className="stat-icon" style={{ color: 'var(--primary-blue)', background: 'rgba(74, 144, 226, 0.1)' }}>
              <i className="fas fa-battery-half"></i>
            </div>
          </div>
          <div className="stat-value">{stats.avgVoltageDrop.toFixed(2)} V</div>
          <div className="stat-label">Avg Voltage Drop</div>
        </Card>
      </div>

      {/* Charts */}
      {voltageChart && (
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-chart-line card-icon" style={{ color: 'var(--primary-red)' }}></i>
              Battery Voltage Drainage Over Time
            </div>
          </div>
          <div className="chart-container">
            <Line data={voltageChart} options={chartOptions} />
          </div>
        </Card>
      )}

      {durationChart && (
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-chart-bar card-icon" style={{ color: 'var(--primary-purple)' }}></i>
              Power Cut Duration Timeline
            </div>
          </div>
          <div className="chart-container">
            <Bar data={durationChart} options={chartOptions} />
          </div>
        </Card>
      )}

      {energyChart && (
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-battery-three-quarters card-icon" style={{ color: 'var(--primary-blue)' }}></i>
              Battery Energy Consumption
            </div>
          </div>
          <div className="chart-container">
            <Line data={energyChart} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-table card-icon" style={{ color: 'var(--primary-green)' }}></i>
            Detailed Power Cut Log
          </div>
          <button className="export-btn" onClick={exportData}>
            <i className="fas fa-download"></i> Export CSV
          </button>
        </div>

        <div className="filter-controls">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => filterData('all')}
          >
            All Events
          </button>
          <button
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => filterData('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
            onClick={() => filterData('week')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
            onClick={() => filterData('month')}
          >
            This Month
          </button>
          <button className="filter-btn" onClick={clearHistory}>
            <i className="fas fa-trash"></i> Clear History
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : powerCutHistory.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-database"></i>
            <p>No power cut events recorded yet</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Start Voltage</th>
                <th>End Voltage</th>
                <th>Voltage Drop</th>
                <th>Energy Used</th>
              </tr>
            </thead>
            <tbody>
              {powerCutHistory.map((event, index) => {
                const durationMin = (event.duration / 60000).toFixed(2)
                const durationClass = durationMin < 1 ? 'duration-short' : durationMin < 5 ? 'duration-medium' : 'duration-long'
                
                return (
                  <tr key={index}>
                    <td>{powerCutHistory.length - index}</td>
                    <td>{event.timestamp}</td>
                    <td>
                      <span className={`duration-badge ${durationClass}`}>
                        {durationMin} min
                      </span>
                    </td>
                    <td>{event.startV.toFixed(2)} V</td>
                    <td>{event.endV.toFixed(2)} V</td>
                    <td className="voltage-drop">-{event.drop.toFixed(2)} V</td>
                    <td className="energy-value">{(event.energy || 0).toFixed(2)} mWh</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

export default History

