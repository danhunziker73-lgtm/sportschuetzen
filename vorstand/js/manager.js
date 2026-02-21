<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Turnierleiter Pro</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

<style>
:root { --sidebar-width: 320px; }

body { background: #f8f9fa; }

.sidebar-desktop {
  position: sticky;
  top: 1rem;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  right: -100%;
  width: var(--sidebar-width);
  height: 100%;
  background: white;
  z-index: 1050;
  transition: right 0.3s ease;
  box-shadow: -5px 0 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}

.mobile-sidebar.open { right: 0; }

.mobile-sidebar-header {
  padding: 1rem;
  background: #0d6efd;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-sidebar-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1040;
  display: none;
}

.mobile-overlay.show { display: block; }

.player { cursor: grab; }

.dropzone.drag-over { background: #e7f3ff !important; }

.team-card { min-height: 180px; }

@media (max-width: 768px) {
  .sidebar-desktop { display: none; }
}

@media (min-width: 769px) {
  .mobile-toggle-btn { display: none; }
}
</style>
</head>
<body>

<div class="container-fluid mt-3">
  <div class="row" id="manager-inner"></div>
</div>

<div class="mobile-overlay" id="mobileOverlay"></div>

<div class="mobile-sidebar" id="mobileSidebar">
  <div class="mobile-sidebar-header">
    <strong>Pool & Mail</strong>
    <button class="btn btn-sm btn-light" id="closeSidebarBtn">✕</button>
  </div>
  <div class="mobile-sidebar-body" id="mobileSidebarContent"></div>
</div>

<script>
document.addEventListener("DOMContentLoaded", function() {

let appState = {
  teams: [
    { id: 1, name: "Team A", members: [] },
    { id: 2, name: "Team B", members: [] }
  ],
  pool: [
    { id: 1, name: "Max" },
    { id: 2, name: "Anna" },
    { id: 3, name: "Lukas" }
  ],
  mailList: []
};

function renderContestUI() {

  const container = document.getElementById("manager-inner");
  if (!container) return;

  const teamsHtml = appState.teams.map(team => `
    <div class="col-12 col-md-6">
      <div class="card shadow-sm team-card">
        <div class="card-header bg-primary text-white">${team.name}</div>
        <div class="card-body dropzone"
             data-target-type="team"
             data-team-id="${team.id}">
          ${team.members.map(renderPlayer).join("")}
        </div>
      </div>
    </div>
  `).join("");

  const sidebarContent = `
    ${renderMailCard()}
    <div class="mt-3">${renderPoolCard()}</div>
  `;

  container.innerHTML = `
    <div class="col-md-4 sidebar-desktop">
      ${sidebarContent}
    </div>
    <div class="col-12 col-md-8">
      <div class="d-flex justify-content-end mb-2 mobile-toggle-btn">
        <button class="btn btn-outline-primary btn-sm" id="openSidebarBtn">
          ☰ Pool & Mail
        </button>
      </div>
      <div class="row g-3">${teamsHtml}</div>
    </div>
  `;

  const mobileContent = document.getElementById("mobileSidebarContent");
  if (mobileContent) mobileContent.innerHTML = sidebarContent;

  initDragAndDrop();
  attachSidebarButtons();
}

function renderPoolCard() {
  return `
    <div class="card shadow-sm">
      <div class="card-header bg-secondary text-white">
        Pool (${appState.pool.length})
      </div>
      <div class="card-body dropzone" data-target-type="pool">
        ${appState.pool.map(renderPlayer).join("")}
      </div>
    </div>
  `;
}

function renderMailCard() {
  return `
    <div class="card shadow-sm">
      <div class="card-header bg-warning">
        Mail (${appState.mailList.length})
      </div>
      <div class="card-body dropzone" data-target-type="mail">
        ${appState.mailList.map(renderPlayer).join("")}
      </div>
    </div>
  `;
}

function renderPlayer(player) {
  return `
    <div class="card p-2 mb-2 player"
         draggable="true"
         data-id="${player.id}">
      ${player.name}
    </div>
  `;
}

function movePlayer(id, zone) {

  let player;

  appState.pool = appState.pool.filter(p => {
    if (p.id === id) { player = p; return false; }
    return true;
  });

  appState.mailList = appState.mailList.filter(p => {
    if (p.id === id) { player = p; return false; }
    return true;
  });

  appState.teams.forEach(team => {
    team.members = team.members.filter(p => {
      if (p.id === id) { player = p; return false; }
      return true;
    });
  });

  if (!player) return;

  const type = zone.dataset.targetType;

  if (type === "pool") appState.pool.push(player);
  if (type === "mail") appState.mailList.push(player);
  if (type === "team") {
    const team = appState.teams.find(t => t.id == zone.dataset.teamId);
    if (team) team.members.push(player);
  }

  renderContestUI();
}

function initDragAndDrop() {

  document.querySelectorAll(".player").forEach(el => {

    el.addEventListener("dragstart", e => {
      e.dataTransfer.setData("id", el.dataset.id);
    });

  });

  document.querySelectorAll(".dropzone").forEach(zone => {

    zone.addEventListener("dragover", e => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      const id = e.dataTransfer.getData("id");
      movePlayer(parseInt(id), zone);
    });

  });
}

function attachSidebarButtons() {

  const openBtn = document.getElementById("openSidebarBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");
  const overlay = document.getElementById("mobileOverlay");
  const sidebar = document.getElementById("mobileSidebar");

  if (openBtn) {
    openBtn.onclick = () => {
      sidebar.classList.add("open");
      overlay.classList.add("show");
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };
  }

  if (overlay) {
    overlay.onclick = () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };
  }
}

renderContestUI();

});
</script>

</body>
</html>
