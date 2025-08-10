const ValidatorModule = (function() {
    'use strict';
    const config = {
        USERNAME: {
            MIN_LENGTH: 3,
            MAX_LENGTH: 20,
            PATTERN: /^[a-zA-Z0-9_]+$/
        },
        EMAIL: {
            PATTERN: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
            MAX_LENGTH: 100
        },
        PASSWORD: {
            MIN_LENGTH: 6,
            MAX_LENGTH: 50
        },
        AMOUNT: {
            MIN: 0.01,
            MAX: 1000000,
            DECIMAL_PLACES: 2
        },
        DESCRIPTION: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 200
        }
    };
    function createError(field, message) {
        return {
            field: field,
            message: message,
            isValid: false
        };
    }
    function createSuccess(field) {
        return {
            field: field,
            isValid: true
        };
    }
    function sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim();
    }
    function isEmptyOrWhitespace(str) {
        return !str || str.trim().length === 0;
    }
    return {
        validateUsername: function(username) {
            const field = 'username';
            const clean = sanitizeString(username);
            if (isEmptyOrWhitespace(clean)) {
                return createError(field, 'El nombre de usuario es requerido');
            }
            if (clean.length < config.USERNAME.MIN_LENGTH) {
                return createError(field, `El nombre de usuario debe tener al menos ${config.USERNAME.MIN_LENGTH} caracteres`);
            }
            if (clean.length > config.USERNAME.MAX_LENGTH) {
                return createError(field, `El nombre de usuario no puede tener más de ${config.USERNAME.MAX_LENGTH} caracteres`);
            }
            if (!config.USERNAME.PATTERN.test(clean)) {
                return createError(field, 'El nombre de usuario solo puede contener letras, números y guiones bajos');
            }
            return createSuccess(field);
        },
        validateEmail: function(email) {
            const field = 'email';
            const clean = sanitizeString(email).toLowerCase();
            if (isEmptyOrWhitespace(clean)) {
                return createError(field, 'El email es requerido');
            }
            if (clean.length > config.EMAIL.MAX_LENGTH) {
                return createError(field, `El email no puede tener más de ${config.EMAIL.MAX_LENGTH} caracteres`);
            }
            const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
            const testPattern = /^[^\s@]+@[^\s@]+$/;
            if (!emailPattern.test(clean) && !testPattern.test(clean)) {
                return createError(field, 'El formato del email no es válido');
            }
            return createSuccess(field);
        },
        validatePassword: function(password) {
            const field = 'password';
            if (!password || password.length === 0) {
                return createError(field, 'La contraseña es requerida');
            }
            if (password.length < config.PASSWORD.MIN_LENGTH) {
                return createError(field, `La contraseña debe tener al menos ${config.PASSWORD.MIN_LENGTH} caracteres`);
            }
            if (password.length > config.PASSWORD.MAX_LENGTH) {
                return createError(field, `La contraseña no puede tener más de ${config.PASSWORD.MAX_LENGTH} caracteres`);
            }
            return createSuccess(field);
        },
        validatePasswordMatch: function(password, confirmPassword) {
            const field = 'confirmPassword';
            if (!confirmPassword || confirmPassword.length === 0) {
                return createError(field, 'Debes confirmar la contraseña');
            }
            if (password !== confirmPassword) {
                return createError(field, 'Las contraseñas no coinciden');
            }
            return createSuccess(field);
        },
        validateAmount: function(amount) {
            const field = 'amount';
            if (amount === null || amount === undefined || amount === '') {
                return createError(field, 'El monto es requerido');
            }
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount)) {
                return createError(field, 'El monto debe ser un número válido');
            }
            if (numAmount < config.AMOUNT.MIN) {
                return createError(field, `El monto debe ser mayor a ${config.AMOUNT.MIN}`);
            }
            if (numAmount > config.AMOUNT.MAX) {
                return createError(field, `El monto no puede ser mayor a ${config.AMOUNT.MAX.toLocaleString()}`);
            }
            const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
            if (decimalPlaces > config.AMOUNT.DECIMAL_PLACES) {
                return createError(field, `El monto no puede tener más de ${config.AMOUNT.DECIMAL_PLACES} decimales`);
            }
            return createSuccess(field);
        },
        validateDescription: function(description) {
            const field = 'description';
            const clean = sanitizeString(description);
            if (isEmptyOrWhitespace(clean)) {
                return createError(field, 'La descripción es requerida');
            }
            if (clean.length < config.DESCRIPTION.MIN_LENGTH) {
                return createError(field, `La descripción debe tener al menos ${config.DESCRIPTION.MIN_LENGTH} caracter`);
            }
            if (clean.length > config.DESCRIPTION.MAX_LENGTH) {
                return createError(field, `La descripción no puede tener más de ${config.DESCRIPTION.MAX_LENGTH} caracteres`);
            }
            return createSuccess(field);
        },
        validateType: function(type) {
            const field = 'type';
            const validTypes = ['income', 'expense'];
            if (!type) {
                return createError(field, 'El tipo de transacción es requerido');
            }
            if (!validTypes.includes(type)) {
                return createError(field, 'Tipo de transacción inválido');
            }
            return createSuccess(field);
        },
        validateCategory: function(category) {
            const field = 'category';
            const clean = sanitizeString(category);
            if (isEmptyOrWhitespace(clean)) {
                return createError(field, 'La categoría es requerida');
            }
            return createSuccess(field);
        },
        validateDate: function(date) {
            const field = 'date';
            if (!date) {
                return createError(field, 'La fecha es requerida');
            }
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return createError(field, 'La fecha no es válida');
            }
            const now = new Date();
            const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            if (dateObj > maxDate) {
                return createError(field, 'La fecha no puede ser superior a un año en el futuro');
            }
            return createSuccess(field);
        },
        validateUser: function(userData) {
            const results = {};
            results.username = this.validateUsername(userData.username);
            results.email = this.validateEmail(userData.email);
            results.password = this.validatePassword(userData.password);
            if (userData.confirmPassword !== undefined) {
                results.confirmPassword = this.validatePasswordMatch(userData.password, userData.confirmPassword);
            }
            results.isValid = Object.values(results).every(result => result.isValid);
            return results;
        },
        validateTransaction: function(transactionData) {
            const results = {};
            results.description = this.validateDescription(transactionData.description);
            results.amount = this.validateAmount(transactionData.amount);
            results.type = this.validateType(transactionData.type);
            results.category = this.validateCategory(transactionData.category);
            results.date = this.validateDate(transactionData.date);
            results.isValid = Object.values(results).every(result => result.isValid);
            return results;
        },
        sanitizeUserInput: function(userData) {
            return {
                username: sanitizeString(userData.username),
                email: sanitizeString(userData.email).toLowerCase(),
                password: userData.password
            };
        },
        sanitizeTransactionInput: function(transactionData) {
            return {
                description: sanitizeString(transactionData.description),
                amount: parseFloat(transactionData.amount) || 0,
                type: sanitizeString(transactionData.type),
                category: sanitizeString(transactionData.category),
                date: transactionData.date
            };
        },
        getConfig: function() {
            return JSON.parse(JSON.stringify(config));
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidatorModule;
} else {
    window.ValidatorModule = ValidatorModule;
}
