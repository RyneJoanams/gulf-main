import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';


const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [patientData, setPatientData] = useState({ number: [], patients: [] });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/patient`);
        // Handle both old array format and new object format { patients: [...], pagination: {...} }
        const patientsData = response.data.patients || (Array.isArray(response.data) ? response.data : []);
        setPatientData((prevState) => ({
          ...prevState,
          patients: patientsData,
        }));
      } catch (error) {
        console.error('Error fetching patients:', error);
        // Set empty array on error to prevent filter errors
        setPatientData((prevState) => ({
          ...prevState,
          patients: [],
        }));
      }
    };

    fetchPatients();
  }, []);

  const updatePatientData = (data) => {
    setPatientData((prevState) => ({
      ...prevState,
      ...data,
    }));
  };

  return (
    <PatientContext.Provider value={{ patientData, updatePatientData }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  return useContext(PatientContext);
};
