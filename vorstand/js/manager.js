<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Turnierleiter Pro</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<style>

body.drag-mode .mobile-tab {
    animation: pulseDrag 1s infinite;
}

@keyframes pulseDrag {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.player {
    cursor: grab;
}

.dropzone.drag-over {
    background-color: #e9f5ff !important;
}

.team-card {
    min-height: 150px;
}

@media (max-width: 767px) {
    .mobile-tabs .btn {
        font-size: 0.8rem;
    }
}

</style>
</head>
<body class="bg-light">

<div class="container-fluid mt-3">
    <div class="row" id="manager-inner"></div>
</div>

<script>

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
    mailList: [],
    mobileView: "teams",
    _dragHoverTimer: null
};

function renderContestUI() {

    const container = document.getElementById('manager-inner');

    const teamsHtml = appState.teams.map(team => `
        <div class="col-12 col-md-6">
            <div class="card team-card shadow-sm">
                <div class="card-header bg-primary text-white">
                    ${team.name}
                </div>
                <div class="card-body dropzone"
                     data-target-type="team"
                     data-team-id="${team.id}">
                     ${team.members.map(m => renderPlayer(m)).join('')}
                </div>
            </div>
        </div>
    `).join('');

    const poolCard = `
        <div class="card shadow-sm">
            <div class="card-header bg-secondary text-white">Pool</div>
            <div class="card-body dropzone" data-target-type="pool">
                ${appState.pool.map(p => renderPlayer(p)).join('')}
            </div>
        </div>
    `;

    const mailCard = `
        <div class="card shadow-sm">
            <div class="card-header bg-warning">Mail</div>
            <div class="card-body dropzone" data-target-type="mail">
                ${appState.mailList.map(p => renderPlayer(p)).join('')}
            </div>
        </div>
    `;

    container.innerHTML = `

        <div class="col-md-4 d-none d-md-block">
            ${mailCard}
            <div class="mt-3">${poolCard}</div>
        </div>

        <div class="col-12 col-md-8">

            <div class="d-md-none mb-3">
                <div class="btn-group w-100 mobile-tabs">
                    ${renderMobileTab("teams", "Teams")}
                    ${renderMobileTab("mail", "Mail")}
                    ${renderMobileTab("pool", "Pool")}
                </div>
            </div>

            ${appState.mobileView === "teams" ? `<div class="row g-3">${teamsHtml}</div>` : ""}
            ${appState.mobileView === "mail" ? mailCard : ""}
            ${appState.mobileView === "pool" ? poolCard : ""}

        </div>
    `;

    initDragAndDrop();
}

function renderMobileTab(key, label) {
    const active = appState.mobileView === key;
    return `
        <button class="btn btn-sm mobile-tab ${active ? 'btn-primary' : 'btn-outline-primary'}"
                data-view="${key}"
                onclick="switchMobileView('${key}')">
            ${label}
        </button>
    `;
}

function switchMobileView(view) {
    appState.mobileView = view;
    renderContestUI();
}

function renderPlayer(player) {
    return `
        <div class="card mb-2 player p-2"
             draggable="true"
             data-id="${player.id}">
            ${player.name}
        </div>
    `;
}

function initDragAndDrop() {

    document.querySelectorAll('.player').forEach(el => {

        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData("id", el.dataset.id);
            document.body.classList.add("drag-mode");
        });

        el.addEventListener('dragend', () => {
            document.body.classList.remove("drag-mode");
        });

        // Touch Support
        el.addEventListener('touchstart', e => {
            el.classList.add("dragging");
        });

        el.addEventListener('touchend', e => {
            el.classList.remove("dragging");
        });

    });

    document.querySelectorAll('.dropzone').forEach(zone => {

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const id = e.dataTransfer.getData("id");
            movePlayer(parseInt(id), zone);
            document.body.classList.remove("drag-mode");
        });

    });

    // AUTO SWITCH MOBILE
    document.addEventListener('dragover', (e) => {
        const tab = e.target.closest('.mobile-tab');
        if (!tab || appState._dragHoverTimer) return;

        appState._dragHoverTimer = setTimeout(() => {
            const view = tab.dataset.view;
            if (view && appState.mobileView !== view) {
                switchMobileView(view);
            }
            appState._dragHoverTimer = null;
        }, 600);
    });

    document.addEventListener('dragleave', (e) => {
        const tab = e.target.closest('.mobile-tab');
        if (tab && appState._dragHoverTimer) {
            clearTimeout(appState._dragHoverTimer);
            appState._dragHoverTimer = null;
        }
    });

}

function movePlayer(id, zone) {

    let player;

    appState.pool = appState.pool.filter(p => {
        if (p.id === id) { player = p; return false; }
        return true;
    });

    appState.teams.forEach(team => {
        team.members = team.members.filter(p => {
            if (p.id === id) { player = p; return false; }
            return true;
        });
    });

    appState.mailList = appState.mailList.filter(p => {
        if (p.id === id) { player = p; return false; }
        return true;
    });

    if (!player) return;

    const targetType = zone.dataset.targetType;

    if (targetType === "pool") {
        appState.pool.push(player);
    }

    if (targetType === "mail") {
        appState.mailList.push(player);
    }

    if (targetType === "team") {
        const teamId = parseInt(zone.dataset.teamId);
        const team = appState.teams.find(t => t.id === teamId);
        if (team) team.members.push(player);
    }

    renderContestUI();
}

renderContestUI();

</script>

</body>
</html>
