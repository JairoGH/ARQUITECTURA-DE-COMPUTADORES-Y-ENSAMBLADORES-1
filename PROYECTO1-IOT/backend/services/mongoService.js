const { spawn } = require('child_process');

/**
 * Servicio para manejar conexiones con MongoDB usando mongosh
 * Operaciones de lectura para múltiples colecciones
 */
class MongoService {
    constructor() {
        this.connectionString = 'mongodb+srv://estuardovaquiax:qRX676MtLqktApQz@cluster0.1fjdylg.mongodb.net/';
        this.database = 'miBaseDeDatos';
        
        // Definir todas las colecciones disponibles (actualizado con todas las colecciones)
        this.collections = {
            alerts: 'alerts',
            entrada_eventos: 'entrada_eventos',
            humedad_suelo: 'humedad_suelo',
            ilumination: 'ilumination',
            movimiento: 'movimiento',
            riego_eventos: 'riego_eventos',
            temperatura: 'temperatura',
            ventilacion: 'ventilacion'
        };
    }

    /**
     * Ejecuta un comando de mongosh
     * @param {string} comando - Comando JavaScript para ejecutar en mongosh
     * @returns {Promise<string>} - Resultado del comando
     */
    ejecutarMongosh(comando) {
        return new Promise((resolve, reject) => {
            const mongosh = spawn('mongosh', [
                this.connectionString,
                '--eval', comando,
                '--quiet'
            ]);

            let resultado = '';
            let error = '';

            mongosh.stdout.on('data', (data) => {
                resultado += data.toString();
            });

            mongosh.stderr.on('data', (data) => {
                error += data.toString();
            });

            mongosh.on('close', (code) => {
                if (code === 0) {
                    resolve(resultado.trim());
                } else {
                    reject(new Error(`Error en mongosh (código ${code}): ${error}`));
                }
            });

            mongosh.on('error', (err) => {
                reject(new Error(`Error al ejecutar mongosh: ${err.message}`));
            });
        });
    }

    /**
     * Valida si una colección existe
     * @param {string} collectionName - Nombre de la colección
     * @returns {boolean} - true si la colección es válida
     */
    isValidCollection(collectionName) {
        return Object.values(this.collections).includes(collectionName);
    }

