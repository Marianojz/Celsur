/**
 * Módulo de Integración con Google Sheets para Presentismo
 * 
 * @author Mzequeira
 * @version 1.0.0
 */

class GoogleSheetsIntegration {
    constructor(webAppUrl) {
        this.webAppUrl = webAppUrl;
        this.cache = {
            employees: null,
            lastSync: null,
            cacheDuration: 5 * 60 * 1000 // 5 minutos
        };
    }

    /**
     * Obtiene todos los empleados desde Google Sheets
     * @returns {Promise<Array>} Array de empleados
     */
    async getEmployees() {
        try {
            // Verificar caché
            if (this.cache.employees && this.cache.lastSync && 
                (Date.now() - this.cache.lastSync) < this.cache.cacheDuration) {
                return this.cache.employees;
            }

            const response = await fetch(`${this.webAppUrl}?action=getEmployees`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.cache.employees = data.employees;
                this.cache.lastSync = Date.now();
                return data.employees;
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error obteniendo empleados:', error);
            throw error;
        }
    }

    /**
     * Guarda o actualiza un empleado
     * @param {Object} employee - Datos del empleado
     * @returns {Promise<Object>} Resultado de la operación
     */
    async saveEmployee(employee) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'saveEmployee',
                    employee: employee
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Invalidar caché
                this.cache.employees = null;
                return data;
            } else {
                throw new Error(data.error || 'Error guardando empleado');
            }
        } catch (error) {
            console.error('Error guardando empleado:', error);
            throw error;
        }
    }

    /**
     * Actualiza la asistencia de un empleado
     * @param {number} employeeId - ID del empleado
     * @param {string} date - Fecha en formato YYYY-MM-DD
     * @param {string} status - Estado de asistencia (P, A, CT, C, RA)
     * @returns {Promise<Object>} Resultado de la operación
     */
    async updateAttendance(employeeId, date, status) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateAttendance',
                    attendance: {
                        employeeId: employeeId,
                        date: date,
                        status: status
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Invalidar caché
                this.cache.employees = null;
                return data;
            } else {
                throw new Error(data.error || 'Error actualizando asistencia');
            }
        } catch (error) {
            console.error('Error actualizando asistencia:', error);
            throw error;
        }
    }

    /**
     * Obtiene datos de asistencia con filtros
     * @param {Object} filters - Filtros (month, year, employeeId)
     * @returns {Promise<Object>} Datos de asistencia
     */
    async getAttendance(filters = {}) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getAttendance',
                    filters: filters
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                return data.attendance;
            } else {
                throw new Error(data.error || 'Error obteniendo asistencia');
            }
        } catch (error) {
            console.error('Error obteniendo asistencia:', error);
            throw error;
        }
    }

    /**
     * Elimina un empleado
     * @param {number} employeeId - ID del empleado
     * @returns {Promise<Object>} Resultado de la operación
     */
    async deleteEmployee(employeeId) {
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'deleteEmployee',
                    employeeId: employeeId
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Invalidar caché
                this.cache.employees = null;
                return data;
            } else {
                throw new Error(data.error || 'Error eliminando empleado');
            }
        } catch (error) {
            console.error('Error eliminando empleado:', error);
            throw error;
        }
    }

    /**
     * Sincroniza todos los datos de asistencia de un mes
     * @param {number} month - Mes (1-12)
     * @param {number} year - Año
     * @returns {Promise<Object>} Resultado de la sincronización
     */
    async syncMonth(month, year) {
        try {
            const attendance = await this.getAttendance({month, year});
            return {success: true, attendance};
        } catch (error) {
            console.error('Error sincronizando mes:', error);
            throw error;
        }
    }

    /**
     * Prueba la conexión con Google Sheets
     * @returns {Promise<boolean>} true si la conexión es exitosa
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.webAppUrl}?action=test`, {
                method: 'GET'
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('Error probando conexión:', error);
            return false;
        }
    }

    /**
     * Limpia el caché
     */
    clearCache() {
        this.cache.employees = null;
        this.cache.lastSync = null;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.GoogleSheetsIntegration = GoogleSheetsIntegration;
}


