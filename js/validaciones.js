    document.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const codigo = urlParams.get("codigo");
        const c_id_practica = urlParams.get("c_id_practica");
        
        let validacionesGlobal = [];

        const urlValidaciones = `../data/validaciones-${codigo}.json`;

        // Esto bien podria ser resuelto con mi propia entidad Validacion, que se cargue en otra capa con los datos del json
        // Pero por ahora sirve asi.
        const camposGrillaValidaciones = [
            { key: "c_grupo", header: "Grupo", format: "code" },
            { key: "c_validacion", header: "Cod. Validacion", format: "code" },
            { key: "d_validacion", header: "Validación", },
            { key: "c_file_upload", header: "File" },
            { key: "n_prestacion", header: "N_PRESTACION" },
            { key: "", header: "PRESTADOR" },
            { key: "", header: "MODULO" },
            { key: "", header: "PRACTICA" },
            { key: "c_id_practica", header: "C_ID_PRACTICA", format: "code" }
        ];

        Promise.all([safeFetch(urlValidaciones)])
            
            .then(([items]) => {            
                if (!items) {
                    mostrarError("No se pudo cargar el archivo de validaciones.");
                    return;
                }            
                const validaciones = items?.results?.[0]?.items || [];
                
                if (validaciones.length === 0) {
                    const tbody = document.querySelector("#tablaValidaciones tbody");
                    tbody.innerHTML = "<tr><td colspan='99'>No hay validaciones para esta práctica</td></tr>";
                    return;
                }

                validacionesGlobal = validaciones;
                
                poblarSelectUnico(validaciones, "c_grupo", "filtroGrupo", "Grupos");
                poblarSelectUnico(validaciones, "c_validacion", "filtroCodigoValidacion", "Validaciones");
                poblarSelectUnico(validaciones, "c_id_practica", "filtroCIdPractica", "c_id_practicas");
    
                const filtradas = validaciones.filter(p =>
                    (!c_id_practica || p.c_id_practica == c_id_practica) 
                );
        
                generateTable(filtradas, "tablaValidaciones", camposGrillaValidaciones);
            
            });
        
        /* Filtros */
        /*  - Filtros Prácticas */
        document.getElementById("filtroBtn").addEventListener("click", () => {
            const c_validacion = document.getElementById("filtroCodigoValidacion").value.toLowerCase();
            const c_grupo = document.getElementById("filtroGrupo").value.toLowerCase();
            const c_id_practica = document.getElementById("filtroCIdPractica").value.toLowerCase();

            const filtradas = validacionesGlobal.filter(p =>
                (!c_validacion || p.c_validacion == c_validacion) &&
                (!c_grupo || p.c_grupo == c_grupo) && 
                (!c_id_practica || p.c_id_practica == c_id_practica) 
            );

            generateTable(filtradas, "tablaValidaciones", camposGrillaValidaciones);
        });
        

    });

    function mostrarError(mensaje) {
        const tbody = document.querySelector("#tablaValidaciones tbody");
        tbody.innerHTML = `<tr><td colspan='99' style="color:red">${mensaje}</td></tr>`;
    }

function safeFetch(url) {
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      return res.json();
    })
    .catch(error => {
      console.error(`Error al obtener ${url}:`, error);
      return null;
    });
}



  /*  

    document.addEventListener("click", function (e) {
    if (e.target.classList.contains("copy-icon")) {
        let wrapper = e.target.closest(".code-wrapper") || e.target.closest(".moneda-wrapper");
        let content =
        wrapper?.querySelector(".code-content")?.textContent ||
        wrapper?.querySelector(".moneda-content")?.textContent;

        if (content) {
        navigator.clipboard.writeText(content).then(() => {
            e.target.textContent = "✅";
            setTimeout(() => {
            e.target.textContent = "📋";
            }, 1500);
        }).catch(err => {
            console.error("Error al copiar:", err);
            alert("No se pudo copiar al portapapeles.");
        });
        }
    }
    });
    */