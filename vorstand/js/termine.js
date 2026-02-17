// === MODUL: TERMINE & ADMIN ===

let adminState = null;
let originalAdminState = null;

function ensureTermineStylesOnce() {
  if (document.getElementById('termine-inline-style')) return;
  const s = document.createElement('style');
  s.id = 'termine-inline-style';
  s.textContent = `
    /* Alles scoped aufs Termine-Modul */
    #termine-container { position: relative; }

    #termine-container .termine-overlay {
      position: absolute; inset: 0;
      background: rgba(255,255,255,.85);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000;
      border-radius: 12px;
    }

    #termine-container .row-warn { background: #fff8e1; }       /* fehlendes Datum etc. */
    #termine-container .row-abgesagt { opacity: .6; text-decoration: line-through; }

    /* Tag UI für Mailadresse */
    #termine-container .tag-box {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 6px; border: 1px solid rgba(0,0,0,.12);
      border-radius: 8px; background: #fff;
      min-height: 40px;
    }
    #termine-container .tag {
      background: #e9f2ff; color: #0d6efd;
      padding: 2px 8px; border-radius: 999px;
      font-size: .85rem; display: inline-flex; gap: 8px; align-items: center;
      border: 1px solid rgba(13,110,253,.15);
    }
    #termine-container .tag .x {
      color: #dc3545; cursor: pointer; font-weight: 700;
      line-height: 1;
    }
  `;
  document.head.appendChild(s);
}

function showTermineOverlay(show, text) {
  const container = document.getElementById('termine-container');
  if (!container) return;

  let overlay = container.querySelector('.termine-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'termine-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="text-center p-4 bg-white border rounded shadow-sm">
        <div class="spinner-border text-primary"></div>
        <div class="mt-2 small text-muted" id="termine-overlay-text">Lade…</div>
      </div>
    `;
    container.appendChild(overlay);
  }

  const t = overlay.querySelector('#termine-overlay-text');
  if (t) t.innerText = text || 'Lade…';

  overlay.style.display = show ? 'flex' : 'none';
}

async function loadTermineData() {
  ensureTermineStylesOnce();

  const container = document.getElementById('termine-container');
  container.innerHTML = `
    <div id="termine-shell">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="small text-muted" id="last-sync">Zuletzt aktualisiert: -</div>
    
      
      </div>
      <div id="termine-ui"></div>
    </div>
  `;

  showTermineOverlay(true, 'Synchronisiere Admin-Daten…');

  try {
    const res = await apiFetch('termine', 'action=loadAdminData');
    adminState = await res.json();
    originalAdminState = JSON.parse(JSON.stringify(adminState));

    renderTermineUI(document.getElementById('termine-ui'));

    const last = document.getElementById('last-sync');
    if (last) last.innerText = 'Zuletzt aktualisiert: ' + new Date().toLocaleString();

  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">Fehler beim Laden: ${e.message}</div>`;
  } finally {
    showTermineOverlay(false);
  }
}


