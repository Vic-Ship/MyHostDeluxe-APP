// admin-app.js
class AdminApp {
    static instance = null;
    
    constructor() {
        if (AdminApp.instance) {
            console.log('AdminApp ya inicializada, retornando instancia existente');
            return AdminApp.instance;
        }
        
        this.SERVER_URL = window.location.origin || "http://127.0.0.1:3001";
        this.API_BASE_URL = `${this.SERVER_URL}/api`;

        // Datos en caché para mejorar rendimiento
        this.cache = {
            agents: [],
            projects: [],
            services: [],
            users: [],
            modules: {}
        };

        this.currentSection = 'dashboard-content';
        this.storageKeys = ['jwtToken', 'token', 'user', 'username', 'role', 'auth_token', 'user_data'];
        this.initialized = false;
        
        // Flags de estado
        this.isLoading = false;
        this.modulesInitializing = new Set();

        console.log('AdminApp: Constructor iniciado');
        console.log('AdminApp: AdminDashboard disponible:', typeof AdminDashboard !== 'undefined');
        console.log('AdminApp: Chart.js disponible:', typeof Chart !== 'undefined');

        AdminApp.instance = this;
    }

    debugLocalStorage() {
        console.log('=== DEBUG LOCALSTORAGE ===');
        console.log('LocalStorage length:', localStorage.length);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`  ${key}:`, value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null');
        }
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const user = localStorage.getItem('user') || localStorage.getItem('currentUser');
        console.log('Token encontrado:', token ? 'SI' : 'NO');
        console.log('User encontrado:', user ? 'SI' : 'NO');
        console.log('=== FIN DEBUG ===');
    }

    init() {
        if (this.initialized) {
            console.log('AdminApp ya inicializada');
            return;
        }
        
        console.log('=== INICIALIZANDO ADMIN APP ===');
        
        if (this.checkAuthentication()) {
            this.setupNavigation();
            this.setupEventListeners();
            this.loadInitialSection();
            this.initialized = true;
            console.log('AdminApp inicializada correctamente');
            
            // Verificar e inicializar el dashboard si es necesario
            this.initializeDashboardIfNeeded();
            
            // Disparar evento de inicialización completa
            this.dispatchEvent('adminAppReady', { app: this });
        } else {
            console.log('Problemas de autenticacion, redirigiendo...');
            setTimeout(() => {
                window.location.href = '../login/index.html';
            }, 1000);
        }
    }

    initializeDashboardIfNeeded() {
        // Verificar si el dashboard necesita inicialización
        if (!window.adminDashboard && typeof AdminDashboard !== 'undefined') {
            console.log('AdminApp: Inicializando AdminDashboard...');
            try {
                window.adminDashboard = new AdminDashboard();
                
                // Inicializar dashboard solo si estamos en la sección del dashboard
                if (this.currentSection === 'dashboard-content') {
                    window.adminDashboard.init().catch(error => {
                        console.error('AdminApp: Error inicializando dashboard:', error);
                    });
                }
            } catch (error) {
                console.error('AdminApp: Error creando AdminDashboard:', error);
            }
        } else if (window.adminDashboard && !window.adminDashboard.initialized && 
                   this.currentSection === 'dashboard-content') {
            // Si existe pero no está inicializado y estamos en dashboard
            window.adminDashboard.init().catch(error => {
                console.error('AdminApp: Error inicializando dashboard existente:', error);
            });
        }
    }

    checkAuthentication() {
        console.log('Verificando autenticacion...');
        
        this.debugLocalStorage();
        
        let token = null;
        let userStr = null;
        
        if (window.authService && typeof window.authService.getToken === 'function') {
            token = window.authService.getToken();
            const currentUser = window.authService.getCurrentUser();
            userStr = currentUser ? JSON.stringify(currentUser) : null;
            console.log('Usando AuthService');
        } else {
            token = localStorage.getItem('token') || localStorage.getItem('authToken');
            userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
            console.log('Usando verificacion manual');
        }
        
        console.log('Token encontrado:', token ? 'SI' : 'NO');
        console.log('Usuario encontrado:', userStr ? 'SI' : 'NO');
        
        if (!token || !userStr) {
            console.log('No se encontraron credenciales');
            this.mostrarToast('No se encontro sesion activa', 'warning');
            return false;
        }

        try {
            const userData = JSON.parse(userStr);
            console.log('Datos del usuario:', userData);
            
            const userRole = userData.role || userData.frontendRole || userData.Role || userData.rol;
            console.log('Rol detectado:', userRole);
            
            if (userRole !== 'admin' && userRole !== 'administrador') {
                console.log('Rol incorrecto para admin:', userRole);
                this.mostrarToast('No tienes permisos de administrador', 'warning');
                
                if (userRole === 'agent' || userRole === 'agente') {
                    setTimeout(() => {
                        window.location.href = '../agente/index.html';
                    }, 1500);
                } else {
                    setTimeout(() => {
                        window.location.href = '../login/index.html';
                    }, 1500);
                }
                return false;
            }
            
            console.log('Usuario autorizado como administrador');
            this.displayUserInfo(userData);
            return true;
            
        } catch (error) {
            console.error('Error parseando usuario:', error);
            this.mostrarToast('Error en los datos de usuario', 'danger');
            return false;
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('Configurando navegacion para', navLinks.length, 'enlaces');
        
        navLinks.forEach(link => {
            // Remover listeners previos para evitar duplicados
            const existingHandler = link.navigationHandler;
            if (existingHandler) {
                link.removeEventListener('click', existingHandler);
            }
            
            const handler = (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-target');
                
                if (!targetSection) {
                    console.error('Enlace sin data-target:', link);
                    return;
                }
                
                console.log('Cambiando a seccion:', targetSection);
                
                this.cleanupPreviousSection();
                this.showSection(targetSection);
            };
            
            // Guardar referencia al handler para poder removerlo después
            link.navigationHandler = handler;
            link.addEventListener('click', handler);
        });
    }

    cleanupPreviousSection() {
    console.log(`Limpiando sección anterior: ${this.currentSection}`);
    
    const cleanupModule = (moduleName) => {
        const module = window[moduleName];
        if (module && typeof module.cleanup === 'function') {
            try {
                console.log(`Limpiando módulo ${moduleName}...`);
                module.cleanup();
                console.log(`Módulo ${moduleName} limpiado exitosamente`);
            } catch (error) {
                console.error(`Error limpiando módulo ${moduleName}:`, error);
                // No propagar el error para permitir continuar
            }
        } else {
            console.log(`Módulo ${moduleName} no disponible o sin método cleanup`);
        }
    };

    switch (this.currentSection) {
        case 'clients-content':
            cleanupModule('adminAgentsUI');
            break;
        case 'services-content':
            cleanupModule('adminServices');
            break;
        case 'projects-content':
            cleanupModule('adminProjects');
            break;
        case 'users-content':
            cleanupModule('adminUsers');
            break;
        case 'dashboard-content':
            cleanupModule('adminDashboard');
            break;
        case 'reports-content':
            cleanupModule('adminReports');
            break;
        case 'config-audit-content':
            cleanupModule('adminConfig');
            break;
        default:
            console.log(`No se encontró módulo para limpiar la sección: ${this.currentSection}`);
    }
}

    showSection(sectionId) {
        // Evitar recargar la misma sección
        if (this.currentSection === sectionId) {
            console.log('Ya se encuentra en la sección:', sectionId);
            return;
        }

        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        } else {
            console.error('Seccion no encontrada:', sectionId);
            return;
        }

        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-target="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        const previousSection = this.currentSection;
        this.currentSection = sectionId;

        this.updateHeaderTitle(sectionId);
        this.loadSectionData(sectionId);
        
        // Disparar evento de cambio de sección
        this.dispatchEvent('adminAppSectionChange', { 
            sectionId: sectionId,
            previousSection: previousSection
        });
    }

    updateHeaderTitle(sectionId) {
        const titleMap = {
            'dashboard-content': 'Panel de control',
            'clients-content': 'Administración de agentes',
            'projects-content': 'Administración de proyectos',
            'services-content': 'Administración de servicios',
            'reports-content': 'Reportes y análisis',
            'users-content': 'Administración de usuarios',
            'config-audit-content': 'Configuración / Auditoría'
        };
        
        const headerTitle = document.getElementById('mainHeaderTitle');
        if (headerTitle) {
            headerTitle.textContent = titleMap[sectionId] || 'Panel de control';
        }
    }

    loadSectionData(sectionId) {
        console.log('Cargando datos para seccion:', sectionId);
        
        // Evitar múltiples cargas simultáneas
        if (this.isLoading) {
            console.log('Ya se está cargando otra sección, esperando...');
            setTimeout(() => this.loadSectionData(sectionId), 100);
            return;
        }
        
        this.isLoading = true;
        
        // Usar requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
            try {
                switch (sectionId) {
                    case 'dashboard-content':
                        this.loadDashboardSection();
                        break;
                    case 'clients-content':
                        this.loadAgentsSection();
                        break;
                    case 'projects-content':
                        this.loadProjectsSection();
                        break;
                    case 'services-content':
                        this.loadServicesSection();
                        break;
                    case 'reports-content':
                        this.loadReportsSection();
                        break;
                    case 'users-content':
                        this.loadUsersSection();
                        break;
                    case 'config-audit-content':
                        this.loadConfigSection();
                        break;
                    default:
                        console.warn('Seccion no reconocida:', sectionId);
                        this.isLoading = false;
                }
            } catch (error) {
                console.error('Error en loadSectionData:', error);
                this.mostrarToast('Error cargando sección: ' + error.message, 'danger');
                this.isLoading = false;
            }
        });
    }

    // Métodos específicos para cargar cada sección
    async loadDashboardSection() {
        console.log('Cargando sección dashboard...');
        
        try {
            // Verificar si el dashboard está disponible
            if (!window.adminDashboard && typeof AdminDashboard !== 'undefined') {
                console.log('Creando instancia de AdminDashboard...');
                window.adminDashboard = new AdminDashboard();
            }
            
            if (window.adminDashboard && typeof window.adminDashboard.loadDashboardData === 'function') {
                await window.adminDashboard.loadDashboardData();
            } else {
                console.warn('Dashboard no disponible para cargar datos');
                this.mostrarToast('El dashboard no está disponible', 'warning');
            }
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            this.mostrarToast('Error al cargar el dashboard: ' + error.message, 'danger');
        } finally {
            this.isLoading = false;
        }
    }

    async loadAgentsSection() {
    try {
        console.log('=== CARGANDO SECCIÓN AGENTES ===');
        
        // Verificar si ya está inicializado
        if (window.adminAgents && typeof window.adminAgents.loadAgents === 'function') {
            console.log('adminAgents ya disponible, cargando datos...');
            await window.adminAgents.loadAgents();
        } else if (typeof window.loadAgentsModule === 'function') {
            // Usar el módulo de carga específico
            console.log('Usando loadAgentsModule...');
            window.adminAgents = await window.loadAgentsModule();
            await window.adminAgents.loadAgents();
        } else if (typeof AdminAgentsUI !== 'undefined') {
            // Crear nueva instancia directamente
            console.log('Creando nueva instancia de AdminAgentsUI...');
            window.adminAgents = new AdminAgentsUI();
            await window.adminAgents.init();
            await window.adminAgents.loadAgents();
        } else {
            // Intentar cargar el script
            console.warn('AdminAgents no disponible, intentando inicializar...');
            await this.initializeModule('agents', 'AdminAgentsUI');
        }
    } catch (error) {
        console.error('Error cargando sección de agentes:', error);
        this.mostrarToast('Error al cargar agentes: ' + error.message, 'danger');
    } finally {
        this.isLoading = false;
    }
}

    async loadProjectsSection() {
        try {
            if (window.adminProjects && typeof window.adminProjects.loadProjects === 'function') {
                await window.adminProjects.loadProjects();
            } else {
                console.warn('adminProjects no disponible, intentando inicializar...');
                await this.initializeModule('projects', 'AdminProjects');
            }
        } catch (error) {
            console.error('Error cargando sección de proyectos:', error);
            this.mostrarToast('Error al cargar proyectos: ' + error.message, 'danger');
        } finally {
            this.isLoading = false;
        }
    }

    async loadServicesSection() {
        console.log('Cargando sección de servicios...');
        
        const loadServices = async () => {
            try {
                // Verificar si ya está inicializado
                if (window.adminServices && window.adminServices.initialized) {
                    console.log('adminServices ya inicializado, recargando datos...');
                    if (typeof window.adminServices.fetchServices === 'function') {
                        await window.adminServices.fetchServices();
                    }
                    return;
                }
                
                // Intentar inicializar el módulo
                await this.initializeModule('services', 'AdminServices');
                
            } catch (error) {
                console.error('Error cargando servicios:', error);
                this.mostrarToast('Error al cargar servicios: ' + error.message, 'danger');
            } finally {
                this.isLoading = false;
            }
        };
        
        await loadServices();
    }

    async loadReportsSection() {
        console.log('Cargando sección de reportes...');
        
        const loadReports = async () => {
            try {
                // Verificar si ya está inicializado
                if (window.adminReports && window.adminReports.initialized) {
                    console.log('adminReports ya inicializado');
                    if (typeof window.adminReports.loadSavedReports === 'function') {
                        await window.adminReports.loadSavedReports();
                    }
                    return;
                }
                
                // Intentar inicializar el módulo
                await this.initializeModule('reports', 'AdminReports');
                
            } catch (error) {
                console.error('Error cargando reportes:', error);
                this.mostrarToast('Error al cargar reportes: ' + error.message, 'danger');
            } finally {
                this.isLoading = false;
            }
        };
        
        await loadReports();
    }

    async loadUsersSection() {
        console.log('=== INICIANDO CARGA SECCIÓN USUARIOS ===');
        
        try {
            // Verificar si ya está inicializado
            if (window.adminUsers && window.adminUsers.initialized) {
                console.log('AdminUsers ya inicializado, recargando datos...');
                if (typeof window.adminUsers.loadUsers === 'function') {
                    await window.adminUsers.loadUsers();
                }
                return;
            }
            
            console.log('AdminUsers no inicializado, llamando a loadUsersModule...');
            
            // Usar la función de inicialización segura
            if (typeof window.loadUsersModule === 'function') {
                const usersModule = await window.loadUsersModule();
                console.log('Módulo de usuarios inicializado:', usersModule);
                if (typeof usersModule.loadUsers === 'function') {
                    await usersModule.loadUsers();
                }
            } else if (typeof window.AdminUsers !== 'undefined') {
                // Fallback: crear instancia directamente
                console.log('Creando instancia directa de AdminUsers...');
                window.adminUsers = new window.AdminUsers();
                await window.adminUsers.init();
                await window.adminUsers.loadUsers();
            } else {
                // Fallback a la inicialización tradicional
                console.log('Usando initializeModule...');
                await this.initializeModule('users', 'AdminUsers');
            }
            
        } catch (error) {
            console.error('Error crítico cargando sección de usuarios:', error);
            this.mostrarToast('Error al cargar usuarios: ' + error.message, 'danger');
            
            // Mostrar mensaje de error en la interfaz
            const usersContent = document.getElementById('users-content');
            if (usersContent) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                errorDiv.innerHTML = `
                    <h4><i class="fas fa-exclamation-triangle"></i> Error cargando usuarios</h4>
                    <p>No se pudo cargar el módulo de usuarios. Por favor, intente nuevamente.</p>
                    <button class="btn btn-sm btn-secondary mt-2" onclick="window.adminApp.reloadSection('users-content')">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                `;
                
                // Limpiar contenido anterior
                usersContent.innerHTML = '';
                usersContent.appendChild(errorDiv);
            }
        } finally {
            this.isLoading = false;
            console.log('=== FIN CARGA SECCIÓN USUARIOS ===');
        }
    }

    // En admin-app.js, función loadConfigSection, corregir:
