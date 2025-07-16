import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { generarTabla } from './tableUI.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { ProcesosManager } from './procesosUtils.js';

// Hacer disponibles las funciones para el manager
window.tableLogic = { crearSelectorPersonalizado };
window.tableUI = { generarTabla };

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();
    
    // Crear instancia del manager
    const procesosManager = new ProcesosManager();
    
    // Cargar datos y inicializar
    Promise.all([safeFetch('../data/procesos.json')])
        .then(([procesos]) => {
            if (!procesos || !procesos.length) {
                console.warn('No se encontraron datos de procesos');
                return;
            }
            
            procesosManager.inicializar(procesos);
        })
        .catch(error => {
            console.error('Error cargando datos de procesos:', error);
        });
});
