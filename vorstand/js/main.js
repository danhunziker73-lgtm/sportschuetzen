window.onload = () => {
    const savedUser = localStorage.getItem('portal_user');
    const savedRole = localStorage.getItem('portal_role');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        userRole = savedRole;
        showApp();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
    }
};

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').classList.remove('d-none');
    document.getElementById('app-screen').style.display = 'flex'; 
    
    document.getElementById('user-info').innerText = `${currentUser} (${userRole})`;
    document.getElementById('user-badge-mobile').innerText = userRole;

    // RBAC (Sidebar + Dashboard-Kacheln) – robust
    const role = String(userRole || 'gast').trim().toLowerCase();

    document.querySelectorAll('.role-protected').forEach(el => {
        const allowed = String(el.dataset.roles || '')
            .split(',')
            .map(r => r.trim().toLowerCase())
            .filter(Boolean);

        const permitted = (role === 'admin') || allowed.includes(role);
        el.classList.toggle('d-none', !permitted);
    });
}

function navTo(viewId, el) {
    // 1. Nav-Links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    // 2. Teardowns (VOR dem View-Wechsel)
    if (viewId !== 'manager'  && typeof teardownManager  === 'function') teardownManager();
    if (viewId !== 'inventar' && typeof teardownInventar === 'function') teardownInventar();

    // 3. View wechseln
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById('view-' + viewId);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error("View nicht gefunden: view-" + viewId);
    }

    closeSidebarMobile();

    // 4. Module laden
    if (viewId === 'inventar'  && typeof loadInventarData  === 'function') loadInventarData();
    if (viewId === 'termine'   && typeof loadTermineData   === 'function') loadTermineData();
    if (viewId === 'resultate' && typeof loadResultateData === 'function') loadResultateData();
    if (viewId === 'manager'   && typeof loadContestData   === 'function') loadContestData();
}


function sendTransaktionsMail(mitgliedObj, aktion, items, bemerkungen,
                               transId, sigMitgliedUrl, sigVorstandUrl) {
    const VORSTAND  = 'sportschuetzen-muhen@gmail.com';
    const isAusgabe = aktion === 'AUSGABE' || aktion === 'CHECKOUT';
    const typText   = isAusgabe ? 'Ausgabe' : 'Rückgabe';
    const name      = mitgliedObj
        ? mitgliedObj.Nachname + ' ' + mitgliedObj.Vorname : '?';
    const email     = mitgliedObj ? (mitgliedObj.email || mitgliedObj.Email || null) : null;
    const datum     = Utilities.formatDate(
        new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm"
    );

    // Items als Text-Tabelle (robuster als HTML-Tabelle bei Mailclients)
    var itemRows = '';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var pfand = parseFloat(item.pfandBetrag) > 0
            ? 'CHF ' + parseFloat(item.pfandBetrag).toFixed(2) : '-';
        var zustand = isAusgabe
            ? (item.zustandAbgabe || '-') : (item.zustandRueckgabe || '-');
        itemRows += '<tr style="background:' + (i%2===0?'#f8f9fa':'#fff') + '">'
            + '<td style="padding:6px 10px">' + (i+1) + '</td>'
            + '<td style="padding:6px 10px">' + (item.kategorie||'').toUpperCase() + '</td>'
            + '<td style="padding:6px 10px">' + (item.itemId||'-') + '</td>'
            + '<td style="padding:6px 10px">' + zustand + '</td>'
            + '<td style="padding:6px 10px">' + pfand + '</td>'
            + '</tr>';
    }

    var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px">'
        + '<h2 style="background:#1a1a2e;color:#fff;padding:15px 20px;border-radius:8px">'
        + '&#128203; Inventar-' + typText + ' &#8211; Sportsch&uuml;tzen Muhen</h2>'
        + '<table style="width:100%;border-collapse:collapse;margin:15px 0">'
        + '<tr><td style="padding:5px 0;color:#666;width:140px">Datum:</td>'
        + '<td><b>' + datum + '</b></td></tr>'
        + '<tr><td style="padding:5px 0;color:#666">Transaktion-Nr.:</td>'
        + '<td><b>T-' + transId + '</b></td></tr>'
        + '<tr><td style="padding:5px 0;color:#666">Mitglied:</td>'
        + '<td><b>' + name + '</b></td></tr>'
        + '<tr><td style="padding:5px 0;color:#666">Aktion:</td>'
        + '<td><b style="color:' + (isAusgabe?'#0d6efd':'#198754') + '">' + typText + '</b></td></tr>'
        + (bemerkungen ? '<tr><td style="padding:5px 0;color:#666">Bemerkungen:</td>'
            + '<td>' + bemerkungen + '</td></tr>' : '')
        + '</table>'
        + '<h3>Positionen (' + items.length + ')</h3>'
        + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
        + '<thead><tr style="background:#1a1a2e;color:#fff">'
        + '<th style="padding:8px 10px">Pos.</th>'
        + '<th style="padding:8px 10px">Kategorie</th>'
        + '<th style="padding:8px 10px">ID</th>'
        + '<th style="padding:8px 10px">Zustand</th>'
        + '<th style="padding:8px 10px">Pfand</th>'
        + '</tr></thead><tbody>' + itemRows + '</tbody></table>'
        + '<p style="margin-top:20px"><b>Signaturen:</b><br>'
        + (sigMitgliedUrl ? '<a href="' + sigMitgliedUrl + '">Signatur Mitglied</a>' : '&ndash;')
        + ' &nbsp;|&nbsp; '
        + (sigVorstandUrl ? '<a href="' + sigVorstandUrl + '">Signatur Vorstand</a>' : '&ndash;')
        + '</p>'
        + '<p style="margin-top:20px;color:#999;font-size:12px">'
        + 'Automatisch generiert &ndash; Sportsch&uuml;tzen Muhen</p>'
        + '</div>';

    var subject = '[Inventar] ' + typText + ': ' + name
        + ' | ' + items.length + ' Pos. | T-' + transId;

    MailApp.sendEmail({ to: VORSTAND, subject: subject, htmlBody: htmlBody });

    if (email && email.toString().indexOf('@') > -1) {
        MailApp.sendEmail({ to: email.toString(), subject: subject, htmlBody: htmlBody });
    }
}



function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('show');
}
