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
let codigoProceso;

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

// Estado del lazy loading de prácticas
const ESTADO_PRACTICAS = {
    cargadas: false,
    cargando: false,
    codigoProceso: null
};

// Constantes para configuración
const CONFIGURACION = {
    DELAYS: {
        FILTROS_APLICACION: 200,
        RESTAURACION_BOTON: 600,
        INICIALIZACION_PESTAÑAS: 800,
        RESTAURACION_ESTADO: 500
    },
    STORAGE_KEYS: {
        RECORDAR_CARGA: 'recordarCargaPracticas',
        ESTADO_PRACTICAS: 'estadoPracticas'
    },
    Z_INDEX: {
        POPUP: 10000,
        LOADER: 1000
    }
};

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

    // Inicializar el código de proceso
    codigoProceso = getParametroProceso(); // obtiene el código directamente de la URL

    Promise.all([
        safeFetch(`../data/detalle-${codigoProceso}.json`),
        safeFetch(`../data/cabecera-${codigoProceso}.json`),
        safeFetch(`../data/aprob-cabecera-${codigoProceso}.json`),
        safeFetch(`../data/validaciones-${codigoProceso}.json`),
        safeFetch(`../data/procesos.json`)
    ])
        .then(([detalle, cabecera, aprobCabecera, validaciones, procesos]) => {
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
            ESTADO_PRACTICAS.codigoProceso = codigoProceso;
            practicasGlobal = []; // Se cargará lazy
            detalleGlobal = detalle;
            cabeceraGlobal = cabecera;
            aprobCabeceraGlobal = aprobCabecera;
            validacionesGlobal = validaciones;

            // Inicializar pestañas usando el TabManager (excepto prácticas)
            tabManager.inicializarTab('aprob_cabecera', aprobCabeceraGlobal, configuracionCampos.aprob_cabecera);
            tabManager.inicializarTab('cabecera', cabeceraGlobal, configuracionCampos.cabecera);
            tabManager.inicializarTab('detalle', detalleGlobal, configuracionCampos.detalle);
            // Prácticas se inicializa lazy
        })
        .catch((error) => {
            console.error('Error cargando datos del proceso:', error);
            // Si hay error al cargar datos, mostrar mensaje de proceso no encontrado
            mostrarMensajeProcesoNoEncontrado(codigoProceso);
        });
});

// Utilidades para manejo de botones
const ButtonUtils = {
    /**
     * Aplica estado de carga a un botón
     * @param {HTMLElement} btn - El botón a modificar
     * @returns {Object} Estado original del botón
     */
    aplicarEstadoCarga(btn) {
        const estadoOriginal = {
            texto: btn.textContent,
            backgroundColor: btn.style.backgroundColor,
            disabled: btn.disabled
        };

        btn.textContent = '⏳ Cargando...';
        btn.style.backgroundColor = '#17a2b8';
        btn.style.transform = 'scale(0.95)';
        btn.style.transition = 'all 0.3s ease';
        btn.disabled = true;

        return estadoOriginal;
    },

    /**
     * Restaura el estado original de un botón
     * @param {HTMLElement} btn - El botón a restaurar
     * @param {Object} estadoOriginal - Estado original del botón
     */
    restaurarEstado(btn, estadoOriginal) {
        btn.textContent = estadoOriginal.texto;
        btn.style.backgroundColor = estadoOriginal.backgroundColor;
        btn.style.transform = 'scale(1)';
        btn.disabled = estadoOriginal.disabled;
    }
};

// Utilidades para manejo de filtros
const FiltroUtils = {
    /**
     * Aplica filtros a una pestaña basado en un item
     * @param {string} tabName - Nombre de la pestaña
     * @param {Object} item - Item con datos para filtrar
     * @param {Object} mapeoFiltros - Mapeo de filtros específicos
     */
    aplicarFiltrosDesdeItem(tabName, item, mapeoFiltros = {}) {
        const filtrosDefault = {
            concepto: item.c_concepto,
            periodo: item.c_periodo_ex,
            prestador: item.c_prestador,
            modulo: item.c_modulo_pami_4x || item.c_modulo_pami_7x,
            practica: item.c_practica
        };

        const filtros = { ...filtrosDefault, ...mapeoFiltros };

        Object.entries(filtros).forEach(([filtro, valor]) => {
            if (valor) {
                const inputId = `filtro${this.capitalizarFiltro(filtro)}_${tabName}`;
                const input = document.getElementById(inputId);
                if (input?.setValue) {
                    input.setValue(valor);
                }
            }
        });

        // Aplicar filtrado
        if (tabManager?.filtrar) {
            tabManager.filtrar(tabName);
        }
    },

    capitalizarFiltro(filtro) {
        return filtro === 'periodo_ex' ? 'Periodo' : filtro.charAt(0).toUpperCase() + filtro.slice(1);
    }
};

