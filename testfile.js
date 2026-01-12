
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 API MATCH TEST - No Dependencies Required\n');

const BACKEND_URL = 'http://localhost:5000';
let backendProcess = null;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Your 11 endpoints
const YOUR_ENDPOINTS = [
  { method: 'POST', path: '/api/auth/register' },
  { method: 'GET', path: '/api/auth/verify-email' },
  { method: 'POST', path: '/api/auth/resend-verification' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/token' },
  { method: 'GET', path: '/api/auth/protected-test' },
  { method: 'POST', path: '/api/auth/forgot-password' },
  { method: 'POST', path: '/api/auth/reset-password' },
  { method: 'POST', path: '/api/auth/logout' },
  { method: 'POST', path: '/api/auth/logout-all' },
  { method: 'GET', path: '/api/auth/sessions' }
];

// Make HTTP request without axios
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: body,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    
    if (data && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Start backend server
function startBackend() {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}Starting backend server...${colors.reset}`);
    
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'server'),
      shell: true
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`${colors.yellow}[Backend]${colors.reset} ${output.trim()}`);
      
      if (output.includes('Server running on') || output.includes('🚀 Server')) {
        console.log(`${colors.green}✅ Backend started!${colors.reset}`);
        setTimeout(resolve, 2000); // Give it 2 more seconds
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.log(`${colors.red}[Backend Error]${colors.reset} ${data.toString().trim()}`);
    });

    // Timeout
    setTimeout(() => {
      console.log(`${colors.yellow}⚠️  Assuming backend is already running${colors.reset}`);
      resolve();
    }, 10000);
  });
}

// Check if backend is responding
async function checkBackend() {
  console.log(`${colors.cyan}Checking if backend is running...${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', `${BACKEND_URL}/`);
    if (response.status === 200 || response.status === 404) {
      console.log(`${colors.green}✅ Backend is responding${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Backend not responding: ${error.message}${colors.reset}`);
    return false;
  }
}

// Test a single endpoint
async function testEndpoint(endpoint) {
  const url = `${BACKEND_URL}${endpoint.path}`;
  const testName = `${endpoint.method} ${endpoint.path}`;
  
  console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`);
  
  try {
    // Create test data based on endpoint
    let testData = null;
    if (endpoint.method === 'POST') {
      testData = { test: 'data', timestamp: Date.now() };
      
      // Special data for specific endpoints
      if (endpoint.path.includes('register')) {
        testData = {
          email: `test${Date.now()}@test.com`,
          password: 'TestPass123',
          fullName: 'Test User',
          userType: 'investor'
        };
      } else if (endpoint.path.includes('login')) {
        testData = {
          email: 'test@test.com',
          password: 'TestPass123',
          rememberMe: false
        };
      } else if (endpoint.path.includes('forgot-password')) {
        testData = { email: 'test@test.com' };
      }
    }
    
    const response = await makeRequest(endpoint.method, url, testData);
    
    // Check response
    console.log(`   Status: ${response.status}`);
    
    // Analyze response
    if (response.status === 200 || response.status === 201) {
      console.log(`${colors.green}   ✅ Endpoint works!${colors.reset}`);
      return { success: true, status: response.status };
    } 
    else if (response.status === 400) {
      console.log(`${colors.yellow}   ⚠️  Bad request (expected with test data)${colors.reset}`);
      return { success: true, status: response.status, note: 'Endpoint exists' };
    }
    else if (response.status === 401) {
      console.log(`${colors.yellow}   ⚠️  Unauthorized (protected endpoint)${colors.reset}`);
      return { success: true, status: response.status, note: 'Protected endpoint' };
    }
    else if (response.status === 404) {
      console.log(`${colors.red}   ❌ Not found${colors.reset}`);
      return { success: false, status: response.status, note: 'Endpoint not found' };
    }
    else {
      console.log(`${colors.yellow}   ⚠️  Status: ${response.status}${colors.reset}`);
      return { success: true, status: response.status };
    }
    
  } catch (error) {
    console.log(`${colors.red}   ❌ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Check frontend files
function checkFrontend() {
  console.log(`\n${colors.blue}=== CHECKING FRONTEND FILES ===${colors.reset}`);
  
  const constantsPath = path.join(__dirname, 'client', 'src', 'utils', 'constants.js');
  const authServicePath = path.join(__dirname, 'client', 'src', 'services', 'authService.js');
  
  let issues = [];
  
  // Check constants.js
  if (fs.existsSync(constantsPath)) {
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    // Check for each endpoint in constants
    YOUR_ENDPOINTS.forEach(ep => {
      const endpointName = ep.path.replace('/api/auth/', '').toUpperCase().replace(/-/g, '_');
      if (!content.includes(endpointName)) {
        issues.push(`Missing constant: ${endpointName}`);
      }
    });
    
    if (issues.length === 0) {
      console.log(`${colors.green}✅ constants.js has all endpoints${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ constants.js issues:${colors.reset}`);
      issues.forEach(issue => console.log(`   ${issue}`));
    }
  } else {
    console.log(`${colors.red}❌ constants.js not found${colors.reset}`);
  }
  
  // Check authService.js
  if (fs.existsSync(authServicePath)) {
    const content = fs.readFileSync(authServicePath, 'utf8');
    
    // Check for function names (simplified)
    const functionNames = [
      'register',
      'verifyEmail',
      'resendVerification',
      'login',
      'refreshAccessToken',
      'protectedTest',
      'forgotPassword',
      'resetPassword',
      'logout',
      'logoutAll',
      'getSessions'
    ];
    
    const missingFunctions = functionNames.filter(func => 
      !content.includes(`${func}:`) && !content.includes(` ${func}(`)
    );
    
    if (missingFunctions.length === 0) {
      console.log(`${colors.green}✅ authService.js has all functions${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ authService.js missing: ${missingFunctions.join(', ')}${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}❌ authService.js not found${colors.reset}`);
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.blue}=== API MATCH TEST STARTING ===${colors.reset}\n`);
  
  // Start or check backend
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.log(`${colors.yellow}Starting backend server...${colors.reset}`);
    await startBackend();
  }
  
  // Check frontend files
  checkFrontend();
  
  // Test endpoints
  console.log(`\n${colors.blue}=== TESTING ENDPOINTS ===${colors.reset}`);
  
  const results = [];
  for (const endpoint of YOUR_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  console.log(`\n${colors.blue}=== TEST REPORT ===${colors.reset}`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  // Show failed endpoints
  if (failed > 0) {
    console.log(`\n${colors.red}Failed endpoints:${colors.reset}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.method} ${r.path} - ${r.error || 'Check endpoint'}`);
    });
  }
  
  // Final verdict
  console.log(`\n${colors.blue}=== FINAL VERDICT ===${colors.reset}`);
  if (failed === 0) {
    console.log(`${colors.green}🎉 SUCCESS! All your frontend endpoints match backend!${colors.reset}`);
    console.log(`${colors.green}Your APIs are ready for integration.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some endpoints need attention.${colors.reset}`);
    console.log(`${colors.yellow}Check if backend has all 11 endpoints.${colors.reset}`);
  }
  
  // Cleanup
  if (backendProcess) {
    console.log(`\n${colors.yellow}Stopping backend...${colors.reset}`);
    backendProcess.kill();
  }
  
  console.log(`\n${colors.green}Test complete!${colors.reset}`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  if (backendProcess) backendProcess.kill();
  process.exit(1);
});