import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { generarTabla } from './tableUI.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';
import { ProcesosManager } from './procesosUtils.js';
import { Auth } from './auth.js';

// Hacer disponibles las funciones para el manager
window.tableLogic = { crearSelectorPersonalizado };
window.tableUI = { generarTabla };

// ===== CONFIGURACIÓN DE LOGOUT ===== (AGREGAR ESTA SECCIÓN)

// Función para configurar el botón de logout
function configurarBotonLogout() {
    console.log('🔧 Configurando botón de logout...');
    
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        // Limpiar eventos existentes usando cloneNode
        const nuevoBtnLogout = btnLogout.cloneNode(true);
        btnLogout.parentNode.replaceChild(nuevoBtnLogout, btnLogout);
        
        nuevoBtnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const confirmar = confirm('¿Está seguro que desea cerrar sesión?');
            if (confirmar) {
                ejecutarLogout();
            }
        });
        
        console.log('✅ Botón logout configurado');
    } else {
        console.warn('⚠️ No se encontró btnLogout en el DOM');
    }
}

// Función para ejecutar el logout
function ejecutarLogout() {
    try {
        console.log('🔄 Ejecutando logout...');
        
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="2" opacity="0.8">
                        <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite"/>
                    </circle>
                </svg>
            `;
            btnLogout.disabled = true;
            btnLogout.style.opacity = '0.6';
            btnLogout.style.cursor = 'not-allowed';
        }
        
        // Limpiar datos usando Auth
        if (typeof Auth !== 'undefined' && Auth.cerrarSesion) {
            console.log('✅ Cerrando sesión con Auth.cerrarSesion()');
            Auth.cerrarSesion();
        } else {
            // Fallback manual
            console.warn('⚠️ Auth.cerrarSesion no disponible, limpiando manualmente...');
            sessionStorage.removeItem('usuarioLogueado');
            localStorage.clear();
            
            setTimeout(() => {
                window.location.href = '../pages/login.html';
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Error durante el logout:', error);
        
        // Restaurar botón en caso de error
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
            `;
            btnLogout.disabled = false;
            btnLogout.style.opacity = '1';
            btnLogout.style.cursor = 'pointer';
        }
        
        alert('Error al cerrar sesión. Por favor, intente nuevamente.');
    }
}

// MODIFICAR EL EVENTO PRINCIPAL para incluir logout:
document.addEventListener('DOMContentLoaded', async () => {
    // Validar sesión al cargar la página
    if (!Auth.validarSesion()) {
        return;
    }
    
    // Actualizar datos del usuario en el DOM
    Auth.actualizarDatosUsuario();
    
    // CONFIGURAR BOTÓN DE LOGOUT
    setTimeout(() => {
        configurarBotonLogout();
    }, 100);
    
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
    
    // RECONFIGURAR BOTÓN DESPUÉS DE CARGAR
    setTimeout(() => {
        configurarBotonLogout();
    }, 1000);
});

// ===== FUNCIONES DE DEBUG ===== (AGREGAR AL FINAL)

window.debugLogout = function() {
    console.log('🔍 === DEBUG LOGOUT ===');
    const btnLogout = document.getElementById('btnLogout');
    console.log('btnLogout encontrado:', !!btnLogout);
    if (btnLogout) {
        console.log('- Texto:', btnLogout.textContent);
        console.log('- Disabled:', btnLogout.disabled);
        console.log('- Eventos:', getEventListeners?.(btnLogout) || 'No disponible');
    }
    console.log('Auth disponible:', typeof Auth !== 'undefined');
    console.log('======================');
};

window.probarLogout = function() {
    console.log('🧪 Probando logout manualmente...');
    ejecutarLogout();
};

window.reconfigurarLogout = function() {
    console.log('🔄 Reconfigurando botón logout...');
    configurarBotonLogout();
    setTimeout(() => debugLogout(), 100);
};