// Función genérica para navegación entre pestañas con filtros
async function navegarConFiltros(tabDestino, item, configuracionEspecial = {}) {
    const btn = event.target;
    const estadoOriginal = ButtonUtils.aplicarEstadoCarga(btn);

    try {
        // Si es prácticas y no están cargadas, manejar lazy loading
        if (tabDestino === 'practicas' && !ESTADO_PRACTICAS.cargadas && !ESTADO_PRACTICAS.cargando) {
            const debeCargar = await confirmarCargaPracticasLazy();
            if (!debeCargar) {
                ButtonUtils.restaurarEstado(btn, estadoOriginal);
                return;
            }

            // Mostrar la pestaña primero
            mostrarPestaña('practicas');

            // Verificar que el elemento tabla exista antes de continuar
            await new Promise((resolve) => setTimeout(resolve, 100));
            const tablaPracticas = document.getElementById('tablaPracticas');
            if (!tablaPracticas) {
                console.error('❌ No se encontró el elemento tablaPracticas en el DOM');
                ButtonUtils.restaurarEstado(btn, estadoOriginal);
                return;
            }

            // Mostrar loader
            mostrarLoaderEnPestaña('practicas');

            try {
                ESTADO_PRACTICAS.cargando = true;

                // Cargar las prácticas
                console.log('🔄 Iniciando carga lazy de prácticas...');
                const practicas = await cargarPracticas(ESTADO_PRACTICAS.codigoProceso);

                // Guardar datos y marcar como cargadas
                practicasGlobal = practicas;
                ESTADO_PRACTICAS.cargadas = true;

                // Inicializar la pestaña de prácticas
                tabManager.inicializarTab('practicas', practicasGlobal, configuracionCampos.practicas);

                console.log('✅ Prácticas cargadas exitosamente');
            } catch (error) {
                console.error('❌ Error cargando prácticas:', error);
                mostrarErrorCargaEnPestaña('practicas');
                ButtonUtils.restaurarEstado(btn, estadoOriginal);
                return;
            } finally {
                ESTADO_PRACTICAS.cargando = false;
                ocultarLoaderEnPestaña('practicas');
            }
        } else if (tabDestino === 'practicas' && ESTADO_PRACTICAS.cargadas) {
            // Si prácticas ya están cargadas, solo mostrar la pestaña
            mostrarPestaña(tabDestino);
        } else {
            // Para otras pestañas, navegación normal
            mostrarPestaña(tabDestino);
        }

        // Aplicar filtros después de un delay
        setTimeout(() => {
            FiltroUtils.aplicarFiltrosDesdeItem(tabDestino, item, configuracionEspecial.mapeoFiltros);

            // Log informativo
            const filtrosInfo = Object.entries(configuracionEspecial.mapeoFiltros || {})
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');
            console.log(`Navegando a ${tabDestino} con filtros: ${filtrosInfo}`);
        }, CONFIGURACION.DELAYS.FILTROS_APLICACION);
    } catch (error) {
        console.error(`Error navegando a ${tabDestino}:`, error);
        ButtonUtils.restaurarEstado(btn, estadoOriginal);
    } finally {
        // Restaurar botón
        setTimeout(() => {
            ButtonUtils.restaurarEstado(btn, estadoOriginal);
        }, CONFIGURACION.DELAYS.RESTAURACION_BOTON);
    }
}

