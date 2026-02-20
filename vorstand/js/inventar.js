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
//  HILFSFUNKTION: Datum-Formatierung tt.mm.jjjj
// =========================================================
function formatCH(val) {
    if (!val || val === "" || val === 0) return '-';
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('de-CH', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }
    return val;
}

function formatCHDateTime(val) {
    if (!val || val === "" || val === 0) return '-';
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
        return d.toLocaleString('de-CH', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    return val;
}


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

        const label = document.getElementById('inv-verantwortlicher-label');
        if (label) label.innerText = currentUser;

        const canvasMitglied = document.getElementById('sig-mitglied');
        const canvasVorstand = document.getElementById('sig-vorstand');
        if (canvasMitglied) sigPadMitglied = new SignaturePad(canvasMitglied);
        if (canvasVorstand) sigPadVorstand = new SignaturePad(canvasVorstand);

        fillInventarDropdowns();
        renderInventoryTable();
        renderJournalTables();

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
                                    <input type="number" id="pfand-betrag" class="form-control"
                                           placeholder="0.00" step="0.01">
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
                    <button type="submit" class="btn btn-success w-100 mt-4 py-3 fw-bold inv-submit">
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
                    <table class="table table-hover table-sm" id="table-transaktionen"></table>
                </div>
            </div>
            <div class="card border-0 shadow-sm p-4">
                <h4>🛡️ Admin-Protokoll</h4>
                <div class="table-responsive">
                    <table class="table table-hover table-sm text-muted" id="table-protokoll"></table>
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
                    <button type="submit" class="btn btn-success mt-4 d-none inv-submit"
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
        sorted.map(m =>
            `<option value="${m.ID}">${m.Nachname} ${m.Vorname}</option>`
        ).join('');
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
    updateSubOptions();
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
        const isOut = i.Aktueller_Besitzer_ID &&
                      i.Aktueller_Besitzer_ID.toString() !== "0" &&
                      i.Aktueller_Besitzer_ID.toString() !== "";
        const disabled = (action === 'checkout' && isOut) || (action === 'checkin' && !isOut);
        const label = getItemLabel(kat, i);
        return `<option value="${i.ID}" ${disabled ? 'disabled style="color:#ccc"' : ''}>
            ${label} ${isOut ? '🔴' : '🟢'}
        </option>`;
    }).join('');
}


// =========================================================
//  HILFSFUNKTIONEN TABELLEN
// =========================================================
function getInventarNameFromId(id) {
    if (!id || id === "" || id === 0 || id === "0") return '-';
    if (!inventarState || !inventarState.mitglieder) return String(id);
    const m = inventarState.mitglieder.find(
        member => member.ID.toString() === id.toString()
    );
    return m ? `${m.Nachname} ${m.Vorname}` : String(id);
}

function getItemLabel(kat, item) {
    if (!item) return '-';
    if (kat === 'gewehr')
        return `${item.Hersteller || ''} ${item.Modell || ''} (${item.Laufnummer || '-'})`.trim();
    if (kat === 'schluessel')
        return `${item.Bezeichnung || ''} (${item.Nummer || '-'})`.trim();
    return `${item.Typ || ''} (${item.Groesse || '-'})`.trim();
}


// =========================================================
//  FIX: getItemLabelFromTrans
//  Echtes Feld: t.Inventar_ID (kann Zahl sein!), t.Kategorie
// =========================================================
function getItemLabelFromTrans(t) {
    if (!t || !t.Inventar_ID) return '-';
    const kat = (t.Kategorie || "").toLowerCase();
    const keyMap = {
        "gewehr":            "gewehre",
        "schluessel":        "schluessel",
        "kleidung":          "kleidung",
        "schiessbekleidung": "schiessbekleidung"
    };
    const stateKey = keyMap[kat];
    if (!stateKey || !inventarState[stateKey]) return String(t.Inventar_ID);
    const item = inventarState[stateKey].find(
        i => i.ID.toString() === t.Inventar_ID.toString()
    );
    return item ? getItemLabel(kat, item) : String(t.Inventar_ID);
}

