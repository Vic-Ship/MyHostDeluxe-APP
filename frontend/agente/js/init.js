// init.js - Inicialización general y manejo de modales
document.addEventListener('DOMContentLoaded', function() {
    console.log('Panel de agente cargado');
    
    // Función mejorada para obtener y mostrar información del usuario
    function loadUserInfo() {
        // Primero intentar con window.getCurrentUser()
        let user = window.getCurrentUser ? window.getCurrentUser() : null;
        
        if (!user) {
            // Si no hay usuario, intentar decodificar el token JWT
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    
                    const payload = JSON.parse(jsonPayload);
                    user = {
                        id: payload.userId || payload.id,
                        nombre: payload.nombre || payload.name || 'Agente',
                        apellido: payload.apellido || payload.lastName || '',
                        email: payload.email,
                        role: payload.role || 'agente',
                        username: payload.username
                    };
                    
                    // Guardar en localStorage para uso futuro
                    localStorage.setItem('agentData', JSON.stringify(user));
                } catch (e) {
                    console.error('Error decodificando token:', e);
                }
            }
        }
        
        if (user) {
            console.log('Usuario encontrado:', user);
            
            const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.username || 'Agente';
            
            const headerUserName = document.getElementById('headerUserName');
            const dropdownUserName = document.getElementById('dropdownUserName');
            const dropdownUserRole = document.getElementById('dropdownUserRole');
            
            if (headerUserName) {
                headerUserName.textContent = nombreCompleto;
                console.log('Nombre en header actualizado:', nombreCompleto);
            }
            
            if (dropdownUserName) {
                dropdownUserName.textContent = nombreCompleto;
            }
            
            if (dropdownUserRole) {
                const roleDisplay = user.role === 'administrador' ? 'Administrador' :
                                  user.role === 'agente' ? 'Agente' :
                                  user.role === 'cliente' ? 'Cliente' : user.role;
                dropdownUserRole.textContent = roleDisplay;
            }
        } else {
            console.warn('No se pudo obtener información del usuario');
        }
    }
    
    // Cargar información del usuario inmediatamente
    loadUserInfo();
    
    // Configurar modales
    setupModals();
    
    // Configurar dropdown del perfil
    setupProfileDropdown();
    
    // Configurar botones para mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
    
    // Inicializar aplicación
    if (window.agentApp) {
        window.agentApp.init().catch(err => {
            console.error('Error inicializando app:', err);
        });
    }
});

