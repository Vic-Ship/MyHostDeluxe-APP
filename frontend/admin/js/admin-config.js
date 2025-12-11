// Verificar si AdminConfig ya existe globalmente
if (typeof window.AdminConfig === 'undefined') {
    class AdminConfig {
        constructor() {
            this.auditLogs = [];
            this.agents = [];
            this.currentPage = 1;
            this.logsPerPage = 10;
            this.filters = { 
                agente: '', 
                accion: '', 
                modulo: '', 
                fechaDesde: '' 
            };
            this.currentUser = null;
            this.initialized = false;
            
            console.log('AdminConfig inicializado');
        }

        async init() {
            try {
                this.setupEventListeners();
                this.setupPasswordToggles();
                await this.loadCurrentUserProfile();
                await this.loadAgentsForAudit();
                await this.loadAuditLogs();
                
                this.initialized = true;
                console.log('AdminConfig inicializado correctamente');
            } catch (error) {
                console.error('Error inicializando AdminConfig:', error);
            }
        }

        showError(msg) { 
            window.adminApp?.mostrarToast?.(msg, 'danger') || alert('Error: ' + msg); 
        }
        
        showSuccess(msg) { 
            window.adminApp?.mostrarToast?.(msg, 'success') || alert('Exito: ' + msg); 
        }

        setupEventListeners() {
            // CORREGIDO: Usar this para referenciar los métodos
            const guardarBtn = document.getElementById('btn-guardar-perfil');
            if (guardarBtn) {
                guardarBtn.addEventListener('click', (e) => this.handleProfileSubmit(e));
            }

            const photoInput = document.getElementById('profile-photo');
            if (photoInput) {
                photoInput.addEventListener('change', (e) => this.handleProfilePhotoChange(e));
            }

            const passwordBtn = document.getElementById('btn-cambiar-password');
            if (passwordBtn) {
                passwordBtn.addEventListener('click', (e) => this.handlePasswordSubmit(e));
            }

            // Eventos de auditoría
            const eventosAuditoria = [
                { id: 'btn-limpiar-filtros', method: () => this.clearFilters() },
                { id: 'btn-exportar-logs', method: () => this.exportAuditLogs() },
                { id: 'btn-actualizar-auditoria', method: () => this.loadAuditLogs() },
                { id: 'btn-prev-page', method: () => this.previousPage() },
                { id: 'btn-next-page', method: () => this.nextPage() }
            ];

            eventosAuditoria.forEach(evento => {
                const element = document.getElementById(evento.id);
                if (element) {
                    element.addEventListener('click', evento.method);
                }
            });

            // Filtros
            ['filtro-agente', 'filtro-accion', 'filtro-modulo', 'filtro-fecha-desde']
                .forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.addEventListener('change', () => this.applyFilters());
                    }
                });
        }

        setupPasswordToggles() {
            document.addEventListener('click', e => {
                const button = e.target.closest('.toggle-password');
                if (!button) return;
                
                const inputId = button.dataset.target;
                const input = document.getElementById(inputId);
                const icon = button.querySelector('i');
                
                if (!input || !icon) return;
                
                input.type = input.type === 'password' ? 'text' : 'password';
                icon.classList.toggle('fa-eye-slash');
                icon.classList.toggle('fa-eye');
            });
        }

        async loadCurrentUserProfile() {
            try {
                console.log('Cargando perfil del usuario actual...');
                
                const response = await window.adminApp.apiCall('/users/current');
                console.log('Respuesta de API /users/current:', response);
                
                if (response?.success) { 
                    this.currentUser = response.data; 
                    this.populateProfileForm(response.data);
                    console.log('Perfil cargado exitosamente:', this.currentUser);
                } else {
                    console.warn('No se pudo cargar el perfil desde API, usando datos por defecto');
                    await this.loadDefaultUserProfile();
                }
            } catch(err) { 
                console.error('Error cargando perfil:', err);
                await this.loadDefaultUserProfile();
            }
        }

        async loadDefaultUserProfile() {
            try {
                // Intentar obtener del localStorage
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                
                if (userData && userData.id) {
                    console.log('Usando datos del localStorage:', userData);
                    this.currentUser = userData;
                    this.populateProfileForm(userData);
                } else {
                    // Datos por defecto para administrador
                    console.log('Usando datos por defecto de administrador');
                    this.currentUser = {
                        id: 1,
                        primerNombre: 'Admin',
                        apellido: 'Principal',
                        telefono: '',
                        correoElectronico: 'admin@myhostdeluxe.com',
                        nombreUsuario: 'admin',
                        role: 'admin'
                    };
                    this.populateProfileForm(this.currentUser);
                }
            } catch(err) {
                console.error('Error cargando perfil por defecto:', err);
                this.showError('No se pudo cargar el perfil del usuario');
            }
        }

        async loadAgentsForAudit() {
            try {
                const response = await window.adminApp.apiCall('/audit/agents');
                
                if (response?.success) {
                    this.agents = response.data; 
                    this.populateAgentsFilter();
                } else {
                    await this.loadAgentsFromUsers();
                }
            } catch(err) { 
                console.error('Error cargando agentes:', err);
                await this.loadAgentsFromUsers();
            }
        }

        async loadAgentsFromUsers() {
            try {
                const response = await window.adminApp.apiCall('/users');
                if (response?.success) {
                    this.agents = response.data
                        .filter(user => user.role === 'agente' || user.rol === 'agente')
                        .map(user => ({
                            usuario: user.username,
                            nombre: user.nombre,
                            apellido: user.apellido
                        }));
                    this.populateAgentsFilter();
                } else {
                    this.agents = [];
                }
            } catch (error) {
                console.error('Error cargando agentes desde usuarios:', error);
                this.agents = [];
            }
        }

        populateAgentsFilter() {
            const select = document.getElementById('filtro-agente');
            if (!select) return;
            
            select.innerHTML = '<option value="">Todos los agentes</option>';
            
            this.agents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.usuario;
                option.textContent = `${agent.nombre} ${agent.apellido} (${agent.usuario})`;
                select.appendChild(option);
            });
        }

        populateProfileForm(user) {
            console.log('Rellenando formulario con datos:', user);
            
            // Mapeo de campos: del backend a los IDs del HTML
            const fieldMap = { 
                'profile-nombre': user.primerNombre || user.nombre || user.PrimerNombre || '',
                'profile-apellido': user.apellido || user.Apellido || '',
                'profile-telefono': user.telefono || user.Telefono || '',
                'profile-email': user.correoElectronico || user.email || user.CorreoElectronico || '',
                'profile-username': user.nombreUsuario || user.username || user.NombreUsuario || ''
            };
            
            Object.entries(fieldMap).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value || '';
                    console.log(`Campo ${id} establecido a: "${value}"`);
                }
            });
            
            // Foto de perfil
            const profilePreview = document.getElementById('profile-preview');
            if (profilePreview) {
                const photoUrl = user.profile_picture || user.foto_perfil || user.URLFotoPerfil;
                if (photoUrl) {
                    profilePreview.src = photoUrl + '?t=' + Date.now(); // Cache busting
                } else {
                    profilePreview.src = './images/adm.user.jpeg'; // Foto por defecto
                }
            }
        }

        async handleProfileSubmit(e) {
            e.preventDefault();
            const button = e.target;
            const originalHtml = button.innerHTML;
            
            try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                button.disabled = true;

                // PREPARAR PAYLOAD SEGÚN LO QUE ESPERA EL BACKEND
                // El backend espera: nombre, apellido, email, username, role
                const payload = {
                    nombre: document.getElementById('profile-nombre')?.value.trim(),
                    apellido: document.getElementById('profile-apellido')?.value.trim(),
                    email: document.getElementById('profile-email')?.value.trim(),
                    username: document.getElementById('profile-username')?.value.trim(),
                    role: 'admin', // El rol siempre será admin en este módulo
                    telefono: document.getElementById('profile-telefono')?.value.trim() || ''
                };

                console.log('Payload a enviar al backend:', payload);

                // Validaciones
                const requiredFields = ['nombre', 'apellido', 'email', 'username'];
                const missingFields = requiredFields.filter(field => !payload[field]);
                
                if (missingFields.length > 0) {
                    this.showError(`Faltan campos requeridos: ${missingFields.join(', ')}`);
                    return;
                }

                // Validar email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(payload.email)) {
                    this.showError('Por favor, ingresa un correo electrónico válido');
                    return;
                }

                // Obtener ID del usuario
                const userId = this.currentUser?.id || 1;
                console.log('Actualizando perfil del usuario ID:', userId);

                // Llamar a la API
                const response = await window.adminApp.apiCall(
                    `/users/${userId}`, 
                    { 
                        method: 'PUT', 
                        body: JSON.stringify(payload)
                    }
                );
                
                console.log('Respuesta de actualización:', response);
                
                if (response?.success) {
                    this.showSuccess('Perfil actualizado correctamente');
                    
                    // Actualizar datos locales
                    Object.assign(this.currentUser, {
                        primerNombre: payload.nombre,
                        apellido: payload.apellido,
                        correoElectronico: payload.email,
                        nombreUsuario: payload.username,
                        telefono: payload.telefono
                    });
                    
                    this.updateLocalStorageProfile(this.currentUser);
                } else {
                    throw new Error(response?.error || response?.message || 'Error al actualizar el perfil');
                }
            } catch(err) {
                console.error('Error actualizando perfil:', err);
                
                // Mensaje de error más amigable
                let errorMsg = err.message || 'No se pudo actualizar el perfil.';
                
                if (err.message.includes('400')) {
                    errorMsg = 'Error en los datos enviados. Verifica que todos los campos sean válidos.';
                } else if (err.message.includes('404')) {
                    errorMsg = 'No se encontró el usuario. Verifica tu sesión.';
                } else if (err.message.includes('500')) {
                    errorMsg = 'Error del servidor. Por favor, intenta más tarde.';
                }
                
                this.showError(errorMsg);
            } finally { 
                button.innerHTML = originalHtml; 
                button.disabled = false; 
            }
        }

    // En la función handleProfilePhotoChange, actualiza la URL de la imagen:
async handleProfilePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        return this.showError('Solo se permiten archivos de imagen (JPG, PNG, GIF)');
    }
    
    if (file.size > 5 * 1024 * 1024) {
        return this.showError('La imagen no debe superar los 5 MB');
    }

    try {
        // Mostrar preview inmediato
        const preview = document.getElementById('profile-preview');
        if (preview) {
            preview.src = URL.createObjectURL(file);
        }

        const formData = new FormData();
        formData.append('profile_picture', file);
        
        console.log('Subiendo foto de perfil...');

        const response = await window.adminApp.apiCall(
            '/users/upload-profile-picture', 
            { 
                method: 'POST',
                body: formData
            }
        );

        console.log('Respuesta de subida de foto:', response);
        
        if (response?.success) {
            this.showSuccess('Foto de perfil actualizada correctamente');
            
            if (response.data?.profile_picture) {
                // CORREGIR LA URL - cambiar /uploads/ por la ruta correcta
                const correctedUrl = response.data.profile_picture.replace('/uploads/', '/uploads/');
                this.currentUser.profile_picture = correctedUrl;
                this.updateLocalStorageProfile(this.currentUser);
                
                // Actualizar preview con URL corregida
                if (preview) {
                    preview.src = correctedUrl + '?t=' + Date.now();
                }
            }
        } else {
            throw new Error(response?.error || 'Error al actualizar la foto');
        }
    } catch(err) {
        console.error('Error cambiando foto:', err);
        
        // Revertir preview
        const preview = document.getElementById('profile-preview');
        if (preview && this.currentUser?.profile_picture) {
            preview.src = this.currentUser.profile_picture;
        } else if (preview) {
            preview.src = './images/adm.user.jpeg';
        }
        
        this.showError('No se pudo actualizar la foto de perfil: ' + (err.message || 'Error desconocido'));
    }
}

