// ==========================================
// dashboard.js - LÓGICA DEL PANEL Y WIZARD
// ==========================================

// Iniciar Dashboard
function setupDashboard() {
    switchScreen('dashboard');
    document.getElementById('display-user-name').innerText = appState.user.name;
    document.getElementById('global-photo-balance').innerText = appState.user.photoBalance;
    
    if (appState.user.isNew) {
        document.getElementById('new-user-config').classList.remove('hidden');
    } else {
        document.getElementById('recurring-user-config').classList.remove('hidden');
        const select = document.getElementById('recurring-model-select');
        select.innerHTML = '<option value="" disabled selected>Selecciona una modelo...</option>'; // Limpiar opciones previas
        appState.recurringModels.forEach(m => {
            select.innerHTML += `<option value="${m.id_modelo}">${m.nombre}</option>`;
        });
    }
}

// Iniciar Wizard
function startWizard(totalSteps, modelName = "") {
    const totalPhotos = parseInt(document.getElementById('project-total-photos').value);
    if(!totalPhotos || totalPhotos > appState.user.photoBalance) return alert("Total de fotos inválido o supera tu saldo.");
    
    appState.project.totalPhotosRequested = totalPhotos;
    appState.project.photosLeftToAssign = totalPhotos;
    appState.project.modelsData = [];
    appState.wizard.currentStep = 1;
    appState.wizard.totalSteps = totalSteps;
    appState.wizard.selectedModelName = modelName;

    document.getElementById('global-photo-balance').innerText = appState.project.photosLeftToAssign;
    document.getElementById('config-section').classList.add('hidden');
    document.getElementById('wizard-container').classList.remove('hidden');
    
    renderCurrentStep();
}

// Eventos de inicio
document.getElementById('btn-generate-forms').addEventListener('click', () => {
    const count = parseInt(document.getElementById('models-count').value);
    if(count > 0) startWizard(count);
});

document.getElementById('recurring-model-select').addEventListener('change', (e) => {
    appState.wizard.selectedModelId = e.target.value;
    startWizard(1, e.target.options[e.target.selectedIndex].text);
});

// Renderizar formulario actual
function renderCurrentStep() {
    document.getElementById('wizard-title').innerText = appState.user.isNew ? 
        `Configurando Modelo ${appState.wizard.currentStep} de ${appState.wizard.totalSteps}` : 
        `Configuración para: ${appState.wizard.selectedModelName}`;

    let html = '';
    
    // Si es usuario NUEVO: Pedimos biografía y link de Google Drive
    if (appState.user.isNew) {
        html += `
        <div class="form-group">
            <div class="input-group"><label>Nombre de la Modelo</label><input type="text" id="w-name" required></div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1"><label>Género</label><input type="text" id="w-gender" required></div>
                <div class="input-group" style="flex:1"><label>Edad</label><input type="text" id="w-age" required placeholder="Ej: 24"></div>
            </div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1"><label>Peso</label><input type="text" id="w-weight" required placeholder="Ej: 55 kg"></div>
                <div class="input-group" style="flex:1"><label>Altura</label><input type="text" id="w-height" required placeholder="Ej: 170 cm"></div>
            </div>
        </div>
        
        <hr style="margin:20px 0; border-color:var(--border);">
        <div class="instructions-box">
            <h4>📂 Enlace de Google Drive</h4>
            <p>Sube las fotos a una carpeta de Google Drive y pega el enlace. <b>Debe contener:</b> 6 Fotos en posiciones de referencia y 5 Fotos de dinámica libre.</p>
            <p style="margin-top:10px;">⚠️ <b>Comparte la carpeta con:</b></p>
            <p><span class="highlight-email">larry.garcia@macondosoftwares.com</span></p>
            <p><span class="highlight-email">modelos.ia@macondosoftwares.com</span></p>
        </div>
        <div class="input-group">
            <label>Enlace de Google Drive</label>
            <input type="url" id="w-drive-link" placeholder="https://drive.google.com/..." required>
        </div>`;
    } else {
        // Si es usuario RECURRENTE: Mensaje de que las fotos ya existen (No pedimos link)
        html += `
        <div class="instructions-box" style="background: rgba(16, 185, 129, 0.1); border-left-color: var(--success);">
            <h4 style="color: var(--success);">✅ Modelo Registrada</h4>
            <p>Las fotos base y los datos de <b>${appState.wizard.selectedModelName}</b> ya están almacenados de forma segura en nuestro sistema. Solo indícanos cómo quieres las nuevas fotos.</p>
        </div>`;
    }

    // Directrices creativas (Para AMBOS)
    html += `
    <hr style="margin:20px 0; border-color:var(--border);">
    <h4>Directrices Creativas para esta sesión</h4>
    <div class="input-group"><label>Entorno</label><input type="text" id="w-env" required></div>
    <div class="input-group"><label>Emociones (separadas por coma)</label><input type="text" id="w-emotions" required></div>
    <div class="input-group"><label>Posiciones</label><input type="text" id="w-poses" required></div>
    <div class="input-group" style="margin-top:20px;">
        <label style="color:var(--accent); font-size:1.1rem;">¿Cuántas fotos haremos? (Disponibles: ${appState.project.photosLeftToAssign})</label>
        <input type="number" id="w-photos" min="1" max="${appState.project.photosLeftToAssign}" required>
    </div>`;

    document.getElementById('wizard-content').innerHTML = html;
}

