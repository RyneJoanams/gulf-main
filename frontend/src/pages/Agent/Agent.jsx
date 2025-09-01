import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChevronCircleLeft, FaPrint, FaChevronCircleRight, FaUser, FaClipboardList } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopBar from "../../components/TopBar";

const Agent = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/clinical");
                setReports(response.data);
                setFilteredReports(response.data);
                
                toast.success('Reports Successfully Fetched.')
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

        // Filter by search term (patient name or lab number)
        if (searchTerm) {
            filtered = filtered.filter((report) =>
                (report?.selectedReport?.patientName &&
                    report?.selectedReport?.patientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report?.selectedReport?.labNumber &&
                    report?.selectedReport?.labNumber?.toString().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredReports(filtered);
    }, [reports, searchTerm]);

    const printReport = () => {
        if (!selectedReport) {
            toast.error("No report selected for printing");
            return;
        }

        const formatData = (data) => {
            return data || 'N/A';
        };

        // Get fitness evaluation from lab remarks
        const getFitnessEvaluation = () => {
            const labRemarks = selectedReport?.selectedReport?.labRemarks;
            if (labRemarks?.fitnessEvaluation?.overallStatus) {
                return labRemarks.fitnessEvaluation.overallStatus;
            }
            return 'Not Available';
        };

        const printStyles = `
            <style>
                @media print {
                    @page { 
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 12px;
                        line-height: 1.4;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .report-container {
                        max-width: 100%;
                        min-height: 100vh;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 3px solid #0f766e;
                        margin-bottom: 30px;
                    }
                    .report-title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #0f766e;
                        margin: 10px 0;
                    }
                    .patient-image {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        margin: 10px auto;
                        border: 2px solid #e2e8f0;
                    }
                    .info-section {
                        background-color: #f8fafc;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #0f766e;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #0f766e;
                        padding-bottom: 5px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    .info-item {
                        display: flex;
                        flex-direction: column;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #374151;
                        margin-bottom: 5px;
                    }
                    .info-value {
                        color: #1f2937;
                        font-size: 14px;
                    }
                    .fitness-status {
                        text-align: center;
                        padding: 20px;
                        border: 3px solid #0f766e;
                        border-radius: 10px;
                        background-color: #e6fffa;
                        margin: 30px 0;
                    }
                    .fitness-label {
                        font-size: 20px;
                        font-weight: bold;
                        color: #0f766e;
                        margin-bottom: 10px;
                    }
                    .fitness-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1f2937;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #0f766e;
                        text-align: center;
                        font-size: 10px;
                        color: #64748b;
                    }
                }
            </style>
        `;

        const printContent = `
            <html>
                <head>
                    <title>Patient Summary - ${formatData(selectedReport.selectedReport.patientName)}</title>
                    ${printStyles}
                </head>
                <body>
                    <div class="report-container">
                        <div class="header">
                            <h1 class="report-title">GULF HEALTHCARE KENYA LTD</h1>
                            <h2 style="color: #64748b; margin: 10px 0;">Patient Summary Report</h2>
                            ${selectedReport.selectedReport.patientImage ? `
                                <img 
                                    src="data:image/jpeg;base64,${selectedReport.selectedReport.patientImage}" 
                                    alt="Patient" 
                                    class="patient-image">
                            ` : ''}
                        </div>

                        <div class="info-section">
                            <h3 class="section-title">Patient Information</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Patient Name:</span>
                                    <span class="info-value">${formatData(selectedReport.selectedReport.patientName)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Lab Number:</span>
                                    <span class="info-value">${formatData(selectedReport.selectedReport.labNumber)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Medical Type:</span>
                                    <span class="info-value">${formatData(selectedReport.selectedReport.medicalType)}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Report Date:</span>
                                    <span class="info-value">${new Date(selectedReport.selectedReport.timeStamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div class="fitness-status">
                            <div class="fitness-label">FITNESS EVALUATION</div>
                            <div class="fitness-value">${getFitnessEvaluation()}</div>
                        </div>

                        <div class="footer">
                            <p><strong>Gulf Healthcare Kenya Ltd.</strong> • Agent Summary Report</p>
                            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                            <p>This is a simplified report for agent review. For complete medical details, contact the medical department.</p>
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
                                        relative p-6 rounded-xl mb-4 transition-all duration-300 ease-in-out 
                                        hover:scale-105 border shadow-lg hover:shadow-xl cursor-pointer
                                        ${selectedReport?._id === report._id
                                            ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400"
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900"
                                        }`}
                                >
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative group">
                                            <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner">
                                                {report.selectedReport.patientImage ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${report.selectedReport.patientImage}`}
                                                        alt="Patient"
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FaUser className="text-gray-400 dark:text-gray-500 text-2xl" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full space-y-2 text-center">
                                            <h3 className="text-lg font-semibold tracking-wide">
                                                {report.selectedReport.patientName}
                                            </h3>
                                            <p className="text-sm">
                                                Lab #: <span className="font-semibold">{report.selectedReport.labNumber}</span>
                                            </p>
                                            <p className="text-sm">
                                                Type: <span className="font-semibold">{report.selectedReport.medicalType || 'N/A'}</span>
                                            </p>
                                            <p className="text-xs">
                                                {new Date(report.selectedReport.timeStamp).toLocaleDateString()}
                                            </p>
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
                            <div className="text-center text-sm">
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

                    {/* Patient Summary */}
                    <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
                        {selectedReport ? (
                            <div className="space-y-6">
                                {/* Header with Print Button */}
                                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">
                                        Patient Summary
                                    </h2>
                                    <button
                                        onClick={printReport}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
                                    >
                                        <FaPrint className="mr-2" />
                                        Print Summary
                                    </button>
                                </div>

                                {/* Patient Information Card */}
                                <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-teal-200">
                                    <div className="flex items-center space-x-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-24 h-24 border-4 border-teal-300 rounded-full overflow-hidden bg-white shadow-lg">
                                                {selectedReport.selectedReport.patientImage ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${selectedReport.selectedReport.patientImage}`}
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
                                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                                {selectedReport.selectedReport.patientName}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Lab Number:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.selectedReport.labNumber}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Medical Type:</span>
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {selectedReport.selectedReport.medicalType || 'N/A'}
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
                                                Overall Status
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
                                    </div>
                                </div>

                                {/* Notice */}
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
                                                This summary shows basic patient information and fitness evaluation only. 
                                                For complete medical details, please contact the medical department.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FaUser className="mx-auto text-6xl text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                    No Patient Selected
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Select a patient from the list to view their summary
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

