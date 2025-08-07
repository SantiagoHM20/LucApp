let mockData = [];
let currentMonth = new Date();

function loadMockData() {
  mockData = window.DataManager.getAllTransactions();
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
  return mockData.filter(transaction => isInCurrentMonth(transaction.date));
}

function updateMonthIndicator() {
  const mesActualElement = document.getElementById('mes-actual');
  if (mesActualElement) {
    const monthName = getMonthName(currentMonth);
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    mesActualElement.textContent = capitalizedMonth;
  }
}

function goToPreviousMonth() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  updateMonthIndicator();
  updateAllStatistics();
}

function goToNextMonth() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  updateMonthIndicator();
  updateAllStatistics();
}

function updateSummaryCards() {
  const monthlyData = filterByMonth();
  const gastos = monthlyData.filter(t => t.category === 'Gasto');
  const ingresos = monthlyData.filter(t => t.category === 'Ingreso');
  
  const totalTransacciones = monthlyData.length;
  const totalGastos = gastos.reduce((sum, t) => sum + t.amount, 0);
  const totalIngresos = ingresos.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIngresos - totalGastos;
  
  const gastoPromedio = gastos.length > 0 ? totalGastos / gastos.length : 0;
  const ingresoPromedio = ingresos.length > 0 ? totalIngresos / ingresos.length : 0;
  
  const diasEnMes = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const balanceDiario = balance / diasEnMes;
  
  document.getElementById('total-transacciones').textContent = totalTransacciones;
  document.getElementById('gasto-promedio').textContent = `$${gastoPromedio.toLocaleString('es-ES', {maximumFractionDigits: 0})}`;
  document.getElementById('ingreso-promedio').textContent = `$${ingresoPromedio.toLocaleString('es-ES', {maximumFractionDigits: 0})}`;
  document.getElementById('balance-diario').textContent = `$${balanceDiario.toLocaleString('es-ES', {maximumFractionDigits: 0})}`;
  
  const balanceDiarioElement = document.getElementById('balance-diario');
  balanceDiarioElement.style.color = balanceDiario >= 0 ? '#4CAF50' : '#FF5252';
}

function createGastosChart() {
  const monthlyData = filterByMonth();
  const gastos = monthlyData.filter(t => t.category === 'Gasto');
  
  const gastosPorDescripcion = {};
  gastos.forEach(gasto => {
    if (gastosPorDescripcion[gasto.description]) {
      gastosPorDescripcion[gasto.description] += gasto.amount;
    } else {
      gastosPorDescripcion[gasto.description] = gasto.amount;
    }
  });
  
  const labels = Object.keys(gastosPorDescripcion);
  const data = Object.values(gastosPorDescripcion);
  
  const backgroundColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB'
  ];
  
  const ctx = document.getElementById('gastosChart').getContext('2d');
  
  if (window.gastosChartInstance) {
    window.gastosChartInstance.destroy();
  }
  
  if (labels.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('No hay gastos este mes', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }
  
  window.gastosChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: $${context.parsed.toLocaleString('es-ES')} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function createIngresosGastosChart() {
  const monthlyData = filterByMonth();
  const gastos = monthlyData.filter(t => t.category === 'Gasto');
  const ingresos = monthlyData.filter(t => t.category === 'Ingreso');
  
  const totalGastos = gastos.reduce((sum, t) => sum + t.amount, 0);
  const totalIngresos = ingresos.reduce((sum, t) => sum + t.amount, 0);
  
  const ctx = document.getElementById('ingresosGastosChart').getContext('2d');
  
  if (window.ingresosGastosChartInstance) {
    window.ingresosGastosChartInstance.destroy();
  }
  
  window.ingresosGastosChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ingresos', 'Gastos'],
      datasets: [{
        label: 'Cantidad ($)',
        data: [totalIngresos, totalGastos],
        backgroundColor: ['#4CAF50', '#FF5252'],
        borderColor: ['#45a049', '#e04848'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: $${context.parsed.y.toLocaleString('es-ES')}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString('es-ES');
            }
          }
        }
      }
    }
  });
}

function updateTopTransactions() {
  const monthlyData = filterByMonth();
  const gastos = monthlyData.filter(t => t.category === 'Gasto').sort((a, b) => b.amount - a.amount).slice(0, 5);
  const ingresos = monthlyData.filter(t => t.category === 'Ingreso').sort((a, b) => b.amount - a.amount).slice(0, 5);
  
  const topGastosElement = document.getElementById('top-gastos');
  topGastosElement.innerHTML = '';
  
  if (gastos.length === 0) {
    topGastosElement.innerHTML = '<li class="no-data">No hay gastos este mes</li>';
  } else {
    gastos.forEach(gasto => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="transaction-desc">${gasto.description}</span>
        <span class="transaction-amount gasto">$${gasto.amount.toLocaleString('es-ES')}</span>
      `;
      topGastosElement.appendChild(li);
    });
  }
  
  const topIngresosElement = document.getElementById('top-ingresos');
  topIngresosElement.innerHTML = '';
  
  if (ingresos.length === 0) {
    topIngresosElement.innerHTML = '<li class="no-data">No hay ingresos este mes</li>';
  } else {
    ingresos.forEach(ingreso => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="transaction-desc">${ingreso.description}</span>
        <span class="transaction-amount ingreso">$${ingreso.amount.toLocaleString('es-ES')}</span>
      `;
      topIngresosElement.appendChild(li);
    });
  }
}

function createTendenciaChart() {
  const ctx = document.getElementById('tendenciaChart').getContext('2d');
  
  const meses = [];
  const balances = [];
  
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - i);
    
    const monthData = mockData.filter(transaction => {
      const txDate = new Date(transaction.date);
      return txDate.getMonth() === fecha.getMonth() && 
             txDate.getFullYear() === fecha.getFullYear();
    });
    
    const ingresos = monthData.filter(t => t.category === 'Ingreso').reduce((sum, t) => sum + t.amount, 0);
    const gastos = monthData.filter(t => t.category === 'Gasto').reduce((sum, t) => sum + t.amount, 0);
    const balance = ingresos - gastos;
    
    meses.push(fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
    balances.push(balance);
  }
  
  if (window.tendenciaChartInstance) {
    window.tendenciaChartInstance.destroy();
  }
  
  window.tendenciaChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: meses,
      datasets: [{
        label: 'Balance',
        data: balances,
        borderColor: '#1E1E2E',
        backgroundColor: 'rgba(30, 30, 46, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#1E1E2E',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const color = value >= 0 ? '#4CAF50' : '#FF5252';
              return `Balance: $${value.toLocaleString('es-ES')}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString('es-ES');
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });
}

function updateAllStatistics() {
  updateSummaryCards();
  createGastosChart();
  createIngresosGastosChart();
  updateTopTransactions();
  createTendenciaChart();
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

function setupNavigation() {
  const balanceTab = document.querySelector('.tab:first-child');
  const btnVolver = document.querySelector('.btn-volver');
  
  if (balanceTab) {
    balanceTab.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }
  
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, iniciando estadísticas');
  
  loadMockData();
  
  updateMonthIndicator();
  
  setupMonthSelectorListeners();
  setupNavigation();
  
  updateAllStatistics();
});
