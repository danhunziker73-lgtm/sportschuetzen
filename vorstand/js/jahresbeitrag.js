// js/jahresbeitrag.js

let jbState = { gebuehren: [], mitglieder: [], status: [], jahr: new Date().getFullYear() };

const JB_KATEGORIEN = {
  'Jahresbeitrag': { icon: '💳', color: '#0f3a5d' },
  'Rabatt':        { icon: '🎁', color: '#198754' },
  'Lizenz':        { icon: '📋', color: '#6f42c1' },
  'Gebäude':       { icon: '🏠', color: '#fd7e14' },
  'Luftgewehr':    { icon: '🎯', color: '#0dcaf0' },
  'Kleinkaliber':  { icon: '🔫', color: '#dc3545' }
};

function canEditJB() {
  const r = userRole || localStorage.getItem('portal_role');
  return ['admin', 'kassier'].includes(r);
}

async function loadJahresbeitragData() {
  const container = document.getElementById('jahresbeitrag-container');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2 text-muted">Lade Jahresbeiträge...</p>
    </div>`;

  try {
    const res  = await apiFetch('jahresbeitrag', 'action=getAll');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    jbState.gebuehren  = data.gebuehren  || [];
    jbState.mitglieder = data.mitglieder || [];
    jbState.status     = data.status     || [];

    renderJahresbeitragUI();
  } catch(e) {
    container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
  }
}

function renderJahresbeitragUI() {
  const canEdit = canEditJB();
  document.getElementById('jahresbeitrag-container').innerHTML = `
    <ul class="nav nav-tabs mb-3" id="jb-tabs">
      <li class="nav-item">
        <a class="nav-link active" data-bs-toggle="tab" href="#jb-tarife">
          💳 Tarife & Gebühren
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="tab" href="#jb-mitglieder">
          👥 Mitglieder-Status
        </a>
      </li>
    </ul>

    <div class="tab-content">

      <!-- TAB 1: TARIFE -->
      <div class="tab-pane fade show active" id="jb-tarife">
        ${renderTarifeTab(canEdit)}
      </div>

      <!-- TAB 2: MITGLIEDER-STATUS -->
      <div class="tab-pane fade" id="jb-mitglieder">
        ${renderMitgliederStatusTab()}
      </div>

    </div>`;
}

// ── Tab 1: Tarife ──────────────────────────────────────────
function renderTarifeTab(canEdit) {
  // Nach Kategorie gruppieren
  const grouped = {};
  jbState.gebuehren.forEach(g => {
    const kat = g.Kategorie || 'Sonstiges';
    if (!grouped[kat]) grouped[kat] = [];
    grouped[kat].push(g);
  });

  const cards = Object.entries(grouped).map(([kat, items]) => {
    const meta  = JB_KATEGORIEN[kat] || { icon: '📌', color: '#6c757d' };
    const rows  = items.map(item => `
      <tr>
        <td>
          <span class="fw-bold">${item.Bezeichnung_Frontend || ''}</span>
          <br><small class="text-muted">${item.Bezeichnung || ''}</small>
        </td>
        <td class="text-end">
          ${canEdit
            ? `<div class="input-group input-group-sm" style="max-width:120px;margin-left:auto">
                 <span class="input-group-text">CHF</span>
                 <input type="number" class="form-control text-end"
                        value="${item.Betrag}"
                        step="0.50" min="-999" max="9999"
                        onchange="saveGebuehr('${item.Key}', this.value)">
               </div>`
            : `<span class="badge fs-6" style="background:${meta.color}">
                 CHF ${parseFloat(item.Betrag || 0).toFixed(2)}
               </span>`
          }
        </td>
      </tr>`).join('');

    return `
      <div class="col-12 col-md-6 col-xl-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header text-white fw-bold"
               style="background:${meta.color}">
            ${meta.icon} ${kat}
          </div>
          <div class="card-body p-0">
            <table class="table table-sm table-hover mb-0">
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }).join('');

  return `<div class="row g-3">${cards}</div>`;
}

