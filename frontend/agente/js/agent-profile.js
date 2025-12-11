// agent-profile.js - Versión simplificada
window.agentProfile = {
    async loadProfile() {
        console.log('Cargando perfil...');
        try {
            const response = await window.apiCall('/agent/profile');
            if (response && response.success) {
                this.updateProfileForm(response.data);
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }
    },
    
    updateProfileForm(profile) {
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value || '';
        };
        
        setValue('perfilNombre', profile.nombre);
        setValue('perfilApellido', profile.apellido);
        setValue('perfilEmail', profile.emailPersonal || profile.email);
        setValue('perfilTelefono', profile.tel1);
    },
    
    async saveProfile() {
        console.log('Guardando perfil...');
        const form = document.getElementById('form-perfil-completo');
        if (!form) return;
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await window.apiCall('/agent/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            if (response && response.success) {
                window.mostrarToast('Perfil actualizado correctamente', 'success');
            }
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            window.mostrarToast('Error al guardar perfil', 'danger');
        }
    }
};

window.initializeAgentProfile = async function() {
    console.log('Inicializando perfil...');
    
    // Configurar submit del formulario
    const form = document.getElementById('form-perfil-completo');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await window.agentProfile.saveProfile();
        });
    }
    
    // Configurar botones para mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.querySelector('i').classList.toggle('fa-eye');
                this.querySelector('i').classList.toggle('fa-eye-slash');
            }
        });
    });
    
    return window.agentProfile;
};