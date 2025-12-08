import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import img from '../../assets/logo1-removebg-preview.png';
import TopBar from '../../components/TopBar';
import { API_BASE_URL } from '../../config/api.config';

const Phlebotomy = () => {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [labNumber, setLabNumber] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [labCounter, setLabCounter] = useState(1);
  const [submittedLabNumbers, setSubmittedLabNumbers] = useState([]);
  
  // States for direct patient data fetching
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Simple search term for selecting a patient
  const [searchTerm, setSearchTerm] = useState('');
  
  // Collapsible medical type folders
  const [expandedTypes, setExpandedTypes] = useState({});
  
  // Pending patients (without lab numbers)
  const [pendingPatients, setPendingPatients] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [activePendingTab, setActivePendingTab] = useState('ALL');
  const [pendingSidebarCollapsed, setPendingSidebarCollapsed] = useState(false);

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
      toast.success(`Loaded ${patientsData.length} patients for lab work`);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients data.');
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPendingPatients = async () => {
    try {
      console.log('Fetching patients without lab numbers...');
      const response = await axios.get(`${API_BASE_URL}/api/patient/without-lab-numbers`);
      const patientsData = Array.isArray(response.data) ? response.data : [];
      setPendingPatients(patientsData);
      console.log(`Found ${patientsData.length} patients without lab numbers`);
    } catch (error) {
      console.error('Error fetching pending patients:', error);
      setPendingPatients([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleFindPatient = () => {
    if (!searchTerm.trim()) {
      toast.info('Enter a name or passport number.');
      return;
    }
    const term = searchTerm.trim().toLowerCase();
    // Prefer exact passport match
    const exactPassport = patients.find(
      (p) => (p.passportNumber || '').toLowerCase() === term
    );
    if (exactPassport) {
      setSelectedPatient(exactPassport.name);
      toast.success(`Selected: ${exactPassport.name}`);
      return;
    }
    // Fallback to name contains
    const nameMatches = patients.filter((p) => (p.name || '').toLowerCase().includes(term));
    if (nameMatches.length === 1) {
      setSelectedPatient(nameMatches[0].name);
      toast.success(`Selected: ${nameMatches[0].name}`);
    } else if (nameMatches.length === 0) {
      toast.error('No patient found. Refine your search.');
    } else {
      toast.info('Multiple matches found. Please be more specific.');
    }
  };

  useEffect(() => {
    fetchLabNumbers();
    fetchAllPatients();
    fetchPendingPatients();

    // Listen for lab report submissions to refresh the list
    const handleLabReportSubmission = () => {
      fetchLabNumbers();
    };

    window.addEventListener('labReportSubmitted', handleLabReportSubmission);

    return () => {
      window.removeEventListener('labReportSubmitted', handleLabReportSubmission);
    };
  }, []);


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
        
        // Enhanced notification for FM patients about workflow
        if (selectedPatientData.medicalType === 'FM') {
          toast.success(`Lab number generated: ${response.data.labNumber} (F-Series)`);
          toast.info('📋 FM patients must complete Clinical Assessment before Lab Testing', {
            autoClose: 6000,
            position: "top-center"
          });
        } else {
          toast.success(`Lab number generated successfully! Series: ${response.data.series}`);
        }
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
        medicalType: selectedPatientData.medicalType,
      });

      setSubmissionStatus(`Lab number submitted successfully: ${response.data.labNumber}`);
      toast.success(`Lab number submitted successfully`);
      setLabCounter((prev) => prev + 1);
      setLabNumber('');
      
      fetchLabNumbers(); // Refresh list
      fetchPendingPatients(); // Refresh pending patients list
    } catch (error) {
      toast.error('Failed to submit lab number. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
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

  return (
    <>
      <TopBar />
      
      {/* Pending Patients Sidebar */}
      {pendingPatients.length > 0 && (
        <div className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-orange-500/30 transition-all duration-300 z-40 shadow-2xl ${
          pendingSidebarCollapsed ? 'w-16' : 'w-96'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-orange-500/30 bg-orange-900/20">
            <div className="flex items-center justify-between">
              {!pendingSidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-orange-300">Pending Lab Numbers</h3>
                    <p className="text-xs text-orange-400/70">{pendingPatients.length} patient{pendingPatients.length !== 1 ? 's' : ''} waiting</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setPendingSidebarCollapsed(!pendingSidebarCollapsed)}
                className="text-orange-400 hover:text-orange-300 transition-colors p-1"
                title={pendingSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {pendingSidebarCollapsed ? (
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
          </div>

          {!pendingSidebarCollapsed && (
            <>
              {/* Medical Type Tabs */}
              <div className="p-3 border-b border-orange-500/20 bg-gray-900/50">
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const medicalTypes = [...new Set(pendingPatients.map(p => p.medicalType))].sort();
                    const tabs = ['ALL', ...medicalTypes];
                    return tabs.map((type) => {
                      const count = type === 'ALL' 
                        ? pendingPatients.length 
                        : pendingPatients.filter(p => p.medicalType === type).length;
                      const isActive = activePendingTab === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setActivePendingTab(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            isActive
                              ? type === 'SM-VDRL'
                                ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400/50'
                                : type === 'ALL'
                                ? 'bg-orange-600 text-white shadow-lg ring-2 ring-orange-400/50'
                                : 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {type} <span className="font-bold">({count})</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Refresh Button */}
              <div className="px-3 py-2 border-b border-gray-700/50">
                <button
                  onClick={() => fetchPendingPatients()}
                  className="w-full px-3 py-2 bg-orange-600/30 hover:bg-orange-600/50 text-orange-200 text-xs rounded transition-colors flex items-center justify-center gap-2"
                  disabled={loadingPending}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingPending ? 'Refreshing...' : 'Refresh List'}
                </button>
              </div>

              {/* Vertical Scrollable Patient List */}
              <div className="overflow-y-auto" style={{ height: 'calc(100vh - 240px)' }}>
                {loadingPending ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                    <p className="mt-2 text-sm">Loading patients...</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {pendingPatients
                      .filter(patient => activePendingTab === 'ALL' || patient.medicalType === activePendingTab)
                      .map((patient) => (
                      <div
                        key={patient._id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${ 
                          selectedPatient === patient.name
                            ? 'bg-orange-900/40 border-orange-500 ring-2 ring-orange-500/50 shadow-orange-500/20'
                            : 'bg-gray-800/50 border-orange-600/30 hover:border-orange-500/60'
                        }`}
                        onClick={() => {
                          setSelectedPatient(patient.name);
                          setSearchTerm(patient.passportNumber);
                          toast.success(`Selected: ${patient.name}`);
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          {patient.photo ? (
                            <img
                              src={`data:image/jpeg;base64,${patient.photo}`}
                              alt="Patient"
                              className="w-12 h-12 rounded-full object-cover border-2 border-orange-400/50 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-orange-700/30 border-2 border-orange-500/50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{patient.name}</p>
                            <p className="text-xs text-gray-400 truncate font-mono">{patient.passportNumber}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${ 
                                patient.medicalType === 'SM-VDRL' 
                                  ? 'bg-red-900/60 text-red-200 border border-red-600/50' 
                                  : 'bg-blue-900/60 text-blue-200 border border-blue-600/50'
                              }`}>
                                {patient.medicalType}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              📅 {new Date(patient.createdAt).toLocaleDateString()}
                            </p>
                            {selectedPatient === patient.name && (
                              <div className="mt-2 flex items-center gap-1">
                                <svg className="w-3 h-3 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-orange-300 font-semibold">Selected - Ready for Lab Number</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingPatients.filter(patient => activePendingTab === 'ALL' || patient.medicalType === activePendingTab).length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">No patients in this category</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Collapsed Sidebar - Icon Only */}
          {pendingSidebarCollapsed && (
            <div className="flex flex-col items-center pt-4 space-y-4">
              <div className="relative">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingPatients.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`min-h-screen bg-black text-gray-200 transition-all duration-300 ${
        pendingPatients.length > 0 && !pendingSidebarCollapsed ? 'ml-96' : pendingPatients.length > 0 ? 'ml-16' : ''
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
            {/* Simple Patient Search */}
            <div className="mb-10 p-6 bg-gray-900 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold text-teal-400 mb-3">Find Patient</h2>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Enter passport number or name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFindPatient(); }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleFindPatient}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
                >
                  Select
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Tip: Prefer exact passport number for precise match.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                {selectedPatientData ? (
                  <PatientDetailsCard
                    patient={selectedPatientData}
                    labNumber={labNumber}
                  />
                ) : (
                  <div className="p-8 bg-gray-900 rounded-xl shadow-2xl border-2 border-teal-500/30 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Patient Selected</h3>
                    <p className="text-gray-500">
                      Please search and select a patient to generate a lab number
                    </p>
                  </div>
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
                <h2 className="text-2xl font-bold text-teal-300 mb-4">
                  Submitted Lab Numbers ({submittedLabNumbers.length})
                </h2>
                <div className="space-y-3">
                  {Object.entries(
                    submittedLabNumbers.reduce((acc, entry) => {
                      const type = entry.medicalType || 'UNKNOWN';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(entry);
                      return acc;
                    }, {})
                  )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([medicalType, entries]) => {
                    const isExpanded = expandedTypes[medicalType];
                    const typeColor = medicalType === 'SM-VDRL' 
                      ? 'border-red-500/30 bg-red-900/10' 
                      : 'border-blue-500/30 bg-blue-900/10';
                    
                    return (
                      <div key={medicalType} className={`border rounded-lg overflow-hidden ${typeColor}`}>
                        {/* Folder Header */}
                        <button
                          onClick={() => setExpandedTypes(prev => ({ ...prev, [medicalType]: !prev[medicalType] }))}
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg 
                              className={`w-5 h-5 text-teal-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-lg font-semibold text-white">{medicalType}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            medicalType === 'SM-VDRL' 
                              ? 'bg-red-600/20 text-red-300' 
                              : 'bg-blue-600/20 text-blue-300'
                          }`}>
                            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                          </span>
                        </button>
                        
                        {/* Folder Content */}
                        {isExpanded && (
                          <div className="bg-gray-900/30">
                            <table className="min-w-full table-auto">
                              <thead>
                                <tr className="bg-gray-800/50 text-left text-teal-400 text-sm">
                                  <th className="px-4 py-2 border-b border-gray-700">#</th>
                                  <th className="px-4 py-2 border-b border-gray-700">Patient</th>
                                  <th className="px-4 py-2 border-b border-gray-700">Lab Number</th>
                                  <th className="px-4 py-2 border-b border-gray-700">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entries.map((entry, idx) => (
                                  <tr key={entry._id || idx} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-2 border-b border-gray-700/50 text-gray-300 text-sm">{idx + 1}</td>
                                    <td className="px-4 py-2 border-b border-gray-700/50 text-gray-200">{entry.patient}</td>
                                    <td className="px-4 py-2 border-b border-gray-700/50 font-mono text-teal-300">{entry.number}</td>
                                    <td className="px-4 py-2 border-b border-gray-700/50">
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
                        )}
                      </div>
                    );
                  })}
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
