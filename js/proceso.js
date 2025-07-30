import { Auth } from './auth.js';
import { ProcesoData } from './procesoData.js';
import { ProcesoUI } from './procesoUI.js';
import { ProcesoLogic } from './procesoLogic.js';
import { generarTabla } from './tableUI.js';
import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { parsearFecha, formatearFecha } from './formatters.js';
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

// ===== FUNCIONES UTILITARIAS PRIMERO =====

// Extrae el código de proceso de la URL
export function getParametroProceso() {
    return UrlUtils.getParametroProceso();
}

// Función para construir URL de vuelta a procesos
function construirUrlVueltaProcesos() {
    try {
        // Verificar que UrlUtils esté disponible
        if (typeof UrlUtils !== 'undefined' && UrlUtils.construirUrlVueltaProcesos) {
            return UrlUtils.construirUrlVueltaProcesos();
        }
        
        // Fallback mejorado: construir URL básica
        console.warn('⚠️ UrlUtils no disponible, usando fallback mejorado');
        
        // Obtener parámetros actuales de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        
        // Preservar ciertos parámetros si existen
        ['periodo', 'tipo', 'estado', 'codigo', 'page'].forEach(param => {
            if (urlParams.has(param)) {
                params[param] = urlParams.get(param);
            }
        });
        
        // Construir URL de vuelta con ruta relativa correcta
        const baseUrl = './procesos.html'; // Misma carpeta que proceso.html
        const queryString = Object.keys(params).length > 0 
            ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
            : '';
            
        const urlFinal = baseUrl + queryString;
        console.log('🔗 URL construida (fallback mejorado):', urlFinal);
        return urlFinal;
        
    } catch (error) {
        console.error('❌ Error construyendo URL de vuelta:', error);
        return './procesos.html'; // URL de fallback básica
    }
}

// NUEVA FUNCIÓN: Configurar botones de volver a procesos
function configurarBotonesVolver() {
    console.log('🔧 Configurando botones de volver a procesos...');
    
    // Configurar botón de volver a procesos (escritorio)
    const btnVolver = document.getElementById('btnVolverProcesos');
    if (btnVolver) {
        // Limpiar eventos existentes usando cloneNode
        const nuevoBtnVolver = btnVolver.cloneNode(true);
        btnVolver.parentNode.replaceChild(nuevoBtnVolver, btnVolver);
        
        nuevoBtnVolver.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Navegando de vuelta a procesos...');
            
            try {
                const urlVuelta = construirUrlVueltaProcesos();
                console.log('🔗 URL de vuelta:', urlVuelta);
                
                // Mostrar feedback visual
                nuevoBtnVolver.textContent = 'Cargando...';
                nuevoBtnVolver.disabled = true;
                nuevoBtnVolver.style.opacity = '0.6';
                
                // Navegar después de un pequeño delay para mostrar el feedback
                setTimeout(() => {
                    window.location.href = urlVuelta;
                }, 100);
                
            } catch (error) {
                console.error('❌ Error navegando de vuelta:', error);
                nuevoBtnVolver.textContent = '← Volver a Procesos';
                nuevoBtnVolver.disabled = false;
                nuevoBtnVolver.style.opacity = '1';
                alert('Error al volver a procesos. Por favor, recargue la página.');
            }
        });
        
        console.log('✅ Botón volver (escritorio) configurado');
    } else {
        console.warn('⚠️ No se encontró btnVolverProcesos en el DOM');
    }

    // Configurar botón de volver a procesos (móvil)
    const btnVolverMobile = document.getElementById('btnVolverProcesosMobile');
    if (btnVolverMobile) {
        // Limpiar eventos existentes usando cloneNode
        const nuevoBtnVolverMobile = btnVolverMobile.cloneNode(true);
        btnVolverMobile.parentNode.replaceChild(nuevoBtnVolverMobile, btnVolverMobile);
        
        nuevoBtnVolverMobile.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Navegando de vuelta a procesos (móvil)...');
            
            try {
                const urlVuelta = construirUrlVueltaProcesos();
                console.log('🔗 URL de vuelta (móvil):', urlVuelta);
                
                // Mostrar feedback visual
                nuevoBtnVolverMobile.textContent = '...';
                nuevoBtnVolverMobile.style.pointerEvents = 'none';
                nuevoBtnVolverMobile.style.opacity = '0.6';
                
                // Navegar después de un pequeño delay
                setTimeout(() => {
                    window.location.href = urlVuelta;
                }, 100);
                
            } catch (error) {
                console.error('❌ Error navegando de vuelta (móvil):', error);
                nuevoBtnVolverMobile.textContent = '←';
                nuevoBtnVolverMobile.style.pointerEvents = 'auto';
                nuevoBtnVolverMobile.style.opacity = '1';
                alert('Error al volver a procesos. Por favor, recargue la página.');
            }
        });
        
        console.log('✅ Botón volver (móvil) configurado');
    } else {
        console.warn('⚠️ No se encontró btnVolverProcesosMobile en el DOM');
    }
}

