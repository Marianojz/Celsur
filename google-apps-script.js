/**
 * Google Apps Script para Integración con Presentismo
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1Fso8hwkrYbPSKESzC78vGMKjZki2UrowJzFbqwjHUro/edit
 * 2. Ve a Extensiones > Apps Script
 * 3. Pega este código completo
 * 4. Guarda el proyecto (Ctrl+S)
 * 5. Despliega > Nueva implementación > Tipo: Aplicación web
 * 6. Ejecutar como: Yo
 * 7. Quién tiene acceso: Cualquiera
 * 8. Copia la URL de la implementación y úsala en presentismo.html
 */

// ID de la hoja de cálculo
const SPREADSHEET_ID = '1Fso8hwkrYbPSKESzC78vGMKjZki2UrowJzFbqwjHUro';
const SHEET_GID = '1872894944';

/**
 * Función principal para manejar peticiones HTTP
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'getEmployees':
        return ContentService.createTextOutput(JSON.stringify(getEmployees()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'saveEmployee':
        return ContentService.createTextOutput(JSON.stringify(saveEmployee(data.employee)))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'updateAttendance':
        return ContentService.createTextOutput(JSON.stringify(updateAttendance(data.attendance)))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'getAttendance':
        return ContentService.createTextOutput(JSON.stringify(getAttendance(data.filters)))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'deleteEmployee':
        return ContentService.createTextOutput(JSON.stringify(deleteEmployee(data.employeeId)))
          .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Acción no válida'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función para peticiones GET (útil para pruebas)
 */
function doGet(e) {
  const action = e.parameter.action || 'getEmployees';
  
  try {
    switch(action) {
      case 'getEmployees':
        return ContentService.createTextOutput(JSON.stringify(getEmployees()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'test':
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Google Apps Script funcionando correctamente'
        })).setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Acción no válida'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtiene la hoja de cálculo activa
 */
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  // Intentar obtener la hoja por GID
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId().toString() === SHEET_GID) {
      return sheets[i];
    }
  }
  // Si no se encuentra, usar la primera hoja
  return spreadsheet.getActiveSheet();
}

/**
 * Obtiene todos los empleados
 */
function getEmployees() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return {success: true, employees: []};
    }
    
    // Asumir que la primera fila son los encabezados
    const headers = data[0];
    const employees = [];
    
    // Buscar índices de columnas
    const idIndex = headers.indexOf('ID') !== -1 ? headers.indexOf('ID') : 0;
    const turnIndex = headers.indexOf('Turno') !== -1 ? headers.indexOf('Turno') : 1;
    const nameIndex = headers.indexOf('Apellido y Nombre') !== -1 ? headers.indexOf('Apellido y Nombre') : 2;
    const contractIndex = headers.indexOf('Contrato') !== -1 ? headers.indexOf('Contrato') : 5;
    const functionIndex = headers.indexOf('Función') !== -1 ? headers.indexOf('Función') : 6;
    const startDateIndex = headers.indexOf('F. Ingreso') !== -1 ? headers.indexOf('F. Ingreso') : 7;
    const absencesIndex = headers.indexOf('Ausencias') !== -1 ? headers.indexOf('Ausencias') : 3;
    const lateIndex = headers.indexOf('Tarde') !== -1 ? headers.indexOf('Tarde') : 4;
    
    // Procesar filas de datos
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idIndex] && !row[nameIndex]) continue; // Saltar filas vacías
      
      const employee = {
        id: row[idIndex] || i,
        turn: row[turnIndex] || 1,
        name: row[nameIndex] || '',
        contract: row[contractIndex] || 'EF',
        function: row[functionIndex] || '',
        startDate: formatDateForJS(row[startDateIndex]),
        absences: row[absencesIndex] || 0,
        late: row[lateIndex] || 0,
        notes: '',
        attendance: {}
      };
      
      // Leer datos de asistencia de las columnas de días
      const daysInMonth = 31; // Máximo días a leer
      for (let day = 1; day <= daysInMonth; day++) {
        const dayIndex = headers.length - 32 + day; // Asumiendo que los días están al final
        if (dayIndex < headers.length && row[dayIndex]) {
          const dateKey = getDateKeyForDay(day, dayIndex, headers);
          if (dateKey) {
            employee.attendance[dateKey] = row[dayIndex];
          }
        }
      }
      
      employees.push(employee);
    }
    
    return {success: true, employees: employees};
  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Guarda o actualiza un empleado
 */
