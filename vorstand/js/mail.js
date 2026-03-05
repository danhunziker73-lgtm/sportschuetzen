// ============================================================
// mail.js – Mail-Baustein Sportschützen Muhen
// ============================================================

const MAIL_GRUPPEN_CONFIG = [
  {
    key:   'vorstand',
    label: '⭐ Vorstand',
    haupt: true,
    filter: m => m._istVorstand === true
  },
  {
    key:   'alle',
    label: '⭐ Alle Vereinsmitglieder',
    haupt: true,
    filter: m => true
  },
  {
    key:   'kk50a',
    label: 'KK 50m Aktiv-A',
    haupt: false,
    filter: m => m._istKK50A === true
  },
  {
    key:   'kk50b',
    label: 'KK 50m Aktiv-B',
    haupt: false,
    filter: m => m._istKK50B === true
  },
  {
    key:   'lg',
    label: 'Luftgewehr (LG)',
    haupt: false,
    filter: m => m._istLG === true
  },
  {
    key:   'ehren',
    label: 'Ehrenmitglieder',
    haupt: false,
    filter: m => m._istEhren === true
  },
  {
    key:   'passiv',
    label: 'Passivmitglieder',
    haupt: false,
    filter: m => m._istPassiv === true
  },
];


let _mailAllMembers = [];
let _mailSelected   = new Set();
let _mailLoaded     = false;  // ← NEU: verhindert Doppel-Load

// ============================================================
// LADEN
// ============================================================
async function loadMailData(force = false) {
  // Nur neu laden wenn forced (Aktualisieren-Button) oder noch nie geladen
  if (_mailLoaded && !force) return;

  _mailLoaded = false;
  _mailAllMembers = [];  // ← Reset vor jedem Laden
  _mailSelected.clear();

  document.getElementById('mail-container').innerHTML =
    '<p class="text-muted ps-1">⏳ Lade Mitglieder...</p>';

  try {
    const res  = await apiFetch('mitglieder', 'action=getAll');
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      document.getElementById('mail-container').innerHTML =
        `<div class="alert alert-danger">
           <strong>Antwort konnte nicht geparst werden:</strong><br>
           <pre style="font-size:0.75rem;max-height:200px;overflow:auto">${text.substring(0,500)}</pre>
         </div>`;
      return;
    }

    if (!data.success) {
      document.getElementById('mail-container').innerHTML =
        `<div class="alert alert-danger">Fehler: ${data.error || JSON.stringify(data)}</div>`;
      return;
    }

    // Deduplizieren nach PersonNumber (falls GAS mehrfache Zeilen liefert)
    const seen = new Set();
    _mailAllMembers = data.data.filter(m => {
      const pn = String(m.PersonNumber || m.person_number || '');
      if (!pn || seen.has(pn)) return false;
      seen.add(pn);
      return m.IsActive == 1 &&
             m.Deceased != 1 && m.Deceased !== true &&
             !m.Vereins_austritt;
    });

    _mailLoaded = true;
    renderMailUI();

  } catch (e) {
    document.getElementById('mail-container').innerHTML =
      `<div class="alert alert-danger">Verbindungsfehler: ${e.message}</div>`;
  }
}

// ============================================================
// UI AUFBAUEN
// ============================================================
function renderMailUI() {
  const counts = {};
  MAIL_GRUPPEN_CONFIG.forEach(g => {
    counts[g.key] = _mailAllMembers.filter(g.filter).length;
  });

  const hauptRows = MAIL_GRUPPEN_CONFIG
    .filter(g => g.haupt)
    .map(g => gruppenCheckbox(g, counts[g.key]))
    .join('');

  const katRows = MAIL_GRUPPEN_CONFIG
    .filter(g => !g.haupt)
    .map(g => gruppenCheckbox(g, counts[g.key]))
    .join('');

  document.getElementById('mail-container').innerHTML = `
    <div class="row g-3">

      <!-- LINKE SPALTE: Gruppenauswahl -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">

            <p class="fw-bold text-muted small text-uppercase mb-2">Hauptverteiler</p>
            ${hauptRows}

            <hr class="my-3">

            <p class="fw-bold text-muted small text-uppercase mb-2">Nach Kategorie</p>
            ${katRows}

          </div>
        </div>
      </div>

      <!-- RECHTE SPALTE: Aktionen & Vorschau -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm">
          <div class="card-body">

            <div id="mail-summary" class="mb-3 text-muted small">
              Keine Gruppe gewählt.
            </div>

            <div class="d-flex flex-wrap gap-2 mb-3">
              <button class="btn btn-primary" onclick="mailKopieren()">
                <i class="fas fa-copy me-1"></i> Adressen kopieren
              </button>
              <button id="btn-mailto" class="btn btn-outline-secondary"
                      onclick="mailOpenMailto()" disabled>
                <i class="fas fa-envelope me-1"></i> In Mail öffnen
              </button>
              <button class="btn btn-outline-secondary"
                      onclick="loadMailData(true)">
                <i class="fas fa-sync me-1"></i> Aktualisieren
              </button>
              <button class="btn btn-outline-secondary"
                      onclick="mailCSV()">
                <i class="fas fa-download me-1"></i> CSV
              </button>
            </div>

            <div id="mail-bcc-hint" class="alert alert-info py-2 small d-none">
              <i class="fas fa-info-circle me-1"></i>
              Empfänger bitte ins <strong>BCC-Feld</strong> einfügen –
              so bleiben die Adressen der Mitglieder geschützt.
            </div>

            <div id="mail-copy-success" class="alert alert-success py-2 small d-none">
              <i class="fas fa-check me-1"></i> Adressen kopiert!
            </div>

            <div id="mail-mailto-hint" class="alert alert-warning py-2 small d-none">
              <i class="fas fa-exclamation-triangle me-1"></i>
              Zu viele Empfänger für direkten Mail-Start (&gt;30).
              Bitte <strong>«Adressen kopieren»</strong> verwenden und manuell ins BCC einfügen.
            </div>

            <div id="mail-preview" class="mt-3"
                 style="max-height:340px;overflow-y:auto;"></div>

          </div>
        </div>
      </div>

    </div>
  `;
}

function gruppenCheckbox(g, count) {
  return `
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox"
             id="mg-${g.key}" onchange="mailGruppeToggle('${g.key}')">
      <label class="form-check-label d-flex justify-content-between" for="mg-${g.key}">
        <span>${g.label}</span>
        <span class="badge bg-light text-dark border">${count}</span>
      </label>
    </div>`;
}

// ============================================================
// GRUPPENAUSWAHL
// ============================================================
function mailGruppeToggle(key) {
  const cb     = document.getElementById(`mg-${key}`);
  const isAlle = key === 'alle';

  if (isAlle && cb.checked) {
    // Alle anderen deaktivieren + sperren
    MAIL_GRUPPEN_CONFIG.forEach(g => {
      if (g.key !== 'alle') {
        const el = document.getElementById(`mg-${g.key}`);
        if (el) { el.checked = false; el.disabled = true; }
      }
    });
  } else if (isAlle && !cb.checked) {
    MAIL_GRUPPEN_CONFIG.forEach(g => {
      const el = document.getElementById(`mg-${g.key}`);
      if (el) el.disabled = false;
    });
  }

  _mailUpdateSelection();
}

function _mailUpdateSelection() {
  _mailSelected.clear();

  MAIL_GRUPPEN_CONFIG.forEach(g => {
    const cb = document.getElementById(`mg-${g.key}`);
    if (cb && cb.checked) {
      _mailAllMembers.filter(g.filter).forEach(m => {
        _mailSelected.add(String(m.PersonNumber || m.person_number || ''));
      });
    }
  });

  _mailRenderSummary();
  _mailRenderPreview();
}

// ============================================================
// SUMMARY & VORSCHAU
// ============================================================
function _mailRenderSummary() {
  const alle      = _mailGetAllSelected();   // inkl. ohne Email
  const mitEmail  = alle.filter(m => _getEmail(m));
  const ohneEmail = alle.length - mitEmail.length;

  const summaryEl  = document.getElementById('mail-summary');
  const hintEl     = document.getElementById('mail-bcc-hint');
  const mailtoBtn  = document.getElementById('btn-mailto');
  const mailtoHint = document.getElementById('mail-mailto-hint');

  if (alle.length === 0) {
    summaryEl.innerHTML = '<span class="text-muted">Keine Gruppe gewählt.</span>';
    hintEl.classList.add('d-none');
    mailtoHint.classList.add('d-none');
    mailtoBtn.disabled = true;
    return;
  }

  const warnHtml = ohneEmail > 0
    ? `<span class="text-warning ms-2">
         <i class="fas fa-exclamation-triangle"></i>
         ${ohneEmail} ohne E-Mail
       </span>`
    : '';

  summaryEl.innerHTML =
    `<strong>${alle.length} Empfänger</strong> gewählt, 
     ${mitEmail.length} mit E-Mail${warnHtml}`;

  hintEl.classList.remove('d-none');

  const zuViele = mitEmail.length > 30;
  mailtoBtn.disabled = zuViele;
  mailtoHint.classList.toggle('d-none', !zuViele);
}


