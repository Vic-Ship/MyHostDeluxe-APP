// agent-reports.js - Versión corregida y completa
window.agentReports = {
    currentReportData: null,
    clients: [],
    
    // Función interna para mostrar toasts
    mostrarToast: function(message, type = 'info') {
        console.log('Toast:', type, '-', message);
        
        // Si existe la función global, úsala
        if (window.mostrarToast && typeof window.mostrarToast === 'function') {
            window.mostrarToast(message, type);
            return;
        }
        
        // Implementación simple de emergencia
        const toast = document.createElement('div');
        toast.className = 'toast-temp';
        toast.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 9999; 
                       background: ${type === 'success' ? '#28a745' : 
                                   type === 'error' || type === 'danger' ? '#dc3545' : 
                                   type === 'warning' ? '#ffc107' : '#17a2b8'}; 
                       color: white; padding: 12px 20px; border-radius: 4px; 
                       box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                ${message}
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    },
    
    async initialize() {
        console.log('Inicializando módulo de reportes...');
        
        try {
            await this.loadDynamicOptions();
            this.setupEventListeners();
            console.log('Módulo de reportes inicializado');
        } catch (error) {
            console.error('Error inicializando:', error);
            this.mostrarToast('Error al inicializar reportes', 'danger');
        }
    },
    
    async loadDynamicOptions() {
        try {
            console.log('Cargando opciones dinámicas...');
            
            // Cargar proyectos
            await this.loadProjects();
            
            // Cargar clientes
            await this.loadClients();
            
        } catch (error) {
            console.error('Error cargando opciones dinámicas:', error);
            this.setEmptyOptions();
            this.mostrarToast('No se pudieron cargar todas las opciones', 'warning');
        }
    },
    
    async loadProjects() {
        try {
            console.log('Cargando proyectos...');
            const proyectosResponse = await window.apiCall('/agent/projects/list');
            
            if (proyectosResponse?.success) {
                const select = document.querySelector('select[name="proyecto"]');
                if (select) {
                    this.populateSelect(select, proyectosResponse.data, 'proyecto', 'nombre', 'cliente');
                    console.log(`Proyectos cargados: ${proyectosResponse.data.length}`);
                }
            } else {
                console.error('Error cargando proyectos:', proyectosResponse);
                this.setEmptyProjectOptions();
            }
        } catch (error) {
            console.error('Error en loadProjects:', error);
            this.setEmptyProjectOptions();
        }
    },
    
    async loadClients() {
        console.log('=== Cargando clientes para reportes ===');
        try {
            console.log('Llamando a /api/agent/clients/list...');
            const response = await window.apiCall('/agent/clients/list');
            console.log('Respuesta recibida:', response);
            
            if (response && response.success) {
                console.log(`Clientes cargados: ${response.data.length}`);
                console.log('Datos recibidos:', response.data);
                this.clients = response.data || [];
                
                // Llamar a la función que puebla el dropdown
                this.populateClientDropdown();
            } else {
                console.error('Respuesta no exitosa:', response);
                this.showError('No se pudieron cargar los clientes');
            }
        } catch (error) {
            console.error('Error completo en loadClients:', error);
            console.error('Error stack:', error.stack);
            this.showError('Error al cargar clientes: ' + error.message);
        }
    },
    
    // NUEVA FUNCIÓN: Poblar dropdown de clientes
    populateClientDropdown() {
        console.log('=== Populate Client Dropdown ===');
        const select = document.querySelector('select[name="cliente"]');
        
        if (!select) {
            console.error('No se encontró el select de clientes');
            return;
        }
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="todos">Todos los clientes</option>';
        
        if (this.clients && this.clients.length > 0) {
            console.log(`Poblando dropdown con ${this.clients.length} clientes`);
            
            this.clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.value || client.id;
                
                // Usar displayText si existe, de lo contrario text
                const displayText = client.displayText || client.text || client.empresa || `Cliente ${client.value}`;
                option.textContent = displayText;
                
                // Opcional: agregar datos adicionales
                if (client.text) option.setAttribute('data-text', client.text);
                if (client.empresa) option.setAttribute('data-empresa', client.empresa);
                
                select.appendChild(option);
            });
            
            console.log('Dropdown de clientes poblado exitosamente');
        } else {
            console.warn('No hay clientes para mostrar en el dropdown');
            select.innerHTML = '<option value="todos">Todos los clientes</option>';
        }
    },
    
    populateSelect(select, data, type, nameField, extraField = null) {
        if (!select) return;
        
        select.innerHTML = `<option value="todos">Todos los ${type}s</option>`;
        
        if (data && data.length > 0) {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                
                let text = item[nameField] || `${type} ${item.id}`;
                if (extraField && item[extraField]) {
                    text += ` (${item[extraField]})`;
                }
                
                option.textContent = text;
                select.appendChild(option);
            });
        } else {
            console.warn(`No hay datos para ${type}s`);
            select.innerHTML = `<option value="todos">Todos los ${type}s</option>`;
        }
    },
    
    setEmptyProjectOptions() {
        const select = document.querySelector('select[name="proyecto"]');
        if (select) {
            select.innerHTML = '<option value="todos">Todos los proyectos</option>';
        }
    },
    
    setEmptyClientOptions() {
        const select = document.querySelector('select[name="cliente"]');
        if (select) {
            select.innerHTML = '<option value="todos">Todos los clientes</option>';
        }
    },
    
    setEmptyOptions() {
        this.setEmptyProjectOptions();
        this.setEmptyClientOptions();
    },
    
    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Botón de generar reporte
        const generateButton = document.getElementById('btnGenerarReporte');
        if (generateButton) {
            generateButton.addEventListener('click', (e) => {
                console.log('Clic en Generar Vista');
                e.preventDefault();
                e.stopPropagation();
                this.generateReport();
                return false;
            });
        }
        
        // Botón de exportar a Excel
        const exportButton = document.getElementById('btnExportarExcel');
        if (exportButton) {
            exportButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportToExcel();
            });
        }
    },
    
    async generateReport() {
        console.log('Generando reporte...');
        
        // Obtener valores del formulario
        const tipoReporte = document.querySelector('select[name="tipoReporte"]').value;
        const proyecto = document.querySelector('select[name="proyecto"]').value;
        const cliente = document.querySelector('select[name="cliente"]').value;
        
        console.log('Parámetros:', { tipoReporte, proyecto, cliente });
        
        if (!tipoReporte) {
            this.mostrarToast('Selecciona un tipo de reporte', 'warning');
            return;
        }
        
        // Mostrar loading
        this.showLoading();
        
        try {
            // Construir URL
            const params = new URLSearchParams();
            params.append('tipoReporte', tipoReporte);
            if (proyecto !== 'todos') params.append('proyecto', proyecto);
            if (cliente !== 'todos') params.append('cliente', cliente);
            
            const url = `/agent/reports?${params.toString()}`;
            console.log('Llamando API:', url);
            
            // Llamar a la API
            const response = await window.apiCall(url);
            
            if (response?.success) {
                this.currentReportData = response.data;
                this.displayReport(response.data);
                this.mostrarToast(`Reporte generado: ${response.data.length} registros`, 'success');
            } else {
                throw new Error(response?.error || 'Error en la respuesta');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.mostrarToast('Error al generar reporte', 'danger');
            this.showError(error.message);
        }
    },
    
    displayReport(data) {
        const container = document.getElementById('reportContentAgente');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                        <i class="fas fa-info-circle text-2xl"></i>
                    </div>
                    <p class="text-gray-700 font-medium mb-2">No hay datos para mostrar</p>
                    <p class="text-gray-500 text-sm">No se encontraron registros con los filtros seleccionados</p>
                </div>
            `;
            return;
        }
        
        // Crear tabla simple
        let html = `
            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-blue-800">Reporte Generado</h4>
                        <p class="text-blue-600 text-sm">Total: ${data.length} registros</p>
                    </div>
                    <button onclick="window.agentReports.exportToExcel()" 
                            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
                        <i class="fas fa-file-excel mr-2"></i>Exportar Excel
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto border rounded-lg">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-800">
                        <tr>
        `;
        
        // Encabezados
        const headers = Object.keys(data[0]);
        headers.forEach(header => {
            html += `<th class="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">${header}</th>`;
        });
        
        html += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
        
        // Filas
        data.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            html += `<tr class="${bgColor}">`;
            
            headers.forEach(header => {
                let value = row[header];
                if (value === null || value === undefined) value = '-';
                if (typeof value === 'boolean') value = value ? 'Sí' : 'No';
                
                html += `<td class="px-4 py-3 text-sm text-gray-800">${value}</td>`;
            });
            
            html += '</tr>';
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    showLoading() {
        const container = document.getElementById('reportContentAgente');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p class="text-gray-700 font-medium">Generando reporte...</p>
                    <p class="text-gray-500 text-sm mt-2">Por favor espere</p>
                </div>
            `;
        }
    },
    
    showError(message) {
        const container = document.getElementById('reportContentAgente');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                        <i class="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <p class="text-red-600 font-medium mb-2">${message}</p>
                    <button onclick="window.agentReports.generateReport()" 
                            class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },
    
    async exportToExcel() {
    if (!this.currentReportData?.length) {
        this.mostrarToast('Primero genera un reporte', 'warning');
        return;
    }
    
    console.log('Exportando a Excel con SheetJS...');
    
    try {
        const data = this.currentReportData;
        const tipoReporte = document.querySelector('select[name="tipoReporte"]').value;
        const proyecto = document.querySelector('select[name="proyecto"]').value;
        const cliente = document.querySelector('select[name="cliente"]').value;
        
        const date = new Date();
        const fecha = date.toISOString().slice(0, 10).replace(/-/g, '');
        const hora = date.toTimeString().slice(0, 8).replace(/:/g, '');
        const filename = `reporte_${tipoReporte}_${fecha}_${hora}.xlsx`;
        
        // Convertir datos a hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // Agregar hoja con nombre personalizado
        const reporteNames = {
            'tiempos': 'Tiempos',
            'avance': 'Avance',
            'tareas': 'Tareas'
        };
        const sheetName = reporteNames[tipoReporte] || 'Reporte';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Generar archivo y descargar
        XLSX.writeFile(wb, filename);
        
        this.mostrarToast(`Reporte "${filename}" descargado exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        this.mostrarToast('Error al exportar a Excel', 'danger');
        
        // Si falla SheetJS, intentar con método simple
        this.exportToExcelSimple();
    }
},

exportToExcelSimple() {
    try {
        const data = this.currentReportData;
        const tipoReporte = document.querySelector('select[name="tipoReporte"]').value;
        
        const date = new Date();
        const filename = `reporte_${tipoReporte}_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}.csv`;
        
        // Obtener encabezados
        const headers = Object.keys(data[0]);
        
        // Crear contenido CSV
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(row => {
            const rowValues = headers.map(header => {
                let value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'boolean') return value ? 'Sí' : 'No';
                if (typeof value === 'object') return JSON.stringify(value);
                
                // Escapar comillas para CSV
                value = String(value);
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            
            csvContent += rowValues.join(',') + '\n';
        });
        
        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.mostrarToast(`Reporte CSV descargado: ${filename}`, 'success');
        
    } catch (error) {
        console.error('Error en exportación simple:', error);
        this.mostrarToast('No se pudo exportar el reporte', 'danger');
    }
},

generateExcelContent(data, tipoReporte, proyecto, cliente) {
    // Obtener encabezados de la primera fila
    const headers = Object.keys(data[0] || {});
    
    // Crear contenido CSV para Excel
    let csvContent = '';
    
    // Agregar título y metadatos
    const reporteTitles = {
        'tiempos': 'Reporte de Tiempos Registrados',
        'avance': 'Reporte de Avance de Proyectos', 
        'tareas': 'Reporte de Tareas Completadas'
    };
    
    csvContent += `${reporteTitles[tipoReporte] || 'Reporte'}\n\n`;
    csvContent += `Fecha de generación: ${new Date().toLocaleString('es-ES')}\n`;
    if (proyecto !== 'todos') csvContent += `Proyecto: ${proyecto}\n`;
    if (cliente !== 'todos') csvContent += `Cliente: ${cliente}\n`;
    csvContent += `Total registros: ${data.length}\n\n`;
    
    // Agregar encabezados
    csvContent += headers.join('\t') + '\n';
    
    // Agregar datos
    data.forEach(row => {
        const rowValues = headers.map(header => {
            let value = row[header];
            
            // Manejar valores especiales
            if (value === null || value === undefined) return '';
            if (typeof value === 'boolean') return value ? 'Sí' : 'No';
            if (typeof value === 'object') return JSON.stringify(value);
            
            // Escapar comillas y tabuladores para CSV
            value = String(value);
            value = value.replace(/"/g, '""'); // Escapar comillas
            if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            
            return value;
        });
        
        csvContent += rowValues.join('\t') + '\n';
    });
    
    return csvContent;
},

downloadExcelFile(content, filename) {
    // Crear un blob con el contenido
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    
    // Crear un enlace de descarga
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = filename;
    
    // Agregar al documento y hacer clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}
};

// Inicialización automática
if (document.getElementById('reports-content')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.agentReports.initialize();
        }, 500);
    });
}