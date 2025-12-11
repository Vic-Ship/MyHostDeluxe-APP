// admin.users.js - CORREGIDO Y COMPLETO
class AdminUsers {
    constructor() {
        this.initialized = false;
        this.users = [];
        this.currentEditingUser = null;
        this.isCreating = false;
        this.elements = {};
        
        console.log('AdminUsers: Constructor iniciado');
    }

    async init() {
        if (this.initialized) {
            console.log('AdminUsers ya inicializado');
            return;
        }
        
        console.log('AdminUsers: Inicializando...');
        
        try {
            this.setupElements();
            this.setupEventListeners();
            await this.loadUsers();
            
            this.initialized = true;
            console.log('AdminUsers inicializado exitosamente');
            
        } catch (error) {
            console.error('Error inicializando AdminUsers:', error);
            window.mostrarToast('Error inicializando módulo de usuarios', 'danger');
        }
    }

    setupElements() {
        this.elements = {
            usersTableBody: document.getElementById('usersTableBody'),
            formularioUsuarioContainer: document.getElementById('formularioUsuarioContainer'),
            formUsuario: document.getElementById('form-usuario'),
            btnMostrarFormularioUsuario: document.getElementById('btnMostrarFormularioUsuario'),
            btnSincronizarUsuarios: document.getElementById('btnSincronizarUsuarios'),
            btnLimpiarFormularioUsuario: document.getElementById('btnLimpiarFormularioUsuario'),
            cerrarFormularioUsuario: document.getElementById('cerrarFormularioUsuario'),
            estadoUsuario: document.getElementById('estadoUsuario'),
            estadoUsuarioTexto: document.getElementById('estadoUsuario-texto'),
            submitUserBtn: document.getElementById('submitUserBtn'),
            usersListContainer: document.getElementById('usersListContainer'),
            btnCerrarFormularioUsuario: document.getElementById('btnCerrarFormularioUsuario'),
            searchUsers: document.getElementById('searchUsers'),
            rolUsuario: document.getElementById('rolUsuario'),
            nombreUsuario: document.getElementById('nombreUsuario'),
            apellidoUsuario: document.getElementById('apellidoUsuario'),
            emailUsuario: document.getElementById('emailUsuario'),
            telefonoUsuario: document.getElementById('telefonoUsuario'),
            usernameManual: document.getElementById('usernameManual'),
            passwordManual: document.getElementById('passwordManual'),
            confirmPasswordManual: document.getElementById('confirmPasswordManual')
        };
        
        console.log('Elementos configurados:', Object.keys(this.elements));
    }

