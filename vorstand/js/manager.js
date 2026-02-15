// === KONFIGURATION ===
const CONTEST_CONFIG = {
    "grenzland": {
        title: "🛡️ Grenzland Cup",
        sheetName: "aktuell_Grenzland",
        baseTeamName: "Muhen",
        defaultTeams: 4,
        zones: [ { key: "main", label: "Schützen", limit: 4 } ]
    },
    "mannschaft": {
        title: "👥 Mannschafts-Meisterschaft",
        sheetName: "aktuell_Mannschaft",
        baseTeamName: "Muhen", 
        defaultTeams: 1,
        zones: [ { key: "main", label: "Mannschaft (8)", limit: 8 } ]
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

// === STATE ===
let appState = {
    activeModule: "grenzland",
    members: [],
    teams: [],
    pool: [],
    mailList: [], // NEU: Liste für Mail-Verteiler
    isDirty: false 
};

// === LOAD ===
async function loadContestData(moduleKey) {
    if (appState.isDirty && !confirm("Ungespeicherte Änderungen verwerfen?")) {
        document.getElementById('module-selector').value = appState.activeModule;
        return;
    }

    if (!moduleKey) moduleKey = appState.activeModule;
    appState.activeModule = moduleKey;
    appState.isDirty = false;
    appState.mailList = []; // Mail Reset bei Wechsel

    const config = CONTEST_CONFIG[moduleKey];
    const container = document.getElementById('manager-container');
    if (!container) return;
    
    container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade ${config.title}...</p></div>`;

    try {
        // Wir senden sheetName mit, damit Backend das richtige Sheet liest
        const params = `action=getManagerData&sheetName=${config.sheetName}`;
        const res = await apiFetch('grenzland', params); 
        const data = await res.json();
        
        processContestData(data, config);
        renderContestUI();
        
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
    }
}

// === PROCESS DATA ===
function processContestData(data, config) {
    appState.members = data.members || [];
    appState.teams = []; 
    appState.pool = [];

    const assignedIds = new Set();
    // Backend liefert jetzt generisch "contestData"
    const sheetData = data.contestData || []; 

    const tempTeams = {};

    sheetData.forEach(row => {
        // Spalte A im Backend war Name
        const rowIdStr = String(row.schuetze_id || "").trim();
        if(!rowIdStr) return;

        // Match Member
        let member = appState.members.find(m => String(m.id) === rowIdStr || `${m.nachname} ${m.vorname}` === rowIdStr);
        if (!member) member = { id: rowIdStr, nachname: rowIdStr, vorname: "", email: "", dummy: true };

        const teamName = row.runde_1_team || "Pool";
        
        // Zone (Stellung) aus Spalte C lesen (backend sendet es als runde_1_pkt)
        let zoneKey = config.zones[0].key;
        if (config.zones.length > 1) {
            const info = String(row.runde_1_pkt || "").toLowerCase();
            if (info.includes("kniend")) zoneKey = "kniend";
            else zoneKey = "liegend";
        }

        if (teamName !== "Pool" && teamName) {
            if (!tempTeams[teamName]) tempTeams[teamName] = { name: teamName, shooters: [] };
            
            tempTeams[teamName].shooters.push({
                id: member.id,
                name: member.dummy ? member.id : `${member.nachname} ${member.vorname}`, // Name für Anzeige/Save
                email: member.email, // Email speichern
                zone: zoneKey
            });
            if (!member.dummy) assignedIds.add(String(member.id));
        }
    });

    if (Object.keys(tempTeams).length > 0) {
        appState.teams = Object.values(tempTeams).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    } else {
        for(let i=1; i <= config.defaultTeams; i++) addTeamToState(false);
    }

    // Pool füllen
    appState.members.forEach(m => {
        if (!assignedIds.has(String(m.id))) {
            appState.pool.push({
                id: m.id,
                name: `${m.nachname} ${m.vorname}`,
                email: m.email,
                zone: null
            });
        }
    });
}

// === STATE ACTIONS ===
function addTeamToState(render = true) {
    const config = CONTEST_CONFIG[appState.activeModule];
    let nextNum = 1;
    const existingNums = appState.teams.map(t => {
        const match = t.name.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    });
    while (existingNums.includes(nextNum)) nextNum++;

    appState.teams.push({ name: `${config.baseTeamName} ${nextNum}`, shooters: [] });
    appState.isDirty = true;
    if(render) renderContestUI();
}

function removeTeamFromState(teamName) {
    if(!confirm(`Team "${teamName}" auflösen?`)) return;
    const idx = appState.teams.findIndex(t => t.name === teamName);
    if (idx === -1) return;
    
    appState.teams[idx].shooters.forEach(s => appState.pool.push(s)); // Zurück in Pool
    appState.teams.splice(idx, 1);
    appState.isDirty = true;
    renderContestUI();
}

// === RENDER UI ===
function renderContestUI() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const container = document.getElementById('manager-container');
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2 border-bottom" style="z-index:10;">
            <div class="d-flex align-items-center gap-2">
                <select id="module-selector" class="form-select fw-bold border-primary text-primary" onchange="loadContestData(this.value)">
                    <option value="grenzland" ${appState.activeModule==='grenzland'?'selected':''}>🛡️ Grenzland</option>
                    <option value="mannschaft" ${appState.activeModule==='mannschaft'?'selected':''}>👥 Mannschaft</option>
                    <option value="gruppe" ${appState.activeModule==='gruppe'?'selected':''}>🎯 Gruppe (SGM)</option>
                </select>
                <button class="btn btn-outline-secondary btn-sm" onclick="addTeamToState()" title="Neues Team"><i class="fas fa-plus"></i></button>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-dark" onclick="printContest()" title="PDF / Drucken"><i class="fas fa-print"></i></button>
                <button class="btn btn-success fw-bold" onclick="saveContest()">💾 Speichern</button>
            </div>
        </div>
        
        <div class="row h-100 g-3">
            <!-- TEAMS (Links) -->
            <div class="col-lg-8 col-md-7">
                <div class="row g-3">
                    ${appState.teams.map(team => renderTeamCard(team, config)).join('')}
                </div>
            </div>

            <!-- SIDEBAR (Rechts: Pool + Mail) -->
            <div class="col-lg-4 col-md-5 d-flex flex-column gap-3">
                
                <!-- POOL -->
                <div class="card shadow-sm border-secondary flex-grow-1" style="max-height: 50vh; display:flex; flex-direction:column;">
                    <div class="card-header bg-secondary text-white py-2">
                        <i class="fas fa-users"></i> Schützen-Pool
                        <input type="text" class="form-control form-control-sm mt-1" placeholder="Filter..." onkeyup="filterPool(this.value)">
                    </div>
                    <div class="card-body p-2 dropzone bg-light overflow-auto" data-target-type="pool" style="flex:1;">
                        ${appState.pool.map(s => renderPlayerItem(s)).join('')}
                    </div>
                    <div class="card-footer small text-muted text-center py-1">
                        ${appState.pool.length} verfügbar
                    </div>
                </div>

                <!-- MAIL VERTEILER -->
                <div class="card shadow-sm border-warning" style="height: 30vh; display:flex; flex-direction:column;">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-envelope"></i> Mail Versand</span>
                        <button class="btn btn-sm btn-dark py-0" onclick="sendMail()" style="font-size:0.8rem;">Erstellen</button>
                    </div>
                    <div class="card-body p-2 dropzone bg-light overflow-auto" data-target-type="mail" style="flex:1; border: 2px dashed #ccc;">
                        ${appState.mailList.length === 0 ? '<div class="text-center text-muted small mt-4">Schützen hierher ziehen<br>(Kopie)</div>' : ''}
                        ${appState.mailList.map(s => renderMailItem(s)).join('')}
                    </div>
                    <div class="card-footer small text-muted text-center py-1">
                        ${appState.mailList.length} Empfänger
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
        const shooters = team.shooters.filter(s => {
            if (config.zones.length === 1) return true;
            return s.zone === zone.key;
        });
        const isFull = shooters.length > zone.limit;
        
        // Farbe für Zonen (Liegend/Kniend visuell trennen)
        const zoneBg = zone.key === 'liegend' ? '#e3f2fd' : (zone.key === 'kniend' ? '#f3e5f5' : '#fff');

        return `
            <div class="team-zone p-2 mb-1 border rounded dropzone" 
                 style="background:${zoneBg}; min-height: 60px;"
                 data-team="${team.name}" data-zone="${zone.key}" data-limit="${zone.limit}">
                
                ${config.zones.length > 1 ? `<div class="d-flex justify-content-between small fw-bold text-muted mb-1"><span>${zone.label}</span><span>${shooters.length}/${zone.limit}</span></div>` : ''}
                
                ${shooters.map(s => renderPlayerItem(s, team.name)).join('')}
            </div>
        `;
    }).join('');

    return `
        <div class="col-xl-6 col-12">
            <div class="card shadow-sm h-100 border-0">
                <div class="card-header d-flex justify-content-between align-items-center bg-white pt-3 pb-1 border-bottom-0">
                    <h5 class="m-0 fw-bold text-primary">${team.name}</h5>
                    <span class="badge bg-light text-dark border" id="count-${team.name.replace(/\s+/g,'-')}">0</span>
                </div>
                <div class="card-body p-2">
                    ${zonesHtml}
                </div>
                <!-- Löschen Button klein unten rechts -->
                <div class="text-end p-2 pt-0">
                     <small class="text-muted cursor-pointer" onclick="removeTeamFromState('${team.name}')" style="cursor:pointer;">Team löschen</small>
                </div>
            </div>
        </div>
    `;
}

function renderPlayerItem(player, teamName = null) {
    // KEINE PUNKTE INPUTS MEHR - Nur Name
    return `
        <div class="card mb-1 draggable-player border-0 shadow-sm" 
             draggable="true" 
             data-id="${player.id}" 
             style="cursor:grab; border-left: 3px solid var(--primary) !important;">
            <div class="card-body p-1 px-2 d-flex align-items-center">
                <div class="text-truncate small fw-bold" style="width:100%">${player.name}</div>
            </div>
        </div>
    `;
}

function renderMailItem(player) {
    return `
        <div class="card mb-1 border-0 shadow-sm bg-white">
            <div class="card-body p-1 px-2 d-flex justify-content-between align-items-center">
                <div class="text-truncate small" style="max-width:80%">${player.name}</div>
                <i class="fas fa-times text-danger" style="cursor:pointer;" onclick="removeFromMail('${player.id}')"></i>
            </div>
        </div>
    `;
}

// === DRAG & DROP ===
let draggedItem = null;

function initDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-player');
    const dropzones = document.querySelectorAll('.dropzone');

    draggables.forEach(d => {
        d.addEventListener('dragstart', () => { draggedItem = d; d.style.opacity = '0.5'; });
        d.addEventListener('dragend', () => { d.style.opacity = '1'; draggedItem = null; });
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('bg-secondary-subtle'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('bg-secondary-subtle'); });
        
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('bg-secondary-subtle');
            if (!draggedItem) return;

            const targetType = zone.dataset.targetType;
            const playerId = draggedItem.dataset.id;

            // MAIL LOGIK (KOPIE)
            if (targetType === "mail") {
                copyToMail(playerId);
                return;
            }

            // TEAM/POOL LOGIK (VERSCHIEBEN)
            // Limit Check
            if (targetType !== "pool") {
                const limit = parseInt(zone.dataset.limit);
                const team = appState.teams.find(t => t.name === zone.dataset.team);
                const current = team.shooters.filter(s => s.zone === zone.dataset.zone && s.id !== playerId).length;
                if (current >= limit) { alert("Zone voll!"); return; }
            }

            movePlayerInState(playerId, zone.dataset.team, zone.dataset.zone);
            renderContestUI();
        });
    });
}

function movePlayerInState(id, targetTeam, targetZone) {
    appState.isDirty = true;
    let player = null;
    
    // Finden & Entfernen
    const poolIdx = appState.pool.findIndex(p => p.id === id);
    if (poolIdx > -1) player = appState.pool.splice(poolIdx, 1)[0];
    else {
        for(let t of appState.teams) {
            const idx = t.shooters.findIndex(s => s.id === id);
            if(idx > -1) { player = t.shooters.splice(idx, 1)[0]; break; }
        }
    }

    if(!player) return;

    if (!targetTeam) { // Pool
        appState.pool.push(player);
    } else { // Team
        const team = appState.teams.find(t => t.name === targetTeam);
        player.zone = targetZone;
        team.shooters.push(player);
    }
}

// === MAIL FUNKTIONEN ===
function copyToMail(id) {
    // Schütze suchen (egal wo er ist)
    let player = appState.pool.find(p => p.id === id);
    if (!player) {
        for(let t of appState.teams) {
            player = t.shooters.find(s => s.id === id);
            if(player) break;
        }
    }
    
    // Schon in Mail-Liste?
    if (appState.mailList.find(m => m.id === id)) return;
    
    // Kopie hinzufügen
    if (player) {
        appState.mailList.push({ ...player }); // Kopie
        renderContestUI();
    }
}

function removeFromMail(id) {
    appState.mailList = appState.mailList.filter(m => m.id !== id);
    renderContestUI();
}

function sendMail() {
    const emails = appState.mailList.map(m => m.email).filter(e => e && e.includes('@'));
    if (emails.length === 0) { alert("Keine gültigen Email-Adressen gefunden!"); return; }
    
    const subject = `${CONTEST_CONFIG[appState.activeModule].title} - Aufgebot`;
    const body = "Hallo zusammen,\n\nhier ist das Aufgebot...";
    
    // Mail Client öffnen (BCC empfohlen)
    window.location.href = `mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// === PDF / PRINT ===
function printContest() {
    const config = CONTEST_CONFIG[appState.activeModule];
    
    // HTML Tabelle generieren
    let html = `
    <html><head><title>Druckansicht</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #0f3a5d; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        .team-box { break-inside: avoid; border: 1px solid #ddd; margin-bottom: 20px; padding: 10px; border-radius: 5px; }
        .team-header { font-weight: bold; font-size: 1.2em; margin-bottom: 10px; color: #333; }
        .zone-label { font-size: 0.8em; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        td { padding: 4px; border-bottom: 1px solid #eee; }
        @media print { .no-print { display: none; } }
    </style>
    </head><body>
    <h1>${config.title} - Teams</h1>
    `;

    appState.teams.forEach(team => {
        html += `<div class="team-box"><div class="team-header">${team.name}</div>`;
        
        config.zones.forEach(zone => {
            const shooters = team.shooters.filter(s => s.zone === zone.key);
            if(shooters.length > 0) {
                if(config.zones.length > 1) html += `<div class="zone-label">${zone.label}</div>`;
                html += `<table>`;
                shooters.forEach(s => {
                    html += `<tr><td>${s.name}</td></tr>`;
                });
                html += `</table>`;
            }
        });
        html += `</div>`;
    });

    html += `<script>window.print();</script></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

// === UTILS ===
function updateAllCounts() {
    appState.teams.forEach(t => {
        const el = document.getElementById(`count-${t.name.replace(/\s+/g,'-')}`);
        if(el) el.innerText = t.shooters.length;
    });
}
function filterPool(val) {
    val = val.toLowerCase();
    document.querySelectorAll('.dropzone[data-target-type="pool"] .draggable-player').forEach(el => {
        el.parentElement.style.display = el.innerText.toLowerCase().includes(val) ? 'block' : 'none';
    });
}

// === SAVE ===
async function saveContest() {
    const btn = document.querySelector('button[onclick="saveContest()"]');
    const originalText = btn.innerText;
    btn.disabled = true; btn.innerText = "Sende...";

    const config = CONTEST_CONFIG[appState.activeModule];
    const exportData = [];
    
    appState.teams.forEach(team => {
        team.shooters.forEach(p => {
            let item = {
                id: p.name, // Name an Backend
                r1_team: team.name, 
                r1_pkt: "" // Default leer
            };
            if (appState.activeModule === "gruppe") {
                item.r1_pkt = p.zone === "liegend" ? "Liegend" : "Kniend";
            }
            exportData.push(item);
        });
    });

    try {
        await apiFetch('grenzland', 'action=saveGrenzlandData', {
            method: 'POST',
            body: JSON.stringify({ data: exportData, sheetName: config.sheetName })
        });
        appState.isDirty = false;
        btn.innerText = "✅ OK";
        setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 1500);
    } catch(e) { 
        alert("Fehler: " + e); btn.disabled = false; 
    }
}
