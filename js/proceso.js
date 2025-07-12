
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

    generateTable(practicasGlobal, "tablaPracticas", 
        ["c_concepto", "c_periodo", "c_prestador", "n_beneficio", "c_modulo_pami_4x", "c_practica", "f_practica", "q_practica", "q_pract_correctas"],
        {
            c_concepto: "Concepto",
            c_periodo: "C_PERIODO",
            c_prestador: "Prestador",
            n_beneficio: "Beneficiario",
            c_modulo_pami_4x: "C_MODULO_PAMI_4X",
            c_practica: "C_PRACTICA",
            f_practica: "Fecha Práctica",
            q_practica: "Q_PRAC",
            q_pract_correctas: "Q_CORR"
        }
    );

    generateTable(detalleGlobal, "tablaDetalle", 
        ["c_concepto", "c_periodo_ex", "c_prestador", "c_modulo_pami_4x", "c_practica", "i_valorizado_p"],
        {
            c_concepto: "Concepto",
            c_periodo_ex: "C_PERIODO_EX",
            c_prestador: "Prestador",
            c_modulo_pami_4x: "C_MODULO_PAMI_4X",
            c_practica: "C_PRACTICA",
            i_valorizado_p: "I_VALORIZADO"
        }
    );

    generateTable(cabeceraGlobal, "tablaCabecera", ["c_concepto", "c_periodo_ex", "c_prestador", "c_modulo_pami_4x", "i_valorizado"],
        {
            c_concepto: "Concepto",
            c_periodo_ex: "C_PERIODO_EX",
            c_prestador: "Prestador",
            c_modulo_pami_4x: "C_MODULO_PAMI_4X",
            i_valorizado: "I_VALORIZADO"
        });
    
    generateTable(aprobCabeceraGlobal, "tablaAprobCabecera", ["c_concepto", "c_periodo_ex", "c_prestador", "c_modulo_pami_7x", "i_monto"],
        {
            c_concepto: "Concepto",
            c_periodo_ex: "C_PERIODO_EX",
            c_prestador: "Prestador",
            c_modulo_pami_7x: "C_MODULO_PAMI_7X",
            i_monto: "I_MONTO"
        });
  });

    /* Filtros */
    /*  - Filtros Prácticas */
    document.getElementById("filtroBtn_practicas").addEventListener("click", () => {
        const concepto = document.getElementById("filtroConcepto_practicas").value.toLowerCase();
        const prestador = document.getElementById("filtroPrestador_practicas").value.toLowerCase();
        const beneficiario = document.getElementById("filtroBeneficiario_practicas").value.toLowerCase();
        const periodo = document.getElementById("filtroPeriodo_practicas").value.toLowerCase();

        const filtradas = practicasGlobal.filter(p =>
        (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
        (!prestador || p.c_prestador == prestador) &&
        (!beneficiario || p.n_beneficio == beneficiario) &&
        (!periodo || p.c_periodo == periodo)
        );

        generateTable(filtradas, "tablaPracticas", 
            ["c_concepto", "c_periodo", "c_prestador", "n_beneficio", "c_modulo_pami_4x", "c_practica", "f_practica", "q_practica", "q_pract_correctas"],
            {
                c_concepto: "Concepto",
                c_periodo: "C_PERIODO",
                c_prestador: "Prestador",
                n_beneficio: "Beneficiario",
                c_modulo_pami_4x: "C_MODULO_PAMI_4X",
                c_practica: "C_PRACTICA",
                f_practica: "Fecha Práctica",
                q_practica: "Q_PRAC",
                q_pract_correctas: "Q_CORR"
            }
        );
    });
    
    /*  - Filtros Detalles */
    document.getElementById("filtroBtn_detalle").addEventListener("click", () => {
        const concepto = document.getElementById("filtroConcepto_detalle").value.toLowerCase();
        const periodo = document.getElementById("filtroPeriodo_detalle").value.toLowerCase();
        const prestador = document.getElementById("filtroPrestador_detalle").value.toLowerCase();

        const filtradas = detalleGlobal.filter(p =>
        (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
        (!periodo || p.c_periodo_ex == periodo) &&
        (!prestador || p.c_prestador == prestador)
        );

        generateTable(filtradas, "tablaDetalle", 
            ["c_concepto", "c_periodo_ex", "c_prestador", "c_modulo_pami_4x", "c_practica", "i_valorizado_p"],
            {
                c_concepto: "Concepto",
                c_periodo_ex: "C_PERIODO_EX",
                c_prestador: "Prestador",
                c_modulo_pami_4x: "C_MODULO_PAMI_4X",
                c_practica: "C_PRACTICA",
                i_valorizado_p: "I_VALORIZADO"
            }
        );
    });
        
    /*  - Filtros Cabecera */
    document.getElementById("filtroBtn_cabecera").addEventListener("click", () => {
        const concepto = document.getElementById("filtroConcepto_cabecera").value.toLowerCase();
        const prestador = document.getElementById("filtroPrestador_cabecera").value.toLowerCase();
        const periodo = document.getElementById("filtroPeriodo_cabecera").value.toLowerCase();

        const filtradas = cabeceraGlobal.filter(p =>
        (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
        (!prestador || p.c_prestador == prestador) &&
        (!periodo || p.c_periodo_ex == periodo)
        );

        generateTable(filtradas, "tablaCabecera", ["c_concepto", "c_periodo_ex", "c_prestador", "c_modulo_pami_4x", "i_valorizado"],
            {
                c_concepto: "Concepto",
                c_periodo_ex: "C_PERIODO_EX",
                c_prestador: "Prestador",
                c_modulo_pami_4x: "C_MODULO_PAMI_4X",
                i_valorizado: "I_VALORIZADO"
            });
    });
        
    /*  - Filtros Aprob_Cabecera */
    document.getElementById("filtroBtn_aprob_cabecera").addEventListener("click", () => {
        const concepto = document.getElementById("filtroConcepto_aprob_cabecera").value.toLowerCase();
        const prestador = document.getElementById("filtroPrestador_aprob_cabecera").value.toLowerCase();
        const periodo = document.getElementById("filtroPeriodo_aprob_cabecera").value.toLowerCase();

        const filtradas = aprobCabeceraGlobal.filter(p =>
        (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
        (!prestador || p.c_prestador == prestador) &&
        (!periodo || p.c_periodo_ex == periodo)
        );

        generateTable(filtradas, "tablaAprobCabecera", ["c_concepto", "c_periodo_ex", "c_prestador", "c_modulo_pami_7x", "i_monto"],
            {
                c_concepto: "Concepto",
                c_periodo_ex: "C_PERIODO_EX",
                c_prestador: "Prestador",
                c_modulo_pami_7x: "C_MODULO_PAMI_7X",
                i_monto: "I_MONTO"
            });
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

function generateTable(data, tableId, camposImportantes, encabezadosLegibles, page = 1, pageSize = 10) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.innerHTML = ""; // Limpiar tabla

  // Calcular paginación
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = data.slice(startIndex, endIndex);

  // Encabezados
  const thead = table.createTHead();
  const row = thead.insertRow();
  camposImportantes.forEach(key => {
    const th = document.createElement("th");
    th.textContent = encabezadosLegibles[key] || key;
    row.appendChild(th);
  });

  // Filas
  const tbody = table.createTBody();
  pageData.forEach(item => {
    const tr = tbody.insertRow();
    camposImportantes.forEach(key => {
      const td = tr.insertCell();
      td.textContent = item[key] ?? "";
    });
  });

  // Agregar paginación
  agregarPaginacion(tableId, data, camposImportantes, encabezadosLegibles, totalPages, page, pageSize);
}

function agregarPaginacion(tableId, data, camposImportantes, encabezadosLegibles, totalPages, currentPage, pageSize) {
  const pagContainerId = `paginacion_${tableId}`;
  let pagContainer = document.getElementById(pagContainerId);

  if (!pagContainer) {
    pagContainer = document.createElement("div");
    pagContainer.id = pagContainerId;
    pagContainer.className = "paginacion";
    const tableElement = document.getElementById(tableId);
    tableElement.parentElement.appendChild(pagContainer);
  }

  pagContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active-page");
    btn.addEventListener("click", () => {
      generateTable(data, tableId, camposImportantes, encabezadosLegibles, i, pageSize);
    });
    pagContainer.appendChild(btn);
  }
}



document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});