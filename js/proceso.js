import { generarTabla } from './tableUI.js';
import { parsearFecha, formatearFecha } from './formatters.js';
import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { DateUtils, TipoEjecucionUtils, ProcesoDataManager, CamposConfigManager, UrlUtils } from './procesoUtils.js';
import { cargarPracticas } from './practicasLoader.js';

// Variables globales
let tabManager;
let practicasGlobal = [];
let detalleGlobal = [];
let cabeceraGlobal = [];
let aprobCabeceraGlobal = [];
let validacionesGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();

    // Clase para manejar pestañas de manera unificada
    class TabManager {
        constructor() {
            this.tabs = {
                practicas: {
                    data: [],
                    filtered: [],
                    currentPage: 1,
                    pageSize: 10,
                    campos: [],
                    filtros: ['concepto', 'periodo', 'prestador', 'modulo', 'practica', 'beneficiario']
                },
                detalle: {
                    data: [],
                    filtered: [],
                    currentPage: 1,
                    pageSize: 10,
                    campos: [],
                    filtros: ['concepto', 'periodo_ex', 'prestador', 'modulo']
                },
                cabecera: {
                    data: [],
                    filtered: [],
                    currentPage: 1,
                    pageSize: 10,
                    campos: [],
                    filtros: ['concepto', 'periodo_ex', 'prestador', 'modulo']
                },
                aprob_cabecera: {
                    data: [],
                    filtered: [],
                    currentPage: 1,
                    pageSize: 10,
                    campos: [],
                    filtros: ['concepto', 'periodo_ex', 'prestador']
                }
            };
        }

        // Función genérica para renderizar tabla con paginación
        renderTabla(tabName) {
            const tab = this.tabs[tabName];
            const tableId = `tabla${this.capitalize(tabName)}`;
            const paginadorId = `paginador${this.capitalize(tabName)}`;

            generarTabla(tab.filtered, tableId, tab.campos, undefined, tab.currentPage, tab.pageSize);
            this.renderPaginador(tabName, paginadorId);
        }

        // Función genérica para renderizar paginador
        renderPaginador(tabName, paginadorId) {
            const tab = this.tabs[tabName];
            const totalPages = Math.max(1, Math.ceil(tab.filtered.length / tab.pageSize));
            const paginador = document.getElementById(paginadorId);

            if (!paginador) return;

            paginador.innerHTML = '';
            const btnWidth = 38;
            const paginadorWidth = paginador.offsetWidth || 400;
            let maxBtns = Math.floor(paginadorWidth / btnWidth);
            if (maxBtns < 5) maxBtns = 5;

            let btns = this.calcularBotonesPaginacion(tab.currentPage, totalPages, maxBtns);

            btns.forEach((i) => {
                if (i === '...') {
                    const span = document.createElement('span');
                    span.textContent = '...';
                    span.className = 'paginador-ellipsis';
                    span.style.padding = '8px 12px';
                    span.style.margin = '0 4px';
                    span.style.color = '#6c757d';
                    paginador.appendChild(span);
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = i;
                    const isActive = i === tab.currentPage;
                    btn.className = 'paginador-btn' + (isActive ? ' active' : '');

                    // Estilos base para todos los botones
                    btn.style.margin = '0 2px';
                    btn.style.padding = '8px 12px';
                    btn.style.border = '1px solid #dee2e6';
                    btn.style.borderRadius = '4px';
                    btn.style.cursor = 'pointer';
                    btn.style.fontSize = '14px';
                    btn.style.fontWeight = '500';
                    btn.style.transition = 'all 0.2s ease';
                    btn.style.minWidth = '36px';
                    btn.style.height = '36px';
                    btn.style.display = 'inline-flex';
                    btn.style.alignItems = 'center';
                    btn.style.justifyContent = 'center';

                    // Estilos específicos según si está activo o no
                    if (isActive) {
                        btn.style.backgroundColor = '#28a745';
                        btn.style.color = 'white';
                        btn.style.borderColor = '#28a745';
                        btn.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.25)';
                        btn.style.fontWeight = '600';
                    } else {
                        btn.style.backgroundColor = '#007bff';
                        btn.style.color = 'white';
                        btn.style.borderColor = '#007bff';
                    }

                    // Eventos hover
                    btn.addEventListener('mouseenter', () => {
                        if (!isActive) {
                            btn.style.backgroundColor = '#0056b3';
                            btn.style.borderColor = '#0056b3';
                        }
                    });

                    btn.addEventListener('mouseleave', () => {
                        if (!isActive) {
                            btn.style.backgroundColor = '#007bff';
                            btn.style.borderColor = '#007bff';
                        }
                    });

                    btn.onclick = () => {
                        tab.currentPage = i;
                        this.renderTabla(tabName);
                    };
                    paginador.appendChild(btn);
                }
            });
        }

        // Calcular qué botones mostrar en la paginación
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

        // Función genérica para filtrar datos
        filtrar(tabName) {
            const tab = this.tabs[tabName];
            const filtros = this.obtenerValoresFiltros(tabName);

            tab.filtered = tab.data.filter((item) => {
                return tab.filtros.every((filtro) => {
                    const valor = filtros[filtro];
                    if (!valor) return true;

                    const campo =
                        filtro === 'beneficiario'
                            ? 'n_beneficio'
                            : filtro === 'periodo'
                            ? 'c_periodo'
                            : filtro === 'periodo_ex'
                            ? 'c_periodo_ex'
                            : filtro === 'modulo'
                            ? tabName === 'detalle' || tabName === 'cabecera'
                                ? 'c_modulo_pami_4x'
                                : tabName === 'aprob_cabecera'
                                ? 'c_modulo_pami_7x'
                                : 'c_modulo_pami_4x'
                            : filtro === 'practica'
                            ? 'c_practica'
                            : `c_${filtro}`;

                    if (filtro === 'concepto') {
                        return item[campo]?.toLowerCase() === valor.toLowerCase();
                    }
                    return item[campo] == valor;
                });
            });

            tab.currentPage = 1;
            this.renderTabla(tabName);
        }

        // Obtener valores de los filtros de una pestaña
        obtenerValoresFiltros(tabName) {
            const tab = this.tabs[tabName];
            const filtros = {};

            tab.filtros.forEach((filtro) => {
                const inputId = `filtro${this.capitalize(filtro === 'periodo_ex' ? 'Periodo' : filtro)}_${tabName}`;
                const input = document.getElementById(inputId);
                filtros[filtro] = input?.getValue ? input.getValue() : input?.value || '';
            });

            return filtros;
        }

        // Limpiar filtros de una pestaña
        limpiarFiltros(tabName) {
            const tab = this.tabs[tabName];

            tab.filtros.forEach((filtro) => {
                const inputId = `filtro${this.capitalize(filtro === 'periodo_ex' ? 'Periodo' : filtro)}_${tabName}`;
                const input = document.getElementById(inputId);
                if (input?.setValue) {
                    input.setValue('');
                } else if (input) {
                    input.value = '';
                }
            });

            tab.filtered = tab.data;
            tab.currentPage = 1;
            this.renderTabla(tabName);
        }

        // Configurar selectores personalizados para una pestaña
        configurarSelectores(tabName) {
            const tab = this.tabs[tabName];

            tab.filtros.forEach((filtro) => {
                const campo =
                    filtro === 'beneficiario'
                        ? 'n_beneficio'
                        : filtro === 'periodo'
                        ? 'c_periodo'
                        : filtro === 'periodo_ex'
                        ? 'c_periodo_ex'
                        : filtro === 'modulo'
                        ? tabName === 'detalle' || tabName === 'cabecera'
                            ? 'c_modulo_pami_4x'
                            : tabName === 'aprob_cabecera'
                            ? 'c_modulo_pami_7x'
                            : 'c_modulo_pami_4x'
                        : filtro === 'practica'
                        ? 'c_practica'
                        : `c_${filtro}`;

                const inputId = `filtro${this.capitalize(filtro === 'periodo_ex' ? 'Periodo' : filtro)}_${tabName}`;
                const dropdownId = `${filtro === 'periodo_ex' ? 'periodo' : filtro}Dropdown_${tabName}`;

                crearSelectorPersonalizado(tab.data, campo, inputId, dropdownId, 'Selecciona o escribe...', () =>
                    this.filtrar(tabName)
                );
            });
        }

        // Configurar botón limpiar para una pestaña
        configurarBotonLimpiar(tabName) {
            const btnId = `limpiarFiltrosBtn_${tabName}`;
            const btn = document.getElementById(btnId);

            if (btn) {
                btn.addEventListener('click', () => this.limpiarFiltros(tabName));
            }
        }

        // Inicializar una pestaña
        inicializarTab(tabName, data, campos) {
            const tab = this.tabs[tabName];
            tab.data = data;
            tab.campos = campos;
            tab.filtered = data;

            this.configurarSelectores(tabName);
            this.renderTabla(tabName);
            this.configurarBotonLimpiar(tabName);
        }

        // Utility function para capitalizar
        capitalize(str) {
            if (str === 'aprob_cabecera') return 'AprobCabecera';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }

    // Instanciar el manager de pestañas
    tabManager = new TabManager();

    // Configuración de datos compartidos
    let camposImportantesPractica = [];
    let camposImportantesDetalle = [];
    let camposImportantesCabecera = [];
    let camposImportantesAprobCabecera = [];

    // Función utilitaria para cargar datos
    function cargarDatos(url, callback) {
        fetch(url)
            .then((response) => response.json())
            .then((data) => callback(data))
            .catch((error) => console.error('Error cargando datos:', error));
    }

    const codigoProceso = getParametroProceso(); // obtiene el código directamente de la URL

    // Definir campos importantes (configuración de las tablas)
    const configuracionCampos = {
        practicas: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'c_modulo_pami_4x', header: 'Cod. Módulo', format: 'code' },
            { key: 'd_modulo_pami', header: 'Módulo', format: 'text' },
            { key: 'c_practica', header: 'Cod. Práctica', format: 'code' },
            { key: 'd_practica', header: 'Práctica' },
            { key: 'n_beneficio', header: 'Beneficiario', format: 'code' },
            { key: 'n_orden_rechazo', header: 'N_OP', format: 'code' },
            { key: 'f_practica', header: 'Fecha Práctica', format: 'date' },
            { key: 'q_practica', header: 'Q_PRACT', format: 'numeric' },
            { key: 'q_pract_correctas', header: 'Q_CORR', format: 'numeric' },
            { key: 'c_id_practica', header: 'C_ID_PRACTICA', format: 'code' },
            {
                key: 'acciones',
                header: ' ',
                format: 'btn',
                render: (item) => {
                    const tieneValidaciones = validacionesGlobal.some(
                        (v) => v.c_id_practica == item.c_id_practica && v.c_proceso == codigoProceso
                    );

                    if (tieneValidaciones) {
                        const btn = document.createElement('button');
                        btn.className = 'btn btn-validaciones';
                        btn.textContent = 'Validaciones';
                        btn.onclick = () => navegarAValidaciones(codigoProceso, item.c_id_practica);
                        return btn;
                    }
                    return document.createTextNode('');
                }
            }
        ],
        detalle: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'c_modulo_pami_4x', header: 'Cod. Modulo', format: 'code' },
            { key: 'd_modulo_pami', header: 'Modulo' },
            { key: 'c_practica', header: 'Cod. Práctica', format: 'code' },
            { key: 'd_practica', header: 'Práctica' },
            { key: 'q_pract_correctas', header: 'Q_CORR', format: 'numeric' },
            { key: 'i_valor_practica', header: 'Valor Práctica', format: 'moneda' },
            { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' },
            {
                key: 'acciones',
                header: 'Ver Prácticas',
                format: 'btn',
                render: (item) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-practicas';
                    btn.textContent = 'Ver Prácticas';
                    btn.style.backgroundColor = '#6f42c1';
                    btn.style.fontSize = '0.8rem';
                    btn.style.padding = '0.3rem 0.6rem';
                    btn.onclick = () => navegarAPracticasConFiltros(item);
                    return btn;
                }
            }
        ],
        cabecera: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'c_modulo_pami_4x', header: 'Cod. Modulo', format: 'code' },
            { key: 'd_modulo_pami', header: 'Modulo' },
            { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' },
            {
                key: 'acciones',
                header: 'Ver Detalle',
                format: 'btn',
                render: (item) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-detalle';
                    btn.textContent = 'Ver Detalle';
                    btn.style.backgroundColor = '#007bff';
                    btn.style.fontSize = '0.8rem';
                    btn.style.padding = '0.3rem 0.6rem';
                    btn.onclick = () => navegarADetalleConFiltros(item);
                    return btn;
                }
            }
        ],
        aprob_cabecera: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'c_modulo_pami_7x', header: 'Cod. Modulo', format: 'code' },
            { key: 'd_modulo_pami', header: 'Modulo (7X)' },
            { key: 'i_monto_cab', header: 'I_MONTO_CAB', format: 'moneda' },
            { key: 'i_monto_resu', header: 'I_MONTO_RESU', format: 'moneda' },
            { key: 'i_monto', header: 'I_MONTO', format: 'moneda' },
            {
                key: 'acciones',
                header: 'Ver Cabecera',
                format: 'btn',
                render: (item) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-cabecera';
                    btn.textContent = 'Ver Cabecera';
                    btn.style.backgroundColor = '#28a745';
                    btn.style.fontSize = '0.8rem';
                    btn.style.padding = '0.3rem 0.6rem';
                    btn.onclick = () => navegarACabeceraConFiltros(item);
                    return btn;
                }
            }
        ]
    };

    Promise.all([
        cargarPracticas(codigoProceso),
        safeFetch(`../data/detalle-${codigoProceso}.json`),
        safeFetch(`../data/cabecera-${codigoProceso}.json`),
        safeFetch(`../data/aprob-cabecera-${codigoProceso}.json`),
        safeFetch(`../data/validaciones-${codigoProceso}.json`),
        safeFetch(`../data/procesos.json`)
    ])
        .then(([practicas, detalle, cabecera, aprobCabecera, validaciones, procesos]) => {
            const proceso = procesos.find((p) => parseInt(p.C_PROCESO) === codigoProceso);

            if (!proceso) {
                mostrarMensajeProcesoNoEncontrado(codigoProceso);
                return;
            }

            // Poblar detalles del proceso
            document.getElementById('codigo').textContent = proceso.C_PROCESO;
            document.getElementById('tipo').textContent = proceso.TIPO_EJECUCION;
            proceso.TIPO_EJECUCION === 'E'
                ? 'Excepción'
                : proceso.TIPO_EJECUCION === 'M'
                ? 'Mensual'
                : proceso.TIPO_EJECUCION;

            document.getElementById('periodo').textContent = proceso.C_PERIODO;

            // Formatear fechas usando parsearFecha y formatearFecha
            if (proceso.F_INICIO) {
                const fechaInicio = parsearFecha(proceso.F_INICIO);
                if (fechaInicio && !isNaN(fechaInicio.getTime())) {
                    document.getElementById('inicio').textContent = formatearFecha(fechaInicio, true);
                }
            }

            if (proceso.F_FIN) {
                const fechaFin = parsearFecha(proceso.F_FIN);
                if (fechaFin && !isNaN(fechaFin.getTime())) {
                    document.getElementById('fin').textContent = formatearFecha(fechaFin, true);
                }
            }

            document.getElementById('duracion').textContent = calcularDuracion(proceso.F_INICIO, proceso.F_FIN);

            document.getElementById('btnLogs').addEventListener('click', () => {
                window.location.href = `logs.html?codigo=${proceso.codigo}`;
            });

            // Guardar datos globales
            practicasGlobal = practicas;
            detalleGlobal = detalle;
            cabeceraGlobal = cabecera;
            aprobCabeceraGlobal = aprobCabecera;
            validacionesGlobal = validaciones;

            // Inicializar pestañas usando el TabManager
            tabManager.inicializarTab('aprob_cabecera', aprobCabeceraGlobal, configuracionCampos.aprob_cabecera);
            tabManager.inicializarTab('cabecera', cabeceraGlobal, configuracionCampos.cabecera);
            tabManager.inicializarTab('detalle', detalleGlobal, configuracionCampos.detalle);
            tabManager.inicializarTab('practicas', practicasGlobal, configuracionCampos.practicas);
        })
        .catch((error) => {
            console.error('Error cargando datos del proceso:', error);
            // Si hay error al cargar datos, mostrar mensaje de proceso no encontrado
            mostrarMensajeProcesoNoEncontrado(codigoProceso);
        });
});

