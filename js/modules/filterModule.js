export function applyFilters(transactions, { description, category }) {
  return transactions.filter(t => {
    return (!description || t.description.includes(description)) &&
           (!category || t.category === category);
  });
}
