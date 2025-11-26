import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  MousePointer,
  Search,
  X,
  FileText,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'react-toastify';
import logo from '../assets/GULF HEALTHCARE KENYA LTD.png';
import { API_ENDPOINTS, FRONTEND_URL } from '../config/api.config';

const LeftBar = () => {
  const [phlebotomyReports, setPhlebotomyReports] = useState([]);
  const [clinicalReports, setClinicalReports] = useState([]);
  const [isPhlebotomyLoading, setIsPhlebotomyLoading] = useState(true);
  const [isClinicalLoading, setIsClinicalLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showClinicalReports, setShowClinicalReports] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const fetchPhlebotomyReports = async () => {
      try {
        // Fetch lab numbers and clinical reports to determine which can be processed by lab
        const [labNumbersResponse, clinicalResponse] = await Promise.all([
          axios.get(API_ENDPOINTS.labNumbers),
          axios.get(API_ENDPOINTS.clinical)
        ]);
        
        const labNumbers = labNumbersResponse.data.labNumbers || [];
        const clinicalReports = clinicalResponse.data || [];
        
        // Create a set of lab numbers that have been processed by clinical
        const processedByClinical = new Set(
          clinicalReports.map(report => report.selectedReport?.labNumber).filter(Boolean)
        );
        
        // Filter lab numbers based on routing rules:
        // - S-series: Can go directly to lab (bypass clinical)
        // - F-series: Must go through clinical first, only show in lab after clinical processing
        const availableForLab = labNumbers.filter(lab => {
          const isCompleted = lab.status === 'completed';
          const isSeries = lab.number && lab.number.includes('-S');
          const isFSeries = lab.number && lab.number.includes('-F');
          const hasBeenProcessedByClinical = processedByClinical.has(lab.number);
          
          // Don't show completed tests
          if (isCompleted) return false;
          
          // S-series can go directly to lab
          if (isSeries) return true;
          
          // F-series can only go to lab after clinical processing
          if (isFSeries) return hasBeenProcessedByClinical;
          
          // Default: allow other types to go to lab
          return true;
        });
        
        // Sort by most recent first
        const sortedReports = availableForLab.sort((a, b) => 
          new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
        );
        
        setPhlebotomyReports(sortedReports);
      } catch (error) {
        console.error('Error fetching lab numbers:', error);
        toast.error('Failed to fetch lab numbers');
      } finally {
        setIsPhlebotomyLoading(false);
      }
    };

    const fetchClinicalReports = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.clinical);
        setClinicalReports(response.data || []);
      } catch (error) {
        console.error('Error fetching clinical reports:', error);
      } finally {
        setIsClinicalLoading(false);
      }
    };

    fetchPhlebotomyReports();
    fetchClinicalReports();

    // Listen for new lab number submissions to refresh the list
    const handleLabNumberSubmission = () => {
      fetchPhlebotomyReports();
    };

    // Listen for lab report submissions to refresh the list
    const handleLabReportSubmission = () => {
      fetchPhlebotomyReports();
    };

    // Listen for clinical report submissions to refresh the list
    const handleClinicalReportSubmission = () => {
      fetchClinicalReports();
    };

    window.addEventListener('labNumberSubmitted', handleLabNumberSubmission);
    window.addEventListener('labReportSubmitted', handleLabReportSubmission);
    window.addEventListener('clinicalReportSubmitted', handleClinicalReportSubmission);

    return () => {
      window.removeEventListener('labNumberSubmitted', handleLabNumberSubmission);
      window.removeEventListener('labReportSubmitted', handleLabReportSubmission);
      window.removeEventListener('clinicalReportSubmitted', handleClinicalReportSubmission);
    };
  }, []);

  // Function to handle phlebotomy report selection
  const selectPhlebotomyReport = async (labNumberData) => {
    try {
      // Dispatch custom event to notify Lab component about patient selection
      const event = new CustomEvent('phlebotomyReportSelected', {
        detail: {
          patientName: labNumberData.patient,
          labNumber: labNumberData.number,
          phlebotomyData: labNumberData
        }
      });
      
      window.dispatchEvent(event);
      
      toast.success(`Selected: ${labNumberData.patient} (Lab #${labNumberData.number})`);
      
    } catch (error) {
      console.error('Error selecting lab number:', error);
      toast.error('Failed to select patient');
    }
  };

  // Function to enhance report with complete patient data if missing
  const enhanceReportWithPatientData = async (report) => {
    try {
      // If patient data is missing or incomplete, fetch it from patient collection
      if (!report.gender || !report.agent || !report.age || !report.passportNumber || !report.selectedReport?.patientImage) {
        const response = await axios.get(API_ENDPOINTS.patients);
        const patients = response.data;
        
        // Find patient by name (case-insensitive)
        const patient = patients.find(p => 
          p.name.toLowerCase() === report.selectedReport?.patientName?.toLowerCase()
        );
        
        if (patient) {
          return {
            ...report,
            passportNumber: report.passportNumber || patient.passportNumber,
            gender: report.gender || patient.sex,
            age: report.age || patient.age,
            agent: report.agent || patient.agent,
            selectedReport: {
              ...report.selectedReport,
              patientImage: report.selectedReport?.patientImage || patient.photo
            }
          };
        }
      }
      return report;
    } catch (error) {
      console.error('Error enhancing report with patient data:', error);
      return report;
    }
  };

  // Search functionality for previous lab results
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      // Fetch all clinical reports (completed lab results)
      const response = await axios.get(API_ENDPOINTS.clinical);
      const allReports = response.data || [];

      // Filter reports based on search query
      const filtered = allReports.filter(report => {
        const patientName = report.selectedReport?.patientName?.toLowerCase() || '';
        const labNumber = report.selectedReport?.labNumber?.toLowerCase() || '';
        const passportNumber = report.passportNumber?.toLowerCase() || '';
        const searchTerm = query.toLowerCase();

        return patientName.includes(searchTerm) || 
               labNumber.includes(searchTerm) || 
               passportNumber.includes(searchTerm);
      });

      // Sort by most recent first
      const sortedResults = filtered.sort((a, b) => 
        new Date(b.selectedReport?.timeStamp || b.createdAt) - 
        new Date(a.selectedReport?.timeStamp || a.createdAt)
      );

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Error searching lab results:', error);
      toast.error('Failed to search lab results');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const printReport = async (report) => {
    if (!report) {
      toast.error("No report selected for printing");
      return;
    }

    // Enhance report with complete patient data
    const enhancedReport = await enhanceReportWithPatientData(report);

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

    // Generate QR code data for lab result access
    // Use lab number directly without encoding for cleaner URL
    const reportId = enhancedReport.selectedReport?.labNumber || 
                    `${enhancedReport.selectedReport?.patientName?.replace(/\s+/g, '-')}-${Date.now()}`;
    
    // Ensure we have a complete, absolute URL with protocol
    let baseUrl = FRONTEND_URL;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const qrUrl = `${baseUrl}/lab-result/${reportId}`;
    console.log('Generated QR URL:', qrUrl); // Debug log
    
    // Store report data for QR code access
    const reportData = {
      id: reportId,
      patientName: enhancedReport.selectedReport?.patientName,
      labNumber: enhancedReport.selectedReport?.labNumber,
      reportDate: new Date(enhancedReport.selectedReport?.timeStamp).toLocaleDateString(),
      data: enhancedReport
    };
    
    // Store in localStorage for immediate access and backward compatibility
    try {
      localStorage.setItem(`lab-result-${reportId}`, JSON.stringify(reportData));
      console.log('Lab result stored locally for QR code access:', reportId);
    } catch (error) {
      console.error('Error storing report data locally:', error);
    }
    
    // Save to backend for persistent storage (production-ready)
    try {
      const response = await axios.post(`${API_ENDPOINTS.patients.replace('/patient', '')}/lab-result/save`, {
        labNumber: reportId,
        patientName: enhancedReport.selectedReport?.patientName,
        reportData: reportData
      });
      
      if (response.data && response.data.success) {
        console.log('Lab result saved to backend:', reportId);
        toast.success(`QR code generated - Lab #${enhancedReport.selectedReport?.labNumber}`);
      }
    } catch (backendError) {
      console.error('Failed to save to backend:', backendError);
      toast.warning('QR generated (local only) - backend storage failed');
      // Don't fail the operation, localStorage is still available
    }

    // Generate QR code as base64 image using qrcode library
    const generateQRCodeBase64 = async (url) => {
      try {
        const QRCode = require('qrcode');
        const qrCodeDataUrl = await QRCode.toDataURL(url, {
          width: 130,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        return qrCodeDataUrl;
      } catch (error) {
        console.error('Error generating QR code:', error);
        return '';
      }
    };
    
    const qrCodeBase64 = await generateQRCodeBase64(qrUrl);

    // Helper function to check if section has data
    const hasData = (section) => {
      if (!section) return false;
      if (typeof section === 'string') return section.trim() !== '';
      if (typeof section === 'object') {
        return Object.values(section).some(value => {
          if (typeof value === 'string') return value.trim() !== '';
          if (typeof value === 'object' && value !== null) return hasData(value);
          return value !== null && value !== undefined && value !== '';
        });
      }
      return false;
    };

    // Helper function to render only sections with data
    const renderSectionIfHasData = (title, data, renderFunction) => {
      if (!hasData(data)) return '';
      return `
        <div class="section">
          <h3 class="section-title">${title}</h3>
          <div class="section-content">
            ${renderFunction(data)}
          </div>
        </div>
      `;
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
          .patient-info-section {
            display: grid;
            grid-template-columns: 1fr 80px;
            gap: 12px;
            align-items: start;
            margin-top: 8px;
          }
          .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f766e;
            margin: 4px 0;
          }
          .patient-image-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 80px;
          }
          .patient-image {
            width: 70px;
            height: 70px;
            border-radius: 8px;
            border: 2px solid #0f766e;
            object-fit: cover;
          }
          .patient-info-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            table-layout: fixed;
          }
          .patient-info-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-size: 8px;
            text-align: left;
            font-weight: 500;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.2;
          }
          .patient-info-table td strong {
            color: #0f766e;
            font-weight: bold;
          }
          .qr-code-container {
            background: #FFFFFF;
            padding: 8px;
            border-radius: 5px;
            display: inline-block;
          }
          .qr-code-container canvas {
            display: block;
            background: #FFFFFF !important;
          }
          }
          .main-content {
            flex: 1;
            display: block;
            width: 100%;
          }
          .section {
            break-inside: avoid;
            margin-bottom: 8px;
            width: 100%;
          }
          .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #0f766e;
            margin-bottom: 6px;
            padding: 4px 8px;
            background-color: #e6fffa;
            border-left: 3px solid #0f766e;
            border-radius: 2px;
          }
          .section-content {
            background-color: #fefefe;
            padding: 4px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
          }
          .compact-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 8px;
            table-layout: fixed;
          }
          .compact-table th, .compact-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .compact-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            font-size: 10px;
            color: #0f766e;
          }
          .compact-table .label {
            font-weight: bold;
            width: 35%;
            font-size: 10px;
            background-color: #f8fafc;
            color: #374151;
          }
          .compact-table .value {
            width: 65%;
            font-size: 10px;
            color: #1f2937;
            line-height: 1.2;
          }
          .haemogram-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 8px;
            table-layout: fixed;
          }
          .haemogram-table th, .haemogram-table td {
            border: 1px solid #cbd5e1;
            padding: 3px 4px;
            text-align: center;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.1;
          }
          .haemogram-table th {
            background-color: #0f766e;
            color: white;
            font-weight: bold;
            font-size: 9px;
          }
          .haemogram-table td {
            font-size: 8px;
            color: #374151;
          }
          .haemogram-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 2px solid #2dd4bf;
            font-size: 10px;
            color: #64748b;
            page-break-inside: avoid;
          }
          .two-column-layout {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 12px;
            margin-bottom: 12px;
            align-items: start;
          }
          .full-width-section {
            grid-column: 1 / -1;
          }
          .tests-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
          }
          .bottom-section {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 12px;
          }
        }
      </style>
    `;

    const formatData = (data) => {
      // Handle different data types appropriately
      if (data === null || data === undefined) return 'N/A';
      if (data === '') return 'N/A';
      if (typeof data === 'number' && data === 0) return '0'; // Age could be 0
      if (typeof data === 'string' && data.trim() === '') return 'N/A';
      return String(data);
    };

    // Render functions for different sections using compact tables
    const renderBasicInfo = (data) => {
      const items = [
        { label: 'Height', value: data.height ? `${formatData(data.height)} cm` : 'N/A' },
        { label: 'Weight', value: data.weight ? `${formatData(data.weight)} kg` : 'N/A' }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          <thead>
            <tr>
              <th style="width: 40%;">Parameter</th>
              <th style="width: 60%;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="label">${item.label}</td>
                <td class="value">${item.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    // Render clinical information (officer, notes, height, weight)
    const renderClinicalInfo = (data) => {
      const items = [
        { label: 'Height', value: data.height ? `${formatData(data.height)} cm` : 'N/A' },
        { label: 'Weight', value: data.weight ? `${formatData(data.weight)} kg` : 'N/A' }
      ];
      
      // Only include clinical officer and notes if they exist in the data (excluded for SM-VDRL)
      if (data.clinicalOfficerName) {
        items.push({ label: 'Clinical Officer', value: formatData(data.clinicalOfficerName) });
      }
      if (data.clinicalNotes) {
        items.push({ label: 'Clinical Notes', value: formatData(data.clinicalNotes) });
      }
      
      const filteredItems = items.filter(item => item.value !== 'N/A');

      if (filteredItems.length === 0) return '';

      return `
        <table class="compact-table">
          <thead>
            <tr>
              <th style="width: 40%;">Parameter</th>
              <th style="width: 60%;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map(item => `
              <tr>
                <td class="label">${item.label}</td>
                <td class="value">${item.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    const renderGeneralExam = (data) => {
      const items = [
        { label: 'Left Eye', value: formatData(data.leftEye) },
        { label: 'Right Eye', value: formatData(data.rightEye) },
        { label: 'Hernia', value: formatData(data.hernia) },
        { label: 'Varicose Vein', value: formatData(data.varicoseVein) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          <thead>
            <tr>
              <th style="width: 40%;">Examination</th>
              <th style="width: 60%;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="label">${item.label}</td>
                <td class="value">${item.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    const renderSystemicExam = (data) => {
      const items = [
        { label: 'Blood Pressure', value: formatData(data.bloodPressure) },
        { label: 'Heart', value: formatData(data.heart) },
        { label: 'Pulse Rate', value: formatData(data.pulseRate) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          ${items.map(item => `
            <tr>
              <td class="label">${item.label}</td>
              <td class="value">${item.value}</td>
            </tr>
          `).join('')}
        </table>
      `;
    };

    const renderBloodTests = (data) => {
      const items = [
        { label: 'ESR', value: formatData(data.esr) },
        { label: 'HBsAg', value: formatData(data.hbsAg) },
        { label: 'HCV', value: formatData(data.hcv) },
        { label: 'HIV Test', value: formatData(data.hivTest) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          ${items.map(item => `
            <tr>
              <td class="label">${item.label}</td>
              <td class="value">${item.value}</td>
            </tr>
          `).join('')}
        </table>
      `;
    };

    const renderUrineTest = (data) => {
      const items = [
        { label: 'Albumin', value: formatData(data.albumin) },
        { label: 'Sugar', value: formatData(data.sugar) },
        { label: 'Reaction', value: formatData(data.reaction) },
        { label: 'Microscopic', value: formatData(data.microscopic) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          ${items.map(item => `
            <tr>
              <td class="label">${item.label}</td>
              <td class="value">${item.value}</td>
            </tr>
          `).join('')}
        </table>
      `;
    };

    const renderHaemogram = (data) => {
      const haemogramTests = [];
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key] === 'object' && hasData(data[key].value)) {
          const parameterName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const truncatedName = parameterName.length > 15 ? parameterName.substring(0, 15) + '...' : parameterName;
          
          haemogramTests.push({
            test: truncatedName,
            value: formatData(data[key].value),
            units: formatData(data[key].units),
            status: formatData(data[key].status)
          });
        }
      });
      
      if (haemogramTests.length === 0) return '';
      
      return `
        <table class="haemogram-table">
          <thead>
            <tr>
              <th style="width: 25%;">Parameter</th>
              <th style="width: 20%;">Value</th>
              <th style="width: 15%;">Units</th>
              <th style="width: 20%;">Status</th>
              <th style="width: 20%;">Reference</th>
            </tr>
          </thead>
          <tbody>
            ${haemogramTests.map(test => {
              const originalKey = Object.keys(data).find(key => 
                key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).startsWith(test.test.replace('...', ''))
              );
              const range = originalKey ? formatData(data[originalKey]?.range) : 'N/A';
              
              return `
              <tr>
                <td style="font-weight: 500; text-align: left;">${test.test}</td>
                <td style="text-align: center; font-weight: bold;">${test.value}</td>
                <td style="text-align: center;">${test.units}</td>
                <td style="text-align: center; ${test.status !== 'N/A' && test.status !== 'Normal' ? 'color: #dc2626; font-weight: bold;' : ''}">${test.status}</td>
                <td style="text-align: center; font-size: 5px;">${range}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    };

    // Renders Laboratory Tests data (area1 refers to the data structure)
    const renderArea1Tests = (data) => {
      const items = [
        { label: 'Blood Group', value: formatData(data.bloodGroup) },
        { label: 'Pregnancy Test', value: formatData(data.pregnancyTest) },
        { label: 'VDRL Test', value: formatData(data.vdrlTest) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          ${items.map(item => `
            <tr>
              <td class="label">${item.label}</td>
              <td class="value">${item.value}</td>
            </tr>
          `).join('')}
        </table>
      `;
    };

    // Renders Radiology Tests data
    const renderRadiologyTests = (data) => {
      const items = [
        { label: 'Heaf/Mantoux Test', value: formatData(data.heafMantouxTest) },
        { label: 'Chest X-ray', value: formatData(data.chestXray) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          ${items.map(item => `
            <tr>
              <td class="label">${item.label}</td>
              <td class="value">${item.value}</td>
            </tr>
          `).join('')}
        </table>
      `;
    };

    const renderRenalFunction = (data) => {
      const renalTests = [
        { test: 'Urea', key: 'urea' },
        { test: 'Creatinine', key: 'creatinine' },
        { test: 'Fasting Blood Sugar', key: 'fastingBloodSugar' }
      ].map(test => ({
        test: test.test,
        value: formatData(data[test.key]?.value),
        status: formatData(data[test.key]?.status),
        range: formatData(data[test.key]?.range)
      })).filter(test => test.value !== 'N/A');

      if (renalTests.length === 0) return '';

      return `
        <table class="haemogram-table">
          <thead>
            <tr>
              <th style="width: 30%;">Test</th>
              <th style="width: 20%;">Value</th>
              <th style="width: 20%;">Status</th>
              <th style="width: 30%;">Range</th>
            </tr>
          </thead>
          <tbody>
            ${renalTests.map(test => `
              <tr>
                <td style="font-weight: 500; text-align: left;">${test.test}</td>
                <td style="text-align: center; font-weight: bold;">${test.value}</td>
                <td style="text-align: center; ${test.status !== 'N/A' && test.status !== 'Normal' ? 'color: #dc2626; font-weight: bold;' : ''}">${test.status}</td>
                <td style="text-align: center; font-size: 6px;">${test.range}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    };

    const renderLiverFunction = (data) => {
      const liverTests = [
        { test: 'Total Bilirubin', key: 'totalBilirubin' },
        { test: 'Direct Bilirubin', key: 'directBilirubin' },
        { test: 'Indirect Bilirubin', key: 'indirectBilirubin' },
        { test: 'SGOT', key: 'sgot' },
        { test: 'SGPT', key: 'sgpt' },
        { test: 'Gamma GT', key: 'gammaGt' },
        { test: 'Alkaline Phosphate', key: 'alkalinePhosphate' },
        { test: 'Total Proteins', key: 'totalProteins' },
        { test: 'Albumin', key: 'albumin1' }
      ].map(test => ({
        test: test.test,
        value: formatData(data[test.key]?.value),
        status: formatData(data[test.key]?.status),
        range: formatData(data[test.key]?.range)
      })).filter(test => test.value !== 'N/A');

      if (liverTests.length === 0) return '';

      return `
        <table class="haemogram-table">
          <thead>
            <tr>
              <th style="width: 30%;">Test</th>
              <th style="width: 20%;">Value</th>
              <th style="width: 20%;">Status</th>
              <th style="width: 30%;">Range</th>
            </tr>
          </thead>
          <tbody>
            ${liverTests.map(test => `
              <tr>
                <td style="font-weight: 500; text-align: left;">${test.test}</td>
                <td style="text-align: center; font-weight: bold;">${test.value}</td>
                <td style="text-align: center; ${test.status !== 'N/A' && test.status !== 'Normal' ? 'color: #dc2626; font-weight: bold;' : ''}">${test.status}</td>
                <td style="text-align: center; font-size: 6px;">${test.range}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
    };

    const renderMedicalHistory = (selectedReport) => {
      const items = [
        { label: 'Past Illness', value: formatData(selectedReport.historyOfPastIllness) },
        { label: 'Allergies', value: formatData(selectedReport.allergy) }
      ].filter(item => item.value !== 'N/A');

      if (items.length === 0) return '';

      return `
        <table class="compact-table">
          ${items.map(item => `
            <tr>
              <td class="label">${item.label}</td>
              <td class="value">${item.value}</td>
            </tr>
          `).join('')}
        </table>
      `;
    };

    const renderLabRemarks = (data) => {
      const items = [];
      if (data?.fitnessEvaluation?.overallStatus) {
        items.push({ label: 'Overall Status', value: formatData(data.fitnessEvaluation.overallStatus) });
      }
      if (data?.fitnessEvaluation?.otherAspectsFit) {
        items.push({ label: 'Other Aspects Fit', value: formatData(data.fitnessEvaluation.otherAspectsFit) });
      }
      if (data?.labSuperintendent?.name) {
        items.push({ label: 'Lab Superintendent', value: formatData(data.labSuperintendent.name) });
      }

      if (items.length === 0 && !data?.notepadContent) return '';

      let content = '';
      
      if (items.length > 0) {
        content += `
          <table class="compact-table">
            ${items.map(item => `
              <tr>
                <td class="label">${item.label}</td>
                <td class="value">${item.value}</td>
              </tr>
            `).join('')}
          </table>
        `;
      }
      
      if (data?.notepadContent) {
        content += `
          <div style="margin-top: ${items.length > 0 ? '15px' : '0'}; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 12px; font-weight: bold;">Clinical Notes:</h4>
            <div style="font-size: 11px; line-height: 1.4; white-space: pre-wrap; color: #374151;">
              ${formatData(data.notepadContent)}
            </div>
          </div>
        `;
      }
      
      return content;
    };

    // Prepare sections data
    // Check if this is an SM-VDRL (S-series) report to exclude clinical officer and notes sections
    const isSmVdrlReport = enhancedReport.selectedReport?.labNumber?.includes('-S') || 
                           enhancedReport.selectedReport?.medicalType === 'SM-VDRL';
    
    const basicInfo = {
      height: enhancedReport.height,
      weight: enhancedReport.weight,
      // Only include clinical officer and notes for non-SM-VDRL reports
      ...(isSmVdrlReport ? {} : {
        clinicalOfficerName: enhancedReport.clinicalOfficerName,
        clinicalNotes: enhancedReport.clinicalNotes
      })
    };

    const printContent = `
      <html>
        <head>
          <title>Clinical Report - ${formatData(enhancedReport.selectedReport?.patientName)}</title>
          ${printStyles}
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div style="text-align: center; margin-bottom: 10px;">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Gulf Healthcare Kenya Ltd" style="width: 300px; height: auto; max-width: 100%;" />` : ''}
              </div>
              <h2 class="report-title" style="margin-top: 10px;">Clinical Report</h2>
              
              <div class="patient-info-section">
                <table class="patient-info-table">
                  <tr>
                    <td><strong>Patient Name:</strong> ${formatData(enhancedReport.selectedReport?.patientName)}</td>
                    <td><strong>Gender:</strong> ${formatData(enhancedReport.gender)}</td>
                    <td><strong>Age:</strong> ${formatData(enhancedReport.age)}</td>
                  </tr>
                  <tr>
                    <td><strong>Passport Number:</strong> ${formatData(enhancedReport.passportNumber)}</td>
                    <td><strong>Lab Number:</strong> ${formatData(enhancedReport.selectedReport?.labNumber)}</td>
                    <td><strong>Agent:</strong> ${formatData(enhancedReport.agent)}</td>
                  </tr>
                  <tr>
                    <td><strong>Report Date:</strong> ${new Date(enhancedReport.selectedReport?.timeStamp).toLocaleDateString()}</td>
                    <td><strong>Report Time:</strong> ${new Date(enhancedReport.selectedReport?.timeStamp).toLocaleTimeString()}</td>
                    <td></td>
                  </tr>
                </table>
                
                <div class="patient-image-container">
                  ${enhancedReport.selectedReport?.patientImage ? `
                    <img 
                      src="data:image/jpeg;base64,${enhancedReport.selectedReport.patientImage}" 
                      alt="Patient Photo" 
                      class="patient-image">
                  ` : `
                    <div style="width: 70px; height: 70px; border: 2px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 6px; text-align: center;">
                      No Photo<br>Available
                    </div>
                  `}
                </div>
              </div>
            </div>

            <div class="main-content">
              <!-- Tests Section with Fluid Layout -->
              <div class="tests-container">
                ${renderSectionIfHasData('General Examination', enhancedReport.generalExamination, renderGeneralExam)}
                ${renderSectionIfHasData('Systemic Examination', enhancedReport.systemicExamination, renderSystemicExam)}
                ${renderSectionIfHasData('Urine Test', enhancedReport.selectedReport?.urineTest, renderUrineTest)}
                ${renderSectionIfHasData('Blood Tests', enhancedReport.selectedReport?.bloodTest, renderBloodTests)}
                ${renderSectionIfHasData('Laboratory Tests', enhancedReport.selectedReport?.area1, renderArea1Tests)}
                ${renderSectionIfHasData('Radiology Tests', enhancedReport.radiologyData, renderRadiologyTests)}
              </div>
              
              <!-- Full-width sections for larger test tables -->
              <div class="full-width-section">
                ${renderSectionIfHasData('Full Haemogram', enhancedReport.selectedReport?.fullHaemogram, renderHaemogram)}
              </div>
              
              <div class="full-width-section">
                ${renderSectionIfHasData('Renal Function Test', enhancedReport.selectedReport?.renalFunction, renderRenalFunction)}
              </div>
              
              <div class="full-width-section">
                ${renderSectionIfHasData('Liver Function Test', enhancedReport.selectedReport?.liverFunction, renderLiverFunction)}
              </div>
              
              <!-- Clinical Notes and Lab Remarks at the Bottom -->
              <div class="bottom-section">
                ${hasData(enhancedReport.historyOfPastIllness) || hasData(enhancedReport.allergy) ? `
                  <div class="section">
                    <h3 class="section-title">Medical History</h3>
                    <div class="section-content">
                      ${renderMedicalHistory(enhancedReport)}
                    </div>
                  </div>
                ` : ''}
                
                ${renderSectionIfHasData('Clinical Information', basicInfo, renderClinicalInfo)}
                
                ${hasData(enhancedReport.selectedReport?.labRemarks) ? `
                  <div class="section">
                    <h3 class="section-title">Lab Remarks & Conclusions</h3>
                    <div class="section-content">
                      ${renderLabRemarks(enhancedReport.selectedReport?.labRemarks)}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="footer">
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px;">
                <div style="flex: 0 0 auto;">
                  ${qrCodeBase64 ? `
                    <div style="display: inline-block; text-align: center; padding: 8px; background: #FFFFFF; border-radius: 4px; border: 1px solid #e5e7eb;">
                      <img src="${qrCodeBase64}" alt="QR Code" style="width: 130px; height: 130px; display: block;" />
                      <div style="font-size: 8px; margin-top: 3px; color: #2dd4bf; font-weight: bold;">Scan for Digital Copy</div>
                    </div>
                  ` : ''}
                </div>
                <div style="flex: 1; text-align: center;">
                  <p><strong>Gulf Healthcare Kenya Ltd.</strong> • Computer-generated report</p>
                  <p>This is an official medical report. For any queries, contact our laboratory department.</p>
                </div>
                <div style="flex: 0 0 auto; width: 130px;"></div>
              </div>
            </div>
          </div>
          
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Print after content loads
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500); // Short delay to ensure rendering
    };
  };

  const viewReport = async (report) => {
    // Enhance report with complete patient data before viewing
    const enhancedReport = await enhanceReportWithPatientData(report);
    setSelectedReport(enhancedReport);
    setShowReportModal(true);
  };

  const closeModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent animate-pulse" />

      <div className="relative z-10 backdrop-blur-sm bg-white/5 h-full overflow-y-auto">
       
        {/* Search Bar for Previous Lab Results */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-3">
            <h4 className="text-teal-100 font-semibold text-base flex items-center gap-2">
              <Search size={18} className="text-teal-300" />
              Search Lab Results
            </h4>
            <p className="text-xs text-teal-200/70 mt-1">Find previous patient lab reports</p>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-300 group-focus-within:text-teal-200 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search by name, lab number, or passport..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border-2 border-teal-400/30 rounded-lg text-white placeholder-teal-200/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 focus:bg-white/15 transition-all duration-200 text-sm shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-teal-300 hover:text-white hover:bg-teal-600/30 rounded-full p-1 transition-all duration-200"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="mt-4 space-y-2 max-h-[55vh] overflow-y-auto bg-gradient-to-b from-white/5 to-white/10 rounded-lg p-4 shadow-2xl border border-teal-400/20 scrollbar-thin scrollbar-thumb-teal-600 scrollbar-track-transparent backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-teal-400/20">
                <h5 className="text-teal-100 font-semibold text-sm flex items-center gap-2">
                  <FileText size={16} className="text-teal-300" />
                  Search Results
                </h5>
                {!isSearching && (
                  <span className="text-xs bg-teal-600/30 px-2 py-1 rounded-full text-teal-100 font-medium">
                    {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                  </span>
                )}
              </div>

              {isSearching ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-300 mb-2"></div>
                  <p className="text-teal-100 text-sm">Searching records...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="mx-auto mb-3 text-teal-300/50" size={32} />
                  <p className="text-teal-100 text-sm font-medium">No lab results found</p>
                  <p className="text-teal-200/60 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((report, index) => (
                    <div
                      key={report._id}
                      className="bg-gradient-to-br from-white/10 to-white/5 rounded-lg p-4 hover:from-teal-700/40 hover:to-teal-600/30 transition-all duration-200 border border-teal-400/10 hover:border-teal-400/30 shadow-md hover:shadow-lg group animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User size={14} className="text-teal-300" />
                            <p className="text-sm font-semibold text-white group-hover:text-teal-100 transition-colors">
                              {report.selectedReport?.patientName || 'Unknown Patient'}
                            </p>
                          </div>
                          
                          <div className="space-y-1 ml-6">
                            <div className="flex items-center gap-2">
                              <FileText size={12} className="text-teal-300/70" />
                              <p className="text-xs text-teal-200">
                                Lab No: <span className="font-medium text-teal-100">{report.selectedReport?.labNumber || 'N/A'}</span>
                              </p>
                            </div>
                            
                            {report.passportNumber && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-teal-300/70">🛂</span>
                                <p className="text-xs text-teal-200">
                                  Passport: <span className="font-medium text-teal-100">{report.passportNumber}</span>
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-teal-300/70" />
                              <p className="text-xs text-teal-300">
                                {new Date(report.selectedReport?.timeStamp || report.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3 pt-3 border-t border-teal-400/10">
                        <button
                          onClick={() => viewReport(report)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 rounded-md text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Eye size={14} />
                          View Report
                        </button>
                        <button
                          onClick={() => printReport(report)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-md text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Printer size={14} />
                          Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Phlebotomy Reports Section */}
        <div className="px-6 mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-teal-200 font-semibold text-lg mb-2">Recent Phlebotomy Reports</h4>
            <MousePointer size={16} className="text-teal-300" title="Click to select patient" />
          </div>

          {isPhlebotomyLoading ? (
            <p className="text-teal-100 text-sm">Loading lab numbers...</p>
          ) : phlebotomyReports.length === 0 ? (
            <p className="text-teal-100 text-sm">No lab numbers available.</p>
          ) : (
            phlebotomyReports.slice(0, 6).map((labNumberData) => (
              <div
                key={labNumberData._id}
                className="block p-3 rounded-md bg-white/10 hover:bg-teal-700/40 transition-colors cursor-pointer group"
                onClick={() => selectPhlebotomyReport(labNumberData)}
                title="Click to select this patient for lab tests"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-teal-100 transition-colors">
                      {labNumberData.patient || 'Unnamed Patient'}
                    </p>
                    <p className="text-xs text-teal-200">
                      Lab No: {labNumberData.number} •{' '}
                      {new Date(labNumberData.createdAt || labNumberData.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-teal-300">
                      Type: {labNumberData.medicalType || 'N/A'}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MousePointer size={14} className="text-teal-300" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clinical Reports Section */}
        <div className="px-6 mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-teal-200 font-semibold text-lg">Full Clinical Reports</h4>
            <button
              onClick={() => setShowClinicalReports(!showClinicalReports)}
              className="text-teal-300 hover:text-white transition-colors"
            >
              {showClinicalReports ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {showClinicalReports && (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-teal-600 scrollbar-track-transparent">
              {isClinicalLoading ? (
                <p className="text-teal-100 text-sm">Loading clinical reports...</p>
              ) : clinicalReports.length === 0 ? (
                <p className="text-teal-100 text-sm">No clinical reports available.</p>
              ) : (
                clinicalReports.map((report) => (
                  <div
                    key={report._id}
                    className="p-3 rounded-md bg-white/10 hover:bg-teal-700/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{report.selectedReport?.patientName || 'Unnamed'}</p>
                        <p className="text-xs text-teal-200">
                          Lab No: {report.selectedReport?.labNumber} •{' '}
                          {new Date(report.selectedReport?.timeStamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-teal-300">
                          Type: {report.selectedReport?.medicalType || 'N/A'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewReport(report)}
                          className="p-1 bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                          title="View Report"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => printReport(report)}
                          className="p-1 bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                          title="Print Report"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Clinical Report Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => printReport(selectedReport)}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors flex items-center"
                  >
                    <Printer size={16} className="mr-2" />
                    Print Report
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Patient Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <p><strong>Name:</strong> {selectedReport.selectedReport?.patientName || 'N/A'}</p>
                  <p><strong>Gender:</strong> {selectedReport.gender || 'N/A'}</p>
                  <p><strong>Age:</strong> {selectedReport.age || 'N/A'}</p>
                  <p><strong>Passport Number:</strong> {selectedReport.passportNumber || 'N/A'}</p>
                  <p><strong>Lab Number:</strong> {selectedReport.selectedReport?.labNumber || 'N/A'}</p>
                  <p><strong>Agent:</strong> {selectedReport.agent || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(selectedReport.selectedReport?.timeStamp).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(selectedReport.selectedReport?.timeStamp).toLocaleTimeString()}</p>
                  <p></p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Height:</strong> {selectedReport.height || 'N/A'} cm</p>
                  <p><strong>Weight:</strong> {selectedReport.weight || 'N/A'} kg</p>
                  {/* Only show clinical officer and notes for non-SM-VDRL reports */}
                  {!(selectedReport.selectedReport?.labNumber?.includes('-S') || selectedReport.selectedReport?.medicalType === 'SM-VDRL') && (
                    <>
                      <p><strong>Clinical Officer:</strong> {selectedReport.clinicalOfficerName || 'N/A'}</p>
                      <p><strong>Clinical Notes:</strong> {selectedReport.clinicalNotes || 'N/A'}</p>
                    </>
                  )}
                  <p><strong>Past Illness:</strong> {selectedReport.historyOfPastIllness || 'N/A'}</p>
                  <p><strong>Allergies:</strong> {selectedReport.allergy || 'N/A'}</p>
                </div>
              </div>

              {/* General Examination */}
              {selectedReport.generalExamination && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">General Examination</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Left Eye:</strong> {selectedReport.generalExamination.leftEye || 'N/A'}</p>
                    <p><strong>Right Eye:</strong> {selectedReport.generalExamination.rightEye || 'N/A'}</p>
                    <p><strong>Hernia:</strong> {selectedReport.generalExamination.hernia || 'N/A'}</p>
                    <p><strong>Varicose Vein:</strong> {selectedReport.generalExamination.varicoseVein || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Systemic Examination */}
              {selectedReport.systemicExamination && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Systemic Examination</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Blood Pressure:</strong> {selectedReport.systemicExamination.bloodPressure || 'N/A'}</p>
                    <p><strong>Heart:</strong> {selectedReport.systemicExamination.heart || 'N/A'}</p>
                    <p><strong>Pulse Rate:</strong> {selectedReport.systemicExamination.pulseRate || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Laboratory Tests */}
              {selectedReport.selectedReport?.area1 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Laboratory Tests</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Blood Group:</strong> {selectedReport.selectedReport.area1.bloodGroup || 'N/A'}</p>
                    <p><strong>Pregnancy Test:</strong> {selectedReport.selectedReport.area1.pregnancyTest || 'N/A'}</p>
                    <p><strong>VDRL Test:</strong> {selectedReport.selectedReport.area1.vdrlTest || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Radiology Tests */}
              {selectedReport.radiologyData && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Radiology Tests</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.radiologyData.heafMantouxTest && (
                      <p><strong>Heaf/Mantoux Test:</strong> {selectedReport.radiologyData.heafMantouxTest}</p>
                    )}
                    {selectedReport.radiologyData.chestXray && (
                      <p><strong>Chest X-ray:</strong> {selectedReport.radiologyData.chestXray}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Full Haemogram */}
              {selectedReport.selectedReport?.fullHaemogram && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Full Haemogram</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-teal-600 text-white">
                          <th className="border border-gray-300 px-4 py-2 text-left">Parameter</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Units</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Reference Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(selectedReport.selectedReport.fullHaemogram).map((key) => {
                          const test = selectedReport.selectedReport.fullHaemogram[key];
                          if (test && typeof test === 'object' && test.value) {
                            const parameterName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            return (
                              <tr key={key} className="hover:bg-gray-100">
                                <td className="border border-gray-300 px-4 py-2 font-medium">{parameterName}</td>
                                <td className="border border-gray-300 px-4 py-2">{test.value || 'N/A'}</td>
                                <td className="border border-gray-300 px-4 py-2">{test.units || 'N/A'}</td>
                                <td className={`border border-gray-300 px-4 py-2 ${test.status && test.status !== 'Normal' ? 'text-red-600 font-bold' : ''}`}>
                                  {test.status || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">{test.range || 'N/A'}</td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lab Remarks */}
              {selectedReport.selectedReport?.labRemarks && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Lab Remarks</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Overall Status:</strong> {selectedReport.selectedReport.labRemarks.fitnessEvaluation?.overallStatus || 'N/A'}</p>
                    <p><strong>Other Aspects Fit:</strong> {selectedReport.selectedReport.labRemarks.fitnessEvaluation?.otherAspectsFit || 'N/A'}</p>
                    <p><strong>Lab Superintendent:</strong> {selectedReport.selectedReport.labRemarks.labSuperintendent?.name || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Test Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blood Tests */}
                {selectedReport.selectedReport?.bloodTest && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Blood Tests</h3>
                    <div className="space-y-1">
                      <p><strong>ESR:</strong> {selectedReport.selectedReport.bloodTest.esr || 'N/A'}</p>
                      <p><strong>HBsAg:</strong> {selectedReport.selectedReport.bloodTest.hbsAg || 'N/A'}</p>
                      <p><strong>HCV:</strong> {selectedReport.selectedReport.bloodTest.hcv || 'N/A'}</p>
                      <p><strong>HIV Test:</strong> {selectedReport.selectedReport.bloodTest.hivTest || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Urine Tests */}
                {selectedReport.selectedReport?.urineTest && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Urine Tests</h3>
                    <div className="space-y-1">
                      <p><strong>Albumin:</strong> {selectedReport.selectedReport.urineTest.albumin || 'N/A'}</p>
                      <p><strong>Sugar:</strong> {selectedReport.selectedReport.urineTest.sugar || 'N/A'}</p>
                      <p><strong>Reaction:</strong> {selectedReport.selectedReport.urineTest.reaction || 'N/A'}</p>
                      <p><strong>Microscopic:</strong> {selectedReport.selectedReport.urineTest.microscopic || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500/50 via-teal-300/50 to-teal-500/50" />
    </div>
  );
};

export default LeftBar;
