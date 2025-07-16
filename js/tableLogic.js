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

export function crearSelectorPersonalizado(data, campo, inputId, dropdownId, placeholder, onChangeCallback) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  const valoresUnicos = [...new Set(data.map(item => item[campo]).filter(Boolean))].sort();
  const opciones = ['Todos', ...valoresUnicos];
  
  let isEditing = false;
  let selectedValue = '';
  
  // Crear opciones del dropdown
  function crearOpciones() {
    dropdown.innerHTML = '';
    opciones.forEach((valor, index) => {
      const option = document.createElement('div');
      option.className = 'custom-select-option';
      option.textContent = valor;
      option.dataset.value = index === 0 ? '' : valor;
      
      if (option.dataset.value === selectedValue) {
        option.classList.add('selected');
      }
      
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        seleccionarOpcion(option.dataset.value, valor);
      });
      
      dropdown.appendChild(option);
    });
  }
  
  // Seleccionar una opción
  function seleccionarOpcion(value, text) {
    selectedValue = value;
    input.value = text;
    
    // Cerrar dropdown inmediatamente
    cerrarDropdown();
    
    isEditing = false;
    input.classList.remove('editing');
    
    // Restaurar estilos normales
    input.style.borderColor = '#d1d5db';
    input.style.backgroundColor = '#f8fbff';
    input.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    
    // Ejecutar callback de cambio automáticamente
    if (onChangeCallback && typeof onChangeCallback === 'function') {
      onChangeCallback(value);
    }
  }
  
  // Abrir dropdown
  function abrirDropdown() {
    if (!isEditing) {
      crearOpciones();
      dropdown.classList.add('show');
    }
  }
  
  // Cerrar dropdown
  function cerrarDropdown() {
    dropdown.classList.remove('show');
  }
  
  // Event listeners
  input.addEventListener('click', () => {
    if (!isEditing) {
      abrirDropdown();
    }
  });
  
  input.addEventListener('focus', () => {
    if (!isEditing) {
      abrirDropdown();
    }
  });
  
  // Permitir edición con doble clic
  input.addEventListener('dblclick', () => {
    isEditing = true;
    input.classList.add('editing');
    input.readOnly = false;
    input.select();
    cerrarDropdown();
  });
  
  // Manejar teclas
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarDropdown();
      input.blur();
    } else if (e.key === 'Enter' && !isEditing) {
      abrirDropdown();
    } else if (e.key === 'Enter' && isEditing) {
      // Validar entrada manual
      validarEntradaManual();
    }
  });
  
  // Manejar pegado
  input.addEventListener('paste', (e) => {
    if (!isEditing) {
      isEditing = true;
      input.classList.add('editing');
      input.readOnly = false;
    }
    
    setTimeout(() => {
      validarEntradaManual();
    }, 10);
  });
  
  // Validar entrada manual
  function validarEntradaManual() {
    const inputValue = input.value.trim();
    const validValues = ['', ...valoresUnicos];
    
    // Buscar coincidencia exacta
    if (validValues.includes(inputValue)) {
      selectedValue = inputValue;
      input.style.borderColor = '#d1d5db';
      input.style.backgroundColor = '#f8fbff';
      input.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      
      // Ejecutar callback de cambio
      if (onChangeCallback && typeof onChangeCallback === 'function') {
        onChangeCallback(selectedValue);
      }
    } else if (inputValue.toLowerCase() === 'todos') {
      seleccionarOpcion('', 'Todos');
      return;
    } else {
      // Buscar coincidencia parcial
      const match = valoresUnicos.find(option => 
        option.toLowerCase().includes(inputValue.toLowerCase()) ||
        inputValue.toLowerCase().includes(option.toLowerCase())
      );
      
      if (match) {
        seleccionarOpcion(match, match);
        return;
      } else {
        // Valor inválido
        input.style.borderColor = '#f59e0b';
        input.style.backgroundColor = '#fef3c7';
        input.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.3)';
      }
    }
    
    isEditing = false;
    input.classList.remove('editing');
    input.readOnly = true;
  }
  
  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      cerrarDropdown();
      if (isEditing) {
        validarEntradaManual();
      }
    }
  });
  
  // Función pública para obtener el valor
  input.getValue = () => selectedValue;
  
  // Función pública para establecer el valor
  input.setValue = (value) => {
    const opcionTexto = value === '' ? 'Todos' : value;
    seleccionarOpcion(value, opcionTexto);
  };
  
  // Inicializar con "Todos"
  seleccionarOpcion('', 'Todos');
}