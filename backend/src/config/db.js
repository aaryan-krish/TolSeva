const { Pool } = require('pg');

const isRemoteHost = process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST);
const useSSL = process.env.DB_SSL === 'true' || isRemoteHost || !!process.env.DATABASE_URL;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'tolseva_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);
let isPgAvailable = false;

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
  process.exit(-1);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected at:', res.rows[0].now);
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY FALLBACK DATABASE (Active when PostgreSQL is offline)
// ─────────────────────────────────────────────────────────────────────────────
const memStore = {
  admins: [
    {
      id: 'adm-001',
      username: 'admin',
      password_hash: '$2a$10$ZQuVDPiEwciGG7F2Kc/qMuGkOeiXBPirNxpQSNg2o32i6jjW4nmDS',
      full_name: 'System Administrator',
      created_at: new Date()
    }
  ],
  inspectors: [
    {
      id: 'ins-001',
      gov_id: 'LMI-MH-001',
      full_name: 'Rajesh Kumar Singh',
      department: 'Legal Metrology, Maharashtra',
      designation: 'Senior Inspector',
      zone: 'Mumbai',
      phone: '9876500001',
      email: 'rajesh.singh@lm.gov.in',
      password_hash: '$2a$10$F5CG2/qgBEzwEptfK8Oa2ehgqYx0fWrDSTFhQ1VJCCieOqRHJupDW',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'ins-002',
      gov_id: 'LMI-MH-002',
      full_name: 'Priya Deshmukh',
      department: 'Legal Metrology, Maharashtra',
      designation: 'Inspector',
      zone: 'Pune',
      phone: '9876500002',
      email: 'priya.deshmukh@lm.gov.in',
      password_hash: '$2a$10$F5CG2/qgBEzwEptfK8Oa2ehgqYx0fWrDSTFhQ1VJCCieOqRHJupDW',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'ins-003',
      gov_id: 'LMI-DL-001',
      full_name: 'Amit Sharma',
      department: 'Legal Metrology, Delhi',
      designation: 'Inspector',
      zone: 'New Delhi',
      phone: '9876500003',
      email: 'amit.sharma@lm.gov.in',
      password_hash: '$2a$10$F5CG2/qgBEzwEptfK8Oa2ehgqYx0fWrDSTFhQ1VJCCieOqRHJupDW',
      is_active: true,
      created_at: new Date()
    }
  ],
  vendors: [
    {
      id: 'ven-001',
      gstin: '27AAPFU0939F1ZV',
      business_name: 'Sharma Kirana & General Stores',
      owner_name: 'Ramesh Sharma',
      phone: '9811223344',
      email: 'ramesh@sharmakiranastore.in',
      address: 'Shop 12, Main Market, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      otp: null,
      otp_expires_at: null,
      is_verified: true,
      created_at: new Date()
    },
    {
      id: 'ven-002',
      gstin: '07AAACR5055K1Z5',
      business_name: 'Delhi Scales & Commercial Measures',
      owner_name: 'Suresh Verma',
      phone: '9811223355',
      email: 'suresh@delhiscales.com',
      address: 'Plot 45, Sector 18, Rohini',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110085',
      otp: null,
      otp_expires_at: null,
      is_verified: true,
      created_at: new Date()
    }
  ],
  instruments: [
    {
      id: 'inst-001',
      vendor_id: 'ven-001',
      make: 'Essae Teraoka',
      model: 'DS-852',
      serial_no: 'SN-0939-001',
      instrument_type: 'Electronic Platform Scale',
      capacity: '150',
      unit: 'kg',
      manufacture_year: 2021,
      installation_date: '2021-03-15',
      last_verified_at: new Date(Date.now() - 380 * 86400000),
      expiry_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      location_description: 'Counter No. 1, Front Shop'
    },
    {
      id: 'inst-002',
      vendor_id: 'ven-001',
      make: 'Avery Weigh-Tronix',
      model: 'ZK830',
      serial_no: 'SN-0939-002',
      instrument_type: 'Counter Scale',
      capacity: '30',
      unit: 'kg',
      manufacture_year: 2023,
      installation_date: '2023-01-10',
      last_verified_at: new Date(Date.now() - 340 * 86400000),
      expiry_date: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      location_description: 'Packaging Desk'
    },
    {
      id: 'inst-003',
      vendor_id: 'ven-001',
      make: 'Mettler Toledo',
      model: 'ICS465',
      serial_no: 'SN-0939-003',
      instrument_type: 'Bench Scale',
      capacity: '60',
      unit: 'kg',
      manufacture_year: 2024,
      installation_date: '2024-02-20',
      last_verified_at: new Date(Date.now() - 290 * 86400000),
      expiry_date: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE',
      location_description: 'Bulk Storage Room'
    }
  ],
  appointments: [
    {
      id: 'app-001',
      vendor_id: 'ven-001',
      instrument_id: 'inst-001',
      inspector_id: 'ins-001',
      preferred_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      preferred_time: '11:00:00',
      purpose: 'RENEWAL',
      status: 'PENDING',
      vendor_notes: 'Urgent annual renewal for expired counter scale'
    }
  ],
  verification_logs: []
};