// Función para navegar a la pestaña Cabecera con filtros aplicados
function navegarACabeceraConFiltros(item) {
    navegarConFiltros('cabecera', item, {
        mapeoFiltros: {
            // Lógica específica para cabecera
            modulo: (() => {
                const moduloEnCabecera = cabeceraGlobal?.find(
                    (c) =>
                        c.c_concepto === item.c_concepto &&
                        c.c_periodo_ex === item.c_periodo_ex &&
                        c.c_prestador === item.c_prestador &&
                        (c.d_modulo_pami === item.d_modulo_pami || c.d_modulo_pami?.includes(item.d_modulo_pami))
                );
                return moduloEnCabecera?.c_modulo_pami_4x || '';
            })()
        }
    });
}

// Función para navegar a la pestaña Detalle con filtros aplicados
function navegarADetalleConFiltros(item) {
    navegarConFiltros('detalle', item);
}

// Función para navegar a la pestaña Prácticas con filtros aplicados
function navegarAPracticasConFiltros(item) {
    navegarConFiltros('practicas', item);
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
    sessionStorage.setItem(CONFIGURACION.STORAGE_KEYS.ESTADO_PRACTICAS, JSON.stringify(estadoPracticas));
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
    // Si es la pestaña de prácticas y no están cargadas, manejar lazy loading
    if (tabId === 'practicas' && !ESTADO_PRACTICAS.cargadas && !ESTADO_PRACTICAS.cargando) {
        ejecutarCargaPracticasLazy();
        return;
    }

    // Comportamiento normal para otras pestañas o si prácticas ya están cargadas
    mostrarPestaña(tabId);
};

// Función separada para mostrar la pestaña (comportamiento original)
function mostrarPestaña(tabId) {
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
}

// Función principal para manejar la carga lazy de prácticas (para llamadas directas como showTab)
async function ejecutarCargaPracticasLazy() {
    // Si ya están cargadas, solo mostrar la pestaña
    if (ESTADO_PRACTICAS.cargadas) {
        mostrarPestaña('practicas');
        return;
    }

    // Si ya se está cargando, esperar
    if (ESTADO_PRACTICAS.cargando) {
        return;
    }

    // Verificar si el usuario quiere cargar las prácticas
    const debeCargar = await confirmarCargaPracticasLazy();
    if (!debeCargar) {
        return;
    }

    // Mostrar la pestaña primero y esperar un momento para que el DOM se actualice
    mostrarPestaña('practicas');

    // Pequeño delay para asegurar que el elemento esté disponible en el DOM
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar que el elemento tabla exista antes de continuar
    const tablaPracticas = document.getElementById('tablaPracticas');
    if (!tablaPracticas) {
        console.error('❌ No se encontró el elemento tablaPracticas en el DOM');
        mostrarErrorCargaEnPestaña('practicas');
        return;
    }

    // Mostrar loader en la pestaña de prácticas
    mostrarLoaderEnPestaña('practicas');

    try {
        ESTADO_PRACTICAS.cargando = true;

        // Cargar las prácticas
        console.log('🔄 Iniciando carga lazy de prácticas...');
        const practicas = await cargarPracticas(ESTADO_PRACTICAS.codigoProceso);

        // Guardar datos y marcar como cargadas
        practicasGlobal = practicas;
        ESTADO_PRACTICAS.cargadas = true;

        // Inicializar la pestaña de prácticas
        tabManager.inicializarTab('practicas', practicasGlobal, configuracionCampos.practicas);

        console.log('✅ Prácticas cargadas exitosamente');
    } catch (error) {
        console.error('❌ Error cargando prácticas:', error);
        mostrarErrorCargaEnPestaña('practicas');
    } finally {
        ESTADO_PRACTICAS.cargando = false;
        ocultarLoaderEnPestaña('practicas');
    }
}

// Función para confirmar si el usuario quiere cargar las prácticas
async function confirmarCargaPracticasLazy() {
    // Verificar si el usuario ya seleccionó "Recordar selección"
    const recordarSeleccion = localStorage.getItem(CONFIGURACION.STORAGE_KEYS.RECORDAR_CARGA);
    if (recordarSeleccion === 'true') {
        return true;
    }
    if (recordarSeleccion === 'false') {
        return false;
    }

    return new Promise((resolve) => {
        const popup = crearPopupConfirmacion();
        document.body.appendChild(popup.overlay);

        // Manejar eventos
        const cerrarPopup = (resultado) => {
            // Guardar preferencia si está marcado "Recordar"
            if (popup.checkboxRecordar.checked) {
                localStorage.setItem(CONFIGURACION.STORAGE_KEYS.RECORDAR_CARGA, resultado.toString());
            }

            document.body.removeChild(popup.overlay);
            resolve(resultado);
        };

        popup.btnAceptar.addEventListener('click', () => cerrarPopup(true));
        popup.btnCancelar.addEventListener('click', () => cerrarPopup(false));

        // Cerrar con ESC
        popup.overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cerrarPopup(false);
            }
        });

        // Focus en el botón aceptar
        popup.btnAceptar.focus();
    });
}

