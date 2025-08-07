let mockData = [];
let filteredData = [];
let currentMonth = new Date();

function loadMockData() {
  mockData = window.DataManager.getAllTransactions();
  filteredData = [...mockData];
}

function formatDate(date) {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function getMonthName(date) {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  });
}

function isInCurrentMonth(transactionDate) {
  const txDate = new Date(transactionDate);
  return txDate.getMonth() === currentMonth.getMonth() && 
         txDate.getFullYear() === currentMonth.getFullYear();
}

function filterByMonth() {
  const monthlyData = mockData.filter(transaction => isInCurrentMonth(transaction.date));
  return monthlyData;
}

function updateMonthIndicator() {
  const mesActualElement = document.getElementById('mes-actual');
  if (mesActualElement) {
    const monthName = getMonthName(currentMonth);
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    mesActualElement.textContent = capitalizedMonth;
  }
}

function loadTableData() {
  const tableBody = document.getElementById('tabla-body');
  
  if (!tableBody) {
    console.error('No se encontró el elemento tabla-body');
    return;
  }
  
  console.log('Cargando datos:', filteredData);
  
  tableBody.innerHTML = '';
  
  filteredData.forEach(transaction => {
    const row = document.createElement('tr');
    
    const categoryClass = transaction.category === 'Ingreso' ? 'ingreso' : 'gasto';
    const amountPrefix = transaction.category === 'Ingreso' ? '+' : '-';
    
    row.innerHTML = `
      <td>${transaction.description}</td>
      <td><span class="${categoryClass}">${transaction.category}</span></td>
      <td class="cantidad"><span class="${categoryClass}">${amountPrefix}$${Math.abs(transaction.amount)}</span></td>
      <td>${formatDate(transaction.date)}</td>
      <td class="acciones">
        <button class="btn-delete" data-id="${transaction.id}" title="Eliminar transacción">
          <img src="assets/trash.png" alt="Eliminar" class="icon-delete" />
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  addDeleteEventListeners();
  
  console.log('Datos cargados en la tabla');
}

function addDeleteEventListeners() {
  const deleteButtons = document.querySelectorAll('.btn-delete');
  
  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      const transactionId = parseInt(button.getAttribute('data-id'));
      const transaction = mockData.find(t => t.id === transactionId);
      
      if (transaction) {
        const confirmMessage = `¿Estás seguro de que quieres eliminar esta transacción?\n\nDescripción: ${transaction.description}\nCantidad: $${transaction.amount}\nCategoría: ${transaction.category}`;
        
        if (confirm(confirmMessage)) {
          window.DataManager.deleteTransaction(transactionId);
          
          loadMockData();
          loadDescriptionFilter();
          applyFilters();
          
          console.log(`Transacción ${transactionId} eliminada`);
        }
      }
    });
  });
}

function loadDescriptionFilter() {
  const filtroDescripcion = document.getElementById('filtro-descripcion');
  if (!filtroDescripcion) return;
  
  const monthlyData = filterByMonth();
  const descripciones = [...new Set(monthlyData.map(t => t.description))].sort();
  
  filtroDescripcion.innerHTML = '<option value="">Todas</option>';
  
  descripciones.forEach(descripcion => {
    const option = document.createElement('option');
    option.value = descripcion;
    option.textContent = descripcion;
    filtroDescripcion.appendChild(option);
  });
}

function applyFilters() {
  const categoriaFilter = document.getElementById('filtro-categoria')?.value || '';
  const descripcionFilter = document.getElementById('filtro-descripcion')?.value || '';
  
  const monthlyData = filterByMonth();
  
  filteredData = monthlyData.filter(transaction => {
    const categoriaMatch = !categoriaFilter || 
      (categoriaFilter === 'ingreso' && transaction.category === 'Ingreso') ||
      (categoriaFilter === 'gasto' && transaction.category === 'Gasto');
    
    const descripcionMatch = !descripcionFilter || transaction.description === descripcionFilter;
    
    return categoriaMatch && descripcionMatch;
  });
  
  loadTableData();
  updateCuadrilaterosFiltered();
}

function clearFilters() {
  const categoriaFilter = document.getElementById('filtro-categoria');
  const descripcionFilter = document.getElementById('filtro-descripcion');
  
  if (categoriaFilter) categoriaFilter.value = '';
  if (descripcionFilter) descripcionFilter.value = '';
  
  filteredData = filterByMonth();
  loadTableData();
  updateCuadrilaterosFiltered();
}

function setupFilterEventListeners() {
  const categoriaFilter = document.getElementById('filtro-categoria');
  const descripcionFilter = document.getElementById('filtro-descripcion');
  const limpiarBtn = document.getElementById('btn-limpiar-filtros');
  
  if (categoriaFilter) {
    categoriaFilter.addEventListener('change', applyFilters);
  }
  
  if (descripcionFilter) {
    descripcionFilter.addEventListener('change', applyFilters);
  }
  
  if (limpiarBtn) {
    limpiarBtn.addEventListener('click', clearFilters);
  }
}

function goToPreviousMonth() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  updateMonthIndicator();
  loadDescriptionFilter();
  applyFilters();
}

function goToNextMonth() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  updateMonthIndicator();
  loadDescriptionFilter();
  applyFilters();
}

function setupMonthSelectorListeners() {
  const btnAnterior = document.getElementById('btn-mes-anterior');
  const btnSiguiente = document.getElementById('btn-mes-siguiente');
  
  if (btnAnterior) {
    btnAnterior.addEventListener('click', goToPreviousMonth);
  }
  
  if (btnSiguiente) {
    btnSiguiente.addEventListener('click', goToNextMonth);
  }
}

function updateCuadrilaterosFiltered() {
  const ingresos = filteredData
    .filter(t => t.category === 'Ingreso')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const gastos = filteredData
    .filter(t => t.category === 'Gasto')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = ingresos - gastos;
  
  const balanceElement = document.querySelector('.cuadrilatero-izquierda');
  if (balanceElement) {
    balanceElement.innerHTML = `
      <h3 class="cuadrilatero-titulo">Balance</h3>
      <div class="cuadrilatero-valor">$${balance.toLocaleString('es-ES')}</div>
    `;
  }
  
  const ingresosElement = document.querySelector('.cuadrilatero-centro');
  if (ingresosElement) {
    ingresosElement.innerHTML = `
      <h3 class="cuadrilatero-titulo">Ingresos</h3>
      <div class="cuadrilatero-valor">$${ingresos.toLocaleString('es-ES')}</div>
    `;
  }
  
  const gastosElement = document.querySelector('.cuadrilatero-derecha');
  if (gastosElement) {
    gastosElement.innerHTML = `
      <h3 class="cuadrilatero-titulo">Gastos</h3>
      <div class="cuadrilatero-valor">$${gastos.toLocaleString('es-ES')}</div>
    `;
  }
}

function calculateTotals() {
  const ingresos = mockData
    .filter(t => t.category === 'Ingreso')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const gastos = mockData
    .filter(t => t.category === 'Gasto')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = ingresos - gastos;
  
  return { ingresos, gastos, balance };
}

function updateCuadrilateros() {
  const { ingresos, gastos, balance } = calculateTotals();
  
  const balanceElement = document.querySelector('.cuadrilatero-izquierda');
  if (balanceElement) {
    balanceElement.innerHTML = `
      <h3 class="cuadrilatero-titulo">Balance</h3>
      <div class="cuadrilatero-valor">$${balance.toLocaleString('es-ES')}</div>
    `;
  }
  
  const ingresosElement = document.querySelector('.cuadrilatero-centro');
  if (ingresosElement) {
    ingresosElement.innerHTML = `
      <h3 class="cuadrilatero-titulo">Ingresos</h3>
      <div class="cuadrilatero-valor">$${ingresos.toLocaleString('es-ES')}</div>
    `;
  }
  
  const gastosElement = document.querySelector('.cuadrilatero-derecha');
  if (gastosElement) {
    gastosElement.innerHTML = `
      <h3 class="cuadrilatero-titulo">Gastos</h3>
      <div class="cuadrilatero-valor">$${gastos.toLocaleString('es-ES')}</div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, iniciando carga de tabla');
  
  loadMockData();
  
  updateMonthIndicator();
  
  setupMonthSelectorListeners();
  
  loadDescriptionFilter();
  
  setupFilterEventListeners();
  
  applyFilters();
  
  const btnAgregar = document.querySelector('.btn-agregar-transaccion');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      window.location.href = 'pages/add-transaction.html';
    });
  }
  
  const estadisticasTab = document.querySelector('.tab:last-child');
  if (estadisticasTab) {
    estadisticasTab.addEventListener('click', () => {
      window.location.href = 'pages/statistics.html';
    });
  }
});
