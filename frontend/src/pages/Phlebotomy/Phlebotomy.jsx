import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import img from '../../assets/logo1-removebg-preview.png';
import TopBar from '../../components/TopBar';
import { API_BASE_URL } from '../../config/api.config';
import PhlebotomySidebar from './PhlebotomySidebar';
import { getImageUrl } from '../../utils/cloudinaryHelper';

// Helper function to calculate relative time
const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Helper function to check if patient is new (added in last hour)
const isNewPatient = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffHours = diffMs / 3600000;
  return diffHours < 1;
};

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
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Collapsible medical type folders
  const [expandedTypes, setExpandedTypes] = useState({});
  
  // Pending patients (without lab numbers)
  const [pendingPatients, setPendingPatients] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [activePendingTab, setActivePendingTab] = useState('ALL');
  const [pendingSidebarCollapsed, setPendingSidebarCollapsed] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  
  // Search and filter states for pending patients
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [pendingStartDate, setPendingStartDate] = useState(null);
  const [pendingEndDate, setPendingEndDate] = useState(null);
  
  // Modal state for duplicate lab number alert
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateModalData, setDuplicateModalData] = useState(null);

  // Patient photo state (fetched individually — list excludes photos to reduce payload)
  const [selectedPatientPhoto, setSelectedPatientPhoto] = useState(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

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
      // Exclude photos — they are now Cloudinary URLs that load on-demand.
      // Fetching photo data for every patient upfront adds unnecessary payload.
      const response = await axios.get(`${API_BASE_URL}/api/patient?excludePhoto=true`);
      
      // Handle different response structures - backend returns array directly
      const patientsData = Array.isArray(response.data) ? response.data : (response.data.patients || []);
      
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
      setLoadingPending(true);
      const response = await axios.get(`${API_BASE_URL}/api/patient/without-lab-numbers`);
      console.log('Response from /without-lab-numbers:', response.data);
      const patientsData = Array.isArray(response.data) ? response.data : [];
      setPendingPatients(patientsData);
      setLastRefreshTime(new Date());
      console.log(`✅ Found ${patientsData.length} patients without lab numbers`);
      if (patientsData.length > 0) {
        toast.info(`${patientsData.length} patient(s) pending lab number assignment`, { autoClose: 2000 });
      }
    } catch (error) {
      console.error('❌ Error fetching pending patients:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to fetch pending patients');
      setPendingPatients([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const term = value.trim().toLowerCase();
    
    // Search both the main patients list and the pending (newly added) patients list
    const allPatients = [
      ...patients,
      // Include pending patients not already in main list
      ...pendingPatients.filter((pp) => !patients.some((p) => p._id === pp._id)),
    ];

    const matches = allPatients.filter((p) => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.passportNumber || '').toLowerCase().includes(term)
    );
    
    // Limit to top 10 suggestions
    setSearchSuggestions(matches.slice(0, 10));
    setShowSuggestions(matches.length > 0);
  };
  
  const selectPatientFromSuggestion = (patient) => {
    setSearchTerm(patient.name);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    // Check if patient already has lab number
    const normalizedName = patient.name.trim().toLowerCase();
    const existingLab = submittedLabNumbers.find(
      lab => lab.patient.trim().toLowerCase() === normalizedName
    );
    
    if (existingLab) {
      setDuplicateModalData({
        patientName: patient.name,
        passportNumber: patient.passportNumber,
        medicalType: patient.medicalType,
        existingLabNumber: existingLab.number || 'Unknown',
        status: existingLab.status || 'pending'
      });
      setShowDuplicateModal(true);
    } else {
      setSelectedPatient(patient.name);
      toast.success(`Selected: ${patient.name}`);
    }
  };

  const handleFindPatient = () => {
    if (!searchTerm.trim()) {
      toast.info('Enter a name or passport number.');
      return;
    }
    setShowSuggestions(false);
    const term = searchTerm.trim().toLowerCase();
    
    // Helper function to check if patient has lab number
    const checkLabNumberExists = (patientName) => {
      const normalizedName = patientName.trim().toLowerCase();
      return submittedLabNumbers.some(
        lab => lab.patient.trim().toLowerCase() === normalizedName
      );
    };
    
    // Search both main patients list and pending patients (newly added may only be in pending)
    const allPatients = [
      ...patients,
      ...pendingPatients.filter((pp) => !patients.some((p) => p._id === pp._id)),
    ];

    // Prefer exact passport match
    const exactPassport = allPatients.find(
      (p) => (p.passportNumber || '').toLowerCase() === term
    );
    if (exactPassport) {
      setSelectedPatient(exactPassport.name);
      
      // Check if already has lab number
      if (checkLabNumberExists(exactPassport.name)) {
        const existingLab = submittedLabNumbers.find(
          lab => lab.patient.trim().toLowerCase() === exactPassport.name.trim().toLowerCase()
        );
        setDuplicateModalData({
          patientName: exactPassport.name,
          passportNumber: exactPassport.passportNumber,
          medicalType: exactPassport.medicalType,
          existingLabNumber: existingLab?.number || 'Unknown',
          status: existingLab?.status || 'pending'
        });
        setShowDuplicateModal(true);
      } else {
        toast.success(`Selected: ${exactPassport.name}`);
      }
      return;
    }
    
    // Fallback to name contains
    const nameMatches = allPatients.filter((p) => (p.name || '').toLowerCase().includes(term));
    if (nameMatches.length === 1) {
      setSelectedPatient(nameMatches[0].name);
      
      // Check if already has lab number
      if (checkLabNumberExists(nameMatches[0].name)) {
        const existingLab = submittedLabNumbers.find(
          lab => lab.patient.trim().toLowerCase() === nameMatches[0].name.trim().toLowerCase()
        );
        setDuplicateModalData({
          patientName: nameMatches[0].name,
          passportNumber: nameMatches[0].passportNumber,
          medicalType: nameMatches[0].medicalType,
          existingLabNumber: existingLab?.number || 'Unknown',
          status: existingLab?.status || 'pending'
        });
        setShowDuplicateModal(true);
      } else {
        toast.success(`Selected: ${nameMatches[0].name}`);
      }
    } else if (nameMatches.length === 0) {
      toast.error('No patient found. Refine your search.');
    } else {
      toast.info('Multiple matches found. Please be more specific.');
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLabNumbers();
    fetchAllPatients();
    fetchPendingPatients();

    // Listen for lab report submissions to refresh the list
    const handleLabReportSubmission = () => {
      console.log('📢 Lab report submitted event detected');
      fetchLabNumbers();
      fetchPendingPatients();
    };

    window.addEventListener('labReportSubmitted', handleLabReportSubmission);

    return () => {
      window.removeEventListener('labReportSubmitted', handleLabReportSubmission);
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);


  // Also check pendingPatients as fallback — newly added patients may not be in the
  // main `patients` list yet (it's only fetched on mount / after lab submission).
  const selectedPatientData = selectedPatient
    ? patients.find((p) => p.name === selectedPatient) ||
      pendingPatients.find((p) => p.name === selectedPatient)
    : null;

  // Fetch the selected patient's photo whenever the selection changes
  useEffect(() => {
    const fetchPatientPhoto = async () => {
      if (!selectedPatientData?._id) {
        setSelectedPatientPhoto(null);
        return;
      }
      setIsLoadingPhoto(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/patient/${selectedPatientData._id}`);
        setSelectedPatientPhoto(response.data?.photo || null);
      } catch (err) {
        console.error('Failed to fetch patient photo:', err);
        setSelectedPatientPhoto(null);
      } finally {
        setIsLoadingPhoto(false);
      }
    };
    fetchPatientPhoto();
  }, [selectedPatientData?._id]);

  const generateLabNumber = async () => {
    if (!selectedPatientData) {
      toast.warning('Please select a patient first.');
      return;
    }

    // Check if patient already has a lab number
    const normalizedName = selectedPatientData.name.trim().toLowerCase();
    const existingLabNumber = submittedLabNumbers.find(
      lab => lab.patient.trim().toLowerCase() === normalizedName
    );
    
    if (existingLabNumber) {
      setDuplicateModalData({
        patientName: selectedPatientData.name,
        passportNumber: selectedPatientData.passportNumber,
        medicalType: selectedPatientData.medicalType,
        existingLabNumber: existingLabNumber.number,
        status: existingLabNumber.status || 'pending'
      });
      setShowDuplicateModal(true);
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
      // Trim patient name to ensure consistency with database
      const trimmedPatientName = selectedPatientData.name.trim();
      console.log('📤 Submitting lab number:', labNumber, 'for patient:', trimmedPatientName);
      const response = await axios.post(`${API_BASE_URL}/api/number`, {
        number: labNumber.trim(),
        patient: trimmedPatientName,
        medicalType: selectedPatientData.medicalType,
      });

      console.log('✅ Lab number submitted successfully:', response.data);
      setSubmissionStatus(`Lab number submitted successfully: ${response.data.labNumber}`);
      toast.success(`Lab number ${labNumber} submitted successfully for ${selectedPatientData.name}`);
      setLabCounter((prev) => prev + 1);
      setLabNumber('');
      setSelectedPatient('');
      setSearchTerm('');
      
      // Refresh all lists immediately
      console.log('🔄 Refreshing all lists after submission...');
      await fetchLabNumbers(); 
      await fetchPendingPatients();
      await fetchAllPatients();
      
      toast.info('Lists refreshed - patient moved from pending', { autoClose: 2000 });
    } catch (error) {
      console.error('❌ Submission error:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to submit lab number. Please try again.');
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

  // Enhanced Modal Component for Duplicate Lab Number Alert
  const DuplicateLabNumberModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gray-900 rounded-2xl shadow-2xl border-2 border-red-500/50 max-w-md w-full transform animate-slideIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Lab Number Exists</h3>
                <p className="text-red-100 text-sm">This patient already has an assigned lab number</p>
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Patient Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Patient Information</p>
              <p className="text-white font-semibold text-lg">{data.patientName}</p>
              <p className="text-gray-300 text-sm mt-1">{data.passportNumber}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                data.medicalType === 'SM-VDRL' 
                  ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                  : 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
              }`}>
                {data.medicalType}
              </span>
            </div>
            
            {/* Existing Lab Number */}
            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg p-4 border-2 border-orange-500/50">
              <p className="text-orange-400 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Existing Lab Number
              </p>
              <p className="text-white font-mono text-xl font-bold">{data.existingLabNumber}</p>
              <p className="text-gray-400 text-xs mt-2">Status: <span className="text-yellow-400 font-semibold">{data.status || 'Pending'}</span></p>
            </div>
            
            {/* Warning Message */}
            <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-300 font-semibold text-sm">Cannot Generate New Lab Number</p>
                  <p className="text-red-400/80 text-xs mt-1">
                    A lab number has already been assigned to this patient. Please use the existing lab number for sample collection.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 bg-gray-800/30 rounded-b-2xl flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(data.existingLabNumber);
                toast.success('Lab number copied to clipboard!');
              }}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Number
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PatientDetailsCard = ({ patient, labNumber }) => (
    <div className="p-8 bg-gray-900 rounded-xl shadow-2xl border-2 border-teal-500/30">
      <h3 className="text-2xl font-bold text-teal-400 mb-6">Patient Details</h3>
      <div className="flex items-start gap-6">
        {/* Photo block */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          {isLoadingPhoto ? (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-800 to-teal-900 flex items-center justify-center shadow-xl border-4 border-teal-600">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-300" />
            </div>
          ) : selectedPatientPhoto ? (
            <div className="relative">
              <img
                src={getImageUrl(selectedPatientPhoto, { width: 128, height: 128, crop: 'fill' })}
                alt={patient.name}
                className="w-32 h-32 rounded-full shadow-xl object-cover border-4 border-teal-400 transition-transform hover:scale-105"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              {/* hidden fallback placeholder */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 items-center justify-center shadow-xl border-4 border-teal-600" style={{ display: 'none' }}>
                <svg className="w-14 h-14 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center shadow-xl border-4 border-teal-600">
              <svg className="w-14 h-14 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <span className="text-xs text-teal-400 font-medium">
            {isLoadingPhoto ? 'Loading photo...' : selectedPatientPhoto ? 'Photo on file' : 'No photo'}
          </span>
        </div>

        {/* Details block */}
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
      
      {/* Duplicate Lab Number Modal */}
      <DuplicateLabNumberModal 
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        data={duplicateModalData}
      />
      
      {/* Main Container with Flex Layout */}
      <div className="flex min-h-screen bg-black text-gray-200">
        {/* Pending Patients Sidebar */}
        <PhlebotomySidebar
          pendingPatients={pendingPatients}
          loadingPending={loadingPending}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          setSearchTerm={setSearchTerm}
          submittedLabNumbers={submittedLabNumbers}
          setDuplicateModalData={setDuplicateModalData}
          setShowDuplicateModal={setShowDuplicateModal}
          pendingSidebarCollapsed={pendingSidebarCollapsed}
          setPendingSidebarCollapsed={setPendingSidebarCollapsed}
          lastRefreshTime={lastRefreshTime}
          fetchPendingPatients={fetchPendingPatients}
          pendingSearchQuery={pendingSearchQuery}
          setPendingSearchQuery={setPendingSearchQuery}
          pendingStartDate={pendingStartDate}
          setPendingStartDate={setPendingStartDate}
          pendingEndDate={pendingEndDate}
          setPendingEndDate={setPendingEndDate}
          activePendingTab={activePendingTab}
          setActivePendingTab={setActivePendingTab}
        />

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <img src={img} alt="Logo" className="w-24 mx-auto mb-4" />
              <h1 className="text-5xl font-bold text-teal-400">Phlebotomy</h1>
              <p className="text-gray-400">Generate and manage lab numbers</p>
              
              {/* Diagnostic Info */}
              <div className="mt-2 flex gap-4 justify-center text-sm">
                <div className="px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-500/30">
                  <span className="text-blue-300 font-semibold">Total Patients:</span>{' '}
                  <span className="text-white font-bold">{patients.length}</span>
                </div>
                <div className="px-4 py-2 bg-orange-900/30 rounded-lg border border-orange-500/30">
                  <span className="text-orange-300 font-semibold">Pending Lab Numbers:</span>{' '}
                  <span className="text-white font-bold">{pendingPatients.length}</span>
                </div>
                <div className="px-4 py-2 bg-green-900/30 rounded-lg border border-green-500/30">
                  <span className="text-green-300 font-semibold">Lab Numbers Assigned:</span>{' '}
                  <span className="text-white font-bold">{submittedLabNumbers.length}</span>
                </div>
              </div>
              
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
              <div className="relative search-container">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Enter passport number or name"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') {
                        handleFindPatient();
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (searchTerm.trim() && searchSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleFindPatient}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
                  >
                    Select
                  </button>
                </div>
                
                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-teal-500/50 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
                    {searchSuggestions.map((patient, index) => {
                      const hasLabNumber = submittedLabNumbers.some(
                        lab => lab.patient.trim().toLowerCase() === patient.name.trim().toLowerCase()
                      );
                      
                      return (
                        <div
                          key={patient._id || index}
                          onClick={() => selectPatientFromSuggestion(patient)}
                          className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {patient.photo ? (
                              <img
                                src={`data:image/jpeg;base64,${patient.photo}`}
                                alt="Patient"
                                className="w-10 h-10 rounded-full object-cover border-2 border-teal-400/50 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-teal-700/30 border-2 border-teal-500/50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-white text-sm truncate">{patient.name}</p>
                                {hasLabNumber && (
                                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded border border-yellow-500/50">
                                    Has Lab#
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400 font-mono">{patient.passportNumber}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ 
                                  patient.medicalType === 'SM-VDRL' 
                                    ? 'bg-red-900/60 text-red-200' 
                                    : 'bg-blue-900/60 text-blue-200'
                                }`}>
                                  {patient.medicalType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Tip: Start typing to see suggestions, or prefer exact passport number for precise match.</p>
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
      </div>
    </>
  );
};

export default Phlebotomy;
