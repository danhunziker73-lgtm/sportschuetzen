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

    #termine-container .row-provisorisch { background: #fff3cd; } /* orange/gelblich */
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
    bindTermineEventsOnce();
    renderAnmeldungenList();
    renderProtokollList();
    renderDropdownEditor();

}
function renderTermineList() {
  const tbody = document.getElementById('termine-body');
  if (!tbody || !adminState.termine) return;

  tbody.innerHTML = adminState.termine.map((t) => {
    const status = String(t.status || '').toLowerCase();

    let rowClass = '';
    if (status === 'abgesagt') rowClass = 'row-abgesagt';
    else if (status === 'provisorisch') rowClass = 'row-provisorisch';
    else if (!t.datum) rowClass = 'row-warn';

    return `
      <tr data-id="${escapeHtml(String(t.id))}" class="${rowClass}">
        <td>   <input data-field="datum" type="date" class="form-control form-control-sm" value="${isoDate(t.datum)}">   <small class="d-block text-muted">${formatDate(t.datum)}</small> </td>
        <td><input data-field="startzeit" type="time" class="form-control form-control-sm" value="${formatTime(t.startzeit)}"></td>
        <td><input data-field="endzeit" type="time" class="form-control form-control-sm" value="${formatTime(t.endzeit)}"></td>

        <td>
          <select data-field="anlasstitel" class="form-select form-select-sm">
            <option value="">-- Anlass --</option>
            ${(adminState.dropdowns.anlaesse||[]).map(a =>
              `<option value="${escapeHtml(a)}" ${a===t.anlasstitel?'selected':''}>${escapeHtml(a)}</option>`
            ).join('')}
          </select>
        </td>

        <td>
          <select data-field="ort" class="form-select form-select-sm">
            <option value="">-- Ort --</option>
            ${(adminState.dropdowns.orteMitMaps||[]).map(o =>
              `<option value="${escapeHtml(o[0])}" ${o[0]===t.ort?'selected':''}>${escapeHtml(o[0])}</option>`
            ).join('')}
          </select>
        </td>

        <td>
          <select data-field="kategorie" class="form-select form-select-sm">
            <option value="">-- Kat --</option>
            ${(adminState.dropdowns.kategorien||[]).map(k =>
              `<option value="${escapeHtml(k)}" ${k===t.kategorie?'selected':''}>${escapeHtml(k)}</option>`
            ).join('')}
          </select>
        </td>

        <td>
          <select data-field="status" class="form-select form-select-sm">
            <option value="">-- Status --</option>
            ${['fix','provisorisch','abgesagt'].map(s =>
              `<option value="${s}" ${s===t.status?'selected':''}>${s}</option>`
            ).join('')}
          </select>
        </td>

        <td><button type="button" class="btn btn-link text-danger p-0" data-action="remove">🗑️</button></td>
      </tr>
    `;
  }).join('');

}
// --- RENDERING SUB-FUNCTIONS ---
function isoDate(v) {
  if (!v) return "";
  try {
    if (String(v).match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
      const [day, month, year] = String(v).split('.');
      return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    }
    const s = String(v);
    return s.includes('T') ? s.split('T')[0] : s;
  } catch(e) { return v; }
}


function applyDefaultsOnDateSetById(id) {
  const idx = adminState.termine.findIndex(t => String(t.id) === String(id));
  if (idx < 0) return;

  const t = adminState.termine[idx];
  if (!t.datum) return;

  if (!t.startzeit) t.startzeit = "19:00";
  if (!t.endzeit)   t.endzeit   = "22:00";

  if (!t.status)    t.status    = "provisorisch";
  if (!t.kategorie) t.kategorie = "Jahresprogramm";
}

