# Sistema de Proyecciones Predictivas

## Descripción

Sistema de análisis predictivo de productividad que calcula proyecciones a diferentes horizontes temporales (2, 4, 6 y 8 horas) basándose en datos históricos y rendimiento actual del día.

## Características Principales

### 1. Proyecciones Multi-Horizonte
- **2 horas**: Proyección a corto plazo
- **4 horas**: Proyección a mediano plazo
- **6 horas**: Proyección extendida
- **8 horas**: Proyección de jornada completa

### 2. Métricas Calculadas

#### Por cada proyección:
- **Bultos Proyectados**: Cantidad total de bultos esperados
- **Tiempo Muerto**: Tiempo muerto proyectado en minutos
- **Eficiencia**: Porcentaje de eficiencia vs meta (95% = verde, 80-94% = amarillo, <80% = rojo)
- **Brecha de Productividad**: Bultos faltantes para alcanzar la meta
- **Nivel de Confianza**: Alto/Medio/Bajo según datos disponibles
- **Punto de Inflexión**: Hora donde se necesita intervención si bajo rendimiento

### 3. Algoritmos de Cálculo

#### Fórmula Principal:
```
Proyección = (Rendimiento actual * factor_horario) * (1 - factor_cansancio) * (1 + tendencia)
```

#### Componentes:

**Factor Horario:**
- Basado en promedio histórico de la misma hora en los últimos 7 días
- Si no hay datos históricos, usa patrón típico:
  - 8-10h: 0.9 (inicio del día)
  - 10-12h: 1.1 (pico mañana)
  - 12-14h: 0.95 (pre-almuerzo)
  - 14-16h: 1.0 (post-almuerzo)
  - 16-18h: 0.9 (tarde)
  - 18-20h: 0.85 (final del día)

**Factor de Cansancio:**
- Solo aplica después de 6 horas trabajadas
- Fórmula: `0.02 * (horas_extras / 2)`
- Donde `horas_extras = max(0, horas_trabajadas + horizonte - 6)`

**Tendencia (Regresión Lineal):**
- Calcula pendiente de productividad en las últimas 6 horas
- Ajusta proyección según tendencia ascendente o descendente
- Normalizado entre -0.1 y 0.1

**Nivel de Confianza:**
- Base: 70%
- +15% si hay 7+ días de datos históricos
- +10% si hay 3+ días de datos históricos
- +10% para horizontes ≤ 2 horas
- +5% para horizontes ≤ 4 horas
- -5% para horizontes > 4 horas
- -20% por variabilidad histórica

### 4. Visualizaciones

#### Tarjetas de Proyección
- Icono representativo por horizonte
- Valor principal (bultos totales)
- Variación vs meta (+/- %)
- Indicador de confianza (Alto/Medio/Bajo)
- Color según eficiencia:
  - Verde: ≥95% meta
  - Amarillo: 80-94% meta
  - Rojo: <80% meta

#### Gráfico de Línea Doble
- Línea azul: Rendimiento actual
- Línea punteada roja: Proyección
- Línea verde punteada: Meta
- Área sombreada: Margen de error

#### Tabla Comparativa
Columnas:
- Horizonte
- Bultos Proyectados
- Tiempo Muerto (min)
- Eficiencia (%)
- Alerta (Óptimo/Atención/Crítico)

### 5. Sistema de Recomendaciones

El sistema genera recomendaciones automáticas basadas en:
- Eficiencia proyectada vs meta
- Brecha de productividad
- Punto de inflexión detectado
- Tiempo muerto elevado

Tipos de recomendaciones:
- **Crítico**: Eficiencia < 80% - Intervención inmediata
- **Atención**: Eficiencia 80-94% - Optimización necesaria
- **Brecha**: Bultos faltantes para meta
- **Inflexión**: Hora específica de intervención
- **Tiempo Muerto**: Tiempo muerto elevado detectado

## Estructura de Archivos

```
proyecciones.html      # Interfaz principal
proyecciones.js        # Módulo de lógica de proyecciones
```

## Uso del Sistema

### Inicialización

```javascript
const sistema = new ProyeccionesPredictivas({
    HORIZONTES: [2, 4, 6, 8],
    META_BULTOS_POR_HORA: 50,
    JORNADA_HORAS: 8,
    DIAS_HISTORICOS: 7,
    FACTOR_CANSANCIO_BASE: 0.02,
    UMBRAL_VERDE: 0.95,
    UMBRAL_AMARILLO: 0.80
});
```

### Cargar Datos

```javascript
// Cargar datos históricos
sistema.cargarDatosHistoricos();

// Establecer datos actuales
sistema.setDatosActuales({
    hora: 14,
    minutos: 30,
    horasTrabajadas: 6.5,
    bultosActuales: 300,
    paradasActuales: 240,
    tiempoMuertoActual: 90,
    velocidadActual: 46.15
});
```

### Calcular Proyecciones

```javascript
const proyecciones = sistema.calcularProyecciones();
// Retorna objeto con proyecciones para cada horizonte
```

