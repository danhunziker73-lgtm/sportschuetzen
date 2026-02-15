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
        baseTeamName: "Muhen", 
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
    isDirty: false 
};

// === INIT & LADEN ===

async function loadContestData(moduleKey) {
    // Sicherheits-Check bei ungespeicherten Daten
    if (appState.isDirty) {
        if (!confirm("Du hast ungespeicherte Änderungen! Wirklich wechseln? Die Änderungen gehen verloren.")) {
            document.getElementById('module-selector').value = appState.activeModule;
            return;
        }
    }

    // Fallback falls kein Parameter
    if (!moduleKey) moduleKey = appState.activeModule;
    appState.activeModule = moduleKey;
    appState.isDirty = false;

    const config = CONTEST_CONFIG[moduleKey];
    
    // WICHTIG: Container ID muss zur HTML passen (manager-container)
    const container = document.getElementById('manager-container');
    if (!container) { console.error("Container #manager-container fehlt!"); return; }
    
    container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade ${config.title}...</p></div>`;

    try {
        // Backend Request: Wir nutzen weiterhin das Modul 'grenzland', da der Worker das kennt.
        // Wenn du im Worker 'manager' als Modul eingetragen hast, ändere 'grenzland' hier zu 'manager'.
        const res = await apiFetch('grenzland', 'action=getGrenzlandData'); 
        const data = await res.json();
        
        processContestData(data, config);
        renderContestUI();
        
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler beim Laden: ${e.message}</div>`;
    }
}


// === DATEN VERARBEITUNG ===