// Función para navegar a la pestaña Cabecera con filtros aplicados
function navegarACabeceraConFiltros(item) {
    // Mostrar indicador visual de carga en el botón
    const btn = event.target;
    const originalText = btn.textContent;
    const originalBg = btn.style.backgroundColor;

    // Animación del botón
    btn.textContent = '⏳ Cargando...';
    btn.style.backgroundColor = '#17a2b8';
    btn.style.transform = 'scale(0.95)';
    btn.style.transition = 'all 0.3s ease';
    btn.disabled = true;

    // Cambiar a la pestaña cabecera con animación suave
    window.showTab('cabecera');

    // Aplicar filtros basados en la fila seleccionada
    setTimeout(() => {
        // Filtro por concepto
        const filtroConcepto = document.getElementById('filtroConcepto_cabecera');
        if (filtroConcepto && filtroConcepto.setValue) {
            filtroConcepto.setValue(item.c_concepto || '');
        }

        // Filtro por periodo
        const filtroPeriodo = document.getElementById('filtroPeriodo_cabecera');
        if (filtroPeriodo && filtroPeriodo.setValue) {
            filtroPeriodo.setValue(item.c_periodo_ex || '');
        }

        // Filtro por prestador
        const filtroPrestador = document.getElementById('filtroPrestador_cabecera');
        if (filtroPrestador && filtroPrestador.setValue) {
            filtroPrestador.setValue(item.c_prestador || '');
        }

        // Filtro por módulo - Buscar el módulo correspondiente en cabecera
        const filtroModulo = document.getElementById('filtroModulo_cabecera');
        if (filtroModulo && filtroModulo.setValue && cabeceraGlobal && cabeceraGlobal.length > 0) {
            // Buscar el módulo correspondiente en los datos de cabecera por prestador y descripción
            const moduloEnCabecera = cabeceraGlobal.find(
                (c) =>
                    c.c_concepto === item.c_concepto &&
                    c.c_periodo_ex === item.c_periodo_ex &&
                    c.c_prestador === item.c_prestador &&
                    (c.d_modulo_pami === item.d_modulo_pami || c.d_modulo_pami?.includes(item.d_modulo_pami))
            );

            if (moduloEnCabecera && moduloEnCabecera.c_modulo_pami_4x) {
                filtroModulo.setValue(moduloEnCabecera.c_modulo_pami_4x);
            } else {
                // Si no encuentra correspondencia exacta, limpiar el filtro de módulo
                filtroModulo.setValue('');
            }
        }

        // Aplicar el filtrado usando el tabManager
        if (tabManager && typeof tabManager.filtrar === 'function') {
            tabManager.filtrar('cabecera');
        }

        // Mostrar mensaje informativo
        console.log(
            `Navegando a Cabecera con filtros: Concepto=${item.c_concepto}, Período=${item.c_periodo_ex}, Prestador=${item.c_prestador}`
        );
    }, 200);

    // Restaurar botón después del filtrado
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = originalBg;
        btn.style.transform = 'scale(1)';
        btn.disabled = false;
    }, 600);
}

