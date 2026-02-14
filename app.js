const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = [];
let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

// --- EVENT LISTENER (Wie gehabt) ---

let lastResume = 0;
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastResume < 1500) return;
    lastResume = now;
    document.dispatchEvent(new CustomEvent("app:resume"));
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

// --- NAVIGATION & DEEP LINKING (Wie gehabt) ---

function nav(id, title, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(id);
    if (targetPage) targetPage.classList.add('active-page');
    document.getElementById('main-title').textContent = title;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const pageKey = id.replace('page-', '');
    const newPath = window.location.pathname;
    if (pageKey === 'home') window.history.replaceState({}, '', newPath);
    else window.history.replaceState({}, '', `${newPath}?page=${pageKey}`);
    
    window.scrollTo(0,0);
}

function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('page');
    if (target) {
        const pages = {
            'jm': { id: 'page-jm', title: 'Jahresmeisterschaft', selector: '[onclick*="page-jm"]' },
            'gruppe': { id: 'page-gruppe', title: 'Gruppe & Grenzland', selector: '[onclick*="page-gruppe"]' },
            'mannschaft': { id: 'page-mannschaft', title: 'Mannschaft', selector: '[onclick*="page-mannschaft"]' },
            'upload': { id: 'page-upload', title: 'Upload', selector: '[onclick*="page-upload"]' }
        };
        const config = pages[target];
        if (config) {
            const btn = document.querySelector(config.selector);
            nav(config.id, config.title, btn);
        }
    }
}

// --- DATEN LADEN & RENDERN (An das neue JSON angepasst) ---

async function loadTermine() {
    const wrap = document.getElementById("termine");
    const safeFetch = async (url) => {
        try {
            const r = await fetch(url);
            if(!r.ok) return null;
            return await r.json();
        } catch(e) { return null; }
    };

    try {
        const [resWorker, resGoogle] = await Promise.all([
            safeFetch(WORKER_TERMINE_URL),
            safeFetch(GOOGLE_SCRIPT_URL)
        ]);

        let harmonized = [];

        // 1. Vereinsdaten (Worker)
        if (resWorker && resWorker.termine) {
            harmonized.push(...resWorker.termine.map(t => ({
                titel: t.anlasstitel || "Unbenannt",
                datum_raw: t.datum,
                start: t.startzeit,
                ort: t.ort || "Muhen",
                status: t.status,
                typ: 'verein',
                dateObj: t.datum ? new Date(t.datum) : new Date(8640000000000000)
            })));
        }

        // 2. Externe Daten (Google)
        if (Array.isArray(resGoogle)) {
            harmonized.push(...resGoogle.map(t => ({
                titel: t.titel,
                datum_raw: t.datum_iso,
                start: t.start,
                ort: t.ort || "Schützenhaus",
                status: 'fix',
                typ: 'extern',
                dateObj: t.datum_iso ? new Date(t.datum_iso) : new Date(8640000000000000)
            })));
        }

        // Sortierung
        harmonized.sort((a, b) => a.dateObj - b.dateObj);

        // Runden-Präfixe & globale Variable setzen
        allTermine = applyRundenPrefix(harmonized);
        renderTermine(allTermine);

    } catch (e) { 
        wrap.innerHTML = "Fehler beim Laden."; 
    }
}

function renderTermine(data) {
    const wrap = document.getElementById("termine");
    const currentYear = new Date().getFullYear();
    wrap.innerHTML = data.length === 0 ? "Keine Termine gefunden." : "";

    data.forEach(t => {
        // Filter-Regeln
        if (t.status === "abgesagt") return;
        if (t.typ === "extern" && t.titel.toLowerCase().includes("reinigung")) return;
        if (!t.datum_raw || t.datum_raw === "") return; // Leere Daten (wie Endschiessen ohne Datum) ignorieren

        const d = t.dateObj;
        const weekday = d.toLocaleDateString('de-DE', { weekday: 'short' }).substring(0, 2);
        const dateDisplay = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        const yearInDate = d.getFullYear();
        
        const subLine = (yearInDate !== currentYear) ? `${weekday} '${yearInDate.toString().substring(2)}` : weekday;

        wrap.innerHTML += `
        <div class="termin-row ${t.typ === 'extern' ? 'extern' : ''}">
            <div class="termin-date">
                <span class="date-main">${dateDisplay}</span>
                <span class="date-sub">${subLine}</span>
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
    if(type === 'all') renderTermine(allTermine);
    else renderTermine(allTermine.filter(t => t.typ === type));
}

function applyRundenPrefix(termine) {
    const rules = {
        "Gruppenmeisterschaft SSV": 3,
        "Gruppenmeisterschaft AGSV": 3,
        "Grenzland-Cup": 3,
        "Mannschaftsmeisterschaft": 7
    };
    const counters = {};

    return termine.map(t => {
        const title = t.titel.trim();
        if (title.toLowerCase().startsWith("final")) return t;

        for (const baseTitle in rules) {
            if (title === baseTitle) {
                counters[baseTitle] = (counters[baseTitle] || 0) + 1;
                if (counters[baseTitle] <= rules[baseTitle]) {
                    return { ...t, titel: `${counters[baseTitle]}. Runde ${title}` };
                }
            }
        }
        return t;
    });
}

window.addEventListener('load', () => {
    loadTermine();
    handleDeepLink();
});
