/*************************************************
 * CONFIGURACIÓN Y CONSTANTES
 *************************************************/
const SHEET_URL = "https://script.google.com/macros/s/AKfycbx_IDOJJoA3pLKKvhuwYrRP2U3IrptsQgr58SYbklZ1rVT7ZryjlBbab5XerBQvmzQ/exec";

const DOCENTES_NSG = [
    "ALEXIS CORTÉS","ALLYSON RIOS","ANA OGAZ","ANDREA SALAZAR","ANDREA DONOSO",
    "AVIGUEY GONZALEZ","CAMILA GONZÁLEZ","CARLA MERA","CARLOS ARAYA","CARMEN ÁLVAREZ",
    "CAROLINA MIRANDA","CAROLINA REYES","CECILIA GARCÍA","CLAUDIA TOLEDO",
    "CONSTANZA LÓPEZ","DANIEL VITTA","DANIELA VERA","DANIELA VALENZUELA",
    "DEBORA GAETE","ELIZABETH MIRANDA","ERIKA KINDERMANN","FERNANDA RÍOS",
    "FRANCISCA MAUREIRA","FRANCISCA COFRÉ","FRANCISCA VIZCAYA","GIOVANNA ARIAS",
    "GOLDIE FARÍAS","HERNÁN REYES","JAVIERA ALIAGA","JOAQUÍN ALMUNA",
    "KARIMME GUTIÉRREZ","KARINA BARRIOS","KAROLINA RIFFO","LEONARDO RÍOS",
    "LORENA ARANCIBIA","LUIS SÁNCHEZ","MACARENA BELTRÁN","MARÍA MONZÓN",
    "MARÍA GONZÁLEZ","MARISOL GUAJARDO","MATÍAS CUEVAS","NATALIA CARTES",
    "NATALY HIDALGO","NICOLE BELLO","PAOLA ÁVILA","PATRICIA NÚÑEZ",
    "PAULINA ARGOMEDO","PRISCILA VALENZUELA","REINA ORTEGA",
    "STEPHANY GUZMÁN","VÍCTOR BARRIENTOS","YADIA CERDA","YESSENIA SÁNCHEZ"
];

const HORAS = [
    "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
    "16:00","16:30","17:00"
];

const FERIADOS_2026 = ["2026-01-01","2026-04-03","2026-05-01","2026-05-21","2026-09-18","2026-12-25"];

let citas = [];
let currentDate = new Date();
let miniCalDate = new Date(); 

/*************************************************
 * INICIALIZACIÓN
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
    // Dibujar horas lateral
    const timeLabels = document.getElementById("timeLabels");
    timeLabels.innerHTML = '<div class="t-spacer"></div>' + 
        HORAS.map(h => `<div class="t-slot">${h}</div>`).join("");

    // Cargar docentes
    document.getElementById("listaDocentes").innerHTML = 
        DOCENTES_NSG.map(d => `<option value="${d}">`).join("");

    // INICIAR MINI CALENDARIO
    renderMiniCalendar();
    cargarDatos();
});

async function cargarDatos() {
    try {
        const resp = await fetch(`${SHEET_URL}?action=get`);
        const json = await resp.json();
        citas = (json.datos || []).map(c => ({
            id: c.id || c.ID,
            fecha: normalizarFecha(c.fecha || c.Fecha),
            hora: normalizarHora(c.hora || c.Hora),
            docente: c.docente || c.Docente,
            alumno: c.alumno || c.Alumno || "",
            apoderado: c.apoderado || c.Apoderado || "",
            curso: c.curso || c.Curso,
            estado: c.estado || c.Estado,
            tipo: c.tipo || c.Tipo || "Alumno",
            sala: c.sala || c.Sala
        }));
        renderWeekView();
    } catch (e) { console.error("Error cargando:", e); }
}

/*************************************************
 * VISTA SEMANAL (PRINCIPAL)
 *************************************************/
