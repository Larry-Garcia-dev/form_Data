// ==========================================
// state.js - GESTOR DE ESTADO GLOBAL
// ==========================================

const WEBHOOKS = {
    LOGIN: 'https://n8n.macondofood.online/webhook/1fdc5ed2-8310-44f0-9c9e-567752ed078c',
    REGISTER: 'https://n8n.macondofood.online/webhook/aae7bd78-facb-47d9-9d73-5c4d50427108',
    SUBMIT_NEW: 'https://n8n.macondofood.online/webhook/a2afded5-3c65-48d7-804d-0b3d094eca05',
    SUBMIT_EXISTING: 'https://n8n.macondofood.online/webhook/a2afded5-3c65-48d7-804d-0b3d094eca05-new' // <- El nuevo webhook
};

// La memoria de la aplicación
let appState = {
    user: { id: null, name: null, photoBalance: 0, isNew: false, password: '' },
    project: { totalPhotosRequested: 0, photosLeftToAssign: 0, modelsData: [] },
    recurringModels: [],
    wizard: { currentStep: 1, totalSteps: 1, selectedModelName: "", selectedModelId: null }
};

// Referencias a las pantallas
const screens = { 
    login: document.getElementById('screen-login'), 
    register: document.getElementById('screen-register'), 
    dashboard: document.getElementById('screen-dashboard') 
};

const loader = document.getElementById('global-loader');

// Funciones compartidas
function switchScreen(screenId) {
    Object.values(screens).forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });
    screens[screenId].classList.remove('hidden');
    screens[screenId].classList.add('active');
}

function showLoader(text = "Procesando...") { 
    document.getElementById('loader-text').innerText = text; 
    loader.classList.remove('hidden'); 
}

function hideLoader() { 
    loader.classList.add('hidden'); 
}