function ocultarLoaderEnPestana(tabId) {
    const loader = document.getElementById(`loader-${tabId}`);
    if (loader) {
        loader.remove();
    }
}

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

// ===== CONSTANTES Y CONFIGURACIÓN =====

// Definir campos importantes (configuración de las tablas) - RESTAURADOS CON BOTONES
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

// ===== EVENTO PRINCIPAL =====

document.addEventListener('DOMContentLoaded', async () => {
    // PRIMERO: Guardar el contenido original INMEDIATAMENTE
    ProcesoUI.guardarContenidoOriginal();
    
    // Validar sesión al cargar la página
    if (!Auth.validarSesion()) {
        return;
    }
    
    // Actualizar datos del usuario en el DOM
    Auth.actualizarDatosUsuario();
    
    // Inicializar listener de copiado
    initCopyIconListener();

    // Instanciar el manager de pestañas
    tabManager = new TabManager();

    // Obtener código de proceso de la URL
    codigoProceso = getParametroProceso();

    // CONFIGURAR BOTONES DE VOLVER INMEDIATAMENTE
    setTimeout(() => {
        configurarBotonesVolver();
    }, 100);

    await cargarProceso();
    
    // RECONFIGURAR BOTONES DESPUÉS DE CARGAR PROCESO
    setTimeout(() => {
        configurarBotonesVolver();
    }, 500);
    
    // RECONFIGURAR BOTONES UNA VEZ MÁS DESPUÉS DE UN DELAY MAYOR
    setTimeout(() => {
        configurarBotonesVolver();
    }, 1500);
});

// ===== FUNCIONES PRINCIPALES =====

async function cargarProceso() {
    try {
        ProcesoUI.mostrarCargando();

        const procesoIdParam = ProcesoLogic.obtenerParametroUrl();
        const procesoId = ProcesoLogic.validarProcesoId(procesoIdParam);
        codigoProceso = procesoId;

        const proceso = await ProcesoData.obtenerProceso(procesoId);

        if (!proceso) {
            throw new Error('Proceso no encontrado');
        }

        // Cargar datos de las pestañas (sin prácticas - lazy loading)
        await cargarPestanas(procesoId);

        // Guardar estado de prácticas
        ESTADO_PRACTICAS.codigoProceso = procesoId;

        // Mostrar datos del proceso (esto restaura el contenido)
        ProcesoUI.mostrarDatosProceso(proceso);

        // IMPORTANTE: Inicializar pestañas después de que se restaure el contenido
        console.log('🔧 Llamando a inicializarPestanas después de mostrar datos del proceso...');
        setTimeout(() => {
            inicializarPestanas();
            
            // NUEVO: Configurar navegación de pestañas después de inicializar
            setTimeout(() => {
                configurarNavegacionPestanas();
            }, 200);
            
        }, 100); // Pequeño delay para asegurar que el DOM esté listo

    } catch (error) {
        console.error('Error al cargar el proceso:', error);
        ProcesoUI.mostrarError(`Error al cargar el proceso: ${error.message}`);
    }
}

// Cargar datos de las pestañas (SIN prácticas - lazy loading)
async function cargarPestanas(procesoId) {
    try {
        console.log('🔄 Cargando pestañas para proceso:', procesoId);
        
        // Cargar datos de las 3 pestañas principales + validaciones (SIN prácticas)
        const [detalle, cabecera, aprobCabecera, validaciones] = await Promise.all([
            safeFetch(`../data/detalle-${procesoId}.json`).catch(() => []),
            safeFetch(`../data/cabecera-${procesoId}.json`).catch(() => []),
            safeFetch(`../data/aprob-cabecera-${procesoId}.json`).catch(() => []),
            safeFetch(`../data/validaciones-${procesoId}.json`).catch(() => [])
        ]);
        
        // Guardar datos globales
        practicasGlobal = []; // Se cargará lazy
        detalleGlobal = detalle;
        cabeceraGlobal = cabecera;
        aprobCabeceraGlobal = aprobCabecera;
        validacionesGlobal = validaciones;
        
        console.log('✅ Datos cargados:', { 
            detalle: detalle.length, 
            cabecera: cabecera.length, 
            aprobCabecera: aprobCabecera.length,
            validaciones: validaciones.length
        });
        
    } catch (error) {
        console.error('❌ Error al cargar pestañas:', error);
    }
}

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

    // Función genérica para filtrar datos - RESTAURADA CON LÓGICA COMPLETA
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

    // Configurar selectores personalizados para una pestaña - RESTAURADA COMPLETA
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

