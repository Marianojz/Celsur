// ============================================
// SISTEMA DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================

/**
 * Verifica si el usuario está autenticado
 * @returns {Object|null} Objeto con información de la sesión o null si no está autenticado
 */
function verificarAutenticacion() {
    const userSession = localStorage.getItem('userSession');
    
    if (!userSession) {
        return null;
    }

    try {
        const session = JSON.parse(userSession);
        const ahora = new Date().getTime();
        
        // Verificar si la sesión no ha expirado (24 horas)
        if (session.expiresAt && ahora < session.expiresAt) {
            return session;
        } else {
            // Sesión expirada
            cerrarSesion();
            return null;
        }
    } catch (e) {
        console.error('Error al verificar autenticación:', e);
        cerrarSesion();
        return null;
    }
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Rol a verificar ('admin' o 'usuario')
 * @returns {boolean} True si el usuario tiene el rol
 */
function tieneRol(role) {
    const session = verificarAutenticacion();
    if (!session) {
        return false;
    }
    return session.role === role;
}

/**
 * Verifica si el usuario es administrador
 * @returns {boolean} True si el usuario es admin
 */
function esAdmin() {
    return tieneRol('admin');
}

/**
 * Verifica si el usuario es usuario común
 * @returns {boolean} True si el usuario es común
 */
function esUsuario() {
    return tieneRol('usuario');
}

/**
 * Obtiene la información del usuario actual
 * @returns {Object|null} Información del usuario o null
 */
function obtenerUsuario() {
    return verificarAutenticacion();
}

/**
 * Cierra la sesión del usuario
 */
function cerrarSesion() {
    localStorage.removeItem('userSession');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

/**
 * Requiere autenticación para acceder a una página
 * Redirige a login si no está autenticado
 */
function requerirAutenticacion() {
    const session = verificarAutenticacion();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Requiere rol de administrador para acceder a una página
 * Redirige a login si no está autenticado o a index si no es admin
 */
function requerirAdmin() {
    if (!requerirAutenticacion()) {
        return false;
    }
    
    if (!esAdmin()) {
        alert('No tienes permisos para acceder a esta sección.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

/**
 * Actualiza la información del usuario en la interfaz
 * @param {string} selector - Selector del elemento donde mostrar el nombre
 */
function actualizarInfoUsuario(selector) {
    const usuario = obtenerUsuario();
    if (usuario && selector) {
        const elemento = document.querySelector(selector);
        if (elemento) {
            elemento.textContent = usuario.nombre || usuario.username;
        }
    }
}

/**
 * Muestra/oculta elementos según el rol del usuario
 * @param {string} selector - Selector del elemento a mostrar/ocultar
 * @param {string} role - Rol requerido ('admin' o 'usuario')
 */
function mostrarSegunRol(selector, role) {
    const elementos = document.querySelectorAll(selector);
    const tienePermiso = role === 'admin' ? esAdmin() : (role === 'usuario' ? esUsuario() : false);
    
    elementos.forEach(elemento => {
        if (elemento) {
            elemento.style.display = tienePermiso ? '' : 'none';
        }
    });
}

