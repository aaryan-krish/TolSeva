const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { query, getDb } = require('../config/db');
const { findNearestAvailableInspector } = require('../utils/assignment');

const vendorAuth = authenticate(['vendor']);

// ── GET /api/vendor/machines ─────────────────────────────────────────────────
router.get('/machines', vendorAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const machines = await db.collection('instruments').find({ vendor_id: req.user.id }).sort({ expiry_date: 1 }).toArray();

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    const enriched = machines.map(i => {
      let expiryStatus = 'VALID';
      let daysUntilExpiry = null;

      if (i.expiry_date) {
        const expDate = new Date(i.expiry_date);
        const diffTime = expDate - today;
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          expiryStatus = 'EXPIRED';
        } else if (daysUntilExpiry <= 30) {
          expiryStatus = 'EXPIRING_SOON';
        } else if (daysUntilExpiry <= 90) {
          expiryStatus = 'APPROACHING';
        } else {
          expiryStatus = 'VALID';
        }
      }

      return {
        ...i,
        expiry_status: expiryStatus,
        days_until_expiry: daysUntilExpiry
      };
    });

    res.json({ machines: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/vendor/machines ─────────────────────────────────────────────────
router.post('/machines', vendorAuth, async (req, res, next) => {
  try {
    const { make, model, serial_no, instrument_type, capacity, unit, manufacture_year, installation_date, location_description } = req.body;
    if (!make || !model || !serial_no || !instrument_type) {
      return res.status(400).json({ error: 'Make, model, serial number, and type are required' });
    }

    const db = getDb();
    const existing = await db.collection('instruments').findOne({ serial_no });
    if (existing) {
      return res.status(409).json({ error: 'Serial number already registered' });
    }

    const newMachine = {
      id: `inst-${Date.now()}`,
      vendor_id: req.user.id,
      make,
      model,
      serial_no,
      instrument_type,
      capacity: capacity || '0',
      unit: unit || 'kg',
      manufacture_year: manufacture_year || new Date().getFullYear(),
      installation_date: installation_date || new Date().toISOString().split('T')[0],
      location_description: location_description || 'Main Premises',
      status: 'PENDING',
      expiry_date: null,
      last_verified_at: null,
      created_at: new Date()
    };

    await db.collection('instruments').insertOne(newMachine);
    res.status(201).json({ message: 'Instrument registered successfully', machine: newMachine });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/vendor/appointments ─────────────────────────────────────────────
router.get('/appointments', vendorAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const appointments = await db.collection('appointments').find({ vendor_id: req.user.id }).sort({ preferred_date: -1 }).toArray();

    // Enrich with instrument and inspector info
    const enriched = await Promise.all(appointments.map(async (a) => {
      const inst = a.instrument_id ? await db.collection('instruments').findOne({ id: a.instrument_id }) : null;
      const insp = a.inspector_id ? await db.collection('inspectors').findOne({ id: a.inspector_id }) : null;
      return {
        ...a,
        make: inst?.make || null,
        model: inst?.model || null,
        serial_no: inst?.serial_no || null,
        inspector_name: insp?.full_name || null,
        inspector_phone: insp?.phone || null,
        inspector_zone: insp?.zone || null
      };
    }));

    res.json({ appointments: enriched });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/vendor/appointments (with Auto-Assignment) ──────────────────────
router.post('/appointments', vendorAuth, async (req, res, next) => {
  try {
    const { instrument_id, preferred_date, preferred_time, purpose, vendor_notes } = req.body;
    if (!preferred_date || !purpose) {
      return res.status(400).json({ error: 'Preferred date and purpose are required' });
    }

    const db = getDb();
    const vendor = await db.collection('vendors').findOne({ id: req.user.id });

    // Fetch active inspectors and all existing appointments for collision checking
    const allInspectors = await db.collection('inspectors').find({ is_active: true }).toArray();
    const allAppointments = await db.collection('appointments').find({}).toArray();

    const vendorLat = vendor?.latitude ?? req.body.latitude;
    const vendorLng = vendor?.longitude ?? req.body.longitude;

    // Run auto-assignment based on Haversine distance and slot availability
    const assignmentResult = findNearestAvailableInspector({
      inspectors: allInspectors,
      appointments: allAppointments,
      vendorLatitude: vendorLat,
      vendorLongitude: vendorLng,
      preferredDate: preferred_date,
      preferredTime: preferred_time
    });

    const isAssigned = !!assignmentResult;
    const assignedInspectorId = isAssigned ? assignmentResult.inspector.id : null;
    const appointmentStatus = isAssigned ? 'CONFIRMED' : 'PENDING';

    const newAppointment = {
      id: `app-${Date.now()}`,
      vendor_id: req.user.id,
      instrument_id: instrument_id || null,
      inspector_id: assignedInspectorId,
      inspectorId: assignedInspectorId,
      preferred_date,
      preferred_time: preferred_time || 'MORNING',
      purpose,
      vendor_notes: vendor_notes || null,
      status: appointmentStatus,
      assigned_distance_km: isAssigned ? assignmentResult.distanceKm : null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('appointments').insertOne(newAppointment);

    res.status(201).json({
      message: isAssigned
        ? `Appointment confirmed! Auto-assigned nearest inspector: ${assignmentResult.inspector.full_name} (${assignmentResult.distanceKm} km away)`
        : 'Appointment booked successfully. Awaiting inspector assignment by admin.',
      appointment: newAppointment,
      auto_assigned: isAssigned,
      assigned_inspector: isAssigned ? {
        id: assignmentResult.inspector.id,
        full_name: assignmentResult.inspector.full_name,
        gov_id: assignmentResult.inspector.gov_id,
        distance_km: assignmentResult.distanceKm
      } : null
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/vendor/complaints (Vendor against Inspector) ────────────────────
router.post('/complaints', vendorAuth, async (req, res, next) => {
  try {
    const { inspectorId, inspector_id, appointmentId, appointment_id, category, description, evidenceUrl, evidence_url } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    const targetInspectorId = inspectorId || inspector_id || null;
    const targetAppId = appointmentId || appointment_id || null;

    const db = getDb();
    const newComplaint = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'VENDOR_AGAINST_INSPECTOR',
      vendorId: req.user.id,
      inspectorId: targetInspectorId,
      instrumentId: null,
      certificateId: null,
      appointmentId: targetAppId,
      category: String(category).trim(),
      description: String(description).trim(),
      evidenceUrl: evidenceUrl || evidence_url || null,
      status: 'OPEN',
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('complaints').insertOne(newComplaint);

    res.status(201).json({
      message: 'Complaint registered successfully and submitted for admin review.',
      complaint: newComplaint
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/vendor/complaints (Vendor's filed complaints) ────────────────────
router.get('/complaints', vendorAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const complaints = await db.collection('complaints').find({ vendorId: req.user.id }).sort({ createdAt: -1 }).toArray();
    res.json({ complaints });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
