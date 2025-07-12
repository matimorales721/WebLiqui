
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

    generateTable(practicasGlobal, "tablaPracticas", ["c_prestador", "n_beneficio", "f_practica", "c_practica", "q_pract_correctas", "c_error"]);
    generateTable(detalleGlobal, "tablaDetalle", ["c_prestador", "c_periodo_ex", "c_practica", "i_valorizado_p"]);
    generateTable(cabeceraGlobal, "tablaCabecera", ["c_prestador", "c_periodo_ex", "c_modulo_pami_4x", "i_valorizado"]);
    generateTable(aprobCabeceraGlobal, "tablaAprobCabecera", ["c_prestador", "c_periodo_ex", "c_modulo_pami_7x", "c_concepto", "i_monto"]);
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

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('active');
}

function generateTable(data, tableId, columnasImportantes = []) {
  const table = document.getElementById(tableId);
  table.innerHTML = "";

  if (!data || data.length === 0) {
    table.innerHTML = "<tr><td>No hay datos disponibles</td></tr>";
    return;
  }

  const headers = columnasImportantes.length > 0 ? columnasImportantes : Object.keys(data[0]);

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  headers.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key.toUpperCase(); // Más legible
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach(item => {
    const tr = document.createElement("tr");
    headers.forEach(key => {
      const td = document.createElement("td");
      td.textContent = item[key] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}



document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});