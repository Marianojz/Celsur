# Configuración de Integración con Google Sheets

## 📋 Pasos para Configurar Google Sheets

### Paso 1: Preparar Google Apps Script

1. **Abre tu Google Sheet**
   - URL: https://docs.google.com/spreadsheets/d/1Fso8hwkrYbPSKESzC78vGMKjZki2UrowJzFbqwjHUro/edit

2. **Abre Apps Script**
   - Ve a `Extensiones` > `Apps Script`
   - O directamente: https://script.google.com/home/projects

3. **Crea un nuevo proyecto**
   - Si no tienes uno, crea uno nuevo
   - Nombra el proyecto: "Presentismo Ventilación API"

4. **Pega el código**
   - Abre el archivo `google-apps-script.js` de este proyecto
   - Copia TODO el contenido
   - Pégalo en el editor de Apps Script
   - **IMPORTANTE**: Asegúrate de que el código esté en un archivo llamado `Code.gs`

5. **Guarda el proyecto**
   - Presiona `Ctrl+S` o `Cmd+S`
   - Dale un nombre al proyecto si es necesario

### Paso 2: Desplegar como Web App

1. **Desplegar**
   - Haz clic en `Desplegar` > `Nueva implementación`
   - O el ícono de despliegue (▶️) en la barra superior

2. **Configurar la implementación**
   - **Tipo**: Selecciona `Aplicación web`
   - **Descripción**: "API para Presentismo Ventilación"
   - **Ejecutar como**: `Yo (tu-email@gmail.com)`
   - **Quién tiene acceso**: `Cualquiera` (esto es importante para que funcione desde el navegador)
   - Haz clic en `Desplegar`

3. **Autorizar el acceso**
   - Google te pedirá autorización
   - Haz clic en `Revisar permisos`
   - Selecciona tu cuenta
   - Haz clic en `Avanzado` > `Ir a [nombre del proyecto] (no seguro)`
   - Haz clic en `Permitir`

4. **Copiar la URL**
   - Después de desplegar, verás una URL tipo:
     ```
     https://script.google.com/macros/s/AKfycby.../exec
     ```
   - **Copia esta URL completa** - la necesitarás en el siguiente paso

### Paso 3: Configurar en la Aplicación

1. **Abre presentismo.html**
   - En tu navegador, abre el módulo de presentismo

2. **Configurar URL**
   - Haz clic en el botón `Config` (ícono de engranaje)
   - Pega la URL que copiaste en el paso anterior
   - Haz clic en `Aceptar`

3. **Verificar conexión**
   - La página se recargará automáticamente
   - Deberías ver un mensaje: "✅ Conectado a Google Sheets"
   - Si ves un error, revisa los pasos anteriores

### Paso 4: Estructura del Google Sheet

Tu Google Sheet debe tener las siguientes columnas (en este orden):

| Columna | Nombre | Descripción |
|---------|--------|-------------|
| A | ID | Identificador único del empleado |
| B | Turno | Número de turno |
| C | Apellido y Nombre | Nombre completo |
| D | Ausencias | Contador de ausencias |
| E | Tarde | Contador de llegadas tarde |
| F | Contrato | EF o EV |
| G | Función | Supervisor, Ventilador, etc. |
| H | F. Ingreso | Fecha de ingreso (formato dd/mm/yyyy) |
| I | Días Trab. | Días trabajados (calculado) |
| J | Notas | Notas adicionales |
| K+ | 1, 2, 3... | Columnas para cada día del mes (1-31) |

**Nota**: Los encabezados deben estar en la primera fila.

## 🔧 Funcionalidades

### ✅ Lo que funciona automáticamente:

1. **Carga de datos**
   - Al abrir presentismo.html, carga automáticamente desde Google Sheets
   - Si no hay conexión, usa datos locales (localStorage)

2. **Guardado automático**
   - Cada cambio de asistencia se guarda automáticamente en Google Sheets
   - El botón "Guardar Presentismo" sincroniza todos los datos

3. **Gestión de empleados**
   - Agregar, editar y eliminar empleados se sincroniza con Google Sheets

4. **Consultas de fechas pasadas**
   - Puedes cambiar el mes/año en los selectores
   - Los datos se cargan automáticamente desde Google Sheets

### 🔄 Sincronización Manual

- Usa el botón **"Sincronizar"** para forzar una actualización desde Google Sheets
- Útil si otros usuarios han hecho cambios

## 🐛 Solución de Problemas

### Error: "No se pudo conectar a Google Sheets"

**Causas posibles:**
1. URL incorrecta - Verifica que copiaste la URL completa
2. Permisos incorrectos - Asegúrate de que la Web App esté configurada como "Cualquiera"
3. Apps Script no desplegado - Verifica que hayas desplegado la implementación

**Solución:**
1. Abre la URL de la Web App en el navegador
2. Deberías ver: `{"success":true,"message":"Google Apps Script funcionando correctamente"}`
3. Si ves un error, revisa el código de Apps Script

### Error: "Acción no válida"

**Causa**: El código de Apps Script no está correctamente instalado

**Solución:**
1. Verifica que el código esté en `Code.gs`
2. Verifica que todas las funciones estén presentes
3. Guarda y vuelve a desplegar

### Los datos no se guardan

**Causas posibles:**
1. Permisos de escritura - Verifica que la Web App tenga permisos de edición
2. Estructura del Sheet incorrecta - Verifica que las columnas estén en el orden correcto

**Solución:**
1. Verifica que puedas editar el Google Sheet manualmente
2. Revisa la consola del navegador (F12) para ver errores específicos

### Los datos se duplican

**Causa**: El ID del empleado no es único

**Solución:**
1. Verifica que cada empleado tenga un ID único
2. Si agregas un empleado nuevo, el sistema generará un ID automáticamente

## 📝 Notas Importantes

1. **Backup**: Aunque los datos se guardan en Google Sheets, es recomendable hacer backups periódicos
2. **Límites de Google Apps Script**: 
   - 20,000 llamadas por día (suficiente para uso normal)
   - 6 minutos de tiempo de ejecución máximo
3. **Modo offline**: Si no hay conexión, la app funciona en modo local y sincroniza cuando se restablece la conexión

## 🔐 Seguridad

- La URL de la Web App es pública pero solo permite las acciones definidas en el código
- No expone datos sensibles más allá de lo necesario
- Puedes restringir el acceso editando los permisos en Apps Script

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que el código de Apps Script esté correctamente instalado
3. Prueba la URL de la Web App directamente en el navegador

---

**Versión**: 1.0.0  
**Fecha**: 2024


