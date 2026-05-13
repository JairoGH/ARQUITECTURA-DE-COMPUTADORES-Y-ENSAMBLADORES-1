import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Home, 
  DoorOpen, 
  AlertTriangle, 
  Palette,
  Power,
  PowerOff,
  Wifi,
  WifiOff,
  Server,
  Fan,
  Droplets,
  ShieldAlert,
  Database
} from 'lucide-react';
import Navbar from './Navbar';

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [backendStatus, setBackendStatus] = useState(false);
  const [mongoStatus, setMongoStatus] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [roomStates, setRoomStates] = useState({
    sala: false,
    cuarto1: false,
    cuarto2: false,
    rgb_room: { isOn: false, color: '#ffffff' },
    ventilador: false,
    bomba_agua: false,
    alarma: false
  });
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [entranceState, setEntranceState] = useState('closed');
  const [loading, setLoading] = useState(false);

  // URL base de la API 
  const API_BASE_URL = 'http://localhost:3001/api';

  // Función para hacer peticiones a la API
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en API ${endpoint}:`, error);
      throw error;
    }
  };

  // Verificar estado del backend y cargar datos iniciales
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const status = await apiRequest('/status');
        setBackendStatus(true);
        setIsConnected(status.mqtt_connected);
        setMongoStatus(status.mongodb_connected || status.mongodb_available);
      } catch (error) {
        setBackendStatus(false);
        setIsConnected(false);
        setMongoStatus(false);
        console.error('Backend no disponible:', error);
      }
    };

    const loadInitialData = async () => {
      try {
        // Cargar estados de habitaciones
        const roomsResponse = await apiRequest('/mqtt/rooms'); // ✅ Agregada /
        if (roomsResponse.success) {
          setRoomStates(roomsResponse.data);
          setSelectedColor(roomsResponse.data.rgb_room.color);
        }

        // Cargar alertas
        const alertsResponse = await apiRequest('/mqtt/alerts'); // ✅ Agregada /
        if (alertsResponse.success) {
          setAlerts(alertsResponse.data);
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    checkBackendStatus();
    loadInitialData();

    // Verificar estado cada 10 segundos
    const statusInterval = setInterval(checkBackendStatus, 10000);
    
    // Actualizar alertas cada 5 segundos
    const alertsInterval = setInterval(async () => {
      if (backendStatus) {
        try {
          const alertsResponse = await apiRequest('/mqtt/alerts'); // ✅ Agregada /
          if (alertsResponse.success) {
            setAlerts(alertsResponse.data);
          }
        } catch (error) {
          console.error('Error actualizando alertas:', error);
        }
      }
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(alertsInterval);
    };
  }, [backendStatus]);

  // Control de habitaciones normales
  const toggleRoom = async (room, state) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(`/mqtt/rooms/${room}/toggle`, { // ✅ Agregada /
        method: 'POST',
        body: JSON.stringify({ state })
      });

      if (response.success) {
        setRoomStates(prev => ({
          ...prev,
          [room]: state
        }));
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      alert('Error al controlar la habitación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Control de habitación RGB - toggle
  const toggleRgbRoom = async (state) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/mqtt/rgb/toggle', { // ✅ Agregada /
        method: 'POST',
        body: JSON.stringify({ state })
      });

      if (response.success) {
        setRoomStates(prev => ({
          ...prev,
          rgb_room: { ...prev.rgb_room, isOn: state }
        }));
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      alert('Error al controlar la habitación RGB: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Control de color RGB
  const sendRgbColor = async (color) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    try {
      const response = await apiRequest('/mqtt/rgb/color', { // ✅ Agregada /
        method: 'POST',
        body: JSON.stringify({ color })
      });

      if (response.success) {
        setRoomStates(prev => ({
          ...prev,
          rgb_room: { ...prev.rgb_room, color }
        }));
        setSelectedColor(color);
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error al cambiar color:', error);
    }
  };

  // Control del porton
  const controlEntrance = async (action) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(`/mqtt/entrance/${action}`, { // ✅ Agregada /
        method: 'POST'
      });

      if (response.success) {
        setEntranceState(action === 'open' ? 'opening' : 'closing');
        
        setTimeout(() => {
          setEntranceState(action === 'open' ? 'open' : 'closed');
        }, 2000);
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      alert('Error al controlar el portón: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Control del ventilador
  const toggleVentilador = async (state) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/mqtt/ventilador/toggle', { // ✅ Agregada /
        method: 'POST',
        body: JSON.stringify({ state })
      });

      if (response.success) {
        setRoomStates(prev => ({
          ...prev,
          ventilador: state
        }));
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      alert('Error al controlar el ventilador: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Control de la bomba de agua
  const toggleBombaAgua = async (state) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/mqtt/bomba-agua/toggle', { // ✅ Agregada /
        method: 'POST',
        body: JSON.stringify({ state })
      });

      if (response.success) {
        setRoomStates(prev => ({
          ...prev,
          bomba_agua: state
        }));
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      alert('Error al controlar la bomba de agua: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Control de la alarma
  const toggleAlarma = async (state) => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/mqtt/alarma/toggle', {
        method: 'POST',
        body: JSON.stringify({ state })
      });

      if (response.success) {
        setRoomStates(prev => ({
          ...prev,
          alarma: state
        }));
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      alert('Error al controlar la alarma: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Prueba de conexión
  const testConnection = async () => {
    if (!backendStatus) {
      alert('Backend no disponible');
      return;
    }

    try {
      const response = await apiRequest('/mqtt/test', { method: 'POST' }); // ✅ Agregada /
      if (response.success) {
        alert('Mensaje de prueba enviado exitosamente');
      }
    } catch (error) {
      alert('Error en la prueba de conexión: ' + error.message);
    }
  };

  // Componente para habitaciones normales
  const RoomControl = ({ roomName, displayName, isOn }) => (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
            isOn 
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-200' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200'
          }`}>
            <Lightbulb className={`w-7 h-7 transition-all duration-300 ${
              isOn ? 'text-white animate-pulse' : 'text-gray-500'
            }`} />
            {isOn && (
              <div className="absolute inset-0 rounded-2xl bg-yellow-400 opacity-20 animate-ping"></div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
              {displayName}
            </h3>
            <p className="text-sm text-gray-500">
              {isOn ? 'Encendido' : 'Apagado'}
            </p>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
          isOn ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-gray-300'
        }`} />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => toggleRoom(roomName, true)}
          disabled={!backendStatus || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
            isOn 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-200' 
              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-yellow-50 hover:to-orange-50 hover:text-yellow-700 border border-gray-300'
          }`}
        >
          <Power className="w-4 h-4" />
          Encender
        </button>
        <button
          onClick={() => toggleRoom(roomName, false)}
          disabled={!backendStatus || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
            !isOn 
              ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-300' 
              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-50 hover:to-gray-100 border border-gray-300'
          }`}
        >
          <PowerOff className="w-4 h-4" />
          Apagar
        </button>
      </div>
    </div>
  );

  // Componente para habitación RGB
  const RgbRoomControl = () => (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
            roomStates.rgb_room.isOn 
              ? 'bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-200' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200'
          }`}>
            <Palette className={`w-7 h-7 transition-all duration-300 ${
              roomStates.rgb_room.isOn ? 'text-white animate-pulse' : 'text-gray-500'
            }`} />
            {roomStates.rgb_room.isOn && (
              <div className="absolute inset-0 rounded-2xl bg-purple-400 opacity-20 animate-ping"></div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
              Habitación RGB
            </h3>
            <p className="text-sm text-gray-500">
              {roomStates.rgb_room.isOn ? 'Encendido' : 'Apagado'}
            </p>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
          roomStates.rgb_room.isOn ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-gray-300'
        }`} />
      </div>

      {/* Selector de color */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <input
              type="color"
              value={selectedColor}
              disabled={!backendStatus}
              onChange={(e) => {
                setSelectedColor(e.target.value);
                // Ya no enviar automáticamente, solo actualizar el estado local
              }}
              className="w-20 h-20 rounded-2xl border-2 border-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
              <Palette className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Color seleccionado</p>
            <p className="text-lg font-mono text-gray-800 bg-gray-50 px-3 py-1 rounded-lg border">{selectedColor}</p>
            <p className="text-xs text-gray-500 mt-1">
              {roomStates.rgb_room.color !== selectedColor ? '⚠️ Color pendiente de aplicar' : '✅ Color aplicado'}
            </p>
          </div>
        </div>
        
        {/* Botón para aplicar color */}
        <button
          onClick={() => sendRgbColor(selectedColor)}
          disabled={!backendStatus || loading || !roomStates.rgb_room.isOn || roomStates.rgb_room.color === selectedColor}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200 hover:from-purple-600 hover:to-pink-700"
        >
          <Palette className="w-4 h-4" />
          {loading ? 'Aplicando...' : 'Aplicar Color'}
        </button>
      </div>
      
      {/* Controles on/off */}
      <div className="flex gap-3">
        <button
          onClick={() => toggleRgbRoom(true)}
          disabled={!backendStatus || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
            roomStates.rgb_room.isOn 
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200' 
              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 border border-gray-300'
          }`}
        >
          <Power className="w-4 h-4" />
          Encender
        </button>
        <button
          onClick={() => toggleRgbRoom(false)}
          disabled={!backendStatus || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
            !roomStates.rgb_room.isOn 
              ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-300' 
              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-50 hover:to-gray-100 border border-gray-300'
          }`}
        >
          <PowerOff className="w-4 h-4" />
          Apagar
        </button>
      </div>
    </div>
  );
  // Componente para dispositivos generales (ventilador, bomba, etc.)
  const DeviceControl = ({ deviceName, displayName, isOn, icon: IconComponent, colorClass, onToggle }) => {
    const colorVariants = {
      green: {
        bg: isOn ? 'from-green-500 to-emerald-600' : 'from-gray-100 to-gray-200',
        shadow: isOn ? 'shadow-green-200' : 'shadow-gray-200',
        icon: isOn ? 'text-white' : 'text-gray-500',
        button: isOn ? 'from-green-500 to-emerald-600' : 'from-gray-100 to-gray-200',
        hover: 'hover:from-green-50 hover:to-emerald-50 hover:text-green-700'
      },
      red: {
        bg: isOn ? 'from-red-500 to-rose-600' : 'from-gray-100 to-gray-200',
        shadow: isOn ? 'shadow-red-200' : 'shadow-gray-200',
        icon: isOn ? 'text-white' : 'text-gray-500',
        button: isOn ? 'from-red-500 to-rose-600' : 'from-gray-100 to-gray-200',
        hover: 'hover:from-red-50 hover:to-rose-50 hover:text-red-700'
      },
      cyan: {
        bg: isOn ? 'from-cyan-500 to-blue-600' : 'from-gray-100 to-gray-200',
        shadow: isOn ? 'shadow-cyan-200' : 'shadow-gray-200',
        icon: isOn ? 'text-white' : 'text-gray-500',
        button: isOn ? 'from-cyan-500 to-blue-600' : 'from-gray-100 to-gray-200',
        hover: 'hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-700'
      }
    };

    const colors = colorVariants[colorClass] || colorVariants.green;

    return (
      <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${colors.bg} shadow-lg ${colors.shadow} transition-all duration-300`}>
              <IconComponent className={`w-7 h-7 ${colors.icon} transition-all duration-300 ${isOn ? 'animate-pulse' : ''}`} />
              {isOn && (
                <div className="absolute inset-0 rounded-2xl bg-current opacity-20 animate-ping"></div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">
                {isOn ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
            isOn ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-gray-300'
          }`} />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => onToggle(true)}
            disabled={!backendStatus || loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
              isOn 
                ? `bg-gradient-to-r ${colors.button} text-white shadow-lg ${colors.shadow}` 
                : `bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 ${colors.hover} border border-gray-300`
            }`}
          >
            <Power className="w-4 h-4" />
            Encender
          </button>
          <button
            onClick={() => onToggle(false)}
            disabled={!backendStatus || loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
              !isOn 
                ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-300' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-50 hover:to-gray-100 border border-gray-300'
            }`}
          >
            <PowerOff className="w-4 h-4" />
            Apagar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header con navegación mejorado */}
        <div className="mb-8">
          <Navbar />
        </div>

        {/* Barra de estado mejorada */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            {backendStatus ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <Server className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">Backend Conectado</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <Server className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-semibold">Backend Desconectado</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            {isConnected ? (
              <>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <Wifi className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">MQTT Conectado</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-semibold">MQTT Desconectado</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
            {mongoStatus ? (
              <>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <Database className="w-5 h-5 text-purple-600" />
                <span className="text-purple-700 font-semibold">MongoDB Conectado</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <Database className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-semibold">MongoDB Desconectado</span>
              </>
            )}
          </div>
          <button
            onClick={testConnection}
            disabled={!backendStatus || loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando...
              </div>
            ) : (
              'Probar Conexión'
            )}
          </button>
        </div>

        {/* Contenido del Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sección de Control de Dispositivos */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Home className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Control de Dispositivos
                </h2>
                <p className="text-gray-600 text-sm">Gestiona todos tus dispositivos IoT</p>
              </div>
            </div>
            
            {/* Habitaciones normales */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">Iluminación</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <RoomControl 
                  roomName="sala" 
                  displayName="Sala" 
                  isOn={roomStates.sala} 
                />
                <RoomControl 
                  roomName="cuarto1" 
                  displayName="Cuarto 1" 
                  isOn={roomStates.cuarto1} 
                />
                <RoomControl 
                  roomName="cuarto2" 
                  displayName="Cuarto 2" 
                  isOn={roomStates.cuarto2} 
                />
              </div>
            </div>

            {/* Habitación RGB */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">Iluminación RGB</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <RgbRoomControl />
            </div>

            {/* Nuevos dispositivos: Ventilador, Bomba de Agua y Alarma */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-cyan-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">Otros Dispositivos</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <div className="space-y-6">
                {/* Primera fila: Ventilador y Bomba */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DeviceControl
                    deviceName="ventilador"
                    displayName="Ventilador"
                    isOn={roomStates.ventilador}
                    icon={Fan}
                    colorClass="cyan"
                    onToggle={toggleVentilador}
                  />
                  <DeviceControl
                    deviceName="bomba_agua"
                    displayName="Bomba de Agua"
                    isOn={roomStates.bomba_agua}
                    icon={Droplets}
                    colorClass="green"
                    onToggle={toggleBombaAgua}
                  />
                </div>
                
                {/* Segunda fila: Alarma centrada */}
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <DeviceControl
                      deviceName="alarma"
                      displayName="Sistema de Alarma"
                      isOn={roomStates.alarma}
                      icon={ShieldAlert}
                      colorClass="red"
                      onToggle={toggleAlarma}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Control del Porton */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800">Control de Acceso</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
                      entranceState === 'open' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200' 
                        : entranceState === 'closed'
                        ? 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg shadow-gray-200'
                        : 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-yellow-200'
                    }`}>
                      <DoorOpen className={`w-7 h-7 transition-all duration-300 ${
                        entranceState === 'opening' || entranceState === 'closing' 
                          ? 'text-white animate-spin' 
                          : 'text-white'
                      }`} />
                      {(entranceState === 'opening' || entranceState === 'closing') && (
                        <div className="absolute inset-0 rounded-2xl bg-yellow-400 opacity-20 animate-ping"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                        Portón Principal
                      </h3>
                      <p className="text-sm text-gray-500">
                        Estado: {
                          entranceState === 'open' ? 'Abierto' :
                          entranceState === 'closed' ? 'Cerrado' :
                          entranceState === 'opening' ? 'Abriendo...' : 'Cerrando...'
                        }
                      </p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    entranceState === 'open' 
                      ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' 
                      : entranceState === 'closed'
                      ? 'bg-gray-400'
                      : 'bg-yellow-500 shadow-lg shadow-yellow-200 animate-pulse'
                  }`} />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => controlEntrance('open')}
                    disabled={!backendStatus || loading || entranceState === 'opening' || entranceState === 'open'}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
                      entranceState === 'open' || entranceState === 'opening'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-green-50 hover:to-emerald-50 hover:text-green-700 border border-gray-300'
                    }`}
                  >
                    <DoorOpen className="w-5 h-5" />
                    {entranceState === 'opening' ? 'Abriendo...' : 'Abrir Portón'}
                  </button>
                  <button
                    onClick={() => controlEntrance('close')}
                    disabled={!backendStatus || loading || entranceState === 'closing' || entranceState === 'closed'}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm ${
                      entranceState === 'closed' || entranceState === 'closing'
                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-300' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-50 hover:to-gray-100 border border-gray-300'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    {entranceState === 'closing' ? 'Cerrando...' : 'Cerrar Portón'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Alertas mejorado */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-4 mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Alertas
                </h2>
                <p className="text-gray-600 text-sm">Sistema de notificaciones</p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 h-[32rem]">
              <div className="h-full overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {alerts.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="relative mb-4">
                        <AlertTriangle className="w-16 h-16 mx-auto text-gray-300" />
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-red-200 rounded-full opacity-20 animate-pulse"></div>
                      </div>
                      <p className="text-lg font-semibold">No hay alertas recientes</p>
                      <p className="text-sm mt-2 text-gray-400">
                        {backendStatus && isConnected ? "🟢 Esperando mensajes..." : "🔴 Sin conexión"}
                      </p>
                    </div>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <div
                      key={alert.id}
                      className="group bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 rounded-r-xl shadow-sm hover:shadow-md transition-all duration-300 animate-slideInRight"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-gray-900">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                            {alert.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;