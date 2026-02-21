// =========================================================
//  MODULE: MANAGER (Grenzland / Mannschaft / Gruppe)
//  - UI/Drag&Drop/PDF: aus Standalone übernommen
//  - Backend: Cloudflare Worker -> GAS (getManagerData / saveManagerData / sendMail)
//  - Primärschlüssel: NUMERISCHE Mitglieder-ID
// =========================================================

// === KONFIGURATION ===
const CONTEST_CONFIG = {
    "grenzland": {
        title: "🛡️ Grenzland Cup",
        pdfTitle: "Grenzland Cup",
        fileBase: "Grenzland_Cup",
        sheetName: "aktuell_Grenzland",
        baseTeamName: "Muhen",
        defaultTeams: 4,
        zones: [{ key: "main", label: "Schützen", limit: 4 }]
    },
    "mannschaft": {
        title: "👥 Mannschafts-Meisterschaft",
        pdfTitle: "Mannschafts-Meisterschaft",
        fileBase: "Mannschaft",
        sheetName: "aktuell_Mannschaft",
        baseTeamName: "Muhen",
        defaultTeams: 1,
        zones: [{ key: "main", label: "Mannschaft (8)", limit: 8 }]
    },
    "gruppe": {
        title: "🎯 Gruppen-Meisterschaft (SGM)",
        pdfTitle: "Gruppen-Meisterschaft (SGM)",
        fileBase: "Gruppe_SGM",
        sheetName: "aktuell_Gruppe",
        baseTeamName: "Muhen",
        defaultTeams: 2,
        zones: [
            { key: "liegend", label: "Liegend (3)", limit: 3 },
            { key: "kniend", label: "Kniend (2)", limit: 2 }
        ]
    }
};

// === STATE ===
let appState = {
    activeModule: "grenzland",
    members: [],
    teams: [],
    pool: [],
    mailList: [],
    isDirty: false,
    _dndInited: false
};


// =========================================================
//  STYLES
// =========================================================
(function injectManagerStylesOnce() {
    if (document.getElementById('manager-inline-styles')) return;

    const style = document.createElement('style');
    style.id = 'manager-inline-styles';
    style.textContent = `
        :root {
            --primary: #0d6efd;
            --secondary: #6c757d;
            --success: #198754;
            --warning: #ffc107;
            --danger: #dc3545;
            --light: #f8f9fa;
            --mail-max: 180px;
            --pool-max: 420px;
        }

        :root { --toolbar-h: 76px; }

        @media (max-width: 576px) {
          .mobile-sticky {
            position: sticky;
            top: calc(var(--toolbar-h) + .5rem);
            align-self: flex-start;
          }
        }

        .draggable-player {
            cursor: grab;
            user-select: none;
            touch-action: none;
            transition: transform 0.1s, box-shadow 0.1s;
        }
        .draggable-player:active { cursor: grabbing; }

        .dropzone {
            transition: background-color 0.2s, border-color 0.2s;
        }
        .dropzone.drag-over {
            background-color: rgba(25, 135, 84, 0.1) !important;
            border: 2px dashed var(--success) !important;
        }
        .zone-full {
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
        }

        .ghost-slot {
            border: 2px dashed #cbd5e1 !important;
            background: rgba(255,255,255,0.5);
            pointer-events: none;
        }

        .drag-clone {
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border-left: 4px solid var(--primary);
            opacity: 0.9;
            width: 200px;
        }

        .sidebar-stack { display: flex; flex-direction: column; gap: .75rem; }
        .sidebar-card .card-header { padding: .45rem .65rem; }
        .sidebar-card .card-body { padding: .5rem; }

        .mail-body {
            max-height: var(--mail-max);
            overflow: auto;
            border: 2px dashed #ccc;
        }
        .pool-body {
            max-height: var(--pool-max);
            overflow: auto;
        }

        @media print {
            .no-print { display: none !important; }
            .card { break-inside: avoid; border: 1px solid #ccc !important; box-shadow: none !important; }
            body { background: white; }
        }

        @media (max-width: 576px) {
            :root {
                --mail-max: 18vh;
                --pool-max: 45vh;
            }
            .container-fluid.py-3 { padding-top: .5rem !important; padding-bottom: .5rem !important; }
            .sticky-top.no-print { padding: .6rem !important; }
            .sidebar-card .card-header { padding: .4rem .55rem; }
            .sidebar-card .card-body { padding: .45rem; }
            .drag-clone { width: 170px; }
        }
    `;
    document.head.appendChild(style);
})();


