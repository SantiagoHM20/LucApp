const mockData = [
  { id: 1, description: 'Sueldo', amount: 2000, category: 'Ingreso', date: new Date() },
  { id: 2, description: 'Comida', amount: 100, category: 'Gasto', date: new Date() },
  { id: 3, description: 'Freelance', amount: 500, category: 'Ingreso', date: new Date() },
  { id: 4, description: 'Transporte', amount: 50, category: 'Gasto', date: new Date() },
  { id: 5, description: 'Entretenimiento', amount: 80, category: 'Gasto', date: new Date() },
];

function formatDate(date) {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function loadTableData() {
  const tableBody = document.getElementById('tabla-body');
  
  if (!tableBody) {
    console.error('No se encontró el elemento tabla-body');
    return;
  }
  
  console.log('Cargando datos:', mockData);
  
  tableBody.innerHTML = '';
  
  mockData.forEach(transaction => {
    const row = document.createElement('tr');
    
    const categoryClass = transaction.category === 'Ingreso' ? 'ingreso' : 'gasto';
    const amountPrefix = transaction.category === 'Ingreso' ? '+' : '-';
    
    row.innerHTML = `
      <td>${transaction.description}</td>
      <td><span class="${categoryClass}">${transaction.category}</span></td>
      <td class="cantidad"><span class="${categoryClass}">${amountPrefix}$${Math.abs(transaction.amount)}</span></td>
      <td>${formatDate(transaction.date)}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  console.log('Datos cargados en la tabla');
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
  loadTableData();
  updateCuadrilateros();
});
