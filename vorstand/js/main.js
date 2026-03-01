window.onload = () => {
    const savedUser = localStorage.getItem('portal_user');
    const savedRole = localStorage.getItem('portal_role');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        userRole = savedRole;
             currentRole = savedRole; // ← das fehlt aktuell
        showApp();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
};

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').classList.remove('d-none');
    document.getElementById('app-screen').style.display = 'flex'; 
    
    document.getElementById('user-info').innerText = `${currentUser} (${userRole})`;
    document.getElementById('user-badge-mobile').innerText = userRole;

    // RBAC (Sidebar + Dashboard-Kacheln) – robust
    const role = String(userRole || 'gast').trim().toLowerCase();

    document.querySelectorAll('.role-protected').forEach(el => {
        const allowed = String(el.dataset.roles || '')
            .split(',')
            .map(r => r.trim().toLowerCase())
            .filter(Boolean);

        const permitted = (role === 'admin') || allowed.includes(role);
        el.classList.toggle('d-none', !permitted);
    });
}

function navTo(viewId, el) {
    // 1. Nav-Links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    // 2. Teardowns (VOR dem View-Wechsel)
    if (viewId !== 'manager'  && typeof teardownManager  === 'function') teardownManager();
    if (viewId !== 'inventar' && typeof teardownInventar === 'function') teardownInventar();

    // 3. View wechseln
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById('view-' + viewId);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error("View nicht gefunden: view-" + viewId);
    }

    closeSidebarMobile();

    // 4. Module laden
    if (viewId === 'inventar'  && typeof loadInventarData  === 'function') loadInventarData();
    if (viewId === 'termine'   && typeof loadTermineData   === 'function') loadTermineData();
    if (viewId === 'resultate' && typeof loadResultateData === 'function') loadResultateData();
    if (viewId === 'manager'   && typeof loadContestData   === 'function') loadContestData();
    if (viewId === 'vermietung' && typeof loadVermietungData === 'function') loadVermietungData();
    // NEU: Jahresmeisterschaften laden
    if (viewId === 'jahresmeisterschaft' && typeof loadJahresmeisterschaftData === 'function') loadJahresmeisterschaftData();
    if (viewId === 'jahresmeisterschaft-kk' && typeof loadJahresmeisterschaftKKData === 'function') loadJahresmeisterschaftKKData();
    // In navTo() ergänzen:
    if (viewId === 'mail'          && typeof loadMailData          === 'function') loadMailData();
    if (viewId === 'jahresbeitrag' && typeof loadJahresbeitragData === 'function') loadJahresbeitragData();
    if (viewId === 'mitglieder'    && typeof loadMitgliederData    === 'function') loadMitgliederData();

}

  

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('show');
}
