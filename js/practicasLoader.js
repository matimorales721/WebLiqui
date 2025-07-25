// Utilidad para cargar prácticas desde archivos divididos por prestador
import { safeFetch } from './newUtils.js';

/**
 * Clase para manejar la carga de prácticas desde archivos divididos por prestador
 */
export class PracticasLoader {
    /**
     * Busca todos los archivos de prácticas para un proceso específico
     * @param {string|number} codigoProceso - Código del proceso
     * @returns {Promise<Array>} Lista de URLs de archivos encontrados
     */
    static async buscarArchivosPracticas(codigoProceso) {
        const archivosEncontrados = [];

        // Primero intentar cargar el archivo original (por compatibilidad)
        try {
            const respuestaOriginal = await fetch(`../data/practicas-${codigoProceso}.json`);
            if (respuestaOriginal.ok) {
                archivosEncontrados.push(`../data/practicas-${codigoProceso}.json`);
                console.log(`📁 Encontrado archivo original: practicas-${codigoProceso}.json`);
            }
        } catch (error) {
            console.log(
                `📁 Archivo original practicas-${codigoProceso}.json no encontrado, buscando archivos divididos...`
            );
        }

        // Buscar archivos divididos por prestador de manera dinámica
        // Intentamos con una lista extendida de prestadores conocidos y rangos comunes
        const prestadoresPosibles = await this.generarListaPrestadores(codigoProceso);

        console.log(`🔍 Buscando entre ${prestadoresPosibles.length} prestadores posibles...`);

        // Buscar archivos en paralelo usando promesas más eficientes
        const batchSize = 10; // Procesar en lotes para evitar saturar el navegador
        const archivosEncontradosEnLotes = [];

        for (let i = 0; i < prestadoresPosibles.length; i += batchSize) {
            const lote = prestadoresPosibles.slice(i, i + batchSize);
            const promesasLote = lote.map(async (prestador) => {
                try {
                    const url = `../data/practicas_${codigoProceso}_${prestador}.json`;
                    const respuesta = await fetch(url, { method: 'HEAD' });
                    if (respuesta.ok) {
                        return url;
                    }
                } catch (error) {
                    // Silencioso
                }
                return null;
            });

            const resultadosLote = await Promise.allSettled(promesasLote);
            resultadosLote.forEach((resultado) => {
                if (resultado.status === 'fulfilled' && resultado.value) {
                    archivosEncontradosEnLotes.push(resultado.value);
                    console.log(`📁 Encontrado archivo dividido: ${resultado.value}`);
                }
            });

            // Pequeña pausa entre lotes para no saturar el navegador
            if (i + batchSize < prestadoresPosibles.length) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }

        archivosEncontrados.push(...archivosEncontradosEnLotes);

        console.log(`📊 Total de archivos encontrados para proceso ${codigoProceso}: ${archivosEncontrados.length}`);
        return archivosEncontrados;
    }

    /**
     * Genera una lista de prestadores posibles para buscar archivos
     * @param {string|number} codigoProceso - Código del proceso
     * @returns {Promise<Array>} Lista de prestadores a buscar
     */
    static async generarListaPrestadores(codigoProceso) {
        // Lista base de prestadores conocidos (actualizada con los nuevos)
        const prestadoresConocidos = ['3675854', '5007753', '61115', '936062', '5074297'];

        // Intentar auto-detectar prestadores desde otros archivos del proceso
        try {
            const prestadoresDetectados = await this.detectarPrestadoresDesdeArchivos(codigoProceso);
            if (prestadoresDetectados.length > 0) {
                console.log(
                    `🔍 Auto-detectados ${prestadoresDetectados.length} prestadores: ${prestadoresDetectados.join(
                        ', '
                    )}`
                );
                // Combinar detectados con conocidos, eliminando duplicados
                const todosPrestadores = [...new Set([...prestadoresConocidos, ...prestadoresDetectados])];
                return todosPrestadores;
            }
        } catch (error) {
            console.log('🔍 No se pudieron auto-detectar prestadores, usando lista base');
        }

        // Intentar obtener lista dinámica desde el servidor si está disponible
        try {
            const prestadoresDinamicos = await this.buscarPrestadoresEnServidor(codigoProceso);
            if (prestadoresDinamicos.length > 0) {
                console.log(`🌐 Encontrados ${prestadoresDinamicos.length} prestadores desde servidor`);
                return prestadoresDinamicos;
            }
        } catch (error) {
            console.log('📡 No se pudo obtener lista dinámica, usando lista estática');
        }

        return prestadoresConocidos;
    }

