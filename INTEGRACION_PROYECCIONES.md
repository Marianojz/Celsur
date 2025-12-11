# Integración Completa del Sistema de Proyecciones

## ✅ Archivos Modificados

### 1. **Archivos HTML con Menú de Navegación Actualizado**

Se agregó el enlace a `proyecciones.html` en los siguientes archivos:

- ✅ `index.html` - Menú principal
- ✅ `rendimiento.html` - Módulo de rendimiento
- ✅ `proyecciones.html` - Módulo de proyecciones (página principal)
- ✅ `presentismo.html` - Módulo de presentismo
- ✅ `ventilacion.html` - Módulo de ventilación
- ✅ `jefatura.html` - Módulo de jefatura
- ✅ `rendimiento-despacho.html` - Rendimiento despacho
- ✅ `rendimiento-recepcion.html` - Rendimiento recepción

### 2. **Archivos JavaScript Creados/Modificados**

#### Nuevos Archivos:
- ✅ `proyecciones.html` - Interfaz principal del sistema de proyecciones
- ✅ `proyecciones.js` - Módulo de lógica de proyecciones (clase ProyeccionesPredictivas)
- ✅ `proyecciones-shared.js` - Funciones compartidas para integración

#### Archivos Modificados:
- ✅ `rendimiento.html` - Agregada función `guardarDatosParaProyecciones()` y referencia a `proyecciones-shared.js`

---

## 🔗 Estructura de Integración

```
┌─────────────────────────────────────────────────────────┐
│  Módulos de Rendimiento (rendimiento.html, etc.)      │
│  ↓                                                       │
│  Procesan datos de Excel                                │
│  ↓                                                       │
│  guardarDatosParaProyecciones()                         │
│  ↓                                                       │
│  localStorage: 'proyecciones_datos_actuales'           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  proyecciones.html                                      │
│  ↓                                                       │
│  cargarDatosActuales()                                  │
│  ↓                                                       │
│  Lee desde localStorage                                 │
│  ↓                                                       │
│  ProyeccionesPredictivas.calcularProyecciones()        │
│  ↓                                                       │
│  Muestra proyecciones en UI                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Funciones Clave Integradas

### 1. `guardarDatosParaProyecciones(datosProcesados)`
**Ubicación**: `proyecciones-shared.js` (compartida) y `rendimiento.html` (local)

**Uso**: Se llama automáticamente después de procesar datos en cualquier módulo de rendimiento.

**Qué hace**:
- Calcula totales (bultos, paradas, tiempo muerto)
- Calcula horas trabajadas y velocidad
- Guarda en `localStorage` con timestamp
- Agrega a datos históricos si el sistema está disponible

### 2. `cargarDatosActuales()`
**Ubicación**: `proyecciones.html`

**Uso**: Se ejecuta automáticamente al cargar `proyecciones.html`

**Qué hace**:
1. Intenta cargar desde `localStorage` (datos reales)
2. Si no hay, intenta desde variable global `datosProcesados`
3. Si no hay, usa simulación

### 3. `ProyeccionesPredictivas`
**Ubicación**: `proyecciones.js`

**Uso**: Clase principal para cálculos de proyecciones

**Métodos principales**:
- `calcularProyecciones()` - Calcula todas las proyecciones
- `calcularProyeccion(horizonte)` - Calcula proyección específica
- `generarRecomendaciones()` - Genera recomendaciones automáticas

---

## 🎯 Cómo Usar la Integración

### Para Desarrolladores:

#### 1. En cualquier módulo de rendimiento, después de procesar datos:

```javascript
// Ejemplo en tu módulo
function procesarDatos(jsonData) {
    // ... tu código de procesamiento ...
    
    datosProcesados = {
        usuarios: usuarios,
        datosFiltrados: datosFiltrados,
        // ... otros datos ...
    };
    
    // Guardar para proyecciones (automático si usas proyecciones-shared.js)
    if (typeof guardarDatosParaProyecciones === 'function') {
        guardarDatosParaProyecciones(datosProcesados);
    }
}
```

#### 2. Incluir el script compartido en tu HTML:

```html
<script src="proyecciones-shared.js"></script>
```

### Para Usuarios:

1. **Procesar datos en cualquier módulo de rendimiento**
   - Abre `rendimiento.html` (o cualquier módulo similar)
   - Carga y procesa tu archivo Excel
   - Los datos se guardan automáticamente

2. **Ver proyecciones**
   - Abre `proyecciones.html`
   - Las proyecciones se calculan automáticamente con los datos guardados
   - Usa "Actualizar Proyección" para recalcular

---

## 🔄 Flujo de Datos Completo

```
Usuario carga Excel
    ↓
