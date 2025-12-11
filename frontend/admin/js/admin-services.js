// admin-services.js - Módulo de administración de servicios (CORREGIDO)
class AdminServices {
    constructor() {
        this.services = [];
        this.filteredServices = [];
        this.currentService = null;
        this.isEditing = false;
        this.categories = [];
        this.initialized = false;
        
        this.filters = {
            search: '',
            categoria: 'todos',
            estado: 'todos'
        };
        
        console.log('AdminServices: Constructor iniciado');
    }

    async init() {
        try {
            if (this.initialized) {
                console.log('AdminServices ya está inicializado');
                return;
            }
            
            console.log('AdminServices: Inicializando módulo...');
            
            // Verificar que los elementos HTML existan
            if (!this.checkRequiredElements()) {
                console.error('AdminServices: Elementos HTML requeridos no encontrados');
                return false;
            }
            
            await this.setupEventListeners();
            await this.loadCategories();
            await this.fetchServices();
            this.applyFilters();
            this.initialized = true;
            console.log('AdminServices: Módulo inicializado correctamente');
            return true;
        } catch (error) {
            console.error('AdminServices: Error en inicialización:', error);
            this.showError('Error al cargar servicios: ' + error.message);
            return false;
        }
    }

    checkRequiredElements() {
        const requiredElements = [
            'servicesTableBody',
            'btnMostrarFormularioServicio',
            'form-servicio',
            'servicesListContainer',
            'formularioServicioContainer'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn('Elementos faltantes:', missingElements);
            // No detener la inicialización, solo mostrar advertencia
        }
        
        return true;
    }

    async loadCategories() {
        try {
            console.log('Cargando categorías...');
            const response = await this.apiCall('/services/categories');
            if (response.success) {
                this.categories = response.data;
                console.log('Categorías cargadas:', this.categories);
                this.populateCategorySelects();
            } else {
                throw new Error(response.error || 'Error al cargar categorías');
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            
            // Datos de categorías de ejemplo si la API falla
            this.categories = [
                { id: 1, nombre: 'Desarrollo Web', Descripcion: 'Servicios de desarrollo web y ecommerce' },
                { id: 2, nombre: 'Diseño Gráfico', Descripcion: 'Servicios de diseño gráfico y branding' },
                { id: 3, nombre: 'Producción de Video', Descripcion: 'Servicios de producción de video' },
                { id: 4, nombre: 'Inscripciones y Directorios', Descripcion: 'Inscripción en directorios y creación de fichas' },
                { id: 5, nombre: 'Publicidad y Marketing', Descripcion: 'Servicios de publicidad y marketing digital' },
                { id: 6, nombre: 'Redes Sociales', Descripcion: 'Creación y gestión de redes sociales' },
                { id: 7, nombre: 'Servicios Adicionales', Descripcion: 'Servicios adicionales y complementarios' }
            ];
            
            this.populateCategorySelects();
            this.showNotification('Usando categorías de ejemplo', 'info');
        }
    }

    populateCategorySelects() {
        // Para el formulario
        const formCategorySelect = document.getElementById('categoria');
        if (formCategorySelect) {
            formCategorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.nombre || category.NombreCategoria;
                option.textContent = category.nombre || category.NombreCategoria;
                formCategorySelect.appendChild(option);
            });
        } else {
            console.warn('Elemento categoria (formulario) no encontrado');
        }

