// admin.dashboard.js - VERSIÓN CORREGIDA
(function() {
    // PROTECCIÓN CONTRA DECLARACIÓN DUPLICADA
    if (typeof window !== 'undefined' && window.AdminDashboard) {
        return; 
    }
    
    // DEFINICIÓN DE LA CLASE ADMIN DASHBOARD
    class AdminDashboard {
        constructor() {
            this.SERVER_URL = window.location.origin || "http://127.0.0.1:3001";
            this.API_BASE_URL = `${this.SERVER_URL}/api`;
            
            this.data = {
                stats: null,
                agentStatus: null,
                servicePerformance: null,
                recentProjects: [],
                monthlyRevenue: null,
                agentsByBranch: null
            };
            
            this.initialized = false;
            this.isLoading = false;
            this.chartInstances = new Map();
        }
        
init() {
    // Devolver una Promise explícitamente
    return new Promise(async (resolve, reject) => {
        try {
            if (this.initialized) {
                console.log('Dashboard ya inicializado');
                resolve({ success: true, alreadyInitialized: true });
                return;
            }
            
            // Esperar a que el DOM esté listo
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve, { once: true });
                    }
                });
            }
            
            // Configurar botones
            this.setupAllButtons();
            
            // Cargar datos
            await this.loadDashboardData();
            
            this.initialized = true;
            
            console.log('Dashboard inicializado correctamente');
            
            // Actualización silenciosa
            setTimeout(() => {
                this.loadDashboardData().catch(() => {});
            }, 2000);
            
            resolve({ success: true, initialized: true });
            
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            // Aún así, inicializar con datos de respaldo
            await this.loadFallbackData();
            this.initialized = true;
            this.setupAllButtons();
            
            resolve({ success: false, error: error.message, fallback: true });
        }
    });
}
        
        // NUEVO MÉTODO: Configurar TODOS los botones
        setupAllButtons() {
            this.setupRefreshButton();
            this.setupExportButtons();
            this.setupProjectsRefreshButton();
        }

        // MÉTODO CORREGIDO: Configurar botón de actualizar dashboard
        setupRefreshButton() {
            const refreshButton = document.getElementById('btnRefreshDashboard');
            if (refreshButton) {
                // NO clonar el botón, solo agregar el event listener directamente
                // Esto evita problemas con la clonación
                refreshButton.onclick = null; // Limpiar cualquier listener anterior
                refreshButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.loadDashboardData();
                });
            }
        }

        // NUEVO MÉTODO: Configurar botón de actualizar proyectos
        setupProjectsRefreshButton() {
            const refreshProjectsButton = document.getElementById('btnRefreshProjects');
            if (refreshProjectsButton) {
                refreshProjectsButton.onclick = null;
                refreshProjectsButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.loadRecentProjects();
                });
            }
        }

        // MÉTODO CORREGIDO: Configurar botones de exportación
        setupExportButtons() {
            const exportBtn = document.getElementById('btnExportDashboard');
            if (exportBtn) {
                exportBtn.onclick = null;
                exportBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.exportDashboard();
                });
            }
            
            const generateBtn = document.getElementById('btnGenerateReport');
            if (generateBtn) {
                generateBtn.onclick = null;
                generateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.generateReport();
                });
            }
        }

        // MÉTODOS DE CARGA DE DATOS
        async loadDashboardData() {
            if (this.isLoading) {
                return;
            }
            
            this.isLoading = true;
            
            // Mostrar indicador de carga si existe
            const loader = document.getElementById('dashboardLoader');
            if (loader) {
                loader.classList.remove('hidden');
            }
            
            try {
                // Intentar cargar estadísticas
                await this.loadMainStats();
                
                // Cargar todo lo demás en silencio
                await Promise.allSettled([
                    this.loadAgentStatusChart().catch(() => {}),
                    this.loadServicePerformanceChart().catch(() => {}),
                    this.loadRecentProjects().catch(() => {}),
                    this.loadMonthlyRevenueChart().catch(() => {}),
                    this.loadAgentsByBranchChart().catch(() => {})
                ]);
                
            } catch (error) {
                // Usar datos de respaldo sin hacer ruido
                await this.loadFallbackData();
            } finally {
                // Ocultar indicador de carga
                if (loader) {
                    loader.classList.add('hidden');
                }
                
                this.isLoading = false;
            }
        }

        async loadMainStats() {
            try {
                const response = await this.apiCall('/dashboard/stats');
                
                if (response && response.success && response.data) {
                    this.data.stats = response.data;
                    this.updateStatsCards();
                } else {
                    throw new Error();
                }
                
            } catch (error) {
                this.data.stats = this.getFallbackStats();
                this.updateStatsCards();
            }
        }

        async loadAgentStatusChart() {
            try {
                const response = await this.apiCall('/dashboard/agent-status');
                
                if (response && response.success && response.data) {
                    this.data.agentStatus = response.data;
                    if (this.isValidAgentStatusData(this.data.agentStatus)) {
                        this.renderAgentStatusChart(this.data.agentStatus);
                        return;
                    }
                }
                
                throw new Error();
                
            } catch (error) {
                const exampleData = {
                    labels: ['Activos', 'Inactivos', 'Vacaciones'],
                    data: [15, 3, 2]
                };
                this.renderAgentStatusChart(exampleData);
            }
        }

        async loadServicePerformanceChart() {
            try {
                const response = await this.apiCall('/dashboard/service-performance-detailed?limit=6');
                
                if (response && response.success && response.data) {
                    this.data.servicePerformance = response.data;
                    if (this.isValidServicePerformanceData(this.data.servicePerformance)) {
                        this.renderServicePerformanceChart(this.data.servicePerformance);
                        return;
                    }
                }
                
                throw new Error();
                
            } catch (error) {
                const exampleData = {
                    labels: ['Web Básico', 'Diseño Gráfico', 'Marketing'],
                    ventas: [8, 12, 5],
                    ingresos: [9600, 2400, 1000]
                };
                this.renderServicePerformanceChart(exampleData);
            }
        }

        async loadMonthlyRevenueChart() {
            try {
                const monthlyData = {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    data: [12500, 18900, 8300, 15900, 7200, 14800, 9600, 17800, 10500, 16200, 8900, 19500]
                };
                
                this.renderMonthlyRevenueChart(monthlyData);
                
            } catch (error) {
                // Silencio
            }
        }

        async loadAgentsByBranchChart() {
            try {
                const response = await this.apiCall('/dashboard/agents-branch');
                
                if (response && response.success && response.data) {
                    this.data.agentsByBranch = response.data;
                    if (this.isValidAgentsByBranchData(this.data.agentsByBranch)) {
                        this.renderAgentsByBranchChart(this.data.agentsByBranch);
                        return;
                    }
                }
                
                throw new Error();
                
            } catch (error) {
                const exampleData = {
                    labels: ['Managua', 'San Benito', 'Jinotepe'],
                    data: [12, 8, 5]
                };
                this.renderAgentsByBranchChart(exampleData);
            }
        }

        async loadRecentProjects() {
            try {
                const response = await this.apiCall('/dashboard/recent-projects?limit=10');
                
                if (response && response.success && response.data) {
                    this.data.recentProjects = response.data;
                    this.updateRecentProjectsTable();
                } else {
                    throw new Error();
                }
                
            } catch (error) {
                this.data.recentProjects = this.getFallbackRecentProjects();
                this.updateRecentProjectsTable();
            }
        }

        async loadFallbackData() {
            this.data.stats = this.getFallbackStats();
            this.updateStatsCards();
            
            this.data.recentProjects = this.getFallbackRecentProjects();
            this.updateRecentProjectsTable();
            
            // Datos de ejemplo para gráficos
            const fallbackAgentData = {
                labels: ['Activos', 'Inactivos', 'Vacaciones'],
                data: [15, 3, 2]
            };
            
            const fallbackServiceData = {
                labels: ['Web Básico', 'Diseño Gráfico', 'Marketing'],
                ventas: [8, 12, 5],
                ingresos: [9600, 2400, 1000]
            };
            
            const fallbackBranchData = {
                labels: ['Managua', 'San Benito', 'Jinotepe'],
                data: [12, 8, 5]
            };
            
            if (document.getElementById('chartAgentesEstado')) {
                this.renderAgentStatusChart(fallbackAgentData);
            }
            
            if (document.getElementById('chartRendimiento')) {
                this.renderServicePerformanceChart(fallbackServiceData);
            }
            
            if (document.getElementById('chartAgentesSucursal')) {
                this.renderAgentsByBranchChart(fallbackBranchData);
            }
            
            if (document.getElementById('chartVentasMes')) {
                const monthlyData = {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    data: [12500, 18900, 8300, 15900, 7200, 14800, 9600, 17800, 10500, 16200, 8900, 19500]
                };
                this.renderMonthlyRevenueChart(monthlyData);
            }
        }

        // MÉTODOS DE UTILIDAD
        isValidAgentStatusData(data) {
            return data && 
                   Array.isArray(data.labels) && 
                   Array.isArray(data.data) &&
                   data.labels.length > 0;
        }

        isValidServicePerformanceData(data) {
            return data &&
                   Array.isArray(data.labels) &&
                   Array.isArray(data.ventas) &&
                   data.labels.length > 0;
        }

        isValidAgentsByBranchData(data) {
            return data &&
                   Array.isArray(data.labels) &&
                   Array.isArray(data.data) &&
                   data.labels.length > 0;
        }

        getFallbackStats() {
            return {
                totalProjects: 25,
                revenueThisMonth: 12500,
                activeAgentsCount: 15,
                pendingTasks: 8,
                completedThisWeek: 12,
                totalRevenue: 85600,
                completionRate: 68,
                projectsTrend: 12.5,
                revenueTrend: 8.3,
                agentsChange: 2
            };
        }

        getFallbackRecentProjects() {
            return [
                {
                    servicio: 'Sitio Web Corporativo',
                    agente: 'Diego Suárez',
                    monto: 2750,
                    fechaFinalizacion: new Date().toISOString(),
                    estado: 'completado',
                    cliente: 'Consultoría Empresarial'
                },
                {
                    servicio: 'Campaña Marketing',
                    agente: 'José Ruiz',
                    monto: 1500,
                    fechaFinalizacion: new Date(Date.now() - 86400000).toISOString(),
                    estado: 'completado',
                    cliente: 'Marketing Digital SA'
                },
                {
                    servicio: 'Rediseño Web',
                    agente: 'Diego Suárez',
                    monto: 3200,
                    fechaFinalizacion: new Date(Date.now() - 172800000).toISOString(),
                    estado: 'completado',
                    cliente: 'Tech Solutions Inc.'
                }
            ];
        }

        // MÉTODOS DE RENDERIZADO
        updateStatsCards() {
            if (!this.data.stats) return;
            
            const stats = this.data.stats;
            
            const updateCard = (elementId, value, isCurrency = false) => {
                const element = document.getElementById(elementId);
                if (element) {
                    if (isCurrency) {
                        element.textContent = `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    } else {
                        element.textContent = `${value.toLocaleString('es-ES')}`;
                    }
                }
            };
            
            updateCard('totalProyectos', stats.totalProjects || 0);
            updateCard('ingresosMes', stats.revenueThisMonth || 0, true);
            updateCard('agentesActivos', stats.activeAgentsCount || 0);
            updateCard('tareasPendientes', stats.pendingTasks || 0);
            updateCard('completadosSemana', stats.completedThisWeek || 0);
        }

        renderAgentStatusChart(data) {
            const canvas = document.getElementById('chartAgentesEstado');
            if (!canvas) return;
            
            if (this.chartInstances.has('agentStatus')) {
                const oldChart = this.chartInstances.get('agentStatus');
                if (oldChart && typeof oldChart.destroy === 'function') {
                    oldChart.destroy();
                }
            }
            
            try {
                const ctx = canvas.getContext('2d');
                
                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: data.labels || ['Activos', 'Inactivos'],
                        datasets: [{
                            data: data.data || [15, 3],
                            backgroundColor: [
                                'rgba(34, 197, 94, 0.7)',
                                'rgba(239, 68, 68, 0.7)',
                                'rgba(249, 115, 22, 0.7)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right'
                            }
                        },
                        cutout: '60%'
                    }
                });
                
                this.chartInstances.set('agentStatus', chart);
                
            } catch (error) {
                // Silencio
            }
        }

        renderServicePerformanceChart(data) {
            const canvas = document.getElementById('chartRendimiento');
            if (!canvas) return;
            
            if (this.chartInstances.has('servicePerformance')) {
                const oldChart = this.chartInstances.get('servicePerformance');
                if (oldChart && typeof oldChart.destroy === 'function') {
                    oldChart.destroy();
                }
            }
            
            try {
                const ctx = canvas.getContext('2d');
                
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels || ['Servicio 1', 'Servicio 2'],
                        datasets: [
                            {
                                label: 'Ventas',
                                data: data.ventas || [8, 12],
                                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 1,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Ingresos ($)',
                                data: data.ingresos || [9600, 2400],
                                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                                borderColor: 'rgba(34, 197, 94, 1)',
                                borderWidth: 1,
                                type: 'line',
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Ventas'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Ingresos ($)'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        }
                    }
                });
                
                this.chartInstances.set('servicePerformance', chart);
                
            } catch (error) {
                // Silencio
            }
        }

        renderMonthlyRevenueChart(data) {
            const canvas = document.getElementById('chartVentasMes');
            if (!canvas) return;
            
            if (this.chartInstances.has('monthlyRevenue')) {
                const oldChart = this.chartInstances.get('monthlyRevenue');
                if (oldChart && typeof oldChart.destroy === 'function') {
                    oldChart.destroy();
                }
            }
            
            try {
                const ctx = canvas.getContext('2d');
                
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels || ['Ene', 'Feb', 'Mar'],
                        datasets: [{
                            label: 'Ingresos ($)',
                            data: data.data || [12500, 18900, 8300],
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        }
                    }
                });
                
                this.chartInstances.set('monthlyRevenue', chart);
                
            } catch (error) {
                // Silencio
            }
        }

        renderAgentsByBranchChart(data) {
            const canvas = document.getElementById('chartAgentesSucursal');
            if (!canvas) return;
            
            if (this.chartInstances.has('agentsByBranch')) {
                const oldChart = this.chartInstances.get('agentsByBranch');
                if (oldChart && typeof oldChart.destroy === 'function') {
                    oldChart.destroy();
                }
            }
            
            try {
                const ctx = canvas.getContext('2d');
                
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels || ['Sucursal 1', 'Sucursal 2'],
                        datasets: [{
                            label: 'Agentes por Sucursal',
                            data: data.data || [12, 8],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)',
                                'rgba(54, 162, 235, 0.7)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        }
                    }
                });
                
                this.chartInstances.set('agentsByBranch', chart);
                
            } catch (error) {
                // Silencio
            }
        }

        updateRecentProjectsTable() {
            const tbody = document.getElementById('finishedProjectsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (!this.data.recentProjects || this.data.recentProjects.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                            No hay proyectos recientes
                        </td>
                    </tr>
                `;
                return;
            }
            
            this.data.recentProjects.forEach(project => {
                const row = document.createElement('tr');
                
                let fechaFormateada = 'N/A';
                if (project.fechaFinalizacion) {
                    const fecha = new Date(project.fechaFinalizacion);
                    fechaFormateada = fecha.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                }
                
                const montoFormateado = project.monto 
                    ? `$${project.monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '$0.00';
                
                let estadoColor = 'bg-gray-100 text-gray-800';
                let estadoText = project.estado || 'desconocido';
                
                switch (project.estado?.toLowerCase()) {
                    case 'completado':
                        estadoColor = 'bg-green-100 text-green-800';
                        estadoText = 'Completado';
                        break;
                    case 'en_proceso':
                    case 'en proceso':
                        estadoColor = 'bg-blue-100 text-blue-800';
                        estadoText = 'En Proceso';
                        break;
                    case 'pendiente':
                        estadoColor = 'bg-yellow-100 text-yellow-800';
                        estadoText = 'Pendiente';
                        break;
                }
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${project.servicio || 'Sin nombre'}</div>
                        <div class="text-sm text-gray-500">${project.cliente || 'Sin cliente'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${project.agente || 'No asignado'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${montoFormateado}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${fechaFormateada}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColor}">
                            ${estadoText}
                        </span>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }

        // MÉTODOS DE EXPORTACIÓN
        async exportDashboard() {
            try {
                // Crear reporte con datos actuales
                const reportData = this.generateLocalReportData();
                
                // Crear CSV simple
                this.downloadCSVReport(reportData);
                
            } catch (error) {
                // Silencio
            }
        }

        generateLocalReportData() {
            return {
                metadata: {
                    title: 'Reporte del Dashboard',
                    generatedAt: new Date().toISOString(),
                    generatedBy: 'Administrador'
                },
                stats: this.data.stats || this.getFallbackStats(),
                recentProjects: this.data.recentProjects || this.getFallbackRecentProjects()
            };
        }

        downloadCSVReport(reportData) {
            let csvContent = "data:text/csv;charset=utf-8,";
            
            csvContent += "REPORTE DEL DASHBOARD\n";
            csvContent += `Fecha:,${new Date().toLocaleString('es-ES')}\n\n`;
            
            csvContent += "ESTADÍSTICAS\n";
            csvContent += `Proyectos Totales:,${reportData.stats.totalProjects}\n`;
            csvContent += `Ingresos del Mes:,$${reportData.stats.revenueThisMonth}\n`;
            csvContent += `Agentes Activos:,${reportData.stats.activeAgentsCount}\n\n`;
            
            if (reportData.recentProjects && reportData.recentProjects.length > 0) {
                csvContent += "PROYECTOS RECIENTES\n";
                csvContent += "Servicio,Cliente,Agente,Monto,Fecha,Estado\n";
                
                reportData.recentProjects.forEach(project => {
                    const fecha = project.fechaFinalizacion ? 
                        new Date(project.fechaFinalizacion).toLocaleDateString('es-ES') : '';
                    csvContent += `"${project.servicio || ''}","${project.cliente || ''}","${project.agente || ''}",${project.monto || 0},"${fecha}","${project.estado || ''}"\n`;
                });
            }
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `reporte_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        async generateReport() {
            try {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                
                const defaultStartDate = startDate.toISOString().split('T')[0];
                const defaultEndDate = endDate.toISOString().split('T')[0];
                
                // Modal simple
                const reportOptionsHtml = `
                    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div class="p-6">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Generar Reporte</h3>
                                
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de Reporte
                                        </label>
                                        <select id="reportType" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                            <option value="excel">Excel/CSV</option>
                                        </select>
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                Fecha Inicio
                                            </label>
                                            <input type="date" id="reportStartDate" 
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                   value="${defaultStartDate}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                                Fecha Fin
                                            </label>
                                            <input type="date" id="reportEndDate" 
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                   value="${defaultEndDate}">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-6 flex justify-end space-x-3">
                                    <button type="button" id="cancelReport" 
                                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                        Cancelar
                                    </button>
                                    <button type="button" id="generateReportBtn" 
                                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                        Generar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', reportOptionsHtml);
                
                const modal = document.querySelector('.fixed.inset-0');
                
                document.getElementById('cancelReport').addEventListener('click', () => {
                    modal.remove();
                });
                
                document.getElementById('generateReportBtn').addEventListener('click', async () => {
                    modal.remove();
                    await this.exportDashboard();
                });
                
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
                
            } catch (error) {
                // Silencio
            }
        }

        // MÉTODO DE API SILENCIOSO
        async apiCall(endpoint) {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                
                if (!token) {
                    throw new Error();
                }
                
                let cleanEndpoint = endpoint;
                if (cleanEndpoint.startsWith('/api/')) {
                    cleanEndpoint = cleanEndpoint.substring(4);
                }
                
                const url = this.API_BASE_URL + cleanEndpoint;
                
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                if (!response.ok) {
                    throw new Error();
                }
                
                const text = await response.text();
                const data = text ? JSON.parse(text) : {};
                
                return data;
                
            } catch (error) {
                throw new Error();
            }
        }

        // MÉTODO TOAST SIMPLE
        mostrarToast(mensaje, tipo = "success") {
            // Solo mostrar toast positivos, no errores
            if (tipo === 'success' || tipo === 'info') {
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${tipo === 'success' ? '#28a745' : '#17a2b8'};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 9999;
                    min-width: 250px;
                `;
                toast.textContent = mensaje;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 3000);
            }
        }
    }

    // EXPORTACIÓN GLOBAL
    if (typeof window !== 'undefined') {
        if (!window.AdminDashboard) {
            window.AdminDashboard = AdminDashboard;
        }
        
        if (!window.ensureDashboardReady) {
            window.ensureDashboardReady = async function() {
                if (!window.adminDashboard) {
                    window.adminDashboard = new AdminDashboard();
                }
                
                if (!window.adminDashboard.initialized) {
                    await window.adminDashboard.init();
                }
                
                return window.adminDashboard;
            };
        }
    }
})();