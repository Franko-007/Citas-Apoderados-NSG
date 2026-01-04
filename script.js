/*************************************************
 * CONFIGURACIÓN
 *************************************************/
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzsTAdxSG2cQKJtAapRNsw0oWhgLhzTkC8qvdRuL32aAOGPJjEkrH2H3I0wY-Lu1ZU/exec";

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
/* ===============================
   BUSCADOR DOCENTES
   =============================== */
function filtrarDocentes() {
  const input = document.getElementById("docente");
  const list = document.getElementById("docenteList");
  const texto = input.value.trim();

  list.innerHTML = "";
  list.style.display = "none";

  if (texto.length < 1) return;

  const normalizar = str =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  const filtro = normalizar(texto);

  const resultados = DOCENTES_NSG.filter(nombre =>
    normalizar(nombre).includes(filtro)
  );

  if (resultados.length === 0) return;

  resultados.slice(0, 20).forEach(nombre => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.textContent = nombre;

    div.onclick = () => {
      input.value = nombre;
      list.innerHTML = "";
      list.style.display = "none";
    };

    list.appendChild(div);
  });

  list.style.display = "block";
}

const HORAS = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00"
];

const FERIADOS_2026 = [
  "2026-01-01","2026-04-03","2026-05-01",
  "2026-05-21","2026-09-18","2026-12-25"
];

let citas = [];
let currentDate = new Date();
let miniCalDate = new Date();

/*************************************************
 * INIT
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     CARGA LISTA COMPLETA DOCENTES
     =============================== */
  const datalist = document.getElementById("listaDocentes");
  if (datalist) {
    datalist.innerHTML = "";
    DOCENTES_NSG
      .sort((a, b) => a.localeCompare(b, "es"))
      .forEach(nombre => {
        const opt = document.createElement("option");
        opt.value = nombre;
        datalist.appendChild(opt);
      });
  }

  /* ===============================
     COLUMNA HORAS
     =============================== */
  const timeLabels = document.getElementById("timeLabels");
  if (timeLabels) {
    timeLabels.innerHTML =
      '<div class="t-spacer"></div>' +
      HORAS.map(h => `<div class="t-slot">${h}</div>`).join("");
  }

  /* ===============================
     INICIO CALENDARIO
     =============================== */
  renderMiniCalendar();
  cargarDatos();
});

/*************************************************
 * CARGA DATOS
 *************************************************/
async function cargarDatos() {
  try {
    const r = await fetch(`${SHEET_URL}?action=get`);
    const j = await r.json();
    if (!j.datos) return;

    citas = j.datos.map(c => ({
  id: c.id,
  fecha: normalizarFecha(c.fecha),
  hora: normalizarHora(c.hora),
  docente: c.docente || "",
  alumno: c.alumno || "",
  apoderado: c.apoderado || "",
  curso: c.curso || "",
  estado: c.estado || "Pendiente",
  tipo: c.tipo || "Alumno",
  sala: c.sala || "",
  email: c.email || ""
}));


    renderWeekView();
  } catch (e) {
    console.error("Error cargando citas", e);
  }
}

/*************************************************
 * VISTA SEMANAL
 *************************************************/
function renderWeekView() {
  const grid = document.getElementById("weekGrid");
  grid.innerHTML = "";

  let start = new Date(currentDate);
  let day = start.getDay();
  let diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  document.getElementById("weekRangeLabel").innerText =
    `Semana del ${start.toLocaleDateString("es-CL")}`;

  const filtro = document.getElementById("filterDocente").value.toUpperCase();

  for (let i = 0; i < 7; i++) {
    let d = new Date(start);
    d.setDate(start.getDate() + i);

    let y = d.getFullYear();
    let m = (d.getMonth()+1).toString().padStart(2,"0");
    let da = d.getDate().toString().padStart(2,"0");
    let dStr = `${y}-${m}-${da}`;

    let isHoliday = d.getDay() === 0 || FERIADOS_2026.includes(dStr);

    let col = document.createElement("div");
    col.className = `day-col ${isHoliday ? "holiday-col" : ""}`;
    col.innerHTML = `<div class="d-head">${["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i]} ${da}</div>`;

    HORAS.forEach(h => {
      let slot = document.createElement("div");
      slot.className = "h-slot";
      slot.onclick = () => openDialog(dStr, h);
      col.appendChild(slot);
    });

    citas.forEach(c => {
      if (c.fecha === dStr && (filtro === "" || c.docente.toUpperCase().includes(filtro))) {
        let idx = HORAS.indexOf(c.hora);
        if (idx > -1) {
          let ev = document.createElement("div");
          ev.className = `event ${c.estado === "Asistió" ? "asis" : c.estado === "No asistió" ? "no" : "pen"}`;
          ev.style.top = `${70 + idx * 80}px`;


          let texto = c.tipo === "Email" ? c.email :
                       c.tipo === "Apoderado" ? `Ap: ${c.apoderado}` :
                       c.alumno;

         let detalle =
  c.tipo === "Email" && c.email
    ? c.email
    : c.alumno
      ? c.alumno
      : c.apoderado
        ? `Ap: ${c.apoderado}`
        : "";

            const apellido = c.docente
  ? c.docente.trim().split(" ").slice(-1)[0]
  : "";

            ev.innerHTML = `
  <div class="ev-docente">${c.docente}</div>
  <div class="ev-detalle">${detalle}</div>
  <div class="ev-footer">
    <span class="ev-sala">${c.sala || "Sin sala"}</span>
    <span class="ev-time">${c.hora}</span>
  </div>
`;




          ev.onclick = e => {
            e.stopPropagation();
            openDialog(dStr, c.hora, c);
          };

          col.appendChild(ev);
        }
      }
    });

    grid.appendChild(col);
  }
}

