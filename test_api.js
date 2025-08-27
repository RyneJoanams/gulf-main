const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing lab number completion API...');
    
    // Test GET request first
    const getResponse = await axios.get('http://localhost:5000/api/number');
    console.log('GET /api/number successful');
    console.log('Sample lab number:', getResponse.data.labNumbers[0]);
    
    // Test marking a lab number as completed
    const putResponse = await axios.put('http://localhost:5000/api/number/complete', {
      labNumber: 'LAB-29384959-001'
    });
    
    console.log('PUT /api/number/complete response:', putResponse.data);
    
    // Test GET again to see if status changed
    const getResponse2 = await axios.get('http://localhost:5000/api/number');
    const updatedLabNumber = getResponse2.data.labNumbers.find(lab => lab.number === 'LAB-29384959-001');
    console.log('Updated lab number:', updatedLabNumber);
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testAPI();
