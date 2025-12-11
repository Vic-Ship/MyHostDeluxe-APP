// admin.dashboard.js
class AdminDashboard {
    constructor() {
        this.initialized = false;
        this.charts = {};
        this.currentData = null;
    }

    init() {
        console.log('Inicializando AdminDashboard...');
        
        // Actualizar información del usuario
        this.updateUserInfo();
        
        // Cargar datos del dashboard
        this.loadDashboardData();
        
        // Configurar eventos
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('AdminDashboard inicializado');
        
        return Promise.resolve();
    }

    updateUserInfo() {
        try {
            const userData = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            // Actualizar elementos de la interfaz
            const userName = userData.name || userData.email || 'Usuario';
            const userRole = userData.role || userData.frontendRole || 'Administrador';
            
            document.querySelectorAll('#headerUserName, #dropdownUserName').forEach(el => {
                if (el) el.textContent = userName;
            });
            
            const roleElement = document.getElementById('dropdownUserRole');
            if (roleElement) roleElement.textContent = userRole;
            
            console.log('Información de usuario actualizada:', { userName, userRole });
        } catch (error) {
            console.error('Error actualizando información de usuario:', error);
        }
    }

    loadDashboardData() {
        console.log('Cargando datos del dashboard...');
        
        // Mostrar loader
        this.showLoader(true);
        
        // Aquí implementarás la llamada a la API real
        // Por ahora, usar datos mock
        setTimeout(() => {
            this.loadMockData();
            this.showLoader(false);
        }, 1000);
        
        return Promise.resolve();
    }

    loadMockData() {
        // Datos mock para el dashboard
        const mockData = {
            totalProyectos: 156,
            ingresosMes: 45280,
            agentesActivos: 23,
            tareasPendientes: 42,
            completadosSemana: 18,
            tendenciaProyectos: 12,
            tendenciaIngresos: 8,
            agentsChange: 3,
            pendingTrend: 27,
            weeklyTrend: 4
        };

        // Actualizar tarjetas
        Object.keys(mockData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (key.includes('ingresos')) {
                    element.textContent = `$${mockData[key].toLocaleString()}`;
                } else {
                    element.textContent = mockData[key];
                }
            }
        });

        // Crear gráficos mock
        this.createMockCharts();
        
        // Actualizar tabla de proyectos recientes
        this.updateRecentProjectsTable();
        
        this.currentData = mockData;
    }

    createMockCharts() {
        // Gráfico de ventas mensuales
        const ventasCtx = document.getElementById('chartVentasMes');
        if (ventasCtx) {
            if (this.charts.ventas) this.charts.ventas.destroy();
            
            this.charts.ventas = new Chart(ventasCtx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    datasets: [{
                        label: 'Ingresos ($)',
                        data: [32000, 28000, 35000, 42000, 38000, 45000, 52000, 48000, 55000, 52000, 58000, 62000],
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        }

        // Gráfico de agentes por sucursal
        const agentesCtx = document.getElementById('chartAgentesSucursal');
        if (agentesCtx) {
            if (this.charts.agentes) this.charts.agentes.destroy();
            
            this.charts.agentes = new Chart(agentesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Managua', 'San Benito', 'Jinotepe', 'León'],
                    datasets: [{
                        data: [45, 30, 15, 10],
                        backgroundColor: [
                            '#f97316',
                            '#3b82f6',
                            '#10b981',
                            '#8b5cf6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }

        // Gráfico de estado laboral
        const estadoCtx = document.getElementById('chartAgentesEstado');
        if (estadoCtx) {
            if (this.charts.estado) this.charts.estado.destroy();
            
            this.charts.estado = new Chart(estadoCtx, {
                type: 'bar',
                data: {
                    labels: ['Activos', 'Inactivos', 'Vacaciones', 'Capacitación'],
                    datasets: [{
                        label: 'Agentes',
                        data: [18, 3, 1, 1],
                        backgroundColor: [
                            '#10b981',
                            '#ef4444',
                            '#f59e0b',
                            '#3b82f6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }

    updateRecentProjectsTable() {
        const tableBody = document.getElementById('finishedProjectsTableBody');
        if (!tableBody) return;

        const mockProjects = [
            { servicio: 'Web Corporativo', agente: 'María González', monto: 2500, fecha: '2025-12-08', estado: 'Completado' },
            { servicio: 'Diseño Logotipo', agente: 'Carlos Ruiz', monto: 800, fecha: '2025-12-07', estado: 'Completado' },
            { servicio: 'Marketing Digital', agente: 'Ana Martínez', monto: 1200, fecha: '2025-12-06', estado: 'Completado' },
            { servicio: 'Redes Sociales', agente: 'Pedro Sánchez', monto: 950, fecha: '2025-12-05', estado: 'Completado' },
            { servicio: 'Video Corporativo', agente: 'Laura Díaz', monto: 3200, fecha: '2025-12-04', estado: 'Completado' }
        ];

        tableBody.innerHTML = '';
        mockProjects.forEach(proj => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${proj.servicio}</td>
                <td>${proj.agente}</td>
                <td>$${proj.monto.toLocaleString()}</td>
                <td>${proj.fecha}</td>
                <td><span class="badge badge-success">${proj.estado}</span></td>
            `;
            tableBody.appendChild(row);
        });
    }

    setupEventListeners() {
        // Botón de logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Botón de actualizar dashboard
        const refreshButton = document.getElementById('btnRefreshDashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => this.loadDashboardData());
        }

        // Botón de exportar
        const exportButton = document.getElementById('btnExportDashboard');
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportDashboardData());
        }

        // Navegación del sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-target');
                this.showSection(target);
            });
        });
    }

    showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Actualizar el título principal
            const titleElement = document.getElementById('mainHeaderTitle');
            if (titleElement) {
                const sectionName = targetSection.querySelector('.section-title')?.textContent || 
                                  link.textContent || 
                                  'Panel';
                titleElement.textContent = sectionName;
            }
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Enviar mensaje a la aplicación C#
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(JSON.stringify({
                    action: "logout"
                }));
            } else {
                // Fallback para navegador web
                localStorage.clear();
                window.location.href = '../login/index.html';
            }
        }
    }

    exportDashboardData() {
        if (!this.currentData) {
            this.mostrarToast('No hay datos para exportar', 'warning');
            return;
        }

        // Crear un workbook de Excel
        const wb = XLSX.utils.book_new();
        
        // Crear hoja de datos
        const wsData = [
            ['Métrica', 'Valor'],
            ['Proyectos Totales', this.currentData.totalProyectos],
            ['Ingresos del Mes', `$${this.currentData.ingresosMes}`],
            ['Agentes Activos', this.currentData.agentesActivos],
            ['Proyectos Pendientes', this.currentData.tareasPendientes],
            ['Completados Esta Semana', this.currentData.completadosSemana],
            ['Tendencia Proyectos', `${this.currentData.tendenciaProyectos}%`],
            ['Tendencia Ingresos', `${this.currentData.tendenciaIngresos}%`]
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
        
        // Exportar
        XLSX.writeFile(wb, `Dashboard_${new Date().toISOString().slice(0,10)}.xlsx`);
        
        this.mostrarToast('Dashboard exportado exitosamente', 'success');
    }

    showLoader(show) {
        const loader = document.getElementById('dashboardLoader');
        if (loader) {
            loader.classList.toggle('hidden', !show);
        }
    }

    mostrarToast(mensaje, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${mensaje}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Botón de cerrar
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
}

// Hacer disponible globalmente
window.AdminDashboard = AdminDashboard;
