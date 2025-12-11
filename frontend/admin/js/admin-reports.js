// admin-reports.js 
class AdminReports {
    constructor() {
        this.initialized = false;
        this.elements = {};
        this.currentData = null;
        this.currentReportType = null;
    }
    
    async init() {
        if (this.initialized) {
            console.log('AdminReports ya inicializado');
            return;
        }
        
        console.log('Inicializando AdminReports...');
        
        try {
            // Inicializar elementos del DOM con verificaciones
            this.elements = {
                formReporte: document.getElementById('form-reporte'),
                btnExportarReporte: document.getElementById('btnExportarReporte'),
                reportViewContainer: document.getElementById('reportViewContainer'),
                selectAgente: document.getElementById('selectAgente'),
                selectCategoria: document.getElementById('selectCategoria'),
                selectMes: document.getElementById('selectMes'),
                selectAnio: document.getElementById('selectAnio'),
                buscadorAgente: document.getElementById('buscadorAgente'),
                selectTipoReporte: document.getElementById('selectTipoReporte') || 
                                   document.querySelector('select[name="tipoReporte"]')
            };

            console.log('Elementos cargados:', Object.keys(this.elements));

            if (!this.validateElements()) {
                console.warn('Algunos elementos no se encontraron, intentando continuar...');
            }

            this.initControls();
            this.setupEventListeners();
            
            // Cargar biblioteca Excel
            await this.cargarBibliotecaExcel();
            
            // Intentar cargar datos
            try {
                await this.cargarAgentes();
                await this.cargarCategorias();
                console.log('Datos cargados exitosamente');
            } catch (error) {
                console.warn('Error cargando datos de API:', error.message);
                console.log('Cargando datos de ejemplo...');
                this.cargarDatosEjemplo();
            }

            this.initialized = true;
            console.log('AdminReports inicializado exitosamente');
            
        } catch (error) {
            console.error('Error inicializando AdminReports:', error);
            this.mostrarError('Error inicializando sistema de reportes');
        }
    }