    /**
     * Intenta detectar prestadores analizando archivos existentes del proceso
     * @param {string|number} codigoProceso - Código del proceso
     * @returns {Promise<Array>} Lista de prestadores detectados
     */
    static async detectarPrestadoresDesdeArchivos(codigoProceso) {
        const prestadoresDetectados = [];

        try {
            // Intentar obtener prestadores desde el archivo de detalle si existe
            const respuestaDetalle = await fetch(`../data/detalle-${codigoProceso}.json`);
            if (respuestaDetalle.ok) {
                const datosDetalle = await respuestaDetalle.json();
                const items = datosDetalle.results?.[0]?.items || [];
                const prestadores = [...new Set(items.map((item) => item.c_prestador).filter(Boolean))];
                prestadoresDetectados.push(...prestadores);
                console.log(
                    `📋 Prestadores encontrados en detalle: ${prestadores.slice(0, 5).join(', ')}${
                        prestadores.length > 5 ? '...' : ''
                    }`
                );
            }
        } catch (error) {
            console.log('📋 No se pudo analizar archivo de detalle');
        }

        try {
            // Intentar obtener prestadores desde el archivo de cabecera si existe
            const respuestaCabecera = await fetch(`../data/cabecera-${codigoProceso}.json`);
            if (respuestaCabecera.ok) {
                const datosCabecera = await respuestaCabecera.json();
                const items = datosCabecera.results?.[0]?.items || [];
                const prestadores = [...new Set(items.map((item) => item.c_prestador).filter(Boolean))];
                prestadoresDetectados.push(...prestadores);
                console.log(
                    `📋 Prestadores encontrados en cabecera: ${prestadores.slice(0, 5).join(', ')}${
                        prestadores.length > 5 ? '...' : ''
                    }`
                );
            }
        } catch (error) {
            console.log('📋 No se pudo analizar archivo de cabecera');
        }

        // Eliminar duplicados y convertir a strings
        return [...new Set(prestadoresDetectados)].map((p) => p.toString());
    }

    /**
     * Intenta obtener lista de prestadores desde el servidor
     * @param {string|number} codigoProceso - Código del proceso
     * @returns {Promise<Array>} Lista de prestadores desde servidor
     */
    static async buscarPrestadoresEnServidor(codigoProceso) {
        try {
            // Si hubiera un endpoint del servidor para listar archivos disponibles:
            // const respuesta = await fetch(`/api/archivos-practicas/${codigoProceso}`);
            // if (respuesta.ok) {
            //     const archivos = await respuesta.json();
            //     return archivos.map(archivo => {
            //         const match = archivo.match(/practicas_\d+_(\d+)\.json$/);
            //         return match ? match[1] : null;
            //     }).filter(Boolean);
            // }

            // Por ahora retornamos array vacío ya que no tenemos endpoint
            return [];
        } catch (error) {
            console.warn('No se pudo consultar servidor para lista de prestadores:', error);
            return [];
        }
    }