// ── Tab 2: Mitglieder-Status ───────────────────────────────
function renderMitgliederStatusTab() {
  const jahr = jbState.jahr;

  // Nur Jahresbeitrag + Rabatt als Spalten (die wichtigsten)
  const cols = jbState.gebuehren.filter(g =>
    ['Jahresbeitrag','Rabatt','Lizenz'].includes(g.Kategorie)
  );

  // Status-Lookup: mitgliedId_key_jahr → bezahlt
  const lookup = {};
  jbState.status.forEach(s => {
    lookup[`${s.MitgliedID}_${s.Key}_${s.Jahr}`] = s.Bezahlt;
  });

  const headerCols = cols.map(c =>
    `<th class="text-center small" style="min-width:80px">
       ${c.Bezeichnung_Frontend || c.Key}
     </th>`
  ).join('');

  const rows = jbState.mitglieder.map(m => {
    const cells = cols.map(c => {
      const key  = `${m.ID}_${c.Key}_${jahr}`;
      const paid = lookup[key] === true || lookup[key] === 'TRUE';
      return `
        <td class="text-center">
          <button class="btn btn-sm p-0 border-0"
                  title="${c.Bezeichnung_Frontend}"
                  onclick="toggleBeitrag('${m.ID}','${c.Key}',${!paid})">
            <span style="font-size:1.3rem">${paid ? '✅' : '⬜'}</span>
          </button>
        </td>`;
    }).join('');

    return `
      <tr>
        <td class="fw-bold">${m.Nachname || ''} ${m.Vorname || ''}</td>
        <td><small class="text-muted">${m.Status || ''}</small></td>
        ${cells}
      </tr>`;
  }).join('');

  return `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Jahr:
        <select class="form-select form-select-sm d-inline w-auto ms-2"
                onchange="jbState.jahr=this.value; renderJahresbeitragUI()">
          ${[2026,2025,2024].map(y =>
            `<option value="${y}" ${y==jahr?'selected':''}>${y}</option>`
          ).join('')}
        </select>
      </h5>
      <small class="text-muted">${jbState.mitglieder.length} Mitglieder</small>
    </div>
    <div class="table-responsive">
      <table class="table table-hover table-sm align-middle">
        <thead class="table-dark">
          <tr>
            <th>Name</th>
            <th>Status</th>
            ${headerCols}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Aktionen ───────────────────────────────────────────────
async function saveGebuehr(key, betrag) {
  try {
    const res  = await apiFetch('jahresbeitrag',
      `action=updateGebuehr&key=${key}&betrag=${betrag}`);
    const data = await res.json();
    if (data.success) showJBToast('✅ Betrag gespeichert');
    else alert('Fehler: ' + data.error);
  } catch(e) { alert('Verbindungsfehler: ' + e.message); }
}

async function toggleBeitrag(mitgliedId, key, bezahlt) {
  try {
    const res  = await apiFetch('jahresbeitrag',
      `action=updateMitglied&mitgliedId=${mitgliedId}&key=${key}&bezahlt=${bezahlt}&jahr=${jbState.jahr}`);
    const data = await res.json();
    if (data.success) {
      // State lokal aktualisieren (kein Full-Reload)
      const idx = jbState.status.findIndex(s =>
        s.MitgliedID == mitgliedId && s.Key === key && s.Jahr == jbState.jahr
      );
      if (idx > -1) jbState.status[idx].Bezahlt = bezahlt;
      else jbState.status.push({
        MitgliedID: mitgliedId, Key: key,
        Jahr: jbState.jahr, Bezahlt: bezahlt
      });
      renderJahresbeitragUI();
    } else { alert('Fehler: ' + data.error); }
  } catch(e) { alert('Verbindungsfehler: ' + e.message); }
}

function showJBToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:9999;
    background:#0f3a5d;color:white;padding:12px 20px;
    border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:14px;`;
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
