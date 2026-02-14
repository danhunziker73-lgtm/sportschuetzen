const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = [];
let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

// --- EVENT LISTENER ---
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

// --- NAVIGATION ---
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

// --- DATEN LADEN & RENDERN ---

async function loadTermine() {
    const wrap = document.getElementById("termine");
    const safeFetch = async (url) => {
        try {
            const r = await fetch(url);
            if(!r.ok) return [];
            const d = await r.json();
            // Check ob das JSON in einem "termine" Wrapper kommt
            if (d && d.termine && Array.isArray(d.termine)) return d.termine;
            return Array.isArray(d) ? d : [];
        } catch(e) { return []; }
    };

    try {
        const [resWorker, resGoogle] = await Promise.all([
            safeFetch(WORKER_TERMINE_URL),
            safeFetch(GOOGLE_SCRIPT_URL)
        ]);

        // Mapping: Wir vereinheitlichen die Felder hier
        allTermine = [
            ...resWorker.map(t => ({
                ...t, 
                titel: t.anlasstitel || t.titel || "Unbenannter Termin", 
                zeit: t.startzeit || "",
                typ: 'verein'
            })),
            ...resGoogle.map(t => ({
                ...t, 
                titel: t.titel || t.anlasstitel || t.summary || "Hausbelegung", 
                zeit: t.startzeit || t.start || "",
                typ: 'extern'
            }))
        ];

        // Sortierung für ISO-Datum (YYYY-MM-DD)
        allTermine.sort((a, b) => {
            if (!a.datum || a.datum === "") return 1;
            if (!b.datum || b.datum === "") return -1;
            return new Date(a.datum) - new Date(b.datum);
        });

        allTermine = applyRundenPrefix(allTermine);
        renderTermine(allTermine);
    } catch (e) { 
        console.error(e);
        wrap.innerHTML = "Fehler beim Laden."; 
    }
}

function renderTermine(data) {
    const wrap = document.getElementById("termine");
    const currentYear = new Date().getFullYear();
    wrap.innerHTML = data.length === 0 ? "Keine Termine gefunden." : "";

    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const months = ["Jan.", "Feb.", "März", "April", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];

    data.forEach(t => {
        if(!t.titel || t.status === "abgesagt") return;
        
        const isExtern = t.typ === "extern";
        if(isExtern && t.titel.toLowerCase().includes("reinigung")) return;

        let dateDisplay = "---";
        let subLine = "Datum folgt";

        if (t.datum && t.datum !== "") {
            // Explizites Parsen von YYYY-MM-DD um Browser-Verwechslung zu vermeiden
            const p = t.datum.split("-");
            const d = new Date(p[0], p[1] - 1, p[2]); 
            
            if (!isNaN(d)) {
                dateDisplay = `${d.getDate()}. ${months[d.getMonth()]}`;
                subLine = (d.getFullYear() !== currentYear) ? `${days[d.getDay()]} '${String(d.getFullYear()).substring(2)}` : days[d.getDay()];
            }
        }

        wrap.innerHTML += `
        <div class="termin-row ${isExtern ? 'extern' : ''}">
            <div class="termin-date">
                <span class="date-main">${dateDisplay}</span>
                <span class="date-sub">${subLine}</span>
            </div>
            <div class="termin-content">
                <span class="termin-title">${isExtern ? '🏠 ' : ''}${t.titel}</span>
                <div class="termin-meta">
                    <span>${isExtern ? 'Schützenhaus' : '📍 ' + (t.ort || 'Muhen')}</span>
                    ${t.zeit ? `<span>🕒 ${t.zeit}</span>` : ""}
                </div>
                ${isExtern ? '<span class="badge-extern">Haus belegt</span>' : (t.status === 'provisorisch' ? '<span class="badge-prov">Provisorisch</span>' : '')}
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

// --- INITIALISIERUNG ---
window.addEventListener('load', () => {
    loadTermine();
    handleDeepLink();
});