// =========================================================
//  ENTRY: called from main.js navTo('manager')
// =========================================================
async function loadContestData(moduleKey) {
    ensureManagerShell();

    if (appState.isDirty && !confirm("Ungespeicherte Änderungen verwerfen?")) {
        const sel = document.getElementById('module-selector');
        if (sel) sel.value = appState.activeModule;
        return;
    }

    appState.activeModule = moduleKey || appState.activeModule;
    appState.isDirty = false;
    appState.mailList = [];

    const config = CONTEST_CONFIG[appState.activeModule];
    renderLoadingState();

    try {
        const params = `action=getManagerData&sheetName=${encodeURIComponent(config.sheetName)}`;
        const res = await apiFetch('manager', params);

        const txt = await res.text();
        let data;
        try { data = JSON.parse(txt); }
        catch (e) { throw new Error("Backend-Antwort ist kein JSON (prüfe GAS Fehlerseite)"); }

        if (data.error) throw new Error(data.error);

        processContestData(data, config);
        renderContestUI();

        if (!appState._dndInited) {
            initDragAndDrop();
            appState._dndInited = true;
        }

        const sel = document.getElementById('module-selector');
        if (sel) sel.value = appState.activeModule;

    } catch (e) {
        const c = document.getElementById('manager-inner');
        if (c) c.innerHTML = `<div class="col-12"><div class="alert alert-danger">Fehler: ${escapeHtml(e.message)}</div></div>`;
    }
}

// =========================================================
//  TEARDOWN: called from main.js navTo() beim View-Wechsel
// =========================================================
function teardownManager() {
    appState._dndInited = false;
    appState.isDirty = false;
    const app = document.getElementById('manager-app');
    if (app) app.remove();
}


// =========================================================
//  UI Shell
// =========================================================
function ensureManagerShell() {
    const host = document.getElementById('manager-container');
    if (!host) return;
    if (document.getElementById('manager-app')) return;

    host.innerHTML = `
      <div class="container-fluid py-3" id="manager-app">

        <!-- TOOLBAR: z-index 900 = unter Portal-Navbar (1050) -->
        <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white p-3 shadow-sm rounded no-print"
             style="z-index: 900;">
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <select id="module-selector" class="form-select fw-bold border-primary text-primary"
                        style="width:auto; min-width:160px;">
                    <option value="grenzland">🛡️ Grenzland</option>
                    <option value="mannschaft">👥 Mannschaft</option>
                    <option value="gruppe">🎯 Gruppe (SGM)</option>
                </select>
                <button class="btn btn-outline-secondary btn-sm" onclick="addTeamToState()" title="Neues Team">
                    <i class="fas fa-plus"></i> <span class="d-none d-sm-inline">Team</span>
                </button>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-dark btn-sm" onclick="exportPDF()" title="PDF Export">
                    <i class="fas fa-file-pdf text-danger"></i> <span class="d-none d-sm-inline">PDF</span>
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="exportAllPDF()" title="Alle 3 Module in ein PDF">
                    <i class="fas fa-layer-group"></i> <span class="d-none d-sm-inline">Alle PDFs</span>
                </button>
                <button id="btn-save-manager" class="btn btn-success btn-sm fw-bold" onclick="saveContest()">
                    <i class="fas fa-save"></i> <span class="d-none d-sm-inline">Speichern</span>
                </button>
            </div>
        </div>

        <!-- MAIN CONTENT -->
        <div id="manager-inner" class="row g-3 h-100">
            <div class="col-12 text-center p-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2 text-muted">Lade Anwendung...</p>
            </div>
        </div>

      </div>
    `;

    document.getElementById('module-selector')
        .addEventListener('change', (e) => loadContestData(e.target.value));
}