function renderWeekView() {
    const grid = document.getElementById("weekGrid");
    grid.innerHTML = "";

    let start = new Date(currentDate);
    let day = start.getDay();
    let diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    document.getElementById("weekRangeLabel").innerText = `Semana del ${start.toLocaleDateString()}`;
    const filtro = document.getElementById("filterDocente").value.toUpperCase();

    for(let i=0; i<7; i++){
        let d = new Date(start);
        d.setDate(start.getDate() + i);
        // Generamos la fecha string manualmente para evitar cambios de zona horaria
        let year = d.getFullYear();
        let month = (d.getMonth() + 1).toString().padStart(2, '0');
        let dayNum = d.getDate().toString().padStart(2, '0');
        let dStr = `${year}-${month}-${dayNum}`;

        let isHoliday = d.getDay() === 0 || FERIADOS_2026.includes(dStr);
        
        let col = document.createElement("div");
        col.className = `day-col ${isHoliday ? "holiday-col":""}`;
        col.innerHTML = `<div class="d-head">${["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i]} ${d.getDate()}</div>`;

        HORAS.forEach(h => {
            let slot = document.createElement("div");
            slot.className = "h-slot";
            slot.onclick = () => openDialog(dStr, h);
            col.appendChild(slot);
        });

        citas.forEach(c => {
            // Comparación estricta de fecha y filtro de docente
            if(c.fecha === dStr && (filtro === "" || c.docente.toUpperCase().includes(filtro))){
                let idx = HORAS.indexOf(c.hora);
                if(idx > -1){
                    let ev = document.createElement("div");
                    ev.className = `event ${c.estado === "Asistió" ? "asis" : (c.estado === "No asistió" ? "no" : "pen")}`;
                    ev.style.top = `${45 + (idx * 60)}px`;
                    
                    // Mostrar Alumno o Apoderado según el tipo
                    let texto = c.tipo === "Apoderado" ? `Ap: ${c.apoderado}` : c.alumno;
                    ev.innerHTML = `
  <strong>${c.docente.split(" ")[0]}</strong><br>
  ${texto}<br>
  <span style="
    display:inline-block;
    margin-top:2px;
    padding:1px 6px;
    font-size:9px;
    background:rgba(255,255,255,0.85);
    color:#003366;
    border-radius:8px;
    font-weight:bold;
  ">
    ${c.sala || "Sin sala"}
  </span>
`;

                    
                    ev.onclick = (e) => { e.stopPropagation(); openDialog(dStr, c.hora, c); };
                    col.appendChild(ev);
                }
            }
        });
        grid.appendChild(col);
    }
}

/*************************************************
 * MINI CALENDARIO (MENSUAL)
 *************************************************/
function renderMiniCalendar(){
    const cont = document.getElementById("miniCalendar");
    cont.innerHTML = "";
    
    let y = miniCalDate.getFullYear();
    let m = miniCalDate.getMonth();
    
    document.getElementById("miniMonthLabel").innerText = 
        new Date(y,m).toLocaleString("es",{month:"long",year:"numeric"}).toUpperCase();
    
    let firstDay = new Date(y, m, 1).getDay();
    let startSlot = (firstDay + 6) % 7; 

    for(let i=0; i<startSlot; i++) {
        cont.appendChild(document.createElement("div"));
    }
    
    let daysInMonth = new Date(y, m+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
        let div = document.createElement("div");
        // Aseguramos formato YYYY-MM-DD
        let mm = (m+1).toString().padStart(2, '0');
        let dd = d.toString().padStart(2, '0');
        let dStr = `${y}-${mm}-${dd}`;
        
        div.innerText = d;
        
        if(new Date(y,m,d).getDay() === 0 || FERIADOS_2026.includes(dStr)){
            div.className = "holiday-mark";
        }
        
        // Comparamos con la fecha seleccionada
        let currY = currentDate.getFullYear();
        let currM = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        let currD = currentDate.getDate().toString().padStart(2, '0');
        let currStr = `${currY}-${currM}-${currD}`;

        if(dStr === currStr) div.classList.add("active-day");

        div.onclick = () => { 
            currentDate = new Date(y,m,d); 
            renderWeekView(); 
            renderMiniCalendar(); 
        };
        cont.appendChild(div);
    }
}

