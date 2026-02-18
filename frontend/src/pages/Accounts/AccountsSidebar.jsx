import React, { useState, useEffect } from "react";
import {
  FaChevronCircleLeft,
  FaChevronCircleRight,
  FaSearch,
  FaTimes,
  FaFilter,
  FaMoneyBillWave,
  FaChartBar,
  FaCreditCard,
  FaReceipt,
} from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

const isNewPatient = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  return (now - date) / 3600000 < 1;
};

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

const AccountsSidebar = ({
  activeSection,
  setActiveSection,
  pendingPatients,
  loadingPendingPatients,
  fetchPendingPatients,
  setSelectedPatient,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  const getFiltered = () => {
    let list = pendingPatients.filter(
      (p) => typeFilter === "ALL" || p.medicalType === typeFilter
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.passportNumber?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const hasFilters = searchQuery || typeFilter !== "ALL";

  const medicalTypes = [...new Set(pendingPatients.map((p) => p.medicalType))].sort();

  const navItems = [
    { id: "summary", label: "Financial Summary", icon: FaChartBar },
    { id: "payments", label: "Payments", icon: FaCreditCard },
    { id: "expenses", label: "Expenses", icon: FaReceipt },
  ];

  return (
    <div
      className={`bg-teal-900 text-white shadow-2xl min-h-screen overflow-y-auto transition-all duration-300 flex-shrink-0 ${
        collapsed ? "w-16" : "w-96"
      }`}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-teal-700 pb-4">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaMoneyBillWave className="text-teal-300" />
                  Accounts
                </h2>
                <p className="text-teal-200 text-sm mt-2">
                  {pendingPatients.length} patient
                  {pendingPatients.length !== 1 ? "s" : ""} pending payment
                </p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-teal-300 hover:text-white transition-colors p-1"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <FaChevronCircleRight className="text-2xl" />
              ) : (
                <FaChevronCircleLeft className="text-2xl" />
              )}
            </button>
          </div>

          {/* Collapsed badge */}
          {collapsed && (
            <div className="flex flex-col items-center pt-4 space-y-4">
              <div className="relative">
                <FaMoneyBillWave className="text-3xl text-teal-300" />
                {pendingPatients.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-teal-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingPatients.length > 99 ? "99+" : pendingPatients.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Navigation */}
            <div>
              <h3 className="text-sm font-semibold text-teal-200 mb-3 uppercase tracking-wide">
                Navigation
              </h3>
              <nav className="flex flex-col space-y-2">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`text-left px-4 py-3 rounded-lg flex items-center justify-between font-medium transition-all duration-200 ${
                      activeSection === id
                        ? "bg-white text-teal-900 shadow-md"
                        : "bg-teal-800 bg-opacity-50 text-white hover:bg-teal-700 border border-teal-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={activeSection === id ? "text-teal-700" : "text-teal-300"}
                      />
                      {label}
                    </span>
                    {id === "payments" && pendingPatients.length > 0 && (
                      <span className="bg-yellow-500 text-teal-900 text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingPatients.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Divider */}
            <div className="border-t border-teal-700" />

            {/* Pending Payments header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-teal-200 uppercase tracking-wide">
                Pending Payments
              </h3>
              <button
                onClick={fetchPendingPatients}
                disabled={loadingPendingPatients}
                className="text-teal-300 hover:text-white transition-colors"
                title="Refresh"
              >
                <svg
                  className={`w-4 h-4 ${loadingPendingPatients ? "animate-spin" : ""}`}
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
              </button>
            </div>

            {/* Search */}
            <div>
              <h3 className="text-sm font-semibold text-teal-200 mb-3 uppercase tracking-wide">
                Search Patient
              </h3>
              <div className="relative">
                
                <input
                  type="text"
                  placeholder="Search by name or passport..."
                  className="w-full px-4 py-3 pl-10 rounded-lg border-0 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-300 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-teal-200 text-xs mt-2">
                  Found {filtered.length} match{filtered.length !== 1 ? "es" : ""}
                </p>
              )}
            </div>

            {/* Medical Type Filter */}
            <div>
              <h3 className="text-sm font-semibold text-teal-200 mb-3 uppercase tracking-wide flex items-center gap-2">
                <FaFilter /> Filter by Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {["ALL", ...medicalTypes].map((type) => {
                  const count =
                    type === "ALL"
                      ? pendingPatients.length
                      : pendingPatients.filter((p) => p.medicalType === type).length;
                  const isActive = typeFilter === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? type === "SM-VDRL"
                            ? "bg-red-600 text-white shadow-lg ring-2 ring-red-400/50"
                            : "bg-white text-teal-900 shadow-lg ring-2 ring-teal-300/50"
                          : "bg-teal-800 text-teal-200 hover:bg-teal-700"
                      }`}
                    >
                      {type} <span className="font-bold">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient Cards */}
            {loadingPendingPatients ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
                <p className="text-white font-medium">Loading Patients...</p>
                <p className="text-sm text-teal-200 mt-2">
                  Fetching pending payment records
                </p>
              </div>
            ) : paginated.length > 0 ? (
              <div className="space-y-4">
                {/* Info banner */}
                <div className="bg-teal-800 border border-teal-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">💳</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        Awaiting Payment ({filtered.length})
                      </p>
                      <p className="text-xs text-teal-200 mt-1">
                        Click a patient to load their record into the payment form.
                      </p>
                    </div>
                  </div>
                </div>

                {paginated.map((patient) => {
                  const isNew = isNewPatient(patient.createdAt);
                  const relTime = getRelativeTime(patient.createdAt);
                  const exactDT = new Date(patient.createdAt).toLocaleString();

                  return (
                    <div
                      key={patient._id}
                      onClick={() => {
                        setSelectedPatient(patient.name);
                        setActiveSection("payments");
                        setTimeout(() => {
                          document
                            .getElementById("payment-form")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className={`relative rounded-xl transition-all duration-300 cursor-pointer border-2 ${
                        isNew
                          ? "bg-gradient-to-r from-green-900/40 to-teal-800/40 border-green-500/60 hover:border-green-400/80 shadow-lg hover:shadow-xl ring-1 ring-green-500/30"
                          : "bg-teal-800 bg-opacity-50 border-teal-700 hover:bg-teal-700 hover:border-teal-500 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      <div className="p-4">
                        {/* Badges */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              patient.medicalType === "SM-VDRL"
                                ? "bg-red-500 text-white"
                                : "bg-teal-500 text-white"
                            }`}
                          >
                            {patient.medicalType}
                          </span>
                          {isNew && (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-500 text-teal-900">
                            Pending
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 border-2 border-teal-600 rounded-full overflow-hidden shadow-lg">
                              {patient.photo ? (
                                <img
                                  src={`data:image/jpeg;base64,${patient.photo}`}
                                  alt="Patient"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full h-full flex items-center justify-center bg-teal-800"
                                style={{ display: patient.photo ? "none" : "flex" }}
                              >
                                <span className="text-2xl text-teal-300">👤</span>
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold truncate text-white">
                              {patient.name}
                            </h3>
                            <p className="text-xs mt-1 text-teal-200 font-mono">
                              {patient.passportNumber}
                            </p>
                            <p className="text-xs text-teal-300">
                              {patient.age ? `Age: ${patient.age}y` : ""}
                            </p>
                            <p
                              className="text-xs text-teal-300"
                              title={exactDT}
                            >
                              🕐{" "}
                              <span className={isNew ? "text-green-400 font-semibold" : ""}>
                                {relTime}
                              </span>
                              {"  "}📅 {new Date(patient.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-center mt-3 pt-3 border-t border-teal-600">
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-teal-200">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            Click to process payment
                          </span>
                        </div>
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
                <p className="text-teal-200 text-sm">
                  {hasFilters
                    ? "No patients match your filters."
                    : "No patients pending payment."}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("ALL");
                    }}
                    className="mt-3 text-xs text-teal-300 hover:text-white underline"
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
                    <span className="text-xs text-teal-300 mt-1">
                      {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
                      {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
                      {filtered.length}
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

export default AccountsSidebar;
