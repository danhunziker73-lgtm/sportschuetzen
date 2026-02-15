// === KONFIGURATION DER WETTBEWERBE ===
const CONTEST_CONFIG = {
    "grenzland": {
        title: "🛡️ Grenzland Cup",
        sheetName: "aktuell_Grenzland",
        baseTeamName: "Muhen",
        defaultTeams: 4,
        zones: [
            { key: "main", label: "Schützen", limit: 4 }
        ]
    },
    "mannschaft": {
        title: "👥 Mannschafts-Meisterschaft",
        sheetName: "aktuell_Mannschaft",
        baseTeamName: "Muhen", // Auch hier Muhen 1, 2 etc.
        defaultTeams: 1,
        zones: [
            { key: "main", label: "Mannschaft (8)", limit: 8 }
        ]
    },
    "gruppe": {
        title: "🎯 Gruppen-Meisterschaft (SGM)",
        sheetName: "aktuell_Gruppe",
        baseTeamName: "Muhen",
        defaultTeams: 2,
        zones: [
            { key: "liegend", label: "Liegend (3)", limit: 3 },
            { key: "kniend",  label: "Kniend (2)",  limit: 2 }
        ]
    }
};

// === GLOBALER STATE ===
let appState = {
    activeModule: "grenzland",
    members: [],
    teams: [],
    pool: [],
    isDirty: false // Trackt ungespeicherte Änderungen
};

// === INIT & LADEN ===

