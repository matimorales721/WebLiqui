import { generarTabla } from './tableUI.js';
import { parsearFecha } from './formatters.js';
import { poblarSelectUnico } from './tableLogic.js';
import { safeFetch } from './newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const codigoProceso = getParametroProceso(); // obtiene el código directamente de la URL

    let practicasGlobal = [];
    let detalleGlobal = [];
    let cabeceraGlobal = [];
    let aprobCabeceraGlobal = [];

    const camposImportantesPractica = [
        { key: 'c_concepto', header: 'Concepto', format: 'code' },
        { key: 'c_periodo', header: 'Periodo', format: 'code' },
        { key: 'c_prestador', header: 'Cod. Prestador', format: 'code' },
        { key: 'd_prestador', header: 'Prestador' },
        { key: 'd_modulo_pami', header: 'Modulo' },
        { key: 'd_practica', header: 'Práctica' },
        { key: 'n_orden_rechazo', header: 'N_OP', format: 'code' },
        { key: 'n_beneficio', header: 'Beneficiario', format: 'code' },
        { key: 'f_practica', header: 'Fecha Práctica', format: 'date' },
        { key: 'q_practica', header: 'Q_PRACT', format: 'numeric' },
        { key: 'q_pract_correctas', header: 'Q_CORR', format: 'numeric' } /* , destacada: true } */,
        { key: 'c_id_practica', header: 'C_ID_PRACTICA', format: 'code' },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (item) => {
                if (item.q_corr !== item.q_practica) {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.textContent = 'Ver Validaciones';
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
        safeFetch(`../data/procesos.json`)
    ]).then(([practicas, detalle, cabecera, aprobCabecera, procesos]) => {
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

        // Prácticas
        poblarSelectUnico(practicasGlobal, 'c_concepto', 'filtroConcepto_practicas', 'Conceptos');
        poblarSelectUnico(practicasGlobal, 'c_periodo', 'filtroPeriodo_practicas', 'Periodos');
        poblarSelectUnico(practicasGlobal, 'c_prestador', 'filtroPrestador_practicas', 'Prestadores');
        poblarSelectUnico(practicasGlobal, 'n_beneficio', 'filtroBeneficiario_practicas', 'Beneficiarios');

        generarTabla(practicasGlobal, 'tablaPracticas', camposImportantesPractica);

        // Detalle
        poblarSelectUnico(detalleGlobal, 'c_concepto', 'filtroConcepto_detalle', 'Conceptos');
        poblarSelectUnico(detalleGlobal, 'c_periodo_ex', 'filtroPeriodo_detalle', 'Periodos');
        poblarSelectUnico(detalleGlobal, 'c_prestador', 'filtroPrestador_detalle', 'Prestadores');

        generarTabla(detalleGlobal, 'tablaDetalle', camposImportantesDetalle);

        // Cabecera
        poblarSelectUnico(cabeceraGlobal, 'c_concepto', 'filtroConcepto_cabecera', 'Conceptos');
        poblarSelectUnico(cabeceraGlobal, 'c_periodo_ex', 'filtroPeriodo_cabecera', 'Periodos');
        poblarSelectUnico(cabeceraGlobal, 'c_prestador', 'filtroPrestador_cabecera', 'Prestadores');

        generarTabla(cabeceraGlobal, 'tablaCabecera', camposImportantesCabecera);

        // Aprob_Cabecera
        poblarSelectUnico(aprobCabeceraGlobal, 'c_concepto', 'filtroConcepto_aprob_cabecera', 'Conceptos');
        poblarSelectUnico(aprobCabeceraGlobal, 'c_periodo_ex', 'filtroPeriodo_aprob_cabecera', 'Periodos');
        poblarSelectUnico(aprobCabeceraGlobal, 'c_prestador', 'filtroPrestador_aprob_cabecera', 'Prestadores');

        generarTabla(aprobCabeceraGlobal, 'tablaAprobCabecera', camposImportantesAprobCabecera);
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

        generarTabla(filtradas, 'tablaPracticas', camposImportantesPractica);
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

        generarTabla(filtradas, 'tablaDetalle', camposImportantesDetalle);
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

        generarTabla(filtradas, 'tablaCabecera', camposImportantesCabecera);
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

        generarTabla(filtradas, 'tablaAprobCabecera', camposImportantesAprobCabecera);
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
function getParametroProceso() {
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
