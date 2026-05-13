const express = require('express');
const cors = require('cors');

// Importar módulos personalizados
const mqttService = require('./services/mqttService');
const mongoService = require('./services/mongoService');
const { getCurrentDateTime, getCurrentDate, getCurrentTime, getCurrentTimestamp } = require('./utils/dateTimeUtils');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Variables globales para el estado de las habitaciones
let roomStates = {
  sala: false,
  cuarto1: false,
  cuarto2: false,
  rgb_room: { isOn: false, color: '#ffffff' },
  ventilador: false,
  bomba_agua: false,
  alarma: false
};

// =================================
// SECCIÓN: RUTAS GENERALES DE INFORMACIÓN
// =================================

// Obtener lista de colecciones disponibles
app.get('/api/collections', (req, res) => {
    try {
        const collections = mongoService.getAvailableCollections();
        res.json({
            success: true,
            data: collections,
            message: 'Colecciones disponibles'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener estadísticas de todas las colecciones
app.get('/api/collections/stats', async (req, res) => {
    try {
        const stats = await mongoService.getAllCollectionsStats();
        res.json({
            success: true,
            data: stats,
            message: 'Estadísticas de todas las colecciones'
        });
    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Descubrir colecciones faltantes
app.get('/api/collections/discover', async (req, res) => {
    try {
        const dbCollections = await mongoService.getAvailableCollectionsFromDB();
        const codeCollections = Object.keys(mongoService.collections);
        
        const missing = dbCollections.filter(col => !codeCollections.includes(col));
        const extra = codeCollections.filter(col => !dbCollections.includes(col));
        
        res.json({
            success: true,
            data: {
                database_collections: dbCollections,
                code_collections: codeCollections,
                missing_in_code: missing,
                extra_in_code: extra,
                total_db_collections: dbCollections.length,
                total_code_collections: codeCollections.length
            },
            message: 'Análisis de colecciones completado'
        });
    } catch (error) {
        console.error('Error al descubrir colecciones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - ALERTS
// =================================

// Obtener todos los registros de alerts
app.get('/api/alerts', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('alerts', parseInt(limit)) :
            await mongoService.getAllFromCollection('alerts');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener alerts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de alerts
app.get('/api/alerts/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('alerts', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener alerts recientes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - ENTRADA EVENTOS
// =================================

// Obtener todos los registros de entrada_eventos
app.get('/api/entrada-eventos', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('entrada_eventos', parseInt(limit)) :
            await mongoService.getAllFromCollection('entrada_eventos');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener entrada_eventos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de entrada_eventos
app.get('/api/entrada-eventos/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('entrada_eventos', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener entrada_eventos recientes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - ILUMINACIÓN
// =================================

// Obtener todos los registros de iluminación
app.get('/api/ilumination', async (req, res) => {
    try {
        const ilumination = await mongoService.getAllIlumination();
        res.json({ 
            success: true, 
            data: ilumination 
        });
    } catch (error) {
        console.error('Error al obtener iluminación:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Buscar registro de iluminación por nombre
app.get('/api/ilumination/:nombre', async (req, res) => {
    try {
        const { nombre } = req.params;
        const ilumination = await mongoService.getIluminationByName(nombre);
        
        if (ilumination) {
            res.json({ 
                success: true, 
                data: ilumination 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Registro de iluminación no encontrado' 
            });
        }
    } catch (error) {
        console.error('Error al buscar iluminación:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - HUMEDAD SUELO
// =================================

// Obtener todos los registros de humedad del suelo
app.get('/api/humedad-suelo', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('humedad_suelo', parseInt(limit)) :
            await mongoService.getAllFromCollection('humedad_suelo');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener humedad del suelo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de humedad del suelo
app.get('/api/humedad-suelo/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('humedad_suelo', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener datos recientes de humedad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - MOVIMIENTO
// =================================

// Obtener todos los registros de movimiento
app.get('/api/movimiento', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('movimiento', parseInt(limit)) :
            await mongoService.getAllFromCollection('movimiento');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener datos de movimiento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de movimiento
app.get('/api/movimiento/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('movimiento', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener datos recientes de movimiento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - RIEGO EVENTOS
// =================================

// Obtener todos los registros de eventos de riego
app.get('/api/riego-eventos', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('riego_eventos', parseInt(limit)) :
            await mongoService.getAllFromCollection('riego_eventos');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener eventos de riego:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de eventos de riego
app.get('/api/riego-eventos/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('riego_eventos', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener eventos recientes de riego:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - TEMPERATURA
// =================================

// Obtener todos los registros de temperatura
app.get('/api/temperatura', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('temperatura', parseInt(limit)) :
            await mongoService.getAllFromCollection('temperatura');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener datos de temperatura:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de temperatura
app.get('/api/temperatura/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('temperatura', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener datos recientes de temperatura:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE MONGODB - VENTILACIÓN
// =================================

// Obtener todos los registros de ventilacion
app.get('/api/ventilacion', async (req, res) => {
    try {
        const { limit } = req.query;
        const data = limit ? 
            await mongoService.getFromCollectionWithLimit('ventilacion', parseInt(limit)) :
            await mongoService.getAllFromCollection('ventilacion');
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener ventilacion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener registros más recientes de ventilacion
app.get('/api/ventilacion/latest', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const data = await mongoService.getLatestFromCollection('ventilacion', parseInt(limit));
        
        res.json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error al obtener ventilacion recientes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE ESTADÍSTICAS INDIVIDUALES
// =================================

// Obtener estadísticas de una colección específica
app.get('/api/:collection/stats', async (req, res) => {
    try {
        const { collection } = req.params;
        const validCollections = [
            'alerts', 'entrada-eventos', 'humedad-suelo', 'ilumination', 
            'movimiento', 'riego-eventos', 'temperatura', 'usuarios', 'ventilacion'
        ];
        
        if (!validCollections.includes(collection)) {
            return res.status(400).json({
                success: false,
                error: 'Colección no válida',
                availableCollections: validCollections
            });
        }

        // Mapear nombres de URL a nombres de colección en MongoDB
        const collectionMap = {
            'entrada-eventos': 'entrada_eventos',
            'humedad-suelo': 'humedad_suelo',
            'riego-eventos': 'riego_eventos'
        };
        
        const mongoCollection = collectionMap[collection] || collection;
        const stats = await mongoService.getCollectionStats(mongoCollection);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error(`Error al obtener estadísticas de ${req.params.collection}:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE ESTADO GENERAL
// =================================

// Status del servidor y conexiones
app.get('/api/status', async (req, res) => {
    const dateTime = getCurrentDateTime();
    
    // Verificar conexión MongoDB
    let mongoStatus = false;
    try {
        mongoStatus = await mongoService.testConnection();
    } catch (error) {
        console.warn('⚠️ MongoDB no disponible:', error.message);
        mongoStatus = false;
    }
    
    res.json({
        server: 'running',
        mqtt_connected: mqttService.isConnected(),
        mongodb_connected: mongoStatus,
        mongodb_available: mongoStatus, // Mantener compatibilidad
        fecha: dateTime.fecha,
        hora: dateTime.hora,
        timestamp: dateTime.timestamp
    });
});

// Obtener estado de las habitaciones (solo lectura, no control)
app.get('/api/mqtt/rooms', (req, res) => {
    res.json({
        success: true,
        data: roomStates,
        message: 'Estado actual de las habitaciones (solo lectura)'
    });
});

// =================================
// SECCIÓN: RUTAS MQTT - CONTROL EN TIEMPO REAL
// =================================

// Obtener alertas de MQTT en tiempo real
app.get('/api/mqtt/alerts', (req, res) => {
    res.json({
        success: true,
        data: mqttService.getAlerts(),
        message: 'Alertas MQTT en tiempo real'
    });
});

// Obtener estado del servicio MQTT
app.get('/api/mqtt/status', (req, res) => {
    try {
        const status = mqttService.getStatus();
        res.json({
            success: true,
            data: status,
            message: 'Estado del servicio MQTT'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Controlar habitaciones normales (encender/apagar) vía MQTT
app.post('/api/mqtt/rooms/:room/toggle', async (req, res) => {
    const { room } = req.params;
    const { state } = req.body; // true = encender, false = apagar
    
    // Validar habitación
    if (!['sala', 'cuarto1', 'cuarto2'].includes(room)) {
        return res.status(400).json({
            success: false,
            error: 'Habitación no válida. Use: sala, cuarto1, cuarto2'
        });
    }

    try {
        const dateTime = getCurrentDateTime();
        
        const message = {
            device: "led_room",
            room,
            action: state ? "on" : "off",
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/ilumination", message);
        
        // Actualizar estado local
        roomStates[room] = state;

        res.json({
            success: true,
            data: {
                room,
                state,
                message: `Habitación ${room} ${state ? 'encendida' : 'apagada'} vía MQTT`,
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Controlar habitación RGB (encender/apagar) vía MQTT
app.post('/api/mqtt/rgb/toggle', async (req, res) => {
    const { state } = req.body;

    try {
        const rgbComponents = mqttService.hexToRgb(roomStates.rgb_room.color);
        const dateTime = getCurrentDateTime();
        
        const message = {
            device: "led_rgb",
            action: state ? "on" : "off",
            r: rgbComponents.r,
            g: rgbComponents.g,
            b: rgbComponents.b,
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/ilumination", message);
        
        roomStates.rgb_room.isOn = state;

        res.json({
            success: true,
            data: {
                room: 'rgb_room',
                state,
                color: roomStates.rgb_room.color,
                message: `Habitación RGB ${state ? 'encendida' : 'apagada'} vía MQTT`,
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cambiar color RGB vía MQTT
app.post('/api/mqtt/rgb/color', async (req, res) => {
    const { color } = req.body;

    if (!color || !color.match(/^#[0-9A-F]{6}$/i)) {
        return res.status(400).json({
            success: false,
            error: 'Color hex no válido. Use formato: #RRGGBB'
        });
    }

    try {
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        const dateTime = getCurrentDateTime();

        const message = {
            device: "led_rgb",
            action: "color",
            r, g, b,
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/ilumination", message);
        
        roomStates.rgb_room.color = color;

        res.json({
            success: true,
            data: {
                color,
                rgb: { r, g, b },
                message: 'Color RGB actualizado vía MQTT',
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Controlar portón vía MQTT
app.post('/api/mqtt/entrance/:action', async (req, res) => {
    const { action } = req.params;
    
    if (!['open', 'close'].includes(action)) {
        return res.status(400).json({
            success: false,
            error: 'Acción no válida. Use "open" o "close"'
        });
    }

    try {
        const dateTime = getCurrentDateTime();
        
        const message = {
            device: "entrance",
            action,
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/entrance", message);

        res.json({
            success: true,
            data: {
                action,
                message: `Portón ${action === 'open' ? 'abriéndose' : 'cerrándose'} vía MQTT`,
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Limpiar alertas MQTT
app.delete('/api/mqtt/alerts', (req, res) => {
    try {
        mqttService.clearAlerts();
        const dateTime = getCurrentDateTime();
        
        res.json({
            success: true,
            message: 'Alertas MQTT limpiadas',
            fecha: dateTime.fecha,
            hora: dateTime.hora
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Controlar ventilador vía MQTT
app.post('/api/mqtt/ventilador/toggle', async (req, res) => {
    const { state } = req.body; // true = encender, false = apagar
    
    try {
        const dateTime = getCurrentDateTime();
        
        const message = {
            device: "ventilador",
            action: state ? "on" : "off",
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/ventilador", message);
        
        // Actualizar estado local
        roomStates.ventilador = state;

        res.json({
            success: true,
            data: {
                device: 'ventilador',
                state,
                message: `Ventilador ${state ? 'encendido' : 'apagado'} vía MQTT`,
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Controlar bomba de agua vía MQTT
app.post('/api/mqtt/bomba-agua/toggle', async (req, res) => {
    const { state } = req.body; // true = encender, false = apagar
    
    try {
        const dateTime = getCurrentDateTime();
        
        const message = {
            device: "bomba_agua",
            action: state ? "on" : "off",
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/bomba_agua", message);
        
        // Actualizar estado local
        roomStates.bomba_agua = state;

        res.json({
            success: true,
            data: {
                device: 'bomba_agua',
                state,
                message: `Bomba de agua ${state ? 'encendida' : 'apagada'} vía MQTT`,
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Controlar alarma vía MQTT
app.post('/api/mqtt/alarma/toggle', async (req, res) => {
    const { state } = req.body; // true = encender, false = apagar
    
    try {
        const dateTime = getCurrentDateTime();
        
        const message = {
            device: "alarma",
            action: state ? "on" : "off",
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/alarma", message);
        
        // Actualizar estado local
        roomStates.alarma = state;

        res.json({
            success: true,
            data: {
                device: 'alarma',
                state,
                message: `Alarma ${state ? 'activada' : 'desactivada'} vía MQTT`,
                fecha: dateTime.fecha,
                hora: dateTime.hora
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE PRUEBA MQTT
// =================================

// Prueba de conexión MQTT
app.post('/api/mqtt/test', async (req, res) => {
    try {
        const dateTime = getCurrentDateTime();
        
        const testMessage = {
            type: "connection_test",
            message: "Prueba de conexión desde Backend API",
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };

        await mqttService.publish("/alerts", testMessage);

        res.json({
            success: true,
            message: 'Mensaje de prueba MQTT enviado',
            fecha: dateTime.fecha,
            hora: dateTime.hora
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// SECCIÓN: RUTAS DE PRUEBA MONGODB
// =================================

// Prueba de conexión MongoDB
app.get('/api/test/mongodb', async (req, res) => {
    try {
        const isConnected = await mongoService.testConnection();
        const dateTime = getCurrentDateTime();
        
        res.json({
            success: true,
            mongodb_connected: isConnected,
            message: isConnected ? 'Conexión MongoDB exitosa' : 'Error en conexión MongoDB',
            fecha: dateTime.fecha,
            hora: dateTime.hora
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================
// RUTA DE DOCUMENTACIÓN DE API             BORRAR LUEGO.
// =================================

// Documentación de endpoints disponibles
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'API Smart Home - Documentación de Endpoints',
        endpoints: {
            general: {
                '/api/status': 'GET - Estado del servidor y servicios (incluye MongoDB)',
                '/api/collections': 'GET - Lista de colecciones disponibles',
                '/api/collections/stats': 'GET - Estadísticas de todas las colecciones',
                '/api/collections/discover': 'GET - Descubrir colecciones faltantes'
            },
            database_collections: {
                '/api/alerts': 'GET - Registros de alertas de la BD (?limit=N)',
                '/api/alerts/latest': 'GET - Alertas BD más recientes (?limit=10)',
                '/api/entrada-eventos': 'GET - Eventos de entrada (?limit=N)',
                '/api/entrada-eventos/latest': 'GET - Eventos más recientes (?limit=10)',
                '/api/humedad-suelo': 'GET - Registros de humedad del suelo (?limit=N)',
                '/api/humedad-suelo/latest': 'GET - Registros más recientes (?limit=10)',
                '/api/ilumination': 'GET - Todos los registros de iluminación',
                '/api/ilumination/:nombre': 'GET - Buscar iluminación por nombre',
                '/api/movimiento': 'GET - Registros de movimiento (?limit=N)',
                '/api/movimiento/latest': 'GET - Registros más recientes (?limit=10)',
                '/api/riego-eventos': 'GET - Eventos de riego (?limit=N)',
                '/api/riego-eventos/latest': 'GET - Eventos más recientes (?limit=10)',
                '/api/temperatura': 'GET - Registros de temperatura (?limit=N)',
                '/api/temperatura/latest': 'GET - Registros más recientes (?limit=10)',
                '/api/ventilacion': 'GET - Registros de ventilación (?limit=N)',
                '/api/ventilacion/latest': 'GET - Registros más recientes (?limit=10)'
            },
            statistics: {
                '/api/:collection/stats': 'GET - Estadísticas de una colección específica'
            },
            mqtt_status: {
                '/api/mqtt/status': 'GET - Estado del servicio MQTT',
                '/api/mqtt/rooms': 'GET - Estado actual de las habitaciones (solo lectura)'
            },
            mqtt_lighting_control: {
                '/api/mqtt/rooms/:room/toggle': 'POST - Controlar habitaciones normales {state: true/false} (sala, cuarto1, cuarto2)',
                '/api/mqtt/rgb/toggle': 'POST - Controlar LED RGB encendido/apagado {state: true/false}',
                '/api/mqtt/rgb/color': 'POST - Cambiar color RGB {color: "#RRGGBB"}'
            },
            mqtt_devices_control: {
                '/api/mqtt/ventilador/toggle': 'POST - Controlar ventilador {state: true/false}',
                '/api/mqtt/bomba-agua/toggle': 'POST - Controlar bomba de agua {state: true/false}',
                '/api/mqtt/alarma/toggle': 'POST - Controlar sistema de alarma {state: true/false}'
            },
            mqtt_entrance_control: {
                '/api/mqtt/entrance/:action': 'POST - Controlar portón (action: open/close)'
            },
            mqtt_alerts: {
                '/api/mqtt/alerts': 'GET - Alertas MQTT en tiempo real',
                '/api/mqtt/alerts': 'DELETE - Limpiar alertas MQTT'
            },
            testing: {
                '/api/mqtt/test': 'POST - Prueba de conexión MQTT',
                '/api/test/mongodb': 'GET - Prueba de conexión MongoDB'
            }
        },
        query_parameters: {
            limit: 'Número máximo de registros a retornar',
            examples: [
                '/api/temperatura?limit=50',
                '/api/alerts/latest?limit=5',
                '/api/humedad-suelo?limit=20'
            ]
        },
        mqtt_topics: {
            '/ilumination': 'Control de iluminación (habitaciones normales y RGB)',
            '/entrance': 'Control de portón principal',
            '/ventilador': 'Control de ventilador',
            '/bomba_agua': 'Control de bomba de agua',
            '/alarma': 'Control del sistema de alarma',
            '/alerts': 'Alertas del sistema'
        },
        device_states: {
            rooms: {
                sala: 'boolean - Estado de luz sala',
                cuarto1: 'boolean - Estado de luz cuarto 1', 
                cuarto2: 'boolean - Estado de luz cuarto 2',
                rgb_room: {
                    isOn: 'boolean - Estado encendido/apagado',
                    color: 'string - Color actual en formato hex (#RRGGBB)'
                }
            },
            devices: {
                ventilador: 'boolean - Estado del ventilador',
                bomba_agua: 'boolean - Estado de la bomba de agua',
                alarma: 'boolean - Estado del sistema de alarma'
            }
        },
        mqtt_message_formats: {
            illumination: {
                room_control: {
                    device: 'led_room',
                    room: 'sala|cuarto1|cuarto2',
                    action: 'on|off',
                    fecha: 'DD-MM-YYYY',
                    hora: 'HH:MM',
                    timestamp: 'DD-MM-YYYY HH:MM GMT-6'
                },
                rgb_control: {
                    device: 'led_rgb',
                    action: 'on|off|color',
                    r: '0-255',
                    g: '0-255', 
                    b: '0-255',
                    fecha: 'DD-MM-YYYY',
                    hora: 'HH:MM',
                    timestamp: 'DD-MM-YYYY HH:MM GMT-6'
                }
            },
            devices: {
                ventilador: {
                    device: 'ventilador',
                    action: 'on|off',
                    fecha: 'DD-MM-YYYY',
                    hora: 'HH:MM',
                    timestamp: 'DD-MM-YYYY HH:MM GMT-6'
                },
                bomba_agua: {
                    device: 'bomba_agua',
                    action: 'on|off',
                    fecha: 'DD-MM-YYYY',
                    hora: 'HH:MM',
                    timestamp: 'DD-MM-YYYY HH:MM GMT-6'
                },
                alarma: {
                    device: 'alarma',
                    action: 'on|off',
                    fecha: 'DD-MM-YYYY',
                    hora: 'HH:MM',
                    timestamp: 'DD-MM-YYYY HH:MM GMT-6'
                }
            },
            entrance: {
                device: 'entrance',
                action: 'open|close',
                fecha: 'DD-MM-YYYY',
                hora: 'HH:MM',
                timestamp: 'DD-MM-YYYY HH:MM GMT-6'
            }
        },
        response_formats: {
            success: {
                success: true,
                data: '{ ... }',
                message: 'Descripción del resultado'
            },
            error: {
                success: false,
                error: 'Descripción del error'
            }
        },
        notes: {
            mqtt_vs_database: 'Las rutas /api/mqtt/* son para control en tiempo real vía MQTT, las otras son para datos históricos de la BD',
            collections_difference: '/api/alerts obtiene alertas históricas de la BD, /api/mqtt/alerts obtiene alertas MQTT en tiempo real',
            room_control: 'Use /api/mqtt/rooms/:room/toggle para control activo, /api/mqtt/rooms solo para consultar estado',
            rgb_control: 'RGB requiere tanto toggle (encender/apagar) como color (cambiar color) por separado',
            state_persistence: 'Los estados de dispositivos se mantienen en memoria del servidor y se sincronizan con las peticiones',
            color_format: 'Los colores RGB deben estar en formato hexadecimal: #RRGGBB (ej: #FF0000 para rojo)',
            new_devices: 'Se agregaron controles para ventilador, bomba de agua y sistema de alarma'
        }
    });
});

// =================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =================================

// Manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        message: 'Visite /api para ver la documentación de endpoints disponibles',
        suggestion: 'Verifique que esté usando la ruta correcta. Las rutas MQTT están bajo /api/mqtt/'
    });
});

// =================================
// INICIALIZACIÓN
// =================================

// Inicializar servicios
async function initializeServices() {
    try {
        console.log('🔄 Iniciando servicios...');
        
        // Inicializar MQTT
        await mqttService.init();
        console.log('✅ MQTT inicializado');
        
        // Probar conexión MongoDB
        const mongoConnected = await mongoService.testConnection();
        console.log(mongoConnected ? '✅ MongoDB conectado' : '⚠️ MongoDB no disponible');
        
        console.log('✅ Todos los servicios inicializados correctamente');
        console.log('📋 Rutas MQTT disponibles bajo /api/mqtt/');
        console.log('📋 Rutas de base de datos disponibles bajo /api/');
        
    } catch (error) {
        console.error('❌ Error al inicializar servicios:', error);
    }
}

// Inicializar servicios y servidor
initializeServices();

app.listen(port, () => {
    const dateTime = getCurrentDateTime();
    console.log(`🚀 Servidor corriendo en puerto ${port}`);
    console.log(`📡 API disponible en http://localhost:${port}/api`);
    console.log(`📚 Documentación en http://localhost:${port}/api`);
    console.log(`🔧 Control MQTT en http://localhost:${port}/api/mqtt/`);
    console.log(`⏰ Iniciado el ${dateTime.timestamp}`);
});

module.exports = app;