async loadConfigSection() {
    try {
        console.log('=== INICIANDO CARGA SECCIÓN CONFIGURACIÓN ===');
        
        // Verificar si ya está inicializado
        if (window.adminConfig && window.adminConfig.initialized) {
            console.log('adminConfig ya inicializado, recargando datos...');
            if (typeof window.adminConfig.loadConfig === 'function') {
                await window.adminConfig.loadConfig();
            }
        } else if (typeof window.loadConfigModule === 'function') {
            // Usar la función específica de carga
            console.log('Usando loadConfigModule...');
            const configModule = await window.loadConfigModule();
            console.log('Módulo de configuración inicializado:', configModule);
        } else if (typeof AdminConfig !== 'undefined') {
            // Crear nueva instancia directamente
            console.log('Creando nueva instancia de AdminConfig...');
            window.adminConfig = new AdminConfig();
            await window.adminConfig.init();
        } else {
            console.warn('AdminConfig no disponible, intentando inicializar mediante script...');
            await this.initializeModule('config', 'AdminConfig');
            
            // Verificar si se inicializó correctamente
            if (window.adminConfig && typeof window.adminConfig.loadConfig === 'function') {
                await window.adminConfig.loadConfig();
            }
        }
        
        console.log('Sección de configuración cargada exitosamente');
    } catch (error) {
        console.error('Error cargando sección de configuración:', error);
        this.mostrarToast('Error al cargar configuración: ' + error.message, 'danger');
    } finally {
        this.isLoading = false;
        console.log('=== FIN CARGA SECCIÓN CONFIGURACIÓN ===');
    }
}

    // Método genérico para inicializar módulos
    async initializeModule(moduleKey, className) {
    // Si no se proporciona className, usar el del mapeo
    if (!className && this.currentModuleClass) {
        className = this.currentModuleClass;
        this.currentModuleClass = null;
    }
    
    if (!className) {
        // Mapeo por defecto si no hay className
        const classMap = {
            'agents': 'AdminAgentsUI',
            'projects': 'AdminProjects',
            'services': 'AdminServices',
            'reports': 'AdminReports',
            'users': 'AdminUsers',
            'config': 'AdminConfig'
        };
        className = classMap[moduleKey] || `Admin${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)}`;
    }
    
    console.log(`Inicializando módulo: ${moduleKey} (Clase: ${className})`);
    
    // Evitar múltiples inicializaciones simultáneas
    if (this.modulesInitializing.has(moduleKey)) {
        console.log(`Módulo ${moduleKey} ya se está inicializando...`);
        return;
    }
    
    this.modulesInitializing.add(moduleKey);
    
    try {
        const windowKey = `admin${className.replace('Admin', '')}`;
        
        // Verificar si la clase está disponible globalmente
        if (typeof window[className] !== 'undefined') {
            console.log(`Creando nueva instancia de ${className}...`);
            window[windowKey] = new window[className]();
            
            // Inicializar si tiene método init
            if (typeof window[windowKey].init === 'function') {
                await window[windowKey].init();
                console.log(`${className} inicializado exitosamente`);
            } else {
                console.log(`${className} creado directamente`);
            }
            
            // Cargar datos iniciales si está disponible
            const loadMethod = `load${className.replace('Admin', '')}`;
            if (typeof window[windowKey][loadMethod] === 'function') {
                await window[windowKey][loadMethod]();
            }
        } else {
            console.warn(`${className} no definido, intentando cargar script...`);
            const scriptName = this.getModuleScriptName(windowKey);
            await this.loadModuleScript(scriptName);
            
            // Esperar y verificar si se cargó
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (typeof window[className] !== 'undefined') {
                window[windowKey] = new window[className]();
                if (typeof window[windowKey].init === 'function') {
                    await window[windowKey].init();
                }
            } else {
                throw new Error(`No se pudo cargar el módulo ${moduleKey}. Clase ${className} no disponible después de cargar script.`);
            }
        }
        
        // Guardar en caché
        this.cache.modules[moduleKey] = window[windowKey];
        
    } catch (error) {
        console.error(`Error inicializando módulo ${moduleKey}:`, error);
        this.mostrarToast(`Error inicializando ${moduleKey}: ${error.message}`, 'warning');
    } finally {
        this.modulesInitializing.delete(moduleKey);
    }
}

    getModuleScriptName(windowKey) {
    const moduleMap = {
        'adminAgents': { script: 'admin-agents.js', className: 'AdminAgentsUI' },
        'adminProjects': { script: 'admin-projects.js', className: 'AdminProjects' },
        'adminServices': { script: 'admin-services.js', className: 'AdminServices' },
        'adminReports': { script: 'admin-reports.js', className: 'AdminReports' },
        'adminUsers': { script: 'admin.users.js', className: 'AdminUsers' },
        'adminConfig': { script: 'admin-config.js', className: 'AdminConfig' }
    };
    
    const mapping = moduleMap[windowKey];
    if (mapping) {
        // Guardar el nombre de la clase para usarlo después
        this.currentModuleClass = mapping.className;
        return mapping.script;
    }
    
    return `${windowKey.toLowerCase()}.js`;
}

    displayUserInfo(user) {
        const headerUserName = document.getElementById('headerUserName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserRole = document.getElementById('dropdownUserRole');

        const userName = user.nombre || user.name || user.username || 'Administrador';
        const userRole = 'Administrador';
        
        if (headerUserName) headerUserName.textContent = userName;
        if (dropdownUserName) dropdownUserName.textContent = userName;
        if (dropdownUserRole) {
            dropdownUserRole.textContent = userRole;
        }
        
        console.log('Info administrador mostrada:', { nombre: userName, rol: user.role });
    }

    setupEventListeners() {
        // Toggle del perfil de usuario
        const profileToggle = document.querySelector('.user-profile-toggle');
        if (profileToggle) {
            profileToggle.addEventListener('click', () => {
                document.querySelector('.user-profile')?.classList.toggle('active');
            });
        }

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (event) => {
            const profile = document.querySelector('.user-profile');
            if (profile?.classList.contains('active') && !profile.contains(event.target)) {
                profile.classList.remove('active');
            }
        });

        // Botón de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.logout());
        }

        // Manejar tecla Escape para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        console.log('Event listeners configurados');
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay, .service-modal-overlay, .report-modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    logout() {
        console.log('Cerrando sesion...');
        
        const confirmar = confirm('¿Esta seguro de que desea cerrar sesion?');
        if (!confirmar) return;
        
        if (window.authService && typeof window.authService.logout === 'function') {
            window.authService.logout();
        } else {
            this.storageKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            this.mostrarToast('Sesion cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.href = '../login/index.html';
            }, 1000);
        }
    }

    loadInitialSection() {
        console.log('Cargando seccion inicial:', this.currentSection);
        
        const dashboardSection = document.getElementById('dashboard-content');
        if (dashboardSection) {
            dashboardSection.classList.add('active');
            dashboardSection.style.display = 'block';
        }
        
        // Activar el enlace correspondiente
        const initialLink = document.querySelector(`[data-target="${this.currentSection}"]`);
        if (initialLink) {
            initialLink.classList.add('active');
        }
        
        this.loadSectionData(this.currentSection);
    }

