const UserModel = (function() {
    'use strict';
    class User {
        constructor(data = {}) {
            this.id = data.id || null;
            this.username = data.username || '';
            this.email = data.email || '';
            this.fullName = data.fullName || '';
            this.password = data.password || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.lastLogin = data.lastLogin || null;
            this.avatar = data.avatar || null;
        }
        validate() {
            const errors = [];
            if (!this.username || this.username.trim().length < 3) {
                errors.push('El usuario debe tener al menos 3 caracteres');
            }
            if (!this.email || !this.isValidEmail(this.email)) {
                errors.push('Ingrese un correo electrónico válido');
            }
            if (!this.password || this.password.length < 6) {
                errors.push('La contraseña debe tener al menos 6 caracteres');
            }
            if (!this.fullName || this.fullName.trim().length < 2) {
                errors.push('Ingrese un nombre válido');
            }
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
        toStorageFormat() {
            return {
                id: this.id,
                username: this.username.toLowerCase().trim(),
                email: this.email.toLowerCase().trim(),
                fullName: this.fullName.trim(),
                password: this.password,
                createdAt: this.createdAt,
                lastLogin: this.lastLogin,
                avatar: this.avatar
            };
        }
        toViewFormat() {
            return {
                id: this.id,
                username: this.username,
                email: this.email,
                fullName: this.fullName,
                createdAt: this.createdAt,
                lastLogin: this.lastLogin,
                avatar: this.avatar
            };
        }
        updateLastLogin() {
            this.lastLogin = new Date().toISOString();
        }
        isValidForLogin() {
            return this.id && this.username && this.password;
        }
    }
    return {
        create: function(data) {
            return new User(data);
        },
        fromStorageData: function(data) {
            return new User(data);
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserModel;
} else {
    window.UserModel = UserModel;
    window.User = UserModel;
}
