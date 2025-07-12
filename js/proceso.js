    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("codigo") || "0000";
    const codigoNumerico = parseInt(codigo, 10);
    let practicasGlobal = [],
        detalleGlobal = [],
        cabeceraGlobal = [];

    document.addEventListener("DOMContentLoaded", () => {
        fetch("../data/procesos.json")
        .then((response) => response.json())
        .then((data) => {
          const proceso = data.results[0].items.find((p) => parseInt(p.c_proceso) === codigoNumerico);
          if (!proceso) return;

          document.getElementById("codigo").textContent = proceso.c_proceso;
          document.getElementById("tipo").textContent = proceso.c_tipo_ejecucion;
          document.getElementById("periodo").textContent = proceso.c_periodo;
          document.getElementById("inicio").textContent = proceso.f_inicio || "-";
          document.getElementById("fin").textContent = proceso.f_fin || "-";
          document.getElementById("esgdi").textContent = proceso.m_es_gdi;
          document.getElementById("btnLogs").href = `logs.html?codigo=${proceso.c_proceso}`;
        });

      Promise.all([
        fetch("../data/practicas.json")
          .then((res) => res.json())
          .then((j) => j.results?.[0]?.items || []),
        fetch("../data/detalle.json")
          .then((res) => res.json())
          .then((j) => j.results?.[0]?.items || []),
        fetch("../data/cabecera.json")
          .then((res) => res.json())
          .then((j) => j.results?.[0]?.items || []),
        fetch("../data/aprob_cabecera.json")
          .then((res) => res.json())
          .then((j) => j.results?.[0]?.items || []),
      ]).then(([practicas, detalle, cabecera, aprobcabecera]) => {
        practicasGlobal = practicas.filter((p) => String(p.c_proceso) === String(codigoNumerico));
        detalleGlobal = detalle.filter((d) => String(d.c_proceso) === String(codigoNumerico));
        cabeceraGlobal = cabecera.filter((c) => String(c.c_proceso) === String(codigoNumerico));
        aprobcabeceraGlobal = aprobcabecera.filter((ac) => String(ac.c_proceso) === String(codigoNumerico));
        renderTable("tablaPracticas", practicasGlobal);
        renderTable("tablaDetalle", detalleGlobal);
        renderTable("tablaCabecera", cabeceraGlobal);
        renderTable("tablaAprobCabecera", aprobcabeceraGlobal);
      });

        document.getElementById("filtroBtn").addEventListener("click", filtrarPracticas);
    });
      

      function renderTable(id, rows) {
        const table = document.getElementById(id);
        if (!rows || !rows.length) {
          table.innerHTML = "<tr><td colspan='100%'>No hay datos para mostrar</td></tr>";
          return;
        }

        const headers = Object.keys(rows[0]);
        const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${rows
          .map((r) => `<tr>${headers.map((h) => `<td>${r[h]}</td>`).join("")}</tr>`)
          .join("")}</tbody>`;
        table.innerHTML = thead + tbody;
      }

      function showTab(tabId) {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.remove("active"));
        document.getElementById(tabId).classList.add("active");
        document.querySelector(`.tab[onclick=\"showTab('${tabId}')\"]`).classList.add("active");
      }

      function filtrarPracticas() {
        const prestador = document.getElementById("filtroPrestador").value.trim().toLowerCase();
        const beneficiario = document.getElementById("filtroBeneficiario").value.trim().toLowerCase();
        const filtradas = practicasGlobal.filter((p) => {
          const pMatch = prestador === "" || (p.c_prestador && p.c_prestador.toLowerCase().includes(prestador));
          const bMatch = beneficiario === "" || (p.n_beneficio && p.n_beneficio.toLowerCase().includes(beneficiario));
          return pMatch && bMatch;
        });
        renderTable("tablaPracticas", filtradas);
      }