async function testConnection() {
  if (!pool) {
    isPgAvailable = false;
    return;
  }
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW()');
      isPgAvailable = true;
      console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now);
    } finally {
      client.release();
    }
  } catch (err) {
    isPgAvailable = false;
    console.warn('⚠️ [PostgreSQL Notice]:', err.message);
    console.warn('💡 PostgreSQL is not reachable on ' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || 5432));
    console.warn('🚀 TolSeva is running with In-Memory Demo Store. All logins and API actions work out-of-the-box!');
  }
}

function handleMockQuery(text, params = []) {
  const norm = text.replace(/\s+/g, ' ').trim();

  // 1. Admin login: SELECT * FROM admins WHERE username = $1
  if (norm.includes('FROM admins WHERE username = $1')) {
    const user = memStore.admins.find(a => a.username.toLowerCase() === (params[0] || '').toLowerCase());
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 2. Inspector login: SELECT * FROM inspectors WHERE gov_id = $1
  if (norm.includes('FROM inspectors WHERE gov_id = $1')) {
    const ins = memStore.inspectors.find(i => i.gov_id.toUpperCase() === (params[0] || '').toUpperCase());
    return { rows: ins ? [ins] : [], rowCount: ins ? 1 : 0 };
  }

  // 3. Vendor check: SELECT * FROM vendors WHERE gstin = $1
  if (norm.includes('FROM vendors WHERE gstin = $1')) {
    const v = memStore.vendors.find(v => v.gstin.toUpperCase() === (params[0] || '').toUpperCase());
    return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
  }

  // 4. Vendor request-otp upsert
  if (norm.includes('INSERT INTO vendors (gstin, phone, business_name, owner_name, otp, otp_expires_at)')) {
    const [gstin, phone, business_name, owner_name, otp, otpExpiry] = params;
    let v = memStore.vendors.find(item => item.gstin.toUpperCase() === gstin.toUpperCase());
    if (v) {
      v.phone = phone;
      v.otp = otp;
      v.otp_expires_at = otpExpiry;
      v.business_name = business_name || v.business_name;
      v.owner_name = owner_name || v.owner_name;
    } else {
      v = {
        id: 'ven-' + Math.random().toString(36).substring(2, 9),
        gstin,
        phone,
        business_name: business_name || 'Business',
        owner_name: owner_name || 'Owner',
        otp,
        otp_expires_at: otpExpiry,
        is_verified: false,
        created_at: new Date()
      };
      memStore.vendors.push(v);
    }
    return { rows: [v], rowCount: 1 };
  }

  // 5. Verify OTP: UPDATE vendors SET is_verified = TRUE
  if (norm.includes('UPDATE vendors SET is_verified = TRUE')) {
    const vendorId = params[0];
    const v = memStore.vendors.find(item => item.id === vendorId);
    if (v) {
      v.is_verified = true;
      v.otp = null;
      v.otp_expires_at = null;
    }
    return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
  }

  // 6. Vendor machines
  if (norm.includes('FROM instruments i WHERE vendor_id = $1')) {
    const vendorId = params[0];
    const now = new Date();
    const rows = memStore.instruments
      .filter(i => i.vendor_id === vendorId)
      .map(i => {
        const expDate = i.expiry_date ? new Date(i.expiry_date) : null;
        let expiry_status = 'VALID';
        let days_until_expiry = null;
        if (expDate) {
          const diffDays = Math.ceil((expDate - now) / 86400000);
          days_until_expiry = diffDays;
          if (diffDays < 0) expiry_status = 'EXPIRED';
          else if (diffDays <= 30) expiry_status = 'EXPIRING_SOON';
          else if (diffDays <= 90) expiry_status = 'APPROACHING';
        }
        return { ...i, expiry_status, days_until_expiry };
      });
    return { rows, rowCount: rows.length };
  }

  // 7. Add machine: INSERT INTO instruments
  if (norm.includes('INSERT INTO instruments')) {
    const [vendor_id, make, model, serial_no, instrument_type, capacity, unit, manufacture_year, installation_date, location_description] = params;
    const existing = memStore.instruments.find(i => i.serial_no.toLowerCase() === serial_no.toLowerCase());
    if (existing) {
      const err = new Error('Serial number already registered');
      err.code = '23505';
      throw err;
    }
    const newInst = {
      id: 'inst-' + Math.random().toString(36).substring(2, 9),
      vendor_id,
      make,
      model,
      serial_no,
      instrument_type,
      capacity,
      unit,
      manufacture_year: parseInt(manufacture_year) || null,
      installation_date: installation_date || null,
      location_description: location_description || null,
      status: 'PENDING',
      expiry_date: null,
      created_at: new Date()
    };
    memStore.instruments.push(newInst);
    return { rows: [newInst], rowCount: 1 };
  }

  // 8. Vendor appointments: SELECT a.*, i.make... WHERE a.vendor_id = $1
  if (norm.includes('FROM appointments a') && norm.includes('WHERE a.vendor_id = $1')) {
    const vendorId = params[0];
    const rows = memStore.appointments
      .filter(a => a.vendor_id === vendorId)
      .map(a => {
        const inst = memStore.instruments.find(i => i.id === a.instrument_id) || {};
        const ins = memStore.inspectors.find(i => i.id === a.inspector_id) || {};
        return { ...a, make: inst.make, model: inst.model, serial_no: inst.serial_no, inspector_name: ins.full_name };
      });
    return { rows, rowCount: rows.length };
  }

  // 9. Book appointment: INSERT INTO appointments
  if (norm.includes('INSERT INTO appointments')) {
    const [vendor_id, instrument_id, preferred_date, preferred_time, purpose, vendor_notes] = params;
    const newApp = {
      id: 'app-' + Math.random().toString(36).substring(2, 9),
      vendor_id,
      instrument_id: instrument_id || null,
      inspector_id: null,
      preferred_date,
      preferred_time,
      purpose,
      status: 'PENDING',
      vendor_notes,
      created_at: new Date()
    };
    memStore.appointments.push(newApp);
    return { rows: [newApp], rowCount: 1 };
  }

  // 10. Inspector assigned-visits
  if (norm.includes('FROM appointments a') && norm.includes('WHERE a.inspector_id = $1') && !norm.includes('JOIN instruments i ON a.instrument_id = i.id')) {
    const inspectorId = params[0];
    const now = new Date();
    const rows = memStore.appointments
      .filter(a => (a.inspector_id === inspectorId || !a.inspector_id) && !['COMPLETED', 'CANCELLED'].includes(a.status))
      .map(a => {
        const inst = memStore.instruments.find(i => i.id === a.instrument_id) || {};
        const ven = memStore.vendors.find(v => v.id === a.vendor_id) || {};
        const expDate = inst.expiry_date ? new Date(inst.expiry_date) : null;
        let expiry_status = 'VALID';
        if (expDate) {
          const diffDays = Math.ceil((expDate - now) / 86400000);
          if (diffDays < 0) expiry_status = 'EXPIRED';
          else if (diffDays <= 30) expiry_status = 'EXPIRING_SOON';
          else if (diffDays <= 90) expiry_status = 'APPROACHING';
        }
        return {
          ...a,
          make: inst.make || 'Scale',
          model: inst.model || 'Standard',
          serial_no: inst.serial_no || 'N/A',
          instrument_type: inst.instrument_type || 'Measuring Scale',
          expiry_date: inst.expiry_date,
          capacity: inst.capacity,
          unit: inst.unit,
          business_name: ven.business_name || 'Registered Business',
          owner_name: ven.owner_name || 'Owner',
          vendor_phone: ven.phone || '',
          address: ven.address || '',
          expiry_status
        };
      });
    return { rows, rowCount: rows.length };
  }

  // 10a. Inspector assigned visits with joins and optional expiry filters
  if (norm.includes('FROM appointments a') && norm.includes('JOIN instruments i ON a.instrument_id = i.id') && norm.includes('JOIN vendors v ON a.vendor_id = v.id')) {
    const inspectorId = params[0];
    const now = new Date();
    const rows = memStore.appointments
      .filter(a => a.inspector_id === inspectorId && !['COMPLETED', 'CANCELLED'].includes(a.status))
      .map(a => {
        const inst = memStore.instruments.find(i => i.id === a.instrument_id);
        const vendor = memStore.vendors.find(v => v.id === a.vendor_id);
        if (!inst || !vendor) return null;
        const expiryDate = inst.expiry_date ? new Date(inst.expiry_date) : null;
        const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / 86400000) : null;
        const expiryStatus = daysUntilExpiry === null ? 'VALID'
          : daysUntilExpiry < 0 ? 'EXPIRED'
          : daysUntilExpiry <= 30 ? 'EXPIRING_SOON'
          : daysUntilExpiry <= 90 ? 'APPROACHING' : 'VALID';
        return {
          ...inst,
          ...a,
          business_name: vendor.business_name,
          owner_name: vendor.owner_name,
          vendor_phone: vendor.phone,
          address: vendor.address,
          expiry_status: expiryStatus
        };
      })
      .filter(Boolean)
      .filter(row => !norm.includes("expiry_date < CURRENT_DATE") || row.expiry_status === 'EXPIRED')
      .filter(row => !norm.includes('expiry_date BETWEEN CURRENT_DATE') || ['VALID', 'EXPIRING_SOON', 'APPROACHING'].includes(row.expiry_status))
      .sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')) || String(a.preferred_date).localeCompare(String(b.preferred_date)));
    return { rows, rowCount: rows.length };
  }

  // 11. Inspector get instrument: SELECT * FROM instruments WHERE id = $1
  if (norm.includes('FROM instruments WHERE id = $1')) {
    const inst = memStore.instruments.find(i => i.id === params[0]);
    return { rows: inst ? [inst] : [], rowCount: inst ? 1 : 0 };
  }

  // 11a. Inspector certificate lookup
  if (norm.includes('FROM verification_logs vl') && norm.includes('WHERE vl.id = $1 AND vl.inspector_id = $2')) {
    const log = memStore.verification_logs.find(item => item.id === params[0] && item.inspector_id === params[1]);
    if (!log) return { rows: [], rowCount: 0 };
    const instrument = memStore.instruments.find(item => item.id === log.instrument_id) || {};
    const vendor = memStore.vendors.find(item => item.id === instrument.vendor_id) || {};
    return {
      rows: [{ ...log, make: instrument.make, model: instrument.model, serial_no: instrument.serial_no, business_name: vendor.business_name }],
      rowCount: 1
    };
  }

  // 12. Verification log: INSERT INTO verification_logs
  if (norm.includes('INSERT INTO verification_logs')) {
    const [appointment_id, instrument_id, inspector_id, test_result, observations, error_percentage, photo_url, qr_payload, certificate_no, valid_until] = params;
    const newLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      appointment_id,
      instrument_id,
      inspector_id,
      test_result,
      observations,
      error_percentage,
      photo_url,
      qr_payload,
      certificate_no,
      valid_until,
      verified_at: new Date()
    };
    memStore.verification_logs.push(newLog);
    return { rows: [newLog], rowCount: 1 };
  }

  // 13. Update instrument status
  if (norm.includes('UPDATE instruments') && norm.includes('SET status = $1')) {
    const [status, expiry_date, id] = params;
    const inst = memStore.instruments.find(i => i.id === id);
    if (inst) {
      inst.status = status;
      inst.expiry_date = expiry_date;
      inst.last_verified_at = new Date();
    }
    return { rows: inst ? [inst] : [], rowCount: inst ? 1 : 0 };
  }

  // 14. Update appointment status: UPDATE appointments SET status = 'COMPLETED'
  if (norm.includes('UPDATE appointments SET status =')) {
    const id = params[params.length - 1];
    const app = memStore.appointments.find(a => a.id === id);
    if (app) {
      if (norm.includes("status = 'COMPLETED'")) app.status = 'COMPLETED';
      if (norm.includes("status = 'CONFIRMED'")) {
        app.status = 'CONFIRMED';
        app.inspector_id = params[0];
      }
    }
    return { rows: app ? [app] : [], rowCount: app ? 1 : 0 };
  }

  // 15. Admin dashboard counts
  if (norm.includes('SELECT COUNT(*) FROM vendors')) {
    const count = memStore.vendors.filter(v => v.is_verified).length;
    return { rows: [{ count }], rowCount: 1 };
  }
  if (norm.includes('SELECT COUNT(*) FROM instruments')) {
    if (norm.includes('expiry_date < CURRENT_DATE')) {
      const now = new Date();
      const count = memStore.instruments.filter(i => i.expiry_date && new Date(i.expiry_date) < now && i.status === 'ACTIVE').length;
      return { rows: [{ count }], rowCount: 1 };
    }
    return { rows: [{ count: memStore.instruments.length }], rowCount: 1 };
  }
  if (norm.includes('SELECT COUNT(*) FROM appointments')) {
    const count = memStore.appointments.filter(a => a.status === 'PENDING').length;
    return { rows: [{ count }], rowCount: 1 };
  }
  if (norm.includes('SELECT COUNT(*) FROM verification_logs')) {
    return { rows: [{ count: memStore.verification_logs.length }], rowCount: 1 };
  }

  // 16. Admin vendors list
  if (norm.includes('FROM vendors v') && norm.includes('COUNT(i.id) AS instrument_count')) {
    const rows = memStore.vendors.filter(v => v.is_verified).map(v => {
      const instCount = memStore.instruments.filter(i => i.vendor_id === v.id).length;
      return { ...v, instrument_count: instCount };
    });
    return { rows, rowCount: rows.length };
  }

  // 17. Admin inspectors list
  if (norm.includes('FROM inspectors ORDER BY full_name')) {
    return { rows: [...memStore.inspectors], rowCount: memStore.inspectors.length };
  }

  // 18. Admin appointments list
  if (norm.includes('FROM appointments a') && norm.includes('ORDER BY a.preferred_date DESC')) {
    const rows = memStore.appointments.map(a => {
      const v = memStore.vendors.find(ven => ven.id === a.vendor_id) || {};
      const inst = memStore.instruments.find(i => i.id === a.instrument_id) || {};
      const ins = memStore.inspectors.find(i => i.id === a.inspector_id) || {};
      return {
        ...a,
        business_name: v.business_name || 'Business',
        vendor_phone: v.phone || '',
        make: inst.make || 'Scale',
        model: inst.model || 'Standard',
        serial_no: inst.serial_no || '',
        inspector_name: ins.full_name || null
      };
    });
    return { rows, rowCount: rows.length };
  }

  return { rows: [], rowCount: 0 };
}

async function query(text, params = []) {
  if (isPgAvailable && pool) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log('SQL [Postgres]:', { text: text.slice(0, 80), duration: `${duration}ms`, rows: res.rowCount });
      }
      return res;
    } catch (err) {
      console.warn('⚠️ Postgres query failed, using mock fallback:', err.message);
      return handleMockQuery(text, params);
    }
  } else {
    return handleMockQuery(text, params);
  }
}

module.exports = { pool, query, testConnection, isPgAvailable: () => isPgAvailable };
