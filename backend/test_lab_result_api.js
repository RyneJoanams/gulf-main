// Test script for Lab Result API endpoints
// Run with: node test_lab_result_api.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test data
const testLabResult = {
  labNumber: 'TEST-001',
  patientName: 'Test Patient',
  reportData: {
    id: 'TEST-001',
    patientName: 'Test Patient',
    labNumber: 'TEST-001',
    reportDate: new Date().toLocaleDateString(),
    data: {
      selectedReport: {
        patientName: 'Test Patient',
        labNumber: 'TEST-001',
        timeStamp: new Date().toISOString()
      },
      urineTest: {
        albumin: 'Negative',
        sugar: 'Negative'
      },
      bloodTest: {
        hivTest: 'Negative',
        hbsAg: 'Negative'
      }
    }
  }
};

async function testAPI() {
  console.log('🧪 Testing Lab Result API Endpoints\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Save Lab Result
    console.log('\n📝 Test 1: Saving lab result snapshot...');
    const saveResponse = await axios.post(
      `${API_BASE_URL}/api/lab-result/save`,
      testLabResult
    );
    
    if (saveResponse.data.success) {
      console.log('✅ PASS: Lab result saved successfully');
      console.log('   Lab Number:', saveResponse.data.data.labNumber);
      console.log('   Patient:', saveResponse.data.data.patientName);
    } else {
      console.log('❌ FAIL: Failed to save lab result');
    }

    // Test 2: Retrieve Lab Result
    console.log('\n📥 Test 2: Retrieving lab result...');
    const getResponse = await axios.get(
      `${API_BASE_URL}/api/lab-result/${testLabResult.labNumber}`
    );
    
    if (getResponse.data.success) {
      console.log('✅ PASS: Lab result retrieved successfully');
      console.log('   Source:', getResponse.data.source);
      console.log('   Lab Number:', getResponse.data.data.labNumber);
      console.log('   Patient:', getResponse.data.data.patientName);
    } else {
      console.log('❌ FAIL: Failed to retrieve lab result');
    }

    // Test 3: Get Statistics
    console.log('\n📊 Test 3: Getting statistics...');
    const statsResponse = await axios.get(
      `${API_BASE_URL}/api/lab-result-stats`
    );
    
    if (statsResponse.data.success) {
      console.log('✅ PASS: Statistics retrieved successfully');
      console.log('   Total snapshots:', statsResponse.data.data.total);
      console.log('   Last 7 days:', statsResponse.data.data.lastSevenDays);
    } else {
      console.log('❌ FAIL: Failed to retrieve statistics');
    }

    // Test 4: Update Lab Result (should overwrite)
    console.log('\n🔄 Test 4: Updating lab result...');
    const updatedData = {
      ...testLabResult,
      patientName: 'Updated Test Patient'
    };
    
    const updateResponse = await axios.post(
      `${API_BASE_URL}/api/lab-result/save`,
      updatedData
    );
    
    if (updateResponse.data.success) {
      console.log('✅ PASS: Lab result updated successfully');
    } else {
      console.log('❌ FAIL: Failed to update lab result');
    }

    // Test 5: Verify Update
    console.log('\n🔍 Test 5: Verifying update...');
    const verifyResponse = await axios.get(
      `${API_BASE_URL}/api/lab-result/${testLabResult.labNumber}`
    );
    
    if (verifyResponse.data.data.patientName === 'Updated Test Patient') {
      console.log('✅ PASS: Update verified successfully');
    } else {
      console.log('❌ FAIL: Update verification failed');
    }

    // Test 6: Delete Lab Result
    console.log('\n🗑️  Test 6: Deleting lab result...');
    const deleteResponse = await axios.delete(
      `${API_BASE_URL}/api/lab-result/${testLabResult.labNumber}`
    );
    
    if (deleteResponse.data.success) {
      console.log('✅ PASS: Lab result deleted successfully');
    } else {
      console.log('❌ FAIL: Failed to delete lab result');
    }

    // Test 7: Verify Deletion
    console.log('\n🔍 Test 7: Verifying deletion...');
    try {
      await axios.get(
        `${API_BASE_URL}/api/lab-result/${testLabResult.labNumber}`
      );
      console.log('❌ FAIL: Lab result still exists after deletion');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ PASS: Lab result successfully deleted (404 response)');
      } else {
        console.log('⚠️  WARN: Unexpected error:', error.message);
      }
    }

    // Test 8: Test Non-existent Lab Number
    console.log('\n🔍 Test 8: Testing non-existent lab number...');
    try {
      await axios.get(`${API_BASE_URL}/api/lab-result/NONEXISTENT-999`);
      console.log('❌ FAIL: Should return 404 for non-existent lab number');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ PASS: Correctly returns 404 for non-existent lab number');
      } else {
        console.log('❌ FAIL: Unexpected error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.log('\n⚠️  Make sure the backend server is running:');
    console.log('   cd backend && npm start');
  }
}

// Run tests
console.log('\n🚀 Starting API tests...');
console.log('🔗 API Base URL:', API_BASE_URL);
testAPI();
