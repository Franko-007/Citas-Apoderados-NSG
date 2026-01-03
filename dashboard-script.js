const SHEET_URL = "https://script.google.com/macros/s/AKfycbxVNZAjJis9-w9e9P-xlzsE_792YiY1xqXwKoS7kywM1Dr8sZvIgLvRsixiDQE-uF0/exec";

let chartEstados, chartDocentes, chartDias;

/* =====================================================
   PLUGIN: MOSTRAR % DENTRO DEL DONUT
===================================================== */
Chart.register({
    id: "porcentajeInterior",
    afterDraw(chart) {
        if (chart.config.type !== "doughnut") return;

        const { ctx } = chart;
        const dataset = chart.data.datasets[0];
        const total = dataset.data.reduce((a, b) => a + b, 0);

        chart.getDatasetMeta(0).data.forEach((arc, i) => {
            const value = dataset.data[i];
            if (!value) return;

            const percentage = Math.round((value / total) * 100) + "%";
            const pos = arc.tooltipPosition();

            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 16px Segoe UI";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(percentage, pos.x, pos.y);
            ctx.restore();
        });
    }
});

/* =====================================================
   CARGA DASHBOARD
===================================================== */
async function cargarDashboard() {
    const resp = await fetch(`${SHEET_URL}?action=get`);
    const json = await resp.json();
    const citas = json.datos || [];

    // KPIs
    totalCitas.innerText = citas.length;
    asisCitas.innerText = citas.filter(c => c.estado === "Asistió").length;
    noAsisCitas.innerText = citas.filter(c => c.estado === "No asistió").length;
    penCitas.innerText = citas.filter(c => c.estado === "Pendiente").length;

    // ===== AGRUPACIONES =====
    const porEstado = { Asistió: 0, Pendiente: 0, "No asistió": 0 };
    const porDocente = {};
    const porDia = {};

    citas.forEach(c => {
        porEstado[c.estado] = (porEstado[c.estado] || 0) + 1;
        porDocente[c.docente] = (porDocente[c.docente] || 0) + 1;
        const fecha = c.fecha.substring(0, 10);
        porDia[fecha] = (porDia[fecha] || 0) + 1;
    });

    renderEstados(porEstado);
    renderDocentes(porDocente);
    renderDias(porDia);
}

/* =====================================================
   GRÁFICOS
===================================================== */
function renderEstados(data) {
    if (chartEstados) chartEstados.destroy();

    chartEstados = new Chart(chartEstadosEl, {
        type: "doughnut",
        data: {
            labels: ["Asistió", "Pendiente", "No asistió"],
            datasets: [{
                data: [
                    data["Asistió"] || 0,
                    data["Pendiente"] || 0,
                    data["No asistió"] || 0
                ],
                backgroundColor: [
                    "#2ecc71", // Asistió (KPI verde)
                    "#f1c40f", // Pendiente (KPI amarillo)
                    "#e74c3c"  // No asistió (KPI rojo)
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: {
                    position: "top"
                }
            }
        }
    });
}

function renderDocentes(data) {
    if (chartDocentes) chartDocentes.destroy();

    const ordenado = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    chartDocentes = new Chart(chartDocentesEl, {
        type: "bar",
        data: {
            labels: ordenado.map(d => d[0]),
            datasets: [{
                label: "Citas",
                data: ordenado.map(d => d[1])
            }]
        },
        options: {
            responsive: true,
            indexAxis: "y"
        }
    });
}

function renderDias(data) {
    if (chartDias) chartDias.destroy();

    const fechas = Object.keys(data).sort();

    chartDias = new Chart(chartDiasEl, {
        type: "line",
        data: {
            labels: fechas,
            datasets: [{
                label: "Citas",
                data: fechas.map(f => data[f]),
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });
}

/* =====================================================
   INIT
===================================================== */
const chartEstadosEl = document.getElementById("chartEstados");
const chartDocentesEl = document.getElementById("chartDocentes");
const chartDiasEl = document.getElementById("chartDias");

cargarDashboard();

/* 🔄 TIEMPO REAL */
setInterval(cargarDashboard, 10000);

/* =====================================================
   EXPORTAR PDF
===================================================== */
function exportarPDF() {
    const contenedor = document.querySelector(".main-content");

    document.body.classList.add("pdf-mode");

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "15px";
    header.style.marginBottom = "12px";
    header.style.borderBottom = "2px solid #003366";
    header.style.paddingBottom = "10px";

    header.innerHTML = `
        <img src="https://i.postimg.cc/sxxwfhwK/LOGO-LBSNG-06-237x300.png" style="height:65px;">
        <div>
            <h2 style="margin:0; font-size:18px;">Liceo Bicentenario NSG</h2>
            <div style="font-size:12px;">
                Informe Oficial de Gestión de Citas<br>
                Fecha de emisión: ${new Date().toLocaleDateString("es-CL")}
            </div>
        </div>
    `;

    const footer = document.createElement("div");
    footer.style.marginTop = "14px";
    footer.style.borderTop = "2px solid #003366";
    footer.style.paddingTop = "10px";
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "flex-end";
    footer.style.fontSize = "11px";

    footer.innerHTML = `
        <div>
            Documento oficial para uso institucional<br>
            Sistema de Gestión de Citas NSG – 2026
        </div>
        <div style="text-align:center;">
            <div style="margin-bottom:35px;">______________________________</div>
            <strong>Inspectoría / Dirección</strong>
        </div>
        <div style="text-align:center;">
            <div style="font-size:10px; margin-bottom:5px;">Timbre</div>
            <img src="https://i.postimg.cc/9QK3t9Jk/timbre-ejemplo.png"
                 style="height:55px; opacity:0.75;">
        </div>
    `;

    contenedor.prepend(header);
    contenedor.appendChild(footer);

    html2pdf()
        .set({
            margin: [6, 6, 6, 6],
            filename: `Informe_Citas_NSG_${new Date().toISOString().substring(0, 10)}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
                scale: 1.25,
                useCORS: true,
                scrollY: 0
            },
            jsPDF: {
                unit: "mm",
                format: "a4",
                orientation: "portrait"
            }
        })
        .from(contenedor)
        .save()
        .then(() => {
            header.remove();
            footer.remove();
            document.body.classList.remove("pdf-mode");
        });
}