    /**
     * Carga y combina datos de prácticas desde múltiples archivos
     * @param {string|number} codigoProceso - Código del proceso
     * @returns {Promise<Array>} Array combinado de prácticas
     */
    static async cargarPracticasCombinadas(codigoProceso) {
        try {
            const archivos = await this.buscarArchivosPracticas(codigoProceso);

            if (archivos.length === 0) {
                console.warn(`No se encontraron archivos de prácticas para el proceso ${codigoProceso}`);
                return [];
            }

            console.log(
                `Encontrados ${archivos.length} archivos de prácticas para el proceso ${codigoProceso}:`,
                archivos
            );

            // Cargar todos los archivos en paralelo
            const promesas = archivos.map((url) => this.cargarArchivoPracticas(url));
            const resultados = await Promise.allSettled(promesas);

            // Combinar todos los datos exitosos de manera eficiente
            let practicasCombinadas = [];
            let totalRegistros = 0;

            resultados.forEach((resultado, index) => {
                if (resultado.status === 'fulfilled') {
                    const datos = resultado.value;
                    if (datos && datos.length > 0) {
                        // Para arrays grandes, usar concat que es más eficiente
                        if (datos.length > 50000) {
                            console.log(
                                `📦 Procesando archivo grande ${archivos[index]}: ${datos.length} registros...`
                            );
                            practicasCombinadas = practicasCombinadas.concat(datos);
                        } else {
                            practicasCombinadas = practicasCombinadas.concat(datos);
                        }
                        totalRegistros += datos.length;
                        console.log(`✓ Cargado archivo ${archivos[index]}: ${datos.length} registros`);
                    }
                } else {
                    console.warn(`✗ Error cargando ${archivos[index]}:`, resultado.reason);
                }
            });

            console.log(`📊 Total de prácticas cargadas: ${totalRegistros} registros de ${archivos.length} archivo(s)`);

            // Ordenar por C_ID_PRACTICA para mantener consistencia (optimizado para arrays grandes)
            if (practicasCombinadas.length > 0) {
                console.log('🔄 Ordenando registros...');
                practicasCombinadas.sort((a, b) => {
                    const idA = a.C_ID_PRACTICA || a.c_id_practica || 0;
                    const idB = b.C_ID_PRACTICA || b.c_id_practica || 0;
                    return idB - idA; // Descendente
                });
                console.log('✅ Ordenamiento completado');
            }

            return practicasCombinadas;
        } catch (error) {
            console.error('Error cargando prácticas combinadas:', error);
            return [];
        }
    }

    /**
     * Carga un archivo individual de prácticas y normaliza su formato
     * @param {string} url - URL del archivo a cargar
     * @returns {Promise<Array>} Array de prácticas normalizadas
     */
    static async cargarArchivoPracticas(url) {
        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) {
                throw new Error(`HTTP ${respuesta.status}`);
            }

            const datos = await respuesta.json();