// =========================================================
//  BESTANDESLISTE
// =========================================================
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

            // _ID Felder → Name auflösen
            if (key.endsWith("_ID") || key === "Aktueller_Besitzer_ID") {
                const name = getInventarNameFromId(val);
                return `<td>${name || '<span class="text-muted">-</span>'}</td>`;
            }

            // Status Badge
            if (key === "Status") {
                if (val === "Im Lager")
                    return `<td><span class="badge bg-success">Lager</span></td>`;
                if (val === "Ausgegeben")
                    return `<td><span class="badge bg-warning text-dark">Ausleihe</span></td>`;
                return `<td><span class="badge bg-secondary">${val || '-'}</span></td>`;
            }

            // ⬇ FIX: Alle Datumsfelder einheitlich tt.mm.jjjj
            const dateKeys = ['Zeitstempel', 'Kaufdatum', 'BirthDate', 'Kassiert_Am',
                              'Retour_Am', 'Kauf_Spender_Jahr', 'datum', 'Date'];
            const isDateKey = dateKeys.some(dk =>
                key.toLowerCase().includes(dk.toLowerCase())
            );
            if (isDateKey && val) {
                return `<td>${formatCH(val)}</td>`;
            }

            // Pfand/Depot → CHF-Betrag
            if (key.toLowerCase().includes("pfand") || key === "Depot") {
                return `<td class="fw-bold">${val ? parseFloat(val).toFixed(2) : '0.00'}</td>`;
            }

            return `<td>${val !== undefined && val !== null && val !== "" ? val : '-'}</td>`;
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



// =========================================================
//  FIX: renderJournalTables
//  - t.Aktueller_Besitzer_ID (nicht Mitglied_ID)
//  - t.Aktion: 'AUSGABE'/'CHECKOUT' vs 'CHECKIN'
//  - Protokoll: Spalte heisst 'Nutzer (Vorstand)', kein 'Tabelle'
// =========================================================
function renderJournalTables() {
    if (!inventarState) return;

    renderOffeneAusleihen();

    // 2. Material-Bewegungen
    const transTable = document.getElementById('table-transaktionen');
    if (inventarState.transaktionen && inventarState.transaktionen.length > 0) {

        let html = `<thead><tr class="table-dark">
            <th>Datum</th>
            <th>Mitglied</th>
            <th>Aktion</th>
            <th>Kategorie</th>
            <th>Gegenstand</th>
            <th>Bemerkung</th>
        </tr></thead><tbody>`;

        [...inventarState.transaktionen].reverse().slice(0, 30).forEach(t => {
            const date     = formatCH(t.Zeitstempel);

            // ✅ FIX: echtes Feld heisst Aktueller_Besitzer_ID
            const mitglied = getInventarNameFromId(t.Aktueller_Besitzer_ID);

            // ✅ FIX: Aktion heisst 'AUSGABE'/'CHECKOUT'/'CHECKIN'
            const aktion   = (t.Aktion || "").toUpperCase();
            const istAusgabe = aktion === 'AUSGABE' || aktion === 'CHECKOUT';
            const aktionBadge = istAusgabe
                ? '<span class="badge bg-primary">Ausgabe</span>'
                : '<span class="badge bg-success">Rückgabe</span>';

            // ✅ FIX: Kategorie korrekt
            const kat = t.Kategorie || '-';

            // ✅ FIX: Gegenstand-Label
            const gegenstand = getItemLabelFromTrans(t);

            html += `<tr>
                <td>${date}</td>
                <td>${mitglied}</td>
                <td>${aktionBadge}</td>
                <td><span class="badge bg-secondary">${kat}</span></td>
                <td><small>${gegenstand}</small></td>
                <td><small class="text-muted">${t.Bemerkungen || ''}</small></td>
            </tr>`;
        });

        transTable.innerHTML = html + "</tbody>";
    } else {
        transTable.innerHTML = `<thead><tr class="table-dark">
            <th>Datum</th><th>Mitglied</th><th>Aktion</th>
            <th>Kategorie</th><th>Gegenstand</th><th>Bemerkung</th>
        </tr></thead>
        <tbody><tr><td colspan="6" class="text-muted text-center">
            Noch keine Transaktionen.
        </td></tr></tbody>`;
    }

    // 3. Admin-Protokoll
    // ✅ FIX: Spalten heissen 'Nutzer (Vorstand)', 'Aktion', 'Details', ''
    const logTable = document.getElementById('table-protokoll');
    if (inventarState.protokoll && inventarState.protokoll.length > 0) {

        let html = `<thead><tr class="table-secondary">
            <th>Zeit</th>
            <th>Nutzer</th>
            <th>Aktion</th>
            <th>Details</th>
        </tr></thead><tbody>`;

        [...inventarState.protokoll].reverse().slice(0, 20).forEach(p => {
            const time    = formatCHDateTime(p.Zeitstempel);
            const nutzer  = p['Nutzer (Vorstand)'] || '-';
            const aktion  = p.Aktion  || '-';
            // Details + leere Spalte zusammenführen
            const details = [p.Details, p['']].filter(v => v && v !== '').join(' | ') || '-';

            html += `<tr>
                <td><small>${time}</small></td>
                <td><small>${nutzer}</small></td>
                <td><strong>${aktion}</strong></td>
                <td><small>${details}</small></td>
            </tr>`;
        });

        logTable.innerHTML = html + "</tbody>";
    } else {
        logTable.innerHTML = `<thead><tr class="table-secondary">
            <th>Zeit</th><th>Nutzer</th><th>Aktion</th><th>Details</th>
        </tr></thead>
        <tbody><tr><td colspan="4" class="text-muted text-center">
            Keine Admin-Aktionen protokolliert.
        </td></tr></tbody>`;
    }
}





