import { generarTabla } from './tableUI.js';
import { parsearFecha } from './formatters.js';
import { poblarSelectUnico } from './tableLogic.js';
import { safeFetch } from './newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
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
            btns.forEach(i => {
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
            btns.forEach(i => {
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
            btns.forEach(i => {
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
            btns.forEach(i => {
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

        // Prácticas
        poblarSelectUnico(practicasGlobal, 'c_concepto', 'filtroConcepto_practicas', 'Conceptos');
        poblarSelectUnico(practicasGlobal, 'c_periodo', 'filtroPeriodo_practicas', 'Periodos');
        poblarSelectUnico(practicasGlobal, 'c_prestador', 'filtroPrestador_practicas', 'Prestadores');
        poblarSelectUnico(practicasGlobal, 'n_beneficio', 'filtroBeneficiario_practicas', 'Beneficiarios');

        filteredPracticas = practicasGlobal;
        renderTablaPracticas();

        // Detalle
        poblarSelectUnico(detalleGlobal, 'c_concepto', 'filtroConcepto_detalle', 'Conceptos');
        poblarSelectUnico(detalleGlobal, 'c_periodo_ex', 'filtroPeriodo_detalle', 'Periodos');
        poblarSelectUnico(detalleGlobal, 'c_prestador', 'filtroPrestador_detalle', 'Prestadores');

        filteredDetalle = detalleGlobal;
        renderTablaDetalle();

        // Cabecera
        poblarSelectUnico(cabeceraGlobal, 'c_concepto', 'filtroConcepto_cabecera', 'Conceptos');
        poblarSelectUnico(cabeceraGlobal, 'c_periodo_ex', 'filtroPeriodo_cabecera', 'Periodos');
        poblarSelectUnico(cabeceraGlobal, 'c_prestador', 'filtroPrestador_cabecera', 'Prestadores');

        filteredCabecera = cabeceraGlobal;
        renderTablaCabecera();

        // Aprob_Cabecera
        poblarSelectUnico(aprobCabeceraGlobal, 'c_concepto', 'filtroConcepto_aprob_cabecera', 'Conceptos');
        poblarSelectUnico(aprobCabeceraGlobal, 'c_periodo_ex', 'filtroPeriodo_aprob_cabecera', 'Periodos');
        poblarSelectUnico(aprobCabeceraGlobal, 'c_prestador', 'filtroPrestador_aprob_cabecera', 'Prestadores');

        filteredAprobCabecera = aprobCabeceraGlobal;
        renderTablaAprobCabecera();
    });

    /* Filtros */
    /*  - Filtros Prácticas */
    document.getElementById('filtroBtn_practicas').addEventListener('click', () => {
        const concepto = document.getElementById('filtroConcepto_practicas').value.toLowerCase();
        const prestador = document.getElementById('filtroPrestador_practicas').value.toLowerCase();
        const beneficiario = document.getElementById('filtroBeneficiario_practicas').value.toLowerCase();
        const periodo = document.getElementById('filtroPeriodo_practicas').value.toLowerCase();

        const filtradas = practicasGlobal.filter(
            (p) =>
                (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                (!prestador || p.c_prestador == prestador) &&
                (!beneficiario || p.n_beneficio == beneficiario) &&
                (!periodo || p.c_periodo == periodo)
        );

        filteredPracticas = filtradas;
        currentPagePracticas = 1;
        renderTablaPracticas();
    });

    /*  - Filtros Detalles */
    document.getElementById('filtroBtn_detalle').addEventListener('click', () => {
        const concepto = document.getElementById('filtroConcepto_detalle').value.toLowerCase();
        const periodo = document.getElementById('filtroPeriodo_detalle').value.toLowerCase();
        const prestador = document.getElementById('filtroPrestador_detalle').value.toLowerCase();

        const filtradas = detalleGlobal.filter(
            (p) =>
                (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                (!periodo || p.c_periodo_ex == periodo) &&
                (!prestador || p.c_prestador == prestador)
        );

        filteredDetalle = filtradas;
        currentPageDetalle = 1;
        renderTablaDetalle();
    });

    /*  - Filtros Cabecera */
    document.getElementById('filtroBtn_cabecera').addEventListener('click', () => {
        const concepto = document.getElementById('filtroConcepto_cabecera').value.toLowerCase();
        const prestador = document.getElementById('filtroPrestador_cabecera').value.toLowerCase();
        const periodo = document.getElementById('filtroPeriodo_cabecera').value.toLowerCase();

        const filtradas = cabeceraGlobal.filter(
            (p) =>
                (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                (!prestador || p.c_prestador == prestador) &&
                (!periodo || p.c_periodo_ex == periodo)
        );

        filteredCabecera = filtradas;
        currentPageCabecera = 1;
        renderTablaCabecera();
    });

    /*  - Filtros Aprob_Cabecera */
    document.getElementById('filtroBtn_aprob_cabecera').addEventListener('click', () => {
        const concepto = document.getElementById('filtroConcepto_aprob_cabecera').value.toLowerCase();
        const prestador = document.getElementById('filtroPrestador_aprob_cabecera').value.toLowerCase();
        const periodo = document.getElementById('filtroPeriodo_aprob_cabecera').value.toLowerCase();

        const filtradas = aprobCabeceraGlobal.filter(
            (p) =>
                (!concepto || p.c_concepto?.toLowerCase() == concepto?.toLowerCase()) &&
                (!prestador || p.c_prestador == prestador) &&
                (!periodo || p.c_periodo_ex == periodo)
        );

        filteredAprobCabecera = filtradas;
        currentPageAprobCabecera = 1;
        renderTablaAprobCabecera();
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

window.showTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
};

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
