import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { usePatient } from '../../context/patientContext';
import 'react-toastify/dist/ReactToastify.css';
import img from '../../assets/logo1-removebg-preview.png';
import TopBar from '../../components/TopBar';
import { API_BASE_URL } from '../../config/api.config';

const Phlebotomy = () => {
  const { patientData } = usePatient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [labNumber, setLabNumber] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [labCounter, setLabCounter] = useState(1);
  const [submittedLabNumbers, setSubmittedLabNumbers] = useState([]);
  
  // New states for direct patient data fetching
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  // New states for sidebar functionality
  const [patientsWithoutLabNumbers, setPatientsWithoutLabNumbers] = useState([]);
  const [filteredSidebarPatients, setFilteredSidebarPatients] = useState([]);
  const [loadingSidebarPatients, setLoadingSidebarPatients] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Search and filter states for sidebar
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Today's date
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today's date

  const fetchLabNumbers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/number`);
      console.log('Fetched lab numbers:', res.data.labNumbers);
      toast.success('Lab numbers fetched successfully');
      setSubmittedLabNumbers(res.data.labNumbers);
      setLabCounter(res.data.labNumbers.length + 1);
    } catch (error) {
      console.error('Error fetching lab numbers:', error);
    }
  };

  const fetchAllPatients = async () => {
    try {
      console.log('Fetching patients for Phlebotomy...');
      const response = await axios.get(`${API_BASE_URL}/api/patient`);
      console.log('Fetched patients response:', response.data);
      
      // Handle different response structures - backend returns array directly
      const patientsData = Array.isArray(response.data) ? response.data : (response.data.patients || []);
      console.log('Processed patients data:', patientsData);
      
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      toast.success(`Loaded ${patientsData.length} patients for lab work`);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients data.');
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientsWithoutLabNumbers = async () => {
    try {
      console.log('Fetching patients without lab numbers...');
      const response = await axios.get(`${API_BASE_URL}/api/patient/without-lab-numbers`);
      console.log('Patients without lab numbers:', response.data);
      
      const patientsData = Array.isArray(response.data) ? response.data : [];
      setPatientsWithoutLabNumbers(patientsData);
      
      // Don't apply filtering here, let useEffect handle it
    } catch (error) {
      console.error('Error fetching patients without lab numbers:', error);
      toast.error('Failed to fetch pending patients.');
      setPatientsWithoutLabNumbers([]);
      setFilteredSidebarPatients([]);
    } finally {
      setLoadingSidebarPatients(false);
    }
  };

  const filterSidebarPatients = (patients, searchQuery, startDateFilter, endDateFilter) => {
    let filtered = patients;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.medicalType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDateFilter || endDateFilter) {
      filtered = filtered.filter(patient => {
        const patientDate = new Date(patient.createdAt).toISOString().split('T')[0];
        const start = startDateFilter || '1900-01-01';
        const end = endDateFilter || '2099-12-31';
        return patientDate >= start && patientDate <= end;
      });
    }

    setFilteredSidebarPatients(filtered);
  };

  const handleSidebarSearch = (query) => {
    setSidebarSearchQuery(query);
    filterSidebarPatients(patientsWithoutLabNumbers, query, startDate, endDate);
  };

  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    filterSidebarPatients(patientsWithoutLabNumbers, sidebarSearchQuery, newStartDate, newEndDate);
  };

  const resetSidebarFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setSidebarSearchQuery('');
    setStartDate(today);
    setEndDate(today);
    filterSidebarPatients(patientsWithoutLabNumbers, '', today, today);
  };

  useEffect(() => {
    fetchLabNumbers();
    fetchAllPatients();
    fetchPatientsWithoutLabNumbers();

    // Listen for lab report submissions to refresh the list
    const handleLabReportSubmission = () => {
      fetchLabNumbers();
    };

    // Listen for lab number submissions to refresh sidebar
    const handleLabNumberSubmission = () => {
      fetchPatientsWithoutLabNumbers();
    };

    window.addEventListener('labReportSubmitted', handleLabReportSubmission);
    window.addEventListener('labNumberSubmitted', handleLabNumberSubmission);

    return () => {
      window.removeEventListener('labReportSubmitted', handleLabReportSubmission);
      window.removeEventListener('labNumberSubmitted', handleLabNumberSubmission);
    };
  }, []);

  // Filter sidebar patients when data or filters change
  useEffect(() => {
    filterSidebarPatients(patientsWithoutLabNumbers, sidebarSearchQuery, startDate, endDate);
  }, [patientsWithoutLabNumbers, sidebarSearchQuery, startDate, endDate]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredPatients(
      patients.filter((patient) =>
        patient.name.toLowerCase().includes(query)
      )
    );
  };

  const handleSidebarPatientSelect = (patient) => {
    setSelectedPatient(patient.name);
    setSearchQuery(patient.name);
    // Ensure the patient is in the filtered list
    if (!filteredPatients.find(p => p.name === patient.name)) {
      setFilteredPatients([patient, ...patients.filter(p => p.name !== patient.name)]);
    }
    toast.info(`Selected patient: ${patient.name}`);
  };

  const selectedPatientData = selectedPatient
    ? patients.find((p) => p.name === selectedPatient)
    : null;

  const generateLabNumber = async () => {
    if (!selectedPatientData) {
      toast.warning('Please select a patient first.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/number/generate`, {
        patientId: selectedPatientData._id,
        medicalType: selectedPatientData.medicalType,
        passportNumber: selectedPatientData.passportNumber,
      });

      if (response.data.success) {
        setLabNumber(response.data.labNumber);
        setSubmissionStatus('');
        toast.success(`Lab number generated successfully! Series: ${response.data.series}`);
      } else {
        toast.error('Failed to generate lab number');
      }
    } catch (error) {
      console.error('Error generating lab number:', error);
      toast.error('Failed to generate lab number');
    }
  };

  const submitLabNumber = async () => {
    if (!labNumber || !selectedPatientData) {
      toast.error('Please generate a lab number and select a patient first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/number`, {
        number: labNumber,
        patient: selectedPatientData.name,
      });

      setSubmissionStatus(`Lab number submitted successfully: ${response.data.labNumber}`);
      toast.success(`Lab number submitted successfully`);
      setLabCounter((prev) => prev + 1);
      setLabNumber('');
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent('labNumberSubmitted', {
        detail: {
          labNumber: response.data.labNumber.number,
          patientName: selectedPatientData.name,
          submittedData: response.data.labNumber
        }
      });
      window.dispatchEvent(event);
      
      fetchLabNumbers(); // Refresh list
    } catch (error) {
      toast.error('Failed to submit lab number. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setFilteredPatients(patientData?.patients || []);
    setSelectedPatient('');
    setLabNumber('');
    setSubmissionStatus('');
  };

  const copyToClipboard = () => {
    if (labNumber) {
      navigator.clipboard.writeText(labNumber);
      toast.info('Lab number copied to clipboard.');
    }
  };

  const BarcodeComponent = ({ value }) => (
    <svg className="w-64 h-24 mt-2">
      {value.split('').map((char, index) => (
        <rect
          key={index}
          x={index * 2}
          y={0}
          width={1}
          height={40}
          fill={char.charCodeAt(0) % 2 === 0 ? 'black' : 'white'}
        />
      ))}
      <text x="0" y="60" className="text-xs font-mono">{value}</text>
    </svg>
  );

  const PatientDetailsCard = ({ patient, labNumber }) => (
    <div className="p-8 bg-gray-900 rounded-xl shadow-2xl border-2 border-teal-500/30">
      <h3 className="text-2xl font-bold text-teal-400 mb-6">Patient Details</h3>
      <div className="flex items-start space-x-6">
        {patient.photo && (
          <img
            src={`data:image/jpeg;base64,${patient.photo}`}
            alt="Patient"
            className="w-32 h-32 rounded-lg border-2 border-teal-500/30 object-cover"
          />
        )}
        <div className="flex-1">
          <p className="text-gray-300 mb-2">
            <strong className="text-teal-400">Name:</strong> {patient.name}
          </p>
          <p className="text-gray-300 mb-2">
            <strong className="text-teal-400">ID:</strong> {patient.passportNumber}
          </p>
          <p className="text-gray-300 mb-2">
            <strong className="text-teal-400">Medical Type:</strong> {patient.medicalType}
          </p>
          <p className="text-gray-300 mb-2 text-sm">
            <strong className="text-teal-400">Series:</strong> 
            {patient.medicalType === 'SM-VDRL' ? ' S Series (SMVDRL)' : ' F Series (Mauritius/Normal/Medical/FM)'}
          </p>
          {labNumber && (
            <>
              <p className="text-teal-300 mt-4 font-mono">Lab Number: {labNumber}</p>
              <BarcodeComponent value={labNumber} />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 transition-all duration-300 z-50 ${
      sidebarCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-bold text-teal-400">Pending Lab Numbers</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-teal-400 transition-colors"
          >
            {sidebarCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
        {!sidebarCollapsed && (
          <div className="mt-1">
            <p className="text-sm text-gray-400">
              {loadingSidebarPatients ? (
                'Loading...'
              ) : (
                <>
                  <span className="text-teal-300 font-medium">{filteredSidebarPatients.length}</span>
                  {filteredSidebarPatients.length !== patientsWithoutLabNumbers.length && (
                    <span> of <span className="text-yellow-300">{patientsWithoutLabNumbers.length}</span></span>
                  )}
                  <span> patients {filteredSidebarPatients.length !== patientsWithoutLabNumbers.length ? 'shown' : 'pending'}</span>
                </>
              )}
            </p>
            {startDate === endDate && startDate === new Date().toISOString().split('T')[0] && (
              <p className="text-xs text-blue-400 mt-1">📅 Today's patients</p>
            )}
          </div>
        )}
      </div>
      
      {!sidebarCollapsed && (
        <div className="p-4">
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search patients..."
              value={sidebarSearchQuery}
              onChange={(e) => handleSidebarSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Date Range Filters */}
          <div className="mb-4 space-y-2">
            <label className="text-xs text-gray-400 font-medium">Date Range</label>
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
                <label className="absolute -top-2 left-2 text-xs text-gray-500 bg-gray-900 px-1">From</label>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
                <label className="absolute -top-2 left-2 text-xs text-gray-500 bg-gray-900 px-1">To</label>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={resetSidebarFilters}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                setSidebarSearchQuery('');
                setStartDate('');
                setEndDate('');
                filterSidebarPatients(patientsWithoutLabNumbers, '', '', '');
              }}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
            >
              All
            </button>
          </div>

          <button
            onClick={fetchPatientsWithoutLabNumbers}
            className="w-full mb-4 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors"
            disabled={loadingSidebarPatients}
          >
            {loadingSidebarPatients ? 'Refreshing...' : 'Refresh List'}
          </button>
          
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {loadingSidebarPatients ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
                <p className="mt-2 text-sm">Loading patients...</p>
              </div>
            ) : filteredSidebarPatients.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">
                  {patientsWithoutLabNumbers.length === 0 
                    ? 'All patients have lab numbers assigned!' 
                    : 'No patients match your filters'
                  }
                </p>
              </div>
            ) : (
              filteredSidebarPatients.map((patient) => (
                <div
                  key={patient._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-800 hover:border-teal-400 ${
                    selectedPatient === patient.name
                      ? 'bg-teal-900/50 border-teal-500 ring-1 ring-teal-500/50'
                      : 'bg-gray-800/50 border-gray-600'
                  }`}
                  onClick={() => handleSidebarPatientSelect(patient)}
                >
                  <div className="flex items-start space-x-3">
                    {patient.photo ? (
                      <img
                        src={`data:image/jpeg;base64,${patient.photo}`}
                        alt="Patient"
                        className="w-10 h-10 rounded-full object-cover border border-gray-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{patient.name}</p>
                      <p className="text-xs text-gray-400 truncate">{patient.passportNumber}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          patient.medicalType === 'SM-VDRL' 
                            ? 'bg-red-900/50 text-red-300 border border-red-700/50' 
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                        }`}>
                          {patient.medicalType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {new Date(patient.createdAt).toLocaleDateString()}
                      </p>
                      {selectedPatient === patient.name && (
                        <p className="text-xs text-teal-300 mt-1 font-medium">✓ Selected</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <TopBar />
      <Sidebar />
      <div className={`min-h-screen bg-black text-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-80'
      }`}>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <img src={img} alt="Logo" className="w-24 mx-auto mb-4" />
              <h1 className="text-5xl font-bold text-teal-400">Phlebotomy</h1>
              <p className="text-gray-400">Generate and manage lab numbers</p>
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="text-teal-300 font-semibold">Lab Number Series:</span><br/>
                  <span className="text-yellow-300">F Series:</span> MAURITIUS, NORMAL, MEDICAL, FM<br/>
                  <span className="text-red-300">S Series:</span> SM-VDRL
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <input
                  type="text"
                  placeholder={loadingPatients ? "Loading patients..." : "Search patients..."}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-4 py-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none"
                  disabled={loadingPatients}
                />
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-4 py-3 mb-6 rounded-lg bg-gray-800 border border-gray-700"
                  disabled={loadingPatients}
                >
                  <option value="">
                    {loadingPatients ? 'Loading patients...' : 'Select Patient'}
                  </option>
                  {filteredPatients.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name} - {p.passportNumber} ({p.medicalType})
                    </option>
                  ))}
                </select>

                {selectedPatientData && (
                  <PatientDetailsCard
                    patient={selectedPatientData}
                    labNumber={labNumber}
                  />
                )}
              </div>

              <div className="space-y-6">
                <button
                  onClick={generateLabNumber}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-semibold"
                >
                  Generate Lab Number
                </button>

                {labNumber && (
                  <div className="p-4 bg-gray-800 rounded-lg text-center space-y-4">
                    <p className="text-xl font-bold text-teal-300">Lab Number:</p>
                    <p className="text-lg font-mono">{labNumber}</p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={copyToClipboard}
                        className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={submitLabNumber}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Lab Number'}
                </button>

                <button
                  onClick={resetForm}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg"
                >
                  Reset
                </button>
              </div>
            </div>

            {submittedLabNumbers.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-teal-300 mb-4">Submitted Lab Numbers</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border border-gray-700">
                    <thead>
                      <tr className="bg-gray-800 text-left text-teal-400">
                        <th className="px-4 py-2 border-b border-gray-600">#</th>
                        <th className="px-4 py-2 border-b border-gray-600">Patient</th>
                        <th className="px-4 py-2 border-b border-gray-600">Lab Number</th>
                        <th className="px-4 py-2 border-b border-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedLabNumbers.map((entry, index) => (
                        <tr key={entry._id || index} className="hover:bg-gray-800/50">
                          <td className="px-4 py-2 border-b border-gray-700">{index + 1}</td>
                          <td className="px-4 py-2 border-b border-gray-700">{entry.patient}</td>
                          <td className="px-4 py-2 border-b border-gray-700 font-mono">{entry.number}</td>
                          <td className="px-4 py-2 border-b border-gray-700">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              entry.status === 'completed' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-yellow-600 text-black'
                            }`}>
                              {entry.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Phlebotomy;