// Inicializar pestañas con datos usando TabManager - MEJORADA
function inicializarPestanas() {
    console.log('🔧 Inicializando pestañas...');
    
    const grillasPorProceso = document.getElementById('grillasPorProceso');
    if (!grillasPorProceso) {
        console.error('❌ No se encontró grillasPorProceso');
        return;
    }
    
    console.log('📋 Contenido actual de grillasPorProceso:', grillasPorProceso.innerHTML.trim());
    
    // Si grillasPorProceso está vacío o solo tiene comentario, crear contenido
    const contenidoActual = grillasPorProceso.innerHTML.trim();
    if (contenidoActual === '<!-- Contenido de tabs se carga dinámicamente -->' || 
        contenidoActual === '' || 
        !document.getElementById('tablaAprobCabecera')) {
        
        console.log('🏗️ Creando contenido de pestañas dinámicamente...');
        crearContenidoPestanas();
        
        // Esperar un momento para que el DOM se actualice y luego inicializar
        setTimeout(() => {
            inicializarTablasConTabManager();
        }, 200);
        return;
    }
    
    // Si las tablas ya existen, proceder con inicialización normal
    console.log('✅ Las tablas ya existen, procediendo con inicialización...');
    inicializarTablasConTabManager();
}

// Crear contenido de pestañas dinámicamente - MEJORADA
function crearContenidoPestanas() {
    console.log('🏗️ Creando contenido dinámico de pestañas...');
    
    const grillasPorProceso = document.getElementById('grillasPorProceso');
    if (!grillasPorProceso) {
        console.error('❌ No se encontró grillasPorProceso para crear contenido');
        return;
    }
    
    const contenido = `
        <div id="aprob-cabecera" class="tab-content active">
            <div class="filters">
                <label>Concepto:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroConcepto_aprob_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="conceptoDropdown_aprob_cabecera"></div>
                    </div>
                </label>
                <label>Período:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPeriodo_aprob_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="periodoDropdown_aprob_cabecera"></div>
                    </div>
                </label>
                <label>Prestador:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPrestador_aprob_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="prestadorDropdown_aprob_cabecera"></div>
                    </div>
                </label>
                <button id="limpiarFiltrosBtn_aprob_cabecera">Limpiar</button>
            </div>
            <table id="tablaAprobCabecera" class="styled-table"></table>
            <div id="paginadorAprobCabecera"></div>
        </div>
        
        <div id="cabecera" class="tab-content">
            <div class="filters">
                <label>Concepto:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroConcepto_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="conceptoDropdown_cabecera"></div>
                    </div>
                </label>
                <label>Período:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPeriodo_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="periodoDropdown_cabecera"></div>
                    </div>
                </label>
                <label>Prestador:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPrestador_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="prestadorDropdown_cabecera"></div>
                    </div>
                </label>
                <label>Módulo:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroModulo_cabecera" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="moduloDropdown_cabecera"></div>
                    </div>
                </label>
                <button id="limpiarFiltrosBtn_cabecera">Limpiar</button>
            </div>
            <table id="tablaCabecera" class="styled-table"></table>
            <div id="paginadorCabecera"></div>
        </div>
        
        <div id="detalle" class="tab-content">
            <div class="filters">
                <label>Concepto:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroConcepto_detalle" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="conceptoDropdown_detalle"></div>
                    </div>
                </label>
                <label>Período:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPeriodo_detalle" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="periodoDropdown_detalle"></div>
                    </div>
                </label>
                <label>Prestador:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPrestador_detalle" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="prestadorDropdown_detalle"></div>
                    </div>
                </label>
                <label>Módulo:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroModulo_detalle" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="moduloDropdown_detalle"></div>
                    </div>
                </label>
                <button id="limpiarFiltrosBtn_detalle">Limpiar</button>
            </div>
            <table id="tablaDetalle" class="styled-table"></table>
            <div id="paginadorDetalle"></div>
        </div>
        
        <div id="practicas" class="tab-content">
            <div class="filters">
                <label>Concepto:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroConcepto_practicas" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="conceptoDropdown_practicas"></div>
                    </div>
                </label>
                <label>Período:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPeriodo_practicas" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="periodoDropdown_practicas"></div>
                    </div>
                </label>
                <label>Prestador:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPrestador_practicas" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="prestadorDropdown_practicas"></div>
                    </div>
                </label>
                <label>Módulo:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroModulo_practicas" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="moduloDropdown_practicas"></div>
                    </div>
                </label>
                <label>Práctica:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroPractica_practicas" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="practicaDropdown_practicas"></div>
                    </div>
                </label>
                <label>Beneficiario:
                    <div class="custom-select-wrapper">
                        <input type="text" id="filtroBeneficiario_practicas" placeholder="Selecciona o escribe..." readonly />
                        <div class="custom-select-dropdown" id="beneficiarioDropdown_practicas"></div>
                    </div>
                </label>
                <button id="limpiarFiltrosBtn_practicas">Limpiar</button>
            </div>
            <table id="tablaPracticas" class="styled-table"></table>
            <div id="paginadorPracticas"></div>
        </div>
    `;
    
    grillasPorProceso.innerHTML = contenido;
    console.log('✅ Contenido de pestañas creado dinámicamente');
    
    // Verificar que las tablas se crearon correctamente
    setTimeout(() => {
        const verificaciones = [
            'tablaAprobCabecera',
            'tablaCabecera', 
            'tablaDetalle',
            'tablaPracticas'
        ];
        
        verificaciones.forEach(id => {
            const elemento = document.getElementById(id);
            console.log(`📋 Verificando ${id}: ${elemento ? '✅ Existe' : '❌ No existe'}`);
        });
    }, 50);
}

