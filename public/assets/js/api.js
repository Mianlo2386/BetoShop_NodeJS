// Backend URL - localhost for local dev, production by default
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001' 
  : 'https://wish-medical-alexandria-huntington.trycloudflare.com';

const api = {
  async get(endpoint) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  async post(endpoint, data) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(endpoint) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // Productos
  productos: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.get(`/api/productos${query ? '?' + query : ''}`);
    },
    getById: (id) => api.get(`/api/productos/${id}`),
    search: (q) => api.get(`/api/productos/search?q=${encodeURIComponent(q)}`),
    getReleases: (days = 30) => api.get(`/api/productos/releases?days=${days}`),
    getByCategoria: (categoria) => api.get(`/api/productos/categoria/${encodeURIComponent(categoria)}`),
    create: (producto) => api.post('/api/productos', producto),
    update: (id, producto) => api.put(`/api/productos/${id}`, producto),
    delete: (id) => api.delete(`/api/productos/${id}`)
  },

  // Auth
  auth: {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    me: () => api.get('/api/auth/me'),
    validate: () => api.get('/api/auth/validate')
  },

  // Carrito
  carrito: {
    get: () => api.get('/api/carrito'),
    add: (productId, quantity = 1) => api.post('/api/carrito/add', { productId, quantity }),
    remove: (productId) => api.delete(`/api/carrito/${productId}`)
  }
};

window.api = api;
