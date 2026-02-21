// ============================================================
// vermietung.js – Cockpit für Vermietungsverwaltung
// ============================================================

let vermietungDaten = [];

async function loadVermietungData() {
  const container = document.getElementById('vermietung-container');
  container.innerHTML = `<div class="text-center py-5">
    <div class="spinner-border text-primary"></div>
    <p class="mt-2 text-muted">Lade Reservationen...</p>
  </div>`;

  try {
    const res  = await apiFetch('vermietung', 'action=getAll');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    vermietungDaten = data.data;
    renderVermietungCockpit(vermietungDaten);
  } catch(e) {
    container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
  }
}

function renderVermietungCockpit(daten) {
  // Statistiken berechnen
  const stats = {
    offen:     daten.filter(d => d.status === "01 - Mietvertrag versandt").length,
    gemahnt:   daten.filter(d => d.status === "02 - Mietbetrag gemahnt").length,
    bezahlt:   daten.filter(d => d.status === "03 - Zahlung erhalten").length,
    schluessel:daten.filter(d => d.status === "04 - Schlüsselübergabe versandt").length,
    storniert: daten.filter(d => d.status === "05 - Reservation storniert").length,
  };

  // Nächste Vermietung
  const heute   = new Date();
  const aktive  = daten
    .filter(d => !d.status.includes("storniert") && !d.status.includes("Konflikt"))
    .filter(d => {
      const parts = d.mietdatum.split(".");
      return parts.length === 3 && new Date(parts[2], parts[1]-1, parts[0]) >= heute;
    })
    .sort((a, b) => {
      const pa = a.mietdatum.split("."), pb = b.mietdatum.split(".");
      return new Date(pa[2],pa[1]-1,pa[0]) - new Date(pb[2],pb[1]-1,pb[0]);
    });
  const naechste = aktive[0];

  // Einnahmen berechnen

const einnahmen = daten
  .filter(d => d.status === "03 - Zahlung erhalten" || 
               d.status === "04 - Schlüsselübergabe versandt")
  .reduce((sum, d) => sum + parseFloat((d.mietbetrag || "0").replace(/[^\d.]/g, '')), 0);

  document.getElementById('vermietung-container').innerHTML = `

    <!-- STATISTIK-KACHELN -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-2">
        <div class="card border-0 shadow-sm text-center p-3 h-100" style="border-left:4px solid #ffc107 !important;">
          <div style="font-size:2rem;font-weight:bold;color:#ffc107">${stats.offen}</div>
          <div class="small text-muted">🟡 Offen</div>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="card border-0 shadow-sm text-center p-3 h-100" style="border-left:4px solid #fd7e14 !important;">
          <div style="font-size:2rem;font-weight:bold;color:#fd7e14">${stats.gemahnt}</div>
          <div class="small text-muted">🟠 Gemahnt</div>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="card border-0 shadow-sm text-center p-3 h-100" style="border-left:4px solid #28a745 !important;">
          <div style="font-size:2rem;font-weight:bold;color:#28a745">${stats.bezahlt + stats.schluessel}</div>
          <div class="small text-muted">🟢 Bezahlt</div>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="card border-0 shadow-sm text-center p-3 h-100" style="border-left:4px solid #dc3545 !important;">
          <div style="font-size:2rem;font-weight:bold;color:#dc3545">${stats.storniert}</div>
          <div class="small text-muted">⚫ Storniert</div>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="card border-0 shadow-sm text-center p-3 h-100" style="border-left:4px solid #0f3a5d !important;">
          <div style="font-size:1.4rem;font-weight:bold;color:#0f3a5d">CHF ${einnahmen.toFixed(0)}</div>
          <div class="small text-muted">💰 Einnahmen</div>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="card border-0 shadow-sm text-center p-3 h-100" style="border-left:4px solid #6f42c1 !important; cursor:pointer" onclick="triggerClubdeskExport()">
          <div style="font-size:1.5rem;">📤</div>
          <div class="small text-muted">Clubdesk Export</div>
        </div>
      </div>
    </div>

    <!-- NÄCHSTE VERMIETUNG -->
    ${naechste ? `
    <div class="alert mb-4" style="background:#eef2ff;border-left:4px solid #0f3a5d;border-radius:8px;">
      <strong>📅 Nächste Vermietung:</strong>
      ${naechste.mietdatum} – ${naechste.vorname} ${naechste.nachname}
      <span class="badge ms-2" style="background:#0f3a5d">${naechste.vertragsnr}</span>
      <button class="btn btn-sm btn-outline-primary ms-3" onclick="openVermietungModal(${naechste.row})">Details</button>
    </div>` : '<div class="alert alert-success mb-4">✅ Keine bevorstehenden Vermietungen</div>'}

    <!-- KALENDER + TABELLE -->
    <div class="row g-4">

      <!-- KALENDER -->
      <div class="col-12 col-lg-5">
        <div class="card border-0 shadow-sm p-3">
          <h5 class="mb-3">📅 Belegungskalender</h5>
          <iframe
            src="https://calendar.google.com/calendar/embed?src=c3BvcnRzY2h1ZXR6ZW4ubXVoZW5AZ21haWwuY29t&ctz=Europe%2FZurich&mode=MONTH&showTitle=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0&wkst=2&bgcolor=%23ffffff&color=%23009688"
            style="border:none;border-radius:8px;width:100%;height:380px;"
            frameborder="0" scrolling="no">
          </iframe>
        </div>
      </div>

      <!-- TABELLE -->
      <div class="col-12 col-lg-7">
        <div class="card border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">📋 Alle Reservationen</h5>
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm" style="width:160px" onchange="filterVermietung(this.value)">
                <option value="alle">Alle</option>
                <option value="offen">Offen</option>
                <option value="gemahnt">Gemahnt</option>
                <option value="bezahlt">Bezahlt</option>
                <option value="storniert">Storniert</option>
              </select>
              <button class="btn btn-sm btn-outline-secondary" onclick="loadVermietungData()">🔄</button>
            </div>
          </div>
          <div style="overflow-x:auto;max-height:350px;overflow-y:auto;">
            <table class="table table-sm table-hover mb-0" id="vermietung-table">
              <!-- KORREKT – im thead der Tabelle: -->
<thead style="position:sticky;top:0;background:white;z-index:1;">
  <tr>
    <th style="cursor:pointer" onclick="sortVermietung()">Datum ↕</th>
    <th>Name</th>
    <th>Vertrag</th>
    <th>Status</th>
    <th></th>
  </tr>
</thead>

              <tbody id="vermietung-tbody">
                ${renderVermietungRows(daten)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div class="modal fade" id="vermietungModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
          <div class="modal-header" style="background:#0f3a5d;color:white;">
            <h5 class="modal-title">📄 Reservation Details</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="vermietung-modal-body"></div>
          <div class="modal-footer" id="vermietung-modal-footer"></div>
        </div>
      </div>
    </div>
  `;
}