async apiCall(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No hay token disponible');
        }

        const url = `${this.API_BASE_URL}${endpoint}`;
        
        console.log(`API Call: ${url}`);
        console.log('Method:', options.method || 'GET');
        
        const headers = {
            'Authorization': 'Bearer ' + token
        };
        
        // Preparar el body
        let bodyToSend = options.body;
        console.log('Body original tipo:', typeof bodyToSend);
        console.log('Body original:', bodyToSend);
        
        // Si no es FormData y hay body, enviar como JSON
        if (bodyToSend && !(bodyToSend instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            
            // Si es un objeto (no string), convertirlo a JSON
            if (typeof bodyToSend === 'object') {
                try {
                    bodyToSend = JSON.stringify(bodyToSend);
                    console.log('Body convertido a JSON string:', bodyToSend);
                } catch (jsonError) {
                    console.error('Error convirtiendo a JSON:', jsonError);
                    throw new Error('Error formateando datos: ' + jsonError.message);
                }
            } else if (typeof bodyToSend === 'string') {
                // Si ya es string, verificar que sea JSON válido
                try {
                    JSON.parse(bodyToSend);
                    console.log('Body ya es JSON string válido');
                } catch (e) {
                    console.error('String no es JSON válido:', bodyToSend);
                    throw new Error('Body no es JSON válido');
                }
            }
        }
        
        console.log('Headers a enviar:', headers);
        
        const fetchOptions = {
            method: options.method || 'GET',
            headers: headers,
            ...options
        };
        
        // Solo agregar body si existe
        if (bodyToSend !== undefined) {
            fetchOptions.body = bodyToSend;
        }
        
        const response = await fetch(url, fetchOptions);
        console.log(`Response status: ${response.status}`);
        
        if (response.status === 401 || response.status === 403) {
            this.mostrarErrorSesionExpirada();
            throw new Error('Sesión expirada');
        }

        if (!response.ok) {
            let errorDetails = '';
            try {
                const errorData = await response.json();
                errorDetails = JSON.stringify(errorData, null, 2);
            } catch (e) {
                errorDetails = await response.text();
            }
            console.error('Error del servidor:', errorDetails);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        
        if (result && result.success === false) {
            throw new Error(result.error || result.message || 'Error desconocido');
        }
        
        return result;
    } catch (error) {
        console.error('Error en API call:', error);
        throw error;
    }
}

