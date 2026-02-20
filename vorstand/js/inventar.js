// =========================================================
//  MODULE: INVENTAR
//  - Standalone-Version als Basis
//  - Integriert in Portal (apiFetch statt direktem fetch)
//  - Primärschlüssel: ID
//  - PDF-Quittungen + Pfand-Tracking
// =========================================================

let inventarState = null;
let sigPadMitglied, sigPadVorstand;


// =========================================================
//  ENTRY: called from main.js navTo('inventar')
// =========================================================
async function loadInventarData() {
    const container = document.getElementById('inventar-container');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Lade Inventar...</p>
        </div>`;

    try {
        const res = await apiFetch('inventar', 'action=getInventarData');
        inventarState = await res.json();

        renderInventarUI(container);

        // Label NACH DOM-Render setzen
        const label = document.getElementById('inv-verantwortlicher-label');
        if (label) label.innerText = currentUser;

        // SignaturePads initialisieren (nach DOM-Render)
        const canvasMitglied = document.getElementById('sig-mitglied');
        const canvasVorstand = document.getElementById('sig-vorstand');
        if (canvasMitglied) sigPadMitglied = new SignaturePad(canvasMitglied);
        if (canvasVorstand) sigPadVorstand = new SignaturePad(canvasVorstand);

        fillInventarDropdowns();
        renderInventoryTable();
        renderJournalTables();

        // Letzten aktiven Tab wiederherstellen
        const lastTab = localStorage.getItem('inventar-activeTab') || 'ausgabe';
        showInventarSection(lastTab);

    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler beim Laden: ${e.message}</div>`;
    }
}


// =========================================================
//  TEARDOWN
// =========================================================
function teardownInventar() {
    inventarState = null;
    sigPadMitglied = null;
    sigPadVorstand = null;
}