function renderLoadingState() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const inner = document.getElementById('manager-inner');
    if (!inner) return;
    inner.innerHTML = `
        <div class="col-12 text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p>Lade ${escapeHtml(config.title)}...</p>
        </div>`;
}


// =========================================================
//  DATA PROCESSING
// =========================================================
function processContestData(data, config) {
    appState.members = (data.members || []).map(m => ({
        id: String(m.id),
        vorname: m.vorname || "",
        nachname: m.nachname || "",
        email: m.email || ""
    }));

    const memberById = new Map(appState.members.map(m => [String(m.id), m]));

    appState.teams = [];
    appState.pool = [];

    const assignedIds = new Set();
    const sheetData = data.contestData || [];
    const tempTeams = {};

    sheetData.forEach(row => {
        const rowId = row.id != null ? String(row.id).trim() : "";
        if (!rowId) return;

        const member = memberById.get(rowId);
        const displayName = member
            ? `${member.nachname} ${member.vorname}`.trim()
            : `ID ${rowId}`;
        const email = member ? (member.email || "") : "";
        const teamName = String(row.runde_1_team || "").trim() || "Pool";

        let zoneKey = config.zones[0].key;
        if (config.zones.length > 1) {
            const stellung = String(row.stellung || "").toLowerCase();
            zoneKey = stellung.includes("kniend") ? "kniend" : "liegend";
        }

        if (teamName !== "Pool" && teamName) {
            if (!tempTeams[teamName]) tempTeams[teamName] = { name: teamName, shooters: [] };
            tempTeams[teamName].shooters.push({ id: rowId, name: displayName, email, zone: zoneKey });
            assignedIds.add(rowId);
        }
    });

    if (Object.keys(tempTeams).length > 0) {
        appState.teams = Object.values(tempTeams).sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true })
        );
    } else {
        for (let i = 1; i <= config.defaultTeams; i++) addTeamToState(true);
    }

    appState.members.forEach(m => {
        const id = String(m.id);
        if (!assignedIds.has(id)) {
            appState.pool.push({
                id,
                name: `${m.nachname} ${m.vorname}`.trim(),
                email: m.email || "",
                zone: null
            });
        }
    });
}


// =========================================================
//  RENDER UI
// =========================================================
function renderContestUI() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const container = document.getElementById('manager-inner');
    if (!container) return;

    const teamsHtml = appState.teams.map(team => renderTeamCard(team, config)).join('');

    const sidebarHtml = `
        <div class="sidebar-stack h-100">

            <!-- MAIL -->
            <div class="card shadow-sm border-warning sidebar-card">
                <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-envelope"></i> Mail Versand</span>
                    <button class="btn btn-sm btn-dark py-0"
                            onclick="sendMailViaBackend()"
                            style="font-size:0.8rem;">
                        <i class="fas fa-paper-plane"></i> Senden
                    </button>
                </div>
                <div class="card-body dropzone bg-light overflow-auto mail-body" data-target-type="mail">
                    ${appState.mailList.length === 0
                        ? '<div class="text-center text-muted small mt-3">Schützen hierher ziehen<br>(Kopie)</div>'
                        : ''}
                    ${appState.mailList.map(s => renderMailItem(s)).join('')}
                </div>
                <div class="card-footer small text-muted text-center py-1">
                    ${appState.mailList.length} Empfänger
                </div>
            </div>

            <!-- POOL -->
            <div class="card shadow-sm border-secondary sidebar-card">
                <div class="card-header bg-secondary text-white py-2">
                    <i class="fas fa-users"></i> Schützen-Pool
                    <input type="text" class="form-control form-control-sm mt-1"
                           placeholder="Suchen..."
                           onkeyup="filterPool(this.value)">
                </div>
                <div class="card-body dropzone bg-light overflow-auto pool-body" data-target-type="pool">
                    ${appState.pool.map(s => renderPlayerItem(s)).join('')}
                    ${appState.pool.length === 0
                        ? '<div class="text-muted text-center small mt-3">Alle Schützen eingeteilt</div>'
                        : ''}
                </div>
                <div class="card-footer small text-muted text-center py-1">
                    ${appState.pool.length} verfügbar
                </div>
            </div>

        </div>
    `;

  container.innerHTML = `
  <div class="col-12 col-md-5 col-lg-4 order-3 order-md-1">
    ${sidebarHtml}
  </div>
  <div class="col-12 col-md-7 col-lg-8 order-1 order-md-2">
        <div class="row g-3" id="teams-area">
          ${teamsHtml}
        </div>
      </div>
    `;
}

