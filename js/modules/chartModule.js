export function getPieChartData(transactions) {
  const income = transactions
    .filter(t => t.category === 'Ingreso')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter(t => t.category === 'Gasto')
    .reduce((sum, t) => sum + t.amount, 0);
  return {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{
      data: [income, expense],
      backgroundColor: ['green', 'red']
    }]
  };
}