// Botón Siguiente Modelo / Guardar Paso
document.getElementById('btn-next-step').addEventListener('click', () => {
    const req = document.querySelectorAll('#wizard-content input[required]');
    for(let input of req) { if(!input.value) return alert("Llena todos los campos obligatorios para continuar."); }

    const photosAssigned = parseInt(document.getElementById('w-photos').value);
    if(photosAssigned > appState.project.photosLeftToAssign) return alert("No te quedan suficientes fotos.");

    let currentModel = {
        creativa: {
            entorno: document.getElementById('w-env').value,
            emociones: document.getElementById('w-emotions').value.split(',').map(e=>e.trim()),
            posiciones: document.getElementById('w-poses').value
        },
        fotos_asignadas: photosAssigned
    };

    if(appState.user.isNew) {
        // Solo guardamos biografía y link de drive si es nuevo
        currentModel.creativa.drive_link = document.getElementById('w-drive-link').value;
        currentModel.biografia = {
            nombre: document.getElementById('w-name').value, 
            genero: document.getElementById('w-gender').value,
            edad: document.getElementById('w-age').value, 
            peso: document.getElementById('w-weight').value,
            altura: document.getElementById('w-height').value
        };
    } else {
        // Solo enviamos el ID de la modelo para los recurrentes
        currentModel.id_modelo = appState.wizard.selectedModelId;
    }

    appState.project.modelsData.push(currentModel);
    appState.project.photosLeftToAssign -= photosAssigned;
    document.getElementById('global-photo-balance').innerText = appState.project.photosLeftToAssign;

    if(appState.wizard.currentStep < appState.wizard.totalSteps) {
        appState.wizard.currentStep++;
        renderCurrentStep();
    } else {
        if(appState.project.photosLeftToAssign !== 0) {
            alert(`ATENCIÓN: Sobraron ${appState.project.photosLeftToAssign} fotos. Se ajustará el total de tu pedido a las fotos que realmente asignaste.`);
            appState.project.totalPhotosRequested -= appState.project.photosLeftToAssign; 
        }
        document.getElementById('wizard-container').classList.add('hidden');
        document.getElementById('submit-section').classList.remove('hidden');
    }
});

// Envío Final
document.getElementById('btn-submit-project').addEventListener('click', async () => {
    showLoader("Enviando proyecto a n8n...");
    try {
        let payload = {
            cliente_id: appState.user.id,
            configuracion_proyecto: { total_fotos: appState.project.totalPhotosRequested },
            modelos: appState.project.modelsData
        };

        // Decidimos qué Webhook usar basado en si es usuario nuevo o recurrente
        let targetWebhook = '';

        if(appState.user.isNew) {
            payload.es_nuevo = true;
            payload.credenciales_nuevas = { password: appState.user.password };
            targetWebhook = WEBHOOKS.SUBMIT_NEW; // Webhook Original
        } else {
            payload.es_nuevo = false;
            targetWebhook = WEBHOOKS.SUBMIT_EXISTING; // Webhook Nuevo
        }

        const res = await fetch(targetWebhook, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
        });
        
        if(res.ok) {
            alert("¡Proyecto enviado con éxito!");
            location.reload();
        } else throw new Error();
    } catch (e) {
        alert("Ocurrió un error al enviar. Revisa tu conexión.");
        hideLoader();
    }
});