// En la función populateProfileForm, también corregir la URL:
populateProfileForm(user) {
    console.log('Rellenando formulario con datos:', user);
    
    // Mapeo de campos: del backend a los IDs del HTML
    const fieldMap = { 
        'profile-nombre': user.primerNombre || user.nombre || user.PrimerNombre || '',
        'profile-apellido': user.apellido || user.Apellido || '',
        'profile-telefono': user.telefono || user.Telefono || '',
        'profile-email': user.correoElectronico || user.email || user.CorreoElectronico || '',
        'profile-username': user.nombreUsuario || user.username || user.NombreUsuario || ''
    };
    
    Object.entries(fieldMap).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
            console.log(`Campo ${id} establecido a: "${value}"`);
        }
    });
    
    // Foto de perfil - CORREGIR LA URL
    const profilePreview = document.getElementById('profile-preview');
    if (profilePreview) {
        const photoUrl = user.profile_picture || user.foto_perfil || user.URLFotoPerfil;
        if (photoUrl) {
            // Si la URL empieza con /uploads/, dejarla así (es la correcta)
            // No cambiar a /images/ porque eso causaría el error 404
            profilePreview.src = photoUrl + '?t=' + Date.now(); // Cache busting
        } else {
            profilePreview.src = './images/adm.user.jpeg'; // Foto por defecto
        }
    }
}

