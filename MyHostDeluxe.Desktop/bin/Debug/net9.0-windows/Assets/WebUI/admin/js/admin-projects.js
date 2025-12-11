// admin-projects.js - Funciones para administración de proyectos
class AdminProjects {
    constructor() {
        this.projects = [];
    }

    init() {
        console.log('Inicializando módulo de proyectos...');
        this.loadProjects();
    }

    async loadProjects() {
        // Implementar carga de proyectos desde API
        this.projects = this.getMockProjects();
        this.renderProjectsTable();
    }

    getMockProjects() {
        return [
            { id: 1, nombre: 'Web Corporativo ABC', cliente: 'Empresa ABC', responsable: 'María González', estado: 'En proceso', prioridad: 'Alta' },
            { id: 2, nombre: 'Diseño Logo XYZ', cliente: 'Compañía XYZ', responsable: 'Carlos Ruiz', estado: 'Completado', prioridad: 'Media' },
            { id: 3, nombre: 'Marketing Digital', cliente: 'Negocio 123', responsable: 'Ana Martínez', estado: 'Pendiente', prioridad: 'Baja' }
        ];
    }

    renderProjectsTable() {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.nombre}</td>
                <td>${project.cliente}</td>
                <td>${project.responsable}</td>
                <td><span class="badge ${this.getStatusBadgeClass(project.estado)}">${project.estado}</span></td>
                <td><span class="badge ${this.getPriorityBadgeClass(project.prioridad)}">${project.prioridad}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="adminProjects.viewProject(${project.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-sm ml-2" onclick="adminProjects.editProject(${project.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getStatusBadgeClass(status) {
        const classes = {
            'Completado': 'badge-success',
            'En proceso': 'badge-warning',
            'Pendiente': 'badge-error'
        };
        return classes[status] || 'badge-info';
    }

    getPriorityBadgeClass(priority) {
        const classes = {
            'Alta': 'badge-error',
            'Media': 'badge-warning',
            'Baja': 'badge-success'
        };
        return classes[priority] || 'badge-info';
    }

    viewProject(id) {
        console.log('Viendo proyecto:', id);
        // Implementar vista detallada
    }

    editProject(id) {
        console.log('Editando proyecto:', id);
        // Implementar edición
    }
}

window.adminProjects = new AdminProjects();
