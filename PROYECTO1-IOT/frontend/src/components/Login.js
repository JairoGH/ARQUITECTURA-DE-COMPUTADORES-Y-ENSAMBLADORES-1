import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, AlertCircle, Eye, EyeOff, Cpu, Wifi, Zap } from "lucide-react";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Eliminar cualquier autenticación previa al cargar el login
  useEffect(() => {
    localStorage.removeItem('isAuthenticated');
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulación de autenticación con nuevas credenciales
    setTimeout(() => {
      if (credentials.username === "grupo3_seccion_proy1" && credentials.password === "Arqui1G3") {
        // Guardar estado de autenticación (solo para esta sesión)
        sessionStorage.setItem("isAuthenticated", "true");
        // Navegar al dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError("Credenciales incorrectas. Por favor, intente nuevamente.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gray-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Iconos flotantes más visibles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Cpu className="absolute top-1/4 left-1/4 w-8 h-8 text-gray-800 opacity-80 animate-bounce" style={{animationDelay: '0s'}} />
        <Wifi className="absolute top-1/3 right-1/4 w-6 h-6 text-gray-900 opacity-70 animate-bounce" style={{animationDelay: '1s'}} />
        <Zap className="absolute bottom-1/3 left-1/3 w-7 h-7 text-black opacity-75 animate-bounce" style={{animationDelay: '2s'}} />
        <Cpu className="absolute bottom-1/4 right-1/3 w-5 h-5 text-gray-800 opacity-70 animate-bounce" style={{animationDelay: '3s'}} />
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <Cpu className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard IoT
          </h1>
          <p className="text-gray-600">Proyecto 1 - Grupo 3</p>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mt-2"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Usuario
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-300 hover:bg-white"
                placeholder="Ingrese su usuario"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={credentials.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-12 py-3 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-300 hover:bg-white"
                placeholder="Ingrese su contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Autenticando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">Sistema de Monitoreo IoT</p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">Sistema Online</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;