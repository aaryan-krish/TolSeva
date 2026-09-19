const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// ── GET /api/public/verify/:certificateId ────────────────────────────────────
// Public, unauthenticated verification endpoint
router.get('/verify/:certificateId', async (req, res, next) => {
  try {
    const certParam = decodeURIComponent(req.params.certificateId).trim();
    const db = getDb();

    // Look up by certificate_no or id (case-insensitive regex)
    let log = await db.collection('verification_logs').findOne({
      $or: [
        { certificate_no: certParam },
        { certificateNo: certParam },
        { id: certParam },
        { certificate_no: new RegExp(`^${certParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!log) {
      return res.status(404).json({
        error: 'Verification certificate not found in the official registry',
        status: 'INVALID',
        certificate_id: certParam
      });
    }

    // Retrieve instrument
    const instId = log.instrument_id || log.instrumentId;
    const instrument = instId ? await db.collection('instruments').findOne({ id: instId }) : null;

    // Retrieve vendor for business name
    const vendorId = instrument?.vendor_id || log.vendor_id;
    const vendor = vendorId ? await db.collection('vendors').findOne({ id: vendorId }) : null;

    // Retrieve inspector designation / gov_id
    const inspectorId = log.inspector_id || log.inspectorId;
    const inspector = inspectorId ? await db.collection('inspectors').findOne({ id: inspectorId }) : null;

    // Determine computed validity status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validUntilDate = log.valid_until || log.validUntil ? new Date(log.valid_until || log.validUntil) : null;
    let computedStatus = 'VALID';

    if (!validUntilDate || validUntilDate < today) {
      computedStatus = 'EXPIRED';
    } else if (String(log.test_result).toUpperCase() === 'FAIL') {
      computedStatus = 'FAILED';
    }

    // Sanitize response: return ONLY public verification data (no personal owner names, phones, OTPs, or full addresses)
    res.json({
      certificate_no: log.certificate_no || log.certificateNo || log.id,
      status: computedStatus,
      verified_date: log.verified_at ? new Date(log.verified_at).toISOString().split('T')[0] : null,
      valid_until: log.valid_until || log.validUntil || null,
      test_result: log.test_result || 'PASS',
      instrument: instrument ? {
        make: instrument.make,
        model: instrument.model,
        serial_no: instrument.serial_no,
        instrument_type: instrument.instrument_type,
        capacity: instrument.capacity,
        unit: instrument.unit
      } : null,
      business: {
        name: vendor?.business_name || 'Registered Establishment',
        city: vendor?.city || null,
        state: vendor?.state || null
      },
      inspector: {
        gov_id: inspector?.gov_id || 'Authorized Officer',
        designation: inspector?.designation || 'Legal Metrology Inspector'
      },
      qr_payload: log.qr_payload || null
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/public/complaints ──────────────────────────────────────────────
// Unauthenticated complaint from the public verification page
router.post('/complaints', async (req, res, next) => {
  try {
    const {
      certificateId,
      certificate_id,
      instrumentId,
      instrument_id,
      category,
      description,
      evidenceUrl,
      evidence_url
    } = req.body;

    const certRef = (certificateId || certificate_id || '').trim();
    const instRef = (instrumentId || instrument_id || '').trim();

    if (!certRef && !instRef) {
      return res.status(400).json({ error: 'Either certificateId or instrumentId must be referenced' });
    }

    if (!category || !description) {
      return res.status(400).json({ error: 'Complaint category and description are required' });
    }

    const db = getDb();
    let log = null;
    let instrument = null;

    // Validate certificate if provided
    if (certRef) {
      log = await db.collection('verification_logs').findOne({
        $or: [
          { certificate_no: certRef },
          { certificateNo: certRef },
          { id: certRef },
          { certificate_no: new RegExp(`^${certRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        ]
      });
    }

    // Validate instrument if provided or derived from log
    const targetInstId = instRef || (log ? (log.instrument_id || log.instrumentId) : null);
    if (targetInstId) {
      instrument = await db.collection('instruments').findOne({
        $or: [{ id: targetInstId }, { serial_no: targetInstId }]
      });
    }

    // Ensure at least one referenced record exists in the system
    if (!log && !instrument) {
      return res.status(404).json({
        error: 'Referenced certificate or instrument was not found in the Legal Metrology registry'
      });
    }

    const vendorId = instrument?.vendor_id || null;
    const inspectorId = log?.inspector_id || log?.inspectorId || null;

    const newComplaint = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PUBLIC_ABOUT_INSTRUMENT',
      vendorId: vendorId,
      inspectorId: inspectorId,
      instrumentId: instrument?.id || null,
      certificateId: log?.certificate_no || log?.id || certRef || null,
      appointmentId: log?.appointment_id || null,
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
      message: 'Public complaint filed successfully. Legal Metrology Department will review this report.',
      complaint_id: newComplaint.id,
      status: newComplaint.status
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