/*************************************************
 * MODAL Y ACCIONES
 *************************************************/
function openDialog(f, h, c=null){
    const diag = document.getElementById("dialog");
    document.querySelector(".modal-title").innerText = c ? "Editar Citación" : "Nueva Citación";
    
    document.getElementById("citaId").value = c ? c.id : "";
    document.getElementById("fecha").value = f;
    document.getElementById("hora").value = h;
    document.getElementById("docente").value = c ? c.docente : "";
    document.getElementById("tipoCita").value = c ? (c.tipo || "Alumno") : "Alumno";
    document.getElementById("curso").value = c ? c.curso : "";
    
    // CARGAR AMBOS CAMPOS SIEMPRE
    document.getElementById("alumno").value = c ? c.alumno : "";
    document.getElementById("apoderado").value = c ? c.apoderado : "";
    
    document.getElementById("estado").value = c ? c.estado : "Pendiente";
    document.getElementById("sala").value = c ? (c.sala || "Sala 1") : "Sala 1";
    
    const btnReagendar = document.getElementById("btnReagendar");
    btnReagendar.style.display = c ? "block" : "none";

    diag.showModal();
}

function closeDialog(){ document.getElementById("dialog").close(); }

async function reagendar() {
    if(!confirm("¿Desea marcar esta cita como REAGENDADA?")) return;
    document.getElementById("estado").value = "Reagendada";
    guardar();
}

async function guardar(){
    const btn = document.getElementById("btnGuardar");
    btn.disabled = true;
    btn.innerText = "Guardando...";

    const p = {
        action: document.getElementById("citaId").value ? "edit" : "add",
        id: document.getElementById("citaId").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        docente: document.getElementById("docente").value,
        tipo: document.getElementById("tipoCita").value,
        curso: document.getElementById("curso").value,
        alumno: document.getElementById("alumno").value,
        apoderado: document.getElementById("apoderado").value,
        sala: document.getElementById("sala").value,
        estado: document.getElementById("estado").value
    };

    try {
        await fetch(`${SHEET_URL}?${new URLSearchParams(p)}`, { mode: "no-cors" });
        setTimeout(() => { location.reload(); }, 800);
    } catch (e) { 
        alert("Error al guardar"); 
        btn.disabled = false;
        btn.innerText = "Guardar";
    }
}

function changeWeek(v){ currentDate.setDate(currentDate.getDate() + v*7); renderWeekView(); renderMiniCalendar(); }
function changeMonth(v){ miniCalDate.setMonth(miniCalDate.getMonth() + v); renderMiniCalendar(); }

// ========================================================
// FUNCIONES DE NORMALIZACIÓN BLINDADAS
// ========================================================

function normalizarFecha(v){ 
    if(!v) return "";
    // Si es un objeto fecha, lo pasamos a string local manualmente
    // para evitar que toISOString() lo corra un día por zona horaria
    if (v instanceof Date) {
        let y = v.getFullYear();
        let m = (v.getMonth() + 1).toString().padStart(2, '0');
        let d = v.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    // Si es string ISO con hora (Ej: 2026-05-10T04:00:00.000Z)
    if(typeof v === 'string' && v.includes("T")){
        return v.split("T")[0];
    }
    return v; // Retornamos tal cual si ya es string corto
}

function normalizarHora(v){ 
    if(!v) return ""; 
    let str = v.toString();

    // Si viene fecha completa con hora
    if(str.includes("T")) {
        str = str.split("T")[1];
    }
    
    // Si viene con segundos (09:00:00) quitamos los segundos
    if(str.includes(":")){
        let partes = str.split(":");
        let h = partes[0].trim().padStart(2, "0"); // Forza "9" a "09"
        let m = partes[1].trim();
        // Si hay segundos, la parte 1 podria ser larga
        if (m.length > 2) m = m.substring(0, 2);
        
        return `${h}:${m}`;
    }
    return str; 
}

setInterval(cargarDatos, 9000);