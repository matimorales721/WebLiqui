document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('hidden');
}

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

export async function safeFetch(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al cargar los datos');

        const json = await res.json();
        return json.results?.[0]?.items || [];
    } catch (err) {
        console.error('Fallo en safeFetch:', err);
        return [];
    }
}