// Función para crear el popup de confirmación
function crearPopupConfirmacion() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: ${CONFIGURACION.Z_INDEX.POPUP};
    `;

    const popup = document.createElement('div');
    popup.className = 'popup-practicas';
    popup.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        text-align: center;
    `;

    popup.innerHTML = `
        <h3 style="color: #007bff; margin-bottom: 1rem;">⚠️ Carga de Prácticas</h3>
        <p style="margin-bottom: 1.5rem; line-height: 1.5;">
            La carga de prácticas puede demorar varios segundos debido al volumen de datos.<br>
            ¿Desea continuar?
        </p>
        <div style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem;">
                <input type="checkbox" id="recordarSeleccion" style="margin: 0;">
                <span>Recordar mi selección</span>
            </label>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="btnCancelar" style="padding: 0.5rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Cancelar
            </button>
            <button id="btnAceptar" style="padding: 0.5rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Cargar Prácticas
            </button>
        </div>
    `;

    overlay.appendChild(popup);

    return {
        overlay,
        btnAceptar: popup.querySelector('#btnAceptar'),
        btnCancelar: popup.querySelector('#btnCancelar'),
        checkboxRecordar: popup.querySelector('#recordarSeleccion')
    };
}

// Función genérica para mostrar loader en una pestaña
function mostrarLoaderEnPestaña(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    const loader = document.createElement('div');
    loader.id = `loader-${tabId}`;
    loader.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: ${CONFIGURACION.Z_INDEX.LOADER};
    `;

    loader.innerHTML = `
        <div style="text-align: center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
            <h3 style="color: #007bff; margin: 0;">Cargando ${tabId.charAt(0).toUpperCase() + tabId.slice(1)}...</h3>
            <p style="color: #6c757d; margin: 0.5rem 0 0 0;">Por favor espere, esto puede tardar unos momentos</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    tab.style.position = 'relative';
    tab.appendChild(loader);
}

// Función genérica para ocultar loader de una pestaña
function ocultarLoaderEnPestaña(tabId) {
    const loader = document.getElementById(`loader-${tabId}`);
    if (loader) {
        loader.remove();
    }
}

