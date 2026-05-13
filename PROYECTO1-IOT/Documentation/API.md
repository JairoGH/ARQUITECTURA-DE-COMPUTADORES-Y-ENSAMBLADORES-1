# 📡 API Documentation - Smart Home IoT

## 🔗 Base URL
```
http://localhost:3001/api
```

## 🔐 Autenticación
No requiere autenticación. Las credenciales MQTT y MongoDB están configuradas en el backend.

---

## 📊 Endpoints de Estado General

### 🏠 Estado del Sistema
```http
GET /api/status
```
**Respuesta:**
```json
{
  "server": "running",
  "mqtt_connected": true,
  "mongodb_connected": true,
  "mongodb_available": true,
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

### 📋 Colecciones MongoDB
```http
GET /api/collections
GET /api/collections/stats
GET /api/collections/discover
```

---

## 🎛️ Control MQTT en Tiempo Real

### 🏠 Estado de Habitaciones
```http
GET /api/mqtt/rooms
GET /api/mqtt/status
```

### 💡 Control de Iluminación Normal
```http
POST /api/mqtt/rooms/{room}/toggle
```
**Parámetros:** `room` = `sala` | `cuarto1` | `cuarto2`  
**Body:**
```json
{ "state": true }  // true = encender, false = apagar
```

### 🌈 Control de LED RGB
```http
POST /api/mqtt/rgb/toggle
POST /api/mqtt/rgb/color
```
**Toggle:**
```json
{ "state": true }
```
**Color:**
```json
{ "color": "#FF0000" }  // Formato hex (#RRGGBB)
```

### 🌪️ Control de Ventilador
```http
POST /api/mqtt/ventilador/toggle
```
**Body:**
```json
{ "state": true }  // true = encender, false = apagar
```

### 💧 Control de Bomba de Agua
```http
POST /api/mqtt/bomba-agua/toggle
```
**Body:**
```json
{ "state": true }  // true = encender, false = apagar
```

### 🚨 Control de Sistema de Alarma
```http
POST /api/mqtt/alarma/toggle
```
**Body:**
```json
{ "state": true }  // true = activar, false = desactivar
```

### 🚪 Control de Portón
```http
POST /api/mqtt/entrance/{action}
```
**Parámetros:** `action` = `open` | `close`

### 🚨 Alertas MQTT
```http
GET /api/mqtt/alerts
DELETE /api/mqtt/alerts
```

---

## 📈 Datos Históricos de MongoDB

### 🌡️ Temperatura (DHT11)
```http
GET /api/temperatura?limit=50
GET /api/temperatura/latest?limit=10
GET /api/temperatura/stats
```

### 🚶 Movimiento (PIR)
```http
GET /api/movimiento?limit=50
GET /api/movimiento/latest?limit=10
GET /api/movimiento/stats
```

### 💧 Humedad del Suelo
```http
GET /api/humedad-suelo?limit=50
GET /api/humedad-suelo/latest?limit=10
GET /api/humedad-suelo/stats
```

### 🌱 Eventos de Riego
```http
GET /api/riego-eventos?limit=50
GET /api/riego-eventos/latest?limit=10
GET /api/riego-eventos/stats
```

### 💡 Iluminación (histórico)
```http
GET /api/ilumination
GET /api/ilumination/{nombre}
GET /api/ilumination/stats
```

### 🌪️ Ventilación (histórico)
```http
GET /api/ventilacion?limit=50
GET /api/ventilacion/latest?limit=10
GET /api/ventilacion/stats
```

### 🚪 Eventos de Entrada
```http
GET /api/entrada-eventos?limit=50
GET /api/entrada-eventos/latest?limit=10
GET /api/entrada-eventos/stats
```

### 🚨 Alertas (histórico)
```http
GET /api/alerts?limit=50
GET /api/alerts/latest?limit=10
GET /api/alerts/stats
```

---

## 🧪 Endpoints de Prueba

### Test MQTT
```http
POST /api/mqtt/test
```

### Test MongoDB
```http
GET /api/test/mongodb
```

---

## 📋 Estructura de Respuestas

### ✅ Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### ❌ Error
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

---

## 🔧 Parámetros de Query

| Parámetro | Descripción | Ejemplo |
|:---:|:---:|:---:|
| `limit` | Máximo de registros | `?limit=50` |

---

## 📡 Tópicos MQTT

| Tópico | Propósito | Dispositivos |
|:---:|:---:|:---:|
| `/ilumination` | Control de luces | LED normales, LED RGB |
| `/entrance` | Control de portón | Portón principal |
| `/ventilador` | Control de ventilador | Ventilador |
| `/bomba_agua` | Control de bomba | Bomba de agua |
| `/alarma` | Control de alarma | Sistema de seguridad |
| `/alerts` | Alertas del sistema | Notificaciones |

---

## 📦 Formatos de Mensajes MQTT

### 💡 Iluminación Normal
```json
{
  "device": "led_room",
  "room": "sala",
  "action": "on",
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

### 🌈 LED RGB
```json
{
  "device": "led_rgb",
  "action": "color",
  "r": 255,
  "g": 0,
  "b": 0,
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

### 🌪️ Ventilador
```json
{
  "device": "ventilador",
  "action": "on",
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

### 💧 Bomba de Agua
```json
{
  "device": "bomba_agua",
  "action": "off",
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

### 🚨 Alarma
```json
{
  "device": "alarma",
  "action": "on",
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

### 🚪 Portón
```json
{
  "device": "entrance",
  "action": "open",
  "fecha": "03-09-2025",
  "hora": "14:30",
  "timestamp": "03-09-2025 14:30 GMT-6"
}
```

---

## ⚡ Ejemplos de Uso

### Encender LED RGB en rojo
```bash
# 1. Primero encender el LED
curl -X POST http://localhost:3001/api/mqtt/rgb/toggle \
  -H "Content-Type: application/json" \
  -d '{"state": true}'

# 2. Luego cambiar color a rojo
curl -X POST http://localhost:3001/api/mqtt/rgb/color \
  -H "Content-Type: application/json" \
  -d '{"color": "#FF0000"}'
```

### Controlar ventilador
```bash
# Encender ventilador
curl -X POST http://localhost:3001/api/mqtt/ventilador/toggle \
  -H "Content-Type: application/json" \
  -d '{"state": true}'
```

### Activar sistema de alarma
```bash
curl -X POST http://localhost:3001/api/mqtt/alarma/toggle \
  -H "Content-Type: application/json" \
  -d '{"state": true}'
```

### Obtener últimas 5 lecturas de temperatura
```bash
curl http://localhost:3001/api/temperatura/latest?limit=5
```

### Abrir portón
```bash
curl -X POST http://localhost:3001/api/mqtt/entrance/open
```

### Obtener alertas MQTT en tiempo real
```bash
curl http://localhost:3001/api/mqtt/alerts
```

---

## 🎛️ Estados de Dispositivos

El sistema mantiene el estado actual de todos los dispositivos:

```json
{
  "sala": false,
  "cuarto1": false,
  "cuarto2": false,
  "rgb_room": {
    "isOn": false,
    "color": "#ffffff"
  },
  "ventilador": false,
  "bomba_agua": false,
  "alarma": false
}
```

---

## 📝 Notas Importantes

- **Control vs Consulta**: `/api/mqtt/*` para control activo, otras rutas para datos históricos
- **RGB**: Requiere toggle (encender/apagar) y color por separado
- **Estados**: Se mantienen en memoria del servidor y se sincronizan
- **Colores**: Formato hexadecimal #RRGGBB (ej: #FF0000 para rojo)
- **Timestamps**: Todos en GMT-6 (hora local)
- **Alertas**: `/api/alerts` (BD histórica) vs `/api/mqtt/alerts` (tiempo real)

---

## 🏠 **Desarrollado para Smart Home IoT - Grupo 3**
*Universidad San Carlos de Guatemala*

**Nuevos dispositivos agregados: Ventilador, Bomba de Agua, Sistema de Alarma**