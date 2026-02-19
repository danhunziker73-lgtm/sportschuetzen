// === MODUL: INVENTAR ===

let inventarState = null;
let sigPadMitglied, sigPadVorstand;

// Wird aufgerufen, wenn man auf "Inventar" klickt
async function loadInventarData() {
    const container = document.getElementById('inventar-container');
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p>Lade Inventar...</p></div>';

    try {
        // 1. Daten laden (apiFetch sendet automatisch X-User-Role mit!)
        const res = await apiFetch('inventar', 'action=getInventarData');
        inventarState = await res.json();
        
        // 2. HTML Rendern (Das Formular & Tabellen)
        renderInventarUI(container);
        
        // 3. Signature Pads initialisieren (nachdem HTML im DOM ist)
        if(document.getElementById('sig-mitglied')) {
            sigPadMitglied = new SignaturePad(document.getElementById('sig-mitglied'));
            sigPadVorstand = new SignaturePad(document.getElementById('sig-vorstand'));
        }

        // 4. Dropdowns füllen
        fillInventarDropdowns();
        
        // 5. Tabelle rendern
        renderInventoryTable();

    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Fehler beim Laden: ${e.message}</div>`;
    }
}

function renderInventarUI(container) {
    // Hier kopieren wir das Layout aus deiner alten Datei, angepasst für den Container
    container.innerHTML = `
        <div class="card mb-4 border-0 shadow-sm">
            <div class="card-body">
                <ul class="nav nav-tabs mb-3" id="inv-tabs">
                    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-ausgabe">📤 Buchung</a></li>
                    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-liste">📋 Bestand</a></li>
                </ul>

                <div class="tab-content">
                    <!-- TAB 1: AUSGABE/RÜCKGABE -->
                    <div class="tab-pane fade show active" id="tab-ausgabe">
                        <form onsubmit="handleInventarSubmit(event)">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Aktion</label>
                                    <select id="select-action" class="form-select" onchange="toggleBookingFields()">
                                        <option value="checkout">📤 Ausgabe</option>
                                        <option value="checkin">📥 Rückgabe</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Mitglied</label>
                                    <select id="select-mitglied" class="form-select" required></select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Kategorie</label>
                                    <select id="select-kategorie" class="form-select" onchange="updateSubOptions()">
                                        <option value="gewehr">Gewehr</option>
                                        <option value="schluessel">Schlüssel</option>
                                        <option value="kleidung">Kleidung</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Gegenstand</label>
                                    <select id="select-gegenstand" class="form-select" required></select>
                                </div>
                                
                                <!-- Zustand Felder (dynamisch) -->
                                <div class="col-md-12" id="container-zustand-abgabe">
                                    <label class="form-label text-primary">Zustand</label>
                                    <select id="select-zustand-abgabe" class="form-select"></select>
                                </div>
                                
                                <!-- Unterschriften -->
                                <div class="col-md-6">
                                    <label class="form-label small text-muted">Unterschrift Mitglied</label>
                                    <div style="border:1px solid #ddd; height:120px;"><canvas id="sig-mitglied" style="width:100%;height:100%"></canvas></div>
                                    <button type="button" class="btn btn-link btn-sm text-danger p-0" onclick="sigPadMitglied.clear()">Löschen</button>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small text-muted">Unterschrift Vorstand</label>
                                    <div style="border:1px solid #ddd; height:120px;"><canvas id="sig-vorstand" style="width:100%;height:100%"></canvas></div>
                                    <button type="button" class="btn btn-link btn-sm text-danger p-0" onclick="sigPadVorstand.clear()">Löschen</button>
                                </div>

                                <div class="col-12 mt-3">
                                    <button type="submit" class="btn btn-success w-100 py-2 fw-bold">Speichern</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- TAB 2: LISTE -->
                    <div class="tab-pane fade" id="tab-liste">
                        <div class="d-flex justify-content-between mb-2">
                            <h4>Bestand</h4>
                            <select id="filter-liste" class="form-select w-auto form-select-sm" onchange="renderInventoryTable()">
                                <option value="Inventar_Gewehre">Gewehre</option>
                                <option value="Inventar_Schluessel">Schlüssel</option>
                                <option value="Inventar_Kleidung">Kleidung</option>
                            </select>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover table-sm" id="inventory-table"></table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Bootstrap Tabs aktivieren (manuell, falls kein BS JS geladen)
    const links = container.querySelectorAll('.nav-link');
    links.forEach(l => {
        l.addEventListener('click', (e) => {
            e.preventDefault();
            links.forEach(x => x.classList.remove('active'));
            container.querySelectorAll('.tab-pane').forEach(x => x.classList.remove('show', 'active'));
            
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('show', 'active');
        });
    });
}

// --- HELPER FUNKTIONEN FÜR INVENTAR (Deine bestehenden Logiken) ---

function fillInventarDropdowns() {
    if(!inventarState || !inventarState.mitglieder) return;
    
    // Mitglieder Dropdown
    const sorted = [...inventarState.mitglieder].sort((a, b) => (a.Nachname || "").localeCompare(b.Nachname || ""));
    const optionsHtml = '<option value="">-- wählen --</option>' + 
        sorted.map(m => `<option value="${m.ID}">${m.Nachname} ${m.Vorname}</option>`).join('');
    document.getElementById('select-mitglied').innerHTML = optionsHtml;

    // Zustand Dropdown
    if(inventarState.config) {
        const zOptions = '<option value="">-- wählen --</option>' + 
            inventarState.config.map(c => c.Transaktion_Zustand).filter(v => v).map(v => `<option value="${v}">${v}</option>`).join('');
        document.getElementById('select-zustand-abgabe').innerHTML = zOptions;
    }
    updateSubOptions();
}

function updateSubOptions() {
    if(!inventarState) return;
    const kat = document.getElementById('select-kategorie').value;
    const keyMap = { "gewehr": "gewehre", "schluessel": "schluessel", "kleidung": "kleidung" };
    const items = inventarState[keyMap[kat]] || [];
    
    document.getElementById('select-gegenstand').innerHTML = items.map(i => {
        let info = (kat === 'gewehr') ? `${i.Hersteller} ${i.Modell} (${i.Laufnummer})` : 
                   (kat === 'schluessel') ? `${i.Bezeichnung} (${i.Nummer})` : `${i.Typ} (${i.Groesse})`;
        const isOut = i.Aktueller_Besitzer_ID && i.Aktueller_Besitzer_ID.toString() !== "0";
        return `<option value="${i.ID}" ${isOut ? 'disabled style="color:red"' : ''}>${info} ${isOut ? '(verliehen)' : ''}</option>`;
    }).join('');
}

function renderInventoryTable() {
    if(!inventarState) return;
    const target = document.getElementById('filter-liste').value;
    const keyMap = { "Inventar_Gewehre":"gewehre", "Inventar_Schluessel":"schluessel", "Inventar_Kleidung":"kleidung" };
    const data = inventarState[keyMap[target]] || [];
    const table = document.getElementById('inventory-table');
    
    if(data.length === 0) { table.innerHTML = "<tr><td>Keine Daten</td></tr>"; return; }
    
    // Header
    let cols = Object.keys(data[0]).filter(k => k !== "ID" && k !== "Zeitstempel");
    let html = `<thead><tr class="table-light">` + cols.map(c => `<th>${c}</th>`).join('') + `</tr></thead><tbody>`;
    
    // Rows
    html += data.map(row => `<tr>` + cols.map(c => `<td>${row[c] || '-'}</td>`).join('') + `</tr>`).join('');
    table.innerHTML = html + "</tbody>";
}

async function handleInventarSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerText = "Speichere...";

    const payload = {
        action: "checkout", // oder checkin, je nach Select
        type: document.getElementById('select-action').value,
        mitgliedId: document.getElementById('select-mitglied').value,
        kategorie: document.getElementById('select-kategorie').value,
        itemId: document.getElementById('select-gegenstand').value,
        zustandAbgabe: document.getElementById('select-zustand-abgabe').value,
        sigMitglied: sigPadMitglied.toDataURL(), // Base64
        sigVorstand: sigPadVorstand.toDataURL()  // Base64
    };

    try {
        // Senden an Worker (Modul 'inventar')
        await apiFetch('inventar', '', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        alert("✅ Erfolgreich gespeichert!");
        e.target.reset();
        sigPadMitglied.clear(); 
        sigPadVorstand.clear();
        loadInventarData(); // Refresh

    } catch(err) {
        alert("Fehler: " + err);
    }
    btn.disabled = false; btn.innerText = "Speichern";
}
