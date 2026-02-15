import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaBuilding, 
  FaShieldAlt,
  FaBirthdayCake,
  FaUserCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import img from '../../assets/undraw_medical-care_7m9g.svg'

// Department definitions (same as AllUsers)
const DEPARTMENTS = {
  'Agent': { 
    priority: 1, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🎧'
  },
  'Front Office': { 
    priority: 2, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🏢'
  },
  'Phlebotomy': { 
    priority: 3, 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '💉'
  },
  'Laboratory': { 
    priority: 4, 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🔬'
  },
  'Radiology': { 
    priority: 5, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📸'
  },
  'Clinical': { 
    priority: 6, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '👩‍⚕️'
  },
  'Accounts': { 
    priority: 7, 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '💰'
  },
  'Admin': { 
    priority: 8, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '⚙️'
  }
};

const ROLE_HIERARCHY = {
  'Super Admin': 10,
  'Admin': 8,
  'Manager': 6,
  'Supervisor': 4,
  'User': 2,
  'Guest': 1
};

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    role: 'User',
    status: 'Active',
    departments: [],
    permissions: {},
    terms: false
  });

  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => {
      const newState = {
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      };

      // Special handling for Guest role - automatically assign Agent department only
      if (name === 'role' && value === 'Guest') {
        newState.departments = ['Agent'];
      }

      return newState;
    });

    if (name === 'password') {
      evaluatePasswordStrength(value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.terms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    // Prepare the data to send (excluding confirmPassword and terms)
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      age: formData.age || undefined,
      role: formData.role || 'User',
      status: formData.status || 'Active',
      departments: formData.departments || [],
      permissions: formData.permissions || {}
    };

    try {
      const response = await axios.post('https://ghck.co.ke/api/user/register', dataToSend);
      toast.success('Registration successful! User account created with department access.');
      navigate('/admin', { state: { fromSignup: true, newUser: response.data } });
    } catch (error) {
      const backendMessage = error.response?.data?.message || 'Error registering user';
      setError(backendMessage); // Show more specific backend error
      toast.error(backendMessage);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Side - Form */}
      <div className="w-3/5 p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              Create Account
            </h2>
            <p className="mt-2 text-gray-600">
              Join our community and start your journey
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* Full Name Input */}
              <div className="relative group">
                <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                  style={{ textIndent: '0px', paddingLeft: '4rem' }}
                  required
                />
                <label className={`absolute left-16 transition-all duration-300 pointer-events-none ${
                  formData.name 
                    ? 'top-1 text-xs text-blue-500 font-medium' 
                    : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                }`}>
                  Full Name
                </label>
              </div>

              {/* Email Input */}
              <div className="relative group">
                <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                  style={{ textIndent: '0px', paddingLeft: '4rem' }}
                  required
                />
                <label className={`absolute left-16 transition-all duration-300 pointer-events-none ${
                  formData.email 
                    ? 'top-1 text-xs text-blue-500 font-medium' 
                    : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                }`}>
                  Email Address
                </label>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-16 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                  style={{ textIndent: '0px', paddingLeft: '4rem' }}
                  required
                />
                <label className={`absolute left-16 transition-all duration-300 pointer-events-none ${
                  formData.password 
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
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 'Strong'
                          ? 'w-full bg-green-500'
                          : passwordStrength === 'Medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className={`text-sm ${
                    passwordStrength === 'Strong'
                      ? 'text-green-500'
                      : passwordStrength === 'Medium'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
              )}

              {/* Confirm Password Input */}
              <div className="relative group">
                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-16 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                  style={{ textIndent: '0px', paddingLeft: '4rem' }}
                  required
                />
                <label className={`absolute left-16 transition-all duration-300 pointer-events-none ${
                  formData.confirmPassword 
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
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <FaBirthdayCake className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 peer bg-white"
                    style={{ textIndent: '0px', paddingLeft: '4rem' }}
                  />
                  <label className={`absolute left-16 transition-all duration-300 pointer-events-none ${
                    formData.age 
                      ? 'top-1 text-xs text-blue-500 font-medium' 
                      : 'top-1/2 -translate-y-1/2 text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:font-medium'
                  }`}>
                    Age (Optional)
                  </label>
                </div>
                <div className="relative group">
                  <FaShieldAlt className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 z-10" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-300 appearance-none bg-white"
                    style={{ paddingLeft: '4rem' }}
                  >
                    {Object.keys(ROLE_HIERARCHY).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <label className="absolute left-16 top-1 text-xs text-blue-500 font-medium pointer-events-none">
                    User Role
                  </label>
                </div>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="text-sm text-red-600 flex items-center">
                  <span className="mr-2">❌</span>
                  Passwords do not match
                </div>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                <div className="text-sm text-green-600 flex items-center">
                  <span className="mr-2">✅</span>
                  Passwords match
                </div>
              )}

              {/* Department Selection */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaBuilding className="mr-2 text-blue-500" /> Department Access
                </h3>
                
                {formData.role === 'Guest' ? (
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
                    <p className="text-sm text-gray-600 mb-4">
                      Select departments you need access to based on your role level
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {Object.entries(DEPARTMENTS).map(([dept, config]) => {
                        const isAssigned = (formData.departments || []).includes(dept);
                        const userRoleLevel = ROLE_HIERARCHY[formData.role] || 1;
                        const canAccess = userRoleLevel >= config.priority;
                        
                        return (
                          <div key={dept} className="relative">
                            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isAssigned 
                                ? `${config.color} border-current shadow-sm` 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            } ${!canAccess ? 'opacity-40 cursor-not-allowed' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => {
                                  const currentDepts = formData.departments || [];
                                  const updatedDepts = currentDepts.includes(dept)
                                    ? currentDepts.filter(d => d !== dept)
                                    : [...currentDepts, dept];
                                  setFormData(prev => ({ ...prev, departments: updatedDepts }));
                                }}
                                disabled={!canAccess}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex items-center flex-1">
                                <span className="text-xl mr-3">{config.icon}</span>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{dept}</div>
                                  <div className="text-xs opacity-75">Priority Level: {config.priority}</div>
                                </div>
                              </div>
                            </label>
                            {!canAccess && (
                              <div className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                Role Level Too Low
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-sm text-blue-800">
                    <FaUserCog className="mr-2" />
                    <span className="font-medium">Current Role:</span>
                    <span className="ml-1 font-semibold">{formData.role}</span>
                    <span className="mx-2">•</span>
                    <span>Level: {ROLE_HIERARCHY[formData.role] || 1}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {formData.role === 'Guest' 
                      ? 'Guest users have restricted access to Agent department only'
                      : 'You can access departments with priority level ≤ your role level'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label className="ml-3 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                  Terms and Conditions
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-medium text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <FaUser className="mr-2" />
              Create Account
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="w-2/5 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="relative">
            <img
              src={img}
              alt="Sign up illustration"
              className="relative"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;