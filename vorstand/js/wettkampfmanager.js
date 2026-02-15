// === KONFIGURATION DER WETTBEWERBE ===
const CONTEST_CONFIG = {
    "grenzland": {
        title: "🛡️ Grenzland Cup",
        sheetName: "aktuell_Grenzland",
        baseTeamName: "Muhen",
        defaultTeams: 4,     // Startet mit 4 Teams
        zones: [
            { key: "main", label: "Schützen", limit: 4 }
        ]
    },
    "mannschaft": {
        title: "👥 Mannschafts-Meisterschaft",
        sheetName: "aktuell_Mannschaft",
        baseTeamName: "Mannschaft",
        defaultTeams: 1,
        zones: [
            { key: "main", label: "Kader (Max 8)", limit: 8 }
        ]
    },
    "gruppe": {
        title: "🎯 Gruppen-Meisterschaft (SGM)",
        sheetName: "aktuell_Gruppe",
        baseTeamName: "Gruppe",
        defaultTeams: 2,
        zones: [
            { key: "liegend", label: "Liegend (3)", limit: 3 },
            { key: "kniend",  label: "Kniend (2)",  limit: 2 }
        ]
    }
    // Hier kannst du später einfach "schnappschiessen": { ... } einfügen
};

// === GLOBALER STATE ===
let appState = {
    activeModule: "grenzland", // Welches Modul ist gerade offen?
    members: [],               // Alle Mitglieder aus DB
    teams: [],                 // Aktuelle Team-Struktur
    pool: []                   // IDs der Schützen im Pool
};

// === INIT & LADEN ===

