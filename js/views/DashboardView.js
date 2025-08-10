const DashboardView = (function() {
    'use strict';
    let elements = {};
    const config = {
        SELECTORS: {
            welcomeMessage: '.welcome-message',
            monthDisplay: '.month-display',
            balanceAmount: '.balance-amount',
            incomeAmount: '.income-amount',
            expenseAmount: '.expense-amount',
            transactionsList: '.transactions-list',
            monthNavPrev: '.month-nav-prev',
            monthNavNext: '.month-nav-next',
            noTransactions: '.no-transactions',
            addTransactionBtn: '.add-transaction-btn',
            logoutBtn: '.logout-btn',
            statisticsBtn: '.statistics-btn',
            filterCategory: '#filtro-categoria',
            filterDescription: '#filtro-descripcion',
            clearFiltersBtn: '#btn-limpiar-filtros'
        },
        CLASSES: {
            positive: 'income',
            negative: 'expense',
            neutral: 'text-muted',
            active: 'active',
            loading: 'loading'
        }
    };
    let currentFilter = 'all';
    let currentData = null;
    function initializeElements() {
        Object.keys(config.SELECTORS).forEach(key => {
            const selector = config.SELECTORS[key];
            elements[key] = document.querySelector(selector);
        });
    }
    function formatCurrency(amount) {
        if (typeof UtilsModule !== 'undefined') {
            return UtilsModule.formatCurrency(amount);
        }
        return `$${amount.toLocaleString()}`;
    }
    function formatDate(date) {
        if (typeof UtilsModule !== 'undefined') {
            return UtilsModule.formatShortDate(date);
        }
        return new Date(date).toLocaleDateString();
    }
    function getAmountClass(amount, type) {
        if (type === 'income') return config.CLASSES.positive;
        if (type === 'expense') return config.CLASSES.negative;
        if (amount > 0) return config.CLASSES.positive;
        if (amount < 0) return config.CLASSES.negative;
        return config.CLASSES.neutral;
    }
    function createTransactionElement(transaction) {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.dataset.id = transaction.id;
        transactionElement.dataset.type = transaction.type;
        const amountClass = getAmountClass(transaction.amount, transaction.type);
        const amountPrefix = transaction.type === 'expense' ? '-' : '+';
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-details">
                    <span class="transaction-category">${transaction.category}</span>
                    <span class="transaction-date">${formatDate(transaction.date)}</span>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                    Eliminar
                </button>
            </div>
        `;
        return transactionElement;
    }
    function createNoTransactionsElement(filterType = 'all') {
        const noTransactionsElement = document.createElement('div');
        noTransactionsElement.className = 'no-transactions text-center p-4';
        let message = 'No hay transacciones en este mes.';
        if (filterType === 'income') {
            message = 'No hay ingresos en este mes.';
        } else if (filterType === 'expense') {
            message = 'No hay gastos en este mes.';
        }
        noTransactionsElement.innerHTML = `
            <div class="mb-3">
                <i class="fas fa-wallet fa-3x text-muted"></i>
            </div>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary add-first-transaction-btn">
                Agregar primera transacción
            </button>
        `;
        return noTransactionsElement;
    }
    function filterTransactions(transactions, categoryFilter, descriptionFilter) {
        let filtered = transactions;
        if (categoryFilter && categoryFilter !== '') {
            filtered = filtered.filter(transaction => transaction.type === categoryFilter);
        }
        if (descriptionFilter && descriptionFilter !== '') {
            filtered = filtered.filter(transaction => 
                transaction.description.toLowerCase().includes(descriptionFilter.toLowerCase())
            );
        }
        return filtered;
    }
    function updateDescriptionOptions(transactions) {
        const descriptionSelect = elements.filterDescription;
        if (!descriptionSelect) return;
        const descriptions = [...new Set(transactions.map(t => t.description))]
            .filter(desc => desc && desc.trim() !== '')
            .sort();
        descriptionSelect.innerHTML = '<option value="">Todas</option>';
        descriptions.forEach(description => {
            const option = document.createElement('option');
            option.value = description;
            option.textContent = description;
            descriptionSelect.appendChild(option);
        });
    }
    function setupFilterListeners(onFilterChange) {
        const categorySelect = elements.filterCategory;
        const descriptionSelect = elements.filterDescription;
        const clearBtn = elements.clearFiltersBtn;
        if (categorySelect) {
            categorySelect.addEventListener('change', function() {
                const categoryFilter = this.value;
                const descriptionFilter = descriptionSelect ? descriptionSelect.value : '';
                onFilterChange(categoryFilter, descriptionFilter);
            });
        }
        if (descriptionSelect) {
            descriptionSelect.addEventListener('change', function() {
                const categoryFilter = categorySelect ? categorySelect.value : '';
                const descriptionFilter = this.value;
                onFilterChange(categoryFilter, descriptionFilter);
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (categorySelect) categorySelect.value = '';
                if (descriptionSelect) descriptionSelect.value = '';
                onFilterChange('', '');
            });
        }
    }
    return {
        init: function() {
            initializeElements();
            return this;
        },
        updateWelcomeMessage: function(user) {
            if (elements.welcomeMessage) {
                const name = user.firstName || user.username || 'Usuario';
                elements.welcomeMessage.textContent = `Bienvenido, ${name}`;
            }
        },
        updateMonthDisplay: function(monthInfo) {
            if (elements.monthDisplay) {
                const monthName = monthInfo.monthName || 'Mes';
                const year = monthInfo.year || new Date().getFullYear();
                elements.monthDisplay.textContent = `${monthName} ${year}`;
            }
        },
        updateTotals: function(totals) {
            if (elements.balanceAmount) {
                elements.balanceAmount.textContent = formatCurrency(totals.balance);
                elements.balanceAmount.className = `balance-amount ${getAmountClass(totals.balance)}`;
            }
            if (elements.incomeAmount) {
                elements.incomeAmount.textContent = formatCurrency(totals.income);
                elements.incomeAmount.className = `income-amount ${config.CLASSES.positive}`;
            }
            if (elements.expenseAmount) {
                elements.expenseAmount.textContent = formatCurrency(totals.expenses);
                elements.expenseAmount.className = `expense-amount ${config.CLASSES.negative}`;
            }
        },
        updateTransactionsList: function(transactions, categoryFilter = '', descriptionFilter = '') {
            if (!elements.transactionsList) return;
            updateDescriptionOptions(transactions);
            const filteredTransactions = filterTransactions(transactions, categoryFilter, descriptionFilter);
            elements.transactionsList.innerHTML = '';
            if (filteredTransactions.length === 0) {
                const noTransactionsElement = createNoTransactionsElement(categoryFilter || 'all');
                elements.transactionsList.appendChild(noTransactionsElement);
            } else {
                filteredTransactions.forEach(transaction => {
                    const transactionElement = createTransactionElement(transaction);
                    elements.transactionsList.appendChild(transactionElement);
                });
            }
        },
        updateDashboard: function(dashboardData) {
            currentData = dashboardData;
            this.updateMonthDisplay(dashboardData.monthInfo);
            this.updateTotals(dashboardData.totals);
            this.updateTransactionsList(dashboardData.transactions, '', '');
        },
        setFilter: function(categoryFilter, descriptionFilter) {
            if (currentData) {
                this.updateTransactionsList(currentData.transactions, categoryFilter, descriptionFilter);
            }
        },
        setupFilters: function(onFilterChange) {
            setupFilterListeners(onFilterChange);
        },
        getCurrentFilter: function() {
            return {
                category: elements.filterCategory ? elements.filterCategory.value : '',
                description: elements.filterDescription ? elements.filterDescription.value : ''
            };
        },
        setLoading: function(isLoading) {
            const loadingElements = [
                elements.transactionsList,
                elements.balanceAmount,
                elements.incomeAmount,
                elements.expenseAmount
            ];
            loadingElements.forEach(element => {
                if (element) {
                    element.classList.toggle(config.CLASSES.loading, isLoading);
                }
            });
            if (isLoading && elements.transactionsList) {
                elements.transactionsList.innerHTML = '<div class="text-center p-4">Cargando...</div>';
            }
        },
        showError: function(message) {
            if (elements.transactionsList) {
                elements.transactionsList.innerHTML = `
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p class="mb-0">${message}</p>
                    </div>
                `;
            }
        },
        onFilterChange: function(callback) {
            elements.filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const filterType = this.dataset.filter;
                    if (callback) {
                        callback(filterType);
                    }
                });
            });
        },
        onMonthNavigation: function(callback) {
            if (elements.monthNavPrev && callback) {
                elements.monthNavPrev.addEventListener('click', () => callback('prev'));
            }
            if (elements.monthNavNext && callback) {
                elements.monthNavNext.addEventListener('click', () => callback('next'));
            }
        },
        onTransactionAction: function(action, callback) {
            if (elements.transactionsList && callback) {
                elements.transactionsList.addEventListener('click', function(event) {
                    const button = event.target.closest(`.${action}-btn`);
                    if (button) {
                        const transactionId = button.dataset.id;
                        callback(transactionId, event);
                    }
                });
            }
        },
        onAddTransaction: function(callback) {
            if (elements.addTransactionBtn && callback) {
                elements.addTransactionBtn.addEventListener('click', callback);
            }
            if (elements.transactionsList && callback) {
                elements.transactionsList.addEventListener('click', function(event) {
                    if (event.target.classList.contains('add-first-transaction-btn')) {
                        callback(event);
                    }
                });
            }
        },
        onLogout: function(callback) {
            if (elements.logoutBtn && callback) {
                elements.logoutBtn.addEventListener('click', callback);
            }
        },
        onStatistics: function(callback) {
            if (elements.statisticsBtn && callback) {
                elements.statisticsBtn.addEventListener('click', callback);
            }
        },
        scrollToTop: function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        highlightTransaction: function(transactionId) {
            const transactionElement = elements.transactionsList.querySelector(`[data-id="${transactionId}"]`);
            if (transactionElement) {
                transactionElement.style.backgroundColor = '#fff3cd';
                setTimeout(() => {
                    transactionElement.style.backgroundColor = '';
                }, 2000);
            }
        },
        getViewInfo: function() {
            return {
                name: 'DashboardView',
                currentFilter: currentFilter,
                hasData: !!currentData,
                transactionCount: currentData ? currentData.transactions.length : 0
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardView;
} else {
    window.DashboardView = DashboardView;
}
