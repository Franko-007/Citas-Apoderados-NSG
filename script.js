/*************************************************
 * PROTECCIÓN ANTI-DUPLICACIÓN
 *************************************************/
if (window.sistemaYaCargado) {
    console.warn("⚠️ Sistema ya estaba cargado, previniendo duplicación");
    throw new Error("Previniendo carga duplicada del sistema");
}
window.sistemaYaCargado = true;
console.log("✅ Sistema de Gestión de Citas cargando correctamente");

/*************************************************
 * CONFIGURACIÓN Y VARIABLES GLOBALES
 *************************************************/
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxWyTc8gn6x2shP2qcpik527PWH4r5_C_xDE9AQOXjHmA0BZ3gkhUQLZwWb-Xjj8cQ/exec";

let DOCENTES_DATA = []; 
let citas = [];
let currentDate = new Date();
let miniCalDate = new Date();

const HORAS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
const FERIADOS_2026 = ["2026-01-01","2026-04-03","2026-05-01","2026-05-21","2026-09-18","2026-12-25"];

document.addEventListener("DOMContentLoaded", () => {
    const timeLabels = document.getElementById("timeLabels");
    if (timeLabels) {
        timeLabels.innerHTML = '<div class="t-spacer"></div>' + HORAS.map(h => `<div class="t-slot">${h}</div>`).join("");
    }
    renderMiniCalendar();
    cargarDatos();
});

async function cargarDatos() {
    try {
        const r = await fetch(`${SHEET_URL}?action=get`);
        const j = await r.json();
        
        if (j.docentes) {
            DOCENTES_DATA = j.docentes.map(d => ({
                nombre: d.nombre.toUpperCase(),
                email: d.email
            }));
            actualizarDatalistDocentes();
        }

        if (j.datos) {
            citas = j.datos.map(c => {
                // Normalizar estado para asegurar consistencia
                let estadoNormalizado = "Pendiente";
                if (c.estado) {
                    const estadoStr = c.estado.toString().trim();
                    if (estadoStr === "Asistió") {
                        estadoNormalizado = "Asistió";
                    } else if (estadoStr === "No asistió") {
                        estadoNormalizado = "No asistió";
                    } else if (estadoStr === "Reagendada") {
                        estadoNormalizado = "Reagendada";
                    } else if (estadoStr === "Pendiente" || estadoStr === "Email") {
                        estadoNormalizado = "Pendiente";
                    }
                }
                
                const citaNormalizada = {
                    id: c.id, 
                    fecha: normalizarFecha(c.fecha),
                    hora: normalizarHora(c.hora),
                    docente: c.docente || "", 
                    alumno: c.alumno || "", 
                    apoderado: c.apoderado || "",
                    curso: c.curso || "", 
                    estado: estadoNormalizado,
                    tipo: c.tipo || "Email",
                    sala: c.sala || "", 
                    email: c.email || ""
                };
                
                // Log para depuración (se puede comentar después)
                console.log(`Cita cargada: ${citaNormalizada.fecha} - Estado: ${citaNormalizada.estado}`);
                
                return citaNormalizada;
            });
            renderWeekView();
        }
    } catch (e) { 
        console.error("Error cargando datos:", e); 
    }
}

