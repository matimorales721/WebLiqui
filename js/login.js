import { safeFetch } from '../js/newUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginBtn');

    loginButton.addEventListener('click', async () => {
        const usuario = usuarioInput.value.trim();
        const password = passwordInput.value.trim();

        if (!usuario || !password) {
            alert('Por favor, ingresa usuario y contraseña.');
            return;
        }

        try {
            const usuarios = await safeFetch('../data/usuarios.json');
            const usuarioEncontrado = usuarios.find(
                (u) => u.usuario === usuario && u.password === password && u.activo
            );

            if (usuarioEncontrado) {
                window.location.href = './procesos.html';
            } else {
                alert('Usuario o contraseña incorrectos, o usuario inactivo.');
            }
        } catch (error) {
            alert('Error al validar usuario.');
            console.error(error);
        }
    });
});
