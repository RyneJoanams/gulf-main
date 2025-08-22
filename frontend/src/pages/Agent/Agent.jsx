import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChevronCircleLeft, FaPrint, FaChevronCircleRight, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import ReportSection from "../Admin/ReportSection";
import "react-toastify/dist/ReactToastify.css";
import TopBar from "../../components/TopBar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Agent = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [testTypeFilter] = useState("All");
    const [dateRange] = useState({ start: "", end: "" });
    const [frontOfficeData, setFrontOfficeData] = useState({}); // Add this state

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Helper function to get medical type
    const getMedicalType = (report) => {
        if (!report) return 'N/A';
        
        // Check multiple possible locations for medical type
        return report?.selectedReport?.medicalType || 
               report?.medicalType || 
               frontOfficeData[report?.selectedReport?.labNumber]?.medicalType || 
               'N/A';
    };

    // Function to fetch front office data for additional patient info
    const fetchFrontOfficeData = async (labNumber) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/frontoffice/${labNumber}`);
            setFrontOfficeData(prev => ({
                ...prev,
                [labNumber]: response.data
            }));
            return response.data;
        } catch (error) {
            console.error("Error fetching front office data:", error);
            return null;
        }
    };

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/clinical");
                setReports(response.data);
                setFilteredReports(response.data);
                
                // Fetch front office data for each report to get complete patient info
                const labNumbers = response.data.map(report => report?.selectedReport?.labNumber).filter(Boolean);
                const uniqueLabNumbers = [...new Set(labNumbers)];
                
                // Fetch front office data for all lab numbers
                uniqueLabNumbers.forEach(labNumber => {
                    fetchFrontOfficeData(labNumber);
                });
                
                toast.success('Reports Successfully Fetched.')
                console.log(response.data);
                setIsLoading(false);
            } catch (error) {
                toast.error("Error Fetching Clinical Reports");
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    useEffect(() => {
        let filtered = reports;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter((report) =>
                (report?.selectedReport?.repatientName &&
                    report?.selectedReport?.patientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report?.selectedReport?.labNumber &&
                    report?.selectedReport?.labNumber?.toString().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by test type
        if (testTypeFilter !== "All") {
            filtered = filtered.filter((report) => report.testType === testTypeFilter);
        }

        // Filter by date range
        if (dateRange.start && dateRange.end) {
            filtered = filtered.filter(
                (report) =>
                    new Date(report.timestamp) >= new Date(dateRange.start) &&
                    new Date(report.timestamp) <= new Date(dateRange.end)
            );
        }

        setFilteredReports(filtered);
    }, [reports, searchTerm, testTypeFilter, dateRange]);

    const printReport = () => {
        if (!selectedReport) {
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
                        margin: 0.4cm;
                        size: A4;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 7px;
                        line-height: 1.1;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .report-container {
                        max-width: 100%;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .header {
                        text-align: center;
                        padding: 3px 0;
                        border-bottom: 1px solid #2dd4bf;
                        margin-bottom: 8px;
                    }
                    .report-title {
                        font-size: 12px;
                        font-weight: bold;
                        color: #0f766e;
                        margin: 1px 0;
                    }
                    .patient-image {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        margin: 1px auto;
                    }
                    .patient-info-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 6px;
                    }
                    .patient-info-table td {
                        border: 0.5px solid #e2e8f0;
                        padding: 2px 4px;
                        font-size: 6px;
                        text-align: center;
                    }
                    .main-content {
                        flex: 1;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 6px;
                        overflow: hidden;
                    }
                    .left-column, .right-column {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .section {
                        break-inside: avoid;
                        margin-bottom: 4px;
                    }
                    .section-title {
                        font-size: 8px;
                        font-weight: bold;
                        color: #0f766e;
                        margin-bottom: 2px;
                        padding-bottom: 1px;
                        border-bottom: 0.5px solid #e2e8f0;
                    }
                    .section-content {
                        background-color: #f9fafb;
                        padding: 2px;
                        border-radius: 2px;
                    }
                    .compact-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 5px;
                    }
                    .compact-table th, .compact-table td {
                        border: 0.3px solid #e2e8f0;
                        padding: 1px 2px;
                        text-align: left;
                        vertical-align: top;
                    }
                    .compact-table th {
                        background-color: #f1f5f9;
                        font-weight: bold;
                        font-size: 5px;
                    }
                    .compact-table .label {
                        font-weight: bold;
                        width: 45%;
                        font-size: 5px;
                    }
                    .compact-table .value {
                        width: 55%;
                        font-size: 5px;
                    }
                    .haemogram-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 4px;
                    }
                    .haemogram-table th, .haemogram-table td {
                        border: 0.3px solid #e2e8f0;
                        padding: 0.5px 1px;
                        text-align: center;
                    }
                    .haemogram-table th {
                        background-color: #f1f5f9;
                        font-weight: bold;
                        font-size: 4px;
                    }
                    .footer {
                        margin-top: 3px;
                        padding-top: 2px;
                        border-top: 1px solid #2dd4bf;
                        text-align: center;
                        font-size: 5px;
                        color: #64748b;
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
                { label: 'Officer', value: formatData(data.clinicalOfficerName) },
                { label: 'Notes', value: formatData(data.clinicalNotes) }
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
                    ${items.map(item => `
                        <tr>
                            <td class="label">${item.label}</td>
                            <td class="value">${item.value}</td>
                        </tr>
                    `).join('')}
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
                    haemogramTests.push({
                        test: key.toUpperCase(),
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
                            <th>Test</th>
                            <th>Value</th>
                            <th>Units</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${haemogramTests.map(test => `
                            <tr>
                                <td>${test.test}</td>
                                <td>${test.value}</td>
                                <td>${test.units}</td>
                                <td>${test.status}</td>
                            </tr>
                        `).join('')}
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
            height: selectedReport.height,
            weight: selectedReport.weight,
            clinicalOfficerName: selectedReport.clinicalOfficerName,
            clinicalNotes: selectedReport.clinicalNotes
        };

        const printContent = `
            <html>
                <head>
                    <title>Clinical Report - ${formatData(selectedReport.selectedReport.patientName)}</title>
                    ${printStyles}
                </head>
                <body>
                    <div class="report-container">
                        <div class="header">
                            <h1 class="report-title">Clinical Report</h1>
                            ${selectedReport.selectedReport.patientImage ? `
                                <img 
                                    src="data:image/jpeg;base64,${selectedReport.selectedReport.patientImage}" 
                                    alt="Patient" 
                                    class="patient-image">
                            ` : ''}
                            <table class="patient-info-table">
                                <tr>
                                    <td><strong>Name:</strong> ${formatData(selectedReport.selectedReport.patientName)}</td>
                                    <td><strong>Lab #:</strong> ${formatData(selectedReport.selectedReport.labNumber)}</td>
                                    <td><strong>Type:</strong> ${formatData(selectedReport.selectedReport.medicalType)}</td>
                                    <td><strong>Date:</strong> ${new Date(selectedReport.selectedReport.timeStamp).toLocaleDateString()}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="main-content">
                            <div class="left-column">
                                ${renderSectionIfHasData('Basic Info', basicInfo, renderBasicInfo)}
                                ${renderSectionIfHasData('General Examination', selectedReport.generalExamination, renderGeneralExam)}
                                ${renderSectionIfHasData('Systemic Examination', selectedReport.systemicExamination, renderSystemicExam)}
                                ${renderSectionIfHasData('Blood Tests', selectedReport.selectedReport.bloodTest, renderBloodTests)}
                                ${renderSectionIfHasData('Area 1 Tests', selectedReport.selectedReport.area1, renderArea1Tests)}
                            </div>
                            
                            <div class="right-column">
                                ${renderSectionIfHasData('Urine Test', selectedReport.selectedReport.urineTest, renderUrineTest)}
                                ${renderSectionIfHasData('Full Haemogram', selectedReport.selectedReport.fullHaemogram, renderHaemogram)}
                                ${hasData(selectedReport.historyOfPastIllness) || hasData(selectedReport.allergy) ? `
                                    <div class="section">
                                        <h3 class="section-title">Medical History</h3>
                                        <div class="section-content">
                                            ${renderMedicalHistory(selectedReport)}
                                        </div>
                                    </div>
                                ` : ''}
                                ${hasData(selectedReport.selectedReport.labRemarks) ? `
                                    <div class="section">
                                        <h3 class="section-title">Lab Remarks</h3>
                                        <div class="section-content">
                                            ${renderLabRemarks(selectedReport.selectedReport.labRemarks)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="footer">
                            <p>Computer-generated report • ${new Date().toLocaleDateString()}</p>
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

    const generatePDF = () => {
        console.log("PDF generation started");
        
        if (!selectedReport) {
            toast.error("No report selected for PDF generation");
            return;
        }

        console.log("Selected report:", selectedReport);

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
            if (selectedReport.selectedReport.patientImage) {
                try {
                    const imgData = `data:image/jpeg;base64,${selectedReport.selectedReport.patientImage}`;
                    doc.addImage(imgData, 'JPEG', pageWidth / 2 - 15, yPosition, 30, 30);
                    yPosition += 35;
                } catch (error) {
                    console.warn('Could not add patient image to PDF:', error);
                }
            }

            // Patient Information
            yPosition = addSection('Patient Information', yPosition);
            yPosition = addText('Patient Name', selectedReport.selectedReport.patientName, yPosition);
            yPosition = addText('Lab Number', selectedReport.selectedReport.labNumber, yPosition);
            yPosition = addText('Medical Type', selectedReport.selectedReport.medicalType, yPosition);
            yPosition = addText('Date', new Date(selectedReport.selectedReport.timeStamp).toLocaleString(), yPosition);
            yPosition += 5;

            // Basic Information
            yPosition = addSection('Basic Information', yPosition);
            yPosition = addText('Height', `${formatData(selectedReport.height)} cm`, yPosition);
            yPosition = addText('Weight', `${formatData(selectedReport.weight)} kg`, yPosition);
            yPosition = addText('Clinical Officer', selectedReport.clinicalOfficerName, yPosition);
            yPosition = addText('Clinical Notes', selectedReport.clinicalNotes, yPosition);
            yPosition = addText('History of Past Illness', selectedReport.historyOfPastIllness, yPosition);
            yPosition = addText('Allergy', selectedReport.allergy, yPosition);
            yPosition += 5;

            // General Examination
            if (selectedReport.generalExamination) {
                yPosition = addSection('General Examination', yPosition);
                yPosition = addText('Left Eye', selectedReport.generalExamination.leftEye, yPosition);
                yPosition = addText('Right Eye', selectedReport.generalExamination.rightEye, yPosition);
                yPosition = addText('Hernia', selectedReport.generalExamination.hernia, yPosition);
                yPosition = addText('Varicose Vein', selectedReport.generalExamination.varicoseVein, yPosition);
                yPosition += 5;
            }

            // Systemic Examination
            if (selectedReport.systemicExamination) {
                yPosition = addSection('Systemic Examination', yPosition);
                yPosition = addText('Blood Pressure', selectedReport.systemicExamination.bloodPressure, yPosition);
                yPosition = addText('Heart', selectedReport.systemicExamination.heart, yPosition);
                yPosition = addText('Pulse Rate', selectedReport.systemicExamination.pulseRate, yPosition);
                yPosition += 5;
            }

            // Area 1 Tests
            if (selectedReport.selectedReport.area1) {
                yPosition = addSection('Area 1 Tests', yPosition);
                yPosition = addText('Blood Group', selectedReport.selectedReport.area1.bloodGroup, yPosition);
                yPosition = addText('Pregnancy Test', selectedReport.selectedReport.area1.pregnancyTest, yPosition);
                yPosition = addText('VDRL Test', selectedReport.selectedReport.area1.vdrlTest, yPosition);
                yPosition += 5;
            }

            // Blood Tests
            if (selectedReport.selectedReport.bloodTest) {
                yPosition = addSection('Blood Tests', yPosition);
                yPosition = addText('ESR', selectedReport.selectedReport.bloodTest.esr, yPosition);
                yPosition = addText('HBsAg', selectedReport.selectedReport.bloodTest.hbsAg, yPosition);
                yPosition = addText('HCV', selectedReport.selectedReport.bloodTest.hcv, yPosition);
                yPosition = addText('HIV Test', selectedReport.selectedReport.bloodTest.hivTest, yPosition);
                yPosition += 5;
            }

            // Full Haemogram Table - Fixed autoTable usage
            if (selectedReport.selectedReport.fullHaemogram) {
                yPosition = addSection('Full Haemogram', yPosition);
                
                const haemogramData = [];
                const haemogram = selectedReport.selectedReport.fullHaemogram;
                
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
            if (selectedReport.selectedReport.urineTest) {
                yPosition = addSection('Urine Test', yPosition);
                yPosition = addText('Albumin', selectedReport.selectedReport.urineTest.albumin, yPosition);
                yPosition = addText('Sugar', selectedReport.selectedReport.urineTest.sugar, yPosition);
                yPosition = addText('Reaction', selectedReport.selectedReport.urineTest.reaction, yPosition);
                yPosition = addText('Microscopic', selectedReport.selectedReport.urineTest.microscopic, yPosition);
                yPosition += 5;
            }

            // Lab Remarks
            if (selectedReport.selectedReport.labRemarks) {
                yPosition = addSection('Lab Remarks', yPosition);
                if (selectedReport.selectedReport.labRemarks.fitnessEvaluation) {
                    yPosition = addText('Overall Status', selectedReport.selectedReport.labRemarks.fitnessEvaluation.overallStatus, yPosition);
                    yPosition = addText('Other Aspects Fit', selectedReport.selectedReport.labRemarks.fitnessEvaluation.otherAspectsFit, yPosition);
                }
                if (selectedReport.selectedReport.labRemarks.labSuperintendent) {
                    yPosition = addText('Lab Superintendent', selectedReport.selectedReport.labRemarks.labSuperintendent.name, yPosition);
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
            const fileName = `Clinical_Report_${selectedReport.selectedReport.patientName}_${selectedReport.selectedReport.labNumber}.pdf`;
            console.log("Saving PDF with filename:", fileName);
            doc.save(fileName);
            toast.success('PDF generated successfully!');

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error generating PDF. Please try again.');
        }
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
                    <h1 className="text-2xl font-bold">Full Clinical Reports</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    {/* Sidebar */}
                    <div className="bg-white dark:bg-gray-200 rounded-lg shadow-lg p-4 overflow-y-auto">
                        <input
                            type="text"
                            placeholder="Search by patient name or lab number"
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {isLoading ? (
                            <p className="text-center">Loading Reports, Please Wait...</p>
                        ) : paginatedReports.length > 0 ? (
                            paginatedReports.map((report) => (
                                <div
                                    key={report._id}
                                    onClick={() => setSelectedReport(report)}
                                    className={`
        relative
        p-6
        rounded-xl
        mb-4
        transition-all
        duration-300
        ease-in-out
        hover:scale-105
        border
        shadow-lg
        hover:shadow-xl
        ${selectedReport?._id === report._id
                                            ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400"
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900"
                                        }`}
                                >
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-teal-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                                            <div className="w-32 h-32 border-4 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner">
                                                {report.selectedReport.patientImage ? (
                                                    <>
                                                        <img
                                                            src={`data:image/jpeg;base64,${report.selectedReport.patientImage}`}
                                                            alt="Patient"
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                        />
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-gray-400 dark:text-gray-500 text-3xl font-light">-</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full space-y-2 text-center">
                                            <h3 className="text-lg font-semibold tracking-wide">
                                                Name: {report.selectedReport.patientName}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Medical Type: <span className="font-semibold">{report.selectedReport.medicalType || 'N/A'}</span>
                                            </p>
                                            <div className={`text-sm space-y-1 ${selectedReport?._id === report._id
                                                ? "text-teal-100"
                                                : "text-gray-600 dark:text-gray-400"
                                                }`}>
                                                <p className="flex items-center justify-center space-x-2">
                                                    <span className="font-medium">Lab Number: </span>
                                                    <span>{report.selectedReport.labNumber}</span>

                                                </p>
                                                <p className="flex items-center justify-center space-x-2">
                                                    <span className="font-medium">Date: </span>
                                                    <span>{new Date(report.selectedReport.timeStamp).toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">No reports found.</p>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className="bg-teal-500 text-white p-2 rounded-md hover:bg-teal-600 disabled:opacity-50"
                            >
                                <FaChevronCircleLeft />
                            </button>
                            <div className="text-center">
                                Page {currentPage} of {Math.ceil(filteredReports.length / itemsPerPage)}
                            </div>
                            <button
                                disabled={currentPage === Math.ceil(filteredReports.length / itemsPerPage)}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="bg-teal-500 text-white p-2 rounded-md hover:bg-teal-600 disabled:opacity-50"
                            >
                                <FaChevronCircleRight />
                            </button>
                        </div>
                    </div>

                    {/* Report Details */}
                    <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
                        {selectedReport ? (
                            <div className="space-y-8">
                                <div className="mb-6">
                                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-4">Full Report Details</h2>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 space-y-6">
                                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{selectedReport.selectedReport.patientName}' Details</h2>
                                        <div className="mt-8 flex justify-end space-x-6">
                                            <button
                                                onClick={generatePDF}
                                                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-all duration-200 flex items-center"
                                            >
                                                <FaDownload className="mr-2" />
                                                Download PDF
                                            </button>
                                        </div>

                                        {/* Patient Information */}
                                        <div className="p-5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Patient Information</h3>
                                            <p className="text-lg text-gray-800 dark:text-gray-200"><strong>Name:</strong> {selectedReport.selectedReport.patientName || "Not Available"}</p>
                                            <p className="text-lg text-gray-800 dark:text-gray-200"><strong>Lab Number:</strong> {selectedReport.selectedReport.labNumber || "Not Available"}</p>
                                            <p className="text-lg font-medium">
                                                Medical Type: <span className="font-semibold">{selectedReport.selectedReport.medicalType || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <ReportSection title="Lab Remarks" data={selectedReport.selectedReport.labRemarks} />
                                        <ReportSection title="Laboratory Remarks" data={selectedReport.selectedReport.labRemarks} />
                                        <ReportSection title="Urine Test" data={selectedReport.selectedReport.urineTest} />
                                        <ReportSection title="Blood Test" data={selectedReport.selectedReport.bloodTest} />
                                        <ReportSection title="General Examination" data={selectedReport.generalExamination} />
                                        <ReportSection title="Systemic Examination" data={selectedReport.systemicExamination} />
                                        <ReportSection title="Other Tests" data={selectedReport.otherTests} />
                                        <ReportSection title="Laboratory Tests" data={selectedReport.selectedReport.area1} />
                                        <ReportSection title="Renal Function" data={selectedReport.selectedReport.renalFunction} />
                                        <ReportSection title="Full Haemogram" data={selectedReport.selectedReport.fullHaemogram} />
                                        <ReportSection title="Liver Function" data={selectedReport.selectedReport.liverFunction} />
                                        <ReportSection title="Radiology Data" data={selectedReport.radiologyData} />
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6 text-center">
                                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">More Clinical Details</h2>
                                        <div className="grid grid-cols-3 sm:grid-cols-2 gap-6">
                                            <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Height</h3>
                                                <p className="text-l font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedReport.height || "Not Available"}cm
                                                </p>
                                            </div>
                                            <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Weight</h3>
                                                <p className="text-l font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedReport.weight || "Not Available"}kg
                                                </p>
                                            </div>
                                            <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Clinical Notes</h3>
                                                <p className="text-l font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedReport.clinicalNotes || "Not Available"}
                                                </p>
                                            </div>
                                            <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Clinical Officer Name</h3>
                                                <p className="text-l font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedReport.clinicalOfficerName || "Not Available"}
                                                </p>
                                            </div>
                                            <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">History of Past Illness</h3>
                                                <p className="text-l font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedReport.historyOfPastIllness || "Not Available"}
                                                </p>
                                            </div>
                                            <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Allergy</h3>
                                                <p className="text-l font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedReport.allergy || "Not Available"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <p className="text-center text-gray-500">Select a report to view details</p>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default Agent;

