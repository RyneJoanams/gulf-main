import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import { 
  FaEdit, 
  FaTrash, 
  FaUserPlus, 
  FaSearch, 
  FaFilter,
  FaFileExcel,
  FaPrint,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaShieldAlt,
  FaBuilding,
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaBirthdayCake
} from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';

// Department definitions with priority levels
const DEPARTMENTS = {
  'Agent': { 
    priority: 1, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🎧'
  },
  'Front Office': { 
    priority: 2, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🏪'
  },
  'Phlebotomy': { 
    priority: 3, 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🩸'
  },
  'Laboratory': { 
    priority: 4, 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🔬'
  },
  'Radiology': { 
    priority: 5, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📱'
  },
  'Clinical': { 
    priority: 6, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '👩‍⚕️'
  },
  'Accounts': { 
    priority: 7, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '💰'
  },
  'Admin': { 
    priority: 8, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '⚙️'
  }
};

// Role hierarchy for access control
const ROLE_HIERARCHY = {
  'Super Admin': 10,
  'Admin': 8,
  'Manager': 6,
  'Supervisor': 4,
  'User': 2,
  'Guest': 1
};

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmNewPasswordVisible, setConfirmNewPasswordVisible] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState('');
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: '',
    age: '', 
    status: 'Active', 
    role: 'User',
    departments: [],
    permissions: {}
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user/all');
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error.response || error.message);
        setError(error.response?.data?.message || error.message || 'Unknown error');
        toast.error(`Error fetching users: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search, status, department, and role
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      const matchesDepartment = departmentFilter === 'All' || 
                               (user.departments && user.departments.includes(departmentFilter));
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, departmentFilter, roleFilter]);

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/user/delete/${id}`);
      setUsers(users.filter(user => user._id !== id));
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error.response || error.message);
      toast.error(`Error deleting user: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    }
  };

  const confirmDelete = (user) => {
    confirmAlert({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
      buttons: [
        {
          label: 'Yes, Delete',
          onClick: () => handleDeleteUser(user._id),
          className: 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
        },
        {
          label: 'Cancel',
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2'
        }
      ]
    });
  };

  const handleEditUser = (user) => {
    setEditingUser({ 
      ...user, 
      departments: user.departments || [],
      permissions: user.permissions || {}
    });
    setShowEditModal(true);
  };

  const handleManagePermissions = (user) => {
    setPermissionsUser({ 
      ...user, 
      departments: user.departments || [],
      permissions: user.permissions || {}
    });
    setShowPermissionsModal(true);
  };

  const handleDepartmentToggle = (department, isEditing = false) => {
    const targetUser = isEditing ? editingUser : permissionsUser;
    const setTargetUser = isEditing ? setEditingUser : setPermissionsUser;
    
    // Add null check to prevent errors
    if (!targetUser) {
      console.warn('Target user is null, cannot toggle department');
      return;
    }
    
    setTargetUser(prev => {
      const currentDepts = prev.departments || [];
      const updatedDepts = currentDepts.includes(department)
        ? currentDepts.filter(d => d !== department)
        : [...currentDepts, department];
      
      return {
        ...prev,
        departments: updatedDepts
      };
    });
  };

  const handlePermissionChange = (department, permission, value) => {
    setPermissionsUser(prev => {
      if (!prev) {
        console.warn('Permissions user is null, cannot change permission');
        return prev;
      }
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [department]: {
            ...prev.permissions?.[department],
            [permission]: value
          }
        }
      };
    });
  };

  const calculateUserAccess = (user) => {
    const userRoleLevel = ROLE_HIERARCHY[user.role] || 1;
    const accessibleDepts = (user.departments || []).filter(dept => {
      const deptPriority = DEPARTMENTS[dept]?.priority || 1;
      return userRoleLevel >= deptPriority;
    });
    return accessibleDepts;
  };

  const handleSaveEdit = async () => {
    try {
      const updatedUser = {
        ...editingUser,
        departments: editingUser.departments || [],
        permissions: editingUser.permissions || {}
      };
      
      await axios.put(`http://localhost:5000/api/user/update/${editingUser._id}`, updatedUser);
      setUsers(users.map(user => user._id === editingUser._id ? updatedUser : user));
      setShowEditModal(false);
      setEditingUser(null);
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error.response || error.message);
      toast.error('Error updating user');
    }
  };

  const handleSavePermissions = async () => {
    try {
      const updatedUser = {
        ...permissionsUser,
        departments: permissionsUser.departments || [],
        permissions: permissionsUser.permissions || {}
      };
      
      await axios.put(`http://localhost:5000/api/user/update/${permissionsUser._id}`, updatedUser);
      setUsers(users.map(user => user._id === permissionsUser._id ? updatedUser : user));
      setShowPermissionsModal(false);
      setPermissionsUser(null);
      toast.success('User permissions updated successfully!');
    } catch (error) {
      console.error('Error updating permissions:', error.response || error.message);
      toast.error('Error updating permissions');
    }
  };

  const handlePasswordReset = (user) => {
    setPasswordResetUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordStrength('');
    setNewPasswordVisible(false);
    setConfirmNewPasswordVisible(false);
    setShowPasswordResetModal(true);
  };

  const evaluateNewPasswordStrength = (password) => {
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      setNewPasswordStrength('Strong');
    } else if (password.length >= 6 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setNewPasswordStrength('Medium');
    } else if (password.length >= 4) {
      setNewPasswordStrength('Weak');
    } else {
      setNewPasswordStrength('Too Short');
    }
  };

  const handleSavePasswordReset = async () => {
    try {
      // Validation
      if (!newPassword) {
        toast.error('New password is required');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      await axios.put(`http://localhost:5000/api/user/reset-password/${passwordResetUser._id}`, {
        newPassword: newPassword
      });
      
      setShowPasswordResetModal(false);
      setPasswordResetUser(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setNewPasswordStrength('');
      setNewPasswordVisible(false);
      setConfirmNewPasswordVisible(false);
      toast.success('Password reset successfully!');
    } catch (error) {
      console.error('Error resetting password:', error.response || error.message);
      const errorMessage = error.response?.data?.message || 'Error resetting password';
      toast.error(errorMessage);
    }
  };

  const evaluatePasswordStrength = (password) => {
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      setPasswordStrength('Strong');
    } else if (password.length >= 6 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordStrength('Medium');
    } else if (password.length >= 4) {
      setPasswordStrength('Weak');
    } else {
      setPasswordStrength('Too Short');
    }
  };

  const handleAddUser = async () => {
    try {
      // Validation
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error('Name, email, and password are required');
        return;
      }

      if (newUser.password !== newUser.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newUser.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      const newUserData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        age: newUser.age || undefined,
        role: newUser.role || 'User',
        status: newUser.status || 'Active',
        departments: newUser.departments || [],
        permissions: newUser.permissions || {}
      };
      
      const response = await axios.post('http://localhost:5000/api/user/register', newUserData);
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setNewUser({ 
        name: '', 
        email: '', 
        password: '',
        confirmPassword: '',
        age: '', 
        status: 'Active', 
        role: 'User',
        departments: [],
        permissions: {}
      });
      setPasswordStrength('');
      setPasswordVisible(false);
      setConfirmPasswordVisible(false);
      toast.success('User added successfully!');
    } catch (error) {
      console.error('Error adding user:', error.response || error.message);
      const errorMessage = error.response?.data?.message || 'Error adding user';
      toast.error(errorMessage);
    }
  };

  const handleAddUser_old = async () => {
    try {
      const newUserData = {
        ...newUser,
        departments: newUser.departments || [],
        permissions: newUser.permissions || {}
      };
      
      const response = await axios.post('http://localhost:5000/api/user/register', newUserData);
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setNewUser({ 
        name: '', 
        email: '', 
        age: '', 
        status: 'Active', 
        role: 'User',
        departments: [],
        permissions: {}
      });
      toast.success('User added successfully!');
    } catch (error) {
      console.error('Error adding user:', error.response || error.message);
      toast.error('Error adding user');
    }
  };

  const exportToExcel = () => {
    const sheetData = filteredUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Age: user.age,
      Status: user.status,
      Role: user.role || 'User',
      Departments: (user.departments || []).join(', ') || 'None',
      'Accessible Departments': calculateUserAccess(user).join(', ') || 'None',
      'Created Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `Users_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Users data exported successfully!');
  };

  const handlePrintUsers = () => {
    const printContent = `
      <html>
        <head>
          <title>Users Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #1976d2; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-bottom: 30px; padding: 15px; background-color: #f0f7ff; border-radius: 5px; }
            .status-active { color: #4caf50; font-weight: bold; }
            .status-inactive { color: #f44336; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Gulf Healthcare Kenya Ltd - Users Report</h1>
          <div class="summary">
            <p><strong>Total Users:</strong> ${filteredUsers.length}</p>
            <p><strong>Active Users:</strong> ${filteredUsers.filter(u => u.status === 'Active').length}</p>
            <p><strong>Inactive Users:</strong> ${filteredUsers.filter(u => u.status === 'Inactive').length}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>Status</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(user => `
                <tr>
                  <td>${user.name}</td>
                  <td>${user.email}</td>
                  <td>${user.age}</td>
                  <td class="status-${user.status.toLowerCase()}">${user.status}</td>
                  <td>${user.role || 'User'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="text-center text-lg">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ToastContainer />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">User Management System</h1>

        {/* Controls Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaFilter className="mr-2" /> Filters
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaUserPlus className="mr-2" /> Add User
              </button>
              <button
                onClick={exportToExcel}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaFileExcel className="mr-2" /> Export
              </button>
              <button
                onClick={handlePrintUsers}
                className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
              >
                <FaPrint className="mr-2" /> Print
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-100 p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Users</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Filter</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Departments</option>
                  {Object.keys(DEPARTMENTS).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Filter</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Roles</option>
                  {Object.keys(ROLE_HIERARCHY).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setDepartmentFilter('All');
                    setRoleFilter('All');
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg w-full transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-100 p-4 rounded text-center">
              <FaUsers className="mx-auto text-2xl text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-green-100 p-4 rounded text-center">
              <FaUserCheck className="mx-auto text-2xl text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {filteredUsers.filter(u => u.status === 'Active').length}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="bg-red-100 p-4 rounded text-center">
              <FaUserTimes className="mx-auto text-2xl text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {filteredUsers.filter(u => u.status === 'Inactive').length}
              </div>
              <div className="text-sm text-gray-600">Inactive Users</div>
            </div>
            <div className="bg-purple-100 p-4 rounded text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((filteredUsers.filter(u => u.status === 'Active').length / filteredUsers.length) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Active Rate</div>
            </div>
          </div>
        </div>

        {/* User Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Access</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-gray-500">{user.email}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'Manager' ? 'bg-orange-100 text-orange-800' :
                        user.role === 'Supervisor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {calculateUserAccess(user).length > 0 ? (
                          calculateUserAccess(user).map(dept => (
                            <span
                              key={dept}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${DEPARTMENTS[dept]?.color || 'bg-gray-100 text-gray-800'}`}
                              title={`Priority Level: ${DEPARTMENTS[dept]?.priority || 'N/A'}`}
                            >
                              <span className="mr-1">{DEPARTMENTS[dept]?.icon}</span>
                              {dept}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No access</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManagePermissions(user)}
                          className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 p-2 rounded transition-colors duration-200"
                          title="Manage Department Access"
                        >
                          <FaShieldAlt />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors duration-200"
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handlePasswordReset(user)}
                          className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 p-2 rounded transition-colors duration-200"
                          title="Reset Password"
                        >
                          <FaKey />
                        </button>
                        <button
                          onClick={() => confirmDelete(user)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors duration-200"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaEdit className="mr-2" /> Edit User
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editingUser.name || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={editingUser.role || 'User'}
                      onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(ROLE_HIERARCHY).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editingUser.status || 'Active'}
                      onChange={(e) => setEditingUser(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                {/* Department Access Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaBuilding className="mr-2" /> Department Access
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(DEPARTMENTS).map(([dept, config]) => {
                      const isAssigned = (editingUser.departments || []).includes(dept);
                      const userRoleLevel = ROLE_HIERARCHY[editingUser.role] || 1;
                      const canAccess = userRoleLevel >= config.priority;
                      
                      return (
                        <div key={dept} className="relative">
                          <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                            isAssigned 
                              ? `${config.color} border-current` 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          } ${!canAccess ? 'opacity-50' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleDepartmentToggle(dept, true)}
                              disabled={!canAccess}
                              className="mr-3"
                            />
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{config.icon}</span>
                              <div>
                                <div className="font-medium text-sm">{dept}</div>
                                <div className="text-xs opacity-75">Priority: {config.priority}</div>
                              </div>
                            </div>
                          </label>
                          {!canAccess && (
                            <div className="absolute top-1 right-1 text-xs bg-red-100 text-red-600 px-1 rounded">
                              Role too low
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <FaKey className="inline mr-1" />
                    User role level: {ROLE_HIERARCHY[editingUser.role] || 1} 
                    • Can access departments with priority ≤ role level
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Department Permissions Management Modal */}
        {showPermissionsModal && permissionsUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaShieldAlt className="mr-2" /> Manage Department Permissions - {permissionsUser.name}
              </h2>
              
              {/* User Info Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Role:</span>
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                      permissionsUser.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                      permissionsUser.role === 'Admin' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {permissionsUser.role}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Role Level:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {ROLE_HIERARCHY[permissionsUser.role] || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Current Access:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {calculateUserAccess(permissionsUser).length} departments
                    </span>
                  </div>
                </div>
              </div>

              {/* Department Access Grid */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaBuilding className="mr-2" /> Department Access Control
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(DEPARTMENTS).map(([dept, config]) => {
                    const isAssigned = (permissionsUser.departments || []).includes(dept);
                    const userRoleLevel = ROLE_HIERARCHY[permissionsUser.role] || 1;
                    const canAccess = userRoleLevel >= config.priority;
                    const permissions = permissionsUser.permissions?.[dept] || {};
                    
                    return (
                      <div key={dept} className={`border rounded-lg p-4 ${
                        isAssigned ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleDepartmentToggle(dept)}
                              disabled={!canAccess}
                              className="mr-3 h-4 w-4"
                            />
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{config.icon}</span>
                              <div>
                                <div className="font-semibold text-sm">{dept}</div>
                                <div className="text-xs text-gray-500">Priority: {config.priority}</div>
                              </div>
                            </div>
                          </label>
                          {!canAccess && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Role Level Too Low
                            </span>
                          )}
                        </div>
                        
                        {/* Permission Checkboxes */}
                        {isAssigned && canAccess && (
                          <div className="space-y-2 pl-7 border-t pt-3">
                            <div className="text-xs font-semibold text-gray-600 uppercase">Permissions</div>
                            <div className="grid grid-cols-2 gap-2">
                              {['read', 'write', 'delete', 'manage'].map(permission => (
                                <label key={permission} className="flex items-center text-sm">
                                  <input
                                    type="checkbox"
                                    checked={permissions[permission] || false}
                                    onChange={(e) => handlePermissionChange(dept, permission, e.target.checked)}
                                    className="mr-2 h-3 w-3"
                                  />
                                  <span className="capitalize">{permission}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Access Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Access Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Assigned Departments:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(permissionsUser.departments || []).map(dept => (
                          <span key={dept} className={`px-2 py-1 rounded-full text-xs ${DEPARTMENTS[dept]?.color}`}>
                            {DEPARTMENTS[dept]?.icon} {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Accessible Departments:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {calculateUserAccess(permissionsUser).map(dept => (
                          <span key={dept} className={`px-2 py-1 rounded-full text-xs ${DEPARTMENTS[dept]?.color}`}>
                            {DEPARTMENTS[dept]?.icon} {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Save Permissions
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaUserPlus className="mr-2" /> Add New User
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <FaUserPlus className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                      style={{ textIndent: '0px' }}
                      required
                    />
                    <label className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                      newUser.name 
                        ? 'top-1 text-xs text-blue-500 font-medium' 
                        : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                    }`}>
                      Full Name
                    </label>
                  </div>
                  <div className="relative group">
                    <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                      style={{ textIndent: '0px' }}
                      required
                    />
                    <label className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                      newUser.email 
                        ? 'top-1 text-xs text-blue-500 font-medium' 
                        : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                    }`}>
                      Email Address
                    </label>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => {
                        setNewUser(prev => ({ ...prev, password: e.target.value }));
                        evaluatePasswordStrength(e.target.value);
                      }}
                      className="w-full pl-14 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                      style={{ textIndent: '0px' }}
                      required
                    />
                    <label className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                      newUser.password 
                        ? 'top-1 text-xs text-blue-500 font-medium' 
                        : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                    }`}>
                      Password
                    </label>
                    <button
                      type="button"
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 z-10"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                    </button>
                    {newUser.password && (
                      <div className="text-xs mt-2">
                        <span className={`font-medium ${
                          passwordStrength === 'Strong' 
                            ? 'text-green-600' 
                            : passwordStrength === 'Medium' 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                        }`}>
                          {passwordStrength}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative group">
                    <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-14 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                      style={{ textIndent: '0px' }}
                      required
                    />
                    <label className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                      newUser.confirmPassword 
                        ? 'top-1 text-xs text-blue-500 font-medium' 
                        : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                    }`}>
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 z-10"
                      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    >
                      {confirmPasswordVisible ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                    </button>
                    {newUser.confirmPassword && newUser.password !== newUser.confirmPassword && (
                      <div className="text-xs mt-2 text-red-600 flex items-center">
                        <span className="mr-1">❌</span>
                        Passwords do not match
                      </div>
                    )}
                    {newUser.confirmPassword && newUser.password === newUser.confirmPassword && newUser.password && (
                      <div className="text-xs mt-2 text-green-600 flex items-center">
                        <span className="mr-1">✅</span>
                        Passwords match
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative group">
                    <FaBirthdayCake className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type="number"
                      value={newUser.age}
                      onChange={(e) => setNewUser(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                      style={{ textIndent: '0px' }}
                    />
                    <label className={`absolute left-14 transition-all duration-300 pointer-events-none ${
                      newUser.age 
                        ? 'top-1 text-xs text-blue-500 font-medium' 
                        : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                    }`}>
                      Age (Optional)
                    </label>
                  </div>
                  <div className="relative group">
                    <FaShieldAlt className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <select
                      value={newUser.role}
                      onChange={(e) => {
                        const roleValue = e.target.value;
                        setNewUser(prev => ({
                          ...prev, 
                          role: roleValue,
                          departments: roleValue === 'Guest' ? ['Agent'] : prev.departments
                        }));
                      }}
                      className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 appearance-none bg-white"
                    >
                      {Object.keys(ROLE_HIERARCHY).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <label className="absolute left-14 top-1 text-xs text-blue-500 font-medium pointer-events-none">
                      User Role
                    </label>
                  </div>
                  <div className="relative group">
                    <FaUserCheck className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 appearance-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <label className="absolute left-14 top-1 text-xs text-blue-500 font-medium pointer-events-none">
                      Status
                    </label>
                  </div>
                </div>

                {/* Department Selection */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaBuilding className="mr-2" /> Department Access
                  </h3>
                  
                  {newUser.role === 'Guest' ? (
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center text-indigo-800 mb-2">
                        <span className="text-xl mr-3">🎧</span>
                        <span className="font-medium">Guest Access: Agent Department Only</span>
                      </div>
                      <p className="text-sm text-indigo-600">
                        Guest users are automatically assigned to the Agent department and cannot access other departments.
                      </p>
                      <div className="mt-3 flex items-center text-sm text-indigo-700">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        Agent Department - Active
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(DEPARTMENTS).map(([dept, config]) => {
                          const isAssigned = (newUser.departments || []).includes(dept);
                          const userRoleLevel = ROLE_HIERARCHY[newUser.role] || 1;
                          const canAccess = userRoleLevel >= config.priority;
                          
                          return (
                            <div key={dept} className="relative">
                              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                                isAssigned 
                                  ? `${config.color} border-current` 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              } ${!canAccess ? 'opacity-50' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => {
                                    const currentDepts = newUser.departments || [];
                                    const updatedDepts = currentDepts.includes(dept)
                                      ? currentDepts.filter(d => d !== dept)
                                      : [...currentDepts, dept];
                                    setNewUser(prev => ({ ...prev, departments: updatedDepts }));
                                  }}
                                  disabled={!canAccess}
                                  className="mr-3"
                                />
                                <div className="flex items-center">
                                  <span className="text-lg mr-2">{config.icon}</span>
                                  <div>
                                    <div className="font-medium text-sm">{dept}</div>
                                    <div className="text-xs opacity-75">Priority: {config.priority}</div>
                                  </div>
                                </div>
                              </label>
                              {!canAccess && (
                                <div className="absolute top-1 right-1 text-xs bg-red-100 text-red-600 px-1 rounded">
                                  Role too low
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <FaKey className="inline mr-1" />
                    Selected role level: {ROLE_HIERARCHY[newUser.role] || 1} 
                    • {newUser.role === 'Guest' 
                        ? 'Guest users have restricted access to Agent department only'
                        : 'Can access departments with priority ≤ role level'
                      }
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ 
                      name: '', 
                      email: '', 
                      password: '',
                      confirmPassword: '',
                      age: '', 
                      status: 'Active', 
                      role: 'User',
                      departments: [],
                      permissions: {}
                    });
                    setPasswordStrength('');
                    setPasswordVisible(false);
                    setConfirmPasswordVisible(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                >
                  <FaUserPlus className="mr-2" />
                  Add User
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordResetModal && passwordResetUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaKey className="mr-2 text-orange-600" /> Reset Password
              </h2>
              <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>User:</strong> {passwordResetUser.name} ({passwordResetUser.email})
                </p>
              </div>
              
              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type={newPasswordVisible ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        evaluateNewPasswordStrength(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {newPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Password Strength:</span>
                        <span className={`font-medium ${
                          newPasswordStrength === 'Strong' ? 'text-green-600' :
                          newPasswordStrength === 'Medium' ? 'text-yellow-600' :
                          newPasswordStrength === 'Weak' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {newPasswordStrength}
                        </span>
                      </div>
                      <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            newPasswordStrength === 'Strong' ? 'bg-green-500 w-full' :
                            newPasswordStrength === 'Medium' ? 'bg-yellow-500 w-3/4' :
                            newPasswordStrength === 'Weak' ? 'bg-orange-500 w-1/2' :
                            'bg-red-500 w-1/4'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                    <input
                      type={confirmNewPasswordVisible ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmNewPasswordVisible(!confirmNewPasswordVisible)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {confirmNewPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 6 characters long</li>
                    <li>For strong password: 8+ characters with uppercase, lowercase, number, and special character</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setPasswordResetUser(null);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setNewPasswordStrength('');
                    setNewPasswordVisible(false);
                    setConfirmNewPasswordVisible(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePasswordReset}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center"
                  disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                >
                  <FaKey className="mr-2" />
                  Reset Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AllUsers;
