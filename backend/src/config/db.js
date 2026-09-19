require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const mongoDbName = process.env.MONGODB_DB || 'tolseva';
const client = mongoUri ? new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 }) : null;
let database = null;
let isMongoAvailable = false;

const memory = {
  admins: [{
    id: 'adm-001',
    username: 'admin',
    phone: '9876500000',
    password_hash: '$2a$10$ZQuVDPiEwciGG7F2Kc/qMuGkOeiXBPirNxpQSNg2o32i6jjW4nmDS',
    full_name: 'System Administrator',
    otp: null,
    otp_expires_at: null
  }],
  inspectors: [
    {
      id: 'ins-001',
      gov_id: 'LMI-MH-001',
      full_name: 'Rajesh Kumar Singh',
      phone: '9876500001',
      designation: 'Senior Inspector',
      zone: 'Mumbai Central',
      department: 'Legal Metrology, Maharashtra',
      email: 'rajesh.singh@lm.gov.in',
      baseLatitude: 19.0330,
      baseLongitude: 72.8550,
      base_latitude: 19.0330,
      base_longitude: 72.8550,
      password_hash: '$2a$10$F5CG2/qgBEzwEptfK8Oa2ehgqYx0fWrDSTFhQ1VJCCieOqRHJupDW',
      is_active: true,
      otp: null,
      otp_expires_at: null,
      created_at: new Date('2025-01-01')
    },
    {
      id: 'ins-002',
      gov_id: 'LMI-MH-002',
      full_name: 'Priya Deshmukh',
      phone: '9876500002',
      designation: 'Inspector',
      zone: 'Mumbai Suburbs',
      department: 'Legal Metrology, Maharashtra',
      email: 'priya.deshmukh@lm.gov.in',
      baseLatitude: 19.1197,
      baseLongitude: 72.8464,
      base_latitude: 19.1197,
      base_longitude: 72.8464,
      password_hash: '$2a$10$F5CG2/qgBEzwEptfK8Oa2ehgqYx0fWrDSTFhQ1VJCCieOqRHJupDW',
      is_active: true,
      otp: null,
      otp_expires_at: null,
      created_at: new Date('2025-01-01')
    },
    {
      id: 'ins-003',
      gov_id: 'LMI-MH-003',
      full_name: 'Vikram Patil',
      phone: '9876500003',
      designation: 'Inspector',
      zone: 'Thane',
      department: 'Legal Metrology, Maharashtra',
      email: 'vikram.patil@lm.gov.in',
      baseLatitude: 19.2000,
      baseLongitude: 72.9700,
      base_latitude: 19.2000,
      base_longitude: 72.9700,
      password_hash: '$2a$10$F5CG2/qgBEzwEptfK8Oa2ehgqYx0fWrDSTFhQ1VJCCieOqRHJupDW',
      is_active: true,
      otp: null,
      otp_expires_at: null,
      created_at: new Date('2025-01-01')
    }
  ],
  vendors: [
    {
      id: 'ven-001',
      gstin: '27AAPFU0939F1ZV',
      business_name: 'Sharma Kirana & General Stores',
      owner_name: 'Ramesh Sharma',
      phone: '9811223344',
      email: 'ramesh@sharma.com',
      address: 'Shop 12, Dadar Market, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0178,
      longitude: 72.8478,
      is_verified: true,
      created_at: new Date('2025-01-10')
    },
    {
      id: 'ven-002',
      gstin: '27AABCB1234F1Z1',
      business_name: 'Apex Sweets & Dairy',
      owner_name: 'Kavita Joshi',
      phone: '9811223355',
      email: 'kavita@apexsweets.com',
      address: 'Hill Road, Bandra West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0596,
      longitude: 72.8295,
      is_verified: true,
      created_at: new Date('2025-01-12')
    },
    {
      id: 'ven-003',
      gstin: '27AABCT5678M1Z2',
      business_name: 'Metro Wholesale Provisions',
      owner_name: 'Harish Mehta',
      phone: '9811223366',
      email: 'harish@metrowholesale.com',
      address: 'MIDC, Andheri East, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.1136,
      longitude: 72.8697,
      is_verified: true,
      created_at: new Date('2025-01-15')
    },
    {
      id: 'ven-004',
      gstin: '27AAECP9876Q1Z3',
      business_name: 'Kalyan Jewellers & Precision',
      owner_name: 'Sunil Verma',
      phone: '9811223377',
      email: 'sunil@kalyanjewellers.com',
      address: 'Gokhale Road, Naupada, Thane West',
      city: 'Thane',
      state: 'Maharashtra',
      latitude: 19.2183,
      longitude: 72.9781,
      is_verified: true,
      created_at: new Date('2025-01-18')
    },
    {
      id: 'ven-005',
      gstin: '27AACCB4321R1Z4',
      business_name: 'Borivali Grain Merchant',
      owner_name: 'Anand Patel',
      phone: '9811223388',
      email: 'anand@borivaligrain.com',
      address: 'SV Road, Borivali West, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.2307,
      longitude: 72.8567,
      is_verified: true,
      created_at: new Date('2025-01-20')
    }
  ],
  instruments: [
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
      location_description: 'Main Counter',
      status: 'ACTIVE',
      expiry_date: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_verified_at: new Date(),
      created_at: new Date()
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
      // Past expiry date with NO future appointment -> Expiry Defaulter!
      expiry_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_verified_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      created_at: new Date()
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
      expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_verified_at: new Date(),
      created_at: new Date()
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
      location_description: 'Quality Lab',
      status: 'SUSPENDED',
      // Expired certificate
      expiry_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_verified_at: new Date(Date.now() - 425 * 24 * 60 * 60 * 1000),
      created_at: new Date()
    },
    {
      id: 'inst-005',
      vendor_id: 'ven-003',
      make: 'Eagle Scales',
      model: 'EP-500',
      serial_no: 'SN-1Z2-001',
      instrument_type: 'Heavy Platform Scale',
      capacity: '500',
      unit: 'kg',
      manufacture_year: 2025,
      installation_date: '2025-01-10',
      location_description: 'Loading Dock',
      status: 'PENDING',
      expiry_date: null,
      last_verified_at: null,
      created_at: new Date()
    }
  ],
  appointments: [
    {
      id: 'app-init-001',
      vendor_id: 'ven-001',
      instrument_id: 'inst-001',
      inspector_id: 'ins-001',
      preferred_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      preferred_time: 'MORNING',
      purpose: 'Annual Verification',
      vendor_notes: 'Inspector requested morning slot',
      status: 'CONFIRMED',
      created_at: new Date()
    },
    {
      id: 'app-init-002',
      vendor_id: 'ven-003',
      instrument_id: 'inst-005',
      inspector_id: null,
      preferred_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      preferred_time: 'AFTERNOON',
      purpose: 'New Stamping & Verification',
      vendor_notes: 'New machine awaiting initial verification',
      status: 'PENDING',
      created_at: new Date()
    }
  ],
  verification_logs: [
    {
      id: 'log-001',
      appointment_id: 'app-init-001',
      instrument_id: 'inst-001',
      inspector_id: 'ins-001',
      test_result: 'PASS',
      observations: 'All test weights within legal tolerance (±0.01%). Stamped.',
      error_percentage: 0.01,
      photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
      qr_payload: 'https://tolseva.gov.in/verify/LM-MH-001-2026-VAL101',
      certificate_no: 'LM-MH-001-2026-VAL101',
      valid_until: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      verified_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'log-002',
      appointment_id: null,
      instrument_id: 'inst-004',
      inspector_id: 'ins-002',
      test_result: 'PASS',
      observations: 'Passed previous annual inspection.',
      error_percentage: 0.02,
      photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
      qr_payload: 'https://tolseva.gov.in/verify/LM-MH-002-2025-EXP202',
      certificate_no: 'LM-MH-002-2025-EXP202',
      // Past validity date -> EXPIRED certificate!
      valid_until: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      verified_at: new Date(Date.now() - 425 * 24 * 60 * 60 * 1000)
    }
  ],
  complaints: [
    {
      id: 'cmp-001',
      type: 'VENDOR_AGAINST_INSPECTOR',
      vendorId: 'ven-001',
      inspectorId: 'ins-001',
      instrumentId: null,
      certificateId: null,
      appointmentId: 'app-init-001',
      category: 'INSPECTION_DELAY',
      description: 'Scheduled visit was delayed by 3 hours without prior notice from the inspector.',
      evidenceUrl: null,
      status: 'OPEN',
      adminNotes: null,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'cmp-002',
      type: 'PUBLIC_ABOUT_INSTRUMENT',
      vendorId: 'ven-002',
      inspectorId: 'ins-002',
      instrumentId: 'inst-004',
      certificateId: 'LM-MH-002-2025-EXP202',
      appointmentId: null,
      category: 'EXPIRED_VERIFICATION',
      description: 'The counter scale in the retail section has an expired verification seal and lacks current certificate.',
      evidenceUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
      status: 'INVESTIGATING',
      adminNotes: 'Assigned to regional supervisor for surprise check.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ]
};

const response = rows => ({ rows, rowCount: rows.length });
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function matchDoc(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      if (!val.some(sub => matchDoc(doc, sub))) return false;
      continue;
    }
    const docVal = doc[key];
    if (val instanceof RegExp) {
      if (!val.test(String(docVal || ''))) return false;
    } else if (val && typeof val === 'object') {
      if (val.$nin && Array.isArray(val.$nin)) {
        if (val.$nin.includes(docVal)) return false;
      }
      if (val.$in && Array.isArray(val.$in)) {
        if (!val.$in.includes(docVal)) return false;
      }
      if (val.$ne !== undefined) {
        if (docVal === val.$ne) return false;
      }
      if (val.$gte !== undefined) {
        if (!(docVal >= val.$gte)) return false;
      }
      if (val.$lte !== undefined) {
        if (!(docVal <= val.$lte)) return false;
      }
      if (val.$gt !== undefined) {
        if (!(docVal > val.$gt)) return false;
      }
      if (val.$lt !== undefined) {
        if (!(docVal < val.$lt)) return false;
      }
    } else if (docVal !== val) {
      return false;
    }
  }
  return true;
}

