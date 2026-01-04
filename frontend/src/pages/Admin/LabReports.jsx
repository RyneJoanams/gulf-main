import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AiFillDelete, AiOutlinePrinter, AiOutlineEdit } from 'react-icons/ai';
import { FaFileExport, FaChevronUp, FaChevronDown, FaSearch, FaFilter } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import * as XLSX from 'xlsx';
import ReportSection from './ReportSection';
import { motion } from 'framer-motion';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { API_BASE_URL } from '../../config/api.config';

const Card = ({ children, className }) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-2xl font-bold text-gray-800">{children}</h2>
);

const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

const Spinner = ({ size = 'md' }) => (
  <div className={`border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin ${size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'}`} />
);

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedReports, setCollapsedReports] = useState({}); // Changed from single state to object
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/lab`);
        setReports(response.data.data);
        setFilteredReports(response.data.data);
        // Initialize all reports as collapsed
        const initialCollapsedState = response.data.data.reduce((acc, report) => {
          acc[report._id] = true;
          return acc;
        }, {});
        setCollapsedReports(initialCollapsedState);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Error Fetching Reports');
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const filtered = reports.filter((report) => {
      const matchesSearch = (report.patientName && report.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (report.name && report.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (report.labNumber && report.labNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDate = !dateFilter || 
                         (report.timeStamp && new Date(report.timeStamp).toDateString() === new Date(dateFilter).toDateString());
      
      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Complete' && report.isComplete) ||
                           (statusFilter === 'Incomplete' && !report.isComplete);
      
      return matchesSearch && matchesDate && matchesStatus;
    });
    setFilteredReports(filtered);
  }, [reports, searchTerm, dateFilter, statusFilter]);

  // Helper functions for dropdown management
  const toggleReportCollapse = (reportId) => {
    setCollapsedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const expandAllReports = () => {
    const expandedState = filteredReports.reduce((acc, report) => {
      acc[report._id] = false;
      return acc;
    }, {});
    setCollapsedReports(expandedState);
    toast.success('All reports expanded');
  };

  const collapseAllReports = () => {
    const collapsedState = filteredReports.reduce((acc, report) => {
      acc[report._id] = true;
      return acc;
    }, {});
    setCollapsedReports(collapsedState);
    toast.success('All reports collapsed');
  };

  const handleDelete = async (id) => {
    confirmAlert({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this lab report? This action cannot be undone.',
      buttons: [
        {
          label: 'Yes, Delete',
          onClick: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/lab/${id}`);
              setReports(reports.filter((report) => report._id !== id));
              toast.success('Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              toast.error('Error deleting report');
            }
          },
          className: 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600'
        },
        {
          label: 'Cancel',
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2'
        }
      ]
    });
  };

  const handleEdit = (report) => {
    setEditingReport({ ...report });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/lab/${editingReport._id}`, editingReport);
      setReports(reports.map(report => 
        report._id === editingReport._id ? editingReport : report
      ));
      setShowEditModal(false);
      setEditingReport(null);
      toast.success('Report updated successfully');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Error updating report');
    }
  };

  const exportToExcel = () => {
    // Prepare data for export by removing unnecessary fields and flattening nested objects
    const exportData = filteredReports.map(report => {
      const flatReport = {
        patientId: report._id,
        patientName: report.patientName,
        name: report.name,
        timestamp: new Date(report.timeStamp).toLocaleString(),
        ...Object.entries(report).reduce((acc, [key, value]) => {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (typeof subValue === 'object' && subValue !== null) {
                acc[`${key}_${subKey}`] = subValue.value;
                acc[`${key}_${subKey}_status`] = subValue.status;
                acc[`${key}_${subKey}_range`] = subValue.range;
              } else {
                acc[`${key}_${subKey}`] = subValue;
              }
            });
          }
          return acc;
        }, {})
      };
      return flatReport;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, 'LabReports.xlsx');
    toast.success('Reports exported to Excel');
  };

  const handlePrint = () => {
    const printContents = document.getElementById('printable-section').innerHTML;
    const printWindow = window.open('', '', 'width=1000,height=800');
  
    if (!printContents) {
      toast.error('No content found to print');
      return;
    }
  
    // Display a loading indicator while preparing the print content
    const loadingHtml = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; font-size: 24px; color: #1e40af;">
        Preparing your report...
      </div>`;
    
    printWindow.document.write(loadingHtml);
  
    // Set a slight delay to ensure the loading message appears
    setTimeout(() => {
      printWindow.document.write(`
        <html>
          <head>
            <title>Enhanced Laboratory Report</title>
            <style>
              /* General Reset and Base Styles */
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
  
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                padding: 2rem;
                background-color: #fafafa;
              }
  
              /* Header Styles */
              .report-header {
                text-align: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 3px solid #3b82f6;
              }
  
              .report-header h1 {
                font-size: 28px;
                color: #1e40af;
                margin-bottom: 0.5rem;
              }
  
              .report-header .timestamp {
                color: #6b7280;
                font-size: 14px;
              }
  
              /* Report Card Styles */
              .report-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                margin: 2rem 0;
                padding: 1.5rem;
                background: #ffffff;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                page-break-inside: avoid;
              }
  
              .patient-info {
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #e5e7eb;
              }
  
              .patient-info h2 {
                color: #1e40af;
                font-size: 20px;
                margin-bottom: 0.5rem;
              }
  
              .patient-info p {
                color: #4b5563;
                font-size: 14px;
                margin: 0.25rem 0;
              }
  
              /* Section Styles */
              .section {
                margin: 1rem 0;
                padding: 1rem;
                background: #f3f4f6;
                border-radius: 8px;
                border: 1px solid #d1d5db;
              }
  
              .section-title {
                color: #1e40af;
                font-size: 18px;
                font-weight: 600;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
                border-bottom: 2px solid #93c5fd;
              }
  
              .data-row {
                display: flex;
                justify-content: space-between;
                margin: 0.5rem 0;
                padding: 0.5rem 0;
                border-bottom: 1px solid #e5e7eb;
              }
  
              .data-label {
                font-weight: 500;
                color: #374151;
                min-width: 200px;
              }
  
              .data-value {
                color: #1f2937;
              }
  
              /* Status Badges */
              .status-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-left: 8px;
              }
  
              .status-normal {
                background: #d1fae5;
                color: #065f46;
              }
  
              .status-high {
                background: #fee2e2;
                color: #b91c1c;
              }
  
              .status-low {
                background: #fef3c7;
                color: #92400e;
              }
  
              /* Page Break Controls */
              @media print {
                .report-card {
                  break-inside: avoid;
                  margin: 0;
                  padding: 1.5rem 0;
                }
  
                .section {
                  break-inside: avoid;
                }
                
                /* Enhanced Table Styles for Print */
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1rem 0;
                  font-size: 12px;
                  break-inside: avoid;
                }
                
                table thead tr {
                  background: #f3f4f6 !important;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                
                table th, table td {
                  border: 1px solid #d1d5db;
                  padding: 8px;
                  text-align: left;
                }
                
                table th {
                  font-weight: bold;
                  font-size: 11px;
                  text-transform: uppercase;
                  background: #f9fafb !important;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                
                .status-normal { 
                  color: #065f46 !important; 
                  font-weight: bold;
                }
                .status-high, .text-red-600 { 
                  color: #dc2626 !important; 
                  font-weight: bold;
                }
                .status-low, .text-orange-600 { 
                  color: #d97706 !important; 
                  font-weight: bold;
                }
                .text-green-600 { 
                  color: #16a34a !important; 
                  font-weight: bold;
                }
                .text-blue-600 { 
                  color: #2563eb !important; 
                  font-weight: bold;
                }
  
                @page {
                  margin: 1.5cm;
                }
              }
  
              /* Footer Styles */
              .report-footer {
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }
  
              /* Animation for Loading */
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
  
              .fade-in {
                animation: fadeIn 1s ease-in-out;
              }
            </style>
          </head>
          <body class="fade-in">
            <div class="report-header">
              <h1>Enhanced Laboratory Report</h1>
              <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
            </div>
            ${printContents}
            <div class="report-footer">
              <p>This is an official laboratory report document</p>
              <p>Generated by Laboratory Management System</p>
            </div>
          </body>
        </html>
      `);
  
      printWindow.document.close();
  
      // Wait for all content to load before printing
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
          toast.success('Reports printed successfully');
        }, 500);
      };
  
      // Handle print errors
      printWindow.onerror = function() {
        toast.error('Error occurred while printing');
        printWindow.close();
      };
    }, 300); // Delay to show loading screen
  };
  

  return (
    <div className="mx-auto p-6 bg-gray-50 min-h-screen">
      <ToastContainer />
      <Card className="max-w-11/12 mx-auto">
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle>LABORATORY REPORTS MANAGEMENT</CardTitle>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`py-2 px-4 rounded-lg flex items-center transition-colors duration-200 ${
                    showFilters ? 'bg-blue-500 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  <FaFilter className="mr-2" /> Filters
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={expandAllReports}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg flex items-center transition-colors duration-200"
                    title="Expand All Reports"
                  >
                    <FaChevronDown className="mr-1" /> Expand All
                  </button>
                  <button
                    onClick={collapseAllReports}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg flex items-center transition-colors duration-200"
                    title="Collapse All Reports"
                  >
                    <FaChevronUp className="mr-1" /> Collapse All
                  </button>
                </div>
                <button
                  onClick={exportToExcel}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
                >
                  <FaFileExport className="mr-2" /> Export
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
                >
                  <AiOutlinePrinter className="mr-2" /> Print
                </button>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-grow relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, lab number..."
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-100 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Reports</option>
                    <option value="Complete">Complete</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter('');
                      setStatusFilter('All');
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg w-full transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-lg text-center border border-blue-300 hover:shadow-md transition-shadow duration-200">
                <div className="text-2xl font-bold text-blue-700">{filteredReports.length}</div>
                <div className="text-xs text-gray-600">Total Reports</div>
                <div className="text-xs text-blue-600 mt-1">
                  {((filteredReports.length / reports.length) * 100).toFixed(0)}% of all
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg text-center border border-green-300 hover:shadow-md transition-shadow duration-200">
                <div className="text-2xl font-bold text-green-700">
                  {filteredReports.filter(r => r.isComplete).length}
                </div>
                <div className="text-xs text-gray-600">Complete</div>
                <div className="text-xs text-green-600 mt-1">
                  {filteredReports.length > 0 ? ((filteredReports.filter(r => r.isComplete).length / filteredReports.length) * 100).toFixed(0) : 0}% completed
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg text-center border border-yellow-300 hover:shadow-md transition-shadow duration-200">
                <div className="text-2xl font-bold text-yellow-700">
                  {filteredReports.filter(r => !r.isComplete).length}
                </div>
                <div className="text-xs text-gray-600">Pending</div>
                <div className="text-xs text-yellow-600 mt-1">
                  {filteredReports.length > 0 ? ((filteredReports.filter(r => !r.isComplete).length / filteredReports.length) * 100).toFixed(0) : 0}% pending
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg text-center border border-purple-300 hover:shadow-md transition-shadow duration-200">
                <div className="text-2xl font-bold text-purple-700">
                  {new Set(filteredReports.map(r => r.patientName)).size}
                </div>
                <div className="text-xs text-gray-600">Unique Patients</div>
                <div className="text-xs text-purple-600 mt-1">
                  Avg {filteredReports.length > 0 ? (filteredReports.length / new Set(filteredReports.map(r => r.patientName)).size).toFixed(1) : 0} reports/patient
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <Spinner size="lg" />
              <p className="text-lg text-gray-600 mt-4">Loading laboratory reports...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest data</p>
            </div>
          ) : (
            <div id="printable-section" className="grid grid-cols-1 gap-6">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <FaSearch className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No reports found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || dateFilter || statusFilter !== 'All' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No laboratory reports available yet'
                    }
                  </p>
                  {(searchTerm || dateFilter || statusFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setDateFilter('');
                        setStatusFilter('All');
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                filteredReports.map((report) => (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Report ID</p>
                                <p className="font-mono text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">{report._id}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Lab Number</p>
                                <p className="font-semibold text-blue-600">{report.labNumber}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Patient Name</p>
                                <p className="text-lg font-semibold text-blue-800">{report.patientName || name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Date & Time</p>
                                <p className="text-sm text-gray-700">
                                  {new Date(report.timeStamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  report.isComplete 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}>
                                  {report.isComplete ? '✓ Complete' : '⏳ Pending'}
                                </span>
                                
                                {/* Lab Data Indicators */}
                                {(report.renalFunction && Object.keys(report.renalFunction).length > 0) && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium" title="Renal Function Data Available">
                                    🫘 Renal
                                  </span>
                                )}
                                {(report.fullHaemogram && Object.keys(report.fullHaemogram).length > 0) && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium" title="Full Haemogram Data Available">
                                    🔬 Haemogram
                                  </span>
                                )}
                                {(report.liverFunction && Object.keys(report.liverFunction).length > 0) && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium" title="Liver Function Data Available">
                                    🫀 Liver
                                  </span>
                                )}
                                
                                <button
                                  onClick={() => toggleReportCollapse(report._id)}
                                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                                    collapsedReports[report._id] 
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                  title={collapsedReports[report._id] ? 'Show Details' : 'Hide Details'}
                                >
                                  {collapsedReports[report._id] ? (
                                    <>
                                      <FaChevronDown className="w-3 h-3" />
                                      <span>Show Details</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaChevronUp className="w-3 h-3" />
                                      <span>Hide Details</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(report)}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg flex items-center transition-all duration-200 transform hover:scale-105"
                                title="Edit Report"
                              >
                                <AiOutlineEdit className="w-4 h-4 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(report._id)}
                                className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg flex items-center transition-all duration-200 transform hover:scale-105"
                                title="Delete Report"
                              >
                                <AiFillDelete className="w-4 h-4 mr-1" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      {!collapsedReports[report._id] && (
                      <CardContent>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-6">
                            {/* Standard Test Sections - Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <ReportSection title="Urine Test" data={report.urineTest} />
                              <ReportSection title="Blood Test" data={report.bloodTest} />
                              <ReportSection title="General Examination" data={report.generalExamination} />
                              <ReportSection title="Systemic Examination" data={report.systemicExamination} />
                              <ReportSection title="Laboratory Tests" data={report.area1} />
                            </div>
                            
                            {/* Table-Based Sections - Full Width Layout for Better Display */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                              <ReportSection title="Renal Function" data={report.renalFunction} />
                              <ReportSection title="Liver Function" data={report.liverFunction} />
                            </div>
                            
                            {/* Full Haemogram - Full Width for Better Table Display */}
                            <div className="grid grid-cols-1 gap-6">
                              <ReportSection title="Full Haemogram" data={report.fullHaemogram} />
                            </div>
                            
                            {/* Laboratory Remarks - Moved to Bottom */}
                            <div className="grid grid-cols-1 gap-6 mt-6 pt-6 border-t border-gray-200">
                              <ReportSection title="Laboratory Remarks" data={report.labRemarks} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Lab Report</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={editingReport.patientName || ''}
                    onChange={(e) => setEditingReport(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lab Number</label>
                  <input
                    type="text"
                    value={editingReport.labNumber || ''}
                    onChange={(e) => setEditingReport(prev => ({ ...prev, labNumber: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Remarks</label>
                <textarea
                  value={editingReport.labRemarks || ''}
                  onChange={(e) => setEditingReport(prev => ({ ...prev, labRemarks: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
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
            </div>
          </motion.div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default LabReports;