/**
 * Dashboard NSG 2026 - Script de Gestión y Visualización
 * Desarrollado por Franco - Versión Final Optimizada (PDF Corregido)
 */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbwgUJA1Fv973LTwxwUy8oiYxP09XSh8yV1KWEsC9NVD9rXW8R-V5RjktDX3x1kAbJI/exec";

let chartEstados, chartDocentes, chartDias;
let datosOriginales = []; 

// Configuración global de Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#697386";

async function cargarDashboard() {
    const btnRef = document.querySelector(".btn-refresh i");
    if(btnRef) btnRef.classList.add("fa-spin");

    try {
        const resp = await fetch(`${SHEET_URL}?action=get`);
        const json = await resp.json();
        datosOriginales = json.datos || [];

        poblarFiltroDocentes(datosOriginales);
        aplicarFiltros(); 

    } catch (error) {
        console.error("Error cargando datos:", error);
    } finally {
        if(btnRef) setTimeout(() => btnRef.classList.remove("fa-spin"), 1000);
    }
}

function poblarFiltroDocentes(datos) {
    const select = document.getElementById("filterDocente");
    if (!select) return;
    
    const valorActual = select.value;
    const nombresLimpios = datos.map(d => d.docente ? d.docente.trim().toUpperCase() : "");
    const docentesUnicos = [...new Set(nombresLimpios)].filter(n => n !== "").sort();

    select.innerHTML = '<option value="todos">Todos los docentes</option>';
    
    docentesUnicos.forEach(doc => {
        const opt = document.createElement("option");
        opt.value = doc;
        opt.textContent = doc.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        select.appendChild(opt);
    });

    if (valorActual && select.querySelector(`option[value="${valorActual}"]`)) {
        select.value = valorActual;
    }
}

function aplicarFiltros() {
    const mesSel = document.getElementById("filterMes").value;
    const docSel = document.getElementById("filterDocente").value;
    const infoContainer = document.getElementById("infoDocenteContainer");
    const fechaTexto = document.getElementById("fechaCitaDocente");

    const filtrados = datosOriginales.filter(c => {
        const mesCita = c.fecha ? c.fecha.substring(5, 7) : "";
        const docenteNormalizado = c.docente ? c.docente.trim().toUpperCase() : "";
        
        const cumpleMes = (mesSel === "todos" || mesCita === mesSel);
        const cumpleDoc = (docSel === "todos" || docenteNormalizado === docSel);
        
        return cumpleMes && cumpleDoc;
    });

    if (docSel !== "todos" && filtrados.length > 0) {
        const fechasLegibles = filtrados.map(c => {
            const f = new Date(c.fecha);
            return f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
        });
        fechaTexto.innerText = [...new Set(fechasLegibles)].join(" | ");
        infoContainer.style.display = "block";
    } else {
        infoContainer.style.display = "none";
    }

    actualizarKPIs(filtrados);
    generarInsights(filtrados);
    procesarGraficos(filtrados, mesSel, docSel);
    actualizarTablaDetalle(filtrados); 
}

