class AgentApp {
    constructor() {
        this.currentSection = 'dashboard-content';
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.user = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('Inicializando aplicación del agente...');
        
        try {
            this.setupNavigation();
            this.setupLogout();
            await this.checkAuthentication();
            this.setupSectionObserver();
            this.loadInitialSection();
            
            this.isInitialized = true;
            console.log('Aplicación del agente inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar aplicación:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    setupNavigation() {
        console.log('Configurando navegación...');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-target');
                console.log('Navegando a sección:', targetSection);
                this.showSection(targetSection);
            });
        });
    }

    setupLogout() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    logout() {
        if (confirm('¿Está seguro de que desea cerrar sesión?')) {
            console.log('Cerrando sesión...');
            
            localStorage.removeItem('authToken');
            localStorage.removeItem('agentData');
            sessionStorage.clear();
            
            window.location.href = '../login/index.html';
        }
    }

    showSection(sectionId) {
        console.log('Mostrando sección:', sectionId);
        
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-target="${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            this.updateMainTitle(sectionId);
            
            setTimeout(() => {
                this.loadSectionData(sectionId);
            }, 100);
        } else {
            console.error('Sección no encontrada:', sectionId);
        }
    }

    updateMainTitle(sectionId) {
        const titles = {
            'dashboard-content': 'Panel de control',
            'projects-content': 'Mis Proyectos',
            'clients-content': 'Mis Clientes', 
            'reports-content': 'Mis Reportes',
            'profile-content': 'Mi Perfil'
        };
        
        const mainHeaderTitle = document.getElementById('mainHeaderTitle');
        if (mainHeaderTitle) {
            const baseTitle = titles[sectionId] || 'Panel de agente';
            const userName = this.user ? `${this.user.nombre} ${this.user.apellido}`.trim() : 'Agente';
            mainHeaderTitle.textContent = `${baseTitle} - ${userName}`;
        }
    }

    async loadSectionData(sectionId) {
        console.log('Cargando datos para sección:', sectionId);
        
        switch (sectionId) {
            case 'dashboard-content':
                await this.initializeDashboard();
                break;
            case 'projects-content':
                await this.initializeProjects();
                break;
            case 'clients-content':
                await this.initializeClients();
                break;
            case 'reports-content':
                await this.initializeReports();
                break;
            case 'profile-content':
                await this.initializeProfile();
                break;
        }
    }

    async initializeDashboard() {
        try {
            if (window.agentDashboard) {
                await window.agentDashboard.loadData();
            } else if (window.initializeAgentDashboard) {
                await window.initializeAgentDashboard();
            }
        } catch (error) {
            console.error('Error al inicializar dashboard:', error);
        }
    }

    async initializeProjects() {
        try {
            if (window.agentProjects) {
                await window.agentProjects.loadMyProjects();
            } else if (window.initializeAgentProjects) {
                await window.initializeAgentProjects();
            }
        } catch (error) {
            console.error('Error al inicializar proyectos:', error);
        }
    }

    async initializeClients() {
        try {
            if (window.agentClients) {
                await window.agentClients.loadMyClients();
            } else if (window.initializeAgentClients) {
                await window.initializeAgentClients();
            }
        } catch (error) {
            console.error('Error al inicializar clientes:', error);
        }
    }

    async initializeReports() {
        try {
            if (window.agentReports) {
                await window.agentReports.loadMyReports();
            } else if (window.initializeAgentReports) {
                await window.initializeAgentReports();
            }
        } catch (error) {
            console.error('Error al inicializar reportes:', error);
        }
    }

    async initializeProfile() {
        try {
            if (window.agentProfile) {
                await window.agentProfile.loadProfile();
            } else if (window.initializeAgentProfile) {
                await window.initializeAgentProfile();
            }
        } catch (error) {
            console.error('Error al inicializar perfil:', error);
        }
    }

    async checkAuthentication() {
        console.log('Verificando autenticación...');
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No hay token de autenticación');
            this.redirectToLogin();
            return;
        }

        try {
            await this.loadAgentProfile();
            
        } catch (error) {
            console.error('Error en autenticación:', error);
            
            try {
                const payload = this.parseJWT(token);
                this.user = {
                    nombre: payload.nombre || 'Agente',
                    apellido: payload.apellido || '',
                    role: payload.role || 'agente'
                };
                
                console.log('Usando información básica del token');
                this.displayAgentInfo();
                
            } catch (e) {
                console.error('Token inválido:', e);
                this.redirectToLogin();
            }
        }
    }

    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (e) {
            throw new Error('Token inválido');
        }
    }

    async loadAgentProfile() {
        try {
            console.log('Cargando perfil del agente...');
            
            const response = await window.apiCall('/agent/profile');
            
            if (response && response.success) {
                this.user = response.data;
                console.log('Perfil cargado:', this.user);
                this.displayAgentInfo();
            } else {
                throw new Error(response?.message || 'Error al cargar perfil');
            }
            
        } catch (error) {
            console.error('Error cargando perfil:', error);
            throw error;
        }
    }

    displayAgentInfo() {
        if (!this.user) {
            console.warn('No hay información de usuario para mostrar');
            return;
        }

        console.log('Mostrando información del agente...');
        
        const nombreCompleto = `${this.user.nombre || ''} ${this.user.apellido || ''}`.trim() || 'Agente';
        
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) {
            headerUserName.textContent = nombreCompleto;
        }
        
        const dropdownUserName = document.getElementById('dropdownUserName');
        if (dropdownUserName) {
            dropdownUserName.textContent = nombreCompleto;
        }
        
        const dropdownUserRole = document.getElementById('dropdownUserRole');
        if (dropdownUserRole) {
            const roleDisplay = this.user.role === 'administrador' ? 'Administrador' :
                            this.user.role === 'agente' ? 'Agente' : this.user.role;
            dropdownUserRole.textContent = roleDisplay;
        }
        
        this.setupProfileDropdown();
    }

    setupProfileDropdown() {
        const userProfileToggle = document.querySelector('.user-profile-toggle');
        const userProfile = document.querySelector('.user-profile');
        
        if (userProfileToggle && userProfile) {
            userProfileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userProfile.classList.toggle('active');
            });
            
            document.addEventListener('click', (e) => {
                if (!userProfile.contains(e.target)) {
                    userProfile.classList.remove('active');
                }
            });
        }
    }

    setupSectionObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetId = mutation.target.id;
                    if (targetId && targetId.endsWith('-content')) {
                        if (mutation.target.classList.contains('active')) {
                            console.log('Sección activa cambiada a:', targetId);
                            this.currentSection = targetId;
                            this.loadSectionData(targetId);
                        }
                    }
                }
            });
        });
        
        document.querySelectorAll('.content-section').forEach(section => {
            observer.observe(section, { attributes: true });
        });
    }

    loadInitialSection() {
        const dashboardSection = document.getElementById('dashboard-content');
        if (dashboardSection && !dashboardSection.classList.contains('active')) {
            this.showSection('dashboard-content');
        } else {
            this.loadSectionData(this.currentSection);
        }
    }

    redirectToLogin() {
        console.log('Redirigiendo a login...');
        localStorage.removeItem('authToken');
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 1000);
    }

    showError(message) {
        console.error('Error:', message);
        
        if (window.mostrarToast) {
            window.mostrarToast(message, 'danger');
        } else {
            alert('Error: ' + message);
        }
    }
}