    setupEventListeners() {
        // Botón para mostrar formulario
        if (this.elements.btnMostrarFormularioUsuario) {
            this.elements.btnMostrarFormularioUsuario.addEventListener('click', () => {
                this.mostrarFormularioCrear();
            });
        }

        // Botón de sincronización masiva
        if (this.elements.btnSincronizarUsuarios) {
            this.elements.btnSincronizarUsuarios.addEventListener('click', () => {
                this.sincronizarUsuarios();
            });
        }

        // Formulario de usuario
        if (this.elements.formUsuario) {
            this.elements.formUsuario.addEventListener('submit', (e) => {
                this.handleSubmit(e);
            });
        }

        // Botón limpiar formulario
        if (this.elements.btnLimpiarFormularioUsuario) {
            this.elements.btnLimpiarFormularioUsuario.addEventListener('click', () => {
                this.limpiarFormulario();
            });
        }

        // Botón cerrar formulario
        if (this.elements.cerrarFormularioUsuario) {
            this.elements.cerrarFormularioUsuario.addEventListener('click', () => {
                this.ocultarFormulario();
            });
        }

        // Botón alternativo cerrar formulario
        if (this.elements.btnCerrarFormularioUsuario) {
            this.elements.btnCerrarFormularioUsuario.addEventListener('click', () => {
                this.ocultarFormulario();
            });
        }

        // Estado del usuario
        if (this.elements.estadoUsuario) {
            this.elements.estadoUsuario.addEventListener('change', (e) => {
                this.actualizarEstadoTexto(e.target.checked);
            });
        }

        // Búsqueda de usuarios
        if (this.elements.searchUsers) {
            this.elements.searchUsers.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }

        // Toggle para mostrar/ocultar contraseñas
        this.setupPasswordToggles();

        // Delegación de eventos para botones de la tabla
        if (this.elements.usersTableBody) {
            this.elements.usersTableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const userId = btn.dataset.userId;
                if (!userId) return;

                const action = btn.dataset.action;
                
                switch(action) {
                    case 'ver':
                        this.verUsuario(userId);
                        break;
                    case 'editar':
                        this.editarUsuario(userId);
                        break;
                    case 'eliminar':
                        this.eliminarUsuario(userId);
                        break;
                    case 'sincronizar':
                        this.syncUserWithAgent(userId);
                        break;
                    case 'sync-existing':
                        this.syncExistingUserWithAgent(userId);
                        break;
                }
            });
        }

        // Escuchar eventos de cambios en agentes
        this.setupAgentSyncListeners();
    }

    setupPasswordToggles() {
        // Toggle para mostrar/ocultar contraseñas
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const input = e.target.closest('.input-contrasena').querySelector('input');
                const icon = e.target.closest('button').querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    setupAgentSyncListeners() {
        // Escuchar eventos de cambios en agentes con más detalle
        document.addEventListener('agentCreated', async (event) => {
            if (this.initialized) {
                console.log('Agente creado, recargando usuarios...', event.detail);
                await this.loadUsers();
                
                // Mostrar notificación específica
                if (event.detail.userId) {
                    window.mostrarToast(`Nuevo agente creado - Usuario ID: ${event.detail.userId}`, 'success');
                }
            }
        });

        document.addEventListener('agentUpdated', async (event) => {
            if (this.initialized) {
                console.log('Agente actualizado, recargando usuarios...', event.detail);
                
                // Recargar usuarios inmediatamente
                await this.loadUsers();
                
                // Buscar y actualizar usuario específico si es posible
                if (event.detail.agentData && event.detail.agentData.usuario) {
                    this.updateSpecificUserFromAgent(event.detail.agentData);
                }
                
                window.mostrarToast('Agente actualizado - Usuario sincronizado', 'info');
            }
        });

        document.addEventListener('agentDeleted', async (event) => {
            if (this.initialized) {
                console.log('Agente eliminado, recargando usuarios...', event.detail);
                
                // Recargar usuarios para reflejar eliminación
                await this.loadUsers();
                
                if (event.detail.usuarioID) {
                    window.mostrarToast(`Agente eliminado - Usuario ID ${event.detail.usuarioID} también eliminado`, 'warning');
                } else {
                    window.mostrarToast('Agente eliminado', 'warning');
                }
            }
        });
        
        // Nuevo evento específico para sincronización
        document.addEventListener('agentUserSynced', async (event) => {
            if (this.initialized) {
                console.log('Usuario sincronizado desde agente:', event.detail);
                
                // Recargar usuarios para reflejar cambios
                await this.loadUsers();
                
                window.mostrarToast('Cambios del agente sincronizados con usuario', 'info');
            }
        });
        
        // Evento de sincronización completa
        document.addEventListener('agentsUsersSynced', async (event) => {
            if (this.initialized) {
                console.log('Sincronización completa agentes-usuarios:', event.detail);
                // Opcional: mostrar notificación
                // window.mostrarToast('Sistemas sincronizados', 'success');
            }
        });
    }

    async loadUsers() {
        try {
            console.log('Cargando usuarios...');
            
            const response = await window.apiCall('/users');
            
            console.log('Respuesta de /users:', response);
            
            if (response && response.success && response.data) {
                this.users = response.data;
                console.log(`Usuarios cargados: ${this.users.length}`);
                
                // Verificar estados
                this.users.forEach(user => {
                    console.log(`Usuario ${user.username}: Activo=${user.is_active}, Rol=${user.role}`);
                });
                
                this.renderUsersTable();
            } else {
                this.users = [];
                this.renderUsersTable();
                console.log('No hay usuarios o respuesta vacía');
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            window.mostrarToast('No se pudieron cargar los usuarios: ' + error.message, 'danger');
        }
    }

    filterUsers(searchTerm) {
        if (!searchTerm) {
            this.renderUsersTable();
            return;
        }
        
        const filteredUsers = this.users.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (user.username && user.username.toLowerCase().includes(searchLower)) ||
                (user.nombre && user.nombre.toLowerCase().includes(searchLower)) ||
                (user.apellido && user.apellido.toLowerCase().includes(searchLower)) ||
                (user.email && user.email.toLowerCase().includes(searchLower)) ||
                (user.role && user.role.toLowerCase().includes(searchLower))
            );
        });
        
        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(filteredUsers) {
        if (!this.elements.usersTableBody) return;
        
        this.elements.usersTableBody.innerHTML = '';
        
        if (filteredUsers.length === 0) {
            this.elements.usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No se encontraron usuarios que coincidan con la búsqueda
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredUsers.forEach(user => {
            this.renderUserRow(user);
        });
    }

    renderUsersTable() {
        if (!this.elements.usersTableBody) {
            console.error('Elemento usersTableBody no encontrado');
            return;
        }

        this.elements.usersTableBody.innerHTML = '';
        
        if (!this.users || this.users.length === 0) {
            this.elements.usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        <i class="fas fa-users text-3xl mb-2 text-gray-300"></i>
                        <p>No hay usuarios registrados</p>
                        <button class="btn btn-primary mt-2" onclick="window.adminUsers?.sincronizarUsuarios()">
                            <i class="fas fa-sync-alt"></i> Sincronizar con Agentes
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        this.users.forEach(user => {
            this.renderUserRow(user);
        });
    }

    renderUserRow(user) {
        const tr = document.createElement('tr');
        const estadoClass = user.is_active ? 'activo' : 'inactivo';
        const estadoText = user.is_active ? 'Activo' : 'Inactivo';
        const rolClass = this.getRoleBadgeClass(user.role);
        const rolText = this.getRoleDisplayName(user.role);
        const iniciales = this.getUserInitials(user.nombre, user.apellido);
        
        // Verificar si tiene agente asociado
        const hasAgent = user.nombre && user.apellido; // Simplificado

        tr.innerHTML = `
            <td class="py-3 px-4 border-b">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 ${hasAgent ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} rounded-full flex items-center justify-center text-white text-sm font-bold">
                        ${iniciales}
                    </div>
                    <div>
                        <span class="font-medium">${user.username || '-'}</span>
                        ${hasAgent ? '' : '<span class="text-xs text-red-500 ml-2">Sin agente</span>'}
                    </div>
                </div>
            </td>
            <td class="py-3 px-4 border-b">${user.nombre || ''} ${user.apellido || ''}</td>
            <td class="py-3 px-4 border-b">${user.email || '-'}</td>
            <td class="py-3 px-4 border-b">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rolClass}">
                    ${rolText}
                </span>
            </td>
            <td class="py-3 px-4 border-b">
                <span class="status-badge ${estadoClass}">
                    <i class="fas ${user.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
                    ${estadoText}
                </span>
            </td>
            <td class="py-3 px-4 border-b">
                <div class="flex space-x-2">
                    <button class="btn btn-secondary btn-sm" data-user-id="${user.id}" data-action="ver" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" data-user-id="${user.id}" data-action="editar" title="Editar usuario">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!hasAgent ? `
                    <button class="btn btn-primary btn-sm" data-user-id="${user.id}" data-action="sincronizar" title="Crear agente desde usuario">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    ` : `
                    <button class="btn btn-success btn-sm" data-user-id="${user.id}" data-action="sync-existing" title="Sincronizar con agente">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    `}
                    <button class="btn btn-danger btn-sm" data-user-id="${user.id}" data-action="eliminar" title="Eliminar usuario">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        this.elements.usersTableBody.appendChild(tr);
    }

    getRoleBadgeClass(role) {
        const roleClasses = {
            'admin': 'bg-red-100 text-red-800 border border-red-200',
            'administrador': 'bg-red-100 text-red-800 border border-red-200',
            'agent': 'bg-blue-100 text-blue-800 border border-blue-200',
            'agente': 'bg-blue-100 text-blue-800 border border-blue-200',
            'user': 'bg-green-100 text-green-800 border border-green-200',
            'usuario': 'bg-green-100 text-green-800 border border-green-200'
        };
        return roleClasses[role] || 'bg-gray-100 text-gray-800 border border-gray-200';
    }

    getRoleDisplayName(role) {
        const roleMap = {
            'admin': 'Administrador',
            'administrador': 'Administrador',
            'agent': 'Agente',
            'agente': 'Agente',
            'user': 'Usuario',
            'usuario': 'Usuario'
        };
        return roleMap[role] || 'Usuario';
    }

    getUserInitials(nombre, apellido) {
        const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : 'U';
        const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : 'S';
        return firstInitial + lastInitial;
    }

    mostrarFormularioCrear() {
        this.isCreating = true;
        this.currentEditingUser = null;
        
        document.getElementById('formularioUsuarioTitle').textContent = 'Crear Usuario Manual';
        
        if (this.elements.formularioUsuarioContainer) {
            this.elements.formularioUsuarioContainer.classList.remove('hidden');
        }
        
        if (this.elements.usersListContainer) {
            this.elements.usersListContainer.classList.add('hidden');
        }
        
        this.limpiarFormulario();
        this.mostrarCamposPassword(true);
    }

    ocultarFormulario() {
        if (this.elements.formularioUsuarioContainer) {
            this.elements.formularioUsuarioContainer.classList.add('hidden');
        }
        
        if (this.elements.usersListContainer) {
            this.elements.usersListContainer.classList.remove('hidden');
        }
        
        this.currentEditingUser = null;
        this.isCreating = false;
    }

    limpiarFormulario() {
        if (this.elements.formUsuario) {
            this.elements.formUsuario.reset();
        }
        
        if (this.elements.estadoUsuario) {
            this.elements.estadoUsuario.checked = true;
        }
        
        this.actualizarEstadoTexto(true);
    }

    mostrarCamposPassword(mostrar) {
        const passwordSection = document.getElementById('passwordSection');
        if (passwordSection) {
            passwordSection.style.display = mostrar ? 'block' : 'none';
        }
        
        const confirmPassword = document.getElementById('confirmPasswordManual');
        if (confirmPassword) {
            confirmPassword.parentElement.style.display = mostrar ? 'block' : 'none';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.elements.submitUserBtn) return;
        
        const submitBtn = this.elements.submitUserBtn;
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;

            const formData = {
                nombre: document.getElementById('nombreUsuario').value.trim(),
                apellido: document.getElementById('apellidoUsuario').value.trim(),
                email: document.getElementById('emailUsuario').value.trim(),
                telefono: document.getElementById('telefonoUsuario').value.trim(),
                username: document.getElementById('usernameManual').value.trim(),
                role: document.getElementById('rolUsuario').value,
                is_active: Boolean(document.getElementById('estadoUsuario').checked)
            };

            console.log('Datos a enviar:', formData);

            // Validaciones básicas
            if (!formData.nombre || !formData.apellido || !formData.email || !formData.username || !formData.role) {
                window.mostrarToast('Todos los campos requeridos deben ser completados', 'warning');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            // Validar email
            if (!this.isValidEmail(formData.email)) {
                window.mostrarToast('Por favor ingrese un email válido', 'warning');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            if (this.isCreating) {
                const password = document.getElementById('passwordManual').value;
                const confirmPassword = document.getElementById('confirmPasswordManual').value;
                
                if (!password || password.length < 6) {
                    window.mostrarToast('La contraseña debe tener al menos 6 caracteres', 'warning');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return;
                }
                
                if (password !== confirmPassword) {
                    window.mostrarToast('Las contraseñas no coinciden', 'warning');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return;
                }
                
                formData.password = password;
            }

            let response;
            if (this.isCreating) {
                // Crear usuario
                response = await window.apiCall('/users', {
                    method: 'POST',
                    body: formData
                });
                
                if (response && response.success) {
                    // Disparar evento de usuario creado
                    document.dispatchEvent(new CustomEvent('userCreated', { 
                        detail: { 
                            userId: response.data.id,
                            userData: formData
                        } 
                    }));
                    
                    window.mostrarToast('Usuario creado correctamente', 'success');
                    this.ocultarFormulario();
                    await this.loadUsers();
                    
                    // Recargar agentes si es necesario
                    await this.syncWithAgents();
                } else {
                    throw new Error(response?.error || 'Error en la operación');
                }
            } else if (this.currentEditingUser) {
                // Actualizar usuario
                response = await window.apiCall(`/users/${this.currentEditingUser.id}`, {
                    method: 'PUT',
                    body: formData
                });
                
                if (response && response.success) {
                    // Disparar evento de usuario actualizado
                    document.dispatchEvent(new CustomEvent('userUpdated', { 
                        detail: { 
                            userId: this.currentEditingUser.id,
                            userData: formData
                        } 
                    }));
                    
                    window.mostrarToast('Usuario actualizado correctamente', 'success');
                    this.ocultarFormulario();
                    await this.loadUsers();
                    
                    // Recargar agentes si es necesario
                    await this.syncWithAgents();
                } else {
                    throw new Error(response?.error || 'Error en la operación');
                }
            } else {
                throw new Error('No hay usuario seleccionado para editar');
            }

        } catch (error) {
            console.error('Error al guardar usuario:', error);
            
            let errorMessage = 'Error al guardar usuario: ' + error.message;
            
            if (error.message.includes('email') || error.message.includes('CorreoElectronico')) {
                errorMessage = 'El email ya está registrado. Por favor use otro.';
            } else if (error.message.includes('username') || error.message.includes('NombreUsuario')) {
                errorMessage = 'El nombre de usuario ya está en uso. Por favor elija otro.';
            } else if (error.message.includes('400')) {
                errorMessage = 'Datos inválidos. Revise los campos.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Servicio no encontrado.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Error interno del servidor.';
            }
            
            window.mostrarToast(errorMessage, 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async syncWithAgents() {
        try {
            // Recargar la tabla de agentes si está disponible
            if (window.adminAgentsUI && typeof window.adminAgentsUI.loadAgents === 'function') {
                console.log('Sincronizando: Recargando tabla de agentes...');
                await window.adminAgentsUI.loadAgents();
                window.mostrarToast('Tablas sincronizadas correctamente', 'success');
            } else {
                console.log('Módulo de agentes no disponible para sincronización automática');
            }
        } catch (syncError) {
            console.warn('Advertencia: Error sincronizando con agentes:', syncError);
            // No mostrar error al usuario, es una sincronización en segundo plano
        }
    }

    // NUEVA FUNCIÓN: Actualizar usuario específico desde datos de agente
    updateSpecificUserFromAgent(agentData) {
        try {
            if (!this.users || !Array.isArray(this.users)) return;
            
            // Buscar usuario por nombre de usuario o email
            const userIndex = this.users.findIndex(u => 
                (u.username === agentData.usuario) || 
                (u.email === agentData.emailPersonal)
            );
            
            if (userIndex !== -1) {
                // Actualizar datos del usuario localmente
                const user = this.users[userIndex];
                
                // Actualizar campos relevantes
                if (agentData.nombre) user.nombre = agentData.nombre;
                if (agentData.apellido) user.apellido = agentData.apellido;
                if (agentData.emailPersonal) user.email = agentData.emailPersonal;
                if (agentData.rol) user.role = agentData.rol;
                
                // IMPORTANTE: Actualizar estado según estado laboral
                user.is_active = agentData.estadoLaboral === 'activo';
                
                console.log('Usuario actualizado desde agente:', user);
                
                // Forzar re-render de la fila específica
                this.renderUsersTable();
            }
        } catch (error) {
            console.error('Error actualizando usuario específico desde agente:', error);
        }
    }

    async verUsuario(userId) {
        try {
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                window.mostrarToast('Usuario no encontrado', 'danger');
                return;
            }

            // Crear modal de detalles
            const modalHtml = `
                <div class="modal-overlay active">
                    <div class="modal-content max-w-2xl">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                <i class="fas fa-user-circle mr-2"></i>
                                Detalles del Usuario
                            </h3>
                            <button type="button" class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="user-details">
                                <div class="flex items-center mb-6">
                                    <div class="user-avatar text-2xl mr-4">
                                        ${this.getUserInitials(user.nombre, user.apellido)}
                                    </div>
                                    <div>
                                        <h4 class="text-xl font-semibold">${user.nombre || ''} ${user.apellido || ''}</h4>
                                        <p class="user-role ${this.getRoleBadgeClass(user.role)} inline-block px-3 py-1 rounded-full text-sm">
                                            ${this.getRoleDisplayName(user.role)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div class="detail-item">
                                        <span class="detail-label">ID:</span>
                                        <span class="detail-value">${user.id}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Usuario:</span>
                                        <span class="detail-value">${user.username || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Email:</span>
                                        <span class="detail-value">${user.email || 'No especificado'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Teléfono:</span>
                                        <span class="detail-value">${user.telefono || 'No especificado'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Estado:</span>
                                        <span class="detail-value">
                                            <span class="status-badge ${user.is_active ? 'activo' : 'inactivo'}">
                                                <i class="fas ${user.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
                                                ${user.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Fecha Creación:</span>
                                        <span class="detail-value">${user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}</span>
                                    </div>
                                </div>
                                
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <h5 class="font-medium text-gray-700 mb-2">Información del Agente Asociado</h5>
                                    ${user.nombre && user.apellido ? `
                                    <p class="text-green-600">
                                        <i class="fas fa-check-circle mr-2"></i>
                                        Tiene agente asociado: ${user.nombre} ${user.apellido}
                                    </p>
                                    ` : `
                                    <p class="text-red-600">
                                        <i class="fas fa-exclamation-circle mr-2"></i>
                                        No tiene agente asociado
                                    </p>
                                    <button class="btn btn-primary btn-sm mt-2" onclick="window.adminUsers.syncUserWithAgent(${user.id}); this.closest('.modal-overlay').remove();">
                                        <i class="fas fa-user-plus mr-1"></i> Crear Agente
                                    </button>
                                    `}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="window.adminUsers.editarUsuario(${user.id}); this.closest('.modal-overlay').remove();">
                                <i class="fas fa-edit mr-1"></i> Editar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this.showModal(modalHtml);

        } catch (error) {
            console.error('Error al ver usuario:', error);
            window.mostrarToast('Error al cargar detalles del usuario', 'danger');
        }
    }

    async editarUsuario(userId) {
        try {
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                window.mostrarToast('Usuario no encontrado', 'danger');
                return;
            }

            this.currentEditingUser = user;
            this.isCreating = false;
            
            document.getElementById('formularioUsuarioTitle').textContent = 'Editar Usuario';
            
            if (this.elements.formularioUsuarioContainer) {
                this.elements.formularioUsuarioContainer.classList.remove('hidden');
            }
            
            if (this.elements.usersListContainer) {
                this.elements.usersListContainer.classList.add('hidden');
            }
            
            // Llenar formulario
            document.getElementById('nombreUsuario').value = user.nombre || '';
            document.getElementById('apellidoUsuario').value = user.apellido || '';
            document.getElementById('emailUsuario').value = user.email || '';
            document.getElementById('telefonoUsuario').value = user.telefono || '';
            document.getElementById('usernameManual').value = user.username || '';
            document.getElementById('rolUsuario').value = user.role || '';
            document.getElementById('estadoUsuario').checked = user.is_active;
            this.actualizarEstadoTexto(user.is_active);
            
            // Ocultar campos de contraseña en edición
            this.mostrarCamposPassword(false);

        } catch (error) {
            console.error('Error al editar usuario:', error);
            window.mostrarToast('Error al cargar datos del usuario', 'danger');
        }
    }

    async eliminarUsuario(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            window.mostrarToast('Usuario no encontrado', 'danger');
            return;
        }

        const confirmMessage = user.nombre && user.apellido 
            ? `¿Estás seguro de que quieres eliminar al usuario "${user.nombre} ${user.apellido}"?\n\nEsta acción también eliminará el agente asociado.`
            : `¿Estás seguro de que quieres eliminar al usuario "${user.username}"?`;
        
        if (!confirm(confirmMessage)) return;

        try {
            const response = await window.apiCall(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (response && response.success) {
                // Disparar evento de usuario eliminado
                document.dispatchEvent(new CustomEvent('userDeleted', { 
                    detail: { userId: userId } 
                }));
                
                window.mostrarToast('Usuario eliminado correctamente', 'success');
                await this.loadUsers();
                
                // Recargar agentes si está en la misma sesión
                await this.syncWithAgents();
            } else {
                throw new Error(response?.error || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            window.mostrarToast('Error al eliminar usuario: ' + error.message, 'danger');
        }
    }

    async syncUserWithAgent(userId) {
        try {
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                window.mostrarToast('Usuario no encontrado', 'danger');
                return;
            }

            window.mostrarToast(`Creando agente para usuario "${user.username}"...`, 'info');

            const response = await window.apiCall(`/users/${userId}/sync-agent`, {
                method: 'POST',
                body: {
                    nombre: user.nombre || user.username,
                    apellido: user.apellido || '',
                    email: user.email,
                    telefono: user.telefono,
                    role: user.role
                }
            });

            if (response && response.success) {
                window.mostrarToast('Agente creado exitosamente para el usuario', 'success');
                await this.loadUsers();
                
                // Recargar agentes también
                await this.syncWithAgents();
            } else {
                throw new Error(response?.error || 'Error en sincronización');
            }
        } catch (error) {
            console.error('Error creando agente para usuario:', error);
            window.mostrarToast('Error al crear agente: ' + error.message, 'danger');
        }
    }

    async syncExistingUserWithAgent(userId) {
        try {
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                window.mostrarToast('Usuario no encontrado', 'danger');
                return;
            }

            window.mostrarToast(`Sincronizando usuario "${user.username}" con agente...`, 'info');

            const response = await window.apiCall(`/users/${userId}/sync-existing-agent`, {
                method: 'POST',
                body: {
                    estado: user.is_active ? 'activo' : 'inactivo',
                    role: user.role,
                    email: user.email
                }
            });

            if (response && response.success) {
                window.mostrarToast('Usuario sincronizado exitosamente con agente', 'success');
                await this.loadUsers();
                
                // Recargar agentes también
                await this.syncWithAgents();
            } else {
                throw new Error(response?.error || 'Error en sincronización');
            }
        } catch (error) {
            console.error('Error sincronizando usuario con agente:', error);
            window.mostrarToast('Error al sincronizar: ' + error.message, 'danger');
        }
    }

    async sincronizarUsuarios() {
        try {
            const syncBtn = this.elements.btnSincronizarUsuarios;
            if (!syncBtn) return;
            
            const originalText = syncBtn.innerHTML;
            
            syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sincronizando...';
            syncBtn.disabled = true;

            window.mostrarToast('Sincronizando usuarios con agentes...', 'info');
            
            const response = await window.apiCall('/agents/migrate-to-users', {
                method: 'POST'
            });

            if (response && response.success) {
                window.mostrarToast(response.message || 'Sincronización completada correctamente', 'success');
                await this.loadUsers();
                
                // Recargar agentes también
                await this.syncWithAgents();
            } else {
                throw new Error(response?.error || 'Error en la sincronización');
            }
            
        } catch (error) {
            console.error('Error en sincronización:', error);
            window.mostrarToast('Error en sincronización: ' + error.message, 'danger');
        } finally {
            const syncBtn = this.elements.btnSincronizarUsuarios;
            if (syncBtn) {
                syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar Agentes-Usuarios';
                syncBtn.disabled = false;
            }
        }
    }

    actualizarEstadoTexto(activo) {
        if (this.elements.estadoUsuarioTexto) {
            if (activo) {
                this.elements.estadoUsuarioTexto.textContent = 'Usuario Activo';
                this.elements.estadoUsuarioTexto.className = 'text-green-600 font-medium';
            } else {
                this.elements.estadoUsuarioTexto.textContent = 'Usuario Inactivo';
                this.elements.estadoUsuarioTexto.className = 'text-red-600 font-medium';
            }
        }
    }

    showModal(html) {
        try {
            const existingModal = document.querySelector('.modal-overlay');
            if (existingModal && existingModal.parentNode) {
                existingModal.parentNode.removeChild(existingModal);
            }
            
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);
            
            const closeButtons = modalContainer.querySelectorAll('.modal-close');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (modalContainer.parentNode) {
                        modalContainer.parentNode.removeChild(modalContainer);
                    }
                });
            });
            
            modalContainer.addEventListener('click', (e) => {
                if (e.target === modalContainer) {
                    if (modalContainer.parentNode) {
                        modalContainer.parentNode.removeChild(modalContainer);
                    }
                }
            });
        } catch (error) {
            console.error('Error mostrando modal:', error);
        }
    }

    mostrarError(mensaje) {
        window.mostrarToast(mensaje, 'danger');
    }

    mostrarExito(mensaje) {
        window.mostrarToast(mensaje, 'success');
    }

    mostrarInfo(mensaje) {
        window.mostrarToast(mensaje, 'info');
    }

    cleanup() {
        console.log('Limpiando AdminUsers...');
        
        try {
            this.users = [];
            this.currentEditingUser = null;
            this.isCreating = false;
            this.initialized = false;
            this.elements = {};
            
            // Cerrar cualquier modal abierto de forma segura
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                try {
                    if (modal && modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                } catch (error) {
                    console.warn('Error eliminando modal:', error);
                }
            });
            
            console.log('AdminUsers limpiado exitosamente');
        } catch (error) {
            console.error('Error durante cleanup de AdminUsers:', error);
        }
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL SEGURA
// =============================================

