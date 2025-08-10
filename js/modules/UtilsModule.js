const UtilsModule = (function() {
    'use strict';
    const config = {
        CURRENCY: {
            SYMBOL: '$',
            LOCALE: 'es-CL',
            OPTIONS: {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        },
        DATE: {
            LOCALE: 'es-CL',
            TIMEZONE: 'America/Santiago'
        }
    };
    function isValidDate(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }
    function parseDate(dateString) {
        if (!dateString) return null;
        const parsed = new Date(dateString);
        return isValidDate(parsed) ? parsed : null;
    }
    return {
        formatCurrency: function(amount, showSymbol = true) {
            const numAmount = parseFloat(amount) || 0;
            if (!showSymbol) {
                return numAmount.toLocaleString(config.CURRENCY.LOCALE, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            }
            return numAmount.toLocaleString(config.CURRENCY.LOCALE, config.CURRENCY.OPTIONS);
        },
        formatAmount: function(amount) {
            return this.formatCurrency(amount, false);
        },
        parseCurrency: function(currencyString) {
            if (typeof currencyString === 'number') return currencyString;
            const cleaned = currencyString
                .toString()
                .replace(/[^\d,.-]/g, '')
                .replace(/,/g, '');
            return parseFloat(cleaned) || 0;
        },
        formatDate: function(date, options = {}) {
            const dateObj = parseDate(date);
            if (!dateObj) return '';
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            const formatOptions = Object.assign({}, defaultOptions, options);
            return dateObj.toLocaleDateString(config.DATE.LOCALE, formatOptions);
        },
        formatShortDate: function(date) {
            return this.formatDate(date, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },
        formatDateForInput: function(date) {
            const dateObj = parseDate(date);
            if (!dateObj) return '';
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        formatDateTime: function(date) {
            const dateObj = parseDate(date);
            if (!dateObj) return '';
            return dateObj.toLocaleString(config.DATE.LOCALE, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        getCurrentDate: function() {
            return new Date();
        },
        getCurrentMonth: function() {
            const now = new Date();
            return {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                monthName: now.toLocaleDateString(config.DATE.LOCALE, { month: 'long' }),
                firstDay: new Date(now.getFullYear(), now.getMonth(), 1),
                lastDay: new Date(now.getFullYear(), now.getMonth() + 1, 0)
            };
        },
        getMonthInfo: function(year, month) {
            const date = new Date(year, month - 1, 1);
            return {
                year: year,
                month: month,
                monthName: date.toLocaleDateString(config.DATE.LOCALE, { month: 'long' }),
                firstDay: new Date(year, month - 1, 1),
                lastDay: new Date(year, month, 0)
            };
        },
        isDateInMonth: function(date, year, month) {
            const dateObj = parseDate(date);
            if (!dateObj) return false;
            return dateObj.getFullYear() === year && 
                   (dateObj.getMonth() + 1) === month;
        },
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        generateUserId: function() {
            return 'user_' + this.generateId();
        },
        generateTransactionId: function() {
            return 'tx_' + this.generateId();
        },
        capitalize: function(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },
        capitalizeWords: function(str) {
            if (!str) return '';
            return str.split(' ')
                     .map(word => this.capitalize(word))
                     .join(' ');
        },
        truncate: function(str, maxLength = 50, suffix = '...') {
            if (!str || str.length <= maxLength) return str;
            return str.substring(0, maxLength - suffix.length) + suffix;
        },
        sortByDate: function(array, dateField = 'date', ascending = false) {
            return array.sort((a, b) => {
                const dateA = parseDate(a[dateField]);
                const dateB = parseDate(b[dateField]);
                if (!dateA || !dateB) return 0;
                return ascending ? dateA - dateB : dateB - dateA;
            });
        },
        sortByAmount: function(array, amountField = 'amount', ascending = false) {
            return array.sort((a, b) => {
                const amountA = parseFloat(a[amountField]) || 0;
                const amountB = parseFloat(b[amountField]) || 0;
                return ascending ? amountA - amountB : amountB - amountA;
            });
        },
        groupBy: function(array, keyField) {
            return array.reduce((groups, item) => {
                const key = item[keyField];
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(item);
                return groups;
            }, {});
        },
        calculateTotal: function(transactions, type = null) {
            return transactions
                .filter(tx => !type || tx.type === type)
                .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
        },
        calculateBalance: function(transactions) {
            const income = this.calculateTotal(transactions, 'income');
            const expenses = this.calculateTotal(transactions, 'expense');
            return income - expenses;
        },
        calculatePercentage: function(value, total) {
            if (total === 0) return 0;
            return Math.round((value / total) * 100);
        },
        getTypeColor: function(type) {
            const colors = {
                income: '#28a745',
                expense: '#dc3545'
            };
            return colors[type] || '#6c757d';
        },
        getCategoryColor: function(category) {
            let hash = 0;
            for (let i = 0; i < category.length; i++) {
                hash = category.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = Math.abs(hash) % 360;
            return `hsl(${hue}, 70%, 50%)`;
        },
        createElement: function(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            Object.keys(attributes).forEach(key => {
                element.setAttribute(key, attributes[key]);
            });
            if (content) {
                element.innerHTML = content;
            }
            return element;
        },
        addEventListeners: function(element, events) {
            Object.keys(events).forEach(eventType => {
                element.addEventListener(eventType, events[eventType]);
            });
        },
        redirect: function(url) {
            window.location.href = url;
        },
        goBack: function() {
            window.history.back();
        },
        updateCurrencyConfig: function(newConfig) {
            Object.assign(config.CURRENCY, newConfig);
        },
        updateDateConfig: function(newConfig) {
            Object.assign(config.DATE, newConfig);
        },
        getConfig: function() {
            return JSON.parse(JSON.stringify(config));
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UtilsModule;
} else {
    window.UtilsModule = UtilsModule;
}
