const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { query, getDb } = require('../config/db');
const { buildCertificateQR, generateCertificateNo } = require('../utils/qrPayload');

const inspectorAuth = authenticate(['inspector']);

// ── GET /api/inspector/assigned-visits ───────────────────────────────────────
router.get('/assigned-visits', inspectorAuth, async (req, res, next) => {
  try {
    const { filter } = req.query; // 'expired' | 'approaching' | 'all'
    const db = getDb();

    const appointments = await db.collection('appointments').find({
      $or: [{ inspector_id: req.user.id }, { inspectorId: req.user.id }],
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    }).sort({ preferred_date: 1 }).toArray();

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    const visits = [];
    for (const a of appointments) {
      const inst = a.instrument_id ? await db.collection('instruments').findOne({ id: a.instrument_id }) : null;
      const vend = a.vendor_id ? await db.collection('vendors').findOne({ id: a.vendor_id }) : null;

      let expiryStatus = 'VALID';
      if (inst && inst.expiry_date) {
        const expDate = new Date(inst.expiry_date);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) expiryStatus = 'EXPIRED';
        else if (diffDays <= 30) expiryStatus = 'EXPIRING_SOON';
        else if (diffDays <= 90) expiryStatus = 'APPROACHING';
      }

      // Filter check
      if (filter === 'expired' && expiryStatus !== 'EXPIRED') continue;
      if (filter === 'approaching' && !['EXPIRING_SOON', 'APPROACHING'].includes(expiryStatus)) continue;

      visits.push({
        ...a,
        make: inst?.make || null,
        model: inst?.model || null,
        serial_no: inst?.serial_no || null,
        instrument_type: inst?.instrument_type || null,
        expiry_date: inst?.expiry_date || null,
        capacity: inst?.capacity || null,
        unit: inst?.unit || null,
        business_name: vend?.business_name || null,
        owner_name: vend?.owner_name || null,
        vendor_phone: vend?.phone || null,
        address: vend?.address || null,
        latitude: vend?.latitude || null,
        longitude: vend?.longitude || null,
        expiry_status: expiryStatus
      });
    }

    res.json({ visits, total: visits.length });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/inspector/verify ───────────────────────────────────────────────
router.post('/verify', inspectorAuth, async (req, res, next) => {
  try {
    const { appointment_id, appointmentId, instrument_id, instrumentId, test_result, testResult, observations, error_percentage, photo_url, valid_months } = req.body;
    const targetInstId = instrument_id || instrumentId;
    const targetAppId = appointment_id || appointmentId;
    const resultStatus = test_result || testResult;

    if (!targetInstId || !resultStatus) {
      return res.status(400).json({ error: 'Instrument ID and test result are required' });
    }

    const db = getDb();
    const instrument = await db.collection('instruments').findOne({ id: targetInstId });
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    // Generate certificate number
    const certNo = generateCertificateNo(req.user.gov_id);
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + (Number(valid_months) || 12));
    const validUntilStr = validUntil.toISOString().split('T')[0];

    // Build QR code with FULL public verification URL
    const { payload: qrPayload, qrDataUrl } = await buildCertificateQR({
      certificateNo: certNo,
      instrumentId: instrument.id,
      serialNo: instrument.serial_no,
      make: instrument.make,
      model: instrument.model,
      inspectorGovId: req.user.gov_id,
      testResult: resultStatus,
      verifiedAt: new Date().toISOString(),
      validUntil: validUntilStr
    });

    const newLog = {
      id: `log-${Date.now()}`,
      appointment_id: targetAppId || null,
      appointmentId: targetAppId || null,
      instrument_id: targetInstId,
      instrumentId: targetInstId,
      inspector_id: req.user.id,
      inspectorId: req.user.id,
      test_result: resultStatus,
      observations: observations || null,
      error_percentage: error_percentage != null ? Number(error_percentage) : null,
      photo_url: photo_url || null,
      qr_payload: qrPayload, // Full public URL
      certificate_no: certNo,
      certificateNo: certNo,
      valid_until: validUntilStr,
      validUntil: validUntilStr,
      verified_at: new Date()
    };

    await db.collection('verification_logs').insertOne(newLog);

    // Update instrument status and expiry date
    const newStatus = ['PASS', 'CONDITIONAL_PASS'].includes(resultStatus.toUpperCase()) ? 'ACTIVE' : 'SUSPENDED';
    await db.collection('instruments').updateOne(
      { id: targetInstId },
      {
        $set: {
          status: newStatus,
          last_verified_at: new Date(),
          expiry_date: validUntilStr,
          updated_at: new Date()
        }
      }
    );

    // Update appointment status if applicable
    if (targetAppId) {
      await db.collection('appointments').updateOne(
        { id: targetAppId },
        { $set: { status: 'COMPLETED', updated_at: new Date() } }
      );
    }

    res.status(201).json({
      message: 'Verification completed successfully',
      log: newLog,
      certificate_no: certNo,
      qr_payload: qrPayload,
      qr_data_url: qrDataUrl,
      valid_until: validUntilStr
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/inspector/certificate/:id ───────────────────────────────────────
router.get('/certificate/:id', inspectorAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const cert = await db.collection('verification_logs').findOne({
      $or: [{ id: req.params.id }, { certificate_no: req.params.id }],
      $or: [{ inspector_id: req.user.id }, { inspectorId: req.user.id }]
    });

    if (!cert) return res.status(404).json({ error: 'Certificate not found or unauthorized' });

    const instrument = await db.collection('instruments').findOne({ id: cert.instrument_id || cert.instrumentId });
    const vendor = instrument ? await db.collection('vendors').findOne({ id: instrument.vendor_id }) : null;

    res.json({
      certificate: {
        ...cert,
        make: instrument?.make || null,
        model: instrument?.model || null,
        serial_no: instrument?.serial_no || null,
        business_name: vendor?.business_name || null
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
