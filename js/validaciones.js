import { Auth } from './auth.js';
import { generarTabla } from './tableUI.js';
import { poblarSelectUnico } from './tableLogic.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Validar sesión al cargar la página
    if (!Auth.validarSesion()) {
        return;
    }
    
    // Actualizar datos del usuario en el DOM
    Auth.actualizarDatosUsuario();
    
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();
    const urlParams = new URLSearchParams(window.location.search);
    const codigo = urlParams.get('codigo');
    const c_id_practica = urlParams.get('c_id_practica');

    // Configurar botón "Volver a Prácticas" si venimos desde prácticas
    if (codigo && c_id_practica) {
        const btnVolverPracticas = document.getElementById('btnVolverPracticas');
        if (btnVolverPracticas) {
            btnVolverPracticas.style.display = 'inline-block';
            btnVolverPracticas.addEventListener('click', () => {
                // Construir URL de vuelta a proceso con la pestaña de prácticas activa y restauración de estado
                const practicasUrl = `./proceso.html?codigo=${codigo}&restore=true#practicas`;
                window.location.href = practicasUrl;
            });
        }
    }

    let validacionesGlobal = [];

    // Esto bien podria ser resuelto con mi propia entidad Validacion, que se cargue en otra capa con los datos del json
    // Pero por ahora sirve asi.
    const camposGrillaValidaciones = [
        { key: 'c_grupo', header: 'Grupo', format: 'code' },
        { key: 'c_validacion', header: 'Cod. Validacion', format: 'code' },
        { key: 'd_validacion', header: 'Validación' },
        { key: 'c_file_upload', header: 'File' },
        { key: 'n_prestacion', header: 'N_PRESTACION' },
        { key: '', header: 'PRESTADOR' },
        { key: '', header: 'MODULO' },
        { key: '', header: 'PRACTICA' },
        { key: 'c_id_practica', header: 'C_ID_PRACTICA', format: 'code' }
    ];

    // Estado global de paginación validaciones
    window.currentPageValidaciones = 1;
    window.pageSizeValidaciones = 10;
    window.filteredValidaciones = [];

    function renderTablaValidaciones() {
        if (filteredValidaciones.length === 0) {
            const tbody = document.querySelector('#tablaValidaciones');
            tbody.innerHTML = `<body><tr><td colspan='99'>No hay validaciones para esta práctica</td></tr></body>`;
            document.getElementById('pageInfoValidaciones').textContent = '';
            document.getElementById('prevPageValidaciones').disabled = true;
            document.getElementById('nextPageValidaciones').disabled = true;
            return;
        }
        generarTabla(
            filteredValidaciones,
            'tablaValidaciones',
            camposGrillaValidaciones,
            undefined,
            currentPageValidaciones,
            pageSizeValidaciones
        );
        const totalPages = Math.max(1, Math.ceil(filteredValidaciones.length / pageSizeValidaciones));
        // Paginador visual
        const paginador = document.getElementById('paginacionValidaciones');
        if (paginador) {
            paginador.innerHTML = '';
            let btnWidth = 38;
            let paginadorWidth = paginador.offsetWidth || 400;
            let maxBtns = Math.floor(paginadorWidth / btnWidth);
            if (maxBtns < 5) maxBtns = 5;
            let btns = [];
            if (totalPages <= maxBtns) {
                for (let i = 1; i <= totalPages; i++) btns.push(i);
            } else {
                let start = Math.max(1, currentPageValidaciones - Math.floor(maxBtns / 2));
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
            btns.forEach((i) => {
                if (i === '...') {
                    const span = document.createElement('span');
                    span.textContent = '...';
                    span.className = 'paginador-ellipsis';
                    paginador.appendChild(span);
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = i;
                    btn.className = 'paginador-btn' + (i === currentPageValidaciones ? ' active' : '');
                    btn.style.margin = '4px 4px'; // separación vertical y horizontal
                    btn.onclick = () => {
                        currentPageValidaciones = i;
                        renderTablaValidaciones();
                    };
                    paginador.appendChild(btn);
                }
            });
        }
    }

    Promise.all([safeFetch(`../data/validaciones-${codigo}.json`)]).then(([items]) => {
        if (!items) {
            const tbody = document.querySelector('#tablaValidaciones');
            tbody.innerHTML = `<body><tr><td colspan='99' style="color:red">No se pudo cargar el archivo de validaciones.</td></tr></body>`;
            return;
        }
        const validaciones = items || [];

        validacionesGlobal = validaciones;

        poblarSelectUnico(validaciones, 'c_grupo', 'filtroGrupo', 'Grupos');
        poblarSelectUnico(validaciones, 'c_validacion', 'filtroCodigoValidacion', 'Validaciones');
        poblarSelectUnico(validaciones, 'c_id_practica', 'filtroCIdPractica', 'c_id_practicas');

        filteredValidaciones = validaciones.filter((p) => !c_id_practica || p.c_id_practica == c_id_practica);
        currentPageValidaciones = 1;
        renderTablaValidaciones();
    });

    document.getElementById('prevPageValidaciones').addEventListener('click', () => {
        if (currentPageValidaciones > 1) {
            currentPageValidaciones--;
            renderTablaValidaciones();
        }
    });
    document.getElementById('nextPageValidaciones').addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(filteredValidaciones.length / pageSizeValidaciones));
        if (currentPageValidaciones < totalPages) {
            currentPageValidaciones++;
            renderTablaValidaciones();
        }
    });
    document.getElementById('pageSizeValidaciones').addEventListener('change', (e) => {
        pageSizeValidaciones = parseInt(e.target.value, 10);
        currentPageValidaciones = 1;
        renderTablaValidaciones();
    });

    /* Filtros */
    /*  - Filtros Prácticas */
    document.getElementById('filtroBtn').addEventListener('click', () => {
        const c_validacion = document.getElementById('filtroCodigoValidacion').value.toLowerCase();
        const c_grupo = document.getElementById('filtroGrupo').value.toLowerCase();
        const c_id_practica = document.getElementById('filtroCIdPractica').value.toLowerCase();

        const filtradas = validacionesGlobal.filter(
            (p) =>
                (!c_validacion || p.c_validacion == c_validacion) &&
                (!c_grupo || p.c_grupo == c_grupo) &&
                (!c_id_practica || p.c_id_practica == c_id_practica)
        );

        filteredValidaciones = filtradas;
        currentPageValidaciones = 1;
        renderTablaValidaciones();
    });
});

function mostrarError(mensaje) {}
