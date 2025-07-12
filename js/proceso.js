
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoNumerico = parseInt(urlParams.get("codigo"));
    
  const safeFetch = (url) =>
    fetch(url)
      .then(res => res.ok ? res.json() : { results: [{ items: [] }] })
      .then(j => j.results?.[0]?.items || [])
    .catch(() => []);
  

  let practicasGlobal = [];
  let detalleGlobal = [];
  let cabeceraGlobal = [];
  let aprobCabeceraGlobal = [];
  
  const camposImportantesPractica = [
    { key: "c_concepto", header: "Concepto", format: "code" },
    { key: "c_periodo", header: "Periodo", format: "code" },
    { key: "c_prestador", header: "Cod. Prestador", format: "code" },
    { key: "d_prestador", header: "Prestador" },
    { key: "d_modulo_pami", header: "Modulo" },
    { key: "d_practica", header: "Práctica" },
    { key: "n_orden_rechazo", header: "N_OP", format: "code" },
    { key: "n_beneficio", header: "Beneficiario", format: "code" },
    { key: "f_practica", header: "Fecha Práctica", format: "date" },
    { key: "q_practica", header: "Q_PRACT", format: "numeric" },
    { key: "q_pract_correctas", header: "Q_CORR", format: "numeric" }, /* , destacada: true } */
    { key: "c_id_practica", header: "C_ID_PRACTICA", format: "code" }
  ];

  const camposImportantesDetalle = [
    { key: "c_concepto", header: "Concepto", format: "code" },
    { key: "c_periodo_ex", header: "Periodo", format: "code" },
    { key: "c_prestador", header: "Cod. Prestador", format: "code" },
    { key: "d_prestador", header: "Prestador" },
    { key: "d_modulo_pami", header: "Modulo" },
    { key: "d_practica", header: "Práctica" },
    { key: "i_valorizado", header: "I_VALORIZADO", format: "moneda"}
  ];
  
  const camposImportantesCabecera = [
    { key: "c_concepto", header: "Concepto", format: "code" },
    { key: "c_periodo_ex", header: "Periodo", format: "code" },
    { key: "c_prestador", header: "Cod. Prestador", format: "code" },
    { key: "d_prestador", header: "Prestador" },
    { key: "d_modulo_pami", header: "Modulo" },
    { key: "i_valorizado", header: "I_VALORIZADO", format: "moneda"}
  ];
  const camposImportantesAprobCabecera = [
    { key: "c_concepto", header: "Concepto", format: "code" },
    { key: "c_periodo_ex", header: "Periodo", format: "code" },
    { key: "c_prestador", header: "Cod. Prestador", format: "code" },
    { key: "d_prestador", header: "Prestador" },
    { key: "d_modulo_pami", header: "Modulo (7X)" },
    { key: "i_monto", header: "I_MONTO", format: "moneda"}
  ];
  
  Promise.all([
    safeFetch("../data/practicas-" + codigoNumerico + ".json"),
    safeFetch("../data/detalle-" + codigoNumerico + ".json"),
    safeFetch("../data/cabecera-" + codigoNumerico + ".json"),
    safeFetch("../data/aprob-cabecera-" + codigoNumerico + ".json"),
    safeFetch("../data/procesos.json")
  ])
    .then(([practicas, detalle, cabecera, aprobCabecera, procesos]) => {
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

      practicasGlobal = practicas;
      detalleGlobal = detalle;
      cabeceraGlobal = cabecera;
      aprobCabeceraGlobal = aprobCabecera;

      // Prácticas
      poblarSelectUnico(practicasGlobal, "c_concepto", "filtroConcepto_practicas", "Conceptos");
      poblarSelectUnico(practicasGlobal, "c_periodo", "filtroPeriodo_practicas", "Periodos");
      poblarSelectUnico(practicasGlobal, "c_prestador", "filtroPrestador_practicas", "Prestadores");
      poblarSelectUnico(practicasGlobal, "n_beneficio", "filtroBeneficiario_practicas", "Beneficiarios");

      generateTable(practicasGlobal, "tablaPracticas", camposImportantesPractica);

    
      // Detalle
      poblarSelectUnico(detalleGlobal, "c_concepto", "filtroConcepto_detalle", "Conceptos");
      poblarSelectUnico(detalleGlobal, "c_periodo_ex", "filtroPeriodo_detalle", "Periodos");
      poblarSelectUnico(detalleGlobal, "c_prestador", "filtroPrestador_detalle", "Prestadores");
    
      generateTable(detalleGlobal, "tablaDetalle", camposImportantesDetalle);

      
      // Cabecera
      poblarSelectUnico(cabeceraGlobal, "c_concepto", "filtroConcepto_cabecera", "Conceptos");
      poblarSelectUnico(cabeceraGlobal, "c_periodo_ex", "filtroPeriodo_cabecera", "Periodos");
      poblarSelectUnico(cabeceraGlobal, "c_prestador", "filtroPrestador_cabecera", "Prestadores");

      generateTable(cabeceraGlobal, "tablaCabecera", camposImportantesCabecera);

      
      // Aprob_Cabecera
      poblarSelectUnico(aprobCabeceraGlobal, "c_concepto", "filtroConcepto_aprob_cabecera", "Conceptos");
      poblarSelectUnico(aprobCabeceraGlobal, "c_periodo_ex", "filtroPeriodo_aprob_cabecera", "Periodos");
      poblarSelectUnico(aprobCabeceraGlobal, "c_prestador", "filtroPrestador_aprob_cabecera", "Prestadores");
      
      generateTable(aprobCabeceraGlobal, "tablaAprobCabecera", camposImportantesAprobCabecera);
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

        generateTable(filtradas, "tablaPracticas", camposImportantesPractica);
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

        generateTable(filtradas, "tablaDetalle", camposImportantesDetalle);
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

        generateTable(filtradas, "tablaCabecera", camposImportantesCabecera);
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

        generateTable(filtradas, "tablaAprobCabecera", camposImportantesAprobCabecera);
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
    const inicioDate = parsearFecha(inicio);
    const finDate = parsearFecha(fin);
    const diffMs = finDate - inicioDate;
    const diffMin = diffMs / 60000;

    if (diffMin < 60) {
      return `${Math.round(diffMin)} minutos`;
    } else {
      const horas = Math.floor(diffMin / 60);
      const minutos = Math.round(diffMin % 60);
      const minutosFormateados = minutos.toString().padStart(2, "0");
      return `${horas}:${minutosFormateados} horas`;
    }
  }
});

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("copy-icon")) {
    let wrapper = e.target.closest(".code-wrapper") || e.target.closest(".moneda-wrapper");
    let content =
      wrapper?.querySelector(".code-content")?.textContent ||
      wrapper?.querySelector(".moneda-content")?.textContent;

    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        e.target.textContent = "✅";
        setTimeout(() => {
          e.target.textContent = "📋";
        }, 1500);
      }).catch(err => {
        console.error("Error al copiar:", err);
        alert("No se pudo copiar al portapapeles.");
      });
    }
  }
});

