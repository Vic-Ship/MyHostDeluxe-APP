// admin-agents.js - Funciones para administración de agentes
class AdminAgents {
    constructor() {
        this.agents = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    init() {
        console.log('Inicializando módulo de agentes...');
        
        // Configurar eventos del formulario
        this.setupFormEvents();
        
        // Cargar agentes
        this.loadAgents();
        
        // Configurar filtros
        this.setupFilters();
    }

    setupFormEvents() {
        // Mostrar/ocultar formulario
        const showBtn = document.getElementById('btnMostrarFormularioAgente');
        const closeBtn = document.getElementById('cerrarFormularioAgente');
        const formContainer = document.getElementById('formularioAgenteContainer');
        const listContainer = document.getElementById('agentsListContainer');
        
        if (showBtn && formContainer && listContainer) {
            showBtn.addEventListener('click', () => {
                formContainer.classList.remove('hidden');
                listContainer.classList.add('hidden');
            });
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    formContainer.classList.add('hidden');
                    listContainer.classList.remove('hidden');
                });
            }
        }

        // Enviar formulario
        const form = document.getElementById('form-agente');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAgent();
            });
        }
    }

    async loadAgents() {
        try {
            // Aquí implementarás la llamada a la API real
            // Por ahora, usar datos mock
            this.agents = this.getMockAgents();
            this.renderAgentsTable();
        } catch (error) {
            console.error('Error cargando agentes:', error);
        }
    }

    getMockAgents() {
        return [
            { id: 1, nombre: 'María', apellido: 'González', email: 'maria@myhostdeluxe.com', telefono: '8888-8888', sucursal: 'Managua', estado: 'Activo' },
            { id: 2, nombre: 'Carlos', apellido: 'Ruiz', email: 'carlos@myhostdeluxe.com', telefono: '8888-8889', sucursal: 'San Benito', estado: 'Activo' },
            { id: 3, nombre: 'Ana', apellido: 'Martínez', email: 'ana@myhostdeluxe.com', telefono: '8888-8890', sucursal: 'Jinotepe', estado: 'Inactivo' },
            { id: 4, nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro@myhostdeluxe.com', telefono: '8888-8891', sucursal: 'Managua', estado: 'Activo' },
            { id: 5, nombre: 'Laura', apellido: 'Díaz', email: 'laura@myhostdeluxe.com', telefono: '8888-8892', sucursal: 'San Benito', estado: 'Activo' }
        ];
    }

    renderAgentsTable() {
        const tbody = document.getElementById('agentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.agents.forEach(agent => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${agent.nombre} ${agent.apellido}</td>
                <td>${agent.email}</td>
                <td>${agent.telefono}</td>
                <td>${agent.sucursal}</td>
                <td><span class="badge ${agent.estado === 'Activo' ? 'badge-success' : 'badge-error'}">${agent.estado}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="adminAgents.editAgent(${agent.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-sm ml-2" onclick="adminAgents.deleteAgent(${agent.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    setupFilters() {
        const filtroSucursal = document.getElementById('filtroSucursalAgente');
        const filtroEstado = document.getElementById('filtroEstadoAgente');
        const buscador = document.getElementById('buscarAgente');

        if (filtroSucursal) {
            filtroSucursal.addEventListener('change', () => this.applyFilters());
        }

        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => this.applyFilters());
        }

        if (buscador) {
            buscador.addEventListener('input', () => this.applyFilters());
        }
    }

    applyFilters() {
        // Implementar filtrado aquí
        console.log('Aplicando filtros...');
    }

    async saveAgent() {
        const form = document.getElementById('form-agente');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            console.log('Guardando agente:', data);
            
            // Aquí implementarás la llamada a la API real
            // Por ahora, simular guardado
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mostrar mensaje de éxito
            if (window.adminApp) {
                window.adminApp.mostrarToast('Agente guardado exitosamente', 'success');
            }
            
            // Cerrar formulario y actualizar lista
            document.getElementById('formularioAgenteContainer').classList.add('hidden');
            document.getElementById('agentsListContainer').classList.remove('hidden');
            
            // Recargar agentes
            this.loadAgents();
            
        } catch (error) {
            console.error('Error guardando agente:', error);
            if (window.adminApp) {
                window.adminApp.mostrarToast('Error guardando agente', 'error');
            }
        }
    }

    editAgent(id) {
        console.log('Editando agente:', id);
        // Implementar edición
    }

    deleteAgent(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este agente?')) {
            console.log('Eliminando agente:', id);
            // Implementar eliminación
        }
    }
}

window.adminAgents = new AdminAgents();

// Inicializar cuando se muestre la sección de agentes
document.addEventListener('DOMContentLoaded', function() {
    const agentsSection = document.getElementById('clients-content');
    if (agentsSection) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (agentsSection.classList.contains('active')) {
                        setTimeout(() => {
                            if (window.adminAgents && !window.adminAgents.initialized) {
                                window.adminAgents.init();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        observer.observe(agentsSection, { attributes: true });
    }
});