// Inicializar tablas usando TabManager (SIN prácticas - lazy loading) - MEJORADA
function inicializarTablasConTabManager() {
    console.log('🔧 Inicializando tablas con TabManager...');
    
    // Verificar que TabManager está listo
    if (!tabManager) {
        console.error('❌ TabManager no está inicializado');
        return;
    }

    // Verificar que las tablas existen en el DOM
    const tablasRequeridas = ['tablaAprobCabecera', 'tablaCabecera', 'tablaDetalle'];
    let todasExisten = true;
    
    tablasRequeridas.forEach(id => {
        const tabla = document.getElementById(id);
        if (!tabla) {
            console.error(`❌ No se encontró la tabla: ${id}`);
            todasExisten = false;
        } else {
            console.log(`✅ Tabla encontrada: ${id}`);
        }
    });
    
    if (!todasExisten) {
        console.error('❌ No se pueden inicializar las tablas porque faltan elementos en el DOM');
        return;
    }

    // Verificar que los datos están disponibles
    console.log('📊 Datos disponibles:', {
        aprobCabecera: aprobCabeceraGlobal?.length || 0,
        cabecera: cabeceraGlobal?.length || 0,
        detalle: detalleGlobal?.length || 0
    });

    try {
        // Inicializar pestañas usando el TabManager (SIN prácticas - lazy loading)
        tabManager.inicializarTab('aprob_cabecera', aprobCabeceraGlobal, configuracionCampos.aprob_cabecera);
        console.log('✅ Pestaña aprob_cabecera inicializada');
        
        tabManager.inicializarTab('cabecera', cabeceraGlobal, configuracionCampos.cabecera);
        console.log('✅ Pestaña cabecera inicializada');
        
        tabManager.inicializarTab('detalle', detalleGlobal, configuracionCampos.detalle);
        console.log('✅ Pestaña detalle inicializada');
        
        // Prácticas se inicializa lazy
        console.log('🔄 Prácticas se inicializarán con lazy loading');

        console.log('✅ Pestañas inicializadas correctamente con TabManager (excepto prácticas - lazy loading)');
    } catch (error) {
        console.error('❌ Error inicializando tablas con TabManager:', error);
    }
}

// ===== FUNCIONES DE NAVEGACIÓN DE PESTAÑAS =====

// Función para mostrar/ocultar pestañas - MEJORADA CON NAVEGACIÓN
function mostrarPestaña(tabId) {
    // Ocultar todas las pestañas
    const todasLasPestanas = ['aprob-cabecera', 'cabecera', 'detalle', 'practicas'];
    todasLasPestanas.forEach(id => {
        const tab = document.getElementById(id);
        if (tab) {
            tab.classList.remove('active');
            tab.style.display = 'none';
        }
    });

    // Mostrar la pestaña seleccionada
    const tabSeleccionada = document.getElementById(tabId);
    if (tabSeleccionada) {
        tabSeleccionada.classList.add('active');
        tabSeleccionada.style.display = 'block';
    }

    // Actualizar pestañas de navegación si existen
    const navTabs = document.querySelectorAll('.tab');
    navTabs.forEach(navTab => {
        navTab.classList.remove('active');
        const onclickStr = navTab.getAttribute('onclick') || '';
        if (onclickStr.includes(`'${tabId}'`) || onclickStr.includes(`"${tabId}"`)) {
            navTab.classList.add('active');
        }
    });

    console.log(`📋 Mostrando pestaña: ${tabId}`);
}

// Función showTab para compatibilidad con HTML (REQUERIDA POR EL HTML)
function showTab(tabId) {
    console.log('🔄 showTab llamada con:', tabId);
    
    // Si es prácticas y no están cargadas, usar lazy loading
    if (tabId === 'practicas' && !ESTADO_PRACTICAS.cargadas) {
        ejecutarCargaPracticasLazy();
        return;
    }
    
    // Para otras pestañas, mostrar directamente
    mostrarPestaña(tabId);
}

