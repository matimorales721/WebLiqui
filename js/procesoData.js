import { safeFetch } from './newUtils.js';

export class ProcesoData {
    static async obtenerProceso(procesoId) {
        try {
            const procesos = await safeFetch('../data/procesos.json');
            const proceso = procesos.find(p => p.C_PROCESO == procesoId);
            return proceso;
        } catch (error) {
            console.error('Error al obtener proceso:', error);
            throw error;
        }
    }
}