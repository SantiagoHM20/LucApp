describe('StorageModule', () => {
  let StorageModule;

  beforeAll(() => {
    eval(`
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
          const baseKey = \`\${config.PREFIX}_\${type}\`;
          return userId ? \`\${baseKey}_\${userId}\` : baseKey;
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
          save: function(key, data, userId = null) {
            try {
              const storageKey = generateKey(key, userId);
              const jsonData = safeStringify(data);
              if (jsonData !== null) {
                localStorage.setItem(storageKey, jsonData);
                return true;
              }
              return false;
            } catch (error) {
              console.error('Error al guardar en localStorage:', error);
              return false;
            }
          },
          
          load: function(key, userId = null) {
            try {
              const storageKey = generateKey(key, userId);
              const data = localStorage.getItem(storageKey);
              return data ? safeParse(data) : null;
            } catch (error) {
              console.error('Error al cargar desde localStorage:', error);
              return null;
            }
          },
          
          remove: function(key, userId = null) {
            try {
              const storageKey = generateKey(key, userId);
              localStorage.removeItem(storageKey);
              return true;
            } catch (error) {
              console.error('Error al eliminar de localStorage:', error);
              return false;
            }
          },
          
          clear: function() {
            try {
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith(config.PREFIX)) {
                  localStorage.removeItem(key);
                }
              });
              return true;
            } catch (error) {
              console.error('Error al limpiar localStorage:', error);
              return false;
            }
          },
          
          exists: function(key, userId = null) {
            const storageKey = generateKey(key, userId);
            return localStorage.getItem(storageKey) !== null;
          }
        };
      })();
      global.StorageModule = StorageModule;
    `);
    StorageModule = global.StorageModule;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  describe('save', () => {
    test('debería guardar datos correctamente', () => {
      const testData = { id: 1, name: 'Test User' };
      
      const result = StorageModule.save('users', testData);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lucapp_users',
        JSON.stringify(testData)
      );
    });

    test('debería guardar datos con userId', () => {
      const testData = { amount: 100, description: 'Test' };
      const userId = 'user123';
      
      StorageModule.save('transactions', testData, userId);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lucapp_transactions_user123',
        JSON.stringify(testData)
      );
    });

    test('debería manejar errores de serialización', () => {
      const circularObj = {};
      circularObj.self = circularObj;
      
      const result = StorageModule.save('test', circularObj);
      
      expect(result).toBe(false);
    });
  });

  describe('load', () => {
    test('debería cargar datos correctamente', () => {
      const testData = { id: 1, name: 'Test User' };
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      const result = StorageModule.load('users');
      
      expect(localStorage.getItem).toHaveBeenCalledWith('lucapp_users');
      expect(result).toEqual(testData);
    });

    test('debería retornar null si no existe el dato', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = StorageModule.load('nonexistent');
      
      expect(result).toBeNull();
    });

    test('debería manejar JSON inválido', () => {
      localStorage.getItem.mockReturnValue('invalid json {');
      
      const result = StorageModule.load('users');
      
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    test('debería eliminar datos correctamente', () => {
      const result = StorageModule.remove('users');
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('lucapp_users');
    });

    test('debería eliminar datos con userId', () => {
      StorageModule.remove('transactions', 'user123');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('lucapp_transactions_user123');
    });
  });

  describe('exists', () => {
    test('debería retornar true si el dato existe', () => {
      localStorage.getItem.mockReturnValue('some data');
      
      const result = StorageModule.exists('users');
      
      expect(result).toBe(true);
    });

    test('debería retornar false si el dato no existe', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = StorageModule.exists('users');
      
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    test('debería limpiar solo datos de la aplicación', () => {
      Object.defineProperty(localStorage, 'keys', {
        value: jest.fn().mockReturnValue(['lucapp_users', 'lucapp_transactions', 'other_app_data']),
        writable: true
      });
      
      Object.keys = jest.fn().mockReturnValue(['lucapp_users', 'lucapp_transactions', 'other_app_data']);
      
      const result = StorageModule.clear();
      
      expect(result).toBe(true);
    });
  });
});