// Exponer función showTab globalmente para uso en HTML
window.showTab = showTab;

// ===== INICIALIZACIÓN DE NAVEGACIÓN DE PESTAÑAS =====

// Función para configurar navegación de pestañas - NUEVA FUNCIÓN FALTANTE
function configurarNavegacionPestanas() {
    console.log('🔧 Configurando navegación de pestañas...');
    
    // Buscar todos los elementos de navegación de pestañas
    const navTabs = document.querySelectorAll('.nav-tab, [data-tab], [onclick*="showTab"], .tab');
    
    navTabs.forEach(navTab => {
        // Obtener el ID de la pestaña
        let tabId = navTab.dataset.tab || navTab.getAttribute('data-target');
        
        // Si no tiene data-tab, intentar extraer del onclick
        if (!tabId && navTab.getAttribute('onclick')) {
            const onclickStr = navTab.getAttribute('onclick');
            const match = onclickStr.match(/showTab\(['"]([^'"]+)['"]\)/);
            if (match) {
                tabId = match[1];
            }
        }
        
        if (tabId) {
            console.log(`🔗 Configurando navegación para pestaña: ${tabId}`);
            
            // No remover onclick si ya funciona, solo asegurar que showTab esté disponible
            if (!navTab.getAttribute('onclick')) {
                navTab.addEventListener('click', (e) => {
                    e.preventDefault();
                    showTab(tabId);
                });
            }
            
            // Asegurar que tenga el data-tab correcto
            navTab.dataset.tab = tabId;
        }
    });
    
    // Mostrar pestaña por defecto (aprob-cabecera) si ninguna está activa
    setTimeout(() => {
        const pestanaActiva = document.querySelector('.tab-content.active[style*="block"], .tab-content.active:not([style*="none"])');
        if (!pestanaActiva) {
            console.log('🏠 Mostrando pestaña por defecto: aprob-cabecera');
            showTab('aprob-cabecera');
        }
    }, 100);
}

// ===== FUNCIONES DE NAVEGACIÓN ESPECÍFICAS =====
// AGREGAR ESTAS FUNCIONES DESPUÉS DE configurarNavegacionPestanas() Y ANTES DE FiltroUtils

