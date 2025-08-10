describe('UserModel', () => {
  let UserModel;

  beforeAll(() => {
    eval(`
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
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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
          
          updateLastLogin() {
            this.lastLogin = new Date().toISOString();
          }
          
          setId(id) {
            this.id = id;
          }
          
          static fromStorageFormat(data) {
            return new User(data);
          }
        }
        
        return {
          User: User,
          create: function(userData) {
            return new User(userData);
          },
          fromStorage: function(data) {
            return User.fromStorageFormat(data);
          }
        };
      })();
      global.UserModel = UserModel;
    `);
    UserModel = global.UserModel;
  });

  describe('Constructor', () => {
    test('debería crear un usuario con datos por defecto', () => {
      const user = new UserModel.User();
      
      expect(user.id).toBeNull();
      expect(user.username).toBe('');
      expect(user.email).toBe('');
      expect(user.fullName).toBe('');
      expect(user.password).toBe('');
      expect(user.createdAt).toBeDefined();
      expect(user.lastLogin).toBeNull();
      expect(user.avatar).toBeNull();
    });

    test('debería crear un usuario con datos específicos', () => {
      const userData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      };
      
      const user = new UserModel.User(userData);
      
      expect(user.id).toBe(1);
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.password).toBe('password123');
    });
  });

  describe('validate', () => {
    test('debería validar un usuario correcto', () => {
      const user = new UserModel.User({
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      });
      
      const validation = user.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('debería retornar errores para username inválido', () => {
      const user = new UserModel.User({
        username: 'ab',
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      });
      
      const validation = user.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El usuario debe tener al menos 3 caracteres');
    });

    test('debería retornar errores para email inválido', () => {
      const user = new UserModel.User({
        username: 'testuser',
        email: 'invalid-email',
        fullName: 'Test User',
        password: 'password123'
      });
      
      const validation = user.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Ingrese un correo electrónico válido');
    });

    test('debería retornar errores para contraseña muy corta', () => {
      const user = new UserModel.User({
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        password: '123'
      });
      
      const validation = user.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('La contraseña debe tener al menos 6 caracteres');
    });

    test('debería retornar errores para fullName inválido', () => {
      const user = new UserModel.User({
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'A',
        password: 'password123'
      });
      
      const validation = user.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Ingrese un nombre válido');
    });
  });

  describe('isValidEmail', () => {
    test('debería validar emails correctos', () => {
      const user = new UserModel.User();
      
      expect(user.isValidEmail('test@example.com')).toBe(true);
      expect(user.isValidEmail('user.name@domain.org')).toBe(true);
      expect(user.isValidEmail('test123@subdomain.example.com')).toBe(true);
    });

    test('debería rechazar emails inválidos', () => {
      const user = new UserModel.User();
      
      expect(user.isValidEmail('invalid')).toBe(false);
      expect(user.isValidEmail('test@')).toBe(false);
      expect(user.isValidEmail('@example.com')).toBe(false);
      expect(user.isValidEmail('test@.com')).toBe(false);
    });
  });

  describe('toStorageFormat', () => {
    test('debería formatear datos para almacenamiento', () => {
      const user = new UserModel.User({
        id: 1,
        username: 'TestUser',
        email: 'TEST@EXAMPLE.COM',
        fullName: '  Test User  ',
        password: 'password123'
      });
      
      const storageData = user.toStorageFormat();
      
      expect(storageData.username).toBe('testuser');
      expect(storageData.email).toBe('test@example.com');
      expect(storageData.fullName).toBe('Test User');
    });
  });

  describe('updateLastLogin', () => {
    test('debería actualizar la fecha de último login', () => {
      const user = new UserModel.User();
      const beforeLogin = user.lastLogin;
      
      user.updateLastLogin();
      
      expect(user.lastLogin).not.toBe(beforeLogin);
      expect(user.lastLogin).toBeDefined();
      expect(new Date(user.lastLogin)).toBeInstanceOf(Date);
    });
  });

  describe('Factory methods', () => {
    test('create debería crear una nueva instancia', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };
      
      const user = UserModel.create(userData);
      
      expect(user).toBeInstanceOf(UserModel.User);
      expect(user.username).toBe('testuser');
    });

    test('fromStorage debería crear instancia desde datos de almacenamiento', () => {
      const storageData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      };
      
      const user = UserModel.fromStorage(storageData);
      
      expect(user).toBeInstanceOf(UserModel.User);
      expect(user.id).toBe(1);
      expect(user.username).toBe('testuser');
    });
  });
});
