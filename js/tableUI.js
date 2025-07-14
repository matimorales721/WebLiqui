import { ordenarDatos } from '../js/tableLogic.js';
import { parsearFecha, formatearMoneda, formatearFecha } from '../js/formatters.js';

const sortStates = {}; // Estado de ordenamiento por tabla

//  generarTabla => Funcion mágica, poderosa, arma tabla ya con los parametros con muchas funcionalidades y estilos
export function generarTabla(data, tableId, columns, headers, page = 1, pageSize = 10) {
    const table = document.getElementById(tableId);
    table.innerHTML = '';

    // Calcular paginación
    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = data.slice(startIndex, endIndex);

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const trHead = document.createElement('tr');
    columns.forEach((col) => {
        const key = typeof col === 'object' ? col.key : col;
        const header = typeof col === 'object' ? col.header || col.key : col;
        const format = typeof col === 'object' ? col.format : null;

        const th = document.createElement('th');
        th.classList.add('sortable-header');

        // Formatos Especiales
        if (format === 'moneda') {
            th.style.textAlign = 'center';
        }

        const currentSort = sortStates[tableId];
        const isActive = currentSort?.column === key;
        const direction = isActive ? (currentSort.ascending ? ' 🔼' : ' 🔽') : '';

        th.innerHTML = header + direction;
        th.style.cursor = 'pointer';
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

        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    data.forEach((row) => {
        const tr = document.createElement('tr');
        columns.forEach((col) => {
            const key = typeof col === 'string' ? col : col.key;
            const format = typeof col === 'object' ? col.format : null;
            const destacada = typeof col === 'object' ? col.destacada : false;
            const render = typeof col === 'object' ? col.render : null;

            const td = tr.insertCell();
            let valor = row[key];

            if (typeof render === 'function') {
                const customContent = render(row);
                if (customContent instanceof Node) {
                    td.appendChild(customContent);
                } else {
                    td.textContent = customContent ?? '';
                }
                return; // 🚨 Evita seguir con los demás formatos si ya hay render
            }

            ///////////////////////////
            /// Formatos Especiales ///
            ///////////////////////////

            // Code => lo inventé yo, seria cualquier cosa que represente un codigo, algo copiable, util
            if (format === 'code') {
                if (valor != null && valor !== '') {
                    const spanWrapper = document.createElement('span');
                    spanWrapper.className = 'code-wrapper';

                    const spanValor = document.createElement('span');
                    spanValor.className = 'code-content';
                    spanValor.textContent = valor;

                    spanWrapper.appendChild(spanValor);

                    const spanCopyIcon = document.createElement('span');
                    spanCopyIcon.className = 'copy-icon';
                    spanCopyIcon.title = 'Copiar';
                    spanCopyIcon.textContent = '📋';

                    spanWrapper.appendChild(spanCopyIcon);
                    td.appendChild(spanWrapper);
                }

                // Moneda => Hereda de Code, y tiene decoraciones ($, formato)
            } else if (format === 'moneda') {
                if (valor != null && valor !== '') {
                    const spanWrapper = document.createElement('span');
                    spanWrapper.className = 'code-wrapper';
                    spanWrapper.classList.add('moneda-wrapper');

                    const spanSimbolo = document.createElement('span');
                    spanSimbolo.className = 'moneda-simbolo';
                    spanSimbolo.textContent = '$ ';

                    spanWrapper.appendChild(spanSimbolo);

                    const spanValor = document.createElement('span');
                    spanValor.className = 'code-content';
                    spanValor.classList.add('moneda-content');

                    // se formatea el valor antes de ser mostrado
                    var valorSinFormato = valor;
                    var valorNumerico = parseFloat(valorSinFormato);
                    var valorFormateado = formatearMoneda(valorSinFormato);
                    spanValor.textContent = valorFormateado;

                    spanWrapper.appendChild(spanValor);

                    const spanCopyIcon = document.createElement('span');
                    spanCopyIcon.className = 'copy-icon';
                    spanCopyIcon.title = 'Copiar';
                    spanCopyIcon.textContent = '📋';

                    spanWrapper.appendChild(spanCopyIcon);
                    td.appendChild(spanWrapper);
                }

                // Date
            } else if (format === 'date') {
                if (valor != null && valor !== '') {
                    // Aplica formatos fecha
                    td.textContent = formatearFecha(parsearFecha(valor));
                }

                // Numeric
            } else if (format === 'numeric') {
                td.textContent = Number(valor).toLocaleString('es-AR');
                td.classList.add('right-align');

                //Btn
            } else if (format === 'btn') {
                if (valor instanceof HTMLElement) {
                    td.appendChild(valor);
                } else {
                    td.textContent = '';
                }
            } else {
                td.textContent = valor ?? '';
            }

            if (destacada) {
                td.classList.add('columna-destacada');
            }
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
}
