// admin-services.js - Funciones para administración de servicios
class AdminServices {
    constructor() {
        this.services = [];
    }

    init() {
        console.log('Inicializando módulo de servicios...');
        this.loadServices();
    }

    async loadServices() {
        // Implementar carga de servicios desde API
        this.services = this.getMockServices();
        this.renderServicesTable();
    }

    getMockServices() {
        return [
            { id: 1, nombre: 'Web Básico Anual', categoria: 'Web', precio: 1200, unidad: 'anual', estado: 'Activo', proyectos: 15 },
            { id: 2, nombre: 'Diseño de Logo', categoria: 'Diseño Gráfico', precio: 300, unidad: 'proyecto', estado: 'Activo', proyectos: 42 },
            { id: 3, nombre: 'Marketing Digital', categoria: 'Marketing', precio: 800, unidad: 'mensual', estado: 'Inactivo', proyectos: 8 }
        ];
    }

    renderServicesTable() {
        const tbody = document.getElementById('servicesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.nombre}</td>
                <td>${service.categoria}</td>
                <td>$${service.precio.toLocaleString()}</td>
                <td>${service.unidad}</td>
                <td><span class="badge ${service.estado === 'Activo' ? 'badge-success' : 'badge-error'}">${service.estado}</span></td>
                <td>${service.proyectos}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="adminServices.editService(${service.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editService(id) {
        console.log('Editando servicio:', id);
        // Implementar edición
    }
}

window.adminServices = new AdminServices();