function processContestData(data, config) {
    appState.members = data.members || [];
    appState.teams = []; 
    appState.pool = [];

    const assignedIds = new Set();
    
    // Daten aus dem gewählten Sheet laden
    const sheetData = data[config.sheetName] || data.grenzland || []; 

    const tempTeams = {};

    sheetData.forEach(row => {
        // ID oder Name normalisieren
        const rowIdStr = String(row.schuetze_id || row.id || row.schuetze || row.name || "").trim();
        
        // Versuchen den Schützen in der Mitgliederliste zu finden
        let member = appState.members.find(m => String(m.id) === rowIdStr || `${m.nachname} ${m.vorname}` === rowIdStr);
        
        // Fallback für manuelle Einträge
        if (!member && rowIdStr.length > 2) {
             member = { id: rowIdStr, nachname: rowIdStr, vorname: "", dummy: true };
        }

        if (member) {
            const teamName = row.runde_1_team || row.team || "Pool";
            
            // Zone bestimmen (für SGM)
            let zoneKey = config.zones[0].key; // Default
            
            if (config.zones.length > 1) {
                // Wir prüfen, ob im Backend "Liegend" oder "Kniend" (in Spalte Pkt/Stellung) steht
                const info = String(row.runde_1_pkt || row.stellung || "").toLowerCase(); 
                if (info.includes("kniend")) zoneKey = "kniend";
                else zoneKey = "liegend";
            }

            if (teamName !== "Pool" && teamName) {
                if (!tempTeams[teamName]) tempTeams[teamName] = { name: teamName, shooters: [] };
                
                tempTeams[teamName].shooters.push({
                    id: member.id,
                    nachname: member.nachname, 
                    vorname: member.vorname,
                    name: `${member.nachname} ${member.vorname}`,
                    pkt: row.runde_1_pkt || "", 
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
        // Defaults erstellen
        for(let i=1; i <= config.defaultTeams; i++) addTeamToState(false);
    }

    // Rest in den Pool
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
    
    // Nächste freie Nummer finden
    const existingNums = appState.teams.map(t => {
        const match = t.name.match(/(\d+)$/); // Regex gefixt (kein doppelter Backslash nötig)
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
    if(!confirm(`Team "${teamName}" wirklich löschen?`)) return;
    
    const teamIdx = appState.teams.findIndex(t => t.name === teamName);
    if (teamIdx === -1) return;

    const team = appState.teams[teamIdx];
    // Schützen zurück in Pool
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
    const container = document.getElementById('manager-container');
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2 border-bottom" style="z-index:10;">
            <div class="d-flex align-items-center gap-3">
                <select id="module-selector" class="form-select fw-bold border-primary text-primary shadow-sm" style="width:auto; cursor:pointer;" onchange="loadContestData(this.value)">
                    <option value="grenzland" ${appState.activeModule==='grenzland'?'selected':''}>🛡️ Grenzland Cup</option>
                    <option value="mannschaft" ${appState.activeModule==='mannschaft'?'selected':''}>👥 Mannschaft</option>
                    <option value="gruppe" ${appState.activeModule==='gruppe'?'selected':''}>🎯 Gruppe (SGM)</option>
                </select>
                <button class="btn btn-outline-secondary btn-sm" onclick="addTeamToState()">
                    <i class="fas fa-plus"></i> Team
                </button>
            </div>
            <button class="btn btn-success fw-bold shadow-sm" onclick="saveContest()">💾 Speichern</button>
        </div>
        
        <div class="row h-100 g-3">
            <!-- TEAMS BEREICH -->
            <div class="col-lg-9 col-md-8">
                <div class="row g-3" id="teams-grid">
                    ${appState.teams.map(team => renderTeamCard(team, config)).join('')}
                </div>
            </div>

            <!-- POOL BEREICH -->
            <div class="col-lg-3 col-md-4">
                <div class="card shadow-sm border-secondary h-100" style="max-height: calc(100vh - 150px); display:flex; flex-direction:column;">
                    <div class="card-header bg-secondary text-white py-2">
                        <i class="fas fa-users"></i> Pool
                        <input type="text" class="form-control form-control-sm mt-2" placeholder="Suchen..." onkeyup="filterPool(this.value)">
                    </div>
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
    updateAllCounts();
}

function renderTeamCard(team, config) {
    const zonesHtml = config.zones.map((zone, index) => {
        // Schützen filtern
        const shootersInZone = team.shooters.filter(s => {
            if (config.zones.length === 1) return true;
            return s.zone === zone.key;
        });

        // Styling
        const bgStyle = config.zones.length > 1 ? (index % 2 === 0 ? 'background:#fff;' : 'background:#f8f9fa;') : 'background:#fff;';
        
        // Badge (Rot wenn voll)
        const isFull = shootersInZone.length > zone.limit;
        const countBadge = `<span class="badge ${isFull ? 'bg-danger' : 'bg-light text-dark border'} float-end">${shootersInZone.length} / ${zone.limit}</span>`;

        return `
            <div class="team-zone p-2 mb-1 border rounded dropzone position-relative" 
                 style="${bgStyle} min-height: 80px;"
                 data-team="${team.name}" 
                 data-zone="${zone.key}"
                 data-limit="${zone.limit}">
                
                ${config.zones.length > 1 ? `<div class="small text-muted fw-bold mb-2 text-uppercase d-flex justify-content-between align-items-center"><span>${zone.label}</span> ${countBadge}</div>` : ''}
                
                ${shootersInZone.map(s => renderPlayerItem(s, team.name)).join('')}
            </div>
        `;
    }).join('');

    // ID für Counter generieren (ohne Leerzeichen)
    const counterId = `count-${team.name.replace(/\s+/g, '-')}`;

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
                        <span class="fw-bold" id="${counterId}">0</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPlayerItem(player, teamName = null) {
    let extraField = '';
    
    // Nur bei Grenzland & Mannschaft zeigen wir Punktefeld an
    // Bei Gruppe ist 'pkt' eigentlich die Stellung (Liegend/Kniend), daher kein Input nötig
    if (teamName && appState.activeModule !== 'gruppe') {
        extraField = `<input type="number" class="form-control form-control-sm p-0 text-center fw-bold border-0 bg-transparent" 
             style="width: 45px;" value="${player.pkt}" placeholder="Pkt" 
             onclick="this.select()" 
             onchange="updatePoints('${teamName}', '${player.id}', this.value)">`;
    }

    return `
        <div class="card mb-2 draggable-player border-0 shadow-sm" 
             draggable="true" 
             data-id="${player.id}" 
             style="cursor:grab; border-left: 4px solid var(--primary) !important;">
            <div class="card-body p-2 d-flex align-items-center justify-content-between">
                <div class="text-truncate" style="max-width: ${extraField ? '75%' : '100%'};">
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

            // LIMIT PRÜFUNG
            if (targetType !== "pool") {
                const limit = parseInt(zone.dataset.limit);
                const team = appState.teams.find(t => t.name === targetTeam);
                
                // Zähle Schützen in dieser Zone (ohne mich selbst)
                const currentCount = team.shooters.filter(s => s.zone === targetZoneKey && String(s.id) !== String(playerId)).length;
                
                if (currentCount >= limit) {
                    alert(`⚠️ Zone ist voll! Maximal ${limit} Schützen erlaubt.`);
                    return; 
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

    // 1. Suchen & Entfernen
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
        // Pool
        player.pkt = ""; 
        player.zone = null;
        appState.pool.push(player);
    } else {
        // Team
        const team = appState.teams.find(t => t.name === targetTeamName);
        if (team) {
            player.zone = targetZoneKey; 
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
            let item = {
                // Sende "Nachname Vorname" als ID für Spalte A
                id: `${p.nachname} ${p.vorname}`, 
                r1_team: team.name, 
            };

            if (appState.activeModule === "gruppe") {
                // Gruppe: Sende "Liegend" oder "Kniend" statt Punkte
                item.r1_pkt = p.zone === "liegend" ? "Liegend" : "Kniend";
            } else {
                // Normal: Sende Punkte
                item.r1_pkt = p.pkt;
            }

            exportData.push(item);
        });
    });

    try {
        // WICHTIG: Modulname anpassen falls Worker geändert wurde
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
        alert("Fehler beim Speichern: " + e); 
        btn.disabled = false; btn.innerText = originalText;
    }
}
