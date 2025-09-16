import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Button, MenuItem, CircularProgress, Typography, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Tooltip, Fade, Grow, IconButton, InputAdornment, Card, CardContent, Box, Avatar, Badge, Collapse
} from '@mui/material';
import Webcam from 'react-webcam';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { Country } from 'country-state-city';
import { getCountryCallingCode } from 'country-flag-icons';
import * as flags from 'country-flag-icons/react/3x2';
import axios from 'axios';
import TopBar from '../../components/TopBar'
import Footer from '../../components/Footer';
import { QRCodeCanvas } from 'qrcode.react';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  FaPrint, 
  FaFileExcel, 
  FaUser, 
  FaIdCard, 
  FaGlobe, 
  FaBriefcase, 
  FaUserTie, 
  FaCamera, 
  FaUpload, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaCalendarAlt,
  FaPlus,
  FaUsers,
  FaChartLine,
  FaStethoscope,
  FaTimes,
  FaCheck,
  FaSpinner
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

// Helper function to get country flag component
const getCountryFlag = (countryCode) => {
  if (!countryCode) return null;
  
  try {
    const FlagComponent = flags[countryCode.toUpperCase()];
    if (FlagComponent) {
      return <FlagComponent style={{ width: '20px', height: '15px' }} />;
    }
  } catch (error) {
    console.warn(`Flag not found for country code: ${countryCode}`);
  }
  
  // Fallback to Unicode emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  
  return String.fromCodePoint(...codePoints);
};

