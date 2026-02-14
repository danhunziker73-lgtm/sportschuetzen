const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = [];
let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

// --- EVENT LISTENER ---

// Auto-Update wenn die App wieder geöffnet wird
let lastResume = 0;

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;

    const now = Date.now();
    if (now - lastResume < 1500) return;

    lastResume = now;
    document.dispatchEvent(new CustomEvent("app:resume"));
});


// Pull-to-Refresh Logik
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
    // 1. Alle Seiten ausblenden
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    
    // 2. Zielseite einblenden
    const targetPage = document.getElementById(id);
    if (targetPage) {
        targetPage.classList.add('active-page');
    }
    
    // 3. Header-Titel anpassen
    document.getElementById('main-title').textContent = title;
    
    // 4. Aktiven Button in der Navigation markieren
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    }

    // --- NEU: URL AKTUALISIEREN FÜR PULL-TO-REFRESH ---
    // Wir ziehen das Kürzel aus der ID (z.B. "page-jm" -> "jm")
    const pageKey = id.replace('page-', '');
    
    // Aktuellen Pfad holen (n_index.html)
    const newPath = window.location.pathname;

    if (pageKey === 'home') {
        // Auf der Startseite entfernen wir den ?page= Parameter
        window.history.replaceState({}, '', newPath);
    } else {
        // Auf Unterseiten setzen wir den passenden Parameter
        window.history.replaceState({}, '', `${newPath}?page=${pageKey}`);
    }
    
    // Nach oben springen
    window.scrollTo(0,0);
}
// Deep Linking Logik (Springe zu Seite via URL ?page=...)
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
            // Unterstützung für das Objekt-Format {"termine": [...]}
            if (d.termine && Array.isArray(d.termine)) return d.termine;
            return Array.isArray(d) ? d : [];
        } catch(e) { return []; }
    };

    try {
        const [resWorker, resGoogle] = await Promise.all([
            safeFetch(WORKER_TERMINE_URL),
            safeFetch(GOOGLE_SCRIPT_URL)
        ]);

        allTermine = [
            ...resWorker.map(t => ({
                ...t, 
                // Vereinheitliche Titel und Zeit (startzeit vs start)
                titel: t.anlasstitel || t.titel || "Unbenannter Termin", 
                zeit: t.startzeit || t.start || "",
                typ: 'verein'
            })),
            ...resGoogle.map(t => ({
                ...t, 
                // Google liefert oft 'titel' oder 'summary'
                titel: t.titel || t.anlasstitel || t.summary || "Hausbelegung", 
                zeit: t.startzeit || t.start || "",
                typ: 'extern'
            }))
        ];

        // Sortierung: Termine ohne Datum nach unten
        allTermine.sort((a, b) => {
            if (!a.datum) return 1;
            if (!b.datum) return -1;
            return new Date(a.datum) - new Date(b.datum);
        });

        allTermine = applyRundenPrefix(allTermine);
        renderTermine(allTermine);
    } catch (e) { 
        console.error("Fehler beim Laden:", e);
        wrap.innerHTML = "Fehler beim Verarbeiten der Daten."; 
    }
}


function renderTermine(data) {
    const wrap = document.getElementById("termine");
    const currentYear = new Date().getFullYear();
    wrap.innerHTML = data.length === 0 ? "Keine Termine gefunden." : "";

    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const months = ["Jan.", "Feb.", "März", "April", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];

    data.forEach(t => {
        // NUR abbrechen wenn wirklich kein Titel da ist oder abgesagt wurde
        if(!t.titel || t.status === "abgesagt") return;
        
        const isExtern = t.typ === "extern";
        if(isExtern && t.titel.toLowerCase().includes("reinigung")) return;

        let dateDisplay = "---";
        let subLine = "Datum folgt";

        // Wenn Datum vorhanden ist, berechnen
        if (t.datum) {
            const d = new Date(t.datum);
            if (!isNaN(d)) {
                const dayName = days[d.getDay()];
                const dayNum = d.getDate();
                const monthName = months[d.getMonth()];
                const yearNum = d.getFullYear();

                dateDisplay = `${dayNum}. ${monthName}`;
                subLine = (yearNum !== currentYear) ? `${dayName} '${String(yearNum).substring(2)}` : dayName;
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

        // Finals oder Sonderformen NICHT anfassen
        if (title.toLowerCase().startsWith("final")) return t;

        for (const baseTitle in rules) {
            if (title === baseTitle) {
                counters[baseTitle] = (counters[baseTitle] || 0) + 1;

                // Sicherheit: nicht über max. Runden hinaus
                if (counters[baseTitle] <= rules[baseTitle]) {
                    return {
                        ...t,
                        titel: `${counters[baseTitle]}. Runde ${title}`
                    };
                }
            }
        }
        return t;
    });
}


// --- INITIALISIERUNG ---

window.addEventListener('load', () => {
    loadTermine();
    handleDeepLink(); // Prüft URL beim Start
});
