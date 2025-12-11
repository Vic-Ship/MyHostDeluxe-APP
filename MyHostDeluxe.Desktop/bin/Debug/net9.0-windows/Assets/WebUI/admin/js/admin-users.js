// admin-users.js - Funciones para administración de usuarios
class AdminUsers {
    constructor() {
        this.users = [];
    }

    init() {
        console.log('Inicializando módulo de usuarios...');
        this.loadUsers();
    }

    async loadUsers() {
        // Implementar carga de usuarios desde API
        this.users = this.getMockUsers();
        this.renderUsersTable();
    }

    getMockUsers() {
        return [
            { id: 1, username: 'admin', nombre: 'Admin Principal', email: 'admin@myhostdeluxe.com', rol: 'Administrador', estado: 'Activo' },
            { id: 2, username: 'maria.g', nombre: 'María González', email: 'maria@myhostdeluxe.com', rol: 'Agente', estado: 'Activo' },
            { id: 3, username: 'carlos.r', nombre: 'Carlos Ruiz', email: 'carlos@myhostdeluxe.com', rol: 'Agente', estado: 'Inactivo' }
        ];
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.nombre}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.rol === 'Administrador' ? 'badge-error' : 'badge-info'}">${user.rol}</span></td>
                <td><span class="badge ${user.estado === 'Activo' ? 'badge-success' : 'badge-error'}">${user.estado}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="adminUsers.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-sm ml-2" onclick="adminUsers.resetPassword(${user.id})">
                        <i class="fas fa-key"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editUser(id) {
        console.log('Editando usuario:', id);
        // Implementar edición
    }

    resetPassword(id) {
        if (confirm('¿Estás seguro de que deseas restablecer la contraseña de este usuario?')) {
            console.log('Restableciendo contraseña para usuario:', id);
            // Implementar restablecimiento
        }
    }
}

window.adminUsers = new AdminUsers();