// En handleProfileSubmit, cambiar el rol a 'administrador':
async handleProfileSubmit(e) {
    e.preventDefault();
    const button = e.target;
    const originalHtml = button.innerHTML;
    
    try {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        button.disabled = true;

        // PREPARAR PAYLOAD SEGÚN LO QUE ESPERA EL BACKEND
        // El backend espera: nombre, apellido, email, username, role
        const payload = {
            nombre: document.getElementById('profile-nombre')?.value.trim(),
            apellido: document.getElementById('profile-apellido')?.value.trim(),
            email: document.getElementById('profile-email')?.value.trim(),
            username: document.getElementById('profile-username')?.value.trim(),
            role: 'administrador', // CORREGIDO: 'administrador' en lugar de 'admin'
            telefono: document.getElementById('profile-telefono')?.value.trim() || ''
        };

        console.log('Payload a enviar al backend:', payload);

        // Validaciones
        const requiredFields = ['nombre', 'apellido', 'email', 'username'];
        const missingFields = requiredFields.filter(field => !payload[field]);
        
        if (missingFields.length > 0) {
            this.showError(`Faltan campos requeridos: ${missingFields.join(', ')}`);
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.email)) {
            this.showError('Por favor, ingresa un correo electrónico válido');
            return;
        }

        // Obtener ID del usuario
        const userId = this.currentUser?.id || 1;
        console.log('Actualizando perfil del usuario ID:', userId);

        // Llamar a la API
        const response = await window.adminApp.apiCall(
            `/users/${userId}`, 
            { 
                method: 'PUT', 
                body: JSON.stringify(payload)
            }
        );
        
        console.log('Respuesta de actualización:', response);
        
        if (response?.success) {
            this.showSuccess('Perfil actualizado correctamente');
            
            // Actualizar datos locales
            Object.assign(this.currentUser, {
                primerNombre: payload.nombre,
                apellido: payload.apellido,
                correoElectronico: payload.email,
                nombreUsuario: payload.username,
                telefono: payload.telefono,
                role: payload.role
            });
            
            this.updateLocalStorageProfile(this.currentUser);
        } else {
            throw new Error(response?.error || response?.message || 'Error al actualizar el perfil');
        }
    } catch(err) {
        console.error('Error actualizando perfil:', err);
        
        // Mensaje de error más amigable
        let errorMsg = err.message || 'No se pudo actualizar el perfil.';
        
        if (err.message.includes('Rol no válido')) {
            errorMsg = 'Error: El rol debe ser "administrador". Contacta al administrador del sistema.';
        } else if (err.message.includes('400')) {
            errorMsg = 'Error en los datos enviados. Verifica que todos los campos sean válidos.';
        } else if (err.message.includes('404')) {
            errorMsg = 'No se encontró el usuario. Verifica tu sesión.';
        } else if (err.message.includes('500')) {
            errorMsg = 'Error del servidor. Por favor, intenta más tarde.';
        }
        
        this.showError(errorMsg);
    } finally { 
        button.innerHTML = originalHtml; 
        button.disabled = false; 
    }
}

        async handlePasswordSubmit(e) {
            e.preventDefault();
            const button = e.target;
            const originalHtml = button.innerHTML;
            
            try {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
                button.disabled = true;
                
                const payload = {
                    currentPassword: document.getElementById('currentPassword')?.value,
                    newPassword: document.getElementById('newPassword')?.value
                    // NOTA: confirmPassword no se envía al backend, solo se valida en frontend
                };

                const confirmPassword = document.getElementById('confirmPassword')?.value;
                
                // Validaciones
                if (!payload.currentPassword || !payload.newPassword || !confirmPassword) {
                    this.showError('Todos los campos de contraseña son requeridos');
                    return;
                }
                
                if (payload.newPassword !== confirmPassword) {
                    this.showError('Las contraseñas nuevas no coinciden');
                    return;
                }
                
                if (payload.newPassword.length < 6) {
                    this.showError('La contraseña debe tener al menos 6 caracteres');
                    return;
                }

                console.log('Cambiando contraseña...');
                const response = await window.adminApp.apiCall(
                    '/users/change-password', 
                    { 
                        method: 'POST', 
                        body: JSON.stringify(payload) 
                    }
                );
                
                console.log('Respuesta cambio de contraseña:', response);
                
                if (response?.success) {
                    this.showSuccess('Contraseña cambiada correctamente');
                    
                    // Limpiar campos
                    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
                        const element = document.getElementById(id);
                        if (element) element.value = '';
                    });
                } else {
                    throw new Error(response?.error || response?.message || 'Error al cambiar la contraseña');
                }
            } catch(err) {
                console.error('Error cambiando contraseña:', err);
                
                let errorMsg = err.message || 'No se pudo cambiar la contraseña.';
                
                if (err.message.includes('400')) {
                    errorMsg = 'La contraseña actual es incorrecta.';
                } else if (err.message.includes('401')) {
                    errorMsg = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
                }
                
                this.showError(errorMsg);
            } finally { 
                button.innerHTML = originalHtml; 
                button.disabled = false; 
            }
        }

        async loadAuditLogs() {
            try {
                const params = new URLSearchParams({ 
                    page: this.currentPage, 
                    limit: this.logsPerPage, 
                    ...this.filters 
                });
                
                console.log('Cargando logs de auditoría con filtros:', this.filters);
                const response = await window.adminApp.apiCall(`/audit-logs?${params}`);
                
                console.log('Respuesta logs de auditoría:', response);
                
                if (response?.success) {
                    this.auditLogs = response.data || [];
                    console.log(`${this.auditLogs.length} logs cargados`);
                } else {
                    this.auditLogs = [];
                    console.warn('No se pudieron cargar logs de auditoría');
                }
                
                this.renderAuditLogs();
            } catch(err) {
                console.error('Error cargando logs:', err);
                this.auditLogs = []; 
                this.renderAuditLogs();
                this.showError('No se pudieron cargar los logs de auditoría');
            }
        }

        renderAuditLogs() {
            const tbody = document.getElementById('auditTableBody');
            if (!tbody) {
                console.warn('No se encontró auditTableBody en el DOM');
                return;
            }
            
            tbody.innerHTML = '';
            
            if (!this.auditLogs.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-gray-500">
                            No se encontraron registros de auditoría
                        </td>
                    </tr>
                `;
                this.updatePaginationInfo();
                return;
            }
            
            this.auditLogs.forEach(log => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50';
                
                const usuario = log.usuario || log.username || 'N/A';
                const userInitials = usuario.charAt(0).toUpperCase();
                const actionBadgeClass = this.getActionBadgeClass(log.accion);
                const nombreCompleto = log.nombreCompleto || `${log.nombre || ''} ${log.apellido || ''}`.trim() || 'N/A';
                
                tr.innerHTML = `
                    <td class="py-3 px-4 border-b">${new Date(log.fechaHora || log.created_at).toLocaleString('es-ES')}</td>
                    <td class="py-3 px-4 border-b">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                ${userInitials}
                            </div>
                            <div>
                                <div class="font-medium">${nombreCompleto}</div>
                                <div class="text-xs text-gray-500">${usuario}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4 border-b">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${actionBadgeClass}">
                            ${log.accion || 'N/A'}
                        </span>
                    </td>
                    <td class="py-3 px-4 border-b">${log.modulo || log.module || 'Sistema'}</td>
                    <td class="py-3 px-4 border-b max-w-xs truncate" title="${log.detalles || log.description || ''}">
                        ${log.detalles || log.description || '-'}
                    </td>
                    <td class="py-3 px-4 border-b font-mono text-xs">${log.ip_address || log.ip || '-'}</td>
                    <td class="py-3 px-4 border-b">
                        <button class="btn btn-danger btn-sm" onclick="adminConfig.deleteLog('${log.id}')" title="Eliminar registro">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            this.updatePaginationInfo();
        }

        getActionBadgeClass(action) {
            const actionMap = {
                'login': 'bg-green-100 text-green-800',
                'logout': 'bg-gray-100 text-gray-800',
                'create': 'bg-blue-100 text-blue-800',
                'update': 'bg-yellow-100 text-yellow-800',
                'delete': 'bg-red-100 text-red-800',
                'sincronizacion': 'bg-purple-100 text-purple-800',
                'estado': 'bg-orange-100 text-orange-800'
            };
            
            return actionMap[action?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        }

        applyFilters() { 
            this.filters = {
                agente: document.getElementById('filtro-agente')?.value || '',
                accion: document.getElementById('filtro-accion')?.value || '',
                modulo: document.getElementById('filtro-modulo')?.value || '',
                fechaDesde: document.getElementById('filtro-fecha-desde')?.value || ''
            };
            
            this.currentPage = 1; 
            this.loadAuditLogs(); 
        }
        
        clearFilters() {
            ['filtro-agente', 'filtro-accion', 'filtro-modulo', 'filtro-fecha-desde'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
            
            this.filters = {
                agente: '', 
                accion: '', 
                modulo: '', 
                fechaDesde: ''
            };
            
            this.applyFilters();
            this.showSuccess('Filtros limpiados correctamente');
        }
        
        previousPage() { 
            if (this.currentPage > 1) {
                this.currentPage--; 
                this.loadAuditLogs();
            }
        }
        
        nextPage() { 
            this.currentPage++; 
            this.loadAuditLogs(); 
        }
        
        updatePaginationInfo() {
            const infoElement = document.getElementById('pagination-info');
            const prevButton = document.getElementById('btn-prev-page');
            const nextButton = document.getElementById('btn-next-page');
            
            if (infoElement) {
                infoElement.textContent = `Página ${this.currentPage} – Mostrando ${this.auditLogs.length} registros`;
            }
            
            if (prevButton) {
                prevButton.disabled = this.currentPage === 1;
            }
            
            if (nextButton) {
                nextButton.disabled = this.auditLogs.length < this.logsPerPage;
            }
        }

        async exportAuditLogs() {
            try {
                const response = await window.adminApp.apiCall('/audit-logs/export');
                
                if (response?.success && response.data) {
                    const csvContent = response.data;
                    
                    const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    
                    link.href = url;
                    link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    this.showSuccess('Logs de auditoría exportados correctamente');
                } else {
                    throw new Error('No se pudieron exportar los logs');
                }
            } catch(err) {
                console.error('Error exportando logs:', err);
                this.showError('No se pudieron exportar los logs de auditoría: ' + err.message);
            }
        }

        async deleteLog(id) {
            if (!confirm('¿Estás seguro de que deseas eliminar este registro de auditoría?')) {
                return;
            }
            
            try {
                const response = await window.adminApp.apiCall(
                    `/audit-logs/${id}`, 
                    { method: 'DELETE' }
                );
                
                if (response?.success) {
                    this.showSuccess('Registro de auditoría eliminado correctamente');
                    this.loadAuditLogs();
                } else {
                    throw new Error(response?.error || 'Error al eliminar el registro');
                }
            } catch(err) {
                console.error('Error eliminando log:', err);
                this.showError(err.message);
            }
        }

    updateLocalStorageProfile(data) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Mapear nombres de campos
        const updatedUser = {
            ...user,
            id: data.id || user.id,
            nombre: data.primerNombre || data.nombre || user.nombre,
            apellido: data.apellido || user.apellido,
            telefono: data.telefono || user.telefono,
            email: data.correoElectronico || data.email || user.email,
            username: data.nombreUsuario || data.username || user.username,
            profile_picture: data.profile_picture || user.profile_picture,
            role: data.role || user.role || 'administrador' // CORREGIDO
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (window.adminApp?.currentUser) {
            window.adminApp.currentUser = updatedUser;
        }
        
        console.log('LocalStorage actualizado con datos de perfil:', updatedUser);
    } catch(err) {
        console.error('Error actualizando localStorage:', err);
    }
}

        async loadConfig() {
            console.log('Cargando configuración del sistema...');
            await this.loadCurrentUserProfile();
            await this.loadAgentsForAudit();
            await this.loadAuditLogs();
        }
        
        cleanup() {
            console.log('Limpiando AdminConfig...');
            // Limpiar referencias
            this.auditLogs = [];
            this.agents = [];
            this.currentUser = null;
            this.initialized = false;
        }
    }

    // Asignar al objeto global solo si no existe
    if (typeof window !== 'undefined') {
        window.AdminConfig = AdminConfig;
    }
} else {
    console.log('AdminConfig ya esta definido globalmente. Usando la instancia existente.');
}