function saveEmployee(employee) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Buscar si el empleado ya existe
    const idIndex = headers.indexOf('ID');
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == employee.id) {
        rowIndex = i + 1; // +1 porque las filas en Sheets empiezan en 1
        break;
      }
    }
    
    // Preparar datos de la fila
    const rowData = [];
    headers.forEach(header => {
      switch(header) {
        case 'ID':
          rowData.push(employee.id);
          break;
        case 'Turno':
          rowData.push(employee.turn);
          break;
        case 'Apellido y Nombre':
          rowData.push(employee.name);
          break;
        case 'Ausencias':
          rowData.push(employee.absences || 0);
          break;
        case 'Tarde':
          rowData.push(employee.late || 0);
          break;
        case 'Contrato':
          rowData.push(employee.contract);
          break;
        case 'Función':
          rowData.push(employee.function);
          break;
        case 'F. Ingreso':
          rowData.push(formatDateForSheet(employee.startDate));
          break;
        default:
          // Para columnas de días, mantener el valor existente o vacío
          if (rowIndex > 0) {
            rowData.push(data[rowIndex - 1][headers.indexOf(header)] || '');
          } else {
            rowData.push('');
          }
      }
    });
    
    if (rowIndex > 0) {
      // Actualizar fila existente
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Agregar nueva fila
      sheet.appendRow(rowData);
    }
    
    return {success: true, employee: employee};
  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Actualiza la asistencia de un empleado
 */
function updateAttendance(attendanceData) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const {employeeId, date, status} = attendanceData;
    
    // Buscar fila del empleado
    const idIndex = headers.indexOf('ID');
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == employeeId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {success: false, error: 'Empleado no encontrado'};
    }
    
    // Buscar columna de la fecha
    const dateObj = new Date(date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    // Buscar columna que corresponda a este día
    let colIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] == day || (typeof headers[i] === 'number' && headers[i] == day)) {
        // Verificar que sea del mes correcto (esto requiere más lógica)
        colIndex = i + 1; // +1 porque las columnas en Sheets empiezan en 1
        break;
      }
    }
    
    if (colIndex === -1) {
      // Si no existe la columna, agregarla al final
      const lastCol = headers.length + 1;
      sheet.getRange(1, lastCol).setValue(day);
      colIndex = lastCol;
    }
    
    // Actualizar celda
    sheet.getRange(rowIndex, colIndex).setValue(status);
    
    // Actualizar contador de ausencias si es necesario
    if (status === 'A') {
      updateAbsencesCount(sheet, rowIndex, headers);
    }
    
    return {success: true};
  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Obtiene datos de asistencia con filtros
 */
function getAttendance(filters) {
  try {
    const employees = getEmployees().employees;
    const {month, year, employeeId} = filters || {};
    
    let filteredEmployees = employees;
    
    if (employeeId) {
      filteredEmployees = employees.filter(emp => emp.id == employeeId);
    }
    
    // Filtrar por mes/año si se especifica
    const attendanceData = {};
    filteredEmployees.forEach(emp => {
      const empAttendance = {};
      Object.keys(emp.attendance).forEach(dateKey => {
        const date = new Date(dateKey);
        if (!month || date.getMonth() === month - 1) {
          if (!year || date.getFullYear() === year) {
            empAttendance[dateKey] = emp.attendance[dateKey];
          }
        }
      });
      if (Object.keys(empAttendance).length > 0) {
        attendanceData[emp.id] = empAttendance;
      }
    });
    
    return {success: true, attendance: attendanceData};
  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Elimina un empleado
 */
function deleteEmployee(employeeId) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == employeeId) {
        sheet.deleteRow(i + 1);
        return {success: true};
      }
    }
    
    return {success: false, error: 'Empleado no encontrado'};
  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Actualiza el contador de ausencias
 */
function updateAbsencesCount(sheet, rowIndex, headers) {
  try {
    const absencesIndex = headers.indexOf('Ausencias');
    if (absencesIndex === -1) return;
    
    // Contar ausencias en las columnas de días
    const rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    let absencesCount = 0;
    
    // Asumir que las columnas de días empiezan después de las columnas fijas
    const fixedColumns = 10; // ID, Turno, Nombre, Ausencias, Tarde, Contrato, Función, F. Ingreso, Días Trab., Notas
    for (let i = fixedColumns; i < rowData.length; i++) {
      if (rowData[i] === 'A') {
        absencesCount++;
      }
    }
    
    sheet.getRange(rowIndex, absencesIndex + 1).setValue(absencesCount);
  } catch (error) {
    console.error('Error actualizando ausencias:', error);
  }
}

/**
 * Formatea una fecha para JavaScript
 */
function formatDateForJS(dateValue) {
  if (!dateValue) return '';
  
  if (dateValue instanceof Date) {
    return Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  
  if (typeof dateValue === 'string') {
    return dateValue;
  }
  
  // Si es un número (días desde 1900-01-01 en Excel)
  if (typeof dateValue === 'number') {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  
  return '';
}

/**
 * Formatea una fecha para Google Sheets
 */
function formatDateForSheet(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

/**
 * Obtiene la clave de fecha para un día específico
 */
function getDateKeyForDay(day, colIndex, headers) {
  // Esta función necesita más lógica para determinar el año y mes
  // Por ahora, asumimos el mes y año actual
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}


