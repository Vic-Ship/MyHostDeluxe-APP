// agent-clients.js - Versión completa con funcionalidades arregladas
window.agentClients = {
    // Inicializar módulo
    async init() {
        console.log('Inicializando módulo de clientes...');
        
        // Asignar eventos a botones si existen
        const btnCancelar = document.getElementById('btnCancelarCliente');
        const btnVolverLista = document.getElementById('btnVolverListaClientes');
        const formCliente = document.getElementById('form-cliente');
        const btnNuevoCliente = document.getElementById('btnNuevoCliente');
        
        if (btnCancelar) {
            btnCancelar.onclick = () => this.cancelForm();
        }
        
        if (btnVolverLista) {
            btnVolverLista.onclick = () => this.showClientsList();
        }
        
        if (formCliente) {
            formCliente.onsubmit = (e) => this.saveClient(e);
        }
        
        if (btnNuevoCliente) {
            btnNuevoCliente.onclick = () => this.showNewClientForm();
        }
        
        // Cargar clientes al inicializar
        await this.loadMyClients();
        
        return this;
    },
    
    // Cargar clientes del agente
    async loadMyClients() {
        console.log('Cargando clientes...');
        try {
            const response = await window.apiCall('/agent/clients');
            if (response && response.success) {
                this.updateClientsTable(response.data);
            } else {
                console.error('Error en la respuesta:', response);
                this.showError('Error al cargar clientes');
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            this.showError('Error de conexión al cargar clientes');
        }
    },
    
    // Actualizar tabla de clientes
    updateClientsTable(clients) {
        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) {
            console.error('No se encontró la tabla de clientes');
            return;
        }
        
        if (!clients || clients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">
                        No hay clientes registrados.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        clients.forEach(client => {
            const estadoClass = client.estado === 'activo' ? 'activo' : 'inactivo';
            const estadoText = client.estado === 'activo' ? 'Activo' : 'Inactivo';
            
            html += `
                <tr data-client-id="${client.id}">
                    <td>${client.empresa || 'Sin empresa'}</td>
                    <td>${client.contacto || 'Sin contacto'}</td>
                    <td>${client.email || 'Sin email'}</td>
                    <td>${client.telefono || 'Sin teléfono'}</td>
                    <td><span class="status-badge ${estadoClass}">${estadoText}</span></td>
                    <td>${client.proyectosActivos || 0}</td>
                    <td class="actions">
                        <button onclick="window.agentClients.viewClient(${client.id}, event)" 
                                class="btn btn-info btn-sm"
                                data-client-id="${client.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.agentClients.editClient(${client.id}, event)" 
                                class="btn btn-warning btn-sm"
                                data-client-id="${client.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },
    
    // Ver cliente
    async viewClient(clientId, event) {
        console.log('Viendo cliente:', clientId);
        
        try {
            // Mostrar indicador de carga
            const target = event?.target;
            const originalContent = target?.innerHTML;
            if (target) {
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                target.disabled = true;
            }
            
            // Obtener detalles del cliente
            const response = await window.apiCall(`/agent/clients/${clientId}/details`);
            
            if (response && response.success) {
                console.log('Datos del cliente recibidos:', response.data);
                this.showClientModal(response.data);
            } else {
                console.error('Error en la respuesta:', response);
                this.showError('Error al cargar detalles del cliente: ' + (response?.error || 'Error desconocido'));
            }
            
        } catch (error) {
            console.error('Error al cargar cliente:', error);
            this.showError('Error de conexión al cargar detalles del cliente');
        } finally {
            // Restaurar botón
            if (event?.target && originalContent) {
                event.target.innerHTML = originalContent;
                event.target.disabled = false;
            }
        }
    },
    
    // Editar cliente
    async editClient(clientId, event) {
        console.log('Editando cliente:', clientId);
        
        try {
            // Mostrar indicador de carga
            const target = event?.target;
            const originalContent = target?.innerHTML;
            if (target) {
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                target.disabled = true;
            }
            
            // Obtener datos del cliente
            console.log(`Solicitando datos del cliente ${clientId}...`);
            const response = await window.apiCall(`/agent/clients/${clientId}`);
            
            if (response && response.success) {
                console.log('Datos para edición recibidos:', response.data);
                this.showClientForm(response.data, true);
            } else {
                console.error('Error en la respuesta:', response);
                this.showError('Error al cargar datos del cliente: ' + (response?.error || 'Error desconocido'));
            }
            
        } catch (error) {
            console.error('Error al cargar cliente para editar:', error);
            this.showError('Error de conexión: ' + error.message);
        } finally {
            // Restaurar botón
            if (target && originalContent) {
                target.innerHTML = originalContent;
                target.disabled = false;
            }
        }
    },
    
    // Mostrar modal de cliente
    showClientModal(clientData) {
        const modal = document.getElementById('modalDetallesCliente');
        if (!modal) {
            console.error('Modal de detalles no encontrado');
            this.showError('No se pudo abrir el modal de detalles');
            return;
        }
        
        try {
            // Llenar modal con datos del cliente
            document.getElementById('fichaClienteTitulo').textContent = clientData.empresa || 'Sin empresa';
            document.getElementById('fichaClienteSubtitulo').textContent = clientData.contacto || 'Sin contacto';
            document.getElementById('fichaClienteEmpresa').textContent = clientData.empresa || 'Sin empresa';
            document.getElementById('fichaClienteSector').textContent = clientData.sector || 'No especificado';
            document.getElementById('fichaClienteContacto').textContent = clientData.contacto || 'Sin contacto';
            document.getElementById('fichaClienteEmail').textContent = clientData.email || 'Sin email';
            document.getElementById('fichaClienteTelefono').textContent = clientData.telefono || 'Sin teléfono';
            
            // Estado con badge
            const estadoElement = document.getElementById('fichaClienteEstado');
            if (estadoElement) {
                if (clientData.estado === 'activo') {
                    estadoElement.innerHTML = '<span class="status-badge activo">Activo</span>';
                } else {
                    estadoElement.innerHTML = '<span class="status-badge inactivo">Inactivo</span>';
                }
            }
            
            document.getElementById('fichaClienteProyectos').textContent = clientData.proyectosActivos || 0;
            document.getElementById('fichaClienteFechaRegistro').textContent = clientData.fechaRegistro || 'No disponible';
            document.getElementById('fichaClienteNotas').textContent = clientData.notas || 'Sin notas';
            
            // Configurar botón de edición en el modal
            const btnEditar = document.getElementById('btnEditarClienteFicha');
            if (btnEditar) {
                btnEditar.onclick = () => {
                    modal.classList.remove('active');
                    this.editClient(clientData.id);
                };
            }
            
            // Obtener proyectos del cliente
            this.loadClientProjects(clientData.id);
            
            // Mostrar modal
            modal.classList.add('active');
            
        } catch (error) {
            console.error('Error al mostrar modal:', error);
            this.showError('Error al mostrar detalles del cliente');
        }
    },
    
    // Cargar proyectos del cliente
    async loadClientProjects(clientId) {
        try {
            const response = await window.apiCall(`/agent/clients/${clientId}/projects`);
            const proyectosContainer = document.getElementById('fichaClienteListaProyectos');
            
            if (proyectosContainer && response && response.success) {
                if (response.data && response.data.length > 0) {
                    let proyectosHtml = '';
                    response.data.forEach(proyecto => {
                        const estadoClass = proyecto.estado === 'completado' ? 'completado' : 
                                          proyecto.estado === 'en-proceso' ? 'en-proceso' : 'pendiente';
                        const estadoText = proyecto.estado === 'completado' ? 'Completado' : 
                                         proyecto.estado === 'en-proceso' ? 'En Proceso' : 'Pendiente';
                        
                        proyectosHtml += `
                            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-2">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <h4 class="font-medium text-gray-800">${proyecto.nombre || 'Sin nombre'}</h4>
                                        <p class="text-sm text-gray-600">Estado: 
                                            <span class="status-badge ${estadoClass}">${estadoText}</span>
                                        </p>
                                        <p class="text-sm text-gray-600">Progreso: ${proyecto.progreso || 0}%</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm text-gray-600">Monto: $${proyecto.montoTotal || 0}</p>
                                        <p class="text-xs text-gray-500">Entrega: ${proyecto.fechaEntrega || 'Sin fecha'}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    proyectosContainer.innerHTML = proyectosHtml;
                } else {
                    proyectosContainer.innerHTML = `
                        <div class="text-center py-4 text-gray-500">
                            <i class="fas fa-folder-open text-gray-400 text-2xl mb-2"></i>
                            <p>No hay proyectos registrados</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error al cargar proyectos del cliente:', error);
        }
    },
    
    // Mostrar formulario de cliente
    showClientForm(clientData = {}, isEdit = false) {
        const clientsListContainer = document.getElementById('clientsListContainer');
        const formularioContainer = document.getElementById('formularioClienteContainer');
        
        if (!clientsListContainer || !formularioContainer) {
            console.error('Contenedores del formulario no encontrados');
            this.showError('Error al mostrar formulario');
            return;
        }
        
        try {
            // Cambiar vistas
            clientsListContainer.classList.add('hidden');
            formularioContainer.classList.remove('hidden');
            
            // Actualizar título
            const titulo = document.getElementById('tituloFormularioCliente');
            if (titulo) {
                if (isEdit && clientData.empresa) {
                    titulo.textContent = 'Editar Cliente: ' + clientData.empresa;
                } else {
                    titulo.textContent = 'Añadir Nuevo Cliente';
                }
            }
            
            // Llenar formulario
            document.getElementById('clienteEmpresa').value = clientData.empresa || '';
            document.getElementById('clienteRubro').value = clientData.sector || 'otros';
            document.getElementById('clienteContacto').value = clientData.contacto || '';
            document.getElementById('clienteEmail').value = clientData.email || '';
            document.getElementById('clienteTelefono').value = clientData.telefono || '';
            document.getElementById('clienteEstado').value = clientData.estado || 'activo';
            document.getElementById('clienteNotas').value = clientData.notas || '';
            
            // Manejar campo ID oculto
            let hiddenId = document.getElementById('clienteIdHidden');
            if (isEdit) {
                if (!hiddenId) {
                    hiddenId = document.createElement('input');
                    hiddenId.type = 'hidden';
                    hiddenId.id = 'clienteIdHidden';
                    hiddenId.name = 'id';
                    document.getElementById('form-cliente').appendChild(hiddenId);
                }
                hiddenId.value = clientData.id;
            } else {
                // Eliminar campo oculto si existe (modo crear)
                if (hiddenId) {
                    hiddenId.remove();
                }
            }
            
        } catch (error) {
            console.error('Error al mostrar formulario:', error);
            this.showError('Error al cargar formulario');
        }
    },
    
    // Mostrar formulario para nuevo cliente
    showNewClientForm() {
        this.showClientForm({
            empresa: '',
            sector: 'otros',
            contacto: '',
            email: '',
            telefono: '',
            estado: 'activo',
            notas: ''
        }, false);
    },
    
    // Guardar cliente
    async saveClient(event) {
        event.preventDefault();
        
        const form = document.getElementById('form-cliente');
        if (!form) {
            this.showError('Formulario no encontrado');
            return;
        }
        
        const formData = new FormData(form);
        const clienteData = {
            empresa: formData.get('empresa') || '',
            rubro: formData.get('rubro') || 'otros',
            contacto: formData.get('contacto') || '',
            email: formData.get('email') || '',
            tel: formData.get('telefono') || '',
            estado: formData.get('estado') || 'activo',
            notas: formData.get('notas') || ''
        };
        
        const hiddenId = document.getElementById('clienteIdHidden');
        const isEdit = hiddenId && hiddenId.value;
        
        console.log('Guardando cliente...', clienteData);
        console.log('Es edición?', isEdit);
        
        try {
            let response;
            
            if (isEdit) {
                clienteData.id = hiddenId.value;
                console.log('Actualizando cliente ID:', hiddenId.value);
                response = await window.apiCall(`/agent/clients/${hiddenId.value}`, {
                    method: 'PUT',
                    body: clienteData
                });
            } else {
                console.log('Creando nuevo cliente');
                response = await window.apiCall('/agent/clients', {
                    method: 'POST',
                    body: clienteData
                });
            }
            
            console.log('Respuesta del servidor:', response);
            
            if (response && response.success) {
                this.showMessage(isEdit ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente', 'success');
                
                // Recargar lista de clientes
                await this.loadMyClients();
                
                // Volver a la lista
                this.showClientsList();
                
                // Resetear formulario
                form.reset();
                
                // Remover campo oculto si existe
                if (hiddenId) {
                    hiddenId.remove();
                }
                
            } else {
                this.showError(response?.error || 'Error desconocido al guardar cliente');
            }
            
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            this.showError('Error de conexión: ' + error.message);
        }
    },
    
    // Cancelar formulario
    cancelForm() {
        const form = document.getElementById('form-cliente');
        if (form) {
            form.reset();
            
            // Remover campo oculto si existe
            const hiddenId = document.getElementById('clienteIdHidden');
            if (hiddenId) {
                hiddenId.remove();
            }
        }
        
        this.showClientsList();
    },
    
    // Mostrar lista de clientes
    showClientsList() {
        const clientsListContainer = document.getElementById('clientsListContainer');
        const formularioContainer = document.getElementById('formularioClienteContainer');
        
        if (clientsListContainer && formularioContainer) {
            clientsListContainer.classList.remove('hidden');
            formularioContainer.classList.add('hidden');
        }
    },
    
    // Mostrar error
    showError(message) {
        console.error('Error:', message);
        if (window.mostrarToast) {
            window.mostrarToast(message, 'danger');
        } else {
            alert('Error: ' + message);
        }
    },
    
    // Mostrar mensaje
    showMessage(message, type = 'info') {
        console.log(type + ':', message);
        if (window.mostrarToast) {
            window.mostrarToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Inicialización automática cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.agentClients !== 'undefined') {
        window.agentClients.init();
    }
});