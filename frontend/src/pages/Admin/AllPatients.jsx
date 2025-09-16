import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography,
  TextField, IconButton, CircularProgress, TableSortLabel, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FaFileExcel, FaPlus } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';
import * as XLSX from 'xlsx';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';


const AllPatients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [medicalTypeCounts, setMedicalTypeCounts] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editablePatient, setEditablePatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [filterByMedicalType, setFilterByMedicalType] = useState('All');
  const [filterBySex, setFilterBySex] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/patient');
        setPatients(response.data);
        setFilteredPatients(response.data);
        calculateMedicalTypeCounts(response.data);
        calculateAgeDistribution(response.data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to fetch patients.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const calculateMedicalTypeCounts = (data) => {
    const counts = data.reduce((acc, patient) => {
      acc[patient.medicalType] = (acc[patient.medicalType] || 0) + 1;
      return acc;
    }, {});
    setMedicalTypeCounts(Object.keys(counts).map(type => ({ type, count: counts[type] })));
  };

  const calculateAgeDistribution = (data) => {
    const distribution = data.reduce((acc, patient) => {
      const ageGroup = Math.floor(patient.age / 10) * 10; // Group ages by decade
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {});
    setAgeDistribution(Object.keys(distribution).map(age => ({ ageGroup: `${age} - ${parseInt(age) + 9}`, count: distribution[age] })));
  };

  const handleSearch = debounce((term) => {
    applyFilters(term, filterByMedicalType, filterBySex);
  }, 300);

  const applyFilters = (searchTerm, medicalTypeFilter, sexFilter) => {
    let filtered = patients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.contactNumber.includes(searchTerm);
      const matchesMedicalType = medicalTypeFilter === 'All' || p.medicalType === medicalTypeFilter;
      const matchesSex = sexFilter === 'All' || p.sex === sexFilter;
      
      return matchesSearch && matchesMedicalType && matchesSex;
    });
    setFilteredPatients(filtered);
  };

  useEffect(() => {
    applyFilters(searchTerm, filterByMedicalType, filterBySex);
  }, [searchTerm, patients, filterByMedicalType, filterBySex]);

  const handleOpenModal = (patient, editMode = false) => {
    setSelectedPatient(patient);
    setEditablePatient({ ...patient });
    setIsEditMode(editMode);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPatient(null);
    setEditablePatient(null);
    setIsEditMode(false);
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(`http://localhost:5000/api/patient/${editablePatient._id}`, editablePatient);
      toast.success('Patient details updated successfully!');
      setPatients(prev => prev.map(p => (p._id === editablePatient._id ? editablePatient : p)));
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save changes.');
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await axios.delete(`http://localhost:5000/api/patient/${patientId}`);
      toast.success('Patient deleted successfully!');
      setPatients(prev => prev.filter(p => p._id !== patientId));
    } catch (error) {
      toast.error('Failed to delete patient.');
    }
  };

  const confirmDelete = (patient) => {
    confirmAlert({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete patient ${patient.name}? This action cannot be undone.`,
      buttons: [
        {
          label: 'Yes, Delete',
          onClick: () => handleDeletePatient(patient._id),
          className: 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
        },
        {
          label: 'Cancel',
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2'
        }
      ]
    });
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    setFilteredPatients(
      [...filteredPatients].sort((a, b) => {
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
      })
    );
  };

  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToExcel = () => {
    const sheetData = filteredPatients.map(record => ({
      PatientName: record.name,
      Age: record.age,
      Sex: record.sex,
      PassportNumber: record.passportNumber,
      MedicalType: record.medicalType,
      IssuingCountry: record.issuingCountry,
      Address: record.address,
      ContactNumber: record.contactNumber,
      DateOfBirth: record.dateOfBirth,
      Occupation: record.occupation,
      Height: record.height,
      Weight: record.weight,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    XLSX.writeFile(workbook, `patients_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data exported to Excel successfully!');
  };

  const handlePrintPatients = () => {
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
                  <td>${patient.name}</td>
                  <td>${patient.age}</td>
                  <td>${patient.sex}</td>
                  <td>${patient.passportNumber}</td>
                  <td>${patient.medicalType}</td>
                  <td>${patient.contactNumber}</td>
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
  };

  const paginatedData = filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" align="center" gutterBottom className="text-blue-600 font-bold mb-8">
          All Patients Management
        </Typography>

        {/* Enhanced Controls Section */}
        <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <TextField
              variant="outlined"
              placeholder="Search by name, passport, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <IconButton><SearchIcon /></IconButton>,
              }}
              fullWidth
              size="small"
            />
            
            <div className="flex space-x-2">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                Filters
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowCharts(!showCharts)}
                size="small"
              >
                {showCharts ? 'Hide Charts' : 'Show Charts'}
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="contained"
                color="primary"
                startIcon={<FaFileExcel />}
                onClick={exportToExcel}
                size="small"
              >
                Export Excel
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PrintIcon />}
                onClick={handlePrintPatients}
                size="small"
              >
                Print
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded"
            >
              <FormControl size="small" fullWidth>
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

              <FormControl size="small" fullWidth>
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
            </motion.div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-100 p-4 rounded text-center">
              <Typography variant="h6" className="text-blue-600">{filteredPatients.length}</Typography>
              <Typography variant="body2">Total Patients</Typography>
            </div>
            <div className="bg-green-100 p-4 rounded text-center">
              <Typography variant="h6" className="text-green-600">
                {filteredPatients.filter(p => p.sex === 'Male').length}
              </Typography>
              <Typography variant="body2">Male Patients</Typography>
            </div>
            <div className="bg-pink-100 p-4 rounded text-center">
              <Typography variant="h6" className="text-pink-600">
                {filteredPatients.filter(p => p.sex === 'Female').length}
              </Typography>
              <Typography variant="body2">Female Patients</Typography>
            </div>
            <div className="bg-yellow-100 p-4 rounded text-center">
              <Typography variant="h6" className="text-yellow-600">
                {Array.from(new Set(filteredPatients.map(p => p.medicalType))).length}
              </Typography>
              <Typography variant="body2">Medical Types</Typography>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress size={60} />
          </div>
        ) : (
          <>
            {/* Charts Section */}
            {showCharts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
              >
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <Typography variant="h6" align="center" className="mb-4 text-gray-700">
                    Medical Type Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={medicalTypeCounts} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                        {medicalTypeCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <Typography variant="h6" align="center" className="mb-4 text-gray-700">
                    Age Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ageGroup" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Enhanced Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <TableContainer component={Paper} className="shadow-lg">
                <Table>
                  <TableHead className="bg-gray-50">
                    <TableRow>
                      {["name", "age", "sex", "passportNumber", "medicalType", "issuingCountry", "occupation", "height", "weight"].map((col) => (
                        <TableCell key={col}>
                          <TableSortLabel
                            active={sortConfig.key === col}
                            direction={sortConfig.direction}
                            onClick={() => handleSort(col)}
                            className="font-semibold"
                          >
                            {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                      <TableCell className="font-semibold">Actions</TableCell>
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
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.sex} 
                            size="small"
                            color={patient.sex === 'Male' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{patient.passportNumber}</TableCell>
                        <TableCell>
                          <Chip 
                            label={patient.medicalType} 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{patient.issuingCountry}</TableCell>
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
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredPatients.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                className="bg-white"
              />
            </motion.div>
          </>
        )}
        {/* Enhanced Patient Details Modal */}
        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
          <DialogTitle className="bg-blue-50">
            <div className="flex justify-between items-center">
              <Typography variant="h6" className="text-blue-600">
                {isEditMode ? 'Edit Patient Details' : 'Patient Details'}
              </Typography>
              <div className="flex space-x-2">
                {!isEditMode && (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogContent className="p-6">
            {selectedPatient && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Name"
                    value={editablePatient?.name || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Age"
                    type="number"
                    value={editablePatient?.age || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, age: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <FormControl fullWidth disabled={!isEditMode}>
                    <InputLabel>Sex</InputLabel>
                    <Select
                      value={editablePatient?.sex || ''}
                      onChange={(e) => setEditablePatient(prev => ({ ...prev, sex: e.target.value }))}
                      label="Sex"
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Passport Number"
                    value={editablePatient?.passportNumber || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, passportNumber: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Medical Type"
                    value={editablePatient?.medicalType || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, medicalType: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Issuing Country"
                    value={editablePatient?.issuingCountry || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, issuingCountry: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Occupation"
                    value={editablePatient?.occupation || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, occupation: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Contact Number"
                    value={editablePatient?.contactNumber || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, contactNumber: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Height (cm)"
                    value={editablePatient?.height || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, height: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Weight (kg)"
                    value={editablePatient?.weight || ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, weight: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Date of Birth"
                    type="date"
                    value={editablePatient?.dateOfBirth ? editablePatient.dateOfBirth.split('T')[0] : ''}
                    onChange={(e) => setEditablePatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    disabled={!isEditMode}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </div>
                <TextField
                  label="Address"
                  value={editablePatient?.address || ''}
                  onChange={(e) => setEditablePatient(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditMode}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                />
              </div>
            )}
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={handleCloseModal} color="secondary">
              {isEditMode ? 'Cancel' : 'Close'}
            </Button>
            {isEditMode && (
              <Button onClick={handleSaveChanges} color="primary" variant="contained">
                Save Changes
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default AllPatients;
