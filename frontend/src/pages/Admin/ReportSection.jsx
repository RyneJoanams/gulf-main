import React from 'react';
import PropTypes from 'prop-types';

const ReportSection = ({ title, data }) => {
  // Handle null, undefined, or non-object data
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return (
      <SectionWrapper title={title}>
        <p className="text-gray-500 text-center py-4">No data available.</p>
      </SectionWrapper>
    );
  }

  // Check if this is a table-based section (renal function, full haemogram, liver function)
  const isTableSection = ['Renal Function', 'Full Haemogram', 'Liver Function'].includes(title);
  
  // Check if this is a card-based section (urine test, blood test, etc.)
  const isCardSection = ['Urine Test', 'Blood Test', 'General Examination', 'Systemic Examination', 'Laboratory Tests'].includes(title);
  
  // Check if this is a special section (Laboratory Remarks)
  const isSpecialSection = ['Laboratory Remarks'].includes(title);
  
  // Check if the data has the table structure (objects with value, units, status, range)
  const hasTableStructure = Object.values(data).some(value => 
    value && typeof value === 'object' && 
    (value.hasOwnProperty('value') || value.hasOwnProperty('status') || value.hasOwnProperty('range'))
  );

  if (isTableSection && hasTableStructure) {
    return renderTableSection(title, data);
  }

  if (isCardSection) {
    return renderCardSection(title, data);
  }

  if (isSpecialSection) {
    return renderSpecialSection(title, data);
  }

  const renderItem = (key, value) => {
    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return (
        <div key={key} className="ml-3 pl-4 border-l-2 border-blue-100 space-y-1">
          <h4 className="text-sm font-semibold text-gray-700">{formattedKey}</h4>
          {Object.entries(value).map(([subKey, subValue]) => renderItem(subKey, subValue))}
        </div>
      );
    }

    return (
      <div key={key} className="text-sm">
        <span className="font-medium text-gray-700">{formattedKey}:</span>{' '}
        <span className="text-gray-600">
          {typeof value === 'object' && value !== null && !Array.isArray(value) 
            ? `${value.value || 'N/A'}${value.units ? ` ${value.units}` : ''}${value.status ? ` (${value.status})` : ''}`
            : value || 'N/A'
          }
        </span>
      </div>
    );
  };

  return (
    <SectionWrapper title={title}>
      <div className="pl-1 space-y-2">
        {Object.entries(data).map(([key, value]) => renderItem(key, value))}
      </div>
    </SectionWrapper>
  );
};

