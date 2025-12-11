/**
 * Módulo de Proyecciones Predictivas
 * Sistema de análisis predictivo de productividad
 * 
 * @author Mzequeira
 * @version 1.0.0
 */

class ProyeccionesPredictivas {
    constructor(config = {}) {
        this.config = {
            HORIZONTES: config.HORIZONTES || [2, 4, 6, 8],
            META_BULTOS_POR_HORA: config.META_BULTOS_POR_HORA || 50,
            JORNADA_HORAS: config.JORNADA_HORAS || 8,
            DIAS_HISTORICOS: config.DIAS_HISTORICOS || 7,
            FACTOR_CANSANCIO_BASE: config.FACTOR_CANSANCIO_BASE || 0.02,
            UMBRAL_VERDE: config.UMBRAL_VERDE || 0.95,
            UMBRAL_AMARILLO: config.UMBRAL_AMARILLO || 0.80,
            HORA_INICIO_JORNADA: config.HORA_INICIO_JORNADA || 8,
            ...config
        };

        this.datosHistoricos = [];
        this.datosActuales = null;
        this.proyecciones = {};
        this.erroresProyeccion = []; // Para aprendizaje
    }

    /**
     * Carga datos históricos desde localStorage o fuente externa
     */
    cargarDatosHistoricos() {
        const stored = localStorage.getItem('proyecciones_historicos');
        if (stored) {
            this.datosHistoricos = JSON.parse(stored);
        }
        return this.datosHistoricos;
    }

    /**
     * Guarda datos históricos en localStorage
     */
    guardarDatosHistoricos() {
        localStorage.setItem('proyecciones_historicos', JSON.stringify(this.datosHistoricos));
    }

    /**
     * Agrega datos del día actual a los históricos
     * @param {Object} datosDia - Datos del día actual
     */
    agregarDatosHistoricos(datosDia) {
        // Agregar datos por hora
        const ahora = new Date();
        const datosPorHora = this.procesarDatosPorHora(datosDia);
        
        datosPorHora.forEach(dato => {
            this.datosHistoricos.push({
                fecha: dato.fecha,
                hora: dato.hora,
                velocidad: dato.velocidad,
                bultos: dato.bultos,
                paradas: dato.paradas,
                tiempoMuerto: dato.tiempoMuerto
            });
        });

        // Mantener solo los últimos N días
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - this.config.DIAS_HISTORICOS);
        
        this.datosHistoricos = this.datosHistoricos.filter(d => {
            const fecha = new Date(d.fecha);
            return fecha >= fechaLimite;
        });

