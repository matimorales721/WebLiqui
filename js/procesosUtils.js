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
        this.allData = procesos;
        this.filteredData = procesos;
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
                'c_tipo_ejecucion',
                'filtroTipo',
                'tipoDropdown',
                'Selecciona o escribe...',
                () => this.ejecutarFiltradoConDebounce()
            );

            // Crear selector de período
            crearSelectorPersonalizado(
                this.allData,
                'c_periodo',
                'filtroPeriodo',
                'periodoDropdown',
                'Selecciona o escribe...',
                () => this.ejecutarFiltradoConDebounce()
            );
        }
    }

    /**
     * Configura event listeners para botones y otros elementos
     */
    configurarEventListeners() {
        const limpiarBtn = document.getElementById('limpiarFiltros');
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

        const tipo = filtroTipoInput?.getValue ? filtroTipoInput.getValue() : (filtroTipoInput?.value || '');
        const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '');

        this.filteredData = this.allData.filter(proceso => {
            const coincideTipo = !tipo || proceso.c_tipo_ejecucion === tipo;
            const coincidePeriodo = !periodo || proceso.c_periodo === periodo;
            return coincideTipo && coincidePeriodo;
        });

        this.currentPage = 1;
        this.renderTabla();
        this.guardarFiltrosEnURL();
    }

    /**
     * Limpia todos los filtros
     */
    limpiarFiltros() {
        const inputs = ['filtroTipo', 'filtroPeriodo'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input?.setValue) {
                input.setValue('');
            } else if (input) {
                input.value = '';
            }
        });

        this.filteredData = this.allData;
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
        btnDetalle.href = this.construirUrlDetalle(item.c_proceso);
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
            tipo: filtroTipoInput?.getValue ? filtroTipoInput.getValue() : (filtroTipoInput?.value || ''),
            periodo: filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '')
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
        const paginador = document.getElementById('paginador');
        
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
                if (input?.setValue) {
                    input.setValue(filtroPeriodo);
                } else if (input) {
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
        
        const tipo = filtroTipoInput?.getValue ? filtroTipoInput.getValue() : (filtroTipoInput?.value || '');
        const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '');

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
