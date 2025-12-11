class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.token = storedToken;
            } catch (error) {
                console.error('Error al parsear usuario:', error);
                this.clearSession();
            }
        }
    }

    setSession(user, token) {
        this.currentUser = user;
        this.token = token;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
    }

    logout() {
        this.clearSession();
        window.location.href = '../login/index.html';
    }

    clearSession() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
    }

    isAuthenticated() {
        const user = this.getCurrentUser();
        const token = this.getToken();
        return !!(user && token);
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                } catch (error) {
                    console.error('Error al parsear usuario:', error);
                    this.clearSession();
                    return null;
                }
            }
        }
        return this.currentUser;
    }

    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('authToken') || localStorage.getItem('token');
        }
        return this.token;
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    checkAuth(requiredRole = null) {
        const user = this.getCurrentUser();
        const token = this.getToken();
        
        if (!user || !token) {
            return { 
                authenticated: false, 
                reason: 'no_auth',
                user: null 
            };
        }

        if (requiredRole && user.role !== requiredRole) {
            return { 
                authenticated: false, 
                reason: 'wrong_role',
                user: user 
            };
        }

        return { 
            authenticated: true, 
            reason: 'success',
            user: user 
        };
    }

    redirectToLogin() {
        window.location.href = '../login/index.html';
    }

    // js/auth.js - MODIFICAR el método getAuthHeaders
getAuthHeaders() {
    // OBTENER TOKEN DE MÚLTIPRES FUENTES
    let token = null;
    
    // Prioridad 1: Token actual en memoria
    if (this.token) {
        token = this.token;
    } else {
        // Prioridad 2: Buscar en localStorage con múltiples nombres
        token = localStorage.getItem('authToken') || 
                localStorage.getItem('token') ||
                localStorage.getItem('jwtToken') ||
                localStorage.getItem('access_token');
        
        // Si encontramos token, actualizar la instancia
        if (token) {
            this.token = token;
        }
    }
    
    console.log('AuthService - Token encontrado:', token ? 'SI' : 'NO');
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // También agregar como header alternativo
        headers['x-access-token'] = token;
    }
    
    console.log('AuthService - Headers generados:', headers);
    
    return headers;
}

// AGREGAR método para verificar y refrescar token si es necesario
async validateAndRefreshToken() {
    const token = this.getToken();
    if (!token) {
        return { valid: false, reason: 'no_token' };
    }
    
    try {
        // Intentar hacer una petición simple para validar el token
        const response = await fetch('/api/auth/validate', {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        
        if (response.status === 401) {
            console.log('Token inválido o expirado');
            return { valid: false, reason: 'expired' };
        }
        
        return { valid: true };
    } catch (error) {
        console.error('Error validando token:', error);
        return { valid: false, reason: 'validation_error' };
    }
}
}

window.authService = new AuthService();