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

const Lab = () => {
  const { patientData, updatePateintData } = usePatient();
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
        const response = await axios.get('http://localhost:5000/api/number');
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
      const response = await axios.get(`http://localhost:5000/api/lab/${patientId}/${labNumber}`);
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

  // Functions to render existing data in view mode
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

    return (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">{sectionTitle}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {validEntries.map(([key, value]) => (
            <div key={key} className="flex justify-between bg-white p-2 rounded shadow-sm">
              <span className="font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}:
              </span>
              <span className="text-gray-900 font-semibold">{String(value)}</span>
            </div>
          ))}
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

    return (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">{sectionTitle}</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left border border-gray-200 font-semibold">Test</th>
                <th className="px-4 py-2 text-left border border-gray-200 font-semibold">Value</th>
                <th className="px-4 py-2 text-left border border-gray-200 font-semibold">Units</th>
                <th className="px-4 py-2 text-left border border-gray-200 font-semibold">Status</th>
                <th className="px-4 py-2 text-left border border-gray-200 font-semibold">Range</th>
              </tr>
            </thead>
            <tbody>
              {validEntries.map(([test, values]) => (
                <tr key={test} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium border border-gray-200">
                    {test.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </td>
                  <td className="px-4 py-2 border border-gray-200">{values.value || '-'}</td>
                  <td className="px-4 py-2 border border-gray-200">{values.units || '-'}</td>
                  <td className="px-4 py-2 border border-gray-200">
                    <span className={`px-2 py-1 rounded text-sm ${
                      values.status === 'Normal' ? 'bg-green-100 text-green-800' :
                      values.status === 'Abnormal' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {values.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border border-gray-200">{values.range || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
      const response = await axios.post("http://localhost:5000/api/lab", payload);
      const data = response.data;
      console.log("Response data:", data);
      
      if (data.success) {
        // Mark the lab number as completed
        try {
          await axios.put("http://localhost:5000/api/number/complete", {
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



  // Filter patients based on the search term
  const filteredPatients = patientData.patients.filter((patient) =>
    patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg shadow-lg">
                  {/* Patient Image Display */}
                  <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
                    {selectedPatient ? (
                      patientData.patients
                        .filter((patient) => patient.name === selectedPatient)
                        .map((patient) => (
                          <div key={patient.labNumber} className="flex flex-col items-center space-y-4">
                            {/* Patient Image */}
                            {patient.photo ? (
                              <img
                                src={`data:image/jpeg;base64,${patient.photo}`}
                                alt={`${patient.name}`}
                                className="w-40 h-40 rounded-full shadow-lg object-cover border-4 border-blue-500 transition-transform transform hover:scale-105"
                              />
                            ) : (
                              <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold shadow-lg">
                                No Image
                              </div>
                            )}

                            {/* Patient Details */}
                            <h2 className="text-lg font-bold text-gray-800">{patient.name}</h2>
                            <p className="text-gray-500 text-sm italic">
                              Lab Number: <span className="font-semibold">{selectedLabNumber}</span>
                            </p>
                            <p className="text-gray-500 text-sm italic">
                              Medical Type: <span className="font-semibold">{selectedPatientData?.medicalType || 'N/A'}</span>
                            </p>
                          </div>
                        ))
                    ) : (
                      <div className="text-gray-500 italic">No patient selected.</div>
                    )}
                  </div>

                  {/* Search and Dropdown */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    {/* Search Input */}
                    <div className="mb-6">
                      <label
                        className="block text-gray-600 font-semibold mb-2"
                        htmlFor="patientSearch"
                      >
                        <i className="fas fa-search mr-2 text-blue-500"></i>Search Patient
                      </label>
                      <input
                        type="text"
                        id="patientSearch"
                        placeholder="Search by name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Dropdown for Selecting Patient */}
                    <div>
                      <label
                        className="block text-gray-600 font-semibold mb-2"
                        htmlFor="patientSelect"
                      >
                        <i className="fas fa-user mr-2 text-blue-500"></i>Select Patient
                      </label>
                      <select
                        id="patientSelect"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-gray-700 bg-white"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        disabled={!patientData.patients || patientData.patients.length === 0}
                      >
                        {/* Default option */}
                        <option value="Select Patient">Select Patient</option>
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient) => (
                            <option key={patient.labNumber} value={patient.name}>
                              {patient.name}
                            </option>
                          ))
                        ) : (
                          <option>No patients found</option>
                        )}
                      </select>

                      {/* Lab Number Selection */}
                      <div className="max-w-4xl mx-auto">
                        <label className="block text-gray-600 font-semibold mt-5 mb-2">Lab Numbers</label>

                        {loading && <div className="text-center text-gray-500">Loading...</div>}
                        {error && <div className="text-center text-red-500">{error}</div>}

                        {!loading && !error && labNumbers.length > 0 ? (
                          <div>
                            <div className="mb-6">
                              <input
                                type="text"
                                placeholder="Search Lab Number"
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
                              />
                            </div>

                            <div className="relative mb-6">
                              <select
                                value={selectedLabNumber}
                                onChange={handleSelectChange}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
                              >
                                <option value="">Select Lab Number</option>
                                {filteredLabNumbers.map((lab) => (
                                  <option key={lab._id} value={lab.number}>
                                    {lab.number}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {selectedLabNumber && (
                              <div className="mt-4 text-sm text-gray-700">
                                <p>Selected Lab Number: <span className="font-semibold">{selectedLabNumber}</span></p>
                              </div>
                            )}
                          </div>
                        ) : (
                          !loading && !error && (
                            <div className="text-center text-gray-500">No lab numbers available</div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show existing data in view mode */}
                {isViewMode && existingLabData && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-blue-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center bg-blue-100 p-3 rounded">Lab Report Data</h2>
                    
                    {/* Patient Information Section */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">Patient Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex justify-between bg-white p-2 rounded shadow-sm">
                          <span className="font-medium text-gray-700">Patient Name:</span>
                          <span className="text-gray-900 font-semibold">{selectedPatient}</span>
                        </div>
                        <div className="flex justify-between bg-white p-2 rounded shadow-sm">
                          <span className="font-medium text-gray-700">Lab Number:</span>
                          <span className="text-gray-900 font-semibold">{selectedLabNumber}</span>
                        </div>
                        <div className="flex justify-between bg-white p-2 rounded shadow-sm">
                          <span className="font-medium text-gray-700">Report Date:</span>
                          <span className="text-gray-900 font-semibold">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between bg-white p-2 rounded shadow-sm">
                          <span className="font-medium text-gray-700">Report Time:</span>
                          <span className="text-gray-900 font-semibold">{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Render Urine Test Data */}
                    {renderViewData(existingLabData.urineTest, "Urine Test Results")}
                    
                    {/* Render Blood Test Data */}
                    {renderViewData(existingLabData.bloodTest, "Blood Test Results")}
                    
                    {/* Render Laboratory Tests Data */}
                    {renderViewData(existingLabData.area1, "Laboratory Test Results")}
                    
                    {/* Render Renal Function Test Data */}
                    {renderTableViewData(existingLabData.renalFunction, "Renal Function Test Results")}
                    
                    {/* Render Full Haemogram Data */}
                    {renderTableViewData(existingLabData.fullHaemogram, "Full Haemogram Results")}
                    
                    {/* Render Liver Function Test Data */}
                    {renderTableViewData(existingLabData.liverFunction, "Liver Function Test Results")}
                    
                    {/* Render Lab Remarks */}
                    {existingLabData.labRemarks && (
                      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-lg font-semibold text-green-800 mb-3">Lab Remarks</h4>
                        <div className="space-y-2">
                          <div className="bg-white p-2 rounded shadow-sm">
                            <strong className="text-gray-700">Fit in other aspects:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                              existingLabData.labRemarks.fitnessEvaluation?.otherAspectsFit === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {existingLabData.labRemarks.fitnessEvaluation?.otherAspectsFit}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded shadow-sm">
                            <strong className="text-gray-700">Overall Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                              existingLabData.labRemarks.fitnessEvaluation?.overallStatus === 'FIT' ? 'bg-green-100 text-green-800' : 
                              existingLabData.labRemarks.fitnessEvaluation?.overallStatus === 'UNFIT' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {existingLabData.labRemarks.fitnessEvaluation?.overallStatus}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded shadow-sm">
                            <strong className="text-gray-700">Lab Superintendent:</strong> 
                            <span className="ml-2 text-gray-900 font-semibold">{existingLabData.labRemarks.labSuperintendent?.name}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show message if no data found */}
                    {(!existingLabData.urineTest || Object.keys(existingLabData.urineTest || {}).length === 0) &&
                     (!existingLabData.bloodTest || Object.keys(existingLabData.bloodTest || {}).length === 0) &&
                     (!existingLabData.area1 || Object.keys(existingLabData.area1 || {}).length === 0) &&
                     (!existingLabData.renalFunction || Object.keys(existingLabData.renalFunction || {}).length === 0) &&
                     (!existingLabData.fullHaemogram || Object.keys(existingLabData.fullHaemogram || {}).length === 0) &&
                     (!existingLabData.liverFunction || Object.keys(existingLabData.liverFunction || {}).length === 0) && (
                      <div className="text-center p-6 bg-gray-100 rounded-lg">
                        <p className="text-gray-600 text-lg">No lab test data found for this report.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show form inputs only when not in view mode or when editing */}
                {(!isViewMode || isEditMode) && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Urine Test Section */}
                      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                        <h3 className="flex items-center gap-4 text-xl font-semibold mb-4">
                          <label className="flex items-center gap-4 text-black">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.urineTest || false} onChange={() => handleUnitSelect('urineTest')} /> <b>Urine Test</b></label>
                          {selectedUnits.urineTest && (
                            <label className="flex items-center gap-2 text-sm text-black"><input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectAll.urineTest || false} onChange={() => handleSelectAllTests('urineTest')} />Select All</label>)}
                        </h3>
                        {selectedUnits.urineTest && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className='flex items-center gap-2'><input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.urineTest?.albumin || false} onChange={() => handleTestSelect('urineTest', 'albumin')} /> Albumin:</label>
                              {selectedTests.urineTest?.albumin && (<Field name="urineTest.albumin" className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" type="text" />)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className='flex items-center gap-2'><input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.urineTest?.sugar || false} onChange={() => handleTestSelect('urineTest', 'sugar')} /> Sugar:</label>
                              {selectedTests.urineTest?.sugar && (<Field name="urineTest.sugar" className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" type="text" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className='flex items-center gap-2'><input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.urineTest?.microscopic || false} onChange={() => handleTestSelect('urineTest', 'microscopic')} /> Microscopic:</label>
                              {selectedTests.urineTest?.microscopic && (<Field className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" name="urineTest.microscopic" type="text" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className='flex items-center gap-2'><input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.urineTest?.reaction || false} onChange={() => handleTestSelect('urineTest', 'reaction')} /> Reaction:</label>
                              {selectedTests.urineTest?.reaction && (<Field className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" name="urineTest.reaction" type="text" />)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Blood Test Section */}
                      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                        <h3 className='flex items-center gap-4 text-xl font-semibold mb-4 text-black'>
                          <label className="flex items-center gap-2 text-black">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.bloodTest || false} onChange={() => handleUnitSelect('bloodTest')} /><b>Blood Test</b></label>
                          {selectedUnits.bloodTest && (
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectAll.bloodTest || false} onChange={() => handleSelectAllTests('bloodTest')} />Select All</label>)}
                        </h3>
                        {selectedUnits.bloodTest && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className="flex items-center gap-2 text-black"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black" checked={selectedTests.bloodTest?.hivTest || false} onChange={() => handleTestSelect('bloodTest', 'hivTest')} /> HIV Test (I, II):</label>
                              {selectedTests.bloodTest?.hivTest && (<Field className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" name="bloodTest.hivTest" type="text" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className="flex items-center gap-2 text-black"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black" checked={selectedTests.bloodTest?.hbsAg || false} onChange={() => handleTestSelect('bloodTest', 'hbsAg')} /> HbsAg:</label>
                              {selectedTests.bloodTest?.hbsAg && (<Field className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" name="bloodTest.hbsAg" type="text" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className="flex items-center gap-2 text-black"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black" checked={selectedTests.bloodTest?.hcv || false} onChange={() => handleTestSelect('bloodTest', 'hcv')} /> HCV:</label>
                              {selectedTests.bloodTest?.hcv && (<Field className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" name="bloodTest.hcv" type="text" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <label className="flex items-center gap-2 text-black"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black" checked={selectedTests.bloodTest?.esr || false} onChange={() => handleTestSelect('bloodTest', 'esr')} /> ESR(1stHR):</label>
                              {selectedTests.bloodTest?.esr && (<Field className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" name="bloodTest.esr" type="text" />)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Laboratory Test Section */}
                    <div className="grid grid-cols-4 gap-2 mb-8 p-6 bg-gray-50 rounded-lg">
                      <h3 className='flex items-center gap-4 text-xl font-semibold mb-4 text-black'>
                        <label className="flex items-center gap-2 text-black">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.area1 || false} onChange={() => handleUnitSelect('area1')} /><b>Laboratory Tests</b></label>
                        {selectedUnits.area1 && (
                          <label> <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectAll.area1 || false} onChange={() => handleSelectAllTests('area1')} />Select All</label>)}
                      </h3>
                      {selectedUnits.area1 && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.stoolConsistency || false} onChange={() => handleTestSelect('area1', 'stoolConsistency')} /> stool Consistency:</label>
                            {selectedTests.area1?.stoolConsistency && (<Field name="area1.stoolConsistency" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.stoolMicroscopy || false} onChange={() => handleTestSelect('area1', 'stoolMicroscopy')} /> stoolMicroscopy:</label>
                            {selectedTests.area1?.stoolMicroscopy && (<Field name="area1.stoolMicroscopy" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.tpha || false} onChange={() => handleTestSelect('area1', 'tpha')} /> TPHA:</label>
                            {selectedTests.area1?.tpha && (<Field name="area1.tpha" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.vdrlTest || false} onChange={() => handleTestSelect('area1', 'vdrlTest')} /> VDRL Test:</label>
                            {selectedTests.area1?.vdrlTest && (<Field name="area1.vdrlTest" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.venerealDisease || false} onChange={() => handleTestSelect('area1', 'venerealDisease')} /> venereal Disease:</label>
                            {selectedTests.area1?.venerealDisease && (<Field name="area1.venerealDisease" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.pregnancyTest || false} onChange={() => handleTestSelect('area1', 'pregnancyTest')} /> Pregnancy Test:</label>
                            {selectedTests.area1?.pregnancyTest && (<Field name="area1.pregnancyTest" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.typhoid || false} onChange={() => handleTestSelect('area1', 'typhoid')} /> Typhoid:</label>
                            {selectedTests.area1?.typhoid && (<Field name="area1.typhoid" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.otherDeformities || false} onChange={() => handleTestSelect('area1', 'otherDeformities')} /> Other Deformities:</label>
                            {selectedTests.area1?.otherDeformities && (<Field name="area1.otherDeformities" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.earRight || false} onChange={() => handleTestSelect('area1', 'earRight')} /> Ear Right:</label>
                            {selectedTests.area1?.earRight && (<Field name="area1.earRight" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.earLeft || false} onChange={() => handleTestSelect('area1', 'earLeft')} /> Ear Left:</label>
                            {selectedTests.area1?.earLeft && (<Field name="area1.earLeft" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.lungs || false} onChange={() => handleTestSelect('area1', 'lungs')} /> Lungs:</label>
                            {selectedTests.area1?.lungs && (<Field name="area1.lungs" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.liver || false} onChange={() => handleTestSelect('area1', 'liver')} /> Liver:</label>
                            {selectedTests.area1?.liver && (<Field name="area1.liver" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label><input type="checkbox" checked={selectedTests.area1?.spleen || false} onChange={() => handleTestSelect('area1', 'spleen')} /> spleen:</label>
                            {selectedTests.area1?.spleen && (<Field name="area1.spleen" type="text" />)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <label>
                              <input
                                type="checkbox"
                                checked={selectedTests.area1?.bloodGroup || false}
                                onChange={() => handleTestSelect('area1', 'bloodGroup')}
                              /> Blood Group:
                            </label>

                            {selectedTests.area1?.bloodGroup && (
                              <Field as="select" name="area1.bloodGroup" className="border rounded px-2 py-1">
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A−</option>
                                <option value="B+">B+</option>
                                <option value="B-">B−</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB−</option>
                                <option value="O+">O+</option>
                                <option value="O-">O−</option>
                              </Field>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Renal Function Test Section */}
                    <div className="overflow-x-auto">
                      <h3 className="flex items-center gap-4 text-xl font-semibold mb-4 text-black">
                        <label className="flex items-center gap-2 text-black">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300"
                            checked={selectedUnits.renalFunction || false}
                            onChange={() => handleSelectAllTestsInUnit('renalFunction')}
                          />{' '}
                          Renal Function Test
                        </label>
                      </h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Test
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Range
                            </th>
                          </tr>
                        </thead>
                        <tbody>
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

                    {/* Full Haemogram Section */}
                    <div className='grid grid-cols-2 gap-3 mt-10'>
                      <div className="overflow-x-auto">
                        <h3 className='flex items-center gap-4 text-xl font-semibold mb-4 text-black'>
                          <label className="flex items-center gap-2 text-black">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.fullHaemogram || false} onChange={() => handleSelectAllTestsInUnit('fullHaemogram')} /> Full Haemogram Report</label>
                        </h3>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['wbc', 'lym', 'mid', 'gran', 'rbc', 'mcv', 'hgb', 'hct', 'mch', 'mchc', 'rwd', 'plcr', 'plt', 'mpv', 'pct', 'pdw'].map((test) => (
                              <TableRow
                                key={test}
                                testName={test.toUpperCase()}
                                namePrefix={`fullHaemogram.${test}`}
                                unitsPlaceholder="Units"
                                rangePlaceholder="Range"
                                disabled={!selectedUnits.fullHaemogram}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Liver Function Test Section */}
                      <div className="overflow-x-auto">
                        <h3 className='flex items-center gap-4 text-xl font-semibold mb-4 text-black'>
                          <label className="flex items-center gap-2 text-black">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.liverFunction || false} onChange={() => handleSelectAllTestsInUnit('liverFunction')} /> Liver Function Test</label>
                        </h3>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                            </tr>
                          </thead>
                          <tbody>
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

                        {/* Lab Remarks */}
                        <div className="bg-gray-100 flex flex-col items-center justify-center p-6">
                          {/* Fitness Evaluation Section */}
                          <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
                            <h3 className="text-2xl font-bold text-teal-600 mb-6 text-center">
                              Fitness Evaluation
                            </h3>

                            {/* First Dropdown for Other Aspects */}
                            <div className="mb-2">
                              <label className="block text-gray-700 font-medium mb-2">
                                Does applicant appear fit in all other respects?
                              </label>
                              <select className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                                value={otherAspectsFit}
                                onChange={(e) => setOtherAspectsFit(e.target.value)}
                              >
                                <option value="" disabled>Select</option>
                                <option value="YES">YES</option>
                                <option value="NO">NO</option>
                              </select>
                            </div>

                            {/* Second Dropdown for Overall Opinion */}
                            <div className="mb-2">
                              <label className="block text-gray-700 font-medium mb-2">
                                In my opinion, I find the applicant
                                <select className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                                  value={overallStatus}
                                  onChange={(e) => setOverallStatus(e.target.value)}
                                >
                                  <option value="" disabled>Select</option>
                                  <option value="FIT">FIT</option>
                                  <option value="UNFIT">UNFIT</option>
                                  <option value="NOT SURE">NOT SURE</option>
                                </select>
                                for employment.
                              </label>
                            </div>
                          </div>

                          {/* Lab Superintendent Section */}
                          <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg mt-2">
                            <h3 className="text-2xl font-bold text-teal-600 mb-6 text-center">
                              Lab Superintendent
                            </h3>
                            <label className="block text-gray-700 font-medium mb-2">
                              Name:
                              <input
                                type="text"
                                placeholder="Enter Lab Superintendent Name"
                                className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                                value={labSuperintendent}
                                onChange={(e) => setLabSuperintendent(e.target.value)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {(!isViewMode || isEditMode) && (
                  <button 
                    type="submit" 
                    className="mt-10 w-1/4 bg-blue-500 hover:bg-blue-600 text-white text-[16px] font-semibold py-2 px-4 rounded shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    <FaSave className='inline mr-3' />
                    {existingLabData ? 'UPDATE LAB REPORT' : 'SUBMIT LAB REPORT'}
                  </button>
                )}

              </Form>
            )}
          </Formik>

        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg font-semibold text-gray-600">
              Please select a patient to view their lab reports.
            </div>
          </div>
        )};

      </div>
      <Footer />
    </>
  );
};

export default Lab;