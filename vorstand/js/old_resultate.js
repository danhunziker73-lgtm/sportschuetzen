// =========================================================
//  MODULE: RESULTATE (Grenzland Cup) - manuelle Eingabe
//  Sheet: aktuell_Grenzland
//  Spalten A-H:
//   A Name (Nachname Vorname)
//   B R1 Team
//   C R1 Pkt P1
//   D R2 Team (Default = R1 Team)
//   E R2 Pkt P1
//   F R3 Team (Default = R2 Team)
//   G R3 Pkt P1
//   H ID (Mitglieder-ID)
// =========================================================

let resultateState = {
  rows: [],            // [{id,name,r1_team,r1_p1,r2_team,r2_p1,r3_team,r3_p1, _autoR2, _autoR3}]
  members: [],         // [{id, vorname, nachname, email}]
  teams: [],           // ["Muhen 1", ...]
  isDirty: false
};

function loadResultateData() {
  ensureResultateShell();
  renderResultateLoading();

  apiFetch("manager", "action=getResultateData&sheetName=aktuell_Grenzland")
    .then(r => r.text())
    .then(txt => {
      let data;
      try { data = JSON.parse(txt); } catch { throw new Error("Backend-Antwort ist kein JSON"); }
      if (data.error) throw new Error(data.error);

      resultateState.members = (data.members || []).map(m => ({
        id: String(m.id),
        vorname: m.vorname || "",
        nachname: m.nachname || "",
        email: m.email || ""
      }));

      // Rows normalisieren + Team-Vererbung anwenden (nur wenn leer)
      const incoming = (data.rows || []).map(r => normalizeRow(r));
      incoming.forEach(r => applyTeamInheritance(r, true)); // true = initial
      resultateState.rows = incoming;

      // Teams: Primär aus Spalte B, zusätzlich D/F (damit Dropdown vollständig bleibt)
      resultateState.teams = buildTeamsList(data.teams || [], resultateState.rows);

      resultateState.isDirty = false;
      renderResultateUI();
    })
    .catch(e => {
      const c = document.getElementById("resultate-container");
      if (c) c.innerHTML = `<div class="alert alert-danger">Fehler: ${escapeHtml(e.message)}</div>`;
    });
}