// Método para limpiar sesión completamente
clearSessionCompletely() {
    console.log('Limpiando sesión completamente...');
    
    // Lista completa de posibles keys de sesión
    const allSessionKeys = [
        'token', 'authToken', 'jwtToken', 'access_token', 'refresh_token',
        'user', 'currentUser', 'user_data', 'usuario',
        'username', 'role', 'admin', 'administrador',
        'session', 'session_id', 'auth'
    ];
    
    // Eliminar todas las posibles keys
    allSessionKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // También eliminar por patrones
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('token') || key.includes('auth') || key.includes('user') || key.includes('session')) {
            localStorage.removeItem(key);
        }
    }
    
    // Limpiar authService si existe
    if (window.authService) {
        window.authService.clearSession();
    }
    
    console.log('Sesión limpiada exitosamente');
}
        

    mostrarToast(mensaje = "Operacion exitosa", tipo = "success") {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast ' + tipo;
        
        const styles = { 
            success: {background: "#28a745", color: "#fff"}, 
            danger: {background: "#dc3545", color: "#fff"},
            warning: {background: "#ffc107", color: "#212529"},
            info: {background: "#17a2b8", color: "#fff"}
        };
        
        const style = styles[tipo] || styles.success;
        
        toast.style.cssText = `
            background: ${style.background}; 
            color: ${style.color}; 
            padding: 12px 20px; 
            margin-top: 10px; 
            border-radius: 6px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
            opacity: 1; 
            transition: opacity 0.5s; 
            font-weight: 500; 
            min-width: 250px;
            max-width: 100%;
            word-wrap: break-word;
        `;
        
        toast.textContent = mensaje;
        container.appendChild(toast);

        setTimeout(() => { 
            toast.style.opacity = "0"; 
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 500); 
        }, 4000);
    }

    async loadModuleScript(scriptName) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            const existingScript = document.querySelector(`script[src*="${scriptName}"]`);
            if (existingScript) {
                console.log(`Script ${scriptName} ya cargado`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            
            // Intentar diferentes rutas posibles
            const possiblePaths = [
                `js/${scriptName}`,
                `../js/${scriptName}`,
                `./js/${scriptName}`,
                scriptName,
                `../${scriptName}`,
                `./${scriptName}`
            ];
            
            let currentPathIndex = 0;
            
            const tryNextPath = () => {
                if (currentPathIndex >= possiblePaths.length) {
                    reject(new Error(`No se pudo cargar el script ${scriptName} desde ninguna ruta posible`));
                    return;
                }
                
                const path = possiblePaths[currentPathIndex];
                currentPathIndex++;
                
                console.log(`Intentando cargar script desde: ${path}`);
                script.src = path;
                script.type = 'text/javascript';
                
                script.onload = () => {
                    console.log(`Script ${scriptName} cargado exitosamente desde: ${path}`);
                    resolve();
                };
                
                script.onerror = () => {
                    console.warn(`No se pudo cargar ${scriptName} desde: ${path}`);
                    tryNextPath();
                };
                
                document.head.appendChild(script);
            };
            
            tryNextPath();
        });
    }

    formatearTelefono(numero) {
        if (!numero) return '';
        const limpio = numero.toString().replace(/\D/g, '');
        if (limpio.length === 10) {
            return `(${limpio.slice(0, 3)}) ${limpio.slice(3, 6)}-${limpio.slice(6)}`;
        }
        return limpio;
    }

    cleanup() {
        console.log('Limpiando recursos de AdminApp...');
        
        // Limpiar módulos
        Object.values(this.cache.modules).forEach(module => {
            if (module && typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                } catch (error) {
                    console.error('Error limpiando módulo:', error);
                }
            }
        });
        
        // Limpiar modales
        this.closeAllModals();
        
        // Limpiar toasts
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }
        
        // Resetear estado
        this.isLoading = false;
        this.modulesInitializing.clear();
        
        console.log('AdminApp limpiada correctamente');
    }

    reloadSection(sectionId) {
        console.log('Recargando seccion:', sectionId);
        this.loadSectionData(sectionId);
    }
    
    // Método para disparar eventos personalizados
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
        console.log(`Evento ${eventName} disparado:`, detail);
    }
    
    // Método para inicializar módulos específicos
    async initModule(moduleName) {
        console.log(`Inicializando módulo: ${moduleName}`);
        
        switch(moduleName) {
            case 'services':
                return this.initServicesModule();
            case 'agents':
                return this.initAgentsModule();
            case 'projects':
                return this.initProjectsModule();
            case 'dashboard':
                return this.initDashboardModule();
            case 'reports':
                return this.initReportsModule();
            case 'users':
                return this.initUsersModule();
            case 'config':
                return this.initConfigModule();
            default:
                console.warn(`Módulo ${moduleName} no reconocido`);
                return null;
        }
    }
    
    // Métodos específicos para cada módulo
    async initServicesModule() {
        return this.initializeModule('services', 'AdminServices');
    }
    
    async initAgentsModule() {
        return this.initializeModule('agents', 'AdminAgents');
    }
    
    async initProjectsModule() {
        return this.initializeModule('projects', 'AdminProjects');
    }
    
    async initDashboardModule() {
        // Dashboard ya se maneja de forma especial
        if (!window.adminDashboard && typeof AdminDashboard !== 'undefined') {
            window.adminDashboard = new AdminDashboard();
        }
        if (window.adminDashboard && typeof window.adminDashboard.init === 'function') {
            await window.adminDashboard.init();
        }
        return window.adminDashboard;
    }
    
    async initReportsModule() {
        return this.initializeModule('reports', 'AdminReports');
    }
    
    async initUsersModule() {
        return this.initializeModule('users', 'AdminUsers');
    }
    
    async initConfigModule() {
        return this.initializeModule('config', 'AdminConfig');
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

console.log('admin-app.js cargado, AdminDashboard disponible:', typeof AdminDashboard !== 'undefined');

// Función de inicialización principal
function initializeAdminApp() {
    console.log('=== INICIALIZANDO ADMIN APP DESDE JS ===');
    
    if (window.adminApp) {
        console.log('AdminApp ya está inicializado');
        return window.adminApp;
    }
    
    console.log('Creando instancia de AdminApp...');
    window.adminApp = new AdminApp();
    
    // Inicializar pero no bloquear
    window.adminApp.init();
    
    console.log('AdminApp inicializado exitosamente');
    return window.adminApp;
}

// Inicializar cuando se cargue el script
function initAdminAppOnReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM cargado, inicializando AdminApp...');
            setTimeout(initializeAdminApp, 100);
        });
    } else {
        // Si ya está cargado, inicializar inmediatamente
        console.log('DOM ya cargado, inicializando AdminApp...');
        setTimeout(initializeAdminApp, 100);
    }
}