// Función para navegar a la pestaña Detalle con filtros aplicados
function navegarADetalleConFiltros(item) {
    // Mostrar indicador visual de carga en el botón
    const btn = event.target;
    const originalText = btn.textContent;
    const originalBg = btn.style.backgroundColor;

    // Animación del botón
    btn.textContent = '⏳ Cargando...';
    btn.style.backgroundColor = '#17a2b8';
    btn.style.transform = 'scale(0.95)';
    btn.style.transition = 'all 0.3s ease';
    btn.disabled = true;

    // Cambiar a la pestaña detalle con animación suave
    window.showTab('detalle');

    // Aplicar filtros basados en la fila seleccionada
    setTimeout(() => {
        // Filtro por concepto
        const filtroConcepto = document.getElementById('filtroConcepto_detalle');
        if (filtroConcepto && filtroConcepto.setValue) {
            filtroConcepto.setValue(item.c_concepto || '');
        }

        // Filtro por periodo
        const filtroPeriodo = document.getElementById('filtroPeriodo_detalle');
        if (filtroPeriodo && filtroPeriodo.setValue) {
            filtroPeriodo.setValue(item.c_periodo_ex || '');
        }

        // Filtro por prestador
        const filtroPrestador = document.getElementById('filtroPrestador_detalle');
        if (filtroPrestador && filtroPrestador.setValue) {
            filtroPrestador.setValue(item.c_prestador || '');
        }

        // Filtro por módulo - usar directamente el módulo de cabecera (4x)
        const filtroModulo = document.getElementById('filtroModulo_detalle');
        if (filtroModulo && filtroModulo.setValue) {
            filtroModulo.setValue(item.c_modulo_pami_4x || '');
        }

        // Aplicar el filtrado usando el tabManager
        if (tabManager && typeof tabManager.filtrar === 'function') {
            tabManager.filtrar('detalle');
        }

        // Mostrar mensaje informativo
        console.log(
            `Navegando a Detalle con filtros: Concepto=${item.c_concepto}, Período=${item.c_periodo_ex}, Prestador=${item.c_prestador}, Módulo=${item.c_modulo_pami_4x}`
        );
    }, 200);

    // Restaurar botón después del filtrado
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = originalBg;
        btn.style.transform = 'scale(1)';
        btn.disabled = false;
    }, 600);
}

