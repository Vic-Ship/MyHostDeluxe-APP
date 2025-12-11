class AdminProjects {
    constructor() {
        this.apiBaseUrl = window.adminApp?.apiBaseUrl || '/api';
        this.serviciosAgregados = [];
        this.proyectoEditando = null;
        this.initialized = false;
        this.isFormVisible = false;
        this.servicioAEliminar = null;
        
        console.log('AdminProjects instanciado - API URL:', this.apiBaseUrl);
    }

    async init() {
        if (this.initialized) {
            console.log('AdminProjects ya inicializado');
            return this;
        }
        
        console.log('Inicializando AdminProjects...');
        try {
            await this.verificarAutenticacion();
            await this.setupEventListeners();
            await this.loadInitialData();
            this.initialized = true;
            console.log('AdminProjects inicializado correctamente');
            
            return this;
        } catch (error) {
            console.error('Error al inicializar AdminProjects:', error);
            this.mostrarError('Error al inicializar módulo de proyectos');
            throw error;
        }
    }

    async verificarAutenticacion() {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (!token) {
            console.error('ERROR: No hay token de autenticación');
            this.mostrarError('No estás autenticado. Por favor, inicia sesión.');
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            
            throw new Error('No autenticado');
        }
    }

    async setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Botón para mostrar formulario
        const btnMostrar = document.getElementById('btnMostrarFormularioProyecto');
        if (btnMostrar) {
            btnMostrar.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botón "Crear Proyecto" clickeado');
                this.mostrarFormulario();
            });
        }

        

        // Select de categoría de servicio
        const selectCategoria = document.getElementById('service-category');
        if (selectCategoria) {
            selectCategoria.addEventListener('change', (e) => {
                const categoriaId = e.target.value;
                console.log('Categoría seleccionada:', categoriaId);
                this.cargarServiciosPorCategoria(categoriaId);
            });
        }

        // Select de servicio
        const selectServicio = document.getElementById('service-select');
        if (selectServicio) {
            selectServicio.addEventListener('change', (e) => {
                const servicioId = e.target.value;
                console.log('Servicio seleccionado:', servicioId);
                this.habilitarBotonAgregar(servicioId);
            });
        }

        // Botón para agregar servicio
        const btnAgregar = document.getElementById('btn-agregar-servicio');
        if (btnAgregar) {
            btnAgregar.addEventListener('click', (e) => {
                e.preventDefault();
                this.agregarServicioAlProyecto();
            });
        }

        // Formulario de proyecto
        const formProyecto = document.getElementById('form-proyecto');
        if (formProyecto) {
            formProyecto.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Formulario de proyecto enviado');
                this.guardarProyecto();
            });
        }

        console.log('Event listeners configurados');
    }

    async loadInitialData() {
        try {
            console.log('=== CARGANDO DATOS INICIALES ===');
            
            await this.cargarCategoriasServicios();
            this.initializeDates();
            await this.cargarAgentes();
            
            console.log('Datos iniciales cargados exitosamente');
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            this.mostrarError('Error al cargar datos iniciales: ' + error.message);
        }
    }

    async cargarCategoriasServicios() {
        try {
            console.log('=== CARGANDO CATEGORÍAS ===');
            
            const select = document.getElementById('service-category');
            if (!select) {
                console.error('Select de categoría no encontrado');
                return;
            }
            
            select.innerHTML = '<option value="">Cargando categorías...</option>';
            
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/projects/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Respuesta:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Datos recibidos:', result);
            
            if (result.success && result.data) {
                console.log(`Categorías cargadas: ${result.data.length}`);
                
                select.innerHTML = '<option value="">Seleccione una categoría</option>';
                
                result.data.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nombre;
                    select.appendChild(option);
                });
            } else {
                select.innerHTML = '<option value="">Error al cargar categorías</option>';
            }
            
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            const select = document.getElementById('service-category');
            if (select) {
                select.innerHTML = '<option value="">Error al cargar categorías</option>';
            }
            this.mostrarError('Error al cargar categorías: ' + error.message);
        }
    }

    async cargarServiciosPorCategoria(categoriaId) {
        console.log('=== CARGANDO SERVICIOS POR CATEGORÍA ===');
        console.log('Categoría ID:', categoriaId);
        
        const select = document.getElementById('service-select');
        if (!select) {
            console.error('Select de servicio no encontrado');
            return;
        }
        
        if (!categoriaId) {
            select.innerHTML = '<option value="">Primero seleccione una categoría</option>';
            select.disabled = true;
            this.habilitarBotonAgregar(null);
            return;
        }
        
        try {
            select.innerHTML = '<option value="">Cargando servicios...</option>';
            select.disabled = true;
            
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }
            
            const url = `${this.apiBaseUrl}/projects/categories/${categoriaId}/services`;
            console.log('URL de servicios:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Respuesta:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Datos recibidos:', result);
            
            if (result.success && result.data) {
                const servicios = result.data;
                console.log(`Servicios encontrados: ${servicios.length}`);
                
                select.innerHTML = '<option value="">Seleccione un servicio</option>';
                
                servicios.forEach(servicio => {
                    const option = document.createElement('option');
                    option.value = servicio.id;
                    option.textContent = servicio.nombre;
                    select.appendChild(option);
                });
                
                select.disabled = false;
                console.log('Servicios cargados exitosamente');
            } else {
                select.innerHTML = '<option value="">No hay servicios disponibles</option>';
                select.disabled = true;
            }
            
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            select.innerHTML = '<option value="">Error al cargar servicios</option>';
            select.disabled = true;
        }
    }

    habilitarBotonAgregar(servicioId) {
        const btnAgregar = document.getElementById('btn-agregar-servicio');
        if (btnAgregar) {
            if (servicioId) {
                btnAgregar.disabled = false;
                btnAgregar.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                btnAgregar.disabled = true;
                btnAgregar.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    async agregarServicioAlProyecto() {
        const selectServicio = document.getElementById('service-select');
        const servicioId = selectServicio.value;
        
        if (!servicioId) {
            this.mostrarError('Por favor, seleccione un servicio');
            return;
        }
        
        // Verificar si el servicio ya fue agregado
        const existe = this.serviciosAgregados.find(s => s.servicioId == servicioId);
        if (existe) {
            this.mostrarError('Este servicio ya ha sido agregado al proyecto');
            return;
        }
        
        try {
            console.log('Agregando servicio ID:', servicioId);
            
            // Obtener información del servicio
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const url = `${this.apiBaseUrl}/projects/services/${servicioId}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success || !result.data) {
                throw new Error('No se pudo obtener información del servicio');
            }
            
            const servicio = result.data;
            
            // Crear objeto servicio
            const nuevoServicio = {
                id: Date.now(),
                servicioId: servicioId,
                nombre: servicio.nombre,
                precio: servicio.precio || 0,
                cantidad: 1,
                precioTotal: servicio.precio || 0,
                camposPersonalizados: []
            };
            
            // Obtener campos personalizados del servicio
            await this.cargarCamposPersonalizados(nuevoServicio);
            
            // Agregar servicio a la lista
            this.serviciosAgregados.push(nuevoServicio);
            
            // Mostrar formulario personalizado
            this.mostrarFormularioPersonalizado(nuevoServicio);
            
            // Actualizar resumen y total
            this.actualizarResumenServicios();
            this.actualizarMontoTotal();
            
            // Limpiar selección
            selectServicio.value = '';
            this.habilitarBotonAgregar(null);
            
            this.mostrarMensaje(`Servicio "${servicio.nombre}" agregado al proyecto`, 'success');
            
        } catch (error) {
            console.error('Error al agregar servicio:', error);
            this.mostrarError('Error al agregar servicio: ' + error.message);
        }
    }

    async cargarCamposPersonalizados(servicio) {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const url = `${this.apiBaseUrl}/projects/services/${servicio.servicioId}/fields`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    servicio.camposPersonalizados = result.data;
                    console.log(`Campos cargados: ${result.data.length} para servicio ${servicio.nombre}`);
                }
            }
        } catch (error) {
            console.error('Error al cargar campos personalizados:', error);
        }
    }

    mostrarFormularioPersonalizado(servicio) {
        console.log('Mostrando formulario personalizado para:', servicio.nombre);
        
        const container = document.getElementById('servicios-personalizados-container');
        if (!container) {
            console.error('Contenedor de servicios personalizados no encontrado');
            return;
        }
        
        // Si es el primer servicio, limpiar el mensaje por defecto
        if (this.serviciosAgregados.length === 1) {
            container.innerHTML = '';
        }
        
        // Crear HTML del formulario personalizado
        const servicioId = `servicio-${servicio.id}`;
        let html = `
            <div class="servicio-formulario bg-white border border-gray-200 rounded-lg mb-6 shadow-sm relative" id="${servicioId}">
                <div class="servicio-header bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-3">
                            <h5 class="font-medium text-gray-800 text-lg">${servicio.nombre}</h5>
                            <span class="contador-servicios bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full">${servicio.cantidad}</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-right">
                                <div class="text-sm text-gray-500">Total</div>
                                <div class="font-bold text-green-600 text-lg">${servicio.precioTotal.toFixed(2)}</div>
                            </div>
                            <!-- Botón de eliminar servicio con icono de basura -->
                            <button type="button" 
                                    class="btn-eliminar-servicio text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                                    onclick="window.eliminarServicio(${servicio.id})"
                                    title="Eliminar servicio">
                                <i class="fas fa-trash-alt text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="servicio-body p-6 pt-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="form-group">
                            <label for="cantidad-${servicioId}" class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                            <div class="flex items-center">
                                <button type="button" class="btn-cantidad-minus bg-gray-200 hover:bg-gray-300 w-10 h-10 flex items-center justify-center rounded-l-lg" 
                                        onclick="window.actualizarCantidadServicio(${servicio.id}, -1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" id="cantidad-${servicioId}" 
                                       min="1" value="${servicio.cantidad}" 
                                       class="w-16 h-10 text-center border-y border-gray-300 focus:outline-none" 
                                       onchange="window.actualizarCantidadServicioInput(${servicio.id}, this.value)">
                                <button type="button" class="btn-cantidad-plus bg-gray-200 hover:bg-gray-300 w-10 h-10 flex items-center justify-center rounded-r-lg"
                                        onclick="window.actualizarCantidadServicio(${servicio.id}, 1)">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Precio Unitario</label>
                            <div class="flex items-center">
                                <span class="bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-300 w-full font-semibold text-gray-700">$${servicio.precio.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
        `;
        
        // Agregar campos personalizados
        if (servicio.camposPersonalizados && servicio.camposPersonalizados.length > 0) {
            html += `<div class="campos-personalizados mt-6 pt-6 border-t border-gray-200">`;
            html += `<h6 class="font-medium text-gray-700 mb-4 text-lg">Configuración del Servicio</h6>`;
            html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;
            
            servicio.camposPersonalizados.forEach((campo, index) => {
                const campoId = `campo-${servicio.id}-${index}`;
                const isRequired = campo.requerido ? 'required' : '';
                const requiredStar = campo.requerido ? '<span class="text-red-500 ml-1">*</span>' : '';
                
                html += `<div class="campo-personalizado ${campo.tipo === 'file' ? 'col-span-1 md:col-span-2' : ''}">`;
                html += `<label for="${campoId}" class="block text-sm font-medium text-gray-700 mb-2">${campo.etiqueta}${requiredStar}</label>`;
                
                switch(campo.tipo) {
                    case 'text':
                    case 'email':
                    case 'number':
                        html += `
                            <input type="${campo.tipo}" 
                                   id="${campoId}" 
                                   name="servicio_${servicio.id}_${campo.nombre}" 
                                   class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
                                   ${isRequired}
                                   placeholder="${campo.placeholder || ''}"
                                   onchange="window.actualizarValorCampo(${servicio.id}, '${campo.nombre}', this.value)">
                        `;
                        break;
                        
                    case 'textarea':
                        html += `
                            <textarea id="${campoId}" 
                                      name="servicio_${servicio.id}_${campo.nombre}" 
                                      class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
                                      rows="3"
                                      ${isRequired}
                                      placeholder="${campo.placeholder || ''}"
                                      onchange="window.actualizarValorCampo(${servicio.id}, '${campo.nombre}', this.value)"></textarea>
                        `;
                        break;
                        
                    case 'select':
                        let opciones = [];
                        try {
                            if (campo.opciones) {
                                opciones = JSON.parse(campo.opciones);
                            }
                        } catch (e) {
                            console.error('Error al parsear opciones:', e);
                        }
                        
                        html += `
                            <select id="${campoId}" 
                                    name="servicio_${servicio.id}_${campo.nombre}" 
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
                                    ${isRequired}
                                    onchange="window.actualizarValorCampo(${servicio.id}, '${campo.nombre}', this.value)">
                                <option value="">Seleccionar...</option>
                        `;
                        
                        opciones.forEach(opcion => {
                            html += `<option value="${opcion}">${opcion}</option>`;
                        });
                        
                        html += `</select>`;
                        break;
                        
                    case 'checkbox':
                        let checkboxOpciones = [];
                        try {
                            if (campo.opciones) {
                                checkboxOpciones = JSON.parse(campo.opciones);
                            }
                        } catch (e) {
                            console.error('Error al parsear opciones checkbox:', e);
                        }
                        
                        html += `<div class="space-y-2">`;
                        checkboxOpciones.forEach((opcion, opcionIndex) => {
                            const checkboxId = `${campoId}-${opcionIndex}`;
                            html += `
                                <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                                    <input type="checkbox" 
                                           id="${checkboxId}" 
                                           name="servicio_${servicio.id}_${campo.nombre}[]" 
                                           value="${opcion}"
                                           class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                           onchange="window.actualizarValorCheckbox(${servicio.id}, '${campo.nombre}', '${opcion}', this.checked)">
                                    <span class="text-sm text-gray-700">${opcion}</span>
                                </label>
                            `;
                        });
                        html += `</div>`;
                        break;
                        
                    case 'radio':
                        let radioOpciones = [];
                        try {
                            if (campo.opciones) {
                                radioOpciones = JSON.parse(campo.opciones);
                            }
                        } catch (e) {
                            console.error('Error al parsear opciones radio:', e);
                        }
                        
                        html += `<div class="space-y-2">`;
                        radioOpciones.forEach((opcion, opcionIndex) => {
                            const radioId = `${campoId}-${opcionIndex}`;
                            html += `
                                <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                                    <input type="radio" 
                                           id="${radioId}" 
                                           name="servicio_${servicio.id}_${campo.nombre}" 
                                           value="${opcion}"
                                           class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                           onchange="window.actualizarValorCampo(${servicio.id}, '${campo.nombre}', this.value)">
                                    <span class="text-sm text-gray-700">${opcion}</span>
                                </label>
                            `;
                        });
                        html += `</div>`;
                        break;
                        
                    case 'file':
                        html += `
                            <div class="file-upload-simple w-full">
                                <div class="relative">
                                    <input type="file" 
                                           id="${campoId}" 
                                           name="servicio_${servicio.id}_${campo.nombre}" 
                                           class="hidden" 
                                           ${isRequired}
                                           onchange="window.manejarArchivoServicio(${servicio.id}, '${campo.nombre}', this)">
                                    <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer"
                                         onclick="document.getElementById('${campoId}').click()">
                                        <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
                                        <p class="text-gray-700 font-medium mb-1">Subir archivo</p>
                                        <p class="text-sm text-gray-500">Haga clic o arrastre el archivo aquí</p>
                                        <p class="text-xs text-gray-400 mt-2">Formatos: JPG, PNG, PDF (Máx. 5MB)</p>
                                    </div>
                                </div>
                                <div class="preview-container mt-3" id="preview-${campoId}"></div>
                            </div>
                        `;
                        break;
                }
                
                html += `</div>`;
            });
            
            html += `</div></div>`;
        } else {
            html += `<div class="text-center py-6 text-gray-500">
                        <i class="fas fa-info-circle text-3xl mb-3 opacity-50"></i>
                        <p>Este servicio no requiere configuración adicional.</p>
                    </div>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        // Agregar al contenedor
        container.insertAdjacentHTML('beforeend', html);
        
        // Mostrar resumen de servicios
        document.getElementById('resumen-servicios').classList.remove('hidden');
    }

    actualizarCantidadServicio(servicioId, cambio) {
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (servicio) {
            const nuevaCantidad = Math.max(1, servicio.cantidad + cambio);
            servicio.cantidad = nuevaCantidad;
            servicio.precioTotal = servicio.precio * nuevaCantidad;
            
            // Actualizar UI
            const contadorElement = document.querySelector(`#servicio-${servicioId} .contador-servicios`);
            const precioElement = document.querySelector(`#servicio-${servicioId} .font-bold.text-green-600`);
            const inputCantidad = document.getElementById(`cantidad-${servicioId}`);
            
            if (contadorElement) contadorElement.textContent = nuevaCantidad;
            if (precioElement) precioElement.textContent = `$${servicio.precioTotal.toFixed(2)}`;
            if (inputCantidad) inputCantidad.value = nuevaCantidad;
            
            this.actualizarResumenServicios();
            this.actualizarMontoTotal();
        }
    }

    actualizarCantidadServicioInput(servicioId, cantidad) {
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (servicio) {
            const nuevaCantidad = Math.max(1, parseInt(cantidad) || 1);
            servicio.cantidad = nuevaCantidad;
            servicio.precioTotal = servicio.precio * nuevaCantidad;
            
            // Actualizar UI
            const contadorElement = document.querySelector(`#servicio-${servicioId} .contador-servicios`);
            const precioElement = document.querySelector(`#servicio-${servicioId} .font-bold.text-green-600`);
            
            if (contadorElement) contadorElement.textContent = nuevaCantidad;
            if (precioElement) precioElement.textContent = `$${servicio.precioTotal.toFixed(2)}`;
            
            this.actualizarResumenServicios();
            this.actualizarMontoTotal();
        }
    }

    actualizarValorCampo(servicioId, nombreCampo, valor) {
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (servicio) {
            if (!servicio.valoresCampos) servicio.valoresCampos = {};
            servicio.valoresCampos[nombreCampo] = valor;
            console.log(`Campo actualizado: ${nombreCampo} = ${valor}`);
        }
    }

    actualizarValorCheckbox(servicioId, nombreCampo, valor, checked) {
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (servicio) {
            if (!servicio.valoresCampos) servicio.valoresCampos = {};
            if (!servicio.valoresCampos[nombreCampo]) {
                servicio.valoresCampos[nombreCampo] = [];
            }
            
            if (checked) {
                if (!servicio.valoresCampos[nombreCampo].includes(valor)) {
                    servicio.valoresCampos[nombreCampo].push(valor);
                }
            } else {
                servicio.valoresCampos[nombreCampo] = servicio.valoresCampos[nombreCampo].filter(v => v !== valor);
            }
            
            console.log(`Checkbox actualizado: ${nombreCampo} =`, servicio.valoresCampos[nombreCampo]);
        }
    }

    manejarArchivoServicio(servicioId, nombreCampo, inputFile) {
        console.log('Manejando archivo para servicio:', servicioId, 'campo:', nombreCampo);
        
        const file = inputFile.files[0];
        if (!file) {
            console.log('No se seleccionó archivo');
            return;
        }
        
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (!servicio) {
            console.error('Servicio no encontrado:', servicioId);
            return;
        }
        
        console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size);
        
        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.mostrarError('El archivo es demasiado grande. El tamaño máximo es 5MB.');
            inputFile.value = '';
            return;
        }
        
        // Convertir a base64
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('Archivo convertido a base64');
            
            if (!servicio.valoresCampos) servicio.valoresCampos = {};
            servicio.valoresCampos[nombreCampo] = e.target.result;
            
            // Mostrar preview
            const campoId = inputFile.id;
            const previewContainer = document.getElementById(`preview-${campoId}`);
            
            if (previewContainer) {
                previewContainer.innerHTML = '';
                
                if (file.type.startsWith('image/')) {
                    previewContainer.innerHTML = `
                        <div class="border border-gray-300 rounded-lg p-4 bg-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <img src="${e.target.result}" alt="Preview" class="h-16 w-16 object-cover rounded">
                                    <div>
                                        <p class="text-sm font-medium text-gray-700">${file.name}</p>
                                        <p class="text-xs text-gray-500">${this.formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button type="button" class="text-red-500 hover:text-red-700 ml-4" 
                                        onclick="this.removeFilePreview('${campoId}', ${servicioId}, '${nombreCampo}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    previewContainer.innerHTML = `
                        <div class="bg-gray-100 border border-gray-300 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <i class="fas fa-file text-gray-400 text-2xl"></i>
                                    <div>
                                        <p class="text-sm font-medium text-gray-700">${file.name}</p>
                                        <p class="text-xs text-gray-500">${this.formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button type="button" class="text-red-500 hover:text-red-700 ml-4" 
                                        onclick="this.removeFilePreview('${campoId}', ${servicioId}, '${nombreCampo}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error al leer el archivo:', error);
            this.mostrarError('Error al leer el archivo. Por favor, intente nuevamente.');
        };
        
        reader.readAsDataURL(file);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFilePreview(campoId, servicioId, nombreCampo) {
        console.log('Eliminando vista previa:', campoId);
        
        const inputFile = document.getElementById(campoId);
        const previewContainer = document.getElementById(`preview-${campoId}`);
        
        if (inputFile) {
            inputFile.value = '';
        }
        
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        // También eliminar del objeto de valores
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (servicio && servicio.valoresCampos) {
            delete servicio.valoresCampos[nombreCampo];
        }
    }

    eliminarServicio(servicioId) {
        const servicio = this.serviciosAgregados.find(s => s.id === servicioId);
        if (servicio) {
            // Mostrar mensaje de confirmación simple
            if (!confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) {
                return;
            }
            
            this.serviciosAgregados = this.serviciosAgregados.filter(s => s.id !== servicioId);
            
            // Remover del DOM
            const servicioElement = document.getElementById(`servicio-${servicioId}`);
            if (servicioElement) {
                servicioElement.remove();
            }
            
            // Actualizar resumen
            this.actualizarResumenServicios();
            this.actualizarMontoTotal();
            
            // Mostrar mensaje
            this.mostrarMensaje(`Servicio "${servicio.nombre}" eliminado`, 'info');
            
            // Si no quedan servicios, ocultar resumen y mostrar mensaje
            if (this.serviciosAgregados.length === 0) {
                const container = document.getElementById('servicios-personalizados-container');
                const resumen = document.getElementById('resumen-servicios');
                
                if (container) {
                    container.innerHTML = `
                        <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <i class="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
                            <p class="text-gray-600 font-medium mb-2">No hay servicios agregados</p>
                            <p class="text-gray-500 text-sm">Seleccione un servicio y haga clic en "Agregar Servicio al Proyecto"</p>
                        </div>
                    `;
                }
                
                if (resumen) {
                    resumen.classList.add('hidden');
                }
            }
        }
    }

    actualizarResumenServicios() {
        const lista = document.getElementById('lista-servicios');
        const totalElement = document.getElementById('total-servicios');
        
        if (lista && totalElement) {
            let html = '';
            let total = 0;
            
            this.serviciosAgregados.forEach(servicio => {
                total += servicio.precioTotal;
                html += `
                    <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div class="flex-1">
                            <span class="text-sm text-gray-700">${servicio.nombre}</span>
                            <span class="text-xs text-gray-500 ml-2">x${servicio.cantidad}</span>
                        </div>
                        <span class="text-sm font-medium text-green-600">$${servicio.precioTotal.toFixed(2)}</span>
                    </div>
                `;
            });
            
            lista.innerHTML = html;
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }

    mostrarFormulario() {
    console.log('=== MOSTRANDO FORMULARIO ===');
    
    const btnMostrar = document.getElementById('btnMostrarFormularioProyecto');
    const lista = document.getElementById('projectsListContainer');
    const formulario = document.getElementById('formularioProyectoContainer');
    
    if (btnMostrar) btnMostrar.style.display = 'none';
    if (lista) lista.style.display = 'none';
    if (formulario) {
        formulario.classList.remove('hidden');
        formulario.style.display = 'block';
        
        // Agregar header si no existe (solo para creación)
        if (!this.proyectoEditando) {
            const existingHeader = document.querySelector('.form-section-header');
            if (!existingHeader) {
                const form = document.getElementById('form-proyecto');
                if (form) {
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'form-section-header';
                    headerDiv.innerHTML = `
                        <div>
                            <h2 id="form-title">Crear Nuevo Proyecto</h2>
                            <p class="text-sm opacity-90">Complete todos los campos requeridos</p>
                        </div>
                        <button type="button" onclick="window.cancelarCreacionProyecto()" 
                                class="form-close-btn" title="Cerrar formulario">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    form.insertBefore(headerDiv, form.firstChild);
                }
            }
        }
    }
    
    this.isFormVisible = true;
    this.limpiarFormulario();
}

ocultarFormulario() {
    console.log('=== OCULTANDO FORMULARIO ===');
    
    const btnMostrar = document.getElementById('btnMostrarFormularioProyecto');
    const lista = document.getElementById('projectsListContainer');
    const formulario = document.getElementById('formularioProyectoContainer');
    
    if (btnMostrar) btnMostrar.style.display = 'block';
    if (lista) lista.style.display = 'block';
    if (formulario) {
        formulario.classList.add('hidden');
        formulario.style.display = 'none';
        
        // Remover el header del formulario
        const header = document.querySelector('.form-section-header');
        if (header) {
            header.remove();
        }
    }
    
    this.isFormVisible = false;
    this.proyectoEditando = null; 
}

limpiarFormulario() {
    const form = document.getElementById('form-proyecto');
    if (form) {
        form.reset();
        this.serviciosAgregados = [];
        this.actualizarMontoTotal();
        
        // Limpiar contenedor de servicios personalizados
        const container = document.getElementById('servicios-personalizados-container');
        if (container) {
            container.innerHTML = `
                <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <i class="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-600 font-medium mb-2">No hay servicios agregados</p>
                    <p class="text-gray-500 text-sm">Seleccione un servicio y haga clic en "Agregar Servicio al Proyecto"</p>
                </div>
            `;
        }
        
        // Limpiar selectores
        const selectCategoria = document.getElementById('service-category');
        const selectServicio = document.getElementById('service-select');
        
        if (selectCategoria) selectCategoria.value = '';
        if (selectServicio) {
            selectServicio.innerHTML = '<option value="">Primero seleccione una categoría</option>';
            selectServicio.disabled = true;
        }
        
        // Deshabilitar botón agregar
        this.habilitarBotonAgregar(null);
        
        // Ocultar resumen
        document.getElementById('resumen-servicios').classList.add('hidden');
        
        // Restaurar título del formulario y botón
        const titleElement = document.getElementById('form-title');
        if (titleElement) titleElement.textContent = 'Crear Nuevo Proyecto';
        
        const submitBtn = document.getElementById('btn-submit-proyecto');
        if (submitBtn) submitBtn.textContent = 'Guardar Proyecto';
        
        // Limpiar proyecto en edición
        this.proyectoEditando = null;
        
        this.initializeDates();
        this.cargarAgentes();
    }
}

    async cargarAgentes() {
        try {
            console.log('=== CARGANDO AGENTES ===');
            
            const agentSelect = document.getElementById('agent');
            if (!agentSelect) {
                console.error('Select de agente no encontrado');
                return;
            }
            
            agentSelect.innerHTML = '<option value="">Cargando agentes...</option>';
            
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/projects/agents/active`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Respuesta:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Datos recibidos:', result);
                
                if (result.success && result.data) {
                    agentSelect.innerHTML = '<option value="">Seleccione Agente</option>';
                    
                    result.data.forEach(agente => {
                        const option = document.createElement('option');
                        option.value = agente.id;
                        option.textContent = agente.nombre;
                        agentSelect.appendChild(option);
                    });
                }
            }
            
        } catch (error) {
            console.error('Error al cargar agentes:', error);
            document.getElementById('agent').innerHTML = '<option value="">Error al cargar agentes</option>';
            this.mostrarError('Error al cargar agentes: ' + error.message);
        }
    }

    actualizarMontoTotal() {
        const montoInput = document.getElementById('monto');
        if (!montoInput) return;
        
        let total = 0;
        this.serviciosAgregados.forEach(servicio => {
            total += servicio.precioTotal;
        });
        
        montoInput.value = `$${total.toFixed(2)}`;
    }

    async guardarProyecto() {
    try {
        console.log('=== GUARDANDO PROYECTO ===');
        console.log('Modo:', this.proyectoEditando ? 'Edición' : 'Creación');
        
        // Validaciones básicas
        if (this.serviciosAgregados.length === 0) {
            this.mostrarError('Debe agregar al menos un servicio al proyecto');
            return;
        }
        
        // Validar campos requeridos de formularios personalizados
        let errores = [];
        this.serviciosAgregados.forEach(servicio => {
            if (servicio.camposPersonalizados && servicio.camposPersonalizados.length > 0) {
                servicio.camposPersonalizados.forEach(campo => {
                    if (campo.requerido) {
                        const valor = servicio.valoresCampos ? servicio.valoresCampos[campo.nombre] : undefined;
                        if (!valor || (Array.isArray(valor) && valor.length === 0)) {
                            errores.push(`El campo "${campo.etiqueta}" del servicio "${servicio.nombre}" es requerido`);
                        }
                    }
                });
            }
        });
        
        if (errores.length > 0) {
            this.mostrarError(errores.join('<br>'));
            return;
        }
        
        const projectName = document.getElementById('project-name').value;
        const companyName = document.getElementById('company-name').value;
        const clientName = document.getElementById('client-name').value;
        const email = document.getElementById('email').value;
        const agentId = document.getElementById('agent').value;
        
        if (!projectName || !companyName || !clientName || !email || !agentId) {
            this.mostrarError('Por favor, complete todos los campos obligatorios');
            return;
        }
        
        // Obtener cliente (crear o buscar existente)
        let clienteId;
        try {
            const clienteData = {
                NombreEmpresa: companyName,
                NombreContacto: clientName,
                CorreoElectronico: email,
                Telefono: document.getElementById('phone').value || '',
                SitioWeb: document.getElementById('website').value || '',
                Estado: 'activo'
            };
            
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            // Si estamos editando, usar el cliente existente
            if (this.proyectoEditando && this.proyectoEditando.clienteId) {
                clienteId = this.proyectoEditando.clienteId;
                console.log('Usando cliente existente del proyecto:', clienteId);
            } else {
                // Buscar o crear cliente
                const searchResponse = await fetch(`${this.apiBaseUrl}/projects/clients/search?email=${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (searchResponse.ok) {
                    const searchResult = await searchResponse.json();
                    if (searchResult.success && searchResult.data && searchResult.data.id) {
                        clienteId = searchResult.data.id;
                        console.log('Cliente encontrado, ID:', clienteId);
                    } else {
                        // Crear nuevo cliente
                        const createResponse = await fetch(`${this.apiBaseUrl}/projects/clients`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(clienteData)
                        });
                        
                        if (createResponse.ok) {
                            const createResult = await createResponse.json();
                            if (createResult.success && createResult.data && createResult.data.id) {
                                clienteId = createResult.data.id;
                                console.log('Cliente creado, ID:', clienteId);
                            } else {
                                throw new Error('Error al crear cliente: ' + (createResult.error || 'Respuesta inesperada'));
                            }
                        } else {
                            throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
                        }
                    }
                }
            }
        } catch (clienteError) {
            console.error('Error con cliente:', clienteError);
            this.mostrarError('Error al procesar información del cliente: ' + clienteError.message);
            return;
        }
        
        if (!clienteId) {
            this.mostrarError('No se pudo obtener o crear el cliente');
            return;
        }
        
        // Preparar datos del proyecto
        const projectData = {
            NombreProyecto: projectName,
            Descripcion: document.getElementById('project-description').value || '',
            ClienteID: clienteId,
            AgenteID: agentId,
            MontoTotal: parseFloat(this.serviciosAgregados.reduce((sum, s) => sum + s.precioTotal, 0)),
            Estado: document.getElementById('status').value || 'pendiente',
            Prioridad: document.getElementById('priority').value || 'media',
            FechaInicio: document.getElementById('start-date').value,
            FechaEntregaEstimada: document.getElementById('delivery-date').value,
            servicios: this.serviciosAgregados.map(servicio => ({
                servicioId: servicio.servicioId,
                cantidad: servicio.cantidad,
                precioUnitario: servicio.precio,
                precioTotal: servicio.precioTotal,
                camposPersonalizados: servicio.valoresCampos ? Object.keys(servicio.valoresCampos).map(nombreCampo => ({
                    nombreCampo: nombreCampo,
                    valor: servicio.valoresCampos[nombreCampo]
                })) : []
            }))
        };
        
        console.log('Datos del proyecto a enviar:', projectData);
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        // Determinar URL y método según si es creación o edición
        let url, method;
        if (this.proyectoEditando) {
            url = `${this.apiBaseUrl}/projects/${this.proyectoEditando.id}`;
            method = 'PUT';
        } else {
            url = `${this.apiBaseUrl}/projects/create-with-forms`;
            method = 'POST';
        }
        
        console.log('Enviando a:', url, 'Método:', method);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Resultado:', result);
        
        if (result.success) {
            const mensaje = this.proyectoEditando ? 
                'Proyecto actualizado correctamente' : 
                'Proyecto creado correctamente';
            
            this.mostrarMensaje(mensaje, 'success');
            this.ocultarFormulario();
            
            // Limpiar proyecto en edición
            this.proyectoEditando = null;
            
            // Recargar lista de proyectos
            await this.loadProjects();
            
        } else {
            throw new Error(result.error || 'Error al guardar proyecto');
        }
        
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        
        let errorMessage = 'Error al guardar proyecto: ' + error.message;
        
        // Manejar errores comunes
        if (error.message.includes('404')) {
            errorMessage = 'Servicio no encontrado. Verifique que el endpoint esté disponible.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor. Intente nuevamente.';
        } else if (error.message.includes('ClienteID')) {
            errorMessage = 'Error con la información del cliente. Verifique los datos.';
        } else if (error.message.includes('AgenteID')) {
            errorMessage = 'Error con la información del agente. Verifique la selección.';
        }
        
        this.mostrarError(errorMessage);
    }
}

    async loadProjects() {
    try {
        console.log('=== CARGANDO LISTA DE PROYECTOS ===');
        
        const tableBody = document.getElementById('projectsTableBody');
        if (!tableBody) {
            console.error('Tabla de proyectos no encontrada');
            return;
        }
        
        // Mostrar loading
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8">
                    <div class="flex justify-center items-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        <span class="ml-3 text-gray-600">Cargando proyectos...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // OBTENER TOKEN CORRECTAMENTE
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        console.log('Token obtenido del localStorage:', token ? `SI (${token.length} chars)` : 'NO');
        
        if (!token) {
            throw new Error('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        }
        
        // VERIFICAR FORMATO DEL TOKEN
        console.log('Token (primeros 50 chars):', token.substring(0, 50) + '...');
        
        // Realizar petición a la API CON HEADER CORRECTO
        const response = await fetch(`${this.apiBaseUrl}/projects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin' // Importante para cookies/sesiones
        });
        
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Leer la respuesta como texto primero para debug
        const responseText = await response.text();
        console.log('Response text (primeros 500 chars):', responseText.substring(0, 500));
        
        if (!response.ok) {
            console.error('Response completo:', responseText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parsear la respuesta como JSON
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('Resultado parseado:', result);
        } catch (parseError) {
            console.error('Error parseando JSON:', parseError);
            console.error('Texto recibido:', responseText);
            throw new Error('Respuesta del servidor no es JSON válido');
        }
        
        if (result.success && result.data) {
            this.renderProjectsTable(result.data);
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        ${result.message || 'No hay proyectos registrados.'}
                    </td>
                </tr>
            `;
        }
        
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        const tableBody = document.getElementById('projectsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-red-500">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Error al cargar proyectos: ${error.message}
                        <br>
                        <small class="text-gray-600 mt-2 block">Por favor, verifique la consola para más detalles</small>
                    </td>
                </tr>
            `;
        }
    }
}
async verProyecto(proyectoId) {
    try {
        console.log('Viendo proyecto ID:', proyectoId);
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${this.apiBaseUrl}/projects/${proyectoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const proyecto = result.data;
            
            // Crear un modal para mostrar los detalles
            const modalHtml = `
                <div id="project-details-modal" class="project-modal-overlay">
                    <div class="project-modal-container">
                        <div class="project-modal-content">
                            <div class="project-modal-header">
                                <h3 class="project-modal-title">Detalles del Proyecto</h3>
                                <button type="button" id="close-project-modal" class="project-modal-close">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <!-- Información del proyecto -->
                            <div class="project-grid">
                                <div class="project-info-card">
                                    <h4 class="project-card-title">Información Básica</h4>
                                    <p><strong>Nombre:</strong> ${proyecto.nombre}</p>
                                    <p><strong>Estado:</strong> <span class="project-status-badge ${this.getEstadoColor(proyecto.estado)}">${proyecto.estado}</span></p>
                                    <p><strong>Prioridad:</strong> <span class="project-priority-badge ${this.getPrioridadColor(proyecto.prioridad)}">${proyecto.prioridad}</span></p>
                                    <p><strong>Monto Total:</strong> $${proyecto.montoTotal ? parseFloat(proyecto.montoTotal).toFixed(2) : '0.00'}</p>
                                </div>
                                
                                <div class="project-info-card">
                                    <h4 class="project-card-title">Fechas</h4>
                                    <p><strong>Inicio:</strong> ${new Date(proyecto.fechaInicio).toLocaleDateString()}</p>
                                    <p><strong>Entrega Estimada:</strong> ${new Date(proyecto.fechaEntregaEstimada).toLocaleDateString()}</p>
                                    <p><strong>Completación:</strong> ${proyecto.fechaCompletacionReal ? new Date(proyecto.fechaCompletacionReal).toLocaleDateString() : 'No completado'}</p>
                                </div>
                            </div>
                            
                            <!-- Cliente y Agente -->
                            <div class="project-grid">
                                <div class="project-info-card">
                                    <h4 class="project-card-title">Cliente</h4>
                                    <p><strong>Empresa:</strong> ${proyecto.clienteEmpresa}</p>
                                    <p><strong>Contacto:</strong> ${proyecto.clienteContacto}</p>
                                    <p><strong>Email:</strong> ${proyecto.clienteEmail}</p>
                                    <p><strong>Teléfono:</strong> ${proyecto.clienteTelefono || 'No disponible'}</p>
                                </div>
                                
                                <div class="project-info-card">
                                    <h4 class="project-card-title">Agente Responsable</h4>
                                    <p><strong>Nombre:</strong> ${proyecto.agenteNombre}</p>
                                    <p><strong>Sucursal:</strong> ${proyecto.agenteSucursal || 'No especificada'}</p>
                                    <p><strong>Email:</strong> ${proyecto.agenteEmail}</p>
                                </div>
                            </div>
                            
                            <!-- Servicios -->
                            <div class="project-services-section">
                                <h4 class="project-section-title">Servicios Incluidos</h4>
                                ${proyecto.servicios && proyecto.servicios.length > 0 ? 
                                    this.renderServiciosDetalle(proyecto.servicios) : 
                                    '<p class="project-no-data">No hay servicios registrados</p>'}
                            </div>
                            
                            <!-- Descripción -->
                            <div class="project-description-section">
                                <h4 class="project-section-title">Descripción</h4>
                                <div class="project-description-content">
                                    <p>${proyecto.descripcion || 'Sin descripción'}</p>
                                </div>
                            </div>
                            
                            <!-- Botones de acción -->
                            <div class="project-modal-footer">
                                <button type="button" id="close-modal-btn" class="project-btn-secondary">
                                    Cerrar
                                </button>
                                <button type="button" onclick="window.adminProjects.editarProyecto(${proyectoId})" class="project-btn-primary">
                                    <i class="fas fa-edit mr-2"></i> Editar Proyecto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Crear y mostrar el modal
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = modalHtml;
            document.body.appendChild(modalDiv);
            
            // Agregar event listeners para cerrar el modal
            const closeModal = () => {
                modalDiv.remove();
            };
            
            // Asignar event listeners a ambos botones de cerrar
            const closeButton1 = document.getElementById('close-project-modal');
            const closeButton2 = document.getElementById('close-modal-btn');
            
            if (closeButton1) {
                closeButton1.addEventListener('click', closeModal);
            }
            
            if (closeButton2) {
                closeButton2.addEventListener('click', closeModal);
            }
            
            // También cerrar al hacer clic fuera del modal
            modalDiv.addEventListener('click', (e) => {
                if (e.target === modalDiv) {
                    closeModal();
                }
            });
            
            // Cerrar con tecla ESC
            const handleEscKey = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscKey);
                }
            };
            
            document.addEventListener('keydown', handleEscKey);
            
        } else {
            throw new Error(result.error || 'Error al cargar detalles del proyecto');
        }
    } catch (error) {
        console.error('Error al ver proyecto:', error);
        this.mostrarError('Error al cargar detalles del proyecto: ' + error.message);
    }
}

renderServiciosDetalle(servicios) {
    let html = '<div class="space-y-4">';
    
    servicios.forEach((servicio, index) => {
        html += `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-medium text-gray-800">${servicio.nombre}</h5>
                    <span class="text-sm font-medium text-green-600">$${parseFloat(servicio.precioTotal).toFixed(2)}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><strong>Cantidad:</strong> ${servicio.cantidad}</div>
                    <div><strong>Precio unitario:</strong> $${parseFloat(servicio.precioUnitario).toFixed(2)}</div>
                    <div><strong>Categoría:</strong> ${servicio.categoria || 'No especificada'}</div>
                </div>
                ${servicio.descripcion ? `<p class="text-sm text-gray-600 mb-3">${servicio.descripcion}</p>` : ''}
        `;
        
        if (servicio.camposPersonalizados && servicio.camposPersonalizados.length > 0) {
            html += `<div class="mt-3 pt-3 border-t border-gray-200">`;
            html += `<h6 class="text-sm font-medium text-gray-700 mb-2">Configuración Personalizada:</h6>`;
            html += `<div class="space-y-1 text-sm">`;
            
            servicio.camposPersonalizados.forEach(campo => {
                let valorMostrar = campo.valor;
                if (Array.isArray(campo.valor)) {
                    valorMostrar = campo.valor.join(', ');
                }
                html += `<p><strong>${campo.etiqueta || campo.nombre}:</strong> ${valorMostrar || 'No definido'}</p>`;
            });
            
            html += `</div></div>`;
        }
        
        html += `</div>`;
    });
    
    html += '</div>';
    return html;
}

getEstadoColor(estado) {
    const colores = {
        'pendiente': 'bg-yellow-100 text-yellow-800',
        'en-proceso': 'bg-blue-100 text-blue-800',
        'completado': 'bg-green-100 text-green-800',
        'cancelado': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
}

getPrioridadColor(prioridad) {
    const colores = {
        'alta': 'bg-red-100 text-red-800',
        'media': 'bg-yellow-100 text-yellow-800',
        'baja': 'bg-green-100 text-green-800'
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800';
}

async editarProyecto(proyectoId) {
    try {
        console.log('Editando proyecto ID:', proyectoId);
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${this.apiBaseUrl}/projects/${proyectoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const proyecto = result.data;
            this.proyectoEditando = proyecto;
            
            // Mostrar formulario en modo edición
            this.mostrarFormularioEdicion(proyecto);
            
        } else {
            throw new Error(result.error || 'Error al cargar proyecto para editar');
        }
    } catch (error) {
        console.error('Error al cargar proyecto para editar:', error);
        this.mostrarError('Error al cargar proyecto: ' + error.message);
    }
}

mostrarFormularioEdicion(proyecto) {
    console.log('Mostrando formulario en modo edición para proyecto:', proyecto.nombre);
    
    // Mostrar el formulario primero
    this.mostrarFormulario();
    
    // Crear y actualizar el header del formulario
    const formHeader = document.querySelector('.form-section-header');
    if (!formHeader) {
        // Si no existe el header, crear uno
        const formTitle = document.getElementById('form-title');
        if (formTitle && formTitle.parentElement) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'form-section-header';
            
            // Insertar el header al inicio del formulario
            const form = document.getElementById('form-proyecto');
            if (form) {
                form.insertBefore(headerDiv, form.firstChild);
            }
        }
    } else {
        // Actualizar el header existente
        formHeader.innerHTML = `
            <div>
                <h2 id="form-title">Editar Proyecto</h2>
                <p class="text-sm opacity-90">Complete todos los campos requeridos</p>
            </div>
            <button type="button" onclick="window.cancelarCreacionProyecto()" 
                    class="form-close-btn" title="Cerrar formulario">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    // Cambiar título del formulario
    document.getElementById('form-title').textContent = 'Editar Proyecto';
    document.getElementById('btn-submit-proyecto').textContent = 'Actualizar Proyecto';
    
    // Llenar campos del formulario
    document.getElementById('project-name').value = proyecto.nombre || '';
    document.getElementById('company-name').value = proyecto.clienteEmpresa || '';
    document.getElementById('client-name').value = proyecto.clienteContacto || '';
    document.getElementById('email').value = proyecto.clienteEmail || '';
    document.getElementById('phone').value = proyecto.clienteTelefono || '';
    document.getElementById('website').value = proyecto.clienteSitioWeb || '';
    document.getElementById('project-description').value = proyecto.descripcion || '';
    
    // Convertir fechas al formato YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };
    
    document.getElementById('start-date').value = formatDate(proyecto.fechaInicio);
    document.getElementById('delivery-date').value = formatDate(proyecto.fechaEntregaEstimada);
    
    // Seleccionar valores en los selects
    document.getElementById('status').value = proyecto.estado || 'pendiente';
    document.getElementById('priority').value = proyecto.prioridad || 'media';
    
    // Cargar servicios del proyecto
    this.cargarServiciosParaEdicion(proyecto.servicios || []);
    
    // Actualizar monto total
    this.actualizarMontoTotal();
}

async cargarServiciosParaEdicion(servicios) {
    // Limpiar servicios actuales
    this.serviciosAgregados = [];
    const container = document.getElementById('servicios-personalizados-container');
    container.innerHTML = '';
    
    if (servicios.length === 0) {
        container.innerHTML = `
            <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <i class="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600 font-medium mb-2">No hay servicios agregados</p>
                <p class="text-gray-500 text-sm">Seleccione un servicio y haga clic en "Agregar Servicio al Proyecto"</p>
            </div>
        `;
        return;
    }
    
    // Para cada servicio, cargar sus datos y mostrar el formulario
    for (const servicio of servicios) {
        try {
            // Obtener información completa del servicio
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/projects/services/${servicio.servicioId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data) {
                    const servicioInfo = result.data;
                    
                    // Crear objeto servicio para edición
                    const servicioEdit = {
                        id: Date.now() + Math.random(), // ID temporal
                        servicioId: servicio.servicioId,
                        nombre: servicioInfo.nombre || servicio.nombre,
                        precio: servicio.precioUnitario,
                        cantidad: servicio.cantidad,
                        precioTotal: servicio.precioTotal,
                        camposPersonalizados: [],
                        valoresCampos: {}
                    };
                    
                    // Cargar campos personalizados
                    await this.cargarCamposPersonalizados(servicioEdit);
                    
                    // Establecer valores de campos personalizados
                    if (servicio.camposPersonalizados) {
                        servicio.camposPersonalizados.forEach(campo => {
                            servicioEdit.valoresCampos[campo.nombre] = campo.valor;
                        });
                    }
                    
                    // Agregar servicio a la lista
                    this.serviciosAgregados.push(servicioEdit);
                    
                    // Mostrar formulario personalizado
                    this.mostrarFormularioPersonalizado(servicioEdit);
                    
                    // También llenar los campos con los valores existentes
                    setTimeout(() => {
                        this.rellenarCamposPersonalizados(servicioEdit);
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error al cargar servicio para edición:', error);
        }
    }
    
    // Actualizar resumen
    this.actualizarResumenServicios();
}

rellenarCamposPersonalizados(servicio) {
    if (!servicio.valoresCampos) return;
    
    Object.keys(servicio.valoresCampos).forEach(nombreCampo => {
        const valor = servicio.valoresCampos[nombreCampo];
        
        // Buscar todos los campos con este nombre
        const inputs = document.querySelectorAll(`[name*="servicio_${servicio.id}_${nombreCampo}"]`);
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                // Para checkboxes, verificar si el valor está en el array
                if (Array.isArray(valor)) {
                    input.checked = valor.includes(input.value);
                }
            } else if (input.type === 'radio') {
                // Para radios, seleccionar si coincide el valor
                input.checked = input.value === valor;
            } else {
                // Para otros tipos, establecer el valor
                input.value = valor || '';
            }
        });
    });
}

async eliminarProyecto(proyectoId, nombreProyecto) {
    try {
        // Confirmación
        const confirmar = confirm(`¿Está seguro de que desea eliminar el proyecto "${nombreProyecto}"?\n\nEsta acción marcará el proyecto como eliminado.`);
        
        if (!confirmar) {
            return;
        }
        
        console.log('Eliminando proyecto ID:', proyectoId);
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`${this.apiBaseUrl}/projects/${proyectoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            this.mostrarMensaje(`Proyecto "${nombreProyecto}" eliminado correctamente`, 'success');
            
            // Remover la fila de la tabla
            const row = document.getElementById(`project-row-${proyectoId}`);
            if (row) {
                row.remove();
            }
            
            // Si no quedan proyectos, mostrar mensaje
            const tableBody = document.getElementById('projectsTableBody');
            if (tableBody && tableBody.children.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4 text-gray-500">
                            No hay proyectos registrados.
                        </td>
                    </tr>
                `;
            }
            
        } else {
            throw new Error(result.error || 'Error al eliminar proyecto');
        }
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        this.mostrarError('Error al eliminar proyecto: ' + error.message);
    }
}

renderProjectsTable(projects) {
    const tableBody = document.getElementById('projectsTableBody');
    if (!tableBody || !projects || projects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-gray-500">
                    No hay proyectos registrados.
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    projects.forEach(project => {
        // Mapear estados a colores
        const estadoColors = {
            'pendiente': 'bg-yellow-100 text-yellow-800',
            'en-proceso': 'bg-blue-100 text-blue-800',
            'completado': 'bg-green-100 text-green-800',
            'cancelado': 'bg-red-100 text-red-800'
        };
        
        // Mapear prioridad a colores
        const prioridadColors = {
            'alta': 'bg-red-100 text-red-800',
            'media': 'bg-yellow-100 text-yellow-800',
            'baja': 'bg-green-100 text-green-800'
        };
        
        html += `
            <tr class="hover:bg-gray-50" id="project-row-${project.id}">
                <td class="py-3 px-4 border-b">
                    <div class="font-medium">${project.nombre || project.NombreProyecto || 'Sin nombre'}</div>
                </td>
                <td class="py-3 px-4 border-b">
                    <div>${project.clienteEmpresa || project.cliente || 'Sin cliente'}</div>
                </td>
                <td class="py-3 px-4 border-b">
                    <div>${project.agenteNombre || project.agente || 'Sin asignar'}</div>
                </td>
                <td class="py-3 px-4 border-b">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${estadoColors[project.estado] || 'bg-gray-100'}">
                        ${project.estado || 'Desconocido'}
                    </span>
                </td>
                <td class="py-3 px-4 border-b">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${prioridadColors[project.prioridad] || 'bg-gray-100'}">
    ${project.prioridad || 'No definida'}
</span>
</td>
</td>
<td class="py-3 px-4 border-b">
    <div class="flex space-x-2">
        <!-- Botón VER - FONDO AMARILLO, ÍCONO NEGRO -->
        <button onclick="window.adminProjects.verProyecto(${project.id})" 
                class="btn-amarillo">
            <i class="fas fa-eye"></i>
        </button>
        
        <!-- Botón EDITAR - FONDO AMARILLO, ÍCONO NEGRO -->
        <button onclick="window.adminProjects.editarProyecto(${project.id})" 
                class="btn-amarillo">
            <i class="fas fa-edit"></i>
        </button>
        
        <!-- Botón ELIMINAR - FONDO ROJO, ÍCONO BLANCO -->
        <button onclick="window.adminProjects.eliminarProyecto(${project.id}, '${project.nombre || project.NombreProyecto}')" 
                class="btn-rojo">
            <i class="fas fa-trash"></i>
        </button>
    </div>
</td>
</tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

    mostrarMensaje(mensaje, tipo = 'info') {
        console.log(`Mensaje (${tipo}): ${mensaje}`);
        
        // Crear mensaje emergente
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            tipo === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
        }`;
        alertDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'} mt-0.5 mr-3 text-lg"></i>
                <div class="flex-1">
                    <p class="font-medium">${mensaje}</p>
                </div>
                <button type="button" class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    mostrarError(mensaje) {
        this.mostrarMensaje(mensaje, 'error');
    }

    initializeDates() {
        const today = new Date().toISOString().split('T')[0];
        const startDate = document.getElementById('start-date');
        const deliveryDate = document.getElementById('delivery-date');
        
        if (startDate && !startDate.value) startDate.value = today;
        if (deliveryDate && !deliveryDate.value) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            deliveryDate.value = nextWeek.toISOString().split('T')[0];
            deliveryDate.min = today;
        }
        if (startDate) startDate.min = today;
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// =============================================

console.log('AdminProjects definido, preparando inicialización...');

function initializeAdminProjects() {
    console.log('=== INICIALIZANDO ADMIN PROJECTS ===');
    
    if (window.adminProjects && window.adminProjects.initialized) {
        console.log('AdminProjects ya está inicializado');
        return Promise.resolve(window.adminProjects);
    }
    
    console.log('Creando nueva instancia de AdminProjects...');
    window.adminProjects = new AdminProjects();
    
    return window.adminProjects.init().then(() => {
        console.log('AdminProjects inicializado exitosamente');
        return window.adminProjects;
    }).catch(error => {
        console.error('Error al inicializar AdminProjects:', error);
        throw error;
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM cargado - Inicializando AdminProjects...');
        initializeAdminProjects().catch(err => {
            console.error('Error en inicialización:', err);
        });
    });
} else {
    console.log('DOM ya cargado - Inicializando AdminProjects...');
    initializeAdminProjects().catch(err => {
        console.error('Error en inicialización:', err);
    });
}

// Funciones globales
window.actualizarCantidadServicio = (servicioId, cambio) => {
    if (window.adminProjects) {
        window.adminProjects.actualizarCantidadServicio(servicioId, cambio);
    }
};

window.actualizarCantidadServicioInput = (servicioId, cantidad) => {
    if (window.adminProjects) {
        window.adminProjects.actualizarCantidadServicioInput(servicioId, cantidad);
    }
};

window.actualizarValorCampo = (servicioId, nombreCampo, valor) => {
    if (window.adminProjects) {
        window.adminProjects.actualizarValorCampo(servicioId, nombreCampo, valor);
    }
};

window.actualizarValorCheckbox = (servicioId, nombreCampo, valor, checked) => {
    if (window.adminProjects) {
        window.adminProjects.actualizarValorCheckbox(servicioId, nombreCampo, valor, checked);
    }
};

window.manejarArchivoServicio = (servicioId, nombreCampo, inputFile) => {
    if (window.adminProjects) {
        window.adminProjects.manejarArchivoServicio(servicioId, nombreCampo, inputFile);
    }
};

window.eliminarServicio = (servicioId) => {
    if (window.adminProjects) {
        window.adminProjects.eliminarServicio(servicioId);
    }
};

window.cancelarCreacionProyecto = () => {
    if (window.adminProjects) {
        window.adminProjects.ocultarFormulario();
    } else {
        const formulario = document.getElementById('formularioProyectoContainer');
        const btnMostrar = document.getElementById('btnMostrarFormularioProyecto');
        const lista = document.getElementById('projectsListContainer');
        
        if (formulario) formulario.classList.add('hidden');
        if (btnMostrar) btnMostrar.classList.remove('hidden');
        if (lista) lista.classList.remove('hidden');
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AdminProjects = AdminProjects;
    window.initializeAdminProjects = initializeAdminProjects;
}

console.log('admin-projects.js cargado completamente');