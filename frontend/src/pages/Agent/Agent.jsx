import React, { useState } from 'react';
import Footer from '../../components/Footer';
import LeftBar from '../../components/LeftBar';
import TopBar from '../../components/TopBar';
// ...existing code...

const Agent = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async () => {
        // Replace with actual API call
        const results = await fetch(`/api/patients?search=${searchTerm}`).then(res => res.json());
        setSearchResults(results);
    };

    return (
        <div>
            <TopBar />
            <div className="flex">
                <LeftBar />
                <div className='max-w-11/12 mx-auto p-6 bg-white shadow-lg rounded-lg'>
                    <h1 className="text-2xl font-extrabold text-center mb-8 text-blue-700 transition duration-300 hover:text-blue-900 shadow-md p-4 rounded-md bg-gradient-to-r from-blue-50 to-blue-200 hover:from-blue-100 hover:to-blue-300">
                        Search Patients
                    </h1>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Enter full name or ID"
                            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out mb-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={handleSearch}
                            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white text-[16px] font-semibold py-2 px-4 rounded shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Search
                        </button>
                    </div>
                    <div>
                        {searchResults.length > 0 ? (
                            <ul>
                                {searchResults.map((patient) => (
                                    <li key={patient.id}>
                                        {patient.fullName} - {patient.id}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No results found</p>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Agent;