// Función para navegar a la pestaña Prácticas con filtros aplicados
function navegarAPracticasConFiltros(item) {
    // Mostrar indicador visual de carga en el botón
    const btn = event.target;
    const originalText = btn.textContent;
    const originalBg = btn.style.backgroundColor;

    // Animación del botón
    btn.textContent = '⏳ Cargando...';
    btn.style.backgroundColor = '#17a2b8';
    btn.style.transform = 'scale(0.95)';
    btn.style.transition = 'all 0.3s ease';
    btn.disabled = true;

    // Cambiar a la pestaña practicas con animación suave
    window.showTab('practicas');

    // Aplicar filtros basados en la fila seleccionada
    setTimeout(() => {
        // Filtro por concepto
        const filtroConcepto = document.getElementById('filtroConcepto_practicas');
        if (filtroConcepto && filtroConcepto.setValue) {
            filtroConcepto.setValue(item.c_concepto || '');
        }

        // Filtro por periodo - mapear de periodo_ex a periodo
        const filtroPeriodo = document.getElementById('filtroPeriodo_practicas');
        if (filtroPeriodo && filtroPeriodo.setValue) {
            // En prácticas se usa c_periodo, pero en detalle viene c_periodo_ex
            filtroPeriodo.setValue(item.c_periodo_ex || '');
        }

        // Filtro por prestador
        const filtroPrestador = document.getElementById('filtroPrestador_practicas');
        if (filtroPrestador && filtroPrestador.setValue) {
            filtroPrestador.setValue(item.c_prestador || '');
        }

        // Filtro por módulo - usar directamente el módulo de detalle (4x)
        const filtroModulo = document.getElementById('filtroModulo_practicas');
        if (filtroModulo && filtroModulo.setValue) {
            filtroModulo.setValue(item.c_modulo_pami_4x || '');
        }

        // Filtro por práctica - usar el código de práctica específico
        const filtroPractica = document.getElementById('filtroPractica_practicas');
        if (filtroPractica && filtroPractica.setValue) {
            filtroPractica.setValue(item.c_practica || '');
        }

        // Aplicar el filtrado usando el tabManager
        if (tabManager && typeof tabManager.filtrar === 'function') {
            tabManager.filtrar('practicas');
        }

        // Mostrar mensaje informativo
        console.log(
            `Navegando a Prácticas con filtros: Concepto=${item.c_concepto}, Período=${item.c_periodo_ex}, Prestador=${item.c_prestador}, Módulo=${item.c_modulo_pami_4x}, Práctica=${item.c_practica}`
        );
    }, 200);

    // Restaurar botón después del filtrado
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = originalBg;
        btn.style.transform = 'scale(1)';
        btn.disabled = false;
    }, 600);
}

