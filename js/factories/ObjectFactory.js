const ObjectFactory = (function() {
    'use strict';
    if (typeof User === 'undefined') {
        console.error('ObjectFactory: User model no está disponible');
    }
    if (typeof Transaction === 'undefined') {
        console.error('ObjectFactory: Transaction model no está disponible');
    }
    if (typeof UtilsModule === 'undefined') {
        console.error('ObjectFactory: UtilsModule no está disponible');
    }
    const config = {
        DEFAULT_CATEGORIES: {
            income: [
                'Salario',
                'Freelance',
                'Inversiones',
                'Ventas',
                'Bonos',
                'Otros ingresos'
            ],
            expense: [
                'Alimentación',
                'Transporte',
                'Entretenimiento',
                'Salud',
                'Educación',
                'Servicios',
                'Compras',
                'Otros gastos'
            ]
        }
    };
    function validateUserData(userData) {
        if (!userData || typeof userData !== 'object') {
            throw new Error('Datos de usuario inválidos');
        }
        const required = ['username', 'email', 'password'];
        for (const field of required) {
            if (!userData[field]) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        }
    }
    function validateTransactionData(transactionData) {
        if (!transactionData || typeof transactionData !== 'object') {
            throw new Error('Datos de transacción inválidos');
        }
        const required = ['description', 'amount', 'type', 'category'];
        for (const field of required) {
            if (transactionData[field] === undefined || transactionData[field] === null) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        }
    }
    function generateDefaultUserData() {
        return {
            id: UtilsModule.generateUserId(),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                currency: 'CLP',
                theme: 'light',
                language: 'es'
            }
        };
    }
    function generateDefaultTransactionData() {
        return {
            id: UtilsModule.generateTransactionId(),
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
    return {
        createUser: function(userData) {
            try {
                validateUserData(userData);
                const completeUserData = Object.assign(
                    {},
                    generateDefaultUserData(),
                    userData
                );
                return User.create(completeUserData);
            } catch (error) {
                console.error('Error al crear usuario:', error);
                throw error;
            }
        },
        createUserFromRegistration: function(formData) {
            try {
                const userData = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName || formData.fullName || '',
                    lastName: formData.lastName || ''
                };
                if (formData.fullName && !formData.firstName) {
                    const nameParts = formData.fullName.trim().split(' ');
                    userData.firstName = nameParts[0] || '';
                    userData.lastName = nameParts.slice(1).join(' ') || '';
                }
                return this.createUser(userData);
            } catch (error) {
                console.error('Error al crear usuario desde registro:', error);
                throw error;
            }
        },
        createGuestUser: function() {
            const guestData = {
                username: 'invitado_' + Date.now(),
                email: 'guest@lucapp.local',
                password: 'guest_password',
                firstName: 'Usuario',
                lastName: 'Invitado',
                isGuest: true
            };
            return this.createUser(guestData);
        },
        createTransaction: function(transactionData, userId) {
            try {
                validateTransactionData(transactionData);
                if (!userId) {
                    throw new Error('ID de usuario requerido para crear transacción');
                }
                const completeTransactionData = Object.assign(
                    {},
                    generateDefaultTransactionData(),
                    transactionData,
                    { userId: userId }
                );
                return Transaction.create(completeTransactionData);
            } catch (error) {
                console.error('Error al crear transacción:', error);
                throw error;
            }
        },
        createTransactionFromForm: function(formData, userId) {
            try {
                const transactionData = {
                    description: formData.description,
                    amount: parseFloat(formData.amount),
                    type: formData.type,
                    category: formData.category,
                    date: formData.date || new Date().toISOString()
                };
                return this.createTransaction(transactionData, userId);
            } catch (error) {
                console.error('Error al crear transacción desde formulario:', error);
                throw error;
            }
        },
        createIncomeTransaction: function(description, amount, category, userId, date = null) {
            const transactionData = {
                description: description,
                amount: parseFloat(amount),
                type: 'income',
                category: category,
                date: date || new Date().toISOString()
            };
            return this.createTransaction(transactionData, userId);
        },
        createExpenseTransaction: function(description, amount, category, userId, date = null) {
            const transactionData = {
                description: description,
                amount: parseFloat(amount),
                type: 'expense',
                category: category,
                date: date || new Date().toISOString()
            };
            return this.createTransaction(transactionData, userId);
        },
        createDashboardData: function(transactions, currentMonth = null) {
            const monthInfo = currentMonth || UtilsModule.getCurrentMonth();
            const monthTransactions = transactions.filter(tx => 
                UtilsModule.isDateInMonth(tx.date, monthInfo.year, monthInfo.month)
            );
            const income = UtilsModule.calculateTotal(monthTransactions, 'income');
            const expenses = UtilsModule.calculateTotal(monthTransactions, 'expense');
            const balance = income - expenses;
            return {
                monthInfo: monthInfo,
                transactions: monthTransactions,
                totals: {
                    income: income,
                    expenses: expenses,
                    balance: balance
                },
                stats: {
                    transactionCount: monthTransactions.length,
                    incomeCount: monthTransactions.filter(tx => tx.type === 'income').length,
                    expenseCount: monthTransactions.filter(tx => tx.type === 'expense').length,
                    averageTransaction: monthTransactions.length > 0 ? 
                        (income + expenses) / monthTransactions.length : 0
                }
            };
        },
        createStatisticsData: function(transactions, period = 'month') {
            const now = UtilsModule.getCurrentDate();
            let filteredTransactions;
            switch (period) {
                case 'week':
                    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    filteredTransactions = transactions.filter(tx => 
                        new Date(tx.date) >= weekAgo
                    );
                    break;
                case 'year':
                    const currentYear = now.getFullYear();
                    filteredTransactions = transactions.filter(tx => 
                        new Date(tx.date).getFullYear() === currentYear
                    );
                    break;
                case 'month':
                default:
                    const currentMonth = UtilsModule.getCurrentMonth();
                    filteredTransactions = transactions.filter(tx => 
                        UtilsModule.isDateInMonth(tx.date, currentMonth.year, currentMonth.month)
                    );
                    break;
            }
            const byCategory = UtilsModule.groupBy(filteredTransactions, 'category');
            const categoryStats = Object.keys(byCategory).map(category => ({
                category: category,
                amount: UtilsModule.calculateTotal(byCategory[category]),
                transactions: byCategory[category],
                percentage: 0
            }));
            const totalAmount = UtilsModule.calculateTotal(filteredTransactions);
            categoryStats.forEach(stat => {
                stat.percentage = UtilsModule.calculatePercentage(stat.amount, totalAmount);
            });
            const incomeTransactions = filteredTransactions.filter(tx => tx.type === 'income');
            const expenseTransactions = filteredTransactions.filter(tx => tx.type === 'expense');
            return {
                period: period,
                transactions: filteredTransactions,
                totals: {
                    income: UtilsModule.calculateTotal(incomeTransactions),
                    expenses: UtilsModule.calculateTotal(expenseTransactions),
                    balance: UtilsModule.calculateBalance(filteredTransactions)
                },
                categories: {
                    all: categoryStats,
                    income: categoryStats.filter(stat => 
                        incomeTransactions.some(tx => tx.category === stat.category)
                    ),
                    expenses: categoryStats.filter(stat => 
                        expenseTransactions.some(tx => tx.category === stat.category)
                    )
                },
                charts: {
                    pieChart: categoryStats.map(stat => ({
                        label: stat.category,
                        value: stat.amount,
                        color: UtilsModule.getCategoryColor(stat.category)
                    })),
                    barChart: categoryStats.map(stat => ({
                        label: stat.category,
                        value: stat.amount,
                        color: UtilsModule.getCategoryColor(stat.category)
                    }))
                }
            };
        },
        getDefaultCategories: function(type = null) {
            if (type && config.DEFAULT_CATEGORIES[type]) {
                return [...config.DEFAULT_CATEGORIES[type]];
            }
            return {
                income: [...config.DEFAULT_CATEGORIES.income],
                expense: [...config.DEFAULT_CATEGORIES.expense]
            };
        },
        addCustomCategory: function(category, type) {
            if (!category || !type) return false;
            if (!config.DEFAULT_CATEGORIES[type]) {
                config.DEFAULT_CATEGORIES[type] = [];
            }
            if (!config.DEFAULT_CATEGORIES[type].includes(category)) {
                config.DEFAULT_CATEGORIES[type].push(category);
                return true;
            }
            return false;
        },
        cloneUser: function(user) {
            return this.createUser(user.toStorageFormat());
        },
        cloneTransaction: function(transaction, newUserId = null) {
            const data = transaction.toStorageFormat();
            if (newUserId) {
                data.userId = newUserId;
            }
            return this.createTransaction(data, data.userId);
        },
        getInfo: function() {
            return {
                name: 'ObjectFactory',
                version: '1.0.0',
                supportedTypes: ['User', 'Transaction'],
                defaultCategories: this.getDefaultCategories()
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectFactory;
} else {
    window.ObjectFactory = ObjectFactory;
}
