/*************************************************
 * CONFIGURACIÓN Y BASE DE DATOS DOCENTES
 *************************************************/
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwuT3LN8tqEy8VaHMdjsrtXlLYCFToDXZRupFqBf7F1iNL6LVBf0N4szj_EpW2Wiuo/exec";

const DOCENTES_DATA = [
    { nombre: "ALEXIS CORTÉS", email: "acortes@ceas.cl" },
    { nombre: "ALLYSON RIOS", email: "allysonrios@ceas.cl" },
    { nombre: "ANA OGAZ", email: "aogaz@ceas.cl" },
    { nombre: "ANDREA SALAZAR", email: "asalazar@ceas.cl" },
    { nombre: "AVIGUEY GONZALEZ", email: "agonzalez@ceas.cl" },
    { nombre: "CAMILA GONZÁLEZ", email: "cgonzalez@ceas.cl" },
    { nombre: "CARLA MERA", email: "cmera@ceas.cl" },
    { nombre: "CARLOS ARAYA", email: "caraya@ceas.cl" },
    { nombre: "CARMEN ÁLVAREZ", email: "calvarez@ceas.cl" },
    { nombre: "CAROLINA MIRANDA", email: "cmiranda@ceas.cl" },
    { nombre: "CAROLINA REYES", email: "creyes@ceas.cl" },
    { nombre: "CECILIA GARCÍA", email: "cgarcia@ceas.cl" },
    { nombre: "CLAUDIA TOLEDO", email: "ctoledo@ceas.cl" },
    { nombre: "CONSTANZA LÓPEZ", email: "clopez@ceas.cl" },
    { nombre: "DANIEL VITTA", email: "dvitta@ceas.cl" },
    { nombre: "DANIELA VERA", email: "dvera@ceas.cl" },
    { nombre: "DANIELA VALENZUELA", email: "dvalenzuela@ceas.cl" },
    { nombre: "DEBORA GAETE", email: "dgaete@ceas.cl" },
    { nombre: "ELIZABETH MIRANDA", email: "emiranda@ceas.cl" },
    { nombre: "ERIKA KINDERMANN", email: "ekindermann@ceas.cl" },
    { nombre: "FERNANDA RÍOS", email: "frios@ceas.cl" },
    { nombre: "FRANCISCA MAUREIRA", email: "fmaureira@ceas.cl" },
    { nombre: "FRANCISCA COFRÉ", email: "fcofre@ceas.cl" },
    { nombre: "FRANCISCA VIZCAYA", email: "fvizcaya@ceas.cl" },
    { nombre: "GIOVANNA ARIAS", email: "garias@ceas.cl" },
    { nombre: "GOLDIE FARÍAS", email: "gfarias@ceas.cl" },
    { nombre: "HERNÁN REYES", email: "hreyes@ceas.cl" },
    { nombre: "JAVIERA ALIAGA", email: "jaliaga@ceas.cl" },
    { nombre: "JOAQUÍN ALMUNA", email: "jalmuna@ceas.cl" },
    { nombre: "KARIMME GUTIÉRREZ", email: "kgutierrez@ceas.cl" },
    { nombre: "KARINA BARRIOS", email: "kbarrios@ceas.cl" },
    { nombre: "KAROLINA RIFFO", email: "kriffo@ceas.cl" },
    { nombre: "LEONARDO RÍOS", email: "lrios@ceas.cl" },
    { nombre: "LORENA ARANCIBIA", email: "larancibia@ceas.cl" },
    { nombre: "LUIS SÁNCHEZ", email: "lsanchez@ceas.cl" },
    { nombre: "MACARENA BELTRÁN", email: "mbeltran@ceas.cl" },
    { nombre: "MARÍA MONZÓN", email: "mmonzon@ceas.cl" },
    { nombre: "MARÍA GONZÁLEZ", email: "mgonzalez@ceas.cl" },
    { nombre: "MARISOL GUAJARDO", email: "mguajardo@ceas.cl" },
    { nombre: "MATÍAS CUEVAS", email: "mcuevas@ceas.cl" },
    { nombre: "NATALIA CARTES", email: "ncartes@ceas.cl" },
    { nombre: "NATALY HIDALGO", email: "nhidalgo@ceas.cl" },
    { nombre: "NICOLE BELLO", email: "nbello@ceas.cl" },
    { nombre: "PAOLA ÁVILA", email: "pavila@ceas.cl" },
    { nombre: "PATRICIA NÚÑEZ", email: "pnunez@ceas.cl" },
    { nombre: "PAULINA ARGOMEDO", email: "pargomedo@ceas.cl" },
    { nombre: "PRISCILA VALENZUELA", email: "pvalenzuela@ceas.cl" },
    { nombre: "REINA ORTEGA", email: "rortega@ceas.cl" },
    { nombre: "STEPHANY GUZMÁN", email: "stephanyguzman@ceas.cl" },
    { nombre: "VÍCTOR BARRIENTOS", email: "victorbarrientos@ceas.cl" },
    { nombre: "YADIA CERDA", email: "ycerda@ceas.cl" },
    { nombre: "YESSENIA SÁNCHEZ", email: "ysanchez@ceas.cl" }
];

