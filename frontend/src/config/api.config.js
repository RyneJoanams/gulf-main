// API Configuration
// This file centralizes all API endpoint configurations

// Get the API base URL from environment variables
// Falls back to localhost if not set
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Get the frontend URL from environment variables
// Falls back to window.location.origin if not set
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

// API Endpoints
export const API_ENDPOINTS = {
  // Patient endpoints
  patients: `${API_BASE_URL}/api/patient`,
  
  // Lab endpoints
  labNumbers: `${API_BASE_URL}/api/number`,
  labRoutes: `${API_BASE_URL}/api/lab`,
  
  // Clinical endpoints
  clinical: `${API_BASE_URL}/api/clinical`,
  clinicalSearch: `${API_BASE_URL}/api/clinical/search`,
  
  // Radiology endpoints
  radiology: `${API_BASE_URL}/api/radiology`,
  
  // User endpoints
  users: `${API_BASE_URL}/api/users`,
  
  // Expense endpoints
  expenses: `${API_BASE_URL}/api/expenses`,
  
  // Front office endpoints
  frontOffice: `${API_BASE_URL}/api/frontoffice`,
};

// Helper function to build full endpoint URLs
export const buildEndpoint = (path) => {
  return `${API_BASE_URL}${path}`;
};

export default {
  API_BASE_URL,
  FRONTEND_URL,
  API_ENDPOINTS,
  buildEndpoint,
};
