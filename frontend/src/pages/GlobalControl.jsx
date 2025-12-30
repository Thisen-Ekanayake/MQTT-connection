import { useState, useEffect } from 'react'
import { useMQTT, TOPICS } from '../hooks/useMQTT'
import Card from '../components/Card'
import './GlobalControl.css'

function GlobalControl() {
  const { subscribe, publish, isConnected, connectionStatus } = useMQTT()
  
  const [ledStatus, setLedStatus] = useState('OFF')
  const [systemState, setSystemState] = useState(false)
  const [intensityState, setIntensityState] = useState(false)
  
  // Sensor readings
  const [voltage, setVoltage] = useState(0)
  const [current, setCurrent] = useState(0)
  const [power, setPower] = useState(0)
  const [voltage2, setVoltage2] = useState(0)
  const [current2, setCurrent2] = useState(0)
  const [power2, setPower2] = useState(0)
  
  const [powerCutStatus, setPowerCutStatus] = useState('NORMAL')
  const [commandLog, setCommandLog] = useState([])

  // MQTT subscriptions
  useEffect(() => {
    if (!isConnected) return

    const unsubs = []

    unsubs.push(subscribe(TOPICS.STATUS, (msg) => {
      setLedStatus(msg)
    }))

    unsubs.push(subscribe(TOPICS.LED2_STATUS, (msg) => {
      setSystemState(msg === 'ON')
    }))

    unsubs.push(subscribe(TOPICS.LED4_STATUS, (msg) => {
      setIntensityState(msg === 'ON')
    }))

    unsubs.push(subscribe(TOPICS.VOLTAGE, (msg) => {
      setVoltage(parseFloat(msg))
    }))

    unsubs.push(subscribe(TOPICS.CURRENT, (msg) => {
      setCurrent(parseFloat(msg))
    }))

    unsubs.push(subscribe(TOPICS.VOLTAGE2, (msg) => {
      setVoltage2(parseFloat(msg))
    }))

    unsubs.push(subscribe(TOPICS.CURRENT2, (msg) => {
      setCurrent2(parseFloat(msg))
    }))

    unsubs.push(subscribe(TOPICS.POWERCUT, (msg) => {
      setPowerCutStatus(msg)
    }))

    unsubs.push(subscribe(TOPICS.COMMAND, (msg) => {
      if (msg !== 'CLEAR_LOG') {
        addCommandStatus(msg)
      }
    }))

    return () => {
      unsubs.forEach(unsub => unsub && unsub())
    }
  }, [isConnected, subscribe])

  // Calculate power
  useEffect(() => {
    setPower(voltage * (current / 1000.0))
  }, [voltage, current])

  useEffect(() => {
    setPower2(voltage2 * (current2 / 1000.0))
  }, [voltage2, current2])

  const addCommandStatus = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    let type = 'info'
    
    if (message.includes('⚠️') || message.includes('POWER CUT')) {
      type = 'warning'
    } else if (message.includes('✓') || message.includes('Step')) {
      type = 'success'
    } else if (message.includes('🔴') || message.includes('ERROR')) {
      type = 'error'
    }
    
    setCommandLog(prev => {
      const newLog = [...prev, { timestamp, message, type }]
      return newLog.slice(-50)
    })
  }

  const turnOn = () => {
    publish(TOPICS.CONTROL, 'ON')
  }

  const turnOff = () => {
    publish(TOPICS.CONTROL, 'OFF')
  }

  const toggleSystem = () => {
    const newState = !systemState
    setSystemState(newState)
    publish(TOPICS.LED2, newState ? 'ON' : 'OFF')
    
    // Auto turn off intensity when system turns on
    if (newState && intensityState) {
      setIntensityState(false)
      publish(TOPICS.LED4, 'OFF')
    }
  }

  const toggleIntensity = () => {
    const newState = !intensityState
    setIntensityState(newState)
    publish(TOPICS.LED4, newState ? 'ON' : 'OFF')
  }

  return (
    <div className="global-control">
      <div className="control-container">
        <h1>ADVANCE LIGHT INTENSITY MONITOR AND POWER BACKUP SYSTEM</h1>
        <p className="subtitle">Control from anywhere in the world</p>
        
        <div className={`connection-status ${connectionStatus === 'Connected' ? 'connected' : connectionStatus === 'Connecting...' ? 'connecting' : 'disconnected'}`}>
          {connectionStatus === 'Connected' ? '✓ Connected' : connectionStatus}
        </div>
        
        <div className={`led-indicator ${ledStatus === 'ON' ? 'on' : 'off'}`}></div>
        <div className={`status ${ledStatus === 'ON' ? 'on' : 'off'}`}>
          {ledStatus === 'ON' ? '✓ LED is ON' : 'LED is OFF'}
        </div>
        
        <div className="button-group">
          <button
            className="btn btn-on"
            onClick={turnOn}
            disabled={!isConnected}
          >
            💡 Turn ON
          </button>
          <button
            className="btn btn-off"
            onClick={turnOff}
            disabled={!isConnected}
          >
            🔴 Turn OFF
          </button>
        </div>
        
        {/* System Control */}
        <div className="pulse-section">
          <h3>⚡ System On Off</h3>
          <button
            className={`btn ${systemState ? 'btn-success' : 'btn-danger'}`}
            onClick={toggleSystem}
            disabled={!isConnected}
            style={{ width: '100%', margin: '10px 0' }}
          >
            {systemState ? '✓ System ON' : '🔴 System OFF'}
          </button>
          <p style={{ color: '#92400e', textAlign: 'center', fontSize: '0.9em', marginTop: '10px' }}>
            Click to toggle system on GPIO13
          </p>
        </div>
        
        {/* Intensity Control */}
        <div className="pulse-section" style={{ background: '#e9d5ff', border: '2px solid #a855f7' }}>
          <h3 style={{ color: '#7e22ce' }}>⚡ Average Intensity</h3>
          <button
            className={`btn ${intensityState ? 'btn-purple' : 'btn-danger'}`}
            onClick={toggleIntensity}
            disabled={!isConnected}
            style={{ width: '100%', margin: '10px 0' }}
          >
            {intensityState ? '✓ ON' : '🔴 OFF'}
          </button>
          <p style={{ color: '#581c87', textAlign: 'center', fontSize: '0.9em', marginTop: '10px' }}>
            Click to toggle intensity on GPIO14
          </p>
        </div>
        
        {/* Sensor Display */}
        <div className="sensor-section">
          <h3>📊 System Info</h3>
          
          <div className="sensor-group">
            <div className="sensor-group-title">5v system</div>
            <div className="sensor-display">
              <div className="sensor-value">
                <div className="sensor-label">Voltage</div>
                <div className="sensor-reading">
                  {voltage.toFixed(3)}<span className="sensor-unit">V</span>
                </div>
              </div>
              <div className="sensor-value">
                <div className="sensor-label">Current</div>
                <div className="sensor-reading">
                  {current.toFixed(2)}<span className="sensor-unit">mA</span>
                </div>
              </div>
              <div className="sensor-value">
                <div className="sensor-label">Power</div>
                <div className="sensor-reading">
                  {power.toFixed(2)}<span className="sensor-unit">mW</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sensor-group">
            <div className="sensor-group-title">Main Power</div>
            <div className="sensor-display">
              <div className="sensor-value">
                <div className="sensor-label">Voltage</div>
                <div className="sensor-reading">
                  {voltage2.toFixed(3)}<span className="sensor-unit">V</span>
                </div>
              </div>
              <div className="sensor-value">
                <div className="sensor-label">Current</div>
                <div className="sensor-reading">
                  {current2.toFixed(2)}<span className="sensor-unit">mA</span>
                </div>
              </div>
              <div className="sensor-value">
                <div className="sensor-label">Power</div>
                <div className="sensor-reading">
                  {power2.toFixed(2)}<span className="sensor-unit">mW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Power Alert */}
        <div className={`power-alert ${powerCutStatus === 'POWER_CUT' ? 'warning' : 'normal'}`}>
          <h3>
            {powerCutStatus === 'POWER_CUT' ? '⚠️ POWER CUT DETECTED!' : '⚡ Power Status'}
          </h3>
          <div className="power-status-text">
            {powerCutStatus === 'POWER_CUT' ? '⛔ Main Power Below 9V' : '✓ Power Normal'}
          </div>
        </div>
        
        {/* Command Log */}
        <div className="info">
          <h3>📡 How It Works</h3>
          <p><strong>MQTT Broker:</strong> broker.hivemq.com</p>
          <p><strong>Control Topic:</strong> esp32/led/control</p>
          <p><strong>Status Topic:</strong> esp32/led/status</p>
          <p>This page connects to a public MQTT broker and can control your ESP32 from anywhere in the world!</p>
          
          <div className="command-log">
            <h3>📋 Command Status Log</h3>
            <div className="command-log-content">
              {commandLog.length === 0 ? (
                <div className="command-entry">System ready. Waiting for commands...</div>
              ) : (
                commandLog.map((entry, index) => (
                  <div key={index} className={`command-entry ${entry.type}`}>
                    <span className="command-timestamp">[{entry.timestamp}]</span>
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalControl

