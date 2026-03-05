// ============================================================
// mail.js – Mail-Baustein Sportschützen Muhen
// ============================================================

const MAIL_GRUPPEN_CONFIG = [
  {
    key:   'vorstand',
    label: '⭐ Vorstand',
    haupt: true,
    filter: m => m._istVorstand
  },
  {
    key:   'alle',
    label: '⭐ Alle Vereinsmitglieder',
    haupt: true,
    filter: m => m.IsActive == 1 &&
                 m.Deceased != 1 && m.Deceased !== true &&
                 !m.Vereins_austritt
  },
  {
    key:   'kk50a',
    label: 'KK 50m Aktiv-A',
    haupt: false,
    filter: m => /aktiv-?a.*g50/i.test(m._kategorie || '')
  },
  {
    key:   'kk50b',
    label: 'KK 50m Aktiv-B',
    haupt: false,
    filter: m => /aktiv-?b.*g50/i.test(m._kategorie || '')
  },
  {
    key:   'lg',
    label: 'Luftgewehr (LG)',
    haupt: false,
    filter: m => /g10/i.test(m._kategorie || '')
  },
  {
    key:   'ehren',
    label: 'Ehrenmitglieder',
    haupt: false,
    filter: m => /ehren/i.test(m._kategorie || '')
  },
  {
    key:   'passiv',
    label: 'Passivmitglieder',
    haupt: false,
    filter: m => /passiv/i.test(m._kategorie || '') &&
                 !/ehren/i.test(m._kategorie || '')
  },
];

let _mailAllMembers = [];
let _mailSelected   = new Set(); // PersonNumbers

// ============================================================
// LADEN
// ============================================================
async function loadMailData() {
  document.getElementById('mail-container').innerHTML =
    '<p class="text-muted">⏳ Lade Mitglieder...</p>';

  try {
    const res  = await apiFetch('mitglieder', 'action=getAll');
    const text = await res.text(); // erst text(), dann manuell parsen

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
        `<div class="alert alert-danger">GAS-Fehler: ${data.error || JSON.stringify(data)}</div>`;
      return;
    }

    _mailAllMembers = data.data.filter(m =>
      m.IsActive == 1 &&
      m.Deceased != 1 && m.Deceased !== true &&
      !m.Vereins_austritt
    );

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
              <button class="btn btn-outline-secondary d-none d-md-inline-flex"
                      onclick="mailCSV()">
                <i class="fas fa-download me-1"></i> CSV
              </button>
            </div>

            <div id="mail-bcc-hint" class="alert alert-info py-2 small d-none">
              <i class="fas fa-info-circle me-1"></i>
              Bitte Empfänger ins <strong>BCC-Feld</strong> einfügen –
              so bleiben die Adressen der Mitglieder geschützt.
            </div>

            <div id="mail-copy-success" class="alert alert-success py-2 small d-none">
              <i class="fas fa-check me-1"></i> Adressen in Zwischenablage kopiert!
            </div>

            <div id="mail-preview" class="mt-3" style="max-height:320px;overflow-y:auto;"></div>

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
  const cfg    = MAIL_GRUPPEN_CONFIG.find(g => g.key === key);
  const cb     = document.getElementById(`mg-${key}`);
  const isAlle = key === 'alle';

  if (isAlle && cb.checked) {
    // Alle anderen deaktivieren
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
        _mailSelected.add(String(m.PersonNumber));
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
  const selected = _mailGetSelectedMembers();
  const ohneEmail = selected.filter(m => !m.PrimaryEmail).length;
  const mitEmail  = selected.length - ohneEmail;

  const summaryEl = document.getElementById('mail-summary');
  const hintEl    = document.getElementById('mail-bcc-hint');
  const mailtoBtn = document.getElementById('btn-mailto');

  if (selected.length === 0) {
    summaryEl.innerHTML = '<span class="text-muted">Keine Gruppe gewählt.</span>';
    hintEl.classList.add('d-none');
    mailtoBtn.disabled = true;
    return;
  }

  const warnHtml = ohneEmail > 0
    ? `<span class="text-warning ms-2">
         <i class="fas fa-exclamation-triangle"></i> 
         ${ohneEmail} ohne E-Mail (werden ausgeschlossen)
       </span>`
    : '';

  summaryEl.innerHTML = `
    <strong>${selected.length} Empfänger</strong> gewählt, 
    ${mitEmail} mit E-Mail${warnHtml}`;

  hintEl.classList.remove('d-none');
  mailtoBtn.disabled = mitEmail > 20;
  if (mitEmail > 20) {
    mailtoBtn.title = 'Liste zu gross für direkten Mail-Start (>20 Empfänger) – bitte «Adressen kopieren» verwenden';
  }
}

function _mailRenderPreview() {
  const selected = _mailGetSelectedMembers();
  if (selected.length === 0) {
    document.getElementById('mail-preview').innerHTML = '';
    return;
  }

  const rows = selected.map(m => {
    const name  = [m.FirstName, m.LastName].filter(Boolean).join(' ') || `(${m.PersonNumber})`;
    const email = m.PrimaryEmail
      ? `<span class="text-success">${m.PrimaryEmail}</span>`
      : `<span class="text-warning"><i class="fas fa-exclamation-triangle"></i> keine E-Mail</span>`;
    const gruppen = _mailGetGruppenFuerPerson(m);
    return `<tr>
      <td class="small">${name}</td>
      <td class="small">${email}</td>
      <td class="small text-muted">${gruppen}</td>
    </tr>`;
  }).join('');

  document.getElementById('mail-preview').innerHTML = `
    <table class="table table-sm table-hover">
      <thead class="table-light">
        <tr>
          <th>Name</th><th>E-Mail</th><th>Gruppe(n)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function _mailGetGruppenFuerPerson(m) {
  return MAIL_GRUPPEN_CONFIG
    .filter(g => {
      const cb = document.getElementById(`mg-${g.key}`);
      return cb && cb.checked && g.filter(m);
    })
    .map(g => g.label.replace(/⭐\s*/,''))
    .join(', ');
}

// ============================================================
// HILFSFUNKTIONEN
// ============================================================
function _mailGetSelectedMembers() {
  return _mailAllMembers.filter(m =>
    _mailSelected.has(String(m.PersonNumber)) && m.PrimaryEmail
  );
}

function _mailGetEmailList() {
  return _mailGetSelectedMembers()
    .map(m => m.PrimaryEmail)
    .filter(Boolean)
    .join('; ');
}

// ============================================================
// EXPORT-AKTIONEN
// ============================================================
function mailKopieren() {
  const liste = _mailGetEmailList();
  if (!liste) return;

  navigator.clipboard.writeText(liste).then(() => {
    const el = document.getElementById('mail-copy-success');
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3000);
  });
}

function mailOpenMailto() {
  const liste = _mailGetEmailList();
  if (!liste) return;
  window.location.href = `mailto:?bcc=${encodeURIComponent(liste)}`;
}

function mailCSV() {
  const selected = _mailGetSelectedMembers();
  if (!selected.length) return;

  const header = 'Name;E-Mail;Gruppe\n';
  const rows = selected.map(m => {
    const name   = [m.FirstName, m.LastName].filter(Boolean).join(' ');
    const email  = m.PrimaryEmail || '';
    const gruppe = _mailGetGruppenFuerPerson(m);
    return `"${name}";"${email}";"${gruppe}"`;
  }).join('\n');

  const blob = new Blob(['\uFEFF' + header + rows], // BOM für Excel
                        { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `muhen_mail_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
