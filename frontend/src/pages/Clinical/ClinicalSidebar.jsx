import React from "react";
import { FaChevronCircleLeft, FaChevronCircleRight } from "react-icons/fa";

const ClinicalSidebar = ({
    searchTerm,
    setSearchTerm,
    sourceFilter,
    setSourceFilter,
    isLoading,
    paginatedReports,
    filteredReports,
    selectedReport,
    handleReportSelection,
    currentPage,
    setCurrentPage,
    itemsPerPage
}) => {
    return (
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
                <option value="Phlebotomy">From Phlebotomy (F-Series)</option>
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
                            S-series tests are automatically processed and appear directly in clinical reports
                        </p>
                    </div>
                    {paginatedReports.map((report) => {
                        const labNumber = report.labNumber || '';
                        const isFSeries = labNumber.includes('-F');
                        const seriesType = isFSeries ? 'F' : 'Unknown';
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
                                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                        {seriesType}-Series
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        hasRadiology 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {report.source === 'phlebotomy' ? 'F-Series from Phlebotomy' : hasRadiology ? 'With Radiology' : 'Lab Only'}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center space-y-3">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-teal-400 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                                        <div className="w-24 h-24 border-2 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner">
                                            {report.patientImage || report.photo ? (
                                                <img
                                                    src={report.patientImage ? `data:image/jpeg;base64,${report.patientImage}` : report.photo}
                                                    alt="Patient"
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-gray-400 dark:text-gray-500 text-2xl font-light">👤</span>
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
                                            <p>Date: {new Date(report.timestamp || report.timeStamp || report.createdAt).toLocaleString()}</p>
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
    );
};

export default ClinicalSidebar;