function actualizarDatalistDocentes() {
    const datalist = document.getElementById("listaDocentes");
    if (datalist) {
        datalist.innerHTML = "";
        DOCENTES_DATA.sort((a,b) => a.nombre.localeCompare(b.nombre)).forEach(d => {
            const opt = document.createElement("option"); 
            opt.value = d.nombre; 
            datalist.appendChild(opt);
        });
    }
}

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
    if (resultados.length > 0) {
        resultados.slice(0, 10).forEach(docente => {
            const div = document.createElement("div");
            div.className = "autocomplete-item"; 
            div.textContent = docente.nombre;
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
}

function renderWeekView() {
    const grid = document.getElementById("weekGrid"); 
    grid.innerHTML = "";
    
    // CORRECCIÓN MEJORADA: Cálculo de inicio de semana usando UTC para evitar desfases
    let start = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
    let day = start.getUTCDay();
    let diff = start.getUTCDate() - day + (day === 0 ? -6 : 1);
    start.setUTCDate(diff);
    
    document.getElementById("weekRangeLabel").innerText = `Semana del ${start.toLocaleDateString("es-CL")}`;
    const filtro = document.getElementById("filterDocente").value.toUpperCase();

    for (let i = 0; i < 7; i++) {
        let d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
        
        // Formatear fecha usando UTC
        let year = d.getUTCFullYear();
        let month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        let dayNum = d.getUTCDate().toString().padStart(2, '0');
        let dStr = `${year}-${month}-${dayNum}`;
        
        let isHoliday = d.getUTCDay() === 0 || FERIADOS_2026.includes(dStr);
        
        let col = document.createElement("div");
        col.className = `day-col ${isHoliday ? "holiday-col" : ""}`;
        col.innerHTML = `<div class="d-head">${["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i]} ${d.getUTCDate()}</div>`;

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
                    
                    // CORRECCIÓN: Asignar clase correcta según el estado exacto
                    let claseEstado = "pen"; // Por defecto pendiente
                    const estadoNormalizado = c.estado ? c.estado.trim() : "Pendiente";
                    
                    if (estadoNormalizado === "Asistió") {
                        claseEstado = "asis";
                    } else if (estadoNormalizado === "No asistió") {
                        claseEstado = "no";
                    } else if (estadoNormalizado === "Reagendada") {
                        claseEstado = "reagendada";
                    } else {
                        // Email y Pendiente se muestran como pendiente (amarillo)
                        claseEstado = "pen";
                    }
                    
                    ev.className = `event ${claseEstado}`;
                    ev.style.top = `${70 + idx * 80}px`;
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
    
    const citaId = c ? c.id : "";
    console.log("Abriendo diálogo - ID de cita:", citaId);
    console.log("Datos de cita completos:", c);
    
    document.getElementById("citaId").value = citaId;
    document.getElementById("fecha").value = f;
    document.getElementById("hora").value = h;
    document.getElementById("docente").value = c ? c.docente : "";
    document.getElementById("emailDocente").value = c ? c.email : "";
    document.getElementById("curso").value = c ? c.curso : "";
    document.getElementById("alumno").value = c ? c.alumno : "";
    document.getElementById("apoderado").value = c ? c.apoderado : "";
    document.getElementById("emailApoderado").value = c ? (c.emailapod || "") : "";
    document.getElementById("estado").value = c ? c.estado : "Pendiente";
    document.getElementById("sala").value = c ? c.sala : "Sala 1";
    document.getElementById("btnReagendar").style.display = c ? "block" : "none";
    
    console.log("Estado cargado en el formulario:", document.getElementById("estado").value);
    console.log("Email apoderado cargado:", document.getElementById("emailApoderado").value);
}

function closeDialog(){ document.getElementById("dialog").close(); }

async function guardar() {
    const btn = document.getElementById("btnGuardar");
    
    // Obtener valores del formulario
    const citaId = document.getElementById("citaId").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const docente = document.getElementById("docente").value.trim().toUpperCase();
    const email = document.getElementById("emailDocente").value.trim();
    const curso = document.getElementById("curso").value;
    const alumno = document.getElementById("alumno").value;
    const apoderado = document.getElementById("apoderado").value;
    const emailApoderado = document.getElementById("emailApoderado").value.trim();
    const sala = document.getElementById("sala").value;
    const estado = document.getElementById("estado").value;
    
    // Validación básica
    if (!fecha || !hora || !docente) {
        alert("⚠️ Por favor completa Fecha, Hora y Docente.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Guardando...";
    
    console.log("Guardando cita con estado:", estado);
    console.log("Email apoderado:", emailApoderado);

    try {
        // Construir parámetros
        const params = new URLSearchParams({
            action: citaId ? "edit" : "add",
            fecha: fecha,
            hora: hora,
            docente: docente,
            email: email,
            tipo: "Email",
            enviarEmail: "false",
            curso: curso,
            alumno: alumno,
            apoderado: apoderado,
            emailApoderado: emailApoderado,
            sala: sala,
            estado: estado
        });
        
        // Si es edición, agregar el ID
        if (citaId) {
            params.append("id", citaId);
        }
        
        console.log("Enviando petición:", `${SHEET_URL}?${params.toString()}`);
        
        const response = await fetch(`${SHEET_URL}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        
        const result = await response.json();
        console.log("Respuesta del servidor:", result);
        
        if (result.ok) {
            alert("✅ Guardado exitosamente!");
            closeDialog();
            
            // Esperar un momento antes de recargar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Recargar datos desde el servidor
            await cargarDatos();
        } else {
            alert("⚠️ Error: " + (result.error || "No se pudo guardar"));
            console.error("Error del servidor:", result);
        }
    } catch (e) {
        console.error("Error en guardar():", e);
        alert("❌ Error de conexión. Recargando página...");
        setTimeout(() => location.reload(), 1500);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar";
    }
}

async function reagendar() {
    document.getElementById("estado").value = "Reagendada";
    await guardar();
}

function changeWeek(v){ currentDate.setDate(currentDate.getDate() + v*7); renderWeekView(); renderMiniCalendar(); }
function changeMonth(v){ miniCalDate.setMonth(miniCalDate.getMonth() + v); renderMiniCalendar(); }

// CORRECCIÓN: Función mejorada para evitar desfase de día en TODOS los meses
function normalizarFecha(v){
    if (!v) return "";
    
    // Si es un string YYYY-MM-DD lo usamos directo (formato correcto)
    if (typeof v === "string") {
        let cleanStr = v.trim();
        // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
            return cleanStr;
        }
        // Si tiene formato YYYY-MM-DDTHH:mm, extraer solo la fecha
        if (cleanStr.includes("T")) {
            return cleanStr.split("T")[0];
        }
    }
    
    // Si es un objeto Date
    if (v instanceof Date) {
        if(isNaN(v.getTime())) return "";
        
        // Usar getUTCFullYear, getUTCMonth y getUTCDate para evitar problemas de zona horaria
        let year = v.getUTCFullYear();
        let month = (v.getUTCMonth() + 1).toString().padStart(2, '0');
        let day = v.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Intentar convertir a Date si no es string ni Date
    let d = new Date(v);
    if(isNaN(d.getTime())) return "";
    
    let year = d.getUTCFullYear();
    let month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    let day = d.getUTCDate().toString().padStart(2, '0');
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
        // Crear fecha en formato YYYY-MM-DD directamente sin usar Date object
        let dStr = `${y}-${(m+1).toString().padStart(2,"0")}-${d.toString().padStart(2,"0")}`;
        if (new Date(y,m,d).getDay() === 0 || FERIADOS_2026.includes(dStr)) div.classList.add("holiday-mark");
        div.onclick = () => { 
            // Crear fecha usando UTC para evitar desfases
            currentDate = new Date(Date.UTC(y, m, d)); 
            renderWeekView(); 
            renderMiniCalendar(); 
        };
        cont.appendChild(div);
    }
}

setInterval(cargarDatos, 60000);
