// Utilidades reutilizables para el manejo de procesos
import { logger } from './logging.js';

/**
 * Clase para manejar operaciones comunes de fecha y tiempo
 */
export class DateUtils {
    /**
     * Formatea una fecha/hora removiendo los segundos (sin agregar "hs")
     * @param {string} fechaHora - Fecha/hora en formato string
     * @returns {string} Fecha/hora formateada sin segundos
     */
    static formatearFechaHora(fechaHora) {
        // Validar que el input sea un string válido
        if (!fechaHora || typeof fechaHora !== 'string') {
            return '';
        }

        try {
            // Formato de entrada: "23/06/2025 21:23:50"
            const partes = fechaHora.split(' ');
            if (partes.length >= 2) {
                const [fecha, hora] = partes;
                const horaPartes = hora.split(':');
                if (horaPartes.length >= 2) {
                    return `${fecha} ${horaPartes[0]}:${horaPartes[1]}`;
                }
            }
            return fechaHora;
        } catch (error) {
            logger.warn('Error formateando fecha/hora', error, { fechaHora });
            return '';
        }
    }

    /**
     * Calcula la duración entre dos fechas (sin agregar "hs")
     * @param {string} inicio - Fecha de inicio
     * @param {string} fin - Fecha de fin
     * @returns {string} Duración formateada (HH:MM)
     */
    static calcularDuracion(inicio, fin) {
        if (!inicio || !fin) return '';

        try {
            const inicioDate = this.parsearFecha(inicio);
            const finDate = this.parsearFecha(fin);

            if (!inicioDate || !finDate) return '';

            const diffMs = finDate - inicioDate;
            const minutos = Math.floor(diffMs / 60000);
            const horas = Math.floor(minutos / 60);
            const minRest = minutos % 60;

            return `${horas.toString().padStart(2, '0')}:${minRest.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error calculando duración:', error);
            logger.error('Error calculando duración', error);
            return '';
        }
    }

    /**
     * Calcula duración en formato legible (sin agregar "hs")
     * @param {string} inicio - Fecha de inicio
     * @param {string} fin - Fecha de fin
     * @returns {string} Duración en formato legible
     */
    static calcularDuracionLegible(inicio, fin) {
        if (!inicio || !fin) return '';

        try {
            const inicioDate = this.parsearFecha(inicio);
            const finDate = this.parsearFecha(fin);

            if (!inicioDate || !finDate) return '';

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
            console.error('Error calculando duración legible:', error);
            logger.error('Error calculando duración legible', error);
            return '';
        }
    }

    /**
     * Parsea fechas en formato "23/06/2025 21:23:50" a Date object
     * @param {string} fechaString - Fecha en formato dd/mm/yyyy hh:mm:ss
     * @returns {Date|null} Objeto Date o null si es inválido
     */
    static parsearFecha(fechaString) {
        // Validar que el input sea un string válido
        if (!fechaString || typeof fechaString !== 'string') {
            return null;
        }

        try {
            // Formato de entrada: "23/06/2025 21:23:50"
            const partes = fechaString.split(' ');
            if (partes.length !== 2) {
                // Intentar crear la fecha directamente como fallback
                const fecha = new Date(fechaString);
                return isNaN(fecha.getTime()) ? null : fecha;
            }

            const [fecha, hora] = partes;
            const [dia, mes, ano] = fecha.split('/');

            // Crear formato ISO: "2025-06-23T21:23:50"
            const fechaISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora}`;
            const fechaObj = new Date(fechaISO);

            return isNaN(fechaObj.getTime()) ? null : fechaObj;
        } catch (error) {
            logger.warn('Error parseando fecha', error, { fechaString });
            return null;
        }
    }
}

/**
 * Clase para manejar tipos de ejecución de procesos
 */
export class TipoEjecucionUtils {
    static tipos = {
        E: 'Excepción',
        M: 'Mensual'
    };

    /**
     * Formatea el tipo de ejecución
     * @param {string} tipo - Código del tipo de ejecución
     * @returns {string} Tipo de ejecución formateado
     */
    static formatear(tipo) {
        // Convertir a string si no lo es y retornar el tipo formateado o el valor como string
        return this.tipos[tipo] || String(tipo);
    }
}

/**
 * Clase para manejar data fetching de procesos de manera reutilizable
 */
export class ProcesoDataManager {
    constructor(codigoProceso) {
        this.codigoProceso = codigoProceso;
        this.cache = new Map();
    }

