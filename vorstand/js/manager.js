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
    mailList: [],
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
    appState.mailList = []; 

    const config = CONTEST_CONFIG[moduleKey];
    const container = document.getElementById('manager-container');
    if (!container) return;
    
    container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade ${config.title}...</p></div>`;

    try {
        const params = `action=getManagerData&sheetName=${config.sheetName}`;
        const res = await apiFetch('grenzland', params); 
        const data = await res.json();
        
        processContestData(data, config);
        renderContestUI();
        
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
    }
}

// === PROCESS ===
function processContestData(data, config) {
    appState.members = data.members || [];
    appState.teams = []; 
    appState.pool = [];

    const assignedIds = new Set();
    const sheetData = data.contestData || []; 

    const tempTeams = {};

    sheetData.forEach(row => {
        const rowIdStr = String(row.schuetze_id || "").trim();
        if(!rowIdStr) return;

        let member = appState.members.find(m => String(m.id) === rowIdStr || `${m.nachname} ${m.vorname}` === rowIdStr);
        if (!member) member = { id: rowIdStr, nachname: rowIdStr, vorname: "", email: "", dummy: true };

        const teamName = row.runde_1_team || "Pool";
        
        let zoneKey = config.zones[0].key;
        if (config.zones.length > 1) {
            const stellung = String(row.stellung || "").toLowerCase(); // Backend liefert 'stellung' bei Gruppe
            if (stellung.includes("kniend")) zoneKey = "kniend";
            else zoneKey = "liegend";
        }

        if (teamName !== "Pool" && teamName) {
            if (!tempTeams[teamName]) tempTeams[teamName] = { name: teamName, shooters: [] };
            
            tempTeams[teamName].shooters.push({
                id: member.id,
                name: member.dummy ? member.id : `${member.nachname} ${member.vorname}`,
                email: member.email,
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

// === RENDER UI ===
function renderContestUI() {
    const config = CONTEST_CONFIG[appState.activeModule];
    const container = document.getElementById('manager-container');
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white py-2 border-bottom" style="z-index:100;">
            <div class="d-flex align-items-center gap-2">
                <select id="module-selector" class="form-select fw-bold border-primary text-primary" onchange="loadContestData(this.value)">
                    <option value="grenzland" ${appState.activeModule==='grenzland'?'selected':''}>🛡️ Grenzland</option>
                    <option value="mannschaft" ${appState.activeModule==='mannschaft'?'selected':''}>👥 Mannschaft</option>
                    <option value="gruppe" ${appState.activeModule==='gruppe'?'selected':''}>🎯 Gruppe (SGM)</option>
                </select>
                <button class="btn btn-outline-secondary btn-sm" onclick="addTeamToState()"><i class="fas fa-plus"></i></button>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-dark" onclick="printContest()"><i class="fas fa-print"></i></button>
                <button class="btn btn-success fw-bold" onclick="saveContest()">💾 Speichern</button>
            </div>
        </div>
        
        <div class="row h-100 g-3">
            <!-- Teams -->
            <div class="col-lg-8 col-md-7">
                <div class="row g-3">
                    ${appState.teams.map(team => renderTeamCard(team, config)).join('')}
                </div>
            </div>

            <!-- Sidebar -->
            <div class="col-lg-4 col-md-5 d-flex flex-column gap-3">
                
                <!-- Pool -->
                <div class="card shadow-sm border-secondary flex-grow-1" style="max-height: 50vh; display:flex; flex-direction:column;">
                    <div class="card-header bg-secondary text-white py-2">
                        <i class="fas fa-users"></i> Schützen-Pool
                        <input type="text" class="form-control form-control-sm mt-1" placeholder="Filter..." onkeyup="filterPool(this.value)">
                    </div>
                    <div class="card-body p-2 dropzone bg-light overflow-auto" data-target-type="pool" style="flex:1; min-height:100px;">
                        ${appState.pool.map(s => renderPlayerItem(s)).join('')}
                    </div>
                    <div class="card-footer small text-muted text-center py-1">
                        ${appState.pool.length} verfügbar
                    </div>
                </div>

                <!-- Mail -->
                <div class="card shadow-sm border-warning" style="height: 30vh; display:flex; flex-direction:column;">
                    <div class="card-header bg-warning text-dark py-2 d-flex justify-content-between align-items-center">
                        <span><i class="fas fa-envelope"></i> Mail Versand</span>
                        <button class="btn btn-sm btn-dark py-0" onclick="sendMail()" style="font-size:0.8rem;">Erstellen</button>
                    </div>
                    <div class="card-body p-2 dropzone bg-light overflow-auto" data-target-type="mail" style="flex:1; border: 2px dashed #ccc; min-height:80px;">
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

    // Drag & Drop erst aktivieren, wenn Elemente im DOM sind
    setTimeout(initDragAndDrop, 100);
}

function renderTeamCard(team, config) {
    const zonesHtml = config.zones.map((zone, index) => {
        const shooters = team.shooters.filter(s => {
            if (config.zones.length === 1) return true;
            return s.zone === zone.key;
        });
        
        const zoneBg = zone.key === 'liegend' ? '#e3f2fd' : (zone.key === 'kniend' ? '#f3e5f5' : '#fff');

        return `
            <div class="team-zone p-2 mb-1 border rounded dropzone" 
                 style="background:${zoneBg}; min-height: 80px; transition: background 0.2s;"
                 data-team="${team.name}" data-zone="${zone.key}" data-limit="${zone.limit}" data-target-type="team">
                
                ${config.zones.length > 1 ? `<div class="d-flex justify-content-between small fw-bold text-muted mb-1 pointer-events-none"><span>${zone.label}</span><span>${shooters.length}/${zone.limit}</span></div>` : ''}
                
                ${shooters.map(s => renderPlayerItem(s, team.name)).join('')}
            </div>
        `;
    }).join('');

    return `
        <div class="col-xl-6 col-12">
            <div class="card shadow-sm h-100 border-0">
                <div class="card-header d-flex justify-content-between align-items-center bg-white pt-3 pb-1 border-bottom-0">
                    <h5 class="m-0 fw-bold text-primary">${team.name}</h5>
                    <span class="badge bg-light text-dark border">${team.shooters.length}</span>
                </div>
                <div class="card-body p-2">
                    ${zonesHtml}
                </div>
                <div class="text-end p-2 pt-0">
                     <small class="text-muted" onclick="removeTeamFromState('${team.name}')" style="cursor:pointer;">Team löschen</small>
                </div>
            </div>
        </div>
    `;
}

function renderPlayerItem(player, teamName = null) {
    return `
        <div class="card mb-1 draggable-player border-0 shadow-sm" 
             draggable="true" 
             data-id="${player.id}" 
             style="cursor:grab; border-left: 3px solid var(--primary) !important;">
            <div class="card-body p-1 px-2 pointer-events-none"> <!-- Pointer Events none verhindert drop auf kind -->
                <div class="text-truncate small fw-bold pointer-events-none">${player.name}</div>
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