// =========================================================
//  FIX: renderOffeneAusleihen
//  - t.Aktion statt t.Typ
//  - t.Inventar_ID als String vergleichen (GAS liefert Zahl!)
// =========================================================
function renderOffeneAusleihen() {
    const journalSection = document.getElementById('inv-section-journal');

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

    const keyMap = {
        "gewehre":           "gewehr",
        "schluessel":        "schluessel",
        "kleidung":          "kleidung",
        "schiessbekleidung": "schiessbekleidung"
    };

    let hasOpen = false;

    Object.keys(keyMap).forEach(key => {
        const items = inventarState[key] || [];
        items.forEach(item => {
            const besitzer = item.Aktueller_Besitzer_ID;
            if (besitzer && besitzer.toString() !== "0" && besitzer.toString() !== "") {
                hasOpen = true;
                const mitglied  = getInventarNameFromId(besitzer);
                const itemLabel = getItemLabel(keyMap[key], item);

                // Pfand
                const pfand = (inventarState.pfand || []).find(p =>
                    p.Inventar_ID &&
                    p.Inventar_ID.toString() === item.ID.toString() &&
                    (p.Status || "").toLowerCase() === "offen"
                );
                const pfandStr = pfand
                    ? `CHF ${parseFloat(pfand.Betrag).toFixed(2)}`
                    : '-';

                // ✅ FIX: t.Aktion statt t.Typ, Inventar_ID als String
                const trans = [...(inventarState.transaktionen || [])]
                    .reverse()
  .find(t => {
    const aktion = (t.Aktion || "").toUpperCase();
    const istAusgabe = aktion === 'AUSGABE' || aktion === 'CHECKOUT';
    if (!istAusgabe) return false;

    // Direkter Vergleich (falls GAS ID als String speichert)
    if (t.Inventar_ID.toString() === item.ID.toString()) return true;

    // Numerischer Vergleich (falls GAS nur Zahl liefert, item.ID = "G-1")
    const numT = parseInt(t.Inventar_ID);
    const numI = parseInt(item.ID.toString().replace(/\D/g, ''));
    return !isNaN(numT) && !isNaN(numI) && numT === numI
           && (t.Kategorie || "").toLowerCase() === keyMap[key];
});

                const seit = trans?.Zeitstempel
                    ? formatCH(trans.Zeitstempel)
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
        offeneHTML += `<tr><td colspan="5" class="text-muted text-center py-3">
            ✅ Keine offenen Ausleihen
        </td></tr>`;
    }

    offeneHTML += `</tbody></table></div></div>`;
    journalSection.insertAdjacentHTML('afterbegin', offeneHTML);
}


// =========================================================
//  ADMIN: FELDER DYNAMISCH
// =========================================================
function renderAdminFields(target) {
    const fieldsDiv = document.getElementById('dynamic-fields');
    const saveBtn   = document.getElementById('btn-admin-save');
    if (!target || !inventarState) {
        fieldsDiv.innerHTML = "";
        saveBtn.classList.add('d-none');
        return;
    }
    saveBtn.classList.remove('d-none');

    const configs = {
        "Personendaten":           ["PersonNumber","Vorname","Nachname","email","BirthDate","Status"],
        "Inventar_Gewehre":        ["Hersteller","Modell","Laufnummer","Diopter","Ringkorn",
                                    "Zubehoer","Spezielles","Distanz","Eigentümer_ID",
                                    "Gespendet_ID","Kauf_Spender_Jahr","Verkaeufer_ID"],
        "Inventar_Schluessel":     ["Bezeichnung","Nummer"],
        "Inventar_Kleidung":       ["Typ","Groesse","Kaufdatum"],
        "Inventar_Schiessbekleidung": ["Typ","Groesse","Kaufdatum"]
    };

    const dropdownMapping = {
        "Status":      "MG_Status",
        "Bezeichnung": "Schluessel_Bezeichnung",
        "Distanz":     "Gewehre_Distanz",
        "Typ": target === "Inventar_Schiessbekleidung"
               ? "Schiessbekleidung_Typ" : "Kleidung_Typ",
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
                <label class="fw-bold">${field.replace(/_/g,' ')}</label>
                <select name="${field}" class="form-select">
                    <option value="">-- Mitglied wählen --</option>${options}
                </select></div>`;
        }
        if (dropdownMapping[field]) {
            const configKey = dropdownMapping[field];
            const options = (inventarState.config || [])
                .map(c => c[configKey]).filter(v => v)
                .map(v => `<option value="${v}">${v}</option>`).join('');
            return `<div class="col-md-6 mb-3">
                <label class="fw-bold">${field.replace(/_/g,' ')}</label>
                <select name="${field}" class="form-select">
                    <option value="">-- wählen --</option>${options}
                </select></div>`;
        }
        const isDate = ['datum','date','Jahr'].some(
            d => field.toLowerCase().includes(d.toLowerCase())
        );
        return `<div class="col-md-6 mb-3">
            <label class="fw-bold">${field.replace(/_/g,' ')}</label>
            <input type="${isDate ? 'date' : 'text'}" name="${field}" class="form-control">
        </div>`;
    }).join('');
}


// =========================================================
//  EDIT ITEM
// =========================================================
function editInventarItem(targetSheet, id) {
    showInventarSection('admin');

    const select = document.getElementById('admin-target');
    select.value = targetSheet;
    renderAdminFields(targetSheet);

    const keyMap = {
        "Inventar_Gewehre":          "gewehre",
        "Inventar_Schluessel":       "schluessel",
        "Inventar_Kleidung":         "kleidung",
        "Inventar_Schiessbekleidung":"schiessbekleidung",
        "Personendaten":             "mitglieder"
    };
    const data = (inventarState[keyMap[targetSheet]] || [])
        .find(item => item.ID.toString() === id.toString());

    if (data) {
        let idField = document.getElementById('admin-edit-id');
        if (!idField) {
            idField = document.createElement('input');
            idField.type  = 'hidden';
            idField.id    = 'admin-edit-id';
            idField.name  = 'ID';
            document.getElementById('adminForm').appendChild(idField);
        }
        idField.value = id;

        const form = document.getElementById('adminForm');
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = data[key];
        });

        const btn = document.getElementById('btn-admin-save');
        btn.innerText = "Änderungen speichern";
        btn.classList.replace('btn-success', 'btn-warning');
    }
}


// =========================================================
//  FIX: handleInventarSubmit
//  Payload-Feldnamen an GAS-Schema anpassen
// =========================================================
async function handleInventarSubmit(e) {
    e.preventDefault();
    setInventarBusy(true);

    const action     = document.getElementById('select-action').value;
    const mitgliedId = document.getElementById('select-mitglied').value;
    const kategorie  = document.getElementById('select-kategorie').value;
    const itemId     = document.getElementById('select-gegenstand').value;

    // Doppelbuchungs-Check bei Rückgabe
    if (action === 'checkin') {
        const km = {
            "gewehr":"gewehre","schluessel":"schluessel",
            "kleidung":"kleidung","schiessbekleidung":"schiessbekleidung"
        };
        const item = (inventarState[km[kategorie]] || [])
            .find(i => i.ID.toString() === itemId.toString());
        if (!item || item.Aktueller_Besitzer_ID.toString() !== mitgliedId.toString()) {
            alert("⚠️ Dieser Gegenstand ist nicht bei diesem Mitglied!");
            setInventarBusy(false);
            return;
        }
    }

    // ✅ Feldnamen exakt wie GAS-Sheet-Spalten
    const payload = {
        action:                  action,
        type:                    action,
        // GAS-Spalte: Aktueller_Besitzer_ID
        Aktueller_Besitzer_ID:   mitgliedId,
        mitgliedId:              mitgliedId,   // Fallback
        kategorie:               kategorie,
        Kategorie:               kategorie,
        // GAS-Spalte: Inventar_ID
        Inventar_ID:             itemId,
        itemId:                  itemId,
        // GAS-Spalte: Aktion
        Aktion:                  action === 'checkout' ? 'AUSGABE' : 'CHECKIN',
        Zustand_Abgabe:          document.getElementById('select-zustand-abgabe').value,
        Zustand_Rueckgabe:       document.getElementById('select-zustand-rueckgabe').value,
        Bemerkungen:             document.getElementById('trans-bemerkungen').value,
        Verantwortliche_ID:      currentUser,
        Pfandbetrag:             document.getElementById('pfand-betrag').value,
        Pfand_einnahme:          document.getElementById('pfand-einnahme').value,
        Pfand_retour_bezahlt:    document.getElementById('pfand-retour').value,
        sigMitglied:             sigPadMitglied ? sigPadMitglied.toDataURL() : "",
        Sig_Vorstand:            sigPadVorstand ? sigPadVorstand.toDataURL() : ""
    };

    try {
        const res    = await apiFetch('inventar', '', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await res.json();

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
// =========================================================
//  SAVE NEW / UPDATE
// =========================================================
async function saveNewInventarItem(e) {
    e.preventDefault();
    setInventarBusy(true);

    const target = document.getElementById('admin-target').value;
    const fields = {};
    new FormData(e.target).forEach((v, k) => fields[k] = v);

    const isUpdate = fields.ID && fields.ID !== "";
    const action   = isUpdate ? "updateItem" : "addNewItem";

    try {
        await apiFetch('inventar', '', {
            method: 'POST',
            body: JSON.stringify({ action, targetSheet: target, fields })
        });

        e.target.reset();
        const idField = document.getElementById('admin-edit-id');
        if (idField) idField.remove();

        const btn = document.getElementById('btn-admin-save');
        btn.innerText = "Speichern";
        btn.classList.replace('btn-warning', 'btn-success');

        await loadInventarData();
        alert(isUpdate ? "✅ Änderung gespeichert!" : "✅ Neu erfasst!");
    } catch (err) {
        alert("Fehler: " + err.message);
    }
    setInventarBusy(false);
}


// =========================================================
//  DELETE
// =========================================================
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

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("Sportschützen Muhen", 105, 20, { align: 'center' });

    doc.setFontSize(16);
    const typ = data.type === 'checkout' ? 'AUSGABE-QUITTUNG' : 'RÜCKNAHME-QUITTUNG';
    doc.text(typ, 105, 32, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');

    const mitglied     = (inventarState.mitglieder || [])
        .find(m => m.ID.toString() === data.mitgliedId.toString());
    const mitgliedName = mitglied
        ? `${mitglied.Nachname} ${mitglied.Vorname}` : data.mitgliedId;

    const keyMap = {
        "gewehr":"gewehre","schluessel":"schluessel",
        "kleidung":"kleidung","schiessbekleidung":"schiessbekleidung"
    };
    const item      = (inventarState[keyMap[data.kategorie]] || [])
        .find(i => i.ID.toString() === data.itemId.toString());
    const itemLabel = item ? getItemLabel(data.kategorie, item) : data.itemId;

    let y = 50;
    const row = (label, value) => {
        doc.setFont(undefined, 'bold');   doc.text(label, 20, y);
        doc.setFont(undefined, 'normal'); doc.text(String(value || '-'), 80, y);
        y += 10;
    };

    row("Datum:",         formatCH(new Date()));
    row("Transaktion-ID:", `T-${transId}`);
    row("Mitglied:",       mitgliedName);
    row("Kategorie:",      data.kategorie.toUpperCase());
    row("Gegenstand:",     itemLabel);
    row("Zustand:", data.type === 'checkout' ? data.zustandAbgabe : data.zustandRueckgabe);

    if (data.pfandBetrag && parseFloat(data.pfandBetrag) > 0) {
        doc.setFont(undefined, 'bold');
        doc.text("Pfandbetrag:", 20, y);
        doc.text(`CHF ${parseFloat(data.pfandBetrag).toFixed(2)}`, 80, y);
        doc.setFont(undefined, 'normal');
        y += 8;
        const pfandStatus = data.type === 'checkout'
            ? (data.pfandEinnahme === 'Ja' ? '✓ Kassiert' : '✗ Nicht kassiert')
            : (data.pfandRetour   === 'Ja' ? '✓ Retour bezahlt' : '✗ Noch offen');
        doc.text(pfandStatus, 80, y);
        y += 10;
    }

    if (data.bemerkungen) {
        doc.setFont(undefined, 'bold');   doc.text("Bemerkungen:", 20, y);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(data.bemerkungen, 110);
        doc.text(lines, 80, y);
        y += lines.length * 6;
    }

    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text("Unterschriften:", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;

    if (data.sigMitglied && data.sigMitglied.length > 50) {
        doc.addImage(data.sigMitglied, 'PNG', 20, y, 60, 20);
        doc.text("Mitglied", 20, y + 25);
    }
    if (data.sigVorstand && data.sigVorstand.length > 50) {
        doc.addImage(data.sigVorstand, 'PNG', 110, y, 60, 20);
        doc.text("Vorstand", 110, y + 25);
    }

    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Sportschützen Muhen | www.schuetzen-muhen.ch", 105, 280, { align: 'center' });

    const dateStr  = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const typKurz  = data.type === 'checkout' ? 'Ausgabe' : 'Rueckgabe';
    const filename = `${dateStr}_${typKurz}_${data.kategorie}_${data.itemId}_${mitglied?.Nachname || 'Unbekannt'}_${mitglied?.Vorname || ''}.pdf`;

    doc.save(filename);
}


// =========================================================
//  BUSY STATE
// =========================================================
function setInventarBusy(status) {
    document.querySelectorAll('.inv-submit').forEach(b => b.disabled = status);
}