function renderTeamCard(team, config) {
    const zonesHtml = config.zones.map((zone) => {
        const shooters = team.shooters.filter(s =>
            config.zones.length === 1 ? true : s.zone === zone.key
        );

        const limit = zone.limit;
        const filled = shooters.length;
        const remaining = Math.max(0, limit - filled);
        const isFull = filled >= limit;

        let zoneBg = zone.key === 'liegend'
            ? '#e3f2fd'
            : (zone.key === 'kniend' ? '#f3e5f5' : '#fff');
        if (isFull) zoneBg = '#f8f9fa';

        let contentHtml = shooters.map(s => renderPlayerItem(s, team.name)).join('');
        for (let i = 0; i < remaining; i++) {
            contentHtml += `
                <div class="card mb-1 ghost-slot">
                    <div class="card-body p-1 px-2 text-center small text-muted fst-italic">
                        <i class="fas fa-plus-circle opacity-50"></i> ${escapeHtml(zone.label)}
                    </div>
                </div>`;
        }

        const headerColor = isFull ? 'text-success' : 'text-secondary';
        const headerIcon = isFull ? '<i class="fas fa-check-circle"></i>' : '';

        return `
            <div class="team-zone p-2 mb-2 border rounded dropzone ${isFull ? 'zone-full' : ''}"
                style="background:${zoneBg}; min-height: 60px;"
                data-team="${escapeHtml(team.name)}"
                data-zone="${escapeHtml(zone.key)}"
                data-limit="${limit}"
                data-target-type="team">
                ${config.zones.length > 1 ? `
                    <div class="d-flex justify-content-between small fw-bold ${headerColor} mb-2 pe-none">
                        <span>${escapeHtml(zone.label)}</span>
                        <span>${headerIcon} ${filled}/${limit}</span>
                    </div>` : ''}
                <div>${contentHtml}</div>
            </div>`;
    }).join('');

    const totalShooters = team.shooters.length;
    const totalSlots = config.zones.reduce((sum, z) => sum + z.limit, 0);
    const teamComplete = totalShooters >= totalSlots;

    return `
        <div class="col-xl-6 col-12">
            <div class="card shadow-sm h-100 border-0 ${teamComplete ? 'border-start border-success border-4' : ''}">
                <div class="card-header d-flex justify-content-between align-items-center bg-white pt-3 pb-1 border-bottom-0">
                    <h5 class="m-0 fw-bold text-primary text-truncate">${escapeHtml(team.name)}</h5>
                    <span class="badge ${teamComplete ? 'bg-success' : 'bg-light text-dark border'}">
                        ${totalShooters}/${totalSlots}
                    </span>
                </div>
                <div class="card-body p-2">${zonesHtml}</div>
                <div class="text-end p-2 pt-0">
                    <small class="text-danger text-decoration-underline"
                           onclick="removeTeamFromState('${escapeJs(team.name)}')"
                           style="cursor:pointer; font-size: 0.75rem;">
                        Team entfernen
                    </small>
                </div>
            </div>
        </div>`;
}

function renderPlayerItem(player) {
    return `
        <div class="card mb-1 draggable-player border-0 shadow-sm"
            draggable="true"
            data-id="${escapeHtml(String(player.id))}"
            style="border-left: 3px solid var(--primary) !important;">
            <div class="card-body p-1 px-2 pointer-events-none">
                <div class="player-row pointer-events-none">
                    <span class="player-name small fw-bold text-truncate pointer-events-none">
                        ${escapeHtml(player.name)}
                    </span>
                </div>
            </div>
        </div>`;
}

