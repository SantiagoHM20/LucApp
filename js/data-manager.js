const DataManager = {
  currentUserCache: null,
  init: function() {
    this.cleanLegacyData();
    if (window.authManager) {
      window.authManager.checkActiveSession();
      this.currentUserCache = window.authManager.getCurrentUser();
    }
  },
  getDataKey: function() {
    if (!this.currentUserCache && window.authManager) {
      window.authManager.checkActiveSession();
      this.currentUserCache = window.authManager.getCurrentUser();
    }
    if (this.currentUserCache) {
      return `lucapp-transactions-${this.currentUserCache.id}`;
    }
    return 'lucapp-transactions-guest';
  },
  refreshUser: function() {
    if (window.authManager) {
      window.authManager.checkActiveSession();
      this.currentUserCache = window.authManager.getCurrentUser();
    }
  },
  isFirstTimeUser: function() {
    const dataKey = this.getDataKey();
    return !localStorage.getItem(dataKey);
  },
  getInitialData: function() {
    this.refreshUser();
    if (this.currentUserCache) {
      return [];
    }
    return [
      { id: 1, description: 'Sueldo', amount: 2000, category: 'Ingreso', date: new Date() },
      { id: 2, description: 'Comida', amount: 100, category: 'Gasto', date: new Date() },
      { id: 3, description: 'Freelance', amount: 500, category: 'Ingreso', date: new Date() },
      { id: 4, description: 'Transporte', amount: 50, category: 'Gasto', date: new Date() },
      { id: 5, description: 'Entretenimiento', amount: 80, category: 'Gasto', date: new Date() },
    ];
  },
  getAllTransactions: function() {
    const dataKey = this.getDataKey();
    const storedData = localStorage.getItem(dataKey);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      return parsed.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date)
      }));
    }
    const initialData = this.getInitialData();
    if (initialData.length > 0) {
      this.saveAllTransactions(initialData);
    }
    return [...initialData];
  },
  saveAllTransactions: function(transactions) {
    const dataKey = this.getDataKey();
    localStorage.setItem(dataKey, JSON.stringify(transactions));
  },
  addTransaction: function(newTransaction) {
    this.refreshUser();
    const transactions = this.getAllTransactions();
    const maxId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) : 0;
    newTransaction.id = maxId + 1;
    transactions.push(newTransaction);
    const dataKey = this.getDataKey();
    this.saveAllTransactions(transactions);
    const verification = localStorage.getItem(dataKey);
    if (verification) {
      const parsedVerification = JSON.parse(verification);
    }
    return newTransaction;
  },
  deleteTransaction: function(id) {
    const transactions = this.getAllTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    this.saveAllTransactions(filtered);
    return filtered;
  },
  clearUserData: function() {
    const dataKey = this.getDataKey();
    localStorage.removeItem(dataKey);
  },
  clearAllTransactionData: function() {
    const keys = Object.keys(localStorage);
    const transactionKeys = keys.filter(key => key.startsWith('lucapp-transactions'));
    transactionKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  },
  cleanLegacyData: function() {
    const legacyKeys = [
      'currentUser',
      'userMode',
      'lucapp_currentUser'
    ];
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
      }
    });
  },
  getCurrentUserInfo: function() {
    this.refreshUser();
    const dataKey = this.getDataKey();
    const transactionCount = this.getAllTransactions().length;
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('lucapp-transactions'));
    return {
      user: this.currentUserCache,
      dataKey: dataKey,
      transactionCount: transactionCount,
      hasStoredData: !!localStorage.getItem(dataKey),
      allTransactionKeys: allKeys
    };
  }
};
window.DataManager = DataManager;
window.clearAllTransactionData = function() {
  DataManager.clearAllTransactionData();
};
window.showUserInfo = function() {
  return DataManager.getCurrentUserInfo();
};
window.cleanLegacyData = function() {
  return DataManager.cleanLegacyData();
};
window.resetSystem = function() {
  DataManager.clearAllTransactionData();
  if (window.authManager && window.authManager.isLoggedIn()) {
    window.authManager.logout();
  }
  DataManager.currentUserCache = null;
  window.location.reload();
};
window.testTransactionFlow = function() {
  const initialInfo = DataManager.getCurrentUserInfo();
  const testTransaction = {
    description: 'Test - Compra de prueba',
    amount: 150,
    category: 'Gasto',
    date: new Date()
  };
  const added = DataManager.addTransaction(testTransaction);
  const finalInfo = DataManager.getCurrentUserInfo();
  const dataKey = DataManager.getDataKey();
  const storedData = localStorage.getItem(dataKey);
  const parsedData = storedData ? JSON.parse(storedData) : [];
  return {
    initial: initialInfo,
    added: added,
    final: finalInfo,
    stored: parsedData
  };
};
window.testUserSeparation = function() {
  DataManager.refreshUser();
  const info = DataManager.getCurrentUserInfo();
  const allKeys = Object.keys(localStorage);
  const transactionKeys = allKeys.filter(key => key.startsWith('lucapp-transactions'));
  const userKeys = allKeys.filter(key => key.startsWith('lucapp_'));
  transactionKeys.forEach(key => {
    const data = localStorage.getItem(key);
    const count = data ? JSON.parse(data).length : 0;
  });
  userKeys.forEach(key => {
  });
  const testTransaction = {
    description: 'Test Transaction',
    amount: 100,
    category: 'Gasto',
    date: new Date()
  };
  DataManager.getCurrentUserInfo();
  DataManager.addTransaction(testTransaction);
  DataManager.getCurrentUserInfo();
  return {
    currentUser: info,
    transactionKeys: transactionKeys,
    userKeys: userKeys
  };
};
