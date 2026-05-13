/**
 * Utilidades para manejo de fecha y hora en formato local (GMT-6)
 */

/**
 * Obtiene la fecha y hora actual en formato local (GMT-6)
 * @returns {Object} - Objeto con fecha, hora y timestamp completo
 */
function getCurrentDateTime() {
    const now = new Date();
    
    // Ajustar a GMT-6 (Guatemala)
    const gmtMinus6 = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    
    // Formatear fecha (DD-MM-YYYY)
    const day = String(gmtMinus6.getUTCDate()).padStart(2, '0');
    const month = String(gmtMinus6.getUTCMonth() + 1).padStart(2, '0');
    const year = gmtMinus6.getUTCFullYear();
    const fecha = `${day}-${month}-${year}`;
    
    // Formatear hora (HH:MM)
    const hours = String(gmtMinus6.getUTCHours()).padStart(2, '0');
    const minutes = String(gmtMinus6.getUTCMinutes()).padStart(2, '0');
    const hora = `${hours}:${minutes}`;
    
    // Timestamp completo
    const timestamp = `${fecha} ${hora} GMT-6`;
    
    return {
        fecha,
        hora,
        timestamp
    };
}

/**
 * Obtiene solo la fecha actual en formato DD-MM-YYYY
 * @returns {string}
 */
function getCurrentDate() {
    return getCurrentDateTime().fecha;
}

/**
 * Obtiene solo la hora actual en formato HH:MM
 * @returns {string}
 */
function getCurrentTime() {
    return getCurrentDateTime().hora;
}

/**
 * Obtiene el timestamp completo
 * @returns {string}
 */
function getCurrentTimestamp() {
    return getCurrentDateTime().timestamp;
}

module.exports = {
    getCurrentDateTime,
    getCurrentDate,
    getCurrentTime,
    getCurrentTimestamp
};