function renderMailItem(player) {
    return `
        <div class="card mb-1 border-0 shadow-sm bg-white">
            <div class="card-body p-1 px-2 d-flex justify-content-between align-items-center">
                <div class="text-truncate small" style="max-width:80%">
                    ${escapeHtml(player.name)}
                </div>
                <i class="fas fa-times text-danger"
                   style="cursor:pointer;"
                   onclick="removeFromMail('${escapeJs(String(player.id))}')"></i>
            </div>
        </div>`;
}


// =========================================================
//  DRAG & DROP ENGINE
// =========================================================
function initDragAndDrop() {
    let dragSrcEl = null;
    let dragId = null;
    let touchClone = null;

    // --- DESKTOP ---
    document.addEventListener('dragstart', (e) => {
        const el = e.target.closest('.draggable-player');
        if (!el) return;
        dragSrcEl = el;
        dragId = el.dataset.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragId);
        setTimeout(() => el.style.opacity = '0.4', 0);
    });

    document.addEventListener('dragend', (e) => {
        const el = e.target.closest('.draggable-player');
        if (el) el.style.opacity = '1';
        removeDropHighlights();
        dragSrcEl = null;
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const zone = e.target.closest('.dropzone');
        if (zone) zone.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (e) => {
        const zone = e.target.closest('.dropzone');
        if (zone) zone.classList.remove('drag-over');
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const zone = e.target.closest('.dropzone');
        if (zone && dragId) handleDrop(dragId, zone);
        removeDropHighlights();
    });

    // --- MOBILE TOUCH ---
    document.addEventListener('touchstart', (e) => {
        const el = e.target.closest('.draggable-player');
        if (!el) return;
        dragId = el.dataset.id;
        dragSrcEl = el;
        touchClone = el.cloneNode(true);
        touchClone.classList.add('drag-clone');
        document.body.appendChild(touchClone);
        const touch = e.touches[0];
        moveClone(touch.clientX, touch.clientY);
        el.style.opacity = '0.4';
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!dragId || !touchClone) return;
        e.preventDefault();
        const touch = e.touches[0];
        moveClone(touch.clientX, touch.clientY);
        removeDropHighlights();
        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = elemBelow ? elemBelow.closest('.dropzone') : null;
        if (zone) zone.classList.add('drag-over');
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!dragId) return;
        const touch = e.changedTouches[0];
        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = elemBelow ? elemBelow.closest('.dropzone') : null;
        if (zone) handleDrop(dragId, zone);
        if (touchClone) touchClone.remove();
        if (dragSrcEl) dragSrcEl.style.opacity = '1';
        removeDropHighlights();
        dragId = null;
        touchClone = null;
        dragSrcEl = null;
    });

    function moveClone(x, y) {
        if (touchClone) {
            touchClone.style.left = (x - 20) + 'px';
            touchClone.style.top = (y - 20) + 'px';
        }
    }

    function removeDropHighlights() {
        document.querySelectorAll('.dropzone').forEach(z => z.classList.remove('drag-over'));
    }
}


// =========================================================
//  LOGIK
// =========================================================
function handleDrop(playerId, targetZone) {
    const targetType = targetZone.dataset.targetType;

    if (targetType === "mail") {
        copyToMail(playerId);
        return;
    }

    if (targetType === "pool") {
        movePlayerInState(playerId, null, null);
        renderContestUI();
        return;
    }

    if (targetType === "team") {
        const limit = parseInt(targetZone.dataset.limit, 10);
        const teamName = targetZone.dataset.team;
        const zoneKey = targetZone.dataset.zone;
        const team = appState.teams.find(t => t.name === teamName);
        if (!team) return;

        const currentCount = team.shooters.filter(s =>
            s.zone === zoneKey && String(s.id) !== String(playerId)
        ).length;
        if (currentCount >= limit) return;

        movePlayerInState(playerId, teamName, zoneKey);
        renderContestUI();
    }
}

