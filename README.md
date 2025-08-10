# LucApp - Gestión Financiera Personal



  ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
  ![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
  ![Chart.js](https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white)


## Tabla de Contenidos

- [Características](#características)
- [Tecnologías y Librerías](#tecnologías-y-librerías)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
- [Testing](#testing)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Contribución](#contribución)

## Estado del Proyecto

 **Proyecto en Desarrollo Activo**

-  **Funcionalidades Completadas:** Autenticación, Dashboard, Transacciones, Estadísticas
-  **En Proceso:** Funcionalidad de usuario invitado (actualmente no funcional)
-  **Testing:** Suite de pruebas implementada, algunas pruebas aún requieren corrección
-  **Pendiente:** Refinamiento de validaciones y mejoras de UX

## Características

- **Dashboard intuitivo** con visualización de balances
- **Gestión de transacciones** (ingresos y gastos)
- **Estadísticas y gráficos** interactivos
- **Sistema de autenticación** de usuarios registrados
- **Almacenamiento local** persistente
- **Diseño responsive** para móviles y desktop
- **Filtros avanzados** por fecha y categoría
- **Suite de pruebas** en desarrollo

 **Funcionalidad de invitado:** Actualmente en desarrollo y no funcional

## Tecnologías y Librerías

### Frontend Core
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **HTML5** | Latest | Estructura y semántica de la aplicación |
| **CSS3** | Latest | Estilos, animaciones y diseño responsive |
| **JavaScript ES6+** | Latest | Lógica de negocio y funcionalidad |

### Librerías Externas (CDN)

#### Visualización de Datos
- **[Chart.js](https://www.chartjs.org/)** `latest`
  - **Propósito:** Generación de gráficos interactivos para estadísticas
  - **Uso:** Gráficos de barras, líneas y donut para visualizar ingresos/gastos
  - **CDN:** `https://cdn.jsdelivr.net/npm/chart.js`

#### Iconografía
- **[Font Awesome](https://fontawesome.com/)** `v6.0.0`
  - **Propósito:** Iconos vectoriales para interfaz de usuario
  - **Uso:** Iconos de navegación, botones, indicadores visuales
  - **CDN:** `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`

### Herramientas de Desarrollo

#### Testing Framework
```json
{
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  "@testing-library/jest-dom": "^6.1.4"
}
```
- **Jest:** Framework principal de pruebas unitarias
- **JSDOM:** Simulación del DOM para testing
- **Testing Library:** Utilidades adicionales para assertions

#### Herramientas de Desarrollo
```json
{
  "live-server": "^1.2.2",
  "eslint": "^8.57.0"
}
```
- **Live Server:** Servidor de desarrollo con recarga automática
- **ESLint:** Linter para mantener calidad del código JavaScript

### APIs y Tecnologías del Navegador

#### Almacenamiento
- **localStorage API**
  - **Propósito:** Persistencia de datos de usuarios y transacciones
  - **Uso:** Almacenar sesiones, configuraciones y datos financieros

#### Web APIs
- **DOM API:** Manipulación de elementos HTML
- **Fetch API:** Futuras integraciones con servicios externos
- **History API:** Navegación SPA (Single Page Application)

## Arquitectura

### Patrón MVC (Modelo-Vista-Controlador) + Módulos

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     MODELS      │    │   CONTROLLERS   │    │      VIEWS      │
│                 │    │                 │    │                 │
│ • User.js       │◄──►│ • AuthController│◄──►│ • AuthView.js   │
│ • Transaction.js│    │ • DashController│    │ • DashView.js   │
│                 │    │ • StatsController│   │ • StatsView.js  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
         ┌─────────────────────────────────────────────────────┐
         │                   CORE LAYER                        │
         ├─────────────────┬─────────────────┬─────────────────┤
         │    MODULES      │    FACTORIES    │   UTILITIES     │
         │   (Pattern)     │    (Pattern)    │                 │
         │                 │                 │                 │
         │ • StorageModule │ • ObjectFactory │ • UtilsModule   │
         │ • ValidatorMod  │                 │ • ChartModule   │
         │ • AlertModule   │                 │ • FilterModule  │
         └─────────────────┴─────────────────┴─────────────────┘
```

### Patrones de Diseño Implementados

#### **Module Pattern (Patrón Módulo)**
**Implementación:** IIFE (Immediately Invoked Function Expression)
```javascript
const StorageModule = (function() {
    'use strict';
    // Variables privadas
    const config = { PREFIX: 'lucapp' };
    
    // Funciones privadas
    function generateKey(type, userId) { /* ... */ }
    
    // API pública
    return {
        saveUser: function(user) { /* ... */ },
        getCurrentUser: function() { /* ... */ }
    };
})();
```

**Módulos que lo implementan:**
- **StorageModule:** Gestión de localStorage con API privada
- **ValidatorModule:** Validación de datos con configuración encapsulada
- **UtilsModule:** Utilidades de formateo con funciones privadas
- **ChartModule:** Integración con Chart.js
- **AlertModule:** Sistema de notificaciones
- **FilterModule:** Filtros de datos

**Beneficios:**
- Encapsulación de variables y funciones privadas
- Namespace limpio y controlado
- Prevención de conflictos globales
- API pública bien definida

#### **Factory Pattern (Patrón Fábrica)**
**Implementación:** ObjectFactory centralizada
```javascript
const ObjectFactory = (function() {
    'use strict';
    
    // Validaciones privadas
    function validateUserData(userData) { /* ... */ }
    function validateTransactionData(transactionData) { /* ... */ }
    
    // Generación de datos por defecto
    function generateDefaultUserData() { /* ... */ }
    function generateDefaultTransactionData() { /* ... */ }
    
    return {
        createUser: function(userData) {
            validateUserData(userData);
            const completeData = Object.assign(
                generateDefaultUserData(),
                userData
            );
            return User.create(completeData);
        },
        
        createTransaction: function(transactionData) {
            validateTransactionData(transactionData);
            const completeData = Object.assign(
                generateDefaultTransactionData(),
                transactionData
            );
            return Transaction.create(completeData);
        }
    };
})();
```

**Responsabilidades del Factory:**
- **Validación:** Verifica datos antes de crear objetos
- **Completado:** Agrega datos por defecto (IDs, timestamps)
- **Normalización:** Asegura formato consistente
- **Categorización:** Asigna categorías automáticamente

**Beneficios:**
- Creación consistente de objetos
- Validación centralizada
- Manejo de dependencias
- Reducción de código duplicado

### Módulos Principales

#### Core Modules (Module Pattern)
- **StorageModule:** Gestión de localStorage con validaciones y API privada
- **ValidatorModule:** Validación de datos con configuración encapsulada
- **UtilsModule:** Utilidades de formateo y manipulación con funciones privadas
- **ChartModule:** Integración con Chart.js y configuración de gráficos
- **AlertModule:** Sistema de notificaciones y mensajes
- **FilterModule:** Filtros avanzados de datos y búsquedas

#### Factory Layer (Factory Pattern)
- **ObjectFactory:** Fábrica centralizada para creación de objetos
  - Validación de datos de entrada
  - Generación de IDs únicos
  - Asignación de valores por defecto
  - Normalización de formatos

#### Controllers (MVC Pattern)
- **AuthController:** Manejo de autenticación y sesiones
- **DashboardController:** Lógica del dashboard principal
- **TransactionController:** CRUD de transacciones
- **StatisticsController:** Generación de reportes y gráficos

#### Views (MVC Pattern)
- **AuthView:** Interfaces de login/register
- **DashboardView:** Vista principal de la aplicación
- **StatisticsView:** Pantallas de reportes y gráficos

#### Models (MVC Pattern)
- **User:** Modelo de datos de usuario con validaciones
- **Transaction:** Modelo de transacciones financieras

## Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn
- Navegador web moderno

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/SantiagoHM20/LucApp.git
cd LucApp
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
npm start
```

4. **Abrir en navegador**
```
http://localhost:8080
```

### Limitaciones Actuales

⚠️ **Importante:** 
- La **funcionalidad de invitado** está en desarrollo y actualmente no es funcional
- Se requiere **registro de usuario** para acceder a todas las características
- Algunas **pruebas unitarias** están en proceso de corrección

## Uso

### Scripts Disponibles

```bash
# Desarrollo
npm start              # Iniciar servidor de desarrollo
npm run lint           # Ejecutar linter

# Testing  
npm test               # Ejecutar todas las pruebas
npm run test:watch     # Modo desarrollo con watch
```

### Funcionalidades Principales

1. **Registro/Login de Usuario**
   - Validación de formularios
   - Almacenamiento seguro local
   - Gestión de sesiones

2. **Dashboard Principal**
   - Resumen de balance
   - Últimas transacciones
   - Navegación rápida

3. **Gestión de Transacciones**
   - Agregar ingresos/gastos
   - Categorización automática
   - Validación de datos

4. **Estadísticas**
   - Gráficos interactivos
   - Filtros por período
   - Exportación de datos

## Testing

### Estado Actual del Testing

La aplicación cuenta con una suite de pruebas unitarias implementada:

- **Módulos:** StorageModule, ValidatorModule, UtilsModule
- **Modelos:** User, Transaction  
- **Integración:** Flujos completos de usuario

 **Nota:** Algunas pruebas están aún en proceso de corrección y refinamiento. La suite de testing está funcional pero requiere ajustes adicionales para garantizar una cobertura completa y resultados consistentes.

### Herramientas de Testing

```javascript
{
  "testEnvironment": "jsdom"
}
```

### Ejecutar Pruebas

```bash
npm test
```

## Estructura del Proyecto

```
LucApp/
├── pages/                    # Páginas HTML
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── add-transaction.html
│   └── statistics.html
├── css/                      # Estilos CSS
│   ├── style.css               # Estilos principales
│   ├── auth-forms.css          # Formularios de auth
│   ├── landing.css             # Página de inicio
│   └── statistics.css          # Página de estadísticas
├── js/                       # JavaScript
│   ├── app.js                  # Controlador principal
│   ├── modules/             # Módulos core
│   │   ├── StorageModule.js
│   │   ├── ValidatorModule.js
│   │   ├── UtilsModule.js
│   │   └── chartModule.js
│   ├── models/              # Modelos de datos
│   │   ├── User.js
│   │   └── Transaction.js
│   ├── controllers/         # Controladores MVC
│   │   ├── AuthController.js
│   │   ├── DashboardController.js
│   │   ├── TransactionController.js
│   │   └── StatisticsController.js
│   ├── views/               # Vistas MVC
│   │   ├── AuthView.js
│   │   ├── DashboardView.js
│   │   └── StatisticsView.js
│   └── factories/           # Factory patterns
│       └── ObjectFactory.js
├── test/                     # Suite de pruebas
│   ├── setup.js                # Configuración Jest
│   ├── modules/             # Tests de módulos
│   ├── models/              # Tests de modelos
│   └── integration.test.js     # Pruebas de integración
├── assets/                   # Recursos estáticos
├── index.html                   # Landing page
├── package.json                 # Dependencias y scripts
├── jest.config.js              # Configuración Jest
└── README.md                    # Este archivo
```

## Características Técnicas

### Patrones de Diseño Implementados

- **MVC (Model-View-Controller):** Separación clara de responsabilidades
- **Module Pattern (IIFE):** Encapsulación de funcionalidades y namespace privado
- **Factory Pattern:** Creación consistente y validada de objetos
- **Observer Pattern:** Comunicación entre componentes (futuro)

### Flujo de Datos

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    USER     │───►│    VIEW     │───►│ CONTROLLER  │───►│   FACTORY   │
│  Interacts  │    │  Captures   │    │ Processes   │    │  Creates    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                 │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│   STORAGE   │◄───│   MODULE    │◄───│    MODEL    │◄──────────┘
│   Persists  │    │ Validates   │    │   Stores    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Buenas Prácticas

- **Código limpio:** Sin comentarios innecesarios, sin console.log
- **Validación robusta:** Entrada de datos y manejo de errores
- **Testing completo:** Suite de pruebas unitarias e integración
- **Responsive design:** Compatible con móviles y desktop
- **Accesibilidad:** Uso semántico de HTML y ARIA labels

### Performance

- **Carga rápida:** Recursos optimizados y minificados
- **Almacenamiento eficiente:** localStorage con compresión
- **Renderizado optimizado:** DOM manipulation eficiente
- **Mobile-first:** Diseño responsivo desde mobile

## Contribución

### Cómo Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estándares de Código

- Usar ESLint para mantener consistencia
- Escribir pruebas para nuevas funcionalidades
- Seguir convenciones de nombres establecidas

## Autor

**Santiago Hurtado Martínez**
- GitHub: [@SantiagoHM20](https://github.com/SantiagoHM20)
- Proyecto: [LucApp](https://github.com/SantiagoHM20/LucApp)

## Agradecimientos

- [Chart.js](https://www.chartjs.org/) - Por la excelente librería de gráficos
- [Font Awesome](https://fontawesome.com/) - Por los iconos de alta calidad
- [Jest](https://jestjs.io/) - Por el framework de testing robusto