// Exponer clase globalmente
window.AdminUsers = AdminUsers;

// Inicialización global segura
function initializeAdminUsersModule() {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('=== INICIALIZACIÓN SEGURA DE ADMIN USERS ===');
            
            // Verificar si ya está inicializado
            if (window.adminUsers && window.adminUsers.initialized) {
                console.log('AdminUsers ya está inicializado');
                resolve(window.adminUsers);
                return;
            }
            
            // Verificar que los elementos críticos del DOM existen
            const requiredElements = [
                'usersTableBody',
                'formularioUsuarioContainer',
                'usersListContainer'
            ];
            
            const missingElements = requiredElements.filter(id => !document.getElementById(id));
            if (missingElements.length > 0) {
                console.warn('Algunos elementos del DOM no encontrados:', missingElements);
                // Continuar de todos modos, algunos elementos pueden ser opcionales
            }
            
            // Crear nueva instancia
            console.log('Creando nueva instancia de AdminUsers...');
            window.adminUsers = new AdminUsers();
            await window.adminUsers.init();
            
            console.log('AdminUsers inicializado exitosamente');
            resolve(window.adminUsers);
            
        } catch (error) {
            console.error('Error crítico inicializando AdminUsers:', error);
            
            // Crear una instancia mínima para evitar errores
            window.adminUsers = {
                initialized: false,
                loadUsers: () => {
                    console.warn('AdminUsers no está inicializado correctamente');
                    return Promise.resolve();
                },
                cleanup: () => {
                    console.log('Cleanup de AdminUsers fallback');
                },
                mostrarError: (msg) => console.error('AdminUsers error:', msg)
            };
            
            reject(error);
        }
    });
}

