import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';

const LabResultViewer = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const fetchReportData = () => {
      try {
        // Get report data from localStorage (in production, this would be from backend API)
        // Try with and without decodeURIComponent for backward compatibility
        let storedData = localStorage.getItem(`lab-result-${reportId}`);
        if (!storedData) {
          storedData = localStorage.getItem(`lab-result-${decodeURIComponent(reportId)}`);
        }
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setReportData(parsedData);
          generateReportImage(parsedData);
        } else {
          toast.error('Lab result not found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast.error('Error loading lab result');
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportId]);

  const formatData = (data) => {
    if (data === null || data === undefined) return 'N/A';
    if (typeof data === 'string') return data.trim() || 'N/A';
    if (typeof data === 'number') return data.toString();
    return 'N/A';
  };

  const generateReportImage = async (data) => {
    try {
      // Create a temporary div with the report content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.color = '#333';
      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logo}" alt="Gulf Healthcare Kenya Ltd" style="width: 300px; height: auto; max-width: 100%;" />
          <h2 style="margin: 10px 0; color: #2dd4bf;">Clinical Report</h2>
        </div>
        
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Patient Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div><strong>Patient Name:</strong> ${formatData(data.data.selectedReport?.patientName)}</div>
            <div><strong>Gender:</strong> ${formatData(data.data.gender)}</div>
            <div><strong>Age:</strong> ${formatData(data.data.age)}</div>
            <div><strong>Passport Number:</strong> ${formatData(data.data.passportNumber)}</div>
            <div><strong>Lab Number:</strong> ${formatData(data.data.selectedReport?.labNumber)}</div>
            <div><strong>Agent:</strong> ${formatData(data.data.agent)}</div>
            <div><strong>Report Date:</strong> ${new Date(data.data.selectedReport?.timeStamp).toLocaleDateString()}</div>
            <div><strong>Report Time:</strong> ${new Date(data.data.selectedReport?.timeStamp).toLocaleTimeString()}</div>
          </div>
        </div>
        
        ${data.data.selectedReport?.urineTest ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Urine Test</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${data.data.selectedReport.urineTest.albumin ? `<div><strong>Albumin:</strong> ${formatData(data.data.selectedReport.urineTest.albumin)}</div>` : ''}
            ${data.data.selectedReport.urineTest.sugar ? `<div><strong>Sugar:</strong> ${formatData(data.data.selectedReport.urineTest.sugar)}</div>` : ''}
            ${data.data.selectedReport.urineTest.reaction ? `<div><strong>Reaction:</strong> ${formatData(data.data.selectedReport.urineTest.reaction)}</div>` : ''}
            ${data.data.selectedReport.urineTest.microscopic ? `<div><strong>Microscopic:</strong> ${formatData(data.data.selectedReport.urineTest.microscopic)}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        ${data.data.selectedReport?.bloodTest ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Blood Test</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${data.data.selectedReport.bloodTest.esr ? `<div><strong>ESR:</strong> ${formatData(data.data.selectedReport.bloodTest.esr)}</div>` : ''}
            ${data.data.selectedReport.bloodTest.hbsAg ? `<div><strong>HBsAg:</strong> ${formatData(data.data.selectedReport.bloodTest.hbsAg)}</div>` : ''}
            ${data.data.selectedReport.bloodTest.hcv ? `<div><strong>HCV:</strong> ${formatData(data.data.selectedReport.bloodTest.hcv)}</div>` : ''}
            ${data.data.selectedReport.bloodTest.hivTest ? `<div><strong>HIV Test:</strong> ${formatData(data.data.selectedReport.bloodTest.hivTest)}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        ${data.data.selectedReport?.area1 ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Laboratory Tests</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${data.data.selectedReport.area1.bloodGroup ? `<div><strong>Blood Group:</strong> ${formatData(data.data.selectedReport.area1.bloodGroup)}</div>` : ''}
            ${data.data.selectedReport.area1.pregnancyTest ? `<div><strong>Pregnancy Test:</strong> ${formatData(data.data.selectedReport.area1.pregnancyTest)}</div>` : ''}
            ${data.data.selectedReport.area1.vdrlTest ? `<div><strong>VDRL Test:</strong> ${formatData(data.data.selectedReport.area1.vdrlTest)}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        ${data.data.selectedReport?.fullHaemogram ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Full Haemogram</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Parameter</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Value</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Units</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Range</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data.data.selectedReport.fullHaemogram).map(([key, value]) => 
                value && typeof value === 'object' && value.value ? 
                `<tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${key.toUpperCase()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatData(value.value)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatData(value.units)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatData(value.range)}</td>
                </tr>` : ''
              ).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${data.data.selectedReport?.renalFunction ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Renal Function Test</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${Object.entries(data.data.selectedReport.renalFunction).map(([key, value]) => 
              value && typeof value === 'object' && value.value ? 
              `<div><strong>${key}:</strong> ${formatData(value.value)} ${formatData(value.units)}</div>` : ''
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        ${data.data.selectedReport?.liverFunction ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Liver Function Test</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${Object.entries(data.data.selectedReport.liverFunction).map(([key, value]) => 
              value && typeof value === 'object' && value.value ? 
              `<div><strong>${key}:</strong> ${formatData(value.value)} ${formatData(value.units)}</div>` : ''
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        ${data.data.generalExamination ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">General Examination</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${Object.entries(data.data.generalExamination).map(([key, value]) => 
              value ? `<div><strong>${key}:</strong> ${formatData(value)}</div>` : ''
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        ${data.data.systemicExamination ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Systemic Examination</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${Object.entries(data.data.systemicExamination).map(([key, value]) => 
              value ? `<div><strong>${key}:</strong> ${formatData(value)}</div>` : ''
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        ${(data.data.clinicalNotes || data.data.height || data.data.weight) ? `
        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Clinical Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${data.data.height ? `<div><strong>Height:</strong> ${formatData(data.data.height)} cm</div>` : ''}
            ${data.data.weight ? `<div><strong>Weight:</strong> ${formatData(data.data.weight)} kg</div>` : ''}
            ${data.data.clinicalOfficerName ? `<div><strong>Clinical Officer:</strong> ${formatData(data.data.clinicalOfficerName)}</div>` : ''}
            ${data.data.clinicalNotes ? `<div style="grid-column: 1 / -1;"><strong>Clinical Notes:</strong> ${formatData(data.data.clinicalNotes)}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
          <p><strong>Gulf Healthcare Kenya Ltd.</strong> • Digital Lab Report</p>
          <p>This is an official medical report accessed via QR code.</p>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Generate image using html2canvas
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2, // High resolution for clear text
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable console logs
        width: 800,
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: tempDiv.scrollHeight
      });
      
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      setImageUrl(imageDataUrl);
      
      // Clean up
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Error generating report image:', error);
      toast.error('Error generating report image');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.download = `lab-report-${reportData?.labNumber || 'unknown'}.png`;
      link.href = imageUrl;
      link.click();
    }
  };

  const shareImage = async () => {
    if (navigator.share && imageUrl) {
      try {
        // Convert data URL to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `lab-report-${reportData?.labNumber || 'unknown'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Lab Report',
          text: `Lab Report for ${reportData?.patientName || 'Patient'}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast.error('Sharing not supported on this device');
      }
    } else {
      toast.info('Sharing not available. Use download instead.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lab result...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lab Result Not Found</h1>
          <p className="text-gray-600 mb-4">The requested lab result could not be found.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-teal-500 text-white px-6 py-2 rounded hover:bg-teal-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .printable {
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
            .printable img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .printable h1, .printable h2 {
              text-align: center;
              margin-bottom: 20px;
              color: black;
            }
            .report-info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
          }
        `}
      </style>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Digital Lab Result</h1>
              <p className="text-gray-600">Accessed via QR Code</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadImage}
                disabled={!imageUrl}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                📥 Download Image
              </button>
              <button
                onClick={shareImage}
                disabled={!imageUrl}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                📤 Share
              </button>
              <button
                onClick={() => window.print()}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex items-center gap-2"
              >
                🖨️ Print
              </button>
            </div>
          </div>
        </div>

        <div className="printable">
          {/* Report Header for Print */}
          <div className="text-center mb-6">
            <img src={logo} alt="Gulf Healthcare Kenya Ltd" className="w-64 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Gulf Healthcare Kenya Ltd</h1>
            <h2 className="text-xl text-gray-600">Laboratory Report</h2>
          </div>

          {/* Report Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Information</h2>
            <div className="report-info-grid grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong className="text-gray-600">Patient:</strong>
                <p className="text-gray-800">{reportData.patientName}</p>
              </div>
              <div>
                <strong className="text-gray-600">Lab Number:</strong>
                <p className="text-gray-800">{reportData.labNumber}</p>
              </div>
              <div>
                <strong className="text-gray-600">Date:</strong>
                <p className="text-gray-800">{reportData.reportDate}</p>
              </div>
            </div>
          </div>

          {/* Report Image */}
          {imageUrl && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Lab Report</h2>
              <div className="text-center">
                <img
                  src={imageUrl}
                  alt="Lab Report"
                  className="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm"
                  style={{ maxWidth: '800px' }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>© Gulf Healthcare Kenya Ltd. | Official Digital Lab Report</p>
            <p className="mt-2">For any inquiries, please contact our support team</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultViewer;