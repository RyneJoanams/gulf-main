import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import LeftBar from '../../components/LeftBar';
import TopBar from '../../components/TopBar';
import { usePatient } from '../../context/patientContext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const Radiology = () => {
    const { patientData } = usePatient();
    const [heafMantouxTest, setHeafMantouxTest] = useState('');
    const [chestXRayTest, setChestXRayTest] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('Select Patient');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch patient data if needed
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Check if patient data and selected patient are valid
        if (!patientData || !Array.isArray(patientData.patients)) {
            console.error('Patient data is not correctly loaded or structured.');
            toast.error('Patient data is not available. Please reload the page.');
            return;
        }

        if (!selectedPatient) {
            console.error('No patient selected.');
            toast.error('Please select a patient before submitting.');
            return;
        }

        // Find the patientId based on the selected patient
        const patient = patientData.patients.find((patient) => patient.name === selectedPatient);
        if (!patient) {
            console.error('No matching patient found for the selected name:', selectedPatient);
            toast.error('Please select a valid patient.');
            return;
        }

        const payload = {
            patientId: patient.id,
            patientName: selectedPatient,
            radiologyData: {
                heafMantouxTest,
                chestXRayTest
            },
            timeStamp: Date.now(),
        };

        try {
            const response = await axios.post('http://localhost:5000/api/radiology', payload);
            const data = response.data;
            console.log('Response data:', data);

            if (data.success) {
                toast.success('Radiology report submitted successfully');
                // Reset form fields
                setHeafMantouxTest('');
                setChestXRayTest('');
                setSelectedPatient('Select Patient');
            } else {
                console.error('Radiology report submission failed:', data.error);
                toast.error(data.error || 'Radiology report submission failed');
            }
        } catch (error) {
            console.error('Error submitting radiology report:', error.response?.data || error.message);
            toast.error('Error submitting radiology report');
        }
    };

    // Filter patients based on the search term
    const filteredPatients = patientData.patients.filter((patient) =>
        patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <TopBar />
            <div className="flex">
                <LeftBar />
                <div className='max-w-11/12 mx-auto p-6 bg-white shadow-lg rounded-lg'>
                    <h1 className="text-2xl font-extrabold text-center mb-8 text-blue-700 transition duration-300 hover:text-blue-900 shadow-md p-4 rounded-md bg-gradient-to-r from-blue-50 to-blue-200 hover:from-blue-100 hover:to-blue-300">
                        Radiology Tests
                    </h1>
                    <ToastContainer />
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-600 font-semibold mb-2" htmlFor="patientSearch">
                                Search Patient
                            </label>
                            <input
                                type="text"
                                id="patientSearch"
                                placeholder="Search by name"
                                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out mb-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <label className="block text-gray-600 font-semibold mb-2" htmlFor="patientSelect">
                                Select Patient
                            </label>
                            <select
                                id="patientSelect"
                                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                disabled={!patientData.patients || patientData.patients.length === 0}
                            >
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <option key={patient.labNumber} value={patient.name}>
                                            {patient.name}
                                        </option>
                                    ))
                                ) : (
                                    <option>No patients found</option>
                                )}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-600 font-semibold mb-2" htmlFor="heafMantouxTest">Heaf/Mantoux Test:</label>
                            <input
                                type="text"
                                id="heafMantouxTest"
                                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                value={heafMantouxTest}
                                onChange={(e) => setHeafMantouxTest(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-600 font-semibold mb-2" htmlFor="chestXRayTest">Chest X-Ray Test:</label>
                            <input
                                type="text"
                                id="chestXRayTest"
                                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                value={chestXRayTest}
                                onChange={(e) => setChestXRayTest(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="mt-10 w-1/4 bg-blue-500 hover:bg-blue-600 text-white text-[16px] font-semibold py-2 px-4 rounded shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105">
                            Submit
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Radiology;