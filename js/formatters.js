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
    const [fecha, hora] = fechaStr.split(' ');
    const [dia, mes, anio] = fecha.split('/');
    return new Date(`${anio}-${mes}-${dia}T${hora}`);
}

export function formatearFecha(date, incluirHora = false) {
    if (!(date instanceof Date) || isNaN(date)) return 'Fecha inválida';

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // ¡Mes comienza en 0!
    const anio = date.getFullYear();

    const fechaStr = `${dia}/${mes}/${anio}`;

    if (!incluirHora) return fechaStr;

    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const segundos = String(date.getSeconds()).padStart(2, '0');

    return `${fechaStr} ${horas}:${minutos}:${segundos}`;
}
