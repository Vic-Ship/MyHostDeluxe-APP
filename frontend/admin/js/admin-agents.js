// admin-agents.js - CORREGIDO y OPTIMIZADO
class AdminAgentsUI {
    constructor() {
        this.agents = [];
        this.filteredAgents = [];
        this.currentEditId = null;
        this.initialized = false;
        
        this.filters = {
            search: '',
            sucursal: 'todos',
            estado: 'todos'
        };
        
        console.log('AdminAgentsUI: Constructor iniciado');
    }

    async init() {
        if (this.initialized) {
            console.log('AdminAgentsUI ya inicializado');
            return;
        }
        
        console.log('AdminAgentsUI: Inicializando módulo...');
        
        try {
            this.setupEventListeners();
            this.setupFilters();
            await this.loadAgents();
            
            this.initialized = true;
            console.log('AdminAgentsUI: Módulo inicializado correctamente');
            
        } catch (error) {
            console.error('Error inicializando AdminAgentsUI:', error);
            window.mostrarToast('Error inicializando módulo de agentes', 'danger');
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners de agentes...');
        
        const showBtn = document.getElementById('btnMostrarFormularioAgente');
        const closeBtn = document.getElementById('cerrarFormularioAgente');
        const cancelBtn = document.querySelector('#form-agente .btn-secondary'); 
        const form = document.getElementById('form-agente');

        if (showBtn) {
            showBtn.addEventListener('click', () => this.showAgentForm());
            console.log('Botón mostrar formulario configurado');
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideAgentForm());
            console.log('Botón cerrar formulario configurado');
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideAgentForm());
            console.log('Botón cancelar configurado');
        }

        if (form) {
            form.addEventListener('submit', async (e) => await this.handleAgentSubmit(e));
            console.log('Formulario de agente configurado');
        }