// Enhanced table rendering function for medical test sections
const renderTableSection = (title, data) => {
  // Filter out entries that have actual data
  const tableData = Object.entries(data).filter(([key, value]) => {
    if (!value || typeof value !== 'object') return false;
    return value.value || value.status || value.range || value.units;
  });

  if (tableData.length === 0) {
    return (
      <SectionWrapper title={title}>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">
            {title === 'Renal Function' && '🫘'}
            {title === 'Full Haemogram' && '🔬'}
            {title === 'Liver Function' && '🫀'}
          </div>
          <p>No {title.toLowerCase()} data available</p>
        </div>
      </SectionWrapper>
    );
  }

  // Function to format test names
  const formatTestName = (key) => {
    const testNameMap = {
      // Renal Function
      'urea': 'Urea',
      'creatinine': 'Creatinine', 
      'fastingBloodSugar': 'Fasting Blood Sugar',
      
      // Full Haemogram
      'wbc': 'WBC (White Blood Cells)',
      'lym': 'Lymphocytes',
      'mid': 'Mid Cells',
      'gran': 'Granulocytes',
      'rbc': 'RBC (Red Blood Cells)',
      'mcv': 'MCV (Mean Cell Volume)',
      'hgb': 'Hemoglobin',
      'hct': 'Hematocrit',
      'mch': 'MCH (Mean Cell Hemoglobin)',
      'mchc': 'MCHC (Mean Cell Hb Concentration)',
      'rwd': 'RDW (Red Cell Distribution Width)',
      'plcr': 'PLCR (Platelet Large Cell Ratio)',
      'plt': 'Platelets',
      'mpv': 'MPV (Mean Platelet Volume)',
      'pct': 'PCT (Plateletcrit)',
      'pdw': 'PDW (Platelet Distribution Width)',
      
      // Liver Function
      'totalBilirubin': 'Total Bilirubin',
      'directBilirubin': 'Direct Bilirubin',
      'indirectBilirubin': 'Indirect Bilirubin',
      'sgot': 'SGOT (AST)',
      'sgpt': 'SGPT (ALT)',
      'gammaGt': 'Gamma GT',
      'alkalinePhosphate': 'Alkaline Phosphatase',
      'totalProteins': 'Total Proteins',
      'albumin1': 'Albumin',
    };
    
    return testNameMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  // Function to get status color
  const getStatusColor = (status) => {
    if (!status) return 'text-gray-500';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('normal') || statusLower.includes('negative')) {
      return 'text-green-600 font-medium';
    }
    if (statusLower.includes('high') || statusLower.includes('elevated') || statusLower.includes('positive')) {
      return 'text-red-600 font-medium';
    }
    if (statusLower.includes('low') || statusLower.includes('decreased')) {
      return 'text-orange-600 font-medium';
    }
    return 'text-blue-600 font-medium';
  };

  // Determine if this section should show units column
  const hasUnits = title === 'Full Haemogram';

  return (
    <SectionWrapper title={title}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Value
              </th>
              {hasUnits && (
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Units
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Reference Range
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatTestName(key)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`font-semibold ${value.value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {value.value || 'N/A'}
                  </span>
                </td>
                {hasUnits && (
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {value.units || '-'}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-center">
                  <span className={getStatusColor(value.status)}>
                    {value.status || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600 font-mono text-xs">
                  {value.range || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary footer for table sections */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{tableData.length} parameter{tableData.length !== 1 ? 's' : ''} recorded</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Normal
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              Abnormal
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
              Low
            </span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

const SectionWrapper = ({ title, children }) => {
  // Different styling for table-based sections
  const isTableSection = ['Renal Function', 'Full Haemogram', 'Liver Function'].includes(title);
  
  return (
    <div className={`rounded-lg p-4 transition-all duration-200 ${
      isTableSection 
        ? 'bg-white border border-gray-200 hover:shadow-lg' 
        : 'bg-gray-50 hover:shadow-md'
    }`}>
      <h3 className={`text-lg font-semibold mb-3 pb-2 border-b ${
        isTableSection 
          ? getTableSectionColor(title)
          : 'text-blue-600 border-blue-200'
      }`}>
        <span className="flex items-center gap-2">
          {isTableSection && (
            <span className="text-lg">
              {title === 'Renal Function' && '🫘'}
              {title === 'Full Haemogram' && '🔬'}
              {title === 'Liver Function' && '🫀'}
            </span>
          )}
          {title}
          {isTableSection && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-normal">
              Laboratory Test
            </span>
          )}
        </span>
      </h3>
      {children}
    </div>
  );
};

// Enhanced card rendering for basic laboratory test sections
const renderCardSection = (title, data) => {
  // Filter out entries that have actual data or are marked as completed/ticked
  const cardData = Object.entries(data).filter(([key, value]) => {
    // Include if has a value or if it's marked as completed/ticked
    return (value && value !== '' && value !== 'N/A' && value !== null && value !== undefined) ||
           (typeof value === 'object' && value !== null && (value.completed || value.ticked || value.done));
  });

  if (cardData.length === 0) {
    return (
      <SectionWrapper title={title}>
        <div className="text-center py-6 text-gray-500">
          <div className="text-2xl mb-2">
            {title === 'Urine Test' && '🧪'}
            {title === 'Blood Test' && '🩸'}
            {title === 'General Examination' && '👁️'}
            {title === 'Systemic Examination' && '❤️'}
            {title === 'Laboratory Tests' && '🔬'}
          </div>
          <p>No {title.toLowerCase()} data available</p>
        </div>
      </SectionWrapper>
    );
  }

  // Function to format test names for card sections
  const formatCardTestName = (key) => {
    const testNameMap = {
      // Urine Test
      'albumin': 'Albumin',
      'sugar': 'Sugar',
      'microscopic': 'Microscopic',
      'reaction': 'Reaction',
      
      // Blood Test
      'hivTest': 'HIV Test',
      'hbsAg': 'HBsAg',
      'hcv': 'HCV',
      'esr': 'ESR',
      'vdrlTest': 'VDRL Test',
      'pregnancyTest': 'Pregnancy Test',
      'bloodGroup': 'Blood Group',
      
      // General Examination
      'leftEye': 'Left Eye',
      'rightEye': 'Right Eye',
      'hernia': 'Hernia',
      'varicoseVein': 'Varicose Vein',
      
      // Systemic Examination
      'bloodPressure': 'Blood Pressure',
      'heart': 'Heart',
      'pulseRate': 'Pulse Rate',
      
      // Laboratory Tests (Additional Laboratory Tests)
      'typhoid': 'Typhoid',
      'hydrocele': 'Hydrocele',
      'otherDeformities': 'Other Deformities',
      'earRight': 'Right Ear',
      'earLeft': 'Left Ear',
      'lungs': 'Lungs',
      'liver': 'Liver',
      'spleen': 'Spleen',
    };
    
    return testNameMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  // Function to get result color and handle different value types
  const getCardResultInfo = (value) => {
    // Handle object values (for ticked/completed tests)
    if (typeof value === 'object' && value !== null) {
      if (value.completed || value.ticked || value.done) {
        return {
          text: value.result || value.value || 'Completed',
          color: value.result ? getCardResultColor(value.result) : 'text-green-600 font-medium',
          icon: '✓'
        };
      }
      return {
        text: value.result || value.value || 'N/A',
        color: value.result ? getCardResultColor(value.result) : 'text-gray-500',
        icon: null
      };
    }
    
    // Handle string values
    return {
      text: value || 'N/A',
      color: getCardResultColor(value),
      icon: null
    };
  };

  // Function to get result color for card sections
  const getCardResultColor = (value) => {
    if (!value) return 'text-gray-500';
    const valueLower = value.toLowerCase();
    
    // Positive/Negative results
    if (valueLower.includes('negative') || valueLower.includes('normal') || valueLower.includes('nil')) {
      return 'text-green-600 font-medium';
    }
    if (valueLower.includes('positive') || valueLower.includes('abnormal')) {
      return 'text-red-600 font-medium';
    }
    
    // Specific blood group or numerical values
    if (valueLower.match(/^[abo]+[\+\-]?$/) || valueLower.includes('group')) {
      return 'text-blue-600 font-bold';
    }
    
    return 'text-gray-700 font-medium';
  };

  return (
    <SectionWrapper title={title}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cardData.map(([key, value]) => {
          const resultInfo = getCardResultInfo(value);
          const isCompleted = typeof value === 'object' && value !== null && (value.completed || value.ticked || value.done);
          
          return (
            <div key={key} className={`rounded-lg p-3 border transition-colors duration-150 ${
              isCompleted 
                ? 'bg-green-50 border-green-200 hover:border-green-300' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  {resultInfo.icon && (
                    <span className="text-green-500 mr-2 font-bold">{resultInfo.icon}</span>
                  )}
                  {formatCardTestName(key)}
                </span>
                <span className={`text-sm ${resultInfo.color}`}>
                  {resultInfo.text}
                </span>
              </div>
              {isCompleted && (
                <div className="mt-1 text-xs text-green-600 font-medium">
                  Test Completed
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Summary footer for card sections */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{cardData.length} test{cardData.length !== 1 ? 's' : ''} recorded</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Normal/Negative/Completed
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              Positive/Abnormal
            </span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

// Enhanced rendering for special sections like Laboratory Remarks
const renderSpecialSection = (title, data) => {
  if (title === 'Laboratory Remarks') {
    return (
      <SectionWrapper title={title}>
        <div className="space-y-4">
          {/* Fitness Evaluation */}
          {data.fitnessEvaluation && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Fitness Evaluation
              </h4>
              <div className="space-y-2">
                {data.fitnessEvaluation.overallStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Overall Status:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      data.fitnessEvaluation.overallStatus.toLowerCase().includes('fit') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {data.fitnessEvaluation.overallStatus}
                    </span>
                  </div>
                )}
                {data.fitnessEvaluation.otherAspectsFit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Other Aspects:</span>
                    <span className="text-sm text-gray-600">
                      {data.fitnessEvaluation.otherAspectsFit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Lab Superintendent */}
          {data.labSuperintendent && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Lab Superintendent
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Name:</span>
                <span className="text-sm font-medium text-blue-800">
                  {data.labSuperintendent.name || 'Not specified'}
                </span>
              </div>
            </div>
          )}
          
          {/* Notepad Content / Clinical Notes */}
          {data.notepadContent && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Clinical Notes & Observations
              </h4>
              <div className="bg-white rounded p-3 border border-purple-100">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {data.notepadContent}
                </pre>
              </div>
            </div>
          )}
          
          {/* No data message */}
          {(!data.fitnessEvaluation || !Object.keys(data.fitnessEvaluation).length) && 
           (!data.labSuperintendent || !Object.keys(data.labSuperintendent).length) &&
           !data.notepadContent && (
            <div className="text-center py-6 text-gray-500">
              <div className="text-2xl mb-2">📋</div>
              <p>No laboratory remarks available</p>
            </div>
          )}
        </div>
      </SectionWrapper>
    );
  }

  // Fallback for other special sections
  return (
    <SectionWrapper title={title}>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-gray-700">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
            </span>{' '}
            <span className="text-gray-600">{value || 'N/A'}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

// Helper function to get section-specific colors
const getTableSectionColor = (title) => {
  switch (title) {
    case 'Renal Function':
      return 'text-blue-700 border-blue-200';
    case 'Full Haemogram':
      return 'text-red-700 border-red-200';
    case 'Liver Function':
      return 'text-green-700 border-green-200';
    default:
      return 'text-blue-600 border-blue-200';
  }
};

SectionWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ReportSection.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.object,
};

ReportSection.defaultProps = {
  data: null,
};

export default ReportSection;
