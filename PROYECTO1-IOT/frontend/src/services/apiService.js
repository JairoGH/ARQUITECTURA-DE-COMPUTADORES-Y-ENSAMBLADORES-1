class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error ${endpoint}:`, error);
      throw error;
    }
  }

  // Status del backend
  async getStatus() {
    return await this.request('/status');
  }

  // Habitaciones
  async getRooms() {
    return await this.request('/mqtt/rooms');  
  }

  async toggleRoom(room, state) {
    return await this.request(`/mqtt/rooms/${room}/toggle`, {  
      method: 'POST',
      body: JSON.stringify({ state })
    });
  }

  // RGB
  async toggleRgbRoom(state) {
    return await this.request('/mqtt/rgb/toggle', {  
      method: 'POST',
      body: JSON.stringify({ state })
    });
  }

  async setRgbColor(color) {
    return await this.request('/mqtt/rgb/color', { 
      method: 'POST',
      body: JSON.stringify({ color })
    });
  }

  // Porton
  async controlEntrance(action) {
    return await this.request(`/mqtt/entrance/${action}`, {  
      method: 'POST'
    });
  }

  // Ventilador
  async toggleVentilador(state) {
    return await this.request('/mqtt/ventilador/toggle', {  
      method: 'POST',
      body: JSON.stringify({ state })
    });
  }

  // Bomba de agua
  async toggleBombaAgua(state) {
    return await this.request('/mqtt/bomba-agua/toggle', {  
      method: 'POST',
      body: JSON.stringify({ state })
    });
  }

  // Alarma
  async toggleAlarma(state) {
    return await this.request('/mqtt/alarma/toggle', {
      method: 'POST',
      body: JSON.stringify({ state })
    });
  }

  // Alertas
  async getAlerts() {
    return await this.request('/mqtt/alerts');  
  }

  // Prueba
  async testConnection() {
    return await this.request('/mqtt/test', {  
      method: 'POST'
    });
  }
}

export default ApiService;