const TransactionModel = (function() {
    'use strict';
    class Transaction {
        constructor(data = {}) {
            this.id = data.id || null;
            this.description = data.description || '';
            this.amount = data.amount || 0;
            this.category = data.category || '';
            this.date = data.date ? new Date(data.date) : new Date();
            this.userId = data.userId || null;
            this.createdAt = data.createdAt || new Date().toISOString();
        }
        validate() {
            const errors = [];
            if (!this.description || this.description.trim().length < 1) {
                errors.push('La descripción es requerida');
            }
            if (!this.amount || isNaN(this.amount) || this.amount <= 0) {
                errors.push('El monto debe ser un número positivo');
            }
            if (!this.category || (this.category !== 'Ingreso' && this.category !== 'Gasto')) {
                errors.push('La categoría debe ser "Ingreso" o "Gasto"');
            }
            if (!this.date || isNaN(this.date.getTime())) {
                errors.push('La fecha es inválida');
            }
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }
        toStorageFormat() {
            return {
                id: this.id,
                description: this.description.trim(),
                amount: parseFloat(this.amount),
                category: this.category,
                date: this.date.toISOString(),
                userId: this.userId,
                createdAt: this.createdAt
            };
        }
        toViewFormat() {
            return {
                id: this.id,
                description: this.description,
                amount: this.amount,
                category: this.category,
                date: this.date,
                formattedDate: this.formatDate(),
                formattedAmount: this.formatAmount(),
                isIncome: this.category === 'Ingreso',
                isExpense: this.category === 'Gasto'
            };
        }
        formatDate() {
            return this.date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
        formatAmount() {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(this.amount);
        }
        belongsToMonth(month, year) {
            return this.date.getMonth() === month && this.date.getFullYear() === year;
        }
        isCurrentMonth() {
            const now = new Date();
            return this.belongsToMonth(now.getMonth(), now.getFullYear());
        }
        clone() {
            return new Transaction({
                id: this.id,
                description: this.description,
                amount: this.amount,
                category: this.category,
                date: new Date(this.date),
                userId: this.userId,
                createdAt: this.createdAt
            });
        }
        setId(id) {
            this.id = id;
        }
        setUserId(userId) {
            this.userId = userId;
        }
    }
    return {
        create: function(data) {
            return new Transaction(data);
        },
        fromStorageData: function(data) {
            return new Transaction(data);
        },
        fromFormData: function(formData, userId = null) {
            return new Transaction({
                description: formData.get('descripcion'),
                amount: parseFloat(formData.get('cantidad')),
                category: formData.get('categoria'),
                date: new Date(formData.get('fecha')),
                userId: userId
            });
        },
        CATEGORIES: {
            INCOME: 'Ingreso',
            EXPENSE: 'Gasto'
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionModel;
} else {
    window.TransactionModel = TransactionModel;
    window.Transaction = TransactionModel;
}
