import React, { useState, useEffect, useMemo } from 'react';
import { usePatient } from '../../context/patientContext';
import { Formik, Form, Field } from 'formik';
import TableRow from '../../components/TableRow';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import TopBar from '../../components/TopBar';
import { TESTS_BY_UNIT, initialValues } from './LabFunctions';
import LeftBar from '../../components/LeftBar';
import { FaSave, FaEye, FaEdit, FaArrowLeft } from 'react-icons/fa';
import Footer from '../../components/Footer';
import { API_BASE_URL } from '../../config/api.config';



const Lab = () => {
  const { patientData, updatePatientData } = usePatient();
  const [selectedPatient, setSelectedPatient] = useState('Select Patient')
  const [bloodGroups, setBloodGroups] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [selectedTests, setSelectedTests] = useState({});
  const [selectAll, setSelectAll] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [overallStatus, setOverallStatus] = useState('');
  const [otherAspectsFit, setOtherAspectsFit] = useState('');
  const [labSuperintendent, setLabSuperintendent] = useState('');
  const [selectedLabNumber, setSelectedLabNumber] = useState('');
  const [labNumbers, setLabNumbers] = useState([]);
  const [labNumberSearchTerm, setLabNumberSearchTerm] = useState('');
  const [isLoadingLabNumbers, setIsLoadingLabNumbers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  
  // New states for viewing existing data
  const [existingLabData, setExistingLabData] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchLabNumbers = async () => {
      setIsLoadingLabNumbers(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/number`);
        setLabNumbers(response.data.labNumbers);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch lab numbers');
        setLoading(false);
      } finally {
        setIsLoadingLabNumbers(false);
      }
    };

    fetchLabNumbers();

    // Listen for phlebotomy report selection from LeftBar
    const handlePhlebotomySelection = (event) => {
      const { patientName, labNumber, phlebotomyData } = event.detail;
      setSelectedPatient(patientName);
      setSelectedLabNumber(labNumber);
      toast.success(`Patient selected: ${patientName} with Lab #${labNumber}`);
    };

    // Listen for new lab number submissions
    const handleLabNumberSubmission = (event) => {
      const { labNumber, patientName } = event.detail;
      toast.info(`New lab number submitted: ${labNumber} for ${patientName}`);
      fetchLabNumbers(); // Refresh the lab numbers list
    };

    window.addEventListener('phlebotomyReportSelected', handlePhlebotomySelection);
    window.addEventListener('labNumberSubmitted', handleLabNumberSubmission);

    // Initialize blood groups
    setBloodGroups(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

    return () => {
      window.removeEventListener('phlebotomyReportSelected', handlePhlebotomySelection);
      window.removeEventListener('labNumberSubmitted', handleLabNumberSubmission);
    };
  }, [patientData]);

  // Function to fetch existing lab data
  const fetchLabData = async (patientId, labNumber) => {
    try {
      console.log('Fetching lab data for:', patientId, labNumber);
      const response = await axios.get(`${API_BASE_URL}/api/lab/${patientId}/${labNumber}`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Handle different possible response structures
        const labData = response.data.data || response.data.labData || response.data.result;
        console.log('Lab Data:', labData);
        
        if (!labData) {
          throw new Error('No lab data found in response');
        }
        
        setExistingLabData(labData);
        
        // Reset all selections first
        setSelectedUnits({});
        setSelectedTests({});
        
        // Populate form fields and selections based on existing data
        if (labData.urineTest && Object.keys(labData.urineTest).length > 0) {
          console.log('Urine test data:', labData.urineTest);
          setSelectedUnits(prev => ({ ...prev, urineTest: true }));
          const tests = {};
          Object.keys(labData.urineTest).forEach(test => {
            if (labData.urineTest[test] && labData.urineTest[test] !== '' && labData.urineTest[test] !== null && labData.urineTest[test] !== undefined) {
              tests[test] = true;
            }
          });
          setSelectedTests(prev => ({ ...prev, urineTest: tests }));
        }

        if (labData.bloodTest && Object.keys(labData.bloodTest).length > 0) {
          console.log('Blood test data:', labData.bloodTest);
          setSelectedUnits(prev => ({ ...prev, bloodTest: true }));
          const tests = {};
          Object.keys(labData.bloodTest).forEach(test => {
            if (labData.bloodTest[test] && labData.bloodTest[test] !== '' && labData.bloodTest[test] !== null && labData.bloodTest[test] !== undefined) {
              tests[test] = true;
            }
          });
          setSelectedTests(prev => ({ ...prev, bloodTest: tests }));
        }

        if (labData.area1 && Object.keys(labData.area1).length > 0) {
          console.log('Area1 test data:', labData.area1);
          setSelectedUnits(prev => ({ ...prev, area1: true }));
          const tests = {};
          Object.keys(labData.area1).forEach(test => {
            if (labData.area1[test] && labData.area1[test] !== '' && labData.area1[test] !== null && labData.area1[test] !== undefined) {
              tests[test] = true;
            }
          });
          setSelectedTests(prev => ({ ...prev, area1: tests }));
        }

        // Check for table-based sections
        ['renalFunction', 'fullHaemogram', 'liverFunction'].forEach(section => {
          if (labData[section] && Object.keys(labData[section]).length > 0) {
            console.log(`${section} data:`, labData[section]);
            const hasData = Object.values(labData[section]).some(test => 
              test && typeof test === 'object' && (test.value || test.status || test.range || test.units)
            );
            if (hasData) {
              setSelectedUnits(prev => ({ ...prev, [section]: true }));
            }
          }
        });

        // Set lab remarks
        if (labData.labRemarks) {
          console.log('Lab remarks:', labData.labRemarks);
          setOverallStatus(labData.labRemarks.fitnessEvaluation?.overallStatus || '');
          setOtherAspectsFit(labData.labRemarks.fitnessEvaluation?.otherAspectsFit || '');
          setLabSuperintendent(labData.labRemarks.labSuperintendent?.name || '');
        }

        setIsViewMode(true);
        toast.success('Lab report loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching lab data:', error);
      // If no existing data found, reset everything
      setExistingLabData(null);
      setIsViewMode(false);
      setSelectedUnits({});
      setSelectedTests({});
      setOverallStatus('');
      setOtherAspectsFit('');
      setLabSuperintendent('');
      toast.info('No existing lab report found. You can create a new one.');
    }
  };

  const filteredLabNumbers = useMemo(() => {
    return labNumbers.filter((lab) =>
      lab.number.toLowerCase().includes(search.toLowerCase())
    );
  }, [labNumbers, search]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSelectChange = async (event) => {
    const labNumber = event.target.value;
    setSelectedLabNumber(labNumber);
    
    if (labNumber && selectedPatient && selectedPatient !== 'Select Patient') {
      const patient = patientData.patients.find(p => p.name === selectedPatient);
      if (patient) {
        await fetchLabData(patient.id, labNumber);
      }
    } else {
      // Reset when no lab number selected
      setExistingLabData(null);
      setIsViewMode(false);
      setSelectedUnits({});
      setSelectedTests({});
      setOverallStatus('');
      setOtherAspectsFit('');
      setLabSuperintendent('');
    }
  };

  const handleUnitSelect = (unit) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [unit]: !prev[unit],
    }));
    if (selectedUnits[unit]) {
      setSelectAll((prev) => ({ ...prev, [unit]: false }));
      setSelectedTests((prev) => ({ ...prev, [unit]: {} }));
    }
  };

  const handleTestSelect = (unit, test) => {
    setSelectedTests((prev) => ({
      ...prev,
      [unit]: {
        ...prev[unit],
        [test]: !prev[unit]?.[test],
      },
    }));
  };

  const handleSelectAllTests = (unit) => {
    const allTestsSelected = !selectAll[unit];
    setSelectAll((prev) => ({ ...prev, [unit]: allTestsSelected }));

    setSelectedTests((prev) => ({
      ...prev,
      [unit]: allTestsSelected
        ? TESTS_BY_UNIT[unit].reduce((acc, test) => ({ ...acc, [test]: true }), {})
        : {},
    }));
  };

  const handleSelectAllTestsInUnit = (unit) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [unit]: !prev[unit],
    }));
  };

  // Enhanced functions to render existing data in view mode
  const renderViewData = (data, sectionTitle) => {
    console.log(`Rendering ${sectionTitle}:`, data);
    
    if (!data || typeof data !== 'object') {
      console.log(`No data for ${sectionTitle}`);
      return null;
    }

    const validEntries = Object.entries(data).filter(([key, value]) => 
      value !== null && value !== undefined && value !== '' && value !== 'undefined' && value !== 'null'
    );

    if (validEntries.length === 0) {
      console.log(`No valid entries for ${sectionTitle}`);
      return null;
    }

    // Get icon based on section title
    const getIcon = (title) => {
      if (title.toLowerCase().includes('urine')) return 'fas fa-tint';
      if (title.toLowerCase().includes('blood')) return 'fas fa-heartbeat';
      if (title.toLowerCase().includes('laboratory')) return 'fas fa-microscope';
      return 'fas fa-vial';
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <h4 className="text-xl font-bold text-white flex items-center gap-2">
            <i className={getIcon(sectionTitle)}></i>
            {sectionTitle}
          </h4>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validEntries.map(([key, value]) => (
              <div key={key} className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 capitalize flex items-center gap-2">
                    <i className="fas fa-circle text-blue-400 text-xs"></i>
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className="text-gray-900 font-bold bg-white px-3 py-1 rounded-full shadow-sm">
                    {String(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTableViewData = (data, sectionTitle) => {
    console.log(`Rendering table ${sectionTitle}:`, data);
    
    if (!data || typeof data !== 'object') {
      console.log(`No data for table ${sectionTitle}`);
      return null;
    }

    const validEntries = Object.entries(data).filter(([test, values]) => {
      if (!values || typeof values !== 'object') return false;
      return values.value || values.status || values.range || values.units;
    });

    if (validEntries.length === 0) {
      console.log(`No valid entries for table ${sectionTitle}`);
      return null;
    }

    // Get icon based on section title
    const getIcon = (title) => {
      if (title.toLowerCase().includes('renal')) return 'fas fa-kidneys';
      if (title.toLowerCase().includes('haemogram')) return 'fas fa-heartbeat';
      if (title.toLowerCase().includes('liver')) return 'fas fa-liver';
      return 'fas fa-table';
    };

    // Only show Units column for Full Haemogram
    const showUnitsColumn = sectionTitle.toLowerCase().includes('haemogram');

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
          <h4 className="text-xl font-bold text-white flex items-center gap-2">
            <i className={getIcon(sectionTitle)}></i>
            {sectionTitle}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Test Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Value
                </th>
                {showUnitsColumn && (
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Units
                  </th>
                )}
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Range
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {validEntries.map(([test, values], index) => (
                <tr key={test} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {test.replace(/([A-Z])/g, ' $1')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {values.value || '-'}
                  </td>
                  {showUnitsColumn && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {values.units || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {values.status ? (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        values.status.toLowerCase() === 'normal' 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {values.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {values.range || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const filteredPatients = useMemo(() => {
    return patientData.patients.filter((patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patientData.patients, searchTerm]);

  const labRemarks = {
    fitnessEvaluation: {
      otherAspectsFit: otherAspectsFit,
      overallStatus: overallStatus
    },
    labSuperintendent: {
      name: labSuperintendent
    }
  };

  const selectedPatientData = patientData?.patients.find(
    (patient) => patient.name === selectedPatient
  );
  const patientImage = selectedPatientData?.image;

  const handleSubmit = async (values, { resetForm }) => {
    try {
      console.log("Form values:", values);
      console.log("Patient data:", patientData);
      
      // Check if patient data and selected patient are valid
      if (!patientData || !Array.isArray(patientData.patients)) {
        console.error("Patient data is not correctly loaded or structured.");
        toast.error("Patient data is not available. Please reload the page.");
        return;
      }
      
      if (!selectedPatient || selectedPatient === 'Select Patient') {
        console.error("No patient selected.");
        toast.error("Please select a patient before submitting.");
        return;
      }

      if (!selectedLabNumber) {
        toast.error("Please select a lab number before submitting.");
        return;
      }

      // Validate required fields
      if (!labSuperintendent) {
        toast.error("Please enter Lab Superintendent name");
        return;
      }

      if (!overallStatus) {
        toast.error("Please select overall fitness status");
        return;
      }

      if (!otherAspectsFit) {
        toast.error("Please select if applicant appears fit in other respects");
        return;
      }
      
      // Find the patientId based on the selected patient
      const patient = patientData.patients.find((patient) => patient.name === selectedPatient);
      if (!patient) {
        console.error("No matching patient found for the selected name:", selectedPatient);
        toast.error("Please select a valid patient.");
        return;
      }
      
      // Construct the payload to match backend expectations
      const payload = {
        patientId: patient.id,
        patientName: selectedPatient,
        labNumber: selectedLabNumber,
        // Make patient image optional - only include if it exists
        ...(patient.photo && { patientImage: patient.photo }),
        timeStamp: Date.now(),
        medicalType: patient.medicalType || 'N/A',
        labRemarks: labRemarks,
        // Spread the form values directly (urineTest, bloodTest, etc.)
        ...values,
      };
      
      console.log("Payload:", payload);
      
      // Send the payload to the server
      const response = await axios.post(`${API_BASE_URL}/api/lab`, payload);
      const data = response.data;
      console.log("Response data:", data);
      
      if (data.success) {
        // Mark the lab number as completed
        try {
          await axios.put(`${API_BASE_URL}/api/number/complete`, {
            labNumber: selectedLabNumber
          });
          console.log("Lab number marked as completed successfully");
        } catch (labNumberError) {
          console.error("Error marking lab number as completed:", labNumberError);
          // Continue with success message even if lab number update fails
        }

        toast.success(existingLabData ? "Lab report updated successfully" : "Lab report submitted successfully");
        resetForm();
        // Reset relevant states
        setSelectedUnits({});
        setSelectedTests({});
        setSelectAll({});
        setOverallStatus("");
        setOtherAspectsFit("");
        setLabSuperintendent("");
        setSelectedPatient('Select Patient');
        setSelectedLabNumber('');
        setExistingLabData(null);
        setIsViewMode(false);
        setIsEditMode(false);

        // Dispatch event to refresh the lab numbers in LeftBar
        const event = new CustomEvent('labReportSubmitted', {
          detail: {
            labNumber: selectedLabNumber,
            patientName: selectedPatient
          }
        });
        window.dispatchEvent(event);
      } else {
        console.error("Lab report submission failed:", data.error);
        toast.error(data.error || "Lab report submission failed");
      }
    } catch (error) {
      console.error("Error submitting lab report:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Error submitting lab report");
    }
  };



  return (
    <>
      <TopBar />

      <div className='flex '>
        <LeftBar />

        {patientData ? (
          <Formik 
            initialValues={existingLabData || initialValues} 
            enableReinitialize={true}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form className='max-w-11/12 mx-auto p-6 bg-white shadow-lg rounded-lg'>

                <h1 className="text-2xl font-extrabold text-center mb-8 text-blue-700 transition duration-300 hover:text-blue-900 shadow-md p-4 rounded-md bg-gradient-to-r from-blue-50 to-blue-200 hover:from-blue-100 hover:to-blue-300">
                  COMPREHENSIVE LABORATORY EXAMINATION
                  {isViewMode && (
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewMode(false);
                          setIsEditMode(true);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                      >
                        <FaEdit /> Edit Report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewMode(false);
                          setIsEditMode(false);
                          setExistingLabData(null);
                          setSelectedUnits({});
                          setSelectedTests({});
                          setOverallStatus('');
                          setOtherAspectsFit('');
                          setLabSuperintendent('');
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                      >
                        <FaArrowLeft /> Back to Form
                      </button>
                    </div>
                  )}
                </h1>

                <p className="text-lg text-gray-700 mb-4">
                  Patient Name: <span className="font-semibold">{selectedPatient || 'No data'}</span>
                </p>

                {/* Enhanced Patient Selection Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100">
                  {/* Patient Image Display */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center transition-all duration-300 hover:shadow-xl">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        {selectedPatient && selectedPatient !== 'Select Patient' ? (
                          patientData.patients
                            .filter((patient) => patient.name === selectedPatient)
                            .map((patient) => (
                              <div key={patient.labNumber} className="flex flex-col items-center space-y-4">
                                {/* Patient Image */}
                                {patient.photo ? (
                                  <div className="relative">
                                    <img
                                      src={`data:image/jpeg;base64,${patient.photo}`}
                                      alt={`${patient.name}`}
                                      className="w-32 h-32 rounded-full shadow-xl object-cover border-4 border-gradient-to-r from-blue-400 to-purple-500 transition-transform transform hover:scale-105"
                                    />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                      <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 font-semibold shadow-xl border-4 border-gray-200">
                                    <i className="fas fa-user text-3xl"></i>
                                  </div>
                                )}

                                {/* Patient Details */}
                                <div className="text-center">
                                  <h2 className="text-xl font-bold text-gray-800 mb-2">{patient.name}</h2>
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                                      <i className="fas fa-hashtag mr-1"></i>
                                      Lab: <span className="font-semibold">{selectedLabNumber || 'Not Selected'}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                                      <i className="fas fa-stethoscope mr-1"></i>
                                      Type: <span className="font-semibold">{patient.medicalType || 'Standard'}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 shadow-lg">
                              <i className="fas fa-user-plus text-4xl"></i>
                            </div>
                            <p className="text-gray-500 text-center font-medium">Select a patient to begin</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Patient Search and Selection */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
                        <i className="fas fa-search text-blue-500"></i>
                        Patient Selection
                      </h3>
                    </div>

                    {/* Search Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Patient
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type patient name..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      </div>
                    </div>

                    {/* Patient Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Patient
                      </label>
                      <div className="relative">
                        <select
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
                          value={selectedPatient}
                          onChange={(e) => setSelectedPatient(e.target.value)}
                          disabled={!patientData.patients || patientData.patients.length === 0}
                        >
                          <option value="Select Patient">Choose a patient...</option>
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <option key={patient.labNumber} value={patient.name}>
                                {patient.name}
                              </option>
                            ))
                          ) : (
                            <option disabled>No patients found</option>
                          )}
                        </select>
                        <i className="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      </div>
                    </div>
                  </div>

                  {/* Lab Number Selection */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
                        <i className="fas fa-flask text-green-500"></i>
                        Lab Number
                      </h3>
                    </div>

                    {loading && (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 text-blue-600">
                          <i className="fas fa-spinner fa-spin"></i>
                          Loading lab numbers...
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                          <i className="fas fa-exclamation-triangle"></i>
                          {error}
                        </div>
                      </div>
                    )}

                    {!loading && !error && labNumbers.length > 0 ? (
                      <div className="space-y-4">
                        {/* Lab Number Search */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Lab Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Type lab number..."
                              value={search}
                              onChange={handleSearchChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                          </div>
                        </div>

                        {/* Lab Number Dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Lab Number
                          </label>
                          <div className="relative">
                            <select
                              value={selectedLabNumber}
                              onChange={handleSelectChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 bg-white"
                            >
                              <option value="">Choose lab number...</option>
                              {filteredLabNumbers.map((lab) => (
                                <option key={lab._id} value={lab.number}>
                                  {lab.number}
                                </option>
                              ))}
                            </select>
                            <i className="fas fa-flask absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                          </div>
                        </div>

                        {selectedLabNumber && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-800">
                              <i className="fas fa-check-circle"></i>
                              <span className="font-medium">Selected: {selectedLabNumber}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      !loading && !error && (
                        <div className="text-center py-8">
                          <div className="text-gray-500">
                            <i className="fas fa-flask text-4xl mb-2 block"></i>
                            No lab numbers available
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Enhanced Lab Report View Section */}
                {isViewMode && existingLabData && (
                  <div className="mb-8 p-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                        <i className="fas fa-file-medical text-blue-600"></i>
                        Lab Report Analysis
                      </h2>
                      <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
                    </div>
                    
                    {/* Patient Information Header */}
                    <div className="mb-8 p-6 bg-white rounded-xl shadow-md border border-blue-100">
                      <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-user-circle"></i>
                        Patient Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-user text-blue-600"></i>
                            <span className="font-medium text-gray-700">Patient Name</span>
                          </div>
                          <span className="text-gray-900 font-bold text-lg">{selectedPatient}</span>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg shadow-sm border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-hashtag text-green-600"></i>
                            <span className="font-medium text-gray-700">Lab Number</span>
                          </div>
                          <span className="text-gray-900 font-bold text-lg">{selectedLabNumber}</span>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-calendar text-purple-600"></i>
                            <span className="font-medium text-gray-700">Report Date</span>
                          </div>
                          <span className="text-gray-900 font-bold">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg shadow-sm border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-clock text-orange-600"></i>
                            <span className="font-medium text-gray-700">Report Time</span>
                          </div>
                          <span className="text-gray-900 font-bold">{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Test Results Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Render Test Results */}
                      {renderViewData(existingLabData.urineTest, "Urine Test Results")}
                      {renderViewData(existingLabData.bloodTest, "Blood Test Results")}
                      {renderViewData(existingLabData.area1, "Laboratory Test Results")}
                    </div>
                    
                    {/* Advanced Test Results */}
                    <div className="space-y-6 mb-6">
                      {renderTableViewData(existingLabData.renalFunction, "Renal Function Test Results")}
                      {renderTableViewData(existingLabData.fullHaemogram, "Full Haemogram Results")}
                      {renderTableViewData(existingLabData.liverFunction, "Liver Function Test Results")}
                    </div>
                    
                    {/* Lab Remarks Section */}
                    {existingLabData.labRemarks && (
                      <div className="bg-white rounded-xl shadow-md border border-green-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                          <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <i className="fas fa-clipboard-check"></i>
                            Medical Assessment
                          </h4>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">Fitness Assessment:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  existingLabData.labRemarks.fitnessEvaluation?.otherAspectsFit === 'YES' 
                                    ? 'bg-green-100 text-green-800 border border-green-300' 
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  {existingLabData.labRemarks.fitnessEvaluation?.otherAspectsFit}
                                </span>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">Overall Status:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  existingLabData.labRemarks.fitnessEvaluation?.overallStatus === 'FIT' 
                                    ? 'bg-green-100 text-green-800 border border-green-300' : 
                                  existingLabData.labRemarks.fitnessEvaluation?.overallStatus === 'UNFIT' 
                                    ? 'bg-red-100 text-red-800 border border-red-300' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                }`}>
                                  {existingLabData.labRemarks.fitnessEvaluation?.overallStatus}
                                </span>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">Superintendent:</span>
                                <span className="text-gray-900 font-bold">
                                  {existingLabData.labRemarks.labSuperintendent?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No Data Message */}
                    {(!existingLabData.urineTest || Object.keys(existingLabData.urineTest || {}).length === 0) &&
                     (!existingLabData.bloodTest || Object.keys(existingLabData.bloodTest || {}).length === 0) &&
                     (!existingLabData.area1 || Object.keys(existingLabData.area1 || {}).length === 0) &&
                     (!existingLabData.renalFunction || Object.keys(existingLabData.renalFunction || {}).length === 0) &&
                     (!existingLabData.fullHaemogram || Object.keys(existingLabData.fullHaemogram || {}).length === 0) &&
                     (!existingLabData.liverFunction || Object.keys(existingLabData.liverFunction || {}).length === 0) && (
                      <div className="text-center p-8 bg-white rounded-xl border border-gray-200">
                        <i className="fas fa-exclamation-circle text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-600 text-xl font-medium">No lab test data found for this report.</p>
                        <p className="text-gray-500 mt-2">Please check if the lab tests have been completed.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Test Input Forms */}
                {(!isViewMode || isEditMode) && (
                  <div className="space-y-8">
                    {/* Enhanced Urine Test Section */}
                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
                        <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded border-white bg-white/20 checked:bg-white checked:text-blue-600 focus:ring-2 focus:ring-white" 
                              checked={selectedUnits.urineTest || false} 
                              onChange={() => handleUnitSelect('urineTest')} 
                            />
                            <i className="fas fa-tint"></i>
                            Urine Test
                          </label>
                          {selectedUnits.urineTest && (
                            <label className="flex items-center gap-2 text-sm ml-auto">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-white bg-white/20 checked:bg-white checked:text-blue-600" 
                                checked={selectAll.urineTest || false} 
                                onChange={() => handleSelectAllTests('urineTest')} 
                              />
                              Select All
                            </label>
                          )}
                        </h3>
                      </div>
                      {selectedUnits.urineTest && (
                        <div className="p-6 space-y-4 bg-gradient-to-br from-blue-50 to-cyan-50">
                          {[
                            { key: 'albumin', label: 'Albumin', icon: 'fas fa-circle' },
                            { key: 'sugar', label: 'Sugar', icon: 'fas fa-cube' },
                            { key: 'microscopic', label: 'Microscopic', icon: 'fas fa-microscope' },
                            { key: 'reaction', label: 'Reaction', icon: 'fas fa-flask' }
                          ].map(({ key, label, icon }) => (
                            <div key={key} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                    checked={selectedTests.urineTest?.[key] || false} 
                                    onChange={() => handleTestSelect('urineTest', key)} 
                                  />
                                  <i className={`${icon} text-blue-600`}></i>
                                  <span className="font-medium text-gray-700">{label}:</span>
                                </label>
                                {selectedTests.urineTest?.[key] && (
                                  <div className="flex-1 max-w-xs">
                                    <Field 
                                      name={`urineTest.${key}`} 
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" 
                                      type="text" 
                                      placeholder={`Enter ${label.toLowerCase()}`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Laboratory Test Section (now includes Blood Tests) */}
                    <div className="bg-white rounded-xl shadow-lg border border-green-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                        <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded border-white bg-white/20 checked:bg-white checked:text-green-600 focus:ring-2 focus:ring-white" 
                              checked={selectedUnits.area1 || false} 
                              onChange={() => handleUnitSelect('area1')} 
                            />
                            <i className="fas fa-microscope"></i>
                            Laboratory Tests
                          </label>
                          {selectedUnits.area1 && (
                            <label className="flex items-center gap-2 text-sm ml-auto">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-white bg-white/20 checked:bg-white checked:text-green-600" 
                                checked={selectAll.area1 || false} 
                                onChange={() => handleSelectAllTests('area1')} 
                              />
                              Select All
                            </label>
                          )}
                        </h3>
                      </div>
                      {selectedUnits.area1 && (
                        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 space-y-6">
                          
                          {/* Blood Tests Subsection */}
                          <div className="bg-white rounded-lg border-2 border-red-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-3">
                              <h4 className="flex items-center gap-2 text-lg font-bold text-white">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-white bg-white/20 checked:bg-white checked:text-red-600 focus:ring-2 focus:ring-white" 
                                    checked={selectedUnits.bloodTest || false} 
                                    onChange={() => handleUnitSelect('bloodTest')} 
                                  />
                                  <i className="fas fa-heartbeat text-sm"></i>
                                  Blood Tests
                                </label>
                                {selectedUnits.bloodTest && (
                                  <label className="flex items-center gap-2 text-sm ml-auto">
                                    <input 
                                      type="checkbox" 
                                      className="w-3 h-3 rounded border-white bg-white/20 checked:bg-white checked:text-red-600" 
                                      checked={selectAll.bloodTest || false} 
                                      onChange={() => handleSelectAllTests('bloodTest')} 
                                    />
                                    Select All
                                  </label>
                                )}
                              </h4>
                            </div>
                            {selectedUnits.bloodTest && (
                              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {[
                                    { key: 'hivTest', label: 'HIV Test (I, II)', icon: 'fas fa-shield-alt' },
                                    { key: 'hbsAg', label: 'HbsAg', icon: 'fas fa-virus' },
                                    { key: 'hcv', label: 'HCV', icon: 'fas fa-virus-slash' },
                                    { key: 'esr', label: 'ESR(1stHR)', icon: 'fas fa-clock' }
                                  ].map(({ key, label, icon }) => (
                                    <div key={key} className="bg-white rounded-lg p-3 border border-red-200 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" 
                                            checked={selectedTests.bloodTest?.[key] || false} 
                                            onChange={() => handleTestSelect('bloodTest', key)} 
                                          />
                                          <i className={`${icon} text-red-600 text-sm`}></i>
                                          <span className="font-medium text-gray-700 text-sm">{label}:</span>
                                        </label>
                                        {selectedTests.bloodTest?.[key] && (
                                          <div className="flex-1 max-w-xs">
                                            <Field 
                                              name={`bloodTest.${key}`} 
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200" 
                                              type="text" 
                                              placeholder={`Enter ${label.toLowerCase()}`}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* General Laboratory Tests */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { key: 'stoolConsistency', label: 'Stool Consistency', icon: 'fas fa-vial' },
                              { key: 'stoolMicroscopy', label: 'Stool Microscopy', icon: 'fas fa-microscope' },
                              { key: 'tpha', label: 'TPHA', icon: 'fas fa-shield-alt' },
                              { key: 'vdrlTest', label: 'VDRL Test', icon: 'fas fa-shield-alt' },
                              { key: 'venerealDisease', label: 'Venereal Disease', icon: 'fas fa-virus' },
                              { key: 'pregnancyTest', label: 'Pregnancy Test', icon: 'fas fa-baby' },
                              { key: 'typhoid', label: 'Typhoid', icon: 'fas fa-virus-slash' }
                            ].map(({ key, label, icon }) => (
                              <div key={key} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" 
                                      checked={selectedTests.area1?.[key] || false} 
                                      onChange={() => handleTestSelect('area1', key)} 
                                    />
                                    <i className={`${icon} text-green-600`}></i>
                                    <span className="font-medium text-gray-700">{label}:</span>
                                  </label>
                                  {selectedTests.area1?.[key] && (
                                    <div className="flex-1 max-w-xs">
                                      <Field 
                                        name={`area1.${key}`} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200" 
                                        type="text" 
                                        placeholder={`Enter ${label.toLowerCase()}`}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Special Blood Group Selection */}
                            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm col-span-1 md:col-span-2">
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={selectedTests.area1?.bloodGroup || false}
                                    onChange={() => handleTestSelect('area1', 'bloodGroup')}
                                  />
                                  <i className="fas fa-tint text-green-600"></i>
                                  <span className="font-medium text-gray-700">Blood Group:</span>
                                </label>
                                {selectedTests.area1?.bloodGroup && (
                                  <div className="flex-1 max-w-xs">
                                    <Field 
                                      as="select" 
                                      name="area1.bloodGroup" 
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 bg-white"
                                    >
                                      <option value="">Select Blood Group</option>
                                      <option value="A+">A+</option>
                                      <option value="A-">A−</option>
                                      <option value="B+">B+</option>
                                      <option value="B-">B−</option>
                                      <option value="AB+">AB+</option>
                                      <option value="AB-">AB−</option>
                                      <option value="O+">O+</option>
                                      <option value="O-">O−</option>
                                    </Field>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Advanced Tests Section */}
                    <div className="space-y-8">
                      {/* Renal Function Test */}
                      <div className="bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                          <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-white bg-white/20 checked:bg-white checked:text-purple-600 focus:ring-2 focus:ring-white"
                                checked={selectedUnits.renalFunction || false}
                                onChange={() => handleSelectAllTestsInUnit('renalFunction')}
                              />
                              <i className="fas fa-kidneys"></i>
                              Renal Function Test
                            </label>
                          </h3>
                        </div>
                        {selectedUnits.renalFunction && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                    Test
                                  </th>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                    Value
                                  </th>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                    Status
                                  </th>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                    Range
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {['urea', 'creatinine', 'fastingBloodSugar'].map((test) => (
                                  <TableRow
                                    key={test}
                                    testName={test.replace(/([A-Z])/g, ' $1')}
                                    namePrefix={`renalFunction.${test}`}
                                    rangePlaceholder="Range"
                                    disabled={!selectedUnits.renalFunction}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Advanced Tests Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Full Haemogram Section */}
                        <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
                          <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                            <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="w-5 h-5 rounded border-white bg-white/20 checked:bg-white checked:text-red-600 focus:ring-2 focus:ring-white" 
                                  checked={selectedUnits.fullHaemogram || false} 
                                  onChange={() => handleSelectAllTestsInUnit('fullHaemogram')} 
                                />
                                <i className="fas fa-heartbeat"></i>
                                Full Haemogram
                              </label>
                            </h3>
                          </div>
                          {selectedUnits.fullHaemogram && (
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-red-50 to-rose-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Test</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Value</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Units</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Range</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {['wbc', 'lym', 'mid', 'gran', 'rbc', 'mcv', 'hgb', 'hct', 'mch', 'mchc', 'rwd', 'plcr', 'plt', 'mpv', 'pct', 'pdw'].map((test) => (
                                    <TableRow
                                      key={test}
                                      testName={test.toUpperCase()}
                                      namePrefix={`fullHaemogram.${test}`}
                                      unitsPlaceholder="Units"
                                      rangePlaceholder="Range"
                                      disabled={!selectedUnits.fullHaemogram}
                                      editableUnits={true}
                                    />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Liver Function and Assessment */}
                        <div className="space-y-8">
                          {/* Liver Function Test Section */}
                          <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
                              <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-white bg-white/20 checked:bg-white checked:text-orange-600 focus:ring-2 focus:ring-white" 
                                    checked={selectedUnits.liverFunction || false} 
                                    onChange={() => handleSelectAllTestsInUnit('liverFunction')} 
                                  />
                                  <i className="fas fa-liver"></i>
                                  Liver Function
                                </label>
                              </h3>
                            </div>
                            {selectedUnits.liverFunction && (
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                                  <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Test</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Value</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Range</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {['totalBilirubin', 'directBilirubin', 'indirectBilirubin', 'sgot', 'sgpt', 'gammaGt', 'alkalinePhosphate', 'totalProteins', 'albumin1'].map((test) => (
                                      <TableRow
                                        key={test}
                                        testName={test.replace(/([A-Z])/g, ' $1')}
                                        namePrefix={`liverFunction.${test}`}
                                        rangePlaceholder="Range"
                                        disabled={!selectedUnits.liverFunction}
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Assessment Section */}
                          <div className="bg-white rounded-xl shadow-lg border border-teal-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <i className="fas fa-clipboard-check"></i>
                                Medical Assessment
                              </h3>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 space-y-6">
                              {/* Fitness Evaluation */}
                              <div className="bg-white rounded-lg p-6 border border-teal-200 shadow-sm">
                                <h4 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
                                  <i className="fas fa-user-check"></i>
                                  Fitness Evaluation
                                </h4>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                      Does applicant appear fit in all other respects?
                                    </label>
                                    <select 
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200"
                                      value={otherAspectsFit}
                                      onChange={(e) => setOtherAspectsFit(e.target.value)}
                                    >
                                      <option value="">Select...</option>
                                      <option value="YES">YES</option>
                                      <option value="NO">NO</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                      In my opinion, I find the applicant
                                    </label>
                                    <select 
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200"
                                      value={overallStatus}
                                      onChange={(e) => setOverallStatus(e.target.value)}
                                    >
                                      <option value="">Select status...</option>
                                      <option value="FIT">FIT</option>
                                      <option value="UNFIT">UNFIT</option>
                                      <option value="NOT SURE">NOT SURE</option>
                                    </select>
                                    <span className="text-gray-600 text-sm mt-1 block">for employment.</span>
                                  </div>
                                </div>
                              </div>

                              {/* Lab Superintendent */}
                              <div className="bg-white rounded-lg p-6 border border-teal-200 shadow-sm">
                                <h4 className="text-lg font-bold text-teal-700 mb-4 flex items-center gap-2">
                                  <i className="fas fa-user-md"></i>
                                  Lab Superintendent
                                </h4>
                                <div>
                                  <label className="block text-gray-700 font-medium mb-2">
                                    Superintendent Name:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter Lab Superintendent Name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200"
                                    value={labSuperintendent}
                                    onChange={(e) => setLabSuperintendent(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Submit Button */}
                {(!isViewMode || isEditMode) && (
                  <div className="flex justify-center pt-8">
                    <button 
                      type="submit" 
                      className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    >
                      <span className="flex items-center gap-3">
                        <i className="fas fa-save text-xl"></i>
                        {existingLabData ? 'UPDATE LAB REPORT' : 'SUBMIT LAB REPORT'}
                      </span>
                      <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </button>
                  </div>
                )}

              </Form>
            )}
          </Formik>

        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200">
              <i className="fas fa-user-plus text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Patient Selected</h3>
              <p className="text-gray-500">Please select a patient to view their lab reports.</p>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </>
  );
};

export default Lab;