function applyUpdate(doc, update = {}) {
  if (update.$set) {
    Object.assign(doc, update.$set);
  }
  return doc;
}

function createMemoryCollection(name) {
  if (!memory[name]) memory[name] = [];
  const list = memory[name];

  return {
    find: (filter = {}) => {
      let filtered = list.filter(item => matchDoc(item, filter));
      const cursor = {
        _items: filtered,
        sort: (sortObj = {}) => {
          const keys = Object.keys(sortObj);
          if (keys.length > 0) {
            cursor._items.sort((a, b) => {
              for (const k of keys) {
                const dir = sortObj[k];
                if (a[k] < b[k]) return dir === 1 ? -1 : 1;
                if (a[k] > b[k]) return dir === 1 ? 1 : -1;
              }
              return 0;
            });
          }
          return cursor;
        },
        skip: (n = 0) => {
          cursor._items = cursor._items.slice(n);
          return cursor;
        },
        limit: (n = 20) => {
          cursor._items = cursor._items.slice(0, n);
          return cursor;
        },
        toArray: async () => [...cursor._items]
      };
      return cursor;
    },
    findOne: async (filter = {}) => {
      return list.find(item => matchDoc(item, filter)) || null;
    },
    insertOne: async (doc) => {
      const item = { ...doc };
      if (!item.id && !item._id) item.id = `${name.slice(0, 3)}-${Date.now()}`;
      list.push(item);
      return { insertedId: item.id || item._id, acknowledged: true };
    },
    insertMany: async (docs = []) => {
      for (const d of docs) {
        const item = { ...d };
        if (!item.id && !item._id) item.id = `${name.slice(0, 3)}-${Date.now()}`;
        list.push(item);
      }
      return { acknowledged: true, insertedCount: docs.length };
    },
    updateOne: async (filter, update, options = {}) => {
      let item = list.find(it => matchDoc(it, filter));
      if (!item && options.upsert) {
        item = { ...(update.$setOnInsert || {}), ...(update.$set || {}) };
        if (!item.id && !item._id) item.id = `${name.slice(0, 3)}-${Date.now()}`;
        list.push(item);
        return { matchedCount: 0, upsertedCount: 1, acknowledged: true };
      }
      if (item) {
        applyUpdate(item, update);
        return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
      }
      return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
    },
    updateMany: async (filter, update) => {
      let count = 0;
      for (const item of list) {
        if (matchDoc(item, filter)) {
          applyUpdate(item, update);
          count++;
        }
      }
      return { matchedCount: count, modifiedCount: count, acknowledged: true };
    },
    findOneAndUpdate: async (filter, update, options = {}) => {
      let item = list.find(it => matchDoc(it, filter));
      if (!item && options.upsert) {
        item = { ...(update.$setOnInsert || {}), ...(update.$set || {}) };
        if (!item.id && !item._id) item.id = `${name.slice(0, 3)}-${Date.now()}`;
        list.push(item);
        return { value: item };
      }
      if (item) {
        applyUpdate(item, update);
        return { value: item };
      }
      return { value: null };
    },
    countDocuments: async (filter = {}) => {
      return list.filter(item => matchDoc(item, filter)).length;
    },
    deleteMany: async (filter = {}) => {
      const remaining = list.filter(item => !matchDoc(item, filter));
      const deleted = list.length - remaining.length;
      memory[name] = remaining;
      return { deletedCount: deleted, acknowledged: true };
    },
    createIndex: async () => true
  };
}

