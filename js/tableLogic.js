export function ordenarDatos(data, key, ascending) {
    return [...data].sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const sonNumeros = !isNaN(numA) && !isNaN(numB);
        if (sonNumeros) return ascending ? numA - numB : numB - numA;
        return ascending
            ? valA.toString().localeCompare(valB.toString())
            : valB.toString().localeCompare(valA.toString());
    });
}

export function poblarSelectUnico(data, campo, selectId, titulo) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const valoresUnicos = [...new Set(data.map(item => item[campo]).filter(Boolean))].sort();
  select.innerHTML = `<option value="">${titulo}</option>`;
  valoresUnicos.forEach(valor => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  });
}