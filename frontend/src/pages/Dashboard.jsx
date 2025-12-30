import { useState, useEffect, useCallback } from 'react'
import { useMQTT, TOPICS } from '../hooks/useMQTT'
import Card from '../components/Card'
import StatusCard from '../components/StatusCard'
import VoltageChart from '../components/VoltageChart'
import './Dashboard.css'

function Dashboard() {
  const { subscribe, publish, isConnected } = useMQTT()
  
  // State management
  const [lightIntensity, setLightIntensity] = useState(0)
  const [systemStatus, setSystemStatus] = useState('OFF')
  const [intensityStatus, setIntensityStatus] = useState('OFF')
  const [ledStatus, setLedStatus] = useState('OFF')
  const [emergencyStatus, setEmergencyStatus] = useState('AUTO')
  
  // Voltage and current readings
  const [backupVoltage, setBackupVoltage] = useState(0)
  const [backupCurrent, setBackupCurrent] = useState(0)
  const [backupPower, setBackupPower] = useState(0)
  const [mainVoltage, setMainVoltage] = useState(0)
  const [mainCurrent, setMainCurrent] = useState(0)
  const [mainPower, setMainPower] = useState(0)
  
  // Power alert
  const [powerAlert, setPowerAlert] = useState({ type: 'normal', title: 'Power Status Normal', text: 'Main power supply operating normally' })
  
  // Chart data - initialize with 60 slots
  const [chartData1, setChartData1] = useState(Array(60).fill(null))
  const [chartLabels1, setChartLabels1] = useState(Array(60).fill(''))
  const [chartData2, setChartData2] = useState(Array(60).fill(null))
  const [chartLabels2, setChartLabels2] = useState(Array(60).fill(''))
  const [dataPointIndex, setDataPointIndex] = useState(0)
  const [avg1, setAvg1] = useState(0)
  const [avg2, setAvg2] = useState(0)
  
  // Command log
  const [commandLog, setCommandLog] = useState([{ timestamp: '[System]', message: 'Dashboard initialized. Connecting to MQTT broker...', type: 'info' }])

  // Update chart data
  const updateChart = useCallback((voltage1, voltage2) => {
    const now = new Date().toLocaleTimeString()
    
    setChartData1(prev => {
      const newData = [...prev]
      if (dataPointIndex < 60) {
        newData[dataPointIndex] = voltage1
      } else {
        newData.shift()
        newData.push(voltage1)
      }
      return newData
    })
    
    setChartLabels1(prev => {
      const newLabels = [...prev]
      if (dataPointIndex < 60) {
        newLabels[dataPointIndex] = now
      } else {
        newLabels.shift()
        newLabels.push(now)
      }
      return newLabels
    })
    
    setChartData2(prev => {
      const newData = [...prev]
      if (dataPointIndex < 60) {
        newData[dataPointIndex] = voltage2
      } else {
        newData.shift()
        newData.push(voltage2)
      }
      return newData
    })
    
    setChartLabels2(prev => {
      const newLabels = [...prev]
      if (dataPointIndex < 60) {
        newLabels[dataPointIndex] = now
      } else {
        newLabels.shift()
        newLabels.push(now)
      }
      return newLabels
    })
    
    if (dataPointIndex < 60) {
      setDataPointIndex(prev => prev + 1)
    }
  }, [dataPointIndex])

  // Calculate averages when chart data changes
  useEffect(() => {
    const valid1 = chartData1.filter(v => v !== null && v !== undefined && v !== 0)
    const valid2 = chartData2.filter(v => v !== null && v !== undefined && v !== 0)
    if (valid1.length > 0) {
      setAvg1(valid1.reduce((a, b) => a + b, 0) / valid1.length)
    }
    if (valid2.length > 0) {
      setAvg2(valid2.reduce((a, b) => a + b, 0) / valid2.length)
    }
  }, [chartData1, chartData2])

  // MQTT subscriptions
  useEffect(() => {
    if (!isConnected) return

    const unsubs = []

    // Light intensity
    unsubs.push(subscribe(TOPICS.LIGHT_INTENSITY, (msg) => {
      setLightIntensity(parseFloat(msg))
    }))

    // LED status
    unsubs.push(subscribe(TOPICS.STATUS, (msg) => {
      setLedStatus(msg)
    }))

    // System status (LED2)
    unsubs.push(subscribe(TOPICS.LED2_STATUS, (msg) => {
      setSystemStatus(msg)
    }))

    // Intensity status (LED4)
    unsubs.push(subscribe(TOPICS.LED4_STATUS, (msg) => {
      setIntensityStatus(msg)
    }))

    // Emergency status
    unsubs.push(subscribe(TOPICS.EMERGENCY_STATUS, (msg) => {
      setEmergencyStatus(msg)
    }))

    // Voltage readings
    unsubs.push(subscribe(TOPICS.VOLTAGE, (msg) => {
      const v = parseFloat(msg)
      setBackupVoltage(v)
      updateChart(v, mainVoltage)
    }))

    unsubs.push(subscribe(TOPICS.VOLTAGE2, (msg) => {
      const v = parseFloat(msg)
      setMainVoltage(v)
      updateChart(backupVoltage, v)
    }))

    // Current readings
    unsubs.push(subscribe(TOPICS.CURRENT, (msg) => {
      setBackupCurrent(parseFloat(msg))
    }))

    unsubs.push(subscribe(TOPICS.CURRENT2, (msg) => {
      setMainCurrent(parseFloat(msg))
    }))

    // Power readings
    unsubs.push(subscribe(TOPICS.POWER, (msg) => {
      setBackupPower(parseFloat(msg))
    }))

    unsubs.push(subscribe(TOPICS.POWER2, (msg) => {
      setMainPower(parseFloat(msg))
    }))

    // Power cut status
    unsubs.push(subscribe(TOPICS.POWERCUT, (msg) => {
      if (msg === 'POWER_CUT') {
        setPowerAlert({
          type: 'danger',
          title: '⚠️ POWER CUT DETECTED!',
          text: 'Main power below 9V. Emergency backup activated.'
        })
        playAlertSound()
        showNotification('⚠️ POWER CUT DETECTED!', 'Main power below 9V. Emergency backup activated.')
      } else {
        setPowerAlert({
          type: 'normal',
          title: 'Power Status Normal',
          text: 'Main power supply operating normally'
        })
        showNotification('✓ Power Restored', 'Main power supply operating normally')
      }
    }))

    // Command log
    unsubs.push(subscribe(TOPICS.COMMAND, (msg) => {
      if (msg === 'CLEAR_LOG') {
        setCommandLog([])
      } else {
        addLog(msg)
      }
    }))

    return () => {
      unsubs.forEach(unsub => unsub && unsub())
    }
  }, [isConnected, subscribe, updateChart, backupVoltage, mainVoltage])

  // Calculate power when voltage/current changes
  useEffect(() => {
    setBackupPower(backupVoltage * (backupCurrent / 1000.0))
  }, [backupVoltage, backupCurrent])

  useEffect(() => {
    setMainPower(mainVoltage * (mainCurrent / 1000.0))
  }, [mainVoltage, mainCurrent])

  // Control functions
  const toggleSystem = () => {
    const newStatus = systemStatus === 'ON' ? 'OFF' : 'ON'
    publish(TOPICS.LED2, newStatus)
    addLog(`System ${newStatus}`, 'info')
  }

  const toggleIntensity = () => {
    const newStatus = intensityStatus === 'ON' ? 'OFF' : 'ON'
    publish(TOPICS.LED4, newStatus)
    addLog(`Intensity Control ${newStatus}`, 'info')
  }

  const turnOn = () => {
    publish(TOPICS.CONTROL, 'ON')
    addLog('LED turned ON', 'success')
  }

  const turnOff = () => {
    publish(TOPICS.CONTROL, 'OFF')
    addLog('LED turned OFF', 'info')
  }

  const emergencyOn = () => {
    publish(TOPICS.EMERGENCY, 'ON')
    addLog('Emergency Light turned ON manually', 'warning')
  }

  const emergencyOff = () => {
    publish(TOPICS.EMERGENCY, 'OFF')
    addLog('Emergency Light turned OFF manually', 'info')
  }

  const emergencyAuto = () => {
    publish(TOPICS.EMERGENCY, 'AUTO')
    addLog('Emergency Light returned to AUTO mode', 'success')
  }

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setCommandLog(prev => {
      const newLog = [...prev, { timestamp, message, type }]
      return newLog.slice(-50) // Keep last 50 entries
    })
  }

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.log('Audio play failed:', e)
    }
  }

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="dashboard">
      {/* Power Alert */}
      <div className={`power-alert ${powerAlert.type}`}>
        <i className="fas fa-plug" style={{ fontSize: '1.5rem' }}></i>
        <div>
          <strong>{powerAlert.title}</strong>
          <div>{powerAlert.text}</div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Light Intensity Gauge */}
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-sun card-icon" style={{ color: 'var(--primary-yellow)' }}></i>
              Light Intensity
            </div>
          </div>
          <div className="gauge-container">
            <div className="gauge-value">
              <div className="gauge-number">{lightIntensity.toFixed(0)}</div>
              <div className="gauge-unit">%</div>
            </div>
          </div>
          <div className="status-label" style={{ textAlign: 'center' }}>Current Reading</div>
        </Card>

        {/* System Status */}
        <StatusCard
          title="System Status"
          icon="fa-toggle-on"
          iconColor="var(--primary-blue)"
          value="System"
          label={systemStatus === 'ON' ? 'ACTIVE' : 'INACTIVE'}
          indicator={systemStatus === 'ON' ? 'status-on' : 'status-off'}
        >
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={systemStatus === 'ON'}
              onChange={toggleSystem}
            />
            <span className="toggle-slider"></span>
          </label>
        </StatusCard>

        {/* Intensity Control */}
        <StatusCard
          title="Average Intensity"
          icon="fa-adjust"
          iconColor="var(--primary-yellow)"
          value="Control"
          label={intensityStatus === 'ON' ? 'ACTIVE' : 'INACTIVE'}
          indicator={intensityStatus === 'ON' ? 'status-on' : 'status-off'}
        >
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={intensityStatus === 'ON'}
              onChange={toggleIntensity}
            />
            <span className="toggle-slider"></span>
          </label>
        </StatusCard>

        {/* Main Power */}
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-bolt card-icon" style={{ color: 'var(--primary-green)' }}></i>
              Main Power
            </div>
          </div>
          <div className="status-value" style={{ color: 'var(--primary-green)' }}>
            {mainVoltage.toFixed(2)} V
          </div>
          <div className="status-label">
            <i className="fas fa-plug-circle-bolt"></i> {mainCurrent.toFixed(2)} mA
          </div>
          <div className="status-label">
            <i className="fas fa-fire"></i> {mainPower.toFixed(2)} mW
          </div>
        </Card>

        {/* Battery Backup */}
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-battery-three-quarters card-icon" style={{ color: 'var(--primary-blue)' }}></i>
              5v system
            </div>
          </div>
          <div className="status-value" style={{ color: 'var(--primary-blue)' }}>
            {backupVoltage.toFixed(2)} V
          </div>
          <div className="status-label">
            <i className="fas fa-bolt-lightning"></i> {backupCurrent.toFixed(2)} mA
          </div>
          <div className="status-label">
            <i className="fas fa-fire"></i> {backupPower.toFixed(2)} mW
          </div>
        </Card>

        {/* LED Control */}
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-lightbulb card-icon" style={{ color: 'var(--primary-yellow)' }}></i>
              LED Control
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <span className={`status-indicator ${ledStatus === 'ON' ? 'status-on' : 'status-off'}`}></span>
            <span>{ledStatus}</span>
          </div>
          <div className="control-buttons">
            <button className="control-btn btn-success" onClick={turnOn}>
              <i className="fas fa-power-off"></i> ON
            </button>
            <button className="control-btn btn-danger" onClick={turnOff}>
              <i className="fas fa-power-off"></i> OFF
            </button>
          </div>
        </Card>

        {/* Emergency Light Control */}
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-exclamation-triangle card-icon" style={{ color: 'var(--primary-red)' }}></i>
              Emergency Light (GPIO27)
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <span className={`status-indicator ${
              emergencyStatus === 'ON' ? 'status-on' : 
              emergencyStatus === 'OFF' ? 'status-off' : 
              'status-warning'
            }`}></span>
            <span>{emergencyStatus === 'ON' ? 'ON (Manual)' : emergencyStatus === 'OFF' ? 'OFF (Manual)' : 'AUTO'}</span>
          </div>
          <div className="control-buttons">
            <button className="control-btn btn-success" onClick={emergencyOn}>
              <i className="fas fa-lightbulb"></i> ON
            </button>
            <button className="control-btn btn-danger" onClick={emergencyOff}>
              <i className="fas fa-lightbulb-slash"></i> OFF
            </button>
            <button className="control-btn btn-warning" onClick={emergencyAuto}>
              <i className="fas fa-sync-alt"></i> AUTO
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
            Manual override for power backup light
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-battery-three-quarters card-icon" style={{ color: 'var(--primary-blue)' }}></i>
              5v System - Real-time
            </div>
          </div>
          <VoltageChart
            data={chartData1}
            labels={chartLabels1}
            color="rgb(74, 144, 226)"
            average={avg1}
          />
        </Card>

        <Card>
          <div className="card-header">
            <div className="card-title">
              <i className="fas fa-plug card-icon" style={{ color: 'var(--primary-green)' }}></i>
              Main Power - Real-time
            </div>
          </div>
          <VoltageChart
            data={chartData2}
            labels={chartLabels2}
            color="rgb(80, 200, 120)"
            average={avg2}
          />
        </Card>
      </div>

      {/* Command Log */}
      <Card style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fas fa-terminal card-icon" style={{ color: 'var(--primary-green)' }}></i>
            Command Status Log
          </div>
        </div>
        <div className="command-log">
          {commandLog.map((entry, index) => (
            <div key={index} className={`log-entry ${entry.type}`}>
              <span className="log-timestamp">[{entry.timestamp}]</span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Dashboard