// Navega a la página de validaciones con los parámetros correctos
function navegarAValidaciones(codigo, c_id_practica) {
    // Guardar el estado actual de la página de prácticas
    const estadoPracticas = {
        scrollY: window.scrollY,
        filtros: {},
        paginaActual: tabManager?.tabs?.practicas?.currentPage || 1,
        tamañoPagina: tabManager?.tabs?.practicas?.pageSize || 10
    };

    // Guardar filtros aplicados
    if (tabManager?.tabs?.practicas?.filtros) {
        tabManager.tabs.practicas.filtros.forEach((filtro) => {
            const inputId = `filtro${tabManager.capitalize(filtro === 'periodo_ex' ? 'Periodo' : filtro)}_practicas`;
            const input = document.getElementById(inputId);
            if (input) {
                estadoPracticas.filtros[filtro] = input?.getValue ? input.getValue() : input?.value || '';
            }
        });
    }

    // Guardar en sessionStorage para persistir entre páginas
    sessionStorage.setItem('estadoPracticas', JSON.stringify(estadoPracticas));
    console.log('Estado guardado antes de navegar a validaciones:', estadoPracticas);

    // Navegar a validaciones
    UrlUtils.navegarAValidaciones(codigo, c_id_practica);
}

// Extrae el código de proceso de la URL
export function getParametroProceso() {
    return UrlUtils.getParametroProceso();
}