let citas = [];
let currentDate = new Date();
let miniCalDate = new Date();
const HORAS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
const FERIADOS_2026 = ["2026-01-01","2026-04-03","2026-05-01","2026-05-21","2026-09-18","2026-12-25"];

document.addEventListener("DOMContentLoaded", () => {
    const datalist = document.getElementById("listaDocentes");
    if (datalist) {
        DOCENTES_DATA.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach(d => {
            const opt = document.createElement("option"); opt.value = d.nombre; datalist.appendChild(opt);
        });
    }
    const timeLabels = document.getElementById("timeLabels");
    if (timeLabels) {
        timeLabels.innerHTML = '<div class="t-spacer"></div>' + HORAS.map(h => `<div class="t-slot">${h}</div>`).join("");
    }
    renderMiniCalendar();
    cargarDatos();
});

function filtrarDocentes() {
    const input = document.getElementById("docente");
    const list = document.getElementById("docenteList");
    const emailInput = document.getElementById("emailDocente");
    const texto = input.value.trim();
    list.innerHTML = ""; list.style.display = "none";
    if (texto.length < 1) return;
    const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const filtro = norm(texto);
    const resultados = DOCENTES_DATA.filter(d => norm(d.nombre).includes(filtro));
    resultados.slice(0, 10).forEach(docente => {
        const div = document.createElement("div");
        div.className = "autocomplete-item"; div.textContent = docente.nombre;
        div.onclick = () => { 
            input.value = docente.nombre; 
            emailInput.value = docente.email; 
            list.innerHTML = ""; 
            list.style.display = "none"; 
        };
        list.appendChild(div);
    });
    list.style.display = "block";
}

async function cargarDatos() {
    try {
        const r = await fetch(`${SHEET_URL}?action=get`);
        const j = await r.json();
        if (!j.datos) return;
        citas = j.datos.map(c => ({
            id: c.id, fecha: normalizarFecha(c.fecha), hora: normalizarHora(c.hora),
            docente: c.docente || "", alumno: c.alumno || "", apoderado: c.apoderado || "",
            curso: c.curso || "", estado: c.estado || "Pendiente", tipo: c.tipo || "Email",
            sala: c.sala || "", email: c.email || ""
        }));
        renderWeekView();
    } catch (e) { console.error(e); }
}

function renderWeekView() {
    const grid = document.getElementById("weekGrid"); grid.innerHTML = "";
    let start = new Date(currentDate);
    let day = start.getDay();
    let diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    document.getElementById("weekRangeLabel").innerText = `Semana del ${start.toLocaleDateString("es-CL")}`;
    const filtro = document.getElementById("filterDocente").value.toUpperCase();

    for (let i = 0; i < 7; i++) {
        let d = new Date(start); d.setDate(start.getDate() + i);
        let dStr = normalizarFecha(d);
        let isHoliday = d.getDay() === 0 || FERIADOS_2026.includes(dStr);
        let col = document.createElement("div");
        col.className = `day-col ${isHoliday ? "holiday-col" : ""}`;
        col.innerHTML = `<div class="d-head">${["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i]} ${d.getDate()}</div>`;

        HORAS.forEach(h => {
            let slot = document.createElement("div"); slot.className = "h-slot";
            slot.onclick = () => openDialog(dStr, h); col.appendChild(slot);
        });

        citas.forEach(c => {
            if (c.fecha === dStr && (filtro === "" || c.docente.toUpperCase().includes(filtro))) {
                let idx = HORAS.indexOf(c.hora);
                if (idx > -1) {
                    let ev = document.createElement("div");
                    ev.className = `event ${c.estado === "Asistió" ? "asis" : c.estado === "No asistió" ? "no" : "pen"}`;
                    ev.style.top = `${70 + idx * 80}px`;
                    
                    // ESTILO IGUAL A LA IMAGEN DE LA IZQUIERDA
                    ev.innerHTML = `
                        <div class="ev-docente">${c.docente}</div>
                        <div class="ev-detalle">${c.alumno || c.apoderado || "Sin Nombre"}</div>
                        <div class="ev-footer">
                            <span class="ev-sala">${c.sala || "Sin Sala"}</span>
                            <span class="ev-time">${c.hora}</span>
                        </div>
                    `;
                    
                    ev.onclick = e => { e.stopPropagation(); openDialog(dStr, c.hora, c); };
                    col.appendChild(ev);
                }
            }
        });
        grid.appendChild(col);
    }
}

