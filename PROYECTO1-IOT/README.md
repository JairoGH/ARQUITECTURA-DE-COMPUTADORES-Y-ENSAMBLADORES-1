# 🏠 SMART HOME IOT: ¡Sistema de Domótica Inteligente! 🚀

---

## 📋 Tabla de contenido

<div align="center">

| 🎯 **Sección** | 📄 **Descripción** |
|:---:|:---:|
| [✨ ¿Qué es SMART HOME IOT?](#-qué-es-smart-home-iot) | Introducción y características del sistema |
| [🚀 Características Principales](#-características-principales) | Funcionalidades clave del proyecto |
| [👨‍💻 Equipo de Desarrollo](#-equipo-de-desarrollo) | Desarrolladores y colaboradores |
| [🛠️ Stack Tecnológico](#-stack-tecnológico) | Tecnologías y herramientas utilizadas |
| [🗂️ Arquitectura del Sistema](#-arquitectura-del-sistema) | Componentes y canales MQTT |
| [📸 Capturas del Sistema](#-capturas-del-sistema) | Screenshots y prototipo físico |
| [🚀 Instalación y Configuración](#-instalación-y-configuración) | Setup completo del proyecto |
| [⚙️ Configuración de Servicios](#-configuración-de-servicios) | MongoDB, HiveMQ y variables .env |
| [📊 Funcionalidades del Sistema](#-funcionalidades-del-sistema) | Detalles de cada módulo IoT |
| [📊 Dashboard y Reportes](#-dashboard-y-reportes) | Interfaz web y visualización |
| [📚 Documentación Técnica](#-documentación-técnica) | Manuales y guías detalladas |
| [🧪 Testing y Validación](#-testing-y-validación) | Casos de prueba y métricas |
| [🔧 Solución de Problemas](#-solución-de-problemas-comunes) | Troubleshooting y comandos útiles |

</div>

---

## ✨ ¿Qué es SMART HOME IOT?

<div align="center">
  
  > **"Un sistema completo de automatización residencial que integra sensores IoT, actuadores inteligentes y control remoto mediante tecnologías web modernas para la residencial 'Pinos Altos'"**
  
  🎯 **¡Controla temperatura, iluminación, riego, seguridad y acceso desde cualquier lugar!** 🎯
  
</div>

---

## 🚀 Características Principales

<div align="center">

| Característica | Descripción |
|:---:|:---:|
| 🌡️ **Control de Temperatura** | Sistema automático de ventilación con DHT11/DHT22 |
| 💡 **Iluminación Inteligente** | LEDs RGB programables y control remoto |
| 💧 **Sistema de Riego** | Riego automático basado en humedad del suelo |
| 🚨 **Sistema de Alarmas** | Alertas por temperatura y detección de movimiento |
| 🚪 **Acceso Automatizado** | Portón inteligente con servomotor |
| 📱 **Control Remoto** | Dashboard web responsive con React |
| 📊 **Monitoreo en Tiempo Real** | Gráficas y tablas con datos históricos |
| ☁️ **Almacenamiento en la Nube** | Base de datos MongoDB con registros detallados |

</div>

---

## 👨‍💻 Equipo de Desarrollo

<div align="center">

<table align="center">
<tr>
<td align="center" width="50%">

**🚀 JAIRO ADELSO GÓMEZ HERNÁNDEZ**  
*Rol del Integrante*  
[![GitHub](https://img.shields.io/badge/GitHub-JairoGH-black?logo=github)](https://github.com/JairoGH)

</td>
<td align="center" width="50%">

**🚀 ESTUARDO JOSUÉ VAQUIAX REYES**  
*Rol del Integrante*  
[![GitHub](https://img.shields.io/badge/GitHub-Jsue46-black?logo=github)](https://github.com/Jsue46)

</td>
</tr>
<tr>
<td align="center" width="50%">

**🚀 ANGEL GUILLERMO ARREAGA BARRIENTOS**  
*Rol del Integrante*  
[![GitHub](https://img.shields.io/badge/GitHub-202004762-black?logo=github)](https://github.com/202004762)

</td>
<td align="center" width="50%">

**🚀 HECTOR DANIEL ORTIZ OSORIO**  
*Rol del Integrante*  
[![GitHub](https://img.shields.io/badge/GitHub-DaaNiieeL123-black?logo=github)](https://github.com/DaaNiieeL123)

</td>
</tr>
<tr>
<td align="center" width="50%">

**🚀 PABLO ROBERTO GARCIA SANUN**  
*Rol del Integrante*  
[![GitHub](https://img.shields.io/badge/GitHub-NFPab10-black?logo=github)](https://github.com/NF-Pab10)

</td>
<td align="center" width="50%">

**🚀 ALMA ISABEL MANCHAMÉ ROMERO**  
*Rol del Integrante*  
[![GitHub](https://img.shields.io/badge/GitHub-AlmaManchame-black?logo=github)](https://github.com/AlmaManchame)

</td>
</tr>
</table>

</div>

---

## 🛠️ Stack Tecnológico

<div align="center">

<table align="center">
<tr>
<td align="center" width="25%">

### **Raspberry Pi** 🔧
<div align="center">
  <img src="./assets/raspberry-pi-logo.png" alt="Logo de Raspberry Pi" width="120" height="120">
</div>

**El Cerebro del Sistema:**
- 🖥️ Procesamiento central IoT
- ⚡ GPIO para sensores/actuadores
- 🐧 Sistema operativo Linux
- 📡 Conectividad WiFi/Ethernet

</td>
<td align="center" width="25%">

### **Python** 🐍
<div align="center">
  <img src="./assets/python-logo.png" alt="Logo de Python" width="120" height="120">
</div>

**Lenguaje Principal:**
- 📊 Procesamiento de datos IoT
- 🔌 Control de GPIO
- 📚 Librerías especializadas
- ⏱️ Programación de tareas

</td>
<td align="center" width="25%">

### **JavaScript** ⚡
<div align="center">
  <img src="./assets/javascript-logo.png" alt="Logo de JavaScript" width="120" height="120">
</div>

**Frontend & Backend:**
- ⚛️ React para dashboard
- 🌐 Node.js para API REST
- 📱 Interfaz web responsive
- 🔄 Comunicación en tiempo real

</td>
<td align="center" width="25%">

### **MongoDB** 🍃
<div align="center">
  <img src="./assets/mongodb-logo.png" alt="Logo de MongoDB" width="120" height="120">
</div>

**Base de Datos NoSQL:**
- ☁️ Almacenamiento en la nube
- 📊 Registros JSON estructurados
- 📈 Datos históricos por días
- 🔍 Consultas optimizadas

</td>
</tr>
<tr>
<td align="center" width="50%" colspan="2">

### **HiveMQ Cloud** 📡
<div align="center">
  <img src="./assets/hivemq-logo.png" alt="Logo de HiveMQ" width="120" height="120">
</div>

**Comunicación MQTT:**
- 🔒 Conexiones seguras TLS
- ⚡ Mensajería en tiempo real
- 📋 Tópicos organizados
- 🌍 Acceso desde cualquier lugar

</td>
<td align="center" width="50%" colspan="2">

### **React Dashboard** 📊
<div align="center">
  <img src="./assets/react-logo.png" alt="Logo de React" width="120" height="120">
</div>

**Interfaz de Control:**
- 📱 Dashboard responsivo
- 📈 Gráficas interactivas
- 🔐 Sistema de autenticación
- 🎨 Diseño moderno y atractivo

</td>
</tr>
</table>

</div>

---

## 🗂️ Arquitectura del Sistema

<div align="center">

### 🏠 **Componentes del Smart Home**

| Componente | Función | Sensores/Actuadores |
|:---:|:---:|:---:|
| **🌡️ Ventilación** | Control automático de temperatura | DHT11/DHT22 + Ventiladores |
| **💡 Iluminación** | Control inteligente de luces | LEDs RGB + LEDs blancos |
| **💧 Riego** | Sistema de riego automático | Sensor de humedad + Bomba |
| **🚨 Seguridad** | Detección de movimiento y alarmas | PIR + Buzzer + LEDs |
| **🚪 Acceso** | Portón automatizado | Servomotor |
| **📺 Display** | Información en tiempo real | Pantalla LCD/OLED |

### 📡 **Canales MQTT**

| Canal | Propósito | Ejemplo de Mensaje |
|:---:|:---:|:---:|
| `/illumination` | Control de iluminación | `{"device":"led_room","room":"cuarto1","action":"on","fecha":"02-09-2025","hora":"00:11","timestamp":"02-09-2025 00:11 GMT-6"}` |
| `/entrance` | Control del portón | `{"device":"entrance","action":"open","fecha":"02-09-2025","hora":"00:13","timestamp":"02-09-2025 00:13 GMT-6"}` |
| `/alerts` | Alertas del sistema | `{"type":"connection_test","message":"Prueba de conexión desde Backend API","fecha":"02-09-2025","hora":"00:14","timestamp":"02-09-2025 00:14 GMT-6"}` |
| `/sensors` | Datos de sensores | `{"device":"sensor_dht11","room":"sala","temperature":24.7,"humidity":63,"motion":false,"fecha":"02-09-2025","hora":"00:20","timestamp":"02-09-2025 00:20 GMT-6"}` |

</div>

---

## 📸 Capturas del Sistema

### 🏠 **Prototipo Físico**
<div align="center">
  <img src="./assets/prototipo-completo.png" alt="Prototipo físico del Smart Home" width="800">
  <p><em>Prototipo completo con todos los componentes integrados y encapsulamiento profesional</em></p>
</div>

### 📱 **Dashboard Web - Vista Principal**
<div align="center">
  <img src="./assets/dashboard-principal.png" alt="Dashboard principal del sistema IoT" width="800">
  <p><em>Dashboard principal con monitoreo en tiempo real y controles de dispositivos</em></p>
</div>

### 📊 **Gráficas y Reportes**
<div align="center">
  <img src="./assets/graficas-sensores.png" alt="Gráficas de sensores en tiempo real" width="800">
  <p><em>Visualización de datos históricos con gráficas de líneas y barras interactivas</em></p>
</div>

### 🔧 **Panel de Control**
<div align="center">
  <img src="./assets/panel-control.png" alt="Panel de control de dispositivos" width="800">
  <p><em>Panel de control para activar/desactivar dispositivos remotamente</em></p>
</div>

### 📱 **Login y Autenticación**
<div align="center">
  <img src="./assets/login-sistema.png" alt="Sistema de login del dashboard" width="800">
  <p><em>Sistema de autenticación seguro para acceder al panel de control</em></p>
</div>

---

## 🚀 Instalación y Configuración

<div align="center">

### 📋 **Requisitos del Sistema**

**Hardware:**
- **Raspberry Pi 3 o 4** (con Raspbian OS)
- **Sensores**: DHT11/DHT22, PIR, Sensor de humedad
- **Actuadores**: LEDs RGB, Ventiladores, Servomotor, Bomba de agua
- **Display**: LCD/OLED 16x2 o superior
- **Componentes**: Resistencias, transistores, protoboard, jumpers

**Software:**
- **Python 3.7+** con librerías IoT
- **Node.js 14+** y npm
- **MongoDB** (cuenta en MongoDB Atlas)
- **HiveMQ Cloud** (cuenta gratuita)

</div>

### ⚡ **Instalación Rápida**

#### 🔧 **1. Configuración de la Raspberry Pi**

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
sudo apt install python3-pip python3-venv git python3-dev build-essential -y

# Clonar repositorio 
git clone https://github.com/JairoGH/Arqui1_2S.git
cd Arqui1_2S

# Instalar dependencias Python
pip install --upgrade pip
pip install -r requirements.txt

# Iniciar sistema IoT 
cd Arqui1_2S
sudo python3 app.py
```

#### 🌐 **2. Configuración del Backend (API REST)**

```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias de Node.js
npm install

# Iniciar servidor de desarrollo
npm run dev
```

#### ⚛️ **3. Configuración del Frontend (React)**

```bash
# Navegar al directorio del frontend
cd frontend

# Instalar dependencias de React
npm install

# Iniciar aplicación web
npm start
```

#### 🔌 **4. Configuración de Hardware**

```bash
# Ejecutar script de configuración de GPIO
cd tu-carpeta-donde-lo-ejecutes

# Iniciar sistema IoT principal
python3 app.py
```

---

## ⚙️ Configuración de Servicios

### 🗄️ **MongoDB Atlas**

```javascript
// Configuración de conexión
const MONGO_URI = "mongodb+srv://usuario:password@cluster.mongodb.net/smarthome"

// Estructura de documentos
{
  "device": "sensor_dht11",
  "room": "sala",
  "temperature": 24.7,
  "humidity": 63,
  "motion": false,
  "fecha": "02-09-2025",
  "hora": "00:20",
  "timestamp": "02-09-2025 00:20 GMT-6"
}
```

### 📡 **HiveMQ Cloud**

```javascript
// Configuración MQTT
const MQTT_CONFIG = {
  host: 'tu-cluster.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'tu_usuario',
  password: 'tu_password'
}

// Tópicos principales
const TOPICS = {
  ILLUMINATION: '/illumination',
  ENTRANCE: '/entrance',
  ALERTS: '/alerts',
  SENSORS: '/sensors'
}
```

---

## 📊 Funcionalidades del Sistema

### 🌡️ **1. Control de Temperatura**

- **Monitoreo Continuo**: Lecturas cada 5 minutos
- **Ventilación Automática**: Activación > 22°C
- **Sistema de Alarmas**: Alerta crítica > 27°C
- **Visualización**: Gráficas de líneas en tiempo real

### 💡 **2. Iluminación Inteligente**

- **LEDs RGB**: Control de colores desde dashboard
- **LEDs Blancos**: Iluminación de habitaciones
- **Automatización**: Encendido por detección de movimiento
- **Registro**: Logs detallados de cada acción

### 💧 **3. Sistema de Riego**

- **Sensor de Humedad**: Monitoreo cada 7 minutos
- **Riego Automático**: Activación < 95% humedad
- **Control de Bomba**: Gestión inteligente de recursos
- **Histórico**: Registros de riego y niveles de humedad

### 🚨 **4. Seguridad y Monitoreo**

- **Detección PIR**: Sensor de movimiento exterior
- **Alarmas Visuales**: LEDs RGB alternados (rojo/azul)
- **Alarmas Sonoras**: Buzzer para alertas críticas
- **Notificaciones**: Alertas en tiempo real vía MQTT

### 🚪 **5. Control de Acceso**

- **Portón Inteligente**: Servomotor controlado remotamente
- **Apertura/Cierre**: Control desde dashboard web
- **Registro de Acceso**: Logs con fecha y hora
- **Display LCD**: Indicaciones visuales locales

---

## 📊 Dashboard y Reportes

### 🎨 **Características del Dashboard**

#### 📈 **Visualización de Datos**
- **Gráficas de Líneas**: Temperatura y humedad histórica
- **Gráficas de Barras**: Eventos de actuadores
- **Tablas Filtradas**: Datos por fecha y hora
- **Indicadores**: Estados en tiempo real

#### 🔐 **Sistema de Autenticación**
```javascript
// Credenciales de acceso
const LOGIN = {
  username: "grupo3_seccion_proy1",
  password: "tu_password_personalizado"
}
```

#### 🎛️ **Panel de Control**
- **Control de Luces**: Encender/apagar y cambiar colores
- **Gestión del Portón**: Abrir/cerrar acceso principal
- **Configuración**: Parámetros del sistema
- **Alertas**: Notificaciones en tiempo real
---

## 📚 Documentación Técnica

### 📖 **Manual Técnico**
- **📁 [Manual Técnico Completo](./Documentation/ManualTecnico.pdf)**
  - Especificaciones de hardware
  - Configuración de software
  - Resolución de problemas
  - Costos del prototipo

### 👥 **Manual de Usuario**
- **📁 [Manual de Usuario](./Documentation/ManualUsuario.pdf)**
  - Guía de uso del dashboard
  - Instrucciones de operación
  - Funcionalidades del sistema
  - Preguntas frecuentes
  - Solución de problemas comunes

### 🔧 **Documentación de API**
- **📁 [API Documentation](./Documentation/API.md)**
  - Endpoints disponibles
  - Estructura de datos
  - Ejemplos de uso
  - Códigos de respuesta
  - Autenticación

### ⚡ **Esquemas y Diagramas**
- **📁 [Diagramas de Conexión](./Documentation/Schemas/)**
  - Esquemas de Proteus
  - Diagramas de pines GPIO

---

## 🧪 Testing y Validación

<div align="center">

### ✅ **Casos de Prueba Exitosos**

| Componente | Prueba | Resultado Esperado |
|:---:|:---:|:---:|
| **🌡️ Temperatura** | Sensor > 22°C | Ventilador ON + Registro BD |
| **💡 Iluminación** | Comando MQTT | LED RGB cambia color |
| **💧 Riego** | Humedad < 95% | Bomba ON + Log sistema |
| **🚨 Movimiento** | Detección PIR | LED exterior ON |
| **🚪 Acceso** | Control remoto | Servomotor abre/cierra |

### 📊 **Métricas de Funcionamiento**
- **⏱️ Tiempo de Respuesta MQTT**: < 500ms
- **📡 Conectividad**: 99.5% uptime
- **💾 Almacenamiento**: Mínimo 3 días de datos
- **🔄 Actualización Sensores**: Cada 5-7 minutos
- **📱 Dashboard**: Responsive en dispositivos móviles

</div>

---

## 🔧 Solución de Problemas Comunes

<div align="center">

### 🔌 **Problemas de Hardware**
- **🔴 LED no enciende**: Verificar conexiones GPIO y resistencias
- **📏 Sensor no lee**: Comprobar alimentación 3.3V/5V
- **🖥️ LCD no muestra datos**: Revisar protocolo I2C/SPI
- **⚙️ Servomotor no gira**: Verificar PWM y alimentación externa

### 🌐 **Problemas de Conectividad**
- **📡 MQTT desconectado**: Verificar credenciales HiveMQ y conexión WiFi
- **🗄️ MongoDB no conecta**: Comprobar string de conexión y whitelist IP
- **🌐 Dashboard no carga**: Verificar que backend esté en puerto 3001
- **📱 App no actualiza**: Revisar WebSocket y conexión MQTT del navegador

### 💻 **Problemas de Software**
- **🐍 Error Python GPIO**: Ejecutar con `sudo` y verificar permisos
- **📦 Dependencias faltantes**: Reinstalar con `pip install -r requirements.txt`
- **⚛️ React no inicia**: Limpiar caché con `npm cache clean --force`
- **🔄 Datos no se guardan**: Verificar esquemas MongoDB y conexión

</div>

---

<div align="center">

## 🏠 ¡Bienvenido al Futuro de los Hogares Inteligentes! 🏠 

**¿Listo para automatizar tu hogar con tecnología IoT de vanguardia?**

[![⭐ Star este proyecto](https://img.shields.io/badge/⭐-Star_este_proyecto-yellow?style=for-the-badge)]()
[![🔧 Issues](https://img.shields.io/badge/🔧-Report_Issues-red?style=for-the-badge)]()
[![🚀 Demo](https://img.shields.io/badge/🚀-Ver_Demo-blue?style=for-the-badge)]()

---

### 📊 **Estadísticas del Proyecto**

![React Version](https://img.shields.io/badge/React-18%2B-cyan)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red)
![MQTT](https://img.shields.io/badge/MQTT-HiveMQ%20Cloud-orange)
![Database](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![IoT](https://img.shields.io/badge/IoT-Sensors%20%26%20Actuators-purple)
![Status](https://img.shields.io/badge/Status-Funcional-success)

---

**Desarrollado para la Universidad San Carlos de Guatemala**  
*Facultad de Ingeniería - Ingeniería en Ciencias y Sistemas*

*"Transformando hogares tradicionales en espacios inteligentes y conectados"* 🏠🔧📡

</div>