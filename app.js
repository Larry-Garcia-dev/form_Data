const WEBHOOKS = {
    LOGIN: 'https://n8n.macondofood.online/webhook/1fdc5ed2-8310-44f0-9c9e-567752ed078c',
    REGISTER: 'https://n8n.macondofood.online/webhook/aae7bd78-facb-47d9-9d73-5c4d50427108',
    SUBMIT: 'https://n8n.macondofood.online/webhook/a2afded5-3c65-48d7-804d-0b3d094eca05'
};

let appState = {
    user: { id: null, name: null, photoBalance: 0, isNew: false, password: '' },
    project: { totalPhotosRequested: 0, photosLeftToAssign: 0, modelsData: [] },
    recurringModels: [],
    wizard: { currentStep: 1, totalSteps: 1, selectedModelName: "" }
};

const screens = { login: document.getElementById('screen-login'), register: document.getElementById('screen-register'), dashboard: document.getElementById('screen-dashboard') };
const loader = document.getElementById('global-loader');

function switchScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenId].classList.remove('hidden');
    screens[screenId].classList.add('active');
}
function showLoader(text = "Procesando...") { document.getElementById('loader-text').innerText = text; loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

// Navegación Básica
document.getElementById('btn-show-register').addEventListener('click', () => switchScreen('register'));
document.getElementById('btn-show-login').addEventListener('click', () => switchScreen('login'));

// Login
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-password').value;
    showLoader();
    try {
        const res = await fetch(`${WEBHOOKS.LOGIN}?id=${encodeURIComponent(id)}&pass=${encodeURIComponent(pass)}`);
        const data = await res.json();
        if(data.estado === 'exito') {
            appState.user = { id, name: data.nombre || id, photoBalance: data.saldo_fotos, isNew: false };
            appState.recurringModels = data.modelos_registradas || [];
            setupDashboard();
        } else {
            document.getElementById('login-error').innerText = "Credenciales inválidas.";
            document.getElementById('login-error').classList.remove('hidden');
        }
    } catch (e) { alert("Error de servidor."); }
    hideLoader();
});

// Registro
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const id = document.getElementById('reg-id').value;
    const pass = document.getElementById('reg-password').value;
    showLoader();
    try {
        const res = await fetch(WEBHOOKS.REGISTER, { method: 'POST', body: JSON.stringify({ nombre: name, id_cliente: id, password: pass }) });
        const data = await res.json();
        if(data.estado === 'exito') {
            appState.user = { id, name, photoBalance: data.saldo_inicial || 100, isNew: true, password: pass };
            setupDashboard();
        } else {
            document.getElementById('register-error').innerText = "El ID ya existe.";
            document.getElementById('register-error').classList.remove('hidden');
        }
    } catch (e) { alert("Error de servidor."); }
    hideLoader();
});

function setupDashboard() {
    switchScreen('dashboard');
    document.getElementById('display-user-name').innerText = appState.user.name;
    document.getElementById('global-photo-balance').innerText = appState.user.photoBalance;
    if (appState.user.isNew) document.getElementById('new-user-config').classList.remove('hidden');
    else {
        document.getElementById('recurring-user-config').classList.remove('hidden');
        appState.recurringModels.forEach(m => {
            document.getElementById('recurring-model-select').innerHTML += `<option value="${m.id_modelo}">${m.nombre}</option>`;
        });
    }
}

// ==========================================
// LÓGICA DEL WIZARD (Paso a paso)
// ==========================================
function startWizard(totalSteps, modelName = "") {
    const totalPhotos = parseInt(document.getElementById('project-total-photos').value);
    if(!totalPhotos || totalPhotos > appState.user.photoBalance) return alert("Total de fotos inválido o sin saldo.");
    
    appState.project.totalPhotosRequested = totalPhotos;
    appState.project.photosLeftToAssign = totalPhotos;
    appState.project.modelsData = [];
    appState.wizard.currentStep = 1;
    appState.wizard.totalSteps = totalSteps;
    appState.wizard.selectedModelName = modelName;

    document.getElementById('global-photo-balance').innerText = appState.project.photosLeftToAssign;
    document.getElementById('config-section').classList.add('hidden'); // Ocultar config principal
    document.getElementById('wizard-container').classList.remove('hidden');
    
    renderCurrentStep();
}

document.getElementById('btn-generate-forms').addEventListener('click', () => {
    const count = parseInt(document.getElementById('models-count').value);
    if(count > 0) startWizard(count);
});

document.getElementById('recurring-model-select').addEventListener('change', (e) => {
    startWizard(1, e.target.options[e.target.selectedIndex].text);
    appState.wizard.selectedModelId = e.target.value;
});

