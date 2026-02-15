import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaXRay, FaLungs, FaSyringe, FaFileMedical } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopBar from "../../components/TopBar";
import { API_BASE_URL } from '../../config/api.config';
import RadiologySidebar from './RadiologySidebar';

const Radiology = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [testTypeFilter, setTestTypeFilter] = useState("All");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [chestXRayTest, setChestXRayTest] = useState("");
    const [heafMantouxTest, setHeafMantouxTest] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // Fetch lab reports, radiology reports, and patient data with photos
                const [labResponse, radiologyResponse, patientsResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/lab`),
                    axios.get(`${API_BASE_URL}/api/radiology`),
                    axios.get(`${API_BASE_URL}/api/patient?excludePhoto=false&fields=name,photo`)
                ]);

                const labReports = labResponse.data.data;
                const radiologyReports = radiologyResponse.data;
                const patients = patientsResponse.data.patients || patientsResponse.data || [];

                // Create patient photo map
                const patientPhotoMap = new Map();
                patients.forEach(p => {
                    if (p.name && p.photo) {
                        patientPhotoMap.set(p.name.toLowerCase(), p.photo);
                    }
                });

                // Get lab numbers that have already been processed by radiology
                const processedLabNumbers = new Set(
                    radiologyReports.map(report => report.labNumber)
                );

                // Filter lab reports to show only:
                // 1. F-series patients (exclude S-series)
                // 2. Reports that haven't been processed by radiology yet
                const unprocessedFSeriesReports = labReports.filter(report => {
                    const labNumber = report.labNumber;
                    const isFSeries = labNumber && (labNumber.includes('-F') || !labNumber.includes('-S'));
                    const notProcessed = !processedLabNumbers.has(labNumber);
                    return isFSeries && notProcessed;
                }).map(report => ({
                    ...report,
                    patientImage: report.patientImage || patientPhotoMap.get(report.patientName?.toLowerCase()) || null
                }));

                setReports(unprocessedFSeriesReports);
                toast.success('Reports Successfully Fetched.');
                setIsLoading(false);
            } catch (error) {
                toast.error("Error Fetching Radiology Reports");
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
                (report.patientName &&
                    report.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.labNumber &&
                    report.labNumber.toString().includes(searchTerm.toLowerCase()))
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

    const handleReportSelection = (report) => {
        setSelectedReport(report);
    };

    const handleSubmit = async () => {
        if (!selectedReport) {
            toast.error("Please select a report first.");
            return;
        }

        if (!chestXRayTest || !heafMantouxTest) {
            toast.error("Please fill in all test results before submitting.");
            return;
        }

        // Prepare radiology report data by combining the selected report with test results
        const radiologyReport = {
            labNumber: selectedReport.labNumber,
            patientName: selectedReport.patientName,
            chestXRayTest,
            heafMantouxTest,
            urineTest: selectedReport.urineTest,
            bloodTest: selectedReport.bloodTest,
            area1: selectedReport.area1,
            fullHaemogram: selectedReport.fullHaemogram,
            liverFunction: selectedReport.liverFunction,
            renalFunction: selectedReport.renalFunction,
            labRemarks: selectedReport.labRemarks,
            medicalType: selectedReport.medicalType,
            timestamp: new Date().toISOString(),
        };

        // Only include patientImage if it exists
        if (selectedReport.patientImage) {
            radiologyReport.patientImage = selectedReport.patientImage;
        }

        console.log(radiologyReport);
        console.log(selectedReport);

        try {
            await axios.post(`${API_BASE_URL}/api/radiology`, radiologyReport);
            toast.success("Report successfully created");
            
            // Remove the processed report from the list
            const updatedReports = reports.filter(report => report._id !== selectedReport._id);
            setReports(updatedReports);
            
            // Clear form and selection after successful submission
            setChestXRayTest("");
            setHeafMantouxTest("");
            setSelectedReport(null);
        } catch (error) {
            toast.error("Error creating report");
            console.error(error);
            console.log(error.response.data);
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
                    <div>
                        <h1 className="text-2xl font-bold">Radiology Department</h1>
                        <p className="text-sm text-gray-300 mt-1">Processing F-series patients only</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                    {/* Sidebar */}
                    <RadiologySidebar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isLoading={isLoading}
                        paginatedReports={paginatedReports}
                        filteredReports={filteredReports}
                        selectedReport={selectedReport}
                        handleReportSelection={handleReportSelection}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                    />

                    {/* Detailed View */}
                    <div className="col-span-3 bg-white dark:bg-gray-50 rounded-2xl shadow-2xl p-8 min-h-screen">
                        {selectedReport ? (
                            <div className="space-y-8">
                                {/* Report Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                                    <h2 className="text-3xl font-bold text-gray-800 mb-3">
                                        {selectedReport.patientName}'s Radiology Report
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-gray-600 text-sm">Lab Number</p>
                                            <p className="font-semibold text-gray-800">{selectedReport.labNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 text-sm">Medical Type</p>
                                            <p className="font-semibold text-gray-800">{selectedReport.medicalType || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 text-sm">Test Date</p>
                                            <p className="font-semibold text-gray-800">{new Date(selectedReport.timeStamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Forms */}
                                <div className="space-y-6">
                                    {/* Chest X-Ray Test */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <FaLungs className="text-blue-600" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-800 font-bold text-lg">Chest X-Ray Test</label>
                                                <p className="text-sm text-gray-500">Enter imaging results and observations</p>
                                            </div>
                                        </div>
                                        <textarea
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            value={chestXRayTest}
                                            onChange={(e) => setChestXRayTest(e.target.value)}
                                            placeholder="Enter chest X-ray findings, abnormalities, or 'Normal' if no issues found..."
                                        />
                                    </div>

                                    {/* Heaf/Mantoux Test */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                <FaSyringe className="text-purple-600" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-800 font-bold text-lg">Heaf/Mantoux Test</label>
                                                <p className="text-sm text-gray-500">Record tuberculin skin test results</p>
                                            </div>
                                        </div>
                                        <textarea
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                            value={heafMantouxTest}
                                            onChange={(e) => setHeafMantouxTest(e.target.value)}
                                            placeholder="Enter Heaf/Mantoux test results, induration size, or 'Negative' if no reaction..."
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={!chestXRayTest || !heafMantouxTest}
                                        className={`flex-1 py-3 px-6 rounded-xl text-base font-medium shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
                                            chestXRayTest && heafMantouxTest
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <FaFileMedical />
                                        Submit Radiology Report
                                    </button>
                                    <button
                                        onClick={() => {
                                            setChestXRayTest("");
                                            setHeafMantouxTest("");
                                        }}
                                        className="px-6 py-3 rounded-xl text-base font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Clear Form
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-12">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                        <FaXRay className="text-4xl text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-600">No Report Selected</h3>
                                    <p className="text-gray-500 max-w-md">
                                        Select a patient from the sidebar to begin radiology imaging assessment and record test results.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <ToastContainer />
            </div>
        </>
    );
};

export default Radiology;
