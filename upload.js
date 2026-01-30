// upload.js
const WORKER_UPLOAD_URL = "https://github-dropdown-refresh.dan-hunziker73.workers.dev/";
let teilnehmer = [];

async function loadTeilnehmer() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/danhunziker73-lgtm/sportschuetzen/main/teilnehmer.json?t=" + Date.now());
        teilnehmer = await res.json();
        const select = document.getElementById("name");
        teilnehmer.forEach(p => {
            const opt = document.createElement("option");
            opt.value = String(p.lizenz || p.id);
            opt.textContent = p.name;
            select.appendChild(opt);
        });
    } catch(e) { console.error("Fehler Teilnehmer", e); }
}

// Foto Vorschau Handler
document.getElementById("foto").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const img = document.getElementById("preview");
        img.src = ev.target.result;
        img.style.display = "block";
        document.getElementById("upload-hint").style.display = "none";
    };
    reader.readAsDataURL(file);
});

// Upload Form Handler
document.getElementById("uploadForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true; 
    btn.textContent = "Wird gesendet...";
    
    const selectedId = document.getElementById("name").value;
    const user = teilnehmer.find(t => String(t.lizenz || t.id) === selectedId);
    const file = document.getElementById("foto").files[0];
    
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const res = await fetch(WORKER_UPLOAD_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "upload_standblatt",
                    lizenz: selectedId,
                    vorname: user ? user.vorname : "",
                    nachname: user ? user.nachname : "",
                    erzielt: document.getElementById("erzielt").value,
                    maximal: document.getElementById("maximal").value,
                    foto: reader.result
                })
            });
            if (res.ok) { alert("✔ Gesendet!"); location.reload(); } 
            else { alert("Fehler beim Senden."); }
        } catch (err) { alert("Netzwerkfehler."); }
        finally { btn.disabled = false; btn.textContent = "Jetzt senden"; }
    };
    reader.readAsDataURL(file);
};