function actualizarTablaDetalle(datos) {
    const tbody = document.getElementById("tbodyCitas");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px;">No se encontraron registros.</td></tr>';
        return;
    }

    const datosOrdenados = [...datos].sort((a, b) => {
        const fechaA = new Date(a.fecha.split('T')[0] + 'T' + (a.hora || '00:00'));
        const fechaB = new Date(b.fecha.split('T')[0] + 'T' + (b.hora || '00:00'));
        return fechaB - fechaA;
    });

    datosOrdenados.forEach(cita => {
        const tr = document.createElement("tr");
        let fechaLegible = cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : "---";
        
        let badgeClass = "badge-pendiente";
        if (cita.estado === "Asistió") badgeClass = "badge-asistio";
        if (cita.estado === "No asistió") badgeClass = "badge-noasistio";

        tr.innerHTML = `
            <td><strong>${fechaLegible}</strong></td>
            <td>${cita.hora || "---"}</td>
            <td>${cita.docente || "---"}</td>
            <td style="text-align: center;"><span class="badge ${badgeClass}">${cita.estado || 'Pendiente'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarPorEstado(estado) {
    if (estado === 'todos') {
        resetearFiltros();
        return;
    }
    const filtrados = datosOriginales.filter(c => c.estado === estado);
    document.getElementById("filterMes").value = "todos";
    document.getElementById("filterDocente").value = "todos";
    document.getElementById("infoDocenteContainer").style.display = "none";
    
    actualizarKPIs(filtrados);
    generarInsights(filtrados);
    procesarGraficos(filtrados, "todos", "todos");
    actualizarTablaDetalle(filtrados);
}

function resetearFiltros() {
    document.getElementById("filterMes").value = "todos";
    document.getElementById("filterDocente").value = "todos";
    aplicarFiltros();
}

function actualizarKPIs(citas) {
    document.getElementById("totalCitas").innerText = citas.length;
    document.getElementById("asisCitas").innerText = citas.filter(c => c.estado === "Asistió").length;
    document.getElementById("noAsisCitas").innerText = citas.filter(c => c.estado === "No asistió").length;
    document.getElementById("penCitas").innerText = citas.filter(c => c.estado === "Pendiente").length;
}

function generarInsights(citas) {
    const container = document.getElementById("insightsContainer");
    if(!container) return;
    container.innerHTML = ""; 
    const total = citas.length;
    if (total === 0) return;

    const inasistidas = citas.filter(c => c.estado === "No asistió").length;
    const tasaInasistencia = (inasistidas / total) * 100;

    if (total > 5 && tasaInasistencia > 20) {
        container.innerHTML += `<div class="insight-card warning" style="background:#fff3cd; color:#856404; padding:15px; border-radius:10px; margin-bottom:10px; display:flex; align-items:center; gap:10px; border:1px solid #ffeeba;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Tasa de inasistencia elevada (${tasaInasistencia.toFixed(1)}%).</span>
        </div>`;
    }
}

function procesarGraficos(citas, mesSel, docSel) {
    const porEstado = { "Asistió": 0, "Pendiente": 0, "No asistió": 0 };
    const porDocente = {};
    const porDia = {};

    citas.forEach(c => {
        if(porEstado.hasOwnProperty(c.estado)) porEstado[c.estado]++;
        const docName = c.docente ? c.docente.trim().toUpperCase() : "SIN DOCENTE";
        porDocente[docName] = (porDocente[docName] || 0) + 1;
        const fecha = c.fecha ? c.fecha.substring(0, 10) : "Sin fecha";
        porDia[fecha] = (porDia[fecha] || 0) + 1;
    });

    renderEstados(porEstado);
    renderDocentes(porDocente, mesSel);
    renderDias(porDia);
}

function renderEstados(data) {
    const ctx = document.getElementById("chartEstados").getContext("2d");
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: "75%", plugins: { legend: { position: "bottom" } } }
    });
}

function renderDocentes(data, mesSel) {
    const ctx = document.getElementById("chartDocentes").getContext("2d");
    if (chartDocentes) chartDocentes.destroy();

    let labels, datasetLabel, datasetData;
    const ordenado = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
    labels = ordenado.map(d => d[0].toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
    datasetLabel = "Citas"; 
    datasetData = ordenado.map(d => d[1]);

    chartDocentes = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{ label: datasetLabel, data: datasetData, backgroundColor: "#003366", borderRadius: 8 }]
        },
        options: { 
            indexAxis: 'y', 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } 
        }
    });
}

function renderDias(data) {
    const ctx = document.getElementById("chartDias").getContext("2d");
    if (chartDias) chartDias.destroy();
    const fechas = Object.keys(data).sort();
    chartDias = new Chart(ctx, {
        type: "line",
        data: {
            labels: fechas,
            datasets: [{ label: "Citas", data: fechas.map(f => data[f]), borderColor: "#003366", tension: 0.4, fill: true, backgroundColor: "rgba(0, 51, 102, 0.1)" }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

/**
 * CORREGIDO: Función de exportación para evitar cortes en el pie de página
 */
function exportarPDF() {
    const contenedor = document.querySelector(".main-content");
    const selectorMes = document.getElementById("filterMes");
    const nombreMes = selectorMes.options[selectorMes.selectedIndex].text;
    const esMesEspecifico = selectorMes.value !== "todos";
    
    const fechaActual = new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    document.getElementById("pdf-titulo-reporte").innerText = esMesEspecifico ? `REPORTE MENSUAL: ${nombreMes}` : "REPORTE EJECUTIVO GENERAL";
    document.getElementById("pdf-fecha-emision").innerText = `Emitido el: ${fechaActual}`;

    window.scrollTo(0,0);
    document.body.classList.add("pdf-mode");

    const nombreArchivo = esMesEspecifico ? `Reporte_${nombreMes}_NSG_2026.pdf` : `Reporte_General_NSG_2026.pdf`;

    const opt = {
        margin: [5, 5, 5, 5], // Márgenes más ajustados para ganar espacio
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 1.8, // Escala ligeramente reducida para evitar desbordes
            useCORS: true, 
            logging: false,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(contenedor).save().then(() => {
        document.body.classList.remove("pdf-mode");
    }).catch(err => {
        console.error("Error al exportar PDF:", err);
        document.body.classList.remove("pdf-mode");
    });
}

document.addEventListener("DOMContentLoaded", cargarDashboard);