    /**
     * Obtiene las colecciones disponibles directamente de la base de datos
     * @returns {Promise<Array>} - Array con nombres de colecciones
     */
    async getAvailableCollectionsFromDB() {
        try {
            const comando = `
                use('${this.database}');
                const collections = db.listCollectionNames();
                print(JSON.stringify(collections));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            const collections = JSON.parse(resultado);
            
            console.log('📋 Colecciones encontradas en la base de datos:', collections);
            return collections;
            
        } catch (error) {
            console.error('❌ Error al obtener colecciones de la base de datos:', error.message);
            throw new Error(`Error al listar colecciones: ${error.message}`);
        }
    }

    /**
     * Método genérico para obtener todos los registros de cualquier colección
     * @param {string} collectionName - Nombre de la colección
     * @returns {Promise<Array>} - Array con todos los registros
     */
    async getAllFromCollection(collectionName) {
        try {
            if (!this.isValidCollection(collectionName)) {
                throw new Error(`Colección '${collectionName}' no válida`);
            }

            const comando = `
                use('${this.database}');
                const data = db.${collectionName}.find({}).toArray();
                print(JSON.stringify(data));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            
            if (!resultado) {
                return [];
            }
            
            const data = JSON.parse(resultado);
            console.log(`📊 Obtenidos ${data.length} registros de ${collectionName}`);
            
            return data;
            
        } catch (error) {
            console.error(`❌ Error al obtener registros de ${collectionName}:`, error.message);
            throw new Error(`Error al consultar la colección ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Método genérico para obtener registros con límite
     * @param {string} collectionName - Nombre de la colección
     * @param {number} limit - Número máximo de registros (default: 100)
     * @returns {Promise<Array>} - Array con los registros limitados
     */
    async getFromCollectionWithLimit(collectionName, limit = 100) {
        try {
            if (!this.isValidCollection(collectionName)) {
                throw new Error(`Colección '${collectionName}' no válida`);
            }

            const comando = `
                use('${this.database}');
                const data = db.${collectionName}.find({}).limit(${limit}).toArray();
                print(JSON.stringify(data));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            
            if (!resultado) {
                return [];
            }
            
            const data = JSON.parse(resultado);
            console.log(`📊 Obtenidos ${data.length} registros (límite: ${limit}) de ${collectionName}`);
            
            return data;
            
        } catch (error) {
            console.error(`❌ Error al obtener registros limitados de ${collectionName}:`, error.message);
            throw new Error(`Error al consultar la colección ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Obtiene los registros más recientes de una colección (ordenados por _id descendente)
     * @param {string} collectionName - Nombre de la colección
     * @param {number} limit - Número de registros (default: 10)
     * @returns {Promise<Array>} - Array con los registros más recientes
     */
    async getLatestFromCollection(collectionName, limit = 10) {
        try {
            if (!this.isValidCollection(collectionName)) {
                throw new Error(`Colección '${collectionName}' no válida`);
            }

            const comando = `
                use('${this.database}');
                const data = db.${collectionName}.find({}).sort({_id: -1}).limit(${limit}).toArray();
                print(JSON.stringify(data));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            
            if (!resultado) {
                return [];
            }
            
            const data = JSON.parse(resultado);
            console.log(`📊 Obtenidos ${data.length} registros más recientes de ${collectionName}`);
            
            return data;
            
        } catch (error) {
            console.error(`❌ Error al obtener registros recientes de ${collectionName}:`, error.message);
            throw new Error(`Error al consultar la colección ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Obtiene el conteo de documentos en una colección
     * @param {string} collectionName - Nombre de la colección
     * @returns {Promise<number>} - Número de documentos
     */
    async getCollectionCount(collectionName) {
        try {
            if (!this.isValidCollection(collectionName)) {
                throw new Error(`Colección '${collectionName}' no válida`);
            }

            const comando = `
                use('${this.database}');
                const count = db.${collectionName}.countDocuments();
                print(count);
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            const count = parseInt(resultado);
            
            console.log(`📊 ${collectionName}: ${count} documentos`);
            return count;
            
        } catch (error) {
            console.error(`❌ Error al contar documentos de ${collectionName}:`, error.message);
            throw new Error(`Error al contar documentos de ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Busca un documento por un campo específico
     * @param {string} collectionName - Nombre de la colección
     * @param {string} field - Campo por el cual buscar
     * @param {string} value - Valor a buscar
     * @returns {Promise<Object|null>} - Documento encontrado o null
     */
    async findByField(collectionName, field, value) {
        try {
            if (!this.isValidCollection(collectionName)) {
                throw new Error(`Colección '${collectionName}' no válida`);
            }

            if (!field || !value) {
                throw new Error('El campo y valor son requeridos');
            }

            const comando = `
                use('${this.database}');
                const document = db.${collectionName}.findOne({ ${field}: "${value}" });
                print(JSON.stringify(document));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            
            if (!resultado || resultado === 'null') {
                console.log(`🔍 No se encontró documento con ${field}: ${value}`);
                return null;
            }
            
            const document = JSON.parse(resultado);
            console.log(`✅ Encontrado documento en ${collectionName} con ${field}: ${value}`);
            
            return document;
            
        } catch (error) {
            console.error(`❌ Error al buscar documento en ${collectionName}:`, error.message);
            throw new Error(`Error al buscar en la colección ${collectionName}: ${error.message}`);
        }
    }

    // ========== MÉTODOS ESPECÍFICOS EXISTENTES ==========

    /**
     * Obtiene todos los registros de iluminación
     * @returns {Promise<Array>} - Array con todos los registros
     */
    async getAllIlumination() {
        return await this.getAllFromCollection('ilumination');
    }

    /**
     * Busca un registro de iluminación por nombre
     * @param {string} nombre - Nombre a buscar
     * @returns {Promise<Object|null>} - Registro encontrado o null
     */
    async getIluminationByName(nombre) {
        return await this.findByField('ilumination', 'nombre', nombre);
    }

    /**
     * Busca un usuario por nombre
     * @param {string} nombre - Nombre a buscar
     * @returns {Promise<Object|null>} - Usuario encontrado o null
     */
    async getUserByName(nombre) {
        return await this.findByField('usuarios', 'nombre', nombre);
    }

    /**
     * Obtiene estadísticas de una colección
     * @param {string} collectionName - Nombre de la colección
     * @returns {Promise<Object>} - Estadísticas de la colección
     */
    async getCollectionStats(collectionName) {
        try {
            if (!this.isValidCollection(collectionName)) {
                throw new Error(`Colección '${collectionName}' no válida`);
            }

            const comando = `
                use('${this.database}');
                const count = db.${collectionName}.countDocuments();
                const stats = db.${collectionName}.stats();
                print(JSON.stringify({
                    collection: "${collectionName}",
                    totalDocuments: count,
                    collectionSize: stats.size,
                    avgDocumentSize: stats.avgObjSize,
                    indexes: stats.nindexes
                }));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            const stats = JSON.parse(resultado);
            
            console.log(`📈 Estadísticas de ${collectionName} obtenidas`);
            return stats;
            
        } catch (error) {
            console.error(`❌ Error al obtener estadísticas de ${collectionName}:`, error.message);
            throw new Error(`Error al obtener estadísticas de ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Obtiene estadísticas de todas las colecciones
     * @returns {Promise<Array>} - Array con estadísticas de todas las colecciones
     */
    async getAllCollectionsStats() {
        try {
            const stats = [];
            
            for (const collection of Object.values(this.collections)) {
                try {
                    const collectionStats = await this.getCollectionStats(collection);
                    stats.push(collectionStats);
                } catch (error) {
                    console.warn(`⚠️ No se pudieron obtener estadísticas de ${collection}:`, error.message);
                    stats.push({
                        collection: collection,
                        error: error.message,
                        totalDocuments: 0
                    });
                }
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error al obtener estadísticas generales:', error.message);
            throw new Error(`Error al obtener estadísticas generales: ${error.message}`);
        }
    }

    /**
     * Método heredado - Obtiene estadísticas de la colección ilumination
     * @returns {Promise<Object>} - Estadísticas de la colección
     */
    async getStats() {
        return await this.getCollectionStats('ilumination');
    }

    /**
     * Verifica la conexión con la base de datos
     * @returns {Promise<boolean>} - true si la conexión es exitosa
     */
    async testConnection() {
        try {
            const comando = `
                use('${this.database}');
                const result = db.runCommand({ ping: 1 });
                print(JSON.stringify(result));
            `;
            
            const resultado = await this.ejecutarMongosh(comando);
            const response = JSON.parse(resultado);
            
            const isConnected = response.ok === 1;
            console.log(isConnected ? '✅ Conexión MongoDB exitosa' : '❌ Fallo en conexión MongoDB');
            
            return isConnected;
            
        } catch (error) {
            console.error('❌ Error al probar conexión MongoDB:', error.message);
            return false;
        }
    }

    /**
     * Obtiene la lista de colecciones disponibles
     * @returns {Object} - Objeto con las colecciones disponibles
     */
    getAvailableCollections() {
        return this.collections;
    }
}

// Crear instancia única del servicio
const mongoService = new MongoService();

module.exports = mongoService;