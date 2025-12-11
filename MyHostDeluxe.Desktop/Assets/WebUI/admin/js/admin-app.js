// admin-app.js - Funciones globales de la aplicación
class AdminApp {
    constructor() {
        this.currentSection = 'dashboard-content';
        this.isInitialized = false;
    }

    init() {
        console.log('Inicializando AdminApp...');
        
        // Verificar autenticación
        if (!this.checkAuthentication()) {
            return Promise.reject('No autenticado');
        }

        // Configurar eventos globales
        this.setupGlobalEvents();
        
        // Inicializar navegación
        this.initNavigation();
        
        this.isInitialized = true;
        console.log('AdminApp inicializado');
        
        return Promise.resolve();
    }

    checkAuthentication() {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const user = localStorage.getItem('user') || localStorage.getItem('currentUser');
        
        if (!token || !user) {
            // Redirigir al login
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(JSON.stringify({
                    action: "navigate",
                    page: "login"
                }));
            } else {
                window.location.href = '../login/index.html';
            }
            return false;
        }
        
        return true;
    }

    setupGlobalEvents() {
        // Eventos de logout
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logoutButton')) {
                this.handleLogout();
            }
        });

        // Detectar cambios en el tamaño de ventana
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                this.navigateTo(targetId);
            });
        });
    }

    navigateTo(sectionId) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`[data-target="${sectionId}"]`)?.classList.add('active');
        
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Actualizar título del header
            this.updateHeaderTitle(targetSection);
        }
    }

    updateHeaderTitle(section) {
        const titleElement = document.getElementById('mainHeaderTitle');
        if (!titleElement) return;

        const sectionTitles = {
            'dashboard-content': 'Panel de control',
            'clients-content': 'Administración de agentes',
            'projects-content': 'Administración de proyectos',
            'services-content': 'Administración de servicio',
            'reports-content': 'Reportes y análisis',
            'users-content': 'Administración de usuario',
            'config-audit-content': 'Configuración / Auditoría'
        };

        titleElement.textContent = sectionTitles[section.id] || section.querySelector('.section-title')?.textContent || 'Panel';
    }

    handleLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('currentUser');
            
            // Notificar a la aplicación C#
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(JSON.stringify({
                    action: "logout"
                }));
            } else {
                // Redirigir al login
                window.location.href = '../login/index.html';
            }
        }
    }

    handleResize() {
        // Ajustar gráficos u otros elementos según el tamaño
        console.log('Ventana redimensionada:', window.innerWidth);
    }

    mostrarToast(mensaje, tipo = 'info') {
        // Reutilizar el toast del dashboard si está disponible
        if (window.adminDashboard && typeof window.adminDashboard.mostrarToast === 'function') {
            window.adminDashboard.mostrarToast(mensaje, tipo);
        } else {
            // Implementación simple de toast
            const toast = document.createElement('div');
            toast.className = `toast toast-${tipo}`;
            toast.textContent = mensaje;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 9999;
                min-width: 250px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => toast.style.transform = 'translateX(0)', 10);
            setTimeout(() => {
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
}

window.AdminApp = AdminApp;
