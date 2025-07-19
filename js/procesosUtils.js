// Utilidades reutilizables para la página de procesos

/**
 * Clase para manejar el filtrado y paginación de procesos
 */
export class ProcesosManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.filteredData = [];
        this.allData = [];
        this.debounceTimer = null;
        this.debounceDelay = 300;
    }

    /**
     * Inicializa el manager con los datos
     * @param {Array} procesos - Array de procesos
     */
    inicializar(procesos) {
        // Ordenar los procesos por c_proceso descendente por defecto
        const procesosOrdenados = procesos.sort((a, b) => {
            const procesoA = a.c_proceso || a.C_PROCESO || 0;
            const procesoB = b.c_proceso || b.C_PROCESO || 0;
            return procesoB - procesoA; // Ordenamiento numérico descendente
        });

        this.allData = procesosOrdenados;
        this.filteredData = procesosOrdenados;
        this.configurarFiltros();
        this.configurarEventListeners();
        this.renderTabla();
        this.aplicarFiltrosDesdeURL();
    }

    /**
     * Configura los selectores de filtros
     */
    configurarFiltros() {
        const { crearSelectorPersonalizado } = window.tableLogic || {};

        if (crearSelectorPersonalizado) {
            // Crear selector de tipo con callback automático
            crearSelectorPersonalizado(
                this.allData,
                'TIPO_EJECUCION',
                'filtroTipo',
                'tipoDropdown',
                'Selecciona o escribe...',
                () => this.ejecutarFiltradoConDebounce()
            );
        }

        // Para el período, usamos un input simple, agregamos el event listener
        const filtroPeriodoInput = document.getElementById('filtroPeriodo');
        if (filtroPeriodoInput) {
            filtroPeriodoInput.addEventListener('input', () => this.ejecutarFiltradoConDebounce());
        }
    }

    /**
     * Configura event listeners para botones y otros elementos
     */
    configurarEventListeners() {
        const limpiarBtn = document.getElementById('limpiarFiltrosBtn');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
        }
    }

    /**
     * Ejecuta el filtrado con debounce para evitar múltiples llamadas
     */
    ejecutarFiltradoConDebounce() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.ejecutarFiltrado();
        }, this.debounceDelay);
    }

    /**
     * Ejecuta el filtrado de datos
     */
    ejecutarFiltrado() {
        const filtroTipoInput = document.getElementById('filtroTipo');
        const filtroPeriodoInput = document.getElementById('filtroPeriodo');

        const tipo = filtroTipoInput?.getValue ? filtroTipoInput.getValue() : filtroTipoInput?.value || '';
        const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : filtroPeriodoInput?.value || '';

        this.filteredData = this.allData.filter((proceso) => {
            const coincideTipo = !tipo || proceso.TIPO_EJECUCION === tipo;
            // Convertir período a número para comparación correcta
            const coincidePeriodo = !periodo || proceso.C_PERIODO == periodo || proceso.C_PERIODO === parseInt(periodo);
            return coincideTipo && coincidePeriodo;
        });

        // Mantener el orden por c_proceso descendente después del filtrado
        this.filteredData.sort((a, b) => {
            const procesoA = a.c_proceso || a.C_PROCESO || 0;
            const procesoB = b.c_proceso || b.C_PROCESO || 0;
            return procesoB - procesoA; // Ordenamiento numérico descendente
        });

        this.currentPage = 1;
        this.renderTabla();
        this.guardarFiltrosEnURL();
    }

    /**
     * Limpia todos los filtros
     */
    limpiarFiltros() {
        // Limpiar el selector personalizado de tipo
        const inputTipo = document.getElementById('filtroTipo');
        if (inputTipo?.setValue) {
            inputTipo.setValue('');
        } else if (inputTipo) {
            inputTipo.value = '';
        }

        // Limpiar el input simple de período
        const inputPeriodo = document.getElementById('filtroPeriodo');
        if (inputPeriodo) {
            inputPeriodo.value = '';
        }

        // Restaurar todos los datos manteniendo el orden por c_proceso descendente
        this.filteredData = [...this.allData];
        this.filteredData.sort((a, b) => {
            const procesoA = a.c_proceso || a.C_PROCESO || 0;
            const procesoB = b.c_proceso || b.C_PROCESO || 0;
            return procesoB - procesoA; // Ordenamiento numérico descendente
        });

        this.currentPage = 1;
        this.renderTabla();
        this.limpiarFiltrosDeURL();
    }

    /**
     * Renderiza la tabla con los datos filtrados
     */
    renderTabla() {
        const { generarTabla } = window.tableUI || {};

        if (generarTabla) {
            const columnas = this.obtenerConfiguracionColumnas();
            generarTabla(this.filteredData, 'tablaProcesos', columnas, undefined, this.currentPage, this.pageSize);
            this.renderPaginador();
        }
    }

    /**
     * Obtiene la configuración de columnas para la tabla
     * @returns {Array} Configuración de columnas
     */
    obtenerConfiguracionColumnas() {
        return [
            { key: 'C_PROCESO', header: 'Proceso', format: 'code' },
            { key: 'TIPO_EJECUCION', header: 'Tipo de Ejecución', format: 'code' },
            { key: 'C_PERIODO', header: 'Período', format: 'code' },
            { key: 'C_GRUPO', header: 'Grupo', format: 'code' },
            { key: 'F_INICIO', header: 'Inicio', format: 'date' },
            { key: 'F_FIN', header: 'Fin', format: 'date' },
            { key: 'DURACION_HHMM', header: 'DURACION', format: 'hour' },
            { key: 'C_ESTADO_CALCULO', header: 'C_ESTADO_CALCULO', format: 'code' },
            { key: 'TUVO_ERRORES', header: 'Tuvo Errores?', format: 'code' },
            {
                key: 'acciones',
                header: 'Acciones',
                format: 'btn',
                render: (item) => this.crearBotonesAccion(item)
            }
        ];
    }

    /**
     * Crea los botones de acción para cada fila
     * @param {Object} item - Elemento de la fila
     * @returns {DocumentFragment} Fragmento con los botones
     */
    crearBotonesAccion(item) {
        const fragment = document.createDocumentFragment();

        // Botón Ver
        const btnDetalle = document.createElement('a');
        btnDetalle.className = 'btn';
        btnDetalle.href = this.construirUrlDetalle(item.C_PROCESO);
        btnDetalle.textContent = 'Ver';

        // Espacio entre botones
        const espacio = document.createElement('span');
        espacio.style.display = 'inline-block';
        espacio.style.width = '12px';

        fragment.appendChild(btnDetalle);
        fragment.appendChild(espacio);

        return fragment;
    }

    /**
     * Construye la URL de detalle con filtros actuales
     * @param {string} codigoProceso - Código del proceso
     * @returns {string} URL construida
     */
    construirUrlDetalle(codigoProceso) {
        const filtroTipoInput = document.getElementById('filtroTipo');
        const filtroPeriodoInput = document.getElementById('filtroPeriodo');

        const currentFilters = {
            tipo: filtroTipoInput?.getValue ? filtroTipoInput.getValue() : filtroTipoInput?.value || '',
            periodo: filtroPeriodoInput?.value || ''
        };

        let url = `proceso.html?codigo=${codigoProceso}`;
        if (currentFilters.tipo) {
            url += `&filtroTipo=${encodeURIComponent(currentFilters.tipo)}`;
        }
        if (currentFilters.periodo) {
            url += `&filtroPeriodo=${encodeURIComponent(currentFilters.periodo)}`;
        }

        return url;
    }

    /**
     * Renderiza el paginador
     */
    renderPaginador() {
        const totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
        const paginador = document.getElementById('paginacionProcesos');

        if (!paginador) return;

        paginador.innerHTML = '';

        const btnWidth = 38;
        const paginadorWidth = paginador.offsetWidth || 400;
        let maxBtns = Math.floor(paginadorWidth / btnWidth);
        if (maxBtns < 5) maxBtns = 5;

        const btns = this.calcularBotonesPaginacion(this.currentPage, totalPages, maxBtns);

        btns.forEach((i) => {
            if (i === '...') {
                const span = document.createElement('span');
                span.textContent = '...';
                span.className = 'paginador-ellipsis';
                paginador.appendChild(span);
            } else {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.className = 'paginador-btn' + (i === this.currentPage ? ' active' : '');
                btn.style.margin = '4px 4px';
                btn.onclick = () => {
                    this.currentPage = i;
                    this.renderTabla();
                };
                paginador.appendChild(btn);
            }
        });
    }

    /**
     * Calcula qué botones mostrar en la paginación
     * @param {number} currentPage - Página actual
     * @param {number} totalPages - Total de páginas
     * @param {number} maxBtns - Máximo de botones a mostrar
     * @returns {Array} Array con los números de página y elipsis
     */
    calcularBotonesPaginacion(currentPage, totalPages, maxBtns) {
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
        return btns;
    }

    /**
     * Aplica filtros desde la URL al cargar la página
     */
    aplicarFiltrosDesdeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const filtroTipo = urlParams.get('filtroTipo');
        const filtroPeriodo = urlParams.get('filtroPeriodo');

        if (filtroTipo || filtroPeriodo) {
            if (filtroTipo) {
                const input = document.getElementById('filtroTipo');
                if (input?.setValue) {
                    input.setValue(filtroTipo);
                } else if (input) {
                    input.value = filtroTipo;
                }
            }

            if (filtroPeriodo) {
                const input = document.getElementById('filtroPeriodo');
                if (input) {
                    input.value = filtroPeriodo;
                }
            }

            // Ejecutar filtrado después de un breve delay para asegurar que los selectores estén configurados
            setTimeout(() => {
                this.ejecutarFiltrado();
            }, 100);
        }
    }

    /**
     * Guarda los filtros actuales en la URL
     */
    guardarFiltrosEnURL() {
        const filtroTipoInput = document.getElementById('filtroTipo');
        const filtroPeriodoInput = document.getElementById('filtroPeriodo');

        const tipo = filtroTipoInput?.getValue ? filtroTipoInput.getValue() : filtroTipoInput?.value || '';
        const periodo = filtroPeriodoInput?.value || '';

        const url = new URL(window.location);

        if (tipo) {
            url.searchParams.set('filtroTipo', tipo);
        } else {
            url.searchParams.delete('filtroTipo');
        }

        if (periodo) {
            url.searchParams.set('filtroPeriodo', periodo);
        } else {
            url.searchParams.delete('filtroPeriodo');
        }

        window.history.replaceState({}, '', url);
    }

    /**
     * Limpia los filtros de la URL
     */
    limpiarFiltrosDeURL() {
        const url = new URL(window.location);
        url.searchParams.delete('filtroTipo');
        url.searchParams.delete('filtroPeriodo');
        window.history.replaceState({}, '', url);
    }
}