// =========================================================
//  UI SHELL
// =========================================================
function renderInventarUI(container) {
    container.innerHTML = `
        <style>
            #inventar-container .sig-container {
                border: 1px solid #ccc;
                background: white;
                height: 160px;
                border-radius: 8px;
                overflow: hidden;
            }
            #inventar-container canvas {
                width: 100% !important;
                height: 100% !important;
                touch-action: none;
            }
            #inventar-container .nav-btn {
                font-weight: bold;
                border-radius: 10px;
                padding: 8px 16px;
            }
            #inventar-container .table-sm { font-size: 0.85rem; }
        </style>

        <!-- NAV TABS -->
        <div class="d-flex flex-wrap gap-2 mb-4">
            <button class="btn btn-primary nav-btn" id="inv-btn-ausgabe"
                    onclick="showInventarSection('ausgabe')">📤 Buchung</button>
            <button class="btn btn-outline-secondary nav-btn" id="inv-btn-liste"
                    onclick="showInventarSection('liste')">📋 Bestand</button>
            <button class="btn btn-outline-secondary nav-btn" id="inv-btn-journal"
                    onclick="showInventarSection('journal')">📖 Journal</button>
            <button class="btn btn-outline-dark nav-btn" id="inv-btn-admin"
                    onclick="showInventarSection('admin')">⚙️ Admin</button>
        </div>

        <!-- SECTION: AUSGABE / BUCHUNG -->
        <div id="inv-section-ausgabe" class="inv-section">
            <div class="card border-0 shadow-sm p-4">
                <form id="form-ausgabe" onsubmit="handleInventarSubmit(event)">
                    <div class="row">
                        <div class="col-md-6 border-end">
                            <label class="form-label fw-bold">Aktion</label>
                            <select id="select-action" class="form-select mb-3"
                                    onchange="toggleBookingFields()">
                                <option value="checkout">📤 Ausgabe</option>
                                <option value="checkin">📥 Rückgabe</option>
                            </select>

                            <label class="form-label fw-bold">Mitglied</label>
                            <select id="select-mitglied" class="form-select mb-3" required></select>

                            <label class="form-label fw-bold">Kategorie</label>
                            <select id="select-kategorie" class="form-select mb-3"
                                    onchange="updateSubOptions()">
                                <option value="gewehr">Gewehr</option>
                                <option value="schluessel">Schlüssel</option>
                                <option value="kleidung">Kleidung</option>
                                <option value="schiessbekleidung">Schiessbekleidung</option>
                            </select>

                            <label class="form-label fw-bold">Gegenstand</label>
                            <select id="select-gegenstand" class="form-select mb-3" required></select>

                            <div id="container-zustand-abgabe">
                                <label class="form-label fw-bold text-primary">Zustand bei Abgabe</label>
                                <select id="select-zustand-abgabe" class="form-select mb-3"></select>
                            </div>
                            <div id="container-zustand-rueckgabe" class="d-none">
                                <label class="form-label fw-bold text-danger">Zustand bei Rückgabe</label>
                                <select id="select-zustand-rueckgabe" class="form-select mb-3"></select>
                            </div>

                            <label class="form-label fw-bold">Bemerkungen</label>
                            <textarea id="trans-bemerkungen" class="form-control mb-3" rows="2"></textarea>

                            <div class="row g-2">
                                <div class="col-4">
                                    <label class="form-label fw-bold small">Pfandbetrag</label>
                                    <input type="number" id="pfand-betrag" class="form-control" placeholder="0.00" step="0.01">
                                </div>
                                <div class="col-4" id="container-pfand-einnahme">
                                    <label class="form-label fw-bold small">Einnahme</label>
                                    <select id="pfand-einnahme" class="form-select">
                                        <option value="Nein">Nein</option>
                                        <option value="Ja">Ja</option>
                                    </select>
                                </div>
                                <div class="col-4 d-none" id="container-pfand-retour">
                                    <label class="form-label fw-bold small">Retour bezahlt</label>
                                    <select id="pfand-retour" class="form-select">
                                        <option value="Nein">Nein</option>
                                        <option value="Ja">Ja</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-bold">Unterschrift Mitglied</label>
                            <div class="sig-container mb-2">
                                <canvas id="sig-mitglied"></canvas>
                            </div>
                            <button type="button" class="btn btn-sm btn-link text-danger p-0 mb-3"
                                    onclick="sigPadMitglied.clear()">Löschen</button>

                            <div class="alert alert-light border py-2 mb-3 small">
                                <i class="fas fa-user-check text-success"></i>
                                Verantwortlich: <strong id="inv-verantwortlicher-label"></strong>
                            </div>

                            <label class="form-label fw-bold">Unterschrift Vorstand</label>
                            <div class="sig-container mb-2">
                                <canvas id="sig-vorstand"></canvas>
                            </div>
                            <button type="button" class="btn btn-sm btn-link text-danger p-0"
                                    onclick="sigPadVorstand.clear()">Löschen</button>
                        </div>
                    </div>
                    <button type="submit"
                            class="btn btn-success w-100 mt-4 py-3 fw-bold inv-submit">
                        Transaktion speichern
                    </button>
                </form>
            </div>
        </div>

        <!-- SECTION: BESTAND -->
        <div id="inv-section-liste" class="inv-section d-none">
            <div class="card border-0 shadow-sm p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Bestandsliste</h4>
                    <select id="filter-liste" class="form-select w-auto"
                            onchange="renderInventoryTable()">
                        <option value="Inventar_Gewehre">Gewehre</option>
                        <option value="Inventar_Schluessel">Schlüssel</option>
                        <option value="Inventar_Kleidung">Kleidung</option>
                        <option value="Inventar_Schiessbekleidung">Schiessbekleidung</option>
                        <option value="Personendaten">Mitglieder</option>
                    </select>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover table-sm align-middle"
                           id="inventory-table"></table>
                </div>
            </div>
        </div>

        <!-- SECTION: JOURNAL -->
        <div id="inv-section-journal" class="inv-section d-none">
            <!-- Offene Ausleihen wird dynamisch eingefügt -->
            
            <div class="card border-0 shadow-sm p-4 mb-4">
                <h4>📖 Material-Bewegungen</h4>
                <div class="table-responsive">
                    <table class="table table-hover table-sm"
                           id="table-transaktionen"></table>
                </div>
            </div>
            <div class="card border-0 shadow-sm p-4">
                <h4>🛡️ Admin-Protokoll</h4>
                <div class="table-responsive">
                    <table class="table table-hover table-sm text-muted"
                           id="table-protokoll"></table>
                </div>
            </div>
        </div>

        <!-- SECTION: ADMIN -->
        <div id="inv-section-admin" class="inv-section d-none">
            <div class="card border-0 shadow-sm p-4">
                <h4>Neuen Eintrag erfassen</h4>
                <select id="admin-target" class="form-select mb-4"
                        onchange="renderAdminFields(this.value)">
                    <option value="">-- Typ wählen --</option>
                    <option value="Personendaten">👤 Mitglied</option>
                    <option value="Inventar_Gewehre">🔫 Gewehr</option>
                    <option value="Inventar_Schluessel">🔑 Schlüssel</option>
                    <option value="Inventar_Kleidung">👕 Kleidung</option>
                    <option value="Inventar_Schiessbekleidung">🎯 Schiessbekleidung</option>
                </select>
                <form id="adminForm" onsubmit="saveNewInventarItem(event)">
                    <div id="dynamic-fields" class="row"></div>
                    <button type="submit"
                            class="btn btn-success mt-4 d-none inv-submit"
                            id="btn-admin-save">Speichern</button>
                </form>
            </div>
        </div>
    `;
}


