// Inicializa el menú hamburguesa si los elementos existen
export function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

export function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Inicializa el copiado de contenido si hay íconos de copiar
export function initCopyIconListener() {
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('copy-icon')) {
            let wrapper = e.target.closest('.code-wrapper') || e.target.closest('.moneda-wrapper');
            let content =
                wrapper?.querySelector('.code-content')?.textContent ||
                wrapper?.querySelector('.moneda-content')?.textContent;

            if (content) {
                navigator.clipboard
                    .writeText(content)
                    .then(() => {
                        e.target.textContent = '✅';
                        setTimeout(() => {
                            e.target.textContent = '📋';
                        }, 1500);
                    })
                    .catch((err) => {
                        console.error('Error al copiar:', err);
                        alert('No se pudo copiar al portapapeles.');
                    });
            }
        }
    });
}

/**
 * Fetch flexible y robusto para archivos JSON
 * Devuelve el JSON completo si no tiene la estructura esperada
 */
export async function safeFetch(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error al cargar los datos (${res.status})`);
        const json = await res.json();
        // Si tiene la estructura results[0].items, la retorna; si no, retorna el JSON completo
        if (json?.results?.[0]?.items) {
            return json.results[0].items;
        }
        return json;
    } catch (err) {
        console.error('Fallo en safeFetch:', err);
        throw err;
    }
}
