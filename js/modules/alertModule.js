export function checkBudgetLimit(transactions, limit) {
  const expenses = transactions
    .filter(t => t.category === 'Gasto')
    .reduce((sum, t) => sum + t.amount, 0);

  return expenses >= limit;
}