rendimiento.html procesa datos
    ↓
guardarDatosParaProyecciones() se ejecuta
    ↓
Datos guardados en localStorage
    ↓
Usuario abre proyecciones.html
    ↓
cargarDatosActuales() lee localStorage
    ↓
ProyeccionesPredictivas calcula proyecciones
    ↓
UI muestra resultados
```

---

## 📊 Datos Almacenados

### localStorage Keys:

1. **`proyecciones_datos_actuales`**
   - Datos del día actual
   - Se actualiza cada vez que se procesan datos
   - Incluye timestamp para validar frescura

2. **`proyecciones_historicos`**
   - Datos históricos de los últimos 7 días
   - Se actualiza automáticamente
   - Usado para calcular factores horarios

3. **`proyecciones_errores`** (opcional)
   - Errores de proyección para aprendizaje
   - Se usa para mejorar precisión

---

## 🛠️ Personalización

### Cambiar Meta de Productividad:

En `proyecciones.html`, modifica `CONFIG`:

```javascript
const CONFIG = {
    META_BULTOS_POR_HORA: 60, // Cambiar aquí
    // ...
};
```

### Cambiar Horizontes de Proyección:

```javascript
const CONFIG = {
    HORIZONTES: [2, 4, 6, 8, 12], // Agregar más horizontes
    // ...
};
```

### Cambiar Umbrales de Alerta:

```javascript
const CONFIG = {
    UMBRAL_VERDE: 0.98,    // Más estricto
    UMBRAL_AMARILLO: 0.85, // Más permisivo
    // ...
};
```

---

## ✅ Checklist de Integración

- [x] Enlaces en todos los menús de navegación
- [x] Función compartida para guardar datos
- [x] Integración en rendimiento.html
- [x] Sistema de carga automática de datos
- [x] Documentación completa
- [x] Manejo de errores y fallbacks
- [x] Sistema de simulación para desarrollo

---

## 🐛 Troubleshooting

### Los datos no se cargan en proyecciones.html

1. Verifica que hayas procesado datos en `rendimiento.html` primero
2. Abre la consola (F12) y busca mensajes:
   - `✅ Datos cargados desde módulo de rendimiento` = OK
   - `⚠️ No se encontraron datos reales` = Usa simulación
3. Verifica localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('proyecciones_datos_actuales'))
   ```

### Los datos son muy antiguos

Los datos se consideran válidos por 1 hora. Si necesitas datos más antiguos, modifica en `proyecciones.html`:

```javascript
if (diffHoras < 1) { // Cambiar a 2, 3, etc.
```

### No se guardan datos históricos

Asegúrate de que `proyecciones.js` esté cargado antes de llamar a `guardarDatosParaProyecciones()`.

---

## 📝 Notas Importantes

1. **Orden de carga de scripts**: 
   - `proyecciones-shared.js` debe cargarse antes de usarse
   - `proyecciones.js` debe cargarse antes de `proyecciones.html`

2. **Compatibilidad**: 
   - Funciona con todos los módulos que procesen datos similares
   - Compatible con estructura de datos de `rendimiento.html`

3. **Performance**: 
   - Los datos se guardan en localStorage (límite ~5-10MB)
   - Los cálculos son eficientes y se ejecutan en el cliente

---

**Versión**: 1.0.0  
**Fecha**: 2024  
**Autor**: Mzequeira