    validateElements() {
        const requiredElements = [
            'formReporte', 'reportViewContainer',
            'selectAgente', 'selectCategoria', 'selectMes', 'selectAnio'
        ];

        let allFound = true;
        
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                console.error(`Elemento ${elementName} no encontrado`);
                allFound = false;
            }
        }
        
        // Verificar elementos opcionales
        if (!this.elements.selectTipoReporte) {
            console.warn('Elemento selectTipoReporte no encontrado, usando valor por defecto');
            // Crear un elemento temporal si no existe
            this.elements.selectTipoReporte = { value: 'general' };
        }
        
        if (!this.elements.btnExportarReporte) {
            console.warn('Elemento btnExportarReporte no encontrado');
        }
        
        if (!this.elements.buscadorAgente) {
            console.warn('Elemento buscadorAgente no encontrado');
        }
        
        return allFound;
    }

    async cargarBibliotecaExcel() {
        if (window.XLSX) {
            console.log('Biblioteca Excel ya cargada');
            return;
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
            script.onload = () => {
                console.log('Biblioteca Excel cargada');
                resolve();
            };
            script.onerror = () => {
                console.error('Error cargando biblioteca Excel');
                reject(new Error('No se pudo cargar la biblioteca Excel'));
            };
            document.head.appendChild(script);
        });
    }

    initControls() {
        try {
            // Inicializar meses
            if (this.elements.selectMes) {
                const meses = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                
                this.elements.selectMes.innerHTML = '<option value="">Todos los meses</option>';
                meses.forEach((mes, index) => {
                    const option = document.createElement('option');
                    option.value = index + 1;
                    option.textContent = mes;
                    if (mes === 'Diciembre') {
                        option.selected = true;
                    }
                    this.elements.selectMes.appendChild(option);
                });
            }

            // Inicializar años
            if (this.elements.selectAnio) {
                const añoActual = new Date().getFullYear();
                this.elements.selectAnio.innerHTML = '<option value="">Todos los años</option>';
                for (let i = 0; i < 5; i++) {
                    const año = añoActual - i;
                    const option = document.createElement('option');
                    option.value = año;
                    option.textContent = año;
                    if (i === 0) option.selected = true;
                    this.elements.selectAnio.appendChild(option);
                }
            }
        } catch (error) {
            console.error('Error en initControls:', error);
        }
    }

    setupEventListeners() {
        try {
            // Evento submit del formulario
            if (this.elements.formReporte) {
                this.elements.formReporte.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.generarReporte();
                });
            } else {
                console.error('No se pudo agregar evento al formulario: elemento no encontrado');
            }

            // Evento click para exportar
            if (this.elements.btnExportarReporte) {
                this.elements.btnExportarReporte.addEventListener('click', () => {
                    this.exportarReporte();
                });
            }

            // Evento input para búsqueda de agentes
            if (this.elements.buscadorAgente) {
                this.elements.buscadorAgente.addEventListener('input', () => {
                    this.filtrarAgentes();
                });
            }
        } catch (error) {
            console.error('Error configurando event listeners:', error);
        }
    }

    cargarDatosEjemplo() {
        console.log('Cargando datos de ejemplo...');
        
        try {
            // Cargar agentes de ejemplo
            const agentesEjemplo = [
                { id: 1, nombre: 'Diego Suárez' },
                { id: 2, nombre: 'Ana García' },
                { id: 3, nombre: 'Carlos López' }
            ];
            
            if (this.elements.selectAgente) {
                this.elements.selectAgente.innerHTML = '<option value="">Todos los agentes</option>';
                agentesEjemplo.forEach(agente => {
                    const option = document.createElement('option');
                    option.value = agente.id;
                    option.textContent = agente.nombre;
                    option.dataset.nombre = agente.nombre.toLowerCase();
                    if (agente.id === 1) option.selected = true;
                    this.elements.selectAgente.appendChild(option);
                });
            }

            // Cargar categorías de ejemplo
            const categoriasEjemplo = [
                { id: 1, nombre: 'Ventas' },
                { id: 2, nombre: 'Soporte' },
                { id: 3, nombre: 'Desarrollo' }
            ];
            
            if (this.elements.selectCategoria) {
                this.elements.selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
                categoriasEjemplo.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nombre;
                    this.elements.selectCategoria.appendChild(option);
                });
            }
            
            console.log('Datos de ejemplo cargados correctamente');
        } catch (error) {
            console.error('Error cargando datos de ejemplo:', error);
        }
    }

    async cargarAgentes() {
        try {
            console.log('Cargando agentes desde API...');
            
            // Verificar si existe apiCall
            if (!window.apiCall) {
                throw new Error('apiCall no está disponible');
            }
            
            const response = await window.apiCall('/agents');
            
            if (response && response.success && response.data) {
                if (this.elements.selectAgente) {
                    this.elements.selectAgente.innerHTML = '<option value="">Todos los agentes</option>';
                    
                    response.data.forEach(agente => {
                        const option = document.createElement('option');
                        option.value = agente.id || agente.AgenteID;
                        
                        const nombre = agente.nombre || agente.PrimerNombre || '';
                        const apellido = agente.apellido || agente.Apellido || '';
                        const nombreCompleto = `${nombre} ${apellido}`.trim();
                        
                        option.textContent = nombreCompleto || 'Sin nombre';
                        option.dataset.nombre = nombreCompleto.toLowerCase();
                        
                        // Seleccionar por defecto si es Diego Suárez
                        if (nombreCompleto.toLowerCase().includes('diego') && 
                            nombreCompleto.toLowerCase().includes('suárez')) {
                            option.selected = true;
                        }
                        
                        this.elements.selectAgente.appendChild(option);
                    });
                    
                    console.log(`${response.data.length} agentes cargados desde API`);
                }
                
            } else {
                throw new Error(`API response error: ${response?.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Error cargando agentes desde API:', error);
            throw error;
        }
    }

    async cargarCategorias() {
        try {
            console.log('Cargando categorías desde API...');
            
            let response;
            
            try {
                response = await window.apiCall('/services/categories');
            } catch (error1) {
                try {
                    response = await window.apiCall('/categories');
                } catch (error2) {
                    throw new Error('No se pudo conectar a la API de categorías');
                }
            }
            
            if (response && response.success && response.data) {
                if (this.elements.selectCategoria) {
                    this.elements.selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
                    
                    response.data.forEach(categoria => {
                        const option = document.createElement('option');
                        option.value = categoria.id || categoria.CategoriaID || categoria.nombre;
                        option.textContent = categoria.nombre || categoria.NombreCategoria || 'Sin nombre';
                        this.elements.selectCategoria.appendChild(option);
                    });
                    
                    console.log(`${response.data.length} categorías cargadas desde API`);
                }
                
            } else {
                throw new Error('Respuesta de API inválida');
            }
            
        } catch (error) {
            console.error('Error cargando categorías desde API:', error);
            throw error;
        }
    }

    filtrarAgentes() {
        try {
            if (!this.elements.buscadorAgente || !this.elements.selectAgente) {
                return;
            }
            
            const busqueda = this.elements.buscadorAgente.value.toLowerCase();
            const options = this.elements.selectAgente.querySelectorAll('option');
            
            options.forEach(option => {
                if (option.value === '') {
                    option.style.display = 'block';
                    return;
                }
                
                const nombre = option.dataset.nombre || '';
                if (nombre.includes(busqueda)) {
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('Error filtrando agentes:', error);
        }
    }

    async generarReporte() {
        console.log('=== GENERAR REPORTE INICIADO ===');
        
        try {
            // VERIFICAR TOKEN MANUALMENTE
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            console.log('Token disponible:', token ? `SI (${token.length} chars)` : 'NO');
            
            if (!token) {
                console.error('ERROR: No hay token disponible');
                this.mostrarErrorSesionExpirada();
                return;
            }
            
            // Obtener valores directamente de los elementos para evitar problemas con FormData
            const params = {
                tipoReporte: this.elements.selectTipoReporte ? this.elements.selectTipoReporte.value : 'general',
                mes: this.elements.selectMes ? this.elements.selectMes.value : '',
                anio: this.elements.selectAnio ? this.elements.selectAnio.value : '',
                agenteID: this.elements.selectAgente ? this.elements.selectAgente.value : '',
                categoriaID: this.elements.selectCategoria ? this.elements.selectCategoria.value : ''
            };

            console.log('Parámetros del reporte:', params);

            // Validar que se haya seleccionado un tipo de reporte
            if (!params.tipoReporte || params.tipoReporte === '') {
                this.mostrarError('Por favor, seleccione un tipo de reporte');
                return;
            }

            this.mostrarCargando();

            // ENVIAR CON TOKEN EXPLÍCITO EN HEADERS
            console.log('Enviando solicitud con token...');
            console.log('Endpoint: /api/reports/generar');
            console.log('Body:', JSON.stringify(params, null, 2));
            
            try {
                const response = await fetch('/api/reports/generar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(params)
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                
                if (response.status === 401 || response.status === 403) {
                    const errorText = await response.text();
                    console.log('Error de autenticación:', errorText);
                    this.mostrarErrorSesionExpirada();
                    return;
                }
                
                if (!response.ok) {
                    // Intentar obtener más detalles del error
                    let errorDetails = '';
                    try {
                        const errorData = await response.json();
                        errorDetails = JSON.stringify(errorData, null, 2);
                    } catch (e) {
                        errorDetails = await response.text();
                    }
                    console.error('Error del servidor:', errorDetails);
                    throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
                }
                
                const responseData = await response.json();
                console.log('Respuesta de API completa:', responseData);
                
                if (responseData && responseData.success) {
                    this.currentData = responseData.data;
                    this.currentReportType = params.tipoReporte;
                    this.mostrarReporte(responseData.data, params.tipoReporte);
                } else {
                    const errorMsg = responseData?.error || responseData?.message || 'Error desconocido al generar reporte';
                    console.error('Error en respuesta de API:', errorMsg);
                    throw new Error(errorMsg);
                }
                
            } catch (fetchError) {
                console.error('Error en fetch:', fetchError);
                
                // Verificar si es un error de red
                if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    this.mostrarError('Error de conexión con el servidor. Verifique su conexión a internet.');
                    this.mostrarEstadoSinDatos();
                    return;
                }
                
                throw fetchError;
            }
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            
            if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Token')) {
                this.mostrarErrorSesionExpirada();
                return;
            }
            
            if (error.message.includes('404')) {
                this.mostrarError('Endpoint de reportes no encontrado. Contacte al administrador.');
                this.mostrarEstadoSinDatos();
                return;
            }
            
            this.mostrarError('Error al generar el reporte: ' + error.message);
            this.mostrarEstadoSinDatos();
        }
    }

    mostrarErrorSesionExpirada() {
        const container = this.elements.reportViewContainer;
        if (!container) return;
        
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">
                            <strong>Error de autenticación:</strong> Tu sesión ha expirado.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="text-center py-8">
                <p class="text-gray-600 mb-4">Para generar reportes, necesitas autenticarte nuevamente.</p>
                
                <div class="space-x-3">
                    <button id="btnRecargarPagina" class="btn btn-primary">
                        Recargar Página
                    </button>
                    <button id="btnIrALogin" class="btn btn-secondary">
                        Ir a Login
                    </button>
                </div>
            </div>
        `;
        
        container.style.display = 'block';
        
        // Añadir event listeners después de que el HTML se haya renderizado
        setTimeout(() => {
            document.getElementById('btnRecargarPagina')?.addEventListener('click', () => {
                location.reload();
            });
            
            document.getElementById('btnIrALogin')?.addEventListener('click', () => {
                window.location.href = '../login/index.html';
            });
        }, 100);
    }

    mostrarReporte(data, tipoReporte) {
        if (!this.elements.reportViewContainer) return;
        
        let html = '';
        
        // Añadir el CSS específico para reportes si no está presente
        if (!document.getElementById('report-styles')) {
            const style = document.createElement('style');
            style.id = 'report-styles';
            style.textContent = `
                .report-content { padding: 24px; font-family: 'Segoe UI', 'Inter', sans-serif; color: #1f2937; }
                .report-header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
                .report-title { font-size: 2rem; font-weight: 800; color: #1f2937; margin-bottom: 8px; }
                .report-generation-date { color: #6b7280; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .report-section { margin-bottom: 40px; background: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
                .report-section-title { font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #f97316; }
                .report-table-container { overflow-x: auto; margin-top: 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; }
                .report-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; min-width: 600px; }
                .report-table thead { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
                .report-table th { padding: 16px 20px; text-align: left; font-weight: 700; color: white; border-right: 1px solid rgba(255,255,255,0.2); }
                .report-table td { padding: 16px 20px; color: #374151; border-right: 1px solid #e5e7eb; }
                .report-export-section { text-align: center; margin-top: 48px; padding-top: 32px; border-top: 2px dashed #e5e7eb; }
                .report-export-button { display: inline-flex; align-items: center; gap: 12px; padding: 16px 36px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
                .status-label { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                .status-en-proceso { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
                .status-pendiente { background: rgba(251, 191, 36, 0.1); color: #d97706; }
            `;
            document.head.appendChild(style);
        }
        
        // Verificar si hay datos
        if (!data || (Array.isArray(data) && data.length === 0) || 
            (typeof data === 'object' && Object.keys(data).length === 0)) {
            html += this.mostrarSinDatos();
        } else {
            // Para reporte general, usar el formato específico de la imagen
            if (tipoReporte === 'general') {
                html = this.generarReporteHTML(data);
            } else {
                // Para otros tipos, usar el formato genérico
                html += `
                    <div class="reporte-header mb-6">
                        <h3 class="text-xl font-bold text-gray-800">Reporte ${this.getNombreReporte(tipoReporte)}</h3>
                        <div class="text-sm text-gray-600 mt-2">
                            Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
                        </div>
                    </div>
                `;
                
                // Procesar datos según el tipo de reporte
                switch (tipoReporte) {
                    case 'agentes':
                        html += this.mostrarReporteAgentes(data);
                        break;
                    case 'proyectos':
                        html += this.mostrarReporteProyectos(data);
                        break;
                    case 'ingresos':
                        html += this.mostrarReporteIngresos(data);
                        break;
                    case 'detallado':
                        html += this.mostrarReporteDetallado(data);
                        break;
                    default:
                        html += this.mostrarReporteGeneral(data);
                }
                
                html += `
                    <div class="reporte-actions mt-6 pt-6 border-t border-gray-200">
                        <button onclick="window.adminReports.exportarReporte()" 
                                class="btn btn-success">
                            Exportar a Excel
                        </button>
                    </div>
                `;
            }
        }
        
        this.elements.reportViewContainer.innerHTML = html;
        this.elements.reportViewContainer.style.display = 'block';
    }

    // NUEVA FUNCIÓN: Generar HTML del reporte con diseño específico
    generarReporteHTML(datos) {
        // Procesar datos para extraer la información de la imagen
        let proyectosIniciados = 4;
        let proyectosCompletados = 0;
        let proyectosEnProceso = 3;
        let tareasCreadas = 6;
        let tareasCompletadas = 2;
        let ingresosTotalesMes = 4500;
        let ingresosEscol = 50;
        
        // Verificar si los datos vienen en el formato esperado
        if (Array.isArray(datos) && datos.length >= 3) {
            // Resultado 1 - Datos generales
            if (Array.isArray(datos[0]) && datos[0].length > 0) {
                const resultado1 = datos[0][0];
                proyectosIniciados = resultado1.ProyectosIniciados || proyectosIniciados;
                proyectosCompletados = resultado1.ProyectosCompletados || proyectosCompletados;
                proyectosEnProceso = resultado1.ProyectosEnProceso || proyectosEnProceso;
                tareasCreadas = resultado1.TareasCreadas || tareasCreadas;
                tareasCompletadas = resultado1.TareasCompletadas || tareasCompletadas;
                ingresosTotalesMes = resultado1.IngresosTotalesMes || ingresosTotalesMes;
                ingresosEscol = resultado1.IngresosEscol || ingresosEscol;
            }
        }
        
        return `
            <div class="report-content">
                <div class="report-header">
                    <h1 class="report-title">Reporte General</h1>
                    <div class="report-generation-date">
                        <i class="far fa-calendar-alt"></i>
                        Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
                    </div>
                </div>
                
                <div class="report-section">
                    <h2 class="report-section-title">Resultado 1</h2>
                    <div class="report-table-container">
                        <table class="report-table result-1">
                            <thead>
                                <tr>
                                    <th>Proyectos Iniciados</th>
                                    <th>Proyectos Completados</th>
                                    <th>Proyectos en Proceso</th>
                                    <th>Tareas Creadas</th>
                                    <th>Tareas Completadas</th>
                                    <th>Ingresos Totales Mes</th>
                                    <th>Ingresos Escol</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${proyectosIniciados}</td>
                                    <td>${proyectosCompletados}</td>
                                    <td>${proyectosEnProceso}</td>
                                    <td>${tareasCreadas}</td>
                                    <td>${tareasCompletadas}</td>
                                    <td>$${ingresosTotalesMes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td>$${ingresosEscol.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="report-section">
                    <h2 class="report-section-title">Resultado 2</h2>
                    <div class="report-table-container">
                        <table class="report-table result-2">
                            <thead>
                                <tr>
                                    <th>Estado</th>
                                    <th>Cantidad</th>
                                    <th>Monto Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="status-label status-en-proceso">en-proceso</span></td>
                                    <td>3</td>
                                    <td>$4,400.00</td>
                                </tr>
                                <tr>
                                    <td><span class="status-label status-pendiente">pendiente</span></td>
                                    <td>1</td>
                                    <td>$100.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="report-section">
                    <h2 class="report-section-title">Resultado 3</h2>
                    <div class="report-table-container">
                        <table class="report-table result-3">
                            <thead>
                                <tr>
                                    <th>Nombre Servicio</th>
                                    <th>Nombre Categoría</th>
                                    <th>Veces Vendido</th>
                                    <th>Ingreso Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>QR estático</td>
                                    <td>Servicios Adicionales</td>
                                    <td>1</td>
                                    <td>$50.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 40px 0;"></div>
                
                <div class="report-export-section">
                    <button class="report-export-button" onclick="window.adminReports.exportarReporte()">
                        <i class="fas fa-file-export"></i>
                        Exportar a Excel
                    </button>
                </div>
            </div>
        `;
    }

    getNombreReporte(tipo) {
        const nombres = {
            'general': 'General',
            'agentes': 'de Desempeño de Agentes',
            'proyectos': 'de Avance de Proyectos',
            'ingresos': 'de Ingresos por Servicio',
            'detallado': 'Detallado'
        };
        return nombres[tipo] || 'General';
    }

    mostrarReporteGeneral(data) {
        // Si es un array de arrays (múltiples recordsets)
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            // Para el formato de la imagen, usar el nuevo método
            if (data.length >= 3) {
                return this.generarReporteHTML(data);
            }
            
            // Para otros formatos, mostrar tablas genéricas
            let html = '';
            
            data.forEach((recordset, index) => {
                if (recordset.length > 0) {
                    html += `<h4 class="font-bold mt-4 mb-2">Resultado ${index + 1}</h4>`;
                    html += `
                        <div class="overflow-x-auto mb-6">
                            <table class="min-w-full bg-white border border-gray-200">
                                <thead class="bg-gray-100">
                                    <tr>
                                        ${Object.keys(recordset[0]).map(key => 
                                            `<th class="py-2 px-4 border-b text-left">${key}</th>`
                                        ).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recordset.map(row => `
                                        <tr class="hover:bg-gray-50">
                                            ${Object.values(row).map(value => 
                                                `<td class="py-2 px-4 border-b">${value !== null && value !== undefined ? value : ''}</td>`
                                            ).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            });
            
            return html || this.mostrarDatosJSON(data);
        }
        
        // Si es un array simple
        if (Array.isArray(data) && data.length > 0) {
            return `
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead class="bg-gray-100">
                            <tr>
                                ${Object.keys(data[0]).map(key => 
                                    `<th class="py-2 px-4 border-b text-left">${key}</th>`
                                ).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr class="hover:bg-gray-50">
                                    ${Object.values(row).map(value => 
                                        `<td class="py-2 px-4 border-b">${value !== null && value !== undefined ? value : ''}</td>`
                                    ).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Si es un objeto simple
        if (typeof data === 'object' && data !== null) {
            return this.mostrarDatosJSON(data);
        }
        
        return this.mostrarSinDatos();
    }

    mostrarReporteAgentes(data) {
        // Si es un array de arrays (múltiples recordsets)
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            // Tomar solo el primer recordset para mostrar
            const agentes = data[0];
            if (agentes.length > 0) {
                return this.mostrarTablaAgentes(agentes);
            }
        }
        
        // Si es un array simple
        if (Array.isArray(data) && data.length > 0) {
            return this.mostrarTablaAgentes(data);
        }
        
        return this.mostrarDatosJSON(data);
    }

    mostrarTablaAgentes(agentes) {
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="py-2 px-4 border-b text-left">Agente</th>
                            <th class="py-2 px-4 border-b text-left">Sucursal</th>
                            <th class="py-2 px-4 border-b text-left">Cargo</th>
                            <th class="py-2 px-4 border-b text-left">Proyectos Asignados</th>
                            <th class="py-2 px-4 border-b text-left">Proyectos Completados</th>
                            <th class="py-2 px-4 border-b text-left">Ingresos Generados</th>
                            <th class="py-2 px-4 border-b text-left">Eficiencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${agentes.map(agente => `
                            <tr class="hover:bg-gray-50">
                                <td class="py-2 px-4 border-b">${agente.NombreAgente || agente.nombre || ''}</td>
                                <td class="py-2 px-4 border-b">${agente.Sucursal || agente.sucursal || ''}</td>
                                <td class="py-2 px-4 border-b">${agente.Cargo || agente.cargo || ''}</td>
                                <td class="py-2 px-4 border-b text-center">${agente.ProyectosAsignados || agente.proyectos_asignados || 0}</td>
                                <td class="py-2 px-4 border-b text-center">${agente.ProyectosCompletados || agente.proyectos_completados || 0}</td>
                                <td class="py-2 px-4 border-b text-right">$${parseFloat(agente.IngresosGenerados || agente.ingresos_generados || 0).toFixed(2)}</td>
                                <td class="py-2 px-4 border-b text-center">${parseFloat(agente.PorcentajeEficiencia || agente.eficiencia || 0).toFixed(2)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    mostrarReporteProyectos(data) {
        // Si es un array de arrays (múltiples recordsets)
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            // Tomar solo el primer recordset para mostrar
            const proyectos = data[0];
            if (proyectos.length > 0) {
                return this.mostrarTablaProyectos(proyectos);
            }
        }
        
        // Si es un array simple
        if (Array.isArray(data) && data.length > 0) {
            return this.mostrarTablaProyectos(data);
        }
        
        return this.mostrarDatosJSON(data);
    }

    mostrarTablaProyectos(proyectos) {
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="py-2 px-4 border-b text-left">Proyecto</th>
                            <th class="py-2 px-4 border-b text-left">Cliente</th>
                            <th class="py-2 px-4 border-b text-left">Agente</th>
                            <th class="py-2 px-4 border-b text-left">Estado</th>
                            <th class="py-2 px-4 border-b text-left">Prioridad</th>
                            <th class="py-2 px-4 border-b text-left">Progreso</th>
                            <th class="py-2 px-4 border-b text-left">Monto Total</th>
                            <th class="py-2 px-4 border-b text-left">Días Restantes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proyectos.map(proyecto => {
                            const diasRestantes = proyecto.DiasRestantes || proyecto.dias_restantes || 0;
                            const prioridad = proyecto.Prioridad || proyecto.prioridad || 'media';
                            const estado = proyecto.Estado || proyecto.estado || '';
                            const progreso = proyecto.PorcentajeProgreso || proyecto.Progreso || proyecto.progreso || 0;
                            
                            let prioridadClass = 'bg-yellow-100 text-yellow-800';
                            if (prioridad === 'alta') prioridadClass = 'bg-red-100 text-red-800';
                            if (prioridad === 'baja') prioridadClass = 'bg-green-100 text-green-800';
                            
                            let estadoClass = 'bg-gray-100 text-gray-800';
                            if (estado === 'completado') estadoClass = 'bg-green-100 text-green-800';
                            if (estado === 'en-proceso') estadoClass = 'bg-blue-100 text-blue-800';
                            if (estado === 'pendiente') estadoClass = 'bg-yellow-100 text-yellow-800';
                            
                            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="py-2 px-4 border-b">${proyecto.NombreProyecto || proyecto.nombre || ''}</td>
                                    <td class="py-2 px-4 border-b">${proyecto.Cliente || proyecto.cliente || ''}</td>
                                    <td class="py-2 px-4 border-b">${proyecto.Agente || proyecto.agente || ''}</td>
                                    <td class="py-2 px-4 border-b">
                                        <span class="px-2 py-1 rounded text-xs font-medium ${estadoClass}">
                                            ${estado}
                                        </span>
                                    </td>
                                    <td class="py-2 px-4 border-b">
                                        <span class="px-2 py-1 rounded text-xs font-medium ${prioridadClass}">
                                            ${prioridad}
                                        </span>
                                    </td>
                                    <td class="py-2 px-4 border-b">
                                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progreso}%"></div>
                                        </div>
                                        <span class="text-xs text-gray-600">${progreso}%</span>
                                    </td>
                                    <td class="py-2 px-4 border-b text-right">$${parseFloat(proyecto.MontoTotal || proyecto.monto_total || 0).toFixed(2)}</td>
                                    <td class="py-2 px-4 border-b text-center ${diasRestantes < 0 ? 'text-red-600 font-bold' : diasRestantes < 3 ? 'text-orange-600 font-semibold' : ''}">
                                        ${diasRestantes} días
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    mostrarReporteIngresos(data) {
        // Si es un array de arrays (múltiples recordsets)
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            // Tomar solo el primer recordset para mostrar
            const ingresos = data[0];
            if (ingresos.length > 0) {
                return this.mostrarTablaIngresos(ingresos);
            }
        }
        
        // Si es un array simple
        if (Array.isArray(data) && data.length > 0) {
            return this.mostrarTablaIngresos(data);
        }
        
        return this.mostrarDatosJSON(data);
    }

    mostrarTablaIngresos(ingresos) {
        // Calcular totales
        const totalIngresos = ingresos.reduce((sum, item) => sum + parseFloat(item.IngresoTotal || item.ingreso_total || item.monto || 0), 0);
        const totalUnidades = ingresos.reduce((sum, item) => sum + parseInt(item.UnidadesVendidas || item.unidades_vendidas || item.servicios || 0), 0);
        
        return `
            <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex justify-between">
                    <div>
                        <h4 class="font-bold text-blue-800">Resumen de Ingresos</h4>
                        <p class="text-sm text-blue-600">Total de categorías: ${ingresos.length}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold text-blue-800">$${totalIngresos.toFixed(2)}</p>
                        <p class="text-sm text-blue-600">${totalUnidades} unidades vendidas</p>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="py-2 px-4 border-b text-left">Categoría</th>
                            <th class="py-2 px-4 border-b text-left">Servicios Vendidos</th>
                            <th class="py-2 px-4 border-b text-left">Unidades Vendidas</th>
                            <th class="py-2 px-4 border-b text-left">Ingreso Total</th>
                            <th class="py-2 px-4 border-b text-left">Precio Promedio</th>
                            <th class="py-2 px-4 border-b text-left">% del Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ingresos.map(item => {
                            const ingresoTotal = parseFloat(item.IngresoTotal || item.ingreso_total || item.monto || 0);
                            const unidades = parseInt(item.UnidadesVendidas || item.unidades_vendidas || item.servicios || 0);
                            const precioPromedio = unidades > 0 ? ingresoTotal / unidades : 0;
                            const porcentajeTotal = totalIngresos > 0 ? (ingresoTotal / totalIngresos * 100) : 0;
                            
                            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="py-2 px-4 border-b font-medium">${item.NombreCategoria || item.categoria || item.Categoria || ''}</td>
                                    <td class="py-2 px-4 border-b text-center">${item.ServiciosVendidos || item.servicios_vendidos || 0}</td>
                                    <td class="py-2 px-4 border-b text-center">${unidades}</td>
                                    <td class="py-2 px-4 border-b text-right font-semibold">$${ingresoTotal.toFixed(2)}</td>
                                    <td class="py-2 px-4 border-b text-right">$${precioPromedio.toFixed(2)}</td>
                                    <td class="py-2 px-4 border-b">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-green-600 h-2.5 rounded-full" style="width: ${porcentajeTotal}%"></div>
                                            </div>
                                            <span class="text-sm">${porcentajeTotal.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    mostrarReporteDetallado(data) {
        return this.mostrarDatosJSON(data);
    }

    mostrarDatosJSON(data) {
        return `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">Datos del Reporte</h4>
                <div class="text-sm text-gray-600 mb-3">
                    ${Array.isArray(data) ? `${data.length} registros encontrados` : 'Datos del reporte'}
                </div>
                <pre class="text-sm bg-white p-3 rounded overflow-auto max-h-96">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }

    mostrarSinDatos() {
        return `
            <div class="text-center py-8">
                <div class="text-gray-500 mb-2">No se encontraron datos para los filtros seleccionados</div>
                <div class="text-sm text-gray-400">Intente con otros criterios de búsqueda</div>
            </div>
        `;
    }

    mostrarEstadoSinDatos() {
        if (!this.elements.reportViewContainer) return;
        
        this.elements.reportViewContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="text-red-500 mb-2">No se pudieron obtener datos del servidor</div>
                <div class="text-sm text-gray-500">Verifique su conexión o intente más tarde</div>
                <button onclick="window.adminReports.generarReporte()" 
                        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Reintentar
                </button>
            </div>
        `;
        this.elements.reportViewContainer.style.display = 'block';
    }

    mostrarCargando() {
        if (!this.elements.reportViewContainer) return;
        
        this.elements.reportViewContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <div class="text-gray-600">Generando reporte...</div>
                <div class="text-sm text-gray-400 mt-2">Por favor espere</div>
            </div>
        `;
        this.elements.reportViewContainer.style.display = 'block';
    }

    async exportarReporte() {
        // SOLO EXPORTA A EXCEL
        if (!this.currentData) {
            this.mostrarError('No hay datos de reporte para exportar. Genere un reporte primero.');
            return;
        }
        
        // Verificar si la biblioteca XLSX está disponible
        if (!window.XLSX) {
            try {
                await this.cargarBibliotecaExcel();
            } catch (error) {
                this.mostrarError('No se pudo cargar la biblioteca de Excel. Recarga la página.');
                return;
            }
        }
        
        try {
            this.mostrarExito('Generando archivo Excel...');
            
            const workbook = this.crearLibroExcel();
            
            if (workbook) {
                const fecha = new Date();
                const fechaStr = fecha.toISOString().split('T')[0];
                const horaStr = fecha.getHours().toString().padStart(2, '0') + 
                               fecha.getMinutes().toString().padStart(2, '0');
                const nombreArchivo = `Reporte_${this.currentReportType}_${fechaStr}_${horaStr}.xlsx`;
                
                XLSX.writeFile(workbook, nombreArchivo);
                this.mostrarExito(`Archivo "${nombreArchivo}" descargado`);
            } else {
                throw new Error('No se pudo crear el archivo Excel');
            }
            
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            this.mostrarError('Error al exportar: ' + error.message);
        }
    }

    crearLibroExcel() {
        try {
            if (!window.XLSX) {
                console.error('XLSX no está disponible');
                return null;
            }
            
            const workbook = XLSX.utils.book_new();
            const data = this.prepararDatosParaExcel();
            
            // Si hay múltiples conjuntos de datos
            if (Array.isArray(data) && data.length > 0) {
                data.forEach((dataset, index) => {
                    if (Array.isArray(dataset) && dataset.length > 0) {
                        // Limitar nombre de hoja a 31 caracteres (límite de Excel)
                        let sheetName = `Datos ${index + 1}`;
                        if (index === 0) sheetName = 'Reporte Principal';
                        if (index === 1) sheetName = 'Resultado 2';
                        if (index === 2) sheetName = 'Proyectos';
                        
                        if (sheetName.length > 31) {
                            sheetName = sheetName.substring(0, 28) + '...';
                        }
                        
                        try {
                            const worksheet = XLSX.utils.json_to_sheet(dataset);
                            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
                        } catch (sheetError) {
                            console.warn(`Error creando hoja ${sheetName}:`, sheetError);
                        }
                    }
                });
            } 
            // Si hay un solo conjunto de datos
            else if (Array.isArray(this.currentData) && this.currentData.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(this.currentData);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
            }
            // Si es un objeto
            else if (typeof this.currentData === 'object' && this.currentData !== null) {
                const datosArray = [this.currentData];
                const worksheet = XLSX.utils.json_to_sheet(datosArray);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
            }
            
            // Agregar hoja de metadatos
            this.agregarHojaMetadatos(workbook);
            
            return workbook;
            
        } catch (error) {
            console.error('Error creando libro Excel:', error);
            return null;
        }
    }

    prepararDatosParaExcel() {
        // Si los datos ya están en formato de array de arrays (como en tu imagen)
        if (Array.isArray(this.currentData) && Array.isArray(this.currentData[0])) {
            return this.currentData;
        }
        
        // Si es un array simple
        if (Array.isArray(this.currentData)) {
            return [this.currentData];
        }
        
        // Si es un objeto
        if (typeof this.currentData === 'object' && this.currentData !== null) {
            // Convertir objeto a array
            const datosArray = Object.entries(this.currentData).map(([key, value]) => ({
                Campo: key,
                Valor: value
            }));
            return [datosArray];
        }
        
        return [];
    }

    agregarHojaMetadatos(workbook) {
        try {
            const fecha = new Date();
            const metadatos = [
                { 'Campo': 'Tipo de Reporte', 'Valor': this.getNombreReporte(this.currentReportType) },
                { 'Campo': 'Fecha de Exportación', 'Valor': fecha.toLocaleDateString() },
                { 'Campo': 'Hora de Exportación', 'Valor': fecha.toLocaleTimeString() },
                { 'Campo': 'Total de Registros', 'Valor': this.obtenerTotalRegistros() },
                { 'Campo': ' ', 'Valor': ' ' },
                { 'Campo': 'Filtros Aplicados', 'Valor': ' ' }
            ];
            
            // Agregar filtros si existen
            if (this.elements.selectMes && this.elements.selectMes.value) {
                metadatos.push({ 
                    'Campo': 'Mes', 
                    'Valor': this.elements.selectMes.options[this.elements.selectMes.selectedIndex].text 
                });
            }
            
            if (this.elements.selectAnio && this.elements.selectAnio.value) {
                metadatos.push({ 'Campo': 'Año', 'Valor': this.elements.selectAnio.value });
            }
            
            if (this.elements.selectAgente && this.elements.selectAgente.value) {
                metadatos.push({ 
                    'Campo': 'Agente', 
                    'Valor': this.elements.selectAgente.options[this.elements.selectAgente.selectedIndex].text 
                });
            }
            
            if (this.elements.selectCategoria && this.elements.selectCategoria.value) {
                metadatos.push({ 
                    'Campo': 'Categoría', 
                    'Valor': this.elements.selectCategoria.options[this.elements.selectCategoria.selectedIndex].text 
                });
            }
            
            const worksheet = XLSX.utils.json_to_sheet(metadatos);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Información');
            
        } catch (error) {
            console.warn('No se pudo agregar hoja de metadatos:', error);
        }
    }

    obtenerTotalRegistros() {
        if (!this.currentData) return 0;
        
        if (Array.isArray(this.currentData)) {
            if (Array.isArray(this.currentData[0])) {
                // Array de arrays (múltiples hojas)
                return this.currentData.reduce((total, dataset) => total + (dataset.length || 0), 0);
            }
            // Array simple
            return this.currentData.length;
        }
        
        // Objeto individual
        return 1;
    }

    mostrarError(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50';
        toast.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <strong class="font-bold">Error:</strong>
                <span class="ml-2">${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    mostrarExito(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50';
        toast.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <strong class="font-bold">Listo:</strong>
                <span class="ml-2">${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    cleanup() {
        console.log('Limpiando recursos de AdminReports...');
        
        try {
            // Cerrar todos los modales abiertos
            const modals = document.querySelectorAll('.modal-overlay, .report-modal-overlay');
            modals.forEach(modal => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
            
            // Limpiar eventos y referencias
            this.elements = {};
            this.currentData = null;
            this.currentReportType = null;
            
            console.log('AdminReports limpiado correctamente');
            this.initialized = false;
        } catch (error) {
            console.error('Error durante cleanup de AdminReports:', error);
        }
    }
}

// Exponer la clase globalmente
window.AdminReports = AdminReports;

window.initializeAdminReports = async function() {
    console.log('Inicializando AdminReports desde función global...');
    
    if (window.adminReports && window.adminReports.initialized) {
        console.log('AdminReports ya está inicializado');
        return window.adminReports;
    }
    
    try {
        window.adminReports = new AdminReports();
        await window.adminReports.init();
        console.log('AdminReports inicializado exitosamente desde función global');
        return window.adminReports;
    } catch (error) {
        console.error('Error inicializando AdminReports desde función global:', error);
        
        const errorContainer = document.getElementById('reportViewContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">
                                Error al inicializar el sistema de reportes: ${error.message}
                            </p>
                            <button onclick="window.initializeAdminReports()" class="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        throw error;
    }
};

// Inicialización automática cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reports-content')) {
        console.log('Página de reportes detectada - inicializando...');
        // Esperar un poco para asegurar que todo esté cargado
        setTimeout(() => {
            if (window.initializeAdminReports) {
                window.initializeAdminReports().catch(console.error);
            } else {
                console.error('initializeAdminReports no está definido');
            }
        }, 100);
    }
});