function renderTermineUI(container) {
    container.innerHTML = `
        <ul class="nav nav-tabs mb-3" id="admin-tabs">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-gv">⚙️ Konfig</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-kalender">📅 Termine</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-praesenz">📝 Präsenz</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-protokoll">📜 Log</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-stammdaten">🛠️ Stammdaten</a></li>

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
    <div class="tab-pane fade" id="tab-stammdaten">
  <div class="row g-3">
    <div class="col-md-6">
      <div class="card p-3">
        <h5 class="card-title">Anlass-Typen</h5>
        <div id="edit-anlaesse"></div>
        <button class="btn btn-outline-primary btn-sm w-100 mt-2" onclick="addAnlass()">+ Typ hinzufügen</button>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card p-3">
        <h5 class="card-title">Orte & Maps</h5>
        <div id="edit-orte"></div>
        <button class="btn btn-outline-primary btn-sm w-100 mt-2" onclick="addOrt()">+ Ort hinzufügen</button>
      </div>
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
    renderDropdownEditor();

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
  if (!list || !adminState.app_info) return;

  list.innerHTML = adminState.app_info.map((info, i) => {
    const mails = (info.mailadresse || "")
      .split(';')
      .map(x => x.trim())
      .filter(Boolean);

    const memberEmails = (adminState.members || [])
      .map(m => (m.e_mail || m.email || m.mailadresse || '').trim())
      .filter(Boolean)
      .sort((a,b)=>a.localeCompare(b));

    return `
      <div class="mb-3 border-bottom pb-3">
        <label class="form-label small fw-bold mb-1">${info.bezeichnung || ''}</label>

        <div class="tag-box mb-2">
          ${mails.length ? mails.map(m => `
            <span class="tag">${escapeHtml(m)} <span class="x" onclick="removeMail(${i}, '${escapeJs(m)}')">×</span></span>
          `).join('') : `<span class="text-muted small">Keine Empfänger</span>`}
        </div>

        <select class="form-select form-select-sm mb-2" onchange="addMail(${i}, this.value); this.value=''">
          <option value="">+ Empfänger hinzufügen</option>
          ${memberEmails.map(em => `<option value="${escapeHtml(em)}">${escapeHtml(em)}</option>`).join('')}
        </select>

        <input type="text" class="form-control form-control-sm"
          value="${escapeHtml(info.bemerkung || '')}"
          placeholder="Bemerkung"
          onchange="adminState.app_info[${i}].bemerkung=this.value">
      </div>
    `;
  }).join('');
}

function addMail(idx, email) {
  email = (email || '').trim();
  if (!email) return;

  const current = (adminState.app_info[idx].mailadresse || '')
    .split(';').map(x=>x.trim()).filter(Boolean);

  if (!current.includes(email)) current.push(email);
  adminState.app_info[idx].mailadresse = current.join('; ');

  renderAppInfoList();
}

function removeMail(idx, email) {
  const current = (adminState.app_info[idx].mailadresse || '')
    .split(';').map(x=>x.trim()).filter(Boolean);

  adminState.app_info[idx].mailadresse = current.filter(x => x !== email).join('; ');
  renderAppInfoList();
}

function escapeJs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}


function renderTermineList() {
  const tbody = document.getElementById('termine-body');
  if (!tbody || !adminState.termine) return;

  // Sortieren (Datum)
  adminState.termine.sort((a, b) =>
    (a.datum && b.datum) ? new Date(a.datum) - new Date(b.datum) : -1
  );

  tbody.innerHTML = adminState.termine.map((t, i) => {
    const status = String(t.status || '').toLowerCase();
    const rowClass = status === 'abgesagt'
      ? 'row-abgesagt'
      : (!t.datum ? 'row-warn' : '');

    return `
      <tr class="${rowClass}">
        <td><input type="date" class="form-control form-control-sm" value="${formatDate(t.datum)}"
          onchange="adminState.termine[${i}].datum=this.value"></td>

        <td><input type="time" class="form-control form-control-sm" value="${formatTime(t.startzeit)}"
          onchange="adminState.termine[${i}].startzeit=this.value"></td>

        <td><input type="time" class="form-control form-control-sm" value="${formatTime(t.endzeit)}"
          onchange="adminState.termine[${i}].endzeit=this.value"></td>

        <td>
          <select class="form-select form-select-sm"
            onchange="adminState.termine[${i}].anlasstitel=this.value">
            ${(adminState.dropdowns.anlaesse || []).map(a =>
              `<option value="${a}" ${a===t.anlasstitel?'selected':''}>${a}</option>`
            ).join('')}
          </select>
        </td>

        <td>
          <select class="form-select form-select-sm"
            onchange="updateTerminOrt(${i}, this.value)">
            ${(adminState.dropdowns.orteMitMaps || []).map(o =>
              `<option value="${o[0]}" ${o[0]===t.ort?'selected':''}>${o[0]}</option>`
            ).join('')}
          </select>
        </td>

        <td>
          <select class="form-select form-select-sm"
            onchange="adminState.termine[${i}].kategorie=this.value">
            ${(adminState.dropdowns.kategorien || []).map(k =>
              `<option value="${k}" ${k===t.kategorie?'selected':''}>${k}</option>`
            ).join('')}
          </select>
        </td>

        <td>
          <select class="form-select form-select-sm"
            onchange="adminState.termine[${i}].status=this.value">
            ${['fix','provisorisch','abgesagt'].map(s =>
              `<option value="${s}" ${s===t.status?'selected':''}>${s}</option>`
            ).join('')}
          </select>
        </td>

        <td><button class="btn btn-link text-danger p-0" onclick="removeTermin(${i})">🗑️</button></td>
      </tr>
    `;
  }).join('');
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
function renderDropdownEditor() {
  if (!adminState.dropdowns) adminState.dropdowns = { anlaesse: [], orteMitMaps: [] };

  const a = document.getElementById('edit-anlaesse');
  const o = document.getElementById('edit-orte');

  if (a) {
    const arr = adminState.dropdowns.anlaesse || [];
    a.innerHTML = arr.map((val, i) => `
      <div class="d-flex gap-2 mb-2">
        <input type="text" class="form-control form-control-sm"
          value="${escapeHtml(val || '')}"
          onchange="adminState.dropdowns.anlaesse[${i}]=this.value">
        <button class="btn btn-outline-danger btn-sm" onclick="removeAnlass(${i})">✕</button>
      </div>
    `).join('');
  }

  if (o) {
    const arr = adminState.dropdowns.orteMitMaps || [];
    o.innerHTML = arr.map((pair, i) => `
      <div class="d-flex gap-2 mb-2">
        <input type="text" class="form-control form-control-sm"
          placeholder="Ort"
          value="${escapeHtml((pair && pair[0]) || '')}"
          onchange="adminState.dropdowns.orteMitMaps[${i}][0]=this.value">
        <input type="text" class="form-control form-control-sm"
          placeholder="Map Link"
          value="${escapeHtml((pair && pair[1]) || '')}"
          onchange="adminState.dropdowns.orteMitMaps[${i}][1]=this.value">
        <button class="btn btn-outline-danger btn-sm" onclick="removeOrt(${i})">✕</button>
      </div>
    `).join('');
  }
}

function addAnlass() {
  adminState.dropdowns.anlaesse = adminState.dropdowns.anlaesse || [];
  adminState.dropdowns.anlaesse.push('');
  renderDropdownEditor();
}

function removeAnlass(i) {
  adminState.dropdowns.anlaesse.splice(i, 1);
  renderDropdownEditor();
}

function addOrt() {
  adminState.dropdowns.orteMitMaps = adminState.dropdowns.orteMitMaps || [];
  adminState.dropdowns.orteMitMaps.push(['','']);
  renderDropdownEditor();
}

function removeOrt(i) {
  adminState.dropdowns.orteMitMaps.splice(i, 1);
  renderDropdownEditor();
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
  dropdowns: adminState.dropdowns,
  logDetails: buildChangeLogDetails()
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
function buildChangeLogDetails() {
  if (!originalAdminState) return "Daten aktualisiert";
  const changed = [];
  if (JSON.stringify(adminState.termine) !== JSON.stringify(originalAdminState.termine)) changed.push("Termine");
  if (JSON.stringify(adminState.platzhalter) !== JSON.stringify(originalAdminState.platzhalter)) changed.push("GV Daten");
  if (JSON.stringify(adminState.app_info) !== JSON.stringify(originalAdminState.app_info)) changed.push("App_Info");
  if (JSON.stringify(adminState.dropdowns) !== JSON.stringify(originalAdminState.dropdowns)) changed.push("Stammdaten");
  return changed.length ? ("Geändert: " + changed.join(", ")) : "Speichern ohne Änderungen";
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
