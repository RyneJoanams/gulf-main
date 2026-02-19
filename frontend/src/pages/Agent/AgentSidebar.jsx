import React from "react";
import { FaChevronCircleLeft, FaChevronCircleRight, FaSearch, FaTimes, FaUserTie, FaUser } from "react-icons/fa";

const AgentSidebar = ({
    searchTerm,
    setSearchTerm,
    handleSearch,
    handleClearSearch,
    isLoading,
    hasSearched,
    paginatedReports,
    filteredReports,
    selectedReport,
    handleReportSelection,
    currentPage,
    setCurrentPage,
    itemsPerPage
}) => {
    return (
        <div className="bg-teal-900 text-white rounded-lg shadow-2xl min-h-screen overflow-y-auto">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="border-b border-teal-700 pb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <FaUserTie className="text-teal-300" />
                        Agent Portal
                    </h2>
                    <p className="text-teal-200 text-sm mt-2">
                        Search patient records by ID
                    </p>
                </div>

                {/* Search Section */}
                <div>
                    <h3 className="text-sm font-semibold text-teal-200 mb-3 uppercase tracking-wide">Search Patient</h3>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter Full Passport/ID Number" 
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            className="w-full px-4 py-3 pl-10 rounded-lg border-0 bg-white text-gray-900 focus:ring-2 focus:ring-teal-300 transition-all duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        />
                        
                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !searchTerm.trim()}
                        className="mt-2 w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <FaSearch />
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                    {hasSearched && searchTerm && (
                        <p className="text-teal-200 text-xs mt-2">
                            Found {filteredReports.length} result{filteredReports.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                        <p className="text-white font-medium">Searching...</p>
                        <p className="text-sm text-teal-200 mt-2">Looking up patient records</p>
                    </div>
                ) : !hasSearched ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-teal-800 rounded-full flex items-center justify-center mb-4">
                            <FaUser className="text-4xl text-teal-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Search for Patients</h3>
                        <p className="text-teal-200 text-sm">Enter passport number or ID to find records</p>
                    </div>
                ) : paginatedReports.length > 0 ? (
                    <div className="space-y-4">
                        {/* Info Banner */}
                        <div className="bg-teal-800 border border-teal-600 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-lg">📋</span>
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">
                                        Search Results ({filteredReports.length})
                                    </p>
                                    <p className="text-xs text-teal-200 mt-1">
                                        Click on a patient to view their complete report
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Patient Cards */}
                        {paginatedReports.map((report) => {
                            const isSelected = selectedReport?._id === report._id;
                            
                            return (
                                <div
                                    key={report._id}
                                    onClick={() => handleReportSelection(report)}
                                    className={`relative rounded-xl transition-all duration-300 cursor-pointer hover:scale-102 border-2 ${
                                        isSelected
                                            ? "bg-white text-gray-900 border-teal-300 shadow-2xl"
                                            : "bg-teal-800 bg-opacity-50 border-teal-700 hover:bg-teal-700 hover:border-teal-500 shadow-lg hover:shadow-xl"
                                    }`}
                                >
                                    <div className="p-4">
                                        {/* Status Badge */}
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500 text-white">
                                                📄 Complete Report
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Patient Image */}
                                            <div className="relative group flex-shrink-0">
                                                <div className={`w-16 h-16 border-2 ${isSelected ? 'border-teal-500' : 'border-teal-600'} rounded-full overflow-hidden shadow-lg`}>
                                                    {report.selectedReport.patientImage ? (
                                                        <img
                                                            src={`data:image/jpeg;base64,${report.selectedReport.patientImage}`}
                                                            alt="Patient"
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center ${isSelected ? 'bg-teal-100' : 'bg-teal-800'}`}>
                                                            <FaUser className={`text-2xl ${isSelected ? 'text-teal-700' : 'text-teal-300'}`} />
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center border-2 border-white">
                                                        <span className="text-white text-xs">✓</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Patient Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-base font-bold truncate ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                                                    {report.selectedReport.patientName}
                                                </h3>
                                                <p className={`text-xs mt-1 ${isSelected ? 'text-gray-700' : 'text-teal-200'}`}>
                                                    <span className="font-semibold">Lab:</span> {report.selectedReport.labNumber}
                                                </p>
                                                {report.passportNumber && (
                                                    <p className={`text-xs ${isSelected ? 'text-gray-600' : 'text-teal-300'}`}>
                                                        <span className="font-semibold">Passport:</span> {report.passportNumber}
                                                    </p>
                                                )}
                                                <p className={`text-xs ${isSelected ? 'text-gray-500' : 'text-teal-300'}`}>
                                                    {new Date(report.selectedReport.timeStamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ready Badge */}
                                        {!isSelected && (
                                            <div className="flex items-center justify-center mt-3 pt-3 border-t border-teal-600">
                                                <span className="inline-flex items-center gap-2 text-xs font-medium text-teal-200">
                                                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                                                    Click to View
                                                </span>
                                            </div>
                                        )}

                                        {isSelected && (
                                            <div className="flex items-center justify-center mt-3 pt-3 border-t border-teal-200">
                                                <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-700">
                                                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                                    Currently Viewing
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-teal-800 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">🔍</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Results Found</h3>
                        <p className="text-teal-200 text-sm">No patients found matching your search.</p>
                        <p className="text-teal-300 text-xs mt-2">Try a different passport number or ID</p>
                    </div>
                )}

                {/* Pagination */}
                {filteredReports.length > itemsPerPage && (
                    <div className="border-t border-teal-700 pt-6 mt-6">
                        <div className="flex justify-between items-center">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    currentPage === 1 
                                        ? "bg-teal-800 text-teal-500 cursor-not-allowed opacity-50" 
                                        : "bg-white text-teal-900 hover:bg-teal-50 hover:scale-105 shadow-md"
                                }`}
                            >
                                <FaChevronCircleLeft />
                                <span className="hidden sm:inline">Previous</span>
                            </button>
                            
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium text-white">
                                    Page {currentPage} of {Math.ceil(filteredReports.length / itemsPerPage)}
                                </span>
                                <span className="text-xs text-teal-300 mt-1">
                                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredReports.length)}-{Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length}
                                </span>
                            </div>
                            
                            <button
                                disabled={currentPage === Math.ceil(filteredReports.length / itemsPerPage)}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    currentPage === Math.ceil(filteredReports.length / itemsPerPage)
                                        ? "bg-teal-800 text-teal-500 cursor-not-allowed opacity-50" 
                                        : "bg-white text-teal-900 hover:bg-teal-50 hover:scale-105 shadow-md"
                                }`}
                            >
                                <span className="hidden sm:inline">Next</span>
                                <FaChevronCircleRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentSidebar;
