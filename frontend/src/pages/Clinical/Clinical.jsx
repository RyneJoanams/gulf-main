import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChevronCircleLeft, FaChevronCircleRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import ReportSection from "../Admin/ReportSection";
import "react-toastify/dist/ReactToastify.css";
import { TESTS_BY_UNIT } from '../Lab/LabFunctions';
import TopBar from "../../components/TopBar";


const Clinical = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [testTypeFilter, setTestTypeFilter] = useState("All");
    const [sourceFilter, setSourceFilter] = useState("All"); // New filter for report source
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [clinicalNotes, setClinicalNotes] = useState("");
    const [clinicalOfficerName, setClinicalOfficerName] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [historyOfPastIllness, setHistoryOfPastIllness] = useState("");
    const [allergy, setAllergy] = useState("");
    const [selectedUnits, setSelectedUnits] = useState({});
    const [selectedTests, setSelectedTests] = useState({});
    const [selectAll, setSelectAll] = useState({});

    const [formData, setFormData] = useState({
        generalExamination: {},
        systemicExamination: {},
        otherTests: {},
        clinicalNotes: "",
        clinicalOfficerName: "",
        height: "",
        weight: "",
        historyOfPastIllness: "",
        allergy: ""
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // Fetch lab reports, radiology reports, and clinical reports
                const [labResponse, radiologyResponse, clinicalResponse] = await Promise.all([
                    axios.get("http://localhost:5000/api/lab"),
                    axios.get("http://localhost:5000/api/radiology"),
                    axios.get("http://localhost:5000/api/clinical")
                ]);

                const labReports = labResponse.data.data;
                const radiologyReports = radiologyResponse.data;
                const clinicalReports = clinicalResponse.data;

                // Get lab numbers that have already been processed by clinical
                const processedByClinical = new Set(
                    clinicalReports.map(report => report.selectedReport?.labNumber).filter(Boolean)
                );

                // Create a map of lab numbers to radiology data
                const radiologyDataMap = new Map();
                radiologyReports.forEach(report => {
                    radiologyDataMap.set(report.labNumber, {
                        heafMantouxTest: report.heafMantouxTest,
                        chestXRayTest: report.chestXRayTest
                    });
                });

                // Filter reports to show only those that have lab results but haven't been processed by clinical
                // Include both F-series and S-series patients
                const unprocessedReports = labReports
                    .filter(report => !processedByClinical.has(report.labNumber))
                    .map(report => {
                        // Check if this report has radiology data
                        const radiologyData = radiologyDataMap.get(report.labNumber);
                        
                        return {
                            ...report,
                            source: radiologyData ? 'radiology' : 'lab',
                            radiologyData: radiologyData || {
                                heafMantouxTest: null,
                                chestXRayTest: null
                            }
                        };
                    });

                setReports(unprocessedReports);
                setFilteredReports(unprocessedReports);
                toast.success('Reports Successfully Fetched.')
                setIsLoading(false);
            } catch (error) {
                toast.error("Error Fetching Clinical Reports");
                setIsLoading(false);
                console.error("Error details:", error);
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

        // Filter by source (lab only vs radiology complete)
        if (sourceFilter !== "All") {
            filtered = filtered.filter((report) => {
                if (sourceFilter === "Lab Only") {
                    return report.source === "lab";
                } else if (sourceFilter === "Radiology Complete") {
                    return report.source === "radiology";
                }
                return true;
            });
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
    }, [reports, searchTerm, testTypeFilter, sourceFilter, dateRange]);

    const handleUnitSelect = (unit) => {
        setSelectedUnits((prev) => ({
            ...prev,
            [unit]: !prev[unit],
        }));
        if (selectedUnits[unit]) {
            setSelectAll((prev) => ({ ...prev, [unit]: false }));
            setSelectedTests((prev) => ({ ...prev, [unit]: {} }));
        }
    };

    const handleTestSelect = (category, test) => {
        setSelectedTests(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [test]: !prev[category]?.[test]
            }
        }));

        // Reset the value if unselecting
        if (selectedTests[category]?.[test]) {
            setFormData(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [test]: ""
                }
            }));
        }
    };

    // Modified handleTestValue to update test values
    const handleTestValue = (category, test, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [test]: value
            }
        }));
    };

    // Modified handleSelectAll
    const handleSelectAllTests = (category) => {
        const allTestsSelected = !selectAll[category];
        setSelectAll(prev => ({ ...prev, [category]: allTestsSelected }));

        const updatedTests = {};
        const updatedValues = {};

        TESTS_BY_UNIT[category].forEach(test => {
            updatedTests[test] = allTestsSelected;
            if (!allTestsSelected) {
                updatedValues[test] = "";
            }
        });

        setSelectedTests(prev => ({
            ...prev,
            [category]: updatedTests
        }));

        if (!allTestsSelected) {
            setFormData(prev => ({
                ...prev,
                [category]: updatedValues
            }));
        }
    };

    // Modified handleSubmit
    const handleSubmit = async () => {
        try {
            // Validate required fields
            if (!formData.clinicalOfficerName) {
                toast.error("Clinical Officer Name is required");
                return;
            }

            // Filter out unselected tests
            const filteredData = {
                generalExamination: {},
                systemicExamination: {},
                otherTests: {}
            };

            ['generalExamination', 'systemicExamination', 'otherTests'].forEach(category => {
                Object.keys(selectedTests[category] || {}).forEach(test => {
                    if (selectedTests[category][test]) {
                        filteredData[category][test] = formData[category][test] || '';
                    }
                });
            });

            const clinicalReport = {
                selectedReport,
                passportNumber: selectedPatientDetails?.passportNumber,
                gender: selectedPatientDetails?.gender,
                age: selectedPatientDetails?.age,
                ...filteredData,
                clinicalNotes: formData.clinicalNotes,
                clinicalOfficerName: formData.clinicalOfficerName,
                height: formData.height,
                weight: formData.weight,
                historyOfPastIllness: formData.historyOfPastIllness,
                allergy: formData.allergy,
                radiologyData: selectedReport?.radiologyData
            };
            console.log(clinicalReport);

            await axios.post("http://localhost:5000/api/clinical", clinicalReport);
            toast.success("Report successfully created");

            // Remove the processed report from the list
            const updatedReports = reports.filter(report => report._id !== selectedReport._id);
            setReports(updatedReports);
            setFilteredReports(updatedReports);

            // Dispatch event to refresh the clinical reports in LeftBar
            const event = new CustomEvent('clinicalReportSubmitted', {
                detail: {
                    labNumber: selectedReport?.labNumber,
                    patientName: selectedReport?.patientName
                }
            });
            window.dispatchEvent(event);

            // Reset form and selection
            setFormData({
                generalExamination: {},
                systemicExamination: {},
                otherTests: {},
                clinicalNotes: "",
                clinicalOfficerName: "",
                height: "",
                weight: "",
                historyOfPastIllness: "",
                allergy: ""
            });
            setSelectedTests({});
            setSelectAll({});
            setSelectedUnits({});
            setSelectedReport(null);
            setSelectedPatientDetails(null);
        } catch (error) {
            toast.error("Error creating report");
            console.error(error);
        }
    };

    // Function to fetch patient details based on patient name
    const fetchPatientDetails = async (patientName) => {
        try {
            const response = await axios.get('http://localhost:5000/api/patient');
            const patients = response.data;
            
            // Find patient by name (case-insensitive)
            const patient = patients.find(p => 
                p.name.toLowerCase() === patientName.toLowerCase()
            );
            
            if (patient) {
                setSelectedPatientDetails({
                    passportNumber: patient.passportNumber,
                    gender: patient.sex, // Patient model uses 'sex' field
                    age: patient.age
                });
            } else {
                setSelectedPatientDetails(null);
                toast.warning(`Patient details not found for: ${patientName}`);
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
            setSelectedPatientDetails(null);
            toast.error('Failed to fetch patient details');
        }
    };

    // Function to handle report selection with patient details fetching
    const handleReportSelection = async (report) => {
        setSelectedReport(report);
        if (report && report.patientName) {
            await fetchPatientDetails(report.patientName);
        }
    };

    // Render examination section with enhanced styling
    const renderExaminationSection = (category, title) => (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className='flex items-center gap-4 text-lg font-semibold mb-4 text-gray-800'>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedUnits[category] || false}
                        onChange={() => handleUnitSelect(category)}
                    />
                    <span className="font-bold">{title}</span>
                </label>
                {selectedUnits[category] && (
                    <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectAll[category] || false}
                            onChange={() => handleSelectAllTests(category)}
                        />
                        Select All Tests
                    </label>
                )}
            </h3>
            {selectedUnits[category] && (
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="grid grid-cols-1 gap-3">
                        {TESTS_BY_UNIT[category].map(test => (
                            <div key={test} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                                <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedTests[category]?.[test] || false}
                                        onChange={() => handleTestSelect(category, test)}
                                    />
                                    <span className="font-medium">
                                        {test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1')}:
                                    </span>
                                </label>
                                {selectedTests[category]?.[test] && (
                                    <input
                                        type="text"
                                        placeholder="Enter test result or observation"
                                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                                        value={formData[category][test] || ""}
                                        onChange={(e) => handleTestValue(category, test, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );


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
                        <h1 className="text-2xl font-bold">Clinical Assessment</h1>
                        <p className="text-sm text-gray-300 mt-1">Processing F-series and S-series patients</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-1 px-2 py-1">

                    {/* Sidebar */}
                    <div className="bg-white dark:bg-gray-200 rounded-lg shadow-lg p-4 overflow-y-auto">
                        <input
                            type="text"
                            placeholder="Search by lab number"
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        
                        {/* Source Filter */}
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        >
                            <option value="All">All Reports</option>
                            <option value="Lab Only">Lab Only</option>
                            <option value="Radiology Complete">Radiology Complete</option>
                        </select>

                        {isLoading ? (
                            <div className="text-center">
                                <p>Loading Reports, Please Wait...</p>
                                <p className="text-sm text-gray-500 mt-2">Showing patients ready for clinical assessment</p>
                            </div>
                        ) : paginatedReports.length > 0 ? (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 font-medium">
                                        📋 Patients ready for clinical assessment ({filteredReports.length} total)
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Including both F-series and S-series patients
                                    </p>
                                </div>
                                {paginatedReports.map((report) => {
                                    const labNumber = report.labNumber || '';
                                    const isFSeries = labNumber.includes('-F');
                                    const isSeries = labNumber.includes('-S');
                                    const seriesType = isFSeries ? 'F' : isSeries ? 'S' : 'Unknown';
                                    const hasRadiology = report.source === 'radiology';
                                    
                                    return (
                                        <div
                                            key={report._id}
                                            onClick={() => handleReportSelection(report)}
                                            className={`relative p-4 rounded-lg mb-4 transition-all duration-300 ease-in-out hover:scale-105 border shadow-md hover:shadow-lg
              ${selectedReport?._id === report._id
                                                    ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400"
                                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900"
                                                }`}
                                        >
                                            {/* Series and Status Badges */}
                                            <div className="absolute top-2 right-2 flex flex-col space-y-1">
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                    isFSeries 
                                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                                        : isSeries 
                                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                }`}>
                                                    {seriesType}-Series
                                                </span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                                    hasRadiology 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {hasRadiology ? 'With Radiology' : 'Lab Only'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-center space-y-3">
                                                <div className="relative group">
                                                    <div className="absolute inset-0 bg-teal-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                                                    <div className="w-24 h-24 border-2 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner">
                                                        {report.patientImage ? (
                                                            <img
                                                                src={`data:image/jpeg;base64,${report.patientImage}`}
                                                                alt="Patient"
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="text-gray-400 dark:text-gray-500 text-2xl font-light">-</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="w-full space-y-1 text-center">
                                                    <h3 className="text-base font-semibold">
                                                        Name: {report.patientName}
                                                    </h3>
                                                    <p className="text-xs text-gray-600">
                                                        Medical Type: <span className="font-semibold">{report.medicalType || 'N/A'}</span>
                                                    </p>
                                                    <div className={`text-xs ${selectedReport?._id === report._id ? "text-teal-100" : "text-gray-600 dark:text-gray-400"}`}>
                                                        <p>Lab Number: {report.labNumber}</p>
                                                        <p>Date: {new Date(report.timeStamp).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center justify-center space-x-2 mt-2">
                                                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                                                        <span className="text-xs font-medium">Ready for Clinical</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>No patients ready for clinical assessment.</p>
                                <p className="text-sm mt-2">All reports have been processed by clinical.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                className={`px-3 py-1.5 bg-blue-500 text-white rounded-lg transition-opacity ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
                            >
                                <FaChevronCircleLeft className="size-5" />
                            </button>
                            <span className="text-sm">
                                Page {currentPage} of {Math.ceil(filteredReports.length / itemsPerPage)}
                            </span>
                            <button
                                disabled={currentPage === Math.ceil(filteredReports.length / itemsPerPage)}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className={`px-3 py-1.5 bg-blue-500 text-white rounded-lg transition-opacity ${currentPage === Math.ceil(filteredReports.length / itemsPerPage) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
                            >
                                <FaChevronCircleRight className="size-5" />
                            </button>
                        </div>
                    </div>

                    {/* Detailed Report View */}
                    <div className="col-span-3 bg-white dark:bg-gray-50 rounded-2xl shadow-2xl p-8 min-h-screen">
                        {selectedReport ? (
                            <div className="space-y-8">
                                {/* Report Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-900">
                                                {selectedReport.patientName}'s Clinical Report
                                            </h2>
                                            <p className="text-gray-600 mt-2">Lab Number: <span className="font-semibold">{selectedReport.labNumber}</span></p>
                                            <p className="text-gray-600">Test Date: <span className="font-semibold">{new Date(selectedReport.timeStamp).toLocaleDateString()}</span></p>
                                            
                                            {/* Patient Basic Information */}
                                            <div className="mt-3 space-y-1">
                                                <p className="text-gray-600">
                                                    Passport: <span className="font-semibold">{selectedPatientDetails?.passportNumber || 'N/A'}</span>
                                                </p>
                                                <p className="text-gray-600">
                                                    Gender: <span className="font-semibold">{selectedPatientDetails?.gender || 'N/A'}</span>
                                                </p>
                                                <p className="text-gray-600">
                                                    Age: <span className="font-semibold">{selectedPatientDetails?.age || 'N/A'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                selectedReport.source === 'radiology' 
                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                            }`}>
                                                {selectedReport.source === 'radiology' ? '✓ Radiology Complete' : '⏳ Lab Only'}
                                            </span>
                                            {selectedReport.radiologyData?.heafMantouxTest || selectedReport.radiologyData?.chestXRayTest ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    📊 Radiology Data Available
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    ⏱️ Pending Radiology
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Test Results Section with Enhanced Tables */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-900 flex items-center gap-3">
                                            <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm">🧪</span>
                                            </span>
                                            Laboratory Test Results
                                        </h2>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Haemogram</span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Renal</span>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Liver</span>
                                        </div>
                                    </div>
                                    
                                    {/* Key Laboratory Tests with Enhanced Tables */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Full Haemogram Table */}
                                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 border-b border-red-100">
                                                <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                                                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                                    Full Haemogram
                                                    <span className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded-full">
                                                        {selectedReport.fullHaemogram && Object.keys(selectedReport.fullHaemogram).length > 0 ? 
                                                            `${Object.keys(selectedReport.fullHaemogram).length} tests` : 'No data'}
                                                    </span>
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="text-left py-2 font-medium text-gray-700">Parameter</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Value</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Units</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Range</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {selectedReport.fullHaemogram && Object.entries(selectedReport.fullHaemogram).map(([key, value]) => {
                                                            // Handle different value types
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
                                                                <tr key={key} className="hover:bg-red-50 transition-colors duration-200">
                                                                    <td className="py-3 text-gray-600 capitalize font-medium">
                                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </td>
                                                                    <td className="py-3 text-center font-semibold text-gray-800">
                                                                        <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                                                                            {displayValue}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 text-center text-gray-700">
                                                                        <span className="text-sm">
                                                                            {units || '-'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 text-center text-gray-700">
                                                                        <span className="text-sm bg-blue-50 px-2 py-1 rounded">
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
                                                        {(!selectedReport.fullHaemogram || Object.keys(selectedReport.fullHaemogram).length === 0) && (
                                                            <tr>
                                                                <td colSpan="5" className="py-8 text-center text-gray-500">
                                                                    <div className="flex flex-col items-center space-y-2">
                                                                        <span className="text-2xl">🔬</span>
                                                                        <span>No haemogram data available</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Renal Function Table */}
                                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-100">
                                                <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                                                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                                                    Renal Function
                                                    <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                                                        {selectedReport.renalFunction && Object.keys(selectedReport.renalFunction).length > 0 ? 
                                                            `${Object.keys(selectedReport.renalFunction).length} tests` : 'No data'}
                                                    </span>
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="text-left py-2 font-medium text-gray-700">Parameter</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Value</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Range</th>
                                                            <th className="text-center py-2 font-medium text-gray-700">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {selectedReport.renalFunction && Object.entries(selectedReport.renalFunction).map(([key, value]) => {
                                                            // Handle different value types
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
                                                                <tr key={key} className="hover:bg-blue-50 transition-colors duration-200">
                                                                    <td className="py-3 text-gray-600 capitalize font-medium">
                                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </td>
                                                                    <td className="py-3 text-center font-semibold text-gray-800">
                                                                        <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                                                                            {displayValue} {units}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 text-center text-gray-700">
                                                                        <span className="text-sm bg-blue-50 px-2 py-1 rounded">
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
                                                        {(!selectedReport.renalFunction || Object.keys(selectedReport.renalFunction).length === 0) && (
                                                            <tr>
                                                                <td colSpan="4" className="py-8 text-center text-gray-500">
                                                                    <div className="flex flex-col items-center space-y-2">
                                                                        <span className="text-2xl">🫘</span>
                                                                        <span>No renal function data available</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Liver Function Table - Full Width */}
                                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-green-100">
                                            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                                                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                                Liver Function
                                                <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">
                                                    {selectedReport.liverFunction && Object.keys(selectedReport.liverFunction).length > 0 ? 
                                                        `${Object.keys(selectedReport.liverFunction).length} tests` : 'No data'}
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-2 font-medium text-gray-700">Parameter</th>
                                                        <th className="text-center py-2 font-medium text-gray-700">Value</th>
                                                        <th className="text-center py-2 font-medium text-gray-700">Range</th>
                                                        <th className="text-center py-2 font-medium text-gray-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedReport.liverFunction && Object.entries(selectedReport.liverFunction).map(([key, value]) => {
                                                        // Handle different value types
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
                                                            <tr key={key} className="hover:bg-green-50 transition-colors duration-200">
                                                                <td className="py-3 text-gray-600 capitalize font-medium">
                                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                </td>
                                                                <td className="py-3 text-center font-semibold text-gray-800">
                                                                    <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                                                                        {displayValue} {units}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 text-center text-gray-700">
                                                                    <span className="text-sm bg-blue-50 px-2 py-1 rounded">
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
                                                    {(!selectedReport.liverFunction || Object.keys(selectedReport.liverFunction).length === 0) && (
                                                        <tr>
                                                            <td colSpan="4" className="py-8 text-center text-gray-500">
                                                                <div className="flex flex-col items-center space-y-2">
                                                                    <span className="text-2xl">🫀</span>
                                                                    <span>No liver function data available</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Additional Test Results - Enhanced Layout */}
                                    <div className="mt-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-900 flex items-center gap-3">
                                                <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm">🔬</span>
                                                </span>
                                                Additional Laboratory Tests
                                            </h3>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Specialized Tests</span>
                                                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Additional Data</span>
                                            </div>
                                        </div>

                                        {/* Enhanced Grid Layout for Additional Tests */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Urine & Blood Tests Combined Table */}
                                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 border-b border-yellow-100">
                                                    <h4 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                                                        Basic Laboratory Tests
                                                        <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-1 rounded-full">
                                                            Urine & Blood Analysis
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {/* Urine Test Table */}
                                                    {selectedReport.urineTest && Object.keys(selectedReport.urineTest).length > 0 && (
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                                                                🧪 Urine Analysis
                                                            </h5>
                                                            <table className="w-full text-sm">
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {Object.entries(selectedReport.urineTest).map(([key, value]) => (
                                                                        value && value !== '' && value !== 'N/A' && (
                                                                            <tr key={key} className="hover:bg-yellow-50 transition-colors duration-200">
                                                                                <td className="py-2 text-gray-600 capitalize font-medium">
                                                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                                </td>
                                                                                <td className="py-2 text-right font-semibold text-gray-800">
                                                                                    <span className="bg-gray-100 px-2 py-1 rounded">
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

                                                    {/* Blood Test Table */}
                                                    {selectedReport.bloodTest && Object.keys(selectedReport.bloodTest).length > 0 && (
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                                                                🩸 Blood Analysis
                                                            </h5>
                                                            <table className="w-full text-sm">
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {Object.entries(selectedReport.bloodTest).map(([key, value]) => (
                                                                        value && value !== '' && value !== 'N/A' && (
                                                                            <tr key={key} className="hover:bg-yellow-50 transition-colors duration-200">
                                                                                <td className="py-2 text-gray-600 capitalize font-medium">
                                                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                                </td>
                                                                                <td className="py-2 text-right font-semibold text-gray-800">
                                                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                                                        key === 'hivTest' || key === 'hbsAg' || key === 'hcv' ? 
                                                                                        (value.toLowerCase() === 'positive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                                                                                        'bg-gray-100 text-gray-800'
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

                                                    {(!selectedReport.urineTest || Object.keys(selectedReport.urineTest).length === 0) &&
                                                     (!selectedReport.bloodTest || Object.keys(selectedReport.bloodTest).length === 0) && (
                                                        <div className="py-8 text-center text-gray-500">
                                                            <div className="flex flex-col items-center space-y-2">
                                                                <span className="text-2xl">🧪</span>
                                                                <span>No basic laboratory test data available</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Specialized Tests Table */}
                                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-b border-purple-100">
                                                    <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                                                        Specialized Laboratory Tests
                                                        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                                                            Advanced Analysis
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="p-4">
                                                    {selectedReport.area1 && Object.keys(selectedReport.area1).length > 0 ? (
                                                        <table className="w-full text-sm">
                                                            <tbody className="divide-y divide-gray-100">
                                                                {Object.entries(selectedReport.area1).map(([key, value]) => (
                                                                    value && value !== '' && value !== 'N/A' && (
                                                                        <tr key={key} className="hover:bg-purple-50 transition-colors duration-200">
                                                                            <td className="py-3 text-gray-600 capitalize font-medium">
                                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                            </td>
                                                                            <td className="py-3 text-right font-semibold text-gray-800">
                                                                                <span className={`px-2 py-1 rounded text-sm ${
                                                                                    key.includes('Test') || key.includes('Disease') ? 
                                                                                    (value.toLowerCase() === 'positive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                                                                                    'bg-gray-100 text-gray-800'
                                                                                }`}>
                                                                                    {value}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <div className="py-8 text-center text-gray-500">
                                                            <div className="flex flex-col items-center space-y-2">
                                                                <span className="text-2xl">🔬</span>
                                                                <span>No specialized test data available</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Laboratory Remarks and Radiology Data - Full Width */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Laboratory Remarks */}
                                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 border-b border-indigo-100">
                                                    <h4 className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
                                                        Laboratory Assessment
                                                        <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-1 rounded-full">
                                                            Professional Opinion
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="p-4">
                                                    {selectedReport.labRemarks && selectedReport.labRemarks.fitnessEvaluation ? (
                                                        <div className="space-y-3">
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-700">Overall Status:</span>
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                        selectedReport.labRemarks.fitnessEvaluation.overallStatus === 'FIT' ? 'bg-green-100 text-green-800' :
                                                                        selectedReport.labRemarks.fitnessEvaluation.overallStatus === 'UNFIT' ? 'bg-red-100 text-red-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {selectedReport.labRemarks.fitnessEvaluation.overallStatus}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-medium text-gray-700">Other Aspects Fit:</span>
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                        selectedReport.labRemarks.fitnessEvaluation.otherAspectsFit === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {selectedReport.labRemarks.fitnessEvaluation.otherAspectsFit}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {selectedReport.labRemarks.labSuperintendent && (
                                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm font-medium text-gray-700">Lab Superintendent:</span>
                                                                        <span className="text-sm font-semibold text-gray-800">
                                                                            {selectedReport.labRemarks.labSuperintendent.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center text-gray-500">
                                                            <div className="flex flex-col items-center space-y-2">
                                                                <span className="text-2xl">📋</span>
                                                                <span>No laboratory remarks available</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Radiology Data */}
                                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                                                <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 border-b border-teal-100">
                                                    <h4 className="text-lg font-semibold text-teal-800 flex items-center gap-2">
                                                        <span className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></span>
                                                        Radiology Assessment
                                                        <span className="text-xs bg-teal-200 text-teal-700 px-2 py-1 rounded-full">
                                                            Imaging Results
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="p-4">
                                                    {selectedReport.radiologyData && (selectedReport.radiologyData.heafMantouxTest || selectedReport.radiologyData.chestXRayTest) ? (
                                                        <div className="space-y-3">
                                                            {selectedReport.radiologyData.heafMantouxTest && (
                                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm font-medium text-gray-700">Heaf/Mantoux Test:</span>
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                            selectedReport.radiologyData.heafMantouxTest.toLowerCase() === 'positive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                            {selectedReport.radiologyData.heafMantouxTest}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedReport.radiologyData.chestXRayTest && (
                                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm font-medium text-gray-700">Chest X-Ray:</span>
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                            selectedReport.radiologyData.chestXRayTest.toLowerCase() === 'abnormal' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                            {selectedReport.radiologyData.chestXRayTest}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center text-gray-500">
                                                            <div className="flex flex-col items-center space-y-2">
                                                                <span className="text-2xl">🏥</span>
                                                                <span>No radiology data available</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Clinical Information Section */}
                                <div className="bg-gray-50 rounded-lg p-6 space-y-8">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-3">
                                        <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">📋</span>
                                        </span>
                                        Clinical Assessment
                                    </h2>

                                    {/* Vital Measurements */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                                            Vital Measurements
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <span>📏</span> Height (cm)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter height in centimeters"
                                                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    value={formData.height}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <span>⚖️</span> Weight (kg)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter weight in kilograms"
                                                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    value={formData.weight}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Medical History */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
                                            Medical History
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <span>🏥</span> History of Past Illness
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter any previous medical conditions or illnesses"
                                                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    value={formData.historyOfPastIllness}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, historyOfPastIllness: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <span>⚠️</span> Allergies
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter any known allergies (food, drugs, environmental)"
                                                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    value={formData.allergy}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, allergy: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Examination Sections */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                                            Clinical Examinations
                                        </h3>
                                        <div className="space-y-6">
                                            {renderExaminationSection('generalExamination', 'General Examination')}
                                            {renderExaminationSection('systemicExamination', 'Systemic Examination')}
                                            {renderExaminationSection('otherTests', 'Other Tests')}
                                        </div>
                                    </div>

                                    {/* Clinical Notes */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-indigo-500 rounded-full"></span>
                                            Clinical Notes & Assessment
                                        </h3>
                                        <div className="space-y-4">
                                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                <span>📝</span> Clinical Notes
                                            </label>
                                            <textarea
                                                placeholder="Enter detailed clinical observations, findings, and recommendations..."
                                                className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] transition-all"
                                                value={formData.clinicalNotes}
                                                onChange={(e) => setFormData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Officer Information & Submit */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <span className="w-4 h-4 bg-teal-500 rounded-full"></span>
                                            Approval & Submission
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <span>👨‍⚕️</span> Clinical Officer Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter the name of the clinical officer"
                                                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    value={formData.clinicalOfficerName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, clinicalOfficerName: e.target.value }))}
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                                <button
                                                    type="button"
                                                    onClick={handleSubmit}
                                                    disabled={!formData.clinicalOfficerName}
                                                    className={`flex-1 py-3 px-6 rounded-xl text-base font-medium shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
                                                        formData.clinicalOfficerName 
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5' 
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <span>✅</span>
                                                    Submit Clinical Report
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({
                                                            generalExamination: {},
                                                            systemicExamination: {},
                                                            otherTests: {},
                                                            clinicalNotes: "",
                                                            clinicalOfficerName: "",
                                                            height: "",
                                                            weight: "",
                                                            historyOfPastIllness: "",
                                                            allergy: ""
                                                        });
                                                        setSelectedTests({});
                                                        setSelectAll({});
                                                        setSelectedUnits({});
                                                    }}
                                                    className="px-6 py-3 rounded-xl text-base font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                                                >
                                                    <span>🔄</span>
                                                    Reset Form
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-12">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-4xl text-gray-400">📋</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-600">No Report Selected</h3>
                                    <p className="text-gray-500 max-w-md">
                                        Select a patient report from the sidebar to begin clinical assessment and view detailed laboratory results.
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

export default Clinical;