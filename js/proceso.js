
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoNumerico = parseInt(urlParams.get("codigo"));

  let practicasGlobal = [];
  let detalleGlobal = [];
  let cabeceraGlobal = [];
  let aprobCabeceraGlobal = [];

  Promise.all([
  fetch("../data/practicas.json").then(res => res.json()).then(j => j.results?.[0]?.items || []),
  fetch("../data/detalle.json").then(res => res.json()).then(j => j.results?.[0]?.items || []),
  fetch("../data/cabecera.json").then(res => res.json()).then(j => j.results?.[0]?.items || []),
  fetch("../data/aprob_cabecera.json").then(res => res.json()).then(j => j.results?.[0]?.items || []),
  fetch("../data/procesos.json").then(res => res.json()).then(j => j.results?.[0]?.items || [])
]).then(([practicas, detalle, cabecera, aprobCabecera, procesos]) => {
    const proceso = procesos.find(p => parseInt(p.c_proceso) === codigoNumerico);

    if (!proceso) return;

    document.getElementById("codigo").textContent = proceso.c_proceso;
    document.getElementById("tipo").textContent =
      proceso.c_tipo_ejecucion === "E" ? "Excepción" :
      proceso.c_tipo_ejecucion === "M" ? "Mensual" :
      proceso.c_tipo_ejecucion;

    document.getElementById("periodo").textContent = proceso.c_periodo;
    document.getElementById("inicio").textContent = proceso.f_inicio;
    document.getElementById("fin").textContent = proceso.f_fin;
    document.getElementById("duracion").textContent = calcularDuracion(proceso.f_inicio, proceso.f_fin);

    document.getElementById("btnLogs").addEventListener("click", () => {
      window.location.href = `logs.html?codigo=${proceso.codigo}`;
    });

    practicasGlobal = practicas.filter(p => parseInt(p.c_proceso) === codigoNumerico);
    detalleGlobal = detalle.filter(p => parseInt(p.c_proceso) === codigoNumerico);
    cabeceraGlobal = cabecera.filter(p => parseInt(p.c_proceso) === codigoNumerico);
    aprobCabeceraGlobal = aprobCabecera.filter(p => parseInt(p.c_proceso) === codigoNumerico);

    renderTable("tablaPracticas", practicasGlobal);
    renderTable("tablaDetalle", detalleGlobal);
    renderTable("tablaCabecera", cabeceraGlobal);
    renderTable("tablaAprobCabecera", aprobCabeceraGlobal);
  });

  document.getElementById("filtroBtn").addEventListener("click", () => {
    const prestador = document.getElementById("filtroPrestador").value.toLowerCase();
    const beneficiario = document.getElementById("filtroBeneficiario").value.toLowerCase();

    const filtradas = practicasGlobal.filter(p =>
      (!prestador || p.c_prestador?.toLowerCase().includes(prestador)) &&
      (!beneficiario || p.n_beneficio?.toLowerCase().includes(beneficiario))
    );

    renderTable("tablaPracticas", filtradas);
  });

  window.showTab = (tabId) => {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add("active");
  };

  window.renderTable = (tableId, data) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    if (data.length === 0) {
      table.innerHTML = "<tr><td colspan='99'>No hay datos</td></tr>";
      return;
    }
    const headers = Object.keys(data[0]);
    const headerHtml = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
    const rowsHtml = data.map(item =>
      "<tr>" + headers.map(h => `<td>${item[h]}</td>`).join("") + "</tr>"
    ).join("");
    table.innerHTML = headerHtml + rowsHtml;
  };
    
function calcularDuracion(inicio, fin) {
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    const diffMs = finDate - inicioDate;
    const diffMin = diffMs / 60000;
    return diffMin < 60
        ? `${Math.round(diffMin)} minutos`
        : `${Math.round(diffMin / 60 /60)} horas`;
        }
});