// =========================================================
//  NAV
// =========================================================
function showInventarSection(id) {
    localStorage.setItem('inventar-activeTab', id);
    document.querySelectorAll('.inv-section').forEach(s => s.classList.add('d-none'));
    const el = document.getElementById('inv-section-' + id);
    if (el) el.classList.remove('d-none');
    document.querySelectorAll('#inventar-container .nav-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-secondary');
    });
    const active = document.getElementById('inv-btn-' + id);
    if (active) {
        active.classList.remove('btn-outline-secondary');
        active.classList.add('btn-primary');
    }
}


// =========================================================
//  DROPDOWNS
// =========================================================
function fillInventarDropdowns() {
    if (!inventarState || !inventarState.mitglieder) return;

    const sorted = [...inventarState.mitglieder]
        .sort((a, b) => (a.Nachname || "").localeCompare(b.Nachname || ""));
    const optionsHtml = '<option value="">-- wählen --</option>' +
        sorted.map(m => `<option value="${m.ID}">${m.Nachname} ${m.Vorname}</option>`).join('');

    document.getElementById('select-mitglied').innerHTML = optionsHtml;

    if (inventarState.config) {
        const zOptions = '<option value="">-- wählen --</option>' +
            inventarState.config
                .map(c => c.Transaktion_Zustand)
                .filter(v => v)
                .map(v => `<option value="${v}">${v}</option>`)
                .join('');
        document.getElementById('select-zustand-abgabe').innerHTML = zOptions;
        document.getElementById('select-zustand-rueckgabe').innerHTML = zOptions;
    }
    updateSubOptions();
}

function toggleBookingFields() {
    const isCheckout = document.getElementById('select-action').value === 'checkout';
    document.getElementById('container-zustand-abgabe').classList.toggle('d-none', !isCheckout);
    document.getElementById('container-zustand-rueckgabe').classList.toggle('d-none', isCheckout);
    document.getElementById('container-pfand-einnahme').classList.toggle('d-none', !isCheckout);
    document.getElementById('container-pfand-retour').classList.toggle('d-none', isCheckout);
    updateSubOptions(); // Gegenstand-Liste aktualisieren
}

function updateSubOptions() {
    if (!inventarState) return;
    const kat = document.getElementById('select-kategorie').value;
    const action = document.getElementById('select-action').value;
    const keyMap = {
        "gewehr": "gewehre",
        "schluessel": "schluessel",
        "kleidung": "kleidung",
        "schiessbekleidung": "schiessbekleidung"
    };
    const items = inventarState[keyMap[kat]] || [];

    document.getElementById('select-gegenstand').innerHTML = items.map(i => {
        const isOut = i.Aktueller_Besitzer_ID && i.Aktueller_Besitzer_ID.toString() !== "0";
        // Ausgabe: nur verfügbare (🟢), Rückgabe: nur verliehene (🔴)
        const disabled = (action === 'checkout' && isOut) || (action === 'checkin' && !isOut);
        const label = getItemLabel(kat, i);
        return `<option value="${i.ID}" ${disabled ? 'disabled style="color:#ccc"' : ''}>
            ${label} ${isOut ? '🔴' : '🟢'}
        </option>`;
    }).join('');
}


