const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { testConnection, getDb, close, isMongoAvailable } = require('../src/config/db');

async function seed() {
  try {
    await testConnection();
  } catch (err) {
    console.log('Notice: Running seed against in-memory storage (MongoDB Atlas not connected)');
  }

  const db = getDb();
  console.log('\n🌱 ===================================================');
  console.log('   TolSeva Database Seeding Process Initiated');
  console.log('   Mode: ' + (isMongoAvailable() ? 'MongoDB Cluster' : 'In-Memory Store'));
  console.log('=====================================================\n');

  // 1. Create Indexes if supported
  try {
    await db.collection('vendors').createIndex({ gstin: 1 }, { unique: true });
    await db.collection('inspectors').createIndex({ gov_id: 1 }, { unique: true });
    await db.collection('instruments').createIndex({ serial_no: 1 });
    await db.collection('verification_logs').createIndex({ certificate_no: 1 });
    await db.collection('complaints').createIndex({ status: 1, type: 1 });
    await db.collection('appointments').createIndex({ status: 1, preferred_date: 1 });
  } catch (e) {
    // In-memory or pre-existing index warning ignore
  }

  // 2. Admin User
  const adminHash = await bcrypt.hash('Admin@123', 10);
  await db.collection('admins').updateOne(
    { username: 'admin' },
    {
      $set: {
        id: 'adm-001',
        username: 'admin',
        phone: '9876500000',
        full_name: 'System Administrator',
        password_hash: adminHash,
        updated_at: new Date()
      },
      $setOnInsert: { created_at: new Date() }
    },
    { upsert: true }
  );
  console.log('  ✅ Admin seeded: admin / Admin@123');

  // 3. Inspectors (Spread across Mumbai metropolitan region)
  const inspectors = [
    {
      id: 'ins-001',
      gov_id: 'LMI-MH-001',
      full_name: 'Rajesh Kumar Singh',
      department: 'Legal Metrology, Maharashtra',
      designation: 'Senior Inspector',
      zone: 'Mumbai Central',
      phone: '9876500001',
      email: 'rajesh.singh@lm.gov.in',
      baseLatitude: 19.0178,
      baseLongitude: 72.8478,
      base_latitude: 19.0178,
      base_longitude: 72.8478,
      password: 'Inspector@123'
    },
    {
      id: 'ins-002',
      gov_id: 'LMI-MH-002',
      full_name: 'Priya Deshmukh',
      department: 'Legal Metrology, Maharashtra',
      designation: 'Inspector',
      zone: 'Mumbai Suburbs',
      phone: '9876500002',
      email: 'priya.deshmukh@lm.gov.in',
      baseLatitude: 19.1136,
      baseLongitude: 72.8697,
      base_latitude: 19.1136,
      base_longitude: 72.8697,
      password: 'Inspector@123'
    },
    {
      id: 'ins-003',
      gov_id: 'LMI-MH-003',
      full_name: 'Vikram Patil',
      department: 'Legal Metrology, Maharashtra',
      designation: 'Inspector',
      zone: 'Thane Region',
      phone: '9876500003',
      email: 'vikram.patil@lm.gov.in',
      baseLatitude: 19.2183,
      baseLongitude: 72.9781,
      base_latitude: 19.2183,
      base_longitude: 72.9781,
      password: 'Inspector@123'
    }
  ];

  for (const ins of inspectors) {
    const hash = await bcrypt.hash(ins.password, 10);
    const { password, ...insData } = ins;
    await db.collection('inspectors').updateOne(
      { gov_id: ins.gov_id },
      {
        $set: { ...insData, password_hash: hash, is_active: true, updated_at: new Date() },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );
    console.log(`  ✅ Inspector: ${ins.gov_id} (${ins.full_name}) - Base: [${ins.baseLatitude}, ${ins.baseLongitude}]`);
  }

  // 4. Vendors (Realistic Mumbai locations with coordinates)
  const vendors = [
    {
      id: 'ven-001',
      gstin: '27AAPFU0939F1ZV',
      business_name: 'Sharma Kirana & General Stores',
      owner_name: 'Ramesh Sharma',
      phone: '9811223344',
      email: 'ramesh@sharma.com',
      address: 'Shop 12, Ranade Road, Dadar West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0178,
      longitude: 72.8478
    },
    {
      id: 'ven-002',
      gstin: '27AABCB1234F1Z1',
      business_name: 'Apex Sweets & Dairy Products',
      owner_name: 'Kavita Joshi',
      phone: '9811223355',
      email: 'kavita@apexsweets.com',
      address: 'Shop 4, Hill Road, Bandra West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0596,
      longitude: 72.8295
    },
    {
      id: 'ven-003',
      gstin: '27AABCT5678M1Z2',
      business_name: 'Metro Wholesale Provisions',
      owner_name: 'Harish Mehta',
      phone: '9811223366',
      email: 'harish@metrowholesale.com',
      address: 'Plot 45, MIDC, Andheri East, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.1136,
      longitude: 72.8697
    },
    {
      id: 'ven-004',
      gstin: '27AAECP9876Q1Z3',
      business_name: 'Kalyan Jewellers & Precision Weighing',
      owner_name: 'Sunil Verma',
      phone: '9811223377',
      email: 'sunil@kalyanjewellers.com',
      address: 'Gokhale Road, Naupada, Thane West',
      city: 'Thane',
      state: 'Maharashtra',
      latitude: 19.2183,
      longitude: 72.9781
    },
    {
      id: 'ven-005',
      gstin: '27AACCB4321R1Z4',
      business_name: 'Borivali Grain Merchant Association',
      owner_name: 'Anand Patel',
      phone: '9811223388',
      email: 'anand@borivaligrain.com',
      address: 'SV Road, Near Station, Borivali West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.2307,
      longitude: 72.8567
    }
  ];

  for (const v of vendors) {
    await db.collection('vendors').updateOne(
      { gstin: v.gstin },
      {
        $set: { ...v, is_verified: true, updated_at: new Date() },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );
    console.log(`  ✅ Vendor: ${v.gstin} (${v.business_name}) - Phone: ${v.phone}`);
  }

  // 5. Instruments
  // Notice:
  // inst-002 is EXPIRED with NO appointment -> Triggers Expiry-Defaulter!
  // inst-004 has an EXPIRED certificate (valid_until in past) -> Triggers Public Verification Expired!
  const today = new Date();
  const past30Days = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const past60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future180Days = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future300Days = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const instruments = [
    {
      id: 'inst-001',
      vendor_id: 'ven-001',
      make: 'Essae Teraoka',
      model: 'DS-852',
      serial_no: 'SN-F1ZV-001',
      instrument_type: 'Electronic Platform Scale',
      capacity: '150',
      unit: 'kg',
      manufacture_year: 2024,
      installation_date: '2024-02-15',
      location_description: 'Checkout Counter 1',
      status: 'ACTIVE',
      expiry_date: future300Days,
      last_verified_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'inst-002',
      vendor_id: 'ven-001',
      make: 'Avery Weigh-Tronix',
      model: 'ZK830',
      serial_no: 'SN-F1ZV-002',
      instrument_type: 'Counter Scale',
      capacity: '30',
      unit: 'kg',
      manufacture_year: 2023,
      installation_date: '2023-05-10',
      location_description: 'Side Weighing Bay',
      status: 'ACTIVE',
      expiry_date: past30Days, // EXPIRED, NO FUTURE APPOINTMENT -> DEFAULTER
      last_verified_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'inst-003',
      vendor_id: 'ven-002',
      make: 'Mettler Toledo',
      model: 'ICS465',
      serial_no: 'SN-1Z1-001',
      instrument_type: 'Bench Scale',
      capacity: '60',
      unit: 'kg',
      manufacture_year: 2024,
      installation_date: '2024-03-01',
      location_description: 'Sweet Packaging Section',
      status: 'ACTIVE',
      expiry_date: future180Days,
      last_verified_at: new Date()
    },
    {
      id: 'inst-004',
      vendor_id: 'ven-002',
      make: 'Sartorius',
      model: 'Entris II',
      serial_no: 'SN-1Z1-002',
      instrument_type: 'Precision Balance',
      capacity: '5',
      unit: 'kg',
      manufacture_year: 2022,
      installation_date: '2022-08-15',
      location_description: 'Quality Testing Lab',
      status: 'SUSPENDED',
      expiry_date: past60Days, // EXPIRED CERTIFICATE TEST CASE
      last_verified_at: new Date(Date.now() - 425 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'inst-005',
      vendor_id: 'ven-003',
      make: 'Eagle Scales',
      model: 'EP-500',
      serial_no: 'SN-1Z2-001',
      instrument_type: 'Heavy Duty Platform Scale',
      capacity: '500',
      unit: 'kg',
      manufacture_year: 2025,
      installation_date: '2025-01-10',
      location_description: 'Warehouse Bay 3',
      status: 'PENDING',
      expiry_date: null,
      last_verified_at: null
    },
    {
      id: 'inst-006',
      vendor_id: 'ven-004',
      make: 'Wensar',
      model: 'HPB-220',
      serial_no: 'SN-1Z3-001',
      instrument_type: 'Gold Analytical Balance',
      capacity: '220',
      unit: 'g',
      manufacture_year: 2024,
      installation_date: '2024-06-20',
      location_description: 'Jewellery Valuation Desk',
      status: 'ACTIVE',
      expiry_date: future300Days,
      last_verified_at: new Date()
    },
    {
      id: 'inst-007',
      vendor_id: 'ven-005',
      make: 'Crown Scales',
      model: 'CS-30',
      serial_no: 'SN-1Z4-001',
      instrument_type: 'Commercial Retail Scale',
      capacity: '30',
      unit: 'kg',
      manufacture_year: 2023,
      installation_date: '2023-11-12',
      location_description: 'Front Counter',
      status: 'ACTIVE',
      expiry_date: future15Days, // Expiring soon
      last_verified_at: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const inst of instruments) {
    await db.collection('instruments').updateOne(
      { serial_no: inst.serial_no },
      {
        $set: { ...inst, updated_at: new Date() },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );
  }
  console.log(`  ✅ Instruments seeded: ${instruments.length} machines across various statuses`);

  // 6. Appointments
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastMonthStr = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const appointments = [
    {
      id: 'app-seed-001',
      vendor_id: 'ven-001',
      instrument_id: 'inst-001',
      inspector_id: 'ins-001', // Inspector 1 is busy tomorrow morning!
      inspectorId: 'ins-001',
      preferred_date: tomorrowStr,
      preferred_time: 'MORNING',
      purpose: 'Periodic Re-verification',
      vendor_notes: 'Urgent annual inspection request',
      status: 'CONFIRMED',
      created_at: new Date()
    },
    {
      id: 'app-seed-002',
      vendor_id: 'ven-003',
      instrument_id: 'inst-005',
      inspector_id: null,
      inspectorId: null,
      preferred_date: nextWeekStr,
      preferred_time: 'AFTERNOON',
      purpose: 'Initial Stamping & Verification',
      vendor_notes: 'New weighing system requires certification',
      status: 'PENDING', // Unassigned appointment awaiting admin action
      created_at: new Date()
    },
    {
      id: 'app-seed-003',
      vendor_id: 'ven-001',
      instrument_id: 'inst-001',
      inspector_id: 'ins-001',
      inspectorId: 'ins-001',
      preferred_date: lastMonthStr,
      preferred_time: 'MORNING',
      purpose: 'Verification',
      status: 'COMPLETED',
      created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const app of appointments) {
    await db.collection('appointments').updateOne(
      { id: app.id },
      { $set: { ...app, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );
  }
  console.log(`  ✅ Appointments seeded: PENDING (unassigned), CONFIRMED (auto-assigned), COMPLETED`);

  // 7. Verification Logs & Certificates
  const publicBaseUrl = process.env.PUBLIC_VERIFY_URL || process.env.APP_URL || 'https://tolseva.gov.in';
  const cleanBase = publicBaseUrl.replace(/\/+$/, '');

  const certLogs = [
    {
      id: 'log-seed-001',
      appointment_id: 'app-seed-003',
      appointmentId: 'app-seed-003',
      instrument_id: 'inst-001',
      instrumentId: 'inst-001',
      inspector_id: 'ins-001',
      inspectorId: 'ins-001',
      test_result: 'PASS',
      observations: 'All test standards and dead weights calibrated within tolerance limits.',
      error_percentage: 0.01,
      photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
      certificate_no: 'LM-MH-001-2026-VAL101',
      certificateNo: 'LM-MH-001-2026-VAL101',
      qr_payload: `${cleanBase}/verify/LM-MH-001-2026-VAL101`,
      valid_until: future300Days,
      validUntil: future300Days,
      verified_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'log-seed-002',
      appointment_id: null,
      appointmentId: null,
      instrument_id: 'inst-004',
      instrumentId: 'inst-004',
      inspector_id: 'ins-002',
      inspectorId: 'ins-002',
      test_result: 'PASS',
      observations: 'Previous verification certificate from last year.',
      error_percentage: 0.02,
      photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
      certificate_no: 'LM-MH-002-2025-EXP202',
      certificateNo: 'LM-MH-002-2025-EXP202',
      qr_payload: `${cleanBase}/verify/LM-MH-002-2025-EXP202`,
      valid_until: past60Days, // EXPIRED CERTIFICATE
      validUntil: past60Days,
      verified_at: new Date(Date.now() - 425 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const log of certLogs) {
    await db.collection('verification_logs').updateOne(
      { certificate_no: log.certificate_no },
      { $set: log },
      { upsert: true }
    );
  }
  console.log(`  ✅ Verification Logs seeded: 1 VALID certificate + 1 EXPIRED certificate`);

  // 8. Complaints
  const sampleComplaints = [
    {
      id: 'cmp-seed-001',
      type: 'VENDOR_AGAINST_INSPECTOR',
      vendorId: 'ven-001',
      inspectorId: 'ins-001',
      instrumentId: null,
      certificateId: null,
      appointmentId: 'app-seed-001',
      category: 'INSPECTION_DELAY',
      description: 'Inspector was delayed by 3 hours during previous scheduled appointment without communication.',
      evidenceUrl: null,
      status: 'OPEN',
      adminNotes: null,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'cmp-seed-002',
      type: 'PUBLIC_ABOUT_INSTRUMENT',
      vendorId: 'ven-002',
      inspectorId: 'ins-002',
      instrumentId: 'inst-004',
      certificateId: 'LM-MH-002-2025-EXP202',
      appointmentId: null,
      category: 'EXPIRED_VERIFICATION_SEAL',
      description: 'Weighing scale at retail sweet counter has an expired verification certificate dated last year.',
      evidenceUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
      status: 'INVESTIGATING',
      adminNotes: 'Field officer dispatched for surprise spot inspection.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  for (const cmp of sampleComplaints) {
    await db.collection('complaints').updateOne(
      { id: cmp.id },
      { $set: cmp },
      { upsert: true }
    );
  }
  console.log(`  ✅ Complaints seeded: 1 Vendor complaint + 1 Public complaint in Admin inbox`);

  // Print Summary Table
  console.log('\n================================================================');
  console.log('🎉 TOLSEVA DEMO DATA SEEDED SUCCESSFULLY!');
  console.log('================================================================\n');

  console.log('ℹ️  DEMO MODE NOTICE:');
  console.log('   While DEMO_MODE=true, the OTP for all vendor logins and');
  console.log('   password resets is ALWAYS fixed to: 123456\n');

  console.log('🔑 ADMIN CREDENTIALS:');
  console.log('   URL:      POST /api/auth/admin/login');
  console.log('   Username: admin');
  console.log('   Password: Admin@123\n');

  console.log('👨‍✈️ INSPECTOR CREDENTIALS:');
  console.log('   URL:      POST /api/auth/inspector/login');
  console.log('   1. Gov ID: LMI-MH-001 | Password: Inspector@123 | Base: Dadar (Mumbai Central)');
  console.log('   2. Gov ID: LMI-MH-002 | Password: Inspector@123 | Base: Andheri (Mumbai Suburbs)');
  console.log('   3. Gov ID: LMI-MH-003 | Password: Inspector@123 | Base: Thane (Thane Region)\n');

  console.log('🏪 VENDOR LOGIN CREDENTIALS (GSTIN + Registered Phone):');
  console.log('   URL:      POST /api/auth/vendor/request-otp  ->  POST /api/auth/vendor/verify-otp');
  console.log('   1. GSTIN: 27AAPFU0939F1ZV | Phone: 9811223344 | Sharma Kirana & General (Dadar)');
  console.log('   2. GSTIN: 27AABCB1234F1Z1 | Phone: 9811223355 | Apex Sweets & Dairy (Bandra)');
  console.log('   3. GSTIN: 27AABCT5678M1Z2 | Phone: 9811223366 | Metro Wholesale (Andheri)');
  console.log('   4. GSTIN: 27AAECP9876Q1Z3 | Phone: 9811223377 | Kalyan Jewellers (Thane)');
  console.log('   5. GSTIN: 27AACCB4321R1Z4 | Phone: 9811223388 | Borivali Grain Merchant (Borivali)');
  console.log('   👉 OTP: 123456 (Demo Mode)\n');

  console.log('🔍 PUBLIC VERIFICATION URLS (Unauthenticated):');
  console.log(`   VALID Certificate:   GET /api/public/verify/LM-MH-001-2026-VAL101`);
  console.log(`   EXPIRED Certificate: GET /api/public/verify/LM-MH-002-2025-EXP202\n`);

  console.log('🚨 EXPIRY DEFAULTERS REPORT:');
  console.log('   GET /api/admin/expiry-defaulters identifies Vendor 27AAPFU0939F1ZV');
  console.log('   (Machine inst-002 expired 35 days ago with no pending/confirmed appointment)\n');

  await close();
}

seed().catch(err => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
