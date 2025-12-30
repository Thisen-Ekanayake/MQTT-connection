const API_BASE = '/api'

export const api = {
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = `${API_BASE}${endpoint}${queryString ? `?${queryString}` : ''}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`API GET ${endpoint} error:`, error)
      throw error
    }
  },

  async getSensorReadings(params = {}) {
    return this.get('/sensor-readings', params)
  },

  async getPowerCutEvents(params = {}) {
    return this.get('/power-cut-events', params)
  },

  async getCommandLogs(params = {}) {
    return this.get('/command-logs', params)
  },

  async getStatistics(params = {}) {
    return this.get('/statistics', params)
  },

  async getHealth() {
    return this.get('/health')
  }
}

