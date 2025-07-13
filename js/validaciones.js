
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codigo = urlParams.get("codigo");
    const c_id_practica = urlParams.get("c_id_practica");

    const urlValidaciones = `../data/validaciones-${codigo}.json`;

    Promise.all([safeFetch(urlValidaciones)])
        
        .then(([validaciones]) => {            
            if (!validaciones) {
                mostrarError("No se pudo cargar el archivo de validaciones.");
                return;
            }            
            const items = validaciones?.results?.[0]?.items || [];

            // Filtro simple por ahora
            const validacionesFiltradas = items.filter(item => item.c_id_practica == c_id_practica);
        
            if (validacionesFiltradas.length === 0) {
                const tbody = document.querySelector("#tablaValidaciones tbody");
                tbody.innerHTML = "<tr><td colspan='99'>No hay validaciones para esta práctica</td></tr>";
                return;
            }

            // Esto bien podria ser resuelto con mi propia entidad Validacion, que se cargue en otra capa con los datos del json
            // Pero por ahora sirve asi.
            const camposGrillaValidaciones = [
                { key: "c_grupo", header: "Grupo", format: "code" },
                { key: "c_validacion", header: "Cod. Validacion", format: "code" },
                { key: "d_validacion", header: "Validación", },
                { key: "c_file_upload", header: "File" },
                { key: "n_prestacion", header: "N_PRESTACION" },
                { key: "c_id_practica", header: "C_ID_PRACTICA", format: "code" }
            ];

            generateTable(validacionesFiltradas, "tablaValidaciones", camposGrillaValidaciones);
        
        });
    });

    function mostrarError(mensaje) {
        const tbody = document.querySelector("#tablaValidaciones tbody");
        tbody.innerHTML = `<tr><td colspan='99' style="color:red">${mensaje}</td></tr>`;
    }

function renderizarTabla(data) {
  const tabla = document.getElementById("tablaValidaciones");
  const headers = Object.keys(data[0]);

  const thead = "<tr>" + headers.map(k => `<th>${k}</th>`).join("") + "</tr>";
  const rows = data.map(item =>
    "<tr>" + headers.map(k => `<td>${item[k]}</td>`).join("") + "</tr>"
  ).join("");

  tabla.innerHTML = thead + rows;
}

function safeFetch(url) {
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      return res.json();
    })
    .catch(error => {
      console.error(`Error al obtener ${url}:`, error);
      return null;
    });
}



  /*   document.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const codigoNumerico = parseInt(urlParams.get("codigo"));
        const codigoIdPractica = parseInt(urlParams.get("c_id_practica"));
        
        const safeFetch = (url) =>
            fetch(url)
            .then(res => res.ok ? res.json() : { results: [{ items: [] }] })
            .then(j => j.results?.[0]?.items || [])
            .catch(() => []);
    

        let listaValidaciones = [];
        
        const camposImportantes = [
            { key: "c_grupo", header: "Grupo", format: "code" },
            { key: "c_validacion", header: "Cod. Validacion", format: "code" },
            { key: "d_validacion", header: "Validación", },
            { key: "c_file_upload", header: "File" },
            { key: "n_prestacion", header: "N_PRESTACION" },
            { key: "c_id_practica", header: "C_ID_PRACTICA", format: "code" }
        ];
    
        Promise.all([
            safeFetch("../data/validaciones-" + codigoNumerico + ".json"),
        ])    
            .then(([validaciones]) => {
                listaValidaciones = validaciones;
                // Cargo selects
                poblarSelectUnico(listaValidaciones, "c_validacion", "filtroCodigoValidacion", "Validación");
                poblarSelectUnico(listaValidaciones, "c_grupo", "filtroGrupo", "Grupo");

                generateTable(listaValidaciones, "tablaValidaciones", camposImportantes);
            });
        
        /* Filtros * /
        document.getElementById("filtroBtn").addEventListener("click", () => {
            const c_validacion = document.getElementById("filtroCodigoValidacion").value.toLowerCase();
            const c_grupo = document.getElementById("filtroGrupo").value.toLowerCase();

            const filtradas = listaValidaciones.filter(p =>
                (!c_validacion || p.c_validacion == c_validacion) &&
                (!c_grupo || p.c_grupo == c_grupo) 
            );

            generateTable(filtradas, "tablaValidaciones", camposImportantes);
        });
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
}); */