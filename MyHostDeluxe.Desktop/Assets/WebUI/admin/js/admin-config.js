// admin-config.js - Funciones para configuración y auditoría
class AdminConfig {
    constructor() {
        this.auditLogs = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
    }

    init() {
        console.log('Inicializando módulo de configuración...');
        this.setupProfileEvents();
        this.loadAuditLogs();
        this.setupAuditFilters();
    }

    setupProfileEvents() {
        // Cambio de foto de perfil
        const photoInput = document.getElementById('profile-photo');
        const previewImg = document.getElementById('profile-preview');
        
        if (photoInput && previewImg) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewImg.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Cambio de contraseña
        const changePassBtn = document.getElementById('btn-cambiar-password');
        if (changePassBtn) {
            changePassBtn.addEventListener('click', () => this.changePassword());
        }

        // Guardar perfil
        const saveProfileBtn = document.getElementById('btn-guardar-perfil');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        // Toggle para mostrar/ocultar contraseñas
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.target.closest('button').getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                    const icon = e.target.querySelector('i') || e.target;
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            });
        });
    }

    async changePassword() {
        const currentPass = document.getElementById('currentPassword')?.value;
        const newPass = document.getElementById('newPassword')?.value;
        const confirmPass = document.getElementById('confirmPassword')?.value;
        
        if (!currentPass || !newPass || !confirmPass) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (newPass !== confirmPass) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (newPass.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        try {
            console.log('Cambiando contraseña...');
            // Aquí implementarás la llamada a la API real
            
            // Simular cambio
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showMessage('Contraseña cambiada exitosamente', 'success');
            
            // Limpiar campos
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            this.showMessage('Error cambiando contraseña', 'error');
        }
    }

    async saveProfile() {
        const nombre = document.getElementById('profile-nombre')?.value;
        const apellido = document.getElementById('profile-apellido')?.value;
        const email = document.getElementById('profile-email')?.value;
        const telefono = document.getElementById('profile-telefono')?.value;
        const username = document.getElementById('profile-username')?.value;
        
        if (!nombre || !apellido || !email || !username) {
            this.showMessage('Por completa los campos obligatorios', 'error');
            return;
        }
        
        try {
            console.log('Guardando perfil...');
            // Aquí implementarás la llamada a la API real
            
            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showMessage('Perfil guardado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error guardando perfil:', error);
            this.showMessage('Error guardando perfil', 'error');
        }
    }

    async loadAuditLogs() {
        try {
            // Aquí implementarás la llamada a la API real
            this.auditLogs = this.getMockAuditLogs();
            this.totalPages = Math.ceil(this.auditLogs.length / this.itemsPerPage);
            this.renderAuditTable();
            this.updatePaginationInfo();
        } catch (error) {
            console.error('Error cargando logs de auditoría:', error);
        }
    }

    getMockAuditLogs() {
        return [
            { id: 1, fecha: '2025-12-10 08:30:15', agente: 'María González', accion: 'Login', modulo: 'Sistema', detalles: 'Inicio de sesión exitoso', ip: '192.168.1.100' },
            { id: 2, fecha: '2025-12-10 09:15:22', agente: 'Carlos Ruiz', accion: 'Create', modulo: 'Proyectos', detalles: 'Creó nuevo proyecto #45', ip: '192.168.1.101' },
            { id: 3, fecha: '2025-12-10 10:45:33', agente: 'Ana Martínez', accion: 'Update', modulo: 'Agentes', detalles: 'Actualizó información del agente #12', ip: '192.168.1.102' },
            { id: 4, fecha: '2025-12-10 11:20:18', agente: 'Pedro Sánchez', accion: 'Logout', modulo: 'Sistema', detalles: 'Cierre de sesión', ip: '192.168.1.103' },
            { id: 5, fecha: '2025-12-10 14:05:47', agente: 'Laura Díaz', accion: 'Delete', modulo: 'Servicios', detalles: 'Eliminó servicio #8', ip: '192.168.1.104' }
        ];
    }

    renderAuditTable() {
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        // Calcular elementos para la página actual
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageLogs = this.auditLogs.slice(startIndex, endIndex);

        tbody.innerHTML = '';
        
        pageLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.fecha}</td>
                <td>${log.agente}</td>
                <td><span class="badge ${this.getActionBadgeClass(log.accion)}">${log.accion}</span></td>
                <td>${log.modulo}</td>
                <td>${log.detalles}</td>
                <td>${log.ip}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="adminConfig.viewLogDetails(${log.id})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getActionBadgeClass(action) {
        const classes = {
            'Login': 'badge-success',
            'Logout': 'badge-warning',
            'Create': 'badge-info',
            'Update': 'badge-primary',
            'Delete': 'badge-error'
        };
        return classes[action] || 'badge-info';
    }

    setupAuditFilters() {
        const filtroAgente = document.getElementById('filtro-agente');
        const filtroAccion = document.getElementById('filtro-accion');
        const filtroModulo = document.getElementById('filtro-modulo');
        const filtroFecha = document.getElementById('filtro-fecha-desde');
        const btnLimpiar = document.getElementById('btn-limpiar-filtros');
        const btnActualizar = document.getElementById('btn-actualizar-auditoria');
        const btnExportar = document.getElementById('btn-exportar-logs');
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if (filtroAgente) {
            filtroAgente.addEventListener('change', () => this.applyAuditFilters());
        }

        if (filtroAccion) {
            filtroAccion.addEventListener('change', () => this.applyAuditFilters());
        }

        if (filtroModulo) {
            filtroModulo.addEventListener('change', () => this.applyAuditFilters());
        }

        if (filtroFecha) {
            filtroFecha.addEventListener('change', () => this.applyAuditFilters());
        }

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.clearAuditFilters());
        }

        if (btnActualizar) {
            btnActualizar.addEventListener('click', () => this.loadAuditLogs());
        }

        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportAuditLogs());
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => this.prevPage());
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => this.nextPage());
        }
    }

    applyAuditFilters() {
        console.log('Aplicando filtros de auditoría...');
        // Implementar filtrado aquí
    }

    clearAuditFilters() {
        document.getElementById('filtro-agente').value = '';
        document.getElementById('filtro-accion').value = '';
        document.getElementById('filtro-modulo').value = '';
        document.getElementById('filtro-fecha-desde').value = '';
        
        this.loadAuditLogs();
    }

    exportAuditLogs() {
        if (this.auditLogs.length === 0) {
            this.showMessage('No hay logs para exportar', 'warning');
            return;
        }

        // Crear un workbook de Excel
        const wb = XLSX.utils.book_new();
        
        // Preparar datos
        const wsData = [
            ['Fecha/Hora', 'Agente', 'Acción', 'Módulo', 'Detalles', 'IP'],
            ...this.auditLogs.map(log => [log.fecha, log.agente, log.accion, log.modulo, log.detalles, log.ip])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
        
        // Exportar
        const fileName = `Auditoria_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showMessage('Logs de auditoría exportados exitosamente', 'success');
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderAuditTable();
            this.updatePaginationInfo();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderAuditTable();
            this.updatePaginationInfo();
        }
    }

    updatePaginationInfo() {
        const infoElement = document.getElementById('pagination-info');
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');
        
        if (infoElement) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.auditLogs.length);
            infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${this.auditLogs.length} registros`;
        }
        
        if (btnPrev) {
            btnPrev.disabled = this.currentPage <= 1;
        }
        
        if (btnNext) {
            btnNext.disabled = this.currentPage >= this.totalPages;
        }
    }

    viewLogDetails(id) {
        const log = this.auditLogs.find(l => l.id === id);
        if (log) {
            alert(`Detalles del registro:\n\nFecha: ${log.fecha}\nAgente: ${log.agente}\nAcción: ${log.accion}\nMódulo: ${log.modulo}\nDetalles: ${log.detalles}\nIP: ${log.ip}`);
        }
    }

    showMessage(message, type = 'info') {
        if (window.adminApp) {
            window.adminApp.mostrarToast(message, type);
        } else {
            alert(message);
        }
    }
}

window.adminConfig = new AdminConfig();