// Custom CSS animations
const customStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }

  .animate-slideIn {
    animation: slideIn 0.8s ease-out;
  }

  .animate-pulse-hover:hover {
    animation: pulse 0.3s ease-in-out;
  }

  .glass-effect {
    backdrop-filter: blur(15px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .gradient-border {
    background: linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8);
    padding: 2px;
    border-radius: 16px;
  }

  .gradient-border-inner {
    background: white;
    border-radius: 14px;
    padding: 24px;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const medicalTypes = ['MAURITIUS', 'SM-VDRL', 'MEDICAL', 'FM', 'NORMAL'];
const countryOptions = Country.getAllCountries().map((country) => ({
  value: country.isoCode,
  label: country.name,
  flag: getCountryFlag(country.isoCode),
}));

const sexOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

// Enhanced custom styles for Select component
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '56px',
    background: state.isFocused ? '#ffffff' : '#f8fafc',
    borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
    borderWidth: '2px',
    borderRadius: '12px',
    boxShadow: state.isFocused 
      ? '0 0 0 3px rgba(37, 99, 235, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: state.isFocused ? '#2563eb' : '#3b82f6',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected 
      ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
      : state.isFocused 
        ? '#f1f5f9' 
        : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    padding: '12px 16px',
    borderRadius: state.isFocused ? '8px' : '0px',
    margin: state.isFocused ? '2px' : '0px',
    transition: 'all 0.2s ease-in-out',
    fontWeight: state.isSelected ? '600' : '400',
    '&:active': {
      background: state.isSelected ? '#2563eb' : '#e2e8f0',
    },
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    transition: 'transform 0.3s ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    color: state.isFocused ? '#2563eb' : '#64748b',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontWeight: '400',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1e293b',
    fontWeight: '500',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    position: 'absolute',
    top: '100%',
    marginTop: '4px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  }),
  menuList: (base) => ({
    ...base,
    padding: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
    background: 'white',
  }),
};

const FrontOffice = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const [selectedMedicalType, setSelectedMedicalType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set default dates to today
  const today = new Date();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [formValues, setFormValues] = useState({
    _id: '',
    name: '',
    passportNumber: '',
    issuingCountry: '',
    occupation: '',
    sex: '',
    height: '',
    weight: '',
    age: '',
    photo: null,
    medicalType: '',
    agent: '',
  });

  const webcamRef = useRef(null);

  useEffect(() => {
    const fetchAllPatients = async () => {
      try {
        console.log('Fetching patients...');
        const response = await axios.get('http://localhost:5000/api/patient');
        console.log('Fetched patients response:', response.data);
        
        // Handle different response structures - backend returns array directly
        const patientsData = Array.isArray(response.data) ? response.data : (response.data.patients || []);
        console.log('Processed patients data:', patientsData);
        
        setPatients(patientsData);
        toast.success(`Loaded ${patientsData.length} patients`);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to fetch patients data.');
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchAllPatients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleMedicalTypeChange = (e) => {
    const { value } = e.target;
    const displayFields = getDisplayFields(value);
    
    // Clear fields that are not required for the new medical type
    const updatedFormValues = {
      ...formValues,
      medicalType: value,
    };

    if (!displayFields.showIssuingCountry) {
      updatedFormValues.issuingCountry = '';
    }
    if (!displayFields.showOccupation) {
      updatedFormValues.occupation = '';
    }
    // Agent field is now mandatory for all medical types, so we don't clear it

    setFormValues(updatedFormValues);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedPatientId(null);
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setFormValues({ ...formValues, photo: file });
          toast.success("Image captured successfully.");
          setShowWebcam(false);
        })
        .catch((error) => {
          console.error('Error capturing image:', error);
          toast.error('Failed to capture webcam image.');
        });
    }
  };

  const removeCapturedPhoto = () => {
    setFormValues({ ...formValues, photo: null });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; // Get the uploaded file
    if (file) {
      setFormValues({ ...formValues, photo: file }); // Save the file as a File object
    }
  };

  const renderPhotoInput = () => (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardContent className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <Typography variant="h6" className="text-gray-800 font-semibold mb-4 flex items-center">
          <FaCamera className="mr-2 text-blue-600" />
          Patient Photo
        </Typography>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FaUpload className="mr-2 text-blue-500" />
              Upload Photo
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-white hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group-hover:scale-105">
                <FaUpload className="mx-auto text-3xl text-blue-400 mb-2" />
                <p className="text-gray-600">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Button
              variant="outlined"
              onClick={() => setShowWebcam(!showWebcam)}
              className="w-full py-3 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-300 font-medium"
              startIcon={<FaCamera />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '16px',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                },
              }}
            >
              {showWebcam ? 'Hide Camera' : 'Take Live Picture'}
            </Button>
          </div>

          <Collapse in={showWebcam}>
            <div className="mt-6 space-y-4 bg-white rounded-xl p-4 shadow-inner">
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <Webcam 
                  ref={webcamRef} 
                  screenshotFormat="image/jpeg" 
                  className="w-full rounded-xl"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                  }}
                />
              </div>
              <Button 
                variant="contained" 
                onClick={captureImage}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl transition-all duration-300 font-medium"
                startIcon={<FaCamera />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '16px',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                  },
                }}
              >
                Capture Photo
              </Button>
            </div>
          </Collapse>

          {formValues.photo && (
            <Fade in={!!formValues.photo}>
              <Card className="mt-4 bg-white shadow-md rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <Typography variant="subtitle2" className="text-gray-700 mb-3 font-medium">
                    Preview
                  </Typography>
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={formValues.photo instanceof File ? URL.createObjectURL(formValues.photo) : formValues.photo}
                      alt="Patient Photo"
                      sx={{ width: 80, height: 80 }}
                      className="shadow-lg border-2 border-blue-200"
                    />
                    <div className="flex-1">
                      <Typography variant="body2" className="text-gray-600 mb-2">
                        Photo captured successfully
                      </Typography>
                      <Button
                        onClick={removeCapturedPhoto}
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<FaTimes />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Fade>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const resetForm = () => {
    setFormValues({
      _id: '',
      name: '',
      passportNumber: '',
      issuingCountry: '',
      occupation: '',
      sex: '',
      height: '',
      weight: '',
      age: '',
      photo: null,
      medicalType: '',
      agent: '',
    });
    setShowWebcam(false); // Reset webcam state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation checks
    const requiredFields = ['name', 'age', 'sex', 'passportNumber', 'medicalType', 'agent'];
    for (const field of requiredFields) {
      if (!formValues[field]) {
        toast.error(`${field === 'agent' ? 'Agent' : field} is required.`);
        return; // Prevent form submission if a required field is missing
      }
    }

    // Medical type-specific validation
    const displayFields = getDisplayFields(formValues.medicalType);
    
    if (displayFields.showIssuingCountry && !formValues.issuingCountry) {
      toast.error('Issuing Country is required for this medical type.');
      return;
    }
    
    if (displayFields.showOccupation && !formValues.occupation) {
      toast.error('Occupation is required for this medical type.');
      return;
    }
    
    if (displayFields.showAgent && !formValues.agent) {
      toast.error('Agent is required for this medical type.');
      return;
    }

    // FormData for file uploads
    const formData = new FormData();
    Object.keys(formValues).forEach((key) => {
      formData.append(key, formValues[key]);
    });

    try {
      await axios.post('http://localhost:5000/api/patient', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Patient submitted successfully');
      window.location.reload();
      resetForm(); // Reset form after successful submission
    } catch (error) {
      console.error('Error submitting form:', error.response?.data || error.message);
      toast.error('Failed to submit the form: ' + (error.response?.data?.message || error.message));
    }
  };

  const deletePatient = async (patientId) => {
    if (!selectedPatientId) {
      toast.error('No patient selected for deletion.');
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/patient/${selectedPatientId}`);
      toast.success('Patient deleted successfully');
      setPatients(patients.filter((p) => p._id !== selectedPatientId)); // Update the patient list
      handleDialogClose();
    } catch (error) {
      console.error('Error deleting patient:', error.response?.data || error.message);
      toast.error('Failed to delete the patient: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderFields = () => {
    const commonFields = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="name"
          label="Full Name"
          value={formValues.name}
          onChange={handleChange}
          fullWidth
          required
          variant="outlined"
          className="bg-white"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaUser className="text-blue-500" />
              </InputAdornment>
            ),
            className: "rounded-xl",
            style: { 
              fontSize: '16px',
              background: '#ffffff',
              borderRadius: '12px'
            }
          }}
          InputLabelProps={{
            style: { 
              color: '#475569',
              fontWeight: '500'
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '&:hover fieldset': {
                borderColor: '#3b82f6',
                borderWidth: '2px',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2563eb',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
              },
            },
          }}
        />
        
        <TextField
          name="age"
          label="Age"
          type="number"
          value={formValues.age}
          onChange={handleChange}
          fullWidth
          required
          variant="outlined"
          className="bg-white"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaCalendarAlt className="text-blue-500" />
              </InputAdornment>
            ),
            className: "rounded-xl",
            style: { 
              fontSize: '16px',
              background: '#ffffff',
              borderRadius: '12px'
            }
          }}
          InputLabelProps={{
            style: { 
              color: '#475569',
              fontWeight: '500'
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '&:hover fieldset': {
                borderColor: '#3b82f6',
                borderWidth: '2px',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2563eb',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
              },
            },
          }}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sex *
          </label>
          <Select
            options={sexOptions}
            value={sexOptions.find((option) => option.value === formValues.sex)}
            onChange={(selectedOption) => setFormValues({ ...formValues, sex: selectedOption.value })}
            placeholder="Select Sex"
            styles={customSelectStyles}
            className="rounded-xl"
            isSearchable={false}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>

        <TextField
          name="passportNumber"
          label="Passport Number"
          value={formValues.passportNumber}
          onChange={handleChange}
          fullWidth
          required
          variant="outlined"
          className="bg-white"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaIdCard className="text-blue-500" />
              </InputAdornment>
            ),
            className: "rounded-xl",
            style: { 
              fontSize: '16px',
              background: '#ffffff',
              borderRadius: '12px'
            }
          }}
          InputLabelProps={{
            style: { 
              color: '#475569',
              fontWeight: '500'
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '&:hover fieldset': {
                borderColor: '#3b82f6',
                borderWidth: '2px',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2563eb',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
              },
            },
          }}
        />
      </div>
    );

    switch (formValues.medicalType) {
      case 'MAURITIUS':
      case 'MEDICAL':
      case 'FM':
        return (
          <div className="space-y-6">
            {commonFields}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaGlobe className="mr-2 text-blue-500" />
                  Issuing Country *
                </label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find((option) => option.value === formValues.issuingCountry)}
                  onChange={(selectedOption) =>
                    setFormValues({ ...formValues, issuingCountry: selectedOption.value })
                  }
                  placeholder="Search and select issuing country"
                  styles={customSelectStyles}
                  className="rounded-xl"
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  formatOptionLabel={(option) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                        {React.isValidElement(option.flag) ? option.flag : option.flag}
                      </span>
                      <span>{option.label}</span>
                    </div>
                  )}
                />
              </div>
              
              <TextField
                name="occupation"
                label="Occupation"
                value={formValues.occupation}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                className="bg-white"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaBriefcase className="text-blue-500" />
                    </InputAdornment>
                  ),
                  className: "rounded-xl",
                  style: { 
                    fontSize: '16px',
                    background: '#ffffff',
                    borderRadius: '12px'
                  }
                }}
                InputLabelProps={{
                  style: { 
                    color: '#475569',
                    fontWeight: '500'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                      borderWidth: '2px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                      borderWidth: '2px',
                      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                    },
                  },
                }}
              />
            </div>
            
            <div className="md:col-span-2">
              <TextField
                name="agent"
                label="Agent"
                value={formValues.agent}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                className="bg-white"
                placeholder="Enter agent name or code"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUserTie className="text-blue-500" />
                    </InputAdornment>
                  ),
                  className: "rounded-xl",
                  style: { 
                    fontSize: '16px',
                    background: '#ffffff',
                    borderRadius: '12px'
                  }
                }}
                InputLabelProps={{
                  style: { 
                    color: '#475569',
                    fontWeight: '500'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                      borderWidth: '2px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                      borderWidth: '2px',
                      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                    },
                  },
                }}
              />
            </div>
            
            {renderPhotoInput()}
          </div>
        );
      case 'SM-VDRL':
      case 'NORMAL':
        return (
          <div className="space-y-6">
            {commonFields}
            
            <div className="md:col-span-2">
              <TextField
                name="agent"
                label="Agent"
                value={formValues.agent}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                className="bg-white"
                placeholder="Enter agent name or code"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUserTie className="text-blue-500" />
                    </InputAdornment>
                  ),
                  className: "rounded-xl",
                  style: { 
                    fontSize: '16px',
                    background: '#ffffff',
                    borderRadius: '12px'
                  }
                }}
                InputLabelProps={{
                  style: { 
                    color: '#475569',
                    fontWeight: '500'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#3b82f6',
                      borderWidth: '2px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                      borderWidth: '2px',
                      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                    },
                  },
                }}
              />
            </div>
            
            {renderPhotoInput()}
          </div>
        );
      default:
        return null;
    }
  };

  // Print Report Handler
  const printReport = async () => {
    if (filteredPatients.length === 0) {
      toast.error("No patients found to print");
      return;
    }

    // Convert logo to base64
    const getLogoBase64 = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting logo to base64:', error);
        return '';
      }
    };
    const logoBase64 = await getLogoBase64();

    const formatData = (data) => {
      return data || 'N/A';
    };

    const printStyles = `
      <style>
        @media print {
          @page { 
            margin: 0.5cm;
            size: A4;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .report-container {
            max-width: 100%;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            padding: 8px 0;
            border-bottom: 2px solid #2dd4bf;
            margin-bottom: 12px;
          }
          .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f766e;
            margin: 4px 0;
          }
          .patients-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            background-color: #f8fafc;
            table-layout: fixed;
          }
          .patients-table th,
          .patients-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-size: 10px;
            text-align: left;
            font-weight: 500;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.2;
          }
          .patients-table th {
            color: #0f766e;
            font-weight: bold;
            background-color: #e6fffa;
          }
          .patients-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .patient-photo {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            object-fit: cover;
          }
          .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 2px solid #2dd4bf;
            text-align: center;
            font-size: 10px;
            color: #64748b;
          }
          .summary-info {
            background-color: #e6fffa;
            padding: 8px;
            margin-bottom: 12px;
            border-radius: 4px;
            border-left: 3px solid #0f766e;
          }
        }
      </style>
    `;

    // Get display fields for print based on selected medical type
    const printDisplayFields = getDisplayFields(selectedMedicalType);
    
    const patientsTableRows = filteredPatients.map(patient => {
      let row = `
        <tr>
          <td style="width: 8%;">
            ${patient.photo ? `
              <img 
                src="data:image/jpeg;base64,${patient.photo}" 
                alt="Patient" 
                class="patient-photo">
            ` : '-'}
          </td>
          <td style="width: 15%;">${formatData(patient.name)}</td>
          <td style="width: 8%;">${formatData(patient.age)}</td>
          <td style="width: 8%;">${formatData(patient.sex)}</td>
          <td style="width: 15%;">${formatData(patient.passportNumber)}</td>`;
      
      if (printDisplayFields.showIssuingCountry) {
        row += `<td style="width: 12%;">${formatData(patient.issuingCountry)}</td>`;
      }
      if (printDisplayFields.showOccupation) {
        row += `<td style="width: 12%;">${formatData(patient.occupation)}</td>`;
      }
      if (printDisplayFields.showAgent) {
        row += `<td style="width: 10%;">${formatData(patient.agent)}</td>`;
      }
      
      row += `<td style="width: 12%;">${formatData(patient.medicalType)}</td>
        </tr>`;
      
      return row;
    }).join('');

    // Generate table headers based on medical type
    let tableHeaders = `
      <tr>
        <th style="width: 8%;">Photo</th>
        <th style="width: 15%;">Name</th>
        <th style="width: 8%;">Age</th>
        <th style="width: 8%;">Sex</th>
        <th style="width: 15%;">Passport Number</th>`;
    
    if (printDisplayFields.showIssuingCountry) {
      tableHeaders += `<th style="width: 12%;">Issuing Country</th>`;
    }
    if (printDisplayFields.showOccupation) {
      tableHeaders += `<th style="width: 12%;">Occupation</th>`;
    }
    if (printDisplayFields.showAgent) {
      tableHeaders += `<th style="width: 10%;">Agent</th>`;
    }
    
    tableHeaders += `<th style="width: 12%;">Medical Type</th>
      </tr>`;

    const printContent = `
      <html>
        <head>
          <title>Patients Report - Gulf Healthcare Kenya Ltd</title>
          ${printStyles}
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Gulf Healthcare Kenya Ltd" style="width: 200px; height: auto; display: block; margin: 0 auto 10px auto;" />` : ''}
              <h2 class="report-title" style="margin-top: 10px;">Patients Report</h2>
              <div class="summary-info">
                <strong>Report Summary:</strong> 
                Total Patients: ${patients.length} | 
                Filtered Results: ${filteredPatients.length} | 
                ${startDate && endDate ? `Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` : 'All Records'} |
                ${searchQuery ? `Search: "${searchQuery}"` : 'All Records'} |
                Medical Type: ${selectedMedicalType}
              </div>
            </div>

            <table class="patients-table">
              <thead>
                ${tableHeaders}
              </thead>
              <tbody>
                ${patientsTableRows}
              </tbody>
            </table>

            <div class="footer">
              <p><strong>Gulf Healthcare Kenya Ltd.</strong> • Computer-generated report</p>
              <p>This is an official patients report. For any queries, contact our front office department.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  // Export to Excel Handler
  const exportToExcel = () => {
    if (filteredPatients.length === 0) {
      toast.error("No patients found to export");
      return;
    }

    try {
      // Get display fields for export based on selected medical type
      const exportDisplayFields = getDisplayFields(selectedMedicalType);
      
      // Prepare data for Excel export
      const excelData = filteredPatients.map((patient, index) => {
        let patientData = {
          'S/N': index + 1,
          'Name': patient.name || 'N/A',
          'Age': patient.age || 'N/A',
          'Sex': patient.sex || 'N/A',
          'Passport Number': patient.passportNumber || 'N/A'
        };
        
        if (exportDisplayFields.showIssuingCountry) {
          patientData['Issuing Country'] = patient.issuingCountry || 'N/A';
        }
        if (exportDisplayFields.showOccupation) {
          patientData['Occupation'] = patient.occupation || 'N/A';
        }
        if (exportDisplayFields.showAgent) {
          patientData['Agent'] = patient.agent || 'N/A';
        }
        
        patientData['Medical Type'] = patient.medicalType || 'N/A';
        patientData['Date Created'] = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A';
        
        return patientData;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Add header information
      const headerInfo = [
        ['GULF HEALTHCARE KENYA LTD - Patients Report'],
        [''],
        [`Report Generated: ${new Date().toLocaleString()}`],
        [`Total Patients: ${patients.length}`],
        [`Filtered Results: ${filteredPatients.length}`],
        [`${startDate && endDate ? `Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` : 'All Records'}`],
        [`${searchQuery ? `Search Query: "${searchQuery}"` : 'All Records'}`],
        [`Medical Type Filter: ${selectedMedicalType}`],
        [''],
        ['Patient Details:'],
        []
      ];

      // Insert header information at the top
      XLSX.utils.sheet_add_aoa(worksheet, headerInfo, { origin: 'A1' });
      
      // Add patient data starting from row 12 (after header info)
      XLSX.utils.sheet_add_json(worksheet, excelData, { 
        origin: 'A12',
        skipHeader: false 
      });

      // Set column widths for better readability - dynamically based on displayed columns
      let columnWidths = [
        { wch: 5 },   // S/N
        { wch: 20 },  // Name
        { wch: 8 },   // Age
        { wch: 10 },  // Sex
        { wch: 18 }   // Passport Number
      ];
      
      if (exportDisplayFields.showIssuingCountry) {
        columnWidths.push({ wch: 18 }); // Issuing Country
      }
      if (exportDisplayFields.showOccupation) {
        columnWidths.push({ wch: 15 }); // Occupation
      }
      if (exportDisplayFields.showAgent) {
        columnWidths.push({ wch: 15 }); // Agent
      }
      
      columnWidths.push({ wch: 15 }); // Medical Type
      columnWidths.push({ wch: 12 }); // Date Created
      
      worksheet['!cols'] = columnWidths;

      // Style the header rows
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let row = 0; row < 11; row++) {
        for (let col = 0; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              font: { bold: true, color: { rgb: "0F766E" } },
              alignment: { horizontal: "center" }
            };
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients Report');

      // Generate filename with current date and filter info
      const dateStr = new Date().toISOString().split('T')[0];
      const filterInfo = searchQuery ? `_${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Gulf_Healthcare_Patients_Report_${dateStr}${filterInfo}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Excel file exported successfully: ${filename}`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file. Please try again.');
    }
  };

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    // Reset dates to today
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
  };

  // Helper function to determine which fields should be displayed based on medical type
  const getDisplayFields = (medicalType) => {
    switch (medicalType) {
      case 'MAURITIUS':
      case 'MEDICAL':
      case 'FM':
        return {
          showIssuingCountry: true,
          showOccupation: true,
          showAgent: true
        };
      case 'SM-VDRL':
      case 'NORMAL':
        return {
          showIssuingCountry: false,
          showOccupation: false,
          showAgent: true // Agent field is now mandatory for all types
        };
      default:
        return {
          showIssuingCountry: true,
          showOccupation: true,
          showAgent: true
        };
    }
  };

  // Helper function to get color for medical type chips
  const getMedicalTypeColor = (medicalType) => {
    switch (medicalType) {
      case 'MAURITIUS':
        return 'linear-gradient(135deg, #059669, #047857)';
      case 'SM-VDRL':
        return 'linear-gradient(135deg, #dc2626, #b91c1c)';
      case 'MEDICAL':
        return 'linear-gradient(135deg, #3b82f6, #2563eb)';
      case 'FM':
        return 'linear-gradient(135deg, #7c3aed, #6d28d9)';
      case 'NORMAL':
        return 'linear-gradient(135deg, #64748b, #475569)';
      default:
        return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  };

  // Get the display fields for the currently selected medical type
  const currentDisplayFields = getDisplayFields(selectedMedicalType);

  // Enhanced filter function that combines medical type, search query, and date range
  const filteredPatients = patients.filter(patient => {
    // Filter by medical type
    const medicalTypeMatch = selectedMedicalType === 'ALL' || patient.medicalType === selectedMedicalType;
    
    // Filter by search query (case-insensitive search in name or agent)
    const searchMatch = !searchQuery || searchQuery === '' || 
      (patient.name && patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (patient.agent && patient.agent.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by date range (default to today's records, or custom range if specified)
    let dateMatch = true;
    if (startDate && endDate) {
      const patientDate = new Date(patient.createdAt || patient.date);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateMatch = patientDate >= start && patientDate <= end;
    }
    
    return medicalTypeMatch && searchMatch && dateMatch;
  });

  // Get patient counts for each medical type (considering search and date filters)
  const getPatientCount = (medicalType) => {
    const baseFilter = patients.filter(patient => {
      const searchMatch = !searchQuery || searchQuery === '' || 
        (patient.name && patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (patient.agent && patient.agent.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let dateMatch = true;
      if (startDate && endDate) {
        const patientDate = new Date(patient.createdAt || patient.date);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch = patientDate >= start && patientDate <= end;
      }
      
      return searchMatch && dateMatch;
    });
    
    if (medicalType === 'ALL') return baseFilter.length;
    return baseFilter.filter(patient => patient.medicalType === medicalType).length;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-teal-900 shadow-lg min-h-screen p-6 border-r border-teal-600">
          {/* Search Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Search Patients</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by patient name or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-0 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-300 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-teal-200 text-sm mt-2">
                Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Date Range Filter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-teal-200 text-sm font-medium mb-2">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full p-2 border rounded-lg text-gray-900"
                  placeholderText="Select start date"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-teal-200 text-sm font-medium mb-2">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="w-full p-2 border rounded-lg text-gray-900"
                  placeholderText="Select end date"
                  isClearable
                />
              </div>
              {(startDate && endDate && (startDate.toDateString() !== new Date().toDateString() || endDate.toDateString() !== new Date().toDateString())) && (
                <button
                  onClick={() => {
                    const today = new Date();
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  className="w-full py-2 px-4 bg-teal-400 hover:bg-teal-300 text-teal-900 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Reset to Today
                </button>
              )}
            </div>
            <p className="text-teal-200 text-xs mt-2">
              {startDate && endDate 
                ? `Showing records from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
                : 'Showing all records'
              }
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Typography variant="h5" className="text-white font-bold flex items-center">
                <FaFilter className="mr-3" />
                Medical Types
              </Typography>
              <Chip 
                label={`${filteredPatients.length} results`}
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: '600',
                }}
              />
            </div>
            
            {/* All Patients Filter */}
            <Card 
              className={`mb-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedMedicalType === 'ALL' 
                  ? 'shadow-xl border-2 border-white' 
                  : 'shadow-md hover:shadow-lg'
              }`}
              onClick={() => setSelectedMedicalType('ALL')}
              sx={{
                background: selectedMedicalType === 'ALL'
                  ? 'linear-gradient(135deg, #ffffff, #f8fafc)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: selectedMedicalType === 'ALL' ? '#0d9488' : 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <FaUsers className={`text-sm ${selectedMedicalType === 'ALL' ? 'text-white' : 'text-white'}`} />
                    </Avatar>
                    <Typography 
                      variant="body1" 
                      className={`font-semibold ${
                        selectedMedicalType === 'ALL' ? 'text-gray-800' : 'text-white'
                      }`}
                    >
                      All Patients
                    </Typography>
                  </div>
                  <Chip
                    label={getPatientCount('ALL')}
                    size="small"
                    sx={{
                      background: selectedMedicalType === 'ALL' 
                        ? 'linear-gradient(135deg, #0d9488, #0f766e)' 
                        : 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: '700',
                      minWidth: '32px',
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Type Filters */}
            {medicalTypes.map((type, index) => (
              <Card
                key={type}
                className={`mb-3 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedMedicalType === type 
                    ? 'shadow-xl border-2 border-white' 
                    : 'shadow-md hover:shadow-lg'
                }`}
                onClick={() => setSelectedMedicalType(type)}
                sx={{
                  background: selectedMedicalType === type
                    ? 'linear-gradient(135deg, #ffffff, #f8fafc)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  animation: `fadeIn 0.3s ease-in-out ${index * 0.1}s`,
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          background: selectedMedicalType === type 
                            ? getMedicalTypeColor(type)
                            : 'rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <FaStethoscope className="text-sm text-white" />
                      </Avatar>
                      <Typography 
                        variant="body1" 
                        className={`font-semibold ${
                          selectedMedicalType === type ? 'text-gray-800' : 'text-white'
                        }`}
                      >
                        {type}
                      </Typography>
                    </div>
                    <Chip
                      label={getPatientCount(type)}
                      size="small"
                      sx={{
                        background: selectedMedicalType === type 
                          ? getMedicalTypeColor(type)
                          : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: '700',
                        minWidth: '32px',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Summary Stats */}
          <Card 
            className="mt-6 shadow-xl"
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))',
              backdropFilter: 'blur(15px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-white mb-4 flex items-center">
                <FaChartLine className="mr-3" />
                Summary Statistics
              </Typography>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-10">
                  <div className="flex items-center space-x-3">
                    <FaUsers className="text-white text-lg" />
                    <Typography variant="body2" className="text-white">
                      Total Patients
                    </Typography>
                  </div>
                  <Chip
                    label={patients.length}
                    sx={{
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-10">
                  <div className="flex items-center space-x-3">
                    <FaEye className="text-white text-lg" />
                    <Typography variant="body2" className="text-white">
                      Currently Viewing
                    </Typography>
                  </div>
                  <Chip
                    label={filteredPatients.length}
                    sx={{
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  />
                </div>
                
                {searchQuery && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-10 border-t border-white border-opacity-20">
                    <div className="flex items-center space-x-3">
                      <FaSearch className="text-white text-lg" />
                      <Typography variant="body2" className="text-white">
                        Search Results
                      </Typography>
                    </div>
                    <Chip
                      label={filteredPatients.length}
                      sx={{
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1 px-6 py-8">
          <Container maxWidth="xl" className="animate-fadeIn">
            <div className="gradient-border mb-12">
              <div className="gradient-border-inner">
                <div className="text-center mb-8">
                  <Typography 
                    variant="h3" 
                    className="text-gray-800 font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  >
                    Patient Registration
                  </Typography>
                  
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-4 rounded-full"></div>
                </div>
              
              <form onSubmit={handleSubmit} className="max-w-6xl mx-auto animate-slideIn">
                <Card className="shadow-2xl border-0 overflow-hidden">
                  <CardContent 
                    className="p-6 md:p-8"
                    sx={{
                      background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                    }}
                  >
                    <div className="space-y-8">
                  <TextField
                    select
                    name="medicalType"
                    label="Medical Type"
                    value={formValues.medicalType}
                    onChange={handleMedicalTypeChange}
                    fullWidth
                    required
                    variant="outlined"
                    className="bg-white"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaStethoscope className="text-blue-500" />
                        </InputAdornment>
                      ),
                      className: "rounded-xl",
                      style: { 
                        fontSize: '16px',
                        background: '#ffffff',
                        borderRadius: '12px'
                      }
                    }}
                    InputLabelProps={{
                      style: { 
                        color: '#475569',
                        fontWeight: '500'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                          borderWidth: '2px',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: '2px',
                          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                        },
                      },
                    }}
                  >
                    {medicalTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  {/* Enhanced requirements info based on medical type */}
                  {formValues.medicalType && (
                    <Fade in={!!formValues.medicalType}>
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-md">
                        <CardContent className="p-4">
                          <Typography variant="h6" className="text-blue-800 font-semibold mb-3 flex items-center">
                            <FaCheck className="mr-2 text-green-600" />
                            Required fields for {formValues.medicalType}
                          </Typography>
                          <div className="space-y-2 text-sm text-blue-700">
                            <div className="flex items-center">
                              <FaCheck className="mr-2 text-green-500 text-xs" />
                              <span>Name, Age, Sex, Passport Number</span>
                            </div>
                            {getDisplayFields(formValues.medicalType).showIssuingCountry && (
                              <div className="flex items-center">
                                <FaGlobe className="mr-2 text-blue-500 text-xs" />
                                <span>Issuing Country</span>
                              </div>
                            )}
                            {getDisplayFields(formValues.medicalType).showOccupation && (
                              <div className="flex items-center">
                                <FaBriefcase className="mr-2 text-blue-500 text-xs" />
                                <span>Occupation</span>
                              </div>
                            )}
                            {getDisplayFields(formValues.medicalType).showAgent && (
                              <div className="flex items-center">
                                <FaUserTie className="mr-2 text-blue-500 text-xs" />
                                <span>Agent</span>
                              </div>
                            )}
                            {!getDisplayFields(formValues.medicalType).showIssuingCountry && 
                             !getDisplayFields(formValues.medicalType).showOccupation &&
                             !getDisplayFields(formValues.medicalType).showAgent && (
                              <div className="flex items-center text-green-700">
                                <FaCheck className="mr-2 text-green-600 text-xs" />
                                <span className="font-medium">No additional fields required</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Fade>
                  )}
                  
                  {renderFields()}
                  
                  <Button
                    variant="contained"
                    type="submit"
                    size="large"
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 mt-8 font-semibold text-lg"
                    startIcon={<FaPlus />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '18px',
                      fontWeight: '600',
                      padding: '16px 24px',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 28px rgba(59, 130, 246, 0.3)',
                      },
                    }}
                  >
                    Submit Registration
                  </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
              </div>
            </div>
              
              <div className="mt-16 animate-fadeIn">
                <Card className="shadow-2xl border-0 overflow-hidden">
                  <CardContent 
                    className="p-8"
                    sx={{
                      background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                    }}
                  >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
                  <div>
                    <Typography 
                      variant="h4" 
                      className="text-gray-800 font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    >
                      Patients Directory
                    </Typography>
                    {searchQuery && (
                      <Typography variant="body1" className="text-gray-600 flex items-center">
                        <FaSearch className="mr-2 text-blue-500" />
                        Search: "{searchQuery}"
                      </Typography>
                    )}
                    {startDate && endDate && (
                      <Typography variant="body2" className="text-gray-500 flex items-center mt-1">
                        <FaCalendarAlt className="mr-2 text-green-500" />
                        {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                      </Typography>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Chip
                      icon={<FaUsers />}
                      label={`${filteredPatients.length} patients`}
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                {/* Enhanced no results message */}
                {filteredPatients.length === 0 && searchQuery && (
                  <Card className="text-center py-12 mb-8 shadow-lg">
                    <CardContent>
                      <FaSearch className="text-6xl text-gray-300 mb-4 mx-auto" />
                      <Typography variant="h6" className="text-gray-600 font-medium mb-2">
                        No patients found matching "{searchQuery}"
                      </Typography>
                      <Typography variant="body2" className="text-gray-500 mb-4 max-w-md mx-auto">
                        Try adjusting your search terms or clear the search to see all patients.
                      </Typography>
                      <Button
                        onClick={clearSearch}
                        variant="outlined"
                        startIcon={<FaTimes />}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          '&:hover': {
                            borderColor: '#2563eb',
                            background: '#eff6ff',
                          },
                        }}
                      >
                        Clear Search
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Dialog 
                  open={openDialog} 
                  onClose={handleDialogClose}
                  PaperProps={{
                    className: "rounded-lg"
                  }}
                >
                  <DialogTitle className="bg-gray-50 border-b">Confirm Deletion</DialogTitle>
                  <DialogContent className="py-6">
                    <p className="text-gray-700">
                      Are you sure you want to delete this patient? This action cannot be undone.
                    </p>
                  </DialogContent>
                  <DialogActions className="bg-gray-50 border-t p-4">
                    <Button 
                      onClick={handleDialogClose}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={deletePatient}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      variant="contained"
                    >
                      Confirm Delete
                    </Button>
                  </DialogActions>
                </Dialog>

                <div className="mb-6 flex flex-wrap justify-end gap-3">
                  <Tooltip title="Export data to Excel spreadsheet" arrow>
                    <Button
                      onClick={exportToExcel}
                      variant="contained"
                      startIcon={<FaFileExcel />}
                      sx={{
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: '600',
                        padding: '12px 24px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #047857, #065f46)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(5, 150, 105, 0.3)',
                        },
                      }}
                    >
                      Export to Excel
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Print patient report" arrow>
                    <Button
                      onClick={printReport}
                      variant="contained"
                      startIcon={<FaPrint />}
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: '600',
                        padding: '12px 24px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                        },
                      }}
                    >
                      Print Report
                    </Button>
                  </Tooltip>
                </div>

                <TableContainer 
                  component={Paper} 
                  className="rounded-2xl shadow-xl overflow-hidden border border-gray-100"
                  sx={{
                    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                  }}
                >
                  <Table className="min-w-full">
                    <TableHead>
                      <TableRow 
                        sx={{
                          background: 'linear-gradient(135deg, #1e293b, #334155)',
                          '& th': {
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            padding: '16px 12px',
                            borderBottom: 'none',
                          }
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <FaUser className="mr-2" />
                            Photo
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FaUser className="mr-2" />
                            Name
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-2" />
                            Age
                          </div>
                        </TableCell>
                        <TableCell>Sex</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FaIdCard className="mr-2" />
                            Passport Number
                          </div>
                        </TableCell>
                        {currentDisplayFields.showIssuingCountry && (
                          <TableCell>
                            <div className="flex items-center">
                              <FaGlobe className="mr-2" />
                              Issuing Country
                            </div>
                          </TableCell>
                        )}
                        {currentDisplayFields.showOccupation && (
                          <TableCell>
                            <div className="flex items-center">
                              <FaBriefcase className="mr-2" />
                              Occupation
                            </div>
                          </TableCell>
                        )}
                        {currentDisplayFields.showAgent && (
                          <TableCell>
                            <div className="flex items-center">
                              <FaUserTie className="mr-2" />
                              Agent
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center">
                            <FaStethoscope className="mr-2" />
                            Medical Type
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingPatients ? (
                        <TableRow>
                          <TableCell 
                            colSpan={6 + (currentDisplayFields.showIssuingCountry ? 1 : 0) + (currentDisplayFields.showOccupation ? 1 : 0) + (currentDisplayFields.showAgent ? 1 : 0)} 
                            className="text-center py-16"
                          >
                            <div className="flex flex-col items-center space-y-4">
                              <div className="relative">
                                <CircularProgress size={50} thickness={4} sx={{ color: '#3b82f6' }} />
                                <FaSpinner className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                              </div>
                              <Typography variant="body1" className="text-gray-600 font-medium">
                                Loading patients data...
                              </Typography>
                              <Typography variant="body2" className="text-gray-500">
                                Please wait while we fetch the latest information
                              </Typography>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPatients.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={6 + (currentDisplayFields.showIssuingCountry ? 1 : 0) + (currentDisplayFields.showOccupation ? 1 : 0) + (currentDisplayFields.showAgent ? 1 : 0)} 
                            className="text-center py-16"
                          >
                            <div className="flex flex-col items-center space-y-4">
                              <FaUsers className="text-6xl text-gray-300" />
                              <Typography variant="h6" className="text-gray-600 font-medium">
                                {patients.length === 0 
                                  ? "No patients found" 
                                  : "No patients match your criteria"
                                }
                              </Typography>
                              <Typography variant="body2" className="text-gray-500 max-w-md">
                                {patients.length === 0 
                                  ? "Start by adding a new patient using the registration form above." 
                                  : "Try adjusting your filters or search terms to find the patients you're looking for."
                                }
                              </Typography>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPatients.map((p, index) => (
                          <TableRow 
                            key={p._id}
                            sx={{
                              background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                transform: 'scale(1.01)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s ease-in-out',
                              },
                              '& td': {
                                padding: '16px 12px',
                                borderBottom: '1px solid #f1f5f9',
                              }
                            }}
                          >
                            <TableCell>
                              {p.photo ? (
                                <Avatar
                                  src={`data:image/jpeg;base64,${p.photo}` || `${p.photo}`}
                                  alt={p.name}
                                  sx={{ 
                                    width: 56, 
                                    height: 56,
                                    border: '3px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                  }}
                                />
                              ) : (
                                <Avatar
                                  sx={{ 
                                    width: 56, 
                                    height: 56,
                                    bgcolor: '#3b82f6',
                                    border: '3px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                  }}
                                >
                                  <FaUser className="text-white" />
                                </Avatar>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <Typography variant="body1" className="font-semibold text-gray-900 mb-1">
                                  {p.name || 'Unknown Patient'}
                                </Typography>
                                <Typography variant="body2" className="text-gray-500">
                                  Patient ID: {p._id ? p._id.slice(-6) : 'N/A'}
                                </Typography>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${p.age} years`} 
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                  color: '#475569',
                                  fontWeight: '600',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={p.sex} 
                                size="small"
                                sx={{
                                  background: p.sex === 'Male' 
                                    ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' 
                                    : 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
                                  color: p.sex === 'Male' ? '#1e40af' : '#be185d',
                                  fontWeight: '600',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <FaIdCard className="mr-2 text-gray-400" />
                                <Typography variant="body2" className="font-mono font-medium text-gray-700">
                                  {p.passportNumber}
                                </Typography>
                              </div>
                            </TableCell>
                            {currentDisplayFields.showIssuingCountry && (
                              <TableCell>
                                <div className="flex items-center">
                                  <FaGlobe className="mr-2 text-blue-500" />
                                  <Typography variant="body2" className="text-gray-700">
                                    {p.issuingCountry || '-'}
                                  </Typography>
                                </div>
                              </TableCell>
                            )}
                            {currentDisplayFields.showOccupation && (
                              <TableCell>
                                <div className="flex items-center">
                                  <FaBriefcase className="mr-2 text-green-500" />
                                  <Typography variant="body2" className="text-gray-700">
                                    {p.occupation || '-'}
                                  </Typography>
                                </div>
                              </TableCell>
                            )}
                            {currentDisplayFields.showAgent && (
                              <TableCell>
                                <div className="flex items-center">
                                  <FaUserTie className="mr-2 text-purple-500" />
                                  <Typography variant="body2" className="text-gray-700 font-medium">
                                    {p.agent || '-'}
                                  </Typography>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip
                                label={p.medicalType}
                                size="medium"
                                sx={{
                                  background: getMedicalTypeColor(p.medicalType),
                                  color: 'white',
                                  fontWeight: '600',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                }}
                              />
                            </TableCell>
                            {/* Removed Delete button */}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                    <QRCodeCanvas 
                      value={window.location.href} 
                      size={100}
                      className="rounded-lg shadow-sm bg-white p-2"
                    />
                    <p className="text-sm text-gray-500">
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </TableContainer>
                  </CardContent>
                </Card>
              </div>
            </Container>
          </div>
        </div>
      <Footer />
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default FrontOffice;