function _mailRenderPreview() {
  const alle = _mailGetAllSelected();
  const kat = _getKatLabel(m);

  if (alle.length === 0) {
    document.getElementById('mail-preview').innerHTML = '';
    return;
  }

// Kategorie kontextbezogen anzeigen
function _getKatLabel(m) {
  // Wenn LG gewählt UND Mitglied hat LG → "LG" zeigen
  const lgGewählt = document.getElementById('mg-lg')?.checked;
  if (lgGewählt && m._istLG) return 'LG';
  if (m._istVorstand) return 'Vorstand';
  return m._kategorie || '–';
}

  
  // Sortierbar: aktueller Zustand
  if (!window._mailSortCol) window._mailSortCol = 'ln';
  if (!window._mailSortDir) window._mailSortDir = 1;

  function sortBy(col) {
    if (window._mailSortCol === col) window._mailSortDir *= -1;
    else { window._mailSortCol = col; window._mailSortDir = 1; }
    _mailRenderPreview();
  }

  const sorted = [...alle].sort((a, b) => {
    const col = window._mailSortCol;
    let va = col === 'fn' ? (a.FirstName || '') :
             col === 'ln' ? (a.LastName  || '') :
             col === 'email' ? _getEmail(a) : (a._kategorie || '');
    let vb = col === 'fn' ? (b.FirstName || '') :
             col === 'ln' ? (b.LastName  || '') :
             col === 'email' ? _getEmail(b) : (b._kategorie || '');
    return window._mailSortDir * va.localeCompare(vb, 'de');
  });

  function sortArrow(col) {
    if (window._mailSortCol !== col) return ' <span class="text-muted">⇅</span>';
    return window._mailSortDir === 1 ? ' ↑' : ' ↓';
  }

  const rows = sorted.map(m => {
    const email = _getEmail(m)
      ? `<span class="text-success small">${_getEmail(m)}</span>`
      : `<span class="text-warning small"><i class="fas fa-exclamation-triangle"></i> –</span>`;
    const kat = (m._kategorie || (m.IsPassive == 1 ? 'Passiv' : '') || '–');
    return `<tr>
      <td class="small">${m.LastName  || '–'}</td>
      <td class="small">${m.FirstName || '–'}</td>
      <td>${email}</td>
      <td class="small text-muted">${kat}</td>
    </tr>`;
  }).join('');

  document.getElementById('mail-preview').innerHTML = `
    <table class="table table-sm table-hover mb-0">
      <thead class="table-light" style="position:sticky;top:0;cursor:pointer">
        <tr>
          <th onclick="sortBy('ln')">Nachname${sortArrow('ln')}</th>
          <th onclick="sortBy('fn')">Vorname${sortArrow('fn')}</th>
          <th onclick="sortBy('email')">E-Mail${sortArrow('email')}</th>
          <th onclick="sortBy('kat')">Kategorie${sortArrow('kat')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  // sortBy global verfügbar machen
  window.sortBy = sortBy;
}

// ============================================================
// HILFSFUNKTIONEN
// ============================================================
function _getEmail(m) {
  return (m.PrimaryEmail || m.primary_email || m.Email || '').trim();
}

function _getName(m) {
  const fn = m.FirstName || m.first_name || '';
  const ln = m.LastName  || m.last_name  || '';
  return [fn, ln].filter(Boolean).join(' ') || `(${m.PersonNumber || m.person_number})`;
}

function _mailGetAllSelected() {
  return _mailAllMembers.filter(m =>
    _mailSelected.has(String(m.PersonNumber || m.person_number || ''))
  );
}

function _mailGetSelectedWithEmail() {
  return _mailGetAllSelected().filter(m => _getEmail(m));
}

function _mailGetEmailList() {
  return _mailGetSelectedWithEmail()
    .map(m => _getEmail(m))
    .join('; ');
}

// ============================================================
// EXPORT-AKTIONEN
// ============================================================
function mailKopieren() {
  const liste = _mailGetEmailList();
  if (!liste) {
    alert('Keine E-Mail-Adressen in der Auswahl.');
    return;
  }
  navigator.clipboard.writeText(liste).then(() => {
    const el = document.getElementById('mail-copy-success');
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3000);
  }).catch(() => {
    // Fallback für ältere Browser
    prompt('Adressen markieren und kopieren (Ctrl+C):', liste);
  });
}

function mailCSV() {
  const alle = _mailGetAllSelected();
  if (!alle.length) return;

  const lines = ['"Nachname";"Vorname";"E-Mail";"Kategorie"'];
  alle.forEach(m => {
    const kat = m._istVorstand ? 'Vorstand' :
                (m._kategorie || (m.IsPassive == 1 ? 'Passiv' : '') || '');
    lines.push(`"${m.LastName||''}";"${m.FirstName||''}";"${_getEmail(m)}";"${kat}"`);
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')],
                        { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `muhen_mail_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
