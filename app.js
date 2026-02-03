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
            ...
