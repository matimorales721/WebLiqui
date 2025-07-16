import { generarTabla } from './tableUI.js';
import { parsearFecha } from './formatters.js';
import { poblarSelectUnico, crearSelectorPersonalizado } from './tableLogic.js';
import { safeFetch, initCopyIconListener } from './newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el listener de copiado de íconos
    initCopyIconListener();
    function renderTablaDetalle() {
        generarTabla(
            filteredDetalle,
            'tablaDetalle',
            camposImportantesDetalle,
            undefined,
            currentPageDetalle,
            pageSizeDetalle
        );
        const totalPages = Math.max(1, Math.ceil(filteredDetalle.length / pageSizeDetalle));
        // Paginador visual
        const paginador = document.getElementById('paginadorDetalle');
        if (paginador) {
            paginador.innerHTML = '';
            // Calcula cuántos botones caben en el ancho del paginador
            let btnWidth = 38; // px, ajusta según tu CSS
            let paginadorWidth = paginador.offsetWidth || 400;
            let maxBtns = Math.floor(paginadorWidth / btnWidth);
            if (maxBtns < 5) maxBtns = 5;
            let btns = [];
            if (totalPages <= maxBtns) {
                for (let i = 1; i <= totalPages; i++) btns.push(i);
            } else {
                let start = Math.max(1, currentPageDetalle - Math.floor(maxBtns / 2));
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
                    btn.className = 'paginador-btn' + (i === currentPageDetalle ? ' active' : '');
                    btn.style.margin = '4px 4px'; // separación vertical y horizontal mínima entre botones
                    btn.onclick = () => {
                        currentPageDetalle = i;
                        renderTablaDetalle();
                    };
                    paginador.appendChild(btn);
                }
            });
        }
    }

    function renderTablaCabecera() {
        generarTabla(
            filteredCabecera,
            'tablaCabecera',
            camposImportantesCabecera,
            undefined,
            currentPageCabecera,
            pageSizeCabecera
        );
        const totalPages = Math.max(1, Math.ceil(filteredCabecera.length / pageSizeCabecera));

        // Paginador visual
        const paginador = document.getElementById('paginadorCabecera');
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
                let start = Math.max(1, currentPageCabecera - Math.floor(maxBtns / 2));
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
                    btn.className = 'paginador-btn' + (i === currentPageCabecera ? ' active' : '');
                    btn.style.margin = '4px 4px'; // separación vertical y horizontal mínima entre botones
                    btn.onclick = () => {
                        currentPageCabecera = i;
                        renderTablaCabecera();
                    };
                    paginador.appendChild(btn);
                }
            });
        }
    }

    function renderTablaAprobCabecera() {
        generarTabla(
            filteredAprobCabecera,
            'tablaAprobCabecera',
            camposImportantesAprobCabecera,
            undefined,
            currentPageAprobCabecera,
            pageSizeAprobCabecera
        );
        const totalPages = Math.max(1, Math.ceil(filteredAprobCabecera.length / pageSizeAprobCabecera));

        // Paginador visual
        const paginador = document.getElementById('paginadorAprobCabecera');
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
                let start = Math.max(1, currentPageAprobCabecera - Math.floor(maxBtns / 2));
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
                    btn.className = 'paginador-btn' + (i === currentPageAprobCabecera ? ' active' : '');
                    btn.style.margin = '4px 4px'; // separación vertical y horizontal mínima entre botones
                    btn.onclick = () => {
                        currentPageAprobCabecera = i;
                        renderTablaAprobCabecera();
                    };
                    paginador.appendChild(btn);
                }
            });
        }
    }
    function renderTablaPracticas() {
        generarTabla(
            filteredPracticas,
            'tablaPracticas',
            camposImportantesPractica,
            undefined,
            currentPagePracticas,
            pageSizePracticas
        );
        const totalPages = Math.max(1, Math.ceil(filteredPracticas.length / pageSizePracticas));

        // Paginador visual
        const paginador = document.getElementById('paginadorPracticas');
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
                let start = Math.max(1, currentPagePracticas - Math.floor(maxBtns / 2));
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
                    btn.className = 'paginador-btn' + (i === currentPagePracticas ? ' active' : '');
                    btn.style.margin = '4px 4px'; // separación vertical y horizontal mínima entre botones
                    btn.onclick = () => {
                        currentPagePracticas = i;
                        renderTablaPracticas();
                    };
                    paginador.appendChild(btn);
                }
            });
        }
    }
    var filteredPracticas = [];
    var currentPagePracticas = 1;
    var pageSizePracticas = 10;

    var filteredDetalle = [];
    var currentPageDetalle = 1;
    var pageSizeDetalle = 10;

    var filteredCabecera = [];
    var currentPageCabecera = 1;
    var pageSizeCabecera = 10;

    var filteredAprobCabecera = [];
    var currentPageAprobCabecera = 1;
    var pageSizeAprobCabecera = 10;

    const codigoProceso = getParametroProceso(); // obtiene el código directamente de la URL

    let practicasGlobal = [];
    let detalleGlobal = [];
    let cabeceraGlobal = [];
    let aprobCabeceraGlobal = [];
    let validacionesGlobal = [];

    const camposImportantesPractica = [
        { key: 'c_concepto', header: 'Concepto', format: 'code' },
        /* { key: 'c_periodo', header: 'Periodo', format: 'code' }, */
        { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
        /* { key: 'd_prestador', header: 'Prestador' },
        { key: 'd_modulo_pami', header: 'Modulo' }, */
        { key: 'c_practica', header: 'Cod. Práctica', format: 'code' },
        { key: 'd_practica', header: 'Práctica' },
        { key: 'n_beneficio', header: 'Beneficiario', format: 'code' },
        { key: 'n_orden_rechazo', header: 'N_OP', format: 'code' },
        { key: 'f_practica', header: 'Fecha Práctica', format: 'date' },
        { key: 'q_practica', header: 'Q_PRACT', format: 'numeric' },
        { key: 'q_pract_correctas', header: 'Q_CORR', format: 'numeric' } /* , destacada: true } */,
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
    ];

    const camposImportantesDetalle = [
        { key: 'c_concepto', header: 'Concepto', format: 'code' },
        { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
        { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
        { key: 'd_prestador', header: 'Prestador' },
        { key: 'd_modulo_pami', header: 'Modulo' },
        { key: 'd_practica', header: 'Práctica' },
        { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' }
    ];

    const camposImportantesCabecera = [
        { key: 'c_concepto', header: 'Concepto', format: 'code' },
        { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
        { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
        { key: 'd_prestador', header: 'Prestador' },
        { key: 'd_modulo_pami', header: 'Modulo' },
        { key: 'i_valorizado', header: 'I_VALORIZADO', format: 'moneda' }
    ];
    const camposImportantesAprobCabecera = [
        { key: 'c_concepto', header: 'Concepto', format: 'code' },
        { key: 'c_periodo_ex', header: 'Periodo', format: 'code' },
        { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
        { key: 'd_prestador', header: 'Prestador' },
        { key: 'd_modulo_pami', header: 'Modulo (7X)' },
        { key: 'i_monto', header: 'I_MONTO', format: 'moneda' }
    ];

    Promise.all([
        safeFetch(`../data/practicas-${codigoProceso}.json`),
        safeFetch(`../data/detalle-${codigoProceso}.json`),
        safeFetch(`../data/cabecera-${codigoProceso}.json`),
        safeFetch(`../data/aprob-cabecera-${codigoProceso}.json`),
        safeFetch(`../data/validaciones-${codigoProceso}.json`),
        safeFetch(`../data/procesos.json`)
    ]).then(([practicas, detalle, cabecera, aprobCabecera, validaciones, procesos]) => {
        const proceso = procesos.find((p) => parseInt(p.c_proceso) === codigoProceso);

        if (!proceso) {
            console.warn('Proceso no encontrado');
            return;
        }

        document.getElementById('codigo').textContent = proceso.c_proceso;
        document.getElementById('tipo').textContent =
            proceso.c_tipo_ejecucion === 'E'
                ? 'Excepción'
                : proceso.c_tipo_ejecucion === 'M'
                ? 'Mensual'
                : proceso.c_tipo_ejecucion;

        document.getElementById('periodo').textContent = proceso.c_periodo;
        document.getElementById('inicio').textContent = proceso.f_inicio;
        document.getElementById('fin').textContent = proceso.f_fin;
        document.getElementById('duracion').textContent = calcularDuracion(proceso.f_inicio, proceso.f_fin);

        document.getElementById('btnLogs').addEventListener('click', () => {
            window.location.href = `logs.html?codigo=${proceso.codigo}`;
        });

        practicasGlobal = practicas;
        detalleGlobal = detalle;
        cabeceraGlobal = cabecera;
        aprobCabeceraGlobal = aprobCabecera;
        validacionesGlobal = validaciones;

        // Funciones de filtrado automático
        function filtrarPracticas() {
            const filtroConceptoInput = document.getElementById('filtroConcepto_practicas');
            const filtroPrestadorInput = document.getElementById('filtroPrestador_practicas');
            const filtroBeneficiarioInput = document.getElementById('filtroBeneficiario_practicas');
            const filtroPeriodoInput = document.getElementById('filtroPeriodo_practicas');

            const concepto = filtroConceptoInput?.getValue ? filtroConceptoInput.getValue() : (filtroConceptoInput?.value || '');
            const prestador = filtroPrestadorInput?.getValue ? filtroPrestadorInput.getValue() : (filtroPrestadorInput?.value || '');
            const beneficiario = filtroBeneficiarioInput?.getValue ? filtroBeneficiarioInput.getValue() : (filtroBeneficiarioInput?.value || '');
            const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '');

            const filtradas = practicasGlobal.filter(
                (p) =>
                    (concepto === '' || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                    (prestador === '' || p.c_prestador == prestador) &&
                    (beneficiario === '' || p.n_beneficio == beneficiario) &&
                    (periodo === '' || p.c_periodo == periodo)
            );

            filteredPracticas = filtradas;
            currentPagePracticas = 1;
            renderTablaPracticas();
        }

        function filtrarDetalle() {
            const filtroConceptoInput = document.getElementById('filtroConcepto_detalle');
            const filtroPeriodoInput = document.getElementById('filtroPeriodo_detalle');
            const filtroPrestadorInput = document.getElementById('filtroPrestador_detalle');

            const concepto = filtroConceptoInput?.getValue ? filtroConceptoInput.getValue() : (filtroConceptoInput?.value || '');
            const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '');
            const prestador = filtroPrestadorInput?.getValue ? filtroPrestadorInput.getValue() : (filtroPrestadorInput?.value || '');

            const filtradas = detalleGlobal.filter(
                (p) =>
                    (concepto === '' || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                    (periodo === '' || p.c_periodo_ex == periodo) &&
                    (prestador === '' || p.c_prestador == prestador)
            );

            filteredDetalle = filtradas;
            currentPageDetalle = 1;
            renderTablaDetalle();
        }

        function filtrarCabecera() {
            const filtroConceptoInput = document.getElementById('filtroConcepto_cabecera');
            const filtroPrestadorInput = document.getElementById('filtroPrestador_cabecera');
            const filtroPeriodoInput = document.getElementById('filtroPeriodo_cabecera');

            const concepto = filtroConceptoInput?.getValue ? filtroConceptoInput.getValue() : (filtroConceptoInput?.value || '');
            const prestador = filtroPrestadorInput?.getValue ? filtroPrestadorInput.getValue() : (filtroPrestadorInput?.value || '');
            const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '');

            const filtradas = cabeceraGlobal.filter(
                (p) =>
                    (concepto === '' || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                    (prestador === '' || p.c_prestador == prestador) &&
                    (periodo === '' || p.c_periodo_ex == periodo)
            );

            filteredCabecera = filtradas;
            currentPageCabecera = 1;
            renderTablaCabecera();
        }

        function filtrarAprobCabecera() {
            const filtroConceptoInput = document.getElementById('filtroConcepto_aprob_cabecera');
            const filtroPrestadorInput = document.getElementById('filtroPrestador_aprob_cabecera');
            const filtroPeriodoInput = document.getElementById('filtroPeriodo_aprob_cabecera');

            const concepto = filtroConceptoInput?.getValue ? filtroConceptoInput.getValue() : (filtroConceptoInput?.value || '');
            const prestador = filtroPrestadorInput?.getValue ? filtroPrestadorInput.getValue() : (filtroPrestadorInput?.value || '');
            const periodo = filtroPeriodoInput?.getValue ? filtroPeriodoInput.getValue() : (filtroPeriodoInput?.value || '');

            const filtradas = aprobCabeceraGlobal.filter(
                (p) =>
                    (concepto === '' || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                    (prestador === '' || p.c_prestador == prestador) &&
                    (periodo === '' || p.c_periodo_ex == periodo)
            );

            filteredAprobCabecera = filtradas;
            currentPageAprobCabecera = 1;
            renderTablaAprobCabecera();
        }

        // Prácticas - Usar selectores personalizados con filtrado automático
        crearSelectorPersonalizado(practicasGlobal, 'c_concepto', 'filtroConcepto_practicas', 'conceptoDropdown_practicas', 'Selecciona o escribe...', filtrarPracticas);
        crearSelectorPersonalizado(practicasGlobal, 'c_periodo', 'filtroPeriodo_practicas', 'periodoDropdown_practicas', 'Selecciona o escribe...', filtrarPracticas);
        crearSelectorPersonalizado(practicasGlobal, 'c_prestador', 'filtroPrestador_practicas', 'prestadorDropdown_practicas', 'Selecciona o escribe...', filtrarPracticas);
        crearSelectorPersonalizado(practicasGlobal, 'n_beneficio', 'filtroBeneficiario_practicas', 'beneficiarioDropdown_practicas', 'Selecciona o escribe...', filtrarPracticas);

        filteredPracticas = practicasGlobal;
        renderTablaPracticas();

        // Detalle - Usar selectores personalizados con filtrado automático
        crearSelectorPersonalizado(detalleGlobal, 'c_concepto', 'filtroConcepto_detalle', 'conceptoDropdown_detalle', 'Selecciona o escribe...', filtrarDetalle);
        crearSelectorPersonalizado(detalleGlobal, 'c_periodo_ex', 'filtroPeriodo_detalle', 'periodoDropdown_detalle', 'Selecciona o escribe...', filtrarDetalle);
        crearSelectorPersonalizado(detalleGlobal, 'c_prestador', 'filtroPrestador_detalle', 'prestadorDropdown_detalle', 'Selecciona o escribe...', filtrarDetalle);

        filteredDetalle = detalleGlobal;
        renderTablaDetalle();

        // Cabecera - Usar selectores personalizados con filtrado automático
        crearSelectorPersonalizado(cabeceraGlobal, 'c_concepto', 'filtroConcepto_cabecera', 'conceptoDropdown_cabecera', 'Selecciona o escribe...', filtrarCabecera);
        crearSelectorPersonalizado(cabeceraGlobal, 'c_periodo_ex', 'filtroPeriodo_cabecera', 'periodoDropdown_cabecera', 'Selecciona o escribe...', filtrarCabecera);
        crearSelectorPersonalizado(cabeceraGlobal, 'c_prestador', 'filtroPrestador_cabecera', 'prestadorDropdown_cabecera', 'Selecciona o escribe...', filtrarCabecera);

        filteredCabecera = cabeceraGlobal;
        renderTablaCabecera();

        // Aprob_Cabecera - Usar selectores personalizados con filtrado automático
        crearSelectorPersonalizado(aprobCabeceraGlobal, 'c_concepto', 'filtroConcepto_aprob_cabecera', 'conceptoDropdown_aprob_cabecera', 'Selecciona o escribe...', filtrarAprobCabecera);
        crearSelectorPersonalizado(aprobCabeceraGlobal, 'c_periodo_ex', 'filtroPeriodo_aprob_cabecera', 'periodoDropdown_aprob_cabecera', 'Selecciona o escribe...', filtrarAprobCabecera);
        crearSelectorPersonalizado(aprobCabeceraGlobal, 'c_prestador', 'filtroPrestador_aprob_cabecera', 'prestadorDropdown_aprob_cabecera', 'Selecciona o escribe...', filtrarAprobCabecera);

        filteredAprobCabecera = aprobCabeceraGlobal;
        renderTablaAprobCabecera();

        // Agregar event listeners para botones de limpiar
        const limpiarPracticasBtn = document.getElementById('limpiarFiltrosBtn_practicas');
        if (limpiarPracticasBtn) {
            limpiarPracticasBtn.addEventListener('click', () => {
                const inputs = ['filtroConcepto_practicas', 'filtroPeriodo_practicas', 'filtroPrestador_practicas', 'filtroBeneficiario_practicas'];
                inputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input?.setValue) {
                        input.setValue('');
                    } else if (input) {
                        input.value = '';
                    }
                });
                filteredPracticas = practicasGlobal;
                currentPagePracticas = 1;
                renderTablaPracticas();
            });
        }

        const limpiarDetalleBtn = document.getElementById('limpiarFiltrosBtn_detalle');
        if (limpiarDetalleBtn) {
            limpiarDetalleBtn.addEventListener('click', () => {
                const inputs = ['filtroConcepto_detalle', 'filtroPeriodo_detalle', 'filtroPrestador_detalle'];
                inputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input?.setValue) {
                        input.setValue('');
                    } else if (input) {
                        input.value = '';
                    }
                });
                filteredDetalle = detalleGlobal;
                currentPageDetalle = 1;
                renderTablaDetalle();
            });
        }

        const limpiarCabeceraBtn = document.getElementById('limpiarFiltrosBtn_cabecera');
        if (limpiarCabeceraBtn) {
            limpiarCabeceraBtn.addEventListener('click', () => {
                const inputs = ['filtroConcepto_cabecera', 'filtroPeriodo_cabecera', 'filtroPrestador_cabecera'];
                inputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input?.setValue) {
                        input.setValue('');
                    } else if (input) {
                        input.value = '';
                    }
                });
                filteredCabecera = cabeceraGlobal;
                currentPageCabecera = 1;
                renderTablaCabecera();
            });
        }

        const limpiarAprobCabeceraBtn = document.getElementById('limpiarFiltrosBtn_aprob_cabecera');
        if (limpiarAprobCabeceraBtn) {
            limpiarAprobCabeceraBtn.addEventListener('click', () => {
                const inputs = ['filtroConcepto_aprob_cabecera', 'filtroPeriodo_aprob_cabecera', 'filtroPrestador_aprob_cabecera'];
                inputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input?.setValue) {
                        input.setValue('');
                    } else if (input) {
                        input.value = '';
                    }
                });
                filteredAprobCabecera = aprobCabeceraGlobal;
                currentPageAprobCabecera = 1;
                renderTablaAprobCabecera();
            });
        }
    });
});
// Navega a la página de validaciones con los parámetros correctos
function navegarAValidaciones(codigo, c_id_practica) {
    const url = `validaciones.html?codigo=${encodeURIComponent(codigo)}&c_id_practica=${encodeURIComponent(
        c_id_practica
    )}`;
    window.location.href = url;
}

// Extrae el código de proceso de la URL
export function getParametroProceso() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('codigo'));
}

// Función para construir URL de vuelta a procesos con filtros
function construirUrlVueltaProcesos() {
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

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
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
    const inicioDate = parsearFecha(inicio);
    const finDate = parsearFecha(fin);
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
}
