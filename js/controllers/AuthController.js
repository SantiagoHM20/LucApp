const AuthController = (function() {
    'use strict';
    let authView;
    let storageModule;
    let validatorModule;
    let objectFactory;
    let currentUser = null;
    let isInitialized = false;
    function validateDependencies() {
        const required = {
            AuthView: typeof AuthView !== 'undefined',
            StorageModule: typeof StorageModule !== 'undefined',
            ValidatorModule: typeof ValidatorModule !== 'undefined',
            ObjectFactory: typeof ObjectFactory !== 'undefined'
        };
        const missing = Object.keys(required).filter(dep => !required[dep]);
        if (missing.length > 0) {
            throw new Error(`Dependencias faltantes en AuthController: ${missing.join(', ')}`);
        }
    }
    function validateMinimalDependencies() {
        const required = {
            StorageModule: typeof StorageModule !== 'undefined',
            ObjectFactory: typeof ObjectFactory !== 'undefined'
        };
        const missing = Object.keys(required).filter(dep => !required[dep]);
        if (missing.length > 0) {
            throw new Error(`Dependencias mínimas faltantes en AuthController: ${missing.join(', ')}`);
        }
    }
    function initializeDependencies() {
        authView = AuthView.init();
        storageModule = StorageModule;
        validatorModule = ValidatorModule;
        objectFactory = ObjectFactory;
    }
    function initializeMinimalDependencies() {
        storageModule = StorageModule;
        objectFactory = ObjectFactory;
    }
    function setupEventListeners() {
        authView.onSubmit(handleLogin, 'login');
        authView.onSubmit(handleRegister, 'register');
        authView.onBackButton(handleBackButton);
        setupRealTimeValidation();
    }
    function setupRealTimeValidation() {
        const validationFields = ['username', 'email', 'password', 'confirmPassword'];
        validationFields.forEach(fieldName => {
            authView.onFieldChange(fieldName, function() {
                authView.clearMessages();
                const formData = authView.getFormData('register');
                if (formData && formData[fieldName]) {
                    validateSingleField(fieldName, formData[fieldName], formData);
                }
            });
        });
    }
    function validateSingleField(fieldName, value, allData = {}) {
        let validationResult;
        switch (fieldName) {
            case 'username':
                validationResult = validatorModule.validateUsername(value);
                break;
            case 'email':
                validationResult = validatorModule.validateEmail(value);
                break;
            case 'password':
                validationResult = validatorModule.validatePassword(value);
                break;
            case 'confirmPassword':
                validationResult = validatorModule.validatePasswordMatch(allData.password, value);
                break;
            default:
                return;
        }
        if (!validationResult.isValid) {
            authView.showValidationErrors({ [fieldName]: validationResult });
        }
    }
    function handleLogin(event) {
        event.preventDefault();
        authView.setLoading(true);
        authView.clearMessages();
        const formData = authView.getFormData('login');
        if (!formData) {
            console.error('[AuthController] No se pudieron obtener datos del formulario');
            authView.setLoading(false);
            authView.showError('Error al obtener datos del formulario');
            return;
        }
        if (!formData.username || !formData.password) {
            authView.setLoading(false);
            authView.showError('Usuario y contraseña son requeridos');
            return;
        }
        try {
            const user = storageModule.findUser(formData.username);
            if (!user) {
                authView.setLoading(false);
                authView.showError('Usuario no encontrado');
                return;
            }
            if (user.password !== formData.password) {
                authView.setLoading(false);
                authView.showError('Contraseña incorrecta');
                return;
            }
            try {
                currentUser = objectFactory.createUser(user);
            } catch (factoryError) {
                console.warn('Usuario con formato anterior, migrando...', user);
                const migratedUser = {
                    id: user.id || user.username || `user_${Date.now()}`,
                    username: user.username,
                    email: user.email || `${user.username}@email.com`,
                    password: user.password,
                    fullName: user.fullName || user.name || user.username,
                    firstName: user.firstName || user.fullName?.split(' ')[0] || user.username,
                    lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
                    createdAt: user.createdAt || new Date().toISOString(),
                    lastLogin: user.lastLogin || null,
                    isActive: user.isActive !== false
                };
                currentUser = objectFactory.createUser(migratedUser);
                storageModule.saveUser(currentUser.toStorageFormat());
            }
            currentUser.updateLastLogin();
            storageModule.saveUser(currentUser.toStorageFormat());
            const rememberMe = formData.remember === 'on';
            storageModule.saveCurrentUser(currentUser.toStorageFormat(), rememberMe);
            authView.setLoading(false);
            authView.showSuccess('Iniciando sesión...');
            setTimeout(() => {
                authView.redirect('../pages/dashboard.html');
            }, 1000);
        } catch (error) {
            console.error('Error en login:', error);
            authView.setLoading(false);
            authView.showError('Error interno. Intenta nuevamente.');
        }
    }
    function handleRegister(event) {
        event.preventDefault();
        authView.setLoading(true);
        authView.clearMessages();
        const formData = authView.getFormData('register');
        if (!formData) {
            console.error('[AuthController] No se pudieron obtener datos del formulario');
            authView.setLoading(false);
            authView.showError('Error al obtener datos del formulario');
            return;
        }
        try {
            if (!formData.acceptTerms) {
                authView.setLoading(false);
                authView.showError('Debes aceptar los términos y condiciones');
                return;
            }
            const sanitizedData = validatorModule.sanitizeUserInput(formData);
            const validationResults = validatorModule.validateUser({
                ...sanitizedData,
                confirmPassword: formData.confirmPassword
            });
            if (!validationResults.isValid) {
                authView.setLoading(false);
                authView.showValidationErrors(validationResults);
                return;
            }
            if (storageModule.userExists(sanitizedData.username)) {
                authView.setLoading(false);
                authView.showError('El nombre de usuario ya está en uso');
                return;
            }
            if (storageModule.emailExists(sanitizedData.email)) {
                authView.setLoading(false);
                authView.showError('El email ya está registrado');
                return;
            }
            const newUser = objectFactory.createUserFromRegistration(sanitizedData);
            if (!storageModule.saveUser(newUser.toStorageFormat())) {
                console.error('[AuthController] Error guardando usuario');
                authView.setLoading(false);
                authView.showError('Error al guardar usuario. Intenta nuevamente.');
                return;
            }
            currentUser = newUser;
            storageModule.saveCurrentUser(currentUser.toStorageFormat(), false);
            authView.setLoading(false);
            authView.showSuccess('Usuario registrado exitosamente. Redirigiendo...');
            setTimeout(() => {
                authView.redirect('../pages/dashboard.html');
            }, 1500);
        } catch (error) {
            console.error('[AuthController] Error en registro:', error);
            authView.setLoading(false);
            authView.showError('Error interno. Intenta nuevamente.');
        }
    }
    function handleBackButton(event) {
        event.preventDefault();
        authView.redirect('../index.html');
    }
    return {
        init: function() {
            if (isInitialized) return this;
            try {
                validateDependencies();
                initializeDependencies();
                setupEventListeners();
                this.checkExistingSession();
                isInitialized = true;
                authView.focusFirstField();
                return this;
            } catch (error) {
                console.error('Error inicializando AuthController:', error);
                throw error;
            }
        },
        checkExistingSession: function() {
            const existingUser = storageModule.getCurrentUser();
            if (existingUser) {
                authView.redirect('../pages/dashboard.html');
                return true;
            }
            return false;
        },
        getCurrentUser: function() {
            return currentUser;
        },
        logout: function() {
            try {
                currentUser = null;
                if (storageModule) {
                    storageModule.clearCurrentUser();
                } else if (typeof StorageModule !== 'undefined') {
                    StorageModule.clearCurrentUser();
                }
                if (authView) {
                    authView.redirect('../index.html');
                } else {
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.error('Error durante logout:', error);
                window.location.href = '../index.html';
            }
        },
        requireAuth: function() {
            if (!storageModule) {
                try {
                    validateMinimalDependencies();
                    initializeMinimalDependencies();
                } catch (error) {
                    console.error('Error inicializando dependencias mínimas de AuthController:', error);
                    return null;
                }
            }
            const user = storageModule.getCurrentUser();
            if (!user) {
                if (!authView) {
                    window.location.href = '../pages/login.html';
                } else {
                    authView.redirect('../pages/login.html');
                }
                return null;
            }
            try {
                currentUser = objectFactory.createUser(user);
                return currentUser;
            } catch (error) {
                console.error('Error al cargar usuario:', error);
                this.logout();
                return null;
            }
        },
        isLoggedIn: function() {
            return !!storageModule.getCurrentUser();
        },
        getUserInfo: function() {
            if (currentUser) {
                return currentUser.toViewFormat();
            }
            return null;
        },
        createGuestSession: function() {
            try {
                const guestUser = objectFactory.createGuestUser();
                currentUser = guestUser;
                storageModule.saveCurrentUser(guestUser.toStorageFormat(), false);
                return guestUser;
            } catch (error) {
                console.error('Error creando sesión de invitado:', error);
                throw error;
            }
        },
        loginAsGuest: function() {
            const guestUser = this.createGuestSession();
            window.location.href = 'pages/dashboard.html';
            return guestUser;
        },
        changePassword: function(currentPassword, newPassword) {
            if (!currentUser) {
                throw new Error('No hay usuario logueado');
            }
            if (currentUser.password !== currentPassword) {
                throw new Error('Contraseña actual incorrecta');
            }
            const passwordValidation = validatorModule.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.message);
            }
            currentUser.password = newPassword;
            currentUser.updateLastModified();
            return storageModule.saveUser(currentUser.toStorageFormat());
        },
        getControllerInfo: function() {
            return {
                name: 'AuthController',
                isInitialized: isInitialized,
                currentUser: currentUser ? currentUser.toViewFormat() : null,
                isLoggedIn: this.isLoggedIn()
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthController;
} else {
    window.AuthController = AuthController;
}
