import { poblarSelectUnico } from './tableLogic.js';
import { generarTabla } from './tableUI.js';
import { safeFetch } from './newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([safeFetch('../data/procesos.json')]).then(([procesos]) => {
        if (!procesos || !procesos.length) return;

        poblarSelectUnico(procesos, 'c_tipo_ejecucion', 'filtroTipo', 'Tipo');
        poblarSelectUnico(procesos, 'c_periodo', 'filtroPeriodo', 'Período');

        const columnas = [
            { key: 'c_proceso', header: 'Proceso', format: 'code' },
            { key: 'c_tipo_ejecucion', header: 'Tipo de Ejecución', format: 'code' },
            { key: 'c_periodo', header: 'Período', format: 'code' },
            { key: 'f_inicio', header: 'Inicio', format: 'date' },
            { key: 'f_fin', header: 'Fin', format: 'date' },
            { key: 'm_es_gdi', header: 'GDI', format: 'code' },
            {
                key: 'acciones',
                header: 'Acciones',
                format: 'btn',
                render: (item) => {
                    const btnDetalle = document.createElement('a');
                    btnDetalle.className = 'btn';
                    btnDetalle.href = `proceso.html?codigo=${item.c_proceso}`;
                    btnDetalle.textContent = 'Ver';
                    const espacio = document.createElement('span');
                    espacio.style.display = 'inline-block';
                    espacio.style.width = '12px';
                    const btnLogs = document.createElement('a');
                    btnLogs.className = 'btn';
                    btnLogs.href = `logs.html?codigo=${item.c_proceso}`;
                    btnLogs.textContent = 'Logs';
                    const cont = document.createElement('div');
                    cont.style.display = 'flex';
                    cont.style.gap = '12px';
                    cont.appendChild(btnDetalle);
                    cont.appendChild(btnLogs);
                    return cont;
                }
            }
        ];

        // Estado de paginación
        let currentPage = 1;
        let pageSize = 10;
        let filteredData = procesos;

        function renderTablaProcesos() {
            generarTabla(filteredData, 'tablaProcesos', columnas, undefined, currentPage, pageSize);
            // Paginador visual
            const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
            const paginador = document.getElementById('paginacionProcesos');
            if (paginador) {
                paginador.innerHTML = '';
                let btnWidth = 38;
                let paginadorWidth = paginador.offsetWidth || 400;
                let maxBtns = Math.floor(paginadorWidth / btnWidth);
                if (maxBtns < 5) maxBtns = 5;
                let btns = [];
                if (totalPages <= maxBtns) {
                    for (let i = 1; i <= totalPages; i++) btns.push(i);
                } else {
                    let start = Math.max(1, currentPage - Math.floor(maxBtns / 2));
                    let end = start + maxBtns - 1;
                    if (end > totalPages) {
                        end = totalPages;
                        start = end - maxBtns + 1;
                    }
                    if (start > 1) {
                        btns.push(1);
                        if (start > 2) btns.push('...');
                    }
                    for (let i = start; i <= end; i++) btns.push(i);
                    if (end < totalPages) {
                        if (end < totalPages - 1) btns.push('...');
                        btns.push(totalPages);
                    }
                }
                btns.forEach(i => {
                    if (i === '...') {
                        const span = document.createElement('span');
                        span.textContent = '...';
                        span.className = 'paginador-ellipsis';
                        paginador.appendChild(span);
                    } else {
                        const btn = document.createElement('button');
                        btn.textContent = i;
                        btn.className = 'paginador-btn' + (i === currentPage ? ' active' : '');
                        btn.style.margin = '4px 4px'; // separación vertical y horizontal
                        btn.onclick = () => {
                            currentPage = i;
                            renderTablaProcesos();
                        };
                        paginador.appendChild(btn);
                    }
                });
            }
        }

        // Inicializar tabla y controles
        renderTablaProcesos();

        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTablaProcesos();
            }
        });
        document.getElementById('nextPageBtn').addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
            if (currentPage < totalPages) {
                currentPage++;
                renderTablaProcesos();
            }
        });
        document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
            pageSize = parseInt(e.target.value, 10);
            currentPage = 1;
            renderTablaProcesos();
        });

        document.getElementById('filtroBtn').addEventListener('click', () => {
            const tipo = document.getElementById('filtroTipo').value;
            const periodo = document.getElementById('filtroPeriodo').value.trim();
            filteredData = procesos.filter(
                (p) =>
                    (tipo === '' || p.c_tipo_ejecucion === tipo) &&
                    (periodo === '' || p.c_periodo.toString().includes(periodo))
            );
            currentPage = 1;
            renderTablaProcesos();
        });
    });
});
