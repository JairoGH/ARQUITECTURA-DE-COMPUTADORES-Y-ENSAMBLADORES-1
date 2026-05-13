import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { BarChart, Table, Thermometer, Droplets, Activity, Sprout, Lightbulb, Fan, AlertTriangle, Wifi, WifiOff, Server, Database } from 'lucide-react';
import Navbar from './Navbar';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const Statistics = () => {
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
  const [backendStatus, setBackendStatus] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mongoStatus, setMongoStatus] = useState(false);
  
  // Datos filtrados para graficas - con useMemo para evitar resets innecesarios
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);
  const [soilMoistureData, setSoilMoistureData] = useState({ wet: 0, dry: 0 });
  const [movementData, setMovementData] = useState(0);
  const [actuatorData, setActuatorData] = useState({});
  
  // Datos sin filtrar (originales)
  const [rawData, setRawData] = useState([]);
  const [temperatureRawData, setTemperatureRawData] = useState([]);
  const [soilMoistureRawData, setSoilMoistureRawData] = useState([]);
  const [movementRawData, setMovementRawData] = useState([]);
  const [entradaEventosRawData, setEntradaEventosRawData] = useState([]);
  const [riegoEventosRawData, setRiegoEventosRawData] = useState([]);
  const [ventilacionRawData, setVentilacionRawData] = useState([]);
  const [alertsRawData, setAlertsRawData] = useState([]);
  
  // Datos filtrados para las tablas
  const [filteredTemperatureData, setFilteredTemperatureData] = useState([]);
  const [filteredAllData, setFilteredAllData] = useState([]);
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endTime: '23:59'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [countdown, setCountdown] = useState(15); // Nuevo estado para el contador

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

  // Funcion para obtener la fecha correcta de un item - ahora con useCallback
  const getItemTimestamp = React.useCallback((item) => {
    // Para datos de iluminación, usar timestampMsg o receivedAt
    if (item.timestampMsg) return item.timestampMsg;
    if (item.receivedAt) return item.receivedAt;
    // Para otros sensores
    return item.payload?.timestamp || item.fechaHora;
  }, []);

  // Procesar datos de temperatura FILTRADOS - siempre actualiza el estado, incluso si no hay datos
  const processFilteredTemperatureData = React.useCallback((data) => {
    // Procesar datos de temperatura
    const tempData = (data && data.length > 0) ? data
      .filter(item => item.tempC !== undefined)
      .map(item => {
        // Obtener timestamp directamente aquí para evitar dependencias
        const timestamp = item.timestampMsg || item.receivedAt || item.payload?.timestamp || item.fechaHora;
        return {
          x: new Date(timestamp),
          y: item.tempC
        };
      }) : [];
    
    // Siempre actualizar el estado, incluso si está vacío
    setTemperatureData(tempData);
    
    // Extraer datos de humedad si están disponibles
    const humidityData = (data && data.length > 0) ? data
      .filter(item => item.humedad !== undefined)
      .map(item => {
        const timestamp = item.timestampMsg || item.receivedAt || item.payload?.timestamp || item.fechaHora;
        return {
          x: new Date(timestamp),
          y: item.humedad
        };
      }) : [];
    
    // Siempre actualizar el estado, incluso si está vacío
    setHumidityData(humidityData);
  }, []); // Sin dependencias para evitar re-creaciones

  // Procesar datos de humedad del suelo FILTRADOS - siempre actualiza el estado
  const processFilteredSoilMoistureData = React.useCallback((data) => {
    const moistureCounts = {
      wet: 0,
      dry: 0
    };
    
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.state === 'wet') {
          moistureCounts.wet++;
        } else if (item.state === 'dry') {
          moistureCounts.dry++;
        }
      });
    }
    
    // Siempre actualizar el estado, incluso si no hay datos
    setSoilMoistureData(moistureCounts);
  }, []); // Sin dependencias

  // Procesar datos de movimiento FILTRADOS - siempre actualiza el estado
  const processFilteredMovementData = React.useCallback((data) => {
    const movementCount = (data && data.length > 0) ? 
      data.filter(item => 
        item.accion && item.accion.includes('MOVIMIENTO ON')
      ).length : 0;
    
    // Siempre actualizar el estado, incluso si es 0
    setMovementData(movementCount);
  }, []); // Sin dependencias

  // Procesar datos de iluminación FILTRADOS para extraer información de actuadores - siempre actualiza el estado
  const processFilteredActuatorData = React.useCallback((iluminationData, entradaData, riegoData, ventilacionData, alertsData) => {
    const actuatorCounts = {};
    
    // Procesar datos de iluminación
    if (iluminationData && iluminationData.length > 0) {
      iluminationData.forEach(event => {
        if (event.device) {
          const deviceType = event.device;
          if (!actuatorCounts[deviceType]) {
            actuatorCounts[deviceType] = 0;
          }
          actuatorCounts[deviceType]++;
        }
      });
    }

    // Procesar eventos de entrada (portón)
    if (entradaData && entradaData.length > 0) {
      entradaData.forEach(event => {
        const deviceType = 'entrance';
        if (!actuatorCounts[deviceType]) {
          actuatorCounts[deviceType] = 0;
        }
        actuatorCounts[deviceType]++;
      });
    }

    // Procesar eventos de riego (bomba de agua)
    if (riegoData && riegoData.length > 0) {
      riegoData.forEach(event => {
        const deviceType = 'bomba_agua';
        if (!actuatorCounts[deviceType]) {
          actuatorCounts[deviceType] = 0;
        }
        actuatorCounts[deviceType]++;
      });
    }

    // Procesar eventos de ventilación
    if (ventilacionData && ventilacionData.length > 0) {
      ventilacionData.forEach(event => {
        const deviceType = 'ventilador';
        if (!actuatorCounts[deviceType]) {
          actuatorCounts[deviceType] = 0;
        }
        actuatorCounts[deviceType]++;
      });
    }

    // Procesar alertas del sistema
    if (alertsData && alertsData.length > 0) {
      alertsData.forEach(event => {
        const deviceType = 'alertas_sistema';
        if (!actuatorCounts[deviceType]) {
          actuatorCounts[deviceType] = 0;
        }
        actuatorCounts[deviceType]++;
      });
    }
    
    // Siempre actualizar el estado, incluso si está vacío
    setActuatorData(actuatorCounts);
  }, []); // Sin dependencias

  // Función para aplicar filtros - optimizada para evitar re-renderizados constantes
  const applyFilters = React.useCallback(() => {
    const { start, end, startTime, endTime } = dateRange;
    
    // Función interna para obtener timestamp
    const getTimestamp = (item) => {
      return item.timestampMsg || item.receivedAt || item.payload?.timestamp || item.fechaHora;
    };
    
    // Función interna para filtrar
    const filterByDateTime = (data, startDate, endDate, startTime, endTime) => {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      return data.filter(item => {
        const itemTimestamp = getTimestamp(item);
        if (!itemTimestamp) return false;
        
        let itemDate;
        if (itemTimestamp.includes('GMT')) {
          const dateTimeStr = itemTimestamp.replace(' GMT-6', '');
          const [datePart, timePart] = dateTimeStr.split(' ');
          const [day, month, year] = datePart.split('-');
          itemDate = new Date(`${year}-${month}-${day}T${timePart}`);
        } else {
          itemDate = new Date(itemTimestamp);
        }
        
        return itemDate >= startDateTime && itemDate <= endDateTime;
      });
    };
    
    // Filtrar datos de temperatura
    const filteredTempData = filterByDateTime(temperatureRawData, start, end, startTime, endTime);
    setFilteredTemperatureData(filteredTempData);
    processFilteredTemperatureData(filteredTempData);
    
    // Filtrar datos de humedad del suelo
    const filteredSoilData = filterByDateTime(soilMoistureRawData, start, end, startTime, endTime);
    processFilteredSoilMoistureData(filteredSoilData);
    
    // Filtrar datos de movimiento
    const filteredMovementData = filterByDateTime(movementRawData, start, end, startTime, endTime);
    processFilteredMovementData(filteredMovementData);
    
    // Filtrar todos los datos de actuadores
    const filteredRawData = filterByDateTime(rawData, start, end, startTime, endTime);
    const filteredEntradaData = filterByDateTime(entradaEventosRawData, start, end, startTime, endTime);
    const filteredRiegoData = filterByDateTime(riegoEventosRawData, start, end, startTime, endTime);
    const filteredVentilacionData = filterByDateTime(ventilacionRawData, start, end, startTime, endTime);
    const filteredAlertsData = filterByDateTime(alertsRawData, start, end, startTime, endTime);
    
    processFilteredActuatorData(filteredRawData, filteredEntradaData, filteredRiegoData, filteredVentilacionData, filteredAlertsData);
    
    // Combinar todos los datos y filtrar para la tabla general
    const allData = [
      ...filteredRawData.map(item => ({...item, deviceType: 'iluminacion'})),
      ...filteredTempData.map(item => ({...item, device: 'temperatura'})),
      ...filteredSoilData.map(item => ({...item, device: 'humedad_suelo'})),
      ...filteredMovementData.map(item => ({...item, device: 'movimiento'})),
      ...filteredEntradaData.map(item => ({...item, device: 'entrada'})),
      ...filteredRiegoData.map(item => ({...item, device: 'riego'})),
      ...filteredVentilacionData.map(item => ({...item, device: 'ventilacion'})),
      ...filteredAlertsData.map(item => ({...item, device: 'alertas'}))
    ];
    
    const filteredAll = allData.sort((a, b) => {
      const dateA = new Date(getTimestamp(a));
      const dateB = new Date(getTimestamp(b));
      return dateB - dateA;
    });
    
    setFilteredAllData(filteredAll);
  }, [
    dateRange, 
    temperatureRawData, 
    rawData, 
    soilMoistureRawData, 
    movementRawData,
    entradaEventosRawData,
    riegoEventosRawData,
    ventilacionRawData,
    alertsRawData,
    processFilteredTemperatureData,
    processFilteredSoilMoistureData,
    processFilteredMovementData,
    processFilteredActuatorData
  ]); // Dependencias más estables

  // Cargar datos iniciales - optimizada para evitar re-creaciones
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Verificar backend y obtener status completo
      const status = await apiRequest('/status');
      setBackendStatus(true);
      setIsConnected(status.mqtt_connected);
      setMongoStatus(status.mongodb_connected || status.mongodb_available);

      // Cargar estados de habitaciones sin depender de fecha)
      const roomsResponse = await apiRequest('/mqtt/rooms');
      if (roomsResponse.success) {
        setRoomStates(roomsResponse.data);
      }

      // Cargar alertas (no dependen de fecha)
      const alertsResponse = await apiRequest('/mqtt/alerts');
      if (alertsResponse.success) {
        setAlerts(alertsResponse.data);
      }

      // Cargar TODOS los datos sin filtros
      const temperatureResponse = await apiRequest('/temperatura');
      const soilMoistureResponse = await apiRequest('/humedad-suelo');
      const movementResponse = await apiRequest('/movimiento');
      const iluminationResponse = await apiRequest('/ilumination');
      const entradaEventosResponse = await apiRequest('/entrada-eventos');
      const riegoEventosResponse = await apiRequest('/riego-eventos');
      const ventilacionResponse = await apiRequest('/ventilacion');
      const alertsDbResponse = await apiRequest('/alerts');

      // Procesar todos los datos de una vez
      if (temperatureResponse.success) {
        setTemperatureRawData(temperatureResponse.data);
      }
      if (soilMoistureResponse.success) {
        setSoilMoistureRawData(soilMoistureResponse.data);
      }
      if (movementResponse.success) {
        setMovementRawData(movementResponse.data);
      }
      if (iluminationResponse.success) {
        setRawData(iluminationResponse.data);
      }
      if (entradaEventosResponse.success) {
        setEntradaEventosRawData(entradaEventosResponse.data);
      }
      if (riegoEventosResponse.success) {
        setRiegoEventosRawData(riegoEventosResponse.data);
      }
      if (ventilacionResponse.success) {
        setVentilacionRawData(ventilacionResponse.data);
      }
      if (alertsDbResponse.success) {
        setAlertsRawData(alertsDbResponse.data);
      }

      // Aplicar filtros inmediatamente después de cargar todos los datos
      setTimeout(() => {
        const currentDateRange = {
          start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          startTime: '00:00',
          endTime: '23:59'
        };
        
        // Función interna para filtrar datos
        const filterByDateTime = (data, dateRange) => {
          const startDateTime = new Date(`${dateRange.start}T${dateRange.startTime}`);
          const endDateTime = new Date(`${dateRange.end}T${dateRange.endTime}`);
          
          return data.filter(item => {
            const itemTimestamp = item.timestampMsg || item.receivedAt || item.payload?.timestamp || item.fechaHora;
            if (!itemTimestamp) return false;
            
            let itemDate;
            if (itemTimestamp.includes('GMT')) {
              const dateTimeStr = itemTimestamp.replace(' GMT-6', '');
              const [datePart, timePart] = dateTimeStr.split(' ');
              const [day, month, year] = datePart.split('-');
              itemDate = new Date(`${year}-${month}-${day}T${timePart}`);
            } else {
              itemDate = new Date(itemTimestamp);
            }
            
            return itemDate >= startDateTime && itemDate <= endDateTime;
          });
        };
        
        // Procesar datos de temperatura
        if (temperatureResponse.success && temperatureResponse.data.length > 0) {
          const filteredTempData = filterByDateTime(temperatureResponse.data, currentDateRange);
          setFilteredTemperatureData(filteredTempData);
          processFilteredTemperatureData(filteredTempData);
        }
        
        // Procesar datos de humedad del suelo
        if (soilMoistureResponse.success && soilMoistureResponse.data.length > 0) {
          const filteredSoilData = filterByDateTime(soilMoistureResponse.data, currentDateRange);
          processFilteredSoilMoistureData(filteredSoilData);
        }
        
        // Procesar datos de movimiento
        if (movementResponse.success && movementResponse.data.length > 0) {
          const filteredMovementData = filterByDateTime(movementResponse.data, currentDateRange);
          processFilteredMovementData(filteredMovementData);
        }
        
        // Procesar datos de iluminación y todos los actuadores
        const filteredRawData = iluminationResponse.success ? filterByDateTime(iluminationResponse.data, currentDateRange) : [];
        const filteredEntradaData = entradaEventosResponse.success ? filterByDateTime(entradaEventosResponse.data, currentDateRange) : [];
        const filteredRiegoData = riegoEventosResponse.success ? filterByDateTime(riegoEventosResponse.data, currentDateRange) : [];
        const filteredVentilacionData = ventilacionResponse.success ? filterByDateTime(ventilacionResponse.data, currentDateRange) : [];
        const filteredAlertsData = alertsDbResponse.success ? filterByDateTime(alertsDbResponse.data, currentDateRange) : [];
        
        processFilteredActuatorData(filteredRawData, filteredEntradaData, filteredRiegoData, filteredVentilacionData, filteredAlertsData);
        
        // Combinar todos los datos para la tabla general
        const allData = [
          ...filteredRawData.map(item => ({...item, deviceType: 'iluminacion'})),
          ...(temperatureResponse.success ? filterByDateTime(temperatureResponse.data, currentDateRange).map(item => ({...item, device: 'temperatura'})) : []),
          ...(soilMoistureResponse.success ? filterByDateTime(soilMoistureResponse.data, currentDateRange).map(item => ({...item, device: 'humedad_suelo'})) : []),
          ...(movementResponse.success ? filterByDateTime(movementResponse.data, currentDateRange).map(item => ({...item, device: 'movimiento'})) : []),
          ...filteredEntradaData.map(item => ({...item, device: 'entrada'})),
          ...filteredRiegoData.map(item => ({...item, device: 'riego'})),
          ...filteredVentilacionData.map(item => ({...item, device: 'ventilacion'})),
          ...filteredAlertsData.map(item => ({...item, device: 'alertas'}))
        ];
          
          const filteredAll = allData.sort((a, b) => {
            const getTimestamp = (item) => item.timestampMsg || item.receivedAt || item.payload?.timestamp || item.fechaHora;
            const dateA = new Date(getTimestamp(a));
            const dateB = new Date(getTimestamp(b));
            return dateB - dateA;
          });
          
          setFilteredAllData(filteredAll);
      }, 100); // Pequeño delay para asegurar que todos los estados se actualicen

    } catch (error) {
      setBackendStatus(false);
      setIsConnected(false);
      setMongoStatus(false);
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [processFilteredTemperatureData, processFilteredSoilMoistureData, processFilteredMovementData, processFilteredActuatorData]); // Solo funciones estables como dependencias

  // Cargar datos iniciales - ejecutar solo una vez al montar el componente
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //  Actualización automática cada 15 segundos con contador - optimizada
  useEffect(() => {
    console.log('📊 Configurando actualización automática de estadísticas cada 15 segundos...');
    
    // Función interna para aplicar filtros sin dependencias externas
    const applyCurrentFilters = () => {
      const { start, end, startTime, endTime } = dateRange;
      
      // Función interna para obtener timestamp
      const getTimestamp = (item) => {
        return item.timestampMsg || item.receivedAt || item.payload?.timestamp || item.fechaHora;
      };
      
      // Función interna para filtrar
      const filterByDateTime = (data, startDate, endDate, startTime, endTime) => {
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        
        return data.filter(item => {
          const itemTimestamp = getTimestamp(item);
          if (!itemTimestamp) return false;
          
          let itemDate;
          if (itemTimestamp.includes('GMT')) {
            const dateTimeStr = itemTimestamp.replace(' GMT-6', '');
            const [datePart, timePart] = dateTimeStr.split(' ');
            const [day, month, year] = datePart.split('-');
            itemDate = new Date(`${year}-${month}-${day}T${timePart}`);
          } else {
            itemDate = new Date(itemTimestamp);
          }
          
          return itemDate >= startDateTime && itemDate <= endDateTime;
        });
      };
      
      // Filtrar y procesar datos
      const filteredTempData = filterByDateTime(temperatureRawData, start, end, startTime, endTime);
      processFilteredTemperatureData(filteredTempData);
      
      const filteredSoilData = filterByDateTime(soilMoistureRawData, start, end, startTime, endTime);
      processFilteredSoilMoistureData(filteredSoilData);
      
      const filteredMovementData = filterByDateTime(movementRawData, start, end, startTime, endTime);
      processFilteredMovementData(filteredMovementData);
      
      const filteredRawData = filterByDateTime(rawData, start, end, startTime, endTime);
      const filteredEntradaData = filterByDateTime(entradaEventosRawData, start, end, startTime, endTime);
      const filteredRiegoData = filterByDateTime(riegoEventosRawData, start, end, startTime, endTime);
      const filteredVentilacionData = filterByDateTime(ventilacionRawData, start, end, startTime, endTime);
      const filteredAlertsData = filterByDateTime(alertsRawData, start, end, startTime, endTime);
      
      processFilteredActuatorData(filteredRawData, filteredEntradaData, filteredRiegoData, filteredVentilacionData, filteredAlertsData);
    };
    
    // Contador regresivo
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 15; // Reiniciar el contador
        }
        return prev - 1;
      });
    }, 1000); // Actualizar cada segundo

    // Actualización de datos cada 15 segundos
    const updateInterval = setInterval(async () => {
      if (!backendStatus) return; // Solo actualizar si el backend está disponible
      
      try {
        setIsAutoUpdating(true);
        console.log('🔄 Actualizando estadísticas automáticamente...');
        
        // Recargar solo estados de habitaciones y alertas (datos en tiempo real)
        try {
          const roomsResponse = await apiRequest('/mqtt/rooms');
          if (roomsResponse.success) {
            setRoomStates(roomsResponse.data);
          }

          const alertsResponse = await apiRequest('/mqtt/alerts');
          if (alertsResponse.success) {
            setAlerts(alertsResponse.data);
          }
        } catch (error) {
          console.warn('⚠️ Error actualizando datos en tiempo real:', error);
        }

        // **NUEVO**: También actualizar las gráficas con los filtros actuales
        try {
          console.log('📈 Actualizando gráficas con filtros actuales...');
          
          // Recargar datos del servidor para obtener información más reciente
          const [temperatureResponse, soilMoistureResponse, movementResponse, iluminationResponse, entradaEventosResponse, riegoEventosResponse, ventilacionResponse, alertsDbResponse] = await Promise.all([
            apiRequest('/temperatura'),
            apiRequest('/humedad-suelo'),
            apiRequest('/movimiento'),
            apiRequest('/ilumination'),
            apiRequest('/entrada-eventos'),
            apiRequest('/riego-eventos'),
            apiRequest('/ventilacion'),
            apiRequest('/alerts')
          ]);

          // Actualizar datos raw con la información más reciente
          if (temperatureResponse.success) {
            setTemperatureRawData(temperatureResponse.data);
          }
          if (soilMoistureResponse.success) {
            setSoilMoistureRawData(soilMoistureResponse.data);
          }
          if (movementResponse.success) {
            setMovementRawData(movementResponse.data);
          }
          if (iluminationResponse.success) {
            setRawData(iluminationResponse.data);
          }
          if (entradaEventosResponse.success) {
            setEntradaEventosRawData(entradaEventosResponse.data);
          }
          if (riegoEventosResponse.success) {
            setRiegoEventosRawData(riegoEventosResponse.data);
          }
          if (ventilacionResponse.success) {
            setVentilacionRawData(ventilacionResponse.data);
          }
          if (alertsDbResponse.success) {
            setAlertsRawData(alertsDbResponse.data);
          }
          
          // Aplicar filtros actuales con los datos actualizados
          setTimeout(() => {
            applyCurrentFilters();
          }, 100);
          
        } catch (error) {
          console.warn('⚠️ Error actualizando gráficas:', error);
        }

      } catch (error) {
        console.error('❌ Error en actualización automática:', error);
      } finally {
        setIsAutoUpdating(false);
        setCountdown(15); // Reiniciar contador después de la actualización
      }
    }, 15000); // 15 segundos

    // Cleanup de ambos intervals cuando el componente se desmonte
    return () => {
      console.log('🛑 Deteniendo actualización automática de estadísticas');
      clearInterval(countdownInterval);
      clearInterval(updateInterval);
    };
  }, [
    backendStatus, 
    dateRange,
    temperatureRawData,
    soilMoistureRawData, 
    movementRawData,
    rawData,
    entradaEventosRawData,
    riegoEventosRawData,
    ventilacionRawData,
    alertsRawData,
    processFilteredTemperatureData,
    processFilteredSoilMoistureData,
    processFilteredMovementData,
    processFilteredActuatorData
  ]); // Incluir todas las dependencias necesarias

  // Función para manejar la aplicación de filtros
  const handleApplyFilters = () => {
    setIsLoading(true);
    setTimeout(() => {
      applyFilters();
      setIsLoading(false);
    }, 500);
  };

  // Calcular estadísticas
  const lightsOn = [
    roomStates.sala,
    roomStates.cuarto1, 
    roomStates.cuarto2,
    roomStates.rgb_room?.isOn,
    roomStates.ventilador,
    roomStates.bomba_agua,
    roomStates.alarma
  ].filter(Boolean).length;

  const totalRooms = Object.keys(roomStates).length;

  // Opciones para la gráfica de temperatura (línea) - Memoizadas
  const temperatureChartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Temperatura (${dateRange.start} ${dateRange.startTime} - ${dateRange.end} ${dateRange.endTime})`,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'PPpp',
          displayFormats: {
            hour: 'MMM dd, HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Fecha y Hora',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperatura (°C)',
        },
      },
    },
  }), [dateRange.start, dateRange.startTime, dateRange.end, dateRange.endTime]);

  // Opciones para las gráficas de barras - Memoizadas con función
  const barChartOptions = React.useCallback((title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${title} (${dateRange.start} ${dateRange.startTime} - ${dateRange.end} ${dateRange.endTime})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de eventos',
        },
      },
    },
  }), [dateRange.start, dateRange.startTime, dateRange.end, dateRange.endTime]);

  // Preparar datos para la gráfica de temperatura - Memoizados para evitar re-renderizados
  const temperatureChartData = React.useMemo(() => ({
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: temperatureData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      },
    ],
  }), [temperatureData]);

  // Preparar datos para la gráfica de humedad ambiental - Memoizados
  const humidityBarChartData = React.useMemo(() => ({
    labels: ['Humedad Ambiental'],
    datasets: [
      {
        label: 'Eventos de humedad',
        data: [humidityData.length],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  }), [humidityData.length]);

  // Preparar datos para la gráfica de humedad del suelo - Memoizados
  const soilMoistureBarChartData = React.useMemo(() => ({
    labels: ['Suelo Húmedo', 'Suelo Seco'],
    datasets: [
      {
        label: 'Eventos de humedad del suelo',
        data: [soilMoistureData.wet || 0, soilMoistureData.dry || 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1,
      },
    ],
  }), [soilMoistureData.wet, soilMoistureData.dry]);

  // Preparar datos para la gráfica de movimiento - Memoizados
  const movementBarChartData = React.useMemo(() => ({
    labels: ['Detecciones de movimiento'],
    datasets: [
      {
        label: 'Eventos de movimiento',
        data: [movementData],
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1,
      },
    ],
  }), [movementData]);

  // Función para mapear nombres de dispositivos a nombres descriptivos
  const getDeviceDisplayName = (deviceKey) => {
    const deviceNames = {
      'led_room': 'Iluminación Habitaciones',
      'led_rgb': 'LED RGB',
      'entrance': 'Control de Entrada',
      'bomba_agua': 'Bomba de Agua',
      'ventilador': 'Ventilador',
      'alertas_sistema': 'Alertas del Sistema'
    };
    return deviceNames[deviceKey] || deviceKey;
  };

  // Preparar datos para la gráfica de actuadores - Memoizados
  const actuatorChartData = React.useMemo(() => {
    const deviceKeys = Object.keys(actuatorData);
    const displayLabels = deviceKeys.map(key => getDeviceDisplayName(key));
    
    return {
      labels: displayLabels,
      datasets: [
        {
          label: 'Número de activaciones',
          data: Object.values(actuatorData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [actuatorData]);

  // Función para formatear el valor a mostrar en las tablas
  const formatValue = (item) => {
    if (item.tempC !== undefined) {
      return `${item.tempC} °C` + (item.humedad !== undefined ? `, ${item.humedad}% humedad` : '');
    } else if (item.state !== undefined) {
      return item.state === 'wet' ? 'Húmedo' : 'Seco';
    } else if (item.accion !== undefined) {
      return `${item.accion}` + (item.area ? ` (${item.area})` : '');
    } else if (item.action !== undefined) {
      let actionText = `${item.action}`;
      if (item.room) actionText += ` (${item.room})`;
      // Para datos RGB, agregar información de color
      if (item.device === 'led_rgb' && item.r !== undefined) {
        actionText += ` - RGB(${item.r}, ${item.g}, ${item.b})`;
      }
      return actionText;
    } else if (item.value !== undefined) {
      return `${item.value}`;
    }
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header con navegación mejorado */}
        <div className="mb-8">
          <Navbar />
        </div>

        {/* Header con indicadores de estado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Estadísticas</h1>
            <p className="text-sm text-gray-600 mt-1">Gráficas y tablas filtradas por rango de fechas y horas.</p>
          </div>
          
          {/* Indicadores de estado más compactos */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              {backendStatus ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Server className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium text-sm">Backend Conectado</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <Server className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 font-medium text-sm">Backend Desconectado</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium text-sm">MQTT Conectado</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 font-medium text-sm">MQTT Desconectado</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
              {mongoStatus ? (
                <>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <Database className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 font-medium text-sm">MongoDB Conectado</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <Database className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 font-medium text-sm">MongoDB Desconectado</span>
                </>
              )}
            </div>

            {/* Contador de actualización automática */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
              {isAutoUpdating ? (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-spin"></div>
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700 font-medium text-sm">Actualizando...</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{countdown}</span>
                  </div>
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700 font-medium text-sm">Próxima actualización</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filtros de fecha y hora con efectos mejorados */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Filtrar por Fecha y Hora
              </h3>
              <p className="text-gray-600 text-sm">Personaliza el rango de datos a analizar</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">Fecha Inicio</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">Hora Inicio</label>
              <input
                type="time"
                value={dateRange.startTime}
                onChange={(e) => setDateRange({...dateRange, startTime: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">Fecha Final</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">Hora Final</label>
              <input
                type="time"
                value={dateRange.endTime}
                onChange={(e) => setDateRange({...dateRange, endTime: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              />
            </div>
            <div>
              <button
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Aplicando...
                  </div>
                ) : (
                  'Aplicar Filtros'
                )}
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 rounded-r-xl mb-8 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
              <p className="text-blue-700 font-medium">Aplicando filtros a gráficas y tablas...</p>
            </div>
          </div>
        )}

        {/* Tarjetas de estadísticas con efectos mejorados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-1">Dispositivos Activos</h3>
            <p className="text-3xl font-bold text-green-600 mb-1">{lightsOn}</p>
            <p className="text-sm text-green-500">de {totalRooms} dispositivos</p>
          </div>
          
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-1">Eventos Filtrados</h3>
            <p className="text-3xl font-bold text-blue-600 mb-1">{filteredAllData.length}</p>
            <p className="text-sm text-blue-500">En el rango seleccionado</p>
          </div>
          
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-1">Alertas</h3>
            <p className="text-3xl font-bold text-purple-600 mb-1">{alerts.length}</p>
            <p className="text-sm text-purple-500">Registradas</p>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-1">Tipos de Dispositivos</h3>
            <p className="text-3xl font-bold text-orange-600 mb-1">{Object.keys(actuatorData).length}</p>
            <p className="text-sm text-orange-500">En el rango filtrado</p>
          </div>
        </div>

        {/* Sección de Gráficas Principales con header mejorado */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Análisis de Datos
              </h2>
              <p className="text-gray-600 text-sm">Visualización gráfica de sensores y actuadores</p>
            </div>
          </div>

          {/* Gráficas principales con efectos mejorados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfica de temperatura */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg">
                  <Thermometer className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Temperatura</h3>
                <span className="text-sm text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-full">(Filtrada)</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg h-64">
                {temperatureData.length > 0 ? (
                  <Line options={temperatureChartOptions} data={temperatureChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Thermometer className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No hay datos de temperatura disponibles para el rango seleccionado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfica de actuadores */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Activaciones de Actuadores</h3>
                <span className="text-sm text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-full">(Filtrada)</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg h-64">
                {Object.keys(actuatorData).length > 0 ? (
                  <Bar options={barChartOptions('Activaciones de actuadores')} data={actuatorChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No hay datos de actuadores disponibles para el rango seleccionado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráficas secundarias con header y efectos */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-800">Sensores Ambientales</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Humedad ambiental */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Humedad Ambiental</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg h-64">
                {humidityData.length > 0 ? (
                  <Bar options={barChartOptions('Eventos de humedad ambiental')} data={humidityBarChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Droplets className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No hay datos de humedad ambiental para el rango seleccionado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Humedad del suelo */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Humedad del Suelo</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg h-64">
                {(soilMoistureData.wet > 0 || soilMoistureData.dry > 0) ? (
                  <Bar options={barChartOptions('Estado del suelo')} data={soilMoistureBarChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Sprout className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No hay datos de humedad del suelo para el rango seleccionado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Movimiento */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Movimiento</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg h-64">
                {movementData > 0 ? (
                  <Bar options={barChartOptions('Detecciones de movimiento')} data={movementBarChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No hay datos de movimiento para el rango seleccionado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Tablas con header mejorado */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Table className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Datos Detallados
              </h2>
              <p className="text-gray-600 text-sm">Registros filtrados en formato tabular</p>
            </div>
          </div>

          {/* Tabla de temperatura con efectos mejorados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Datos de Temperatura - Filtrados</h3>
              <span className="text-sm text-gray-500 ml-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-200">
                ({filteredTemperatureData.length} registros del {dateRange.start} {dateRange.startTime} al {dateRange.end} {dateRange.endTime})
              </span>
            </div>
            
            <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-200">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sensor
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperatura (°C)
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Humedad (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemperatureData.length > 0 ? (
                    filteredTemperatureData.map((item, index) => {
                      const timestamp = getItemTimestamp(item);
                      return (
                        <tr key={index} className={`transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="px-4 py-3 border-b border-gray-200">
                            {timestamp ? new Date(timestamp).toLocaleString() : 'Fecha no disponible'}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200 font-medium">
                            {item.sensor || 'DHT11'}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                              {item.tempC !== undefined ? `${item.tempC} °C` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                              {item.humedad !== undefined ? `${item.humedad}%` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Thermometer className="w-12 h-12 text-gray-300 mb-2" />
                          <p>No hay datos de temperatura disponibles para el rango seleccionado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla general con efectos mejorados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg">
                <Table className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Todos los Registros - Filtrados</h3>
              <span className="text-sm text-gray-500 ml-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-1 rounded-full border border-purple-200">
                ({filteredAllData.length} registros del {dateRange.start} {dateRange.startTime} al {dateRange.end} {dateRange.endTime})
              </span>
            </div>
            
            <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-200">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispositivo/Sensor
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor / Estado / Acción
                    </th>
                    <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Área/Ubicación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllData.length > 0 ? (
                    filteredAllData.map((item, index) => {
                      const timestamp = getItemTimestamp(item);
                      return (
                        <tr key={index} className={`transition-colors hover:bg-purple-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="px-4 py-3 border-b border-gray-200">
                            {timestamp ? new Date(timestamp).toLocaleString() : 'Fecha no disponible'}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm font-medium">
                              {item.device || item.sensor || 'Desconocido'}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            {formatValue(item)}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <span className="text-gray-600">
                              {item.area || item.room || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Table className="w-12 h-12 text-gray-300 mb-2" />
                          <p>No hay datos disponibles para el rango seleccionado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Estado del sistema con efectos mejorados */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Estado del Sistema
              </h3>
              <p className="text-gray-600 text-sm">Estado actual de todos los dispositivos IoT</p>
            </div>
          </div>
          
          {/* Iluminación con efectos mejorados */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></div>
              <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Iluminación
              </h4>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.sala ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900">Sala</span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.sala ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{roomStates.sala ? 'Encendida' : 'Apagada'}</p>
              </div>

              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.cuarto1 ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900">Cuarto 1</span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.cuarto1 ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{roomStates.cuarto1 ? 'Encendida' : 'Apagada'}</p>
              </div>

              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.cuarto2 ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900">Cuarto 2</span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.cuarto2 ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{roomStates.cuarto2 ? 'Encendida' : 'Apagada'}</p>
              </div>

              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.rgb_room?.isOn ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900">RGB Room</span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.rgb_room?.isOn ? 'bg-purple-500 animate-pulse shadow-lg shadow-purple-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {roomStates.rgb_room?.isOn ? `Encendida - ${roomStates.rgb_room?.color}` : 'Apagada'}
                </p>
              </div>
            </div>
          </div>

          {/* Otros Dispositivos con efectos mejorados */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full"></div>
              <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Dispositivos de Control
              </h4>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.ventilador ? 'border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg shadow-cyan-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900 flex items-center gap-2">
                    <Fan className="w-4 h-4" />
                    Ventilador
                  </span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.ventilador ? 'bg-cyan-500 animate-pulse shadow-lg shadow-cyan-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{roomStates.ventilador ? 'Activo' : 'Inactivo'}</p>
              </div>

              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.bomba_agua ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900 flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Bomba de Agua
                  </span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.bomba_agua ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{roomStates.bomba_agua ? 'Activa' : 'Inactiva'}</p>
              </div>

              <div className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${roomStates.alarma ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg shadow-red-100' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Sistema de Alarma
                  </span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${roomStates.alarma ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{roomStates.alarma ? 'Activada' : 'Desactivada'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;