// Función genérica para mostrar error de carga en una pestaña
function mostrarErrorCargaEnPestaña(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        text-align: center;
        padding: 2rem;
        color: #dc3545;
    `;

    errorDiv.innerHTML = `
        <h3>❌ Error al cargar ${tabId}</h3>
        <p>No se pudieron cargar los datos. Por favor, intente nuevamente.</p>
        <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Recargar página
        </button>
    `;

    tab.innerHTML = '';
    tab.appendChild(errorDiv);
}

// Función utilitaria para limpiar la preferencia de carga de prácticas (para desarrollo/testing)
window.limpiarPreferenciaCargaPracticas = function () {
    localStorage.removeItem(CONFIGURACION.STORAGE_KEYS.RECORDAR_CARGA);
    console.log('✅ Preferencia de carga de prácticas eliminada. La próxima vez aparecerá el popup de confirmación.');
};

// Verificar si hay un hash en la URL al cargar la página para activar una pestaña específica
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);

    if (hash && hash.startsWith('#')) {
        const tabId = hash.substring(1);
        // Esperar un poco para que las pestañas se inicialicen
        setTimeout(async () => {
            if (document.getElementById(tabId)) {
                // Si es la pestaña de prácticas, manejar lazy loading
                if (tabId === 'practicas') {
                    // Usar showTab que ahora maneja lazy loading
                    window.showTab(tabId);

                    // Si venimos de validaciones y tenemos el parámetro restore, restaurar estado
                    if (urlParams.get('restore') === 'true') {
                        console.log('Detectado parámetro restore=true para la pestaña prácticas');
                        // Esperar a que se carguen las prácticas antes de restaurar
                        const esperarCarga = setInterval(() => {
                            if (ESTADO_PRACTICAS.cargadas) {
                                clearInterval(esperarCarga);
                                setTimeout(() => {
                                    restaurarEstadoPracticas();
                                }, CONFIGURACION.DELAYS.RESTAURACION_ESTADO);
                            }
                        }, 100);
                    }
                } else {
                    // Para otras pestañas, comportamiento normal
                    window.showTab(tabId);
                }
            }
        }, CONFIGURACION.DELAYS.INICIALIZACION_PESTAÑAS);
    }
});

// Función para restaurar el estado de la pestaña prácticas
function restaurarEstadoPracticas() {
    try {
        const estadoSession = sessionStorage.getItem(CONFIGURACION.STORAGE_KEYS.ESTADO_PRACTICAS);
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
            if (!tabManager?.tabs?.practicas || intentos >= maxIntentos) {
                if (intentos >= maxIntentos) {
                    console.warn('Se agotaron los intentos para restaurar el estado');
                }
                sessionStorage.removeItem(CONFIGURACION.STORAGE_KEYS.ESTADO_PRACTICAS);
                return;
            }

            // Restaurar filtros y estado
            RestauracionUtils.aplicarFiltrosGuardados(estado);
            RestauracionUtils.aplicarPaginacionGuardada(estado);
            RestauracionUtils.ejecutarFiltradoYRestaurarScroll(estado);

            // Limpiar estado después de usar
            sessionStorage.removeItem(CONFIGURACION.STORAGE_KEYS.ESTADO_PRACTICAS);
            console.log('Estado de prácticas restaurado exitosamente');

            // Limpiar URL después de la restauración
            RestauracionUtils.limpiarUrlRestore();
        };

        // Intentar restaurar
        if (tabManager?.tabs?.practicas) {
            intentarRestaurar();
        } else {
            // Reintentar cada 200ms hasta que tabManager esté listo
            const intervalo = setInterval(() => {
                if (tabManager?.tabs?.practicas) {
                    clearInterval(intervalo);
                    intentarRestaurar();
                }
            }, 200);

            // Limpiar el intervalo después de 5 segundos máximo
            setTimeout(() => clearInterval(intervalo), 5000);
        }
    } catch (error) {
        console.error('Error restaurando estado de prácticas:', error);
        sessionStorage.removeItem(CONFIGURACION.STORAGE_KEYS.ESTADO_PRACTICAS);
    }
}

// Utilidades para restauración de estado
const RestauracionUtils = {
    aplicarFiltrosGuardados(estado) {
        if (!estado.filtros || !tabManager.tabs.practicas.filtros) return;

        let filtrosAplicados = 0;
        tabManager.tabs.practicas.filtros.forEach((filtro) => {
            const inputId = `filtro${tabManager.capitalize(filtro === 'periodo_ex' ? 'Periodo' : filtro)}_practicas`;
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
    },

    aplicarPaginacionGuardada(estado) {
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
    },

    ejecutarFiltradoYRestaurarScroll(estado) {
        setTimeout(() => {
            if (tabManager?.filtrar) {
                // Guardar temporalmente la página actual antes de filtrar
                const paginaGuardada = estado.paginaActual;

                // Aplicar filtros (esto resetea currentPage a 1)
                tabManager.filtrar('practicas');

                // Restaurar la página después del filtrado
                if (paginaGuardada) {
                    tabManager.tabs.practicas.currentPage = paginaGuardada;
                    tabManager.renderTabla('practicas');
                }

                console.log(`Filtros aplicados y tabla re-renderizada en página: ${paginaGuardada || 1}`);

                // Restaurar posición del scroll
                setTimeout(() => {
                    if (estado.scrollY) {
                        window.scrollTo({
                            top: estado.scrollY,
                            behavior: 'smooth'
                        });
                        console.log(`Scroll restaurado a posición: ${estado.scrollY}`);
                    }
                }, CONFIGURACION.DELAYS.RESTAURACION_ESTADO);
            }
        }, 300);
    },

    limpiarUrlRestore() {
        setTimeout(() => {
            const url = new URL(window.location);
            url.searchParams.delete('restore');
            window.history.replaceState({}, '', url.toString());
            console.log('URL limpiada después de la restauración');
        }, 1000);
    }
};

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
