import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaChevronCircleLeft, FaPrint, FaChevronCircleRight, FaFileExport } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import ReportSection from "../Admin/ReportSection";
import "react-toastify/dist/ReactToastify.css";

const TESTS_BY_UNIT = {
    generalExamination: ["hernia", "varicoseVein", "rightEye", "leftEye"],
    systemicExamination: ["heart", "bloodPressure", "pulseRate"],
    otherTests: ["hydrocele", "earRight", "earLeft", "lungs", "liver", "spleen", "otherDeformities"],
    // Add more units and tests as needed
};

const Clinical = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [testTypeFilter, setTestTypeFilter] = useState("All");
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/lab");
                setReports(response.data.data);
                setFilteredReports(response.data.data);
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

    const exportToExcel = () => {
        if (!selectedReport) {
            toast.error("No report selected for export");
            return;
        }

        const exportData = [{
            id: selectedReport._id,
            patientName: selectedReport.patientName,
            labNumber: selectedReport.labNumber,
            clinicalRemarks: selectedReport.clinicalRemarks,
            date: new Date(selectedReport.timestamp).toLocaleString(),
            clinicalNotes: selectedReport.clinicalNotes,
            clinicalOfficerName: selectedReport.clinicalOfficerName,
            historyOfPastIllness: selectedReport.historyOfPastIllness,
            allergy: selectedReport.allergy
        }];

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ClinicalReports");
        XLSX.writeFile(workbook, "ClinicalReports.xlsx");
        toast.success("Report exported to Excel");
    };

    const printReport = () => {
        if (!selectedReport) {
            toast.error("No report selected for printing");
            return;
        }

        const printContent = `
            <html>
                <head>
                    <title>Clinical Report</title>
                </head>
                <body>
                    <h1>${selectedReport.patientName}'s Clinical Report</h1>
                    <p>Lab Number: ${selectedReport.labNumber}</p>
                    <p>Date: ${new Date(selectedReport.timestamp).toLocaleString()}</p>
                    <h2>Details</h2>
                    <ul>
                        <li>Lab Remarks: ${selectedReport.labRemarks}</li>
                        <li>Urine Test: ${selectedReport.urineTest}</li>
                        <li>Blood Test: ${selectedReport.bloodTest}</li>
                        <li>General Examination: ${selectedReport.generalExamination}</li>
                        <li>Systemic Examination: ${selectedReport.systemicExamination}</li>
                        <li>Other Tests: ${selectedReport.otherTests}</li>
                        <li>Radiology Data: ${selectedReport.radiologyData}</li>
                        <li>Clinical Notes: ${selectedReport.clinicalNotes}</li>
                        <li>Clinical Officer Name: ${selectedReport.clinicalOfficerName}</li>
                        <li>History of Past Illness: ${selectedReport.historyOfPastIllness}</li>
                        <li>Allergy: ${selectedReport.allergy}</li>
                    </ul>
                </body>
            </html>
        `;
        const printWindow = window.open("", "", "width=800,height=600");
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const handleSubmit = async () => {
        try {
            const newReport = {
                clinicalNotes,
                clinicalOfficerName,
                height,
                weight,
                historyOfPastIllness,
                allergy,
                generalExamination: selectedTests.generalExamination,
                systemicExamination: selectedTests.systemicExamination,
                otherTests: selectedTests.otherTests
            };
            await axios.post("http://localhost:5000/api/lab", newReport);
            toast.success("Report successfully created");
        } catch (error) {
            toast.error("Error creating report");
        }
    };

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

    const handleTestSelect = (unit, test) => {
        setSelectedTests((prev) => ({
            ...prev,
            [unit]: {
                ...prev[unit],
                [test]: !prev[unit]?.[test],
            },
        }));
    };

    const handleSelectAllTests = (unit) => {
        const allTestsSelected = !selectAll[unit];
        setSelectAll((prev) => ({ ...prev, [unit]: allTestsSelected }));

        setSelectedTests((prev) => ({
            ...prev,
            [unit]: allTestsSelected
                ? TESTS_BY_UNIT[unit].reduce((acc, test) => ({ ...acc, [test]: true }), {})
                : {},
        }));
    };

    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-gray-50 text-black min-h-screen transition-all duration-300">
            <div className="flex justify-between items-center p-4 bg-gray-800 text-white shadow-md">
                <h1 className="text-2xl font-bold">Clinical Reports</h1>
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
                                className={`p-4 border rounded-lg mb-2 hover:bg-gray-200 dark:hover:bg-teal-600 hover:text-white cursor-pointer ${selectedReport?._id === report._id ? "bg-gray-200 dark:bg-teal-800 text-white" : ""
                                    }`}
                            >
                                <p className="font-medium">Name: {report.patientName}</p>
                                <p className="text-sm">Lab Number: {report.labNumber}</p>
                                <p className="text-sm ">
                                    Date: {new Date(report.timeStamp).toLocaleString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">No reports found.</p>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-opacity ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                                }`}
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
                                <h2 className="text-xl font-bold">{selectedReport.patientName}'s Report</h2>
                                <button
                                    onClick={printReport}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                                >
                                    <FaPrint /> Print
                                </button>
                                <div className="flex gap-4">
                                    <button
                                        onClick={exportToExcel}
                                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                                    >
                                        <FaFileExport /> Export
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ReportSection title="Laboratory Remarks" data={selectedReport.labRemarks} />
                                <ReportSection title="Urine Test" data={selectedReport.urineTest} />
                                <ReportSection title="Blood Test" data={selectedReport.bloodTest} />
                                <ReportSection title="General Examination" data={selectedReport.generalExamination} />
                                <ReportSection title="Systemic Examination" data={selectedReport.systemicExamination} />
                                <ReportSection title="Other Tests" data={selectedReport.otherTests} />
                                <ReportSection title="Area 1" data={selectedReport.area1} />
                                <ReportSection title="Renal Function" data={selectedReport.renalFunction} />
                                <ReportSection title="Full Haemogram" data={selectedReport.fullHaemogram} />
                                <ReportSection title="Liver Function" data={selectedReport.liverFunction} />
                                <ReportSection title="Radiology Data" data={selectedReport.radiologyData} />
                                <ReportSection title="Height" data={selectedReport.height} />
                                <ReportSection title="Weight" data={selectedReport.weight} />
                                <ReportSection title="Clinical Notes" data={selectedReport.clinicalNotes} />
                                <ReportSection title="Clinical Officer Name" data={selectedReport.clinicalOfficerName} />
                                <ReportSection title="History of Past Illness" data={selectedReport.historyOfPastIllness} />
                                <ReportSection title="Allergy" data={selectedReport.allergy} />
                            </div>
                            <div className="mt-4">
                                <h2 className="text-xl font-bold">Clinical Notes</h2>
                                <input
                                    type="number"
                                    placeholder="Height (cm)"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Weight (kg)"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="History of Past Illness"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    value={historyOfPastIllness}
                                    onChange={(e) => setHistoryOfPastIllness(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Allergy"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    value={allergy}
                                    onChange={(e) => setAllergy(e.target.value)}
                                />
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold">General Examination</h3>
                                    <label className="flex items-center gap-4 text-black">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.generalExamination || false} onChange={() => handleUnitSelect('generalExamination')} /> <b>General Examination</b>
                                    </label>
                                    {selectedUnits.generalExamination && (
                                        <>
                                            <label className="flex items-center gap-2 text-sm text-black">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectAll.generalExamination || false} onChange={() => handleSelectAllTests('generalExamination')} />Select All
                                            </label>
                                            {TESTS_BY_UNIT.generalExamination.map((test) => (
                                                <div key={test} className="mb-2">
                                                    <label className="block text-gray-700 font-medium mb-1">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.generalExamination?.[test] || false} onChange={() => handleTestSelect('generalExamination', test)} /> {test.charAt(0).toUpperCase() + test.slice(1)}:
                                                    </label>
                                                    {selectedTests.generalExamination?.[test] && (
                                                        <input
                                                            type="text"
                                                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={selectedTests.generalExamination?.[test] || ""}
                                                            onChange={(e) =>
                                                                setSelectedTests((prev) => ({
                                                                    ...prev,
                                                                    generalExamination: {
                                                                        ...prev.generalExamination,
                                                                        [test]: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold">Systemic Examination</h3>
                                    <label className="flex items-center gap-4 text-black">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.systemicExamination || false} onChange={() => handleUnitSelect('systemicExamination')} /> <b>Systemic Examination</b>
                                    </label>
                                    {selectedUnits.systemicExamination && (
                                        <>
                                            <label className="flex items-center gap-2 text-sm text-black">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectAll.systemicExamination || false} onChange={() => handleSelectAllTests('systemicExamination')} />Select All
                                            </label>
                                            {TESTS_BY_UNIT.systemicExamination.map((test) => (
                                                <div key={test} className="mb-2">
                                                    <label className="block text-gray-700 font-medium mb-1">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.systemicExamination?.[test] || false} onChange={() => handleTestSelect('systemicExamination', test)} /> {test.charAt(0).toUpperCase() + test.slice(1)}:
                                                    </label>
                                                    {selectedTests.systemicExamination?.[test] && (
                                                        <input
                                                            type="text"
                                                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={selectedTests.systemicExamination?.[test] || ""}
                                                            onChange={(e) =>
                                                                setSelectedTests((prev) => ({
                                                                    ...prev,
                                                                    systemicExamination: {
                                                                        ...prev.systemicExamination,
                                                                        [test]: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold">Other Tests</h3>
                                    <label className="flex items-center gap-4 text-black">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedUnits.otherTests || false} onChange={() => handleUnitSelect('otherTests')} /> <b>Other Tests</b>
                                    </label>
                                    {selectedUnits.otherTests && (
                                        <>
                                            <label className="flex items-center gap-2 text-sm text-black">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectAll.otherTests || false} onChange={() => handleSelectAllTests('otherTests')} />Select All
                                            </label>
                                            {TESTS_BY_UNIT.otherTests.map((test) => (
                                                <div key={test} className="mb-2">
                                                    <label className="block text-gray-700 font-medium mb-1">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedTests.otherTests?.[test] || false} onChange={() => handleTestSelect('otherTests', test)} /> {test.charAt(0).toUpperCase() + test.slice(1)}:
                                                    </label>
                                                    {selectedTests.otherTests?.[test] && (
                                                        <input
                                                            type="text"
                                                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={selectedTests.otherTests?.[test] || ""}
                                                            onChange={(e) =>
                                                                setSelectedTests((prev) => ({
                                                                    ...prev,
                                                                    otherTests: {
                                                                        ...prev.otherTests,
                                                                        [test]: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <textarea
                                    placeholder="Clinical Notes"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    value={clinicalNotes}
                                    onChange={(e) => setClinicalNotes(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Clinical Officer Name"
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                                    value={clinicalOfficerName}
                                    onChange={(e) => setClinicalOfficerName(e.target.value)}
                                />
                                <button
                                    onClick={handleSubmit}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500">Select a report to view details.</p>
                    )}
                </div>
            </div>

            <ToastContainer />
        </div>
    );
};

export default Clinical;