// Funciones de navegación específicas - NECESARIAS PARA LOS BOTONES
function navegarACabeceraConFiltros(item) {
    navegarConFiltros('cabecera', item, {
        mapeoFiltros: {
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

function navegarADetalleConFiltros(item) {
    navegarConFiltros('detalle', item);
}

function navegarAPracticasConFiltros(item) {
    navegarConFiltros('practicas', item);
}

// Función para navegación a validaciones
function navegarAValidaciones(codigoProceso, idPractica) {
    const url = `validaciones.html?proceso=${codigoProceso}&practica=${idPractica}`;
    console.log('🔄 Navegando a validaciones:', url);
    window.location.href = url;
}

// ===== UTILIDADES PARA MANEJO DE FILTROS =====

// Utilidades para manejo de filtros
const FiltroUtils = {
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

// Utilidades para botones
const ButtonUtils = {
    aplicarEstadoCarga(btn) {
        const estadoOriginal = {
            texto: btn.textContent,
            disabled: btn.disabled,
            backgroundColor: btn.style.backgroundColor
        };
        
        btn.textContent = 'Cargando...';
        btn.disabled = true;
        btn.style.backgroundColor = '#6c757d';
        
        return estadoOriginal;
    },

    restaurarEstado(btn, estadoOriginal) {
        btn.textContent = estadoOriginal.texto;
        btn.disabled = estadoOriginal.disabled;
        btn.style.backgroundColor = estadoOriginal.backgroundColor;
    }
};

// ===== FUNCIONES DE NAVEGACIÓN CON FILTROS =====

// Función genérica para navegación entre pestañas con filtros - VERSIÓN COMPLETA
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

            // PRIMERO: Mostrar la pestaña y asegurar que el contenido existe
            mostrarPestaña('practicas');
            await asegurarContenidoPracticas();

            // SEGUNDO: Mostrar loader inmediatamente
            mostrarLoaderEnPestanaInmediato('practicas');

            try {
                ESTADO_PRACTICAS.cargando = true;

                // Cargar las prácticas
                console.log('🔄 Iniciando carga lazy de prácticas...');
                const practicas = await cargarPracticas(ESTADO_PRACTICAS.codigoProceso);

                // Guardar datos y marcar como cargadas
                practicasGlobal = practicas;
                ESTADO_PRACTICAS.cargadas = true;

                // Recrear contenido limpio y luego inicializar
                recrearContenidoPestanaPracticas();
                
                // Pequeño delay para asegurar que el DOM esté actualizado
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Inicializar la pestaña de prácticas
                tabManager.inicializarTab('practicas', practicasGlobal, configuracionCampos.practicas);

                console.log('✅ Prácticas cargadas exitosamente');
                
                // Aplicar filtros después de cargar
                setTimeout(() => {
                    FiltroUtils.aplicarFiltrosDesdeItem(tabDestino, item, configuracionEspecial.mapeoFiltros);
                }, CONFIGURACION.DELAYS.FILTROS_APLICACION);
                
            } catch (error) {
                console.error('❌ Error cargando prácticas:', error);
                mostrarErrorCargaEnPestaña('practicas');
                ButtonUtils.restaurarEstado(btn, estadoOriginal);
                return;
            } finally {
                ESTADO_PRACTICAS.cargando = false;
            }
        } else if (tabDestino === 'practicas' && ESTADO_PRACTICAS.cargadas) {
            // Si prácticas ya están cargadas, mostrar con transición suave
            mostrarPestaña(tabDestino);
            
            // Aplicar filtros inmediatamente
            setTimeout(() => {
                FiltroUtils.aplicarFiltrosDesdeItem(tabDestino, item, configuracionEspecial.mapeoFiltros);
            }, CONFIGURACION.DELAYS.FILTROS_APLICACION);
        } else {
            // Para otras pestañas, navegación normal
            mostrarPestaña(tabDestino);
            
            // Aplicar filtros después de un delay
            setTimeout(() => {
                FiltroUtils.aplicarFiltrosDesdeItem(tabDestino, item, configuracionEspecial.mapeoFiltros);

                // Log informativo
                const filtrosInfo = Object.entries(configuracionEspecial.mapeoFiltros || {})
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ');
                console.log(`Navegando a ${tabDestino} con filtros: ${filtrosInfo}`);
            }, CONFIGURACION.DELAYS.FILTROS_APLICACION);
        }

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

// ===== FUNCIONES PARA LAZY LOADING DE PRÁCTICAS =====

// NUEVA FUNCIÓN: Asegurar que el contenido de prácticas existe
async function asegurarContenidoPracticas() {
    console.log('🔧 Asegurando que el contenido de prácticas existe...');
    
    let pestanaPracticas = document.getElementById('practicas');
    
    // Si la pestaña no existe, crearla
    if (!pestanaPracticas) {
        console.log('📝 Creando pestaña de prácticas...');
        
        const grillasPorProceso = document.getElementById('grillasPorProceso');
        if (!grillasPorProceso) {
            console.error('❌ No se encontró grillasPorProceso');
            return;
        }
        
        // Verificar si necesitamos crear todo el contenido
        const contenidoActual = grillasPorProceso.innerHTML.trim();
        if (contenidoActual === '<!-- Contenido de tabs se carga dinámicamente -->' || 
            contenidoActual === '') {
            console.log('🏗️ Creando todo el contenido de pestañas...');
            crearContenidoPestanas();
        } else {
            // Solo crear la pestaña de prácticas
            console.log('🏗️ Creando solo la pestaña de prácticas...');
            crearSoloPestanaPracticas();
        }
        
        // Esperar a que se cree
        await new Promise(resolve => setTimeout(resolve, 100));
        pestanaPracticas = document.getElementById('practicas');
    }
    
    // Verificar que la tabla existe dentro de la pestaña
    const tablaPracticas = document.getElementById('tablaPracticas');
    if (!tablaPracticas) {
        console.log('📝 Creando contenido interno de la pestaña prácticas...');
        recrearContenidoPestanaPracticas();
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('✅ Contenido de prácticas asegurado');
}

// NUEVA FUNCIÓN: Crear solo la pestaña de prácticas
function crearSoloPestanaPracticas() {
    const grillasPorProceso = document.getElementById('grillasPorProceso');
    if (!grillasPorProceso) return;
    
    // Verificar si ya existe
    if (document.getElementById('practicas')) return;
    
    const pestanaPracticas = document.createElement('div');
    pestanaPracticas.id = 'practicas';
    pestanaPracticas.className = 'tab-content';
    
    pestanaPracticas.innerHTML = `
        <div class="filters">
            <label>Concepto:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroConcepto_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="conceptoDropdown_practicas"></div>
                </div>
            </label>
            <label>Período:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroPeriodo_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="periodoDropdown_practicas"></div>
                </div>
            </label>
            <label>Prestador:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroPrestador_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="prestadorDropdown_practicas"></div>
                </div>
            </label>
            <label>Módulo:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroModulo_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="moduloDropdown_practicas"></div>
                </div>
            </label>
            <label>Práctica:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroPractica_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="practicaDropdown_practicas"></div>
                </div>
            </label>
            <label>Beneficiario:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroBeneficiario_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="beneficiarioDropdown_practicas"></div>
                </div>
            </label>
            <button id="limpiarFiltrosBtn_practicas">Limpiar</button>
        </div>
        <table id="tablaPracticas" class="styled-table"></table>
        <div id="paginadorPracticas"></div>
    `;
    
    grillasPorProceso.appendChild(pestanaPracticas);
}

// Función mejorada para recrear contenido de pestaña prácticas
function recrearContenidoPestanaPracticas() {
    console.log('🔧 Recreando contenido de pestaña prácticas...');
    
    let pestanaPracticas = document.getElementById('practicas');
    if (!pestanaPracticas) {
        console.warn('⚠️ No se encontró la pestaña prácticas, creándola...');
        crearSoloPestanaPracticas();
        pestanaPracticas = document.getElementById('practicas');
    }
    
    if (!pestanaPracticas) {
        console.error('❌ No se pudo crear la pestaña prácticas');
        return;
    }
    
    pestanaPracticas.innerHTML = `
        <div class="filters">
            <label>Concepto:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroConcepto_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="conceptoDropdown_practicas"></div>
                </div>
            </label>
            <label>Período:            <input type="text" id="filtroPeriodo_practicas" placeholder="Selecciona o escribe..." readonly />
             <div class="custom-select-wrapper">
                    <div class="custom-select-dropdown" id="periodoDropdown_practicas"></div>
                </div>
            </label>
            <label>Prestador:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroPrestador_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="prestadorDropdown_practicas"></div>
                </div>
            </label>
            <label>Módulo:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroModulo_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="moduloDropdown_practicas"></div>
                </div>
            </label>
            <label>Práctica:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroPractica_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="practicaDropdown_practicas"></div>
                </div>
            </label>
            <label>Beneficiario:
                <div class="custom-select-wrapper">
                    <input type="text" id="filtroBeneficiario_practicas" placeholder="Selecciona o escribe..." readonly />
                    <div class="custom-select-dropdown" id="beneficiarioDropdown_practicas"></div>
                </div>
            </label>
            <button id="limpiarFiltrosBtn_practicas">Limpiar</button>
        </div>
        <table id="tablaPracticas" class="styled-table"></table>
        <div id="paginadorPracticas"></div>
    `;
    
    console.log('✅ Contenido de pestaña prácticas recreado');
}

// Función principal para manejar la carga lazy de prácticas
async function ejecutarCargaPracticasLazy() {
    if (ESTADO_PRACTICAS.cargadas) {
        mostrarPestaña('practicas');
        return;
    }

    if (ESTADO_PRACTICAS.cargando) {
        return;
    }

    const debeCargar = await confirmarCargaPracticasLazy();
    if (!debeCargar) {
        return;
    }

    // MOSTRAR PESTAÑA Y ASEGURAR CONTENIDO
    mostrarPestaña('practicas');
    await asegurarContenidoPracticas();
    
    // MOSTRAR LOADER
    mostrarLoaderEnPestanaInmediato('practicas');

    try {
        ESTADO_PRACTICAS.cargando = true;

        console.log('🔄 Iniciando carga lazy de prácticas...');
        const practicas = await cargarPracticas(ESTADO_PRACTICAS.codigoProceso);

        practicasGlobal = practicas;
        ESTADO_PRACTICAS.cargadas = true;

        // Recrear contenido de la pestaña
        recrearContenidoPestanaPracticas();
        
        // Pequeño delay para asegurar DOM
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Inicializar tabla
        tabManager.inicializarTab('practicas', practicasGlobal, configuracionCampos.practicas);

        console.log('✅ Prácticas cargadas exitosamente');
    } catch (error) {
        console.error('❌ Error cargando prácticas:', error);
        mostrarErrorCargaEnPestaña('practicas');
    } finally {
        ESTADO_PRACTICAS.cargando = false;
    }
}

// Función para confirmar carga de prácticas con popup
async function confirmarCargaPracticasLazy() {
    const recordarSeleccion = localStorage.getItem(CONFIGURACION.STORAGE_KEYS.RECORDAR_CARGA);
    if (recordarSeleccion === 'true') {
        return true;
    }
    if (recordarSeleccion === 'false') {
        return false;
    }

    return new Promise((resolve) => {
        try {
            const popupElements = crearPopupConfirmacion();
            
            if (!popupElements) {
                console.error('❌ Error creando popup, usando valor por defecto');
                resolve(false);
                return;
            }

            const { overlay, btnAceptar, btnCancelar, checkboxRecordar } = popupElements;
            
            document.body.appendChild(overlay);

            const cerrarPopup = (resultado) => {
                try {
                    if (checkboxRecordar.checked) {
                        localStorage.setItem(CONFIGURACION.STORAGE_KEYS.RECORDAR_CARGA, resultado.toString());
                    }

                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                    resolve(resultado);
                } catch (error) {
                    console.error('❌ Error cerrando popup:', error);
                    resolve(false);
                }
            };

            btnAceptar.addEventListener('click', () => cerrarPopup(true));
            btnCancelar.addEventListener('click', () => cerrarPopup(false));

            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeydown);
                    cerrarPopup(false);
                }
            };
            document.addEventListener('keydown', handleKeydown);

            setTimeout(() => {
                btnAceptar.focus();
            }, 100);

        } catch (error) {
            console.error('❌ Error en confirmarCargaPracticasLazy:', error);
            resolve(false);
        }
    });
}

// Función para crear popup de confirmación
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

    const btnAceptar = popup.querySelector('#btnAceptar');
    const btnCancelar = popup.querySelector('#btnCancelar');
    const checkboxRecordar = popup.querySelector('#recordarSeleccion');

    if (!btnAceptar || !btnCancelar || !checkboxRecordar) {
        console.error('❌ Error: No se pudieron crear los elementos del popup');
        return null;
    }

    btnCancelar.addEventListener('mouseenter', () => {
        btnCancelar.style.backgroundColor = '#5a6268';
    });
    btnCancelar.addEventListener('mouseleave', () => {
        btnCancelar.style.backgroundColor = '#6c757d';
    });

    btnAceptar.addEventListener('mouseenter', () => {
        btnAceptar.style.backgroundColor = '#0056b3';
    });
    btnAceptar.addEventListener('mouseleave', () => {
        btnAceptar.style.backgroundColor = '#007bff';
    });

    return {
        overlay,
        btnAceptar,
        btnCancelar,
        checkboxRecordar
    };
}

// Función mejorada para mostrar loader inmediatamente en una pestaña - CENTRADO CORREGIDO
function mostrarLoaderEnPestanaInmediato(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    tab.innerHTML = '';

    const loader = document.createElement('div');
    loader.id = `loader-${tabId}`;
    loader.style.cssText = `
        position: relative;
        width: 100%;
        height: 400px;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: ${CONFIGURACION.Z_INDEX.LOADER};
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;

    loader.innerHTML = `
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
            <div style="
                border: 4px solid #f3f3f3; 
                border-top: 4px solid #6f42c1; 
                border-radius: 50%; 
                width: 60px; 
                height: 60px; 
                animation: spin 1s linear infinite; 
                margin: 0 auto 1.5rem auto;
                display: block;
            "></div>
            <h3 style="
                color: #6f42c1; 
                margin: 0; 
                font-size: 1.2rem; 
                text-align: center;
                margin-bottom: 0.5rem;
            ">Cargando Prácticas...</h3>
            <p style="
                color: #6c757d; 
                margin: 0; 
                font-size: 0.9rem;
                text-align: center;
            ">
                Aplicando filtros y cargando datos específicos
            </p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    tab.appendChild(loader);
}

// Función de debug para verificar funciones de navegación
window.debugNavegacion = function() {
    console.log('🔍 Verificando funciones de navegación...');
    console.log('navegarACabeceraConFiltros:', typeof navegarACabeceraConFiltros);
    console.log('navegarADetalleConFiltros:', typeof navegarADetalleConFiltros);
    console.log('navegarAPracticasConFiltros:', typeof navegarAPracticasConFiltros);
    console.log('navegarConFiltros:', typeof navegarConFiltros);
    console.log('navegarAValidaciones:', typeof navegarAValidaciones);
    console.log('mostrarPestaña:', typeof mostrarPestaña);
    console.log('showTab:', typeof showTab);
    console.log('configurarNavegacionPestanas:', typeof configurarNavegacionPestanas);
};

// Función de debug para verificar pestañas
window.debugPestanas = function() {
    console.log('🔍 === DEBUG PESTAÑAS ===');
    console.log('grillasPorProceso:', document.getElementById('grillasPorProceso'));
    console.log('tablaAprobCabecera:', document.getElementById('tablaAprobCabecera'));
    console.log('tablaCabecera:', document.getElementById('tablaCabecera'));
    console.log('tablaDetalle:', document.getElementById('tablaDetalle'));
    console.log('tablaPracticas:', document.getElementById('tablaPracticas'));
    console.log('TabManager:', tabManager);
    console.log('Datos globales:', {
        aprobCabecera: aprobCabeceraGlobal?.length,
        cabecera: cabeceraGlobal?.length,
        detalle: detalleGlobal?.length,
        practicas: practicasGlobal?.length
    });
    console.log('=========================');
};

// Utilidad para desarrollo
window.limpiarPreferenciaCargaPracticas = function () {
    localStorage.removeItem(CONFIGURACION.STORAGE_KEYS.RECORDAR_CARGA);
    console.log('✅ Preferencia de carga de prácticas eliminada. La próxima vez aparecerá el popup de confirmación.');
};

// Función para verificar el final del archivo
console.log('✅ proceso.js cargado completamente');
