// js/mitglieder.js
async function loadMitgliederData() {
  const container = document.getElementById('mitglieder-container');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2 text-muted">Lade Mitglieder...</p>
    </div>`;

  try {
    const res  = await apiFetch('mitglieder', 'action=getAll');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    renderMitgliederView(data.data);
  } catch(e) {
    container.innerHTML = `<div class="alert alert-danger">Fehler: ${e.message}</div>`;
  }
}

function renderMitgliederView(daten) {
  // Nur Lese-Ansicht (keine Edit/Delete-Buttons)
  const rows = daten.map(m => `
    <tr>
      <td>${m.nachname || ''} ${m.vorname || ''}</td>
      <td>${m.email || '–'}</td>
      <td>${m.telefon || '–'}</td>
      <td><span class="badge bg-${m.status === 'Aktiv' ? 'success' : 'secondary'}">
        ${m.status || '–'}
      </span></td>
    </tr>`).join('');

  document.getElementById('mitglieder-container').innerHTML = `
    <div class="card border-0 shadow-sm p-3">
      <div class="table-responsive">
        <table class="table table-hover table-sm">
          <thead class="table-dark">
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}