// =========================================================
//  TABELLEN
// =========================================================
function getInventarNameFromId(id) {
    if (!id || id === "" || id === 0 || id === "0") return "";
    if (!inventarState || !inventarState.mitglieder) return id;
    const m = inventarState.mitglieder.find(member => member.ID.toString() === id.toString());
    return m ? `${m.Nachname} ${m.Vorname}` : id;
}

function getItemLabel(kat, item) {
    if (kat === 'gewehr') return `${item.Hersteller} ${item.Modell} (${item.Laufnummer})`;
    if (kat === 'schluessel') return `${item.Bezeichnung} (${item.Nummer})`;
    return `${item.Typ} (${item.Groesse})`;
}

function renderInventoryTable() {
    if (!inventarState) return;
    const target = document.getElementById('filter-liste').value;
    const keyMap = {
        "Inventar_Gewehre": "gewehre",
        "Inventar_Schluessel": "schluessel",
        "Inventar_Kleidung": "kleidung",
        "Inventar_Schiessbekleidung": "schiessbekleidung",
        "Personendaten": "mitglieder"
    };
    const data = inventarState[keyMap[target]];
    const table = document.getElementById('inventory-table');

    if (!data || data.length === 0) {
        table.innerHTML = "<thead><tr><th>Keine Daten vorhanden</th></tr></thead>";
        return;
    }

    const allHeaders = Object.keys(data[0]);
    const displayHeaders = allHeaders.filter(h => h !== "ID");

    let html = `<thead><tr class="table-dark">`;
    displayHeaders.forEach(h => html += `<th>${h.replace(/_/g, ' ')}</th>`);
    html += `<th>Aktion</th></tr></thead><tbody>`;

    html += data.map(row => {
        const cells = displayHeaders.map(key => {
            const val = row[key];
            if (key.endsWith("_ID") || key === "Aktueller_Besitzer_ID") {
                return `<td>${getInventarNameFromId(val) || '<span class="text-muted">-</span>'}</td>`;
            }
            if (key === "Status") {
                if (val === "Im Lager") return `<td><span class="badge bg-success">Lager</span></td>`;
                if (val === "Ausgegeben") return `<td><span class="badge bg-warning text-dark">Ausleihe</span></td>`;
            }
            if (key === "Zeitstempel" && val) {
                try { return `<td>${new Date(val).toLocaleDateString('de-CH')}</td>`; }
                catch (e) { return `<td>${val}</td>`; }
            }
            if (key.toLowerCase().includes("pfand") || key === "Depot") {
                return `<td class="fw-bold">${val ? parseFloat(val).toFixed(2) : '0.00'}</td>`;
            }
            return `<td>${val || ''}</td>`;
        }).join('');

        return `<tr>${cells}<td>
    <div class="btn-group">
        <button class="btn btn-sm btn-outline-primary" 
                onclick="editInventarItem('${target}', '${row.ID}')">✏️</button>
        <button class="btn btn-sm btn-outline-danger"
                onclick="deleteInventarItem('${target}', '${row.ID}')">🗑️</button>
    </div>
</td></tr>`;
    }).join('');

    table.innerHTML = html + "</tbody>";
}

