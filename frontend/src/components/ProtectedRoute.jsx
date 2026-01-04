import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, loginPath = '/login' }) => {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // If no token or user, redirect to login
  if (!token || !user) {
    return <Navigate to={loginPath} replace />;
  }
  
  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
