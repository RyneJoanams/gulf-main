import React, { useState, useEffect, useRef } from 'react';
import ReactToPrint from 'react-to-print';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Button, MenuItem, CircularProgress, Typography, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import Webcam from 'react-webcam';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams } from "react-router-dom";
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import axios from 'axios';
import TopBar from '../../components/TopBar'
import Footer from '../../components/Footer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';

const medicalTypes = ['MAURITIUS', 'SM-VDRL', 'MEDICAL', 'FM', 'NORMAL'];
const countryOptions = Country.getAllCountries().map((country) => ({
  value: country.isoCode,
  label: country.name,
}));

const sexOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

// Custom styles for Select component
const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '48px',
    background: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    '&:hover': {
      borderColor: '#3b82f6',
    },
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected ? '#3b82f6' : state.isFocused ? '#e5e7eb' : 'white',
    color: state.isSelected ? 'white' : '#1f2937',
    padding: '0.75rem',
  }),
};

const FrontOffice = () => {
  const [patient, setPatient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const [selectedMedicalType, setSelectedMedicalType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
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
  });
  const [hideQr, setHideQr] = useState(false);

  const webcamRef = useRef(null);
  const tableRef = useRef(null);
  const { patientId } = useParams();

  useEffect(() => {
    const fetchPatientData = async () => {
      if (patientId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/patient/${patientId}`);
          setPatient(response.data);
          setFormValues(response.data);
        } catch (error) {
          console.error('Error fetching patient data:', error);
          toast.error('Failed to fetch patient data.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    const fetchAllPatients = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/patient');
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatientData();
    fetchAllPatients();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleDialogOpen = (patientId) => {
    setSelectedPatientId(patientId);
    setOpenDialog(true);
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
    <div className="mt-8 space-y-6 bg-gray-50 p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">Upload Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <Button
        variant="outlined"
        onClick={() => setShowWebcam(!showWebcam)}
        className="w-full py-2 px-4 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200"
      >
        {showWebcam ? 'Hide Webcam' : 'Take Live Picture'}
      </Button>

      {showWebcam && (
        <div className="mt-4 space-y-4">
          <Webcam 
            ref={webcamRef} 
            screenshotFormat="image/jpeg" 
            className="rounded-lg shadow-md w-full"
          />
          <Button 
            variant="contained" 
            onClick={captureImage}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors duration-200"
          >
            Capture
          </Button>
        </div>
      )}

      {formValues.photo && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
          <img
            src={formValues.photo instanceof File ? URL.createObjectURL(formValues.photo) : formValues.photo}
            alt="Captured"
            className="w-32 h-32 object-cover rounded-lg shadow-md mx-auto"
          />
          <button
            type="button"
            onClick={removeCapturedPhoto}
            className="mt-4 w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            Remove Photo
          </button>
        </div>
      )}
    </div>
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
    });
    setShowWebcam(false); // Reset webcam state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    const requiredFields = ['name', 'age', 'sex', 'passportNumber', 'medicalType'];
    for (const field of requiredFields) {
      if (!formValues[field]) {
        toast.error(`${field} is required.`);
        return; // Prevent form submission if a required field is missing
      }
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
      <div className="space-y-6">
        <TextField
          name="name"
          label="Name"
          value={formValues.name}
          onChange={handleChange}
          fullWidth
          required
          className="bg-gray-50"
          InputProps={{
            className: "rounded-lg",
            style: { padding: '12px' }
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
          className="bg-gray-50"
          InputProps={{
            className: "rounded-lg",
            style: { padding: '12px' }
          }}
        />

        <Select
          options={sexOptions}
          value={sexOptions.find((option) => option.value === formValues.sex)}
          onChange={(selectedOption) => setFormValues({ ...formValues, sex: selectedOption.value })}
          placeholder="Select Sex"
          styles={customSelectStyles}
          className="rounded-lg"
        />

        <TextField
          name="passportNumber"
          label="Passport Number"
          value={formValues.passportNumber}
          onChange={handleChange}
          fullWidth
          required
          className="bg-gray-50"
          InputProps={{
            className: "rounded-lg",
            style: { padding: '12px' }
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
            <Select
              options={countryOptions}
              value={countryOptions.find((option) => option.value === formValues.issuingCountry)}
              onChange={(selectedOption) =>
                setFormValues({ ...formValues, issuingCountry: selectedOption.value })
              }
              placeholder="Select Issuing Country"
              styles={customSelectStyles}
              className="rounded-lg"
            />
            <TextField
              name="occupation"
              label="Occupation"
              value={formValues.occupation}
              onChange={handleChange}
              fullWidth
              className="bg-gray-50"
              InputProps={{
                className: "rounded-lg",
                style: { padding: '12px' }
              }}
            />
            {renderPhotoInput()}
          </div>
        );
      case 'SM-VDRL':
      case 'NORMAL':
        return (
          <div className="space-y-6">
            {commonFields}
            {renderPhotoInput()}
          </div>
        );
      default:
        return null;
    }
  };

  // PDF Print Handler
  const handlePdfPrint = async () => {
    setHideQr(true); // Hide QR code
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for DOM update

    const input = tableRef.current;
    if (!input) return;

    // Wait for all images to load, but continue if any image fails
    const images = input.querySelectorAll('img');
    const promises = Array.from(images).map(
      img =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth !== 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => {
              // Replace broken image with a transparent 1x1 PNG
              img.src =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Xb9wAAAAASUVORK5CYII=';
              resolve();
            };
          }
        })
    );
    await Promise.all(promises);

    // Use html2canvas with useCORS enabled
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 40;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 20, 20, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`patients-list-${new Date().toISOString().slice(0,10)}.pdf`);

    setHideQr(false); // Show QR code again
  };

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Enhanced filter function that combines medical type and search query
  const filteredPatients = patients.filter(patient => {
    // Filter by medical type
    const medicalTypeMatch = selectedMedicalType === 'ALL' || patient.medicalType === selectedMedicalType;
    
    // Filter by search query (case-insensitive search in name)
    const searchMatch = searchQuery === '' || 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return medicalTypeMatch && searchMatch;
  });

  // Get patient counts for each medical type (considering search)
  const getPatientCount = (medicalType) => {
    const baseFilter = searchQuery === '' ? patients : 
      patients.filter(patient => patient.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
                placeholder="Search by patient name..."
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

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Medical Types</h3>
            
            {/* All Patients Filter */}
            <div 
              className={`flex items-center justify-between p-4 rounded-lg mb-3 cursor-pointer transition-all duration-200 ${
                selectedMedicalType === 'ALL' 
                  ? 'bg-white text-teal-700 shadow-md' 
                  : 'bg-teal-500 hover:bg-teal-300 text-white'
              }`}
              onClick={() => setSelectedMedicalType('ALL')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  selectedMedicalType === 'ALL' ? 'bg-teal-600' : 'bg-white'
                }`}></div>
                <span className="font-medium">All Patients</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedMedicalType === 'ALL' 
                  ? 'bg-teal-200 text-teal-800' 
                  : 'bg-white bg-opacity-20 text-white'
              }`}>
                {getPatientCount('ALL')}
              </span>
            </div>

            {/* Medical Type Filters */}
            {medicalTypes.map((type) => (
              <div
                key={type}
                className={`flex items-center justify-between p-4 rounded-lg mb-3 cursor-pointer transition-all duration-200 ${
                  selectedMedicalType === type 
                    ? 'bg-white text-teal-900 shadow-md' 
                    : 'bg-teal-500 hover:bg-teal-400 text-white'
                }`}
                onClick={() => setSelectedMedicalType(type)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedMedicalType === type ? 'bg-teal-600' : 'bg-white'
                  }`}></div>
                  <span className="font-medium">{type}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedMedicalType === type 
                    ? 'bg-teal-200 text-teal-800' 
                    : 'bg-white bg-opacity-20 text-white'
                }`}>
                  {getPatientCount(type)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="bg-teal-500 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-teal-200">Total Patients:</span>
                <span className="font-medium text-white">{patients.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-200">Currently Viewing:</span>
                <span className="font-medium text-white">{filteredPatients.length}</span>
              </div>
              {searchQuery && (
                <div className="flex justify-between border-t border-teal-400 pt-2 mt-2">
                  <span className="text-teal-200">Search Results:</span>
                  <span className="font-medium text-white">{filteredPatients.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-6 py-8">
          <Container maxWidth="lg" className="bg-white rounded-xl shadow-lg">
            <div className="p-8">
              <Typography variant="h4" className="text-center text-gray-800 font-semibold mb-8">
                Patient Registration Form
              </Typography>
              
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                  <TextField
                    select
                    name="medicalType"
                    label="Medical Type"
                    value={formValues.medicalType}
                    onChange={handleChange}
                    fullWidth
                    required
                    className="bg-gray-50"
                    InputProps={{
                      className: "rounded-lg",
                      style: { padding: '12px' }
                    }}
                  >
                    {medicalTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  {renderFields()}
                  
                  <Button
                    variant="contained"
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 mt-8"
                  >
                    Submit Registration
                  </Button>
                </div>
              </form>

              <div className="mt-16">
                <div className="flex justify-between items-center mb-8">
                  <Typography variant="h5" className="text-gray-800 font-semibold">
                    Patients List
                    {searchQuery && (
                      <span className="text-lg font-normal text-gray-600 ml-2">
                        - Search: "{searchQuery}"
                      </span>
                    )}
                  </Typography>
                  
                  {/* Additional search bar in main content area */}
                  
                </div>

                {/* Show message when no results found */}
                {filteredPatients.length === 0 && searchQuery && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">No patients found matching "{searchQuery}"</p>
                    <button
                      onClick={clearSearch}
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      Clear search to see all patients
                    </button>
                  </div>
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

                <div className="mb-6 flex gap-4">
                  <ReactToPrint
                    trigger={() => (
                      <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm">
                        Print Records
                      </button>
                    )}
                    content={() => tableRef.current}
                  />
                  <button
                    onClick={handlePdfPrint}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    Export as PDF
                  </button>
                </div>

                <TableContainer 
                  component={Paper} 
                  ref={tableRef}
                  className="rounded-xl shadow-md overflow-hidden"
                >
                  <style>
                    {`
                      @media print {
                        .printable {
                          margin: 0;
                          padding: 20px;
                          background: white;
                          color: black;
                          box-shadow: none;
                        }
                        .printable h1, .printable h2 {
                          text-align: center;
                          margin-bottom: 1rem;
                        }
                        .printable table {
                          width: 100%;
                          border-collapse: collapse;
                          margin-top: 2rem;
                        }
                        .printable th, .printable td {
                          border: 1px solid #e5e7eb;
                          padding: 12px;
                          text-align: left;
                        }
                        .printable th {
                          background-color: #f9fafb;
                        }
                      }
                    `}
                  </style>
                  
                  <header className="p-8 bg-white border-b">
                    <img src={logo} alt="Logo" className="max-w-md mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-center text-gray-800">Health Center</h1>
                    <h2 className="text-xl text-center text-gray-600 mt-2">Patient Records</h2>
                    <p className="text-center text-gray-500 mt-4">
                      Date: {new Date().toLocaleDateString()}
                    </p>
                  </header>

                  <Table className="min-w-full">
                    <TableHead>
                      <TableRow className="bg-gray-50">
                        <TableCell className="font-semibold">Photo</TableCell>
                        <TableCell className="font-semibold">Name</TableCell>
                        <TableCell className="font-semibold">Age</TableCell>
                        <TableCell className="font-semibold">Sex</TableCell>
                        <TableCell className="font-semibold">Passport Number</TableCell>
                        <TableCell className="font-semibold">Issuing Country</TableCell>
                        <TableCell className="font-semibold">Occupation</TableCell>
                        <TableCell className="font-semibold">Medical Type</TableCell>
                        {/* Removed Actions column */}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPatients.map((p) => (
                        <TableRow 
                          key={p._id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <TableCell>
                            {p.photo ? (
                              <img
                                src={`data:image/jpeg;base64,${p.photo}` || `${p.photo}`}
                                alt="Patient"
                                className="w-16 h-16 object-cover rounded-lg shadow-sm"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400">-</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                          <TableCell>{p.age}</TableCell>
                          <TableCell>{p.sex}</TableCell>
                          <TableCell>{p.passportNumber}</TableCell>
                          <TableCell>{p.issuingCountry || '-'}</TableCell>
                          <TableCell>{p.occupation || '-'}</TableCell>
                          <TableCell>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {p.medicalType}
                            </span>
                          </TableCell>
                          {/* Removed Delete button */}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                    {!hideQr && (
                      <QRCodeCanvas 
                        value={window.location.href} 
                        size={100}
                        className="rounded-lg shadow-sm bg-white p-2"
                      />
                    )}
                    <p className="text-sm text-gray-500">
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </TableContainer>
              </div>
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