const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = [];
let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

// --- EVENT LISTENER & NAVIGATION (Bleiben identisch) ---

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

function nav(id, title, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(id);
    if (targetPage) targetPage.classList.add('active-page');
    document.getElementById('main-title').textContent = title;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const pageKey = id.replace('page-', '');
    const newPath = window.location.pathname;
    window.history.replaceState({}, '', pageKey === 'home' ? newPath : `${newPath}?page=${pageKey}`);
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
        if (config) nav(config.id, config.title, document.querySelector(config.selector));
    }
}

// --- DATEN LADEN & HARMONISIEREN (Der entscheidende Teil) ---

async function loadTermine() {
    const wrap = document.getElementById("termine");
    const safeFetch = async (url) => {
        try {
            const r = await fetch(url);
            return r.ok ? await r.json() : null;
        } catch(e) { return null; }
    };

    try {
        const [resWorker, resGoogle] = await Promise.all([
            safeFetch(WORKER_TERMINE_URL),
            safeFetch(GOOGLE_SCRIPT_URL)
        ]);

        let harmonized = [];

        // 1. Worker Daten (Objekt-Struktur)
        if (resWorker && resWorker.termine) {
            resWorker.termine.forEach(t => {
                if (t.datum && t.datum.trim() !== "") { // Nur mit Datum!
                    const dObj = new Date(t.datum);
                    if (!isNaN(dObj.getTime())) {
                        harmonized.push({
                            titel: t.anlasstitel, // Feldname im Worker JSON
                            start: t.startzeit,   // Feldname im Worker JSON
                            ort: t.ort || "Muhen",
                            status: t.status || "fix",
                            typ: 'verein',
                            dateObj: dObj
                        });
                    }
                }
            });
        }

        // 2. Google Daten (Array-Struktur)
        if (Array.isArray(resGoogle)) {
            resGoogle.forEach(t => {
                const dateStr = t.datum_iso || t.datum;
                if (dateStr) {
                    const dObj = new Date(dateStr);
                    if (!isNaN(dObj.getTime())) {
                        harmonized.push({
                            titel: t.titel,      // Feldname im GAS JSON
                            start: t.start,      // Feldname im GAS JSON
                            ort: "Schützenhaus",
                            status: 'fix',
                            typ: 'extern',
                            dateObj: dObj
                        });
                    }
                }
            });
        }

        harmonized.sort((a, b) => a.dateObj - b.dateObj);
        allTermine = applyRundenPrefix(harmonized);
        renderTermine(allTermine);

    } catch (e) { wrap.innerHTML = "Fehler beim Laden."; }
}

function renderTermine(data) {
    const wrap = document.getElementById("termine");
    const currentYear = new Date().getFullYear();
    wrap.innerHTML = data.length === 0 ? "Keine Termine gefunden." : "";

    data.forEach(t => {
        if (t.status === "abgesagt") return;
        const isExtern = t.typ === "extern";
        if (isExtern && t.titel.toLowerCase().includes("reinigung")) return;

        const d = t.dateObj;
        const monthNames = ["Jan.", "Feb.", "März", "April", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
        const dateDisplay = `${d.getDate()}. ${monthNames[d.getMonth()]}`;
        const weekday = d.toLocaleDateString('de-CH', { weekday: 'short' }).substring(0, 2);
        const yearInDate = d.getFullYear();
        const subLine = (yearInDate !== currentYear) ? `${weekday} '${yearInDate.toString().substring(2)}` : weekday;

        wrap.innerHTML += `
        <div class="termin-row ${isExtern ? 'extern' : ''}">
            <div class="termin-date">
                <span class="date-main">${dateDisplay}</span>
                <span class="date-sub">${subLine}</span>
            </div>
            <div class="termin-content">
                <span class="termin-title">${isExtern ? '🏠 ' : ''}${t.titel}</span>
                <div class="termin-meta">
                    <span>${isExtern ? 'Schützenhaus' : '📍 ' + t.ort}</span>
                    ${t.start ? `<span>🕒 ${t.start}</span>` : ""}
                </div>
                ${isExtern ? '<span class="badge-extern">Haus belegt</span>' : (t.status === 'provisorisch' ? '<span class="badge-prov">Provisorisch</span>' : '')}
            </div>
        </div>`;
    });
}

function filterTermine(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTermine(type === 'all' ? allTermine : allTermine.filter(t => t.typ === type));
}

function applyRundenPrefix(termine) {
    const rules = { "Gruppenmeisterschaft SSV": 3, "Gruppenmeisterschaft AGSV": 3, "Grenzland-Cup": 3, "Mannschaftsmeisterschaft": 7 };
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
