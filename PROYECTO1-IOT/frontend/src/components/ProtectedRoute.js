import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Usar sessionStorage en lugar de localStorage
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;