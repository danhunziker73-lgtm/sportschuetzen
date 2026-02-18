window.onload = () => {
    const savedUser = localStorage.getItem('portal_user');
    const savedRole = localStorage.getItem('portal_role');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        userRole = savedRole;
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

function navTo(viewId) {
    // 1. Navigation updaten
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    
    // 2. View wechseln
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));
    
    const targetView = document.getElementById('view-' + viewId);
    if(targetView) {
        targetView.classList.add('active');
    } else {
        console.error("View nicht gefunden: view-" + viewId);
    }

    closeSidebarMobile();

    // 3. Module laden (Routing Logik)
    if (viewId === 'inventar' && typeof loadInventarData === 'function') loadInventarData();
    if (viewId === 'termine' && typeof loadTermineData === 'function') loadTermineData();
    if (viewId === 'resultate' && typeof loadResultateData === 'function') loadResultateData();

    // WICHTIG: Für den Manager rufen wir die neue generische Funktion auf
    if (viewId === 'manager' && typeof loadContestData === 'function') {
        loadContestData(); // Lädt Standard (Grenzland) oder letzten State
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('show');
}
