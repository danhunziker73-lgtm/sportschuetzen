// === MODUL: TERMINE & ADMIN ===

let adminState = null;
let originalAdminState = null;

async function loadTermineData() {
    const container = document.getElementById('termine-container');
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade Admin-Daten...</p></div>';

    try {
        // Daten vom Worker holen (Modul 'termine', Action 'loadAdminData')
        // Achtung: In deinem Worker-Code heißt die Action 'loadAdminData', das Modul 'termine' zeigt auf das gleiche Script.
        const res = await apiFetch('termine', 'action=loadAdminData');
        adminState = await res.json();
        originalAdminState = JSON.parse(JSON.stringify(adminState)); // Deep Copy für Vergleiche

        renderTermineUI(container);

    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler beim Laden: ${e.message}</div>`;
    }
}

function renderTermineUI(container) {
    container.innerHTML = `
        <ul class="nav nav-tabs mb-3" id="admin-tabs">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-gv">⚙️ Konfig</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-kalender">📅 Termine</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-praesenz">📝 Präsenz</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-protokoll">📜 Log</a></li>
        </ul>

        <div class="tab-content">
            
            <!-- TAB: KONFIG (GV & TOOLS) -->
            <div class="tab-pane fade show active" id="tab-gv">
                <div class="row g-3">
                    <div class="col-md-12">
                         <div class="card p-3 mb-3">
                            <h5 class="card-title">🚀 Tools</h5>
                            <div class="d-flex gap-2 flex-wrap">
                                <button class="btn btn-outline-primary btn-sm" onclick="runAdminTool('genPDF')">📄 Einladungs-PDF</button>
                                <button class="btn btn-outline-primary btn-sm" onclick="runAdminTool('importClubdesk')">📥 Clubdesk Import</button>
                                <button class="btn btn-outline-primary btn-sm" onclick="runAdminTool('sendMails')">📧 GV Mails senden</button>
                                <button class="btn btn-outline-primary btn-sm" onclick="runAdminTool('sendPraesenz')">📝 Präsenzliste senden</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card p-3">
                            <h5 class="card-title">Stammdaten</h5>
                            <div id="gv-list"></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card p-3">
                            <h5 class="card-title">Mail-System</h5>
                            <div id="app-info-list"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB: TERMINE -->
            <div class="tab-pane fade" id="tab-kalender">
                <button class="btn btn-sm btn-success mb-2" onclick="addTerminRow()">+ Neuer Termin</button>
                <div class="table-responsive bg-white border rounded">
                    <table class="table table-sm table-hover mb-0" style="min-width: 800px;">
                        <thead class="table-light"><tr><th>Datum</th><th>Start</th><th>Ende</th><th>Anlass</th><th>Ort</th><th>Kat</th><th>Status</th><th></th></tr></thead>
                        <tbody id="termine-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- TAB: PRÄSENZ -->
            <div class="tab-pane fade" id="tab-praesenz">
                <div class="card p-3">
                    <h5 class="card-title">Anmeldungen</h5>
                    <div class="table-responsive" style="max-height: 500px;">
                        <table class="table table-sm table-striped">
                            <thead><tr><th>Name</th><th>Teilnahme</th><th>Zeit</th></tr></thead>
                            <tbody id="anmelde-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB: PROTOKOLL -->
            <div class="tab-pane fade" id="tab-protokoll">
                <div id="protokoll-list" class="small text-muted"></div>
            </div>
        </div>
    `;

    // Inhalte rendern
    renderGVList();
    renderAppInfoList();
    renderTermineList();
    renderAnmeldungenList();
    renderProtokollList();
}

// --- RENDERING SUB-FUNCTIONS ---

function renderGVList() {
    const list = document.getElementById('gv-list');
    if(!list || !adminState.platzhalter) return;

    list.innerHTML = adminState.platzhalter.map((p, i) => {
        const label = p.bezeichnung_app || p.platzhaltername;
        // Einfache Input-Felder für Text/Datum
        return `<div class="mb-2">
            <label class="form-label small fw-bold mb-0">${label}</label>
            <input type="text" class="form-control form-control-sm" value="${p.inhalt||''}" 
            onchange="adminState.platzhalter[${i}].inhalt=this.value">
        </div>`;
    }).join('');
}

function renderAppInfoList() {
     const list = document.getElementById('app-info-list');
    if(!list || !adminState.app_info) return;

    list.innerHTML = adminState.app_info.map((info, i) => `
        <div class="mb-2 border-bottom pb-2">
            <label class="form-label small fw-bold mb-0">${info.bezeichnung}</label>
            <input type="text" class="form-control form-control-sm mb-1" value="${info.mailadresse||''}" 
            onchange="adminState.app_info[${i}].mailadresse=this.value" placeholder="Mails mit ; trennen">
        </div>`).join('');
}

function renderTermineList() {
    const tbody = document.getElementById('termine-body');
    if(!tbody || !adminState.termine) return;

    // Sortieren (Datum)
    adminState.termine.sort((a,b) => (a.datum && b.datum) ? new Date(a.datum) - new Date(b.datum) : -1);

    tbody.innerHTML = adminState.termine.map((t, i) => `
        <tr>
            <td><input type="date" class="form-control form-control-sm" value="${formatDate(t.datum)}" onchange="adminState.termine[${i}].datum=this.value"></td>
            <td><input type="time" class="form-control form-control-sm" value="${formatTime(t.startzeit)}" onchange="adminState.termine[${i}].startzeit=this.value"></td>
            <td><input type="time" class="form-control form-control-sm" value="${formatTime(t.endzeit)}" onchange="adminState.termine[${i}].endzeit=this.value"></td>
            <td>
                <select class="form-select form-select-sm" onchange="adminState.termine[${i}].anlasstitel=this.value">
                    ${(adminState.dropdowns.anlaesse||[]).map(a => `<option value="${a}" ${a===t.anlasstitel?'selected':''}>${a}</option>`).join('')}
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm" onchange="updateTerminOrt(${i}, this.value)">
                    ${(adminState.dropdowns.orteMitMaps||[]).map(o => `<option value="${o[0]}" ${o[0]===t.ort?'selected':''}>${o[0]}</option>`).join('')}
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm" onchange="adminState.termine[${i}].kategorie=this.value">
                    ${(adminState.dropdowns.kategorien||[]).map(k => `<option value="${k}" ${k===t.kategorie?'selected':''}>${k}</option>`).join('')}
                </select>
            </td>
             <td>
                <select class="form-select form-select-sm" onchange="adminState.termine[${i}].status=this.value">
                    ${['fix', 'provisorisch', 'abgesagt'].map(s => `<option value="${s}" ${s===t.status?'selected':''}>${s}</option>`).join('')}
                </select>
            </td>
            <td><button class="btn btn-link text-danger p-0" onclick="removeTermin(${i})">🗑️</button></td>
        </tr>
    `).join('');
}

function renderAnmeldungenList() {
    const tbody = document.getElementById('anmelde-body');
    if(!tbody || !adminState.anmeldungen) return;
    
    tbody.innerHTML = adminState.anmeldungen.map(a => `
        <tr>
            <td>${a.vorname} ${a.nachname}</td>
            <td><span class="badge bg-${a.teilnahme==='Ja'?'success':'danger'}">${a.teilnahme}</span></td>
            <td><small>${a.zeitstempel ? a.zeitstempel.split('T')[0] : '-'}</small></td>
        </tr>`).join('');
}

function renderProtokollList() {
     const div = document.getElementById('protokoll-list');
     if(!div || !adminState.protokoll) return;
     div.innerHTML = adminState.protokoll.map(p => `<div><strong>${p.benutzer}</strong>: ${p.details} <span class="float-end">${p.zeitstempel ? p.zeitstempel.split('T')[0] : ''}</span></div><hr class="my-1">`).join('');
}

// --- ACTIONS ---

function addTerminRow() {
    // Neuen leeren Termin hinzufügen
    adminState.termine.push({
        datum: new Date().toISOString().split('T')[0],
        startzeit: "19:00",
        endzeit: "22:00",
        anlasstitel: adminState.dropdowns.anlaesse[0] || "",
        ort: adminState.dropdowns.orteMitMaps[0][0] || "",
        kategorie: "Jahresprogramm",
        status: "provisorisch"
    });
    renderTermineList();
}

function removeTermin(index) {
    if(confirm("Termin wirklich löschen?")) {
        adminState.termine.splice(index, 1);
        renderTermineList();
    }
}

function updateTerminOrt(idx, ortName) {
    adminState.termine[idx].ort = ortName;
    const found = adminState.dropdowns.orteMitMaps.find(o => o[0] === ortName);
    if(found) adminState.termine[idx].austragungsorte_map = found[1];
}

async function saveAdminData() {
    if(!confirm("Alle Änderungen speichern?")) return;
    
    // Logik aus deinem alten Script übernehmen (Log generieren etc.)
    const user = localStorage.getItem('portal_user') || "Admin";
    
    // Payload vorbereiten
    const payload = {
        action: "saveAdminData",
        user: user,
        termine: adminState.termine,
        platzhalter: adminState.platzhalter,
        app_info: adminState.app_info,
        // ... weitere Felder nach Bedarf
    };

    try {
        await apiFetch('termine', '', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        alert("✅ Gespeichert!");
        loadTermineData(); // Reload
    } catch(e) {
        alert("Fehler beim Speichern: " + e);
    }
}

async function runAdminTool(toolName) {
    if(!confirm(`Tool "${toolName}" starten?`)) return;
    try {
        const res = await apiFetch('termine', '', {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'runTool', 
                tool: toolName, 
                user: localStorage.getItem('portal_user') 
            })
        });
        const data = await res.json();
        alert(data.success ? "✅ " + data.msg : "❌ Fehler: " + data.error);
    } catch(e) { alert("Netzwerkfehler: " + e); }
}

// Utils
function formatDate(v) { if(!v) return ""; try { return v.includes('T') ? v.split('T')[0] : v; } catch(e){return v;} }
function formatTime(v) { if(!v) return ""; return v.length > 5 ? v.substring(0,5) : v; }