/*************************************************
 * MINI CALENDARIO
 *************************************************/
function renderMiniCalendar() {
  const cont = document.getElementById("miniCalendar");
  cont.innerHTML = "";

  let y = miniCalDate.getFullYear();
  let m = miniCalDate.getMonth();

  document.getElementById("miniMonthLabel").innerText =
    new Date(y, m).toLocaleString("es-CL", { month:"long", year:"numeric" }).toUpperCase();

  let first = new Date(y, m, 1).getDay();
  let start = (first + 6) % 7;

  for (let i = 0; i < start; i++) cont.appendChild(document.createElement("div"));

  let days = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    let div = document.createElement("div");
    let mm = (m+1).toString().padStart(2,"0");
    let dd = d.toString().padStart(2,"0");
    let dStr = `${y}-${mm}-${dd}`;

    div.innerText = d;

    if (new Date(y,m,d).getDay() === 0 || FERIADOS_2026.includes(dStr)) {
      div.classList.add("holiday-mark");
    }

    div.onclick = () => {
      currentDate = new Date(y,m,d);
      renderWeekView();
      renderMiniCalendar();
    };

    cont.appendChild(div);
  }
}

/*************************************************
 * MODAL
 *************************************************/
function openDialog(f,h,c=null){
  document.getElementById("dialog").showModal();
  document.getElementById("citaId").value = c ? c.id : "";
  document.getElementById("fecha").value = f;
  document.getElementById("hora").value = h;
  document.getElementById("docente").value = c ? c.docente : "";
  document.getElementById("tipoCita").value = c ? c.tipo : "Alumno";
  document.getElementById("curso").value = c ? c.curso : "";
  document.getElementById("alumno").value = c ? c.alumno : "";
  document.getElementById("apoderado").value = c ? c.apoderado : "";
  document.getElementById("estado").value = c ? c.estado : "Pendiente";
  document.getElementById("sala").value = c ? c.sala : "Sala 1";
  if (document.getElementById("emailDocente"))
    document.getElementById("emailDocente").value = c ? c.email : "";
  if (typeof toggleEmail === "function") toggleEmail();
}

function closeDialog(){ document.getElementById("dialog").close(); }

/*************************************************
 * GUARDAR
 *************************************************/
async function guardar(){
  const email = document.getElementById("emailDocente")?.value || "";

  const p = {
    action: document.getElementById("citaId").value ? "edit" : "add",
    id: document.getElementById("citaId").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    docente: document.getElementById("docente").value,

    // 🔒 FIJO: siempre citación por email
    tipo: "Email",
    enviarEmail: true,

    curso: document.getElementById("curso").value,
    alumno: document.getElementById("alumno").value,
    apoderado: document.getElementById("apoderado").value,
    sala: document.getElementById("sala").value,
    estado: document.getElementById("estado").value,

    // 📧 uno o varios correos separados por coma
    email: email
  };

  await fetch(`${SHEET_URL}?${new URLSearchParams(p)}`, {
    mode: "no-cors"
  });

  setTimeout(() => location.reload(), 700);
}


/*************************************************
 * NAVEGACIÓN
 *************************************************/
function changeWeek(v){
  currentDate.setDate(currentDate.getDate() + v*7);
  renderWeekView();
  renderMiniCalendar();
}

function changeMonth(v){
  miniCalDate.setMonth(miniCalDate.getMonth() + v);
  renderMiniCalendar();
}
function normalizarFecha(v){
  if (!v) return "";
  if (v instanceof Date) {
    let y = v.getFullYear();
    let m = (v.getMonth()+1).toString().padStart(2,"0");
    let d = v.getDate().toString().padStart(2,"0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "string") {
    if (v.includes("T")) return v.split("T")[0];
    return v;
  }
  return "";
}

function normalizarHora(v){
  if (!v) return "";

  // Si viene como Date
  if (v instanceof Date) {
    let h = v.getHours().toString().padStart(2,"0");
    let m = v.getMinutes().toString().padStart(2,"0");
    return `${h}:${m}`;
  }

  // Si viene como string (09:00:00 o 09:00)
  let s = v.toString().trim();

  if (s.includes("T")) {
    s = s.split("T")[1];
  }

  if (s.includes(":")) {
    let parts = s.split(":");
    return `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}`;
  }

  return s;
}


setInterval(cargarDatos, 9000);