// === DRAG & DROP LOGIK (ROBUST) ===

function initDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-player');
    const dropzones = document.querySelectorAll('.dropzone');

    // 1. Drag Start
    draggables.forEach(d => {
        d.addEventListener('dragstart', (e) => { 
            e.dataTransfer.setData('text/plain', d.dataset.id); // WICHTIG FÜR FIREFOX
            e.dataTransfer.effectAllowed = 'copyMove';
            d.style.opacity = '0.5'; 
        });
        d.addEventListener('dragend', () => { 
            d.style.opacity = '1'; 
        });
    });

    // 2. Dropzones
    dropzones.forEach(zone => {
        // Drag Over (Erlauben)
        zone.addEventListener('dragover', e => { 
            e.preventDefault(); // NÖTIG FÜR DROP
            e.dataTransfer.dropEffect = zone.dataset.targetType === 'mail' ? 'copy' : 'move';
            zone.classList.add('bg-success-subtle'); // Visuelles Feedback
        });

        // Drag Leave
        zone.addEventListener('dragleave', () => { 
            zone.classList.remove('bg-success-subtle'); 
        });
        
        // DROP
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('bg-success-subtle');
            
            // Daten holen
            const playerId = e.dataTransfer.getData('text/plain');
            if(!playerId) return;

            // RICHTIGES ZIEL FINDEN (Falls auf Kind-Element gedroppt wurde)
            const targetZone = e.target.closest('.dropzone');
            if (!targetZone) return;

            const targetType = targetZone.dataset.targetType; // "pool", "mail", "team"

            // 1. MAIL (Kopie)
            if (targetType === "mail") {
                copyToMail(playerId);
                return;
            }

            // 2. POOL (Verschieben)
            if (targetType === "pool") {
                movePlayerInState(playerId, null, null);
                renderContestUI();
                return;
            }

            // 3. TEAM (Verschieben)
            if (targetType === "team") {
                const limit = parseInt(targetZone.dataset.limit);
                const teamName = targetZone.dataset.team;
                const zoneKey = targetZone.dataset.zone;
                
                const team = appState.teams.find(t => t.name === teamName);
                if (!team) return;

                // Limit Check
                const currentCount = team.shooters.filter(s => s.zone === zoneKey && s.id !== playerId).length;
                if (currentCount >= limit) { 
                    alert("Zone ist voll!"); 
                    return; 
                }

                movePlayerInState(playerId, teamName, zoneKey);
                renderContestUI();
            }
        });
    });
}

