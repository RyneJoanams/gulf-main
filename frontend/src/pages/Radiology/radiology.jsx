import React, { useState } from 'react';

const Radiology = () => {
    const [heafMantouxTest, setHeafMantouxTest] = useState('');
    const [chestXRayTest, setChestXRayTest] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Heaf/Mantoux Test:', heafMantouxTest);
        console.log('Chest X-Ray Test:', chestXRayTest);
    };

    return (
        <div className='max-w-11/12 mx-auto p-6 bg-white shadow-lg rounded-lg'>
            <h1 className="text-2xl font-extrabold text-center mb-8 text-blue-700 transition duration-300 hover:text-blue-900 shadow-md p-4 rounded-md bg-gradient-to-r from-blue-50 to-blue-200 hover:from-blue-100 hover:to-blue-300">
                Radiology Tests
            </h1>
            <form onSubmit={handleSubmit}>
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
    );
};

export default Radiology;