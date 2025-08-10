(function() {
    'use strict';
    const AppConfig = {
        NAME: 'LucApp',
        VERSION: '2.0.0',
        DEBUG: false,
        PAGES: {
            INDEX: '../index.html',
            LOGIN: './login.html',
            REGISTER: './register.html',
            DASHBOARD: './dashboard.html',
            STATISTICS: './statistics.html',
            ADD_TRANSACTION: './add-transaction.html'
        }
    };
    const AppState = {
        isInitialized: false,
        currentPage: null,
        currentController: null,
        user: null
    };
    function log(message, type = 'info', data = null) {
        if (!AppConfig.DEBUG && type === 'debug') return;
        const timestamp = new Date().toISOString();
        const prefix = `[${AppConfig.NAME}] [${timestamp}] [${type.toUpperCase()}]`;
        switch (type) {
            case 'error':
                console.error(prefix, message, data || '');
                break;
            case 'warn':
                console.warn(prefix, message, data || '');
                break;
            case 'debug':
                console.debug(prefix, message, data || '');
                break;
            default:
        }
    }
    function getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        switch (fileName) {
            case 'index.html':
            case '':
                return 'index';
            case 'login.html':
                return 'login';
            case 'register.html':
                return 'register';
            case 'dashboard.html':
                return 'dashboard';
            case 'statistics.html':
                return 'statistics';
            case 'add-transaction.html':
                return 'add-transaction';
            default:
                return 'unknown';
        }
    }
    function checkDependencies() {
        const requiredForAllPages = [];
        const pageSpecificDeps = {
            login: ['AuthController', 'AuthView'],
            register: ['AuthController', 'AuthView'],
            dashboard: ['DashboardController', 'DashboardView', 'TransactionController'],
            statistics: ['StatisticsController', 'StatisticsView', 'TransactionController'],
            'add-transaction': ['TransactionController', 'AuthController']
        };
        const currentPage = AppState.currentPage;
        const requiredDeps = [
            ...requiredForAllPages,
            ...(pageSpecificDeps[currentPage] || [])
        ];
        const missingDeps = requiredDeps.filter(dep => typeof window[dep] === 'undefined');
        if (missingDeps.length > 0) {
            log(`Dependencias faltantes para la página ${currentPage}:`, 'error', missingDeps);
            return false;
        }
        return true;
    }
    function handleGlobalErrors() {
        window.addEventListener('error', function(event) {
            log('Error global:', 'error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        window.addEventListener('unhandledrejection', function(event) {
            log('Promise rechazada no manejada:', 'error', event.reason);
        });
    }
    function initializePage() {
        const currentPage = AppState.currentPage;
        log(`Inicializando página: ${currentPage}`, 'info');
        try {
            switch (currentPage) {
                case 'login':
                case 'register':
                    if (typeof AuthController !== 'undefined') {
                        AppState.currentController = AuthController.init();
                        log('AuthController inicializado', 'debug');
                    }
                    break;
                case 'dashboard':
                    if (typeof DashboardController !== 'undefined') {
                        AppState.currentController = DashboardController.init();
                        log('DashboardController inicializado', 'debug');
                    }
                    break;
                case 'statistics':
                    initializeStatisticsPage();
                    break;
                case 'add-transaction':
                    initializeAddTransactionPage();
                    break;
                case 'index':
                    initializeIndexPage();
                    break;
                default:
                    log(`Página no reconocida: ${currentPage}`, 'warn');
            }
        } catch (error) {
            log('Error inicializando página:', 'error', error);
            showErrorMessage('Error inicializando la aplicación');
        }
    }
    function initializeIndexPage() {
        const guestButton = document.querySelector('.guest-button');
        const loginButton = document.querySelector('.login-button');
        const registerButton = document.querySelector('.register-button');
        if (guestButton) {
            guestButton.addEventListener('click', function() {
                try {
                    if (typeof AuthController !== 'undefined') {
                        const guestUser = AuthController.createGuestSession();
                        log('Sesión de invitado creada', 'info');
                        window.location.href = AppConfig.PAGES.DASHBOARD;
                    } else {
                        throw new Error('AuthController no disponible');
                    }
                } catch (error) {
                    log('Error creando sesión de invitado:', 'error', error);
                    alert('Error al iniciar sesión como invitado');
                }
            });
        }
        if (loginButton) {
            loginButton.addEventListener('click', function() {
                window.location.href = AppConfig.PAGES.LOGIN;
            });
        }
        if (registerButton) {
            registerButton.addEventListener('click', function() {
                window.location.href = AppConfig.PAGES.REGISTER;
            });
        }
        log('Página de inicio configurada', 'debug');
    }
    function initializeAddTransactionPage() {
        try {
            if (typeof AuthController !== 'undefined') {
                AppState.user = AuthController.requireAuth();
                if (!AppState.user) {
                    return;
                }
            }
            if (typeof TransactionController !== 'undefined' && AppState.user) {
                TransactionController.init(AppState.user);
                log('TransactionController inicializado para add-transaction', 'debug');
            }
            const volverBtn = document.querySelector('.btn-volver');
            if (volverBtn) {
                volverBtn.addEventListener('click', function(event) {
                    event.preventDefault();
                    window.history.back();
                });
            }
            const logoutBtn = document.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(event) {
                    event.preventDefault();
                    if (typeof AuthController !== 'undefined') {
                        AuthController.logout();
                    } else {
                        window.location.href = '../index.html';
                    }
                });
            }
            setupTransactionForm();
            log('Página de agregar transacción configurada', 'debug');
        } catch (error) {
            log('Error inicializando página de transacciones:', 'error', error);
            showErrorMessage('Error cargando formulario de transacción');
        }
    }
    function initializeStatisticsPage() {
        try {
            if (typeof AuthController !== 'undefined') {
                AppState.user = AuthController.requireAuth();
                if (!AppState.user) {
                    return;
                }
            }
            const volverBtn = document.querySelector('.btn-volver');
            if (volverBtn) {
                volverBtn.addEventListener('click', function(event) {
                    event.preventDefault();
                    window.history.back();
                });
            }
            const balanceTab = document.querySelector('.tab:not(.active)');
            if (balanceTab && balanceTab.textContent.trim() === 'Balance') {
                balanceTab.addEventListener('click', function(event) {
                    event.preventDefault();
                    window.location.href = '../pages/dashboard.html';
                });
            }
            const logoutBtn = document.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(event) {
                    event.preventDefault();
                    if (typeof AuthController !== 'undefined') {
                        AuthController.logout();
                    } else {
                        window.location.href = '../index.html';
                    }
                });
            }
            if (typeof StatisticsController !== 'undefined') {
                AppState.currentController = StatisticsController.init();
                log('StatisticsController inicializado', 'debug');
            }
            log('Página de estadísticas configurada', 'debug');
        } catch (error) {
            log('Error inicializando página de estadísticas:', 'error', error);
            showErrorMessage('Error cargando página de estadísticas');
        }
    }
    function setupTransactionForm() {
        const form = document.querySelector('#transaction-form');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            try {
                if (typeof TransactionController === 'undefined') {
                    throw new Error('TransactionController no disponible');
                }
                const formData = new FormData(form);
                const transactionData = {
                    description: formData.get('descripcion'),
                    amount: parseFloat(formData.get('cantidad')),
                    type: formData.get('categoria') === 'Ingreso' ? 'income' : 'expense',
                    category: formData.get('descripcion'),
                    date: formData.get('fecha')
                };
                if (!transactionData.description || !transactionData.amount || !transactionData.date) {
                    throw new Error('Todos los campos son requeridos');
                }
                if (transactionData.amount <= 0) {
                    throw new Error('La cantidad debe ser mayor a 0');
                }
                const result = TransactionController.createTransaction(transactionData);
                if (result.success) {
                    log('Transacción creada exitosamente', 'info');
                    showSuccessMessage('Transacción guardada exitosamente');
                    form.reset();
                    setTimeout(() => {
                        window.location.href = '../pages/dashboard.html';
                    }, 1500);
                } else {
                    throw new Error(result.message || 'Error desconocido al crear transacción');
                }
            } catch (error) {
                log('Error procesando formulario:', 'error', error);
                showErrorMessage('Error al guardar la transacción: ' + error.message);
            }
        });
        const cancelBtn = document.querySelector('.btn-cancelar');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(event) {
                event.preventDefault();
                window.history.back();
            });
        }
        log('Formulario de transacciones configurado correctamente', 'debug');
    }
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 10px 15px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; max-width: 300px;';
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.textContent = message;
        successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 10px 15px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; max-width: 300px;';
        document.body.appendChild(successDiv);
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    function setupGlobalNavigation() {
        const backButtons = document.querySelectorAll('.back-button, .btn-volver');
        backButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                window.history.back();
            });
        });
        const logoutButtons = document.querySelectorAll('.logout-button, #logout-btn');
        logoutButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                if (typeof AuthController !== 'undefined') {
                    AuthController.logout();
                } else {
                    window.location.href = AppConfig.PAGES.INDEX;
                }
            });
        });
    }
    function initializeApp() {
        if (AppState.isInitialized) {
            log('La aplicación ya está inicializada', 'warn');
            return;
        }
        log(`Iniciando ${AppConfig.NAME} v${AppConfig.VERSION}`, 'info');
        handleGlobalErrors();
        AppState.currentPage = getCurrentPageName();
        if (!checkDependencies()) {
            showErrorMessage('Error: Dependencias faltantes');
            return;
        }
        setupGlobalNavigation();
        initializePage();
        AppState.isInitialized = true;
        log('Aplicación inicializada correctamente', 'info');
        if (AppConfig.DEBUG) {
            window.LucAppDebug = {
                config: AppConfig,
                state: AppState,
                log: log
            };
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
    window.LucApp = {
        init: initializeApp,
        version: AppConfig.VERSION,
        name: AppConfig.NAME,
        getCurrentPage: () => AppState.currentPage,
        getCurrentController: () => AppState.currentController
    };
})();