const memoryDb = {
  collection: (name) => createMemoryCollection(name)
};

async function testConnection() {
  if (!client) {
    console.log('Using in-memory TolSeva database (MONGODB_URI not set)');
    return;
  }
  await client.connect();
  database = client.db(mongoDbName);
  await database.command({ ping: 1 });
  isMongoAvailable = true;
  console.log(`MongoDB connected: ${mongoDbName}`);
}

function memoryQuery(text, params = []) {
  const norm = text.replace(/\s+/g, ' ').trim();

  // ADMINS
  if (norm.includes('FROM admins WHERE (username = $1 OR phone = $1)') || norm.includes('FROM admins WHERE username = $1 OR phone = $1')) {
    const val = String(params[0] || '').toLowerCase();
    return response(memory.admins.filter(item => item.username.toLowerCase() === val || (item.phone && item.phone === params[0])));
  }
  if (norm.includes('FROM admins WHERE username = $1')) {
    return response(memory.admins.filter(item => item.username.toLowerCase() === String(params[0]).toLowerCase()));
  }
  if (norm.includes('UPDATE admins SET otp = $1, otp_expires_at = $2 WHERE id = $3')) {
    const item = memory.admins.find(a => a.id === params[2]);
    if (item) { item.otp = params[0]; item.otp_expires_at = params[1]; }
    return response(item ? [item] : []);
  }
  if (norm.includes('UPDATE admins SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2')) {
    const item = memory.admins.find(a => a.id === params[1]);
    if (item) { item.password_hash = params[0]; item.otp = null; item.otp_expires_at = null; }
    return response(item ? [item] : []);
  }

  // INSPECTORS
  if (norm.includes('FROM inspectors WHERE (gov_id = $1 OR phone = $1)') || norm.includes('FROM inspectors WHERE gov_id = $1 OR phone = $1')) {
    const val = String(params[0] || '').toUpperCase();
    return response(memory.inspectors.filter(item => item.gov_id.toUpperCase() === val || (item.phone && item.phone === params[0])));
  }
  if (norm.includes('FROM inspectors WHERE gov_id = $1')) {
    return response(memory.inspectors.filter(item => item.gov_id.toUpperCase() === String(params[0]).toUpperCase()));
  }
  if (norm.includes('FROM inspectors WHERE id = $1')) {
    return response(memory.inspectors.filter(item => item.id === params[0]));
  }
  if (norm.includes('FROM inspectors ORDER BY full_name') || norm.includes('FROM inspectors')) {
    return response([...memory.inspectors].sort((a, b) => a.full_name.localeCompare(b.full_name)));
  }
  if (norm.includes('UPDATE inspectors SET otp = $1, otp_expires_at = $2 WHERE id = $3')) {
    const item = memory.inspectors.find(i => i.id === params[2]);
    if (item) { item.otp = params[0]; item.otp_expires_at = params[1]; }
    return response(item ? [item] : []);
  }
  if (norm.includes('UPDATE inspectors SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2')) {
    const item = memory.inspectors.find(i => i.id === params[1]);
    if (item) { item.password_hash = params[0]; item.otp = null; item.otp_expires_at = null; }
    return response(item ? [item] : []);
  }

  // VENDORS
  if (norm.includes('FROM vendors WHERE gstin = $1')) {
    return response(memory.vendors.filter(item => item.gstin.toUpperCase() === String(params[0]).toUpperCase()));
  }
  if (norm.includes('FROM vendors WHERE id = $1')) {
    return response(memory.vendors.filter(item => item.id === params[0]));
  }
  if (norm.includes('UPDATE vendors SET otp = $1, otp_expires_at = $2')) {
    const item = memory.vendors.find(v => v.id === params[2]);
    if (item) { item.otp = params[0]; item.otp_expires_at = params[1]; }
    return response(item ? [item] : []);
  }
  if (norm.includes('UPDATE vendors SET is_verified = TRUE')) {
    const item = memory.vendors.find(v => v.id === params[0]);
    if (item) { item.is_verified = true; item.otp = null; item.otp_expires_at = null; }
    return response(item ? [item] : []);
  }
  if (norm.includes('FROM vendors v') || norm.includes('FROM vendors')) {
    const list = memory.vendors.map(v => ({
      ...v,
      instrument_count: memory.instruments.filter(i => i.vendor_id === v.id).length
    }));
    return response(list);
  }

  // INSTRUMENTS
  if (norm.includes('FROM instruments i WHERE vendor_id = $1') || norm.includes('FROM instruments WHERE vendor_id = $1')) {
    const list = memory.instruments.filter(i => i.vendor_id === params[0]);
    return response(list);
  }
  if (norm.includes('FROM instruments WHERE id = $1')) {
    return response(memory.instruments.filter(i => i.id === params[0]));
  }
  if (norm.includes('FROM instruments')) {
    return response(memory.instruments);
  }

  // APPOINTMENTS
  if (norm.includes('FROM appointments a') && norm.includes('WHERE a.vendor_id = $1')) {
    const list = memory.appointments
      .filter(a => a.vendor_id === params[0])
      .map(a => {
        const inst = memory.instruments.find(i => i.id === a.instrument_id) || {};
        const insp = memory.inspectors.find(i => i.id === a.inspector_id) || {};
        return { ...a, make: inst.make, model: inst.model, serial_no: inst.serial_no, inspector_name: insp.full_name };
      })
      .sort((a, b) => (b.preferred_date || '').localeCompare(a.preferred_date || ''));
    return response(list);
  }
  if (norm.includes('WHERE a.inspector_id = $1')) {
    const list = memory.appointments
      .filter(a => a.inspector_id === params[0])
      .map(a => {
        const inst = memory.instruments.find(i => i.id === a.instrument_id) || {};
        const vend = memory.vendors.find(v => v.id === a.vendor_id) || {};
        return { ...a, ...inst, business_name: vend.business_name, vendor_phone: vend.phone, address: vend.address };
      });
    return response(list);
  }
  if (norm.includes('FROM appointments a') || norm.includes('FROM appointments')) {
    const list = memory.appointments.map(a => {
      const inst = memory.instruments.find(i => i.id === a.instrument_id) || {};
      const vend = memory.vendors.find(v => v.id === a.vendor_id) || {};
      const insp = memory.inspectors.find(i => i.id === a.inspector_id) || {};
      return {
        ...a,
        business_name: vend.business_name,
        vendor_phone: vend.phone,
        make: inst.make,
        model: inst.model,
        serial_no: inst.serial_no,
        inspector_name: insp.full_name
      };
    });
    return response(list);
  }

  // VERIFICATION LOGS
  if (norm.includes('FROM verification_logs vl') && norm.includes('WHERE vl.id = $1 AND vl.inspector_id = $2')) {
    return response(memory.verification_logs.filter(l => l.id === params[0] && l.inspector_id === params[1]));
  }
  if (norm.includes('FROM verification_logs WHERE certificate_no = $1') || norm.includes('FROM verification_logs WHERE id = $1')) {
    return response(memory.verification_logs.filter(l => l.certificate_no === params[0] || l.id === params[0]));
  }
  if (norm.includes('FROM verification_logs')) {
    return response(memory.verification_logs);
  }

  // COUNTS
  if (norm.includes('SELECT COUNT(*) FROM vendors')) return response([{ count: memory.vendors.filter(item => item.is_verified).length }]);
  if (norm.includes('SELECT COUNT(*) FROM instruments')) return response([{ count: memory.instruments.length }]);
  if (norm.includes('SELECT COUNT(*) FROM appointments')) return response([{ count: memory.appointments.filter(item => item.status === 'PENDING').length }]);
  if (norm.includes('SELECT COUNT(*) FROM verification_logs')) return response([{ count: memory.verification_logs.length }]);

  return response([]);
}

