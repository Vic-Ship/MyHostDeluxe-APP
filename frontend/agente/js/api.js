// api.js para panel de agente
window.apiCall = async function(endpoint, options = {}) {
    try {
        console.log(`API Call: ${endpoint}`, options);
        
        // Obtener token de múltiples fuentes posibles
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('access_token');
        
        if (!token) {
            console.error('No hay token de autenticación');
            return {
                success: false,
                error: 'No autenticado',
                message: 'Por favor, inicie sesión nuevamente'
            };
        }
        
        // Configurar headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        // URL base
        const baseUrl = 'http://localhost:3001/api';
        const url = `${baseUrl}${endpoint}`;
        
        // Configurar la petición
        const config = {
            method: options.method || 'GET',
            headers: headers,
            credentials: 'include',
            ...options
        };
        
        // Si hay body, convertirlo a JSON
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        console.log('Enviando petición a:', url, config);
        
        // Realizar la petición
        const response = await fetch(url, config);
        console.log('Respuesta recibida:', response.status);
        
        // Intentar parsear la respuesta como JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.warn('La respuesta no es JSON válido:', e);
            data = {
                success: false,
                error: 'Invalid JSON response',
                message: await response.text()
            };
        }
        
        // Si la respuesta indica token expirado, redirigir al login
        if (response.status === 401 || data.error === 'Token expirado') {
            console.error('Token expirado o inválido');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('agentData');
            
            setTimeout(() => {
                window.location.href = '../login/index.html';
            }, 1000);
            
            return {
                success: false,
                error: 'Token expirado',
                message: 'Por favor, inicie sesión nuevamente'
            };
        }
        
        // Si no es éxito, mostrar error
        if (!response.ok) {
            console.error('Error en la respuesta:', data);
            return {
                success: false,
                error: data.error || `HTTP ${response.status}`,
                message: data.message || 'Error en la petición'
            };
        }
        
        console.log('API Call exitoso:', data);
        return data;
        
    } catch (error) {
        console.error('Error en apiCall:', error);
        return {
            success: false,
            error: 'Network Error',
            message: error.message || 'Error de conexión'
        };
    }
};

// Función auxiliar para obtener datos del usuario desde localStorage
window.getCurrentUser = function() {
    try {
        const userData = localStorage.getItem('agentData') || 
                        localStorage.getItem('currentUser') ||
                        localStorage.getItem('userData');
        
        if (userData) {
            return JSON.parse(userData);
        }
        
        // Intentar decodificar el token JWT
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return {
                    id: payload.userId || payload.id,
                    nombre: payload.nombre || payload.name || 'Agente',
                    apellido: payload.apellido || payload.lastName || '',
                    email: payload.email,
                    role: payload.role || 'agente',
                    username: payload.username
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

// Función para mostrar toasts
window.mostrarToast = function(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#28a745' : 
                     tipo === 'error' ? '#dc3545' : 
                     tipo === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('API functions loaded for agent panel');