const StatisticsController = (function() {
    'use strict';
    let statisticsView;
    let transactionController;
    let authController;
    let objectFactory;
    let utilsModule;
    let currentUser = null;
    let currentPeriod = 'month';
    let isInitialized = false;
    function validateDependencies() {
        const required = {
            StatisticsView: typeof StatisticsView !== 'undefined',
            TransactionController: typeof TransactionController !== 'undefined',
            AuthController: typeof AuthController !== 'undefined',
            ObjectFactory: typeof ObjectFactory !== 'undefined',
            UtilsModule: typeof UtilsModule !== 'undefined'
        };
        const missing = Object.keys(required).filter(dep => !required[dep]);
        if (missing.length > 0) {
            throw new Error(`Dependencias faltantes en StatisticsController: ${missing.join(', ')}`);
        }
    }
    function initializeDependencies() {
        statisticsView = StatisticsView.init();
        authController = AuthController;
        objectFactory = ObjectFactory;
        utilsModule = UtilsModule;
    }
    function setupEventListeners() {
        statisticsView.onPeriodChange(handlePeriodChange);
        statisticsView.onBackButton(handleBackButton);
        statisticsView.onRefresh(handleRefresh);
        statisticsView.setMonthChangeHandler(handleMonthChange);
        window.addEventListener('resize', handleWindowResize);
    }
    function loadStatisticsData(selectedDate = null) {
        if (!currentUser || !transactionController) {
            return;
        }
        try {
            statisticsView.setLoading(true);
            let allTransactions = transactionController.getAllTransactions();
            if (selectedDate) {
                allTransactions = filterTransactionsByMonth(allTransactions, selectedDate);
            }
            const statisticsData = createStatisticsFromTransactions(allTransactions, currentPeriod);
            statisticsView.updateStatistics(statisticsData);
            statisticsView.setLoading(false);
        } catch (error) {
            console.error('Error cargando datos de estadísticas:', error);
            statisticsView.setLoading(false);
            statisticsView.showError('Error al cargar las estadísticas');
        }
    }
    function handlePeriodChange(newPeriod) {
        try {
            currentPeriod = newPeriod;
            loadStatisticsData();
        } catch (error) {
            console.error('Error cambiando período:', error);
            statisticsView.showError('Error al cambiar período');
        }
    }
    function handleBackButton() {
        window.location.href = './dashboard.html';
    }
    function handleRefresh() {
        try {
            if (transactionController) {
                transactionController.refresh();
            }
            loadStatisticsData();
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
            statisticsView.showError('Error al actualizar estadísticas');
        }
    }
    function handleWindowResize() {
        setTimeout(() => {
            statisticsView.resizeCharts();
        }, 100);
    }
    function handleMonthChange(selectedDate) {
        currentPeriod = 'month';
        loadStatisticsData(selectedDate);
    }
    function createStatisticsFromTransactions(transactions, period = 'month') {
        if (transactions.length > 0) {
        }
        const incomeTransactions = transactions.filter(tx => tx.type === 'income');
        const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
        if (incomeTransactions.length === 0 && expenseTransactions.length === 0 && transactions.length > 0) {
            transactions.forEach(tx => {
                if (tx.category === 'Ingreso' || tx.category === 'Sueldo' || tx.category === 'Freelance') {
                    tx.type = 'income';
                } else {
                    tx.type = 'expense';
                }
            });
            const newIncomeTransactions = transactions.filter(tx => tx.type === 'income');
            const newExpenseTransactions = transactions.filter(tx => tx.type === 'expense');
        }
        const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const balance = totalIncome - totalExpenses;
        const categoryGroups = {};
        transactions.forEach(tx => {
            if (!categoryGroups[tx.category]) {
                categoryGroups[tx.category] = [];
            }
            categoryGroups[tx.category].push(tx);
        });
        const categoryStats = Object.keys(categoryGroups).map(category => {
            const categoryTransactions = categoryGroups[category];
            const amount = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            return {
                category: category,
                amount: amount,
                transactions: categoryTransactions,
                percentage: transactions.length > 0 ? (amount / (totalIncome + totalExpenses)) * 100 : 0
            };
        });
        return {
            period: period,
            transactions: transactions,
            totals: {
                income: totalIncome,
                expenses: totalExpenses,
                balance: balance
            },
            categories: {
                all: categoryStats,
                income: categoryStats.filter(stat => incomeTransactions.some(tx => tx.category === stat.category)),
                expenses: categoryStats.filter(stat => expenseTransactions.some(tx => tx.category === stat.category))
            },
            charts: {
                pieChart: categoryStats.map(stat => ({
                    label: stat.category,
                    value: stat.amount,
                    color: incomeTransactions.some(tx => tx.category === stat.category) ? '#4CAF50' : '#F44336'
                })),
                barChart: categoryStats.map(stat => ({
                    label: stat.category,
                    value: stat.amount,
                    color: incomeTransactions.some(tx => tx.category === stat.category) ? '#4CAF50' : '#F44336'
                }))
            }
        };
    }
    function filterTransactionsByMonth(transactions, targetDate) {
        const filtered = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === targetDate.getMonth() && 
                   transactionDate.getFullYear() === targetDate.getFullYear();
        });
        return filtered;
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
                this.refresh();
                isInitialized = true;
                return this;
            } catch (error) {
                console.error('Error inicializando StatisticsController:', error);
                statisticsView.showError('Error inicializando estadísticas');
                throw error;
            }
        },
        refresh: function() {
            if (currentUser && transactionController) {
                transactionController.refresh();
                loadStatisticsData();
            }
        },
        setPeriod: function(period) {
            const validPeriods = ['week', 'month', 'year'];
            if (validPeriods.includes(period)) {
                currentPeriod = period;
                loadStatisticsData();
            } else {
                console.warn('Período inválido:', period);
            }
        },
        getCurrentPeriod: function() {
            return currentPeriod;
        },
        getCurrentUser: function() {
            return currentUser;
        },
        getTransactionController: function() {
            return transactionController;
        },
        getIncomeByCategory: function(period = null) {
            try {
                const allTransactions = transactionController.getAllTransactions();
                const periodToUse = period || currentPeriod;
                const statisticsData = objectFactory.createStatisticsData(allTransactions, periodToUse);
                return statisticsData.categories.income;
            } catch (error) {
                console.error('Error obteniendo ingresos por categoría:', error);
                return [];
            }
        },
        getExpensesByCategory: function(period = null) {
            try {
                const allTransactions = transactionController.getAllTransactions();
                const periodToUse = period || currentPeriod;
                const statisticsData = objectFactory.createStatisticsData(allTransactions, periodToUse);
                return statisticsData.categories.expenses;
            } catch (error) {
                console.error('Error obteniendo gastos por categoría:', error);
                return [];
            }
        },
        getTopCategories: function(limit = 5, type = null) {
            try {
                const allTransactions = transactionController.getAllTransactions();
                const statisticsData = objectFactory.createStatisticsData(allTransactions, currentPeriod);
                let categories;
                if (type === 'income') {
                    categories = statisticsData.categories.income;
                } else if (type === 'expense') {
                    categories = statisticsData.categories.expenses;
                } else {
                    categories = statisticsData.categories.all;
                }
                return categories
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, limit);
            } catch (error) {
                console.error('Error obteniendo top categorías:', error);
                return [];
            }
        },
        compareWithPreviousPeriod: function() {
            try {
                const allTransactions = transactionController.getAllTransactions();
                const currentData = objectFactory.createStatisticsData(allTransactions, currentPeriod);
                let previousPeriod = currentPeriod;
                const previousData = objectFactory.createStatisticsData(allTransactions, previousPeriod);
                return {
                    current: currentData,
                    previous: previousData,
                    comparison: {
                        incomeChange: currentData.totals.income - previousData.totals.income,
                        expenseChange: currentData.totals.expenses - previousData.totals.expenses,
                        balanceChange: currentData.totals.balance - previousData.totals.balance
                    }
                };
            } catch (error) {
                console.error('Error comparando períodos:', error);
                return null;
            }
        },
        exportStatistics: function(format = 'json') {
            try {
                const allTransactions = transactionController.getAllTransactions();
                const statisticsData = objectFactory.createStatisticsData(allTransactions, currentPeriod);
                switch (format.toLowerCase()) {
                    case 'json':
                        return JSON.stringify(statisticsData, null, 2);
                    case 'csv':
                        return this.convertStatisticsToCSV(statisticsData);
                    default:
                        throw new Error('Formato de exportación no soportado');
                }
            } catch (error) {
                console.error('Error exportando estadísticas:', error);
                throw error;
            }
        },
        convertStatisticsToCSV: function(statisticsData) {
            if (!statisticsData.categories.all.length) return '';
            const headers = ['Categoría', 'Tipo', 'Monto', 'Transacciones', 'Porcentaje'];
            const csvRows = [headers.join(',')];
            statisticsData.categories.all.forEach(category => {
                const type = statisticsData.categories.income.includes(category) ? 'Ingreso' : 'Gasto';
                const row = [
                    `"${category.category}"`,
                    `"${type}"`,
                    category.amount,
                    category.transactions.length,
                    category.percentage
                ];
                csvRows.push(row.join(','));
            });
            return csvRows.join('\n');
        },
        exportChart: function(chartType = 'pie') {
            try {
                return statisticsView.exportChartAsImage(chartType);
            } catch (error) {
                console.error('Error exportando gráfico:', error);
                return null;
            }
        },
        getControllerInfo: function() {
            return {
                name: 'StatisticsController',
                isInitialized: isInitialized,
                currentUser: currentUser ? currentUser.toViewFormat() : null,
                currentPeriod: currentPeriod,
                hasTransactionController: !!transactionController
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsController;
} else {
    window.StatisticsController = StatisticsController;
}
