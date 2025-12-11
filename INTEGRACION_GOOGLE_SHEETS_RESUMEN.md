# ✅ Integración con Google Sheets - Resumen

## 🎯 Lo que se ha implementado

### 1. **Archivos Creados**

- ✅ `google-apps-script.js` - Código para Google Apps Script
- ✅ `google-sheets-integration.js` - Módulo JavaScript para comunicación con Google Sheets
- ✅ `GOOGLE_SHEETS_SETUP.md` - Guía completa de instalación
- ✅ `INTEGRACION_GOOGLE_SHEETS_RESUMEN.md` - Este archivo

### 2. **Modificaciones en presentismo.html**

- ✅ Integración con Google Sheets API
- ✅ Botones de sincronización y configuración
- ✅ Carga automática desde Google Sheets
- ✅ Guardado automático en tiempo real
- ✅ Fallback a localStorage si no hay conexión
- ✅ Sistema de notificaciones
- ✅ Consultas de fechas pasadas

## 🚀 Funcionalidades Implementadas

### ✅ Escritura en Google Sheets
- Cada cambio de asistencia se guarda automáticamente
- Agregar/editar/eliminar empleados se sincroniza
- Botón "Guardar Presentismo" sincroniza todo

### ✅ Lectura desde Google Sheets
- Carga automática al abrir la aplicación
- Consultas por mes y año
- Sincronización manual con botón

### ✅ Consultas de Fechas Pasadas
- Selector de mes y año funcional
- Carga datos históricos desde Google Sheets
- Mantiene compatibilidad con datos locales

### ✅ Modo Offline
- Si no hay conexión, funciona con localStorage
- Sincroniza automáticamente cuando se restablece la conexión

## 📋 Pasos para Activar

### 1. Instalar Google Apps Script (5 minutos)

1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1Fso8hwkrYbPSKESzC78vGMKjZki2UrowJzFbqwjHUro/edit
2. Ve a `Extensiones` > `Apps Script`
3. Copia TODO el contenido de `google-apps-script.js`
4. Pégalo en el editor de Apps Script
5. Guarda (Ctrl+S)

### 2. Desplegar Web App (2 minutos)

1. Haz clic en `Desplegar` > `Nueva implementación`
2. Tipo: `Aplicación web`
3. Ejecutar como: `Yo`
4. Acceso: `Cualquiera`
5. Copia la URL que aparece

### 3. Configurar en la App (1 minuto)

1. Abre `presentismo.html`
2. Haz clic en el botón `Config` (ícono de engranaje)
3. Pega la URL de la Web App
4. La página se recargará automáticamente

## 🎨 Interfaz

### Botones Nuevos

- **Sincronizar** (verde): Fuerza una sincronización desde Google Sheets
- **Config** (amarillo): Configura la URL de Google Sheets

### Notificaciones

- ✅ Verde: Operación exitosa
- ⚠️ Amarillo: Advertencia
- ❌ Rojo: Error
- ℹ️ Azul: Información

## 📊 Estructura de Datos

### En Google Sheets:

```
| ID | Turno | Apellido y Nombre | Ausencias | Tarde | Contrato | Función | F. Ingreso | Días Trab. | Notas | 1 | 2 | 3 | ... | 31 |
```

### En la Aplicación:

```javascript
{
  id: 1,
  turn: 1,
  name: "Zequeira Mariano",
  contract: "EF",
  function: "Supervisor",
  startDate: "2023-01-15",
  absences: 0,
  late: 0,
  notes: "",
  attendance: {
    "2024-01-15": "P",
    "2024-01-16": "A",
    ...
  }
}
```

## 🔄 Flujo de Datos

```
Usuario hace cambio en presentismo.html
    ↓
Se actualiza en memoria (employees array)
    ↓
Se guarda automáticamente en Google Sheets (si está conectado)
    ↓
O se guarda en localStorage (si no hay conexión)
    ↓
Al sincronizar, se leen datos desde Google Sheets
```

## 🛠️ API Disponible

### Endpoints del Google Apps Script:

- `GET ?action=getEmployees` - Obtiene todos los empleados
- `POST {action: 'saveEmployee', employee: {...}}` - Guarda/actualiza empleado
- `POST {action: 'updateAttendance', attendance: {...}}` - Actualiza asistencia
- `POST {action: 'getAttendance', filters: {...}}` - Obtiene asistencia con filtros
- `POST {action: 'deleteEmployee', employeeId: 123}` - Elimina empleado
- `GET ?action=test` - Prueba de conexión

## ⚙️ Configuración Avanzada

### Cambiar URL de Google Sheets:

```javascript
// En presentismo.html, línea ~710
const GOOGLE_SHEETS_WEB_APP_URL = 'TU_URL_AQUI';
```

O usa el botón Config en la interfaz.

### Modo Solo Local (sin Google Sheets):

Simplemente no configures la URL. La app funcionará con localStorage.

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| No se conecta | Verifica la URL en el botón Config |
| Datos no se guardan | Revisa permisos de la Web App (debe ser "Cualquiera") |
| Error 401 | Re-autoriza la Web App en Apps Script |
| Datos duplicados | Verifica que los IDs sean únicos |

## 📝 Notas Importantes

1. **Primera vez**: Los datos de ejemplo se mantienen hasta que cargues desde Google Sheets
2. **Backup**: Google Sheets es tu backup automático
3. **Múltiples usuarios**: Varios usuarios pueden usar la misma hoja simultáneamente
4. **Límites**: Google Apps Script tiene límites de uso diario (suficiente para uso normal)

## ✅ Checklist de Instalación

- [ ] Código de Apps Script instalado
- [ ] Web App desplegada
- [ ] URL copiada
- [ ] URL configurada en presentismo.html
- [ ] Conexión verificada (mensaje verde)
- [ ] Datos cargados desde Google Sheets
- [ ] Prueba de guardado exitosa

---

**¡Listo!** Tu sistema de presentismo ahora está integrado con Google Sheets. 🎉