// Función para construir URL de vuelta a procesos con filtros
function construirUrlVueltaProcesos() {
    return UrlUtils.construirUrlVueltaProcesos();
}

window.showTab = (tabId) => {
    // Remover clase active de todos los contenidos de pestañas
    document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));

    // Remover clase active de todas las pestañas
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));

    // Activar el contenido de la pestaña correspondiente
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Activar la pestaña correspondiente usando un selector más específico
    // Buscar exactamente la coincidencia entre comillas simples
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab) => {
        const onclickContent = tab.getAttribute('onclick');
        if (onclickContent) {
            // Buscar exactamente showTab('tabId') - coincidencia exacta
            const match = onclickContent.match(/showTab\('([^']+)'\)/);
            if (match && match[1] === tabId) {
                tab.classList.add('active');
            }
        }
    });
};

// Verificar si hay un hash en la URL al cargar la página para activar una pestaña específica
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);

    if (hash && hash.startsWith('#')) {
        const tabId = hash.substring(1);
        // Esperar un poco para que las pestañas se inicialicen
        setTimeout(() => {
            if (document.getElementById(tabId)) {
                window.showTab(tabId);

                // Si venimos de validaciones y tenemos el parámetro restore, restaurar estado
                if (tabId === 'practicas' && urlParams.get('restore') === 'true') {
                    console.log('Detectado parámetro restore=true para la pestaña prácticas');
                    // Restaurar estado con un delay adicional para asegurar que la tabla esté renderizada
                    setTimeout(() => {
                        restaurarEstadoPracticas();
                    }, 1500); // Aumentar el delay para dar más tiempo a la inicialización
                }
            }
        }, 800); // Aumentar también este delay inicial
    }
});

