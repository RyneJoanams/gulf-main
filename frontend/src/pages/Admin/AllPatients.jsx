import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography,
  TextField, IconButton, CircularProgress, TableSortLabel, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, FormControl, InputLabel, Select, MenuItem, Box, Card, CardContent,
  Grid, Divider
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FaFileExcel, FaPlus, FaTrash } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api.config';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';
import * as XLSX from 'xlsx';

// Add custom animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
`;

const AllPatients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editablePatient, setEditablePatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterByMedicalType, setFilterByMedicalType] = useState('All');
  const [filterBySex, setFilterBySex] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: '', name: '' });
  
  // Photo management states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(false);
  
  // Cache ref to prevent unnecessary refetches
  const cacheRef = useRef({ data: null, timestamp: null });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Check if we have valid cached data
        const now = Date.now();
        if (cacheRef.current.data && cacheRef.current.timestamp && 
            (now - cacheRef.current.timestamp < CACHE_DURATION)) {
          setPatients(cacheRef.current.data);
          setFilteredPatients(cacheRef.current.data);
          setLoading(false);
          return;
        }
        
        // Fetch patient data with photos
        const response = await axios.get(`${API_BASE_URL}/api/patient`);
        const data = response.data.patients || response.data; // Handle both old and new response format
        
        // Update cache
        cacheRef.current = {
          data: data,
          timestamp: now
        };
        
        setPatients(data);
        setFilteredPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to fetch patients.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSearch = useCallback(
    debounce((term) => {
      applyFilters(term, filterByMedicalType, filterBySex, startDate, endDate);
    }, 300),
    [filterByMedicalType, filterBySex, startDate, endDate]
  );

  const applyFilters = useCallback((searchTerm, medicalTypeFilter, sexFilter, dateStart, dateEnd) => {
    let filtered = patients.filter(p => {
      const matchesSearch = (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (p.passportNumber && p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (p.contactNumber && p.contactNumber.includes(searchTerm));
      const matchesMedicalType = medicalTypeFilter === 'All' || p.medicalType === medicalTypeFilter;
      const matchesSex = sexFilter === 'All' || p.sex === sexFilter;
      
      // Date range filtering
      let matchesDateRange = true;
      if (dateStart || dateEnd) {
        const patientDate = new Date(p.createdAt || p.dateOfBirth);
        if (dateStart && dateEnd) {
          const start = new Date(dateStart);
          const end = new Date(dateEnd);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDateRange = patientDate >= start && patientDate <= end;
        } else if (dateStart) {
          matchesDateRange = patientDate >= new Date(dateStart);
        } else if (dateEnd) {
          const end = new Date(dateEnd);
          end.setHours(23, 59, 59, 999);
          matchesDateRange = patientDate <= end;
        }
      }
      
      return matchesSearch && matchesMedicalType && matchesSex && matchesDateRange;
    });
    setFilteredPatients(filtered);
  }, [patients]);

  useEffect(() => {
    applyFilters(searchTerm, filterByMedicalType, filterBySex, startDate, endDate);
  }, [searchTerm, patients, filterByMedicalType, filterBySex, startDate, endDate]);

  const handleOpenModal = useCallback(async (patient, editMode = false) => {
    setSelectedPatient(patient);
    setEditablePatient({ ...patient });
    setIsEditMode(editMode);
    setOpenModal(true);
    
    // Reset photo states
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoToDelete(false);
    
    // Fetch patient with photo if not already loaded
    if (editMode && !patient.photo) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/patient/${patient._id}`);
        if (response.data.photo) {
          setEditablePatient(response.data);
          setSelectedPatient(response.data);
        }
      } catch (error) {
        console.error('Error fetching patient photo:', error);
      }
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedPatient(null);
    setEditablePatient(null);
    setIsEditMode(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoToDelete(false);
  }, []);

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      setPhotoToDelete(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDeletePhoto = useCallback(() => {
    setPhotoToDelete(true);
    setPhotoFile(null);
    setPhotoPreview(null);
    toast.info('Photo will be removed when you save changes');
  }, []);

  const handleSaveChanges = useCallback(async () => {
    try {
      // Remove fields that shouldn't be sent in update
      const { _id, __v, createdAt, updatedAt, ...patientData } = editablePatient;
      
      // Handle photo upload or deletion
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        
        // Append all patient data fields
        Object.keys(patientData).forEach(key => {
          if (patientData[key] !== null && patientData[key] !== undefined) {
            formData.append(key, patientData[key]);
          }
        });
        
        await axios.put(`${API_BASE_URL}/api/patient/${editablePatient._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (photoToDelete) {
        // Send request to delete photo
        patientData.photo = '';
        await axios.put(`${API_BASE_URL}/api/patient/${editablePatient._id}`, patientData);
      } else {
        // Regular update without photo changes
        await axios.put(`${API_BASE_URL}/api/patient/${editablePatient._id}`, patientData);
      }
      
      toast.success('Patient details updated successfully!');
      
      // Refresh patient data
      const response = await axios.get(`${API_BASE_URL}/api/patient`);
      const data = response.data.patients || response.data;
      setPatients(data);
      setFilteredPatients(data);
      
      // Invalidate cache on update
      cacheRef.current = { data: null, timestamp: null };
      handleCloseModal();
    } catch (error) {
      console.error('Error updating patient:', error.response?.data || error);
      toast.error(`Failed to save changes: ${error.response?.data?.message || error.message}`);
    }
  }, [editablePatient, photoFile, photoToDelete, handleCloseModal]);

  const confirmDelete = useCallback((patient) => {
    setDeleteTarget({ id: patient._id, name: patient.name });
    setShowDeleteModal(true);
  }, []);
  
  const handleDeletePatient = useCallback(async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/patient/${deleteTarget.id}`);
      toast.success('Patient deleted successfully!');
      setPatients(prev => prev.filter(p => p._id !== deleteTarget.id));
      // Invalidate cache on delete
      cacheRef.current = { data: null, timestamp: null };
      setShowDeleteModal(false);
      setDeleteTarget({ id: '', name: '' });
    } catch (error) {
      toast.error('Failed to delete patient.');
    }
  }, [deleteTarget.id]);
  
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ id: '', name: '' });
  };

  const clearFilters = useCallback(() => {
    setFilterByMedicalType('All');
    setFilterBySex('All');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  }, []);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    setFilteredPatients(prev =>
      [...prev].sort((a, b) => {
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
      })
    );
  }, [sortConfig.key, sortConfig.direction]);

  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToExcel = useCallback(() => {
    const sheetData = filteredPatients.map(record => ({
      PatientName: record.name || 'N/A',
      Age: record.age || 'N/A',
      Sex: record.sex || 'N/A',
      PassportNumber: record.passportNumber || 'N/A',
      MedicalType: record.medicalType || 'N/A',
      IssuingCountry: record.issuingCountry || 'N/A',
      Address: record.address || 'N/A',
      ContactNumber: record.contactNumber || 'N/A',
      DateOfBirth: record.dateOfBirth || 'N/A',
      Occupation: record.occupation || 'N/A',
      Height: record.height || 'N/A',
      Weight: record.weight || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    XLSX.writeFile(workbook, `patients_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data exported to Excel successfully!');
  }, [filteredPatients]);

  const handlePrintPatients = useCallback(() => {
    const printContent = `
      <html>
        <head>
          <title>All Patients Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #1976d2; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-bottom: 30px; padding: 15px; background-color: #f0f7ff; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Gulf Healthcare Kenya Ltd - All Patients Report</h1>
          <div class="summary">
            <p><strong>Total Patients:</strong> ${filteredPatients.length}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Passport Number</th>
                <th>Medical Type</th>
                <th>Contact Number</th>
                <th>Occupation</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPatients.map(patient => `
                <tr>
                  <td>${patient.name || 'N/A'}</td>
                  <td>${patient.age || 'N/A'}</td>
                  <td>${patient.sex || 'N/A'}</td>
                  <td>${patient.passportNumber || 'N/A'}</td>
                  <td>${patient.medicalType || 'N/A'}</td>
                  <td>${patient.contactNumber || 'N/A'}</td>
                  <td>${patient.occupation || 'N/A'}</td>
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
  }, [filteredPatients]);

  const paginatedData = useMemo(
    () => filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredPatients, page, rowsPerPage]
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <Typography variant="h4" align="center" className="text-blue-700 font-bold mb-2">
            🏥 All Patients Management
          </Typography>
          <Typography variant="body2" align="center" className="text-gray-600">
            Manage and view all patient records with advanced filtering options
          </Typography>
        </div>

        {/* Enhanced Controls Section */}
        <Card className="mb-6 shadow-xl">
          <CardContent className="p-6">
            <Grid container spacing={3}>
              {/* Search Bar */}
              <Grid item xs={12} md={6}>
                <TextField
                  variant="outlined"
                  placeholder="🔍 Search by name, passport, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: <IconButton><SearchIcon /></IconButton>,
                  }}
                  fullWidth
                  size="medium"
                  className="bg-white"
                />
              </Grid>
              
              {/* Action Buttons */}
              <Grid item xs={12} md={6}>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={showFilters ? "contained" : "outlined"}
                    startIcon={<FilterListIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    size="medium"
                    className='bg-green-600 hover:bg-green-700'
                  >
                    Filters
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<FaFileExcel />}
                    onClick={exportToExcel}
                    size="medium"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Export
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<PrintIcon />}
                    onClick={handlePrintPatients}
                    size="medium"
                  >
                    Print
                  </Button>
                </div>
              </Grid>
            </Grid>

            {/* Advanced Filters Section */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Divider className="my-4" />
                <Typography variant="subtitle1" className="mb-3 text-gray-700 font-semibold">
                  📊 Advanced Filters
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Medical Type</InputLabel>
                      <Select
                        value={filterByMedicalType}
                        onChange={(e) => setFilterByMedicalType(e.target.value)}
                        label="Medical Type"
                      >
                        <MenuItem value="All">All Medical Types</MenuItem>
                        {Array.from(new Set(patients.map(p => p.medicalType))).map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Sex</InputLabel>
                      <Select
                        value={filterBySex}
                        onChange={(e) => setFilterBySex(e.target.value)}
                        label="Sex"
                      >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={clearFilters}
                      className="h-full"
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </motion.div>
            )}

            {/* Summary Statistics */}
            <Divider className="my-4" />
            <Grid container spacing={3} className="mt-2">
              <Grid item xs={6} sm={3}>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="text-center">
                    <Typography variant="h4" className="font-bold mb-1">
                      {filteredPatients.length}
                    </Typography>
                    <Typography variant="body2" className="opacity-90">
                      Total Patients
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="text-center">
                    <Typography variant="h4" className="font-bold mb-1">
                      {filteredPatients.filter(p => p.sex === 'Male').length}
                    </Typography>
                    <Typography variant="body2" className="opacity-90">
                      Male Patients
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="text-center">
                    <Typography variant="h4" className="font-bold mb-1">
                      {filteredPatients.filter(p => p.sex === 'Female').length}
                    </Typography>
                    <Typography variant="body2" className="opacity-90">
                      Female Patients
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="text-center">
                    <Typography variant="h4" className="font-bold mb-1">
                      {Array.from(new Set(filteredPatients.map(p => p.medicalType))).length}
                    </Typography>
                    <Typography variant="body2" className="opacity-90">
                      Medical Types
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress size={60} />
          </div>
        ) : (
          <>
            {/* Enhanced Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <TableContainer component={Paper} className="shadow-xl rounded-lg overflow-hidden">
                <Table>
                  <TableHead className="bg-gray-50">
                    <TableRow>
                      {["name", "age", "sex", "passportNumber", "medicalType", "issuingCountry", "occupation", "height", "weight"].map((col) => (
                        <TableCell key={col} className="text-white">
                          <TableSortLabel
                            active={sortConfig.key === col}
                            direction={sortConfig.direction}
                            onClick={() => handleSort(col)}
                            className="font-semibold text-white hover:text-gray-200"
                            sx={{
                              '& .MuiTableSortLabel-icon': { color: 'white !important' },
                              '&.Mui-active': { color: 'white' }
                            }}
                          >
                            {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                      <TableCell className="font-semibold text-white">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((patient, index) => (
                      <motion.tr
                        key={patient._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                        component={TableRow}
                      >
                        <TableCell className="font-medium">{patient.name || 'N/A'}</TableCell>
                        <TableCell>{patient.age || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.sex || 'N/A'} 
                            size="small"
                            color={patient.sex === 'Male' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{patient.passportNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.medicalType || 'N/A'} 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{patient.issuingCountry || 'N/A'}</TableCell>
                        <TableCell>{patient.occupation || 'N/A'}</TableCell>
                        <TableCell>{patient.height || 'N/A'}</TableCell>
                        <TableCell>{patient.weight || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <IconButton 
                              onClick={() => handleOpenModal(patient, false)}
                              size="small"
                              className="text-blue-600 hover:bg-blue-50"
                              title="View Details"
                            >
                              👁️
                            </IconButton>
                            <IconButton 
                              onClick={() => handleOpenModal(patient, true)}
                              size="small"
                              className="text-green-600 hover:bg-green-50"
                              title="Edit Patient"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={() => confirmDelete(patient)}
                              size="small"
                              className="text-red-600 hover:bg-red-50"
                              title="Delete Patient"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={filteredPatients.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                className="bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-blue-200"
              />
            </motion.div>
          </>
        )}
        {/* Enhanced Patient Details Modal */}
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
            <style>{customStyles}</style>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto transform transition-all animate-slideUp">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {isEditMode ? 'Edit Patient Details' : 'Patient Details'}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {selectedPatient?.passportNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isEditMode && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
                      >
                        <EditIcon fontSize="small" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200"
                    >
                      <span className="text-xl">✕</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedPatient && (
                  <div className="space-y-6">
                    {/* Patient Photo Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📷</span> Patient Photo
                      </h3>
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Photo Display */}
                        <div className="flex-shrink-0">
                          <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : photoToDelete ? (
                              <div className="text-center text-gray-400">
                                <span className="text-4xl">🚫</span>
                                <p className="text-xs mt-2">Photo removed</p>
                              </div>
                            ) : editablePatient?.photo ? (
                              <img 
                                src={editablePatient.photo.startsWith('data:') 
                                  ? editablePatient.photo 
                                  : `data:image/jpeg;base64,${editablePatient.photo}`
                                } 
                                alt="Patient" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="text-center text-gray-400">
                                <span className="text-4xl">👤</span>
                                <p className="text-xs mt-2">No photo</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Photo Controls */}
                        {isEditMode && (
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Change Photo
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Accepted formats: JPG, PNG, GIF (Max 5MB)
                              </p>
                            </div>
                            
                            {(editablePatient?.photo || photoPreview) && !photoToDelete && (
                              <button
                                onClick={handleDeletePhoto}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all duration-200 flex items-center gap-2"
                              >
                                <DeleteIcon fontSize="small" />
                                Remove Photo
                              </button>
                            )}
                            
                            {photoFile && (
                              <div className="text-sm text-green-600 flex items-center gap-2">
                                <span>✓</span>
                                <span>New photo selected: {photoFile.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Personal Information Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                        <span>👤</span> Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Full Name</label>
                          <input
                            type="text"
                            value={editablePatient?.name || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Age</label>
                          <input
                            type="number"
                            value={editablePatient?.age || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, age: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Sex</label>
                          <select
                            value={editablePatient?.sex || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, sex: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            value={editablePatient?.dateOfBirth ? editablePatient.dateOfBirth.split('T')[0] : ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Identification Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                        <span>🆔</span> Identification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Passport Number</label>
                          <input
                            type="text"
                            value={editablePatient?.passportNumber || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, passportNumber: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Issuing Country</label>
                          <input
                            type="text"
                            value={editablePatient?.issuingCountry || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, issuingCountry: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Information Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                        <span>🏥</span> Medical Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Medical Type</label>
                          <input
                            type="text"
                            value={editablePatient?.medicalType || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, medicalType: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                          <input
                            type="text"
                            value={editablePatient?.height || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, height: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                          <input
                            type="text"
                            value={editablePatient?.weight || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, weight: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact & Other Information Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                      <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                        <span>📞</span> Contact & Other Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Contact Number</label>
                          <input
                            type="text"
                            value={editablePatient?.contactNumber || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, contactNumber: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Occupation</label>
                          <input
                            type="text"
                            value={editablePatient?.occupation || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, occupation: e.target.value }))}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <textarea
                            value={editablePatient?.address || ''}
                            onChange={(e) => setEditablePatient(prev => ({ ...prev, address: e.target.value }))}
                            disabled={!isEditMode}
                            rows={3}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              isEditMode 
                                ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200' 
                                : 'border-gray-200 bg-gray-50'
                            } outline-none transition-all resize-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200 flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  {isEditMode ? 'Cancel' : 'Close'}
                </button>
                {isEditMode && (
                  <button
                    onClick={handleSaveChanges}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center gap-2"
                  >
                    <span>💾</span>
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
          <style>{customStyles}</style>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-slideUp">
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 animate-bounce">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Confirm Delete
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 text-center mb-2">
                Are you sure you want to delete this patient record?
              </p>
              <p className="text-gray-800 font-semibold text-center mb-6 px-4 py-2 bg-gray-100 rounded-lg">
                {deleteTarget.name}
              </p>
              
              {/* Warning */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 w-full">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action cannot be undone. The patient record will be permanently removed from the database.
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePatient}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPatients;