function movePlayerInState(id, targetTeam, targetZone) {
    appState.isDirty = true;
    let player = null;
    const sid = String(id);

    const poolIdx = appState.pool.findIndex(p => String(p.id) === sid);
    if (poolIdx > -1) {
        player = appState.pool.splice(poolIdx, 1)[0];
    } else {
        for (let t of appState.teams) {
            const idx = t.shooters.findIndex(s => String(s.id) === sid);
            if (idx > -1) { player = t.shooters.splice(idx, 1)[0]; break; }
        }
    }

    if (!player) return;

    if (!targetTeam) {
        player.zone = null;
        appState.pool.push(player);
    } else {
        const team = appState.teams.find(t => t.name === targetTeam);
        if (team) { player.zone = targetZone; team.shooters.push(player); }
    }
}

function copyToMail(id) {
    const sid = String(id);
    let player = appState.pool.find(p => String(p.id) === sid);
    if (!player) {
        for (let t of appState.teams) {
            player = t.shooters.find(s => String(s.id) === sid);
            if (player) break;
        }
    }
    if (player && !appState.mailList.find(m => String(m.id) === sid)) {
        appState.mailList.push({ ...player });
        renderContestUI();
    }
}

function removeFromMail(id) {
    appState.mailList = appState.mailList.filter(m => String(m.id) !== String(id));
    renderContestUI();
}


// =========================================================
//  UTILS
// =========================================================
function addTeamToState(silent = false) {
    const config = CONTEST_CONFIG[appState.activeModule];
    let nextNum = 1;
    const existingNums = appState.teams.map(t => {
        const match = t.name.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    });
    while (existingNums.includes(nextNum)) nextNum++;
    appState.teams.push({ name: `${config.baseTeamName} ${nextNum}`, shooters: [] });
    if (!silent) renderContestUI();
}

function removeTeamFromState(teamName) {
    if (!confirm(`Team "${teamName}" wirklich löschen?`)) return;
    const idx = appState.teams.findIndex(t => t.name === teamName);
    if (idx === -1) return;
    appState.teams[idx].shooters.forEach(s => { s.zone = null; appState.pool.push(s); });
    appState.teams.splice(idx, 1);
    renderContestUI();
}

function filterPool(val) {
    val = String(val || "").toLowerCase();
    document.querySelectorAll('.dropzone[data-target-type="pool"] .draggable-player').forEach(el => {
        el.parentElement.style.display =
            el.innerText.toLowerCase().includes(val) ? 'block' : 'none';
    });
}


// =========================================================
//  MAIL VIA BACKEND (GAS / Cloudflare Worker)
//  GAS erwartet: { recipients, subject, body, pdfBase64, fileName }
// =========================================================
async function sendMailViaBackend() {
    const config = CONTEST_CONFIG[appState.activeModule];

    const mails = appState.mailList
        .map(m => (m.email || "").trim())
        .filter(e => e.includes("@"));

    if (!mails.length) {
        alert("Keine gültigen E-Mail-Adressen gefunden!\nBitte Schützen mit E-Mail in die Mailliste ziehen.");
        return;
    }

    if (!window.jspdf?.jsPDF) {
        alert("jsPDF nicht geladen.");
        return;
    }

    const btn = document.querySelector('.card-header [onclick="sendMailViaBackend()"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Senden'; }

    try {
        // PDF generieren
        const { doc, dateStr } = buildPdfDoc();
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const base = config.fileBase || toSafeFilename(config.pdfTitle || config.title);
        const fileName = `${base}_${dateStr}.pdf`;

        const res = await apiFetch('manager', 'action=sendMail', {
            method: 'POST',
            body: JSON.stringify({
                recipients: mails,
                subject: `Aufgebot ${config.pdfTitle || config.title}`,
                body: `Hallo\n\nIm Anhang findest du das Aufgebot für ${config.pdfTitle || config.title}.\n\nFreundliche Grüsse\nSportschützen Muhen`,
                pdfBase64,
                fileName
            })
        });

        const txt = await res.text();
        let data;
        try { data = JSON.parse(txt); }
        catch { throw new Error("Backend-Antwort ist kein JSON"); }

        if (data.error) throw new Error(data.error);

        alert(`✅ Entwurf erstellt! Bitte in Gmail öffnen, prüfen und senden.\n(${mails.length} Empfänger als BCC)`);

    } catch (e) {
        alert("Fehler beim Mail-Versand: " + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-pen"></i> Entwurf';
        }
    }
}


