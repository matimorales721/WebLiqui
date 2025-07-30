import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { generarTabla } from './tableUI.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { ProcesosManager } from './procesosUtils.js';
import { Auth } from './auth.js';

// Hacer disponibles las funciones para el manager
window.tableLogic = { crearSelectorPersonalizado };
window.tableUI = { generarTabla };

document.addEventListener('DOMContentLoaded', () => {
    // Validar sesión al cargar la página
    if (!Auth.validarSesion()) {
        return;
    }
    
    // Actualizar datos del usuario en el DOM
    Auth.actualizarDatosUsuario();
    
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();

    // Crear instancia del manager
    const procesosManager = new ProcesosManager();

    // Intentamos primero con el backend
    safeFetch('http://localhost:3000/api/pxp/procesos')
        .then((procesos) => {
            if (!procesos || !procesos.length) {
                throw new Error('Backend vacío o sin procesos');
            }
            procesosManager.inicializar(procesos);
        })
        .catch((error) => {
            console.warn('No se pudo cargar desde backend, intentando fallback local:', error);

            // Fallback al archivo local
            safeFetch('../data/procesos.json')
                .then((procesos) => {
                    if (!procesos || !procesos.length) {
                        console.warn('No se encontraron datos de procesos en el archivo local');
                        return;
                    }
                    procesosManager.inicializar(procesos);
                })
                .catch((error) => {
                    console.error('Error cargando datos de procesos desde archivo local:', error);
                });
        });
});