            // Detectar formato del archivo
            if (datos.metadata && datos.data) {
                // Nuevo formato con metadata
                console.log(
                    `📋 Archivo nuevo formato: ${url} (prestador: ${datos.metadata.c_prestador}, registros: ${datos.metadata.total_registros})`
                );
                return this.normalizarDatosNuevoFormato(datos.data);
            } else if (datos.results && datos.results[0] && datos.results[0].items) {
                // Formato original
                console.log(`📋 Archivo formato original: ${url} (${datos.results[0].items.length} registros)`);
                return this.normalizarDatosFormatoOriginal(datos.results[0].items);
            } else {
                console.warn(`Formato de archivo desconocido: ${url}`);
                return [];
            }
        } catch (error) {
            console.error(`Error cargando archivo ${url}:`, error);
            return [];
        }
    }

    /**
     * Normaliza datos del nuevo formato (con metadata) al formato esperado por la aplicación
     * @param {Array} datos - Datos en nuevo formato
     * @returns {Array} Datos normalizados
     */
    static normalizarDatosNuevoFormato(datos) {
        return datos.map((item) => ({
            // Convertir campos en mayúsculas a minúsculas para compatibilidad
            c_proceso: item.C_PROCESO,
            c_file_upload: item.C_FILE_UPLOAD,
            n_prestacion: item.N_PRESTACION,
            c_prestador: item.C_PRESTADOR,
            c_red: item.C_RED,
            c_tipo_prestacion: item.C_TIPO_PRESTACION,
            f_prestacion: this.convertirFechaISO(item.F_PRESTACION),
            n_beneficio: item.N_BENEFICIO,
            c_grado_paren: item.C_GRADO_PAREN,
            c_periodo: item.C_PERIODO,
            c_id_practica: item.C_ID_PRACTICA,
            f_practica: this.convertirFechaISO(item.F_PRACTICA),
            q_practica: item.Q_PRACTICA,
            q_pract_correctas: item.Q_PRACT_CORRECTAS,
            c_modulo_pami_4x: item.C_MODULO_PAMI_4X,
            c_practica: item.C_PRACTICA,
            c_prestacion: item.C_PRESTACION,
            c_modalidad_prestacion: item.C_MODALIDAD_PRESTACION,
            c_usuario: item.C_USUARIO,
            c_ugl: item.C_UGL,
            c_error: item.C_ERROR,
            n_orden_rechazo: item.N_ORDEN_RECHAZO,
            n_matricula: item.N_MATRICULA,
            c_periodo_r: item.C_PERIODO_R,
            receta: item.RECETA,
            c_concepto: item.C_CONCEPTO,
            recuperable: item.RECUPERABLE,
            d_banda_credencial: item.D_BANDA_CREDENCIAL,
            n_prop: item.N_PROP,

            // Mantener también las versiones originales por si acaso
            ...item
        }));
    }

    /**
     * Normaliza datos del formato original (mantiene compatibilidad)
     * @param {Array} datos - Datos en formato original
     * @returns {Array} Datos normalizados
     */
    static normalizarDatosFormatoOriginal(datos) {
        // El formato original ya tiene el formato esperado, solo convertir fechas si es necesario
        return datos.map((item) => ({
            ...item,
            f_prestacion: this.normalizarFecha(item.f_prestacion),
            f_practica: this.normalizarFecha(item.f_practica)
        }));
    }

    /**
     * Convierte fecha ISO 8601 al formato esperado por la aplicación
     * @param {string} fechaISO - Fecha en formato ISO
     * @returns {string} Fecha en formato dd/mm/yyyy hh:mm:ss
     */
    static convertirFechaISO(fechaISO) {
        if (!fechaISO) return fechaISO;

        try {
            const fecha = new Date(fechaISO);
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const año = fecha.getFullYear();
            const hora = fecha.getHours().toString().padStart(2, '0');
            const minuto = fecha.getMinutes().toString().padStart(2, '0');
            const segundo = fecha.getSeconds().toString().padStart(2, '0');

            return `${dia}/${mes}/${año} ${hora}:${minuto}:${segundo}`;
        } catch (error) {
            console.warn('Error convirtiendo fecha ISO:', fechaISO, error);
            return fechaISO;
        }
    }

    /**
     * Normaliza formato de fecha (mantiene formato existente o convierte)
     * @param {string} fecha - Fecha a normalizar
     * @returns {string} Fecha normalizada
     */
    static normalizarFecha(fecha) {
        if (!fecha) return fecha;

        // Si ya está en formato dd/mm/yyyy, mantenerlo
        if (typeof fecha === 'string' && fecha.includes('/')) {
            return fecha;
        }

        // Si es formato ISO, convertir
        return this.convertirFechaISO(fecha);
    }

    /**
     * Busca archivos de prácticas disponibles usando una llamada al servidor
     * (Método alternativo si el servidor proporciona un endpoint para listar archivos)
     * @param {string|number} codigoProceso - Código del proceso
     * @returns {Promise<Array>} Lista de archivos disponibles
     */
    static async buscarArchivosEnServidor(codigoProceso) {
        try {
            // Esto requeriría un endpoint del servidor como:
            // const respuesta = await fetch(`/api/archivos-practicas/${codigoProceso}`);
            // if (respuesta.ok) {
            //     return await respuesta.json();
            // }

            // Por ahora, retornamos array vacío
            return [];
        } catch (error) {
            console.warn('No se pudo consultar servidor para archivos de prácticas:', error);
            return [];
        }
    }
}

/**
 * Función de conveniencia para reemplazar la carga tradicional de prácticas
 * @param {string|number} codigoProceso - Código del proceso
 * @returns {Promise<Array>} Array de prácticas
 */
export async function cargarPracticas(codigoProceso) {
    return await PracticasLoader.cargarPracticasCombinadas(codigoProceso);
}
