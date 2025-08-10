const StorageModule = (function() {
    'use strict';
    const config = {
        PREFIX: 'lucapp',
        KEYS: {
            USERS: 'users',
            CURRENT_USER: 'current_user',
            TRANSACTIONS: 'transactions'
        }
    };
    function generateKey(type, userId = null) {
        const baseKey = `${config.PREFIX}_${type}`;
        return userId ? `${baseKey}_${userId}` : baseKey;
    }
    function safeStringify(obj) {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.error('Error al serializar objeto:', error);
            return null;
        }
    }
    function safeParse(str) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error('Error al parsear JSON:', error);
            return null;
        }
    }
    return {
        saveUser: function(user) {
            const users = this.getAllUsers();
            const existingIndex = users.findIndex(u => u.id === user.id);
            if (existingIndex !== -1) {
                users[existingIndex] = user;
            } else {
                users.push(user);
            }
            const key = generateKey(config.KEYS.USERS);
            const serialized = safeStringify(users);
            if (serialized) {
                localStorage.setItem(key, serialized);
                return true;
            }
            return false;
        },
        getAllUsers: function() {
            const key = generateKey(config.KEYS.USERS);
            const data = localStorage.getItem(key);
            return data ? safeParse(data) || [] : [];
        },
        findUser: function(usernameOrEmail) {
            const users = this.getAllUsers();
            const searchTerm = usernameOrEmail.toLowerCase();
            return users.find(user => 
                user.username.toLowerCase() === searchTerm || 
                user.email.toLowerCase() === searchTerm
            );
        },
        userExists: function(username) {
            const users = this.getAllUsers();
            return users.some(user => user.username.toLowerCase() === username.toLowerCase());
        },
        emailExists: function(email) {
            const users = this.getAllUsers();
            return users.some(user => user.email.toLowerCase() === email.toLowerCase());
        },
        saveCurrentUser: function(user, remember = false) {
            const key = generateKey(config.KEYS.CURRENT_USER);
            const serialized = safeStringify(user);
            if (serialized) {
                if (remember) {
                    localStorage.setItem(key, serialized);
                } else {
                    sessionStorage.setItem(key, serialized);
                }
                return true;
            }
            return false;
        },
        getCurrentUser: function() {
            const key = generateKey(config.KEYS.CURRENT_USER);
            let data = localStorage.getItem(key);
            if (!data) {
                data = sessionStorage.getItem(key);
            }
            return data ? safeParse(data) : null;
        },
        clearCurrentUser: function() {
            const key = generateKey(config.KEYS.CURRENT_USER);
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        },
        saveTransactions: function(transactions, userId) {
            const key = generateKey(config.KEYS.TRANSACTIONS, userId);
            const serialized = safeStringify(transactions);
            if (serialized) {
                localStorage.setItem(key, serialized);
                return true;
            }
            return false;
        },
        getTransactions: function(userId) {
            const key = generateKey(config.KEYS.TRANSACTIONS, userId);
            const data = localStorage.getItem(key);
            return data ? safeParse(data) || [] : [];
        },
        clearUserTransactions: function(userId) {
            const key = generateKey(config.KEYS.TRANSACTIONS, userId);
            localStorage.removeItem(key);
        },
        getAllTransactionKeys: function() {
            const keys = Object.keys(localStorage);
            return keys.filter(key => key.includes(`${config.PREFIX}_${config.KEYS.TRANSACTIONS}`));
        },
        clearAllTransactions: function() {
            const keys = this.getAllTransactionKeys();
            keys.forEach(key => localStorage.removeItem(key));
        },
        clearAllData: function() {
            const keys = Object.keys(localStorage);
            const lucappKeys = keys.filter(key => key.startsWith(config.PREFIX));
            lucappKeys.forEach(key => localStorage.removeItem(key));
        },
        getStorageInfo: function() {
            const keys = Object.keys(localStorage);
            const lucappKeys = keys.filter(key => key.startsWith(config.PREFIX));
            const info = {
                totalKeys: lucappKeys.length,
                users: this.getAllUsers().length,
                currentUser: this.getCurrentUser(),
                transactionKeys: this.getAllTransactionKeys()
            };
            return info;
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageModule;
} else {
    window.StorageModule = StorageModule;
}
