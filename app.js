const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = []; // Globaler Speicher für Filter
let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

// --- NAVIGATION (Damit JM, G&G etc. wieder funktionieren) ---
function nav(id, title, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(id);
    if (targetPage) targetPage.classList.add('active-page');
    
    document.getElementById('main-title').textContent = title;
    
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    window.scrollTo(0,0);
}

// --- PULL TO REFRESH LOGIK ---
document.addEventListener('touchstart', e => { touchStart = e.touches[0].pageY; }, {passive: true});
document.addEventListener('touchmove', e => {
    const distance = e.touches[0].pageY - touchStart;
    if (window.scrollY <= 0 && distance > 0) {
        spinner.style.top = `${Math.min(distance / 2, 100) - 40}px`;
    }
}, {passive: true});
document.addEventListener('touchend', e => {
    if (window.scrollY <= 0 && (e.changedTouches[0].pageY - touchStart) > 90) location.reload();
    else spinner.style.top = '-50px';
}, {passive: true});

// --- DATEN LADEN ---
async function loadTermine() {
    const wrap = document.getElementById("termine");
    const fetchJson = async (url) => {
        try { const r = await fetch(url); return r.ok ? await r.json() : null; }
        catch(e) { return null; }
    };

    try {
        const [resWorker, resGoogle] = await Promise.all([
            fetchJson(WORKER_TERMINE_URL),
            fetchJson(GOOGLE_SCRIPT_URL)
        ]);

        let combined = [];

        // 1. Worker (Verein) - Mapping deiner Keys
        if (resWorker && resWorker.termine) {
            resWorker.termine.forEach(t => {
                if (t.datum && t.datum.trim() !== "") {
                    const d = new Date(t.datum);
                    if (!isNaN(d)) {
                        combined.push({
                            titel: t.anlasstitel,
                            start: t.startzeit,
                            ort: t.ort || "Muhen",
                            status: t.status,
                            typ: 'verein',
                            d: d
                        });
                    }
                }
            });
        }

        // 2. Google (Haus)
        if (Array.isArray(resGoogle)) {
            resGoogle.forEach(t => {
                const d = new Date(t.datum_iso || t.datum);
                if (!isNaN(d)) {
                    combined.push({
                        titel: t.titel,
                        start: t.start,
                        ort: "Schützenhaus",
                        status: 'fix',
                        typ: 'extern',
                        d: d
                    });
                }
            });
        }

        combined.sort((a, b) => a.d - b.d);
        allTermine = applyRundenPrefix(combined); // Speichern in globaler Variable
        renderTermine(allTermine);

    } catch (e) {
        wrap.innerHTML = "Fehler beim Laden.";
    }
}

// --- FILTER ---
function filterTermine(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (type === 'all') {
        renderTermine(allTermine);
    } else {
        renderTermine(allTermine.filter(t => t.typ === type));
    }
}

// --- RENDERING ---
function renderTermine(items) {
    const wrap = document.getElementById("termine");
    const nowYear = new Date().getFullYear();
    wrap.innerHTML = items.length ? "" : "Keine Termine vorhanden.";

    items.forEach(t => {
        if (t.status === "abgesagt") return;
        if (t.typ === "extern" && t.titel.toLowerCase().includes("reinigung")) return;

        const day = t.d.getDate();
        const month = ["Jan.", "Feb.", "März", "April", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."][t.d.getMonth()];
        const wk = t.d.toLocaleDateString('de-CH', { weekday: 'short' }).substring(0, 2);
        const sub = (t.d.getFullYear() !== nowYear) ? `${wk} '${t.d.getFullYear().toString().slice(-2)}` : wk;

        wrap.innerHTML += `
        <div class="termin-row ${t.typ === 'extern' ? 'extern' : ''}">
            <div class="termin-date">
                <span class="date-main">${day}. ${month}</span>
                <span class="date-sub">${sub}</span>
            </div>
            <div class="termin-content">
                <span class="termin-title">${t.typ === 'extern' ? '🏠 ' : ''}${t.titel}</span>
                <div class="termin-meta">
                    <span>${t.typ === 'extern' ? 'Schützenhaus' : '📍 ' + t.ort}</span>
                    ${t.start ? `<span>🕒 ${t.start}</span>` : ""}
                </div>
                ${t.typ === 'extern' ? '<span class="badge-extern">Haus belegt</span>' : (t.status === 'provisorisch' ? '<span class="badge-prov">Provisorisch</span>' : '')}
            </div>
        </div>`;
    });
}

function applyRundenPrefix(list) {
    const rules = { "Gruppenmeisterschaft SSV": 3, "Gruppenmeisterschaft AGSV": 3, "Grenzland-Cup": 3, "Mannschaftsmeisterschaft": 7 };
    const counts = {};
    return list.map(t => {
        if (t.titel.toLowerCase().startsWith("final")) return t;
        if (rules[t.titel]) {
            counts[t.titel] = (counts[t.titel] || 0) + 1;
            if (counts[t.titel] <= rules[t.titel]) return { ...t, titel: `${counts[t.titel]}. Runde ${t.titel}` };
        }
        return t;
    });
}

window.addEventListener('load', loadTermine);
