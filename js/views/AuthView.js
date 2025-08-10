const AuthView = (function() {
    'use strict';
    let elements = {};
    const config = {
        FORM_IDS: {
            login: 'loginForm',
            register: 'registerForm'
        },
        FIELD_IDS: {
            username: 'username',
            email: 'email',
            password: 'password',
            confirmPassword: 'confirmPassword',
            remember: 'remember'
        },
        ERROR_CLASS: 'error-message',
        SUCCESS_CLASS: 'success-message',
        LOADING_CLASS: 'loading'
    };
    function initializeElements() {
        elements.loginForm = document.getElementById(config.FORM_IDS.login);
        elements.registerForm = document.getElementById(config.FORM_IDS.register);
        Object.keys(config.FIELD_IDS).forEach(fieldName => {
            const fieldId = config.FIELD_IDS[fieldName];
            elements[fieldName] = document.getElementById(fieldId);
        });
        elements.messageContainer = document.querySelector('.message-container') || 
                                   document.querySelector('.alert') ||
                                   createMessageContainer();
        elements.submitButton = document.querySelector('button[type="submit"]');
        elements.backButton = document.querySelector('.back-button');
    }
    function createMessageContainer() {
        const container = document.createElement('div');
        container.className = 'message-container';
        container.style.marginBottom = '20px';
        const form = elements.loginForm || elements.registerForm;
        if (form) {
            form.insertBefore(container, form.firstChild);
        }
        return container;
    }
    function clearMessages() {
        if (elements.messageContainer) {
            elements.messageContainer.innerHTML = '';
        }
        const errorElements = document.querySelectorAll(`.${config.ERROR_CLASS}`);
        errorElements.forEach(element => element.remove());
    }
    function createMessageElement(message, type = 'error') {
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'} ${type === 'error' ? config.ERROR_CLASS : config.SUCCESS_CLASS}`;
        messageElement.textContent = message;
        return messageElement;
    }
    function showFieldError(fieldName, message) {
        const field = elements[fieldName];
        if (!field) return;
        const existingError = field.parentNode.querySelector(`.${config.ERROR_CLASS}`);
        if (existingError) {
            existingError.remove();
        }
        const errorElement = document.createElement('div');
        errorElement.className = config.ERROR_CLASS;
        errorElement.textContent = message;
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '5px';
        field.parentNode.insertBefore(errorElement, field.nextSibling);
        field.classList.add('is-invalid');
    }
    function clearFieldErrors() {
        Object.values(elements).forEach(element => {
            if (element && element.classList) {
                element.classList.remove('is-invalid');
            }
        });
        const fieldErrors = document.querySelectorAll(`.${config.ERROR_CLASS}`);
        fieldErrors.forEach(error => error.remove());
    }
    function setLoadingState(isLoading) {
        if (elements.submitButton) {
            elements.submitButton.disabled = isLoading;
            elements.submitButton.classList.toggle(config.LOADING_CLASS, isLoading);
            if (isLoading) {
                elements.submitButton.textContent = 'Procesando...';
            } else {
                const isLogin = elements.loginForm && !elements.loginForm.hidden;
                elements.submitButton.textContent = isLogin ? 'Iniciar Sesión' : 'Registrarse';
            }
        }
    }
    return {
        init: function() {
            initializeElements();
            this.clearMessages();
            return this;
        },
        showError: function(message) {
            clearMessages();
            if (elements.messageContainer) {
                const errorElement = createMessageElement(message, 'error');
                elements.messageContainer.appendChild(errorElement);
            }
        },
        showSuccess: function(message) {
            clearMessages();
            if (elements.messageContainer) {
                const successElement = createMessageElement(message, 'success');
                elements.messageContainer.appendChild(successElement);
            }
        },
        clearMessages: function() {
            clearMessages();
            clearFieldErrors();
        },
        showValidationErrors: function(validationResults) {
            clearFieldErrors();
            Object.keys(validationResults).forEach(fieldName => {
                const result = validationResults[fieldName];
                if (result && !result.isValid && result.message) {
                    showFieldError(fieldName, result.message);
                }
            });
        },
        getFormData: function(formType = 'login') {
            const form = formType === 'login' ? elements.loginForm : elements.registerForm;
            if (!form) return null;
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        },
        setFormData: function(data, formType = 'login') {
            Object.keys(data).forEach(fieldName => {
                const field = elements[fieldName];
                if (field && data[fieldName] !== undefined) {
                    field.value = data[fieldName];
                }
            });
        },
        clearForm: function(formType = 'login') {
            const form = formType === 'login' ? elements.loginForm : elements.registerForm;
            if (form) {
                form.reset();
            }
            this.clearMessages();
        },
        setLoading: function(isLoading) {
            setLoadingState(isLoading);
        },
        disable: function() {
            Object.values(elements).forEach(element => {
                if (element && element.disabled !== undefined) {
                    element.disabled = true;
                }
            });
        },
        enable: function() {
            Object.values(elements).forEach(element => {
                if (element && element.disabled !== undefined) {
                    element.disabled = false;
                }
            });
        },
        onSubmit: function(callback, formType = 'login') {
            const form = formType === 'login' ? elements.loginForm : elements.registerForm;
            if (form && callback) {
                form.addEventListener('submit', function(event) {
                    event.preventDefault();
                    callback(event);
                });
            }
        },
        onFieldChange: function(fieldName, callback) {
            const field = elements[fieldName];
            if (field && callback) {
                field.addEventListener('input', callback);
                field.addEventListener('blur', callback);
            }
        },
        onBackButton: function(callback) {
            if (elements.backButton && callback) {
                elements.backButton.addEventListener('click', callback);
            }
        },
        focusFirstField: function() {
            const firstInput = document.querySelector('input:not([type="hidden"])');
            if (firstInput) {
                firstInput.focus();
            }
        },
        showPasswordStrength: function(password) {
            const strength = this.calculatePasswordStrength(password);
            return strength;
        },
        calculatePasswordStrength: function(password) {
            if (!password) return 0;
            let strength = 0;
            if (password.length >= 8) strength += 20;
            if (password.length >= 12) strength += 10;
            if (/[a-z]/.test(password)) strength += 20;
            if (/[A-Z]/.test(password)) strength += 20;
            if (/[0-9]/.test(password)) strength += 20;
            if (/[^A-Za-z0-9]/.test(password)) strength += 10;
            return Math.min(strength, 100);
        },
        redirect: function(url, delay = 0) {
            if (delay > 0) {
                setTimeout(() => {
                    window.location.href = url;
                }, delay);
            } else {
                window.location.href = url;
            }
        },
        getViewInfo: function() {
            return {
                name: 'AuthView',
                elements: Object.keys(elements),
                hasLoginForm: !!elements.loginForm,
                hasRegisterForm: !!elements.registerForm
            };
        }
    };
})();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthView;
} else {
    window.AuthView = AuthView;
}