function formatearMoneda(valor) {
  if (isNaN(valor)) return valor;

  const absValor = Math.abs(valor).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return absValor;
}


function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('hidden');
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
  camposImportantes.forEach(col => {
    const key = typeof col === 'string' ? col : col.key;
    const header = typeof col === 'object' && col.header || encabezadosLegibles[key] || key;
    const format = typeof col === 'object' ? col.format : null;

    const th = document.createElement("th");
    th.classList.add("sortable-header");

    if (format === "moneda") {
      th.style.textAlign = "center";
    }

    th.style.cursor = "pointer";

    const currentSort = sortStates[tableId];
    const isActive = currentSort?.column === key;
    const direction = isActive
      ? currentSort.ascending ? " 🔼" : " 🔽"
      : "";

    th.innerHTML = header + direction;

    th.addEventListener('click', () => {
      // Inicializar estado si no existe
      if (!sortStates[tableId]) {
        sortStates[tableId] = { column: null, ascending: true };
      }

      const current = sortStates[tableId];

      if (current.column === key) {
        current.ascending = !current.ascending;
      } else {
        current.column = key;
        current.ascending = true;
      }

      // Ordenar los datos
      data.sort((a, b) => {
        let valA = a[key] ?? '';
        let valB = b[key] ?? '';

        // Intentar convertir ambos a número
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        const ambosNumerosValidos = !isNaN(numA) && !isNaN(numB);

        if (ambosNumerosValidos) {
          return current.ascending ? numA - numB : numB - numA;
        }

        // Si no son numéricos, ordenar como texto
        return current.ascending
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      });

      // Regenerar tabla
      generateTable(data, tableId, camposImportantes, encabezadosLegibles, 1, pageSize);
    });

    row.appendChild(th);
  });

  // Filas
  const tbody = table.createTBody();
  pageData.forEach(item => {
    const tr = tbody.insertRow();
      
    camposImportantes.forEach(col => {
      const key = typeof col === 'string' ? col : col.key;
      const format = typeof col === 'object' ? col.format : null;
      const destacada = typeof col === 'object' ? col.destacada : false;

      const td = tr.insertCell();
      let valor = item[key];

      if (format === "moneda") {
        if (valor != null && valor !== "") {
          const spanWrapper = document.createElement("span");
          spanWrapper.className = "code-wrapper";
          spanWrapper.classList.add("moneda-wrapper");

          const spanSimbolo = document.createElement("span");
          spanSimbolo.className = "moneda-simbolo";
          spanSimbolo.textContent = "$ ";

          spanWrapper.appendChild(spanSimbolo);

          const spanValor = document.createElement("span");
          spanValor.className = "code-content";
          spanValor.classList.add("moneda-content");

          // se formatea el valor antes de ser mostrado
          var valorSinFormato = valor;
          var valorNumerico = parseFloat(valorSinFormato);
          var valorFormateado = formatearMoneda(valorSinFormato);
          spanValor.textContent = valorFormateado;

          spanWrapper.appendChild(spanValor);
          
          const spanCopyIcon = document.createElement("span");
          spanCopyIcon.className = "copy-icon";
          spanCopyIcon.title = "Copiar";
          spanCopyIcon.textContent = "📋";

          spanWrapper.appendChild(spanCopyIcon);
          td.appendChild(spanWrapper);
        }

      } else if (format === 'code') {

        if (valor != null && valor !== "") {
          const spanWrapper = document.createElement("span");
          spanWrapper.className = "code-wrapper";

          const spanValor = document.createElement("span");
          spanValor.className = "code-content";
          spanValor.textContent = valor;

          spanWrapper.appendChild(spanValor);

          const spanCopyIcon = document.createElement("span");
          spanCopyIcon.className = "copy-icon";
          spanCopyIcon.title = "Copiar";
          spanCopyIcon.textContent = "📋"; 

          spanWrapper.appendChild(spanCopyIcon);
          td.appendChild(spanWrapper);
        }

      } else if (format === 'numeric') {
        td.textContent = Number(valor).toLocaleString('es-AR');
        td.classList.add("right-align");

      } else if (format === 'date') {

        if (valor != null && valor !== "") {
          td.textContent = formatearFecha(parsearFecha(valor));
        }
      } else {
        td.textContent = valor ?? "";
      }

      if (destacada) {
        td.classList.add("columna-destacada");
      }
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

function poblarSelectUnico(data, campo, selectId, titulo) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const valoresUnicos = [...new Set(data.map(item => item[campo]).filter(Boolean))].sort();
  select.innerHTML = `<option value="">${titulo}</option>`;
  valoresUnicos.forEach(valor => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  });
}

function parsearFecha(fechaStr) {
    const [fecha, hora] = fechaStr.split(" ");
    const [dia, mes, anio] = fecha.split("/");
    return new Date(`${anio}-${mes}-${dia}T${hora}`);
}
  
function formatearFecha(date, incluirHora = false) {
  if (!(date instanceof Date) || isNaN(date)) return "Fecha inválida";

  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0'); // ¡Mes comienza en 0!
  const anio = date.getFullYear();

  const fechaStr = `${dia}/${mes}/${anio}`;

  if (!incluirHora) return fechaStr;

  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');

  return `${fechaStr} ${horas}:${minutos}:${segundos}`;
}



const sortStates = {};

document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});