function renderJournalTables() {
    if (!inventarState) return;

    // 1. Offene Ausleihen
    renderOffeneAusleihen();

    // 2. Transaktionen
    const transTable = document.getElementById('table-transaktionen');
    if (inventarState.transaktionen && inventarState.transaktionen.length > 0) {
        let html = `<thead><tr class="table-dark">
            <th>Datum</th><th>Mitglied</th><th>Aktion</th><th>Kategorie</th><th>ID</th><th>Bemerkung</th>
        </tr></thead><tbody>`;
        [...inventarState.transaktionen].reverse().slice(0, 30).forEach(t => {
            const date = t.Zeitstempel
                ? new Date(t.Zeitstempel).toLocaleDateString('de-CH') : '-';
            html += `<tr>
                <td>${date}</td>
                <td>${getInventarNameFromId(t.Mitglied_ID)}</td>
                <td>${t.Typ === 'checkout' ? '📤' : '📥'}</td>
                <td><span class="badge bg-secondary">${t.Kategorie || '-'}</span></td>
                <td><small class="text-muted">${t.Inventar_ID}</small></td>
                <td>${t.Bemerkungen || ''}</td>
            </tr>`;
        });
        transTable.innerHTML = html + "</tbody>";
    } else {
        transTable.innerHTML = "<tr><td>Noch keine Transaktionen geloggt.</td></tr>";
    }

    // 3. Protokoll
    const logTable = document.getElementById('table-protokoll');
    if (inventarState.protokoll && inventarState.protokoll.length > 0) {
        let html = `<thead><tr class="table-secondary">
            <th>Zeit</th><th>Aktion</th><th>Tabelle</th><th>Details</th>
        </tr></thead><tbody>`;
        [...inventarState.protokoll].reverse().slice(0, 20).forEach(p => {
            const time = p.Zeitstempel
                ? new Date(p.Zeitstempel).toLocaleString('de-CH', {
                    hour: '2-digit', minute: '2-digit',
                    day: '2-digit', month: '2-digit'
                }) : '-';
            html += `<tr>
                <td><small>${time}</small></td>
                <td><strong>${p.Aktion}</strong></td>
                <td><small>${p.Tabelle}</small></td>
                <td><small>${p.Details}</small></td>
            </tr>`;
        });
        logTable.innerHTML = html + "</tbody>";
    } else {
        logTable.innerHTML = "<tr><td>Keine Admin-Aktionen protokolliert.</td></tr>";
    }
}

// Bereitet das Admin-Formular mit bestehenden Daten vor
function editInventarItem(targetSheet, id) {
    // 1. Zum Admin-Tab wechseln
    showInventarSection('admin');
    
    // 2. Dropdown auf den richtigen Typ setzen und Felder generieren
    const select = document.getElementById('admin-target');
    select.value = targetSheet;
    renderAdminFields(targetSheet);

    // 3. Daten aus dem State suchen
    const keyMap = {
        "Inventar_Gewehre": "gewehre",
        "Inventar_Schluessel": "schluessel",
        "Inventar_Kleidung": "kleidung",
        "Inventar_Schiessbekleidung": "schiessbekleidung",
        "Personendaten": "mitglieder"
    };
    const data = inventarState[keyMap[targetSheet]].find(item => item.ID.toString() === id.toString());

    if (data) {
        // 4. Hidden Field für die ID hinzufügen (damit das Backend weiß, es ist ein Update)
        let idField = document.getElementById('admin-edit-id');
        if (!idField) {
            idField = document.createElement('input');
            idField.type = 'hidden';
            idField.id = 'admin-edit-id';
            idField.name = 'ID';
            document.getElementById('adminForm').appendChild(idField);
        }
        idField.value = id;

        // 5. Felder befüllen
        const form = document.getElementById('adminForm');
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = data[key];
        });
        
        // Button-Text ändern
        document.getElementById('btn-admin-save').innerText = "Änderungen speichern";
        document.getElementById('btn-admin-save').classList.replace('btn-success', 'btn-warning');
    }
}


