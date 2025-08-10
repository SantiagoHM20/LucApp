const DashboardController = (function() {
    'use strict';
    let dashboardView;
    let transactionController;
    let authController;
    let objectFactory;
    let utilsModule;
    let currentUser = null;
    let currentMonth = null;
    let isInitialized = false;
    function validateDependencies() {
        const required = {
            DashboardView: typeof DashboardView !== 'undefined',
            TransactionController: typeof TransactionController !== 'undefined',
            AuthController: typeof AuthController !== 'undefined',
            ObjectFactory: typeof ObjectFactory !== 'undefined',
            UtilsModule: typeof UtilsModule !== 'undefined'
        };
        const missing = Object.keys(required).filter(dep => !required[dep]);
        if (missing.length > 0) {
            throw new Error(`Dependencias faltantes en DashboardController: ${missing.join(', ')}`);
        }
    }
    function initializeDependencies() {
        dashboardView = DashboardView.init();
        authController = AuthController;
        objectFactory = ObjectFactory;
        utilsModule = UtilsModule;
    }
    function setupEventListeners() {
        dashboardView.setupFilters(handleFilterChange);
        dashboardView.onMonthNavigation(handleMonthNavigation);
        dashboardView.onTransactionAction('delete', handleDeleteTransaction);
        dashboardView.onAddTransaction(handleAddTransaction);
        dashboardView.onLogout(handleLogout);
        dashboardView.onStatistics(handleGoToStatistics);
    }
    function loadDashboardData() {
        if (!currentUser || !transactionController) return;
        try {
            dashboardView.setLoading(true);
            if (!currentMonth) {
                currentMonth = utilsModule.getCurrentMonth();
            }
            const allTransactions = transactionController.getAllTransactions();
            const dashboardData = objectFactory.createDashboardData(allTransactions, currentMonth);
            dashboardView.updateDashboard(dashboardData);
            dashboardView.setLoading(false);
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            dashboardView.setLoading(false);
            dashboardView.showError('Error al cargar los datos del dashboard');
        }
    }
    function handleFilterChange(categoryFilter, descriptionFilter) {
        try {
            const allTransactions = transactionController.getAllTransactions();
            dashboardView.updateTransactionsList(allTransactions, categoryFilter, descriptionFilter);
        } catch (error) {
            console.error('Error aplicando filtro:', error);
        }
    }
    function handleMonthNavigation(direction) {
        try {
            if (!currentMonth) return;
            let newYear = currentMonth.year;
            let newMonth = currentMonth.month;
            if (direction === 'prev') {
                if (newMonth === 1) {
                    newMonth = 12;
                    newYear--;
                } else {
                    newMonth--;
                }
            } else if (direction === 'next') {
                if (newMonth === 12) {
                    newMonth = 1;
                    newYear++;
                } else {
                    newMonth++;
                }
            }
            currentMonth = utilsModule.getMonthInfo(newYear, newMonth);
            loadDashboardData();
        } catch (error) {
            console.error('Error navegando entre meses:', error);
        }
    }
    function handleDeleteTransaction(transactionId) {
        try {
            const transaction = transactionController.getTransaction(transactionId);
            if (!transaction) {
                alert('Transacción no encontrada');
                return;
            }
            const confirmMessage = `¿Estás seguro de que quieres eliminar la transacción "${transaction.description}"?`;
            if (!confirm(confirmMessage)) {
                return;
            }
            const result = transactionController.deleteTransaction(transactionId);
            if (result.success) {
                loadDashboardData();
            } else {
                alert(result.message || 'Error al eliminar transacción');
            }
        } catch (error) {
            console.error('Error eliminando transacción:', error);
            alert('Error interno al eliminar transacción');
        }
    }
    function handleAddTransaction() {
        window.location.href = './add-transaction.html';
    }
    function handleLogout() {
        try {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                authController.logout();
            }
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = '../index.html';
        }
    }
    function handleGoToStatistics() {
        window.location.href = './statistics.html';
    }
    return {
        init: function() {
            if (isInitialized) return this;
            try {
                validateDependencies();
                initializeDependencies();
                currentUser = authController.requireAuth();
                if (!currentUser) {
                    return this;
                }
                transactionController = TransactionController.init(currentUser);
                setupEventListeners();
                dashboardView.updateWelcomeMessage(currentUser);
                this.refresh();
                isInitialized = true;
                return this;
            } catch (error) {
                console.error('Error inicializando DashboardController:', error);
                dashboardView.showError('Error inicializando dashboard');
                throw error;
            }
        },
        refresh: function() {
            if (currentUser && transactionController) {
                transactionController.refresh();
                loadDashboardData();
            }
        },
        goToMonth: function(year, month) {
            try {
                currentMonth = utilsModule.getMonthInfo(year, month);
                loadDashboardData();
            } catch (error) {
                console.error('Error cambiando a mes:', error);
            }
        },
        goToCurrentMonth: function() {
            currentMonth = utilsModule.getCurrentMonth();
            loadDashboardData();
        },
        getCurrentMonth: function() {
            return currentMonth;
        },
        getCurrentUser: function() {
            return currentUser;
        },
        getTransactionController: function() {
            return transactionController;
        },
        addQuickIncome: function(description, amount, category) {
            try {
                const transactionData = {
                    description: description,
                    amount: parseFloat(amount),
                    type: 'income',
                    category: category,
                    date: new Date().toISOString()
                };
                const result = transactionController.createTransaction(transactionData);
                if (result.success) {
                    this.refresh();
                    return result;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error agregando ingreso rápido:', error);
                throw error;
            }
        },
        addQuickExpense: function(description, amount, category) {
            try {
                const transactionData = {
                    description: description,
                    amount: parseFloat(amount),
                    type: 'expense',
                    category: category,
                    date: new Date().toISOString()
                };
                const result = transactionController.createTransaction(transactionData);
                if (result.success) {
                    this.refresh();
                    return result;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Error agregando gasto rápido:', error);
                throw error;
            }
        },
        highlightTransaction: function(transactionId) {
            dashboardView.highlightTransaction(transactionId);
        },
        getControllerInfo: function() {
            return {
                name: 'DashboardController',
                isInitialized: isInitialized,
                currentUser: currentUser ? currentUser.toViewFormat() : null,
                currentMonth: currentMonth,
                hasTransactionController: !!transactionController
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardController;
} else {
    window.DashboardController = DashboardController;
}
