// === MODUL: GRENZLAND CUP (Drag & Drop) ===

let grenzlandState = {
    members: [],
    teams: {
        "Muhen 1": [],
        "Muhen 2": [],
        "Muhen 3": [],
        "Muhen 4": [], 
        "Pool": []     
    }
};

// Start-Funktion
async function loadGrenzlandData() {
    const container = document.getElementById('grenzland-container');
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade Grenzland-Daten...</p></div>';

    try {
        // WICHTIG: Hier rufen wir das Modul 'grenzland' auf!
        const res = await apiFetch('grenzland', 'action=getGrenzlandData');
        const data = await res.json();
        
        // Daten für UI aufbereiten
        processGrenzlandData(data);
        
        // HTML rendern
        renderGrenzlandUI(container);
        
        // Drag & Drop aktivieren
        initDragAndDrop();

    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
    }
}

// Daten verarbeiten: Wer ist in welchem Team?
function processGrenzlandData(data) {
    // Reset State
    grenzlandState.teams = { "Muhen 1": [], "Muhen 2": [], "Muhen 3": [], "Muhen 4": [], "Pool": [] };
    grenzlandState.members = data.members || [];

    // Set für bereits zugewiesene IDs
    const assignedIds = new Set();
    
    // 1. Bestehende Einteilungen aus dem Sheet lesen
    if (data.grenzland) {
        data.grenzland.forEach(row => {
            // Wir matchen über ID (Spalte A im Sheet)
            const rowIdStr = String(row.schuetze_id || row.schuetze || "").trim();
            
            // Finde das Mitglied in der Mitgliederliste (Match auf ID oder Name)
            let member = data.members.find(m => String(m.id) === rowIdStr || `${m.nachname} ${m.vorname}` === rowIdStr);
            
            if (member) {
                // Welches Team? (Feldname muss zum Backend passen, hier 'runde_1_team' normalisiert)
                const teamName = row.runde_1_team || "Pool"; 
                
                // Spieler-Objekt für UI
                const playerObj = {
                    id: member.id,
                    name: `${member.nachname} ${member.vorname}`,
                    pkt: row.runde_1_pkt || ""
                };

                // Nur hinzufügen, wenn das Team existiert (z.B. Muhen 1)
                if (grenzlandState.teams[teamName]) {
                    grenzlandState.teams[teamName].push(playerObj);
                    assignedIds.add(String(member.id));
                }
            }
        });
    }

    // 2. Alle restlichen Mitglieder in den Pool werfen
    data.members.forEach(m => {
        if (!assignedIds.has(String(m.id))) {
            grenzlandState.teams["Pool"].push({
                id: m.id,
                name: `${m.nachname} ${m.vorname}`,
                pkt: ""
            });
        }
    });
}