// Exponer función de inicialización con alias
window.loadUsersModule = initializeAdminUsersModule;
window.initializeAdminUsers = initializeAdminUsersModule;

// Inicialización automática cuando es necesario
document.addEventListener('DOMContentLoaded', () => {
    console.log('admin.users.js cargado - Modo seguro activado');
    
    // Escuchar eventos de cambio de sección
    document.addEventListener('adminAppSectionChange', (event) => {
        if (event.detail.sectionId === 'users-content') {
            console.log('Sección de usuarios activada, inicializando módulo...');
            
            // Esperar un momento para que el DOM esté listo
            setTimeout(() => {
                if (!window.adminUsers || !window.adminUsers.initialized) {
                    initializeAdminUsersModule().catch(error => {
                        console.error('No se pudo inicializar AdminUsers:', error);
                        window.mostrarToast('Error al cargar módulo de usuarios. Recargue la página.', 'warning');
                    });
                }
            }, 300);
        }
    });
    
    // También inicializar si ya estamos en la sección de usuarios al cargar
    const usersContent = document.getElementById('users-content');
    if (usersContent && usersContent.classList.contains('active')) {
        console.log('Ya en sección de usuarios, inicializando...');
        setTimeout(() => {
            initializeAdminUsersModule().catch(error => {
                console.error('Error inicializando AdminUsers al cargar:', error);
            });
        }, 500);
    }
});

// Función para verificar si el módulo está listo
window.isAdminUsersReady = function() {
    return window.adminUsers && window.adminUsers.initialized;
};

// Función de recarga manual
window.reloadAdminUsers = function() {
    if (window.adminUsers && window.adminUsers.initialized) {
        return window.adminUsers.loadUsers();
    } else {
        return initializeAdminUsersModule().then(module => module.loadUsers());
    }
};

// Función de ayuda para debug
window.debugAdminUsers = function() {
    return {
        isInitialized: window.isAdminUsersReady(),
        instance: window.adminUsers,
        usersCount: window.adminUsers ? window.adminUsers.users.length : 0,
        reload: window.reloadAdminUsers,
        forceInit: initializeAdminUsersModule
    };
};

console.log('admin.users.js cargado completamente - Versión segura');