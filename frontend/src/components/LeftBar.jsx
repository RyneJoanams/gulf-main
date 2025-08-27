import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  ChevronRight,
  Activity,
  Calendar,
  Users,
  FileText,
  Settings,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  MousePointer,
} from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const generatePDF = (report) => {
    if (!report) {
      toast.error("No report selected for PDF generation");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      const formatData = (data) => {
        return data || 'Not Available';
      };

      const addSection = (title, yPos) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, 20, yPos);
        doc.setLineWidth(0.5);
        doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
        return yPos + 10;
      };

      const addText = (label, value, yPos, indent = 20) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, indent, yPos);
        doc.setFont(undefined, 'normal');
        const textWidth = doc.getTextWidth(`${label}: `);
        doc.text(formatData(value), indent + textWidth, yPos);
        return yPos + 6;
      };

      // Header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Clinical Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Patient Image (if available)
      if (report.selectedReport?.patientImage) {
        try {
          const imgData = `data:image/jpeg;base64,${report.selectedReport.patientImage}`;
          doc.addImage(imgData, 'JPEG', pageWidth / 2 - 15, yPosition, 30, 30);
          yPosition += 35;
        } catch (error) {
          console.warn('Could not add patient image to PDF:', error);
        }
      }

      // Patient Information
      yPosition = addSection('Patient Information', yPosition);
      yPosition = addText('Patient Name', report.selectedReport?.patientName, yPosition);
      yPosition = addText('Lab Number', report.selectedReport?.labNumber, yPosition);
      yPosition = addText('Medical Type', report.selectedReport?.medicalType, yPosition);
      yPosition = addText('Date', new Date(report.selectedReport?.timeStamp).toLocaleString(), yPosition);
      yPosition += 5;

      // Basic Information
      yPosition = addSection('Basic Information', yPosition);
      yPosition = addText('Height', `${formatData(report.height)} cm`, yPosition);
      yPosition = addText('Weight', `${formatData(report.weight)} kg`, yPosition);
      yPosition = addText('Clinical Officer', report.clinicalOfficerName, yPosition);
      yPosition = addText('Clinical Notes', report.clinicalNotes, yPosition);
      yPosition = addText('History of Past Illness', report.historyOfPastIllness, yPosition);
      yPosition = addText('Allergy', report.allergy, yPosition);
      yPosition += 5;

      // General Examination
      if (report.generalExamination) {
        yPosition = addSection('General Examination', yPosition);
        yPosition = addText('Left Eye', report.generalExamination.leftEye, yPosition);
        yPosition = addText('Right Eye', report.generalExamination.rightEye, yPosition);
        yPosition = addText('Hernia', report.generalExamination.hernia, yPosition);
        yPosition = addText('Varicose Vein', report.generalExamination.varicoseVein, yPosition);
        yPosition += 5;
      }

      // Systemic Examination
      if (report.systemicExamination) {
        yPosition = addSection('Systemic Examination', yPosition);
        yPosition = addText('Blood Pressure', report.systemicExamination.bloodPressure, yPosition);
        yPosition = addText('Heart', report.systemicExamination.heart, yPosition);
        yPosition = addText('Pulse Rate', report.systemicExamination.pulseRate, yPosition);
        yPosition += 5;
      }

      // Area 1 Tests
      if (report.selectedReport?.area1) {
        yPosition = addSection('Area 1 Tests', yPosition);
        yPosition = addText('Blood Group', report.selectedReport.area1.bloodGroup, yPosition);
        yPosition = addText('Pregnancy Test', report.selectedReport.area1.pregnancyTest, yPosition);
        yPosition = addText('VDRL Test', report.selectedReport.area1.vdrlTest, yPosition);
        yPosition += 5;
      }

      // Blood Tests
      if (report.selectedReport?.bloodTest) {
        yPosition = addSection('Blood Tests', yPosition);
        yPosition = addText('ESR', report.selectedReport.bloodTest.esr, yPosition);
        yPosition = addText('HBsAg', report.selectedReport.bloodTest.hbsAg, yPosition);
        yPosition = addText('HCV', report.selectedReport.bloodTest.hcv, yPosition);
        yPosition = addText('HIV Test', report.selectedReport.bloodTest.hivTest, yPosition);
        yPosition += 5;
      }

      // Full Haemogram Table
      if (report.selectedReport?.fullHaemogram) {
        yPosition = addSection('Full Haemogram', yPosition);
        
        const haemogramData = [];
        const haemogram = report.selectedReport.fullHaemogram;
        
        Object.keys(haemogram).forEach(key => {
          if (haemogram[key] && typeof haemogram[key] === 'object') {
            haemogramData.push([
              key.toUpperCase(),
              formatData(haemogram[key].value),
              formatData(haemogram[key].units),
              formatData(haemogram[key].status),
              formatData(haemogram[key].range)
            ]);
          }
        });

        if (haemogramData.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            head: [['Parameter', 'Value', 'Units', 'Status', 'Range']],
            body: haemogramData,
            theme: 'grid',
            headStyles: { fillColor: [45, 212, 191] },
            styles: { fontSize: 8 },
            margin: { left: 20, right: 20 }
          });
          yPosition = doc.lastAutoTable.finalY + 10;
        }
      }

      // Urine Test
      if (report.selectedReport?.urineTest) {
        yPosition = addSection('Urine Test', yPosition);
        yPosition = addText('Albumin', report.selectedReport.urineTest.albumin, yPosition);
        yPosition = addText('Sugar', report.selectedReport.urineTest.sugar, yPosition);
        yPosition = addText('Reaction', report.selectedReport.urineTest.reaction, yPosition);
        yPosition = addText('Microscopic', report.selectedReport.urineTest.microscopic, yPosition);
        yPosition += 5;
      }

      // Lab Remarks
      if (report.selectedReport?.labRemarks) {
        yPosition = addSection('Lab Remarks', yPosition);
        if (report.selectedReport.labRemarks.fitnessEvaluation) {
          yPosition = addText('Overall Status', report.selectedReport.labRemarks.fitnessEvaluation.overallStatus, yPosition);
          yPosition = addText('Other Aspects Fit', report.selectedReport.labRemarks.fitnessEvaluation.otherAspectsFit, yPosition);
        }
        if (report.selectedReport.labRemarks.labSuperintendent) {
          yPosition = addText('Lab Superintendent', report.selectedReport.labRemarks.labSuperintendent.name, yPosition);
        }
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('This is a computer-generated report. No signature required.', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      // Save the PDF
      const fileName = `Clinical_Report_${report.selectedReport?.patientName}_${report.selectedReport?.labNumber}.pdf`;
      doc.save(fileName);
      toast.success('PDF generated successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    }
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
                          onClick={() => generatePDF(report)}
                          className="p-1 bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
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
                    onClick={() => generatePDF(selectedReport)}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors flex items-center"
                  >
                    <Download size={16} className="mr-2" />
                    Download PDF
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
                </div>
              </div>

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
