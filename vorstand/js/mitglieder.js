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
