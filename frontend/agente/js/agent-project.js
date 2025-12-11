// ========== API CALL UTILITY ==========
// Si no existe window.apiCall, créalo
if (!window.apiCall) {
    window.apiCall = async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const apiBaseUrl = 'http://localhost:3001/api'; // Ajusta según tu configuración
        
        const defaultOptions = {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };
        
        console.log(`API Call: ${endpoint}`, mergedOptions.method, mergedOptions.body ? 'with body' : 'no body');
        
        try {
            const response = await fetch(`${apiBaseUrl}${endpoint}`, mergedOptions);
            
            // Primero obtener el texto
            const text = await response.text();
            let data;
            
            try {
                // Intentar parsear como JSON
                data = JSON.parse(text);
            } catch (parseError) {
                console.warn(`Respuesta no JSON de ${endpoint}:`, text.substring(0, 200));
                data = { 
                    success: false, 
                    error: 'Respuesta no válida del servidor',
                    raw: text
                };
            }
            
            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.error || `Error ${response.status}`,
                    data: data
                };
            }
            
            return data;
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };
    
    // También crea métodos cortos
    window.apiCall.get = async (endpoint) => {
        return window.apiCall(endpoint, { method: 'GET' });
    };
    
    window.apiCall.post = async (endpoint, data) => {
        return window.apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    };
    
    window.apiCall.put = async (endpoint, data) => {
        return window.apiCall(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    };
    
    window.apiCall.delete = async (endpoint) => {
        return window.apiCall(endpoint, { method: 'DELETE' });
    };
}