async function loadContestData(moduleKey) {
    // Sicherheits-Check bei ungespeicherten Daten
    if (appState.isDirty) {
        if (!confirm("Du hast ungespeicherte Änderungen! Wirklich wechseln? Die Änderungen gehen verloren.")) {
            // Dropdown zurücksetzen (visuell)
            document.getElementById('module-selector').value = appState.activeModule;
            return;
        }
    }

    // Fallback falls kein Parameter
    if (!moduleKey) moduleKey = appState.activeModule;
    appState.activeModule = moduleKey;
    appState.isDirty = false;

    const config = CONTEST_CONFIG[moduleKey];
    
    const container = document.getElementById('grenzland-container');
    container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade ${config.title}...</p></div>`;

    try {
        // Backend Request (nutzt generischen Endpoint)
        const res = await apiFetch('grenzland', 'action=getGrenzlandData'); 
        const data = await res.json();
        
        processContestData(data, config);
        renderContestUI();
        
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
    }
}

// Wrapper für Kompatibilität mit index.html
function loadGrenzlandData() { loadContestData("grenzland"); }


// === DATEN VERARBEITUNG ===

function processContestData(data, config) {
    appState.members = data.members || [];
    appState.teams = []; 
    appState.pool = [];

    const assignedIds = new Set();
    
    // Daten aus dem gewählten Sheet (oder Fallback)
    // Achtung: Backend liefert evtl. immer alles in 'grenzland' oder 'members'
    // Hier gehen wir davon aus, dass wir filtern müssen oder das Backend passendes liefert.
    // Da wir vorerst denselben Backend-Call nutzen, müssen wir client-seitig schauen, 
    // ob wir Daten für das aktuelle Modul filtern können. 
    // VEREINFACHUNG: Wir laden immer frisch und das Backend liefert (hoffentlich) die richtigen Sheet-Daten
    // Wenn das Backend für alle Module gleich antwortet, müssen wir hier mapping betreiben.
    // Für jetzt nehmen wir an: data.grenzland enthält die Zeilen des aktuellen Sheets.
    
    const sheetData = data[config.sheetName] || data.grenzland || []; 

    const tempTeams = {};

    sheetData.forEach(row => {
        // ID oder Name match
        const rowIdStr = String(row.schuetze_id || row.id || row.schuetze || row.name || "").trim();
        
        // Versuchen den Schützen in der Mitgliederliste zu finden
        let member = appState.members.find(m => String(m.id) === rowIdStr || `${m.nachname} ${m.vorname}` === rowIdStr);
        
        // Wenn nicht gefunden, aber Name existiert (z.B. manueller Eintrag), bauen wir Dummy
        if (!member && rowIdStr.length > 2) {
             // Fallback falls ID eigentlich der Name ist
             member = { id: rowIdStr, nachname: rowIdStr, vorname: "", dummy: true };
        }

        if (member) {
            const teamName = row.runde_1_team || row.team || "Pool";
            
            // Logik für Gruppe: Woher wissen wir ob Liegend/Kniend?
            // Wenn Spalte B (Stellung) im Backend gelesen wird, müsste sie hier ankommen.
            // Wir nehmen an: row.stellung oder row.pos existiert, ODER wir raten.
            // Falls das Backend 'stellung' liefert:
            let zoneKey = config.zones[0].key; // Default
            
            if (config.zones.length > 1) {
                const stellung = String(row.stellung || row.runde_1_pkt || "").toLowerCase(); // Missbrauch pkt spalte falls nötig
                if (stellung.includes("kniend")) zoneKey = "kniend";
                else zoneKey = "liegend";
            }

            if (teamName !== "Pool" && teamName) {
                if (!tempTeams[teamName]) tempTeams[teamName] = { name: teamName, shooters: [] };
                
                tempTeams[teamName].shooters.push({
                    id: member.id,
                    nachname: member.nachname, // Wichtig fürs Speichern
                    vorname: member.vorname,
                    name: `${member.nachname} ${member.vorname}`,
                    pkt: row.runde_1_pkt || "", // Punkte oder leer
                    zone: zoneKey
                });
                if (!member.dummy) assignedIds.add(String(member.id));
            }
        }
    });

    // Teams sortieren
    if (Object.keys(tempTeams).length > 0) {
        appState.teams = Object.values(tempTeams).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    } else {
        // Defaults
        for(let i=1; i <= config.defaultTeams; i++) addTeamToState(false);
    }

    // Rest in Pool
    appState.members.forEach(m => {
        if (!assignedIds.has(String(m.id))) {
            appState.pool.push({
                id: m.id,
                nachname: m.nachname,
                vorname: m.vorname,
                name: `${m.nachname} ${m.vorname}`,
                pkt: ""
            });
        }
    });
}


// === STATE MANAGEMENT ===

function addTeamToState(render = true) {
    const config = CONTEST_CONFIG[appState.activeModule];
    let nextNum = 1;
    // Smarte Nummerierung: Lücken füllen oder hochzählen
    const existingNums = appState.teams.map(t => {
        const match = t.name.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    });
    while (existingNums.includes(nextNum)) nextNum++;

    appState.teams.push({
        name: `${config.baseTeamName} ${nextNum}`,
        shooters: []
    });
    appState.isDirty = true;
    if(render) renderContestUI();
}

function removeTeamFromState(teamName) {
    if(!confirm(`Team "${teamName}" und alle Schützen auflösen?`)) return;
    
    const teamIdx = appState.teams.findIndex(t => t.name === teamName);
    if (teamIdx === -1) return;

    const team = appState.teams[teamIdx];
    team.shooters.forEach(s => {
        s.pkt = ""; 
        s.zone = null;
        appState.pool.push(s);
    });

    appState.teams.splice(teamIdx, 1);
    appState.isDirty = true;
    renderContestUI();
}


// === UI RENDERING ===

function renderContestUI() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const container = document.getElementById('grenzland-container');
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2 border-bottom" style="z-index:10;">
            <div class="d-flex align-items-center gap-3">
                <select id="module-selector" class="form-select fw-bold border-primary text-primary" style="width:auto;" onchange="loadContestData(this.value)">
                    <option value="grenzland" ${appState.activeModule==='grenzland'?'selected':''}>🛡️ Grenzland Cup</option>
                    <option value="mannschaft" ${appState.activeModule==='mannschaft'?'selected':''}>👥 Mannschaft</option>
                    <option value="gruppe" ${appState.activeModule==='gruppe'?'selected':''}>🎯 Gruppe (SGM)</option>
                </select>
                <button class="btn btn-outline-secondary btn-sm" onclick="addTeamToState()">
                    <i class="fas fa-plus"></i> Team
                </button>
            </div>
            <button class="btn btn-success fw-bold" onclick="saveContest()">💾 Speichern</button>
        </div>
        
        <div class="row h-100 g-3">
            <div class="col-lg-9 col-md-8">
                <div class="row g-3" id="teams-grid">
                    ${appState.teams.map(team => renderTeamCard(team, config)).join('')}
                </div>
            </div>

            <div class="col-lg-3 col-md-4">
                <div class="card shadow-sm border-secondary h-100" style="max-height: calc(100vh - 150px); display:flex; flex-direction:column;">
                    <div class="card-header bg-secondary text-white py-2">
                        <i class="fas fa-users"></i> Pool
                        <input type="text" class="form-control form-control-sm mt-2" placeholder="Suchen..." onkeyup="filterPool(this.value)">
                    </div>
                    <!-- POOL DROPZONE -->
                    <div class="card-body p-2 dropzone bg-light overflow-auto" data-target-type="pool" style="flex:1;">
                        ${appState.pool.map(s => renderPlayerItem(s)).join('')}
                    </div>
                    <div class="card-footer small text-muted text-center">
                        ${appState.pool.length} verfügbar
                    </div>
                </div>
            </div>
        </div>
    `;

    initDragAndDrop();
    updateAllCounts(); // Zählt Schützen statt Punkte
}

