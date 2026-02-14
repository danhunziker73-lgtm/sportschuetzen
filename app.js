const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = [];
let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

// --- PULL TO REFRESH & VISIBILITY ---
let lastResume = 0;
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastResume < 1500) return;
    lastResume = now;
    location.reload();
});

document.addEventListener('touchstart', e => { touchStart = e.touches[0].pageY; }, {passive: true});
document.addEventListener('touchmove', e => {
    const distance = e.touches[0].pageY - touchStart;
    if (window.scrollY <= 0 && distance > 0) {
        spinner.style.top = `${Math.min(distance / 2, 100) - 40}px`;
        spinner.style.transform = `translateX(-50%) scale(${distance > 90 ? 1.2 : 1})`;
    }
}, {passive: true});
document.addEventListener('touchend', e => {
    if (window.scrollY <= 0 && (e.changedTouches[0].pageY - touchStart) > 90) location.reload();
    else spinner.style.top = '-50px';
}, {passive: true});

// --- NAVIGATION ---
function nav(id, title, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(id);
    if (targetPage) targetPage.classList.add('active-page');
    document.getElementById('main-title').textContent = title;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    const pageKey = id.replace('page-', '');
    window.history.replaceState({}, '', pageKey === 'home' ? window.location.pathname : `?page=${pageKey}`);
    window.scrollTo(0,0);
}

function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('page');
    if (target) {
        const pages = {
            'jm': { id: 'page-jm', title: 'Jahresmeisterschaft', sel: '[onclick*="page-jm"]' },
            'gruppe': { id: 'page-gruppe', title: 'Gruppe & Grenzland', sel: '[onclick*="page-gruppe"]' },
            'mannschaft': { id: 'page-mannschaft', title: 'Mannschaft', sel: '[onclick*="page-mannschaft"]' },
            'upload': { id: 'page-upload', title: 'Upload', sel: '[onclick*="page-upload"]' }
        };
        const c = pages[target];
        if (c) nav(c.id, c.title, document.querySelector(c.sel));
    }
}

// --- DATEN LADEN & RENDERN ---
async function loadTermine() {
    const wrap = document.getElementById("termine");
    const fetchJson = async (url) => {
        try { const r = await fetch(url); return r.ok ? await r.json() : null; }
        catch(e) { return null; }
    };

    const [resWorker, resGoogle] = await Promise.all([
        fetchJson(WORKER_TERMINE_URL),
        fetchJson(GOOGLE_SCRIPT_URL)
    ]);

    let data = [];

    // 1. Worker (Dein neues JSON Objekt)
    if (resWorker && resWorker.termine) {
        resWorker.termine.forEach(t => {
            if (t.datum) {
                const d = new Date(t.datum);
                if (!isNaN(d)) {
                    data.push({
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

    // 2. Google Script (Das flache Array)
    if (Array.isArray(resGoogle)) {
        resGoogle.forEach(t => {
            const d = new Date(t.datum_iso || t.datum);
            if (!isNaN(d)) {
                data.push({
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

    // Sortieren & Runden-Logik
    data.sort((a, b) => a.d - b.d);
    allTermine = applyRundenPrefix(data);
    renderTermine(allTermine);
}

function renderTermine(items) {
    const wrap = document.getElementById("termine");
    const nowYear = new Date().getFullYear();
    wrap.innerHTML = items.length ? "" : "Keine Termine.";

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

function filterTermine(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTermine(type === 'all' ? allTermine : allTermine.filter(t => t.typ === type));
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

window.addEventListener('load', () => { loadTermine(); handleDeepLink(); });
