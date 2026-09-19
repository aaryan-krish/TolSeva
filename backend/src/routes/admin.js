const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { query, getDb } = require('../config/db');
const bcrypt = require('bcryptjs');

const adminAuth = authenticate(['admin']);

// ── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const todayStr = new Date().toISOString().split('T')[0];

    const [vendorsCount, instrumentsCount, pendingAppsCount, verificationsCount, complaintsCount, allInstruments] = await Promise.all([
      db.collection('vendors').countDocuments({ is_verified: true }),
      db.collection('instruments').countDocuments({}),
      db.collection('appointments').countDocuments({ status: 'PENDING' }),
      db.collection('verification_logs').countDocuments({}),
      db.collection('complaints').countDocuments({ status: { $ne: 'RESOLVED' } }),
      db.collection('instruments').find({}).toArray()
    ]);

    const expiredInstrumentsCount = allInstruments.filter(i => i.expiry_date && i.expiry_date < todayStr).length;

    res.json({
      stats: {
        registered_vendors: vendorsCount,
        total_instruments: instrumentsCount,
        pending_appointments: pendingAppsCount,
        verifications_issued: verificationsCount,
        expired_instruments: expiredInstrumentsCount,
        active_complaints: complaintsCount
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/vendors (with optional ?gstin= search) ─────────────────────
router.get('/vendors', adminAuth, async (req, res, next) => {
  try {
    const { gstin } = req.query;
    const db = getDb();

    let vendors = [];
    if (gstin && gstin.trim()) {
      const searchGstin = gstin.trim().toUpperCase();
      vendors = await db.collection('vendors').find({
        gstin: new RegExp(searchGstin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      }).toArray();
    } else {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      vendors = await db.collection('vendors').find({ is_verified: true })
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
    }

    // Attach instrument counts
    const enriched = await Promise.all(vendors.map(async v => {
      const count = await db.collection('instruments').countDocuments({ vendor_id: v.id });
      return {
        ...v,
        instrument_count: count
      };
    }));

    const total = await db.collection('vendors').countDocuments(gstin ? {} : { is_verified: true });
    res.json({ vendors: enriched, total });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/vendors/:id (Full Vendor Profile) ──────────────────────────
router.get('/vendors/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const vendorId = req.params.id;

    const vendor = await db.collection('vendors').findOne({
      $or: [{ id: vendorId }, { gstin: vendorId.toUpperCase() }]
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const actualVendorId = vendor.id;

    // 1. Instruments
    const instruments = await db.collection('instruments').find({ vendor_id: actualVendorId }).toArray();
    const todayStr = new Date().toISOString().split('T')[0];
    const enrichedInstruments = instruments.map(inst => ({
      ...inst,
      is_expired: inst.expiry_date ? inst.expiry_date < todayStr : false
    }));

    // 2. Appointments
    const appointments = await db.collection('appointments').find({ vendor_id: actualVendorId }).sort({ preferred_date: -1 }).toArray();
    const enrichedAppointments = await Promise.all(appointments.map(async a => {
      const insp = a.inspector_id ? await db.collection('inspectors').findOne({ id: a.inspector_id }) : null;
      return {
        ...a,
        inspector_name: insp?.full_name || null,
        inspector_gov_id: insp?.gov_id || null
      };
    }));

    // 3. Certificates
    const instrumentIds = instruments.map(i => i.id);
    const certificates = await db.collection('verification_logs').find({
      $or: [
        { instrument_id: { $in: instrumentIds } },
        { instrumentId: { $in: instrumentIds } }
      ]
    }).sort({ verified_at: -1 }).toArray();

    // 4. Complaints involving this vendor
    const complaints = await db.collection('complaints').find({
      vendorId: actualVendorId
    }).sort({ createdAt: -1 }).toArray();

    res.json({
      vendor: {
        id: vendor.id,
        gstin: vendor.gstin,
        business_name: vendor.business_name,
        owner_name: vendor.owner_name,
        phone: vendor.phone,
        email: vendor.email,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        is_verified: vendor.is_verified,
        created_at: vendor.created_at
      },
      instruments: enrichedInstruments,
      appointments: enrichedAppointments,
      certificates,
      complaints
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/inspectors ────────────────────────────────────────────────
router.get('/inspectors', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const inspectors = await db.collection('inspectors').find({}).sort({ full_name: 1 }).toArray();
    const sanitized = inspectors.map(ins => {
      const { password_hash, otp, otp_expires_at, ...safe } = ins;
      return safe;
    });
    res.json({ inspectors: sanitized });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/inspectors/:id (Full Inspector Profile) ────────────────────
router.get('/inspectors/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const inspectorId = req.params.id;

    const inspector = await db.collection('inspectors').findOne({
      $or: [{ id: inspectorId }, { gov_id: inspectorId.toUpperCase() }]
    });

    if (!inspector) {
      return res.status(404).json({ error: 'Inspector not found' });
    }

    const actualInspectorId = inspector.id;

    // 1. Assigned / completed visits
    const visits = await db.collection('appointments').find({
      $or: [{ inspector_id: actualInspectorId }, { inspectorId: actualInspectorId }]
    }).sort({ preferred_date: -1 }).toArray();

    const enrichedVisits = await Promise.all(visits.map(async v => {
      const vend = v.vendor_id ? await db.collection('vendors').findOne({ id: v.vendor_id }) : null;
      const inst = v.instrument_id ? await db.collection('instruments').findOne({ id: v.instrument_id }) : null;
      return {
        ...v,
        business_name: vend?.business_name || null,
        vendor_phone: vend?.phone || null,
        instrument_make: inst?.make || null,
        instrument_model: inst?.model || null
      };
    }));

    // 2. Verification history
    const verifications = await db.collection('verification_logs').find({
      $or: [{ inspector_id: actualInspectorId }, { inspectorId: actualInspectorId }]
    }).sort({ verified_at: -1 }).toArray();

    // 3. Complaints filed against this inspector
    const complaints = await db.collection('complaints').find({
      inspectorId: actualInspectorId
    }).sort({ createdAt: -1 }).toArray();

    const { password_hash, otp, otp_expires_at, ...safeInspector } = inspector;

    res.json({
      inspector: safeInspector,
      visits: enrichedVisits,
      verifications,
      complaints
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/inspectors ───────────────────────────────────────────────
router.post('/inspectors', adminAuth, async (req, res, next) => {
  try {
    const { gov_id, full_name, department, designation, zone, phone, email, password, baseLatitude, baseLongitude, base_latitude, base_longitude } = req.body;
    if (!gov_id || !full_name || !password) {
      return res.status(400).json({ error: 'gov_id, full_name, and password are required' });
    }

    const db = getDb();
    const existing = await db.collection('inspectors').findOne({ gov_id: gov_id.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ error: 'Government ID already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newInspector = {
      id: `ins-${Date.now()}`,
      gov_id: gov_id.trim().toUpperCase(),
      full_name,
      department: department || 'Legal Metrology Department',
      designation: designation || 'Inspector',
      zone: zone || 'General',
      phone: phone || null,
      email: email || null,
      baseLatitude: Number(baseLatitude ?? base_latitude) || null,
      baseLongitude: Number(baseLongitude ?? base_longitude) || null,
      base_latitude: Number(baseLatitude ?? base_latitude) || null,
      base_longitude: Number(baseLongitude ?? base_longitude) || null,
      password_hash,
      is_active: true,
      created_at: new Date()
    };

    await db.collection('inspectors').insertOne(newInspector);

    const { password_hash: _, ...safe } = newInspector;
    res.status(201).json({ inspector: safe });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/expiry-defaulters ─────────────────────────────────────────
// Vendors who have at least one instrument where expiry_date is in the past AND
// there is no appointment for that instrument with status PENDING or CONFIRMED and a future/current date
router.get('/expiry-defaulters', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch all instruments with an expiry_date in the past
    const allInstruments = await db.collection('instruments').find({}).toArray();
    const expiredInstruments = allInstruments.filter(inst => {
      if (!inst.expiry_date) return false;
      return String(inst.expiry_date).split('T')[0] < todayStr;
    });

    // 2. Fetch future/current active appointments (PENDING or CONFIRMED on or after today)
    const allAppointments = await db.collection('appointments').find({
      status: { $in: ['PENDING', 'CONFIRMED'] }
    }).toArray();

    const coveredInstrumentIds = new Set();
    for (const app of allAppointments) {
      const appDate = String(app.preferred_date || app.preferredDate || '').split('T')[0];
      if (appDate >= todayStr && app.instrument_id) {
        coveredInstrumentIds.add(String(app.instrument_id));
      }
    }

    // 3. Find delinquent instruments (expired + not covered by active future appointment)
    const delinquentInstruments = expiredInstruments.filter(inst => !coveredInstrumentIds.has(String(inst.id)));

    // 4. Group delinquent instruments by vendor
    const vendorMap = new Map();
    for (const inst of delinquentInstruments) {
      const vId = inst.vendor_id;
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, []);
      }
      vendorMap.get(vId).push(inst);
    }

    const defaulters = [];
    for (const [vendorId, defaultInstruments] of vendorMap.entries()) {
      const vendor = await db.collection('vendors').findOne({ id: vendorId });
      if (vendor) {
        defaulters.push({
          vendor: {
            id: vendor.id,
            gstin: vendor.gstin,
            business_name: vendor.business_name,
            owner_name: vendor.owner_name,
            phone: vendor.phone,
            address: vendor.address,
            city: vendor.city
          },
          expired_instruments_count: defaultInstruments.length,
          instruments: defaultInstruments.map(i => ({
            id: i.id,
            make: i.make,
            model: i.model,
            serial_no: i.serial_no,
            instrument_type: i.instrument_type,
            expiry_date: i.expiry_date,
            status: i.status
          }))
        });
      }
    }

    res.json({
      defaulters,
      total_defaulter_vendors: defaulters.length,
      total_delinquent_instruments: delinquentInstruments.length,
      as_of_date: todayStr
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/complaints ─────────────────────────────────────────────────
router.get('/complaints', adminAuth, async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const db = getDb();

    const filter = {};
    if (status) filter.status = String(status).toUpperCase();
    if (type) filter.type = String(type).toUpperCase();

    const complaints = await db.collection('complaints').find(filter).sort({ createdAt: -1 }).toArray();

    // Enrich complaints with vendor, inspector, and instrument names
    const enriched = await Promise.all(complaints.map(async c => {
      const vend = c.vendorId ? await db.collection('vendors').findOne({ id: c.vendorId }) : null;
      const insp = c.inspectorId ? await db.collection('inspectors').findOne({ id: c.inspectorId }) : null;
      const inst = c.instrumentId ? await db.collection('instruments').findOne({ id: c.instrumentId }) : null;

      return {
        ...c,
        vendor_business_name: vend?.business_name || null,
        vendor_phone: vend?.phone || null,
        inspector_name: insp?.full_name || null,
        inspector_gov_id: insp?.gov_id || null,
        instrument_make: inst?.make || null,
        instrument_serial_no: inst?.serial_no || null
      };
    }));

    res.json({ complaints: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/complaints/:id ──────────────────────────────────────────
router.patch('/complaints/:id', adminAuth, async (req, res, next) => {
  try {
    const { status, adminNotes, notes } = req.body;
    const updateNotes = adminNotes || notes;

    const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED'];
    if (status && !validStatuses.includes(String(status).toUpperCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const db = getDb();
    const updateObj = { updatedAt: new Date() };
    if (status) updateObj.status = String(status).toUpperCase();
    if (updateNotes !== undefined) updateObj.adminNotes = updateNotes;

    const updated = await db.collection('complaints').findOneAndUpdate(
      { id: req.params.id },
      { $set: updateObj },
      { returnDocument: 'after' }
    );

    const doc = updated?.value || updated;
    if (!doc) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ message: 'Complaint updated successfully', complaint: doc });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/appointments/:id/assign ─────────────────────────────────
// Manual fallback path
router.patch('/appointments/:id/assign', adminAuth, async (req, res, next) => {
  try {
    const { inspector_id, inspectorId } = req.body;
    const targetInspectorId = inspector_id || inspectorId;
    if (!targetInspectorId) return res.status(400).json({ error: 'Inspector ID is required' });

    const db = getDb();
    const inspector = await db.collection('inspectors').findOne({ id: targetInspectorId });
    if (!inspector) return res.status(404).json({ error: 'Inspector not found' });

    const updated = await db.collection('appointments').findOneAndUpdate(
      { id: req.params.id },
      { $set: { inspector_id: targetInspectorId, inspectorId: targetInspectorId, status: 'CONFIRMED', updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    const doc = updated?.value || updated;
    if (!doc) return res.status(404).json({ error: 'Appointment not found' });

    res.json({ message: 'Appointment assigned successfully', appointment: doc });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/appointments ──────────────────────────────────────────────
router.get('/appointments', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const appointments = await db.collection('appointments').find({}).sort({ preferred_date: -1 }).toArray();

    const enriched = await Promise.all(appointments.map(async a => {
      const vend = a.vendor_id ? await db.collection('vendors').findOne({ id: a.vendor_id }) : null;
      const inst = a.instrument_id ? await db.collection('instruments').findOne({ id: a.instrument_id }) : null;
      const insp = (a.inspector_id || a.inspectorId) ? await db.collection('inspectors').findOne({ id: a.inspector_id || a.inspectorId }) : null;

      return {
        ...a,
        business_name: vend?.business_name || null,
        vendor_phone: vend?.phone || null,
        make: inst?.make || null,
        model: inst?.model || null,
        serial_no: inst?.serial_no || null,
        inspector_name: insp?.full_name || null
      };
    }));

    res.json({ appointments: enriched });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
