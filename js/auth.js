class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    init() {
        this.checkActiveSession();
    }
    checkActiveSession() {
        let userData = localStorage.getItem('lucapp_current_user');
        if (!userData) {
            userData = sessionStorage.getItem('lucapp_current_user');
        }
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                return true;
            } catch (error) {
                console.error('Error al recuperar sesión:', error);
                localStorage.removeItem('lucapp_current_user');
                sessionStorage.removeItem('lucapp_current_user');
            }
        }
        return false;
    }
    async register(userData) {
        try {
            const validation = this.validateUserData(userData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }
            if (this.userExists(userData.username)) {
                throw new Error('El nombre de usuario ya está en uso');
            }
            if (this.emailExists(userData.email)) {
                throw new Error('El correo electrónico ya está registrado');
            }
            const newUser = {
                id: this.generateUserId(),
                username: userData.username.toLowerCase().trim(),
                email: userData.email.toLowerCase().trim(),
                fullName: userData.fullName.trim(),
                password: this.hashPassword(userData.password),
                createdAt: new Date().toISOString(),
                lastLogin: null,
                avatar: null
            };
            this.saveUser(newUser);
            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    fullName: newUser.fullName
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    async login(username, password, rememberMe = false) {
        try {
            const user = this.findUser(username);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            if (!this.verifyPassword(password, user.password)) {
                throw new Error('Contraseña incorrecta');
            }
            user.lastLogin = new Date().toISOString();
            this.updateUser(user);
            this.currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName
            };
            if (rememberMe) {
                localStorage.setItem('lucapp_current_user', JSON.stringify(this.currentUser));
            } else {
                sessionStorage.setItem('lucapp_current_user', JSON.stringify(this.currentUser));
            }
            return {
                success: true,
                message: 'Inicio de sesión exitoso',
                user: this.currentUser
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    logout() {
        this.currentUser = null;
        localStorage.removeItem('lucapp_current_user');
        sessionStorage.removeItem('lucapp_current_user');
        window.location.href = '../index.html';
    }
    getCurrentUser() {
        return this.currentUser;
    }
    isLoggedIn() {
        return this.currentUser !== null;
    }
    validateUserData(userData) {
        if (!userData.username || userData.username.trim().length < 3) {
            return { isValid: false, message: 'El usuario debe tener al menos 3 caracteres' };
        }
        if (!userData.email || !this.isValidEmail(userData.email)) {
            return { isValid: false, message: 'Ingrese un correo electrónico válido' };
        }
        if (!userData.password || userData.password.length < 6) {
            return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }
        if (!userData.fullName || userData.fullName.trim().length < 2) {
            return { isValid: false, message: 'Ingrese un nombre válido' };
        }
        return { isValid: true };
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    userExists(username) {
        const users = this.getAllUsers();
        return users.some(user => user.username.toLowerCase() === username.toLowerCase());
    }
    emailExists(email) {
        const users = this.getAllUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }
    findUser(usernameOrEmail) {
        const users = this.getAllUsers();
        const searchTerm = usernameOrEmail.toLowerCase();
        return users.find(user => 
            user.username.toLowerCase() === searchTerm || 
            user.email.toLowerCase() === searchTerm
        );
    }
    getAllUsers() {
        const users = localStorage.getItem('lucapp_users');
        return users ? JSON.parse(users) : [];
    }
    saveUser(user) {
        const users = this.getAllUsers();
        users.push(user);
        localStorage.setItem('lucapp_users', JSON.stringify(users));
    }
    updateUser(updatedUser) {
        const users = this.getAllUsers();
        const index = users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem('lucapp_users', JSON.stringify(users));
        }
    }
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }
}
const authManager = new AuthManager();
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';
        if (!username || !password) {
            showError('Por favor complete todos los campos');
            return;
        }
        const submitBtn = this.querySelector('.btn-submit');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        try {
            const result = await authManager.login(username, password, rememberMe);
            if (result.success) {
                showSuccess('Inicio de sesión exitoso. Redirigiendo...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showError(result.message);
            }
        } catch (error) {
            showError('Error inesperado. Inténtelo nuevamente.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.className = 'error-message show';
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.className = 'success-message show';
    }
}
function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
    confirmPasswordInput.addEventListener('input', function() {
        if (this.value && this.value !== passwordInput.value) {
            this.setCustomValidity('Las contraseñas no coinciden');
        } else {
            this.setCustomValidity('');
        }
    });
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const userData = {
            fullName: formData.get('fullName').trim(),
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        if (userData.password !== userData.confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }
        if (!formData.get('acceptTerms')) {
            showError('Debe aceptar los términos y condiciones');
            return;
        }
        const submitBtn = this.querySelector('.btn-submit');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        try {
            const result = await authManager.register(userData);
            if (result.success) {
                showSuccess('Cuenta creada exitosamente. Iniciando sesión...');
                setTimeout(async () => {
                    const loginResult = await authManager.login(userData.username, userData.password, true);
                    if (loginResult.success) {
                        window.location.href = 'dashboard.html';
                    } else {
                        showError('Usuario creado, pero error al iniciar sesión automática. Redirigiendo...');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    }
                }, 1000);
            } else {
                showError(result.message);
            }
        } catch (error) {
            showError('Error inesperado. Inténtelo nuevamente.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.className = 'error-message show';
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.className = 'success-message show';
    }
}
function requireAuth() {
    if (!authManager.isLoggedIn()) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}
function getUserDataKey(key) {
    const user = authManager.getCurrentUser();
    if (user) {
        return `${user.id}_${key}`;
    }
    return key;
}
window.authManager = authManager;
window.initLoginPage = initLoginPage;
window.initRegisterPage = initRegisterPage;
window.requireAuth = requireAuth;
window.getUserDataKey = getUserDataKey;
