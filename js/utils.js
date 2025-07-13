const sortStates = {}; // Estado de ordenamiento por tabla

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('hidden');
}

document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});

//  generateTable => Funcion mágica, poderosa, arma tabla ya con los parametros con muchas funcionalidades y estilos
function generateTable(data, tableId, columns, headers, page = 1, pageSize = 10) {
  
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
    columns.forEach(col => {
        const key = typeof col === 'string' ? col : col.key;
        const header = typeof col === 'object' && col.header || headers[key] || key;
        const format = typeof col === 'object' ? col.format : null;

        const th = document.createElement("th");
        th.classList.add("sortable-header");

        // Formatos Especiales
        if (format === "moneda") {
            th.style.textAlign = "center";
        }

        const currentSort = sortStates[tableId];
        const isActive = currentSort?.column === key;
        const direction = isActive
            ? currentSort.ascending ? " 🔼" : " 🔽"
            : "";

        th.innerHTML = header + direction;
        th.style.cursor = "pointer";
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
            key.sort((a, b) => {
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
            generateTable(key, tableId, columns, headers, 1, pageSize);
        });

        row.appendChild(th);
    });

  
    // Filas
    const tbody = table.createTBody();
    pageData.forEach(item => {
    const tr = tbody.insertRow();
      
    columns.forEach(col => {
        const key = typeof col === 'string' ? col : col.key;
        const format = typeof col === 'object' ? col.format : null;
        const destacada = typeof col === 'object' ? col.destacada : false;

        const td = tr.insertCell();
        let valor = item[key];

        ///////////////////////////
        /// Formatos Especiales ///
        ///////////////////////////

        // Code => lo inventé yo, seria cualquier cosa que represente un codigo, algo copiable, util
        if (format === "code") {
            
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

            

        
            // Moneda => Hereda de Code, y tiene decoraciones ($, formato)
        } else if (format === 'moneda') {           
            
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

            
        
            // Date
        } else if (format === 'date') {
            if (valor != null && valor !== "") {

                // Aplica formatos fecha
                td.textContent = formatearFecha(parsearFecha(valor));
            }

        } else if (format === 'numeric') {
            td.textContent = Number(valor).toLocaleString('es-AR');
            td.classList.add("right-align");

        } else {
            td.textContent = valor ?? "";
        }

        if (destacada) {
            td.classList.add("columna-destacada");
        
        }
    
    });

    });

    // Agregar paginación
    agregarPaginacion(tableId, data, columns, headers, totalPages, page, pageSize);
}

function agregarPaginacion(tableId, data, columns, headers, totalPages, currentPage, pageSize) {
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
      generateTable(data, tableId, columns, headers, i, pageSize);
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





