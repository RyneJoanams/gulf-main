import React, { useState, useEffect } from "react";
import { FaChevronCircleLeft, FaChevronCircleRight, FaSearch, FaTimes, FaFilter, FaVial } from "react-icons/fa";

// Helper function to calculate relative time
const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const isNewPatient = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  return (now - date) / 3600000 < 1;
};

const PhlebotomySidebar = ({
  pendingPatients,
  loadingPending,
  selectedPatient,
  setSelectedPatient,
  setSearchTerm,
  submittedLabNumbers,
  setDuplicateModalData,
  setShowDuplicateModal,
  pendingSidebarCollapsed,
  setPendingSidebarCollapsed,
  lastRefreshTime,
  fetchPendingPatients,
  pendingSearchQuery,
  setPendingSearchQuery,
  pendingStartDate,
  setPendingStartDate,
  pendingEndDate,
  setPendingEndDate,
  activePendingTab,
  setActivePendingTab,
}) => {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [pendingSearchQuery, pendingStartDate, pendingEndDate, activePendingTab]);

  // Compute filtered list for display
  const getFiltered = () => {
    let filtered = pendingPatients.filter(
      (p) => activePendingTab === "ALL" || p.medicalType === activePendingTab
    );
    if (pendingSearchQuery) {
      const q = pendingSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.passportNumber?.toLowerCase().includes(q)
      );
    }
    if (pendingStartDate) {
      const s = new Date(pendingStartDate);
      s.setHours(0, 0, 0, 0);
      filtered = filtered.filter((p) => new Date(p.createdAt) >= s);
    }
    if (pendingEndDate) {
      const e = new Date(pendingEndDate);
      e.setHours(23, 59, 59, 999);
      filtered = filtered.filter((p) => new Date(p.createdAt) <= e);
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const filtered = getFiltered();
  const hasFilters =
    pendingSearchQuery || pendingStartDate || pendingEndDate || activePendingTab !== "ALL";
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div
      className={`bg-teal-900 text-white rounded-lg shadow-2xl min-h-screen overflow-y-auto transition-all duration-300 flex-shrink-0 ${
        pendingSidebarCollapsed ? "w-16" : "w-96"
      }`}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-teal-700 pb-4">
          <div className="flex items-center justify-between">
            {!pendingSidebarCollapsed && (
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaVial className="text-orange-300" />
                  Phlebotomy Queue
                </h2>
                <p className="text-orange-200 text-sm mt-2">
                  {hasFilters
                    ? `${filtered.length} of ${pendingPatients.length} patient${pendingPatients.length !== 1 ? "s" : ""} shown`
                    : `${pendingPatients.length} patient${pendingPatients.length !== 1 ? "s" : ""} pending lab number`}
                </p>
                {lastRefreshTime && (
                  <p className="text-orange-300 text-xs mt-1">
                    Updated: {lastRefreshTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() => setPendingSidebarCollapsed(!pendingSidebarCollapsed)}
              className="text-orange-300 hover:text-white transition-colors p-1"
              title={pendingSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {pendingSidebarCollapsed ? (
                <FaChevronCircleRight className="w-6 h-6 text-2xl" />
              ) : (
                <FaChevronCircleLeft className="w-6 h-6 text-2xl" />
              )}
            </button>
          </div>

          {/* Collapsed icon-only badge */}
          {pendingSidebarCollapsed && (
            <div className="flex flex-col items-center pt-4 space-y-4">
              <div className="relative">
                <FaVial className="w-8 h-8 text-orange-400" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingPatients.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {!pendingSidebarCollapsed && (
          <>
            {/* Search Section */}
            <div>
              <h3 className="text-sm font-semibold text-orange-200 mb-3 uppercase tracking-wide">
                Search Patient
              </h3>
              <div className="relative">
                
                <input
                  type="text"
                  placeholder="Search by name or passport..."
                  className="w-full px-4 py-3 pl-10 rounded-lg border-0 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-300 transition-all duration-200"
                  value={pendingSearchQuery}
                  onChange={(e) => setPendingSearchQuery(e.target.value)}
                />
                {pendingSearchQuery && (
                  <button
                    onClick={() => setPendingSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {pendingSearchQuery && (
                <p className="text-orange-200 text-xs mt-2">
                  Found {filtered.length} match{filtered.length !== 1 ? "es" : ""}
                </p>
              )}
            </div>

            {/* Medical Type Filter */}
            <div>
              <h3 className="text-sm font-semibold text-orange-200 mb-3 uppercase tracking-wide flex items-center gap-2">
                <FaFilter /> Filter by Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const types = [
                    "ALL",
                    ...[...new Set(pendingPatients.map((p) => p.medicalType))].sort(),
                  ];
                  return types.map((type) => {
                    const count =
                      type === "ALL"
                        ? pendingPatients.length
                        : pendingPatients.filter((p) => p.medicalType === type).length;
                    const isActive = activePendingTab === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setActivePendingTab(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          isActive
                            ? type === "SM-VDRL"
                              ? "bg-red-600 text-white shadow-lg ring-2 ring-red-400/50"
                              : type === "ALL"
                              ? "bg-orange-600 text-white shadow-lg ring-2 ring-orange-400/50"
                              : "bg-orange-500 text-white shadow-lg ring-2 ring-orange-300/50"
                            : "bg-teal-800 text-orange-200 hover:bg-teal-700"
                        }`}
                      >
                        {type} <span className="font-bold">({count})</span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h3 className="text-sm font-semibold text-orange-200 mb-3 uppercase tracking-wide">
                Date Range
              </h3>
              {/* Quick filters */}
              <div className="flex gap-1 mb-3">
                {[
                  {
                    label: "Today",
                    action: () => {
                      const t = new Date().toISOString().split("T")[0];
                      setPendingStartDate(t);
                      setPendingEndDate(t);
                    },
                  },
                  {
                    label: "Week",
                    action: () => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(today.getDate() - 7);
                      setPendingStartDate(weekAgo.toISOString().split("T")[0]);
                      setPendingEndDate(today.toISOString().split("T")[0]);
                    },
                  },
                  {
                    label: "Month",
                    action: () => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setDate(today.getDate() - 30);
                      setPendingStartDate(monthAgo.toISOString().split("T")[0]);
                      setPendingEndDate(today.toISOString().split("T")[0]);
                    },
                  },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex-1 px-2 py-1.5 bg-teal-800 hover:bg-teal-700 text-orange-100 text-xs rounded-lg font-medium transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-orange-300 mb-1">From</label>
                  <input
                    type="date"
                    value={pendingStartDate || ""}
                    onChange={(e) => setPendingStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-0 bg-white text-gray-900 focus:ring-2 focus:ring-orange-300 transition-all duration-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-orange-300 mb-1">To</label>
                  <input
                    type="date"
                    value={pendingEndDate || ""}
                    onChange={(e) => setPendingEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-0 bg-white text-gray-900 focus:ring-2 focus:ring-orange-300 transition-all duration-200 text-xs"
                  />
                </div>
              </div>
              {(pendingSearchQuery || pendingStartDate || pendingEndDate) && (
                <button
                  onClick={() => {
                    setPendingSearchQuery("");
                    setPendingStartDate(null);
                    setPendingEndDate(null);
                  }}
                  className="w-full mt-3 px-3 py-2 bg-teal-800 hover:bg-teal-700 text-orange-200 text-xs rounded-lg font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <FaTimes className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchPendingPatients}
              disabled={loadingPending}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-5 h-5 ${loadingPending ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loadingPending ? "Refreshing..." : "Refresh Queue"}
            </button>

            {/* Patient Cards */}
            {loadingPending ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white font-medium">Loading Patients...</p>
                <p className="text-sm text-orange-200 mt-2">
                  Fetching patients pending lab number assignment
                </p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="bg-teal-800 border border-teal-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">💉</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        Pending Assignment ({filtered.length})
                      </p>
                      <p className="text-xs text-orange-200 mt-1">
                        Patients registered but not yet assigned a lab number.
                      </p>
                    </div>
                  </div>
                </div>

                {paginated.map((patient) => {
                  const isNew = isNewPatient(patient.createdAt);
                  const relativeTime = getRelativeTime(patient.createdAt);
                  const exactDateTime = new Date(patient.createdAt).toLocaleString();
                  const isSelected = selectedPatient === patient.name;

                  return (
                    <div
                      key={patient._id}
                      onClick={() => {
                        const normalizedName = patient.name.trim().toLowerCase();
                        const existingLab = submittedLabNumbers.find(
                          (lab) =>
                            lab.patient.trim().toLowerCase() === normalizedName
                        );
                        if (existingLab) {
                          setDuplicateModalData({
                            patientName: patient.name,
                            passportNumber: patient.passportNumber,
                            medicalType: patient.medicalType,
                            existingLabNumber: existingLab.number || "Unknown",
                            status: existingLab.status || "pending",
                          });
                          setShowDuplicateModal(true);
                        } else {
                          setSelectedPatient(patient.name);
                          setSearchTerm(patient.passportNumber);
                        }
                      }}
                      className={`relative rounded-xl transition-all duration-300 cursor-pointer border-2 ${
                        isSelected
                          ? "bg-white text-gray-900 border-orange-400 shadow-2xl"
                          : isNew
                          ? "bg-gradient-to-r from-green-900/40 to-teal-800/40 border-green-500/60 hover:border-green-400/80 shadow-lg hover:shadow-xl ring-1 ring-green-500/30"
                          : "bg-teal-800 bg-opacity-50 border-orange-700 hover:bg-teal-700 hover:border-orange-500 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      <div className="p-4">
                        {/* Badges */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              patient.medicalType === "SM-VDRL"
                                ? "bg-red-500 text-white"
                                : "bg-orange-500 text-white"
                            }`}
                          >
                            {patient.medicalType}
                          </span>
                          {isNew && (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="relative group flex-shrink-0">
                            <div
                              className={`w-16 h-16 border-2 ${
                                isSelected ? "border-orange-500" : "border-orange-600"
                              } rounded-full overflow-hidden shadow-lg`}
                            >
                              {patient.photo ? (
                                <img
                                  src={`data:image/jpeg;base64,${patient.photo}`}
                                  alt="Patient"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full flex items-center justify-center ${
                                  isSelected ? "bg-orange-100" : "bg-teal-800"
                                }`}
                                style={{
                                  display: patient.photo ? "none" : "flex",
                                }}
                              >
                                <span
                                  className={`text-2xl ${
                                    isSelected ? "text-orange-700" : "text-orange-300"
                                  }`}
                                >
                                  👤
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-base font-bold truncate ${
                                isSelected ? "text-gray-900" : "text-white"
                              }`}
                            >
                              {patient.name}
                            </h3>
                            <p
                              className={`text-xs mt-1 font-mono ${
                                isSelected ? "text-gray-700" : "text-orange-200"
                              }`}
                            >
                              {patient.passportNumber}
                            </p>
                            <p
                              className={`text-xs ${
                                isSelected ? "text-gray-500" : "text-orange-300"
                              }`}
                              title={exactDateTime}
                            >
                              🕐{" "}
                              <span className={isNew ? "text-green-400 font-semibold" : ""}>
                                {relativeTime}
                              </span>
                              {"  "}📅 {new Date(patient.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Footer badge */}
                        {!isSelected && (
                          <div className="flex items-center justify-center mt-3 pt-3 border-t border-orange-600">
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-orange-200">
                              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                              Awaiting Lab Number
                            </span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center justify-center mt-3 pt-3 border-t border-orange-200">
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-orange-700">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              Currently Selected
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
                  <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                <p className="text-orange-200 text-sm">
                  {hasFilters
                    ? "No patients match your filters."
                    : "No patients pending lab number assignment."}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => {
                      setPendingSearchQuery("");
                      setPendingStartDate(null);
                      setPendingEndDate(null);
                      setActivePendingTab("ALL");
                    }}
                    className="mt-3 text-xs text-orange-300 hover:text-white underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-teal-700 pt-6 mt-2">
                <div className="flex justify-between items-center">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-teal-800 text-teal-500 cursor-not-allowed opacity-50"
                        : "bg-white text-teal-900 hover:bg-teal-50 hover:scale-105 shadow-md"
                    }`}
                  >
                    <FaChevronCircleLeft />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="text-xs text-orange-300 mt-1">
                      {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                    </span>
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === totalPages
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
          </>
        )}
      </div>
    </div>
  );
};

export default PhlebotomySidebar;
