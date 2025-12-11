// shared/js/api.js - Versión actualizada
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
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

            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Métodos conveniencia
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET'
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Crear la instancia global
window.apiService = new ApiService();

// También proveer window.apiCall para compatibilidad
window.apiCall = async function(endpoint, options = {}) {
    const apiService = window.apiService;
    const method = options.method || 'GET';
    
    switch (method.toUpperCase()) {
        case 'POST':
            return apiService.post(endpoint, options.body || {});
        case 'PUT':
            return apiService.put(endpoint, options.body || {});
        case 'DELETE':
            return apiService.delete(endpoint);
        default:
            return apiService.get(endpoint);
    }
};

// Función auxiliar para obtener usuario
window.getCurrentUser = function() {
    try {
        const userData = localStorage.getItem('agentData') || 
                        localStorage.getItem('currentUser') ||
                        localStorage.getItem('userData');
        
        if (userData) {
            return JSON.parse(userData);
        }
        
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return {
                    id: payload.userId || payload.id,
                    nombre: payload.nombre || payload.name || 'Usuario',
                    apellido: payload.apellido || payload.lastName || '',
                    email: payload.email,
                    role: payload.role || 'user'
                };
            } catch (e) {
                console.error('Error decodificando token:', e);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
};

console.log('API Service loaded with apiCall function');