function renderVermietungRows(daten) {
  return daten.map(d => {
    const statusColor = getStatusColor(d.status);
    const statusLabel = getStatusLabel(d.status);
    return `
      <tr style="cursor:pointer" onclick="openVermietungModal(${d.row})">
        <td>${d.mietdatum}</td>
        <td>${d.vorname} ${d.nachname}</td>
        <td><small class="text-muted">${d.vertragsnr}</small></td>
        <td><span class="badge" style="background:${statusColor};font-size:0.7rem;">${statusLabel}</span></td>
        <td><button class="btn btn-xs btn-outline-secondary btn-sm py-0 px-1" onclick="event.stopPropagation();openVermietungModal(${d.row})">›</button></td>
      </tr>`;
  }).join('');
}

function filterVermietung(filter) {
  let gefiltert = vermietungDaten;
  if (filter === 'offen')     gefiltert = vermietungDaten.filter(d => d.status.includes("01"));
  if (filter === 'gemahnt')   gefiltert = vermietungDaten.filter(d => d.status.includes("02"));
  if (filter === 'bezahlt')   gefiltert = vermietungDaten.filter(d => d.status.includes("03") || d.status.includes("04"));
  if (filter === 'storniert') gefiltert = vermietungDaten.filter(d => d.status.includes("05"));
  document.getElementById('vermietung-tbody').innerHTML = renderVermietungRows(gefiltert);
}