function setupModals() {
    // Cerrar modales con botón X
    document.querySelectorAll('.modal-close-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.remove('active');
        });
    });
    
    // Cerrar modales con botón Cancelar
    document.querySelectorAll('.btn-secondary[data-modal]').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
        });
    });
    
    // Cerrar modales haciendo clic fuera
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Formulario para posponer tarea
    const formPosponerTarea = document.getElementById('formPosponerTarea');
    if (formPosponerTarea) {
        formPosponerTarea.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskId = document.getElementById('tareaPosponerId')?.value;
            const nuevaFecha = document.getElementById('nuevaFechaLimite')?.value;
            const razon = document.getElementById('razonPosponer')?.value;
            
            console.log('Posponiendo tarea ' + taskId + ' a fecha ' + nuevaFecha);
            
            if (window.agentDashboard && window.agentDashboard.showMessage) {
                window.agentDashboard.showMessage('Tarea pospuesta exitosamente', 'success');
            } else if (window.mostrarToast) {
                window.mostrarToast('Tarea pospuesta exitosamente', 'success');
            }
            
            const modal = this.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
            
            setTimeout(() => {
                if (window.agentDashboard && window.agentDashboard.reloadData) {
                    window.agentDashboard.reloadData();
                }
            }, 500);
        });
    }
    
    // Formulario para completar tarea
    const formCompletarTarea = document.getElementById('formCompletarTarea');
    if (formCompletarTarea) {
        formCompletarTarea.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const taskId = document.getElementById('tareaCompletarId')?.value;
            const comentario = document.getElementById('comentarioCompletar')?.value;
            
            console.log('Completando tarea ' + taskId);
            
            try {
                if (window.agentDashboard && window.agentDashboard.completeTask) {
                    await window.agentDashboard.completeTask(taskId);
                } else {
                    // Fallback si agentDashboard no está disponible
                    await window.apiCall('/agent/tasks/' + taskId + '/complete', { 
                        method: 'POST' 
                    });
                    
                    if (window.mostrarToast) {
                        window.mostrarToast('Tarea completada exitosamente', 'success');
                    }
                }
            } catch (error) {
                console.error('Error al completar tarea:', error);
                if (window.mostrarToast) {
                    window.mostrarToast('Error al completar la tarea', 'error');
                }
            }
            
            const modal = this.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
        });
    }
    
    // Configurar formulario de actualización de avance
    const formAvance = document.getElementById('formActualizarAvance');
    if (formAvance) {
        // Configurar rango de avance
        const nuevoAvance = document.getElementById('nuevoAvance');
        const avanceValue = document.getElementById('avanceValue');
        const barraProgreso = document.getElementById('barraProgreso');
        
        if (nuevoAvance && avanceValue && barraProgreso) {
            nuevoAvance.addEventListener('input', function() {
                const value = this.value;
                avanceValue.textContent = value + '%';
                barraProgreso.style.width = value + '%';
            });
        }
        
        formAvance.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const proyectoId = document.getElementById('proyectoAvanceId').value;
            const nuevoAvance = document.getElementById('nuevoAvance').value;
            const comentario = document.getElementById('comentarioAvance').value;
            
            console.log('Actualizando avance del proyecto ' + proyectoId + ' a ' + nuevoAvance + '%');
            
            try {
                const response = await window.apiCall(`/agent/projects/${proyectoId}/progress`, {
                    method: 'PUT',
                    body: JSON.stringify({ 
                        progreso: nuevoAvance, 
                        comentarios: comentario 
                    })
                });
                
                if (response && response.success) {
                    if (window.mostrarToast) {
                        window.mostrarToast('Avance actualizado correctamente', 'success');
                    }
                    
                    // Recargar proyectos
                    if (window.agentProjects && window.agentProjects.loadMyProjects) {
                        await window.agentProjects.loadMyProjects();
                    }
                    
                    this.closest('.modal-overlay').classList.remove('active');
                }
            } catch (error) {
                console.error('Error al actualizar avance:', error);
                if (window.mostrarToast) {
                    window.mostrarToast('Error al actualizar avance', 'error');
                }
            }
        });
    }
    
    // Configurar formulario de perfil
    const formPerfil = document.getElementById('form-perfil-completo');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (window.agentProfile && window.agentProfile.saveProfile) {
                await window.agentProfile.saveProfile();
            } else {
                console.log('Guardando perfil...');
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const response = await window.apiCall('/agent/profile', {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    
                    if (response && response.success && window.mostrarToast) {
                        window.mostrarToast('Perfil actualizado correctamente', 'success');
                    }
                } catch (error) {
                    console.error('Error al guardar perfil:', error);
                    if (window.mostrarToast) {
                        window.mostrarToast('Error al guardar perfil', 'danger');
                    }
                }
            }
        });
    }
    
    // Configurar formulario de reportes
    const formReporte = document.getElementById('form-reporte-agente');
    if (formReporte) {
        formReporte.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (window.agentReports && window.agentReports.generateReport) {
                await window.agentReports.generateReport();
            }
        });
    }
    
    // Botón de exportar PDF
    const exportButton = document.getElementById('btnExportarPDFAgente');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            console.log('Exportando a PDF...');
            if (window.mostrarToast) {
                window.mostrarToast('Funcionalidad de exportación en desarrollo', 'info');
            }
        });
    }
}

function setupProfileDropdown() {
    const userProfileToggle = document.querySelector('.user-profile-toggle');
    const userProfile = document.querySelector('.user-profile');
    
    if (userProfileToggle && userProfile) {
        userProfileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            userProfile.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }
}

// Observador para secciones activas
const sectionObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const targetId = mutation.target.id;
            if (targetId && targetId.endsWith('-content')) {
                if (mutation.target.classList.contains('active')) {
                    console.log('Sección activa cambiada a:', targetId);
                    
                    // Auto-inicialización del dashboard cuando la sección está activa
                    if (targetId === 'dashboard-content') {
                        console.log('Sección dashboard activa - auto-inicializando...');
                        
                        setTimeout(() => {
                            if (window.initializeAgentDashboard) {
                                window.initializeAgentDashboard().catch(console.error);
                            }
                        }, 300);
                    }
                }
            }
        }
    });
});

// Observar cambios en las secciones
document.querySelectorAll('.content-section').forEach(section => {
    sectionObserver.observe(section, { attributes: true });
});