/**
 * Test script to verify login functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  console.log('Testing login functionality...\n');
  
  // Test 1: Health check
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Backend is running:', health.data);
  } catch (err) {
    console.log('❌ Backend not reachable:', err.message);
    return;
  }
  
  // Test 2: Employee login (alice)
  console.log('\n--- Testing Employee Login ---');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'alice@empay.dev',
      password: 'Alice@123'
    });
    console.log('✅ Login successful:', {
      success: loginRes.data.success,
      hasToken: !!loginRes.data.token,
      user: loginRes.data.user?.email,
      role: loginRes.data.user?.role
    });
  } catch (err) {
    console.log('❌ Login failed:', {
      status: err.response?.status,
      message: err.response?.data?.message,
      needsVerification: err.response?.data?.needsVerification
    });
  }
  
  // Test 3: Admin login
  console.log('\n--- Testing Admin Login ---');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@empay.dev',
      password: 'Admin@123'
    });
    console.log('✅ Admin login successful:', {
      success: loginRes.data.success,
      hasToken: !!loginRes.data.token,
      user: loginRes.data.user?.email
    });
  } catch (err) {
    console.log('❌ Admin login failed:', {
      status: err.response?.status,
      message: err.response?.data?.message
    });
  }
  
  console.log('\n--- Test Complete ---');
}

testLogin().catch(console.error);