// Iniciar la inicialización
initAdminAppOnReady();

// Exportar al scope global
if (typeof window !== 'undefined') {
    window.AdminApp = AdminApp;
}

// Funciones globales de ayuda
window.apiCall = async (endpoint, options = {}) => {
    if (!window.adminApp) {
        console.error('AdminApp no está inicializado');
        try {
            await initializeAdminApp();
        } catch (error) {
            throw new Error('AdminApp no está inicializado y no se pudo inicializar: ' + error.message);
        }
    }
    return await window.adminApp.apiCall(endpoint, options);
};

window.mostrarToast = (mensaje, tipo) => {
    if (window.adminApp) {
        window.adminApp.mostrarToast(mensaje, tipo);
    } else {
        console.log('Toast (AdminApp no inicializado):', mensaje);
        // Toast simple de emergencia
        const tempToast = document.createElement('div');
        tempToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 9999;
        `;
        tempToast.textContent = mensaje;
        document.body.appendChild(tempToast);
        setTimeout(() => tempToast.remove(), 4000);
    }
};

window.formatearTelefono = (numero) => {
    if (window.adminApp) {
        return window.adminApp.formatearTelefono(numero);
    }
    return numero || '';
};

// Función de inicialización unificada
function ensureAdminAppReady() {
    return new Promise((resolve, reject) => {
        if (window.adminApp && window.adminApp.initialized) {
            resolve(window.adminApp);
            return;
        }
        
        // Si no existe, crear
        if (!window.adminApp) {
            window.adminApp = new AdminApp();
        }
        
        // Esperar a que se inicialice
        const checkInterval = setInterval(() => {
            if (window.adminApp && window.adminApp.initialized) {
                clearInterval(checkInterval);
                resolve(window.adminApp);
            }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.adminApp || !window.adminApp.initialized) {
                reject(new Error('AdminApp no se inicializó en el tiempo esperado'));
            }
        }, 5000);
    });
}

// Función para cambiar de sección
window.changeAdminSection = (sectionId) => {
    if (window.adminApp) {
        window.adminApp.showSection(sectionId);
    } else {
        console.error('AdminApp no disponible para cambiar sección');
    }
};

// Exponer funciones útiles
window.ensureAdminAppReady = ensureAdminAppReady;
window.initializeAdminApp = initializeAdminApp;

console.log('admin-app.js cargado completamente');

// Diagnóstico
setTimeout(() => {
    console.log('=== DIAGNÓSTICO ADMIN APP ===');
    console.log('AdminApp disponible:', window.adminApp ? 'SI' : 'NO');
    console.log('AdminApp inicializada:', window.adminApp ? window.adminApp.initialized : 'N/A');
    console.log('AdminDashboard disponible:', window.AdminDashboard ? 'SI' : 'NO');
    console.log('Chart.js disponible:', window.Chart ? 'SI' : 'NO');
    console.log('=== FIN DIAGNÓSTICO ===');
}, 2000);