import { generarTabla } from './tableUI.js';
import { parsearFecha } from './formatters.js';
import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { DateUtils, TipoEjecucionUtils, ProcesoDataManager, CamposConfigManager, UrlUtils } from './procesoUtils.js';

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
                    filtros: ['concepto', 'periodo_ex', 'prestador']
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
                    paginador.appendChild(span);
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = i;
                    btn.className = 'paginador-btn' + (i === tab.currentPage ? ' active' : '');
                    btn.style.margin = '4px 4px';
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
    const tabManager = new TabManager();

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

    let practicasGlobal = [];
    let detalleGlobal = [];
    let cabeceraGlobal = [];
    let aprobCabeceraGlobal = [];
    let validacionesGlobal = [];

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
            { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' }
        ],
        cabecera: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'c_modulo_pami_4x', header: 'Cod. Modulo', format: 'code' },
            { key: 'd_modulo_pami', header: 'Modulo' },
            { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' }
        ],
        aprob_cabecera: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'c_modulo_pami_7x', header: 'Cod. Modulo', format: 'code' },
            { key: 'd_modulo_pami', header: 'Modulo (7X)' },
            { key: 'i_monto', header: 'I_MONTO', format: 'moneda' }
        ]
    };

    Promise.all([
        safeFetch(`../data/practicas-${codigoProceso}.json`),
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
            document.getElementById('inicio').textContent = proceso.F_INICIO;
            document.getElementById('fin').textContent = proceso.F_FIN;
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

// Navega a la página de validaciones con los parámetros correctos
function navegarAValidaciones(codigo, c_id_practica) {
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
    return DateUtils.calcularDuracionLegible(inicio, fin);
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
