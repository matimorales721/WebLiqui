// Funciones pedorras
export function formatearMoneda(valor) {
    if (isNaN(valor)) return valor;

    const absValor = Math.abs(valor).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return absValor;
}

export function parsearFecha(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string') {
        return new Date('Invalid Date');
    }

    // Detectar formato - base de datos vs JSON
    let fecha, hora;

    if (fechaStr.includes('T')) {
        // Formato JSON: "23-06-2025T21:23:50"
        [fecha, hora] = fechaStr.split('T');
    } else if (fechaStr.includes(' ')) {
        // Formato base de datos: "23-06-2025 21:23:50"
        [fecha, hora] = fechaStr.split(' ');
    } else {
        console.warn(`Formato de fecha no reconocido: ${fechaStr}`);
        return new Date('Invalid Date');
    }

    if (!fecha || !hora) {
        return new Date('Invalid Date');
    }

    // Detectar formato de fecha: DD-MM-YYYY vs YYYY-MM-DD (con - o /)
    let partesFecha;
    let separador;

    if (fecha.includes('-')) {
        partesFecha = fecha.split('-');
        separador = '-';
    } else if (fecha.includes('/')) {
        partesFecha = fecha.split('/');
        separador = '/';
    } else {
        console.warn(`Separador de fecha no reconocido en: ${fecha}`);
        return new Date('Invalid Date');
    }

    if (partesFecha.length !== 3) {
        return new Date('Invalid Date');
    }

    let fechaISO;
    if (partesFecha[0].length === 4) {
        // Formato base de datos: YYYY-MM-DD o YYYY/MM/DD
        fechaISO = `${partesFecha[0]}-${partesFecha[1]}-${partesFecha[2]}T${hora}`;
    } else {
        // Formato JSON fallback: DD-MM-YYYY o DD/MM/YYYY
        const [dia, mes, anio] = partesFecha;
        fechaISO = `${anio}-${mes}-${dia}T${hora}`;
    }

    // Crear fecha en formato ISO válido
    const fechaRes = new Date(fechaISO);

    // Verificar que la fecha sea válida
    if (isNaN(fechaRes.getTime())) {
        return new Date('Invalid Date');
    }

    return fechaRes;
}

export function formatearFecha(date, incluirHora = false) {
    if (!(date instanceof Date) || isNaN(date)) return 'Fecha inválida';

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // ¡Mes comienza en 0!
    const anio = date.getFullYear();

    const fechaStr = `${dia}/${mes}/${anio}`;

    if (!incluirHora) return fechaStr;
    //console.warn(date);
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const segundos = String(date.getSeconds()).padStart(2, '0');

    return `${fechaStr} ${horas}:${minutos} hs.`;
}
