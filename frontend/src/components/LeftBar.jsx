import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  MousePointer,
} from 'lucide-react';
import { toast } from 'react-toastify';

const LeftBar = () => {
  const [phlebotomyReports, setPhlebotomyReports] = useState([]);
  const [clinicalReports, setClinicalReports] = useState([]);
  const [isPhlebotomyLoading, setIsPhlebotomyLoading] = useState(true);
  const [isClinicalLoading, setIsClinicalLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showClinicalReports, setShowClinicalReports] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchPhlebotomyReports = async () => {
      try {
        // Fetch lab numbers instead of phlebotomy reports
        const response = await axios.get('http://localhost:5000/api/number');
        const labNumbers = response.data.labNumbers || [];
        
        // Filter to only show pending lab numbers (not completed)
        const pendingLabNumbers = labNumbers.filter(lab => lab.status !== 'completed');
        
        // Sort by most recent first
        const sortedReports = pendingLabNumbers.sort((a, b) => 
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
        const response = await axios.get('http://localhost:5000/api/clinical');
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

    window.addEventListener('labNumberSubmitted', handleLabNumberSubmission);
    window.addEventListener('labReportSubmitted', handleLabReportSubmission);

    return () => {
      window.removeEventListener('labNumberSubmitted', handleLabNumberSubmission);
      window.removeEventListener('labReportSubmitted', handleLabReportSubmission);
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

  const printReport = (report) => {
    if (!report) {
      toast.error("No report selected for printing");
      return;
    }

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
            font-size: 9px;
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
            font-size: 16px;
            font-weight: bold;
            color: #0f766e;
            margin: 4px 0;
          }
          .patient-image {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin: 4px auto;
            border: 1px solid #e2e8f0;
          }
          .patient-info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
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
          .main-content {
            flex: 1;
            display: block;
            width: 100%;
          }
          .section {
            break-inside: avoid;
            margin-bottom: 12px;
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
            font-size: 8px;
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
            font-size: 8px;
            color: #0f766e;
          }
          .compact-table .label {
            font-weight: bold;
            width: 35%;
            font-size: 8px;
            background-color: #f8fafc;
            color: #374151;
          }
          .compact-table .value {
            width: 65%;
            font-size: 8px;
            color: #1f2937;
            line-height: 1.2;
          }
          .haemogram-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
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
            font-size: 7px;
          }
          .haemogram-table td {
            font-size: 6px;
            color: #374151;
          }
          .haemogram-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 2px solid #2dd4bf;
            text-align: center;
            font-size: 8px;
            color: #64748b;
          }
          .two-column-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .full-width-section {
            grid-column: 1 / -1;
          }
        }
      </style>
    `;

    const formatData = (data) => {
      return data || 'N/A';
    };

    // Render functions for different sections using compact tables
    const renderBasicInfo = (data) => {
      const items = [
        { label: 'Height', value: data.height ? `${formatData(data.height)} cm` : 'N/A' },
        { label: 'Weight', value: data.weight ? `${formatData(data.weight)} kg` : 'N/A' },
        { label: 'Clinical Officer', value: formatData(data.clinicalOfficerName) },
        { label: 'Clinical Notes', value: formatData(data.clinicalNotes) }
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

    // Prepare sections data
    const basicInfo = {
      height: report.height,
      weight: report.weight,
      clinicalOfficerName: report.clinicalOfficerName,
      clinicalNotes: report.clinicalNotes
    };

    const printContent = `
      <html>
        <head>
          <title>Clinical Report - ${formatData(report.selectedReport?.patientName)}</title>
          ${printStyles}
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1 class="report-title">GULF HEALTHCARE KENYA LTD - Clinical Report</h1>
              ${report.selectedReport?.patientImage ? `
                <img 
                  src="data:image/jpeg;base64,${report.selectedReport.patientImage}" 
                  alt="Patient" 
                  class="patient-image">
              ` : ''}
              <table class="patient-info-table">
                <tr>
                  <td><strong>Patient Name:</strong> ${formatData(report.selectedReport?.patientName)}</td>
                  <td><strong>Lab Number:</strong> ${formatData(report.selectedReport?.labNumber)}</td>
                </tr>
                <tr>
                  <td><strong>Medical Type:</strong> ${formatData(report.selectedReport?.medicalType)}</td>
                  <td><strong>Report Date:</strong> ${new Date(report.selectedReport?.timeStamp).toLocaleDateString()}</td>
                </tr>
              </table>
            </div>

            <div class="main-content">
              <div class="two-column-layout">
                <div>
                  ${renderSectionIfHasData('Basic Information', basicInfo, renderBasicInfo)}
                  ${renderSectionIfHasData('General Examination', report.generalExamination, renderGeneralExam)}
                  ${renderSectionIfHasData('Blood Tests', report.selectedReport?.bloodTest, renderBloodTests)}
                </div>
                
                <div>
                  ${renderSectionIfHasData('Systemic Examination', report.systemicExamination, renderSystemicExam)}
                  ${renderSectionIfHasData('Urine Test', report.selectedReport?.urineTest, renderUrineTest)}
                  ${renderSectionIfHasData('Area 1 Tests', report.selectedReport?.area1, renderArea1Tests)}
                </div>
              </div>
              
              <div class="full-width-section">
                ${renderSectionIfHasData('Full Haemogram', report.selectedReport?.fullHaemogram, renderHaemogram)}
              </div>
              
              <div class="two-column-layout">
                <div>
                  ${hasData(report.historyOfPastIllness) || hasData(report.allergy) ? `
                    <div class="section">
                      <h3 class="section-title">Medical History</h3>
                      <div class="section-content">
                        ${renderMedicalHistory(report)}
                      </div>
                    </div>
                  ` : ''}
                </div>
                
                <div>
                  ${hasData(report.selectedReport?.labRemarks) ? `
                    <div class="section">
                      <h3 class="section-title">Lab Remarks & Conclusions</h3>
                      <div class="section-content">
                        ${renderLabRemarks(report.selectedReport?.labRemarks)}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <div class="footer">
              <p><strong>Gulf Healthcare Kenya Ltd.</strong> • Computer-generated report • Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>This is an official medical report. For any queries, contact our laboratory department.</p>
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

  const viewReport = (report) => {
    setSelectedReport(report);
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
                clinicalReports.slice(0, 8).map((report) => (
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
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Name:</strong> {selectedReport.selectedReport?.patientName || 'N/A'}</p>
                  <p><strong>Lab Number:</strong> {selectedReport.selectedReport?.labNumber || 'N/A'}</p>
                  <p><strong>Medical Type:</strong> {selectedReport.selectedReport?.medicalType || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(selectedReport.selectedReport?.timeStamp).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Height:</strong> {selectedReport.height || 'N/A'} cm</p>
                  <p><strong>Weight:</strong> {selectedReport.weight || 'N/A'} kg</p>
                  <p><strong>Clinical Officer:</strong> {selectedReport.clinicalOfficerName || 'N/A'}</p>
                  <p><strong>Clinical Notes:</strong> {selectedReport.clinicalNotes || 'N/A'}</p>
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

              {/* Area 1 Tests */}
              {selectedReport.selectedReport?.area1 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Area 1 Tests</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Blood Group:</strong> {selectedReport.selectedReport.area1.bloodGroup || 'N/A'}</p>
                    <p><strong>Pregnancy Test:</strong> {selectedReport.selectedReport.area1.pregnancyTest || 'N/A'}</p>
                    <p><strong>VDRL Test:</strong> {selectedReport.selectedReport.area1.vdrlTest || 'N/A'}</p>
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