// UI Rendern
function renderGrenzlandUI(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>🛡️ Grenzland Cup (Runde 1)</h3>
            <button class="btn btn-success fw-bold" onclick="saveGrenzland()">💾 Speichern</button>
        </div>
        
        <div class="row h-100">
            <!-- TEAMS (LINKS) -->
            <div class="col-md-8">
                <div class="row">
                    ${['Muhen 1', 'Muhen 2', 'Muhen 3', 'Muhen 4'].map(team => `
                        <div class="col-md-6 mb-3">
                            <div class="card h-100 shadow-sm">
                                <div class="card-header fw-bold text-center bg-light">${team}</div>
                                <div class="card-body p-2 dropzone" data-team="${team}" style="min-height: 150px; background: #fff;">
                                    ${renderPlayers(team)}
                                </div>
                                <div class="card-footer text-center small text-muted py-1">
                                    Total: <span id="total-${team.replace(' ','-')}">0</span> Pkt
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- POOL (RECHTS) -->
            <div class="col-md-4">
                <div class="card shadow-sm" style="max-height: calc(100vh - 200px); display:flex; flex-direction:column;">
                    <div class="card-header bg-secondary text-white fw-bold">
                        Schützen-Pool
                        <input type="text" class="form-control form-control-sm mt-2" placeholder="Suchen..." onkeyup="filterPool(this.value)">
                    </div>
                    <div class="card-body p-2 dropzone overflow-auto" data-team="Pool" style="background: #f8f9fa; flex:1;">
                        ${renderPlayers("Pool")}
                    </div>
                </div>
            </div>
        </div>
    `;
    updateTotals();
}

// Einzelne Spieler-Karten rendern
function renderPlayers(teamName) {
    return grenzlandState.teams[teamName].map(p => `
        <div class="card mb-2 draggable-player border-start border-4 border-primary" draggable="true" data-id="${p.id}" style="cursor:grab;">
            <div class="card-body p-2 d-flex align-items-center justify-content-between">
                <div class="text-truncate me-2">
                    <span class="fw-bold small player-name">${p.name}</span>
                </div>
                ${teamName !== 'Pool' ? `
                    <input type="number" class="form-control form-control-sm p-1 text-center fw-bold" 
                    style="width: 60px;" value="${p.pkt}" placeholder="-" 
                    onchange="updatePoints('${teamName}', '${p.id}', this.value)">
                ` : ''}
            </div>
        </div>
    `).join('');
}

// --- LOGIK: DRAG & DROP ---

let draggedItem = null;

function initDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-player');
    const containers = document.querySelectorAll('.dropzone');

    draggables.forEach(d => {
        d.addEventListener('dragstart', () => {
            draggedItem = d;
            d.style.opacity = '0.5';
        });
        d.addEventListener('dragend', () => {
            d.style.opacity = '1';
            draggedItem = null;
        });
    });

    containers.forEach(container => {
        container.addEventListener('dragover', e => {
            e.preventDefault(); // Erlaubt Drop
            container.style.backgroundColor = '#e9ecef'; // Highlight
        });
        
        container.addEventListener('dragleave', () => {
            container.style.backgroundColor = container.dataset.team === 'Pool' ? '#f8f9fa' : '#fff'; // Reset
        });

        container.addEventListener('drop', e => {
            e.preventDefault();
            container.style.backgroundColor = container.dataset.team === 'Pool' ? '#f8f9fa' : '#fff';
            
            if (draggedItem) {
                const targetTeam = container.dataset.team;
                const playerId = draggedItem.dataset.id;
                
                // State Update: Spieler im Objekt verschieben
                movePlayerInState(playerId, targetTeam);
                
                // UI Update: Komplett neu zeichnen
                renderGrenzlandUI(document.getElementById('grenzland-container'));
                initDragAndDrop(); // Listener neu setzen
            }
        });
    });
}

function movePlayerInState(id, targetTeam) {
    let playerObj = null;
    // Spieler suchen und entfernen
    for (const team in grenzlandState.teams) {
        const idx = grenzlandState.teams[team].findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            playerObj = grenzlandState.teams[team].splice(idx, 1)[0];
            break;
        }
    }
    // Spieler ins neue Team einfügen
    if (playerObj) {
        grenzlandState.teams[targetTeam].push(playerObj);
    }
}

function updatePoints(team, id, value) {
    const p = grenzlandState.teams[team].find(p => String(p.id) === String(id));
    if(p) {
        p.pkt = value;
        updateTotals();
    }
}

function updateTotals() {
    ['Muhen 1', 'Muhen 2', 'Muhen 3', 'Muhen 4'].forEach(t => {
        const sum = grenzlandState.teams[t].reduce((acc, curr) => acc + (parseInt(curr.pkt)||0), 0);
        const el = document.getElementById(`total-${t.replace(' ','-')}`);
        if(el) el.innerText = sum;
    });
}

function filterPool(text) {
    const val = text.toLowerCase();
    document.querySelectorAll('.dropzone[data-team="Pool"] .draggable-player').forEach(el => {
        const name = el.querySelector('.player-name').innerText.toLowerCase();
        el.parentElement.style.display = name.includes(val) ? 'block' : 'none'; 
    });
}

// --- SPEICHERN ---

async function saveGrenzland() {
    const btn = document.querySelector('button[onclick="saveGrenzland()"]');
    btn.disabled = true; btn.innerText = "Speichere...";

    const exportData = [];
    
    // Daten vorbereiten für Backend
    ['Muhen 1', 'Muhen 2', 'Muhen 3', 'Muhen 4'].forEach(team => {
        grenzlandState.teams[team].forEach(p => {
            exportData.push({
                id: p.id,        // ID für Spalte A
                r1_team: team,   // Teamname
                r1_pkt: p.pkt    // Punkte
            });
        });
    });

    try {
        // WICHTIG: Aufruf an 'grenzland' Modul!
        await apiFetch('grenzland', 'action=saveGrenzlandData', {
            method: 'POST',
            body: JSON.stringify({
                data: exportData
            })
        });
        alert("✅ Erfolgreich gespeichert!");
    } catch(e) { 
        alert("Fehler: " + e); 
    }
    
    btn.disabled = false; btn.innerText = "💾 Speichern";
}
