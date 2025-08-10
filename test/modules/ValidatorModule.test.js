describe('ValidatorModule', () => {
  let ValidatorModule;

  beforeAll(() => {
    eval(`
      const ValidatorModule = (function() {
        'use strict';
        const config = {
          USERNAME: {
            MIN_LENGTH: 3,
            MAX_LENGTH: 20,
            PATTERN: /^[a-zA-Z0-9_]+$/
          },
          EMAIL: {
            PATTERN: /^[^\\s@]+@[^\\s@]+\\.[a-zA-Z]{2,}$/,
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
        
        return {
          validateUsername: function(username) {
            const sanitized = sanitizeString(username);
            
            if (!sanitized) {
              return createError('username', 'El nombre de usuario es requerido');
            }
            
            if (sanitized.length < config.USERNAME.MIN_LENGTH) {
              return createError('username', \`El nombre de usuario debe tener al menos \${config.USERNAME.MIN_LENGTH} caracteres\`);
            }
            
            if (sanitized.length > config.USERNAME.MAX_LENGTH) {
              return createError('username', \`El nombre de usuario no puede exceder \${config.USERNAME.MAX_LENGTH} caracteres\`);
            }
            
            if (!config.USERNAME.PATTERN.test(sanitized)) {
              return createError('username', 'El nombre de usuario solo puede contener letras, números y guiones bajos');
            }
            
            return createSuccess('username');
          },
          
          validateEmail: function(email) {
            const sanitized = sanitizeString(email);
            
            if (!sanitized) {
              return createError('email', 'El email es requerido');
            }
            
            if (sanitized.length > config.EMAIL.MAX_LENGTH) {
              return createError('email', \`El email no puede exceder \${config.EMAIL.MAX_LENGTH} caracteres\`);
            }
            
            if (!config.EMAIL.PATTERN.test(sanitized)) {
              return createError('email', 'El formato del email no es válido');
            }
            
            return createSuccess('email');
          },
          
          validatePassword: function(password) {
            if (!password) {
              return createError('password', 'La contraseña es requerida');
            }
            
            if (password.length < config.PASSWORD.MIN_LENGTH) {
              return createError('password', \`La contraseña debe tener al menos \${config.PASSWORD.MIN_LENGTH} caracteres\`);
            }
            
            if (password.length > config.PASSWORD.MAX_LENGTH) {
              return createError('password', \`La contraseña no puede exceder \${config.PASSWORD.MAX_LENGTH} caracteres\`);
            }
            
            return createSuccess('password');
          },
          
          validateAmount: function(amount) {
            const numAmount = parseFloat(amount);
            
            if (isNaN(numAmount)) {
              return createError('amount', 'El monto debe ser un número válido');
            }
            
            if (numAmount < config.AMOUNT.MIN) {
              return createError('amount', \`El monto mínimo es \${config.AMOUNT.MIN}\`);
            }
            
            if (numAmount > config.AMOUNT.MAX) {
              return createError('amount', \`El monto máximo es \${config.AMOUNT.MAX}\`);
            }
            
            return createSuccess('amount');
          },
          
          validateDescription: function(description) {
            const sanitized = sanitizeString(description);
            
            if (!sanitized) {
              return createError('description', 'La descripción es requerida');
            }
            
            if (sanitized.length < config.DESCRIPTION.MIN_LENGTH) {
              return createError('description', 'La descripción no puede estar vacía');
            }
            
            if (sanitized.length > config.DESCRIPTION.MAX_LENGTH) {
              return createError('description', \`La descripción no puede exceder \${config.DESCRIPTION.MAX_LENGTH} caracteres\`);
            }
            
            return createSuccess('description');
          }
        };
      })();
      global.ValidatorModule = ValidatorModule;
    `);
    ValidatorModule = global.ValidatorModule;
  });

  describe('validateUsername', () => {
    test('debería validar un username correcto', () => {
      const result = ValidatorModule.validateUsername('test_user123');
      
      expect(result.isValid).toBe(true);
      expect(result.field).toBe('username');
    });

    test('debería rechazar username vacío', () => {
      const result = ValidatorModule.validateUsername('');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('El nombre de usuario es requerido');
    });

    test('debería rechazar username muy corto', () => {
      const result = ValidatorModule.validateUsername('ab');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('al menos 3 caracteres');
    });

    test('debería rechazar username muy largo', () => {
      const result = ValidatorModule.validateUsername('a'.repeat(21));
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no puede exceder 20 caracteres');
    });

    test('debería rechazar caracteres especiales', () => {
      const result = ValidatorModule.validateUsername('test@user');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('solo puede contener letras, números y guiones bajos');
    });
  });

  describe('validateEmail', () => {
    test('debería validar un email correcto', () => {
      const result = ValidatorModule.validateEmail('test@example.com');
      
      expect(result.isValid).toBe(true);
    });

    test('debería rechazar email vacío', () => {
      const result = ValidatorModule.validateEmail('');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('El email es requerido');
    });

    test('debería rechazar formato de email inválido', () => {
      const result = ValidatorModule.validateEmail('invalid-email');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('El formato del email no es válido');
    });

    test('debería rechazar email muy largo', () => {
      const longEmail = 'a'.repeat(90) + '@test.com';
      const result = ValidatorModule.validateEmail(longEmail);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no puede exceder 100 caracteres');
    });
  });

  describe('validatePassword', () => {
    test('debería validar una contraseña correcta', () => {
      const result = ValidatorModule.validatePassword('password123');
      
      expect(result.isValid).toBe(true);
    });

    test('debería rechazar contraseña vacía', () => {
      const result = ValidatorModule.validatePassword('');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('La contraseña es requerida');
    });

    test('debería rechazar contraseña muy corta', () => {
      const result = ValidatorModule.validatePassword('12345');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('al menos 6 caracteres');
    });
  });

  describe('validateAmount', () => {
    test('debería validar un monto correcto', () => {
      const result = ValidatorModule.validateAmount('100.50');
      
      expect(result.isValid).toBe(true);
    });

    test('debería rechazar monto no numérico', () => {
      const result = ValidatorModule.validateAmount('abc');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('El monto debe ser un número válido');
    });

    test('debería rechazar monto muy pequeño', () => {
      const result = ValidatorModule.validateAmount('0');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('monto mínimo es 0.01');
    });

    test('debería rechazar monto muy grande', () => {
      const result = ValidatorModule.validateAmount('2000000');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('monto máximo es 1000000');
    });
  });

  describe('validateDescription', () => {
    test('debería validar una descripción correcta', () => {
      const result = ValidatorModule.validateDescription('Compra en supermercado');
      
      expect(result.isValid).toBe(true);
    });

    test('debería rechazar descripción vacía', () => {
      const result = ValidatorModule.validateDescription('');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('La descripción es requerida');
    });

    test('debería rechazar descripción muy larga', () => {
      const result = ValidatorModule.validateDescription('a'.repeat(201));
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no puede exceder 200 caracteres');
    });
  });
});
