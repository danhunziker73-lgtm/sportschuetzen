const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev?action=getTermine";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi9BVdewuF-HTXB1ruwdap5C1pLyobj6XZsgJV6XFLVQDLUU3jPYvx727tzC1y3NM/exec";

let allTermine = [];

let touchStart = 0;
const spinner = document.getElementById('pull-spinner');

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
    document.getElementById(id).classList.add('active-page');
    document.getElementById('main-title').textContent = title;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.scrollTo(0,0);
}

async function loadTermine() {
    const wrap = document.getElementById("termine");
    const safeFetch = async (url) => {
        try {
            const r = await fetch(url);
            if(!r.ok) return [];
            const d = await r.json();
            return Array.isArray(d) ? d : [];
        } catch(e) { return []; }
    };

    try {
        const [resWorker, resGoogle] = await Promise.all([
            safeFetch(WORKER_TERMINE_URL),
            safeFetch(GOOGLE_SCRIPT_URL)
        ]);

        allTermine = [
            ...resWorker.map(t => ({...t, typ: 'verein'})),
            ...resGoogle.map(t => ({...t, typ: 'extern'}))
        ];

        allTermine.sort((a, b) => {
            const parse = (obj) => {
                if(obj.datum_iso) return new Date(obj.datum_iso);
                try {
                    const p = obj.datum.split(", ")[1].split(" ");
                    const months = {"Januar":0,"Februar":1,"März":2,"April":3,"Mai":4,"Juni":5,"Juli":6,"August":7,"September":8,"Oktober":9,"November":10,"Dezember":11};
                    return new Date(p[2], months[p[1]], parseInt(p[0]));
                } catch(e) { return new Date(8640000000000000); }
            };
            return parse(a) - parse(b);
        });

        renderTermine(allTermine);
    } catch (e) { wrap.innerHTML = "Fehler beim Laden."; }
}

function renderTermine(data) {
    const wrap = document.getElementById("termine");
    const currentYear = new Date().getFullYear();
    wrap.innerHTML = data.length === 0 ? "Keine Termine gefunden." : "";

    data.forEach(t => {
        if(t.status === "abgesagt") return;
        const isExtern = t.typ === "extern";
        if(isExtern && t.titel.toLowerCase().includes("reinigung")) return;

        const parts = t.datum.split(", ");
        if(parts.length < 2) return;

        const weekday = parts[0].substring(0, 2); 
        const dateFull = parts[1]; 
        const yearMatch = dateFull.match(/\d{4}/);
        const yearInStr = yearMatch ? yearMatch[0] : currentYear.toString();
        const dateDisplay = dateFull.replace(` ${yearInStr}`, "");
        const subLine = (yearInStr !== currentYear.toString()) ? `${weekday} '${yearInStr.substring(2)}` : weekday;

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

    if(type === 'all') renderTermine(allTermine);
    else renderTermine(allTermine.filter(t => t.typ === type));
}

window.onload = loadTermine;
