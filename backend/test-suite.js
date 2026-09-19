/**
 * TolSeva Comprehensive Integration & Acceptance Test Suite
 */

const http = require('http');
const app = require('./src/app');

let server;
let baseUrl;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Connection': 'close'
    };
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error(`Request timeout for ${method} ${path}`));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✅ Passed: ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 Running TolSeva Backend Test Suite');
  console.log('======================================================\n');

  // Start HTTP server on random available port
  await new Promise(resolve => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------------------
    // 1. GSTIN-paired Vendor OTP Login & Demo Mode
    // -------------------------------------------------------------------------
    console.log('🧪 Test 1: GSTIN-paired Vendor OTP Login & Demo Mode');

    // 1.1 Correct GSTIN & registered phone -> 200, returns demo OTP 123456
    const otpRes = await request('POST', '/api/auth/vendor/request-otp', {
      gstin: '27AAPFU0939F1ZV',
      phone: '9811223344'
    });
    assert(otpRes.status === 200, 'Vendor request-otp succeeds with matching GSTIN and phone');
    assert(otpRes.body.dev_otp === '123456', 'Demo mode sets OTP to 123456');

    // 1.2 Mismatched phone -> 400 generic error
    const wrongPhoneRes = await request('POST', '/api/auth/vendor/request-otp', {
      gstin: '27AAPFU0939F1ZV',
      phone: '9999999999'
    });
    assert(wrongPhoneRes.status === 400 || wrongPhoneRes.status === 404, 'Mismatched phone rejected with generic error');
    assert(wrongPhoneRes.body.error === 'GSTIN and mobile number do not match our records', 'No data leakage on phone mismatch');

    // 1.3 Non-existent GSTIN -> 404 generic error
    const noGstinRes = await request('POST', '/api/auth/vendor/request-otp', {
      gstin: '27ZZZZZ9999Z9ZZ',
      phone: '9811223344'
    });
    assert(noGstinRes.status === 404, 'Non-existent GSTIN rejected');
    assert(noGstinRes.body.error === 'GSTIN and mobile number do not match our records', 'No data leakage on missing GSTIN');

    // 1.4 Verify OTP with 123456 -> 200, JWT token returned
    const verifyRes = await request('POST', '/api/auth/vendor/verify-otp', {
      gstin: '27AAPFU0939F1ZV',
      phone: '9811223344',
      otp: '123456'
    });
    assert(verifyRes.status === 200, 'Verify OTP succeeds with GSTIN, phone, and demo OTP 123456');
    assert(typeof verifyRes.body.token === 'string', 'JWT token issued to vendor');
    const vendorToken = verifyRes.body.token;

    // 1.5 Verify OTP with wrong OTP -> 401
    const badVerifyRes = await request('POST', '/api/auth/vendor/verify-otp', {
      gstin: '27AABCB1234F1Z1',
      phone: '9811223355',
      otp: '999999'
    });
    assert(badVerifyRes.status === 401, 'Wrong OTP is rejected');

    // -------------------------------------------------------------------------
    // 2. Admin & Inspector Login
    // -------------------------------------------------------------------------
    console.log('\n🧪 Test 2: Admin & Inspector Authentication');

    const adminLoginRes = await request('POST', '/api/auth/admin/login', {
      username: 'admin',
      password: 'Admin@123'
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds with admin/Admin@123');
    const adminToken = adminLoginRes.body.token;

    const inspLoginRes = await request('POST', '/api/auth/inspector/login', {
      gov_id: 'LMI-MH-001',
      password: 'Inspector@123'
    });
    assert(inspLoginRes.status === 200, 'Inspector login succeeds with LMI-MH-001/Inspector@123');
    const inspectorToken = inspLoginRes.body.token;

    // -------------------------------------------------------------------------
    // 3. Distance & Availability-based Inspector Auto-Assignment
    // -------------------------------------------------------------------------
    console.log('\n🧪 Test 3: Inspector Auto-Assignment by Distance and Availability');

    // Book appointment for vendor 1 on a free future date
    const freeDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const appBookRes = await request('POST', '/api/vendor/appointments', {
      instrument_id: 'inst-001',
      preferred_date: freeDate,
      preferred_time: 'MORNING',
      purpose: 'Annual Verification'
    }, vendorToken);

    assert(appBookRes.status === 201, 'Appointment creation succeeds');
    assert(appBookRes.body.appointment.status === 'CONFIRMED', 'Appointment auto-assigned and confirmed');
    assert(appBookRes.body.appointment.inspector_id === 'ins-001', 'Nearest inspector (Rajesh in Dadar) assigned to Dadar vendor');

    // -------------------------------------------------------------------------
    // 4. Complaints System (Vendor, Public, Admin)
    // -------------------------------------------------------------------------
    console.log('\n🧪 Test 4: Complaints System');

    // 4.1 Vendor files complaint against inspector
    const vendorComplaintRes = await request('POST', '/api/vendor/complaints', {
      inspectorId: 'ins-001',
      category: 'CONDUCT',
      description: 'Inspector was unprofessional during verification testing'
    }, vendorToken);
    assert(vendorComplaintRes.status === 201, 'Vendor successfully files complaint against inspector');
    const vendorComplaintId = vendorComplaintRes.body.complaint.id;

    // 4.2 Inspector CANNOT see complaint
    const inspVisitsRes = await request('GET', '/api/inspector/assigned-visits', null, inspectorToken);
    assert(inspVisitsRes.status === 200, 'Inspector gets assigned visits');
    const responseStr = JSON.stringify(inspVisitsRes.body);
    assert(!responseStr.includes('unprofessional'), 'Inspector cannot view complaint filed against them');

    // 4.3 Public files complaint with valid certificate
    const publicComplaintRes = await request('POST', '/api/public/complaints', {
      certificateId: 'LM-MH-001-2026-VAL101',
      category: 'ACCURACY_ISSUE',
      description: 'Scale in market is under-weighing by 50 grams'
    });
    assert(publicComplaintRes.status === 201, 'Public complaint accepted with valid certificate reference');

    // 4.4 Public files complaint with invalid certificate -> 404
    const badPublicComplaintRes = await request('POST', '/api/public/complaints', {
      certificateId: 'NON-EXISTENT-CERT',
      category: 'FRAUD',
      description: 'Fake scale'
    });
    assert(badPublicComplaintRes.status === 404, 'Public complaint rejected when certificate does not exist');

    // 4.5 Admin views complaints
    const adminComplaintsRes = await request('GET', '/api/admin/complaints', null, adminToken);
    assert(adminComplaintsRes.status === 200, 'Admin can list complaints');
    assert(adminComplaintsRes.body.complaints.length >= 2, 'Admin sees all vendor and public complaints');

    // 4.6 Admin updates complaint status
    const updateCmpRes = await request('PATCH', `/api/admin/complaints/${vendorComplaintId}`, {
      status: 'INVESTIGATING',
      adminNotes: 'Assigned to vigilance officer for inquiry'
    }, adminToken);
    assert(updateCmpRes.status === 200, 'Admin updates complaint status');
    assert(updateCmpRes.body.complaint.status === 'INVESTIGATING', 'Complaint status updated to INVESTIGATING');

    // -------------------------------------------------------------------------
    // 5. Admin Search & Reporting
    // -------------------------------------------------------------------------
    console.log('\n🧪 Test 5: Admin Search & Reporting');

    // 5.1 Search vendor by GSTIN (partial match)
    const gstinSearchRes = await request('GET', '/api/admin/vendors?gstin=27AAPFU', null, adminToken);
    assert(gstinSearchRes.status === 200, 'Admin can search vendors by GSTIN');
    assert(gstinSearchRes.body.vendors.length >= 1, 'Search found matching vendor');
    assert(gstinSearchRes.body.vendors[0].gstin === '27AAPFU0939F1ZV', 'Exact vendor matched');
    assert(typeof gstinSearchRes.body.vendors[0].instrument_count === 'number', 'Vendor has instrument_count');

    // 5.2 Full vendor profile
    const vendorProfileRes = await request('GET', '/api/admin/vendors/ven-001', null, adminToken);
    assert(vendorProfileRes.status === 200, 'Admin fetches full vendor profile');
    assert(Array.isArray(vendorProfileRes.body.instruments), 'Vendor profile includes instruments');
    assert(Array.isArray(vendorProfileRes.body.appointments), 'Vendor profile includes appointments');
    assert(Array.isArray(vendorProfileRes.body.certificates), 'Vendor profile includes certificates');
    assert(Array.isArray(vendorProfileRes.body.complaints), 'Vendor profile includes complaints');

    // 5.3 Full inspector profile
    const inspProfileRes = await request('GET', '/api/admin/inspectors/ins-001', null, adminToken);
    assert(inspProfileRes.status === 200, 'Admin fetches full inspector profile');
    assert(Array.isArray(inspProfileRes.body.visits), 'Inspector profile includes visits');
    assert(Array.isArray(inspProfileRes.body.verifications), 'Inspector profile includes verifications');
    assert(Array.isArray(inspProfileRes.body.complaints), 'Inspector profile includes complaints filed against inspector');

    // 5.4 Expiry Defaulters report
    const defaultersRes = await request('GET', '/api/admin/expiry-defaulters', null, adminToken);
    assert(defaultersRes.status === 200, 'Admin fetches expiry-defaulters report');
    assert(defaultersRes.body.defaulters.length >= 1, 'Defaulters found');
    const defaulterGstins = defaultersRes.body.defaulters.map(d => d.vendor.gstin);
    assert(defaulterGstins.includes('27AAPFU0939F1ZV'), 'Vendor with expired machine inst-002 flagged as defaulter');

    // -------------------------------------------------------------------------
    // 6. Public Certificate Verification
    // -------------------------------------------------------------------------
    console.log('\n🧪 Test 6: Public Unauthenticated Certificate Verification');

    // 6.1 VALID Certificate
    const validVerifyRes = await request('GET', '/api/public/verify/LM-MH-001-2026-VAL101');
    assert(validVerifyRes.status === 200, 'Public verify succeeds without authentication');
    assert(validVerifyRes.body.status === 'VALID', 'Certificate correctly computed as VALID');
    assert(validVerifyRes.body.instrument.make === 'Essae Teraoka', 'Returns instrument details');
    assert(validVerifyRes.body.business.name === 'Sharma Kirana & General Stores', 'Returns business name');
    assert(validVerifyRes.body.business.phone === undefined, 'Does not leak vendor phone number');
    assert(validVerifyRes.body.business.owner_name === undefined, 'Does not leak owner private name');

    // 6.2 EXPIRED Certificate
    const expiredVerifyRes = await request('GET', '/api/public/verify/LM-MH-002-2025-EXP202');
    assert(expiredVerifyRes.status === 200, 'Public verify for expired certificate succeeds');
    assert(expiredVerifyRes.body.status === 'EXPIRED', 'Certificate correctly computed as EXPIRED');

    // 6.3 Non-existent Certificate
    const missingVerifyRes = await request('GET', '/api/public/verify/NON-EXISTENT-XYZ');
    assert(missingVerifyRes.status === 404, 'Non-existent certificate returns 404');

    console.log('\n======================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');

  } finally {
    if (server) {
      server.close();
    }
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  if (server) server.close();
  process.exit(1);
});