function renderGVList() {
  const list = document.getElementById('gv-list');
  if (!list || !adminState.platzhalter) return;

  const pickPlaceholder = (label) => {
    const l = String(label || '').toLowerCase();
    if (l.includes('datum') && l.includes('gv') && l.includes('vorjahr')) return 'tt.mm.jjjj';
    if (l.includes('datum') && l.includes('abmeldung')) return 'tt.mm.jjjj';
    if (l.includes('mahndatum')) return 'tt.mm.jjjj';
    if (l.includes('datum') && l.includes('gv')) return 'tt.mm.jjjj';
    if (l.includes('zeit') && l.includes('gv')) return 'hh:mm';
    return '';
  };

  const isBudget = (label) => String(label || '').toLowerCase().includes('budget');
  const isMailField = (label) => String(label || '').toLowerCase().includes('mail');

  const members = getMembersForMailDropdown();

  list.innerHTML = adminState.platzhalter.map((p, i) => {
    const label = p.bezeichnung_app || p.platzhaltername || '';
    const ph = pickPlaceholder(label);
    const value = p.inhalt || '';

    // Budget → Textarea
    if (isBudget(label)) {
      return `
        <div class="mb-3">
          <label class="form-label small fw-bold mb-1">${escapeHtml(label)}</label>
          <textarea class="form-control form-control-sm" rows="5"
            placeholder="Mehrzeiliger Text…"
            onchange="adminState.platzhalter[${i}].inhalt=this.value">${escapeHtml(value)}</textarea>
        </div>
      `;
    }

    // Mail-Feld → Tag-Box + Dropdown (wie App_Info)
    if (isMailField(label)) {
      const mails = value.split(';').map(x => x.trim()).filter(Boolean);

      return `
        <div class="mb-3 border-bottom pb-3">
          <label class="form-label small fw-bold mb-1">${escapeHtml(label)}</label>

          <div class="tag-box mb-2">
            ${
              mails.length
                ? mails.map(m => `
                    <span class="tag">${escapeHtml(m)}
                      <span class="x" onclick="removeGVMail(${i}, '${escapeJs(m)}')">×</span>
                    </span>
                  `).join('')
                : `<span class="text-muted small">Keine Empfänger</span>`
            }
          </div>

          <select class="form-select form-select-sm"
            onchange="addGVMail(${i}, this.value); this.value=''">
            <option value="">+ Empfänger hinzufügen</option>
            ${members.map(mm =>
              `<option value="${escapeHtml(mm.email)}">${escapeHtml(mm.name)} (${escapeHtml(mm.email)})</option>`
            ).join('')}
          </select>
        </div>
      `;
    }

    // Standard → Input mit Placeholder
    return `
      <div class="mb-2">
        <label class="form-label small fw-bold mb-0">${escapeHtml(label)}</label>
        <input type="text" class="form-control form-control-sm"
          value="${escapeHtml(value)}"
          placeholder="${escapeHtml(ph)}"
          onchange="adminState.platzhalter[${i}].inhalt=this.value">
      </div>
    `;
  }).join('');
}

function addGVMail(idx, email) {
  email = (email || '').trim();
  if (!email) return;

  const current = (adminState.platzhalter[idx].inhalt || '')
    .split(';').map(x=>x.trim()).filter(Boolean);

  if (!current.includes(email)) current.push(email);
  adminState.platzhalter[idx].inhalt = current.join('; ');

  renderGVList();
}

function removeGVMail(idx, email) {
  const current = (adminState.platzhalter[idx].inhalt || '')
    .split(';').map(x=>x.trim()).filter(Boolean);

  adminState.platzhalter[idx].inhalt = current.filter(x => x !== email).join('; ');
  renderGVList();
}


function getMemberEmail(m) {
  // passt sich an typische Header-Namen an
  return String(m.e_mail || m.email || m.mailadresse || m.mail || '').trim();
}

function getMemberDisplayName(m) {
  const nn = String(m.nachname || '').trim();
  const vn = String(m.vorname || '').trim();
  const full = `${nn} ${vn}`.trim();
  return full || String(m.name || '').trim() || getMemberEmail(m);
}

