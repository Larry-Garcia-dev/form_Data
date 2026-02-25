// ==========================================
// register.js - LÓGICA DE USUARIOS NUEVOS
// ==========================================

// Botón para volver al login
document.getElementById('btn-show-login').addEventListener('click', () => switchScreen('login'));

// Formulario de Registro
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const id = document.getElementById('reg-id').value;
    const pass = document.getElementById('reg-password').value;
    const errorMsg = document.getElementById('register-error');
    
    showLoader("Creando perfil seguro...");
    
    try {
        const res = await fetch(WEBHOOKS.REGISTER, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: name, id_cliente: id, password: pass }) 
        });
        
        const data = await res.json();
        
        if(data.estado === 'exito') {
            appState.user = { id: id, name: name, photoBalance: data.saldo_inicial || 100, isNew: true, password: pass };
            setupDashboard();
        } else {
            errorMsg.innerText = "El ID ya existe, intenta con otro.";
            errorMsg.classList.remove('hidden');
        }
    } catch (e) { 
        alert("Error de servidor. Revisa tu conexión o el webhook de n8n."); 
    }
    
    hideLoader();
});