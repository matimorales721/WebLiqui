export class ProcesoLogic {
    static validarProcesoId(procesoId) {
        if (!procesoId || isNaN(procesoId)) {
            throw new Error('ID de proceso inválido');
        }
        return parseInt(procesoId);
    }

    static obtenerParametroUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('codigo');
    }
}
