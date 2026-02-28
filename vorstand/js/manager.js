// Konstante am Anfang des Moduls definieren (ausserhalb jeder Funktion):
const LOGO_BASE64 = 'data:image/png;base64,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
'; // ganzer String
// Bild laden und Base64 ausgeben:


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
        defaultTeams: 3,
        zones: [{ key: "main", label: "Schützen", limit: 4 }]
    },
    "mannschaft": {
        title: "👥 Mannschafts-Meisterschaft",
        pdfTitle: "Mannschafts-Meisterschaft",
        fileBase: "Mannschaft",
        sheetName: "aktuell_Mannschaft",
        baseTeamName: "Muhen",
        defaultTeams: 3,
        zones: [{ key: "main", label: "Mannschaft (8)", limit: 8 }]
    },
    "gruppe": {
        title: "🎯 Gruppen-Meisterschaft (SGM)",
        pdfTitle: "Gruppen-Meisterschaft (SGM)",
        fileBase: "Gruppe_SGM",
        sheetName: "aktuell_Gruppe",
        baseTeamName: "Muhen",
        defaultTeams: 3,
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
            --toolbar-h: 76px;
        }

        /* --- Drag & Drop --- */
     .draggable-player {
    cursor: grab;
    user-select: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    min-height: 48px;
    display: flex;
    align-items: center;
    touch-action: manipulation; /* WICHTIG */
}
     /* Drag Handle – nur dieser Bereich triggert Drag */
.drag-handle {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 22px;
  display: flex; align-items: center; justify-content: center;
  cursor: grab;
  touch-action: none;   /* NUR hier Touch-Drag, Rest scrollt */
  color: #adb5bd;
  font-size: 13px;
  z-index: 1;
}
/* Player selbst scrollt normal */
.draggable-player {
  touch-action: pan-y;  /* pan-y statt manipulation/none */
}

        /* Drag Handle Icon */
        .draggable-player::before {
            content: '⋮⋮';
            position: absolute;
            left: 6px;
            color: #adb5bd;
            font-size: 14px;
            pointer-events: none;
        }
        .draggable-player .card-body {
            padding-left: 24px !important; /* Platz für Handle */
            width: 100%;
        }

        .dropzone {
            transition: background-color 0.2s, border-color 0.2s;
        }
        .dropzone.drag-over {
            background-color: rgba(25, 135, 84, 0.1) !important;
            border: 2px dashed var(--success) !important;
            animation: pulse-border 1.2s infinite;
        }
        @keyframes pulse-border {
            0% { border-color: rgba(25, 135, 84, 0.4); }
            50% { border-color: rgba(25, 135, 84, 1); }
            100% { border-color: rgba(25, 135, 84, 0.4); }
        }

        .zone-full {
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
        }

.pool-scroll-area {
    box-shadow: inset -3px 0 0 #dee2e6;
}

