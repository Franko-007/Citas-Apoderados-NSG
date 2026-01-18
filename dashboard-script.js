/**
 * Dashboard NSG 2026 - Script de Gestión y Visualización
 * Desarrollado por Franco
 */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbwgUJA1Fv973LTwxwUy8oiYxP09XSh8yV1KWEsC9NVD9rXW8R-V5RjktDX3x1kAbJI/exec";

let chartEstados, chartDocentes, chartDias;

// Configuración global de fuentes para Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#697386";

/* =====================================================
   PLUGIN: MOSTRAR % DENTRO DEL DONUT (MEJORADO)
===================================================== */
Chart.register({
    id: "porcentajeInterior",
    afterDraw(chart) {
        if (chart.config.type !== "doughnut") return;

        const { ctx, chartArea: { width, height } } = chart;
        const dataset = chart.data.datasets[0];
        const total = dataset.data.reduce((a, b) => a + b, 0);

        chart.getDatasetMeta(0).data.forEach((arc, i) => {
            const value = dataset.data[i];
            if (!value || value === 0) return;

            const percentage = Math.round((value / total) * 100) + "%";
            const pos = arc.tooltipPosition();

            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.font = "bold 13px Inter";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(percentage, pos.x, pos.y);
            ctx.restore();
        });
    }
});

/* =====================================================
   CARGA Y PROCESAMIENTO DE DATOS
===================================================== */
async function cargarDashboard() {
    try {
        const resp = await fetch(`${SHEET_URL}?action=get`);
        const json = await resp.json();
        const citas = json.datos || [];

        // Actualizar KPIs con animación simple
        actualizarKPI("totalCitas", citas.length);
        actualizarKPI("asisCitas", citas.filter(c => c.estado === "Asistió").length);
        actualizarKPI("noAsisCitas", citas.filter(c => c.estado === "No asistió").length);
        actualizarKPI("penCitas", citas.filter(c => c.estado === "Pendiente").length);

        // Procesar Agrupaciones
        const porEstado = { "Asistió": 0, "Pendiente": 0, "No asistió": 0 };
        const porDocente = {};
        const porDia = {};

        citas.forEach(c => {
            if(porEstado.hasOwnProperty(c.estado)) porEstado[c.estado]++;
            
            porDocente[c.docente] = (porDocente[c.docente] || 0) + 1;
            
            const fecha = c.fecha ? c.fecha.substring(0, 10) : "Sin fecha";
            porDia[fecha] = (porDia[fecha] || 0) + 1;
        });

        renderEstados(porEstado);
        renderDocentes(porDocente);
        renderDias(porDia);

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

function actualizarKPI(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor;
}

/* =====================================================
   RENDERIZADO DE GRÁFICOS
===================================================== */

function renderEstados(data) {
    const ctx = document.getElementById("chartEstados").getContext("2d");
    if (chartEstados) chartEstados.destroy();

    chartEstados = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Asistió", "Pendiente", "No asistió"],
            datasets: [{
                data: [data["Asistió"], data["Pendiente"], data["No asistió"]],
                backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
                hoverOffset: 15,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: { position: "bottom", labels: { usePointStyle: true, padding: 20 } }
            }
        }
    });
}

function renderDocentes(data) {
    const ctx = document.getElementById("chartDocentes").getContext("2d");
    if (chartDocentes) chartDocentes.destroy();

    const ordenado = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    chartDocentes = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ordenado.map(d => d[0]),
            datasets: [{
                label: "Citas asignadas",
                data: ordenado.map(d => d[1]),
                backgroundColor: "#003366",
                borderRadius: 8,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { stepSize: 1 } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderDias(data) {
    const ctx = document.getElementById("chartDias").getContext("2d");
    if (chartDias) chartDias.destroy();

    const fechas = Object.keys(data).sort();
    
    // Crear gradiente para la línea
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(0, 51, 102, 0.2)");
    gradient.addColorStop(1, "rgba(0, 51, 102, 0)");

    chartDias = new Chart(ctx, {
        type: "line",
        data: {
            labels: fechas,
            datasets: [{
                label: "Citas por día",
                data: fechas.map(f => data[f]),
                borderColor: "#003366",
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#003366",
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: "#f0f0f0" } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* =====================================================
   EXPORTAR PDF (AJUSTADO PARA EL NUEVO DISEÑO)
===================================================== */
function exportarPDF() {
    const contenedor = document.querySelector(".main-content");
    document.body.classList.add("pdf-mode");

    // Header para el PDF
    const header = document.createElement("div");
    header.style.cssText = "display:flex; align-items:center; gap:20px; border-bottom:3px solid #003366; padding-bottom:15px; margin-bottom:20px;";
    header.innerHTML = `
        <img src="https://i.postimg.cc/sxxwfhwK/LOGO-LBSNG-06-237x300.png" style="height:70px;">
        <div style="flex-grow:1">
            <h2 style="margin:0; color:#003366; font-size:22px;">Liceo Bicentenario NSG</h2>
            <p style="margin:0; font-size:14px; color:#444;">Reporte Ejecutivo de Gestión - 2026</p>
        </div>
        <div style="text-align:right; font-size:12px; color:#666;">
            Emitido: ${new Date().toLocaleString("es-CL")}
        </div>
    `;

    // Footer para el PDF
    const footer = document.createElement("div");
    footer.style.cssText = "margin-top:30px; border-top:1px solid #ccc; padding-top:20px; display:flex; justify-content:space-between; font-size:12px;";
    footer.innerHTML = `
        <div>Sistema NSG Digital - Módulo Analytics</div>
        <div style="text-align:center; min-width:200px;">
            <div style="height:60px; margin-bottom:5px;">
                <img src="https://i.postimg.cc/9QK3t9Jk/timbre-ejemplo.png" style="height:50px; opacity:0.6;">
            </div>
            <div style="border-top:1px solid #000; padding-top:5px;">Firma y Timbre Dirección</div>
        </div>
    `;

    contenedor.prepend(header);
    contenedor.appendChild(footer);

    const opciones = {
        margin: 10,
        filename: `Dashboard_NSG_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opciones).from(contenedor).save().then(() => {
        header.remove();
        footer.remove();
        document.body.classList.remove("pdf-mode");
    });
}

/* =====================================================
   INICIALIZACIÓN
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarDashboard();
    // Actualización automática cada 30 segundos para no saturar
    setInterval(cargarDashboard, 30000);
});