function renderCurrentStep() {
    document.getElementById('wizard-title').innerText = appState.user.isNew ? 
        `Configurando Modelo ${appState.wizard.currentStep} de ${appState.wizard.totalSteps}` : 
        `Configuración para: ${appState.wizard.selectedModelName}`;

    let html = '';
    
    // Si es nuevo, pedimos bio y link de referencia
    if (appState.user.isNew) {
        html += `
        <div class="form-group">
            <div class="input-group"><label>Nombre de la Modelo</label><input type="text" id="w-name" required></div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1"><label>Género</label><input type="text" id="w-gender" required></div>
                <div class="input-group" style="flex:1"><label>Edad</label><input type="number" id="w-age" required></div>
            </div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1"><label>Peso (kg)</label><input type="number" id="w-weight" required></div>
                <div class="input-group" style="flex:1"><label>Altura (cm)</label><input type="number" id="w-height" required></div>
            </div>
        </div>`;
    }

    // Instrucciones y Link de Drive (Para ambos)
    html += `
    <hr style="margin:20px 0; border-color:var(--border);">
    <div class="instructions-box">
        <h4>📂 Enlace de Google Drive</h4>
        <p>Sube las fotos de esta modelo a una carpeta de Google Drive y pega el enlace abajo. <b>La carpeta debe contener:</b></p>
        <ul>
            <li><b>6 Fotos</b> en posiciones de referencia específicas.</li>
            <li><b>5 Fotos</b> de dinámica libre a tu gusto.</li>
        </ul>
        <p style="margin-top:10px;">⚠️ <b>IMPORTANTE:</b> Debes compartir la carpeta con los siguientes correos para que podamos acceder:</p>
        <p><span class="highlight-email">larry.garcia@macondosoftwares.com</span></p>
        <p><span class="highlight-email">modelos.ia@macondosoftwares.com</span></p>
    </div>
    
    <div class="input-group">
        <label>Pega aquí el enlace de Google Drive</label>
        <input type="url" id="w-drive-link" placeholder="https://drive.google.com/drive/folders/..." required>
    </div>

    <hr style="margin:20px 0; border-color:var(--border);">
    <h4>Directrices Creativas para esta sesión</h4>
    <div class="input-group"><label>Entorno (Ej: Playa de noche)</label><input type="text" id="w-env" required></div>
    <div class="input-group"><label>Emociones (Separadas por comas)</label><input type="text" id="w-emotions" required></div>
    <div class="input-group"><label>Posiciones deseadas</label><input type="text" id="w-poses" required></div>
    
    <div class="input-group" style="margin-top:20px;">
        <label style="color:var(--accent); font-size:1.1rem;">¿Cuántas fotos haremos para esta modelo? (Disponibles: ${appState.project.photosLeftToAssign})</label>
        <input type="number" id="w-photos" min="1" max="${appState.project.photosLeftToAssign}" required>
    </div>
    `;

    document.getElementById('wizard-content').innerHTML = html;
}

// Botón Siguiente / Guardar
document.getElementById('btn-next-step').addEventListener('click', () => {
    // 1. Validar que los campos no estén vacíos
    const req = document.querySelectorAll('#wizard-content input[required]');
    for(let input of req) { if(!input.value) return alert("Por favor llena todos los campos antes de continuar."); }

    const photosAssigned = parseInt(document.getElementById('w-photos').value);
    if(photosAssigned > appState.project.photosLeftToAssign) return alert("Estás asignando más fotos de las que te quedan.");

    // 2. Extraer y guardar la data
    let currentModel = {
        creativa: {
            entorno: document.getElementById('w-env').value,
            emociones: document.getElementById('w-emotions').value.split(',').map(e=>e.trim()),
            posiciones: document.getElementById('w-poses').value,
            drive_link: document.getElementById('w-drive-link').value
        },
        fotos_asignadas: photosAssigned
    };

    if(appState.user.isNew) {
        currentModel.biografia = {
            nombre: document.getElementById('w-name').value, genero: document.getElementById('w-gender').value,
            edad: document.getElementById('w-age').value, peso: document.getElementById('w-weight').value,
            altura: document.getElementById('w-height').value
        };
    } else {
        currentModel.id_modelo = appState.wizard.selectedModelId;
    }

    appState.project.modelsData.push(currentModel);

    // 3. Restar del balance
    appState.project.photosLeftToAssign -= photosAssigned;
    document.getElementById('global-photo-balance').innerText = appState.project.photosLeftToAssign;

    // 4. Avanzar o Finalizar
    if(appState.wizard.currentStep < appState.wizard.totalSteps) {
        appState.wizard.currentStep++;
        renderCurrentStep();
    } else {
        if(appState.project.photosLeftToAssign !== 0) {
            alert(`ATENCIÓN: Aún te sobran ${appState.project.photosLeftToAssign} fotos por asignar de las ${appState.project.totalPhotosRequested} totales. Ajustaremos el total de tu proyecto a lo que realmente asignaste.`);
            appState.project.totalPhotosRequested -= appState.project.photosLeftToAssign; 
        }
        document.getElementById('wizard-container').classList.add('hidden');
        document.getElementById('submit-section').classList.remove('hidden');
    }
});

// Enviar a n8n
document.getElementById('btn-submit-project').addEventListener('click', async () => {
    showLoader("Enviando proyecto a n8n...");
    try {
        let payload = {
            cliente_id: appState.user.id,
            es_nuevo: appState.user.isNew,
            configuracion_proyecto: { total_fotos: appState.project.totalPhotosRequested },
            modelos: appState.project.modelsData
        };
        if(appState.user.isNew) payload.credenciales_nuevas = { password: appState.user.password };

        const res = await fetch(WEBHOOKS.SUBMIT, { method: 'POST', body: JSON.stringify(payload) });
        if(res.ok) {
            alert("¡Proyecto enviado con éxito!");
            location.reload();
        } else throw new Error();
    } catch (e) {
        alert("Ocurrió un error al enviar. Revisa tu conexión.");
        hideLoader();
    }
});