async function mongoQuery(text, params = []) {
  const norm = text.replace(/\s+/g, ' ').trim();
  const get = name => database.collection(name);
  const now = new Date();

  // ADMINS
  if (norm.includes('FROM admins WHERE (username = $1 OR phone = $1)') || norm.includes('FROM admins WHERE username = $1 OR phone = $1')) {
    const val = params[0];
    const item = await get('admins').findOne({ $or: [{ username: new RegExp(`^${escapeRegex(val)}$`, 'i') }, { phone: String(val) }] });
    return response(item ? [item] : []);
  }
  if (norm.includes('FROM admins WHERE username = $1')) {
    return response([await get('admins').findOne({ username: new RegExp(`^${escapeRegex(params[0])}$`, 'i') })].filter(Boolean));
  }
  if (norm.includes('UPDATE admins SET otp = $1, otp_expires_at = $2 WHERE id = $3')) {
    await get('admins').updateOne({ id: params[2] }, { $set: { otp: params[0], otp_expires_at: params[1], updated_at: now } });
    return response([]);
  }
  if (norm.includes('UPDATE admins SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2')) {
    await get('admins').updateOne({ id: params[1] }, { $set: { password_hash: params[0], otp: null, otp_expires_at: null, updated_at: now } });
    return response([]);
  }

  // INSPECTORS
  if (norm.includes('FROM inspectors WHERE (gov_id = $1 OR phone = $1)') || norm.includes('FROM inspectors WHERE gov_id = $1 OR phone = $1')) {
    const val = params[0];
    const item = await get('inspectors').findOne({ $or: [{ gov_id: new RegExp(`^${escapeRegex(val)}$`, 'i') }, { phone: String(val) }] });
    return response(item ? [item] : []);
  }
  if (norm.includes('FROM inspectors WHERE gov_id = $1')) {
    return response([await get('inspectors').findOne({ gov_id: new RegExp(`^${escapeRegex(params[0])}$`, 'i') })].filter(Boolean));
  }
  if (norm.includes('FROM inspectors WHERE id = $1')) {
    return response([await get('inspectors').findOne({ id: params[0] })].filter(Boolean));
  }
  if (norm.includes('UPDATE inspectors SET otp = $1, otp_expires_at = $2 WHERE id = $3')) {
    await get('inspectors').updateOne({ id: params[2] }, { $set: { otp: params[0], otp_expires_at: params[1], updated_at: now } });
    return response([]);
  }
  if (norm.includes('UPDATE inspectors SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2')) {
    await get('inspectors').updateOne({ id: params[1] }, { $set: { password_hash: params[0], otp: null, otp_expires_at: null, updated_at: now } });
    return response([]);
  }
  if (norm.includes('FROM inspectors ORDER BY full_name') || norm.includes('FROM inspectors')) {
    return response(await get('inspectors').find({}).sort({ full_name: 1 }).toArray());
  }

  // VENDORS
  if (norm.includes('FROM vendors WHERE gstin = $1')) {
    return response([await get('vendors').findOne({ gstin: new RegExp(`^${escapeRegex(params[0])}$`, 'i') })].filter(Boolean));
  }
  if (norm.includes('FROM vendors WHERE id = $1')) {
    return response([await get('vendors').findOne({ id: params[0] })].filter(Boolean));
  }
  if (norm.includes('UPDATE vendors SET otp = $1, otp_expires_at = $2')) {
    await get('vendors').updateOne({ id: params[2] }, { $set: { otp: params[0], otp_expires_at: params[1], updated_at: now } });
    return response([]);
  }
  if (norm.includes('UPDATE vendors SET is_verified = TRUE')) {
    const item = await get('vendors').findOneAndUpdate({ id: params[0] }, { $set: { is_verified: true, otp: null, otp_expires_at: null, updated_at: now } }, { returnDocument: 'after' });
    return response(item ? [item.value || item] : []);
  }

  // INSTRUMENTS
  if (norm.includes('FROM instruments i WHERE vendor_id = $1') || norm.includes('FROM instruments WHERE vendor_id = $1')) {
    return response(await get('instruments').find({ vendor_id: params[0] }).sort({ expiry_date: 1 }).toArray());
  }
  if (norm.includes('FROM instruments WHERE id = $1')) {
    return response([await get('instruments').findOne({ id: params[0] })].filter(Boolean));
  }
  if (norm.includes('FROM instruments')) {
    return response(await get('instruments').find({}).toArray());
  }

  // APPOINTMENTS
  if (norm.includes('FROM appointments a') && norm.includes('WHERE a.vendor_id = $1')) {
    return response(await get('appointments').find({ vendor_id: params[0] }).sort({ preferred_date: -1 }).toArray());
  }
  if (norm.includes('FROM appointments a') || norm.includes('FROM appointments')) {
    return response(await get('appointments').find({}).sort({ preferred_date: -1 }).toArray());
  }

  // VERIFICATION LOGS
  if (norm.includes('FROM verification_logs vl') && norm.includes('WHERE vl.id = $1 AND vl.inspector_id = $2')) {
    return response([await get('verification_logs').findOne({ id: params[0], inspector_id: params[1] })].filter(Boolean));
  }
  if (norm.includes('FROM verification_logs WHERE certificate_no = $1') || norm.includes('FROM verification_logs WHERE id = $1')) {
    return response([await get('verification_logs').findOne({ $or: [{ certificate_no: params[0] }, { id: params[0] }] })].filter(Boolean));
  }
  if (norm.includes('FROM verification_logs')) {
    return response(await get('verification_logs').find({}).toArray());
  }

  // COUNTS
  if (norm.includes('SELECT COUNT(*) FROM vendors')) return response([{ count: await get('vendors').countDocuments({ is_verified: true }) }]);
  if (norm.includes('SELECT COUNT(*) FROM instruments')) return response([{ count: await get('instruments').countDocuments() }]);
  if (norm.includes('SELECT COUNT(*) FROM appointments')) return response([{ count: await get('appointments').countDocuments({ status: 'PENDING' }) }]);
  if (norm.includes('SELECT COUNT(*) FROM verification_logs')) return response([{ count: await get('verification_logs').countDocuments() }]);

  return response([]);
}

async function query(text, params = []) {
  if (!isMongoAvailable) return memoryQuery(text, params);
  try {
    return await mongoQuery(text, params);
  } catch (error) {
    console.warn('MongoDB query failed, using in-memory fallback:', error.message);
    return memoryQuery(text, params);
  }
}

function getDb() {
  if (isMongoAvailable && database) {
    return database;
  }
  return memoryDb;
}

module.exports = {
  query,
  testConnection,
  getDb,
  close: () => client?.close(),
  isMongoAvailable: () => isMongoAvailable,
  memory
};
