// termine.js
async function loadTermine() {
    const wrap = document.getElementById("termine");
    const WORKER_TERMINE_URL = "https://termine.dan-hunziker73.workers.dev";
    
    try {
        const res = await fetch(WORKER_TERMINE_URL);
        let data = await res.json();
        const currentYear = new Date().getFullYear();

        data.sort((a, b) => {
            const parseDate = (str) => {
                if(!str) return new Date(8640000000000000);
                const p = str.split(", ")[1].split(" ");
                const months = {"Januar":0, "Februar":1, "März":2, "April":3, "Mai":4, "Juni":5, "Juli":6, "August":7, "September":8, "Oktober":9, "November":10, "Dezember":11};
                return new Date(p[2], months[p[1]], parseInt(p[0]));
            };
            return parseDate(a.datum) - parseDate(b.datum);
        });

        wrap.innerHTML = "";
        data.forEach(t => {
            const status = (t.status || "").toLowerCase();
            const datumRaw = (t.datum || "").trim();
            if (datumRaw === "" || status === "abgesagt") return;
            const isProv = status === "provisorisch";
            const parts = datumRaw.split(", ");
            const weekday = parts[0].substring(0, 2); 
            const dateFull = parts[1]; 
            const yearMatch = dateFull.match(/\d{4}/);
            const yearInString = yearMatch ? yearMatch[0] : currentYear.toString();
            const dateDisplay = dateFull.replace(` ${yearInString}`, "");
            const subLine = (yearInString !== currentYear.toString()) ? `${weekday} '${yearInString.substring(2)}` : weekday;

            wrap.innerHTML += `
            <div class="termin-row">
                <div class="termin-date">
                    <span class="date-main">${dateDisplay}</span>
                    <span class="date-sub">${subLine}</span>
                </div>
                <div class="termin-content">
                    <span class="termin-title">${t.titel}</span>
                    <div class="termin-meta">
                        <span>📍 ${t.ort}</span>
                        ${t.start ? `<span>🕒 ${t.start}</span>` : ""}
                    </div>
                    ${isProv ? '<span class="badge-prov">Provisorisch</span>' : ''}
                </div>
            </div>`;
        });
    } catch (e) {
        wrap.innerHTML = "Fehler beim Laden.";
    }
}