// === LOGIK ===

function movePlayerInState(id, targetTeam, targetZone) {
    appState.isDirty = true;
    let player = null;
    
    // Suchen
    const poolIdx = appState.pool.findIndex(p => p.id === id);
    if (poolIdx > -1) player = appState.pool.splice(poolIdx, 1)[0];
    else {
        for(let t of appState.teams) {
            const idx = t.shooters.findIndex(s => s.id === id);
            if(idx > -1) { player = t.shooters.splice(idx, 1)[0]; break; }
        }
    }

    if(!player) return;

    if (!targetTeam) { 
        player.zone = null;
        appState.pool.push(player);
    } else { 
        const team = appState.teams.find(t => t.name === targetTeam);
        if(team) {
            player.zone = targetZone;
            team.shooters.push(player);
        }
    }
}

function copyToMail(id) {
    let player = appState.pool.find(p => p.id === id);
    if (!player) {
        for(let t of appState.teams) {
            player = t.shooters.find(s => s.id === id);
            if(player) break;
        }
    }
    if (player && !appState.mailList.find(m => m.id === id)) {
        appState.mailList.push({ ...player });
        renderContestUI();
    }
}

function removeFromMail(id) {
    appState.mailList = appState.mailList.filter(m => m.id !== id);
    renderContestUI();
}

// === UTILS ===

function addTeamToState() {
    const config = CONTEST_CONFIG[appState.activeModule];
    let nextNum = 1;
    const existingNums = appState.teams.map(t => {
        const match = t.name.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
    });
    while (existingNums.includes(nextNum)) nextNum++;
    appState.teams.push({ name: `${config.baseTeamName} ${nextNum}`, shooters: [] });
    renderContestUI();
}

function removeTeamFromState(teamName) {
    if(!confirm(`Team "${teamName}" löschen?`)) return;
    const idx = appState.teams.findIndex(t => t.name === teamName);
    if (idx === -1) return;
    appState.teams[idx].shooters.forEach(s => appState.pool.push(s));
    appState.teams.splice(idx, 1);
    renderContestUI();
}

function filterPool(val) {
    val = val.toLowerCase();
    document.querySelectorAll('.dropzone[data-target-type="pool"] .draggable-player').forEach(el => {
        el.parentElement.style.display = el.innerText.toLowerCase().includes(val) ? 'block' : 'none';
    });
}

function printContest() {
    const config = CONTEST_CONFIG[appState.activeModule];
    let html = `<html><head><title>Druck</title><style>
        body{font-family:sans-serif;padding:20px} .team{border:1px solid #ccc;margin-bottom:15px;padding:10px;page-break-inside:avoid}
        .head{font-weight:bold;font-size:1.1em;border-bottom:1px solid #eee;margin-bottom:5px}
    </style></head><body><h1>${config.title}</h1>`;
    
    appState.teams.forEach(t => {
        html += `<div class="team"><div class="head">${t.name}</div>`;
        t.shooters.forEach(s => html += `<div>${s.name} ${s.zone==='kniend'?'(kn)':''}</div>`);
        html += `</div>`;
    });
    html += `<script>window.print()</script></body></html>`;
    const win = window.open('','_blank');
    win.document.write(html);
    win.document.close();
}

function sendMail() {
    const mails = appState.mailList.map(m => m.email).filter(e => e && e.includes('@'));
    if(!mails.length) return alert("Keine Emails oder Schützen haben keine Email hinterlegt!");
    window.location.href = `mailto:?bcc=${mails.join(',')}&subject=Aufgebot`;
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
                id: p.name, 
                team: team.name, 
                stellung: p.zone === "liegend" ? "Liegend" : (p.zone === "kniend" ? "Kniend" : "")
            };
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
        alert("Fehler: " + e); btn.disabled = false; btn.innerText = originalText;
    }
}
