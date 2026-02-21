// === KONFIGURATION ===
const WORKER_URL = "https://sportschuetzen-api.dan-hunziker73.workers.dev/"; 

// === STATE ===
let currentUser = null;
let userRole = null;
let currentRole = null; // Alias

// === API HELPER (WICHTIG!) ===
async function apiFetch(module, paramsString, options = {}) {
    const url = `${WORKER_URL}?module=${module}&${paramsString}`; // Slash am Ende von Worker-URL beachten!
    
    const headers = {
        'X-User-Role': userRole,
        'Content-Type': 'application/json',
        ...options.headers
    };

    return fetch(url, { ...options, headers });
}

// === LOGIN / LOGOUT ===
async function doLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pw').value;
    const btn = document.querySelector('button[onclick="doLogin()"]');
    
    btn.disabled = true;
    btn.innerText = "Prüfe...";

    try {
        const res = await fetch(`${WORKER_URL}?module=admin&action=checkLogin&user=${encodeURIComponent(u)}&pw=${encodeURIComponent(p)}`);
        const data = await res.json();

        if (data.success) {
            currentUser = data.name;
            userRole = data.role;
            currentRole = data.role; // ← hinzufügen
            localStorage.setItem('portal_user', currentUser);
            localStorage.setItem('portal_role', userRole);
            showApp();
        } else {
            document.getElementById('login-error').classList.remove('d-none');
        }
    } catch (e) {
        alert("Verbindungsfehler: " + e);
    }
    btn.disabled = false;
    btn.innerText = "Einloggen";
}

function doLogout() {
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_role');
    location.reload();
}