// ========== AGENT PROJECTS MODULE ==========
window.agentProjects = {
    allProjects: [],
    filteredProjects: [],
    categories: [],
    selectedServices: [],
    serviceForms: {},
    isInitialized: false,
    existingClients: [],
    selectedClientId: null,
    clientSearchTimeout: null,
    
    // Definición de campos personalizados por servicio
    serviceCustomFields: {
        // 🕸️ Servicios Web
        'web-basico-anual': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'correo-empresarial', label: 'Correo electrónico empresarial', type: 'email', required: true },
            { id: 'redes-sociales', label: 'Redes sociales a enlazar', type: 'textarea', placeholder: 'Lista de URLs de redes sociales (separadas por comas)' },
            { id: 'google-my-business', label: 'Perfil Google My Business', type: 'checkbox', labelText: '¿Requiere creación/optimización de perfil?' },
            { id: 'logo-existente', label: 'Logo existente (si aplica)', type: 'file', accept: 'image/*' }
        ],
        
        'web-ecommerce': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'correo-empresarial', label: 'Correo electrónico empresarial', type: 'email', required: true },
            { id: 'metodos-pago', label: 'Métodos de pago', type: 'select', options: ['PayPal', 'Stripe', 'Transferencia bancaria', 'Tarjeta de crédito', 'Efectivo'], multiple: true },
            { id: 'numero-productos', label: 'Catálogo inicial / número de productos', type: 'number', min: 1, required: true },
            { id: 'google-my-business', label: 'Perfil Google My Business', type: 'checkbox', labelText: '¿Requiere creación/optimización de perfil?' },
            { id: 'logo-existente', label: 'Logo existente', type: 'file', accept: 'image/*' }
        ],
        
        'renovacion-web': [
            { id: 'dominio', label: 'Dominio', type: 'text', placeholder: 'ej: mitienda.com', required: true },
            { id: 'hosting', label: 'Hosting', type: 'select', options: ['Bluehost', 'HostGator', 'SiteGround', 'GoDaddy', 'Otro'], required: true },
            { id: 'ssl', label: 'Certificado SSL', type: 'checkbox', labelText: '¿Requiere certificado SSL?' },
            { id: 'google-my-business', label: 'Perfil Google My Business', type: 'checkbox', labelText: '¿Requiere actualización de perfil?' }
        ],
        
        'rediseno-web': [
            { id: 'url-actual', label: 'URL actual', type: 'url', placeholder: 'https://www.misitioactual.com', required: true },
            { id: 'cambios-solicitados', label: 'Cambios solicitados', type: 'textarea', required: true },
            { id: 'logo-existente', label: 'Logo existente', type: 'file', accept: 'image/*' }
        ],
        
        'dominio-adicional': [
            { id: 'nombre-dominio', label: 'Nombre de dominio deseado', type: 'text', placeholder: 'ej: minuevodominio.com', required: true }
        ],
        
        // 🎨 Servicios de Diseño
        'logotipo-personalizado': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'colores-preferidos', label: 'Colores preferidos', type: 'color', multiple: true },
            { id: 'estilo-deseado', label: 'Estilo deseado', type: 'select', options: ['Moderno', 'Clásico', 'Minimalista', 'Creativo', 'Elegante', 'Divertido'] },
            { id: 'manual-marca', label: '¿Requiere mini manual de marca?', type: 'checkbox' },
            { id: 'tipografia', label: 'Tipografía preferida', type: 'text', placeholder: 'ej: Arial, Roboto, Open Sans' },
            { id: 'paleta-colores', label: 'Paleta de colores específica', type: 'textarea', placeholder: 'Colores específicos en formato HEX o RGB' }
        ],
        
        'tarjetas-presentacion': [
            { id: 'nombre-completo', label: 'Nombre completo', type: 'text', required: true },
            { id: 'cargo', label: 'Cargo', type: 'text', required: true },
            { id: 'telefono', label: 'Teléfono', type: 'tel', required: true },
            { id: 'correo', label: 'Correo electrónico', type: 'email', required: true },
            { id: 'logo-existente', label: 'Logo para incluir', type: 'file', accept: 'image/*' }
        ],
        
        'papeleria': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'datos-fiscales', label: 'Datos fiscales', type: 'textarea', required: true },
            { id: 'direccion', label: 'Dirección', type: 'text', required: true },
            { id: 'logo-existente', label: 'Logo para incluir', type: 'file', accept: 'image/*' }
        ],
        
        'diseno-banners': [
            { id: 'texto-banner', label: 'Texto del banner', type: 'textarea', required: true },
            { id: 'imagenes-incluir', label: 'Imágenes a incluir', type: 'textarea', placeholder: 'Descripción o URLs de imágenes' },
            { id: 'colores-preferidos', label: 'Colores preferidos', type: 'color', multiple: true },
            { id: 'dimensiones', label: 'Dimensiones requeridas', type: 'text', placeholder: 'ej: 1200x400px' }
        ],
        
        'servicio-impresion': [
            { id: 'tipo-material', label: 'Tipo de material', type: 'select', options: ['Vinil', 'Papel Fotográfico', 'Lona', 'Acrílico', 'PVC', 'Otro'] },
            { id: 'cantidad', label: 'Cantidad', type: 'number', min: 1, required: true },
            { id: 'dimensiones', label: 'Dimensiones', type: 'text', placeholder: 'ej: 50x70cm', required: true }
        ],
        
        // 🎥 Servicios de Video
        'video-basico': [
            { id: 'imagenes-usar', label: 'Imágenes a usar', type: 'textarea', placeholder: 'Descripción o URLs de imágenes', required: true },
            { id: 'musica-fondo', label: 'Música de fondo preferida', type: 'text', placeholder: 'Género o canción específica' }
        ],
        
        'video-espanol': [
            { id: 'guion-espanol', label: 'Guion en español', type: 'textarea', required: true },
            { id: 'subtitulos-ingles', label: 'Subtítulos en inglés', type: 'checkbox', labelText: '¿Requiere subtítulos en inglés?' },
            { id: 'voz', label: 'Tipo de voz', type: 'select', options: ['Masculina', 'Femenina', 'Neutral'] }
        ],
        
        'video-ingles': [
            { id: 'guion-ingles', label: 'Guion en inglés', type: 'textarea', required: true },
            { id: 'subtitulos-espanol', label: 'Subtítulos en español', type: 'checkbox', labelText: '¿Requiere subtítulos en español?' },
            { id: 'voz', label: 'Tipo de voz', type: 'select', options: ['Masculina', 'Femenina', 'Neutral'] }
        ],
        
        'video-modelo': [
            { id: 'idioma-narracion', label: 'Idioma de narración', type: 'select', options: ['Español', 'Inglés', 'Bilingüe'], required: true },
            { id: 'guion', label: 'Guion', type: 'textarea', required: true },
            { id: 'subtitulos', label: 'Subtítulos adicionales', type: 'text', placeholder: 'Idiomas para subtítulos (opcional)' },
            { id: 'duracion', label: 'Duración estimada', type: 'text', placeholder: 'ej: 2-3 minutos' }
        ],
        
        // 📑 Servicios de Inscripciones
        'inscripcion-directorios': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'direccion', label: 'Dirección', type: 'text', required: true },
            { id: 'telefono', label: 'Teléfono', type: 'tel', required: true },
            { id: 'correo', label: 'Correo electrónico', type: 'email', required: true },
            { id: 'descripcion', label: 'Descripción del negocio', type: 'textarea', required: true }
        ],
        
        'ficha-google': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'direccion', label: 'Dirección', type: 'text', required: true },
            { id: 'telefono', label: 'Teléfono', type: 'tel', required: true },
            { id: 'categoria', label: 'Categoría del negocio', type: 'text', required: true }
        ],
        
        'yelp-basico': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'direccion', label: 'Dirección', type: 'text', required: true },
            { id: 'telefono', label: 'Teléfono', type: 'tel', required: true },
            { id: 'correo', label: 'Correo electrónico', type: 'email', required: true }
        ],
        
        'yelp-ads': [
            { id: 'objetivo-campana', label: 'Objetivo de campaña', type: 'select', options: ['Visibilidad', 'Conversiones', 'Tráfico', 'Reconocimiento'], required: true },
            { id: 'presupuesto-mensual', label: 'Presupuesto mensual', type: 'number', min: 50, required: true }
        ],
        
        // 📈 Servicios de Publicidad
        'google-ads': [
            { id: 'objetivo-campana', label: 'Objetivo de campaña', type: 'select', options: ['Conversiones', 'Tráfico web', 'Visitas tienda', 'Llamadas'], required: true },
            { id: 'presupuesto-mensual', label: 'Presupuesto mensual', type: 'number', min: 100, required: true },
            { id: 'duracion-campana', label: 'Duración de campaña', type: 'select', options: ['1 mes', '3 meses', '6 meses', '1 año'] }
        ],
        
        'marketing-redes': [
            { id: 'red-social', label: 'Nombre de la red social', type: 'select', options: ['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'Pinterest'], required: true },
            { id: 'frecuencia', label: 'Frecuencia de publicaciones', type: 'select', options: ['Diario', '3 veces/semana', 'Semanal', '2 veces/semana'] },
            { id: 'tipo-contenido', label: 'Tipo de contenido', type: 'select', options: ['Imágenes', 'Videos', 'Mixto', 'Textos'] }
        ],
        
        'manejo-2-redes': [
            { id: 'redes', label: 'Nombre de ambas redes', type: 'text', placeholder: 'ej: Facebook + Instagram', required: true },
            { id: 'frecuencia', label: 'Frecuencia de publicaciones', type: 'select', options: ['Diario', '3 veces/semana', 'Semanal'] },
            { id: 'tipo-contenido', label: 'Tipo de contenido', type: 'select', options: ['Imágenes', 'Videos', 'Mixto'] }
        ],
        
        'facebook-ads': [
            { id: 'objetivo-campana', label: 'Objetivo de campaña', type: 'select', options: ['Alcance', 'Interacciones', 'Conversiones', 'Tráfico'], required: true },
            { id: 'presupuesto-mensual', label: 'Presupuesto mensual', type: 'number', min: 50, required: true },
            { id: 'segmentacion', label: 'Segmentación deseada', type: 'textarea', placeholder: 'ej: Mujeres 25-40, interesadas en moda' }
        ],
        
        'tiktok': [
            { id: 'nombre-cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
            { id: 'tipo-contenido', label: 'Tipo de contenido', type: 'select', options: ['Educativo', 'Entretenimiento', 'Promocional', 'Mixto'] },
            { id: 'frecuencia', label: 'Frecuencia de publicaciones', type: 'select', options: ['Diario', '3-4/semana', 'Semanal'] }
        ],
        
        // 📱 Creaciones de Redes
        'creacion-redes': [
            { id: 'nombre-negocio', label: 'Nombre del negocio', type: 'text', required: true },
            { id: 'red-social', label: 'Red social a crear', type: 'select', options: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'], required: true },
            { id: 'usuario-deseado', label: 'Usuario deseado', type: 'text', placeholder: '@tuusuario' }
        ],
        
        'creacion-youtube': [
            { id: 'nombre-canal', label: 'Nombre del canal', type: 'text', required: true },
            { id: 'categoria', label: 'Categoría del contenido', type: 'select', options: ['Educación', 'Entretenimiento', 'Tecnología', 'Negocios', 'Estilo de vida'] },
            { id: 'correo-contacto', label: 'Correo de contacto', type: 'email', required: true }
        ],
        
        // 🔖 Extras
        'qr-estatico': [
            { id: 'contenido-qr', label: 'Texto o URL a codificar', type: 'textarea', required: true },
            { id: 'tamano', label: 'Tamaño del QR', type: 'select', options: ['Pequeño (100x100)', 'Mediano (200x200)', 'Grande (300x300)'] },
            { id: 'color', label: 'Color preferido', type: 'color' }
        ]
    },
    
    // ========== FUNCIONES PARA AUTCOMPLETADO DE CLIENTES ==========
    async loadExistingClients() {
    console.log('Cargando clientes existentes...');
    
    try {
        // PRIMERO: Verificar si la API está accesible
        console.log('Intentando acceder a /api/agent/existing-clients');
        
        const response = await window.apiCall('/agent/existing-clients');
        
        if (response && response.success) {
            this.existingClients = response.data || [];
            console.log(`${this.existingClients.length} clientes cargados exitosamente`);
            console.log('Ejemplo de cliente:', this.existingClients[0]);
        } else {
            console.warn('Respuesta no exitosa:', response);
            this.existingClients = [];
            
            // Intentar ruta alternativa
            console.log('Intentando ruta alternativa /agent/clients...');
            try {
                const altResponse = await window.apiCall('/agent/clients');
                if (altResponse && altResponse.success) {
                    this.existingClients = altResponse.data || [];
                    console.log(`${this.existingClients.length} clientes cargados desde ruta alternativa`);
                }
            } catch (altError) {
                console.warn('Ruta alternativa también falló:', altError);
            }
        }
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        console.error('Detalles del error:', error.message);
        
        // Usar datos de prueba como fallback
        this.existingClients = [
            { id: 1, empresa: "Empresa de Prueba", contacto: "Juan Pérez", email: "juan@test.com", telefono: "1234-5678" },
            { id: 2, empresa: "Otra Empresa", contacto: "María García", email: "maria@test.com", telefono: "8765-4321" }
        ];
        
        console.log('Usando datos de prueba:', this.existingClients.length, 'clientes');
    }
},
    
    setupClientAutocomplete() {
        const clientInput = document.getElementById('client-name');
        if (!clientInput) {
            console.error('Campo de cliente no encontrado');
            return;
        }
        
        // Crear contenedor para sugerencias
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'client-autocomplete-suggestions';
        suggestionsContainer.className = 'client-suggestions hidden absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1';
        
        // Estilo para el contenedor padre
        const parentContainer = clientInput.parentElement;
        if (parentContainer) {
            parentContainer.style.position = 'relative';
            parentContainer.appendChild(suggestionsContainer);
        } else {
            // Fallback: insertar después del input
            clientInput.parentNode.insertBefore(suggestionsContainer, clientInput.nextSibling);
        }
        
        // Variables de estado
        let activeSuggestionIndex = -1;
        let suggestionsList = [];
        
        // Función para buscar clientes
        const searchClients = async (searchTerm) => {
            if (searchTerm.length < 2) {
                return [];
            }
            
            try {
                // Intentar búsqueda en servidor
                const response = await window.apiCall(`/agent/search-clients?q=${encodeURIComponent(searchTerm)}`);
                if (response && response.success) {
                    return response.data || [];
                }
                
                // Fallback a búsqueda local
                return this.searchClientsLocal(searchTerm);
                
            } catch (error) {
                console.error('Error en búsqueda de clientes:', error);
                return this.searchClientsLocal(searchTerm);
            }
        };
        
        // Búsqueda local como fallback
        this.searchClientsLocal = (searchTerm) => {
            const term = searchTerm.toLowerCase();
            return this.existingClients.filter(client => {
                const searchText = `
                    ${client.empresa || ''} 
                    ${client.contacto || ''} 
                    ${client.email || ''} 
                    ${client.telefono || ''}
                `.toLowerCase();
                
                return searchText.includes(term);
            });
        };
        
        // Mostrar sugerencias
        const showSuggestions = async () => {
            const searchTerm = clientInput.value.trim();
            
            if (searchTerm.length < 2) {
                this.hideSuggestions();
                suggestionsList = [];
                return;
            }
            
            // Limpiar timeout anterior
            if (this.clientSearchTimeout) {
                clearTimeout(this.clientSearchTimeout);
            }
            
            // Usar debounce para evitar muchas solicitudes
            this.clientSearchTimeout = setTimeout(async () => {
                suggestionsList = await searchClients(searchTerm);
                
                if (suggestionsList.length === 0) {
                    this.hideSuggestions();
                    return;
                }
                
                this.renderSuggestions(suggestionsList, suggestionsContainer);
                
            }, 300); // 300ms debounce
        };
        
        // Event listeners
        clientInput.addEventListener('input', (e) => {
            // Si el usuario está borrando, limpiar selección
            if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
                this.clearClientSelection();
            }
            
            // Si hay texto, mostrar sugerencias
            if (clientInput.value.trim().length > 0) {
                this.clearClientSelection();
                showSuggestions();
                activeSuggestionIndex = -1;
            } else {
                this.hideSuggestions();
            }
        });
        
        clientInput.addEventListener('focus', () => {
            if (clientInput.value.trim().length >= 2) {
                showSuggestions();
            }
        });
        
        // Navegación con teclado - CORREGIDA PARA ENTER
        clientInput.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (suggestions.length > 0) {
                        activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
                        this.highlightSuggestion(activeSuggestionIndex, suggestionsContainer);
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (suggestions.length > 0) {
                        activeSuggestionIndex = activeSuggestionIndex <= 0 ? suggestions.length - 1 : activeSuggestionIndex - 1;
                        this.highlightSuggestion(activeSuggestionIndex, suggestionsContainer);
                    }
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    console.log('Enter presionado. activeSuggestionIndex:', activeSuggestionIndex);
                    console.log('suggestionsList:', suggestionsList);
                    
                    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestionsList.length) {
                        // Seleccionar sugerencia resaltada
                        console.log('Seleccionando sugerencia resaltada:', suggestionsList[activeSuggestionIndex]);
                        this.selectClient(suggestionsList[activeSuggestionIndex]);
                    } else if (suggestionsList.length === 1) {
                        // Si solo hay una sugerencia, seleccionarla
                        console.log('Seleccionando única sugerencia:', suggestionsList[0]);
                        this.selectClient(suggestionsList[0]);
                    } else if (suggestionsList.length > 0 && clientInput.value.trim()) {
                        // Si hay sugerencias pero ninguna está seleccionada, seleccionar la primera
                        console.log('Seleccionando primera sugerencia:', suggestionsList[0]);
                        this.selectClient(suggestionsList[0]);
                    } else {
                        // Si no hay sugerencias, tratar como cliente nuevo
                        console.log('Tratando como cliente nuevo:', clientInput.value);
                        this.handleNewClient(clientInput.value.trim());
                    }
                    break;
                    
                case 'Escape':
                    this.hideSuggestions();
                    break;
                    
                case 'Backspace':
                    // Permitir backspace normal
                    if (clientInput.value.length === 0) {
                        this.clearClientSelection();
                    }
                    break;
                    
                case 'Tab':
                    // Permitir tab normal
                    this.hideSuggestions();
                    break;
                    
                case 'Delete':
                    // Permitir delete normal
                    if (clientInput.value.length === 0) {
                        this.clearClientSelection();
                    }
                    break;
            }
        });
        
        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!clientInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
        
        // Permitir limpiar con click derecho o doble click
        clientInput.addEventListener('contextmenu', () => {
            // Permitir menú contextual
            return true;
        });
        
        clientInput.addEventListener('dblclick', () => {
            // Permitir selección de texto
            return true;
        });
        
        // Agregar botón para limpiar
        this.addClearButtonToClientField();
    },
    
    renderSuggestions(clients, container) {
        container.innerHTML = '';
        
        clients.forEach((client, index) => {
            const suggestionItem = this.createSuggestionItem(client, index);
            container.appendChild(suggestionItem);
        });
        
        container.classList.remove('hidden');
        
        // Ajustar posición si es necesario
        this.positionSuggestions();
    },
    
    createSuggestionItem(client, index) {
        const div = document.createElement('div');
        div.className = 'suggestion-item px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150';
        div.dataset.index = index;
        div.dataset.clientId = client.id;
        
        // Determinar texto principal y secundario
        const displayName = client.empresa || client.contacto || 'Cliente sin nombre';
        const contactInfo = client.contacto ? `Contacto: ${client.contacto}` : '';
        const emailInfo = client.email ? `Email: ${client.email}` : '';
        const phoneInfo = client.telefono ? `Tel: ${client.telefono}` : '';
        
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="font-semibold text-gray-800 text-sm">${this.escapeHtml(displayName)}</div>
                    ${contactInfo ? `<div class="text-xs text-gray-600 mt-1">${this.escapeHtml(contactInfo)}</div>` : ''}
                    ${emailInfo ? `<div class="text-xs text-gray-500">${this.escapeHtml(emailInfo)}</div>` : ''}
                    ${phoneInfo ? `<div class="text-xs text-gray-500">${this.escapeHtml(phoneInfo)}</div>` : ''}
                </div>
                <div class="ml-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ${client.tipo || 'Cliente'}
                    </span>
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => {
            this.selectClient(client);
        });
        
        div.addEventListener('mouseenter', () => {
            this.highlightSuggestion(index);
        });
        
        return div;
    },
    
    highlightSuggestion(index) {
        const container = document.getElementById('client-autocomplete-suggestions');
        if (!container) return;
        
        const suggestions = container.querySelectorAll('.suggestion-item');
        suggestions.forEach((suggestion, i) => {
            if (i === index) {
                suggestion.classList.add('bg-orange-100', 'border-orange-200');
            } else {
                suggestion.classList.remove('bg-orange-100', 'border-orange-200');
            }
        });
        
        // Scroll a la sugerencia seleccionada
        if (suggestions[index]) {
            suggestions[index].scrollIntoView({ block: 'nearest' });
        }
    },
    
    selectClient(client) {
        const clientInput = document.getElementById('client-name');
        if (!clientInput) return;
        
        // Guardar datos del cliente
        this.selectedClientId = client.id;
        
        // Almacenar datos adicionales en campos ocultos o dataset
        clientInput.dataset.clientId = client.id;
        clientInput.dataset.clientEmail = client.email || '';
        clientInput.dataset.clientPhone = client.telefono || '';
        clientInput.dataset.clientEmpresa = client.empresa || '';
        
        // Mostrar información principal - solo el nombre
        const displayText = client.empresa || client.contacto || 'Cliente';
        clientInput.value = displayText;
        
        // Marcar como seleccionado
        clientInput.classList.add('client-selected');
        
        // Rellenar automáticamente otros campos si están vacíos
        this.autoFillClientInfo(client);
        
        // Ocultar sugerencias
        this.hideSuggestions();
        
        // Mostrar indicador de cliente existente
        this.showClientIndicator(client);
        
        console.log('Cliente seleccionado:', client);
    },
    
    autoFillClientInfo(client) {
        // Rellenar empresa si está vacío
        const companyField = document.getElementById('company-name');
        if (companyField && !companyField.value && client.empresa) {
            companyField.value = client.empresa;
        }
        
        // Rellenar email si está vacío
        const emailField = document.getElementById('email');
        if (emailField && !emailField.value && client.email) {
            emailField.value = client.email;
        }
        
        // Rellenar teléfono si está vacío
        const phoneField = document.getElementById('phone');
        if (phoneField && !phoneField.value && client.telefono) {
            phoneField.value = client.telefono;
        }
    },
    
    handleNewClient(clientName) {
        console.log('Creando nuevo cliente:', clientName);
        
        // Limpiar datos de cliente existente
        this.clearClientSelection();
        
        // Establecer el nombre del cliente
        const clientInput = document.getElementById('client-name');
        if (clientInput) {
            // Mantener solo el nombre, sin HTML
            clientInput.value = clientName;
        }
        
        // Ocultar sugerencias
        this.hideSuggestions();
        
        // Limpiar los campos de email y teléfono si estaban prellenados
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.value = '';
            emailField.placeholder = 'cliente@empresa.com';
        }
        
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.value = '';
            phoneField.placeholder = '1234-5678';
        }
        
        // También limpiar empresa si estaba prellenada
        const companyField = document.getElementById('company-name');
        if (companyField && companyField.value === clientName) {
            companyField.value = '';
            companyField.placeholder = 'Personal';
        }
        
        console.log('Nuevo cliente configurado:', clientName);
    },
    
    clearClientSelection() {
        const clientInput = document.getElementById('client-name');
        if (clientInput) {
            // Solo limpiar los datos, no el valor visible
            delete clientInput.dataset.clientId;
            delete clientInput.dataset.clientEmail;
            delete clientInput.dataset.clientPhone;
            delete clientInput.dataset.clientEmpresa;
            
            // Asegurarse de que el campo no tenga atributo readonly
            clientInput.readOnly = false;
            
            // Remover cualquier estilo de cliente existente
            clientInput.classList.remove('client-selected');
        }
        this.selectedClientId = null;
        
        // Remover indicador de cliente existente
        this.removeClientIndicator();
    },
    
    showClientIndicator(client) {
        // Remover indicador anterior
        this.removeClientIndicator();
        
        const clientInput = document.getElementById('client-name');
        if (!clientInput) return;
        
        // Crear indicador
        const indicator = document.createElement('div');
        indicator.className = 'client-indicator absolute right-3 top-1/2 transform -translate-y-1/2';
        indicator.innerHTML = `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                <i class="fas fa-check-circle mr-1"></i>Cliente existente
            </span>
        `;
        
        // Insertar después del input
        clientInput.parentNode.insertBefore(indicator, clientInput.nextSibling);
        
        // Añadir padding al input para el indicador
        clientInput.style.paddingRight = '100px';
    },
    
    removeClientIndicator() {
        const indicator = document.querySelector('.client-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        const clientInput = document.getElementById('client-name');
        if (clientInput) {
            clientInput.style.paddingRight = '';
        }
    },
    
    hideSuggestions() {
        const container = document.getElementById('client-autocomplete-suggestions');
        if (container) {
            container.classList.add('hidden');
        }
    },
    
    positionSuggestions() {
        const container = document.getElementById('client-autocomplete-suggestions');
        const clientInput = document.getElementById('client-name');
        
        if (!container || !clientInput) return;
        
        // Posicionar debajo del input
        const rect = clientInput.getBoundingClientRect();
        container.style.width = clientInput.offsetWidth + 'px';
        container.style.top = (rect.height + 4) + 'px'; // 4px de margen
        container.style.left = '0';
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // ========== FUNCIONES EXISTENTES ==========
    
    async loadMyProjects() {
        console.log('agentProjects: Cargando proyectos...');
        try {
            const response = await window.apiCall('/agent/projects');
            if (response && response.success) {
                console.log('agentProjects: Proyectos cargados:', response.data);
                this.updateProjectsTable(response.data);
            } else {
                console.error('agentProjects: Respuesta no exitosa:', response);
                this.showError('No se pudieron cargar los proyectos');
            }
        } catch (error) {
            console.error('agentProjects: Error al cargar proyectos:', error);
            this.showError('Error al cargar proyectos');
        }
    },
    
    updateProjectsTable(projects) {
        const tableBody = document.getElementById('projectsTableBody');
        if (!tableBody) {
            console.error('agentProjects: No se encontró projectsTableBody');
            return;
        }
        
        this.allProjects = projects || [];
        this.filteredProjects = [...this.allProjects];
        
        console.log('agentProjects: Total proyectos cargados:', this.allProjects.length);
        
        if (!this.allProjects || this.allProjects.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No tienes proyectos registrados. Solicita el primero haciendo clic en "Crear Proyecto".
                    </td>
                </tr>
            `;
            return;
        }
        
        this.renderProjectsTable();
    },
    
    renderProjectsTable() {
        const tableBody = document.getElementById('projectsTableBody');
        if (!tableBody || !this.filteredProjects) return;
        
        console.log('agentProjects: Renderizando', this.filteredProjects.length, 'proyectos');
        
        if (this.filteredProjects.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No se encontraron proyectos que coincidan con los filtros.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        this.filteredProjects.forEach(project => {
            const estado = project.estado || 'pendiente';
            const prioridad = project.prioridad || 'media';
            
            const estadoClass = estado === 'completado' ? 'completado' :
                              estado === 'en-proceso' ? 'en-proceso' : 
                              estado === 'solicitado' ? 'solicitado' :
                              estado === 'cancelado' ? 'cancelado' : 'pendiente';
            
            const estadoText = {
                'solicitado': 'Solicitado',
                'pendiente': 'Pendiente',
                'en-proceso': 'En proceso',
                'completado': 'Completado',
                'cancelado': 'Cancelado'
            }[estado] || estado;
            
            const prioridadText = {
                'baja': 'Baja',
                'media': 'Media', 
                'alta': 'Alta'
            }[prioridad] || prioridad;
            
            html += `
                <tr>
                    <td>${project.nombre || 'Sin nombre'}</td>
                    <td>${project.empresa || project.company_name || 'Sin empresa'}</td>
                    <td>${project.cliente || project.client_name || 'Sin cliente'}</td>
                    <td><span class="status-badge ${estadoClass}">${estadoText}</span></td>
                    <td><span class="priority-badge ${prioridad}">${prioridadText}</span></td>
                    <td class="actions">
                        <button onclick="agentProjects.viewProject(${project.id})" class="btn btn-info btn-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="agentProjects.updateProgress(${project.id})" class="btn btn-warning btn-sm">
                            <i class="fas fa-chart-line"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },
    
    setupFilters() {
        console.log('agentProjects: Configurando filtros...');
        
        const filtroEstado = document.getElementById('filtroEstadoProyecto');
        const filtroPrioridad = document.getElementById('filtroPrioridadProyecto');
        const buscarInput = document.getElementById('buscarProyecto');
        
        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => {
                console.log('Filtro estado cambiado:', filtroEstado.value);
                this.applyFilters();
            });
        }
        
        if (filtroPrioridad) {
            filtroPrioridad.addEventListener('change', () => {
                console.log('Filtro prioridad cambiado:', filtroPrioridad.value);
                this.applyFilters();
            });
        }
        
        if (buscarInput) {
            buscarInput.addEventListener('input', (e) => {
                console.log('Buscando:', e.target.value);
                this.applyFilters();
            });
        }
        
        console.log('agentProjects: Filtros configurados');
    },
    
    applyFilters() {
        console.log('agentProjects: Aplicando filtros...');
        
        if (!this.allProjects || this.allProjects.length === 0) {
            console.log('No hay proyectos para filtrar');
            return;
        }
        
        const estado = document.getElementById('filtroEstadoProyecto')?.value;
        const prioridad = document.getElementById('filtroPrioridadProyecto')?.value;
        const buscar = document.getElementById('buscarProyecto')?.value.toLowerCase() || '';
        
        console.log('Filtros activos:', { estado, prioridad, buscar });
        
        this.filteredProjects = this.allProjects.filter(project => {
            // Filtrar por estado
            if (estado && estado !== 'todos') {
                if (project.estado !== estado) {
                    return false;
                }
            }
            
            // Filtrar por prioridad
            if (prioridad && prioridad !== 'todos') {
                if (project.prioridad !== prioridad) {
                    return false;
                }
            }
            
            // Filtrar por texto de búsqueda
            if (buscar) {
                const searchFields = [
                    project.nombre,
                    project.empresa,
                    project.company_name,
                    project.cliente,
                    project.client_name,
                    project.descripcion
                ];
                
                const hasMatch = searchFields.some(field => 
                    field && field.toString().toLowerCase().includes(buscar)
                );
                
                if (!hasMatch) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log('Proyectos después de filtrar:', this.filteredProjects.length);
        this.renderProjectsTable();
    },
    
    async loadCategoriesAndServices() {
        console.log('agentProjects: Cargando categorías y servicios...');
        
        try {
            const response = await window.apiCall('/agent/categories-with-services');
            console.log('Respuesta de API (stored procedure):', response);
            
            if (response && response.success) {
                console.log(`Categorías cargadas: ${response.data.length}`);
                console.log(`Fuente de datos: ${response.source || 'unknown'}`);
                
                this.categories = response.data;
                this.populateCategoriesDropdown();
            } else {
                console.warn('Primera ruta falló, intentando ruta alternativa...');
                const fallbackResponse = await window.apiCall('/agent/categories-with-services-direct');
                console.log('Respuesta de API (consulta directa):', fallbackResponse);
                
                if (fallbackResponse && fallbackResponse.success) {
                    console.log(`Categorías cargadas (fallback): ${fallbackResponse.data.length}`);
                    this.categories = fallbackResponse.data;
                    this.populateCategoriesDropdown();
                } else {
                    console.error('Ambas rutas fallaron:', fallbackResponse);
                    this.showError('No se pudieron cargar las categorías');
                }
            }
            
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            
            try {
                console.log('Intentando ruta alternativa después de error...');
                const fallbackResponse = await window.apiCall('/agent/categories-with-services-direct');
                
                if (fallbackResponse && fallbackResponse.success) {
                    this.categories = fallbackResponse.data;
                    this.populateCategoriesDropdown();
                    console.log('Datos cargados mediante ruta alternativa');
                } else {
                    throw new Error('Ruta alternativa también falló');
                }
            } catch (fallbackError) {
                console.error('Error en ruta alternativa:', fallbackError);
                this.showError('Error al cargar categorías. Intente recargar la página.');
            }
        }
    }, 

    populateCategoriesDropdown() {
        const categorySelect = document.getElementById('service-category');
        const serviceSelect = document.getElementById('service-select');
        
        if (!categorySelect || !serviceSelect) {
            console.error('Selects de categorías o servicios no encontrados');
            return;
        }
        
        // Limpiar opciones
        categorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
        serviceSelect.innerHTML = '<option value="">Seleccione una categoría primero</option>';
        serviceSelect.disabled = true;
        
        if (!this.categories || this.categories.length === 0) {
            categorySelect.innerHTML += '<option value="">No hay categorías disponibles</option>';
            return;
        }
        
        // Agregar categorías
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.nombre;
            categorySelect.appendChild(option);
        });
        
        console.log(`Dropdown de categorías poblado con ${this.categories.length} categorías`);
        
        // Configurar evento para cambiar categoría
        categorySelect.addEventListener('change', (e) => {
            const categoryId = parseInt(e.target.value);
            this.populateServicesDropdown(categoryId);
        });
    },
    
    populateServicesDropdown(categoryId) {
        const serviceSelect = document.getElementById('service-select');
        
        if (!serviceSelect) return;
        
        // Limpiar opciones
        serviceSelect.innerHTML = '<option value="">Seleccione un servicio</option>';
        
        if (!categoryId) {
            serviceSelect.disabled = true;
            return;
        }
        
        // Encontrar la categoría seleccionada
        const selectedCategory = this.categories.find(cat => cat.id === categoryId);
        
        if (!selectedCategory || !selectedCategory.servicios || selectedCategory.servicios.length === 0) {
            serviceSelect.innerHTML += '<option value="">No hay servicios en esta categoría</option>';
            serviceSelect.disabled = false;
            return;
        }
        
        // Habilitar y poblar servicios
        serviceSelect.disabled = false;
        
        selectedCategory.servicios.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            
            // Usar PrecioBase o precioBase
            const precio = service.PrecioBase || service.precioBase || 0;
            const nombre = service.nombre || service.Nombre || '';
            const descripcion = service.Descripcion || service.descripcion || '';
            
            option.textContent = `${nombre} - $${precio}`;
            
            // Almacenar atributos importantes
            option.setAttribute('data-precio', precio);
            option.setAttribute('data-nombre', nombre);
            option.setAttribute('data-descripcion', descripcion);
            
            // Identificador único para campos personalizados (usando nombre normalizado)
            const serviceKey = this.normalizeServiceName(nombre);
            option.setAttribute('data-service-key', serviceKey);
            
            serviceSelect.appendChild(option);
        });
        
        console.log(`Dropdown de servicios poblado con ${selectedCategory.servicios.length} servicios`);
        
        // Habilitar botón de agregar servicio
        const btnAgregar = document.getElementById('btn-agregar-servicio');
        if (btnAgregar) {
            btnAgregar.disabled = false;
        }
        
        // Configurar evento para seleccionar servicio
        serviceSelect.addEventListener('change', () => {
            this.updateTotal();
        });
    },
    
    // Normaliza el nombre del servicio para usar como clave
    normalizeServiceName(serviceName) {
        return serviceName
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Elimina acentos
            .replace(/[^a-z0-9\s]/g, '') // Elimina caracteres especiales
            .replace(/\s+/g, '-') // Reemplaza espacios con guiones
            .replace(/-+/g, '-') // Elimina guiones múltiples
            .replace(/^-|-$/g, ''); // Elimina guiones al inicio/final
    },
    
    setupServiceButtons() {
        const btnAgregar = document.getElementById('btn-agregar-servicio');
        if (btnAgregar) {
            btnAgregar.addEventListener('click', () => {
                this.agregarServicio();
            });
        }
    },
    
    agregarServicio() {
        const serviceSelect = document.getElementById('service-select');
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            alert('Por favor, seleccione un servicio');
            return;
        }
        
        const servicioId = parseInt(selectedOption.value);
        const servicioNombre = selectedOption.text.split(' - $')[0];
        const serviceKey = selectedOption.getAttribute('data-service-key');
        
        let servicioPrecio = parseFloat(selectedOption.getAttribute('data-precio')) || 0;
        
        if (servicioPrecio === 0) {
            const match = selectedOption.text.match(/\$(\d+(\.\d+)?)/);
            if (match) {
                servicioPrecio = parseFloat(match[1]);
            }
        }
        
        console.log('Agregando servicio:', {
            id: servicioId,
            nombre: servicioNombre,
            precio: servicioPrecio,
            key: serviceKey
        });
        
        // Agregar al array de servicios seleccionados
        this.selectedServices.push({
            id: servicioId,
            nombre: servicioNombre,
            precio: servicioPrecio,
            key: serviceKey,
            customFields: {} // Inicializar campos personalizados vacíos
        });
        
        // Inicializar formulario personalizado si existe
        if (this.serviceCustomFields[serviceKey]) {
            this.initializeServiceForm(serviceKey, this.selectedServices.length - 1);
        }
        
        // Actualizar UI
        this.updateServiciosList();
        this.updateTotal();
        
        // Resetear selección
        serviceSelect.selectedIndex = 0;
    },
    
    // Inicializa el formulario personalizado para un servicio
    initializeServiceForm(serviceKey, serviceIndex) {
        const customFields = this.serviceCustomFields[serviceKey];
        if (!customFields) return;
        
        // Crear contenedor para el formulario
        const serviceFormContainer = document.createElement('div');
        serviceFormContainer.className = 'service-custom-form mb-4 p-4 border rounded-lg bg-gray-50';
        serviceFormContainer.id = `service-form-${serviceIndex}`;
        
        let formHTML = `
            <h4 class="font-bold text-lg mb-3 text-gray-700">Configuración: ${this.selectedServices[serviceIndex].nombre}</h4>
            <div class="space-y-3">
        `;
        
        customFields.forEach(field => {
            const fieldId = `service-${serviceIndex}-${field.id}`;
            const fieldLabel = `<label class="block text-sm font-medium text-gray-700 mb-1">${field.label}${field.required ? ' *' : ''}</label>`;
            
            let fieldInput = '';
            
            switch(field.type) {
                case 'textarea':
                    fieldInput = `<textarea id="${fieldId}" 
                        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}
                        rows="3"></textarea>`;
                    break;
                    
                case 'select':
                    const options = field.options.map(opt => 
                        `<option value="${opt}">${opt}</option>`
                    ).join('');
                    fieldInput = `<select id="${fieldId}" 
                        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        ${field.required ? 'required' : ''}
                        ${field.multiple ? 'multiple' : ''}>
                        <option value="">Seleccione...</option>
                        ${options}
                    </select>`;
                    break;
                    
                case 'checkbox':
                    fieldInput = `<div class="flex items-center">
                        <input type="checkbox" id="${fieldId}" 
                            class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded">
                        <label for="${fieldId}" class="ml-2 text-gray-700">${field.labelText || field.label}</label>
                    </div>`;
                    break;
                    
                case 'file':
                    fieldInput = `<input type="file" id="${fieldId}" 
                        class="w-full px-3 py-2 border rounded-md"
                        accept="${field.accept || '*'}"
                        ${field.required ? 'required' : ''}>`;
                    break;
                    
                case 'color':
                    if (field.multiple) {
                        fieldInput = `<div class="flex space-x-2" id="${fieldId}-container">
                            <input type="color" 
                                class="w-12 h-12 border rounded"
                                onchange="agentProjects.addColor('${fieldId}', this.value)">
                            <div id="${fieldId}-colors" class="flex flex-wrap gap-2"></div>
                        </div>`;
                    } else {
                        fieldInput = `<input type="color" id="${fieldId}" 
                            class="w-12 h-12 border rounded">`;
                    }
                    break;
                    
                default: // text, email, tel, url, number
                    fieldInput = `<input type="${field.type}" id="${fieldId}" 
                        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}
                        ${field.min ? `min="${field.min}"` : ''}
                        ${field.max ? `max="${field.max}"` : ''}>`;
            }
            
            formHTML += `<div class="form-field">${fieldLabel}${fieldInput}</div>`;
        });
        
        formHTML += `
            </div>
            <div class="mt-4">
                <button type="button" onclick="agentProjects.saveServiceForm(${serviceIndex})" 
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                    <i class="fas fa-save mr-2"></i>Guardar Configuración
                </button>
                <button type="button" onclick="agentProjects.cancelServiceForm(${serviceIndex})" 
                    class="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
                    Cancelar
                </button>
            </div>
        `;
        
        serviceFormContainer.innerHTML = formHTML;
        
        // Agregar al DOM
        const serviciosContainer = document.getElementById('servicios-personalizados-container');
        if (serviciosContainer) {
            // Insertar después del elemento del servicio
            const serviceItems = serviciosContainer.children;
            if (serviceItems.length > serviceIndex) {
                serviciosContainer.insertBefore(serviceFormContainer, serviceItems[serviceIndex].nextSibling);
            } else {
                serviciosContainer.appendChild(serviceFormContainer);
            }
        }
        
        // Configurar eventos para campos dinámicos
        this.setupFormFieldEvents(serviceIndex, customFields);
    },
    
    setupFormFieldEvents(serviceIndex, fields) {
        fields.forEach(field => {
            const fieldId = `service-${serviceIndex}-${field.id}`;
            const inputElement = document.getElementById(fieldId);
            
            if (!inputElement) return;
            
            // Guardar valor cuando cambie
            inputElement.addEventListener('change', () => {
                this.saveFieldValue(serviceIndex, field.id, inputElement);
            });
            
            // Para campos de texto, guardar también al escribir
            if (field.type === 'text' || field.type === 'textarea') {
                inputElement.addEventListener('input', () => {
                    this.saveFieldValue(serviceIndex, field.id, inputElement);
                });
            }
        });
    },
    
    saveFieldValue(serviceIndex, fieldId, inputElement) {
        if (!this.selectedServices[serviceIndex]) return;
        
        let value;
        
        switch(inputElement.type) {
            case 'checkbox':
                value = inputElement.checked;
                break;
            case 'file':
                value = inputElement.files[0] ? inputElement.files[0].name : null;
                break;
            case 'select-multiple':
                value = Array.from(inputElement.selectedOptions).map(opt => opt.value);
                break;
            default:
                value = inputElement.value;
        }
        
        // Guardar en el objeto del servicio
        if (!this.selectedServices[serviceIndex].customFields) {
            this.selectedServices[serviceIndex].customFields = {};
        }
        
        this.selectedServices[serviceIndex].customFields[fieldId] = value;
        
        console.log(`Campo guardado: ${fieldId} =`, value);
    },
    
    saveServiceForm(serviceIndex) {
        const service = this.selectedServices[serviceIndex];
        if (!service) return;
        
        // Validar campos requeridos
        const serviceKey = service.key;
        const customFields = this.serviceCustomFields[serviceKey];
        
        if (customFields) {
            let isValid = true;
            const missingFields = [];
            
            customFields.forEach(field => {
                if (field.required) {
                    const fieldId = `service-${serviceIndex}-${field.id}`;
                    const inputElement = document.getElementById(fieldId);
                    
                    if (!inputElement) return;
                    
                    let value;
                    switch(inputElement.type) {
                        case 'checkbox':
                            value = inputElement.checked;
                            break;
                        case 'file':
                            value = inputElement.files[0];
                            break;
                        default:
                            value = inputElement.value;
                    }
                    
                    if (!value || (typeof value === 'string' && value.trim() === '')) {
                        isValid = false;
                        missingFields.push(field.label);
                        
                        // Resaltar campo
                        inputElement.classList.add('border-red-500');
                        setTimeout(() => {
                            inputElement.classList.remove('border-red-500');
                        }, 3000);
                    }
                }
            });
            
            if (!isValid) {
                alert(`Por favor complete los campos requeridos:\n${missingFields.join('\n')}`);
                return;
            }
        }
        
        // Ocultar formulario
        const formElement = document.getElementById(`service-form-${serviceIndex}`);
        if (formElement) {
            formElement.style.display = 'none';
        }
        
        // Mostrar resumen de configuración
        this.showServiceConfigSummary(serviceIndex);
        
        alert('Configuración guardada exitosamente');
    },
    
    cancelServiceForm(serviceIndex) {
        const formElement = document.getElementById(`service-form-${serviceIndex}`);
        if (formElement) {
            formElement.remove();
        }
        
        // Limpiar datos del formulario
        if (this.selectedServices[serviceIndex]) {
            this.selectedServices[serviceIndex].customFields = {};
        }
    },
    
    showServiceConfigSummary(serviceIndex) {
        const service = this.selectedServices[serviceIndex];
        if (!service || !service.customFields) return;
        
        const serviceItem = document.querySelector(`[data-service-index="${serviceIndex}"]`);
        if (!serviceItem) return;
        
        // Crear resumen
        let summaryHTML = '<div class="config-summary mt-2 text-sm text-gray-600">';
        summaryHTML += '<strong>Configuración:</strong><br>';
        
        Object.entries(service.customFields).forEach(([fieldId, value]) => {
            if (value) {
                const fieldName = fieldId.replace(`service-${serviceIndex}-`, '');
                const displayName = fieldName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                summaryHTML += `<span class="block">• ${displayName}: ${this.formatFieldValue(value)}</span>`;
            }
        });
        
        summaryHTML += '</div>';
        
        // Agregar resumen al elemento del servicio
        serviceItem.innerHTML += summaryHTML;
    },
    
    formatFieldValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'boolean') {
            return value ? 'Sí' : 'No';
        }
        return value;
    },
    
    addColor(fieldId, color) {
        const container = document.getElementById(`${fieldId}-colors`);
        if (!container) return;
        
        const colorElement = document.createElement('div');
        colorElement.className = 'color-chip inline-flex items-center';
        colorElement.innerHTML = `
            <div class="w-6 h-6 border rounded mr-1" style="background-color: ${color}"></div>
            <span class="text-xs">${color}</span>
            <button type="button" class="ml-1 text-red-500" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(colorElement);
    },
    
    updateServiciosList() {
        const container = document.getElementById('servicios-personalizados-container');
        const listaServicios = document.getElementById('lista-servicios');
        const resumen = document.getElementById('resumen-servicios');
        
        if (!container || !listaServicios || !resumen) return;
        
        if (this.selectedServices.length === 0) {
            container.innerHTML = `
                <div class="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center w-full">
                    <i class="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-600 font-medium mb-2">No hay servicios agregados</p>
                    <p class="text-gray-500 text-sm">Seleccione un servicio y haga clic en "Agregar Servicio a la Solicitud"</p>
                </div>
            `;
            resumen.classList.add('hidden');
            return;
        }
        
        // Mostrar servicios en lista
        let html = '';
        this.selectedServices.forEach((servicio, index) => {
            const hasCustomForm = this.serviceCustomFields[servicio.key];
            
            html += `
                <div class="mb-4" data-service-index="${index}">
                    <div class="flex justify-between items-center p-3 bg-white border rounded-lg">
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">${servicio.nombre}</div>
                            <div class="text-green-600 font-semibold">$${servicio.precio.toFixed(2)}</div>
                            ${hasCustomForm && !servicio.customFields ? 
                                `<div class="text-sm text-orange-600 mt-1">
                                    <i class="fas fa-exclamation-circle mr-1"></i>Requiere configuración adicional
                                </div>` : 
                                ''
                            }
                        </div>
                        <div class="flex space-x-2">
                            ${hasCustomForm && !servicio.customFields ? 
                                `<button onclick="agentProjects.editServiceForm(${index})" 
                                    class="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition text-sm">
                                    <i class="fas fa-cog mr-1"></i>Configurar
                                </button>` : 
                                ''
                            }
                            <button onclick="agentProjects.removerServicio(${index})" 
                                class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        resumen.classList.remove('hidden');
        
        // Actualizar lista en resumen
        listaServicios.innerHTML = '';
        this.selectedServices.forEach(servicio => {
            const li = document.createElement('li');
            li.className = 'mb-2';
            li.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <span class="font-medium">${servicio.nombre}</span>
                        ${servicio.customFields ? 
                            `<div class="text-xs text-gray-500 mt-1">
                                <i class="fas fa-check-circle text-green-500 mr-1"></i>Configurado
                            </div>` : 
                            ''
                        }
                    </div>
                    <span class="font-semibold">$${servicio.precio.toFixed(2)}</span>
                </div>
            `;
            listaServicios.appendChild(li);
        });
    },
    
    editServiceForm(serviceIndex) {
        // Eliminar formulario existente si hay
        const existingForm = document.getElementById(`service-form-${serviceIndex}`);
        if (existingForm) {
            existingForm.remove();
        }
        
        // Inicializar nuevo formulario
        const service = this.selectedServices[serviceIndex];
        if (service && this.serviceCustomFields[service.key]) {
            this.initializeServiceForm(service.key, serviceIndex);
            
            // Prellenar campos si hay datos guardados
            if (service.customFields) {
                this.prefillServiceForm(serviceIndex);
            }
        }
    },
    
    prefillServiceForm(serviceIndex) {
        const service = this.selectedServices[serviceIndex];
        if (!service || !service.customFields) return;
        
        Object.entries(service.customFields).forEach(([fieldId, value]) => {
            const inputElement = document.getElementById(fieldId);
            if (!inputElement) return;
            
            switch(inputElement.type) {
                case 'checkbox':
                    inputElement.checked = value;
                    break;
                case 'select-multiple':
                    if (Array.isArray(value)) {
                        Array.from(inputElement.options).forEach(option => {
                            option.selected = value.includes(option.value);
                        });
                    }
                    break;
                default:
                    inputElement.value = value || '';
            }
        });
    },
    
    removerServicio(index) {
        // Eliminar formulario asociado si existe
        const formElement = document.getElementById(`service-form-${index}`);
        if (formElement) {
            formElement.remove();
        }
        
        this.selectedServices.splice(index, 1);
        this.updateServiciosList();
        this.updateTotal();
    },
    
    updateTotal() {
        let total = 0;
        this.selectedServices.forEach(servicio => {
            total += servicio.precio;
        });
        
        const totalElement = document.getElementById('total-servicios');
        const montoElement = document.getElementById('monto');
        
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
        
        if (montoElement) {
            montoElement.value = total.toFixed(2);
        }
    },
    
    setupFormToggle() {
        console.log('agentProjects: Configurando toggle del formulario...');
        
        const btnMostrar = document.getElementById('btnMostrarFormularioProyecto');
        const btnCancelar = document.getElementById('btnCancelarProyecto');
        const btnCerrar = document.getElementById('cerrarFormularioProyecto');
        const formularioContainer = document.getElementById('formularioProyectoContainer');
        const projectsListContainer = document.getElementById('projectsListContainer');
        
        if (btnMostrar && formularioContainer && projectsListContainer) {
            btnMostrar.addEventListener('click', (e) => {
                console.log('Mostrar formulario clickeado');
                e.preventDefault();
                formularioContainer.classList.remove('hidden');
                projectsListContainer.classList.add('hidden');
                
                this.resetForm();
                this.loadCurrentUserInfo();
                
                // Configurar autocompletado después de mostrar el formulario
                setTimeout(() => {
                    this.setupClientAutocomplete();
                }, 100);
            });
        }
        
        if (btnCancelar && formularioContainer && projectsListContainer) {
            btnCancelar.addEventListener('click', (e) => {
                console.log('Cancelar clickeado');
                e.preventDefault();
                formularioContainer.classList.add('hidden');
                projectsListContainer.classList.remove('hidden');
            });
        }
        
        if (btnCerrar && formularioContainer && projectsListContainer) {
            btnCerrar.addEventListener('click', (e) => {
                console.log('Cerrar clickeado');
                e.preventDefault();
                formularioContainer.classList.add('hidden');
                projectsListContainer.classList.remove('hidden');
            });
        }
    },
    
    async loadCurrentUserInfo() {
        console.log('=== DEPURACIÓN: Buscando campo Agente ===');
        console.log('Cargando información del usuario actual...');
        
        // 1. Imprime todos los campos del formulario para depuración
        const form = document.getElementById('form-proyecto');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            console.log('Total campos en formulario:', inputs.length);
            
            inputs.forEach((input, index) => {
                console.log(`${index}: ID="${input.id}" Name="${input.name}" Placeholder="${input.placeholder}" Value="${input.value}"`);
            });
        }
        
        try {
            const response = await window.apiCall('/agent/profile');
            if (response && response.success && response.data) {
                const userData = response.data;
                const agentFullName = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
                
                console.log('Nombre del agente a asignar:', agentFullName);
                console.log('Datos del usuario obtenidos:', userData);
                
                // Buscar el campo "Agente" de diferentes maneras
                let agentField = null;
                
                // Intentar con varios IDs posibles
                const possibleIds = ['agente', 'agent-name', 'agent', 'agent_name', 'user-name'];
                for (const id of possibleIds) {
                    agentField = document.getElementById(id);
                    if (agentField) {
                        console.log(`Campo encontrado con ID: ${id}`);
                        break;
                    }
                }
                
                // Si no se encontró por ID, buscar por name attribute
                if (!agentField) {
                    agentField = document.querySelector('[name="agente"]') || 
                                 document.querySelector('[name="agent"]') ||
                                 document.querySelector('[name="agent-name"]');
                    if (agentField) {
                        console.log('Campo encontrado por name attribute:', agentField.name);
                    }
                }
                
                // Si aún no se encontró, buscar por texto en el label
                if (!agentField) {
                    const labels = document.querySelectorAll('label');
                    labels.forEach(label => {
                        if (label.textContent.includes('Agente') && label.htmlFor) {
                            agentField = document.getElementById(label.htmlFor);
                            if (agentField) {
                                console.log('Campo encontrado por label:', label.textContent);
                            }
                        }
                    });
                }
                
                // Si se encontró el campo, asignar el valor
                if (agentField) {
                    console.log('Campo agente encontrado:', agentField);
                    agentField.value = agentFullName;
                    agentField.readOnly = true;
                    agentField.style.backgroundColor = '#f9f9f9';
                    console.log('Valor asignado al campo Agente:', agentField.value);
                } else {
                    console.error('No se encontró el campo "Agente" en el formulario');
                    
                    // Crear campo dinámicamente como fallback
                    this.createAgentFieldDynamically(userData);
                }
                
                // Limpiar los campos de cliente (estos deben quedar vacíos para que el usuario los llene)
                const clientField = document.getElementById('client-name');
                if (clientField) {
                    clientField.value = '';
                    clientField.placeholder = 'Nombre completo del cliente';
                }
                
                const emailField = document.getElementById('email');
                if (emailField) {
                    emailField.value = '';
                    emailField.placeholder = 'cliente@empresa.com';
                }
                
                const phoneField = document.getElementById('phone');
                if (phoneField) {
                    phoneField.value = '';
                    phoneField.placeholder = '1234-5678';
                }
                
                console.log('Información del agente cargada y campos de cliente limpiados');
            }
        } catch (error) {
            console.error('Error al cargar información del usuario:', error);
        }
    },

    createAgentFieldDynamically(userData) {
        console.log('Creando campo agente dinámicamente...');
        
        // Buscar el campo "Correo de Contacto" o "Teléfono" para insertar después
        const referenceField = document.querySelector('[id*="email"]') || 
                              document.querySelector('[id*="phone"]') ||
                              document.querySelector('[id*="correo"]');
        
        if (referenceField && referenceField.parentElement) {
            const agentDiv = document.createElement('div');
            agentDiv.className = 'form-group';
            agentDiv.innerHTML = `
                <label for="agent-name-dynamic">Agente *</label>
                <input type="text" id="agent-name-dynamic" 
                       name="agent-name" 
                       value="${userData.nombre || ''} ${userData.apellido || ''}" 
                       readonly 
                       class="form-control bg-gray-100">
            `;
            
            referenceField.parentElement.parentElement.insertBefore(agentDiv, referenceField.parentElement.nextSibling);
            console.log('Campo agente creado dinámicamente');
        }
    },
    
    // NUEVAS FUNCIONES PARA MEJORAR EL COMPORTAMIENTO DEL CLIENTE
    setupClientInputBehavior() {
        const clientInput = document.getElementById('client-name');
        if (!clientInput) return;
        
        // Permitir borrar completamente con Ctrl+A + Delete
        clientInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                // Permitir seleccionar todo
                return true;
            }
            
            if (e.key === 'Delete' && clientInput.selectionStart === 0 && clientInput.selectionEnd === clientInput.value.length) {
                // Si todo está seleccionado y presiona Delete
                this.clearClientSelection();
                clientInput.value = '';
                return true;
            }
        });
        
        // Doble click para seleccionar todo
        clientInput.addEventListener('dblclick', () => {
            clientInput.select();
        });
        
        // Click derecho -> limpiar
        clientInput.addEventListener('contextmenu', (e) => {
            // Mostrar menú contextual normal del navegador
            return true;
        });
    },
    
    addClearButtonToClientField() {
        const clientInput = document.getElementById('client-name');
        if (!clientInput || clientInput.parentElement.querySelector('.clear-client-btn')) return;
        
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'clear-client-btn';
        clearButton.innerHTML = '×';
        clearButton.title = 'Limpiar cliente';
        
        clearButton.addEventListener('click', () => {
            clientInput.value = '';
            this.clearClientSelection();
            clientInput.focus();
        });
        
        clientInput.parentElement.appendChild(clearButton);
    },

    setupFormSubmission() {
        const form = document.getElementById('form-proyecto');
        if (!form) {
            console.error('Formulario de proyecto no encontrado');
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.selectedServices.length === 0) {
                alert('Debe agregar al menos un servicio al proyecto');
                return;
            }
            
            // Validar cliente
            const clientNameInput = document.getElementById('client-name');
            const clientName = clientNameInput ? clientNameInput.value.trim() : '';
            
            if (!clientName || clientName.length < 2) {
                alert('Por favor, ingrese un nombre de cliente válido');
                return;
            }
            
            // Verificar si es cliente existente o nuevo
            const isExistingClient = clientNameInput.dataset.clientId !== undefined && 
                                    clientNameInput.dataset.clientId !== '' &&
                                    clientNameInput.dataset.clientId !== 'null' &&
                                    clientNameInput.dataset.clientId !== 'undefined';
            
            console.log('=== DEBUG INFO ===');
            console.log('Client input dataset:', clientNameInput.dataset);
            console.log('Client ID from dataset:', clientNameInput.dataset.clientId);
            console.log('Is existing client?', isExistingClient);
            console.log('===================');
            
            // Validar que todos los servicios con formularios personalizados estén configurados
            let serviciosSinConfigurar = [];
            this.selectedServices.forEach((servicio, index) => {
                if (this.serviceCustomFields[servicio.key] && !servicio.customFields) {
                    serviciosSinConfigurar.push({
                        index: index + 1,
                        nombre: servicio.nombre
                    });
                }
            });
            
            if (serviciosSinConfigurar.length > 0) {
                const serviciosList = serviciosSinConfigurar.map(s => `${s.index}. ${s.nombre}`).join('\n');
                alert(`Los siguientes servicios requieren configuración adicional:\n\n${serviciosList}\n\nPor favor, haga clic en "Configurar" para cada servicio.`);
                return;
            }
            
            // Validar fechas
            const startDate = document.getElementById('start-date').value;
            const deliveryDate = document.getElementById('delivery-date').value;
            
            if (!startDate || !deliveryDate) {
                alert('Por favor, seleccione las fechas de inicio y entrega');
                return;
            }
            
            if (new Date(deliveryDate) <= new Date(startDate)) {
                alert('La fecha de entrega debe ser posterior a la fecha de inicio');
                return;
            }
            
            // Validar descripción
            const description = document.getElementById('project-description').value;
            if (!description || description.trim().length < 10) {
                alert('Por favor, proporcione una descripción más detallada del proyecto');
                return;
            }
            
            // Calcular total
            const totalAmount = this.selectedServices.reduce((sum, service) => sum + service.precio, 0);
            
            // Obtener datos del formulario
            const formData = {
                company_name: document.getElementById('company-name').value || 'Personal',
                client_name: clientName,
                email: document.getElementById('email').value || '',
                phone: document.getElementById('phone').value || '',
                website: document.getElementById('website').value || '',
                sector: document.getElementById('sector').value || 'Personal',
                start_date: startDate,
                delivery_date: deliveryDate,
                description: description,
                services: this.selectedServices.map(service => ({
                    id: service.id,
                    nombre: service.nombre,
                    precio: service.precio,
                    custom_fields: service.customFields || {}
                })),
                total_amount: totalAmount
            };
            
            // SOLAMENTE para clientes existentes, agregar client_id
            if (isExistingClient && clientNameInput.dataset.clientId && 
                clientNameInput.dataset.clientId !== '' && 
                clientNameInput.dataset.clientId !== 'null') {
                formData.client_id = parseInt(clientNameInput.dataset.clientId);
            }
            
            console.log('Enviando solicitud de proyecto (RAW):', formData);
            
            // Mostrar spinner o indicador de carga
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
            submitBtn.disabled = true;
            
            try {
                // SOLUCIÓN CRÍTICA: Usar fetch directamente en lugar de window.apiCall
                const token = localStorage.getItem('token');
                const apiBaseUrl = 'http://localhost:3001'; // Ajusta si es necesario
                
                console.log('Usando token:', token ? 'Sí' : 'No');
                
                const response = await fetch(`${apiBaseUrl}/api/agent/create-project`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify(formData) // ¡SÓLO UNA VEZ!
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                
                // Verificar si la respuesta es JSON válido
                const responseText = await response.text();
                console.log('Response text (first 500 chars):', responseText.substring(0, 500));
                
                let responseData;
                try {
                    responseData = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Error parseando respuesta como JSON:', parseError);
                    console.error('Response raw:', responseText);
                    throw new Error('Respuesta del servidor no es JSON válido');
                }
                
                console.log('Respuesta del servidor (parseada):', responseData);
                
                if (!response.ok) {
                    throw {
                        status: response.status,
                        message: responseData.error || `Error ${response.status}`,
                        data: responseData
                    };
                }
                
                if (responseData && responseData.success) {
                    alert('¡Proyecto creado exitosamente!');
                    
                    // Ocultar formulario y mostrar lista
                    document.getElementById('formularioProyectoContainer').classList.add('hidden');
                    document.getElementById('projectsListContainer').classList.remove('hidden');
                    
                    // Resetear formulario
                    this.resetForm();
                    
                    // Recargar proyectos
                    await this.loadMyProjects();
                    
                    // Recargar clientes (por si se agregó uno nuevo)
                    await this.loadExistingClients();
                } else {
                    alert(responseData.error || responseData.message || 'Error al crear el proyecto');
                }
            } catch (error) {
                console.error('Error al enviar solicitud:', error);
                alert('Error al crear el proyecto: ' + (error.message || 'Por favor, intente nuevamente.'));
            } finally {
                // Restaurar botón
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    },
    
    resetForm() {
        // Resetear selecciones
        const categorySelect = document.getElementById('service-category');
        const serviceSelect = document.getElementById('service-select');
        
        if (categorySelect) categorySelect.selectedIndex = 0;
        if (serviceSelect) {
            serviceSelect.selectedIndex = 0;
            serviceSelect.disabled = true;
        }
        
        // Resetear servicios seleccionados
        this.selectedServices = [];
        this.serviceForms = {};
        
        // Limpiar formularios personalizados
        const forms = document.querySelectorAll('.service-custom-form');
        forms.forEach(form => form.remove());
        
        this.updateServiciosList();
        this.updateTotal();
        
        // Resetear campos del formulario - DEJAR VACÍOS para que el usuario los llene
        const fields = [
            'company-name', 'client-name', 'email', 'phone', 'website', 
            'sector', 'project-description', 'start-date', 'delivery-date'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                // Limpiar dataset del campo cliente
                if (fieldId === 'client-name') {
                    delete field.dataset.clientId;
                    delete field.dataset.clientEmail;
                    delete field.dataset.clientPhone;
                    delete field.dataset.clientEmpresa;
                    field.value = '';
                    // Establecer placeholder limpio
                    field.placeholder = 'Nombre del cliente';
                }
                // Para email y teléfono, también limpiar cualquier placeholder
                if (fieldId === 'email') {
                    field.placeholder = 'cliente@empresa.com';
                }
                if (fieldId === 'phone') {
                    field.placeholder = '1234-5678';
                }
            }
        });
        
        // Remover indicador de cliente
        this.removeClientIndicator();
        
        // Limpiar selección de cliente
        this.selectedClientId = null;
        
        // Establecer valores predeterminados SOLO para estos campos
        const companyNameField = document.getElementById('company-name');
        if (companyNameField) {
            companyNameField.value = ''; // Dejar vacío para que el usuario escriba
            companyNameField.placeholder = 'Personal'; // Usar placeholder en lugar de valor
        }
        
        const sectorField = document.getElementById('sector');
        if (sectorField) {
            sectorField.value = ''; // Dejar vacío
            sectorField.placeholder = 'Personal'; // Usar placeholder
        }
        
        // Recargar información del agente
        this.loadCurrentUserInfo();
    },
    
    async init() {
        if (this.isInitialized) {
            console.log('agentProjects ya está inicializado');
            return;
        }
        
        console.log('=== INICIALIZANDO MÓDULO DE PROYECTOS CON AUTCOMPLETADO DE CLIENTES ===');
        
        // Cargar clientes existentes primero
        await this.loadExistingClients();
        
        // Configurar eventos del formulario
        this.setupFormToggle();
        this.setupFormSubmission();
        
        // Cargar categorías y servicios
        await this.loadCategoriesAndServices();
        
        // Configurar filtros
        this.setupFilters();
        
        // Configurar botones de servicios
        this.setupServiceButtons();
        
        // Cargar información del agente
        await this.loadCurrentUserInfo();
        
        // Configurar autocompletado de clientes
        this.setupClientAutocomplete();
        
        // Configurar comportamiento adicional del campo cliente
        this.setupClientInputBehavior();
        
        // Cargar proyectos
        await this.loadMyProjects();
        
        this.isInitialized = true;
        console.log('=== MÓDULO DE PROYECTOS INICIALIZADO ===');
    },
    
    showError(message) {
        console.error('agentProjects Error:', message);
        alert('Error: ' + message);
    },

    viewProject(projectId) {
        console.log('Viendo proyecto:', projectId);
        const modal = document.getElementById('modalVerProyecto');
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    updateProgress(projectId) {
        console.log('Actualizando progreso del proyecto:', projectId);
        const modal = document.getElementById('modalActualizarAvance');
        if (modal) {
            document.getElementById('proyectoAvanceId').value = projectId;
            modal.classList.add('active');
        }
    }
};

// Agregar estilos CSS para el autocompletado - CORREGIDOS CON SOMBRAS NARANJAS
const addAutocompleteStyles = () => {
    if (document.querySelector('#agent-projects-autocomplete-styles')) {
        return; // Los estilos ya están agregados
    }
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'agent-projects-autocomplete-styles';
    styleSheet.textContent = `
        /* Estilos para el autocompletado de clientes */
        .client-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 1000;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.1), 0 4px 6px -2px rgba(249, 115, 22, 0.05);
            max-height: 240px;
            overflow-y: auto;
        }
        
        .client-suggestions.hidden {
            display: none;
        }
        
        .suggestion-item {
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: all 0.2s ease;
        }
        
        .suggestion-item:hover {
            background-color: #fff7ed;
            border-left: 3px solid #f97316;
        }
        
        .suggestion-item:last-child {
            border-bottom: none;
        }
        
        .suggestion-item.active {
            background-color: #ffedd5 !important;
            border-left: 3px solid #ea580c !important;
        }
        
        .client-indicator {
            pointer-events: none;
        }
        
        /* Campo cliente seleccionado */
        input.client-selected {
            background-color: #fff7ed;
            border-color: #fdba74;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }
        
        /* Permite selección de texto en campo cliente */
        #client-name {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
        }
        
        #client-name:read-only {
            background-color: #f9fafb;
        }
        
        /* Mejoras visuales para el formulario */
        .service-custom-form {
            border-color: #e5e7eb;
        }
        
        .service-custom-form h4 {
            color: #374151;
        }
        
        /* SOMBRAS NARANJAS PARA TODOS LOS CAMPOS */
        .form-field input:focus,
        .form-field textarea:focus,
        .form-field select:focus,
        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
            --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) rgba(249, 115, 22, 0.5);
            box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
            border-color: #f97316 !important;
        }
        
        /* SOMBRA NARANJA ESPECÍFICA PARA CAMPOS DEL FORMULARIO */
        #form-proyecto input:focus,
        #form-proyecto textarea:focus,
        #form-proyecto select:focus {
            --tw-ring-color: rgba(249, 115, 22, 0.5) !important;
            border-color: #f97316 !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* SOMBRA NARANJA PARA CAMPOS DE FILTRO */
        .filters input:focus,
        .filters select:focus {
            --tw-ring-color: rgba(249, 115, 22, 0.5) !important;
            border-color: #f97316 !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
        
        .config-summary {
            background-color: #f9fafb;
            padding: 0.75rem;
            border-radius: 0.375rem;
            border: 1px solid #e5e7eb;
            margin-top: 0.5rem;
        }
        
        .config-summary span {
            color: #4b5563;
        }
        
        /* Botón para limpiar cliente */
        .clear-client-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 4px;
            display: none;
            z-index: 10;
        }
        
        .clear-client-btn:hover {
            color: #ef4444;
        }
        
        #client-name:not(:placeholder-shown) + .clear-client-btn {
            display: block;
        }
        
        /* Colores naranja para sugerencias resaltadas */
        .suggestion-item.bg-orange-100,
        .suggestion-item.active {
            background-color: #ffedd5 !important;
            border-left: 3px solid #ea580c !important;
        }
        
        /* Colores naranja para el indicador de cliente existente */
        .client-indicator span {
            background-color: #ffedd5 !important;
            color: #ea580c !important;
            border-color: #fdba74 !important;
            box-shadow: 0 1px 3px rgba(249, 115, 22, 0.1);
        }
        
        /* Colores naranja para botones de configuración */
        .bg-orange-100 {
            background-color: #ffedd5 !important;
        }
        
        .text-orange-700 {
            color: #c2410c !important;
        }
        
        .hover\\:bg-orange-200:hover {
            background-color: #fed7aa !important;
        }
        
        /* Colores naranja para focus - SOMBRAS */
        .focus\\:ring-orange-500:focus {
            --tw-ring-color: rgba(249, 115, 22, 0.5) !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2) !important;
        }
        
        .focus\\:border-orange-500:focus {
            border-color: #f97316 !important;
        }
        
        /* Colores naranja para badges */
        .bg-orange-100 {
            background-color: #ffedd5 !important;
        }
        
        .text-orange-800 {
            color: #9a3412 !important;
        }
        
        .border-orange-200 {
            border-color: #fed7aa !important;
        }
        
        /* SOMBRA NARANJA PARA BOTONES */
        .btn-primary {
            background-color: #f97316 !important;
            border-color: #ea580c !important;
            color: white !important;
        }
        
        .btn-primary:hover {
            background-color: #ea580c !important;
            border-color: #c2410c !important;
            box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1);
        }
        
        /* SOMBRA NARANJA PARA CARD/BOX */
        .bg-white.rounded-lg.shadow {
            box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.1), 0 2px 4px -1px rgba(249, 115, 22, 0.06) !important;
        }
        
        /* SOMBRA NARANJA AL HOVER */
        .bg-white.rounded-lg.shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.1), 0 4px 6px -2px rgba(249, 115, 22, 0.05) !important;
        }
        
        .bg-white.rounded-lg.shadow-lg:hover {
            box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.1), 0 10px 10px -5px rgba(249, 115, 22, 0.04) !important;
        }
        
        /* SOMBRA NARANJA PARA TABLA */
        .overflow-x-auto.bg-white.rounded-lg.shadow {
            box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.1), 0 2px 4px -1px rgba(249, 115, 22, 0.06) !important;
        }
        
        /* SOMBRA NARANJA PARA FILTROS */
        .filters.mb-4.p-4.bg-white.rounded-lg.shadow {
            box-shadow: 0 2px 4px rgba(249, 115, 22, 0.1) !important;
        }
        
        /* ESTILOS PARA EL CAMPO CLIENTE CON AUTCOMPLETADO */
        #client-name {
            transition: all 0.2s ease;
        }
        
        #client-name:focus {
            border-color: #f97316 !important;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* ESTILOS PARA LOS BOTONES DE ACCIÓN */
        .btn {
            transition: all 0.2s ease;
        }
        
        .btn:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.3) !important;
        }
        
        /* SOMBRAS NARANJAS PARA BOTONES SECUNDARIOS */
        .btn-secondary {
            background-color: #fed7aa !important;
            border-color: #fb923c !important;
            color: #9a3412 !important;
        }
        
        .btn-secondary:hover {
            background-color: #fdba74 !important;
            box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2) !important;
        }
        
        /* SOMBRAS NARANJAS PARA BADGES */
        .status-badge,
        .priority-badge {
            box-shadow: 0 1px 2px rgba(249, 115, 22, 0.1) !important;
        }
        
        /* SOMBRA NARANJA PARA EL RESUMEN DE SERVICIOS */
        #resumen-servicios {
            box-shadow: 0 2px 4px rgba(249, 115, 22, 0.1) !important;
            border-color: #fed7aa !important;
        }
        
        /* SOMBRA NARANJA PARA FORMULARIOS PERSONALIZADOS */
        .service-custom-form {
            box-shadow: 0 2px 4px rgba(249, 115, 22, 0.05) !important;
        }
    `;
    
    document.head.appendChild(styleSheet);
};

// Agregar estilos cuando se carga el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAutocompleteStyles);
} else {
    addAutocompleteStyles();
}

// Inicialización automática cuando se muestra la sección
document.addEventListener('DOMContentLoaded', function() {
    const projectsSection = document.getElementById('projects-content');
    if (projectsSection) {
        console.log('Sección de proyectos detectada');
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (projectsSection.classList.contains('active')) {
                        console.log('Sección de proyectos activada - inicializando...');
                        setTimeout(() => {
                            if (window.agentProjects) {
                                window.agentProjects.init();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        observer.observe(projectsSection, { attributes: true });
    }
});