        // Delegación de eventos para los botones de acción
        const agentsTableBody = document.getElementById('agentsTableBody');
        if (agentsTableBody) {
            agentsTableBody.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action && id) {
                    console.log(`Acción ${action} solicitada para agente ID: ${id}`);
                    switch(action) {
                        case 'ver': 
                            this.viewAgent(id); 
                            break;
                        case 'editar': 
                            this.editAgent(id); 
                            break;
                        case 'eliminar': 
                            this.deleteAgent(id); 
                            break;
                    }
                }
            });
        }

        const migrateBtn = document.getElementById('btnMigrarAgentes');
        if (migrateBtn) {
            migrateBtn.addEventListener('click', () => this.migrateExistingAgents());
            console.log('Botón migrar agentes configurado');
        }

        // Escuchar eventos de cambios en usuarios
        this.setupUserSyncListeners();
    }

    setupUserSyncListeners() {
        // Escuchar eventos de cambios en usuarios
        document.addEventListener('userCreated', async () => {
            if (this.initialized) {
                console.log('Usuario creado, recargando agentes...');
                await this.loadAgents();
            }
        });

        document.addEventListener('userUpdated', async () => {
            if (this.initialized) {
                console.log('Usuario actualizado, recargando agentes...');
                await this.loadAgents();
            }
        });

        document.addEventListener('userDeleted', async () => {
            if (this.initialized) {
                console.log('Usuario eliminado, recargando agentes...');
                await this.loadAgents();
            }
        });
    }

    setupFilters() {
        console.log('Configurando filtros de agentes...');
        
        const buscarInput = document.getElementById('buscarAgente');
        const sucursalSelect = document.getElementById('filtroSucursalAgente');
        const estadoSelect = document.getElementById('filtroEstadoAgente');

        if (buscarInput) {
            buscarInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        if (sucursalSelect) {
            sucursalSelect.addEventListener('change', (e) => {
                this.filters.sucursal = e.target.value;
                this.applyFilters();
            });
        }

        if (estadoSelect) {
            estadoSelect.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.applyFilters();
            });
        }

        console.log('Filtros de agentes configurados');
    }

    applyFilters() {
        console.log('Aplicando filtros:', this.filters);
        
        this.filteredAgents = this.agents.filter(agent => {
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const fullName = `${agent.nombre || ''} ${agent.apellido || ''}`.toLowerCase();
                const email = (agent.emailPersonal || '').toLowerCase();
                const usuario = (agent.usuario || '').toLowerCase();
                
                if (!fullName.includes(searchTerm) && 
                    !email.includes(searchTerm) && 
                    !usuario.includes(searchTerm)) {
                    return false;
                }
            }

            if (this.filters.sucursal !== 'todos' && agent.sucursal !== this.filters.sucursal) {
                return false;
            }

            if (this.filters.estado !== 'todos' && agent.estadoLaboral !== this.filters.estado) {
                return false;
            }

            return true;
        });

        console.log(`Filtros aplicados: ${this.filteredAgents.length} de ${this.agents.length} agentes`);
        this.renderAgents();
    }

    showAgentForm() {
        console.log('Mostrando formulario de agente');
        const formContainer = document.getElementById('formularioAgenteContainer');
        const listContainer = document.getElementById('agentsListContainer');
        const showButton = document.getElementById('btnMostrarFormularioAgente');

        if (formContainer) formContainer.classList.remove('hidden');
        if (listContainer) listContainer.classList.add('hidden');
        if (showButton) showButton.classList.add('hidden');
        
        this.currentEditId = null;
        
        const form = document.getElementById('form-agente');
        if (form) {
            form.reset();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Agente';
                submitBtn.disabled = false;
            }
        }
    }

    hideAgentForm() {
        console.log('Ocultando formulario de agente');
        const formContainer = document.getElementById('formularioAgenteContainer');
        const listContainer = document.getElementById('agentsListContainer');
        const showButton = document.getElementById('btnMostrarFormularioAgente');
        const form = document.getElementById('form-agente');

        if (formContainer) formContainer.classList.add('hidden');
        if (listContainer) listContainer.classList.remove('hidden');
        if (showButton) showButton.classList.remove('hidden');
        if (form) {
            form.reset();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Agente';
                submitBtn.disabled = false;
            }
        }
        
        this.currentEditId = null;
    }

    async handleAgentSubmit(e) {
        e.preventDefault();
        console.log('=== INICIO ENVÍO FORMULARIO AGENTE ===');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;

            const formData = new FormData(e.target);
            const agentData = Object.fromEntries(formData.entries());

            console.log('Datos del formulario capturados:', agentData);

            if (!this.validateAgentData(agentData)) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            // IMPORTANTE: En tu estructura, el "usuario" se refiere al nombre de usuario para login
            // Si no se proporciona, generarlo automáticamente
            if (!agentData.usuario || agentData.usuario.trim() === '') {
                agentData.usuario = `${agentData.nombre.toLowerCase().trim()}.${agentData.apellido.toLowerCase().trim()}`;
                console.log('Usuario generado automáticamente:', agentData.usuario);
            }

            // La contraseña es obligatoria para crear el usuario
            if (!agentData.clave || agentData.clave.trim() === '') {
                agentData.clave = '123456'; // Contraseña por defecto
                console.log('Contraseña por defecto asignada');
            }

            // Valores por defecto para campos específicos de tu DB
            if (!agentData.estadoLaboral) {
                agentData.estadoLaboral = 'activo';
            }

            if (!agentData.rol) {
                agentData.rol = 'agente'; // Solo 'agente' o 'administrador'
            }

            const dataToSend = {
                ...agentData,
                // Convertir campos numéricos si es necesario
                numId: agentData.numId ? parseInt(agentData.numId) : null,
                // Mapear nombres si son diferentes
                fechaNac: agentData.fechaNac,
                fechaIngreso: agentData.fechaIngreso || new Date().toISOString().split('T')[0],
                emailInst: agentData.emailInst || agentData.emailPersonal
            };

            // Eliminar campo clave si está vacío (para actualizaciones)
            if (this.currentEditId && (!dataToSend.clave || dataToSend.clave.trim() === '')) {
                delete dataToSend.clave;
            }

            console.log('Datos a enviar al servidor:', dataToSend);
            
            let response;
            if (this.currentEditId) {
                console.log(`Actualizando agente ID: ${this.currentEditId}`);
                response = await window.apiCall(`/agents/${this.currentEditId}`, {
                    method: 'PUT',
                    body: dataToSend
                });
                
                // Disparar evento de agente actualizado
                document.dispatchEvent(new CustomEvent('agentUpdated', { 
                    detail: { agentId: this.currentEditId } 
                }));
                
                window.mostrarToast('Agente actualizado exitosamente', 'success');
            } else {
                console.log('Creando nuevo agente');
                console.log('Enviando datos al servidor:', dataToSend);
                
                response = await window.apiCall('/agents', {
                    method: 'POST',
                    body: dataToSend
                });
                
                console.log('Respuesta del servidor recibida:', response);
                
                if (response && response.success) {
                    // Disparar evento de agente creado
                    document.dispatchEvent(new CustomEvent('agentCreated', { 
                        detail: { agentData: dataToSend } 
                    }));
                    
                    window.mostrarToast('Agente creado exitosamente', 'success');
                } else {
                    throw new Error(response?.message || 'Error desconocido del servidor');
                }
            }
            
            this.hideAgentForm();
            await this.loadAgents();
            
            // SINCRONIZACIÓN CON USUARIOS
            await this.syncWithUsers();
            
        } catch (error) {
            console.error('=== ERROR DETALLADO ===');
            console.error('Error completo:', error);
            console.error('Mensaje:', error.message);
            
            let errorMessage = 'Error al guardar agente';
            
            if (error.message.includes('Network Error')) {
                errorMessage = 'Error de red. Verifique su conexión.';
            } else if (error.message.includes('401')) {
                errorMessage = 'No autorizado. Inicie sesión nuevamente.';
            } else if (error.message.includes('403')) {
                errorMessage = 'No tiene permisos para esta acción.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Servicio no encontrado.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Error interno del servidor.';
            } else if (error.message.includes('UNIQUE') || error.message.includes('duplicate') || 
                    error.message.includes('usuario') || error.message.includes('NombreUsuario')) {
                errorMessage = 'El nombre de usuario ya existe. Por favor elija otro.';
            } else if (error.message.includes('identificación') || error.message.includes('NumeroIdentificacion')) {
                errorMessage = 'El número de identificación ya está registrado.';
            } else if (error.message.includes('email') || error.message.includes('CorreoElectronico')) {
                errorMessage = 'El email ya está registrado.';
            } else {
                errorMessage = error.message || 'Error desconocido';
            }
            
            window.mostrarToast(errorMessage, 'danger');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            console.log('=== FIN ENVÍO FORMULARIO ===');
        }
    }

    async syncWithUsers() {
        try {
            // Recargar la tabla de usuarios si está disponible
            if (window.adminUsers && typeof window.adminUsers.loadUsers === 'function') {
                console.log('Sincronizando: Recargando tabla de usuarios...');
                await window.adminUsers.loadUsers();
                window.mostrarToast('Tablas sincronizadas correctamente', 'success');
            } else {
                console.log('Módulo de usuarios no disponible para sincronización automática');
            }
        } catch (syncError) {
            console.warn('Advertencia: Error sincronizando con usuarios:', syncError);
            // No mostrar error al usuario, es una sincronización en segundo plano
        }
    }

    validateAgentData(agentData) {
        console.log('Validando datos del agente...');
        
        if (!agentData.nombre || !agentData.apellido) {
            window.mostrarToast('Nombre y apellido son obligatorios', 'warning');
            return false;
        }

        if (agentData.emailPersonal && !this.isValidEmail(agentData.emailPersonal)) {
            window.mostrarToast('Por favor ingrese un email personal válido', 'warning');
            return false;
        }

        if (agentData.emailInst && !this.isValidEmail(agentData.emailInst)) {
            window.mostrarToast('Por favor ingrese un email institucional válido', 'warning');
            return false;
        }

        if (agentData.tel1 && !this.isValidPhone(agentData.tel1)) {
            window.mostrarToast('Por favor ingrese un número de teléfono principal válido', 'warning');
            return false;
        }

        if (agentData.tel2 && !this.isValidPhone(agentData.tel2)) {
            window.mostrarToast('Por favor ingrese un número de teléfono secundario válido', 'warning');
            return false;
        }

        if (agentData.fechaNac) {
            const birthDate = new Date(agentData.fechaNac);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                window.mostrarToast('El agente debe ser mayor de 18 años', 'warning');
                return false;
            }
        }

        console.log('Datos validados correctamente');
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
        return phoneRegex.test(phone);
    }

    async loadAgents() {
        console.log('Cargando lista de agentes...');
        try {
            const response = await window.apiCall('/agents');
            
            if (response && response.success && response.data) {
                this.agents = response.data || [];
                this.filteredAgents = [...this.agents];
                console.log(`Agentes cargados: ${this.agents.length}`);
                this.renderAgents();
            } else {
                this.agents = [];
                this.filteredAgents = [];
                this.renderAgents();
                console.log('No hay agentes o respuesta vacía');
            }
        } catch (error) {
            console.error('Error al cargar agentes:', error);
            this.agents = [];
            this.filteredAgents = [];
            this.renderAgents();
            window.mostrarToast('No se pudieron cargar los agentes: ' + error.message, 'danger');
        }
    }

    async deleteAgent(id) {
        const agent = this.agents.find(a => a.id == id);
        if (!agent) {
            window.mostrarToast('Agente no encontrado', 'danger');
            return;
        }

        const confirmDelete = confirm(`¿Está seguro de que desea eliminar al agente ${agent.nombre} ${agent.apellido}?\n\nEsta acción también eliminará el usuario asociado y no se puede deshacer.`);
        if (!confirmDelete) return;

        try {
            console.log(`Eliminando agente ID: ${id}`);
            await window.apiCall(`/agents/${id}`, { 
                method: 'DELETE' 
            });
            
            // Disparar evento de agente eliminado
            document.dispatchEvent(new CustomEvent('agentDeleted', { 
                detail: { agentId: id } 
            }));
            
            window.mostrarToast('Agente eliminado exitosamente', 'success');
            await this.loadAgents();
            
            // SINCRONIZACIÓN CON USUARIOS
            await this.syncWithUsers();
            
        } catch (error) {
            console.error('Error eliminando agente:', error);
            window.mostrarToast('Error al eliminar agente: ' + error.message, 'danger');
        }
    }

    editAgent(id) {
    console.log(`Editando agente ID: ${id}`);
    const agent = this.agents.find(a => a.id == id);
    if (!agent) {
        window.mostrarToast('Agente no encontrado', 'danger');
        return;
    }

    this.showAgentForm();
    this.currentEditId = id;

    const form = document.getElementById('form-agente');
    if (!form) return;

    const fieldMappings = {
        'nombre': 'nombre',
        'apellido': 'apellido',
        'fechaNac': 'fechaNac',
        'genero': 'genero',
        'numId': 'numId',
        'emailPersonal': 'emailPersonal',
        'emailInst': 'emailInst',
        'tel1': 'tel1',
        'tel2': 'tel2',
        'direccion': 'direccion',
        'sucursal': 'sucursal',
        'cargo': 'cargo',
        'fechaIngreso': 'fechaIngreso',
        'tipoContrato': 'tipoContrato',
        'duracionContrato': 'duracionContrato',
        'estadoLaboral': 'estadoLaboral',
        'rol': 'rol',
        'usuario': 'usuario',
        'clave': '',
        'especialidad': 'especialidad',
        'notas': 'notas'
    };

    Object.keys(fieldMappings).forEach(fieldName => {
        const formField = form[fieldName];
        const agentField = fieldMappings[fieldName];
        
        if (formField) {
            if (fieldName === 'fechaNac' || fieldName === 'fechaIngreso') {
                if (agent[agentField]) {
                    const date = new Date(agent[agentField]);
                    if (!isNaN(date.getTime())) {
                        formField.value = date.toISOString().split('T')[0];
                    }
                }
            } else if (fieldName === 'clave') {
                formField.value = '';
                formField.placeholder = 'Dejar en blanco para mantener la actual';
            } else if (fieldName === 'estadoLaboral') {
                // IMPORTANTE: Cargar correctamente el estado laboral
                if (agent[agentField] !== undefined) {
                    formField.value = agent[agentField] || 'activo';
                    console.log(`Estado laboral cargado: ${agent[agentField]} -> ${formField.value}`);
                }
            } else if (agent[agentField] !== undefined) {
                formField.value = agent[agentField] || '';
            }
        }
    });

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Agente';
    }

    console.log('Formulario de edición listo, datos cargados:', {
        nombre: agent.nombre,
        estadoLaboral: agent.estadoLaboral,
        rol: agent.rol
    });
}

    viewAgent(id) {
        console.log(`Viendo detalles del agente ID: ${id}`);
        const agent = this.agents.find(a => a.id == id);
        if (!agent) {
            window.mostrarToast('Agente no encontrado', 'danger');
            return;
        }

        const rolTexto = agent.rol === 'administrador' ? 'Administrador' : 'Agente';
        
        const modalHtml = `
            <div class="modal-overlay active">
                <div class="ficha-agente">
                    <div class="ficha-header">
                        <div class="avatar">
                            ${(agent.nombre?.charAt(0) || '') + (agent.apellido?.charAt(0) || '')}
                        </div>
                        <div>
                            <h2 class="ficha-titulo">${agent.nombre || ''} ${agent.apellido || ''}</h2>
                            <p class="ficha-subtitulo">${agent.cargo || 'Agente'} • ${agent.sucursal || 'Sin sucursal'} • ${rolTexto}</p>
                        </div>
                        <button class="ficha-close">&times;</button>
                    </div>
                    
                    <div class="ficha-body">
                        <div class="ficha-grid">
                            <div class="ficha-item">
                                <i class="fas fa-id-card"></i>
                                <span class="ficha-label">Identificación:</span>
                                <span class="ficha-valor">${agent.numId || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-birthday-cake"></i>
                                <span class="ficha-label">Fecha Nacimiento:</span>
                                <span class="ficha-valor">${agent.fechaNac ? new Date(agent.fechaNac).toLocaleDateString('es-ES') : 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-venus-mars"></i>
                                <span class="ficha-label">Género:</span>
                                <span class="ficha-valor">${agent.genero === 'M' ? 'Masculino' : agent.genero === 'F' ? 'Femenino' : 'No especificado'}</span>
                            </div>

                            <div class="ficha-item">
                                <i class="fas fa-envelope"></i>
                                <span class="ficha-label">Email Personal:</span>
                                <span class="ficha-valor">${agent.emailPersonal || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-envelope"></i>
                                <span class="ficha-label">Email Institucional:</span>
                                <span class="ficha-valor">${agent.emailInst || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-phone"></i>
                                <span class="ficha-label">Teléfono Principal:</span>
                                <span class="ficha-valor">${this.formatPhone(agent.tel1) || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-phone-alt"></i>
                                <span class="ficha-label">Teléfono Secundario:</span>
                                <span class="ficha-valor">${this.formatPhone(agent.tel2) || 'No especificado'}</span>
                            </div>

                            <div class="ficha-item">
                                <i class="fas fa-building"></i>
                                <span class="ficha-label">Sucursal:</span>
                                <span class="ficha-valor">${agent.sucursal || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-briefcase"></i>
                                <span class="ficha-label">Cargo:</span>
                                <span class="ficha-valor">${agent.cargo || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span class="ficha-label">Fecha Ingreso:</span>
                                <span class="ficha-valor">${agent.fechaIngreso ? new Date(agent.fechaIngreso).toLocaleDateString('es-ES') : 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-file-contract"></i>
                                <span class="ficha-label">Tipo Contrato:</span>
                                <span class="ficha-valor">${agent.tipoContrato || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-clock"></i>
                                <span class="ficha-label">Duración Contrato:</span>
                                <span class="ficha-valor">${agent.duracionContrato || 'No especificado'}</span>
                            </div>

                            <div class="ficha-item">
                                <i class="fas fa-user-check"></i>
                                <span class="ficha-label">Estado Laboral:</span>
                                <span class="ficha-valor">
                                    <span class="status-badge ${agent.estadoLaboral === 'activo' ? 'activo' : 'inactivo'}">
                                        ${agent.estadoLaboral === 'activo' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-user-tag"></i>
                                <span class="ficha-label">Rol:</span>
                                <span class="ficha-valor">${rolTexto}</span>
                            </div>
                            
                            <div class="ficha-item">
                                <i class="fas fa-user"></i>
                                <span class="ficha-label">Usuario:</span>
                                <span class="ficha-valor">${agent.usuario || 'No especificado'}</span>
                            </div>

                            <div class="ficha-item">
                                <i class="fas fa-star"></i>
                                <span class="ficha-label">Especialidad:</span>
                                <span class="ficha-valor">${agent.especialidad || 'No especificado'}</span>
                            </div>
                            
                            <div class="ficha-item" style="grid-column: 1 / -1;">
                                <i class="fas fa-sticky-note"></i>
                                <span class="ficha-label">Notas Internas:</span>
                                <span class="ficha-valor">${agent.notas || 'Sin notas adicionales'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ficha-footer">
                        <button class="btn btn-secondary ficha-close">Cerrar</button>
                        <button class="btn btn-primary" onclick="window.adminAgentsUI.editAgent('${agent.id}'); document.querySelector('.modal-overlay.active')?.remove();">
                            <i class="fas fa-edit"></i> Editar Agente
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHtml);
    }

    formatPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{4})(\d{4})/, '$1-$2');
    }

    showModal(html) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);
        
        const closeButtons = modalContainer.querySelectorAll('.ficha-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalContainer.remove();
            });
        });
        
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.remove();
            }
        });
    }

    renderAgents() {
        const tbody = document.getElementById("agentsTableBody");
        if (!tbody) {
            console.error('No se encontró el tbody de la tabla de agentes');
            return;
        }

        tbody.innerHTML = '';
        
        if (this.filteredAgents.length === 0) {
            const noResultsText = Object.values(this.filters).some(f => f && f !== 'todos') 
                ? 'No hay agentes que coincidan con los filtros aplicados.' 
                : 'No hay agentes registrados.';
                
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">${noResultsText}</td></tr>`;
            return;
        }

        this.filteredAgents.forEach(agent => {
            const estadoClass = agent.estadoLaboral === 'activo' ? 'activo' : 'inactivo';
            const estadoText = agent.estadoLaboral === 'activo' ? 'Activo' : 'Inactivo';

            const tr = document.createElement('tr');
            tr.dataset.id = agent.id;
            tr.innerHTML = `
                <td class="font-medium">${agent.nombre || ''} ${agent.apellido || ''}</td>
                <td>${agent.emailPersonal || '-'}</td>
                <td>${this.formatPhone(agent.tel1) || '-'}</td>
                <td>${agent.sucursal || '-'}</td>
                <td>
                    <span class="status-badge ${estadoClass}">
                        ${estadoText}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm action-btn" data-action="ver" data-id="${agent.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm action-btn" data-action="editar" data-id="${agent.id}" title="Editar agente">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" data-action="eliminar" data-id="${agent.id}" title="Eliminar agente">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        console.log(`Tabla de agentes renderizada: ${this.filteredAgents.length} agentes`);
    }

    async migrateExistingAgents() {
        const confirmMigrate = confirm('¿Está seguro de que desea migrar los agentes existentes?\n\nEsta acción creará usuarios para todos los agentes que no tengan usuario asociado.');
        if (!confirmMigrate) return;

        try {
            console.log('Iniciando migración de agentes...');
            const response = await window.apiCall('/agents/migrate-to-users', {
                method: 'POST'
            });
            
            if (response.success) {
                window.mostrarToast(response.message, 'success');
                if (response.data && response.data.errors) {
                    console.warn('Errores durante la migración:', response.data.errors);
                }
                await this.loadAgents();
                
                // Recargar usuarios también
                await this.syncWithUsers();
            }
        } catch (error) {
            console.error('Error en migración:', error);
            window.mostrarToast('Error en migración: ' + error.message, 'danger');
        }
    }

    cleanup() {
        console.log('Limpiando recursos de AdminAgentsUI...');
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        this.agents = [];
        this.filteredAgents = [];
        this.currentEditId = null;
        this.initialized = false;
    }
}

// Inicialización global
window.AdminAgentsUI = AdminAgentsUI;

// Función para inicializar el módulo
window.initializeAdminAgents = async function() {
    console.log('Inicializando AdminAgentsUI...');
    
    if (window.adminAgentsUI && window.adminAgentsUI.initialized) {
        console.log('AdminAgentsUI ya está inicializado');
        return window.adminAgentsUI;
    }
    
    try {
        window.adminAgentsUI = new AdminAgentsUI();
        await window.adminAgentsUI.init();
        console.log('AdminAgentsUI inicializado exitosamente');
        return window.adminAgentsUI;
    } catch (error) {
        console.error('Error inicializando AdminAgentsUI:', error);
        throw error;
    }
};

// Inicialización condicional al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('admin-agents.js cargado completamente');
    
    // Si estamos en la sección de agentes, inicializar automáticamente
    if (document.getElementById('clients-content') && 
        document.getElementById('clients-content').classList.contains('active')) {
        console.log('Sección de agentes activa, inicializando AdminAgentsUI...');
        setTimeout(() => {
            window.initializeAdminAgents().catch(console.error);
        }, 500);
    }
});

// También exponer para carga manual
window.loadAgentsModule = window.initializeAdminAgents;