# Origen de Datos - Sistema de Proyecciones

## 📊 ¿De dónde toman los datos las funciones?

### Función: `cargarDatosActuales()`

Esta función intenta obtener datos en **3 niveles de prioridad**:

#### 1️⃣ **Nivel 1: Datos Reales desde localStorage** (PRIORIDAD ALTA)
```javascript
localStorage.getItem('proyecciones_datos_actuales')
```

**Origen**: El módulo `rendimiento.html` guarda estos datos automáticamente cuando procesas un archivo Excel.

**Cuándo se guardan**: 
- Cuando cargas y procesas un archivo Excel en `rendimiento.html`
- La función `guardarDatosParaProyecciones()` se ejecuta automáticamente
- Los datos se guardan con timestamp para verificar que sean recientes (< 1 hora)

**Qué datos contiene**:
```javascript
{
    hora: 14,                    // Hora actual
    minutos: 30,                 // Minutos actuales
    horasTrabajadas: 6.5,        // Horas trabajadas desde inicio
    bultosActuales: 325,        // Total de bultos procesados
    paradasActuales: 260,        // Total de paradas
    tiempoMuertoActual: 97.5,    // Tiempo muerto acumulado (minutos)
    velocidadActual: 50.0,       // Bultos por hora
    transacciones: [...],        // Array de transacciones
    fechaGuardado: "2024-01-15T14:30:00.000Z"
}
```

#### 2️⃣ **Nivel 2: Datos desde variable global** (PRIORIDAD MEDIA)
```javascript
if (typeof datosProcesados !== 'undefined' && datosProcesados)
```

**Origen**: Si `rendimiento.html` está abierto en otra pestaña y tiene la variable `datosProcesados` en memoria.

**Cuándo funciona**: 
- Si ambas páginas están abiertas simultáneamente
- Si `rendimiento.html` ya procesó datos pero no los guardó en localStorage

#### 3️⃣ **Nivel 3: Datos Simulados** (FALLBACK)
```javascript
// Si no hay datos reales, usa simulación
calcularBultosActuales()  // Simula bultos basado en hora del día
calcularParadasActuales() // Calcula como 80% de bultos
calcularTiempoMuertoActual() // Simula 15 min por hora
```

**Cuándo se usa**:
- Cuando no hay datos procesados en `rendimiento.html`
- Para pruebas y desarrollo
- Cuando es la primera vez que usas el sistema

---

## 🔄 Flujo Completo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario carga Excel en rendimiento.html                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. procesarDatosTiempoMuerto() procesa el Excel            │
│     - Extrae: bultos, paradas, fechas, usuarios            │
│     - Calcula: tiempo muerto, eficiencia                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. guardarDatosParaProyecciones() se ejecuta automáticamente│
│     - Calcula totales (bultos, paradas, tiempo muerto)     │
│     - Calcula horas trabajadas y velocidad                    │
│     - Guarda en localStorage                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Usuario abre proyecciones.html                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. cargarDatosActuales() intenta cargar datos:            │
│     ✓ Intenta desde localStorage (Nivel 1)                 │
│     ✓ Si falla, intenta desde variable global (Nivel 2)    │
│     ✓ Si falla, usa simulación (Nivel 3)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Sistema calcula proyecciones con datos reales          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Funciones Auxiliares y su Origen de Datos

### `calcularBultosActuales()`
**Origen**: 
- **Real**: `datosActuales.bultosActuales` (desde rendimiento.html)
- **Simulado**: `200 * factorHora * (1 + random)` (valor base * factor horario * variación)

### `calcularParadasActuales()`
**Origen**:
- **Real**: `datosActuales.paradasActuales` (desde rendimiento.html)
- **Simulado**: `bultosActuales * 0.8` (80% de bultos)

### `calcularTiempoMuertoActual()`
**Origen**:
- **Real**: `datosActuales.tiempoMuertoActual` (suma de tiempo muerto +5min de todos los usuarios)
- **Simulado**: `horasTrabajadas * 15` (15 minutos por hora promedio)

### `calcularVelocidadActual()`
**Origen**:
- **Real**: `bultosActuales / horasTrabajadas` (calculado desde datos reales)
- **Simulado**: `META_BULTOS_POR_HORA` (50 bultos/hora) si no hay horas trabajadas

---

## 🔍 Cómo Verificar el Origen de los Datos

Abre la consola del navegador (F12) y verás mensajes:

### ✅ Si usa datos reales:
```
✅ Datos cargados desde módulo de rendimiento
```

### ⚠️ Si usa simulación:
```
⚠️ No se encontraron datos reales, usando simulación
```

---

## 🛠️ Cómo Asegurar que Use Datos Reales

### Opción 1: Procesar Excel en rendimiento.html primero
1. Abre `rendimiento.html`
2. Carga y procesa tu archivo Excel
3. Los datos se guardan automáticamente
4. Abre `proyecciones.html`
5. Los datos se cargarán automáticamente

### Opción 2: Guardar datos manualmente
Si necesitas guardar datos manualmente desde `rendimiento.html`:

```javascript
// En la consola del navegador en rendimiento.html
guardarDatosParaProyecciones();
```

### Opción 3: Verificar datos guardados
```javascript
// En la consola del navegador
const datos = JSON.parse(localStorage.getItem('proyecciones_datos_actuales'));
console.log(datos);
```

---

## 📊 Datos Históricos

Los datos históricos se guardan en:
```javascript
localStorage.getItem('proyecciones_historicos')
```

**Origen**: 
- Se agregan automáticamente cuando procesas datos en `rendimiento.html`
- Se mantienen los últimos 7 días
- Formato: Array de objetos con `fecha`, `hora`, `velocidad`, `bultos`, `paradas`

**Cuándo se actualizan**:
- Cada vez que procesas un Excel en `rendimiento.html`
- Se agregan datos por hora del día actual
- Se eliminan datos más antiguos de 7 días

---

## 🎯 Resumen

| Función | Origen Real | Origen Simulado |
|---------|------------|-----------------|
| `cargarDatosActuales()` | localStorage desde rendimiento.html | Cálculos simulados |
| `calcularBultosActuales()` | `datosActuales.bultosActuales` | `200 * factorHora * random` |
| `calcularParadasActuales()` | `datosActuales.paradasActuales` | `bultos * 0.8` |
| `calcularTiempoMuertoActual()` | `datosActuales.tiempoMuertoActual` | `horas * 15 min` |
| `calcularVelocidadActual()` | `bultos / horas` | `50 bultos/hora` |

---

**Nota**: Para usar datos reales, siempre procesa primero el Excel en `rendimiento.html` antes de abrir `proyecciones.html`.

