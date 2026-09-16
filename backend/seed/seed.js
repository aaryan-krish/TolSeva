require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/config/db');

async function seed() {
  console.log('🌱 Seeding TolSeva database...');

  // Inspectors
  const inspectors = [
    { gov_id: 'LMI-MH-001', full_name: 'Rajesh Kumar Singh', department: 'Legal Metrology, Maharashtra', designation: 'Inspector', zone: 'Mumbai', phone: '9876500001', email: 'rajesh.singh@lm.gov.in', password: 'Inspector@123' },
    { gov_id: 'LMI-MH-002', full_name: 'Priya Deshmukh', department: 'Legal Metrology, Maharashtra', designation: 'Senior Inspector', zone: 'Pune', phone: '9876500002', email: 'priya.deshmukh@lm.gov.in', password: 'Inspector@123' },
    { gov_id: 'LMI-DL-001', full_name: 'Amit Sharma', department: 'Legal Metrology, Delhi', designation: 'Inspector', zone: 'New Delhi', phone: '9876500003', email: 'amit.sharma@lm.gov.in', password: 'Inspector@123' }
  ];

  for (const ins of inspectors) {
    const hash = await bcrypt.hash(ins.password, 10);
    await query(
      `INSERT INTO inspectors (gov_id, full_name, department, designation, zone, phone, email, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (gov_id) DO NOTHING`,
      [ins.gov_id, ins.full_name, ins.department, ins.designation, ins.zone, ins.phone, ins.email, hash]
    );
    console.log(`  ✅ Inspector: ${ins.gov_id} / ${ins.password}`);
  }

  // Demo vendors
  const vendors = [
    { gstin: '27AAPFU0939F1ZV', business_name: 'Sharma Kirana Store', owner_name: 'Ramesh Sharma', phone: '9811223344', email: 'ramesh@sharma.com', address: 'Shop 12, Dharavi Market, Mumbai', city: 'Mumbai', state: 'Maharashtra' },
    { gstin: '07AAACR5055K1Z5', business_name: 'Delhi Scales & Weights', owner_name: 'Suresh Verma', phone: '9811223355', email: 'suresh@delhiscales.com', address: 'Sector 15, Rohini, New Delhi', city: 'New Delhi', state: 'Delhi' }
  ];

  for (const v of vendors) {
    const result = await query(
      `INSERT INTO vendors (gstin, business_name, owner_name, phone, email, address, city, state, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
       ON CONFLICT (gstin) DO UPDATE SET is_verified=TRUE
       RETURNING id`,
      [v.gstin, v.business_name, v.owner_name, v.phone, v.email, v.address, v.city, v.state]
    );
    const vendorId = result.rows[0].id;
    console.log(`  ✅ Vendor: ${v.gstin}`);

    // Add instruments
    const instruments = [
      { make: 'Essae Teraoka', model: 'DS-852', serial_no: `SN-${v.gstin.slice(-4)}-001`, instrument_type: 'Electronic Platform Scale', capacity: '150', unit: 'kg', expiry_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'ACTIVE' },
      { make: 'Avery Weigh-Tronix', model: 'ZK830', serial_no: `SN-${v.gstin.slice(-4)}-002`, instrument_type: 'Counter Scale', capacity: '30', unit: 'kg', expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'ACTIVE' },
      { make: 'Mettler Toledo', model: 'ICS465', serial_no: `SN-${v.gstin.slice(-4)}-003`, instrument_type: 'Bench Scale', capacity: '60', unit: 'kg', expiry_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'ACTIVE' }
    ];
    for (const inst of instruments) {
      await query(
        `INSERT INTO instruments (vendor_id, make, model, serial_no, instrument_type, capacity, unit, expiry_date, status, last_verified_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (serial_no) DO NOTHING`,
        [vendorId, inst.make, inst.model, inst.serial_no, inst.instrument_type, inst.capacity, inst.unit, inst.expiry_date, inst.status]
      );
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:     admin / Admin@123');
  console.log('  Inspector: LMI-MH-001 / Inspector@123');
  console.log('  Vendor:    GSTIN 27AAPFU0939F1ZV, phone 9811223344 (request OTP)');

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
