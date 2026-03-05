// ============================================================
// mail.js – Mail-Baustein Sportschützen Muhen
// ============================================================

const MAIL_GRUPPEN_CONFIG = [
  { key: 'vorstand', label: '⭐ Vorstand',             haupt: true,  filter: m => m._istVorstand === true },
  { key: 'alle',     label: '⭐ Alle Vereinsmitglieder', haupt: true,  filter: m => true },
  { key: 'kk50a',   label: 'KK 50m Aktiv-A',           haupt: false, filter: m => m._istKK50A === true },
  { key: 'kk50b',   label: 'KK 50m Aktiv-B',           haupt: false, filter: m => m._istKK50B === true },
  { key: 'lg',      label: 'Luftgewehr (LG)',           haupt: false, filter: m => m._istLG === true },
  { key: 'ehren',   label: 'Ehrenmitglieder',           haupt: false, filter: m => m._istEhren === true },
  { key: 'passiv',  label: 'Passivmitglieder',          haupt: false, filter: m => m._istPassiv === true },
];

let _mailAllMembers = [];
let _mailSelected   = new Set();
let _mailLoaded     = false;
window._mailSortCol = 'ln';
window._mailSortDir = 1;

// ============================================================
// LADEN
// ============================================================
async function loadMailData(force = false) {
  if (_mailLoaded && !force) return;

  _mailLoaded     = false;
  _mailAllMembers = [];
  _mailSelected.clear();

  document.getElementById('mail-container').innerHTML =
    '<p class="text-muted ps-1">⏳ Lade Mitglieder...</p>';

  try {
    const res  = await apiFetch('mitglieder', 'action=getAll');
    const text = await res.text();

    let data;
    try { data = JSON.parse(text); }
    catch (e) {
      document.getElementById('mail-container').innerHTML =
        `<div class="alert alert-danger"><strong>Parse-Fehler:</strong><br>
         <pre style="font-size:0.75rem;max-height:200px;overflow:auto">${text.substring(0,500)}</pre></div>`;
      return;
    }

    if (!data.success) {
      document.getElementById('mail-container').innerHTML =
        `<div class="alert alert-danger">Fehler: ${data.error || JSON.stringify(data)}</div>`;
      return;
    }

    const seen = new Set();
    _mailAllMembers = data.data.filter(m => {
      const pn = String(m.PersonNumber || '');
      if (!pn || seen.has(pn)) return false;
      seen.add(pn);
      return m.IsActive == 1 && m.Deceased != 1 && !m.Vereins_austritt;
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
  MAIL_GRUPPEN_CONFIG.forEach(g => { counts[g.key] = _mailAllMembers.filter(g.filter).length; });

  const hauptRows = MAIL_GRUPPEN_CONFIG.filter(g => g.haupt).map(g => _gruppenCheckbox(g, counts[g.key])).join('');
  const katRows   = MAIL_GRUPPEN_CONFIG.filter(g => !g.haupt).map(g => _gruppenCheckbox(g, counts[g.key])).join('');

  document.getElementById('mail-container').innerHTML = `
    <div class="row g-3">
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
      <div class="col-md-7">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div id="mail-summary" class="mb-3 text-muted small">Keine Gruppe gewählt.</div>
            <div class="d-flex flex-wrap gap-2 mb-3">
              <button class="btn btn-primary" onclick="mailKopieren()">
                <i class="fas fa-copy me-1"></i> Adressen kopieren
              </button>
              <button id="btn-mailto" class="btn btn-outline-secondary" onclick="mailOpenMailto()" disabled>
                <i class="fas fa-envelope me-1"></i> In Mail öffnen
              </button>
              <button class="btn btn-outline-secondary" onclick="loadMailData(true)">
                <i class="fas fa-sync me-1"></i> Aktualisieren
              </button>
              <button class="btn btn-outline-secondary" onclick="mailCSV()">
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
              Zu viele Empfänger (&gt;30) – bitte <strong>«Adressen kopieren»</strong> und manuell ins BCC einfügen.
            </div>
            <div id="mail-preview" class="mt-3" style="max-height:340px;overflow-y:auto;"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function _gruppenCheckbox(g, count) {
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
        _mailSelected.add(String(m.PersonNumber || ''));
      });
    }
  });
  _mailRenderSummary();
  _mailRenderPreview();
}

// ============================================================
// KATEGORIE-LABEL (kontextabhängig)
// ============================================================
function _getKatLabel(m) {
  if (m._istVorstand && document.getElementById('mg-vorstand')?.checked) return 'Vorstand';
  if (m._istLG       && document.getElementById('mg-lg')?.checked)       return 'LG';
  if (m._istEhren    && document.getElementById('mg-ehren')?.checked)     return 'Ehrenmitglied';
  if (m._istPassiv   && document.getElementById('mg-passiv')?.checked)    return 'Passiv';
  return m._kategorie || '–';
}

// ============================================================
// SUMMARY
// ============================================================
function _mailRenderSummary() {
  const alle     = _mailGetAllSelected();
  const mitEmail = alle.filter(m => _getEmail(m));
  const ohne     = alle.length - mitEmail.length;

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

  const warnHtml = ohne > 0
    ? `<span class="text-warning ms-2"><i class="fas fa-exclamation-triangle"></i> ${ohne} ohne E-Mail</span>` : '';

  summaryEl.innerHTML = `<strong>${alle.length} Empfänger</strong>, ${mitEmail.length} mit E-Mail${warnHtml}`;
  hintEl.classList.remove('d-none');

  const zuViele = mitEmail.length > 30;
  mailtoBtn.disabled = zuViele;
  mailtoHint.classList.toggle('d-none', !zuViele);
}

// ============================================================
// VORSCHAU
// ============================================================
function _mailRenderPreview() {
  const alle = _mailGetAllSelected();
  if (alle.length === 0) {
    document.getElementById('mail-preview').innerHTML = '';
    return;
  }

  const sorted = [...alle].sort((a, b) => {
    const col = window._mailSortCol;
    const va = col === 'fn' ? (a.FirstName || '') :
               col === 'ln' ? (a.LastName  || '') :
               col === 'email' ? _getEmail(a) : _getKatLabel(a);
    const vb = col === 'fn' ? (b.FirstName || '') :
               col === 'ln' ? (b.LastName  || '') :
               col === 'email' ? _getEmail(b) : _getKatLabel(b);
    return window._mailSortDir * va.localeCompare(vb, 'de');
  });

  function arrow(col) {
    if (window._mailSortCol !== col) return ' <span class="text-muted">⇅</span>';
    return window._mailSortDir === 1 ? ' ↑' : ' ↓';
  }

  const rows = sorted.map(m => {
    const email = _getEmail(m)
      ? `<span class="text-success small">${_getEmail(m)}</span>`
      : `<span class="text-warning small"><i class="fas fa-exclamation-triangle"></i> –</span>`;
    return `<tr>
      <td class="small">${m.LastName  || '–'}</td>
      <td class="small">${m.FirstName || '–'}</td>
      <td class="small">${email}</td>
      <td class="small text-muted">${_getKatLabel(m)}</td>
    </tr>`;
  }).join('');

  document.getElementById('mail-preview').innerHTML = `
    <table class="table table-sm table-hover mb-0">
      <thead class="table-light" style="position:sticky;top:0;z-index:1;cursor:pointer">
        <tr>
          <th onclick="mailSort('ln')">Nachname${arrow('ln')}</th>
          <th onclick="mailSort('fn')">Vorname${arrow('fn')}</th>
          <th onclick="mailSort('email')">E-Mail${arrow('email')}</th>
          <th onclick="mailSort('kat')">Kategorie${arrow('kat')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Global für onclick im HTML
function mailSort(col) {
  if (window._mailSortCol === col) window._mailSortDir *= -1;
  else { window._mailSortCol = col; window._mailSortDir = 1; }
  _mailRenderPreview();
}

// ============================================================
// HILFSFUNKTIONEN
// ============================================================
function _getEmail(m) {
  return (m.PrimaryEmail || m.primary_email || m.Email || '').trim();
}

function _mailGetAllSelected() {
  return _mailAllMembers.filter(m => _mailSelected.has(String(m.PersonNumber || '')));
}

function _mailGetEmailList() {
  return _mailGetAllSelected()
    .filter(m => _getEmail(m))
    .map(m => _getEmail(m))
    .join('; ');
}

// ============================================================
// EXPORT-AKTIONEN
// ============================================================
function mailKopieren() {
  const liste = _mailGetEmailList();
  if (!liste) { alert('Keine E-Mail-Adressen in der Auswahl.'); return; }
  navigator.clipboard.writeText(liste).then(() => {
    const el = document.getElementById('mail-copy-success');
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3000);
  }).catch(() => {
    prompt('Adressen kopieren (Ctrl+C):', liste);
  });
}

function mailOpenMailto() {
  const liste = _mailGetEmailList();
  if (!liste) return;
  // Semikolon: Outlook-kompatibel
  const bcc = liste.replace(/; /g, ';');
  const a   = document.createElement('a');
  a.href    = 'mailto:?bcc=' + encodeURIComponent(bcc);
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 100);
}

function mailCSV() {
  const alle = _mailGetAllSelected();
  if (!alle.length) return;

  const lines = ['"Nachname";"Vorname";"E-Mail";"Kategorie"'];
  alle.forEach(m => {
    lines.push(`"${m.LastName||''}";"${m.FirstName||''}";"${_getEmail(m)}";"${_getKatLabel(m)}"`);
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `muhen_mail_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