function openVermietungModal(row) {
  const d = vermietungDaten.find(x => x.row === row);
  if (!d) return;

  const statusColor = getStatusColor(d.status);
  const istStorniert = d.status.includes("05");
  const istBezahlt   = d.status.includes("03") || d.status.includes("04");

  document.getElementById('vermietung-modal-body').innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <table class="table table-sm table-borderless">
          <tr><td class="text-muted fw-bold">Vertragsnummer</td><td>${d.vertragsnr}</td></tr>
          <tr><td class="text-muted fw-bold">Name</td><td>${d.vorname} ${d.nachname}</td></tr>
          <tr><td class="text-muted fw-bold">E-Mail</td><td>${d.email}</td></tr>
          <tr><td class="text-muted fw-bold">Telefon</td><td>${d.telefon}</td></tr>
          <tr><td class="text-muted fw-bold">Mietdatum</td><td>${d.mietdatum}</td></tr>
          <tr><td class="text-muted fw-bold">Festbeginn</td><td>${d.festbeginn}</td></tr>
          <tr><td class="text-muted fw-bold">Mietbetrag</td><td>${d.mietbetrag}</td></tr>
        </table>
      </div>
      <div class="col-md-6">
        <div class="p-3 rounded mb-3" style="background:${statusColor}22;border-left:4px solid ${statusColor}">
          <strong>Status:</strong> ${d.status}
        </div>
        <table class="table table-sm table-borderless">
          <tr><td class="text-muted">Vertrag versandt</td><td>${d.datum_vertrag || '–'}</td></tr>
          <tr><td class="text-muted">Mahnung</td><td>${d.datum_mahnung || '–'}</td></tr>
          <tr><td class="text-muted">Schlüsselübergabe</td><td>${d.datum_schluessel || '–'}</td></tr>
          <tr><td class="text-muted">Storniert</td><td>${d.datum_storno || '–'}</td></tr>
          <tr><td class="text-muted">Clubdesk</td><td>${d.transfer || '–'}</td></tr>
        </table>
        ${d.kommentar ? `<div class="alert alert-info p-2 small">💬 ${d.kommentar}</div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('vermietung-modal-footer').innerHTML = `
    <button class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Schliessen</button>
    ${!istStorniert && !istBezahlt ? `
      <button class="btn btn-sm btn-warning" onclick="vermietungAktion('mahnung', ${row})">
        ❗ Mahnung senden
      </button>` : ''}
    ${!istStorniert && !istBezahlt ? `
      <button class="btn btn-sm btn-success" onclick="vermietungAktion('bestaetigen', ${row})">
        ✅ Zahlung bestätigen
      </button>` : ''}
    <button class="btn btn-sm btn-primary" onclick="vermietungAktion('whatsapp', ${row})">
      📱 WhatsApp
    </button>
    ${!istStorniert ? `
      <button class="btn btn-sm btn-danger" onclick="vermietungAktion('stornieren', ${row})">
        ❌ Stornieren
      </button>` : ''}
  `;

  new bootstrap.Modal(document.getElementById('vermietungModal')).show();
}


let sortAsc = true;
let aktuellerFilter = 'alle'; // ← NEU

function filterVermietung(filter) {
  aktuellerFilter = filter; // ← NEU
  let gefiltert = vermietungDaten;
  if (filter === 'offen')     gefiltert = vermietungDaten.filter(d => d.status.includes("01"));
  if (filter === 'gemahnt')   gefiltert = vermietungDaten.filter(d => d.status.includes("02"));
  if (filter === 'bezahlt')   gefiltert = vermietungDaten.filter(d => d.status.includes("03") || d.status.includes("04"));
  if (filter === 'storniert') gefiltert = vermietungDaten.filter(d => d.status.includes("05"));
  document.getElementById('vermietung-tbody').innerHTML = renderVermietungRows(gefiltert);
}

function sortVermietung() {
  sortAsc = !sortAsc;
  // Erst filtern, dann sortieren
  let basis = vermietungDaten;
  if (aktuellerFilter !== 'alle') {
    filterVermietung(aktuellerFilter); // bereits gefiltert rendern
  }
  const toDate = s => {
    const p = (s || "").split(".");
    return p.length === 3 ? new Date(p[2], p[1]-1, p[0]) : new Date(0);
  };
  const sorted = [...document.querySelectorAll('#vermietung-tbody tr')]
    // Einfacher: direkt auf vermietungDaten arbeiten
  
  // Saubere Lösung:
  let gefiltert = vermietungDaten;
  if (aktuellerFilter === 'offen')     gefiltert = vermietungDaten.filter(d => d.status.includes("01"));
  if (aktuellerFilter === 'gemahnt')   gefiltert = vermietungDaten.filter(d => d.status.includes("02"));
  if (aktuellerFilter === 'bezahlt')   gefiltert = vermietungDaten.filter(d => d.status.includes("03") || d.status.includes("04"));
  if (aktuellerFilter === 'storniert') gefiltert = vermietungDaten.filter(d => d.status.includes("05"));

  const sorted = [...gefiltert].sort((a, b) => sortAsc
    ? toDate(a.mietdatum) - toDate(b.mietdatum)
    : toDate(b.mietdatum) - toDate(a.mietdatum));

  document.getElementById('vermietung-tbody').innerHTML = renderVermietungRows(sorted);
}


async function vermietungAktion(action, row) {
  const labels = {
    mahnung:     "Mahnung senden?",
    bestaetigen: "Zahlung bestätigen?",
    stornieren:  "⚠️ Wirklich stornieren?",
    whatsapp:    "WhatsApp senden?"
  };
  if (!confirm(labels[action] || "Ausführen?")) return;

  try {
    const res  = await apiFetch('vermietung', `action=${action}&row=${row}`);
    const data = await res.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('vermietungModal'))?.hide();
      await loadVermietungData();
      showToast("✅ " + data.message);
    } else {
      alert("Fehler: " + data.error);
    }
  } catch(e) {
    alert("Verbindungsfehler: " + e.message);
  }
}

async function triggerClubdeskExport() {
  if (!confirm("Clubdesk Export jetzt senden?")) return;
  const res  = await apiFetch('vermietung', 'action=clubdesk');
  const data = await res.json();
  showToast(data.success ? "✅ Export gesendet" : "❌ Fehler: " + data.error);
}

// Hilfsfunktionen
function getStatusColor(status) {
  if (status.includes("01")) return "#ffc107";
  if (status.includes("02")) return "#fd7e14";
  if (status.includes("03")) return "#28a745";
  if (status.includes("04")) return "#0f3a5d";
  if (status.includes("05")) return "#dc3545";
  return "#6c757d";
}

function getStatusLabel(status) {
  if (status.includes("01")) return "Offen";
  if (status.includes("02")) return "Gemahnt";
  if (status.includes("03")) return "Bezahlt";
  if (status.includes("04")) return "Schlüssel versandt";
  if (status.includes("05")) return "Storniert";
  return status;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:20px;right:20px;z-index:9999;
    background:#0f3a5d;color:white;padding:12px 20px;
    border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);
    font-size:14px;animation:fadeIn 0.3s;`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
