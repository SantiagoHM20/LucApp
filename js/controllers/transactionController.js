const TransactionController = (function() {
    'use strict';
    let currentUser = null;
    let transactions = [];
    let isInitialized = false;
    const api = {
        init: function(user) {
            if (!user) {
                console.error('[TransactionController] Usuario requerido');
                throw new Error('Usuario requerido para inicializar TransactionController');
            }
            try {
                currentUser = user;
                try {
                    if (typeof StorageModule !== 'undefined') {
                        transactions = StorageModule.getTransactions(currentUser.id) || [];
                    } else {
                        transactions = [];
                    }
                } catch (storageError) {
                    console.warn('[TransactionController] Error cargando desde storage:', storageError);
                    transactions = [];
                }
                isInitialized = true;
                return this;
            } catch (error) {
                console.error('[TransactionController] Error en inicialización:', error);
                throw error;
            }
        },
        createTransaction: function(transactionData) {
            try {
                const newTransaction = {
                    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    ...transactionData,
                    userId: currentUser ? currentUser.id : 'unknown',
                    createdAt: new Date().toISOString()
                };
                transactions.push(newTransaction);
                try {
                    if (typeof StorageModule !== 'undefined') {
                        const userTransactions = StorageModule.getTransactions(currentUser.id) || [];
                        userTransactions.push(newTransaction);
                        StorageModule.saveTransactions(userTransactions, currentUser.id);
                    }
                } catch (storageError) {
                    console.warn('[TransactionController] Error guardando en storage:', storageError);
                }
                return { 
                    success: true, 
                    message: 'Transacción creada exitosamente',
                    transaction: newTransaction
                };
            } catch (error) {
                console.error('[TransactionController] Error creando transacción:', error);
                return { 
                    success: false, 
                    message: 'Error creando transacción: ' + error.message
                };
            }
        },
        getAllTransactions: function() {
            return transactions;
        },
        getTransaction: function(transactionId) {
            const transaction = transactions.find(tx => tx.id === transactionId);
            return transaction || null;
        },
        getTransactionsByType: function(type) {
            return transactions.filter(tx => tx.type === type);
        },
        getTransactionsByMonth: function(year, month) {
            return transactions;
        },
        deleteTransaction: function(transactionId) {
            const index = transactions.findIndex(tx => tx.id === transactionId);
            if (index !== -1) {
                transactions.splice(index, 1);
                return { 
                    success: true, 
                    message: 'Transacción eliminada exitosamente' 
                };
            }
            return { 
                success: false, 
                message: 'Transacción no encontrada' 
            };
        },
        calculateTotals: function() {
            let income = 0;
            let expenses = 0;
            transactions.forEach(tx => {
                const amount = parseFloat(tx.amount) || 0;
                if (tx.type === 'income') {
                    income += amount;
                } else if (tx.type === 'expense') {
                    expenses += amount;
                }
            });
            const balance = income - expenses;
            const totals = { income, expenses, balance };
            return totals;
        },
        getMonthlyTotals: function(year, month) {
            return this.calculateTotals();
        },
        refresh: function() {
            if (!currentUser) {
                console.warn('[TransactionController] No hay usuario para refrescar');
                return { success: false, message: 'No hay usuario activo' };
            }
            try {
                if (typeof StorageModule !== 'undefined') {
                    const savedTransactions = StorageModule.getTransactions(currentUser.id) || [];
                    transactions = savedTransactions;
                    return { 
                        success: true, 
                        message: 'Datos refrescados exitosamente',
                        transactionCount: transactions.length
                    };
                } else {
                    console.warn('[TransactionController] StorageModule no disponible');
                    return { 
                        success: false, 
                        message: 'StorageModule no disponible'
                    };
                }
            } catch (error) {
                console.error('[TransactionController] Error refrescando:', error);
                return { 
                    success: false, 
                    message: 'Error refrescando datos: ' + error.message
                };
            }
        },
        getControllerInfo: function() {
            return {
                name: 'TransactionController',
                version: '1.0.0-simplified',
                isInitialized: isInitialized,
                currentUser: currentUser ? currentUser.username || 'Usuario' : null,
                transactionCount: transactions.length,
                hasTransactions: transactions.length > 0
            };
        }
    };
    return api;
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionController;
} else {
    window.TransactionController = TransactionController;
}
