const WORKER_UPLOAD_URL = "https://github-dropdown-refresh.dan-hunziker73.workers.dev/";
let teilnehmer = [];

async function loadTeilnehmer() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/danhunziker73-lgtm/sportschuetzen/main/teilnehmer.json?t=" + Date.now());
        teilnehmer = await res.json();
        teilnehmer.sort((a, b) => (a.nachname + a.vorname).localeCompare(b.nachname + b.vorname));
        const select = document.getElementById("name");
        teilnehmer.forEach(p => {
            const opt = document.createElement("option");
            opt.value = String(p.lizenz || p.id);
            opt.textContent = `${p.nachname} ${p.vorname}`;
            select.appendChild(opt);
        });
    } catch(e) { console.error(e); }
}

document.getElementById("foto").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById("preview").src = ev.target.result;
        document.getElementById("preview").style.display = "block";
        document.getElementById("upload-hint").style.display = "none";
    };
    reader.readAsDataURL(file);
});

document.getElementById("uploadForm").onsubmit = async (e) => {
    e.preventDefault();
    const erzielt = parseInt(document.getElementById("erzielt").value);
    const maximal = parseInt(document.getElementById("maximal").value);
    if (erzielt > maximal) return alert("Erzielt kann nicht höher als Maximum sein!");

    const btn = document.getElementById("submitBtn");
    btn.disabled = true; btn.textContent = "Wird gesendet...";

    const user = teilnehmer.find(t => String(t.lizenz || t.id) === document.getElementById("name").value);
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const res = await fetch(WORKER_UPLOAD_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "upload_standblatt",
                    lizenz: user.lizenz || user.id,
                    vorname: user.vorname, nachname: user.nachname,
                    erzielt, maximal, foto: reader.result
                })
            });
            if (res.ok) { alert("✔ Gesendet!"); location.reload(); }
            else alert("Fehler beim Senden.");
        } catch (err)
