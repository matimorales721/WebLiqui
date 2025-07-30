import { formatearFecha, formatearMoneda } from './formatters.js';

export class ProcesoUI {
    static contenidoOriginal = null;

    static mostrarDatosProceso(proceso) {
        console.log('🔍 === DEBUG mostrarDatosProceso ===');
        console.log('Proceso recibido:', proceso);

        // PRIMERO restaurar el contenido original si existe
        this.restaurarContenidoOriginal();

        if (!proceso) {
            console.log('❌ No hay proceso para mostrar');
            return;
        }

        // Mapear campos del JSON a los elementos HTML originales
        const elementos = {
            codigo: proceso.C_PROCESO,
            tipo: proceso.TIPO_EJECUCION,
            periodo: proceso.C_PERIODO,
            inicio: proceso.F_INICIO ? formatearFecha(new Date(proceso.F_INICIO), true) : 'N/A',
            fin: proceso.F_FIN ? formatearFecha(new Date(proceso.F_FIN), true) : 'N/A',
            duracion: proceso.DURACION_HHMM ? proceso.DURACION_HHMM + ' hs.' : 'N/A'
        };

        console.log('📋 Datos a mostrar:', elementos);

        Object.entries(elementos).forEach(([id, valor]) => {
            console.log(`Buscando elemento con ID: '${id}'`);
            const elemento = document.getElementById(id);

            if (elemento) {
                console.log(`✅ Elemento '${id}' encontrado. Asignando valor: '${valor}'`);
                elemento.textContent = valor;
            } else {
                console.error(`❌ Elemento con ID '${id}' NO ENCONTRADO en el DOM`);
            }
        });

        // DESPUÉS de actualizar datos del proceso, inicializar pestañas
        setTimeout(() => {
            if (window.inicializarPestanas) {
                window.inicializarPestanas();
            }
        }, 100);

        console.log('=== FIN DEBUG ===');
    }

    static mostrarError(mensaje) {
        console.log('Mostrando error:', mensaje);
        const container = document.querySelector('.content');
        container.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 20px;">
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button onclick="history.back()" class="btn-secondary">← Volver</button>
            </div>
        `;
    }

    static guardarContenidoOriginal() {
        if (!this.contenidoOriginal) {
            const container = document.querySelector('.content');
            if (container) {
                this.contenidoOriginal = container.innerHTML;
                console.log('💾 Contenido original guardado');
                console.log('📋 Verificando que se guardaron las tablas:');
                console.log('- tablaAprobCabecera:', this.contenidoOriginal.includes('tablaAprobCabecera'));
                console.log('- tablaCabecera:', this.contenidoOriginal.includes('tablaCabecera'));
                console.log('- tablaDetalle:', this.contenidoOriginal.includes('tablaDetalle'));

                // DEBUG ADICIONAL: Ver una muestra del contenido guardado
                console.log('🔍 Primeros 500 caracteres del contenido guardado:');
                console.log(this.contenidoOriginal.substring(0, 500));

                // DEBUG: Buscar específicamente grillasPorProceso
                console.log('- grillasPorProceso:', this.contenidoOriginal.includes('grillasPorProceso'));
                console.log('- aprob-cabecera:', this.contenidoOriginal.includes('aprob-cabecera'));
                console.log('- tab-content:', this.contenidoOriginal.includes('tab-content'));
            }
        }
    }

    static mostrarCargando() {
        console.log('Mostrando pantalla de carga...');
        const container = document.querySelector('.content');
        container.innerHTML = `
            <div class="loading" style="text-align: center; padding: 40px;">
                <h3>Cargando datos del proceso...</h3>
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto;"></div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    static restaurarContenidoOriginal() {
        if (this.contenidoOriginal) {
            const container = document.querySelector('.content');
            if (container) {
                container.innerHTML = this.contenidoOriginal;
                console.log('✅ Contenido original restaurado');

                // DEBUG MEJORADO: Ver qué se restauró realmente
                console.log('📋 Verificando que se restauraron las tablas:');

                const grillasPorProceso = document.getElementById('grillasPorProceso');
                console.log('- grillasPorProceso:', !!grillasPorProceso);

                if (grillasPorProceso) {
                    console.log('🔍 Contenido de grillasPorProceso:');
                    console.log(grillasPorProceso.innerHTML.substring(0, 200));

                    const aprobCabeceraDiv = document.getElementById('aprob-cabecera');
                    const cabeceraDiv = document.getElementById('cabecera');
                    const detalleDiv = document.getElementById('detalle');

                    console.log('- aprob-cabecera div:', !!aprobCabeceraDiv);
                    console.log('- cabecera div:', !!cabeceraDiv);
                    console.log('- detalle div:', !!detalleDiv);

                    if (aprobCabeceraDiv) {
                        console.log(
                            '- tablaAprobCabecera dentro:',
                            !!aprobCabeceraDiv.querySelector('#tablaAprobCabecera')
                        );
                    }
                }

                console.log('- tablaAprobCabecera:', !!document.getElementById('tablaAprobCabecera'));
                console.log('- tablaCabecera:', !!document.getElementById('tablaCabecera'));
                console.log('- tablaDetalle:', !!document.getElementById('tablaDetalle'));
            }
        }
    }
}
