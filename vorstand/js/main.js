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

  <div class="card p-3 shadow-sm border-0">

    <h5 class="mb-3">
        📬 Einladungs-Mails versenden
    </h5>

    <button id="inviteSendBtn"
            class="btn btn-danger"
            onclick="confirmInviteSend()">

        <i class="fas fa-paper-plane"></i>
        Einladungs-Mails senden
    </button>

    <div id="inviteProgressBox" class="mt-3 d-none">

        <div class="d-flex align-items-center mb-2">

            <div class="spinner-border spinner-border-sm text-primary me-2"></div>

            <strong id="inviteStatusText">
                Versand wird gestartet...
            </strong>

        </div>

        <div class="progress">
            <div id="inviteProgressBar"
                 class="progress-bar progress-bar-striped progress-bar-animated"
                 style="width:0%">
            </div>
        </div>

    </div>

</div>

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('show');
}
function confirmInviteSend() {

    const confirmSend = confirm(
        "⚠️ Achtung!\n\n" +
        "Es werden Einladungs-Mails an ALLE Mitglieder gesendet.\n\n" +
        "Möchtest du wirklich starten?"
    );

    if (!confirmSend) return;

    triggerInviteEmails();
}

async function triggerInviteEmails() {

    const btn = document.getElementById("inviteSendBtn");
    const box = document.getElementById("inviteProgressBox");
    const text = document.getElementById("inviteStatusText");
    const bar = document.getElementById("inviteProgressBar");

    btn.disabled = true;
    box.classList.remove("d-none");

    text.innerText = "Versand wird gestartet...";
    bar.style.width = "10%";

    try {

        const url = "https://script.google.com/macros/s/AKfycbxoItTn9_HUJ0frtfN-bsXYV0nUqLx5qlZggIcnQmKDrZes8NCGgWxJhTvIJ-E7M926/exec?action=sendInvites";

        const response = await fetch(url);

        const result = await response.text();

        text.innerText = "Mails werden versendet...";
        bar.style.width = "80%";

        setTimeout(() => {

            text.innerText = "✅ Versand abgeschlossen";
            bar.style.width = "100%";

            btn.disabled = false;

        }, 1500);

        console.log("GAS Antwort:", result);

    } catch (error) {

        console.error(error);

        text.innerText = "❌ Fehler beim Versand";
        bar.classList.remove("progress-bar-animated");

        btn.disabled = false;
    }
}