        this.guardarDatosHistoricos();
    }

    /**
     * Procesa datos del día y los agrupa por hora
     * @param {Object} datosDia - Datos del día
     * @returns {Array} Datos agrupados por hora
     */
    procesarDatosPorHora(datosDia) {
        const datosPorHora = {};
        
        if (datosDia.transacciones && Array.isArray(datosDia.transacciones)) {
            datosDia.transacciones.forEach(trans => {
                const fecha = new Date(trans.fecha);
                const hora = fecha.getHours();
                
                if (!datosPorHora[hora]) {
                    datosPorHora[hora] = {
                        fecha: fecha.toISOString(),
                        hora: hora,
                        bultos: 0,
                        paradas: 0,
                        tiempoMuerto: 0
                    };
                }
                
                datosPorHora[hora].bultos += trans.bultos || 0;
                datosPorHora[hora].paradas += 1;
            });

            // Calcular velocidad por hora
            Object.values(datosPorHora).forEach(dato => {
                dato.velocidad = dato.bultos; // bultos por hora
            });
        }

        return Object.values(datosPorHora);
    }

    /**
     * Establece los datos actuales del día
     * @param {Object} datos - Datos actuales
     */
    setDatosActuales(datos) {
        this.datosActuales = {
            hora: datos.hora || new Date().getHours(),
            minutos: datos.minutos || new Date().getMinutes(),
            horasTrabajadas: datos.horasTrabajadas || 0,
            bultosActuales: datos.bultosActuales || 0,
            paradasActuales: datos.paradasActuales || 0,
            tiempoMuertoActual: datos.tiempoMuertoActual || 0,
            velocidadActual: datos.velocidadActual || 0,
            transacciones: datos.transacciones || []
        };

        // Calcular velocidad actual si no está definida
        if (this.datosActuales.velocidadActual === 0 && this.datosActuales.horasTrabajadas > 0) {
            this.datosActuales.velocidadActual = this.datosActuales.bultosActuales / this.datosActuales.horasTrabajadas;
        }
    }

    /**
     * Calcula todas las proyecciones
     */
    calcularProyecciones() {
        if (!this.datosActuales) {
            throw new Error('No hay datos actuales disponibles');
        }

        this.proyecciones = {};

        this.config.HORIZONTES.forEach(horizonte => {
            this.proyecciones[horizonte] = this.calcularProyeccion(horizonte);
        });

        return this.proyecciones;
    }

    /**
     * Calcula una proyección para un horizonte específico
     * @param {number} horizonteHoras - Horas hacia el futuro
     * @returns {Object} Objeto con la proyección
     */
    calcularProyeccion(horizonteHoras) {
        const horaActual = this.datosActuales.hora;
        const horasTrabajadas = this.datosActuales.horasTrabajadas;
        const velocidadActual = this.datosActuales.velocidadActual;

        // Factor horario: promedio histórico para la misma hora
        const factorHorario = this.calcularFactorHorario(horaActual + horizonteHoras);

        // Factor de cansancio (solo aplica después de 6 horas)
        let factorCansancio = 0;
        if (horasTrabajadas + horizonteHoras > 6) {
            const horasExtras = Math.max(0, (horasTrabajadas + horizonteHoras) - 6);
            factorCansancio = this.config.FACTOR_CANSANCIO_BASE * (horasExtras / 2);
        }

        // Regresión lineal simple para ajuste de tendencia
        const tendencia = this.calcularTendencia();

        // Cálculo de proyección
        const velocidadProyectada = velocidadActual * factorHorario * (1 - factorCansancio) * (1 + tendencia);
        const bultosProyectados = Math.round(velocidadProyectada * horizonteHoras);
        const bultosTotales = this.datosActuales.bultosActuales + bultosProyectados;

        // Proyección de tiempo muerto
        const tiempoMuertoPorHora = this.datosActuales.tiempoMuertoActual / Math.max(1, horasTrabajadas);
        const tiempoMuertoProyectado = tiempoMuertoPorHora * horizonteHoras;

        // Eficiencia proyectada
        const metaBultos = this.config.META_BULTOS_POR_HORA * (horasTrabajadas + horizonteHoras);
        const eficiencia = (bultosTotales / metaBultos) * 100;

        // Brecha de productividad
        const brecha = Math.max(0, metaBultos - bultosTotales);

        // Nivel de confianza
        const confianza = this.calcularConfianza(horizonteHoras);

        // Punto de inflexión
        const puntoInflexion = this.calcularPuntoInflexion(eficiencia, horasTrabajadas);

        // Margen de error
        const margenError = this.calcularMargenError(horizonteHoras, confianza);

        return {
            horizonte: horizonteHoras,
            bultosProyectados: bultosProyectados,
            bultosTotales: bultosTotales,
            tiempoMuertoProyectado: tiempoMuertoProyectado,
            eficiencia: eficiencia,
            brecha: brecha,
            confianza: confianza,
            puntoInflexion: puntoInflexion,
            velocidadProyectada: velocidadProyectada,
            factorHorario: factorHorario,
            factorCansancio: factorCansancio,
            tendencia: tendencia,
            margenError: margenError,
            metaBultos: metaBultos
        };
    }

    /**
     * Calcula el factor horario basado en datos históricos
     * @param {number} hora - Hora del día (0-23)
     * @returns {number} Factor de productividad (0-2)
     */
    calcularFactorHorario(hora) {
        // Obtener promedio histórico para esta hora
        const datosHora = this.datosHistoricos.filter(d => {
            const fecha = new Date(d.fecha);
            return fecha.getHours() === hora;
        });

        if (datosHora.length === 0) {
            // Si no hay datos históricos, usar patrón típico
            return this.obtenerFactorHorarioPatron(hora);
        }

        const promedioVelocidad = datosHora.reduce((sum, d) => sum + (d.velocidad || 0), 0) / datosHora.length;
        const velocidadBase = this.config.META_BULTOS_POR_HORA;
        return Math.max(0.5, Math.min(1.5, promedioVelocidad / velocidadBase));
    }

    /**
     * Obtiene factor horario basado en patrón típico
     * @param {number} hora - Hora del día
     * @returns {number} Factor de productividad
     */
    obtenerFactorHorarioPatron(hora) {
        if (hora >= 8 && hora < 10) return 0.9; // Inicio del día
        if (hora >= 10 && hora < 12) return 1.1; // Pico mañana
        if (hora >= 12 && hora < 14) return 0.95; // Pre-almuerzo
        if (hora >= 14 && hora < 16) return 1.0; // Post-almuerzo
        if (hora >= 16 && hora < 18) return 0.9; // Tarde
        if (hora >= 18 && hora < 20) return 0.85; // Final del día
        return 0.8; // Horas fuera de jornada
    }

    /**
     * Calcula tendencia usando regresión lineal simple
     * @returns {number} Factor de tendencia (-0.1 a 0.1)
     */
    calcularTendencia() {
        if (this.datosHistoricos.length < 3) return 0;

        // Obtener datos de las últimas horas del día actual
        const ahora = new Date();
        const datosRecientes = this.datosHistoricos
            .filter(d => {
                const fecha = new Date(d.fecha);
                const diffHoras = (ahora - fecha) / (1000 * 60 * 60);
                return diffHoras <= 24; // Últimas 24 horas
            })
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(-6); // Últimas 6 horas

        if (datosRecientes.length < 3) return 0;

        // Regresión lineal simple
        const n = datosRecientes.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        datosRecientes.forEach((dato, index) => {
            const x = index;
            const y = dato.velocidad || 0;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const velocidadPromedio = sumY / n;

        // Normalizar tendencia
        return velocidadPromedio > 0 ? Math.max(-0.1, Math.min(0.1, pendiente / velocidadPromedio)) : 0;
    }

    /**
     * Calcula nivel de confianza de la proyección
     * @param {number} horizonte - Horas hacia el futuro
     * @returns {number} Confianza (0-1)
     */
    calcularConfianza(horizonte) {
        let confianza = 0.7; // Base

        // Ajuste por cantidad de datos
        if (this.datosHistoricos.length >= 7 * 8) confianza += 0.15; // 7 días * 8 horas
        else if (this.datosHistoricos.length >= 3 * 8) confianza += 0.1;

        // Ajuste por horizonte
        if (horizonte <= 2) confianza += 0.1;
        else if (horizonte <= 4) confianza += 0.05;
        else confianza -= 0.05;

        // Ajuste por variabilidad histórica
        const variabilidad = this.calcularVariabilidad();
        confianza -= variabilidad * 0.2; // Menos confianza si hay mucha variabilidad

        return Math.min(1, Math.max(0.5, confianza));
    }

    /**
     * Calcula variabilidad en los datos históricos
     * @returns {number} Variabilidad (0-1)
     */
    calcularVariabilidad() {
        if (this.datosHistoricos.length < 2) return 0.5;

        const velocidades = this.datosHistoricos.map(d => d.velocidad || 0).filter(v => v > 0);
        if (velocidades.length < 2) return 0.5;

        const promedio = velocidades.reduce((a, b) => a + b, 0) / velocidades.length;
        const varianza = velocidades.reduce((sum, v) => sum + Math.pow(v - promedio, 2), 0) / velocidades.length;
        const desviacion = Math.sqrt(varianza);
        const coeficienteVariacion = promedio > 0 ? desviacion / promedio : 1;

        return Math.min(1, coeficienteVariacion);
    }

    /**
     * Calcula margen de error
     * @param {number} horizonte - Horas hacia el futuro
     * @param {number} confianza - Nivel de confianza
     * @returns {number} Margen de error en porcentaje
     */
    calcularMargenError(horizonte, confianza) {
        const baseError = 0.1; // 10% base
        const errorHorizonte = horizonte * 0.02; // 2% por hora
        const errorConfianza = (1 - confianza) * 0.15; // Hasta 15% según confianza

        return baseError + errorHorizonte + errorConfianza;
    }

    /**
     * Calcula punto de inflexión (hora donde se necesita intervención)
     * @param {number} eficiencia - Eficiencia actual
     * @param {number} horasTrabajadas - Horas trabajadas
     * @returns {number|null} Hora de inflexión o null
     */
    calcularPuntoInflexion(eficiencia, horasTrabajadas) {
        if (eficiencia >= this.config.UMBRAL_VERDE * 100) return null;

        const horasRestantes = this.config.JORNADA_HORAS - horasTrabajadas;
        if (horasRestantes <= 0) return null;

        const eficienciaNecesaria = (this.config.UMBRAL_VERDE * 100 - eficiencia) / horasRestantes;

        if (eficienciaNecesaria > 20) {
            // Se necesita intervención inmediata
            return horasTrabajadas;
        }

        return null;
    }

    /**
     * Registra error de proyección para aprendizaje
     * @param {number} horizonte - Horizonte de la proyección
     * @param {number} valorReal - Valor real observado
     * @param {number} valorProyectado - Valor que se proyectó
     */
    registrarError(horizonte, valorReal, valorProyectado) {
        const error = {
            fecha: new Date().toISOString(),
            horizonte: horizonte,
            valorReal: valorReal,
            valorProyectado: valorProyectado,
            errorAbsoluto: Math.abs(valorReal - valorProyectado),
            errorRelativo: valorReal > 0 ? Math.abs(valorReal - valorProyectado) / valorReal : 0
        };

        this.erroresProyeccion.push(error);

        // Mantener solo los últimos 100 errores
        if (this.erroresProyeccion.length > 100) {
            this.erroresProyeccion = this.erroresProyeccion.slice(-100);
        }

        // Guardar errores para análisis
        localStorage.setItem('proyecciones_errores', JSON.stringify(this.erroresProyeccion));
    }

    /**
     * Obtiene estadísticas de precisión de las proyecciones
     * @returns {Object} Estadísticas de precisión
     */
    obtenerEstadisticasPrecision() {
        if (this.erroresProyeccion.length === 0) {
            return {
                totalErrores: 0,
                errorPromedio: 0,
                precision: 0
            };
        }

        const errorPromedio = this.erroresProyeccion.reduce((sum, e) => sum + e.errorRelativo, 0) / this.erroresProyeccion.length;
        const precision = (1 - errorPromedio) * 100;

        return {
            totalErrores: this.erroresProyeccion.length,
            errorPromedio: errorPromedio,
            precision: precision
        };
    }

    /**
     * Genera recomendaciones basadas en las proyecciones
     * @returns {Array} Array de recomendaciones
     */
    generarRecomendaciones() {
        const recomendaciones = [];

        Object.values(this.proyecciones).forEach(proyeccion => {
            const eficiencia = proyeccion.eficiencia;
            const porcentajeMeta = eficiencia / 100;

            if (porcentajeMeta < this.config.UMBRAL_AMARILLO) {
                recomendaciones.push({
                    tipo: 'critico',
                    icono: 'exclamation-triangle',
                    mensaje: `Proyección a ${proyeccion.horizonte}h: Eficiencia crítica (${eficiencia.toFixed(1)}%). Se requiere intervención inmediata.`,
                    accion: `Aumentar velocidad a ${Math.round(proyeccion.velocidadProyectada * 1.2)} bultos/hora para alcanzar meta.`,
                    prioridad: 3
                });
            } else if (porcentajeMeta < this.config.UMBRAL_VERDE) {
                recomendaciones.push({
                    tipo: 'atencion',
                    icono: 'info-circle',
                    mensaje: `Proyección a ${proyeccion.horizonte}h: Eficiencia por debajo de meta (${eficiencia.toFixed(1)}%).`,
                    accion: `Optimizar procesos para mejorar ${(this.config.UMBRAL_VERDE * 100 - eficiencia).toFixed(1)}% de eficiencia.`,
                    prioridad: 2
                });
            }

            if (proyeccion.brecha > 0) {
                recomendaciones.push({
                    tipo: 'brecha',
                    icono: 'chart-line',
                    mensaje: `Brecha de productividad a ${proyeccion.horizonte}h: ${Math.round(proyeccion.brecha)} bultos faltantes.`,
                    accion: `Incrementar producción en ${Math.round(proyeccion.brecha / proyeccion.horizonte)} bultos/hora.`,
                    prioridad: 2
                });
            }

            if (proyeccion.puntoInflexion) {
                recomendaciones.push({
                    tipo: 'inflexion',
                    icono: 'clock',
                    mensaje: `Punto de inflexión detectado: Intervención necesaria a las ${Math.round(proyeccion.puntoInflexion)}:00.`,
                    accion: 'Revisar procesos y asignar recursos adicionales si es necesario.',
                    prioridad: 3
                });
            }
        });

        // Ordenar por prioridad
        recomendaciones.sort((a, b) => b.prioridad - a.prioridad);

        return recomendaciones;
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProyeccionesPredictivas;
}

