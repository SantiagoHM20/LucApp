describe('TransactionModel', () => {
  let TransactionModel;

  beforeAll(() => {
    eval(`
      const TransactionModel = (function() {
        'use strict';
        class Transaction {
          constructor(data = {}) {
            this.id = data.id || null;
            this.description = data.description || '';
            this.amount = data.amount || 0;
            this.category = data.category || '';
            this.date = data.date ? new Date(data.date) : new Date();
            this.userId = data.userId || null;
            this.createdAt = data.createdAt || new Date().toISOString();
          }
          
          validate() {
            const errors = [];
            if (!this.description || this.description.trim().length < 1) {
              errors.push('La descripción es requerida');
            }
            if (!this.amount || isNaN(this.amount) || this.amount <= 0) {
              errors.push('El monto debe ser un número positivo');
            }
            if (!this.category || (this.category !== 'Ingreso' && this.category !== 'Gasto')) {
              errors.push('La categoría debe ser "Ingreso" o "Gasto"');
            }
            if (!this.date || isNaN(this.date.getTime())) {
              errors.push('La fecha es inválida');
            }
            return {
              isValid: errors.length === 0,
              errors: errors
            };
          }
          
          toStorageFormat() {
            return {
              id: this.id,
              description: this.description.trim(),
              amount: parseFloat(this.amount),
              category: this.category,
              date: this.date.toISOString(),
              userId: this.userId,
              createdAt: this.createdAt
            };
          }
          
          isIncome() {
            return this.category === 'Ingreso';
          }
          
          isExpense() {
            return this.category === 'Gasto';
          }
          
          getFormattedAmount() {
            return parseFloat(this.amount).toFixed(2);
          }
          
          getFormattedDate(format = 'dd/mm/yyyy') {
            const day = this.date.getDate().toString().padStart(2, '0');
            const month = (this.date.getMonth() + 1).toString().padStart(2, '0');
            const year = this.date.getFullYear();
            
            switch(format) {
              case 'dd/mm/yyyy':
                return \`\${day}/\${month}/\${year}\`;
              case 'yyyy-mm-dd':
                return \`\${year}-\${month}-\${day}\`;
              default:
                return this.date.toLocaleDateString();
            }
          }
          
          setId(id) {
            this.id = id;
          }
          
          static fromStorageFormat(data) {
            return new Transaction(data);
          }
        }
        
        return {
          Transaction: Transaction,
          create: function(transactionData) {
            return new Transaction(transactionData);
          },
          fromStorage: function(data) {
            return Transaction.fromStorageFormat(data);
          }
        };
      })();
      global.TransactionModel = TransactionModel;
    `);
    TransactionModel = global.TransactionModel;
  });

  describe('Constructor', () => {
    test('debería crear una transacción con datos por defecto', () => {
      const transaction = new TransactionModel.Transaction();
      
      expect(transaction.id).toBeNull();
      expect(transaction.description).toBe('');
      expect(transaction.amount).toBe(0);
      expect(transaction.category).toBe('');
      expect(transaction.date).toBeInstanceOf(Date);
      expect(transaction.userId).toBeNull();
      expect(transaction.createdAt).toBeDefined();
    });

    test('debería crear una transacción con datos específicos', () => {
      const transactionData = {
        id: 1,
        description: 'Compra en supermercado',
        amount: 150.50,
        category: 'Gasto',
        date: '2025-01-15',
        userId: 'user123'
      };
      
      const transaction = new TransactionModel.Transaction(transactionData);
      
      expect(transaction.id).toBe(1);
      expect(transaction.description).toBe('Compra en supermercado');
      expect(transaction.amount).toBe(150.50);
      expect(transaction.category).toBe('Gasto');
      expect(transaction.date).toBeInstanceOf(Date);
      expect(transaction.userId).toBe('user123');
    });
  });

  describe('validate', () => {
    test('debería validar una transacción correcta', () => {
      const transaction = new TransactionModel.Transaction({
        description: 'Compra válida',
        amount: 100,
        category: 'Gasto',
        date: new Date()
      });
      
      const validation = transaction.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('debería retornar error para descripción vacía', () => {
      const transaction = new TransactionModel.Transaction({
        description: '',
        amount: 100,
        category: 'Gasto'
      });
      
      const validation = transaction.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('La descripción es requerida');
    });

    test('debería retornar error para monto inválido', () => {
      const transaction = new TransactionModel.Transaction({
        description: 'Test',
        amount: 0,
        category: 'Gasto'
      });
      
      const validation = transaction.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El monto debe ser un número positivo');
    });

    test('debería retornar error para monto no numérico', () => {
      const transaction = new TransactionModel.Transaction({
        description: 'Test',
        amount: 'abc',
        category: 'Gasto'
      });
      
      const validation = transaction.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El monto debe ser un número positivo');
    });

    test('debería retornar error para categoría inválida', () => {
      const transaction = new TransactionModel.Transaction({
        description: 'Test',
        amount: 100,
        category: 'Invalida'
      });
      
      const validation = transaction.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('La categoría debe ser "Ingreso" o "Gasto"');
    });
  });

  describe('isIncome', () => {
    test('debería retornar true para ingresos', () => {
      const transaction = new TransactionModel.Transaction({
        category: 'Ingreso'
      });
      
      expect(transaction.isIncome()).toBe(true);
    });

    test('debería retornar false para gastos', () => {
      const transaction = new TransactionModel.Transaction({
        category: 'Gasto'
      });
      
      expect(transaction.isIncome()).toBe(false);
    });
  });

  describe('isExpense', () => {
    test('debería retornar true para gastos', () => {
      const transaction = new TransactionModel.Transaction({
        category: 'Gasto'
      });
      
      expect(transaction.isExpense()).toBe(true);
    });

    test('debería retornar false para ingresos', () => {
      const transaction = new TransactionModel.Transaction({
        category: 'Ingreso'
      });
      
      expect(transaction.isExpense()).toBe(false);
    });
  });

  describe('getFormattedAmount', () => {
    test('debería formatear el monto con 2 decimales', () => {
      const transaction = new TransactionModel.Transaction({
        amount: 123.456
      });
      
      expect(transaction.getFormattedAmount()).toBe('123.46');
    });

    test('debería agregar decimales cuando son necesarios', () => {
      const transaction = new TransactionModel.Transaction({
        amount: 100
      });
      
      expect(transaction.getFormattedAmount()).toBe('100.00');
    });
  });

  describe('getFormattedDate', () => {
    test('debería formatear fecha en formato dd/mm/yyyy por defecto', () => {
      const transaction = new TransactionModel.Transaction({
        date: new Date('2025-01-15')
      });
      
      expect(transaction.getFormattedDate()).toBe('15/01/2025');
    });

    test('debería formatear fecha en formato yyyy-mm-dd', () => {
      const transaction = new TransactionModel.Transaction({
        date: new Date('2025-01-15')
      });
      
      expect(transaction.getFormattedDate('yyyy-mm-dd')).toBe('2025-01-15');
    });
  });

  describe('toStorageFormat', () => {
    test('debería formatear datos para almacenamiento', () => {
      const transaction = new TransactionModel.Transaction({
        id: 1,
        description: '  Compra con espacios  ',
        amount: '150.50',
        category: 'Gasto',
        date: new Date('2025-01-15'),
        userId: 'user123'
      });
      
      const storageData = transaction.toStorageFormat();
      
      expect(storageData.description).toBe('Compra con espacios');
      expect(storageData.amount).toBe(150.50);
      expect(typeof storageData.amount).toBe('number');
      expect(storageData.date).toBe(new Date('2025-01-15').toISOString());
    });
  });

  describe('Factory methods', () => {
    test('create debería crear una nueva instancia', () => {
      const transactionData = {
        description: 'Test transaction',
        amount: 100,
        category: 'Gasto'
      };
      
      const transaction = TransactionModel.create(transactionData);
      
      expect(transaction).toBeInstanceOf(TransactionModel.Transaction);
      expect(transaction.description).toBe('Test transaction');
    });

    test('fromStorage debería crear instancia desde datos de almacenamiento', () => {
      const storageData = {
        id: 1,
        description: 'Stored transaction',
        amount: 200,
        category: 'Ingreso'
      };
      
      const transaction = TransactionModel.fromStorage(storageData);
      
      expect(transaction).toBeInstanceOf(TransactionModel.Transaction);
      expect(transaction.id).toBe(1);
      expect(transaction.description).toBe('Stored transaction');
    });
  });
});
