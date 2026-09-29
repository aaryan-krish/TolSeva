const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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
        name: vendor?.business_name || 'Registered Establishment',
        city: vendor?.city || null,
        state: vendor?.state || null
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

    const smsResult = await sendOtp(cleanPhone, otp, demoActive);

    const maskedPhone = cleanPhone.length >= 4
      ? '*'.repeat(cleanPhone.length - 4) + cleanPhone.slice(-4)
      : cleanPhone;

    res.json({
      message: `OTP sent successfully to ${maskedPhone}`,
      phone_masked: maskedPhone,
      phone: cleanPhone,
      provider: smsResult?.provider || (demoActive ? 'demo' : 'sms'),
      ...(demoActive ? { dev_otp: '123456', dev_mode: true, demo_mode: true } : {}),
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

    const secureId = `cmp-${crypto.randomBytes(16).toString('hex')}`;

    const newComplaint = {
      id: secureId,
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

// ── POST /api/public/complaints/track/request-otp ───────────────────────────
// Request OTP verification code before tracking a complaint
router.post('/complaints/track/request-otp', async (req, res, next) => {
  try {
    const { trackingId, phone } = req.body;
    const rawId = decodeURIComponent(trackingId || '').trim();

    if (!rawId) {
      return res.status(400).json({ error: 'Please enter a valid Complaint Tracking ID' });
    }

    const db = getDb();
    const complaint = await db.collection('complaints').findOne({
      $or: [
        { id: rawId },
        { id: new RegExp(`^${rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'No complaint found matching this Tracking ID. Please verify the ID from your submission receipt.'
      });
    }

    let targetPhone = normalizePhone(complaint.complainant_phone);
    if (!targetPhone && phone) {
      const cleanInput = normalizePhone(phone);
      if (cleanInput.length === 10) {
        targetPhone = cleanInput;
        await db.collection('complaints').updateOne(
          { _id: complaint._id },
          { $set: { complainant_phone: targetPhone } }
        );
      }
    }
    if (!targetPhone && complaint.vendorId) {
      const vendor = await db.collection('vendors').findOne({ id: complaint.vendorId });
      if (vendor?.phone) targetPhone = normalizePhone(vendor.phone);
    }

    if (!targetPhone || targetPhone.length !== 10) {
      return res.status(400).json({
        error: 'No registered contact phone number found for this complaint record. Please contact the helpdesk at 1800-11-4000.'
      });
    }

    if (phone) {
      const inputPhone = normalizePhone(phone);
      if (inputPhone && inputPhone !== targetPhone) {
        return res.status(400).json({
          error: 'Provided mobile number does not match the registered contact number for this complaint'
        });
      }
    }

    const demoActive = isDemoMode();
    const otp = generateOtp(demoActive);
    const otpExpiry = getOtpExpiry(10);

    // Save tracking OTP on complaint record
    await db.collection('complaints').updateOne(
      { _id: complaint._id },
      { $set: { tracking_otp: otp, tracking_otp_expires_at: otpExpiry } }
    );

    // Also update citizen_otps collection to reuse existing OTP flow
    await db.collection('citizen_otps').updateOne(
      { phone: targetPhone },
      {
        $set: {
          phone: targetPhone,
          otp: otp,
          otp_expires_at: otpExpiry,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    await sendOtp(targetPhone, otp, demoActive);

    const maskedPhone = targetPhone.length >= 4
      ? '*'.repeat(targetPhone.length - 4) + targetPhone.slice(-4)
      : targetPhone;

    res.json({
      success: true,
      message: `Verification code sent to registered mobile ending in ${maskedPhone.slice(-4)}`,
      phone_masked: maskedPhone,
      tracking_id: complaint.id,
      ...(demoActive ? { dev_otp: '123456', demo_mode: true } : {})
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/public/complaints/track/verify ─────────────────────────────────
// Verify OTP and return sanitized public complaint status
router.post('/complaints/track/verify', async (req, res, next) => {
  try {
    const { trackingId, otp } = req.body;
    const rawId = decodeURIComponent(trackingId || '').trim();
    const cleanOtp = String(otp || '').trim();

    if (!rawId) {
      return res.status(400).json({ error: 'Tracking ID is required' });
    }
    if (!cleanOtp) {
      return res.status(400).json({ error: 'Verification OTP code is required' });
    }

    const db = getDb();
    const complaint = await db.collection('complaints').findOne({
      $or: [
        { id: rawId },
        { id: new RegExp(`^${rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'No complaint found matching this Tracking ID'
      });
    }

    const targetPhone = normalizePhone(complaint.complainant_phone);
    const citizenRecord = targetPhone
      ? await db.collection('citizen_otps').findOne({ phone: targetPhone })
      : null;

    const demoActive = isDemoMode();
    const isDemoMatch = demoActive && cleanOtp === '123456';
    const isComplaintOtpMatch = complaint.tracking_otp && String(complaint.tracking_otp).trim() === cleanOtp;
    const isCitizenOtpMatch = citizenRecord && String(citizenRecord.otp).trim() === cleanOtp;

    if (!isDemoMatch && !isComplaintOtpMatch && !isCitizenOtpMatch) {
      return res.status(401).json({ error: 'Invalid verification code. Please check your phone or request a new OTP.' });
    }

    if (!demoActive && complaint.tracking_otp_expires_at && new Date() > new Date(complaint.tracking_otp_expires_at)) {
      return res.status(401).json({ error: 'Verification code has expired. Please request a new OTP.' });
    }

    // Clear tracking OTP after verification
    await db.collection('complaints').updateOne(
      { _id: complaint._id },
      { $unset: { tracking_otp: '', tracking_otp_expires_at: '' } }
    );

    // Return sanitized public tracking status (minimum useful information)
    res.json({
      id: complaint.id,
      status: complaint.status || 'OPEN',
      category: complaint.category || 'General Grievance',
      certificate_id: complaint.certificateId || null,
      created_at: complaint.createdAt,
      updated_at: complaint.updatedAt
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/public/complaints/track/:trackingId ─────────────────────────────
// Supports GET with query param ?otp=... or returns 401 requiring second-factor OTP
router.get('/complaints/track/:trackingId', async (req, res, next) => {
  try {
    const rawId = decodeURIComponent(req.params.trackingId || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Please enter a valid Complaint Tracking ID' });
    }

    const db = getDb();
    const complaint = await db.collection('complaints').findOne({
      $or: [
        { id: rawId },
        { id: new RegExp(`^${rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'No complaint found matching this Tracking ID. Please verify the ID from your submission receipt.'
      });
    }

    const targetPhone = normalizePhone(complaint.complainant_phone);
    const maskedPhone = targetPhone && targetPhone.length >= 4
      ? '*'.repeat(targetPhone.length - 4) + targetPhone.slice(-4)
      : 'registered mobile';

    const providedOtp = String(req.query.otp || req.headers['x-tracking-otp'] || '').trim();

    // If OTP is provided, verify it
    if (providedOtp) {
      const citizenRecord = targetPhone
        ? await db.collection('citizen_otps').findOne({ phone: targetPhone })
        : null;

      const demoActive = isDemoMode();
      const isDemoMatch = demoActive && providedOtp === '123456';
      const isComplaintOtpMatch = complaint.tracking_otp && String(complaint.tracking_otp).trim() === providedOtp;
      const isCitizenOtpMatch = citizenRecord && String(citizenRecord.otp).trim() === providedOtp;

      if (!isDemoMatch && !isComplaintOtpMatch && !isCitizenOtpMatch) {
        return res.status(401).json({
          error: 'Invalid verification code. Please check your phone or request a new OTP.',
          otp_required: true,
          tracking_id: complaint.id,
          phone_masked: maskedPhone
        });
      }

      if (!demoActive && complaint.tracking_otp_expires_at && new Date() > new Date(complaint.tracking_otp_expires_at)) {
        return res.status(401).json({
          error: 'Verification code has expired. Please request a new OTP.',
          otp_required: true,
          tracking_id: complaint.id,
          phone_masked: maskedPhone
        });
      }

      return res.json({
        id: complaint.id,
        status: complaint.status || 'OPEN',
        category: complaint.category || 'General Grievance',
        certificate_id: complaint.certificateId || null,
        created_at: complaint.createdAt,
        updated_at: complaint.updatedAt
      });
    }

    // Second factor verification is required
    return res.status(401).json({
      error: 'Second factor verification required. Please enter the OTP sent to your registered mobile.',
      otp_required: true,
      tracking_id: complaint.id,
      phone_masked: maskedPhone
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
