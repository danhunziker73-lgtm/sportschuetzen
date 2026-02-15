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

    // RBAC
    document.querySelectorAll('.role-protected').forEach(el => {
        const allowed = el.dataset.roles.split(',');
        if (!allowed.includes(userRole) && userRole !== 'admin') {
            el.classList.add('d-none');
        }
    });
}

function navTo(viewId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    // Achtung: Wenn onclick inline definiert ist, ist "event" verfügbar
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));
     const targetView = document.getElementById('view-' + viewId);
    if(targetView) {
        targetView.classList.add('active');
    } else {
        console.error("View nicht gefunden: view-" + viewId);
    }

    closeSidebarMobile();

    // Module laden
    if (viewId === 'inventar' && typeof loadInventarData === 'function') loadInventarData();
    if (viewId === 'manager' && typeof loadmanagerData === 'function') loadmanagerData();
      if (viewId === 'manager' && typeof loadContestData === 'function') {
        loadContestData(); // Lädt Standard (Grenzland) oder letzten State
 
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('show');
}
