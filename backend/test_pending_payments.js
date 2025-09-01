const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPendingPayments() {
  console.log('Testing Pending Payments Functionality...\n');

  try {
    // Test 1: Get all patients
    console.log('1. Testing getAllPatients endpoint...');
    const allPatientsResponse = await axios.get(`${BASE_URL}/patient`);
    console.log(`✅ Found ${allPatientsResponse.data.length} total patients`);
    
    // Test 2: Get pending payments
    console.log('\n2. Testing getPendingPayments endpoint...');
    const pendingResponse = await axios.get(`${BASE_URL}/patient/pending-payment`);
    console.log(`✅ Found ${pendingResponse.data.length} patients with pending payments`);
    
    if (pendingResponse.data.length > 0) {
      console.log('Pending patients:');
      pendingResponse.data.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} (${patient.passportNumber}) - ${patient.medicalType}`);
        console.log(`      Created: ${new Date(patient.createdAt).toLocaleDateString()}`);
        console.log(`      Payment Recorded: ${patient.paymentRecorded || false}`);
      });
    }

    // Test 3: Get all payment records
    console.log('\n3. Testing payment records...');
    const paymentRecordsResponse = await axios.get(`${BASE_URL}/patient/account/id`);
    console.log(`✅ Found ${paymentRecordsResponse.data.length} payment records`);
    
    // Analyze payment records
    const paidPatients = paymentRecordsResponse.data
      .filter(record => record.paymentStatus === 'Paid')
      .map(record => record.patientName);
    
    console.log(`✅ Found ${paidPatients.length} patients with 'Paid' status:`);
    paidPatients.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    // Test 4: Cross-check logic
    console.log('\n4. Cross-checking pending payment logic...');
    const allPatients = allPatientsResponse.data;
    const unpaidByFlag = allPatients.filter(patient => !patient.paymentRecorded);
    const actuallyPending = unpaidByFlag.filter(patient => !paidPatients.includes(patient.name));
    
    console.log(`   - Patients without paymentRecorded flag: ${unpaidByFlag.length}`);
    console.log(`   - Patients with 'Paid' payment records: ${paidPatients.length}`);
    console.log(`   - Actually pending (should match API result): ${actuallyPending.length}`);
    console.log(`   - API returned pending patients: ${pendingResponse.data.length}`);
    
    if (actuallyPending.length === pendingResponse.data.length) {
      console.log('✅ Logic verification PASSED - counts match!');
    } else {
      console.log('❌ Logic verification FAILED - counts do not match!');
      console.log('Expected pending patients:');
      actuallyPending.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPendingPayments();
