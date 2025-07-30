// Funciones de autenticación centralizadas
export const Auth = {
    // Guardar usuario en sessionStorage
    guardarUsuario(usuarioData) {
        sessionStorage.setItem('usuarioLogueado', JSON.stringify(usuarioData));
    },

    // Obtener usuario de sessionStorage
    obtenerUsuario() {
        const userData = sessionStorage.getItem('usuarioLogueado');
        return userData ? JSON.parse(userData) : null;
    },

    // Verificar si hay usuario logueado
    estaLogueado() {
        return this.obtenerUsuario() !== null;
    },

    // Obtener inicial del nombre (primera letra)
    obtenerInicial() {
        const usuario = this.obtenerUsuario();
        if (!usuario || !usuario.nombre) return 'U';
        return usuario.nombre.charAt(0).toUpperCase();
    },

    // Obtener nombre completo
    obtenerNombre() {
        const usuario = this.obtenerUsuario();
        return usuario ? usuario.nombre : 'Usuario';
    },

    // Actualizar elementos del DOM con datos del usuario
    actualizarDatosUsuario() {
        const nombreElement = document.querySelector('[data-usuario-nombre]');
        const inicialElement = document.querySelector('[data-usuario-inicial]');

        if (nombreElement) {
            nombreElement.textContent = this.obtenerNombre();
        }

        if (inicialElement) {
            inicialElement.textContent = this.obtenerInicial();
        }
    },

    // Validar sesión y redirigir si no está logueado
    validarSesion() {
        if (!this.estaLogueado()) {
            window.location.href = '../pages/login.html';
            return false;
        }
        return true;
    },

    // Cerrar sesión
    cerrarSesion() {
        sessionStorage.removeItem('usuarioLogueado');
        window.location.href = '../pages/login.html';
    }
};
