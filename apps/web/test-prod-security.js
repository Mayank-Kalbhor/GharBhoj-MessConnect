const http = require('http');

async function testRedirect() {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3005,
      path: '/',
      headers: { 'Accept': 'text/html' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', reject);
  });
}

async function testVendorDashboard() {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3005,
      path: '/vendor/dashboard',
      headers: { 'Accept': 'text/html' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('--- Step 1: Testing GET http://localhost:3005/ (Root redirect) ---');
  try {
    const res = await testRedirect();
    console.log('Status Code:', res.statusCode);
    const location = res.headers['location'] || res.headers['Location'];
    console.log('Location Header:', location);
    
    const isRedirected = res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 302;
    const targetsVendorDashboard = location === '/vendor/dashboard' || location?.includes('/vendor/dashboard');
    const containsPortalHub = res.body.includes('Interactive Multi-Surface Portal');
    const containsDevTokens = res.body.includes('user_customer_test') || res.body.includes('user_vendor_test');

    console.log('Redirects to /vendor/dashboard:', isRedirected && targetsVendorDashboard);
    console.log('Portal Hub leaked into HTML:', containsPortalHub);
    console.log('Dev tokens leaked into HTML:', containsDevTokens);

    console.log('\n--- Step 2: Testing GET http://localhost:3005/vendor/dashboard (DOM audit) ---');
    const dashRes = await testVendorDashboard();
    console.log('Status Code:', dashRes.statusCode);
    const dashContainsDevSwitcher = dashRes.body.includes('Dev Role') || 
                                   dashRes.body.includes('Switch Dev Persona') || 
                                   dashRes.body.includes('DevAuthSwitcher');
    const dashContainsTokens = dashRes.body.includes('user_customer_test') || 
                              dashRes.body.includes('user_vendor_test') || 
                              dashRes.body.includes('user_admin_test');
    
    console.log('DevAuthSwitcher present in Vendor Dashboard DOM:', dashContainsDevSwitcher);
    if (dashContainsDevSwitcher) {
      let idx = dashRes.body.indexOf('DevAuthSwitcher');
      while (idx !== -1) {
        console.log('Match snippet:', JSON.stringify(dashRes.body.substring(Math.max(0, idx - 60), Math.min(dashRes.body.length, idx + 60))));
        idx = dashRes.body.indexOf('DevAuthSwitcher', idx + 1);
      }
    }
    console.log('Dev tokens present in Vendor Dashboard DOM:', dashContainsTokens);

    if (isRedirected && targetsVendorDashboard && !containsPortalHub && !containsDevTokens && !dashContainsDevSwitcher && !dashContainsTokens) {
      console.log('\nALL_PROD_SECURITY_CHECKS_PASSED');
      process.exit(0);
    } else {
      console.error('\nPROD_SECURITY_GATE_FAILED');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error making request:', err.message);
    process.exit(1);
  }
}

run();

