import { poblarSelectUnico } from './tableLogic.js';
import { generarTabla } from './tableUI.js';
import { safeFetch } from './newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([safeFetch('../data/procesos.json')]).then(([procesos]) => {
        // Si no hay datos, no continuar
        if (!procesos || !procesos.length) return;

        // Poblar selects únicos
        poblarSelectUnico(procesos, 'c_tipo_ejecucion', 'filtroTipo', 'Tipo');
        poblarSelectUnico(procesos, 'c_periodo', 'filtroPeriodo', 'Período');

        // Renderizar tabla principal
        const columnas = [
            { key: 'c_proceso', header: 'Proceso', format: 'code' },
            { key: 'c_tipo_ejecucion', header: 'Tipo de Ejecución', format: 'code' },
            { key: 'c_periodo', header: 'Período', format: 'code' },
            { key: 'f_inicio', header: 'Inicio', format: 'date' },
            { key: 'f_fin', header: 'Fin', format: 'date' },
            { key: 'm_es_gdi', header: 'GDI', format: 'code' },
            {
                key: 'acciones',
                header: 'Acciones',
                format: 'btn',
                render: (item) => {
                    const btnDetalle = document.createElement('a');
                    btnDetalle.className = 'btn';
                    btnDetalle.href = `proceso.html?codigo=${item.c_proceso}`;
                    btnDetalle.textContent = 'Ver';
                    const espacio = document.createElement('span');
                    espacio.style.display = 'inline-block';
                    espacio.style.width = '12px';
                    const btnLogs = document.createElement('a');
                    btnLogs.className = 'btn';
                    btnLogs.href = `logs.html?codigo=${item.c_proceso}`;
                    btnLogs.textContent = 'Logs';
                    const cont = document.createElement('div');
                    cont.style.display = 'flex';
                    cont.style.gap = '12px';
                    cont.appendChild(btnDetalle);
                    cont.appendChild(btnLogs);
                    return cont;
                }
            }
        ];
        generarTabla(procesos, 'tablaProcesos', columnas);

        // Filtro
        document.getElementById('filtroBtn').addEventListener('click', () => {
            const tipo = document.getElementById('filtroTipo').value;
            const periodo = document.getElementById('filtroPeriodo').value.trim();
            const filtrados = procesos.filter(
                (p) =>
                    (tipo === '' || p.c_tipo_ejecucion === tipo) &&
                    (periodo === '' || p.c_periodo.toString().includes(periodo))
            );
            generarTabla(filtrados, 'tablaProcesos', columnas);
        });
    });
});