function renderTeamCard(team, config) {
    const zonesHtml = config.zones.map((zone, index) => {
        // Schützen für diese Zone filtern
        const shootersInZone = team.shooters.filter(s => {
            if (config.zones.length === 1) return true;
            return s.zone === zone.key;
        });

        const bgStyle = config.zones.length > 1 ? (index % 2 === 0 ? 'background:#fff;' : 'background:#f8f9fa;') : 'background:#fff;';
        
        // Zähler für Zone (z.B. 2/3)
        const countBadge = `<span class="badge ${shootersInZone.length > zone.limit ? 'bg-danger' : 'bg-light text-dark border'} float-end">${shootersInZone.length} / ${zone.limit}</span>`;

        return `
            <div class="team-zone p-2 mb-1 border rounded dropzone position-relative" 
                 style="${bgStyle} min-height: 80px;"
                 data-team="${team.name}" 
                 data-zone="${zone.key}"
                 data-limit="${zone.limit}">
                
                ${config.zones.length > 1 ? `<div class="small text-muted fw-bold mb-2 text-uppercase">${zone.label} ${countBadge}</div>` : ''}
                
                ${shootersInZone.map(s => renderPlayerItem(s, team.name)).join('')}
            </div>
        `;
    }).join('');

    return `
        <div class="col-xl-4 col-lg-6 col-12">
            <div class="card shadow-sm h-100 border-0">
                <div class="card-header d-flex justify-content-between align-items-center bg-white border-bottom-0 pt-3">
                    <h5 class="m-0 fw-bold text-primary">${team.name}</h5>
                    <button class="btn btn-link text-danger p-0" onclick="removeTeamFromState('${team.name}')"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="card-body p-2">
                    ${zonesHtml}
                </div>
                <div class="card-footer bg-white border-top-0 pt-0 pb-3">
                    <div class="d-flex justify-content-between align-items-center bg-light rounded p-2">
                        <span class="small fw-bold text-muted">SCHÜTZEN</span>
                        <span class="fw-bold" id="count-${team.name.replace(/\s+/g,'-')}">0</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPlayerItem(player, teamName = null) {
    const config = CONTEST_CONFIG[appState.activeModule];
    // Punktefeld nur anzeigen wenn nicht Gruppe (bei Gruppe zählt nur Position, oder?)
    // User hat nicht spezifiziert, ob Gruppe Punkte braucht. Wir lassen es vorerst weg bei Gruppe.
    
    let extraField = '';
    if (teamName && appState.activeModule !== 'gruppe') {
        extraField = `<input type="number" class="form-control form-control-sm p-0 text-center fw-bold border-0 bg-transparent" 
             style="width: 40px;" value="${player.pkt}" placeholder="-" 
             onclick="this.select()" 
             onchange="updatePoints('${teamName}', '${player.id}', this.value)">`;
    }

    return `
        <div class="card mb-2 draggable-player border-0 shadow-sm" 
             draggable="true" 
             data-id="${player.id}" 
             style="cursor:grab; border-left: 4px solid var(--primary) !important;">
            <div class="card-body p-2 d-flex align-items-center justify-content-between">
                <div class="text-truncate" style="max-width: 80%;">
                    <span class="fw-bold small player-name">${player.name}</span>
                </div>
                ${extraField}
            </div>
        </div>
    `;
}

// === DRAG & DROP LOGIK ===

let draggedItem = null;

function initDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-player');
    const dropzones = document.querySelectorAll('.dropzone');

    draggables.forEach(d => {
        d.addEventListener('dragstart', () => { draggedItem = d; d.style.opacity = '0.5'; });
        d.addEventListener('dragend', () => { d.style.opacity = '1'; draggedItem = null; });
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('bg-primary-subtle');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('bg-primary-subtle');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('bg-primary-subtle');
            
            if (!draggedItem) return;

            const playerId = draggedItem.dataset.id;
            const targetTeam = zone.dataset.team; 
            const targetZoneKey = zone.dataset.zone;
            const targetType = zone.dataset.targetType; // "pool"

            // LIMIT PRÜFUNG (Wichtig für Gruppe!)
            if (targetType !== "pool") {
                const limit = parseInt(zone.dataset.limit);
                const team = appState.teams.find(t => t.name === targetTeam);
                
                // Zähle Schützen in dieser Zone, ABER ignoriere mich selbst (falls ich nur innerhalb verschoben werde)
                const currentCount = team.shooters.filter(s => s.zone === targetZoneKey && String(s.id) !== String(playerId)).length;
                
                if (currentCount >= limit) {
                    alert(`⚠️ Zone ist voll! Maximal ${limit} Schützen erlaubt.`);
                    return; // Abbruch
                }
            }

            movePlayerInState(playerId, targetTeam, targetZoneKey);
            renderContestUI();
        });
    });
}

function movePlayerInState(playerId, targetTeamName, targetZoneKey) {
    let player = null;
    appState.isDirty = true;

    // 1. Finden & Entfernen
    const poolIdx = appState.pool.findIndex(p => String(p.id) === String(playerId));
    if (poolIdx > -1) {
        player = appState.pool.splice(poolIdx, 1)[0];
    } else {
        for (const team of appState.teams) {
            const sIdx = team.shooters.findIndex(s => String(s.id) === String(playerId));
            if (sIdx > -1) {
                player = team.shooters.splice(sIdx, 1)[0];
                break;
            }
        }
    }

    if (!player) return;

    // 2. Einfügen
    if (!targetTeamName) {
        // In den Pool
        player.pkt = ""; 
        player.zone = null;
        appState.pool.push(player);
    } else {
        // In ein Team
        const team = appState.teams.find(t => t.name === targetTeamName);
        if (team) {
            player.zone = targetZoneKey; // "liegend" oder "kniend" oder "main"
            team.shooters.push(player);
        }
    }
}

function updatePoints(teamName, playerId, val) {
    const team = appState.teams.find(t => t.name === teamName);
    if(team) {
        const p = team.shooters.find(s => String(s.id) === String(playerId));
        if(p) p.pkt = val;
        appState.isDirty = true;
    }
}

function updateAllCounts() {
    appState.teams.forEach(team => {
        const count = team.shooters.length;
        const el = document.getElementById(`count-${team.name.replace(/\s+/g,'-')}`);
        if(el) el.innerText = count;
    });
}

function filterPool(text) {
    const val = text.toLowerCase();
    document.querySelectorAll('.dropzone[data-target-type="pool"] .draggable-player').forEach(el => {
        const name = el.querySelector('.player-name').innerText.toLowerCase();
        el.parentElement.style.display = name.includes(val) ? 'block' : 'none'; 
    });
}


// === SPEICHERN ===

async function saveContest() {
    const btn = document.querySelector('button[onclick="saveContest()"]');
    const originalText = btn.innerText;
    btn.disabled = true; btn.innerText = "Sende...";

    const config = CONTEST_CONFIG[appState.activeModule];
    const exportData = [];
    
    appState.teams.forEach(team => {
        team.shooters.forEach(p => {
            // Basis Datenobjekt
            let item = {
                // WICHTIG: User will Nachname Vorname in Spalte A.
                // Wir senden das im 'id'-Feld, damit das Backend es in Spalte A schreibt (falls Mapping so ist)
                // Oder wir senden es als 'name' und hoffen das Backend versteht es.
                // Da Backend Code 'id' auf Col A mappt:
                id: `${p.nachname} ${p.vorname}`, 
                
                r1_team: team.name, // Spalte Team
            };

            // Spezialfall GRUPPE
            if (appState.activeModule === "gruppe") {
                // Spalte B soll Stellung sein (Liegend/Kniend)
                // Wir senden es als r1_pkt (Spalte Punkte), da wir Spalte B nicht direkt ansprechen können ohne Backend-Änderung?
                // DOCH: Wir senden das Feld, das im Backend auf Spalte B gemappt werden muss.
                // Aktuelles Backend hat Mapping: r1_pkt -> Spalte Punkte. 
                // Hack: Wir senden den Text "Liegend"/"Kniend" als "Punkte".
                item.r1_pkt = p.zone === "liegend" ? "Liegend" : "Kniend";
            } else {
                // Normalfall
                item.r1_pkt = p.pkt;
            }

            exportData.push(item);
        });
    });

    try {
        await apiFetch('grenzland', 'action=saveGrenzlandData', {
            method: 'POST',
            body: JSON.stringify({
                data: exportData,
                sheetName: config.sheetName
            })
        });
        
        appState.isDirty = false;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
        btn.innerText = "✅ Gespeichert";
        setTimeout(() => {
            btn.classList.add('btn-success');
            btn.classList.remove('btn-primary');
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2000);

    } catch(e) { 
        alert("Fehler: " + e); 
        btn.disabled = false; btn.innerText = originalText;
    }
}
