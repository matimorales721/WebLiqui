
let procesosOriginales = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("../data/procesos.json")
    .then((res) => res.json())
    .then((json) => {
      procesosOriginales = json.results[0].items;
      renderTabla(procesosOriginales);
    });

  document.getElementById("filtroBtn").addEventListener("click", filtrar);
});

function renderTabla(procesos) {
  const table = document.getElementById("tablaProcesos");
  const headers = [
    "c_proceso", "c_tipo_ejecucion", "c_periodo", "f_inicio",
    "f_fin", "m_es_gdi", "Ver Detalle", "Ver Logs"
  ];
  const thead = `<thead><tr>${headers.map(h => `<th>${h.replace(/_/g, " ")}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${procesos.map(p => `
    <tr>
      <td>${p.c_proceso}</td>
      <td>${p.c_tipo_ejecucion}</td>
      <td>${p.c_periodo}</td>
      <td>${p.f_inicio || ""}</td>
      <td>${p.f_fin || ""}</td>
      <td>${p.m_es_gdi}</td>
      <td><a class="btn-ver" href="proceso.html?codigo=${p.c_proceso}">Ver</a></td>
      <td><a class="btn-ver" href="logs.html?codigo=${p.c_proceso}">Logs</a></td>
    </tr>`).join("")}</tbody>`;
  table.innerHTML = thead + tbody;
}

function filtrar() {
  const tipo = document.getElementById("filtroTipo").value;
  const periodo = document.getElementById("filtroPeriodo").value.trim();

  const filtrados = procesosOriginales.filter(p =>
    (tipo === "" || p.c_tipo_ejecucion === tipo) &&
    (periodo === "" || p.c_periodo.toString().includes(periodo))
  );

  renderTabla(filtrados);
}