// =========================================================
//  SAVE
// =========================================================
async function saveContest() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const btn = document.getElementById('btn-save-manager');
    const originalText = btn ? btn.innerText : "Speichern";
    if (btn) { btn.disabled = true; btn.innerText = "Speichere..."; }

    const exportData = [];
    appState.teams.forEach(team => {
        team.shooters.forEach(s => {
            exportData.push({
                id: String(s.id),
                name: String(s.name || ""),
                team: String(team.name || ""),
                stellung: (appState.activeModule === "gruppe")
                    ? (s.zone === "kniend" ? "Kniend" : "Liegend")
                    : ""
            });
        });
    });

    try {
        const res = await apiFetch('manager', 'action=saveManagerData', {
            method: 'POST',
            body: JSON.stringify({
                sheetName: config.sheetName,
                data: exportData          // ← konsistent: immer "data"
            })
        });

        const txt = await res.text();
        let data;
        try { data = JSON.parse(txt); }
        catch { throw new Error("Speichern: Backend-Antwort ist kein JSON"); }

        if (data.error) throw new Error(data.error);

        appState.isDirty = false;
        if (btn) {
            btn.innerText = "✅ OK";
            setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 1200);
        }

    } catch (e) {
        alert("Fehler beim Speichern: " + e.message);
        if (btn) { btn.disabled = false; btn.innerText = originalText; }
    }
}


// =========================================================
//  PDF EXPORT
// =========================================================
function toSafeFilename(str) {
    return String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");
}

function getDateStr() {
    return new Date().toLocaleDateString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function truncateToWidth(doc, text, maxWidth) {
    const s = String(text || "");
    if (doc.getTextWidth(s) <= maxWidth) return s;
    let out = s;
    while (out.length > 0 && doc.getTextWidth(out + "...") > maxWidth) {
        out = out.slice(0, -1);
    }
    return out.length ? (out + "...") : "";
}

function estimateTeamHeight(team, config) {
    const headerH = 14;
    const lineH = 7;
    let lines = 0;
    config.zones.forEach(z => {
        const shooters = team.shooters.filter(s =>
            config.zones.length === 1 ? true : s.zone === z.key
        );
        lines += shooters.length;
        if (config.zones.length > 1) lines += 1;
    });
    return headerH + (Math.max(lines, 1) * lineH) + 6;
}

function renderContestToPdf(doc, config, opts = {}) {
    const pdfTitle = config.pdfTitle || config.title;
    const dateStr = opts.dateStr || getDateStr();
    const twoCol = opts.twoCol !== false;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    let yPos = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(13, 110, 253);
    const titleLines = doc.splitTextToSize(String(pdfTitle), pageWidth - margin * 2);
    doc.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 7) + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generiert am: ${dateStr}`, margin, yPos);
    yPos += 12;

    const gap = 10;
    const colW = twoCol
        ? (pageWidth - (margin * 2) - gap) / 2
        : (pageWidth - (margin * 2));

    let col = 0;
    let rowMaxH = 0;

    const drawTeam = (team, x, y, w) => {
        doc.setFillColor(240, 242, 245);
        doc.rect(x, y, w, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(truncateToWidth(doc, team.name, w - 6), x + 2, y + 6);

        let yy = y + 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        let any = false;

        if (!team.shooters || team.shooters.length === 0) {
            doc.setTextColor(150);
            doc.text("- Keine Schützen -", x + 2, yy);
            yy += 7;
            any = true;
        } else {
            config.zones.forEach(zone => {
                const shooters = team.shooters.filter(s =>
                    config.zones.length === 1 ? true : s.zone === zone.key
                );
                if (config.zones.length > 1) {
                    doc.setTextColor(80);
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(9);
                    doc.text(`${zone.label}:`, x + 2, yy);
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    yy += 6;
                }
                shooters.forEach(s => {
                    doc.setTextColor(0);
                    doc.text(truncateToWidth(doc, "- " + String(s.name || ""), w - 6), x + 2, yy);
                    yy += 7;
                    any = true;
                });
            });
        }

        if (!any) {
            doc.setTextColor(150);
            doc.text("- Keine Daten -", x + 2, yy);
            yy += 7;
        }

        return yy - y;
    };

    const teams = appState.teams || [];
    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const needed = estimateTeamHeight(team, config);
        const x = twoCol ? (margin + (col === 1 ? (colW + gap) : 0)) : margin;

        if (yPos + needed > (pageHeight - margin)) {
            doc.addPage();
            yPos = 20;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(13, 110, 253);
            doc.text(String(pdfTitle), margin, yPos);
            yPos += 12;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generiert am: ${dateStr}`, margin, yPos);
            yPos += 12;
            col = 0;
            rowMaxH = 0;
        }

        const usedH = drawTeam(team, x, yPos, colW);
        rowMaxH = Math.max(rowMaxH, usedH);

        if (twoCol) {
            if (col === 0) { col = 1; }
            else { col = 0; yPos += rowMaxH + 6; rowMaxH = 0; }
        } else {
            yPos += usedH + 6;
        }
    }

    if (twoCol && col === 1) yPos += rowMaxH + 6;

    return { doc, dateStr, title: pdfTitle };
}

