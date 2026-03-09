// js/mitglieder.js
// ============================================================
// STATE
// ============================================================
let _mglData = [];

// ============================================================
// EINSTIEGSPUNKT
// ============================================================
async function loadMitgliederData() {
  const container = document.getElementById('mitglieder-container');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2 text-muted">Lade Mitglieder…</p>
    </div>`;
  try {
    const res  = await apiFetch('mitglieder', 'action=getAll');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    _mglData = data.data || [];
    renderMitgliederView(_mglData);
  } catch(e) {
    container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
  }
}

// ============================================================
// RENDER
// ============================================================
function renderMitgliederView(data) {
  const canEdit = ['admin','vorstand','schuetzenmeister'].includes(userRole);

  document.getElementById('mitglieder-container').innerHTML = `
    <!-- Toolbar -->
    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <input type="text" class="form-control form-control-sm" style="width:240px"
             id="mglSearch" placeholder="🔍 Name, E-Mail, PersonNumber…"
             oninput="mglFilter()">
      <select class="form-select form-select-sm" style="width:140px"
              id="mglFilterStatus" onchange="mglFilter()">
        <option value="">Alle Status</option>
        <option value="aktiv">Aktiv</option>
        <option value="passiv">Passiv</option>
        <option value="inaktiv">Inaktiv</option>
      </select>
      <select class="form-select form-select-sm" style="width:160px"
              id="mglFilterKat" onchange="mglFilter()">
        <option value="">Alle Kategorien</option>
        <option value="Aktiv A">Aktiv A (G50m)</option>
        <option value="Aktiv B">Aktiv B (G50m)</option>
        <option value="Aktiv">Aktiv 10m</option>
        <option value="Passiv">Passiv</option>
        <option value="Junior">Junior</option>
        <option value="Schüler">Schüler</option>
        <option value="Ehrenmitglied">Ehrenmitglied</option>
      </select>
      ${canEdit ? `
      <button class="btn btn-sm btn-primary ms-auto" onclick="mglNeuesMitglied()">
        <i class="fas fa-plus"></i> Neues Mitglied
      </button>` : ''}
    </div>

    <!-- Stats-Badges -->
    <div class="d-flex flex-wrap gap-2 mb-3" id="mglStats"></div>

    <!-- Tabelle -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-sm mb-0">
            <thead class="table-dark">
              <tr>
                <th>Nr.</th>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Telefon</th>
                <th>Kategorie</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="mglTableBody"></tbody>
          </table>
        </div>
      </div>
      <div class="card-footer text-muted small" id="mglCount"></div>
    </div>

    <!-- Modal: Detail -->
    <div class="modal fade" id="mglModalDetail" tabindex="-1">
      <div class="modal-dialog modal-xl modal-fullscreen-lg-down">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="mglDetailTitle">Mitglied</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0" id="mglDetailBody"></div>
        </div>
      </div>
    </div>

    <!-- Modal: Neues Mitglied (intern) -->
    <div class="modal fade" id="mglModalNeu" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Neues Mitglied (intern)</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info small">
              <i class="fas fa-info-circle"></i>
              Nur für Schüler &lt;16 ohne SSV-Lizenz.
              Reguläre Mitglieder werden via SSV-Import erfasst.
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Vorname *</label>
                <input type="text" class="form-control" id="nmVorname">
              </div>
              <div class="col-md-6">
                <label class="form-label">Nachname *</label>
                <input type="text" class="form-control" id="nmNachname">
              </div>
              <div class="col-md-6">
                <label class="form-label">Geburtsdatum *</label>
                <input type="date" class="form-control" id="nmGeburt">
              </div>
              <div class="col-md-6">
                <label class="form-label">E-Mail</label>
                <input type="email" class="form-control" id="nmEmail">
              </div>
              <div class="col-md-6">
                <label class="form-label">Strasse</label>
                <input type="text" class="form-control" id="nmStrasse">
              </div>
              <div class="col-md-3">
                <label class="form-label">PLZ</label>
                <input type="text" class="form-control" id="nmPlz">
              </div>
              <div class="col-md-3">
                <label class="form-label">Ort</label>
                <input type="text" class="form-control" id="nmOrt">
              </div>
              <div class="col-md-6">
                <label class="form-label">Telefon</label>
                <input type="text" class="form-control" id="nmTel">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button class="btn btn-primary" onclick="mglSaveNeu()">
              <i class="fas fa-save"></i> Erstellen
            </button>
          </div>
        </div>
      </div>
    </div>`;

  mglRenderStats(data);
  mglRenderRows(data);
}

// ============================================================
// STATISTIK-BADGES
// ============================================================
function mglRenderStats(data) {
  const aktiv  = data.filter(m => m.IsActive == 1 || m.IsActive === true || m.IsActive === '1').length;
  const passiv = data.filter(m => m.IsPassive == 1 || m.IsPassive === true).length;
  const junior = data.filter(m => /junior|schüler/i.test(m._kategorie || '')).length;

  const el = document.getElementById('mglStats');
  if (!el) return;
  el.innerHTML = `
    <span class="badge bg-primary fs-6 px-3">👥 Total: ${data.length}</span>
    <span class="badge bg-success fs-6 px-3">✅ Aktiv: ${aktiv}</span>
    <span class="badge bg-secondary fs-6 px-3">💤 Passiv: ${passiv}</span>
    <span class="badge bg-info fs-6 px-3">🏅 Junior/Schüler: ${junior}</span>`;
}

// ============================================================
// TABELLEN-RENDER
// ============================================================
function mglRenderRows(data) {
  const tbody = document.getElementById('mglTableBody');
  if (!tbody) return;

  const canEdit = ['admin','vorstand','schuetzenmeister'].includes(userRole);

  tbody.innerHTML = data.map(m => {
    const isAktiv = m.IsActive == 1 || m.IsActive === true || m.IsActive === '1';
    const kat     = m._kategorie || m.MembershipCategory || '';
    return `<tr>
      <td class="text-muted small">${m.PersonNumber}</td>
      <td>
        <a href="#" class="text-decoration-none fw-semibold"
           onclick="mglOpenDetail('${m.PersonNumber}'); return false;">
          ${m.FirstName || ''} ${m.LastName || ''}
        </a>
      </td>
      <td class="small">${m.PrimaryEmail || '–'}</td>
      <td class="small">${m.PrivateMobilePhone || m.BusinessMobilePhone || '–'}</td>
      <td>${mglKatBadge(kat)}</td>
      <td>
        <span class="badge ${isAktiv ? 'bg-success' : 'bg-secondary'}">
          ${isAktiv ? 'Aktiv' : 'Inaktiv'}
        </span>
      </td>
      <td>
        <button class="btn btn-xs btn-outline-primary btn-sm py-0 px-2"
                onclick="mglOpenDetail('${m.PersonNumber}')">
          <i class="fas fa-eye"></i>
        </button>
        ${canEdit ? `
        <button class="btn btn-xs btn-outline-secondary btn-sm py-0 px-2"
                onclick="mglOpenEdit('${m.PersonNumber}')"
                title="Vereinsinterne Felder bearbeiten">
          <i class="fas fa-pen"></i>
        </button>` : ''}
      </td>
    </tr>`;
  }).join('');

  document.getElementById('mglCount').textContent = `${data.length} Mitglieder`;
}

function mglKatBadge(kat) {
  if (!kat) return '<span class="badge bg-light text-dark">–</span>';
  if (/aktiv.*a/i.test(kat))     return `<span class="badge bg-primary">${kat}</span>`;
  if (/aktiv.*b/i.test(kat))     return `<span class="badge" style="background:#4a90d9">${kat}</span>`;
  if (/passiv/i.test(kat))       return `<span class="badge bg-secondary">${kat}</span>`;
  if (/junior/i.test(kat))       return `<span class="badge bg-info text-dark">${kat}</span>`;
  if (/schüler/i.test(kat))      return `<span class="badge bg-teal text-dark" style="background:#20c997">${kat}</span>`;
  if (/ehren/i.test(kat))        return `<span class="badge bg-warning text-dark">${kat}</span>`;
  return `<span class="badge bg-secondary">${kat}</span>`;
}

// ============================================================
// FILTER
// ============================================================
function mglFilter() {
  const search = (document.getElementById('mglSearch')?.value || '').toLowerCase();
  const status = document.getElementById('mglFilterStatus')?.value || '';
  const kat    = document.getElementById('mglFilterKat')?.value || '';

  const filtered = _mglData.filter(m => {
    const fullName = ((m.FirstName||'') + ' ' + (m.LastName||'')).toLowerCase();
    const matchSearch = !search || fullName.includes(search) ||
      (m.PrimaryEmail||'').toLowerCase().includes(search) ||
      String(m.PersonNumber||'').includes(search);

    const isAktiv  = m.IsActive == 1 || m.IsActive === true || m.IsActive === '1';
    const isPassiv = m.IsPassive == 1 || m.IsPassive === true;
    const matchStatus = !status ||
      (status === 'aktiv'   && isAktiv) ||
      (status === 'passiv'  && isPassiv) ||
      (status === 'inaktiv' && !isAktiv);

    const matchKat = !kat || (m._kategorie || '').includes(kat);
    return matchSearch && matchStatus && matchKat;
  });

  mglRenderStats(filtered);
  mglRenderRows(filtered);
}

// ============================================================
// DETAIL MODAL
// ============================================================
async function mglOpenDetail(pn) {
  const modal = new bootstrap.Modal(document.getElementById('mglModalDetail'));
  const body  = document.getElementById('mglDetailBody');
  body.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary"></div>
    </div>`;
  document.getElementById('mglDetailTitle').textContent = 'Lade Mitglied…';
  modal.show();

  try {
    const [detailRes, lizenzenRes, fnRes, histRes] = await Promise.all([
      apiFetch('mitglieder', `action=getDetail&pn=${pn}`).then(r => r.json()),
      apiFetch('mitglieder', `action=getLizenzen&pn=${pn}`).then(r => r.json()),
      apiFetch('mitglieder', `action=getFunktionen&pn=${pn}`).then(r => r.json()),
      apiFetch('mitglieder', `action=getHistorie&pn=${pn}`).then(r => r.json())
    ]);

    const m   = detailRes.data;
    const liz = lizenzenRes.data || [];
    const fn  = fnRes.data || [];
    const his = histRes.data || [];

    document.getElementById('mglDetailTitle').textContent =
      `${m.FirstName} ${m.LastName}`;

    const stammdatenRows = [
      ['PersonNumber', m.PersonNumber],
      ['Anrede', m.Salutation],
      ['Vorname', m.FirstName],
      ['Nachname', m.LastName],
      ['Geburtsdatum', mglFmtDate(m.BirthDate)],
      ['Geschlecht', m.Gender],
      ['Nationalität', m.Nationality],
      ['Strasse', m.Street],
      ['PLZ / Ort', `${m.PostCode || ''} ${m.City || ''}`],
      ['Land', m.Country],
      ['E-Mail', m.PrimaryEmail],
      ['Weitere E-Mail', m.AdditionalEmail],
      ['Mobil (privat)', m.PrivateMobilePhone],
      ['Mobil (geschäftl.)', m.BusinessMobilePhone],
      ['Tel. privat', m.PrivateLandlinePhone],
      ['Tel. geschäftl.', m.BusinessLandlinePhone],
    ].filter(([,v]) => v && v !== '' && v !== 'undefined undefined')
     .map(([k, v]) => `
      <div class="row border-bottom py-1">
        <div class="col-5 text-muted small">${k}</div>
        <div class="col-7 small fw-semibold">${v}</div>
      </div>`).join('');

    const lizRows = liz.map(l => {
      const aktiv = l.IsActive == 1 || l.IsActive === true;
      return `<tr>
        <td>${l.MembershipCategory || '–'}</td>
        <td>${mglFmtDate(l.EntryDate)}</td>
        <td>${mglFmtDate(l.ExitDate)}</td>
        <td>${l.LicenseType || '–'}</td>
        <td>${l.LicenseInvoicingClubName || '–'}</td>
        <td><span class="badge ${aktiv ? 'bg-success' : 'bg-secondary'}">${aktiv ? 'aktiv' : 'inaktiv'}</span></td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-muted text-center">Keine Lizenzen</td></tr>';

    const fnRows = fn.map(f => {
      const aktiv = !f.OfficialFunctionExitDate || f.OfficialFunctionExitDate === '';
      return `<tr>
        <td>${f.OfficialFunctionCategory || '–'}</td>
        <td>${mglFmtDate(f.OfficialFunctionEntryDate)}</td>
        <td>${mglFmtDate(f.OfficialFunctionExitDate)}</td>
        <td>${f.rabatt_kategorie ? `<span class="badge bg-warning text-dark">${f.rabatt_kategorie}</span>` : '–'}</td>
        <td><span class="badge ${aktiv ? 'bg-success' : 'bg-secondary'}">${aktiv ? 'aktiv' : 'ehemalig'}</span></td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-muted text-center">Keine Funktionen</td></tr>';

       // Mapping: interne Typen → lesbare Labels + Farben
    const HIS_CONFIG = {
      'EINTRITT':           { label: 'Vereinseintritt',          color: '#198754', icon: '👤' },
      'AUSTRITT':           { label: 'Vereinsaustritt',          color: '#dc3545', icon: '🚪' },
      'VEREINSAUSTRITT_DATUM': { label: 'Austrittsdatum gesetzt', color: '#dc3545', icon: '📅' },
      'STATUS_WECHSEL':     { label: 'Statuswechsel',            color: '#fd7e14', icon: '🔄' },
      'LIZENZ_EINTRITT':    { label: 'Lizenz aktiviert',         color: '#198754', icon: '🏅' },
      'LIZENZ_AUSTRITT':    { label: 'Lizenz beendet',           color: '#dc3545', icon: '🏅' },
      'LIZENZ_HISTORISCH':  { label: 'Lizenz beendet (historisch)', color: '#adb5bd', icon: '📋' },
      'FUNKTION_EINTRITT':  { label: 'Funktion übernommen',      color: '#0d6efd', icon: '⭐' },
      'FUNKTION_AUSTRITT':  { label: 'Funktion beendet',         color: '#6c757d', icon: '⭐' },
      'EHRENMITGLIED':      { label: 'Ehrenmitglied',            color: '#ffc107', icon: '🏆' },
      // NEU hinzufügen in HIS_CONFIG:
'STATUS_PASSIV':       { label: 'Statuswechsel → Passiv',    color: '#6c757d', icon: '💤' },
'STATUS_REAKTIVIERUNG':{ label: 'Reaktivierung',             color: '#198754', icon: '🔄' },
'EHRENMITGLIED':       { label: 'Ehrenmitglied ernannt',     color: '#ffc107', icon: '🏆' },

    };

    // Sortierung: neuestes zuerst
    const hisSorted = [...his].sort((a, b) => {
      const da = a.datum ? new Date(a.datum) : new Date(0);
      const db = b.datum ? new Date(b.datum) : new Date(0);
      return db - da;
    });

    const timeline = hisSorted.length === 0
      ? '<p class="text-muted small">Keine Einträge</p>'
      : hisSorted.map(h => {
          const cfg   = HIS_CONFIG[h.ereignis_typ] || { label: h.ereignis_typ, color: '#6c757d', icon: '•' };
          const wert  = h.neuer_wert || h.alter_wert || '';
          const datum = mglFmtDate(h.datum);
          return `
            <div style="border-left:2px solid ${cfg.color}22; padding-left:14px; margin-bottom:14px; position:relative">
              <div style="width:10px;height:10px;background:${cfg.color};border-radius:50%;
                          position:absolute;left:-6px;top:4px"></div>
              <div class="d-flex align-items-center gap-2">
                <span style="font-size:0.8rem;background:${cfg.color}22;color:${cfg.color};
                             border-radius:4px;padding:1px 7px;font-weight:600">
                  ${cfg.icon} ${cfg.label}
                </span>
                <span class="text-muted" style="font-size:0.78rem">${datum}</span>
              </div>
              ${wert ? `<div class="small mt-1">${wert}</div>` : ''}
              <div class="text-muted" style="font-size:0.72rem">${h.erfasst_von || ''}</div>
            </div>`;
        }).join('');

    const canEditVerein = ['admin','kassier','vorstand','schuetzenmeister'].includes(userRole);

    body.innerHTML = `
      <ul class="nav nav-tabs px-3 pt-2" id="mglDetailTabs">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#mglTabStamm">Stammdaten</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#mglTabLiz">Lizenzen</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#mglTabFn">Funktionen</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#mglTabHist">Historie</a></li>
        ${canEditVerein ? `<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#mglTabEdit">✏️ Bearbeiten</a></li>` : ''}
      </ul>
      <div class="tab-content p-3">

        <!-- Tab: Stammdaten -->
        <div class="tab-pane fade show active" id="mglTabStamm">
          <div class="row">
            <div class="col-md-6">
              <h6 class="fw-bold mb-2">Personalien <small class="text-muted fw-normal">(SSV – nur lesen)</small></h6>
              ${stammdatenRows}
            </div>
            <div class="col-md-6">
              <h6 class="fw-bold mb-2">Vereinsintern</h6>
              <div class="row border-bottom py-1">
                <div class="col-5 text-muted small">IBAN</div>
                <div class="col-7 small">${m.IBAN || '–'}</div>
              </div>
              <div class="row border-bottom py-1">
                <div class="col-5 text-muted small">Kontoinhaber</div>
                <div class="col-7 small">${m.Kontoinhaber || '–'}</div>
              </div>
              <div class="row border-bottom py-1">
                <div class="col-5 text-muted small">Rechnungsversand</div>
                <div class="col-7 small">${m.Rechnungsversand || '–'}</div>
              </div>
              <div class="row border-bottom py-1">
                <div class="col-5 text-muted small">Nie mahnen</div>
                <div class="col-7 small">${m.Nie_mahnen ? '✅ Ja' : 'Nein'}</div>
              </div>
              <div class="row border-bottom py-1">
                <div class="col-5 text-muted small">Vereinsaustritt</div>
                <div class="col-7 small">${mglFmtDate(m.Vereins_austritt)}</div>
              </div>
              <div class="row py-1">
                <div class="col-5 text-muted small">Bemerkung</div>
                <div class="col-7 small">${m.Remark || '–'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Lizenzen -->
        <div class="tab-pane fade" id="mglTabLiz">
          <div class="table-responsive">
            <table class="table table-sm">
              <thead class="table-light">
                <tr><th>Kategorie</th><th>Eintritt</th><th>Austritt</th><th>Typ</th><th>Klub</th><th>Status</th></tr>
              </thead>
              <tbody>${lizRows}</tbody>
            </table>
          </div>
        </div>

        <!-- Tab: Funktionen -->
        <div class="tab-pane fade" id="mglTabFn">
          <div class="table-responsive">
            <table class="table table-sm">
              <thead class="table-light">
                <tr><th>Funktion</th><th>Eintritt</th><th>Austritt</th><th>Rabatt</th><th>Status</th></tr>
              </thead>
              <tbody>${fnRows}</tbody>
            </table>
          </div>
        </div>

        <!-- Tab: Historie -->
        <div class="tab-pane fade" id="mglTabHist">
          <div class="mt-2">${timeline}</div>
        </div>

        ${canEditVerein ? `
        <!-- Tab: Bearbeiten (nur vereinsinterne Felder) -->
        <div class="tab-pane fade" id="mglTabEdit">
          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">IBAN</label>
              <input type="text" class="form-control" id="mglEditIBAN" value="${m.IBAN || ''}">
            </div>
            <div class="col-md-3">
              <label class="form-label">BIC</label>
              <input type="text" class="form-control" id="mglEditBIC" value="${m.BIC || ''}">
            </div>
            <div class="col-md-3">
              <label class="form-label">Kontoinhaber</label>
              <input type="text" class="form-control" id="mglEditKonto" value="${m.Kontoinhaber || ''}">
            </div>
            <div class="col-md-4">
              <label class="form-label">Rechnungsversand</label>
              <select class="form-select" id="mglEditRV">
                <option ${m.Rechnungsversand === 'E-Mail' ? 'selected' : ''}>E-Mail</option>
                <option ${m.Rechnungsversand === 'Post'   ? 'selected' : ''}>Post</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Vereinsaustritt</label>
              <input type="date" class="form-control" id="mglEditAustritt"
                     value="${m.Vereins_austritt ? new Date(m.Vereins_austritt).toISOString().split('T')[0] : ''}">
            </div>
            <div class="col-md-4">
              <div class="form-check mt-4">
                <input type="checkbox" class="form-check-input" id="mglEditMahnen"
                       ${m.Nie_mahnen ? 'checked' : ''}>
                <label class="form-check-label">Nie mahnen</label>
              </div>
            </div>
            <div class="col-12">
              <button class="btn btn-primary" onclick="mglSaveVerein('${pn}')">
                <i class="fas fa-save"></i> Speichern
              </button>
            </div>
          </div>
        </div>` : ''}

      </div>`;
  } catch(e) {
    body.innerHTML = `<div class="alert alert-danger m-3">Fehler: ${e.message}</div>`;
  }
}

// ============================================================
// SPEICHERN – VEREINSINTERNE FELDER
// ============================================================
async function mglSaveVerein(pn) {
  const btn = document.querySelector('#mglTabEdit .btn-primary');
  btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  const params = new URLSearchParams({
    action:           'saveVerein',
    pn,
    IBAN:             document.getElementById('mglEditIBAN').value,
    BIC:              document.getElementById('mglEditBIC').value,
    Kontoinhaber:     document.getElementById('mglEditKonto').value,
    Rechnungsversand: document.getElementById('mglEditRV').value,
    Vereins_austritt: document.getElementById('mglEditAustritt').value,
    Nie_mahnen:       document.getElementById('mglEditMahnen').checked ? '1' : '0'
  });

  try {
    const res  = await apiFetch('mitglieder', params.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    // Lokalen State updaten
    const idx = _mglData.findIndex(m => String(m.PersonNumber) === String(pn));
    if (idx >= 0) Object.assign(_mglData[idx], {
      IBAN: params.get('IBAN'),
      BIC:  params.get('BIC'),
      Kontoinhaber:     params.get('Kontoinhaber'),
      Rechnungsversand: params.get('Rechnungsversand'),
      Vereins_austritt: params.get('Vereins_austritt'),
      Nie_mahnen:       params.get('Nie_mahnen') === '1'
    });

    btn.innerHTML = '<i class="fas fa-check text-success"></i> Gespeichert!';
    setTimeout(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Speichern'; }, 2000);
  } catch(e) {
    alert('Fehler: ' + e.message);
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Speichern';
  }
}

// ============================================================
// NEUES MITGLIED (intern)
// ============================================================
function mglNeuesMitglied() {
  ['nmVorname','nmNachname','nmEmail','nmStrasse','nmPlz','nmOrt','nmTel'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('nmGeburt').value = '';
  new bootstrap.Modal(document.getElementById('mglModalNeu')).show();
}

async function mglSaveNeu() {
  const vorname = document.getElementById('nmVorname').value.trim();
  const nachname= document.getElementById('nmNachname').value.trim();
  const geburt  = document.getElementById('nmGeburt').value;
  if (!vorname || !nachname || !geburt) {
    alert('Vorname, Nachname und Geburtsdatum sind Pflichtfelder.');
    return;
  }

  const btn = document.querySelector('#mglModalNeu .btn-primary');
  btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  const params = new URLSearchParams({
    action:    'createIntern',
    FirstName: vorname,
    LastName:  nachname,
    BirthDate: geburt,
    PrimaryEmail: document.getElementById('nmEmail').value,
    Street:    document.getElementById('nmStrasse').value,
    PostCode:  document.getElementById('nmPlz').value,
    City:      document.getElementById('nmOrt').value,
    PrivateMobilePhone: document.getElementById('nmTel').value
  });

  try {
    const res  = await apiFetch('mitglieder', params.toString());
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    bootstrap.Modal.getInstance(document.getElementById('mglModalNeu')).hide();
    alert(`✅ Mitglied erstellt (${data.PersonNumber})`);
    await loadMitgliederData();
  } catch(e) {
    alert('Fehler: ' + e.message);
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Erstellen';
  }
}

function mglOpenEdit(pn) {
  mglOpenDetail(pn);
  // Nach kurzer Verzögerung Tab "Bearbeiten" aktivieren
  setTimeout(() => {
    document.querySelector('[href="#mglTabEdit"]')?.click();
  }, 600);
}

// ============================================================
// UTILS
// ============================================================
function mglFmtDate(val) {
  if (!val || val === '' || val === '–') return '–';
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleDateString('de-CH');
}
