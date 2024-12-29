import React from 'react';
import { AiTwotoneHome } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom'; // Update this import
import img from "../assets/logo1-removebg-preview.png"

const TopBar = () => {
  const navigate = useNavigate(); // Update this line

  const handleHomeClick = () => {
    navigate('/'); // Update this function
  };

  return (
    <div className="bg-gray-800 text-white py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="text-xl font-bold ml-10">
          <img
          className='w-28'
          alt=''
          src={img}
          />
        </div>
      </div>
      <div className='text-xl font-semibold cursor-pointer' onClick={handleHomeClick}>
      <AiTwotoneHome className='inline mr-2 size-7'/>Home
      </div>
      
    </div>
  );
};

export default TopBar;
