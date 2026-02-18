import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

/**
 * Photo Debugger Component
 * Temporarily add this to any page to debug photo loading issues
 * 
 * Usage:
 * import PhotoDebugger from '../components/PhotoDebugger';
 * 
 * Then in your component JSX:
 * <PhotoDebugger patientName="John Doe" />
 */
const PhotoDebugger = ({ patientName, reportPhoto, patientDetailsPhoto }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/patient`, {
          params: {
            name: patientName || '',
            excludePhoto: patientName ? 'false' : 'true',
            fields: patientName ? 'name,photo' : 'name',
            limit: patientName ? 5 : 10
          }
        });
        const patients = response.data.patients || response.data || [];
        
        const patient = patientName 
          ? patients.find(p => p.name?.toLowerCase() === patientName.toLowerCase())
          : patients[0];

        setDebugInfo({
          totalPatients: patients.length,
          patientsWithPhotos: patients.filter(p => p.photo).length,
          currentPatient: patient?.name || 'None selected',
          hasPhoto: !!patient?.photo,
          photoLength: patient?.photo?.length || 0,
          photoPreview: patient?.photo ? patient.photo.substring(0, 50) + '...' : 'No photo',
          reportPhotoPresent: !!reportPhoto,
          reportPhotoLength: reportPhoto?.length || 0,
          patientDetailsPhotoPresent: !!patientDetailsPhoto,
          patientDetailsPhotoLength: patientDetailsPhoto?.length || 0
        });
      } catch (error) {
        setDebugInfo({
          error: error.message
        });
      }
    };

    fetchDebugInfo();
  }, [patientName, reportPhoto, patientDetailsPhoto]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 bg-white border-4 border-purple-500 rounded-lg shadow-2xl p-4 max-w-md z-50"
      style={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-purple-300">
        <h3 className="text-lg font-bold text-purple-700 flex items-center gap-2">
          📸 Photo Debug Panel
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-red-600 font-bold text-xl"
        >
          ×
        </button>
      </div>

      {debugInfo ? (
        debugInfo.error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
            <strong>Error:</strong> {debugInfo.error}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Database Stats</h4>
              <div className="space-y-1 text-gray-700">
                <div className="flex justify-between">
                  <span>Total Patients:</span>
                  <span className="font-bold">{debugInfo.totalPatients}</span>
                </div>
                <div className="flex justify-between">
                  <span>With Photos:</span>
                  <span className={`font-bold ${debugInfo.patientsWithPhotos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.patientsWithPhotos}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">👤 Current Patient</h4>
              <div className="space-y-1 text-gray-700">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-semibold">{debugInfo.currentPatient}</span>
                </div>
                <div className="flex justify-between">
                  <span>Has Photo:</span>
                  <span className={`font-bold ${debugInfo.hasPhoto ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.hasPhoto ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                {debugInfo.hasPhoto && (
                  <div className="flex justify-between">
                    <span>Photo Size:</span>
                    <span className="font-mono text-xs">{debugInfo.photoLength} chars</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">🔍 Photo Sources</h4>
              <div className="space-y-2 text-gray-700">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Report Photo:</span>
                    <span className={`font-bold ${debugInfo.reportPhotoPresent ? 'text-green-600' : 'text-gray-400'}`}>
                      {debugInfo.reportPhotoPresent ? '✅' : '❌'}
                    </span>
                  </div>
                  {debugInfo.reportPhotoPresent && (
                    <div className="text-xs text-gray-600 ml-2">
                      Length: {debugInfo.reportPhotoLength} chars
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Patient Details Photo:</span>
                    <span className={`font-bold ${debugInfo.patientDetailsPhotoPresent ? 'text-green-600' : 'text-gray-400'}`}>
                      {debugInfo.patientDetailsPhotoPresent ? '✅' : '❌'}
                    </span>
                  </div>
                  {debugInfo.patientDetailsPhotoPresent && (
                    <div className="text-xs text-gray-600 ml-2">
                      Length: {debugInfo.patientDetailsPhotoLength} chars
                    </div>
                  )}
                </div>
              </div>
            </div>

            {debugInfo.hasPhoto && debugInfo.photoLength > 50 && (
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🖼️ Photo Preview</h4>
                <div className="text-xs text-gray-600 break-all bg-white p-2 rounded font-mono">
                  {debugInfo.photoPreview}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  ℹ️ This is the beginning of the base64 string
                </div>
              </div>
            )}

            <div className="bg-gray-100 p-2 rounded text-xs text-gray-600">
              <strong>💡 Tip:</strong> Check browser console for detailed logs
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>This debug panel shows photo loading status.</p>
        <p className="mt-1">Remove &lt;PhotoDebugger /&gt; from component when done.</p>
      </div>
    </div>
  );
};

export default PhotoDebugger;
