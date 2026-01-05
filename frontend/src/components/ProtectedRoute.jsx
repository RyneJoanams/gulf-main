import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, loginPath = '/login', requiredDepartment = null }) => {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // If no token or user, redirect to login
  if (!token || !userStr) {
    return <Navigate to={loginPath} replace />;
  }
  
  // Parse user data
  let user;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    // Clear invalid data and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to={loginPath} replace />;
  }
  
  // If a specific department is required, validate access
  if (requiredDepartment) {
    const userDepartments = user.departments || [];
    const hasAccess = userDepartments.includes(requiredDepartment);
    
    if (!hasAccess) {
      console.warn(`Access denied: User does not have access to ${requiredDepartment}`);
      return <Navigate to={loginPath} replace />;
    }
  }
  
  // If authenticated and has proper access, render the protected component
  return children;
};

export default ProtectedRoute;
