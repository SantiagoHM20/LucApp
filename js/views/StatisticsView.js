const StatisticsView = (function() {
    'use strict';
    let elements = {};
    const config = {
        SELECTORS: {
            periodSelector: '.period-selector',
            totalIncomeDisplay: '#ingreso-promedio',
            totalExpenseDisplay: '#gasto-promedio',
            balanceDisplay: '#balance-diario',
            transactionCountDisplay: '#total-transacciones',
            pieChartContainer: '#gastosChart',
            barChartContainer: '#ingresosGastosChart',
            categoryStatsContainer: '.category-stats-container',
            noDataMessage: '.no-data-message',
            backButton: '.back-button',
            refreshButton: '.refresh-button',
            monthDisplay: '#mes-actual',
            topExpensesList: '#top-gastos',
            topIncomesList: '#top-ingresos',
            lineChartContainer: '#tendenciaChart',
            prevMonthBtn: '#btn-mes-anterior',
            nextMonthBtn: '#btn-mes-siguiente'
        },
        CHART_CONFIG: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        },
        COLORS: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
        ]
    };
    let currentPeriod = 'month';
    let currentData = null;
    let currentDate = new Date();
    let charts = {
        pieChart: null,
        barChart: null,
        lineChart: null
    };
    function initializeElements() {
        Object.keys(config.SELECTORS).forEach(key => {
            const selector = config.SELECTORS[key];
            elements[key] = document.querySelector(selector);
        });
    }
    function createChartContainer(id, title) {
        const container = document.createElement('div');
        container.className = 'chart-container mb-4';
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">${title}</h5>
                </div>
                <div class="card-body">
                    <div class="${id}" style="position: relative; height: 400px;">
                        <canvas></canvas>
                    </div>
                </div>
            </div>
        `;
        const mainContainer = document.querySelector('.charts-container') || 
                             document.querySelector('.statistics-content') ||
                             document.body;
        mainContainer.appendChild(container);
        return container.querySelector(`.${id}`);
    }
    function formatCurrency(amount) {
        if (typeof UtilsModule !== 'undefined') {
            return UtilsModule.formatCurrency(amount);
        }
        return `$${amount.toLocaleString()}`;
    }
    function getAmountClass(amount) {
        if (amount > 0) return 'text-success';
        if (amount < 0) return 'text-danger';
        return 'text-muted';
    }
    function destroyExistingCharts() {
        Object.keys(charts).forEach(chartKey => {
            if (charts[chartKey]) {
                charts[chartKey].destroy();
                charts[chartKey] = null;
            }
        });
    }
    function createPieChart(data) {
        if (!elements.pieChartContainer || !data.transactions.length) {
            return;
        }
        
        const expenseTransactions = data.transactions.filter(tx => tx.type === 'expense');
        
        if (expenseTransactions.length === 0) {
            return;
        }
        
        const expensesByDescription = {};
        expenseTransactions.forEach(tx => {
            const description = tx.description || 'Sin descripción';
            if (!expensesByDescription[description]) {
                expensesByDescription[description] = 0;
            }
            expensesByDescription[description] += Math.abs(tx.amount);
        });
        
        const expenseDescriptions = Object.entries(expensesByDescription).map(([description, amount]) => ({
            label: description,
            value: amount
        }));
        
        if (expenseDescriptions.length === 0) {
            return;
        }
        
        const canvas = elements.pieChartContainer;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const chartData = {
            labels: expenseDescriptions.map(item => item.label),
            datasets: [{
                data: expenseDescriptions.map(item => item.value),
                backgroundColor: expenseDescriptions.map((item, index) => 
                    config.COLORS[index % config.COLORS.length]
                ),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };
        const totalExpenses = expenseDescriptions.reduce((sum, item) => sum + item.value, 0);
        const chartOptions = {
            ...config.CHART_CONFIG,
            plugins: {
                ...config.CHART_CONFIG.plugins,
                title: {
                    display: true,
                    text: 'Distribución de Gastos por Descripción'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = totalExpenses > 0 ? Math.round((context.parsed / totalExpenses) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };
        if (typeof Chart !== 'undefined') {
            charts.pieChart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: chartOptions
            });
        } else {
            console.error('[StatisticsView] Chart.js no está disponible');
        }
    }
    function createBarChart(data) {
        if (!elements.barChartContainer) {
            return;
        }
        const canvas = elements.barChartContainer;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const chartData = {
            labels: ['Ingresos', 'Gastos'],
            datasets: [{
                label: 'Monto',
                data: [data.totals.income, data.totals.expenses],
                backgroundColor: [
                    '#4CAF50',
                    '#F44336'
                ],
                borderColor: [
                    '#388E3C',
                    '#D32F2F'
                ],
                borderWidth: 2
            }]
        };
        const chartOptions = {
            ...config.CHART_CONFIG,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tipo de Transacción'
                    }
                }
            },
            plugins: {
                ...config.CHART_CONFIG.plugins,
                title: {
                    display: true,
                    text: 'Ingresos vs Gastos del Mes'
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        generateLabels: function(chart) {
                            return [
                                {
                                    text: 'Ingresos',
                                    fillStyle: '#4CAF50',
                                    strokeStyle: '#388E3C',
                                    lineWidth: 2
                                },
                                {
                                    text: 'Gastos',
                                    fillStyle: '#F44336',
                                    strokeStyle: '#D32F2F',
                                    lineWidth: 2
                                }
                            ];
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label;
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        };
        if (typeof Chart !== 'undefined') {
            charts.barChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: chartOptions
            });
        } else {
            console.error('[StatisticsView] Chart.js no está disponible');
        }
    }
    function createCategoryStatsTable(categories) {
        if (!elements.categoryStatsContainer) return;
        const table = document.createElement('table');
        table.className = 'table table-striped';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Categoría</th>
                    <th>Monto</th>
                    <th>Porcentaje</th>
                    <th>Transacciones</th>
                </tr>
            </thead>
            <tbody>
                ${categories.map(category => `
                    <tr>
                        <td>
                            <span class="category-color" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${UtilsModule ? UtilsModule.getCategoryColor(category.category) : '#999'}; margin-right: 8px;"></span>
                            ${category.category}
                        </td>
                        <td class="text-end">${formatCurrency(category.amount)}</td>
                        <td class="text-end">${category.percentage}%</td>
                        <td class="text-end">${category.transactions.length}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        elements.categoryStatsContainer.innerHTML = '';
        elements.categoryStatsContainer.appendChild(table);
    }
    function showNoDataMessage(period) {
        const periodNames = {
            week: 'esta semana',
            month: 'este mes',
            year: 'este año'
        };
        const message = `No hay datos para mostrar en ${periodNames[period] || 'el período seleccionado'}.`;
        if (elements.noDataMessage) {
            elements.noDataMessage.textContent = message;
            elements.noDataMessage.style.display = 'block';
        }
        [elements.pieChartContainer, elements.barChartContainer, elements.categoryStatsContainer]
            .forEach(container => {
                if (container) {
                    container.style.display = 'none';
                }
            });
    }
    function hideNoDataMessage() {
        if (elements.noDataMessage) {
            elements.noDataMessage.style.display = 'none';
        }
        [elements.pieChartContainer, elements.barChartContainer, elements.categoryStatsContainer]
            .forEach(container => {
                if (container) {
                    container.style.display = 'block';
                }
            });
    }
    return {
        init: function() {
            initializeElements();
            this.setupMonthNavigation();
            return this;
        },
        updateTotals: function(totals) {
            if (elements.totalIncomeDisplay) {
                elements.totalIncomeDisplay.textContent = formatCurrency(totals.income);
                elements.totalIncomeDisplay.className = `total-income-display text-success`;
            } else {
            }
            if (elements.totalExpenseDisplay) {
                elements.totalExpenseDisplay.textContent = formatCurrency(totals.expenses);
                elements.totalExpenseDisplay.className = `total-expense-display text-danger`;
            } else {
            }
            if (elements.balanceDisplay) {
                elements.balanceDisplay.textContent = formatCurrency(totals.balance);
                elements.balanceDisplay.className = `balance-display ${getAmountClass(totals.balance)}`;
            } else {
            }
        },
        updateTransactionCount: function(count) {
            if (elements.transactionCountDisplay) {
                elements.transactionCountDisplay.textContent = count;
            }
        },
        updatePeriodSelector: function(period) {
            currentPeriod = period;
            if (elements.periodSelector) {
                elements.periodSelector.value = period;
            }
        },
        updateStatistics: function(statisticsData) {
            currentData = statisticsData;
            this.updateTotals(statisticsData.totals);
            this.updateTransactionCount(statisticsData.transactions.length);
            this.updatePeriodSelector(statisticsData.period);
            this.updateMonthDisplay(currentDate);
            destroyExistingCharts();
            if (!statisticsData.transactions.length) {
                this.clearTopTransactions();
                showNoDataMessage(statisticsData.period);
                return;
            }
            hideNoDataMessage();
            if (statisticsData.categories.expenses.length > 0) {
                createPieChart(statisticsData);
                createBarChart(statisticsData);
                createCategoryStatsTable(statisticsData.categories.all);
            } else {
                showNoDataMessage(statisticsData.period);
            }
            this.updateTopTransactions(statisticsData);
            this.createLineChart(statisticsData);
        },
        updateCharts: function(data) {
            destroyExistingCharts();
            createPieChart(data);
            createBarChart(data);
        },
        resizeCharts: function() {
            Object.values(charts).forEach(chart => {
                if (chart) {
                    chart.resize();
                }
            });
        },
        updateTopTransactions: function(data) {
            if (!elements.topExpensesList || !elements.topIncomesList) {
                return;
            }
            const transactions = data.transactions || [];
            if (transactions.length > 0) {
            }
            let expenses, incomes;
            if (transactions.length > 0 && transactions[0].type) {
                expenses = transactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);
                incomes = transactions.filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount).slice(0, 5);
            } else {
                expenses = transactions.filter(t => 
                    t.category !== 'Ingreso' && t.category !== 'Sueldo' && t.category !== 'Freelance'
                ).sort((a, b) => b.amount - a.amount).slice(0, 5);
                incomes = transactions.filter(t => 
                    t.category === 'Ingreso' || t.category === 'Sueldo' || t.category === 'Freelance'
                ).sort((a, b) => b.amount - a.amount).slice(0, 5);
            }
            elements.topExpensesList.innerHTML = '';
            expenses.forEach(transaction => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="transaction-desc">${transaction.description}</span>
                    <span class="transaction-amount expense">-$${transaction.amount.toLocaleString()}</span>
                `;
                elements.topExpensesList.appendChild(li);
            });
            elements.topIncomesList.innerHTML = '';
            incomes.forEach(transaction => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="transaction-desc">${transaction.description}</span>
                    <span class="transaction-amount income">+$${transaction.amount.toLocaleString()}</span>
                `;
                elements.topIncomesList.appendChild(li);
            });
        },
        clearTopTransactions: function() {
            if (elements.topExpensesList) {
                elements.topExpensesList.innerHTML = '';
            }
            if (elements.topIncomesList) {
                elements.topIncomesList.innerHTML = '';
            }
        },
        createLineChart: function(data) {
            if (!elements.lineChartContainer) {
                return;
            }
            const canvas = elements.lineChartContainer;
            if (charts.lineChart) {
                charts.lineChart.destroy();
            }
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const today = new Date();
            const labels = [];
            const balanceData = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthLabel = monthNames[date.getMonth()];
                labels.push(monthLabel);
                let monthBalance = 0;
                if (window.TransactionController && typeof window.TransactionController.getAllTransactions === 'function') {
                    try {
                        const allTransactions = window.TransactionController.getAllTransactions();
                        const monthTransactions = allTransactions.filter(tx => {
                            const txDate = new Date(tx.date);
                            return txDate.getMonth() === date.getMonth() && 
                                   txDate.getFullYear() === date.getFullYear();
                        });
                        const monthIncome = monthTransactions
                            .filter(tx => tx.type === 'income' || tx.category === 'Ingreso' || tx.category === 'Sueldo' || tx.category === 'Freelance')
                            .reduce((sum, tx) => sum + tx.amount, 0);
                        const monthExpenses = monthTransactions
                            .filter(tx => tx.type === 'expense' || (tx.category !== 'Ingreso' && tx.category !== 'Sueldo' && tx.category !== 'Freelance'))
                            .reduce((sum, tx) => sum + tx.amount, 0);
                        monthBalance = monthIncome - monthExpenses;
                    } catch (error) {
                        console.error('[StatisticsView] Error calculando balance del mes:', error);
                        monthBalance = 0;
                    }
                } else {
                    monthBalance = 0;
                }
                balanceData.push(monthBalance);
            }
            const ctx = canvas.getContext('2d');
            charts.lineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Balance Mensual',
                        data: balanceData,
                        borderColor: '#00BFA6',
                        backgroundColor: 'rgba(0, 191, 166, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Mes'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Balance ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        },
        updateMonthDisplay: function(date = new Date()) {
            if (!elements.monthDisplay) {
                return;
            }
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const monthText = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            elements.monthDisplay.textContent = monthText;
        },
        setupMonthNavigation: function() {
            if (!elements.prevMonthBtn || !elements.nextMonthBtn) {
                return;
            }
            currentDate = new Date();
            elements.prevMonthBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                this.updateMonthDisplay(currentDate);
                this.onMonthChange(currentDate);
            });
            elements.nextMonthBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                this.updateMonthDisplay(currentDate);
                this.onMonthChange(currentDate);
            });
        },
        onMonthChange: function(date) {
        },
        setMonthChangeHandler: function(handler) {
            this.onMonthChange = handler;
        },
        getCurrentMonth: function() {
            return currentDate;
        },
        setLoading: function(isLoading) {
            const loadingElements = [
                elements.pieChartContainer,
                elements.barChartContainer,
                elements.categoryStatsContainer
            ];
            loadingElements.forEach(element => {
                if (element) {
                    if (isLoading) {
                        element.innerHTML = '<div class="text-center p-4">Cargando estadísticas...</div>';
                    }
                }
            });
        },
        showError: function(message) {
            const errorElements = [
                elements.pieChartContainer,
                elements.barChartContainer,
                elements.categoryStatsContainer
            ];
            errorElements.forEach(element => {
                if (element) {
                    element.innerHTML = `
                        <div class="alert alert-danger text-center">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p class="mb-0">${message}</p>
                        </div>
                    `;
                }
            });
        },
        onPeriodChange: function(callback) {
            if (elements.periodSelector && callback) {
                elements.periodSelector.addEventListener('change', function() {
                    const period = this.value;
                    callback(period);
                });
            }
        },
        onBackButton: function(callback) {
            if (elements.backButton && callback) {
                elements.backButton.addEventListener('click', callback);
            }
        },
        onRefresh: function(callback) {
            if (elements.refreshButton && callback) {
                elements.refreshButton.addEventListener('click', callback);
            }
        },
        exportChartAsImage: function(chartType = 'pie') {
            const chart = charts[chartType + 'Chart'];
            if (chart) {
                const url = chart.toBase64Image();
                return url;
            }
            return null;
        },
        getCurrentPeriod: function() {
            return currentPeriod;
        },
        getCurrentData: function() {
            return currentData;
        },
        getViewInfo: function() {
            return {
                name: 'StatisticsView',
                currentPeriod: currentPeriod,
                hasData: !!currentData,
                chartsCreated: Object.keys(charts).filter(key => charts[key] !== null)
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsView;
} else {
    window.StatisticsView = StatisticsView;
}