function getMembersForMailDropdown() {
  const arr = (adminState.members || [])
    .map(m => ({
      name: getMemberDisplayName(m),
      email: getMemberEmail(m)
    }))
    .filter(x => x.email); // nur mit Mail

  // nach Nachname Vorname sortieren (wie angezeigt)
  arr.sort((a,b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
  return arr;
}

function renderAppInfoList() {
  const list = document.getElementById('app-info-list');
  if (!list || !adminState.app_info) return;

  const members = getMembersForMailDropdown();

  list.innerHTML = adminState.app_info.map((info, i) => {
    const mails = (info.mailadresse || "")
      .split(';')
      .map(x => x.trim())
      .filter(Boolean);

    return `
      <div class="mb-3 border-bottom pb-3">
        <label class="form-label small fw-bold mb-1">${escapeHtml(info.bezeichnung || '')}</label>

        <div class="tag-box mb-2">
          ${
            mails.length
              ? mails.map(m => `
                  <span class="tag">${escapeHtml(m)}
                    <span class="x" onclick="removeMail(${i}, '${escapeJs(m)}')">×</span>
                  </span>
                `).join('')
              : `<span class="text-muted small">Keine Empfänger</span>`
          }
        </div>

        <select class="form-select form-select-sm"
          onchange="addMail(${i}, this.value); this.value=''">
          <option value="">+ Empfänger hinzufügen</option>
          ${members.map(mm =>
            `<option value="${escapeHtml(mm.email)}">${escapeHtml(mm.name)} (${escapeHtml(mm.email)})</option>`
          ).join('')}
        </select>
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
  if (!adminState.dropdowns) adminState.dropdowns = { anlaesse: [], orteMitMaps: [], kategorien: [] };

  const a = document.getElementById('edit-anlaesse');
  const o = document.getElementById('edit-orte');

  if (a) {
    const arr = (adminState.dropdowns.anlaesse || []);
    adminState.dropdowns.anlaesse = arr;

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
    const arr = (adminState.dropdowns.orteMitMaps || []);
    adminState.dropdowns.orteMitMaps = arr;

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



function cleanupDropdownsForSave() {
  adminState.dropdowns.anlaesse = (adminState.dropdowns.anlaesse || [])
    .map(x => String(x||'').trim())
    .filter(Boolean);

  adminState.dropdowns.orteMitMaps = (adminState.dropdowns.orteMitMaps || [])
    .map(p => [String(p?.[0]||'').trim(), String(p?.[1]||'').trim()])
    .filter(p => p[0]);
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
  adminState.termine.push({
    id: generateTerminId(),
    datum: "",
    startzeit: "",
    endzeit: "",
    anlasstitel: "",
    ort: "",
    kategorie: "",
    status: ""
  });
  renderTermineList();
}




function generateTerminId() {
  // eindeutig genug: Zeit + Random, als String
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}


function sortTermineForSave() {
  adminState.termine.sort((a, b) => {
    if (!a.datum && !b.datum) return 0;
    if (!a.datum) return 1;
    if (!b.datum) return -1;
    return new Date(a.datum) - new Date(b.datum);
  });
}


async function saveAdminData() {
    if(!confirm("Alle Änderungen speichern?")) return;
      sortTermineForSave();
     cleanupDropdownsForSave();
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
function formatDate(v) {
  if (!v) return "";
  try {
    let dateStr = String(v).includes('T') ? String(v).split('T')[0] : String(v);
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${parseInt(day,10)}.${parseInt(month,10)}.${year}`;
    }
    return dateStr;
  } catch(e) { return v; }
}

let termineEventsBound = false;

function bindTermineEventsOnce() {
  if (termineEventsBound) return;
  termineEventsBound = true;

  const tbody = document.getElementById('termine-body');
  if (!tbody) return;

  // Änderungen (input/select)
  tbody.addEventListener('change', (e) => {
    const el = e.target;
    if (!el || !el.dataset || !el.dataset.field) return;

    const tr = el.closest('tr[data-id]');
    if (!tr) return;

    const id = tr.dataset.id;
    const field = el.dataset.field;

    setTerminFieldById(id, field, el.value);

    if (field === 'datum') applyDefaultsOnDateSetById(id);
    if (field === 'ort') applyOrtMapById(id, el.value);

    renderTermineList();
  });

  // Löschen
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="remove"]');
    if (!btn) return;

    const tr = btn.closest('tr[data-id]');
    if (!tr) return;

    removeTerminById(tr.dataset.id);
  });
}

function applyOrtMapById(id, ortName) {
  const idx = adminState.termine.findIndex(t => String(t.id) === String(id));
  if (idx < 0) return;

  const found = (adminState.dropdowns.orteMitMaps || []).find(o => o[0] === ortName);
  adminState.termine[idx].austragungsorte_map = found ? (found[1] || '') : '';
}

function setTerminFieldById(id, field, value) {
  const idx = adminState.termine.findIndex(t => String(t.id) === String(id));
  if (idx < 0) return;
  adminState.termine[idx][field] = value;
}

function removeTerminById(id) {
  if (!confirm("Termin wirklich löschen?")) return;
  adminState.termine = adminState.termine.filter(t => String(t.id) !== String(id));
  renderTermineList();
}

