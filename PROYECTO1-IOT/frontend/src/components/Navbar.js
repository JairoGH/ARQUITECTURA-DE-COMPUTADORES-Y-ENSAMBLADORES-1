import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, LogOut,Zap } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Limpiar ambos storage para asegurar
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      path: '/statistics',
      label: 'Estadísticas',
      icon: BarChart3
    }
  ];

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
          <Zap className="w-8 h-8 text-white" />
          <div className="absolute inset-0 rounded-2xl bg-blue-400 opacity-20 animate-ping"></div>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent transition-all duration-300 hover:from-blue-600 hover:to-indigo-700">
            Dashboard IoT - Grupo 3
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Sistema de Control Inteligente
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Navegación por pestañas */}
        <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1 shadow-lg border border-gray-200/50 backdrop-blur-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/80 hover:shadow-md'
                }`}
              >
                <Icon className={`w-4 h-4 transition-all duration-300 ${
                  isActive ? 'text-white animate-pulse' : 'text-gray-600 group-hover:text-gray-800'
                }`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300"
        >
          <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:rotate-6" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;