import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPrint, FaUser, FaClipboardList, FaFlask, FaFileMedical } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopBar from "../../components/TopBar";
import AgentSidebar from "./AgentSidebar";
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';
import { API_BASE_URL, FRONTEND_URL } from '../../config/api.config';
import { getImageUrl } from '../../utils/cloudinaryHelper';

const Agent = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [viewMode, setViewMode] = useState("summary"); // "summary" or "detailed"

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Search function to fetch reports based on search term
    const searchReports = async (searchValue) => {
        if (!searchValue.trim()) {
            setFilteredReports([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        try {
            // Use the dedicated search endpoint instead of fetching all clinical records.
            // This runs an indexed DB query and returns only matching records.
            const response = await axios.get(`${API_BASE_URL}/api/clinical/search`, {
                params: { query: searchValue.trim(), limit: 50 }
            });
            const filtered = response.data || [];
            
            setReports(filtered);
            setFilteredReports(filtered);
            setCurrentPage(1); // Reset to first page when searching
            
            if (filtered.length === 0) {
                toast.info('No patients found matching your search criteria.');
            } else {
                toast.success(`Found ${filtered.length} patient(s) matching your search.`);
            }
        } catch (error) {
            toast.error("Error searching for patients");
            setFilteredReports([]);
        }
        setIsLoading(false);
    };

    // Handle search input changes with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim()) {
                searchReports(searchTerm);
            } else {
                setFilteredReports([]);
                setHasSearched(false);
                setSelectedReport(null);
            }
        }, 500); // Debounce search for 500ms

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Helper function to check if a test section has valid data
    const hasValidData = (data) => {
        if (!data) return false;
        if (typeof data === 'string') return data.trim() !== '' && data !== 'N/A';
        if (typeof data === 'object') {
            return Object.values(data).some(value => {
                if (value && typeof value === 'object') {
                    // Check if it's a test result object with a value property
                    if (value.value) {
                        return value.value !== '' && value.value !== 'N/A' && value.value !== null && value.value !== undefined;
                    }
                    return hasValidData(value);
                }
                return value !== '' && value !== 'N/A' && value !== null && value !== undefined;
            });
        }
        return data !== null && data !== undefined && data !== '';
    };

    // Function to fetch complete patient details and enhance report data
    const enhanceReportWithPatientData = async (report) => {
        try {
            // Fetch only the specific patient by name via query to avoid loading all patients
            const patientName = report.selectedReport?.patientName;
            const response = await axios.get(`${API_BASE_URL}/api/patient`, {
                params: { name: patientName, excludePhoto: false, limit: 5 }
            });
            const patients = response.data.patients || (Array.isArray(response.data) ? response.data : []);
            
            // Find patient by name (case-insensitive)
            const patient = patients.find(p => 
                p.name.toLowerCase() === (patientName || '').toLowerCase()
            );
            
            if (patient) {
                // Enhance the report with complete patient data
                const enhancedReport = {
                    ...report,
                    passportNumber: patient.passportNumber,
                    gender: patient.sex, // Patient model uses 'sex' field  
                    age: patient.age,
                    agent: patient.agent,
                    medicalType: patient.medicalType || report.selectedReport?.medicalType,
                    patientPhoto: patient.photo || null, // Cloudinary URL
                };
                setSelectedReport(enhancedReport);
            } else {
                setSelectedReport(report);
                toast.warning(`Complete patient details not found for: ${report.selectedReport.patientName}`);
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
            setSelectedReport(report);
            toast.error('Failed to fetch complete patient details');
        }
    };

    const printReport = async () => {
        if (!selectedReport) {
            toast.error("No report selected for printing");
            return;
        }

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

        // Ensure we have a complete, absolute URL with protocol
        let baseUrl = FRONTEND_URL;
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = `https://${baseUrl}`;
        }
        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, '');
        
        const reportId = selectedReport.selectedReport._id;
        const qrUrl = `${baseUrl}/lab-result/${reportId}`;
        console.log('Generated QR URL:', qrUrl); // Debug log
        
        // Generate QR code
        const qrCodeBase64 = await generateQRCodeBase64(qrUrl);

        // Get current user for digital signature
        const getCurrentUser = () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userData = JSON.parse(userStr);
                    return userData.name || userData.email || 'System User';
                }
                return 'System User';
            } catch (error) {
                console.error('Error getting user:', error);
                return 'System User';
            }
        };

        const currentUser = getCurrentUser();
        const currentDateTime = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

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

        const formatData = (data) => {
            if (data === null || data === undefined) return 'N/A';
            if (data === '') return 'N/A';
            if (typeof data === 'number' && data === 0) return '0';
            if (typeof data === 'string' && data.trim() === '') return 'N/A';
            return String(data);
        };

        // Render functions matching LeftBar component
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

        const renderClinicalInfo = (data) => {
            const items = [
                { label: 'Height', value: data.height ? `${formatData(data.height)} cm` : 'N/A' },
                { label: 'Weight', value: data.weight ? `${formatData(data.weight)} kg` : 'N/A' }
            ];
            
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

        const renderMedicalHistory = (report) => {
            const items = [
                { label: 'Past Illness', value: formatData(report.historyOfPastIllness) },
                { label: 'Allergies', value: formatData(report.allergy) }
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
        const isSmVdrlReport = selectedReport.selectedReport?.labNumber?.includes('-S') || 
                               selectedReport.selectedReport?.medicalType === 'SM-VDRL';
        
        const basicInfo = {
            height: selectedReport.height,
            weight: selectedReport.weight,
            ...(isSmVdrlReport ? {} : {
                clinicalOfficerName: selectedReport.clinicalOfficerName,
                clinicalNotes: selectedReport.clinicalNotes
            })
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
                    .tests-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 10px;
                        margin-bottom: 16px;
                    }
                    .full-width-section {
                        width: 100%;
                        margin-bottom: 12px;
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

        const reportTitle = "Clinical Report";
        const printContent = `
            <html>
                <head>
                    <title>Clinical Report - ${formatData(selectedReport.selectedReport.patientName)}</title>
                    ${printStyles}
                </head>
                <body>
                    <div class="report-container">
                        <div class="header">
                            <div style="text-align: center; margin-bottom: 10px;">
                                ${logoBase64 ? `<img src="${logoBase64}" alt="Gulf Healthcare Kenya Ltd" style="width: 300px; height: auto; max-width: 100%;" />` : ''}
                            </div>
                            <h2 class="report-title" style="margin-top: 10px;">${reportTitle}</h2>
                            
                            <div class="patient-info-section">
                                <table class="patient-info-table">
                                    <tr>
                                        <td><strong>Patient Name:</strong> ${formatData(selectedReport.selectedReport.patientName)}</td>
                                        <td><strong>Gender:</strong> ${formatData(selectedReport.gender)}</td>
                                        <td><strong>Age:</strong> ${formatData(selectedReport.age)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Passport Number:</strong> ${formatData(selectedReport.passportNumber)}</td>
                                        <td><strong>Lab Number:</strong> ${formatData(selectedReport.selectedReport.labNumber)}</td>
                                        <td><strong>Agent:</strong> ${formatData(selectedReport.agent)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Medical Type:</strong> ${formatData(selectedReport.medicalType || selectedReport.selectedReport?.medicalType)}</td>
                                        <td><strong>Report Date:</strong> ${new Date(selectedReport.selectedReport.timeStamp).toLocaleDateString()}</td>
                                        <td><strong>Report Time:</strong> ${new Date(selectedReport.selectedReport.timeStamp).toLocaleTimeString()}</td>
                                    </tr>
                                </table>
                                
                                <div class="patient-image-container">
                                    ${selectedReport.patientPhoto ? `
                                        <img 
                                            src="${getImageUrl(selectedReport.patientPhoto, { width: 70, height: 70, crop: 'fill' })}" 
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
                                ${renderSectionIfHasData('General Examination', selectedReport.generalExamination, renderGeneralExam)}
                                ${renderSectionIfHasData('Systemic Examination', selectedReport.systemicExamination, renderSystemicExam)}
                                ${renderSectionIfHasData('Urine Test', selectedReport.selectedReport?.urineTest, renderUrineTest)}
                                ${renderSectionIfHasData('Blood Tests', selectedReport.selectedReport?.bloodTest, renderBloodTests)}
                                ${renderSectionIfHasData('Laboratory Tests', selectedReport.selectedReport?.area1, renderArea1Tests)}
                                ${renderSectionIfHasData('Radiology Tests', selectedReport.radiologyData, renderRadiologyTests)}
                            </div>
                            
                            <!-- Full-width sections for larger test tables -->
                            <div class="full-width-section">
                                ${renderSectionIfHasData('Full Haemogram', selectedReport.selectedReport?.fullHaemogram, renderHaemogram)}
                            </div>
                            
                            <div class="full-width-section">
                                ${renderSectionIfHasData('Renal Function Test', selectedReport.selectedReport?.renalFunction, renderRenalFunction)}
                            </div>
                            
                            <div class="full-width-section">
                                ${renderSectionIfHasData('Liver Function Test', selectedReport.selectedReport?.liverFunction, renderLiverFunction)}
                            </div>
                            
                            <!-- Clinical Notes and Lab Remarks at the Bottom -->
                            <div class="bottom-section">
                                ${hasData(selectedReport.historyOfPastIllness) || hasData(selectedReport.allergy) ? `
                                    <div class="section">
                                        <h3 class="section-title">Medical History</h3>
                                        <div class="section-content">
                                            ${renderMedicalHistory(selectedReport)}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${renderSectionIfHasData('Clinical Information', basicInfo, renderClinicalInfo)}
                                
                                ${hasData(selectedReport.selectedReport?.labRemarks) ? `
                                    <div class="section">
                                        <h3 class="section-title">Lab Remarks & Conclusions</h3>
                                        <div class="section-content">
                                            ${renderLabRemarks(selectedReport.selectedReport.labRemarks)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="footer">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px;">
                                <div style="flex: 0 0 auto;">
                                    ${qrCodeBase64 ? `
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div style="display: inline-block; text-align: center; padding: 6px; background: #FFFFFF; border-radius: 4px; border: 1px solid #e5e7eb;">
                                                <img src="${qrCodeBase64}" alt="QR Code" style="width: 80px; height: 80px; display: block;" />
                                                <div style="font-size: 7px; margin-top: 2px; color: #2dd4bf; font-weight: bold;">Scan for Digital Copy</div>
                                            </div>
                                            <div style="font-size: 8px; color: #6b7280; max-width: 180px; text-align: left; line-height: 1.4;">
                                                <div style="font-weight: 600; color: #374151; margin-bottom: 3px; font-size: 9px;">Digital Signature</div>
                                                <div style="margin-bottom: 2px;"><strong>Signed by:</strong> ${currentUser}</div>
                                                <div><strong>Date & Time:</strong> ${currentDateTime}</div>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="flex: 1; text-align: center;">
                                    <p><strong>Gulf Healthcare Kenya Ltd.</strong> • Computer-generated report</p>
                                    <p>This is an official medical report. For any queries, contact our laboratory department.</p>
                                </div>
                                <div style="flex: 0 0 auto; width: 130px;">
                                    <!-- Spacer for layout balance -->
                                </div>
                            </div>
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

    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <TopBar />
            <div className="bg-gray-50 text-black min-h-screen transition-all duration-300">
                <div className="flex justify-between items-center p-4 bg-gray-800 text-white shadow-md">
                    <h1 className="text-2xl font-bold">Agent Portal - Patient Summary</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                    {/* Sidebar */}
                    <AgentSidebar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isLoading={isLoading}
                        hasSearched={hasSearched}
                        paginatedReports={paginatedReports}
                        filteredReports={filteredReports}
                        selectedReport={selectedReport}
                        handleReportSelection={enhanceReportWithPatientData}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                    />

                    {/* Patient Summary */}
                    <div className="col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
                        {selectedReport ? (
                            <div className="space-y-6">
                                {/* Header with View Toggle and Print Buttons */}
                                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">
                                        Patient Report
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        {/* View Mode Toggle */}
                                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                            <button
                                                onClick={() => setViewMode("summary")}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                                    viewMode === "summary"
                                                        ? "bg-teal-600 text-white shadow-md"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                                }`}
                                            >
                                                <FaClipboardList />
                                                Summary
                                            </button>
                                            <button
                                                onClick={() => setViewMode("detailed")}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                                    viewMode === "detailed"
                                                        ? "bg-teal-600 text-white shadow-md"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                                }`}
                                            >
                                                <FaFlask />
                                                Lab Results
                                            </button>
                                        </div>
                                        
                                        {/* Print Button */}
                                        <button
                                            onClick={() => printReport()}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                                        >
                                            <FaPrint />
                                            Print Report
                                        </button>
                                    </div>
                                </div>

                                {/* Patient Information Card */}
                                <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-teal-200">
                                    <div className="flex items-center space-x-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-24 h-24 border-4 border-teal-300 rounded-full overflow-hidden bg-white shadow-lg">
                                                {selectedReport.patientPhoto ? (
                                                    <img
                                                        src={getImageUrl(selectedReport.patientPhoto, { width: 96, height: 96, crop: 'fill' })}
                                                        alt="Patient"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FaUser className="text-gray-400 text-3xl" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                                                {selectedReport.selectedReport.patientName}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Gender:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.gender || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Age:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.age || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Lab Number:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.selectedReport.labNumber}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Passport Number:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.passportNumber || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Agent:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.agent || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Medical Type:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.medicalType || selectedReport.selectedReport?.medicalType || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Report Date:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {new Date(selectedReport.selectedReport.timeStamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Report Time:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {new Date(selectedReport.selectedReport.timeStamp).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary View - Only shown when viewMode is "summary" */}
                                {viewMode === "summary" && (
                                    <>
                                        {/* Fitness Evaluation Card */}
                                        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg border-l-4 border-teal-500 p-6">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <FaClipboardList className="text-teal-600 text-2xl" />
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                                    Fitness Evaluation
                                                </h3>
                                            </div>
                                            
                                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-6">
                                                <div className="text-center">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-2">
                                                        Medical Status
                                                    </span>
                                                    <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold ${
                                                        selectedReport?.selectedReport?.labRemarks?.fitnessEvaluation?.overallStatus?.toLowerCase().includes('fit') 
                                                            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                                                            : selectedReport?.selectedReport?.labRemarks?.fitnessEvaluation?.overallStatus?.toLowerCase().includes('unfit')
                                                            ? 'bg-red-100 text-red-800 border-2 border-red-300'
                                                            : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                                                    }`}>
                                                        {selectedReport?.selectedReport?.labRemarks?.fitnessEvaluation?.overallStatus || 'Status Not Available'}
                                                    </div>
                                                </div>
                                                
                                                {selectedReport?.selectedReport?.labRemarks?.labSuperintendent?.name && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-500">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                            Evaluated by:
                                                        </span>
                                                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                            {selectedReport.selectedReport.labRemarks.labSuperintendent.name}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Clinical Notes Section */}
                                                {selectedReport?.selectedReport?.labRemarks?.notepadContent && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-500">
                                                        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <i className="fas fa-sticky-note text-blue-600 dark:text-blue-400"></i>
                                                                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                                                    Clinical Notes:
                                                                </span>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-600 text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
                                                                {selectedReport.selectedReport.labRemarks.notepadContent}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notice for Summary View */}
                                        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                            <div className="flex items-start space-x-2">
                                                <div className="flex-shrink-0">
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">i</span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                                    <p className="font-medium mb-1">Agent Portal Notice</p>
                                                    <p>
                                                        This summary shows basic patient information and fitness evaluation. Switch to 'Lab Results' to view complete laboratory test data.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Detailed Lab Results - Only shown when viewMode is "detailed" */}
                                {viewMode === "detailed" && (
                                    <div className="space-y-6">
                                        <div className="border-t border-gray-300 pt-6">
                                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                                <FaFlask className="text-purple-600" />
                                                Complete Laboratory Results
                                            </h2>
                                        </div>

                                        {/* Full Haemogram Table - Only show if data exists */}
                                        {hasValidData(selectedReport.selectedReport.fullHaemogram) && (
                                            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 border-b border-red-100">
                                                    <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                                        Full Haemogram
                                                        <span className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded-full">
                                                            {Object.keys(selectedReport.selectedReport.fullHaemogram).length} tests
                                                        </span>
                                                    </h3>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-gray-200">
                                                                <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Parameter</th>
                                                                <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Value</th>
                                                                <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Units</th>
                                                                <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Range</th>
                                                                <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {Object.entries(selectedReport.selectedReport.fullHaemogram).map(([key, value]) => {
                                                                let displayValue = 'N/A';
                                                                let units = '';
                                                                let status = '';
                                                                let range = '';
                                                                
                                                                if (value && typeof value === 'object') {
                                                                    displayValue = value.value || 'N/A';
                                                                    units = value.units || '';
                                                                    status = value.status || '';
                                                                    range = value.range || '';
                                                                } else if (value) {
                                                                    displayValue = value.toString();
                                                                }
                                                                
                                                                return (
                                                                    <tr key={key} className="hover:bg-red-50 dark:hover:bg-gray-600 transition-colors duration-200">
                                                                        <td className="py-3 text-gray-600 dark:text-gray-300 capitalize font-medium">
                                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </td>
                                                                        <td className="py-3 text-center font-semibold text-gray-800 dark:text-white">
                                                                            <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                                                                                {displayValue}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 text-center text-gray-700 dark:text-gray-300">
                                                                            <span className="text-sm">{units || '-'}</span>
                                                                        </td>
                                                                        <td className="py-3 text-center text-gray-700 dark:text-gray-300">
                                                                            <span className="text-sm bg-blue-50 dark:bg-gray-600 px-2 py-1 rounded">
                                                                                {range || '-'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 text-center">
                                                                            {status ? (
                                                                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                                                    status.toLowerCase() === 'normal' ? 'bg-green-100 text-green-700' :
                                                                                    status.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                                                                                    status.toLowerCase() === 'low' ? 'bg-yellow-100 text-yellow-700' :
                                                                                    'bg-gray-100 text-gray-700'
                                                                                }`}>
                                                                                    {status}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-sm text-gray-400">-</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Renal Function and Liver Function - Side by Side - Only show if at least one has data */}
                                        {(hasValidData(selectedReport.selectedReport.renalFunction) || hasValidData(selectedReport.selectedReport.liverFunction)) && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Renal Function */}
                                                {hasValidData(selectedReport.selectedReport.renalFunction) && (
                                                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-100">
                                                        <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                                                            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                                                            Renal Function
                                                        </h3>
                                                    </div>
                                                    <div className="p-4">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-gray-200">
                                                                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Parameter</th>
                                                                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Value</th>
                                                                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {Object.entries(selectedReport.selectedReport.renalFunction).map(([key, value]) => {
                                                                    let displayValue = 'N/A';
                                                                    let units = '';
                                                                    let status = '';
                                                                    
                                                                    if (value && typeof value === 'object') {
                                                                        displayValue = value.value || 'N/A';
                                                                        units = value.units || '';
                                                                        status = value.status || '';
                                                                    } else if (value) {
                                                                        displayValue = value.toString();
                                                                    }
                                                                    
                                                                    return (
                                                                        <tr key={key} className="hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-200">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 capitalize font-medium">
                                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                            </td>
                                                                            <td className="py-3 text-center font-semibold text-gray-800 dark:text-white">
                                                                                <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                                                                                    {displayValue} {units}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-3 text-center">
                                                                                {status ? (
                                                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                                                        status.toLowerCase() === 'normal' ? 'bg-green-100 text-green-700' :
                                                                                        status.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                                                                                        status.toLowerCase() === 'low' ? 'bg-yellow-100 text-yellow-700' :
                                                                                        'bg-gray-100 text-gray-700'
                                                                                    }`}>
                                                                                        {status}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-sm text-gray-400">-</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                                {/* Liver Function */}
                                                {hasValidData(selectedReport.selectedReport.liverFunction) && (
                                                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-green-100">
                                                        <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                                                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                                            Liver Function
                                                        </h3>
                                                    </div>
                                                    <div className="p-4">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-gray-200">
                                                                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Parameter</th>
                                                                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Value</th>
                                                                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {Object.entries(selectedReport.selectedReport.liverFunction).map(([key, value]) => {
                                                                    let displayValue = 'N/A';
                                                                    let units = '';
                                                                    let status = '';
                                                                    
                                                                    if (value && typeof value === 'object') {
                                                                        displayValue = value.value || 'N/A';
                                                                        units = value.units || '';
                                                                        status = value.status || '';
                                                                    } else if (value) {
                                                                        displayValue = value.toString();
                                                                    }
                                                                    
                                                                    return (
                                                                        <tr key={key} className="hover:bg-green-50 dark:hover:bg-gray-600 transition-colors duration-200">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 capitalize font-medium">
                                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                            </td>
                                                                            <td className="py-3 text-center font-semibold text-gray-800 dark:text-white">
                                                                                <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                                                                                    {displayValue} {units}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-3 text-center">
                                                                                {status ? (
                                                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                                                        status.toLowerCase() === 'normal' ? 'bg-green-100 text-green-700' :
                                                                                        status.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                                                                                        status.toLowerCase() === 'low' ? 'bg-yellow-100 text-yellow-700' :
                                                                                        'bg-gray-100 text-gray-700'
                                                                                    }`}>
                                                                                        {status}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-sm text-gray-400">-</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                            </div>
                                        )}

                                        {/* Additional Tests - Only show if data exists */}
                                        {(hasValidData(selectedReport.selectedReport.urineTest) ||
                                          hasValidData(selectedReport.selectedReport.bloodTest) ||
                                          hasValidData(selectedReport.selectedReport.area1)) && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Additional Laboratory Tests</h3>
                                                
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Urine & Blood Tests */}
                                                    {(hasValidData(selectedReport.selectedReport.urineTest) ||
                                                      hasValidData(selectedReport.selectedReport.bloodTest)) && (
                                                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 border-b border-yellow-100">
                                                                <h4 className="text-lg font-semibold text-yellow-800">Basic Tests</h4>
                                                            </div>
                                                            <div className="p-4 space-y-4">
                                                                {hasValidData(selectedReport.selectedReport.urineTest) && (
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 pb-1 border-b">🧪 Urine Analysis</h5>
                                                                        <table className="w-full text-sm">
                                                                            <tbody className="divide-y divide-gray-100">
                                                                                {Object.entries(selectedReport.selectedReport.urineTest).map(([key, value]) => (
                                                                                    value && value !== '' && value !== 'N/A' && (
                                                                                        <tr key={key} className="hover:bg-yellow-50 dark:hover:bg-gray-600">
                                                                                            <td className="py-2 text-gray-600 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                                            <td className="py-2 text-right font-semibold text-gray-800 dark:text-white">{value}</td>
                                                                                        </tr>
                                                                                    )
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                                
                                                                {hasValidData(selectedReport.selectedReport.bloodTest) && (
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 pb-1 border-b">🩸 Blood Analysis</h5>
                                                                        <table className="w-full text-sm">
                                                                            <tbody className="divide-y divide-gray-100">
                                                                                {Object.entries(selectedReport.selectedReport.bloodTest).map(([key, value]) => (
                                                                                    value && value !== '' && value !== 'N/A' && (
                                                                                        <tr key={key} className="hover:bg-yellow-50 dark:hover:bg-gray-600">
                                                                                            <td className="py-2 text-gray-600 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                                            <td className="py-2 text-right font-semibold">
                                                                                                <span className={`px-2 py-1 rounded text-sm ${
                                                                                                    (key === 'hivTest' || key === 'hbsAg' || key === 'hcv') ? 
                                                                                                    (value.toLowerCase() === 'positive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                                                                                                    'text-gray-800 dark:text-white'
                                                                                                }`}>
                                                                                                    {value}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Specialized Tests */}
                                                    {hasValidData(selectedReport.selectedReport.area1) && (
                                                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-b border-purple-100">
                                                                <h4 className="text-lg font-semibold text-purple-800">Specialized Tests</h4>
                                                            </div>
                                                            <div className="p-4">
                                                                <table className="w-full text-sm">
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {Object.entries(selectedReport.selectedReport.area1).map(([key, value]) => (
                                                                            value && value !== '' && value !== 'N/A' && (
                                                                                <tr key={key} className="hover:bg-purple-50 dark:hover:bg-gray-600">
                                                                                    <td className="py-3 text-gray-600 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                                    <td className="py-3 text-right font-semibold">
                                                                                        <span className={`px-2 py-1 rounded text-sm ${
                                                                                            (key.includes('Test') || key.includes('Disease')) ? 
                                                                                            (value.toLowerCase() === 'positive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                                                                                            'text-gray-800 dark:text-white'
                                                                                        }`}>
                                                                                            {value}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Clinical Examination Data - Only show if data exists */}
                                        {(hasValidData(selectedReport.generalExamination) || hasValidData(selectedReport.systemicExamination) || selectedReport.height || selectedReport.weight) && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Clinical Examination</h3>
                                                
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* General Examination */}
                                                    {hasValidData(selectedReport.generalExamination) && (
                                                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                            <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 border-b border-cyan-100">
                                                                <h4 className="text-lg font-semibold text-cyan-800">General Examination</h4>
                                                            </div>
                                                            <div className="p-4">
                                                                <table className="w-full text-sm">
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {Object.entries(selectedReport.generalExamination).map(([key, value]) => (
                                                                            value && value !== '' && value !== 'N/A' && (
                                                                                <tr key={key} className="hover:bg-cyan-50 dark:hover:bg-gray-600">
                                                                                    <td className="py-3 text-gray-600 dark:text-gray-300 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                                    <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{value}</td>
                                                                                </tr>
                                                                            )
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Systemic Examination */}
                                                    {hasValidData(selectedReport.systemicExamination) && (
                                                        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                            <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-4 border-b border-cyan-100">
                                                                <h4 className="text-lg font-semibold text-cyan-800">Systemic Examination</h4>
                                                            </div>
                                                            <div className="p-4">
                                                                <table className="w-full text-sm">
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {Object.entries(selectedReport.systemicExamination).map(([key, value]) => (
                                                                            value && value !== '' && value !== 'N/A' && (
                                                                                <tr key={key} className="hover:bg-cyan-50 dark:hover:bg-gray-600">
                                                                                    <td className="py-3 text-gray-600 dark:text-gray-300 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                                                    <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{value}</td>
                                                                                </tr>
                                                                            )
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Additional Clinical Information */}
                                                {(selectedReport.height || selectedReport.weight || selectedReport.clinicalNotes || selectedReport.historyOfPastIllness || selectedReport.allergy) && (
                                                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 border-b border-indigo-100">
                                                            <h4 className="text-lg font-semibold text-indigo-800">Additional Clinical Information</h4>
                                                        </div>
                                                        <div className="p-4">
                                                            <table className="w-full text-sm">
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {selectedReport.height && (
                                                                        <tr className="hover:bg-indigo-50 dark:hover:bg-gray-600">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 font-medium">Height</td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{selectedReport.height}</td>
                                                                        </tr>
                                                                    )}
                                                                    {selectedReport.weight && (
                                                                        <tr className="hover:bg-indigo-50 dark:hover:bg-gray-600">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 font-medium">Weight</td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{selectedReport.weight}</td>
                                                                        </tr>
                                                                    )}
                                                                    {selectedReport.historyOfPastIllness && selectedReport.historyOfPastIllness !== 'N/A' && (
                                                                        <tr className="hover:bg-indigo-50 dark:hover:bg-gray-600">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 font-medium">History of Past Illness</td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{selectedReport.historyOfPastIllness}</td>
                                                                        </tr>
                                                                    )}
                                                                    {selectedReport.allergy && selectedReport.allergy !== 'N/A' && (
                                                                        <tr className="hover:bg-indigo-50 dark:hover:bg-gray-600">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 font-medium">Allergies</td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{selectedReport.allergy}</td>
                                                                        </tr>
                                                                    )}
                                                                    {selectedReport.clinicalNotes && selectedReport.clinicalNotes !== 'N/A' && (
                                                                        <tr className="hover:bg-indigo-50 dark:hover:bg-gray-600">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 font-medium">Clinical Notes</td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{selectedReport.clinicalNotes}</td>
                                                                        </tr>
                                                                    )}
                                                                    {selectedReport.clinicalOfficerName && (
                                                                        <tr className="hover:bg-indigo-50 dark:hover:bg-gray-600">
                                                                            <td className="py-3 text-gray-600 dark:text-gray-300 font-medium">Clinical Officer</td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800 dark:text-white">{selectedReport.clinicalOfficerName}</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Radiology Assessment - Only show if data exists */}
                                        {hasValidData(selectedReport.radiologyData) && (
                                            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200">
                                                <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 border-b border-teal-100">
                                                    <h4 className="text-lg font-semibold text-teal-800 flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></span>
                                                        Radiology Assessment
                                                    </h4>
                                                </div>
                                                <div className="p-4">
                                                    <div className="space-y-3">
                                                        {selectedReport.radiologyData.heafMantouxTest && (
                                                            <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Heaf/Mantoux Test:</span>
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                        selectedReport.radiologyData.heafMantouxTest.toLowerCase() === 'positive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                        {selectedReport.radiologyData.heafMantouxTest}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedReport.radiologyData.chestXRayTest && (
                                                            <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chest X-Ray:</span>
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                        selectedReport.radiologyData.chestXRayTest.toLowerCase() === 'abnormal' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                        {selectedReport.radiologyData.chestXRayTest}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedReport.radiologyData.chestXrayRemarks && (
                                                            <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chest X-Ray Remarks:</span>
                                                                    <span className="text-sm text-gray-800 dark:text-white">{selectedReport.radiologyData.chestXrayRemarks}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notice for Lab Results View */}
                                        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                            <div className="flex items-start space-x-2">
                                                <div className="flex-shrink-0">
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">i</span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                                    <p className="font-medium mb-1">Laboratory Results</p>
                                                    <p>
                                                        This view shows all laboratory test results that were performed for this patient. Use the 'Print Full Report' option to generate a comprehensive printable report.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FaUser className="mx-auto text-6xl text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                    {!hasSearched ? "Search for a Patient" : "No Patient Selected"}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {!hasSearched 
                                        ? "Use the search box to find a patient by passport number or ID"
                                        : "Select a patient from the search results to view their summary"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Agent;