// Función de carga inmediata
window.loadConfigModule = async function() {
    console.log('Inicializando AdminConfig manualmente...');
    
    if (window.adminConfig && window.adminConfig.initialized) {
        console.log('AdminConfig ya está inicializado');
        return window.adminConfig;
    }
    
    try {
        if (!window.adminConfig) {
            window.adminConfig = new AdminConfig();
        }
        
        await window.adminConfig.init();
        console.log('AdminConfig inicializado exitosamente');
        return window.adminConfig;
    } catch (error) {
        console.error('Error inicializando AdminConfig:', error);
        throw error;
    }
};

// Inicialización automática si estamos en la sección correcta
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, verificando si necesitamos inicializar AdminConfig...');
    
    const configSection = document.getElementById('config-audit-content');
    if (configSection) {
        console.log('Sección de configuración detectada');
        
        // Esperar a que adminApp esté disponible
        const checkAdminApp = setInterval(() => {
            if (window.adminApp && typeof window.adminApp.loadConfigSection === 'function') {
                clearInterval(checkAdminApp);
                console.log('AdminApp disponible');
                
                // Solo inicializar si la sección está activa
                if (configSection.style.display === 'block' || configSection.classList.contains('active')) {
                    console.log('Sección activa, inicializando AdminConfig...');
                    window.loadConfigModule().catch(error => {
                        console.error('Error inicializando AdminConfig automáticamente:', error);
                    });
                }
            }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(() => clearInterval(checkAdminApp), 5000);
    }
});