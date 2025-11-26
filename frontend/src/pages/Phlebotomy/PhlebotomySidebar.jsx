import React from 'react';

const PhlebotomySidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  loadingSidebarPatients,
  filteredSidebarPatients,
  patientsWithoutLabNumbers,
  startDate,
  endDate,
  searchInput,
  setSearchInput,
  sidebarSearchQuery,
  setSidebarSearchQuery,
  handleSearchIconClick,
  handleSearchKeyPress,
  handleDateRangeChange,
  resetSidebarFilters,
  fetchPatientsWithoutLabNumbers,
  selectedPatient,
  handleSidebarPatientSelect
}) => {
  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 transition-all duration-300 z-50 ${
      sidebarCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-bold text-teal-400">Pending Lab Numbers</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-teal-400 transition-colors"
          >
            {sidebarCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
        {!sidebarCollapsed && (
          <div className="mt-1">
            <p className="text-sm text-gray-400">
              {loadingSidebarPatients ? (
                'Loading...'
              ) : (
                <>
                  <span className="text-teal-300 font-medium">{filteredSidebarPatients.length}</span>
                  {filteredSidebarPatients.length !== patientsWithoutLabNumbers.length && (
                    <span> of <span className="text-yellow-300">{patientsWithoutLabNumbers.length}</span></span>
                  )}
                  <span> patients {filteredSidebarPatients.length !== patientsWithoutLabNumbers.length ? 'shown' : 'pending'}</span>
                </>
              )}
            </p>
            {startDate === endDate && startDate === new Date().toISOString().split('T')[0] && (
              <p className="text-xs text-blue-400 mt-1">📅 Today's patients</p>
            )}
          </div>
        )}
      </div>
      
      {!sidebarCollapsed && (
        <div className="p-4">
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                key="sidebar-search-input"
                type="text"
                placeholder="Search patients..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                autoComplete="off"
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSearchIconClick}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-400 transition-colors p-1"
                title="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {sidebarSearchQuery && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Searching for: <span className="text-teal-300 font-medium">"{sidebarSearchQuery}"</span></span>
                <button
                  onClick={() => {
                    setSidebarSearchQuery('');
                    setSearchInput('');
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Date Range Filters */}
          <div className="mb-4 space-y-2">
            <label className="text-xs text-gray-400 font-medium">Date Range</label>
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
                <label className="absolute -top-2 left-2 text-xs text-gray-500 bg-gray-900 px-1">From</label>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
                <label className="absolute -top-2 left-2 text-xs text-gray-500 bg-gray-900 px-1">To</label>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={resetSidebarFilters}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                setSidebarSearchQuery('');
                setSearchInput('');
              }}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
            >
              All
            </button>
          </div>

          <button
            onClick={fetchPatientsWithoutLabNumbers}
            className="w-full mb-4 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors"
            disabled={loadingSidebarPatients}
          >
            {loadingSidebarPatients ? 'Refreshing...' : 'Refresh List'}
          </button>
          
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {loadingSidebarPatients ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
                <p className="mt-2 text-sm">Loading patients...</p>
              </div>
            ) : filteredSidebarPatients.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">
                  {patientsWithoutLabNumbers.length === 0 
                    ? 'All patients have lab numbers assigned!' 
                    : 'No patients match your filters'
                  }
                </p>
              </div>
            ) : (
              filteredSidebarPatients.map((patient) => (
                <div
                  key={patient._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-800 hover:border-teal-400 ${
                    selectedPatient === patient.name
                      ? 'bg-teal-900/50 border-teal-500 ring-1 ring-teal-500/50'
                      : 'bg-gray-800/50 border-gray-600'
                  }`}
                  onClick={() => handleSidebarPatientSelect(patient)}
                >
                  <div className="flex items-start space-x-3">
                    {patient.photo ? (
                      <img
                        src={`data:image/jpeg;base64,${patient.photo}`}
                        alt="Patient"
                        className="w-10 h-10 rounded-full object-cover border border-gray-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{patient.name}</p>
                      <p className="text-xs text-gray-400 truncate">{patient.passportNumber}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          patient.medicalType === 'SM-VDRL' 
                            ? 'bg-red-900/50 text-red-300 border border-red-700/50' 
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                        }`}>
                          {patient.medicalType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {new Date(patient.createdAt).toLocaleDateString()}
                      </p>
                      {selectedPatient === patient.name && (
                        <p className="text-xs text-teal-300 mt-1 font-medium">✓ Selected</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebotomySidebar;
