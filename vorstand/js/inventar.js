// ── E-Mail nach Transaktion ──
function sendTransaktionsMail(mitgliedObj, aktion, items, bemerkungen,
                               transId, sigMitgliedUrl, sigVorstandUrl) {
    const VORSTAND = 'sportschuetzen-muhen@gmail.com';
    const isAusgabe = aktion === 'AUSGABE' || aktion === 'CHECKOUT';
    const typText   = isAusgabe ? 'Ausgabe' : 'Rückgabe';
    const name      = mitgliedObj ? `${mitgliedObj.Nachname} ${mitgliedObj.Vorname}` : '?';
    const email     = mitgliedObj?.email || null;
    const datum     = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

    const itemRows = items.map((item, i) => `
        <tr style="background:${i%2===0?'#f8f9fa':'#fff'}">
            <td style="padding:6px 10px">${i+1}</td>
            <td style="padding:6px 10px">${(item.kategorie||'').toUpperCase()}</td>
            <td style="padding:6px 10px">${item.itemId}</td>
            <td style="padding:6px 10px">${isAusgabe?(item.zustandAbgabe||'-'):(item.zustandRueckgabe||'-')}</td>
            <td style="padding:6px 10px">${parseFloat(item.pfandBetrag)>0?`CHF ${parseFloat(item.pfandBetrag).toFixed(2)}`:'-'}</td>
        </tr>`).join('');

    const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px">
            <h2 style="background:#1a1a2e;color:#fff;padding:15px 20px;border-radius:8px">
                📋 Inventar-${typText} – Sportschützen Muhen
            </h2>
            <table style="width:100%;border-collapse:collapse;margin:15px 0">
                <tr><td style="padding:5px 0;color:#666;width:140px">Datum:</td><td><b>${datum}</b></td></tr>
                <tr><td style="padding:5px 0;color:#666">Transaktion-Nr.:</td><td><b>T-${transId}</b></td></tr>
                <tr><td style="padding:5px 0;color:#666">Mitglied:</td><td><b>${name}</b></td></tr>
                <tr><td style="padding:5px 0;color:#666">Aktion:</td>
                    <td><b style="color:${isAusgabe?'#0d6efd':'#198754'}">${typText}</b></td></tr>
                ${bemerkungen?`<tr><td style="padding:5px 0;color:#666">Bemerkungen:</td><td>${bemerkungen}</td></tr>`:''}
            </table>
            <h3>Positionen (${items.length})</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead><tr style="background:#1a1a2e;color:#fff">
                    <th style="padding:8px 10px">Pos.</th>
                    <th style="padding:8px 10px">Kategorie</th>
                    <th style="padding:8px 10px">ID</th>
                    <th style="padding:8px 10px">Zustand</th>
                    <th style="padding:8px 10px">Pfand</th>
                </tr></thead>
                <tbody>${itemRows}</tbody>
            </table>
            <p style="margin-top:20px">
                <b>Signaturen:</b><br>
                ${sigMitgliedUrl?`<a href="${sigMitgliedUrl}">Signatur Mitglied</a>`:'–'}
                &nbsp;|&nbsp;
                ${sigVorstandUrl?`<a href="${sigVorstandUrl}">Signatur Vorstand</a>`:'–'}
            </p>
            <p style="margin-top:20px;color:#999;font-size:12px">
                Automatisch generiert vom Inventar-System – Sportschützen Muhen
            </p>
        </div>`;

    const subject = `[Inventar] ${typText}: ${name} | ${items.length} Pos. | T-${transId}`;

    MailApp.sendEmail({ to: VORSTAND, subject, htmlBody });
    if (email && email.includes('@'))
        MailApp.sendEmail({ to: email, subject, htmlBody });
}


// ── Aufruf am Ende von handleTransaction() – vor dem return einfügen: ──
/*
    try {
        sendTransaktionsMail(mitgliedObj, aktion, items, data.Bemerkungen||"",
                             transIds[0], sigMitgliedUrl, sigVorstandUrl);
    } catch(mailErr) {
        Logger.log("Mail-Fehler: " + mailErr.message);
    }
*/
