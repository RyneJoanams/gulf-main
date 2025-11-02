// Department access validation utility
import { API_BASE_URL } from '../config/api.config';

export const validateDepartmentAccess = (userDepartments, requestedDepartment) => {
  if (!userDepartments || !Array.isArray(userDepartments)) {
    return false;
  }
  
  return userDepartments.includes(requestedDepartment);
};

// Get redirect path based on user's primary department or first available department
export const getPrimaryDepartmentRedirect = (userDepartments) => {
  if (!userDepartments || !Array.isArray(userDepartments) || userDepartments.length === 0) {
    return '/front-office'; // Default fallback
  }

  // Department priority order (most specific to least specific)
  const departmentRoutes = {
    'Admin': '/admin',
    'Accounts': '/accounts',
    'Clinical': '/clinical',
    'Laboratory': '/lab',
    'Radiology': '/radiology',
    'Phlebotomy': '/phlebotomy',
    'Agent': '/agent',
    'Front Office': '/front-office'
  };

  // Return the route for the user's first department that has a route
  for (const dept of userDepartments) {
    if (departmentRoutes[dept]) {
      return departmentRoutes[dept];
    }
  }

  return '/front-office'; // Default fallback
};

// Enhanced login function that includes department validation
export const enhancedLogin = async (formData, requestedDepartment, navigate, toast) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);

    // Validate department access
    if (requestedDepartment && !validateDepartmentAccess(data.departments, requestedDepartment)) {
      // If user doesn't have access to requested department, redirect to their primary department
      const primaryDepartmentRoute = getPrimaryDepartmentRedirect(data.departments);
      toast.warning(`You don't have access to ${requestedDepartment}. Redirecting to your authorized department.`);
      setTimeout(() => navigate(primaryDepartmentRoute), 2000);
      return;
    }

    // If department validation passes, proceed with normal login
    const redirectRoute = requestedDepartment ? 
      getDepartmentRoute(requestedDepartment) : 
      getPrimaryDepartmentRedirect(data.departments);

    toast.success(`Login successful! Redirecting to ${requestedDepartment || 'your department'}...`);
    setTimeout(() => navigate(redirectRoute), 1500);

  } catch (error) {
    throw error;
  }
};

// Helper function to get route from department name
const getDepartmentRoute = (departmentName) => {
  const routes = {
    'Front Office': '/front-office',
    'Accounts': '/accounts',
    'Clinical': '/clinical',
    'Laboratory': '/lab',
    'Radiology': '/radiology',
    'Phlebotomy': '/phlebotomy',
    'Agent': '/agent',
    'Admin': '/admin'
  };
  
  return routes[departmentName] || '/front-office';
};