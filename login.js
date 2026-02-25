// ==========================================
// login.js - LÓGICA DE USUARIOS RECURRENTES
// ==========================================

// Botón para ir al registro
document.getElementById('btn-show-register').addEventListener('click', () => switchScreen('register'));

// Formulario de Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    
    showLoader("Verificando credenciales en n8n...");
    
    try {
        const res = await fetch(`${WEBHOOKS.LOGIN}?id=${encodeURIComponent(id)}&pass=${encodeURIComponent(pass)}`);
        const data = await res.json();
        
        if(data.estado === 'exito') {
            // Guardamos en el estado global
            appState.user = { id: id, name: data.nombre || id, photoBalance: data.saldo_fotos, isNew: false };
            appState.recurringModels = data.modelos_registradas || [];
            
            // Llamamos a la función del dashboard (que está en dashboard.js)
            setupDashboard();
        } else {
            errorMsg.innerText = "Credenciales inválidas o usuario no existe.";
            errorMsg.classList.remove('hidden');
        }
    } catch (e) { 
        alert("Error de servidor. Revisa tu conexión o el webhook de n8n."); 
        console.error(e);
    }
    
    hideLoader();
});