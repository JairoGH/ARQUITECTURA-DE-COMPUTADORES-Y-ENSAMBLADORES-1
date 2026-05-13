const mqtt = require('mqtt');

/**
 * Obtiene la fecha y hora actual en formato local (GMT-6)
 */
function getCurrentDateTime() {
    const now = new Date();
    const gmtMinus6 = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    
    const day = String(gmtMinus6.getUTCDate()).padStart(2, '0');
    const month = String(gmtMinus6.getUTCMonth() + 1).padStart(2, '0');
    const year = gmtMinus6.getUTCFullYear();
    const fecha = `${day}-${month}-${year}`;
    
    const hours = String(gmtMinus6.getUTCHours()).padStart(2, '0');
    const minutes = String(gmtMinus6.getUTCMinutes()).padStart(2, '0');
    const hora = `${hours}:${minutes}`;
    
    const timestamp = `${fecha} ${hora} GMT-6`;
    
    return { fecha, hora, timestamp };
}

/**
 * Servicio para manejar conexiones MQTT con HiveMQ Cloud
 */
class MQTTService {
    constructor() {
        this.client = null;
        this.isConnectedFlag = false;
        this.alerts = [];
        
        // Configuración MQTT
        this.config = {
            url: "wss://28814b0b7e2f48dbadaec3d8fe175292.s1.eu.hivemq.cloud:8884/mqtt",
            username: "adminG3", 
            password: "arquiG3_2025",
            clientId: "backend-server-" + Math.random().toString(16).substr(2, 8),
            keepalive: 60,
            clean: true,
            reconnectPeriod: 5000,
            connectTimeout: 10000
        };
    }

    /**
     * Inicializa la conexión MQTT
     * @returns {Promise<void>}
     */
    init() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Iniciando conexión MQTT...');
            
            this.client = mqtt.connect(this.config.url, {
                username: this.config.username,
                password: this.config.password,
                clientId: this.config.clientId,
                keepalive: this.config.keepalive,
                clean: this.config.clean,
                reconnectPeriod: this.config.reconnectPeriod,
                connectTimeout: this.config.connectTimeout
            });

            this.client.on("connect", () => {
                console.log("✅ Conectado exitosamente a HiveMQ Cloud");
                this.isConnectedFlag = true;
                
                // Suscribirse a alertas
                this.client.subscribe("/alerts", { qos: 1 }, (err) => {
                    if (err) {
                        console.error("❌ Error al suscribirse a /alerts:", err);
                        reject(err);
                    } else {
                        console.log("✅ Suscrito exitosamente a /alerts");
                        resolve();
                    }
                });
            });

            this.client.on("error", (error) => {
                console.error("❌ Error de conexión MQTT:", error);
                this.isConnectedFlag = false;
                reject(error);
            });

            this.client.on("close", () => {
                console.warn("⚠️ Conexión MQTT cerrada");
                this.isConnectedFlag = false;
            });

            this.client.on("disconnect", () => {
                console.warn("⚠️ Desconectado de MQTT");
                this.isConnectedFlag = false;
            });

            this.client.on("reconnect", () => {
                console.log("🔄 Reconectando a MQTT...");
            });

            this.client.on("message", (topic, message) => {
                this.handleMessage(topic, message);
            });