// Diese Funktion wird vom Router aufgerufen: navTo('grenzland') oder navTo('gruppe')
async function loadContestData(moduleKey = "grenzland") {
    appState.activeModule = moduleKey;
    const config = CONTEST_CONFIG[moduleKey];
    
    const container = document.getElementById('grenzland-container'); // Wir nutzen denselben Container
    container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade ${config.title}...</p></div>`;

    try {
        // 1. Daten vom Backend holen
        // Wir nutzen 'action=getGrenzlandData', aber das Backend sollte idealerweise generisch sein.
        // Für jetzt nutzen wir den bestehenden Endpunkt, da er Mitglieder + Sheet-Daten liefert.
        const res = await apiFetch('grenzland', 'action=getGrenzlandData'); 
        const data = await res.json();
        
        // 2. Daten verarbeiten
        processContestData(data, config);
        
        // 3. UI rendern
        renderContestUI();
        
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
    }
}

// Wrapper für die alten Aufrufe (Kompatibilität)
function loadGrenzlandData() { loadContestData("grenzland"); }


// === DATEN VERARBEITUNG ===

function processContestData(data, config) {
    appState.members = data.members || [];
    appState.teams = []; 
    appState.pool = [];

    // Set für zugewiesene IDs
    const assignedIds = new Set();

    // 1. Sheet-Daten analysieren (Wer ist schon in einem Team?)
    // Wir gruppieren die Rohdaten nach Team-Namen
    const sheetData = data[config.activeModule] || data.grenzland || []; // Fallback
    
    // Temporäre Map für Teams
    const tempTeams = {};

    sheetData.forEach(row => {
        const id = String(row.schuetze_id || row.id || row.schuetze || "").trim();
        const member = appState.members.find(m => String(m.id) === id || `${m.nachname} ${m.vorname}` === id);
        
        if (member) {
            // Team Name aus Backend (z.B. "Muhen 1")
            const teamName = row.runde_1_team || row.team || "Pool";
            
            if (teamName !== "Pool") {
                if (!tempTeams[teamName]) tempTeams[teamName] = { name: teamName, shooters: [] };
                
                // Position bestimmen (für Gruppe wichtig)
                // Falls das Backend noch keine Position speichert, weisen wir es basierend auf Config zu
                // (Das ist ein Provisorium, bis das Backend "position" speichert)
                let zoneKey = config.zones[0].key; 
                // Logik: Wenn wir SGM haben, müssten wir wissen ob Liegend/Kniend. 
                // Vorerst: Einfach reinladen, Sortierung macht User.
                
                tempTeams[teamName].shooters.push({
                    id: member.id,
                    name: `${member.nachname} ${member.vorname}`,
                    pkt: row.runde_1_pkt || row.pkt || "",
                    zone: zoneKey // Default Zone
                });
                assignedIds.add(String(member.id));
            }
        }
    });

    // 2. Teams in State überführen oder Defaults erstellen
    if (Object.keys(tempTeams).length > 0) {
        // Sortiere Teams nach Namen (Muhen 1, Muhen 2...)
        appState.teams = Object.values(tempTeams).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    } else {
        // Keine Daten? Erstelle Default Teams (Muhen 1 bis X)
        for(let i=1; i <= config.defaultTeams; i++) {
            addTeamToState(false); // false = kein Re-Render
        }
    }

    // 3. Rest in den Pool
    appState.members.forEach(m => {
        if (!assignedIds.has(String(m.id))) {
            appState.pool.push({
                id: m.id,
                name: `${m.nachname} ${m.vorname}`,
                pkt: ""
            });
        }
    });
}


// === STATE MANAGEMENT ===

function addTeamToState(render = true) {
    const config = CONTEST_CONFIG[appState.activeModule];
    
    // Nächste freie Nummer finden
    let nextNum = 1;
    const existingNums = appState.teams.map(t => {
        const match = t.name.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    });
    while (existingNums.includes(nextNum)) nextNum++;

    const newTeam = {
        name: `${config.baseTeamName} ${nextNum}`,
        shooters: []
    };
    appState.teams.push(newTeam);
    
    if(render) renderContestUI();
}

function removeTeamFromState(teamName) {
    const teamIdx = appState.teams.findIndex(t => t.name === teamName);
    if (teamIdx === -1) return;

    const team = appState.teams[teamIdx];
    
    // Schützen zurück in den Pool werfen!
    team.shooters.forEach(s => {
        s.pkt = ""; // Punkte resetten
        appState.pool.push(s);
    });

    appState.teams.splice(teamIdx, 1);
    renderContestUI();
}


// === UI RENDERING ===

function renderContestUI() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const container = document.getElementById('grenzland-container');
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2 border-bottom" style="z-index:10;">
            <div class="d-flex align-items-center gap-3">
                <h3 class="m-0">${config.title}</h3>
                <button class="btn btn-outline-primary btn-sm" onclick="addTeamToState()">
                    <i class="fas fa-plus"></i> Team
                </button>
            </div>
            <div class="d-flex gap-2">
                <!-- Dropdown zum Wechseln des Modus (optional) -->
                <select class="form-select form-select-sm w-auto" onchange="loadContestData(this.value)">
                    <option value="grenzland" ${appState.activeModule==='grenzland'?'selected':''}>Grenzland</option>
                    <option value="mannschaft" ${appState.activeModule==='mannschaft'?'selected':''}>Mannschaft</option>
                    <option value="gruppe" ${appState.activeModule==='gruppe'?'selected':''}>Gruppe (SGM)</option>
                </select>
                <button class="btn btn-success fw-bold" onclick="saveContest()">💾 Speichern</button>
            </div>
        </div>
        
        <div class="row h-100 g-3">
            <!-- TEAMS BEREICH -->
            <div class="col-lg-9 col-md-8">
                <div class="row g-3" id="teams-grid">
                    ${appState.teams.map(team => renderTeamCard(team, config)).join('')}
                </div>
            </div>

            <!-- POOL BEREICH (Sticky Sidebar) -->
            <div class="col-lg-3 col-md-4">
                <div class="card shadow-sm border-secondary" style="position: sticky; top: 80px; max-height: calc(100vh - 100px); display:flex; flex-direction:column;">
                    <div class="card-header bg-secondary text-white py-2">
                        <i class="fas fa-users"></i> Schützen-Pool
                        <input type="text" class="form-control form-control-sm mt-2" placeholder="Suchen..." onkeyup="filterPool(this.value)">
                    </div>
                    <div class="card-body p-2 dropzone bg-light overflow-auto" data-target-type="pool" style="flex:1; min-height: 200px;">
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
    updateAllTotals();
}

function renderTeamCard(team, config) {
    // Rendert die Zonen innerhalb einer Karte
    const zonesHtml = config.zones.map((zone, index) => {
        // Filtere Schützen für diese Zone (Falls Zone logic existiert, sonst alle in die erste)
        // Bei einfacher Liste (Grenzland) landen alle in "main"
        // Bei Gruppe müssen wir checken: Wo ist der Schütze?
        
        const shootersInZone = team.shooters.filter(s => {
            if (config.zones.length === 1) return true; // Nur 1 Zone -> Alle rein
            return s.zone === zone.key;
        });

        // Hintergrund Farbe für Zone leicht variieren wenn es mehrere gibt
        const bgStyle = config.zones.length > 1 ? (index % 2 === 0 ? 'background:#fff;' : 'background:#f8f9fa;') : 'background:#fff;';
        
        return `
            <div class="team-zone p-2 mb-1 border rounded dropzone" 
                 style="${bgStyle} min-height: 100px;"
                 data-team="${team.name}" 
                 data-zone="${zone.key}"
                 data-limit="${zone.limit}">
                
                ${config.zones.length > 1 ? `<div class="small text-muted fw-bold mb-2 text-uppercase" style="font-size:0.7rem; letter-spacing:1px;">${zone.label} <span class="badge bg-light text-dark border">${shootersInZone.length}/${zone.limit}</span></div>` : ''}
                
                ${shootersInZone.map(s => renderPlayerItem(s, team.name)).join('')}
            </div>
        `;
    }).join('');

    return `
        <div class="col-xl-4 col-lg-6 col-12">
            <div class="card shadow-sm h-100 border-0">
                <div class="card-header d-flex justify-content-between align-items-center bg-white border-bottom-0 pt-3">
                    <h5 class="m-0 fw-bold text-primary">${team.name}</h5>
                    <button class="btn btn-link text-danger p-0" onclick="removeTeamFromState('${team.name}')" title="Team löschen">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="card-body p-2">
                    ${zonesHtml}
                </div>
                <div class="card-footer bg-white border-top-0 pt-0 pb-3">
                    <div class="d-flex justify-content-between align-items-center bg-light rounded p-2">
                        <span class="small fw-bold text-muted">TOTAL</span>
                        <span class="fw-bold fs-5" id="total-${team.name.replace(/\s+/g,'-')}">0</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPlayerItem(player, teamName = null) {
    // Wenn im Team, zeige Punkte-Input. Wenn im Pool, nur Name.
    const inputField = teamName 
        ? `<input type="number" class="form-control form-control-sm p-0 text-center fw-bold border-0 bg-transparent" 
             style="width: 40px;" value="${player.pkt}" placeholder="-" 
             onclick="this.select()" 
             onchange="updatePoints('${teamName}', '${player.id}', this.value)">` 
        : '';

    return `
        <div class="card mb-2 draggable-player border-0 shadow-sm" 
             draggable="true" 
             data-id="${player.id}" 
             style="cursor:grab; border-left: 4px solid var(--primary) !important;">
            <div class="card-body p-2 d-flex align-items-center justify-content-between">
                <div class="text-truncate" style="max-width: 80%;">
                    <span class="fw-bold small player-name">${player.name}</span>
                </div>
                ${inputField}
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
            zone.classList.add('bg-primary-subtle'); // Bootstrap 5.3 class für Highlight
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('bg-primary-subtle');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('bg-primary-subtle');
            
            if (!draggedItem) return;

            const playerId = draggedItem.dataset.id;
            const targetTeam = zone.dataset.team; // Undefined wenn Pool
            const targetZoneKey = zone.dataset.zone;
            const targetType = zone.dataset.targetType; // "pool" oder undefined

            // Limit Check (nur wenn nicht Pool)
            if (targetType !== "pool") {
                const limit = parseInt(zone.dataset.limit);
                // Zählen wie viele schon drin sind (Client-Side Check im DOM oder State)
                // Wir machen es über State, das ist sauberer.
                // Aber Vorsicht: Wenn wir uns selbst droppen, zählt das nicht als +1
                
                const team = appState.teams.find(t => t.name === targetTeam);
                const count = team.shooters.filter(s => s.zone === targetZoneKey && String(s.id) !== String(playerId)).length;
                
                if (count >= limit) {
                    alert(`Zone ist voll! Max ${limit} Schützen.`);
                    return;
                }
            }

            // State Update
            movePlayerInState(playerId, targetTeam, targetZoneKey);
            
            // Re-Render
            renderContestUI();
        });
    });
}

function movePlayerInState(playerId, targetTeamName, targetZoneKey) {
    // 1. Spieler finden & entfernen (aus Pool oder altem Team)
    let player = null;
    
    // Suche im Pool
    const poolIdx = appState.pool.findIndex(p => String(p.id) === String(playerId));
    if (poolIdx > -1) {
        player = appState.pool.splice(poolIdx, 1)[0];
    } else {
        // Suche in Teams
        for (const team of appState.teams) {
            const sIdx = team.shooters.findIndex(s => String(s.id) === String(playerId));
            if (sIdx > -1) {
                player = team.shooters.splice(sIdx, 1)[0];
                // Wenn Team leer ist, entfernen wir es NICHT automatisch, User soll das entscheiden.
                break;
            }
        }
    }

    if (!player) return; // Sollte nicht passieren

    // 2. Spieler einfügen
    if (!targetTeamName) {
        // Ziel ist Pool
        player.pkt = ""; // Reset Punkte
        player.zone = null;
        appState.pool.push(player);
    } else {
        // Ziel ist Team
        const team = appState.teams.find(t => t.name === targetTeamName);
        if (team) {
            player.zone = targetZoneKey; // WICHTIG für Gruppe (Liegend/Kniend)
            team.shooters.push(player);
        }
    }
}

function updatePoints(teamName, playerId, val) {
    const team = appState.teams.find(t => t.name === teamName);
    if(team) {
        const p = team.shooters.find(s => String(s.id) === String(playerId));
        if(p) {
            p.pkt = val;
            updateTeamTotal(team);
        }
    }
}

function updateTeamTotal(team) {
    const sum = team.shooters.reduce((acc, curr) => acc + (parseInt(curr.pkt)||0), 0);
    const el = document.getElementById(`total-${team.name.replace(/\s+/g,'-')}`);
    if(el) el.innerText = sum;
}

function updateAllTotals() {
    appState.teams.forEach(t => updateTeamTotal(t));
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
    
    // Daten flachklopfen für Excel
    appState.teams.forEach(team => {
        team.shooters.forEach(p => {
            exportData.push({
                id: p.id,
                // Wir nutzen generische Felder, das Backend muss die erkennen
                // Für Grenzland ist das Mapping: team -> r1_team
                r1_team: team.name, 
                r1_pkt: p.pkt,
                // Optional: Zone mitsenden (für Gruppe)
                // Achtung: Backend braucht evtl. Anpassung um "zone" zu speichern,
                // oder wir packen es in den Teamnamen? Nein, lieber sauber.
                // Hack für den Moment: Wir speichern es noch nicht im Backend, da die Spalte fehlt.
                // Aber wir bereiten es vor.
                zone: p.zone 
            });
        });
    });

    try {
        await apiFetch('grenzland', 'action=saveGrenzlandData', { // Wir nutzen denselben Endpoint
            method: 'POST',
            body: JSON.stringify({
                data: exportData,
                sheetName: config.sheetName // Wir sagen dem Backend, wohin!
            })
        });
        
        // Success Feedback
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