.teams-scroll-area {
    box-shadow: inset 3px 0 0 #dee2e6;
}

        .ghost-slot {
            border: 2px dashed #cbd5e1 !important;
            background: rgba(255,255,255,0.5);
            pointer-events: none;
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .drag-clone {
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
            border-left: 4px solid var(--primary);
            opacity: 0.95;
            width: 220px;
            transform: scale(1.05);
        }

        /* --- Desktop Sidebar --- */
        .sidebar-stack { display: flex; flex-direction: column; gap: .75rem; }
        .sidebar-card .card-header { padding: .45rem .65rem; }
        .sidebar-card .card-body { padding: .5rem; }

        .mail-body {
            max-height: var(--mail-max);
            overflow: auto;
            border: 2px dashed #ccc;
        }
     .pool-body {
    overflow: visible;             /* Mobile: kein eigener Scroll-Container */
}
@media (min-width: 768px) {
    .pool-body {
        max-height: var(--pool-max);
        overflow: auto;
    }
}

        /* --- Skeleton Loading --- */
        .skeleton-block {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            border-radius: 4px;
        }
        @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* --- Floating Action Button (FAB) Speed Dial --- */
        .fab-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1050;
            display: flex;
            flex-direction: column-reverse;
            align-items: center;
            gap: 12px;
        }
        .fab-main {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: var(--primary);
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, background-color 0.2s;
            cursor: pointer;
        }
        .fab-main.active {
            transform: rotate(45deg);
            background-color: var(--danger);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
        }
        .fab-menu {
            display: flex;
            flex-direction: column;
            gap: 12px;
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            pointer-events: none;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-container:hover .fab-menu,
        .fab-container.open .fab-menu {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        .fab-item {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: none;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            position: relative;
        }
        /* FAB Labels */
        .fab-item::before {
            content: attr(data-label);
            position: absolute;
            right: 56px;
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        .fab-item:hover::before { opacity: 1; }

        @media print {
            .no-print { display: none !important; }
            .card { break-inside: avoid; border: 1px solid #ccc !important; box-shadow: none !important; }
            body { background: white; }
            .fab-container { display: none !important; }
        }

        /* --- MOBILE SPECIFIC (< 768px) --- */
@media (max-width: 767px) {
  .manager-split {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 8px;
    height: calc(100dvh - var(--toolbar-h) - 80px);
    overflow: hidden;
  }

  /* Pool-Spalte: direkt scrollbar, simpel */
  .pool-scroll-area {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    height: 100%;
    border-right: 1px solid #dee2e6;
    padding-right: 4px;
  }

  /* sidebar-card nimmt gesamte Höhe, scrollt NICHT selbst */
  .sidebar-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  /* pool-body: kein eigener Scroll – das macht pool-scroll-area */
  .pool-body {
    overflow: visible !important;
    max-height: none !important;
    flex: 1;
  }

  /* Teams-Spalte: scrollbar */
  .teams-scroll-area {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    height: 100%;
  }

  /* Kompakte Namen */
  .pool-scroll-area .player-name {
    font-size: 0.75rem;
    max-width: 110px;
  }
  .teams-scroll-area .player-name {
    max-width: calc(100% - 30px);
  }
  .player-name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pool-scroll-area .draggable-player .card-body {
    padding: 4px 6px 4px 20px !important;
  }

  .mobile-tabs { display: none; }
  .mobile-sticky { position: static; border-bottom: none; }
  .sidebar-card .card-header { display: flex; }
}

                 
                    
                    
                    
                    
       
        /* Desktop Hides Mobile Tabs */
        @media (min-width: 768px) {
            .mobile-tabs { display: none; }
            .mobile-tab-content { display: contents; }
            .mobile-sticky { position: sticky; top: calc(var(--toolbar-h) + .5rem); align-self: flex-start; }
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
// Deep-copy des geladenen Moduls cachen
mailWizard.cachedModules[appState.activeModule] = {
    teams: JSON.parse(JSON.stringify(appState.teams)),
    pool: JSON.parse(JSON.stringify(appState.pool))
};

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
// =========================================================
//  UI Shell & Skeleton
// =========================================================
function ensureManagerShell() {
    const host = document.getElementById('manager-container');
    if (!host) return;
    if (document.getElementById('manager-app')) return;

    host.innerHTML = `
      <div class="container-fluid py-3" id="manager-app">

        <!-- TOOLBAR: Minimalistisch für Mobile -->
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
            <div class="d-none d-md-flex gap-2"> <!-- Desktop Only Buttons -->
                <button class="btn btn-outline-dark btn-sm" onclick="exportPDF()" title="PDF Export">
                    <i class="fas fa-file-pdf text-danger"></i> PDF
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="exportAllPDF()" title="Alle 3 Module">
                    <i class="fas fa-layer-group"></i> Alle
                </button>
                <button id="btn-save-manager-desktop" class="btn btn-success btn-sm fw-bold" onclick="saveContest()">
                    <i class="fas fa-save"></i> Speichern
                </button>
            </div>
        </div>

        <!-- MAIN CONTENT -->
        <div id="manager-inner" class="row g-3 h-100">
            <!-- Wird von renderLoadingState gefüllt -->
        </div>

        <!-- FAB Speed Dial (Mobile & Quick Access) -->
        <div class="fab-container no-print" id="fab-container">
            <button class="fab-main" onclick="document.getElementById('fab-container').classList.toggle('open')">
                <i class="fas fa-plus"></i>
            </button>
            <div class="fab-menu">
                <button class="fab-item bg-success" data-label="Speichern" onclick="saveContest(); document.getElementById('fab-container').classList.remove('open')">
                    <i class="fas fa-save"></i>
                </button>
                <button class="fab-item bg-warning text-dark" data-label="Alle PDFs" onclick="exportAllPDF(); document.getElementById('fab-container').classList.remove('open')">
                    <i class="fas fa-layer-group"></i>
                </button>
                <button class="fab-item bg-danger" data-label="PDF Aktuell" onclick="exportPDF(); document.getElementById('fab-container').classList.remove('open')">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="fab-item bg-dark" data-label="Mail Senden" onclick="openMailWizard(); document.getElementById('fab-container').classList.remove('open')">
                    <i class="fas fa-paper-plane"></i>
                </button>
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
    
    // Skeleton Screen statt einfachem Spinner
    inner.innerHTML = `
        <div class="col-md-4 d-none d-md-block">
            <div class="skeleton-block mb-3" style="height: 200px;"></div>
            <div class="skeleton-block" style="height: 400px;"></div>
        </div>
        <div class="col-12 col-md-8">
            <div class="row g-3">
                <div class="col-xl-6 col-12"><div class="skeleton-block" style="height: 250px;"></div></div>
                <div class="col-xl-6 col-12"><div class="skeleton-block" style="height: 250px;"></div></div>
                <div class="col-xl-6 col-12"><div class="skeleton-block" style="height: 250px;"></div></div>
            </div>
            <div class="text-center mt-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                Lade ${escapeHtml(config.title)}...
            </div>
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
// =========================================================
//  RENDER UI (Tab-System für Mobile)
// =========================================================
function renderContestUI() {
  console.log(typeof CONTEST_CONFIG); // sollte "object" zurückgeben
console.log("renderContestUI läuft");
  const config = CONTEST_CONFIG[appState.activeModule];
  const container = document.getElementById('manager-inner');
  if (!container) return;

  const poolScroll = document.querySelector('.pool-scroll-area')?.scrollTop || 0;
  const teamsScroll = document.querySelector('.teams-scroll-area')?.scrollTop || 0;

  const teamsHtml = appState.teams.map(team => renderTeamCard(team, config)).join('');

  container.innerHTML = `
    <div class="manager-split col-12">
      <div class="pool-scroll-area">
        <div class="sidebar-stack">
          <div class="card shadow-sm border-secondary sidebar-card">
            <div class="card-header bg-secondary text-white py-2">
              <i class="fas fa-users"></i> Pool
              <input type="text" class="form-control form-control-sm mt-1"
                placeholder="Suchen…" onkeyup="filterPool(this.value)">
            </div>
            <div class="card-body dropzone bg-light pool-body" data-target-type="pool">
              ${appState.pool.map(renderPlayerItem).join('')}
              ${appState.pool.length === 0
                ? '<div class="text-muted text-center small mt-3 py-3">Alle eingeteilt ✓</div>'
                : ''}
            </div>
            <div class="card-footer small text-muted text-center py-1">
              ${appState.pool.length} verfügbar
            </div>
          </div>
        </div>
      </div>
      <div class="teams-scroll-area">
        <div class="row g-3" id="teams-area">
          ${teamsHtml}
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const ps = document.querySelector('.pool-scroll-area');
    const ts = document.querySelector('.teams-scroll-area');
    if (ps) ps.scrollTop = poolScroll;
    if (ts) ts.scrollTop = teamsScroll;
  });
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
         style="border-left: 3px solid var(--primary) !important; overflow:hidden;">
      <div class="drag-handle">⠿</div>
      <div class="card-body p-1 px-2 pointer-events-none" style="padding-left:26px !important;">
        <div class="player-row pointer-events-none">
          <span class="player-name small fw-bold pointer-events-none"
                style="display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%;">
            ${escapeHtml(player.name)}
          </span>
        </div>
      </div>
    </div>
  `;
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
// =====================================================
// MOBILE TOUCH FIXED VERSION
// =====================================================
// --- MOBILE TOUCH ---
// --- MOBILE TOUCH (iOS-safe) ---
function onTouchMove(e) {
    if (!dragId || !touchClone) return;
    e.preventDefault();
    const touch = e.touches[0];
    moveClone(touch.clientX, touch.clientY);
    removeDropHighlights();
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = elemBelow ? elemBelow.closest('.dropzone') : null;
    if (zone) zone.classList.add('drag-over');
}

document.addEventListener('touchstart', (e) => {
    const handle = e.target.closest('.drag-handle');
    const el = handle ? handle.closest('.draggable-player') : null;
    if (!el) return;

    e.preventDefault();
    dragId = el.dataset.id;
    dragSrcEl = el;
    touchClone = el.cloneNode(true);
    touchClone.classList.add('drag-clone');
    document.body.appendChild(touchClone);
    const touch = e.touches[0];
    moveClone(touch.clientX, touch.clientY);
    el.style.opacity = '0.4';
    if (navigator.vibrate) navigator.vibrate(25);

    // Erst JETZT touchmove aktivieren → iOS scrollt sonst wieder normal
    document.addEventListener('touchmove', onTouchMove, { passive: false });
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (!dragId) return;
    const touch = e.changedTouches[0];
    if (touchClone) touchClone.style.display = 'none';
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = elemBelow ? elemBelow.closest('.dropzone') : null;
    if (zone) handleDrop(dragId, zone);
    if (touchClone) touchClone.remove();
    if (dragSrcEl) dragSrcEl.style.opacity = '1';
    removeDropHighlights();
    document.querySelectorAll('.drag-clone').forEach(el => el.remove());
    document.querySelectorAll('.draggable-player').forEach(el => el.style.opacity = '1');
    dragId = null; touchClone = null; dragSrcEl = null;

    // Listener wieder entfernen → iOS scrollt wieder frei
    document.removeEventListener('touchmove', onTouchMove);
});
}


function moveClone(x, y) {
    if (touchClone) {
        touchClone.style.left = (x - 20) + 'px';
        touchClone.style.top  = (y - 20) + 'px';
    }
}

function removeDropHighlights() {
    document.querySelectorAll('.dropzone').forEach(z => z.classList.remove('drag-over'));
}
// =========================================================
//  LOGIK
// =========================================================
// =========================================================
//  LOGIK (mit Haptic Feedback)
// =========================================================
function handleDrop(playerId, targetZone) {
    const targetType = targetZone.dataset.targetType;

    // Haptic Feedback bei Drop
    if (navigator.vibrate) navigator.vibrate(20);

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
        if (currentCount >= limit) return; // Zone voll

        // Success Haptic Pattern bei erfolgreichem Zuweisen
        if (navigator.vibrate) setTimeout(() => navigator.vibrate([30, 50, 30]), 50);

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
// =========================================================
//  MAIL WIZARD
// =========================================================
const mailWizard = {
    step: 1,
    recipientGroups: { grenzland: false, mannschaft: false, gruppe: false, allMembers: false },
    pdfAttachments: { grenzland: false, mannschaft: false, gruppe: false, none: true },
    excludedIds: new Set(),
    resolvedRecipients: [],
    cachedModules: { grenzland: null, mannschaft: null, gruppe: null }
};

function openMailWizard() {
    // Aktives Modul vorselektieren
    mailWizard.step = 1;
    mailWizard.recipientGroups = { grenzland: false, mannschaft: false, gruppe: false, allMembers: false };
    mailWizard.recipientGroups[appState.activeModule] = true;
    mailWizard.pdfAttachments = { grenzland: false, mannschaft: false, gruppe: false, none: true };
    mailWizard.pdfAttachments[appState.activeModule] = true;
    mailWizard.pdfAttachments.none = false;
    mailWizard.excludedIds = new Set();
    mailWizard.resolvedRecipients = [];

    // Modal ins DOM einfügen falls noch nicht vorhanden
    if (!document.getElementById('mailWizardModal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="mailWizardModal" tabindex="-1">
              <div class="modal-dialog modal-lg modal-fullscreen-sm-down">
                <div class="modal-content">
                  <div class="modal-header bg-dark text-white">
                    <h5 class="modal-title"><i class="fas fa-paper-plane me-2"></i>Mail senden</h5>
                    <span class="badge bg-secondary ms-2" id="mail-step-badge">Schritt 1 / 4</span>
                    <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body" id="mail-wizard-body" style="min-height:260px;"></div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" id="mail-btn-back" onclick="mailWizardBack()">← Zurück</button>
                    <button class="btn btn-primary" id="mail-btn-next" onclick="mailWizardNext()">Weiter →</button>
                  </div>
                </div>
              </div>
            </div>
        `);
    }

    renderMailStep();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('mailWizardModal')).show();
}

function renderMailStep() {
    const body = document.getElementById('mail-wizard-body');
    const badge = document.getElementById('mail-step-badge');
    const btnBack = document.getElementById('mail-btn-back');
    const btnNext = document.getElementById('mail-btn-next');
    if (!body) return;

    badge.textContent = `Schritt ${mailWizard.step} / 4`;
    btnBack.style.display = mailWizard.step === 1 ? 'none' : 'inline-block';
    btnNext.innerHTML = mailWizard.step === 4
        ? '<i class="fas fa-paper-plane"></i> Senden'
        : 'Weiter →';
    btnNext.className = mailWizard.step === 4
        ? 'btn btn-success fw-bold'
        : 'btn btn-primary';

    if (mailWizard.step === 1) {
        const moduleLabels = { grenzland: '🛡️ Grenzland-Schützen', mannschaft: '👥 Mannschaft-Schützen', gruppe: '🎯 Gruppe-Schützen' };
        body.innerHTML = `
            <h6 class="fw-bold mb-3">Empfänger-Gruppen</h6>
            ${Object.entries(moduleLabels).map(([key, label]) => {
                const cached = mailWizard.cachedModules[key];
                const count = cached ? cached.teams.reduce((s, t) => s + t.shooters.length, 0) : null;
                const badge = cached
                    ? `<span class="badge bg-light text-dark border ms-2">${count} Schützen</span>`
                    : `<span class="badge bg-warning text-dark ms-2">nicht geladen</span>`;
                return `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="rg_${key}"
                        ${mailWizard.recipientGroups[key] ? 'checked' : ''}
                        onchange="mailWizard.recipientGroups['${key}'] = this.checked">
                    <label class="form-check-label" for="rg_${key}">
                        ${label} ${badge}
                    </label>
                </div>`;
            }).join('')}
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="rg_all"
                    ${mailWizard.recipientGroups.allMembers ? 'checked' : ''}
                    onchange="mailWizard.recipientGroups.allMembers = this.checked">
                <label class="form-check-label" for="rg_all">
                    👤 Alle Mitglieder
                    <span class="badge bg-light text-dark border ms-2">${appState.members.length} Personen</span>
                </label>
            </div>
        `;
    }

    else if (mailWizard.step === 2) {
        body.innerHTML = `
            <h6 class="fw-bold mb-3">PDF-Anhänge</h6>
            ${['grenzland','mannschaft','gruppe'].map(key => {
                const labels = { grenzland: '🛡️ PDF Grenzland', mannschaft: '👥 PDF Mannschaft', gruppe: '🎯 PDF Gruppe' };
                const cached = mailWizard.cachedModules[key];
                return `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="pa_${key}"
                        ${mailWizard.pdfAttachments[key] ? 'checked' : ''}
                        ${!cached ? 'disabled' : ''}
                        onchange="mailWizard.pdfAttachments['${key}'] = this.checked; mailWizard.pdfAttachments.none = false; document.getElementById('pa_none').checked=false;">
                    <label class="form-check-label ${!cached ? 'text-muted' : ''}" for="pa_${key}">
                        ${labels[key]} ${!cached ? '<span class="badge bg-warning text-dark ms-1">nicht geladen</span>' : ''}
                    </label>
                </div>`;
            }).join('')}
            <div class="form-check mt-3">
                <input class="form-check-input" type="radio" id="pa_none"
                    ${mailWizard.pdfAttachments.none ? 'checked' : ''}
                    onchange="mailWizard.pdfAttachments={grenzland:false,mannschaft:false,gruppe:false,none:true}">
                <label class="form-check-label" for="pa_none">Kein Anhang</label>
            </div>
        `;
    }

    else if (mailWizard.step === 3) {
        buildRecipientList();
        const list = mailWizard.resolvedRecipients;
        if (list.length === 0) {
            body.innerHTML = `<div class="alert alert-warning">Keine Empfänger mit E-Mail-Adresse gefunden.</div>`;
            return;
        }
        const sourceLabel = { grenzland: '🛡️', mannschaft: '👥', gruppe: '🎯', all: '👤' };
        body.innerHTML = `
            <h6 class="fw-bold mb-1">Empfänger ausschliessen</h6>
            <p class="text-muted small mb-3">${list.length} Empfänger gefunden – deaktiviere einzelne zum Ausschliessen.</p>
            <div style="max-height:350px; overflow-y:auto;">
            ${list.map(p => `
                <div class="form-check mb-1">
                    <input class="form-check-input" type="checkbox" id="ex_${p.id}"
                        ${mailWizard.excludedIds.has(p.id) ? '' : 'checked'}
                        onchange="if(!this.checked) mailWizard.excludedIds.add('${p.id}'); else mailWizard.excludedIds.delete('${p.id}');">
                    <label class="form-check-label small" for="ex_${p.id}">
                        ${sourceLabel[p.source] || ''} <strong>${escapeHtml(p.name)}</strong>
                        <span class="text-muted">${escapeHtml(p.email)}</span>
                    </label>
                </div>
            `).join('')}
            </div>
        `;
    }

    else if (mailWizard.step === 4) {
        const final = mailWizard.resolvedRecipients.filter(p => !mailWizard.excludedIds.has(p.id));
        const pdfs = Object.entries(mailWizard.pdfAttachments)
            .filter(([k, v]) => v && k !== 'none')
            .map(([k]) => k);
        body.innerHTML = `
            <h6 class="fw-bold mb-3">Zusammenfassung</h6>
            <div class="alert alert-light border">
                <div><i class="fas fa-users me-2 text-primary"></i><strong>${final.length}</strong> Empfänger</div>
                <div class="mt-2"><i class="fas fa-paperclip me-2 text-secondary"></i>
                    ${pdfs.length ? pdfs.map(k => `PDF ${k}`).join(', ') : 'Kein Anhang'}
                </div>
            </div>
            <p class="small text-muted">Die E-Mails werden als BCC-Entwurf in Gmail erstellt.</p>
        `;
    }
}

function mailWizardNext() {
    if (mailWizard.step === 4) {
        executeMailSend();
        return;
    }
    // Validierung Step 1
    if (mailWizard.step === 1) {
        const anySelected = Object.values(mailWizard.recipientGroups).some(v => v);
        if (!anySelected) { alert('Bitte mindestens eine Empfänger-Gruppe wählen.'); return; }
    }
    mailWizard.step++;
    renderMailStep();
}

function mailWizardBack() {
    if (mailWizard.step <= 1) return;
    mailWizard.step--;
    renderMailStep();
}

function buildRecipientList() {
    const seen = new Set();
    mailWizard.resolvedRecipients = [];

    const addFromModule = (key) => {
        const cached = mailWizard.cachedModules[key];
        if (!cached) return;
        cached.teams.forEach(t => t.shooters.forEach(s => {
            if (!seen.has(s.id) && s.email) {
                seen.add(s.id);
                mailWizard.resolvedRecipients.push({ ...s, source: key });
            }
        }));
    };

    if (mailWizard.recipientGroups.grenzland)  addFromModule('grenzland');
    if (mailWizard.recipientGroups.mannschaft) addFromModule('mannschaft');
    if (mailWizard.recipientGroups.gruppe)     addFromModule('gruppe');
    if (mailWizard.recipientGroups.allMembers) {
        appState.members.forEach(m => {
            if (!seen.has(m.id) && m.email) {
                seen.add(m.id);
                mailWizard.resolvedRecipients.push({
                    id: m.id, name: `${m.nachname} ${m.vorname}`.trim(),
                    email: m.email, source: 'all'
                });
            }
        });
    }
}

async function executeMailSend() {
    const final = mailWizard.resolvedRecipients.filter(p => !mailWizard.excludedIds.has(p.id));
    const mails = final.map(p => p.email);
    if (!mails.length) { alert('Keine Empfänger.'); return; }

    const btnNext = document.getElementById('mail-btn-next');
    btnNext.disabled = true;
    btnNext.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sende…';

    try {
        const pdfsToAttach = Object.entries(mailWizard.pdfAttachments)
            .filter(([k, v]) => v && k !== 'none').map(([k]) => k);

        let pdfBase64 = null, fileName = null;
        if (pdfsToAttach.length > 0 && window.jspdf?.jsPDF) {
            // PDF für aktives Modul generieren (vereinfacht)
            const { doc, dateStr } = buildPdfDoc();
            pdfBase64 = doc.output('datauristring').split(',')[1];
            fileName = `Aufgebot_${dateStr}.pdf`;
        }

        const config = CONTEST_CONFIG[appState.activeModule];
        const res = await apiFetch('manager', 'action=sendMail', {
            method: 'POST',
            body: JSON.stringify({
                recipients: mails,
                subject: `Aufgebot ${config.pdfTitle || config.title}`,
                body: `Hallo\n\nIm Anhang findest du das aktuelle Aufgebot.\n\nFreundliche Grüsse\nSportschützen Muhen`,
                pdfBase64, fileName
            })
        });

        const data = JSON.parse(await res.text());
        if (data.error) throw new Error(data.error);

        bootstrap.Modal.getInstance(document.getElementById('mailWizardModal')).hide();
        showToast(`✅ Entwurf für ${mails.length} Empfänger erstellt!`, 'success');

    } catch (e) {
        alert('Fehler: ' + e.message);
    } finally {
        btnNext.disabled = false;
        btnNext.innerHTML = '<i class="fas fa-paper-plane"></i> Senden';
    }
}

// =========================================================
//  SAVE
// =========================================================
async function saveContest() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const btn = document.getElementById('btn-save-manager-desktop');
    const fabSaveBtn = document.querySelector('#fab-container .fab-item.bg-success');

    const setLoading = () => {
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Speichert…'; }
        if (fabSaveBtn) fabSaveBtn.disabled = true;
    };
    const setSuccess = () => {
        // Desktop-Button
        if (btn) {
            btn.disabled = false;
            btn.className = 'btn btn-outline-success btn-sm fw-bold';
            btn.innerHTML = '<i class="fas fa-check"></i> Gespeichert!';
            setTimeout(() => {
                btn.className = 'btn btn-success btn-sm fw-bold';
                btn.innerHTML = '<i class="fas fa-save"></i> Speichern';
            }, 2000);
        }
        if (fabSaveBtn) fabSaveBtn.disabled = false;
        // Toast für Mobile
        showToast('✅ Gespeichert!', 'success');
    };
    const setError = () => {
        if (btn) { btn.disabled = false; btn.className = 'btn btn-success btn-sm fw-bold'; btn.innerHTML = '<i class="fas fa-save"></i> Speichern'; }
        if (fabSaveBtn) fabSaveBtn.disabled = false;
    };

    setLoading();
    const exportData = [];
    appState.teams.forEach(team => {
        team.shooters.forEach(s => {
            exportData.push({
                id: String(s.id), name: String(s.name || ""),
                team: String(team.name || ""),
                stellung: appState.activeModule === "gruppe" ? (s.zone === "kniend" ? "Kniend" : "Liegend") : ""
            });
        });
    });

    try {
        const res = await apiFetch('manager', 'action=saveManagerData', {
            method: 'POST',
            body: JSON.stringify({ sheetName: config.sheetName, data: exportData })
        });
        const txt = await res.text();
        let data;
        try { data = JSON.parse(txt); } catch { throw new Error("Speichern: Backend-Antwort ist kein JSON"); }
        if (data.error) throw new Error(data.error);
        appState.isDirty = false;
        setSuccess();
    } catch (e) {
        alert("Fehler beim Speichern: " + e.message);
        setError();
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

function showToast(message, type = 'success') {
    const existing = document.getElementById('manager-toast');
    if (existing) existing.remove();
    const bg = type === 'success' ? '#198754' : '#dc3545';
    const toast = document.createElement('div');
    toast.id = 'manager-toast';
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: ${bg}; color: white; padding: 10px 20px; border-radius: 8px;
        font-weight: bold; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 15px; pointer-events: none;
        animation: fadeInUp 0.2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
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

    doc.addImage(LOGO_BASE64, 'PNG', 10, 8, 25, 25); // x, y, breite, höhe in mm
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