function openDialog(f,h,c=null){
    document.getElementById("dialog").showModal();
    document.getElementById("citaId").value = c ? c.id : "";
    document.getElementById("fecha").value = f;
    document.getElementById("hora").value = h;
    document.getElementById("docente").value = c ? c.docente : "";
    document.getElementById("emailDocente").value = c ? c.email : "";
    document.getElementById("curso").value = c ? c.curso : "";
    document.getElementById("alumno").value = c ? c.alumno : "";
    document.getElementById("apoderado").value = c ? c.apoderado : "";
    document.getElementById("estado").value = c ? c.estado : "Pendiente";
    document.getElementById("sala").value = c ? c.sala : "Sala 1";
    document.getElementById("btnReagendar").style.display = c ? "block" : "none";
}

function closeDialog(){ document.getElementById("dialog").close(); }

async function guardar(){
    const p = {
        action: document.getElementById("citaId").value ? "edit" : "add",
        id: document.getElementById("citaId").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        docente: document.getElementById("docente").value,
        email: document.getElementById("emailDocente").value,
        tipo: "Email", enviarEmail: true,
        curso: document.getElementById("curso").value,
        alumno: document.getElementById("alumno").value,
        apoderado: document.getElementById("apoderado").value,
        sala: document.getElementById("sala").value,
        estado: document.getElementById("estado").value
    };
    await fetch(`${SHEET_URL}?${new URLSearchParams(p)}`, { mode: "no-cors" });
    setTimeout(() => location.reload(), 600);
}

async function reagendar() {
    document.getElementById("estado").value = "Reagendada";
    await guardar();
}

function changeWeek(v){ currentDate.setDate(currentDate.getDate() + v*7); renderWeekView(); renderMiniCalendar(); }
function changeMonth(v){ miniCalDate.setMonth(miniCalDate.getMonth() + v); renderMiniCalendar(); }

function normalizarFecha(v){
    let d = new Date(v);
    if(isNaN(d.getTime())) return "";
    let year = d.getFullYear();
    let month = (d.getMonth() + 1).toString().padStart(2, '0');
    let day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function normalizarHora(v){
    if (!v) return ""; let s = v.toString().trim();
    if (s.includes("T")) s = s.split("T")[1];
    let parts = s.split(":"); return `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}`;
}

function renderMiniCalendar() {
    const cont = document.getElementById("miniCalendar"); cont.innerHTML = "";
    let y = miniCalDate.getFullYear(), m = miniCalDate.getMonth();
    document.getElementById("miniMonthLabel").innerText = new Date(y, m).toLocaleString("es-CL", { month:"long", year:"numeric" }).toUpperCase();
    let first = (new Date(y, m, 1).getDay() + 6) % 7;
    for (let i = 0; i < first; i++) cont.appendChild(document.createElement("div"));
    let days = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
        let div = document.createElement("div"); div.innerText = d;
        let dStr = `${y}-${(m+1).toString().padStart(2,"0")}-${d.toString().padStart(2,"0")}`;
        if (new Date(y,m,d).getDay() === 0 || FERIADOS_2026.includes(dStr)) div.classList.add("holiday-mark");
        div.onclick = () => { currentDate = new Date(y,m,d); renderWeekView(); renderMiniCalendar(); };
        cont.appendChild(div);
    }
}
setInterval(cargarDatos, 60000);
