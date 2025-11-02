import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChevronCircleLeft, FaChevronCircleRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopBar from "../../components/TopBar";
import { API_BASE_URL } from '../../config/api.config';

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
                // Fetch lab reports and radiology reports to determine which haven't been processed
                const [labResponse, radiologyResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/lab`),
                    axios.get(`${API_BASE_URL}/api/radiology`)
                ]);

                const labReports = labResponse.data.data;
                const radiologyReports = radiologyResponse.data;

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
                });

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    {/* Sidebar */}
                    <div className="bg-white dark:bg-gray-200 rounded-lg shadow-lg p-4 overflow-y-auto">
                        <input
                            type="text"
                            placeholder="Search by lab number"
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {isLoading ? (
                            <div className="text-center">
                                <p>Loading Reports, Please Wait...</p>
                                <p className="text-sm text-gray-500 mt-2">Showing F-series patients ready for radiology</p>
                            </div>
                        ) : paginatedReports.length > 0 ? (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 font-medium">
                                        📋 Showing F-series patients ready for radiology ({filteredReports.length} total)
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        S-series patients are excluded from radiology
                                    </p>
                                </div>
                                {paginatedReports.map((report) => {
                                    const labNumber = report.labNumber || '';
                                    const isFSeries = labNumber.includes('-F');
                                    const seriesType = isFSeries ? 'F' : labNumber.includes('-S') ? 'S' : 'Unknown';
                                    
                                    return (
                                        <div
                                            key={report._id}
                                            onClick={() => setSelectedReport(report)}
                                            className={`relative p-6 rounded-xl mb-4 transition-all duration-300 ease-in-out hover:scale-105 border shadow-lg hover:shadow-xl ${selectedReport?._id === report._id
                                                ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900"
                                                }`}
                                        >
                                            {/* Series Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                    isFSeries 
                                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                }`}>
                                                    {seriesType}-Series
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="relative group">
                                                    <div className="absolute inset-0 bg-teal-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                                                    <div className="w-32 h-32 border-4 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner">
                                                        {report.patientImage ? (
                                                            <img
                                                                src={`data:image/jpeg;base64,${report.patientImage}`}
                                                                alt="Patient"
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="text-gray-400 dark:text-gray-500 text-3xl font-light">-</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="w-full space-y-2 text-center">
                                                    <h3 className="text-lg font-semibold tracking-wide">{report.patientName}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Medical Type: <span className="font-semibold">{report.medicalType || 'N/A'}</span>
                                                    </p>
                                                    <div className={`text-sm space-y-1 ${selectedReport?._id === report._id ? "text-teal-100" : "text-gray-600 dark:text-gray-400"}`}>
                                                        <p className="flex items-center justify-center space-x-2">
                                                            <span className="font-medium">Lab Number: </span>
                                                            <span>{report.labNumber}</span>
                                                        </p>
                                                        <p className="flex items-center justify-center space-x-2">
                                                            <span className="font-medium">Date: </span>
                                                            <span>{new Date(report.timeStamp).toLocaleString()}</span>
                                                        </p>
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                            <span className="text-xs font-medium">Ready for Radiology</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>No F-series patients ready for radiology.</p>
                                <p className="text-sm mt-2">All F-series lab reports have been processed.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-opacity ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
                            >
                                <FaChevronCircleLeft className="size-5" />
                            </button>
                            <span>
                                Page {currentPage} of{" "}
                                {Math.ceil(filteredReports.length / itemsPerPage)}
                            </span>
                            <button
                                disabled={currentPage === Math.ceil(filteredReports.length / itemsPerPage)}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-opacity ${currentPage === Math.ceil(filteredReports.length / itemsPerPage)
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-blue-600"
                                    }`}
                            >
                                <FaChevronCircleRight className="size-5" />
                            </button>
                        </div>
                    </div>

                    {/* Detailed View */}
                    <div className="col-span-2 bg-white dark:bg-gray-200 rounded-lg shadow-lg p-6">
                        {selectedReport ? (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">{selectedReport.patientName}'s Radiology Report</h2>
                                </div>

                                <div>
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="block text-gray-700 font-semibold mb-3 text-lg">Chest X-Ray Test Results</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm"
                                            value={chestXRayTest}
                                            onChange={(e) => setChestXRayTest(e.target.value)}
                                            placeholder="Enter test results..."
                                        />
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
                                        <label className="block text-gray-700 font-semibold mb-3 text-lg">Heaf/Mantoux Test Results</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm"
                                            value={heafMantouxTest}
                                            onChange={(e) => setHeafMantouxTest(e.target.value)}
                                            placeholder="Enter test results..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4">
                                        Submit Report
                                    </button>
                                </div>

                                <div className="mt-6">
                                    <p className="text-lg font-medium">
                                        Medical Type: <span className="font-semibold">{selectedReport.medicalType || 'N/A'}</span>
                                    </p>
                                </div>

                            </>
                        ) : (
                            <p className="text-center text-gray-500">Select a report to view details.</p>
                        )}
                    </div>
                </div>

                <ToastContainer />
            </div>
        </>
    );
};

export default Radiology;
