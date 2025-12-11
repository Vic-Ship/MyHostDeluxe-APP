// agent-dashboard.js - Dashboard del agente
class AgentDashboard {
    constructor() {
        this.apiBaseUrl = window.agentApp?.apiBaseUrl || 'http://localhost:3001/api';
        this.initialized = false;
        this.dataLoaded = false;
        this.metrics = {
            activeProjects: 0,
            pendingTasks: 0,
            completedThisMonth: 0,
            totalClients: 0
        };
        this.pendingTasks = [];
    }

    async init() {
        if (this.initialized) {
            console.log('Dashboard ya está inicializado');
            return this;
        }
        
        console.log('Inicializando dashboard del agente...');
        
        try {
            this.verifyDOMElements();
            await this.setupEventListeners();
            await this.loadData();
            
            this.initialized = true;
            console.log('Dashboard inicializado correctamente');
            
            return this;
            
        } catch (error) {
            console.error('Error crítico al inicializar dashboard:', error);
            this.showFatalError('No se pudo inicializar el dashboard');
            throw error;
        }
    }

    verifyDOMElements() {
        console.log('Verificando elementos del DOM...');
        
        const requiredElements = {
            'activeProjects': 'Métrica: Proyectos Activos',
            'pendingTasks': 'Métrica: Tareas Pendientes',
            'completedThisMonth': 'Métrica: Completados (Mes)',
            'totalClients': 'Métrica: Clientes Asignados',
            'pendingTasksTableBody': 'Tabla: Cuerpo de tareas pendientes'
        };
        
        const missingElements = [];
        
        Object.keys(requiredElements).forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                missingElements.push(id);
                console.error('Elemento faltante: #' + id + ' - ' + requiredElements[id]);
            } else {
                console.log('Elemento encontrado: #' + id);
            }
        });
        
        if (missingElements.length > 0) {
            throw new Error('Elementos del DOM faltantes: ' + missingElements.join(', '));
        }
    }

    async setupEventListeners() {
        console.log('Configurando event listeners...');
        
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (button) {
                const action = button.getAttribute('data-action');
                const taskId = button.getAttribute('data-task-id');
                
                if (action && taskId) {
                    e.preventDefault();
                    this.handleTableAction(action, taskId);
                }
            }
        });
        
        const reloadButton = document.getElementById('reloadDashboard');
        if (reloadButton) {
            reloadButton.addEventListener('click', () => this.reloadData());
        }
    }

    async loadData() {
        console.log('Cargando datos del dashboard...');
        
        try {
            this.showLoadingState();
            
            await this.loadMetrics();
            await this.loadPendingTasks();
            
            this.dataLoaded = true;
            this.hideLoadingState();
            
            console.log('Datos del dashboard cargados correctamente');
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.hideLoadingState();
            this.showError('Error al cargar datos del dashboard');
        }
    }

    async loadMetrics() {
        try {
            console.log('Cargando métricas...');
            
            const response = await window.apiCall('/agent/metrics');
            
            if (response && response.success && response.data) {
                this.metrics = { ...response.data };
                console.log('Métricas cargadas desde API:', this.metrics);
                this.updateMetricsUI();
            } else {
                console.warn('Respuesta de API inválida para métricas:', response);
                throw new Error('No se pudieron cargar las métricas');
            }
            
        } catch (error) {
            console.error('Error en loadMetrics:', error);
            throw error;
        }
    }

    async loadPendingTasks() {
        try {
            console.log('Cargando tareas pendientes...');
            
            const response = await window.apiCall('/agent/tasks/pending');
            
            if (response && response.success && response.data) {
                this.pendingTasks = response.data;
                console.log('Tareas cargadas desde API:', this.pendingTasks.length + ' tareas');
                this.updatePendingTasksUI();
            } else {
                console.warn('Respuesta de API inválida para tareas:', response);
                throw new Error('No se pudieron cargar las tareas pendientes');
            }
            
        } catch (error) {
            console.error('Error en loadPendingTasks:', error);
            throw error;
        }
    }

    updateMetricsUI() {
        console.log('Actualizando UI de métricas...');
        
        this.updateMetricElement('activeProjects', this.metrics.activeProjects);
        this.updateMetricElement('pendingTasks', this.metrics.pendingTasks);
        this.updateMetricElement('completedThisMonth', this.metrics.completedThisMonth);
        this.updateMetricElement('totalClients', this.metrics.totalClients);
    }

    updateMetricElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            console.log('Métrica actualizada: ' + elementId + ' = ' + value);
        } else {
            console.warn('No se pudo actualizar métrica: #' + elementId + ' no encontrado');
        }
    }

    updatePendingTasksUI() {
        const tableBody = document.getElementById('pendingTasksTableBody');
        if (!tableBody) {
            console.error('Tabla de tareas no encontrada');
            return;
        }
        
        if (!this.pendingTasks || this.pendingTasks.length === 0) {
            tableBody.innerHTML = this.getEmptyTasksHTML();
            console.log('Tabla de tareas: Vacía');
            return;
        }
        
        tableBody.innerHTML = this.generateTasksHTML();
        console.log('Tabla actualizada con ' + this.pendingTasks.length + ' tareas');
    }

    generateTasksHTML() {
        return this.pendingTasks.map(task => this.generateTaskRowHTML(task)).join('');
    }

    generateTaskRowHTML(task) {
        const priorityClass = this.getPriorityClass(task.prioridad);
        const formattedDate = task.fechaLimite ? this.formatDate(task.fechaLimite) : 'Sin fecha';
        
        return `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="py-3 px-4 border-b border-gray-200">
                    <div class="font-medium text-gray-800">${task.proyecto || 'Sin proyecto'}</div>
                </td>
                <td class="py-3 px-4 border-b border-gray-200">
                    <div class="text-sm text-gray-700">${task.descripcion || 'Sin descripción'}</div>
                </td>
                <td class="py-3 px-4 border-b border-gray-200">
                    <div class="text-sm ${this.isTaskOverdue(task) ? 'text-red-600 font-semibold' : 'text-gray-600'}">
                        ${formattedDate}
                    </div>
                </td>
                <td class="py-3 px-4 border-b border-gray-200">
                    <span class="status-badge ${priorityClass}">
                        ${task.prioridad || 'media'}
                    </span>
                </td>
                <td class="py-3 px-4 border-b border-gray-200">
                    <div class="flex space-x-2 justify-center">
                        <button data-action="complete" data-task-id="${task.id}"
                                class="btn btn-success btn-sm" title="Completar tarea">
                            <i class="fas fa-check"></i>
                        </button>
                        <button data-action="view" data-task-id="${task.id}"
                                class="btn btn-info btn-sm" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button data-action="postpone" data-task-id="${task.id}"
                                class="btn btn-warning btn-sm" title="Posponer">
                            <i class="fas fa-clock"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getEmptyTasksHTML() {
        return `
            <tr>
                <td colspan="5" class="py-8 text-center">
                    <div class="flex flex-col items-center justify-center text-gray-500">
                        <i class="fas fa-check-circle text-4xl mb-3 text-green-400"></i>
                        <p class="text-lg font-medium mb-2">No hay tareas pendientes</p>
                        <p class="text-sm">Todas las tareas están al día.</p>
                    </div>
                </td>
            </tr>
        `;
    }

    async handleTableAction(action, taskId) {
        console.log('Acción: ' + action + ' para tarea ' + taskId);
        
        switch (action) {
            case 'complete':
                await this.completeTask(taskId);
                break;
            case 'view':
                this.viewTask(taskId);
                break;
            case 'postpone':
                this.postponeTask(taskId);
                break;
            default:
                console.warn('Acción desconocida: ' + action);
        }
    }

    async completeTask(taskId) {
    try {
        console.log('=== INICIANDO COMPLETAR TAREA ===');
        console.log('Tarea ID:', taskId);
        console.log('Usuario actual:', window.agentApp?.user);
        
        if (!confirm('¿Marcar esta tarea como completada?')) {
            console.log('Operación cancelada por el usuario');
            return;
        }
        
        // Obtener referencia al botón
        const button = event?.target?.closest('button[data-action="complete"]');
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.disabled = true;
        }
        
        // Verificar permisos primero
        try {
            console.log('Verificando permisos...');
            const permisos = await window.apiCall('/agent/agent/check-permissions');
            console.log('Permisos:', permisos);
            
            if (!permisos.data.permisos.esAgente) {
                throw new Error('No tienes permisos de agente');
            }
        } catch (permisoError) {
            console.error('Error de permisos:', permisoError);
            this.showError('No tienes permisos para completar tareas');
            return;
        }
        
        // Completar la tarea
        console.log('Enviando solicitud de completar tarea...');
        const response = await window.apiCall(`/agent/tasks/${taskId}/complete`, { 
            method: 'POST',
            body: JSON.stringify({
                comentario: 'Completada por ' + (window.agentApp?.user?.nombre || 'agente'),
                timestamp: new Date().toISOString()
            })
        });
        
        console.log('Respuesta del servidor:', response);
        
        if (response.success) {
            this.showMessage(' Tarea completada exitosamente', 'success');
            
            // Actualizar UI inmediatamente
            const taskRow = button?.closest('tr');
            if (taskRow) {
                taskRow.classList.add('bg-green-50');
                const statusCell = taskRow.querySelector('td:nth-child(4)');
                if (statusCell) {
                    statusCell.innerHTML = '<span class="status-badge completado">Completada</span>';
                }
            }
            
            // Actualizar métricas después de 1 segundo
            setTimeout(async () => {
                await this.loadMetrics();
                await this.loadPendingTasks();
                console.log('Dashboard actualizado');
            }, 1000);
            
        } else {
            throw new Error(response.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error(' Error al completar tarea:', error);
        
        // Mensajes específicos
        let mensajeError = 'Error al completar la tarea';
        if (error.message.includes('403')) {
            mensajeError = 'No tienes permiso para completar esta tarea';
        } else if (error.message.includes('404')) {
            mensajeError = 'Tarea no encontrada';
        } else if (error.message.includes('500')) {
            mensajeError = 'Error interno del servidor. Por favor, intente más tarde.';
        } else if (error.message.includes('No tienes permisos de agente')) {
            mensajeError = 'Tu cuenta no tiene permisos de agente';
        }
        
        this.showError(mensajeError);
        
    } finally {
        // Restaurar botón
        const button = event?.target?.closest('button[data-action="complete"]');
        if (button) {
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.disabled = false;
        }
    }
}

    viewTask(taskId) {
        console.log('Viendo tarea ' + taskId);
        
        const task = this.pendingTasks.find(t => t.id == taskId);
        
        if (task) {
            const modalVerTarea = document.getElementById('modalVerTarea');
            if (modalVerTarea) {
                document.getElementById('detalleTareaNombre').textContent = task.descripcion || 'Sin descripción';
                document.getElementById('detalleTareaProyecto').textContent = task.proyecto || 'Sin proyecto';
                document.getElementById('detalleTareaFechaLimite').textContent = task.fechaLimite ? this.formatDate(task.fechaLimite) : 'Sin fecha';
                document.getElementById('detalleTareaPrioridad').textContent = task.prioridad || 'media';
                document.getElementById('detalleTareaDescripcion').textContent = task.descripcion || 'Sin descripción';
                document.getElementById('detalleTareaEstado').textContent = task.estado || 'pendiente';
                
                modalVerTarea.classList.add('active');
            } else {
                alert('Detalles de la tarea:\n\n' +
                      'Proyecto: ' + (task.proyecto || 'N/A') + '\n' +
                      'Descripción: ' + (task.descripcion || 'N/A') + '\n' +
                      'Fecha Límite: ' + (task.fechaLimite ? this.formatDate(task.fechaLimite) : 'N/A') + '\n' +
                      'Prioridad: ' + (task.prioridad || 'media') + '\n' +
                      'Estado: ' + (task.estado || 'pendiente'));
            }
        } else {
            this.showError('Tarea no encontrada');
        }
    }

    postponeTask(taskId) {
        console.log('Posponiendo tarea ' + taskId);
        
        const modalPosponerTarea = document.getElementById('modalPosponerTarea');
        if (modalPosponerTarea) {
            const task = this.pendingTasks.find(t => t.id == taskId);
            if (task) {
                document.getElementById('tareaPosponerId').value = taskId;
                document.getElementById('tareaPosponerNombre').textContent = task.descripcion || 'Sin descripción';
                document.getElementById('tareaPosponerProyecto').textContent = task.proyecto || 'Sin proyecto';
                
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                document.getElementById('nuevaFechaLimite').value = tomorrow.toISOString().split('T')[0];
                
                modalPosponerTarea.classList.add('active');
            }
        } else {
            const newDate = prompt('Ingrese la nueva fecha límite (YYYY-MM-DD):', 
                                   new Date().toISOString().split('T')[0]);
            
            if (newDate) {
                console.log('Nueva fecha para tarea ' + taskId + ': ' + newDate);
                this.showMessage('Tarea pospuesta exitosamente', 'info');
                setTimeout(() => this.reloadData(), 1000);
            }
        }
    }

    async reloadData() {
        console.log('Recargando datos...');
        
        this.dataLoaded = false;
        await this.loadData();
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Fecha inválida';
        }
    }

    getPriorityClass(priority) {
        const classes = {
            'alta': 'pendiente',
            'media': 'en-proceso', 
            'baja': 'completado'
        };
        return classes[priority?.toLowerCase()] || 'en-proceso';
    }

    isTaskOverdue(task) {
        if (!task.fechaLimite) return false;
        
        try {
            const dueDate = new Date(task.fechaLimite);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            
            return dueDate < today;
        } catch (e) {
            return false;
        }
    }

    showLoadingState() {
        document.querySelectorAll('.card-value').forEach(el => {
            if (el.textContent === '0') {
                el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
        
        const tableBody = document.getElementById('pendingTasksTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr><td colspan="5" class="py-4 text-center">
                    <div class="flex justify-center items-center space-x-2">
                        <i class="fas fa-spinner fa-spin text-orange-500"></i>
                        <span>Cargando tareas...</span>
                    </div>
                </td></tr>
            `;
        }
    }

    hideLoadingState() {
        document.querySelectorAll('.card-value').forEach(el => {
            if (el.innerHTML.includes('fa-spinner')) {
                const elementId = el.id;
                const value = this.metrics[elementId] || 0;
                el.textContent = value;
            }
        });
    }

    showMessage(message, type = 'info') {
        console.log(type.toUpperCase() + ': ' + message);
        
        if (window.mostrarToast) {
            window.mostrarToast(message, type);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showFatalError(message) {
        console.error('ERROR FATAL: ' + message);
        
        const dashboardContent = document.getElementById('dashboard-content');
        if (dashboardContent) {
            dashboardContent.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Error al cargar el dashboard</h3>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button onclick="location.reload()" 
                            class="btn btn-primary">
                        <i class="fas fa-redo mr-2"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Inicialización global del dashboard
window.initializeAgentDashboard = async function() {
    console.log('Inicialización global del dashboard...');
    
    try {
        if (!window.agentApp) {
            console.warn('agentApp no está disponible, creando instancia temporal...');
            window.agentApp = { apiBaseUrl: 'http://localhost:3001/api' };
        }
        
        if (window.agentDashboard && window.agentDashboard.initialized) {
            console.log('Dashboard ya está inicializado, recargando datos...');
            await window.agentDashboard.reloadData();
            return window.agentDashboard;
        }
        
        console.log('Creando nueva instancia del dashboard...');
        window.agentDashboard = new AgentDashboard();
        const dashboard = await window.agentDashboard.init();
        
        console.log('Dashboard listo para usar');
        return dashboard;
        
    } catch (error) {
        console.error('Error fatal en inicialización global:', error);
        
        const errorMessage = 'No se pudo inicializar el dashboard: ' + error.message;
        alert(errorMessage);
        
        throw error;
    }
};

// Hacer el dashboard disponible globalmente
if (!window.agentDashboard) {
    window.agentDashboard = null;
}