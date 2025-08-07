// Archivo compartido para manejar datos entre páginas
// Datos iniciales
const initialMockData = [
  { id: 1, description: 'Sueldo', amount: 2000, category: 'Ingreso', date: new Date() },
  { id: 2, description: 'Comida', amount: 100, category: 'Gasto', date: new Date() },
  { id: 3, description: 'Freelance', amount: 500, category: 'Ingreso', date: new Date() },
  { id: 4, description: 'Transporte', amount: 50, category: 'Gasto', date: new Date() },
  { id: 5, description: 'Entretenimiento', amount: 80, category: 'Gasto', date: new Date() },
];

// Funciones para manejar datos
const DataManager = {
  // Obtener todos los datos
  getAllTransactions: function() {
    const storedData = localStorage.getItem('lucapp-transactions');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Convertir fechas de string a Date objects
      return parsed.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date)
      }));
    }
    // Si no hay datos guardados, usar datos iniciales
    this.saveAllTransactions(initialMockData);
    return [...initialMockData];
  },

  // Guardar todos los datos
  saveAllTransactions: function(transactions) {
    localStorage.setItem('lucapp-transactions', JSON.stringify(transactions));
  },

  // Agregar nueva transacción
  addTransaction: function(newTransaction) {
    const transactions = this.getAllTransactions();
    
    // Generar ID único
    const maxId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) : 0;
    newTransaction.id = maxId + 1;
    
    // Agregar nueva transacción
    transactions.push(newTransaction);
    
    // Guardar datos actualizados
    this.saveAllTransactions(transactions);
    
    return newTransaction;
  },

  // Eliminar transacción (para futuro uso)
  deleteTransaction: function(id) {
    const transactions = this.getAllTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    this.saveAllTransactions(filtered);
    return filtered;
  }
};

// Hacer disponible globalmente
window.DataManager = DataManager;
