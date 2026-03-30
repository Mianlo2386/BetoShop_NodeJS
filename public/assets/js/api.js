// URL del backend en producción
const API_BASE_URL = 'https://betostore-backend.onrender.com';

const api = {
  async get(endpoint) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      return api.get(`/productos${query ? '?' + query : ''}`);
    },
    getById: (id) => api.get(`/productos/${id}`),
    search: (q) => api.get(`/productos/search?q=${encodeURIComponent(q)}`),
    getReleases: (days = 30) => api.get(`/productos/releases?days=${days}`),
    getByCategoria: (categoria) => api.get(`/productos/categoria/${encodeURIComponent(categoria)}`)
  },

  // Auth
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    me: () => api.get('/auth/me'),
    validate: () => api.get('/auth/validate')
  },

  // Carrito
  carrito: {
    get: () => api.get('/carrito'),
    add: (productId, quantity = 1) => api.post('/carrito/add', { productId, quantity }),
    remove: (productId) => api.delete(`/carrito/${productId}`)
  }
};

window.api = api;