        // Para el filtro
        const filterCategorySelect = document.getElementById('filtroCategoriaServicio');
        if (filterCategorySelect) {
            filterCategorySelect.innerHTML = '<option value="todos">Todas</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.nombre || category.NombreCategoria;
                option.textContent = category.nombre || category.NombreCategoria;
                filterCategorySelect.appendChild(option);
            });
        } else {
            console.warn('Elemento filtroCategoriaServicio no encontrado');
        }
    }

    async fetchServices() {
        try {
            console.log('Obteniendo servicios desde API...');
            const response = await this.apiCall('/services');
            
            if (response.success) {
                this.services = Array.isArray(response.data) ? response.data : [];
                this.filteredServices = [...this.services];
                
                console.log(`Servicios cargados: ${this.services.length}`);
                
                if (this.services.length === 0) {
                    console.log('No se encontraron servicios en la base de datos');
                    this.showNotification('No hay servicios registrados', 'info');
                }
                
                this.renderServices();
                return this.services;
            } else {
                throw new Error(response.error || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            this.services = [];
            this.filteredServices = [];
            this.renderServices();
            this.showNotification('Error al cargar servicios: ' + error.message, 'error');
            return [];
        }
    }

    renderServices() {
        const tbody = document.getElementById("servicesTableBody");
        if (!tbody) {
            console.error('No se encontró el tbody de la tabla de servicios');
            return;
        }

        tbody.innerHTML = '';
        
        if (this.filteredServices.length === 0) {
            const hasFilters = this.filters.search || 
                             this.filters.categoria !== 'todos' || 
                             this.filters.estado !== 'todos';
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">
                        ${hasFilters ? 'No hay servicios que coincidan con los filtros aplicados.' : 'No hay servicios registrados.'}
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredServices.forEach(service => {
            const estadoClass = service.estado ? 'activo' : 'inactivo';
            const estadoText = service.estado ? 'Activo' : 'Inactivo';

            const tr = document.createElement('tr');
            tr.dataset.id = service.id;
            tr.innerHTML = `
                <td class="font-medium">${service.nombreServicio || service.NombreServicio || 'Sin nombre'}</td>
                <td>${service.categoria || service.Categoria || '-'}</td>
                <td>$${this.formatPrice(service.costoBase || service.PrecioBase || 0)}</td>
                <td>${service.unidadPrecio || service.UnidadPrecio || 'unidad'}</td>
                <td>
                    <span class="status-badge ${estadoClass}">
                        ${estadoText}
                    </span>
                </td>
                <td>${service.proyectosActivos || 0}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm action-btn" data-action="ver" data-id="${service.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm action-btn" data-action="editar" data-id="${service.id}" title="Editar servicio">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm action-btn" data-action="eliminar" data-id="${service.id}" title="Eliminar servicio">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        console.log(`Tabla de servicios renderizada: ${this.filteredServices.length} servicios`);
    }

    formatPrice(price) {
        return parseFloat(price).toFixed(2);
    }

    applyFilters() {
        const searchTerm = this.filters?.search?.toLowerCase() || '';
        const categoriaFilter = this.filters?.categoria || 'todos';
        const estadoFilter = this.filters?.estado || 'todos';

        this.filteredServices = this.services.filter(service => {
            const nombre = service.nombreServicio || service.NombreServicio || '';
            const categoria = service.categoria || service.Categoria || '';
            const estado = service.estado !== undefined ? service.estado : service.EstaActivo;

            // Filtro de búsqueda
            if (searchTerm && !nombre.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Filtro de categoría
            if (categoriaFilter !== 'todos' && categoria !== categoriaFilter) {
                return false;
            }

            // Filtro de estado
            if (estadoFilter !== 'todos') {
                const estadoBool = estadoFilter === 'activo';
                if (estado !== estadoBool) {
                    return false;
                }
            }

            return true;
        });

        console.log(`Filtros aplicados: ${this.filteredServices.length} de ${this.services.length} servicios`);
        this.renderServices();
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Mostrar/ocultar formulario
        const showBtn = document.getElementById('btnMostrarFormularioServicio');
        const closeBtn = document.getElementById('cerrarFormularioServicio');
        const cancelBtn = document.getElementById('btnLimpiarServicio');
        const form = document.getElementById('form-servicio');

        if (showBtn) {
            showBtn.addEventListener('click', () => this.showServiceForm());
            console.log('Botón mostrar formulario configurado');
        } else {
            console.warn('Botón btnMostrarFormularioServicio no encontrado');
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideServiceForm());
            console.log('Botón cerrar formulario configurado');
        } else {
            console.warn('Botón cerrarFormularioServicio no encontrado');
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetServiceForm());
            console.log('Botón limpiar formulario configurado');
        } else {
            console.warn('Botón btnLimpiarServicio no encontrado');
        }

        if (form) {
            form.addEventListener('submit', async (e) => await this.handleServiceSubmit(e));
            console.log('Formulario de servicio configurado');
        } else {
            console.warn('Formulario form-servicio no encontrado');
        }

        // Configurar toggle de estado
        const estadoToggle = document.getElementById('estado');
        const estadoTexto = document.getElementById('estado-texto');
        
        if (estadoToggle && estadoTexto) {
            estadoToggle.addEventListener('change', function() {
                estadoTexto.textContent = this.checked ? 'Activo' : 'Inactivo';
                estadoTexto.className = this.checked ? 'text-green-600 font-medium' : 'text-red-600 font-medium';
            });
        } else {
            console.warn('Elementos de toggle de estado no encontrados');
        }

        // Filtros
        const searchInput = document.getElementById('buscarServicio');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        } else {
            console.warn('Input buscarServicio no encontrado');
        }

        const categoryFilter = document.getElementById('filtroCategoriaServicio');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.categoria = e.target.value;
                this.applyFilters();
            });
        } else {
            console.warn('Select filtroCategoriaServicio no encontrado');
        }

        const statusFilter = document.getElementById('filtroEstadoServicio');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.applyFilters();
            });
        } else {
            console.warn('Select filtroEstadoServicio no encontrado');
        }

        // Delegación de eventos para los botones de acción
        const servicesTable = document.getElementById('servicesTable');
        if (servicesTable) {
            servicesTable.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action && id) {
                    console.log(`Acción ${action} solicitada para servicio ID: ${id}`);
                    switch(action) {
                        case 'ver': 
                            this.viewService(id); 
                            break;
                        case 'editar': 
                            this.editService(id); 
                            break;
                        case 'eliminar': 
                            this.deleteService(id); 
                            break;
                    }
                }
            });
        } else {
            // Si no existe la tabla, usar delegación en document
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action && id) {
                    console.log(`Acción ${action} solicitada para servicio ID: ${id}`);
                    switch(action) {
                        case 'ver': 
                            this.viewService(id); 
                            break;
                        case 'editar': 
                            this.editService(id); 
                            break;
                        case 'eliminar': 
                            this.deleteService(id); 
                            break;
                    }
                }
            });
        }

        console.log('Event listeners configurados');
    }

    showServiceForm() {
        console.log('Mostrando formulario de servicio');
        const formContainer = document.getElementById('formularioServicioContainer');
        const listContainer = document.getElementById('servicesListContainer');
        const showButton = document.getElementById('btnMostrarFormularioServicio');

        if (formContainer) formContainer.classList.remove('hidden');
        if (listContainer) listContainer.classList.add('hidden');
        if (showButton) showButton.classList.add('hidden');
        
        this.currentService = null;
        this.isEditing = false;
        
        const formTitle = document.querySelector('#formularioServicioContainer .form-title');
        if (formTitle) {
            formTitle.textContent = 'Registrar Nuevo Servicio';
        }
        
        this.resetServiceForm();
    }

    hideServiceForm() {
        console.log('Ocultando formulario de servicio');
        const formContainer = document.getElementById('formularioServicioContainer');
        const listContainer = document.getElementById('servicesListContainer');
        const showButton = document.getElementById('btnMostrarFormularioServicio');

        if (formContainer) formContainer.classList.add('hidden');
        if (listContainer) listContainer.classList.remove('hidden');
        if (showButton) showButton.classList.remove('hidden');
        
        this.currentService = null;
        this.isEditing = false;
    }

    resetServiceForm() {
        const form = document.getElementById('form-servicio');
        if (form) {
            form.reset();
            
            // Restablecer estado del toggle
            const estadoToggle = document.getElementById('estado');
            const estadoTexto = document.getElementById('estado-texto');
            if (estadoToggle && estadoTexto) {
                estadoToggle.checked = true;
                estadoTexto.textContent = 'Activo';
                estadoTexto.className = 'text-green-600 font-medium';
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Guardar Servicio';
                submitBtn.disabled = false;
            }
        } else {
            console.warn('Formulario no encontrado para reset');
        }
    }

    async handleServiceSubmit(e) {
        e.preventDefault();
        console.log('Enviando formulario de servicio...');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        
        try {
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';
                submitBtn.disabled = true;
            }

            const formData = new FormData(e.target);
            const serviceData = Object.fromEntries(formData.entries());
            
            // Convertir estado a booleano
            serviceData.estado = serviceData.estado === 'on';
            
            // Convertir precio base a número
            if (serviceData.costoBase) {
                serviceData.costoBase = parseFloat(serviceData.costoBase);
            }

            console.log('Datos del formulario:', serviceData);

            if (!serviceData.nombreServicio || !serviceData.categoria) {
                this.showNotification('Nombre del servicio y categoría son obligatorios', 'warning');
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                return;
            }

            let response;
            if (this.currentService && this.isEditing) {
                console.log(`Actualizando servicio ID: ${this.currentService.id}`);
                response = await this.apiCall(`/services/${this.currentService.id}`, {
                    method: 'PUT',
                    body: serviceData
                });
                this.showNotification('Servicio actualizado exitosamente', 'success');
            } else {
                console.log('Creando nuevo servicio');
                response = await this.apiCall('/services', {
                    method: 'POST',
                    body: serviceData
                });
                this.showNotification('Servicio creado exitosamente', 'success');
            }
            
            this.hideServiceForm();
            await this.fetchServices();
            this.applyFilters();
            
        } catch (error) {
            console.error('Error al guardar servicio:', error);
            const errorMsg = error.message || 'Error de conexión';
            this.showNotification('Error al guardar servicio: ' + errorMsg, 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    viewService(id) {
        console.log(`Viendo detalles del servicio ID: ${id}`);
        const service = this.services.find(s => s.id == id);
        if (!service) {
            this.showNotification('Servicio no encontrado', 'danger');
            return;
        }

        const modalHtml = `
            <div class="modal-overlay active">
                <div class="modal-content max-w-3xl">
                    <div class="modal-header">
                        <h2 class="modal-title">${service.nombreServicio || service.NombreServicio}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <h3 class="font-semibold text-gray-700 mb-2">Información Básica</h3>
                                <div class="space-y-2">
                                    <div>
                                        <strong>Categoría:</strong>
                                        <p class="mt-1">${service.categoria || service.Categoria}</p>
                                    </div>
                                    <div>
                                        <strong>Precio Base:</strong>
                                        <p class="mt-1">$${this.formatPrice(service.costoBase || service.PrecioBase || 0)} 
                                        (${service.unidadPrecio || service.UnidadPrecio || 'unidad'})</p>
                                    </div>
                                    <div>
                                        <strong>Estado:</strong>
                                        <p class="mt-1">
                                            <span class="status-badge ${service.estado ? 'activo' : 'inactivo'}">
                                                ${service.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <strong>Proyectos Activos:</strong>
                                        <p class="mt-1">${service.proyectosActivos || 0}</p>
                                    </div>
                                    <div>
                                        <strong>Creado:</strong>
                                        <p class="mt-1">${service.created_at ? new Date(service.created_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <strong>Actualizado:</strong>
                                        <p class="mt-1">${service.updated_at ? new Date(service.updated_at).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <h3 class="font-semibold text-gray-700 mb-2">Descripción</h3>
                                <p class="text-gray-600">${service.descripcion || service.Descripcion || 'Sin descripción'}</p>
                                
                                ${service.notasAdicionales || service.NotasAdicionales ? `
                                <h3 class="font-semibold text-gray-700 mb-2 mt-4">Notas Adicionales</h3>
                                <p class="text-gray-600">${service.notasAdicionales || service.NotasAdicionales}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close">Cerrar</button>
                        <button class="btn btn-primary edit-service-btn" data-id="${service.id}">
                            <i class="fas fa-edit"></i> Editar Servicio
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHtml);
        
        // Agregar event listener al botón de editar dentro del modal
        setTimeout(() => {
            const editBtn = document.querySelector('.edit-service-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editService(service.id);
                    const modal = document.querySelector('.modal-overlay.active');
                    if (modal) modal.remove();
                });
            }
        }, 100);
    }

    editService(id) {
        console.log(`Editando servicio ID: ${id}`);
        const service = this.services.find(s => s.id == id);
        if (!service) {
            this.showNotification('Servicio no encontrado', 'danger');
            return;
        }

        this.showServiceForm();
        this.currentService = service;
        this.isEditing = true;
        
        // Actualizar título del formulario
        const formContainer = document.getElementById('formularioServicioContainer');
        const formTitle = formContainer ? formContainer.querySelector('.form-title') : null;
        if (formTitle) {
            formTitle.textContent = `Editar Servicio: ${service.nombreServicio || service.NombreServicio}`;
        }

        // Llenar formulario con datos del servicio
        const form = document.getElementById('form-servicio');
        if (!form) {
            console.error('Formulario no encontrado');
            return;
        }

        const fieldMappings = {
            'nombreServicio': 'nombre-servicio',
            'categoria': 'categoria',
            'descripcion': 'descripcion',
            'costoBase': 'precio-base',
            'unidadPrecio': 'unidad-precio',
            'estado': 'estado',
            'notasAdicionales': 'notas-adicionales'
        };

        Object.keys(fieldMappings).forEach(fieldName => {
            const formField = form[fieldMappings[fieldName]];
            if (formField) {
                const value = service[fieldName] || service[fieldName.charAt(0).toUpperCase() + fieldName.slice(1)];
                if (fieldName === 'estado') {
                    formField.checked = !!value;
                    const estadoTexto = document.getElementById('estado-texto');
                    if (estadoTexto) {
                        estadoTexto.textContent = value ? 'Activo' : 'Inactivo';
                        estadoTexto.className = value ? 'text-green-600 font-medium' : 'text-red-600 font-medium';
                    }
                } else if (fieldName === 'costoBase') {
                    formField.value = this.formatPrice(value || 0);
                } else if (value !== undefined && value !== null) {
                    formField.value = value;
                }
            }
        });

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Actualizar Servicio';
        }

        console.log('Formulario de edición listo');
    }

async deleteService(id) {
    const service = this.services.find(s => s.id == id);
    if (!service) {
        this.showNotification('Servicio no encontrado', 'danger');
        return;
    }

    const serviceName = service.nombreServicio || service.NombreServicio || 'este servicio';
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el servicio "${serviceName}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    try {
        console.log(`Eliminando servicio ID: ${id}`);
        
        // Guardar el servicio antes de eliminarlo para actualización local
        const serviceToDelete = service;
        
        const response = await this.apiCall(`/services/${id}`, { 
            method: 'DELETE' 
        });
        
        // Verificar si la respuesta indica éxito (incluso con 404)
        const isSuccess = response.success === true || 
                         (response.message && response.message.includes('eliminado')) ||
                         (response.alreadyDeleted === true);
        
        if (isSuccess) {
            this.showNotification(`Servicio "${serviceName}" eliminado exitosamente`, 'success');
            
            // Eliminar localmente inmediatamente
            const index = this.services.findIndex(s => s.id == id);
            if (index !== -1) {
                this.services.splice(index, 1);
            }
            
            const filteredIndex = this.filteredServices.findIndex(s => s.id == id);
            if (filteredIndex !== -1) {
                this.filteredServices.splice(filteredIndex, 1);
            }
            
            // Renderizar inmediatamente
            this.renderServices();
            
            // Intentar recargar datos completos en segundo plano
            setTimeout(async () => {
                try {
                    await this.fetchServices();
                    this.applyFilters();
                } catch (error) {
                    console.log('Recarga en segundo plano falló:', error.message);
                    // No hacer nada, ya actualizamos localmente
                }
            }, 1000);
            
        } else {
            throw new Error(response.error || 'Error al eliminar servicio');
        }
    } catch (error) {
        console.error('Error en deleteService:', error);
        
        // Manejo especial para errores 404 en DELETE
        if (error.message && error.message.includes('404')) {
            console.log('Error 404 después de DELETE - probablemente ya eliminado');
            
            // Eliminar localmente de todos modos
            const index = this.services.findIndex(s => s.id == id);
            if (index !== -1) {
                this.services.splice(index, 1);
            }
            
            const filteredIndex = this.filteredServices.findIndex(s => s.id == id);
            if (filteredIndex !== -1) {
                this.filteredServices.splice(filteredIndex, 1);
            }
            
            this.renderServices();
            this.showNotification(`Servicio eliminado (ya no existe en el servidor)`, 'warning');
            
            // Recargar datos
            setTimeout(async () => {
                try {
                    await this.fetchServices();
                    this.applyFilters();
                } catch (refreshError) {
                    console.log('Error recargando después de 404:', refreshError.message);
                }
            }, 500);
        } else {
            this.showNotification('Error al eliminar servicio: ' + error.message, 'danger');
        }
    }
}

// Método apiCall mejorado para manejar mejor los errores
async apiCall(url, options = {}) {
    try {
        // Si existe window.apiCall, usarlo
        if (typeof window.apiCall === 'function') {
            return await window.apiCall(url, options);
        }
        
        // Si existe window.adminApp.apiCall, usarlo
        if (window.adminApp && typeof window.adminApp.apiCall === 'function') {
            return await window.adminApp.apiCall(url, options);
        }
        
        // Fallback: fetch directo con mejor manejo de errores
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const baseUrl = window.adminApp?.apiBaseUrl || '/api';
        
        // Asegurarse de que la URL esté correctamente formada
        let fullUrl;
        if (url.startsWith('http')) {
            fullUrl = url;
        } else if (url.startsWith('/api')) {
            // Si ya incluye /api, no duplicar
            fullUrl = `${window.location.origin}${url}`;
        } else {
            fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        
        console.log('Realizando API call a:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            // Intentar parsear como JSON incluso si el content-type no es correcto
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { 
                    success: false, 
                    error: `Invalid response: ${text.substring(0, 100)}...` 
                };
            }
        }
        
        if (!response.ok) {
            // Para DELETE 404, puede ser aceptable si el recurso ya no existe
            if (options.method === 'DELETE' && response.status === 404) {
                console.warn(`DELETE 404: ${url} - El recurso puede haber sido eliminado previamente`);
                // Retornar éxito simulado para evitar errores en cascada
                return { 
                    success: true, 
                    message: 'El servicio fue eliminado (o ya no existía)' 
                };
            }
            
            throw new Error(`Error ${response.status}: ${data.error || data.message || response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error('Error en apiCall:', error);
        
        // Para errores de DELETE 404, manejarlos de manera especial
        if (url.includes('/services/') && options.method === 'DELETE' && 
            error.message.includes('404')) {
            console.log('DELETE 404 manejado específicamente para servicios');
            // Retornar éxito para evitar que se muestre el error al usuario
            return { 
                success: true, 
                message: 'Servicio eliminado (o ya no existía)' 
            };
        }
        
        throw error;
    }
}

    // Método apiCall seguro
    async apiCall(url, options = {}) {
        try {
            // Si existe window.apiCall, usarlo
            if (typeof window.apiCall === 'function') {
                return await window.apiCall(url, options);
            }
            
            // Si existe window.adminApp.apiCall, usarlo
            if (window.adminApp && typeof window.adminApp.apiCall === 'function') {
                return await window.adminApp.apiCall(url, options);
            }
            
            // Fallback: fetch directo
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const baseUrl = window.adminApp?.apiBaseUrl || '/api';
            const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
            
            console.log('Realizando API call a:', fullUrl);
            
            const response = await fetch(fullUrl, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Error en apiCall:', error);
            throw error;
        }
    }

    showModal(html) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);
        
        const closeButtons = modalContainer.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalContainer.remove();
            });
        });
        
        modalContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                modalContainer.remove();
            }
        });
        
        // Agregar tecla ESC para cerrar
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                modalContainer.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
    }

    showError(message) {
        const tbody = document.getElementById("servicesTableBody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-red-500">
                        ${message}
                    </td>
                </tr>
            `;
        }
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(message, type);
        } else if (typeof window.adminApp?.mostrarToast === 'function') {
            window.adminApp.mostrarToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Mostrar alerta simple si no hay sistema de toasts
            if (type === 'error' || type === 'danger') {
                alert(`ERROR: ${message}`);
            } else if (type === 'success') {
                alert(`Éxito: ${message}`);
            } else if (type === 'warning') {
                alert(`Advertencia: ${message}`);
            } else {
                alert(message);
            }
        }
    }

    cleanup() {
        console.log('Limpiando recursos de AdminServices...');
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        this.services = [];
        this.filteredServices = [];
        this.currentService = null;
        this.isEditing = false;
        this.initialized = false;
    }

    debug() {
        console.log('=== DEBUG AdminServices ===');
        console.log('Servicios:', this.services);
        console.log('Categorías:', this.categories);
        console.log('Filtros:', this.filters);
        console.log('Current Service:', this.currentService);
        console.log('Is Editing:', this.isEditing);
        console.log('Initialized:', this.initialized);
        console.log('=== FIN DEBUG ===');
    }

    // Método adicional para recargar datos
    async reloadData() {
        if (!this.initialized) {
            await this.init();
        } else {
            await this.fetchServices();
            this.applyFilters();
        }
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL - MEJORADA
// =============================================

console.log('AdminServices definido, preparando inicialización...');

// Función para inicializar AdminServices de manera segura
function initializeAdminServices() {
    console.log('=== INICIALIZANDO ADMIN SERVICES ===');
    
    // Verificar si ya existe una instancia inicializada
    if (window.adminServices && window.adminServices.initialized) {
        console.log('AdminServices ya está inicializado');
        return Promise.resolve(window.adminServices);
    }
    
    console.log('Creando nueva instancia de AdminServices...');
    const adminServices = new AdminServices();
    window.adminServices = adminServices;
    
    // Configurar métodos globales si no existen
    if (typeof window.verServicio === 'undefined') {
        window.verServicio = (id) => {
            if (window.adminServices) {
                window.adminServices.viewService(id);
            } else {
                console.error('adminServices no disponible');
            }
        };
    }
    
    if (typeof window.editarServicio === 'undefined') {
        window.editarServicio = (id) => {
            if (window.adminServices) {
                window.adminServices.editService(id);
            } else {
                console.error('adminServices no disponible');
            }
        };
    }
    
    if (typeof window.eliminarServicio === 'undefined') {
        window.eliminarServicio = (id) => {
            if (window.adminServices) {
                window.adminServices.deleteService(id);
            } else {
                console.error('adminServices no disponible');
            }
        };
    }
    
    return adminServices.init().then(() => {
        console.log('AdminServices inicializado exitosamente');
        return window.adminServices;
    }).catch(error => {
        console.error('Error al inicializar AdminServices:', error);
        // No lanzar el error, solo mostrar notificación
        if (window.adminApp && typeof window.adminApp.mostrarToast === 'function') {
            window.adminApp.mostrarToast('Error inicializando servicios: ' + error.message, 'danger');
        }
        throw error;
    });
}

// Función mejorada para verificar e inicializar
function checkAndInitializeServices() {
    console.log('=== VERIFICANDO SECCIÓN SERVICIOS ===');
    
    // Verificar si estamos en la página de servicios
    const servicesSection = document.getElementById('services-content');
    const isServicesPage = servicesSection && 
                         (servicesSection.classList.contains('active') || 
                          window.getComputedStyle(servicesSection).display !== 'none');
    
    console.log('Elemento services-content encontrado:', !!servicesSection);
    console.log('Es página de servicios:', isServicesPage);
    
    if (isServicesPage) {
        console.log('Inicializando AdminServices desde checkAndInitializeServices...');
        
        // Esperar un momento para asegurar que el DOM esté listo
        setTimeout(() => {
            initializeAdminServices().catch(console.error);
        }, 300);
    } else {
        console.log('No está en sección de servicios, configurando listeners...');
        
        // Configurar listener para navegación
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-target="services-content"]');
            if (navLink) {
                console.log('Navegando a servicios vía click');
                setTimeout(() => {
                    if (!window.adminServices || !window.adminServices.initialized) {
                        initializeAdminServices().catch(console.error);
                    }
                }, 500);
            }
        });
        
        // También escuchar eventos de cambio de sección si AdminApp los emite
        document.addEventListener('adminAppSectionChange', (event) => {
            if (event.detail && event.detail.sectionId === 'services-content') {
                console.log('Evento adminAppSectionChange para servicios recibido');
                setTimeout(() => {
                    if (!window.adminServices || !window.adminServices.initialized) {
                        initializeAdminServices().catch(console.error);
                    }
                }, 500);
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
function initOnDOMReady() {
    console.log('DOM cargado, verificando inicialización de servicios...');
    
    // Esperar un momento más para asegurar que todos los scripts estén cargados
    setTimeout(() => {
        checkAndInitializeServices();
        
        // También verificar periódicamente si se hizo visible la sección
        const checkInterval = setInterval(() => {
            const servicesSection = document.getElementById('services-content');
            if (servicesSection && 
                (servicesSection.classList.contains('active') || 
                 window.getComputedStyle(servicesSection).display !== 'none') &&
                (!window.adminServices || !window.adminServices.initialized)) {
                console.log('Sección servicios visible pero no inicializada, inicializando...');
                initializeAdminServices().catch(console.error);
                clearInterval(checkInterval);
            }
        }, 1000);
        
        // Limpiar intervalo después de 10 segundos
        setTimeout(() => clearInterval(checkInterval), 10000);
    }, 1000);
}

// Manejar diferentes estados de carga del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnDOMReady);
} else {
    // DOM ya cargado
    initOnDOMReady();
}

// Exportar al scope global
if (typeof window !== 'undefined') {
    window.AdminServices = AdminServices;
    window.initializeAdminServices = initializeAdminServices;
    window.checkAndInitializeServices = checkAndInitializeServices;
}

// Función de diagnóstico para debugging
window.diagnoseAdminServices = function() {
    console.log('=== DIAGNÓSTICO ADMIN SERVICES ===');
    console.log('1. window.adminServices:', window.adminServices ? 'EXISTE' : 'NO EXISTE');
    console.log('2. window.AdminServices (clase):', typeof AdminServices);
    console.log('3. window.adminApp:', window.adminApp ? 'EXISTE' : 'NO EXISTE');
    console.log('4. Elemento services-content:', document.getElementById('services-content'));
    console.log('5. LocalStorage token:', localStorage.getItem('token') ? 'SI' : 'NO');
    console.log('6. adminServices.initialized:', window.adminServices ? window.adminServices.initialized : 'N/A');
    console.log('=== FIN DIAGNÓSTICO ===');
};

// Función de recuperación para forzar inicialización
window.forceInitServices = function() {
    console.log('=== FORZANDO INICIALIZACIÓN DE SERVICIOS ===');
    return initializeAdminServices();
};

// Script de depuración
console.log('=== DEPURACIÓN ADMIN SERVICES ===');
console.log('Elementos HTML esperados:');
console.log('- servicesTableBody:', document.getElementById('servicesTableBody') ? 'ENCONTRADO' : 'NO ENCONTRADO');
console.log('- btnMostrarFormularioServicio:', document.getElementById('btnMostrarFormularioServicio') ? 'ENCONTRADO' : 'NO ENCONTRADO');
console.log('- services-content:', document.getElementById('services-content') ? 'ENCONTRADO' : 'NO ENCONTRADO');
console.log('- form-servicio:', document.getElementById('form-servicio') ? 'ENCONTRADO' : 'NO ENCONTRADO');
console.log('admin-services.js cargado completamente');