    /**
     * Obtiene los datos de un proceso específico
     * @returns {Promise<Object>} Datos del proceso
     */
    async obtenerDatosProceso() {
        const cacheKey = `proceso_${this.codigoProceso}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch('../data/procesos.json');
            const json = await response.json();
            const procesos = json.results[0].items;
            const proceso = procesos.find((p) => parseInt(p.c_proceso) === this.codigoProceso);

            if (proceso) {
                this.cache.set(cacheKey, proceso);
            }

            return proceso;
        } catch (error) {
            console.error('Error obteniendo datos del proceso:', error);
            return null;
        }
    }

    /**
     * Carga datos de múltiples archivos de manera eficiente
     * @param {Array<string>} tipos - Tipos de datos a cargar (practicas, detalle, etc.)
     * @returns {Promise<Object>} Objeto con todos los datos cargados
     */
    async cargarDatosMultiples(tipos = ['practicas', 'detalle', 'cabecera', 'aprob-cabecera', 'validaciones']) {
        const promises = tipos.map((tipo) => this.cargarDatosTipo(tipo));
        const resultados = await Promise.allSettled(promises);

        const datos = {};
        tipos.forEach((tipo, index) => {
            const resultado = resultados[index];
            if (resultado.status === 'fulfilled') {
                datos[tipo.replace('-', '_')] = resultado.value;
            } else {
                console.warn(`Error cargando datos de ${tipo}:`, resultado.reason);
                datos[tipo.replace('-', '_')] = [];
            }
        });

        return datos;
    }

    /**
     * Carga datos de un tipo específico con manejo de errores
     * @param {string} tipo - Tipo de datos a cargar
     * @returns {Promise<Array>} Array de datos o array vacío si hay error
     */
    async cargarDatosTipo(tipo) {
        try {
            const response = await fetch(`../data/${tipo}-${this.codigoProceso}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} para ${tipo}`);
            }
            const data = await response.json();
            return data.results?.[0]?.items || [];
        } catch (error) {
            console.warn(`No se pudieron cargar datos de ${tipo}:`, error.message);
            return [];
        }
    }
}

/**
 * Función utilitaria para manejar fetch con manejo de errores mejorado
 * @param {string} url - URL a consultar
 * @returns {Promise<Array>} Datos obtenidos o array vacío
 */
export async function safeFetch(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();

        // Manejo diferente según el tipo de datos
        if (url.includes('procesos.json')) {
            return data.results?.[0]?.items || [];
        } else {
            return data.results?.[0]?.items || [];
        }
    } catch (error) {
        console.warn(`Error en safeFetch para ${url}:`, error.message);
        return [];
    }
}

/**
 * Clase para manejar configuraciones de campos de tablas
 */
export class CamposConfigManager {
    static configuraciones = {
        practicas: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'c_practica', header: 'Cod. Práctica', format: 'code' },
            { key: 'd_practica', header: 'Práctica' },
            { key: 'n_beneficio', header: 'Beneficiario', format: 'code' },
            { key: 'n_orden_rechazo', header: 'N_OP', format: 'code' },
            { key: 'f_practica', header: 'Fecha Práctica', format: 'date' },
            { key: 'q_practica', header: 'Q_PRACT', format: 'numeric' },
            { key: 'q_pract_correctas', header: 'Q_CORR', format: 'numeric' },
            { key: 'c_id_practica', header: 'C_ID_PRACTICA', format: 'code' }
        ],
        detalle: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'd_modulo_pami', header: 'Modulo' },
            { key: 'd_practica', header: 'Práctica' },
            { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' }
        ],
        cabecera: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'd_modulo_pami', header: 'Modulo' },
            { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' }
        ],
        aprob_cabecera: [
            { key: 'c_concepto', header: 'Concepto', format: 'code' },
            { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
            { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
            { key: 'd_prestador', header: 'Prestador' },
            { key: 'd_modulo_pami', header: 'Modulo (7X)' },
            { key: 'i_monto', header: 'I_MONTO', format: 'moneda' }
        ]
    };

    /**
     * Obtiene la configuración de campos para un tipo específico
     * @param {string} tipo - Tipo de configuración
     * @returns {Array} Configuración de campos
     */
    static obtener(tipo) {
        return this.configuraciones[tipo] || [];
    }

    /**
     * Agrega campos dinámicos como acciones
     * @param {string} tipo - Tipo de configuración
     * @param {Array} camposAdicionales - Campos adicionales a agregar
     * @returns {Array} Configuración completa de campos
     */
    static obtenerConCamposAdicionales(tipo, camposAdicionales = []) {
        const configuracionBase = this.obtener(tipo);
        return [...configuracionBase, ...camposAdicionales];
    }
}

/**
 * Funciones utilitarias para el manejo de URLs y parámetros
 */
export class UrlUtils {
    /**
     * Extrae el código de proceso de la URL
     * @returns {number} Código del proceso
     */
    static getParametroProceso() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('codigo'));
    }

    /**
     * Construye URL de vuelta a procesos con filtros preservados
     * @returns {string} URL construida
     */
    static construirUrlVueltaProcesos() {
        const urlParams = new URLSearchParams(window.location.search);
        const filtroTipo = urlParams.get('filtroTipo');
        const filtroPeriodo = urlParams.get('filtroPeriodo');

        let url = 'procesos.html';
        const params = new URLSearchParams();

        if (filtroTipo) {
            params.append('filtroTipo', filtroTipo);
        }
        if (filtroPeriodo) {
            params.append('filtroPeriodo', filtroPeriodo);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        return url;
    }

    /**
     * Navega a validaciones con parámetros
     * @param {number} codigo - Código del proceso
     * @param {string} cIdPractica - ID de la práctica
     */
    static navegarAValidaciones(codigo, cIdPractica) {
        const url = `validaciones.html?codigo=${encodeURIComponent(codigo)}&c_id_practica=${encodeURIComponent(
            cIdPractica
        )}`;
        window.location.href = url;
    }
}