function ensureResultateShell() {
  const host = document.getElementById("resultate-container");
  if (!host) return;
  if (document.getElementById("resultate-app")) return;

  host.innerHTML = `
    <div id="resultate-app">
      <div class="d-flex justify-content-between align-items-center mb-3 sticky-top bg-white p-2 shadow-sm rounded" style="z-index: 500;">
        <div>
          <h4 class="m-0">🏁 Resultate – Grenzland</h4>
          <div class="small text-muted">Eingabe in aktuell_Grenzland (Teams vererben sich Runde 1 → 2 → 3)</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" onclick="loadResultateData()">🔄 Laden</button>
          <button id="btn-save-resultate" class="btn btn-success btn-sm fw-bold" onclick="saveResultateData()">💾 Speichern</button>
        </div>
      </div>

      <div class="card shadow-sm border-0">
        <div class="card-body">
          <div id="resultate-table-wrap"></div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <button class="btn btn-outline-primary btn-sm" onclick="addResultateRow()">➕ Schütze hinzufügen</button>
            <div id="resultate-status" class="small text-muted"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderResultateLoading() {
  const wrap = document.getElementById("resultate-table-wrap");
  if (!wrap) return;
  wrap.innerHTML = `<div class="text-center p-4"><div class="spinner-border text-primary"></div><div class="text-muted mt-2">Lade Resultate…</div></div>`;
}

function renderResultateUI() {
  const wrap = document.getElementById("resultate-table-wrap");
  if (!wrap) return;

  const usedIds = new Set(resultateState.rows.map(r => String(r.id)).filter(Boolean));
  const availableMembers = resultateState.members
    .filter(m => !usedIds.has(String(m.id)))
    .sort((a,b) => (a.nachname + " " + a.vorname).localeCompare(b.nachname + " " + b.vorname, "de"));

  const teamOptionsHtml = (resultateState.teams.length ? resultateState.teams : ["Muhen 1","Muhen 2","Pool"])
    .map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
    .join("");

  // Responsive table
  const rowsHtml = resultateState.rows.map((r, idx) => {
    const memberLabel = r.id ? escapeHtml(r.name) : "";
    const pointsClass = (val) => (val === "" || isValidPoints(val)) ? "" : "is-invalid";

    return `
      <tr>
        <td style="min-width: 220px;">
          <div class="small text-muted">ID: ${escapeHtml(r.id || "")}</div>
          <div class="fw-bold text-truncate">${memberLabel}</div>
        </td>

        ${renderTeamPointsCells(idx, "r1", teamOptionsHtml, pointsClass(r.r1_p1))}
        ${renderTeamPointsCells(idx, "r2", teamOptionsHtml, pointsClass(r.r2_p1))}
        ${renderTeamPointsCells(idx, "r3", teamOptionsHtml, pointsClass(r.r3_p1))}
      </tr>
    `;
  }).join("");

  wrap.innerHTML = `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead>
          <tr>
            <th>Schütze</th>
            <th colspan="2">Runde 1</th>
            <th colspan="2">Runde 2</th>
            <th colspan="2">Runde 3</th>
          </tr>
          <tr class="small text-muted">
            <th></th>
            <th style="min-width:160px;">Team</th><th style="min-width:120px;">Pkt P1</th>
            <th style="min-width:160px;">Team</th><th style="min-width:120px;">Pkt P1</th>
            <th style="min-width:160px;">Team</th><th style="min-width:120px;">Pkt P1</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="7" class="text-center text-muted p-4">Keine Einträge</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="mt-2 p-2 border rounded bg-light">
      <div class="fw-bold mb-2">Neuer Schütze (nur aus Mitglieder)</div>
      <div class="d-flex gap-2 flex-wrap align-items-center">
        <select id="new-member-select" class="form-select form-select-sm" style="max-width: 360px;">
          <option value="">— Mitglied wählen —</option>
          ${availableMembers.map(m => {
            const label = `${m.nachname} ${m.vorname}`.trim();
            return `<option value="${escapeHtml(m.id)}">${escapeHtml(label)} (ID ${escapeHtml(m.id)})</option>`;
          }).join("")}
        </select>
        <button class="btn btn-primary btn-sm" onclick="confirmAddSelectedMember()">Hinzufügen</button>
        <div class="small text-muted">${availableMembers.length} verfügbar</div>
      </div>
    </div>
  `;

  updateResultateStatus();
}

function renderTeamPointsCells(rowIndex, roundKey, teamOptionsHtml, pointsInvalidClass) {
  const r = resultateState.rows[rowIndex];
  const teamField = `${roundKey}_team`;
  const p1Field = `${roundKey}_p1`;

  const teamVal = r[teamField] || "";

  return `
    <td>
      <select class="form-select form-select-sm"
              onchange="onTeamChange(${rowIndex}, '${roundKey}', this.value)">
        <option value="">—</option>
        ${teamOptionsHtml.replace(`value="${escapeHtml(teamVal)}"`, `value="${escapeHtml(teamVal)}" selected`)}
      </select>
    </td>
    <td>
      <input class="form-control form-control-sm ${pointsInvalidClass}"
             inputmode="numeric"
             placeholder="0-100"
             value="${escapeHtml(r[p1Field] ?? "")}"
             oninput="onPointsInput(${rowIndex}, '${roundKey}', this.value)">
    </td>
  `;
}

function addResultateRow() {
  // UI nur: Auswahl läuft über Dropdown unten
  const sel = document.getElementById("new-member-select");
  if (sel) sel.focus();
}

function confirmAddSelectedMember() {
  const sel = document.getElementById("new-member-select");
  const memberId = sel ? String(sel.value || "") : "";
  if (!memberId) return alert("Bitte zuerst ein Mitglied wählen.");

  const member = resultateState.members.find(m => String(m.id) === memberId);
  if (!member) return alert("Mitglied nicht gefunden.");

  // Neue Zeile mit Team-Vererbung (leer -> wird später abgeleitet)
  const newRow = normalizeRow({
    id: memberId,
    name: `${member.nachname} ${member.vorname}`.trim(),
    r1_team: "",
    r1_p1: "",
    r2_team: "",
    r2_p1: "",
    r3_team: "",
    r3_p1: ""
  });

  // Wenn es schon Teams gibt, setze R1 auf erstes Team als Vorschlag (optional)
  if (resultateState.teams.length && !newRow.r1_team) {
    newRow.r1_team = resultateState.teams[0];
  }

  applyTeamInheritance(newRow, true);

  resultateState.rows.push(newRow);
  resultateState.isDirty = true;
  renderResultateUI();
}

function onTeamChange(rowIndex, roundKey, value) {
  const r = resultateState.rows[rowIndex];
  const teamField = `${roundKey}_team`;
  r[teamField] = String(value || "");

  // Manual Flags: wenn User R2/R3 selber setzt, nicht mehr automatisch überschreiben
  if (roundKey === "r2") r._autoR2 = false;
  if (roundKey === "r3") r._autoR3 = false;

  // Wenn R1 geändert wird: R2/R3 nur dann mitziehen, wenn sie noch auto sind
  if (roundKey === "r1") {
    if (r._autoR2) r.r2_team = r.r1_team || "";
    if (r._autoR3) r.r3_team = (r.r2_team || r.r1_team || "");
  }

  // Wenn R2 geändert wird: R3 nur dann mitziehen, wenn auto
  if (roundKey === "r2") {
    if (r._autoR3) r.r3_team = r.r2_team || "";
  }

  resultateState.isDirty = true;
  updateResultateStatus();
}

function onPointsInput(rowIndex, roundKey, value) {
  const r = resultateState.rows[rowIndex];
  const p1Field = `${roundKey}_p1`;

  // Nur Ziffern erlauben, aber leer lassen ok
  const cleaned = String(value || "").replace(/[^\d]/g, "");
  r[p1Field] = cleaned;

  resultateState.isDirty = true;
  // live re-render, damit invalid-Klasse greift
  renderResultateUI();
}

function isValidPoints(val) {
  if (val === "") return true;
  if (!/^\d+$/.test(val)) return false;
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n >= 0 && n <= 100;
}

function applyTeamInheritance(row, initial) {
  // Initial: wenn r2 leer -> r1, r3 leer -> r2
  // Wir markieren _autoR2/_autoR3 nur dann true, wenn wir es gesetzt haben (oder wenn Felder leer waren)
  if (initial) {
    row._autoR2 = !row.r2_team; // wenn leer, darf auto sein
    row._autoR3 = !row.r3_team;
  }

  if (!row.r2_team) {
    row.r2_team = row.r1_team || "";
    row._autoR2 = true;
  }
  if (!row.r3_team) {
    row.r3_team = row.r2_team || row.r1_team || "";
    row._autoR3 = true;
  }
}

function normalizeRow(r) {
  return {
    id: r.id != null ? String(r.id) : "",
    name: String(r.name || ""),
    r1_team: String(r.r1_team || ""),
    r1_p1: r.r1_p1 != null ? String(r.r1_p1) : "",
    r2_team: String(r.r2_team || ""),
    r2_p1: r.r2_p1 != null ? String(r.r2_p1) : "",
    r3_team: String(r.r3_team || ""),
    r3_p1: r.r3_p1 != null ? String(r.r3_p1) : "",
    _autoR2: true,
    _autoR3: true
  };
}

function buildTeamsList(teamsFromBackend, rows) {
  const set = new Set();

  (teamsFromBackend || []).forEach(t => {
    const s = String(t || "").trim();
    if (s) set.add(s);
  });

  // zusätzlich aus vorhandenen Daten
  rows.forEach(r => {
    [r.r1_team, r.r2_team, r.r3_team].forEach(t => {
      const s = String(t || "").trim();
      if (s) set.add(s);
    });
  });

  // Pool optional als fallback
  set.add("Pool");

  return Array.from(set).sort((a,b) => a.localeCompare(b, "de", { numeric: true }));
}

async function saveResultateData() {
  // Validieren: alle Punkte 0-100
  for (const r of resultateState.rows) {
    if (!r.id) return alert("Es gibt eine Zeile ohne ID.");
    if (!isValidPoints(r.r1_p1) || !isValidPoints(r.r2_p1) || !isValidPoints(r.r3_p1)) {
      return alert("Bitte Punkte korrigieren: nur ganze Zahlen 0–100 (oder leer).");
    }
  }

  const btn = document.getElementById("btn-save-resultate");
  const original = btn ? btn.innerText : "Speichern";
  if (btn) { btn.disabled = true; btn.innerText = "Speichere..."; }

  // Payload: nur Werte, die ins Sheet gehen sollen
  const payloadRows = resultateState.rows.map(r => ({
    id: r.id,
    // Name wird serverseitig aus Mitglieder gemappt (kein Tippfehler-Risiko)
    r1_team: r.r1_team || "",
    r1_p1: r.r1_p1 || "",
    r2_team: r.r2_team || "",
    r2_p1: r.r2_p1 || "",
    r3_team: r.r3_team || "",
    r3_p1: r.r3_p1 || ""
  }));

  try {
    const res = await apiFetch("manager", "action=saveResultateData", {
      method: "POST",
      body: JSON.stringify({
        sheetName: "aktuell_Grenzland",
        rows: payloadRows
      })
    });

    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch { throw new Error("Speichern: Backend-Antwort ist kein JSON"); }
    if (data.error) throw new Error(data.error);

    resultateState.isDirty = false;
    if (btn) {
      btn.innerText = "✅ OK";
      setTimeout(() => { btn.innerText = original; btn.disabled = false; }, 1200);
    }
    updateResultateStatus();

  } catch (e) {
    alert("Fehler beim Speichern: " + e.message);
    if (btn) { btn.disabled = false; btn.innerText = original; }
  }
}

function updateResultateStatus() {
  const el = document.getElementById("resultate-status");
  if (!el) return;
  el.innerText = resultateState.isDirty ? "Ungespeicherte Änderungen" : "Alles gespeichert";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