function renderOffeneAusleihen() {
    const journalSection = document.getElementById('inv-section-journal');
    
    // Alte Tabelle entfernen falls vorhanden
    const existing = journalSection.querySelector('.offene-ausleihen-card');
    if (existing) existing.remove();

    let offeneHTML = `
        <div class="card border-0 shadow-sm p-4 mb-4 offene-ausleihen-card">
            <h4>📋 Offene Ausleihen</h4>
            <div class="table-responsive">
                <table class="table table-hover table-sm">
                    <thead><tr class="table-info">
                        <th>Mitglied</th>
                        <th>Kategorie</th>
                        <th>Gegenstand</th>
                        <th>Seit</th>
                        <th>Pfand</th>
                    </tr></thead>
                    <tbody>`;

    const keyMap = { "gewehre":"gewehr", "schluessel":"schluessel",
                     "kleidung":"kleidung", "schiessbekleidung":"schiessbekleidung" };

    let hasOpen = false;
    Object.keys(keyMap).forEach(key => {
        const items = inventarState[key] || [];
        items.forEach(item => {
            if (item.Aktueller_Besitzer_ID && item.Aktueller_Besitzer_ID !== "0") {
                hasOpen = true;
                const mitglied = getInventarNameFromId(item.Aktueller_Besitzer_ID);
                const itemLabel = getItemLabel(keyMap[key], item);
                
                // Pfand-Info holen
                const pfand = inventarState.pfand?.find(p => 
                    p.Inventar_ID === item.ID && p.Status === "Offen"
                );
                const pfandStr = pfand ? `CHF ${parseFloat(pfand.Betrag).toFixed(2)}` : '-';
                
                // Ausgabe-Datum aus Transaktionen
                const trans = [...(inventarState.transaktionen || [])]
                    .reverse()
                    .find(t => t.Inventar_ID === item.ID && t.Typ === 'checkout');
                const seit = trans?.Zeitstempel 
                    ? new Date(trans.Zeitstempel).toLocaleDateString('de-CH') 
                    : '-';

                offeneHTML += `<tr>
                    <td>${mitglied}</td>
                    <td><span class="badge bg-secondary">${keyMap[key]}</span></td>
                    <td>${itemLabel}</td>
                    <td>${seit}</td>
                    <td class="fw-bold">${pfandStr}</td>
                </tr>`;
            }
        });
    });

    if (!hasOpen) {
        offeneHTML += `<tr><td colspan="5" class="text-muted text-center">
            Keine offenen Ausleihen
        </td></tr>`;
    }

    offeneHTML += `</tbody></table></div></div>`;

    // Einfügen VOR den bestehenden Tabellen
    journalSection.insertAdjacentHTML('afterbegin', offeneHTML);
}


// =========================================================
//  ADMIN FELDER
// =========================================================
function renderAdminFields(target) {
    const fieldsDiv = document.getElementById('dynamic-fields');
    const saveBtn = document.getElementById('btn-admin-save');
    if (!target || !inventarState) {
        fieldsDiv.innerHTML = "";
        saveBtn.classList.add('d-none');
        return;
    }
    saveBtn.classList.remove('d-none');

    const configs = {
        "Personendaten": ["PersonNumber", "Vorname", "Nachname", "email", "BirthDate", "Status"],
        "Inventar_Gewehre": ["Hersteller", "Modell", "Laufnummer", "Diopter", "Ringkorn",
            "Zubehoer", "Spezielles", "Distanz", "Eigentümer_ID",
            "Gespendet_ID", "Kauf_Spender_Jahr", "Verkaeufer_ID"],
        "Inventar_Schluessel": ["Bezeichnung", "Nummer"],
        "Inventar_Kleidung": ["Typ", "Groesse", "Kaufdatum"],
        "Inventar_Schiessbekleidung": ["Typ", "Groesse", "Kaufdatum"]
    };

    const dropdownMapping = {
        "Status": "MG_Status",
        "Bezeichnung": "Schluessel_Bezeichnung",
        "Distanz": "Gewehre_Distanz",
        "Typ": target === "Inventar_Schiessbekleidung" ? "Schiessbekleidung_Typ" : "Kleidung_Typ",
        "Groesse": "Kleidung_Schiessbekleidung_Groesse"
    };

    fieldsDiv.innerHTML = (configs[target] || []).map(field => {
        if (field.endsWith("_ID")) {
            const sorted = [...inventarState.mitglieder]
                .sort((a, b) => (a.Nachname || "").localeCompare(b.Nachname || ""));
            const options = sorted
                .map(m => `<option value="${m.ID}">${m.Nachname} ${m.Vorname}</option>`)
                .join('');
            return `<div class="col-md-6 mb-3">
                <label class="fw-bold">${field}</label>
                <select name="${field}" class="form-select">
                    <option value="">-- Mitglied wählen --</option>${options}
                </select></div>`;
        }
        if (dropdownMapping[field]) {
            const configKey = dropdownMapping[field];
            const options = inventarState.config
                .map(c => c[configKey]).filter(v => v)
                .map(v => `<option value="${v}">${v}</option>`).join('');
            return `<div class="col-md-6 mb-3">
                <label class="fw-bold">${field}</label>
                <select name="${field}" class="form-select">
                    <option value="">-- wählen --</option>${options}
                </select></div>`;
        }
        const type = (field.includes("datum") || field.includes("Date") || field.includes("Jahr"))
            ? "date" : "text";
        return `<div class="col-md-6 mb-3">
            <label class="fw-bold">${field}</label>
            <input type="${type}" name="${field}" class="form-control">
        </div>`;
    }).join('');
}


