import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { generarTabla } from './tableUI.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { ProcesosManager } from './procesosUtils.js';

// Hacer disponibles las funciones para el manager
window.tableLogic = { crearSelectorPersonalizado };
window.tableUI = { generarTabla };

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();
    
    // Crear instancia del manager
    const procesosManager = new ProcesosManager();
    
    // Cargar datos y inicializar
    Promise.all([safeFetch('../data/procesos.json')])
        .then(([procesos]) => {
            if (!procesos || !procesos.length) {
                console.warn('No se encontraron datos de procesos');
                return;
            }
            
            procesosManager.inicializar(procesos);
        })
        .catch(error => {
            console.error('Error cargando datos de procesos:', error);
        });
});

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();
    Promise.all([safeFetch('../data/procesos.json')]).then(([procesos]) => {
        if (!procesos || !procesos.length) return;

        // Definir columnas primero
        let currentPage = 1;
        let pageSize = 10;
        let filteredData = procesos;

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

                    // Crear URL con filtros actuales
                    const filtroTipoInput = document.getElementById('filtroTipo');
                    const currentFilters = {
                        tipo: filtroTipoInput?.getValue ? filtroTipoInput.getValue() : (filtroTipoInput?.value || ''),
                        periodo: document.getElementById('filtroPeriodo')?.value || ''
                    };

                    let url = `proceso.html?codigo=${item.c_proceso}`;
                    if (currentFilters.tipo) {
                        url += `&filtroTipo=${encodeURIComponent(currentFilters.tipo)}`;
                    }
                    if (currentFilters.periodo) {
                        url += `&filtroPeriodo=${encodeURIComponent(currentFilters.periodo)}`;
                    }

                    btnDetalle.href = url;
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

        // Función para ejecutar filtrado
        function ejecutarFiltrado() {
            const filtroTipoInput = document.getElementById('filtroTipo');
            const tipo = filtroTipoInput.getValue ? filtroTipoInput.getValue() : filtroTipoInput.value;
            const periodo = document.getElementById('filtroPeriodo').value.trim();

            // Guardar filtros en localStorage
            saveFilters(tipo, periodo);

            filteredData = procesos.filter(
                (p) =>
                    (tipo === '' || p.c_tipo_ejecucion === tipo) &&
                    (periodo === '' || p.c_periodo.toString().includes(periodo))
            );
            currentPage = 1;
            renderTablaProcesos();
        }

        function renderTablaProcesos() {
            generarTabla(filteredData, 'tablaProcesos', columnas, undefined, currentPage, pageSize);
            // Paginador visual
            const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
            const paginador = document.getElementById('paginacionProcesos');
            if (paginador) {
                paginador.innerHTML = '';

                // Botones de páginas
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
                btns.forEach((i) => {
                    if (i === '...') {
                        const span = document.createElement('span');
                        span.textContent = '...';
                        span.className = 'paginador-ellipsis';
                        paginador.appendChild(span);
                    } else {
                        const btn = document.createElement('button');
                        btn.textContent = i;
                        btn.className = 'paginador-btn' + (i === currentPage ? ' active' : '');
                        btn.style.margin = '4px 4px';
                        btn.onclick = () => {
                            currentPage = i;
                            renderTablaProcesos();
                        };
                        paginador.appendChild(btn);
                    }
                });
            }
        }

        // Crear selector personalizado y poblar filtros
        crearSelectorPersonalizado(procesos, 'c_tipo_ejecucion', 'filtroTipo', 'tipoDropdown', 'Selecciona o escribe...', ejecutarFiltrado);
        poblarSelectUnico(procesos, 'c_periodo', 'filtroPeriodo', 'Período');

        // Agregar filtrado automático para el input de período
        let debounceTimer;
        const filtroPeriodoInput = document.getElementById('filtroPeriodo');
        if (filtroPeriodoInput) {
            filtroPeriodoInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(ejecutarFiltrado, 300);
            });
            
            filtroPeriodoInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(debounceTimer);
                    ejecutarFiltrado();
                }
            });
        }

        // Recuperar filtros guardados de localStorage o URL
        const savedFilters = getSavedFilters();
        
        // Esperar a que se cree el selector personalizado
        setTimeout(() => {
            const filtroTipoInput = document.getElementById('filtroTipo');
            if (savedFilters.tipo && filtroTipoInput.setValue) {
                filtroTipoInput.setValue(savedFilters.tipo);
            }
            if (savedFilters.periodo) {
                document.getElementById('filtroPeriodo').value = savedFilters.periodo;
            }
        }, 100);

        // Inicializar tabla y controles
        renderTablaProcesos();

        // Event listener para botón de limpiar filtros
        const limpiarFiltrosBtn = document.getElementById('limpiarFiltrosBtn');
        if (limpiarFiltrosBtn) {
            limpiarFiltrosBtn.addEventListener('click', () => {
                const filtroTipoInput = document.getElementById('filtroTipo');
                if (filtroTipoInput.setValue) {
                    filtroTipoInput.setValue('');
                } else {
                    filtroTipoInput.value = '';
                }
                document.getElementById('filtroPeriodo').value = '';
                clearFilters();
                filteredData = procesos;
                currentPage = 1;
                renderTablaProcesos();
            });
        }

        // Aplicar filtros guardados si existen
        if (savedFilters.tipo || savedFilters.periodo) {
            const tipo = savedFilters.tipo || '';
            const periodo = savedFilters.periodo || '';

            filteredData = procesos.filter(
                (p) =>
                    (tipo === '' || p.c_tipo_ejecucion === tipo) &&
                    (periodo === '' || p.c_periodo.toString().includes(periodo))
            );
            currentPage = 1;
            renderTablaProcesos();
        }
    });
});

// Funciones para manejo de estado de filtros
// Este sistema permite que los filtros se mantengan cuando el usuario navega
// entre páginas. Los filtros se guardan en localStorage y también se pasan
// como parámetros de URL para mayor robustez.
function saveFilters(tipo, periodo) {
    const filters = {
        tipo: tipo || '',
        periodo: periodo || ''
    };
    localStorage.setItem('procesos_filters', JSON.stringify(filters));
}

function getSavedFilters() {
    // Primero intentar obtener de URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = {
        tipo: urlParams.get('filtroTipo') || '',
        periodo: urlParams.get('filtroPeriodo') || ''
    };

    // Si hay filtros en URL, usarlos y guardarlos
    if (urlFilters.tipo || urlFilters.periodo) {
        saveFilters(urlFilters.tipo, urlFilters.periodo);
        return urlFilters;
    }

    // Si no hay filtros en URL, intentar obtener de localStorage
    try {
        const saved = localStorage.getItem('procesos_filters');
        return saved ? JSON.parse(saved) : { tipo: '', periodo: '' };
    } catch (e) {
        return { tipo: '', periodo: '' };
    }
}

function clearFilters() {
    localStorage.removeItem('procesos_filters');
}