// Función para restaurar el estado de la pestaña prácticas
function restaurarEstadoPracticas() {
    try {
        const estadoSession = sessionStorage.getItem('estadoPracticas');
        if (!estadoSession) {
            console.log('No hay estado guardado para restaurar');
            return;
        }

        const estado = JSON.parse(estadoSession);
        console.log('Restaurando estado:', estado);

        // Función para intentar restaurar con reintentos
        const intentarRestaurar = (intentos = 0) => {
            const maxIntentos = 10;

            // Verificar que tabManager esté listo
            if (!tabManager || !tabManager.tabs || !tabManager.tabs.practicas || intentos >= maxIntentos) {
                if (intentos >= maxIntentos) {
                    console.warn('Se agotaron los intentos para restaurar el estado');
                }
                sessionStorage.removeItem('estadoPracticas');
                return;
            }

            // Restaurar filtros
            if (estado.filtros && tabManager.tabs.practicas.filtros) {
                let filtrosAplicados = 0;
                tabManager.tabs.practicas.filtros.forEach((filtro) => {
                    const inputId = `filtro${tabManager.capitalize(
                        filtro === 'periodo_ex' ? 'Periodo' : filtro
                    )}_practicas`;
                    const input = document.getElementById(inputId);
                    const valorFiltro = estado.filtros[filtro];

                    if (input && valorFiltro) {
                        if (input.setValue) {
                            input.setValue(valorFiltro);
                            filtrosAplicados++;
                        } else if (input.value !== undefined) {
                            input.value = valorFiltro;
                            filtrosAplicados++;
                        }
                    }
                });

                console.log(`Filtros aplicados: ${filtrosAplicados}`);
            }

            // Restaurar página actual y tamaño de página antes de aplicar filtros
            if (estado.paginaActual) {
                tabManager.tabs.practicas.currentPage = estado.paginaActual;
            }
            if (estado.tamañoPagina) {
                tabManager.tabs.practicas.pageSize = estado.tamañoPagina;

                // Actualizar el selector de tamaño de página si existe
                const pageSizeSelect = document.getElementById('pageSizePracticas');
                if (pageSizeSelect) {
                    pageSizeSelect.value = estado.tamañoPagina;
                }
            }

            // Aplicar filtros y re-renderizar manteniendo la página actual
            setTimeout(() => {
                if (tabManager && typeof tabManager.filtrar === 'function') {
                    // Guardar temporalmente la página actual antes de filtrar
                    const paginaGuardada = estado.paginaActual;

                    // Aplicar filtros (esto resetea currentPage a 1)
                    tabManager.filtrar('practicas');

                    // Restaurar la página después del filtrado
                    if (paginaGuardada) {
                        tabManager.tabs.practicas.currentPage = paginaGuardada;
                        // Re-renderizar la tabla con la página correcta
                        tabManager.renderTabla('practicas');
                    }

                    console.log(`Filtros aplicados y tabla re-renderizada en página: ${paginaGuardada || 1}`);

                    // Restaurar posición del scroll después de que se renderice todo
                    setTimeout(() => {
                        if (estado.scrollY) {
                            window.scrollTo({
                                top: estado.scrollY,
                                behavior: 'smooth'
                            });
                            console.log(`Scroll restaurado a posición: ${estado.scrollY}`);
                        }
                    }, 500);
                }
            }, 300);

            // Limpiar el estado guardado después de usarlo
            sessionStorage.removeItem('estadoPracticas');
            console.log('Estado de prácticas restaurado exitosamente');

            // Limpiar la URL del parámetro restore después de la restauración
            setTimeout(() => {
                const url = new URL(window.location);
                url.searchParams.delete('restore');
                window.history.replaceState({}, '', url.toString());
                console.log('URL limpiada después de la restauración');
            }, 1000);
        };

        // Intentar restaurar inmediatamente o después de un delay
        if (tabManager && tabManager.tabs && tabManager.tabs.practicas) {
            intentarRestaurar();
        } else {
            // Reintentar cada 200ms hasta que tabManager esté listo
            const intervalo = setInterval(() => {
                if (tabManager && tabManager.tabs && tabManager.tabs.practicas) {
                    clearInterval(intervalo);
                    intentarRestaurar();
                }
            }, 200);

            // Limpiar el intervalo después de 5 segundos máximo
            setTimeout(() => clearInterval(intervalo), 5000);
        }
    } catch (error) {
        console.error('Error restaurando estado de prácticas:', error);
        // Limpiar sessionStorage en caso de error
        sessionStorage.removeItem('estadoPracticas');
    }
}

// Inicializar botones de vuelta a procesos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Configurar botón de volver a procesos (escritorio)
    const btnVolver = document.getElementById('btnVolverProcesos');
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            window.location.href = construirUrlVueltaProcesos();
        });
    }

    // Configurar botón de volver a procesos (móvil)
    const btnVolverMobile = document.getElementById('btnVolverProcesosMobile');
    if (btnVolverMobile) {
        btnVolverMobile.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = construirUrlVueltaProcesos();
        });
    }
});

function calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return '';

    try {
        // Usar la función parsearFecha de formatters.js que maneja múltiples formatos
        const inicioDate = parsearFecha(inicio);
        const finDate = parsearFecha(fin);

        if (!inicioDate || !finDate || isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
            return '';
        }

        const diffMs = finDate - inicioDate;
        const diffMin = diffMs / 60000;

        if (diffMin < 60) {
            return `${Math.round(diffMin)} minutos`;
        } else {
            const horas = Math.floor(diffMin / 60);
            const minutos = Math.round(diffMin % 60);
            const minutosFormateados = minutos.toString().padStart(2, '0');
            return `${horas}:${minutosFormateados} horas`;
        }
    } catch (error) {
        console.error('Error calculando duración:', error);
        return '';
    }
}

/**
 * Muestra un mensaje elegante cuando no se encuentra un proceso
 * @param {number} codigoProceso - Código del proceso no encontrado
 */
function mostrarMensajeProcesoNoEncontrado(codigoProceso) {
    // Ocultar el contenido principal
    const mainContent = document.querySelector('.content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 60vh; padding: 2rem;">
                <div style="
                    background: linear-gradient(135deg, #e3f0ff 0%, #f7fafc 100%);
                    border: 1px solid #d0e2ff;
                    border-radius: 18px;
                    padding: 3rem 2rem;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.1);
                    max-width: 500px;
                    width: 100%;
                    color: #1b3a6b;
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: linear-gradient(45deg, transparent 30%, rgba(37, 99, 235, 0.05) 50%, transparent 70%);
                        animation: shine 3s infinite;
                    "></div>
                    
                    <div style="position: relative; z-index: 2;">
                        <div style="
                            background: linear-gradient(135deg, #2563eb 0%, #1b3a6b 100%);
                            border-radius: 50%;
                            width: 80px;
                            height: 80px;
                            margin: 0 auto 1.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 2.5rem;
                            box-shadow: 0 4px 18px rgba(37, 99, 235, 0.2);
                        ">
                            🔍
                        </div>
                        
                        <h2 style="
                            margin: 0 0 1rem 0;
                            font-size: 1.8rem;
                            font-weight: 700;
                            color: #1b3a6b;
                            letter-spacing: 0.5px;
                        ">
                            Proceso No Encontrado
                        </h2>
                        
                        <p style="
                            margin: 0 0 1.5rem 0;
                            font-size: 1rem;
                            color: #2563eb;
                            line-height: 1.5;
                            font-weight: 500;
                        ">
                            El proceso <strong style="color: #1b3a6b;">#${codigoProceso}</strong> no se encuentra cargado en el sistema WebLiqui.
                        </p>
                        
                        <div style="
                            background: linear-gradient(135deg, #b4cefa 0%, #d0e2ff 100%);
                            border: 1px solid #2563eb;
                            border-radius: 12px;
                            padding: 1rem;
                            margin: 1.5rem 0;
                            font-size: 0.9rem;
                            color: #1b3a6b;
                            box-shadow: 0 2px 10px rgba(37, 99, 235, 0.08);
                        ">
                            💡 <strong>Sugerencias:</strong><br>
                            • Verifica que el código sea correcto<br>
                            • Asegúrate de que el proceso esté procesado<br>
                            • Contacta al administrador si persiste el problema
                        </div>
                        
                        <button onclick="window.history.back()" style="
                            background: linear-gradient(135deg, #f7fafc 0%, #e3f0ff 100%);
                            border: 2px solid #2563eb;
                            color: #2563eb;
                            padding: 0.75rem 2rem;
                            border-radius: 25px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            margin-right: 1rem;
                            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
                        " onmouseover="this.style.background='linear-gradient(135deg, #e3f0ff 0%, #d0e2ff 100%)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.2)'" 
                           onmouseout="this.style.background='linear-gradient(135deg, #f7fafc 0%, #e3f0ff 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(37, 99, 235, 0.1)'">
                            ← Volver
                        </button>
                        
                        <button onclick="window.location.href='procesos.html'" style="
                            background: linear-gradient(135deg, #2563eb 0%, #1b3a6b 100%);
                            border: none;
                            color: white;
                            padding: 0.75rem 2rem;
                            border-radius: 25px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 18px rgba(37, 99, 235, 0.2);
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 24px rgba(37, 99, 235, 0.3)'" 
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 18px rgba(37, 99, 235, 0.2)'">
                            Ver Procesos
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes shine {
                    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }
            </style>
        `;
    }
}
