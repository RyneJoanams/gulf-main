import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Button, MenuItem, CircularProgress, Typography, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import Webcam from 'react-webcam';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { Country } from 'country-state-city';
import axios from 'axios';
import TopBar from '../../components/TopBar'
import Footer from '../../components/Footer';
import { QRCodeCanvas } from 'qrcode.react';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaPrint, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';

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
      agent: '',
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

    const patientsTableRows = filteredPatients.map(patient => `
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
        <td style="width: 15%;">${formatData(patient.passportNumber)}</td>
        <td style="width: 12%;">${formatData(patient.issuingCountry)}</td>
        <td style="width: 12%;">${formatData(patient.occupation)}</td>
        <td style="width: 10%;">${formatData(patient.agent)}</td>
        <td style="width: 12%;">${formatData(patient.medicalType)}</td>
      </tr>
    `).join('');

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
                <tr>
                  <th style="width: 8%;">Photo</th>
                  <th style="width: 15%;">Name</th>
                  <th style="width: 8%;">Age</th>
                  <th style="width: 8%;">Sex</th>
                  <th style="width: 15%;">Passport Number</th>
                  <th style="width: 12%;">Issuing Country</th>
                  <th style="width: 12%;">Occupation</th>
                  <th style="width: 10%;">Agent</th>
                  <th style="width: 12%;">Medical Type</th>
                </tr>
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
      // Prepare data for Excel export
      const excelData = filteredPatients.map((patient, index) => ({
        'S/N': index + 1,
        'Name': patient.name || 'N/A',
        'Age': patient.age || 'N/A',
        'Sex': patient.sex || 'N/A',
        'Passport Number': patient.passportNumber || 'N/A',
        'Issuing Country': patient.issuingCountry || 'N/A',
        'Occupation': patient.occupation || 'N/A',
        'Agent': patient.agent || 'N/A',
        'Medical Type': patient.medicalType || 'N/A',
        'Date Created': patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'
      }));

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

      // Set column widths for better readability
      const columnWidths = [
        { wch: 5 },   // S/N
        { wch: 20 },  // Name
        { wch: 8 },   // Age
        { wch: 10 },  // Sex
        { wch: 18 },  // Passport Number
        { wch: 18 },  // Issuing Country
        { wch: 15 },  // Occupation
        { wch: 15 },  // Agent
        { wch: 15 },  // Medical Type
        { wch: 12 }   // Date Created
      ];
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

  // Enhanced filter function that combines medical type, search query, and date range
  const filteredPatients = patients.filter(patient => {
    // Filter by medical type
    const medicalTypeMatch = selectedMedicalType === 'ALL' || patient.medicalType === selectedMedicalType;
    
    // Filter by search query (case-insensitive search in name or agent)
    const searchMatch = searchQuery === '' || 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      const searchMatch = searchQuery === '' || 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                  
                  <TextField
                    name="agent"
                    label="Agent (Optional)"
                    value={formValues.agent}
                    onChange={handleChange}
                    fullWidth
                    className="bg-gray-50"
                    InputProps={{
                      className: "rounded-lg",
                      style: { padding: '12px' }
                    }}
                    placeholder="Enter agent name or code"
                  />
                  
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
                    {startDate && endDate && (
                      <span className="text-sm font-normal text-gray-500 ml-2 block">
                        ({startDate.toLocaleDateString()} to {endDate.toLocaleDateString()})
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

                <div className="mb-6 flex justify-end gap-3">
                  <button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm flex items-center"
                  >
                    <FaFileExcel className="mr-2" />
                    Export to Excel
                  </button>
                  <button
                    onClick={printReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm flex items-center"
                  >
                    <FaPrint className="mr-2" />
                    Print Report
                  </button>
                </div>

                <TableContainer 
                  component={Paper} 
                  className="rounded-xl shadow-md overflow-hidden"
                >
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
                        <TableCell className="font-semibold">Agent</TableCell>
                        <TableCell className="font-semibold">Medical Type</TableCell>
                        {/* Removed Actions column */}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingPatients ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <CircularProgress size={40} />
                            <Typography variant="body2" className="mt-2 text-gray-500">
                              Loading patients...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : filteredPatients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <Typography variant="body1" className="text-gray-500">
                              {patients.length === 0 
                                ? "No patients found. Start by adding a new patient." 
                                : "No patients match your current filter criteria."
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPatients.map((p) => (
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
                            <TableCell>{p.agent || '-'}</TableCell>
                            <TableCell>
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {p.medicalType}
                              </span>
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