// =========================================================
//  SUBMIT / SAVE / DELETE
// =========================================================
async function handleInventarSubmit(e) {
    e.preventDefault();
    setInventarBusy(true);

    const action = document.getElementById('select-action').value;
    const mitgliedId = document.getElementById('select-mitglied').value;
    const kategorie = document.getElementById('select-kategorie').value;
    const itemId = document.getElementById('select-gegenstand').value;

    // ✅ Doppelbuchungs-Check bei Rückgabe
    if (action === 'checkin') {
        const keyMap = { "gewehr":"gewehre", "schluessel":"schluessel",
                         "kleidung":"kleidung", "schiessbekleidung":"schiessbekleidung" };
        const item = inventarState[keyMap[kategorie]]?.find(i => i.ID === itemId);
        if (!item || item.Aktueller_Besitzer_ID !== mitgliedId) {
            alert("⚠️ Dieser Gegenstand ist nicht bei diesem Mitglied!");
            setInventarBusy(false);
            return;
        }
    }

    const payload = {
        action: action,
        type: action,
        mitgliedId: mitgliedId,
        kategorie: kategorie,
        itemId: itemId,
        zustandAbgabe: document.getElementById('select-zustand-abgabe').value,
        zustandRueckgabe: document.getElementById('select-zustand-rueckgabe').value,
        bemerkungen: document.getElementById('trans-bemerkungen').value,
        verantwortlicheId: currentUser,
        pfandBetrag: document.getElementById('pfand-betrag').value,
        pfandEinnahme: document.getElementById('pfand-einnahme').value,
        pfandRetour: document.getElementById('pfand-retour').value,
        sigMitglied: sigPadMitglied ? sigPadMitglied.toDataURL() : "",
        sigVorstand: sigPadVorstand ? sigPadVorstand.toDataURL() : ""
    };

    try {
        const res = await apiFetch('inventar', '', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        // ✅ PDF-Quittung generieren
        await generateQuittungPDF(payload, result.transactionId);

        e.target.reset();
        if (sigPadMitglied) sigPadMitglied.clear();
        if (sigPadVorstand) sigPadVorstand.clear();
        await loadInventarData();
        showInventarSection('liste');
        alert("✅ Buchung erfolgreich! PDF wird heruntergeladen.");
    } catch (err) {
        alert("Fehler: " + err.message);
    }

    setInventarBusy(false);
}

// Ergänzung in saveNewInventarItem (am Anfang der Funktion):
async function saveNewInventarItem(e) {
    e.preventDefault();
    setInventarBusy(true);

    const target = document.getElementById('admin-target').value;
    const fields = {};
    new FormData(e.target).forEach((v, k) => fields[k] = v);

    // Falls eine ID existiert, nennen wir die Aktion "updateItem" statt "addNewItem"
    const isUpdate = fields.ID && fields.ID !== "";
    const action = isUpdate ? "updateItem" : "addNewItem";

    try {
        await apiFetch('inventar', '', {
            method: 'POST',
            body: JSON.stringify({ action: action, targetSheet: target, fields })
        });
        
        // Reset
        e.target.reset();
        const idField = document.getElementById('admin-edit-id');
        if(idField) idField.remove();
        
        document.getElementById('btn-admin-save').innerText = "Speichern";
        document.getElementById('btn-admin-save').classList.replace('btn-warning', 'btn-success');
        
        await loadInventarData();
        alert(isUpdate ? "✅ Änderung gespeichert!" : "✅ Neu erfasst!");
    } catch (err) {
        alert("Fehler: " + err.message);
    }
    setInventarBusy(false);
}

async function deleteInventarItem(target, id) {
    if (!confirm("Eintrag wirklich löschen?")) return;
    setInventarBusy(true);

    try {
        await apiFetch('inventar', '', {
            method: 'POST',
            body: JSON.stringify({ action: "deleteItem", targetSheet: target, itemId: id })
        });
        await loadInventarData();
    } catch (err) {
        alert("Fehler: " + err.message);
    }

    setInventarBusy(false);
}


// =========================================================
//  PDF-QUITTUNG
// =========================================================
async function generateQuittungPDF(data, transId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("Sportschützen Muhen", 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    const typ = data.type === 'checkout' ? 'AUSGABE-QUITTUNG' : 'RÜCKNAHME-QUITTUNG';
    doc.text(typ, 105, 32, { align: 'center' });

    // Linie
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    // Daten
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const mitglied = inventarState.mitglieder.find(m => m.ID === data.mitgliedId);
    const mitgliedName = mitglied ? `${mitglied.Nachname} ${mitglied.Vorname}` : data.mitgliedId;
    
    const keyMap = { "gewehr":"gewehre", "schluessel":"schluessel",
                     "kleidung":"kleidung", "schiessbekleidung":"schiessbekleidung" };
    const item = inventarState[keyMap[data.kategorie]]?.find(i => i.ID === data.itemId);
    const itemLabel = item ? getItemLabel(data.kategorie, item) : data.itemId;

    let y = 50;
    doc.text(`Datum:`, 20, y);
    doc.text(new Date().toLocaleDateString('de-CH'), 80, y);
    
    y += 10;
    doc.text(`Transaktion-ID:`, 20, y);
    doc.text(`T-${transId}`, 80, y);
    
    y += 10;
    doc.text(`Mitglied:`, 20, y);
    doc.text(mitgliedName, 80, y);
    
    y += 10;
    doc.text(`Kategorie:`, 20, y);
    doc.text(data.kategorie.toUpperCase(), 80, y);
    
    y += 10;
    doc.text(`Gegenstand:`, 20, y);
    doc.text(itemLabel, 80, y);
    
    y += 10;
    const zustand = data.type === 'checkout' ? data.zustandAbgabe : data.zustandRueckgabe;
    doc.text(`Zustand:`, 20, y);
    doc.text(zustand || '-', 80, y);

    if (data.pfandBetrag && parseFloat(data.pfandBetrag) > 0) {
        y += 10;
        doc.setFont(undefined, 'bold');
        doc.text(`Pfandbetrag:`, 20, y);
        doc.text(`CHF ${parseFloat(data.pfandBetrag).toFixed(2)}`, 80, y);
        doc.setFont(undefined, 'normal');
        
        y += 8;
        const pfandStatus = data.type === 'checkout' 
            ? (data.pfandEinnahme === 'Ja' ? '✓ Kassiert' : '✗ Nicht kassiert')
            : (data.pfandRetour === 'Ja' ? '✓ Retour bezahlt' : '✗ Noch offen');
        doc.text(pfandStatus, 80, y);
    }

    if (data.bemerkungen) {
        y += 10;
        doc.text(`Bemerkungen:`, 20, y);
        const lines = doc.splitTextToSize(data.bemerkungen, 110);
        doc.text(lines, 80, y);
        y += lines.length * 5;
    }

    // Unterschriften
    y += 20;
    doc.setFont(undefined, 'bold');
    doc.text("Unterschriften:", 20, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    if (data.sigMitglied && data.sigMitglied !== "") {
        doc.addImage(data.sigMitglied, 'PNG', 20, y, 60, 20);
        doc.text("Mitglied", 20, y + 25);
    }

    if (data.sigVorstand && data.sigVorstand !== "") {
        doc.addImage(data.sigVorstand, 'PNG', 110, y, 60, 20);
        doc.text("Vorstand", 110, y + 25);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Sportschützen Muhen | www.schuetzen-muhen.ch", 105, 280, { align: 'center' });

    // Dateiname: YYYYMMDD_Typ_Kategorie_ID_Nachname_Vorname.pdf
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const typKurz = data.type === 'checkout' ? 'Ausgabe' : 'Rueckgabe';
    const filename = `${dateStr}_${typKurz}_${data.kategorie}_${data.itemId}_${mitglied?.Nachname || 'Unbekannt'}_${mitglied?.Vorname || ''}.pdf`;

    doc.save(filename);
}


// =========================================================
//  BUSY STATE (lokal, kein globales Overlay)
// =========================================================
function setInventarBusy(status) {
    document.querySelectorAll('.inv-submit').forEach(b => b.disabled = status);
}
