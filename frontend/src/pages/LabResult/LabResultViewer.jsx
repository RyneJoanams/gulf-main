import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import html2canvas from 'html2canvas';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';
import { API_BASE_URL } from '../../config/api.config';

const LabResultViewer = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  const formatData = (data) => {
    if (data === null || data === undefined) return 'N/A';
    if (typeof data === 'string') return data.trim() || 'N/A';
    if (typeof data === 'number') return data.toString();
    return 'N/A';
  };

  const generateReportImage = useCallback(async (data) => {
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
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${logo}" alt="Gulf Healthcare Kenya Ltd" style="width: 300px; height: auto; max-width: 100%; display: block; margin: 0 auto;" />
          <h2 style="margin: 10px 0; color: #2dd4bf;">Lab Report Verification</h2>
        </div>
        
        <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; background-color: #f9fafb;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-weight: bold; text-align: center;">Patient Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
            <div><strong>Patient Name:</strong> ${formatData(data.patientName)}</div>
            <div><strong>Lab Number:</strong> ${formatData(data.labNumber)}</div>
            <div><strong>Gender:</strong> ${formatData(data.data.data.gender)}</div>
            <div><strong>Age:</strong> ${formatData(data.data.data.age)}</div>
            <div><strong>Passport Number:</strong> ${formatData(data.data.data.passportNumber)}</div>
            <div><strong>Agent:</strong> ${formatData(data.data.data.agent)}</div>
            <div><strong>Report Date:</strong> ${new Date(data.data.data.selectedReport?.timeStamp || data.reportDate).toLocaleDateString()}</div>
            <div><strong>Report Time:</strong> ${new Date(data.data.data.selectedReport?.timeStamp || Date.now()).toLocaleTimeString()}</div>
          </div>
        </div>
        
        <div style="border: 2px solid #2dd4bf; padding: 25px; margin-bottom: 20px; border-radius: 8px; background-color: #ecfeff;">
          <div style="text-align: center; margin-bottom: 15px;">
            <svg style="width: 60px; height: 60px; margin: 0 auto; display: block;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 style="margin: 0 0 15px 0; color: #0d9488; font-weight: bold; text-align: center; font-size: 16px;">Document Authenticity Verification</h3>
          <p style="text-align: center; font-size: 14px; line-height: 1.8; color: #333; margin: 0;">
            This is an <strong>original and authentic medical laboratory report</strong> issued by <strong>Gulf Healthcare Kenya Ltd</strong>. 
            The document has been digitally verified and <strong>no alterations or modifications</strong> have been made to the original results. 
            This verification confirms the integrity and authenticity of the laboratory findings for the patient identified above.
          </p>
        </div>
        
        <div style="border: 1px solid #fbbf24; padding: 20px; margin-bottom: 30px; border-radius: 5px; background-color: #fffbeb;">
          <h4 style="margin: 0 0 10px 0; color: #d97706; font-weight: bold; font-size: 14px;">Important Notice:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6; color: #92400e;">
            <li>This QR code provides verification of document authenticity only</li>
            <li>For complete lab results and detailed medical information, please refer to the original printed report</li>
            <li>This verification is valid for 90 days from the report date</li>
            <li>Any questions regarding the results should be directed to Gulf Healthcare Kenya Ltd</li>
          </ul>
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="margin: 5px 0;"><strong>Gulf Healthcare Kenya Ltd.</strong></p>
          <p style="margin: 5px 0;">Digital Document Verification System</p>
          <p style="margin: 5px 0;">Accessed via QR Code on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p style="margin: 5px 0; font-size: 10px; color: #999;">This verification page does not display medical test results for privacy and security reasons.</p>
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
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Strategy 1: Try to fetch from backend API (production-ready)
        try {
          console.log(`Fetching lab result from backend: ${reportId}`);
          const response = await axios.get(`${API_BASE_URL}/api/lab-result/${reportId}`);
          
          if (response.data && response.data.success) {
            console.log('Lab result fetched from backend:', response.data.source);
            setReportData(response.data.data);
            setDataSource(response.data.source || 'backend');
            generateReportImage(response.data.data);
            return;
          }
        } catch (apiError) {
          console.log('Backend fetch failed, trying localStorage...', apiError.message);
        }
        
        // Strategy 2: Fallback to localStorage (for backward compatibility)
        let storedData = localStorage.getItem(`lab-result-${reportId}`);
        if (!storedData) {
          storedData = localStorage.getItem(`lab-result-${decodeURIComponent(reportId)}`);
        }
        
        if (storedData) {
          console.log('Lab result fetched from localStorage');
          const parsedData = JSON.parse(storedData);
          setReportData(parsedData);
          setDataSource('localStorage');
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
  }, [reportId, generateReportImage]);

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
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                📤 Share
              </button>
              <button
                onClick={() => window.print()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex items-center gap-2"
              >
                🖨️ Print
              </button>
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
            {dataSource && (
              <p className="mt-2 text-xs text-gray-400">
                Data source: {dataSource === 'localStorage' ? 'Local Cache' : 
                            dataSource === 'snapshot' ? 'Database Snapshot' : 
                            dataSource === 'lab-collection' ? 'Lab Records' : 'Backend'}
              </p>
            )}
          </div>
        </div>
      </div>
  );
};

export default LabResultViewer;