            // Timeout para la conexión inicial
            setTimeout(() => {
                if (!this.isConnectedFlag) {
                    reject(new Error('Timeout en conexión MQTT'));
                }
            }, this.config.connectTimeout);
        });
    }

    /**
     * Maneja los mensajes recibidos
     * @param {string} topic - Tópico del mensaje
     * @param {Buffer} message - Contenido del mensaje
     */
    handleMessage(topic, message) {
        const messageStr = message.toString();
        console.log(`📨 Mensaje recibido en ${topic}:`, messageStr);
        
        if (topic === "/alerts") {
            const dateTime = getCurrentDateTime();
            
            const newAlert = {
                id: Date.now(),
                message: messageStr,
                fecha: dateTime.fecha,
                hora: dateTime.hora,
                timestamp: dateTime.timestamp,
                topic: topic
            };
            
            // Mantener solo los últimos 10 alerts
            this.alerts = [newAlert, ...this.alerts.slice(0, 9)];
            console.log(`🚨 Nueva alerta agregada. Total: ${this.alerts.length}`);
        }
    }

    /**
     * Publica un mensaje en un tópico
     * @param {string} topic - Tópico donde publicar
     * @param {Object|string} message - Mensaje a publicar
     * @param {Object} options - Opciones de publicación
     * @returns {Promise<void>}
     */
    publish(topic, message, options = { qos: 1 }) {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.isConnectedFlag) {
                const error = "No hay conexión MQTT activa";
                console.warn("⚠️", error);
                reject(new Error(error));
                return;
            }

            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            console.log(`📤 Publicando en ${topic}:`, messageStr);
            
            this.client.publish(topic, messageStr, options, (err) => {
                if (err) {
                    console.error(`❌ Error al publicar en ${topic}:`, err);
                    reject(err);
                } else {
                    console.log(`✅ Mensaje publicado exitosamente en ${topic}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Se suscribe a un tópico adicional
     * @param {string} topic - Tópico al cual suscribirse
     * @param {Object} options - Opciones de suscripción
     * @returns {Promise<void>}
     */
    subscribe(topic, options = { qos: 1 }) {
        return new Promise((resolve, reject) => {
            if (!this.client || !this.isConnectedFlag) {
                const error = "No hay conexión MQTT activa";
                console.warn("⚠️", error);
                reject(new Error(error));
                return;
            }

            this.client.subscribe(topic, options, (err) => {
                if (err) {
                    console.error(`❌ Error al suscribirse a ${topic}:`, err);
                    reject(err);
                } else {
                    console.log(`✅ Suscrito exitosamente a ${topic}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Desconecta del broker MQTT
     * @returns {Promise<void>}
     */
    disconnect() {
        return new Promise((resolve) => {
            if (this.client) {
                this.client.end(() => {
                    console.log("🔌 Desconectado de MQTT");
                    this.isConnectedFlag = false;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Verifica si hay conexión activa
     * @returns {boolean}
     */
    isConnected() {
        return this.isConnectedFlag;
    }

    /**
     * Obtiene las alertas almacenadas
     * @returns {Array}
     */
    getAlerts() {
        return this.alerts;
    }

    /**
     * Limpia todas las alertas
     */
    clearAlerts() {
        this.alerts = [];
        console.log("🗑️ Alertas limpiadas");
    }

    /**
     * Obtiene información del estado de la conexión
     * @returns {Object}
     */
    getStatus() {
        const dateTime = getCurrentDateTime();
        
        return {
            connected: this.isConnectedFlag,
            clientId: this.config.clientId,
            brokerUrl: this.config.url,
            alertsCount: this.alerts.length,
            lastAlert: this.alerts.length > 0 ? this.alerts[0] : null,
            fecha: dateTime.fecha,
            hora: dateTime.hora,
            timestamp: dateTime.timestamp
        };
    }

    /**
     * Función utilitaria: Convierte color hex a componentes RGB
     * @param {string} hex - Color en formato hex (#ffffff)
     * @returns {Object} - Objeto con componentes r, g, b
     */
    hexToRgb(hex) {
        if (!hex || !hex.match(/^#[0-9A-F]{6}$/i)) {
            throw new Error('Color hex no válido');
        }
        
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        
        return { r, g, b };
    }

    /**
     * Función utilitaria: Convierte componentes RGB a hex
     * @param {number} r - Componente rojo (0-255)
     * @param {number} g - Componente verde (0-255)  
     * @param {number} b - Componente azul (0-255)
     * @returns {string} - Color en formato hex
     */
    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}

// Crear instancia única del servicio
const mqttService = new MQTTService();

module.exports = mqttService;