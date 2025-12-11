/**
 * Módulo Compartido para Integración de Proyecciones
 * Este archivo contiene funciones que pueden ser usadas por todos los módulos
 * para guardar datos y prepararlos para el sistema de proyecciones
 * 
 * @author Mzequeira
 * @version 1.0.0
 */

/**
 * Guarda los datos procesados en localStorage para que proyecciones.html los use
 * Esta función debe ser llamada después de procesar datos en cualquier módulo de rendimiento
 * 
 * @param {Object} datosProcesados - Objeto con la estructura:
 *   - usuarios: Object con datos de usuarios
 *   - datosFiltrados: Array de transacciones
 *   - primeraFecha: Date de primera transacción
 */
function guardarDatosParaProyecciones(datosProcesados) {
    if (!datosProcesados) {
        console.warn('⚠️ No hay datos procesados para guardar');
        return;
    }

    try {
        const ahora = new Date();
        const usuarios = datosProcesados.usuarios || {};
        const datosFiltrados = datosProcesados.datosFiltrados || [];

        // Calcular totales
        let totalBultos = 0;
        let totalParadas = 0;
        let totalTiempoMuerto = 0;
        let primeraFecha = null;
        let ultimaFecha = null;

        Object.values(usuarios).forEach(usuario => {
            totalBultos += usuario.totalBultos || 0;
            totalParadas += usuario.totalParadas || 0;
            
            // Sumar tiempo muerto (priorizar +5min, luego +3min)
            if (usuario.tiempoMuerto5min && usuario.tiempoMuerto5min.total) {
                totalTiempoMuerto += usuario.tiempoMuerto5min.total;
            } else if (usuario.tiempoMuerto3min && usuario.tiempoMuerto3min.total) {
                totalTiempoMuerto += usuario.tiempoMuerto3min.total;
            }

            // Encontrar primera y última fecha
            if (usuario.primeraTransaccion) {
                const fecha = usuario.primeraTransaccion instanceof Date 
                    ? usuario.primeraTransaccion 
                    : new Date(usuario.primeraTransaccion);
                
                if (!primeraFecha || fecha < primeraFecha) {
                    primeraFecha = fecha;
                }
            }

            if (usuario.ultimaTransaccion) {
                const fecha = usuario.ultimaTransaccion instanceof Date 
                    ? usuario.ultimaTransaccion 
                    : new Date(usuario.ultimaTransaccion);
                
                if (!ultimaFecha || fecha > ultimaFecha) {
                    ultimaFecha = fecha;
                }
            }
        });

        // Si no hay fechas en usuarios, intentar desde datosFiltrados
        if (!primeraFecha && datosFiltrados.length > 0) {
            const fechas = datosFiltrados
                .map(d => d.fecha instanceof Date ? d.fecha : new Date(d.fecha))
                .filter(f => !isNaN(f.getTime()))
                .sort((a, b) => a - b);
            
            if (fechas.length > 0) {
                primeraFecha = fechas[0];
                ultimaFecha = fechas[fechas.length - 1];
            }
        }

        // Calcular horas trabajadas
        let horasTrabajadas = 0;
        if (primeraFecha && ultimaFecha) {
            horasTrabajadas = (ultimaFecha - primeraFecha) / (1000 * 60 * 60);
        } else {
            // Fallback: calcular desde hora actual
            const horaInicio = 8; // Asumiendo inicio a las 8 AM
            horasTrabajadas = Math.max(0, ahora.getHours() - horaInicio + ahora.getMinutes() / 60);
        }

        // Calcular velocidad actual
        const velocidadActual = horasTrabajadas > 0 
            ? totalBultos / horasTrabajadas 
            : 0;

        const datosParaProyecciones = {
            hora: ahora.getHours(),
            minutos: ahora.getMinutes(),
            horasTrabajadas: Math.max(0, horasTrabajadas),
            bultosActuales: totalBultos,
            paradasActuales: totalParadas,
            tiempoMuertoActual: totalTiempoMuerto,
            velocidadActual: velocidadActual,
            transacciones: datosFiltrados.map(d => ({
                fecha: d.fecha instanceof Date ? d.fecha.toISOString() : d.fecha,
                usuario: d.usuario,
                bultos: d.bultos || 0,
                areaDestino: d.areaDestino,
                numeroCarga: d.numeroCarga
            })),
            primeraFecha: primeraFecha ? primeraFecha.toISOString() : null,
            ultimaFecha: ultimaFecha ? ultimaFecha.toISOString() : null,
            fechaGuardado: ahora.toISOString(),
            modulo: obtenerModuloActual() // Identificar de qué módulo vienen los datos
        };

        // Guardar en localStorage
        localStorage.setItem('proyecciones_datos_actuales', JSON.stringify(datosParaProyecciones));
        console.log('✅ Datos guardados para módulo de proyecciones:', {
            bultos: totalBultos,
            paradas: totalParadas,
            horasTrabajadas: horasTrabajadas.toFixed(2),
            velocidad: velocidadActual.toFixed(2)
        });

        // También agregar a datos históricos si el sistema de proyecciones está disponible
        if (typeof ProyeccionesPredictivas !== 'undefined') {
            try {
                const sistema = new ProyeccionesPredictivas();
                sistema.cargarDatosHistoricos();
                sistema.setDatosActuales(datosParaProyecciones);
                sistema.agregarDatosHistoricos(datosParaProyecciones);
            } catch (e) {
                console.warn('No se pudo agregar a datos históricos:', e);
            }
        }

        return datosParaProyecciones;
    } catch (error) {
        console.error('❌ Error al guardar datos para proyecciones:', error);
        return null;
    }
}

/**
 * Intenta determinar el módulo actual desde la URL
 * @returns {string} Nombre del módulo
 */
function obtenerModuloActual() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || '';
    
    if (filename.includes('ventilacion')) return 'ventilacion';
    if (filename.includes('recepcion')) return 'recepcion';
    if (filename.includes('despacho')) return 'despacho';
    if (filename.includes('rendimiento')) return 'rendimiento';
    
    return 'general';
}

/**
 * Verifica si hay datos guardados recientes para proyecciones
 * @param {number} maxHoras - Máximo de horas de antigüedad permitidas
 * @returns {Object|null} Datos si son recientes, null si no
 */
function obtenerDatosProyeccionesRecientes(maxHoras = 1) {
    try {
        const datosGuardados = localStorage.getItem('proyecciones_datos_actuales');
        if (!datosGuardados) return null;

        const datos = JSON.parse(datosGuardados);
        const fechaGuardada = new Date(datos.fechaGuardado || 0);
        const ahora = new Date();
        const diffHoras = (ahora - fechaGuardada) / (1000 * 60 * 60);

        if (diffHoras < maxHoras) {
            return datos;
        }

        return null;
    } catch (e) {
        console.warn('Error al obtener datos recientes:', e);
        return null;
    }
}

// Exportar funciones para uso global con nombre único para evitar conflictos
if (typeof window !== 'undefined') {
    // Usar un nombre único para evitar conflictos con funciones locales
    window.guardarDatosParaProyeccionesShared = guardarDatosParaProyecciones;
    window.obtenerDatosProyeccionesRecientes = obtenerDatosProyeccionesRecientes;
    
    // Mantener compatibilidad con el nombre original pero solo si no existe
    if (!window.guardarDatosParaProyecciones) {
        window.guardarDatosParaProyecciones = guardarDatosParaProyecciones;
    }
}

