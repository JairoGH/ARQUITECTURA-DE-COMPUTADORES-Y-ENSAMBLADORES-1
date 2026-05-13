import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Statistics from './components/Statistics';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  // Limpiar autenticación al cargar la aplicación (opcional)
  useEffect(() => {
    // Si quieres que siempre empiece desde login, descomenta la línea siguiente:
    // localStorage.removeItem('isAuthenticated');
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta raíz: siempre redirige al login primero */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Ruta de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/statistics" element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          } />
          
          {/* Ruta para cualquier URL no encontrada */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;