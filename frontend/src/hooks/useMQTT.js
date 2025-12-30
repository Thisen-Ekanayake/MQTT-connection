import { useEffect, useState, useRef, useCallback } from 'react'
import mqtt from 'mqtt'

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt'

export const TOPICS = {
  CONTROL: 'esp32/led/control',
  STATUS: 'esp32/led/status',
  LED2: 'esp32/led2/control',
  LED2_STATUS: 'esp32/led2/status',
  LED4: 'esp32/led4/control',
  LED4_STATUS: 'esp32/led4/status',
  VOLTAGE: 'esp32/sensor/voltage',
  CURRENT: 'esp32/sensor/current',
  POWER: 'esp32/sensor/power',
  VOLTAGE2: 'esp32/sensor2/voltage',
  CURRENT2: 'esp32/sensor2/current',
  POWER2: 'esp32/sensor2/power',
  POWERCUT: 'esp32/powercut/status',
  COMMAND: 'esp32/command/status',
  EMERGENCY: 'esp32/emergency/control',
  EMERGENCY_STATUS: 'esp32/emergency/status',
  HISTORY: 'esp32/history/powercut',
  LIGHT_INTENSITY: 'esp32/light/intensity',
  BATTERY_PCT: 'esp32/sensor/battery_pct',
}

export function useMQTT() {
  const [client, setClient] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const messageHandlers = useRef(new Map())

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER, {
      clientId: 'Dashboard_' + Math.random().toString(16).substr(2, 8),
      clean: true,
      reconnectPeriod: 1000
    })

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker')
      setIsConnected(true)
      setConnectionStatus('Connected')
      
      // Subscribe to all topics
      Object.values(TOPICS).forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
          if (!err) console.log('Subscribed to:', topic)
        })
      })
    })

    mqttClient.on('message', (topic, message) => {
      const msg = message.toString()
      const handlers = messageHandlers.current.get(topic)
      if (handlers) {
        handlers.forEach(handler => handler(msg, topic))
      }
    })

    mqttClient.on('error', (error) => {
      console.error('MQTT Error:', error)
      setConnectionStatus('Disconnected')
      setIsConnected(false)
    })

    mqttClient.on('offline', () => {
      setConnectionStatus('Offline')
      setIsConnected(false)
    })

    mqttClient.on('reconnect', () => {
      setConnectionStatus('Connecting...')
    })

    setClient(mqttClient)

    return () => {
      if (mqttClient) {
        mqttClient.end()
      }
    }
  }, [])

  const subscribe = useCallback((topic, handler) => {
    if (!client) return () => {}

    if (!messageHandlers.current.has(topic)) {
      messageHandlers.current.set(topic, [])
    }
    messageHandlers.current.get(topic).push(handler)

    return () => {
      const handlers = messageHandlers.current.get(topic)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }, [client])

  const publish = useCallback((topic, message) => {
    if (client && client.connected) {
      client.publish(topic, message)
      console.log('Published:', topic, message)
    } else {
      console.warn('MQTT client not connected')
    }
  }, [client])

  return {
    client,
    isConnected,
    connectionStatus,
    subscribe,
    publish
  }
}