### Generar Recomendaciones

```javascript
const recomendaciones = sistema.generarRecomendaciones();
// Retorna array de recomendaciones ordenadas por prioridad
```

## Almacenamiento de Datos

### LocalStorage

El sistema utiliza `localStorage` para:
- **proyecciones_historicos**: Datos históricos de los últimos 7 días
- **proyecciones_errores**: Errores de proyección para aprendizaje

### Formato de Datos Históricos

```javascript
[
    {
        fecha: "2024-01-15T10:00:00.000Z",
        hora: 10,
        velocidad: 55.2,
        bultos: 55,
        paradas: 44,
        tiempoMuerto: 12
    },
    // ...
]
```

## Integración con Módulo de Rendimiento

Para integrar con datos reales del módulo de rendimiento:

```javascript
// En rendimiento.html, después de procesar datos:
function enviarDatosAProyecciones(datosProcesados) {
    const datosActuales = {
        hora: new Date().getHours(),
        minutos: new Date().getMinutes(),
        horasTrabajadas: calcularHorasTrabajadas(datosProcesados),
        bultosActuales: calcularBultosTotales(datosProcesados),
        paradasActuales: calcularParadasTotales(datosProcesados),
        tiempoMuertoActual: calcularTiempoMuertoTotal(datosProcesados),
        velocidadActual: calcularVelocidadActual(datosProcesados),
        transacciones: datosProcesados.datosFiltrados
    };

    // Guardar en localStorage para que proyecciones.html lo use
    localStorage.setItem('proyecciones_datos_actuales', JSON.stringify(datosActuales));
    
    // También agregar a históricos
    const sistema = new ProyeccionesPredictivas();
    sistema.cargarDatosHistoricos();
    sistema.setDatosActuales(datosActuales);
    sistema.agregarDatosHistoricos(datosActuales);
}
```

## Aprendizaje del Sistema

El sistema puede aprender de sus errores:

```javascript
// Registrar error cuando se conoce el valor real
sistema.registrarError(
    horizonte: 4,
    valorReal: 450,
    valorProyectado: 420
);

// Obtener estadísticas de precisión
const stats = sistema.obtenerEstadisticasPrecision();
console.log(`Precisión: ${stats.precision.toFixed(1)}%`);
```

## Configuración Avanzada

### Ajustar Factores de Cansancio

```javascript
const sistema = new ProyeccionesPredictivas({
    FACTOR_CANSANCIO_BASE: 0.03  // Aumentar si el cansancio es más pronunciado
});
```

### Cambiar Umbrales de Alerta

```javascript
const sistema = new ProyeccionesPredictivas({
    UMBRAL_VERDE: 0.98,      // Más estricto
    UMBRAL_AMARILLO: 0.85    // Más permisivo
});
```

### Ajustar Meta de Productividad

```javascript
const sistema = new ProyeccionesPredictivas({
    META_BULTOS_POR_HORA: 60  // Nueva meta
});
```

## Preguntas Frecuentes

### ¿Qué fórmulas estadísticas se usan?

1. **Regresión Lineal Simple**: Para calcular tendencia
   - Fórmula: `pendiente = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)`

2. **Promedio Ponderado**: Para factor horario
   - Promedio de velocidades históricas para la misma hora

3. **Coeficiente de Variación**: Para calcular variabilidad
   - `CV = desviación_estándar / promedio`

### ¿Cómo se estructura la base de datos?

Actualmente usa `localStorage` del navegador. Para producción, se recomienda:
- Base de datos SQL (PostgreSQL, MySQL) o NoSQL (MongoDB)
- Tablas: `datos_historicos`, `proyecciones`, `errores_proyeccion`
- Índices en: `fecha`, `hora`, `usuario`

### ¿Qué librerías de gráficos se recomiendan?

- **Chart.js**: Ya integrado, excelente para gráficos de línea
- **Highcharts**: Alternativa más potente si se necesita más funcionalidad
- **D3.js**: Para visualizaciones más personalizadas

### ¿Cómo hacer que el sistema aprenda de sus errores?

El sistema ya incluye funcionalidad de aprendizaje:
1. Registra errores con `registrarError()`
2. Analiza patrones de error
3. Ajusta factores de confianza y margen de error
4. Puede implementarse ajuste automático de factores basado en errores históricos

## Mejoras Futuras

1. **Machine Learning**: Implementar modelos ML (Random Forest, LSTM) para mejor precisión
2. **Análisis de Estacionalidad**: Detectar patrones semanales/mensuales
3. **Alertas en Tiempo Real**: Notificaciones push cuando se detecta problema
4. **Dashboard Ejecutivo**: Vista resumida para gerencia
5. **Exportación de Reportes**: PDF/Excel con proyecciones y análisis
6. **Integración con APIs**: Conectar con sistemas ERP/WMS

## Soporte

Para preguntas o problemas, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Autor**: Mzequeira  
**Fecha**: 2024

