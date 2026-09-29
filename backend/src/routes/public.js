const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { generateOtp, getOtpExpiry, sendOtp, isDemoMode, verifyOtpValue } = require('../utils/otp');

// Helper to normalize phone to 10 digits
function normalizePhone(p) {
  if (!p) return '';
  return String(p).trim().replace(/\D/g, '').slice(-10);
}

// ── GET /api/public/verify/:certificateId ────────────────────────────────────
// Public verification endpoint
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

    // Retrieve vendor
    const vendorId = instrument?.vendor_id || log.vendor_id;
    const vendor = vendorId ? await db.collection('vendors').findOne({ id: vendorId }) : null;

    // Retrieve inspector
    const inspectorId = log.inspector_id || log.inspectorId;
    const inspector = inspectorId ? await db.collection('inspectors').findOne({
      $or: [{ id: inspectorId }, { gov_id: inspectorId }]
    }) : null;

    // Determine computed validity status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validUntilDate = log.valid_until || log.validUntil ? new Date(log.valid_until || log.validUntil) : null;
    let computedStatus = 'VALID';

    if (log.is_current === false) {
      computedStatus = 'SUPERSEDED';
    } else if (String(log.test_result).toUpperCase() === 'FAIL') {
      computedStatus = 'FAILED';
    } else if (!validUntilDate || validUntilDate < today) {
      computedStatus = 'EXPIRED';
    }

    res.json({
      certificate_no: log.certificate_no || log.certificateNo || log.id,
      status: computedStatus,
      verified_date: log.verified_at ? new Date(log.verified_at).toISOString().split('T')[0] : null,
      valid_until: log.valid_until || log.validUntil || null,
      test_result: log.test_result || 'PASS',
      instrument: instrument ? {
        id: instrument.id,
        make: instrument.make,
        model: instrument.model,
        serial_no: instrument.serial_no,
        instrument_type: instrument.instrument_type,
        capacity: instrument.capacity,
        unit: instrument.unit
      } : null,
      business: {
        id: vendor?.id || null,
        name: vendor?.business_name || 'Registered Establishment',
        owner_name: vendor?.owner_name || null,
        gstin: vendor?.gstin || null,
        city: vendor?.city || null,
        state: vendor?.state || null,
        address: vendor?.address || null,
        phone: vendor?.phone || null
      },
      inspector: {
        id: inspector?.id || null,
        name: inspector?.full_name || 'Legal Metrology Officer',
        gov_id: inspector?.gov_id || 'Authorized Officer',
        designation: inspector?.designation || 'Legal Metrology Inspector',
        zone: inspector?.zone || null
      },
      qr_payload: log.qr_payload || null
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/public/request-otp ─────────────────────────────────────────────
// Citizen requests OTP before filing a complaint
router.post('/request-otp', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name' });
    }

    const demoActive = isDemoMode();
    const otp = generateOtp(demoActive);
    const otpExpiry = getOtpExpiry(10);
    const db = getDb();

    // Store in citizen_otps collection
    await db.collection('citizen_otps').updateOne(
      { phone: cleanPhone },
      {
        $set: {
          phone: cleanPhone,
          name: String(name).trim(),
          otp: otp,
          otp_expires_at: otpExpiry,
          is_verified: false,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    await sendOtp(cleanPhone, otp, demoActive);

    const maskedPhone = cleanPhone.length >= 4
      ? '*'.repeat(cleanPhone.length - 4) + cleanPhone.slice(-4)
      : cleanPhone;

    res.json({
      message: `OTP sent successfully to ${maskedPhone}`,
      phone_masked: maskedPhone,
      phone: cleanPhone,
      ...(demoActive ? { dev_otp: '123456', demo_mode: true } : {}),
      ...(process.env.OTP_DEBUG === 'true' ? { dev_otp: otp, debug_mode: true } : {})
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/public/verify-otp ──────────────────────────────────────────────
// Verify citizen mobile OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = normalizePhone(phone);
    const cleanOtp = String(otp || '').trim();

    if (!cleanPhone || !cleanOtp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const db = getDb();
    const record = await db.collection('citizen_otps').findOne({ phone: cleanPhone });

    const demoActive = isDemoMode();
    const isDemoMatch = demoActive && cleanOtp === '123456';
    const isRecordMatch = record && String(record.otp).trim() === cleanOtp;

    if (!isDemoMatch && !isRecordMatch) {
      return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
    }

    if (!demoActive && record?.otp_expires_at && new Date() > new Date(record.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    await db.collection('citizen_otps').updateOne(
      { phone: cleanPhone },
      { $set: { is_verified: true, verified_at: new Date() } }
    );

    res.json({
      success: true,
      message: 'Mobile number verified successfully'
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/public/complaints ──────────────────────────────────────────────
// Complaint filed by citizen after OTP verification
router.post('/complaints', async (req, res, next) => {
  try {
    const {
      certificateId,
      certificate_id,
      instrumentId,
      instrument_id,
      vendorId,
      citizen_name,
      citizen_phone,
      otp,
      category,
      description
    } = req.body;

    const certRef = (certificateId || certificate_id || '').trim();
    const instRef = (instrumentId || instrument_id || '').trim();
    const cleanPhone = normalizePhone(citizen_phone);
    const cleanName = String(citizen_name || '').trim();

    if (!cleanName || !cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Customer Name and 10-digit Mobile number are required' });
    }

    if (!category || !description) {
      return res.status(400).json({ error: 'Complaint reason and description are required' });
    }

    const db = getDb();

    // Verify OTP status
    const demoActive = isDemoMode();
    const citizenRecord = await db.collection('citizen_otps').findOne({ phone: cleanPhone });
    const isVerifiedAlready = citizenRecord?.is_verified === true;
    const isDirectOtpMatch = demoActive && String(otp).trim() === '123456';
    const isStoredOtpMatch = citizenRecord && String(citizenRecord.otp).trim() === String(otp).trim();

    if (!isVerifiedAlready && !isDirectOtpMatch && !isStoredOtpMatch) {
      return res.status(400).json({ error: 'Mobile number must be verified with OTP before filing a complaint' });
    }

    let log = null;
    let instrument = null;

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

    const targetInstId = instRef || (log ? (log.instrument_id || log.instrumentId) : null);
    if (targetInstId) {
      instrument = await db.collection('instruments').findOne({
        $or: [{ id: targetInstId }, { serial_no: targetInstId }]
      });
    }

    const finalVendorId = vendorId || instrument?.vendor_id || log?.vendor_id || null;
    const finalInspectorId = log?.inspector_id || log?.inspectorId || null;

    const newComplaint = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PUBLIC_ABOUT_INSTRUMENT',
      vendorId: finalVendorId,
      inspectorId: finalInspectorId,
      instrumentId: instrument?.id || targetInstId || null,
      certificateId: log?.certificate_no || certRef || null,
      appointmentId: log?.appointment_id || null,
      complainant_name: cleanName,
      complainant_phone: cleanPhone,
      complainant_verified: true,
      category: String(category).trim(),
      description: String(description).trim(),
      status: 'OPEN',
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('complaints').insertOne(newComplaint);

    res.status(201).json({
      message: 'Complaint submitted successfully! Your report has been dispatched to the Legal Metrology Department.',
      complaint_id: newComplaint.id,
      status: newComplaint.status
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
