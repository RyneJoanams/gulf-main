const axios = require('axios');

async function testEndpoints() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('Testing API endpoints...\n');
    
    try {
        // Test lab endpoint
        console.log('Testing /api/lab endpoint...');
        const labResponse = await axios.get(`${baseURL}/lab`);
        console.log('✅ Lab endpoint working');
        console.log(`   Status: ${labResponse.status}`);
        console.log(`   Data type: ${Array.isArray(labResponse.data.data) ? 'Array' : typeof labResponse.data}`);
        console.log(`   Records count: ${Array.isArray(labResponse.data.data) ? labResponse.data.data.length : 'N/A'}`);
        
    } catch (error) {
        console.log('❌ Lab endpoint failed');
        console.log(`   Error: ${error.message}`);
    }
    
    try {
        // Test radiology endpoint
        console.log('\nTesting /api/radiology endpoint...');
        const radiologyResponse = await axios.get(`${baseURL}/radiology`);
        console.log('✅ Radiology endpoint working');
        console.log(`   Status: ${radiologyResponse.status}`);
        console.log(`   Data type: ${Array.isArray(radiologyResponse.data) ? 'Array' : typeof radiologyResponse.data}`);
        console.log(`   Records count: ${Array.isArray(radiologyResponse.data) ? radiologyResponse.data.length : 'N/A'}`);
        
    } catch (error) {
        console.log('❌ Radiology endpoint failed');
        console.log(`   Error: ${error.message}`);
    }
    
    try {
        // Test clinical endpoint
        console.log('\nTesting /api/clinical endpoint...');
        const clinicalResponse = await axios.get(`${baseURL}/clinical`);
        console.log('✅ Clinical endpoint working');
        console.log(`   Status: ${clinicalResponse.status}`);
        console.log(`   Data type: ${Array.isArray(clinicalResponse.data) ? 'Array' : typeof clinicalResponse.data}`);
        console.log(`   Records count: ${Array.isArray(clinicalResponse.data) ? clinicalResponse.data.length : 'N/A'}`);
        
    } catch (error) {
        console.log('❌ Clinical endpoint failed');
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\nAPI endpoint testing completed.');
}

testEndpoints();
