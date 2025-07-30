import { safeFetch } from '../js/newUtils.js';
import { Auth } from '../js/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginBtn');

    // Función de encriptación: César +1 al primer carácter + inversión
    function encriptarPassword(password) {
        if (!password || password.length === 0) return '';

        // Paso 1: César +1 solo al primer carácter
        let primerCaracter = password.charAt(0);
        let primerCaracterEncriptado;

        if (primerCaracter >= '0' && primerCaracter <= '9') {
            // Si es número: 0-8 → +1, 9 → 0
            primerCaracterEncriptado = primerCaracter === '9' ? '0' : String(parseInt(primerCaracter) + 1);
        } else if (primerCaracter >= 'a' && primerCaracter <= 'z') {
            // Si es letra minúscula: a-y → +1, z → a
            primerCaracterEncriptado =
                primerCaracter === 'z' ? 'a' : String.fromCharCode(primerCaracter.charCodeAt(0) + 1);
        } else if (primerCaracter >= 'A' && primerCaracter <= 'Z') {
            // Si es letra mayúscula: A-Y → +1, Z → A
            primerCaracterEncriptado =
                primerCaracter === 'Z' ? 'A' : String.fromCharCode(primerCaracter.charCodeAt(0) + 1);
        } else {
            // Si es otro carácter, mantenerlo igual
            primerCaracterEncriptado = primerCaracter;
        }

        // Construir la cadena con el primer carácter modificado
        const passwordConCesar = primerCaracterEncriptado + password.slice(1);

        // Paso 2: Inversión simple
        const passwordEncriptada = passwordConCesar.split('').reverse().join('');

        return passwordEncriptada;
    }

    async function intentarLogin() {
        const usuario = usuarioInput.value.trim();
        const password = passwordInput.value.trim();

        if (!usuario || !password) {
            alert('Por favor, ingresa usuario y contraseña.');
            return;
        }

        try {
            // Encriptar la contraseña ingresada por el usuario
            const passwordEncriptada = encriptarPassword(password);

            const usuarios = await safeFetch('../data/usuarios.json');
            const usuarioEncontrado = usuarios.find(
                (u) => u.usuario === usuario && u.password === passwordEncriptada && u.activo
            );

            if (usuarioEncontrado) {
                // Guardar datos del usuario en sessionStorage
                Auth.guardarUsuario(usuarioEncontrado);
                window.location.href = './procesos.html';
            } else {
                alert('Usuario o contraseña incorrectos, o usuario inactivo.');
            }
        } catch (error) {
            alert('Error al validar usuario.');
            console.error(error);
        }
    }

    loginButton.addEventListener('click', intentarLogin);
    usuarioInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            intentarLogin();
        }
    });
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            intentarLogin();
        }
    });
});