function buildPdfDoc() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("jsPDF nicht geladen. Bitte index.html prüfen (CDN Scripts).");
    }
    const { jsPDF } = window.jspdf;
    const config = CONTEST_CONFIG[appState.activeModule];
    const doc = new jsPDF();
    return renderContestToPdf(doc, config, { twoCol: true });
}

async function exportPDF() {
    try {
        const config = CONTEST_CONFIG[appState.activeModule];
        const { doc, dateStr } = buildPdfDoc();
        const base = config.fileBase || toSafeFilename(config.pdfTitle || config.title);
        doc.save(`${base}_${dateStr}.pdf`);
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

async function exportAllPDF() {
    try {
        const { doc, dateStr } = await buildAllPdfDoc();
        doc.save(`Alle_Module_${dateStr}.pdf`);
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

async function fetchContestDataForPdf(moduleKey) {
    const config = CONTEST_CONFIG[moduleKey];
    const params = `action=getManagerData&sheetName=${encodeURIComponent(config.sheetName)}`;
    const res = await apiFetch('manager', params);

    if (!res.ok) {
        const errTxt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} (${moduleKey}): ${errTxt.slice(0, 200)}`);
    }

    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); }
    catch { throw new Error(`Kein JSON (${moduleKey}): ${txt.slice(0, 200)}`); }

    if (data.error) throw new Error(`${moduleKey}: ${data.error}`);

    appState.activeModule = moduleKey;
    processContestData(data, config);
    return config;
}

async function buildAllPdfDoc() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("jsPDF nicht geladen.");
    }

    const prevState = (typeof structuredClone === "function")
        ? structuredClone(appState)
        : JSON.parse(JSON.stringify(appState));

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dateStr = getDateStr();
    const modules = ["grenzland", "mannschaft", "gruppe"];

    for (let i = 0; i < modules.length; i++) {
        if (i > 0) doc.addPage();
        const config = await fetchContestDataForPdf(modules[i]);
        renderContestToPdf(doc, config, { twoCol: true, dateStr });
    }

    appState = prevState;

    const managerView = document.getElementById('view-manager');
    if (managerView && managerView.classList.contains('active')) {
        ensureManagerShell();
        renderContestUI();
    }

    return { doc, dateStr };
}


// =========================================================
//  SMALL HELPERS
// =========================================================
function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeJs(str) {
    return String(str || "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}

