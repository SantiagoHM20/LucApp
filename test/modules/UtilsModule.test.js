describe('UtilsModule', () => {
  let UtilsModule;

  beforeAll(() => {
    eval(`
      const UtilsModule = (function() {
        'use strict';
        const config = {
          CURRENCY: {
            SYMBOL: '$',
            LOCALE: 'es-CL',
            OPTIONS: {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }
          },
          DATE: {
            LOCALE: 'es-CL',
            TIMEZONE: 'America/Santiago'
          }
        };
        
        function isValidDate(date) {
          return date instanceof Date && !isNaN(date.getTime());
        }
        
        function parseDate(dateString) {
          if (!dateString) return null;
          const parsed = new Date(dateString);
          return isValidDate(parsed) ? parsed : null;
        }
        
        return {
          formatCurrency: function(amount, showSymbol = true) {
            const numAmount = parseFloat(amount) || 0;
            if (!showSymbol) {
              return numAmount.toLocaleString(config.CURRENCY.LOCALE);
            }
            return numAmount.toLocaleString(config.CURRENCY.LOCALE, config.CURRENCY.OPTIONS);
          },
          
          formatDate: function(date, format = 'dd/mm/yyyy') {
            if (!isValidDate(date)) {
              const parsed = parseDate(date);
              if (!parsed) return 'Fecha inválida';
              date = parsed;
            }
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            switch (format) {
              case 'dd/mm/yyyy':
                return \`\${day}/\${month}/\${year}\`;
              case 'yyyy-mm-dd':
                return \`\${year}-\${month}-\${day}\`;
              case 'dd-mm-yyyy':
                return \`\${day}-\${month}-\${year}\`;
              default:
                return date.toLocaleDateString(config.DATE.LOCALE);
            }
          },
          
          generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
          },
          
          capitalizeFirstLetter: function(string) {
            if (typeof string !== 'string' || string.length === 0) return string;
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
          },
          
          truncateText: function(text, maxLength = 50, suffix = '...') {
            if (typeof text !== 'string') return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength - suffix.length) + suffix;
          },
          
          debounce: function(func, wait, immediate = false) {
            let timeout;
            return function executedFunction(...args) {
              const later = () => {
                timeout = null;
                if (!immediate) func(...args);
              };
              const callNow = immediate && !timeout;
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
              if (callNow) func(...args);
            };
          },
          
          isEmptyObject: function(obj) {
            return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
          },
          
          deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj);
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
              const cloned = {};
              Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
              });
              return cloned;
            }
          },
          
          sanitizeInput: function(input) {
            if (typeof input !== 'string') return '';
            return input.trim().replace(/[<>\"'&]/g, '');
          },
          
          getCurrentMonth: function() {
            return new Date().getMonth() + 1;
          },
          
          getCurrentYear: function() {
            return new Date().getFullYear();
          }
        };
      })();
      global.UtilsModule = UtilsModule;
    `);
    UtilsModule = global.UtilsModule;
  });

  describe('formatCurrency', () => {
    test('debería formatear moneda con símbolo por defecto', () => {
      const result = UtilsModule.formatCurrency(1000);
      expect(result).toContain('1');
      expect(typeof result).toBe('string');
    });

    test('debería formatear moneda sin símbolo', () => {
      const result = UtilsModule.formatCurrency(1000, false);
      expect(typeof result).toBe('string');
      expect(result).not.toContain('$');
    });

    test('debería manejar valores no numéricos', () => {
      const result = UtilsModule.formatCurrency('abc');
      expect(result).toBeDefined();
    });

    test('debería manejar valores negativos', () => {
      const result = UtilsModule.formatCurrency(-500);
      expect(result).toBeDefined();
    });
  });

  describe('formatDate', () => {
    test('debería formatear fecha en formato dd/mm/yyyy por defecto', () => {
      const date = new Date('2025-01-15');
      const result = UtilsModule.formatDate(date);
      
      expect(result).toBe('15/01/2025');
    });

    test('debería formatear fecha en formato yyyy-mm-dd', () => {
      const date = new Date('2025-01-15');
      const result = UtilsModule.formatDate(date, 'yyyy-mm-dd');
      
      expect(result).toBe('2025-01-15');
    });

    test('debería formatear fecha en formato dd-mm-yyyy', () => {
      const date = new Date('2025-01-15');
      const result = UtilsModule.formatDate(date, 'dd-mm-yyyy');
      
      expect(result).toBe('15-01-2025');
    });

    test('debería manejar fechas inválidas', () => {
      const result = UtilsModule.formatDate('fecha inválida');
      
      expect(result).toBe('Fecha inválida');
    });

    test('debería parsear string de fecha válido', () => {
      const result = UtilsModule.formatDate('2025-01-15');
      
      expect(result).toBe('15/01/2025');
    });
  });

  describe('generateId', () => {
    test('debería generar un ID único', () => {
      const id1 = UtilsModule.generateId();
      const id2 = UtilsModule.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    test('debería generar IDs con formato válido', () => {
      const id = UtilsModule.generateId();
      
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('capitalizeFirstLetter', () => {
    test('debería capitalizar la primera letra', () => {
      const result = UtilsModule.capitalizeFirstLetter('hello world');
      
      expect(result).toBe('Hello world');
    });

    test('debería manejar strings vacíos', () => {
      const result = UtilsModule.capitalizeFirstLetter('');
      
      expect(result).toBe('');
    });

    test('debería manejar valores no string', () => {
      const result = UtilsModule.capitalizeFirstLetter(123);
      
      expect(result).toBe(123);
    });

    test('debería convertir a minúsculas el resto del texto', () => {
      const result = UtilsModule.capitalizeFirstLetter('HELLO WORLD');
      
      expect(result).toBe('Hello world');
    });
  });

  describe('truncateText', () => {
    test('debería truncar texto largo', () => {
      const longText = 'Este es un texto muy largo que debe ser truncado';
      const result = UtilsModule.truncateText(longText, 20);
      
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    test('debería retornar texto completo si es corto', () => {
      const shortText = 'Texto corto';
      const result = UtilsModule.truncateText(shortText, 20);
      
      expect(result).toBe(shortText);
    });

    test('debería usar sufijo personalizado', () => {
      const text = 'Texto para truncar con sufijo personalizado';
      const result = UtilsModule.truncateText(text, 20, '***');
      
      expect(result).toContain('***');
    });

    test('debería manejar valores no string', () => {
      const result = UtilsModule.truncateText(123);
      
      expect(result).toBe('');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('debería retrasar la ejecución de la función', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = UtilsModule.debounce(mockFunc, 100);
      
      debouncedFunc();
      expect(mockFunc).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    test('debería ejecutar inmediatamente si immediate es true', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = UtilsModule.debounce(mockFunc, 100, true);
      
      debouncedFunc();
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });
  });

  describe('isEmptyObject', () => {
    test('debería retornar true para objeto vacío', () => {
      const result = UtilsModule.isEmptyObject({});
      
      expect(result).toBe(true);
    });

    test('debería retornar false para objeto con propiedades', () => {
      const result = UtilsModule.isEmptyObject({ key: 'value' });
      
      expect(result).toBe(false);
    });

    test('debería retornar false para null', () => {
      const result = UtilsModule.isEmptyObject(null);
      
      expect(result).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('debería remover caracteres peligrosos', () => {
      const result = UtilsModule.sanitizeInput('<script>alert("xss")</script>');
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('debería trimear espacios', () => {
      const result = UtilsModule.sanitizeInput('  texto con espacios  ');
      
      expect(result).toBe('texto con espacios');
    });

    test('debería manejar valores no string', () => {
      const result = UtilsModule.sanitizeInput(123);
      
      expect(result).toBe('');
    });
  });

  describe('getCurrentMonth', () => {
    test('debería retornar el mes actual', () => {
      const result = UtilsModule.getCurrentMonth();
      
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(12);
    });
  });

  describe('getCurrentYear', () => {
    test('debería retornar el año actual', () => {
      const result = UtilsModule.getCurrentYear();
      const currentYear = new Date().getFullYear();
      
      expect(result).toBe(currentYear);
    });
  });
});
