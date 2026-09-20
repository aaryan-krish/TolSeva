const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, getDb } = require('../config/db');
const { signToken } = require('../utils/jwt');
const { generateOtp, getOtpExpiry, sendOtp, isDemoMode, isLocalRequest } = require('../utils/otp');

// Helper to normalize phone numbers to last 10 digits
function normalizePhone(p) {
  if (!p) return '';
  return String(p).trim().replace(/\D/g, '').slice(-10);
}

// ── VENDOR: Request OTP ──────────────────────────────────────────────────────
router.post('/vendor/request-otp', async (req, res, next) => {
  try {
    const { gstin, phone } = req.body;
    if (!gstin || !phone) {
      return res.status(400).json({ error: 'GSTIN and mobile phone number are required' });
    }

    const cleanGstin = String(gstin).trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    // Generic error message to prevent data harvesting / enumeration
    const genericMismatchError = 'GSTIN and mobile number do not match our records';

    // 1. Look up the vendor by gstin
    const db = getDb();
    let vendor = await db.collection('vendors').findOne({ gstin: cleanGstin });

    if (!vendor) {
      const qRes = await query('SELECT * FROM vendors WHERE gstin = $1', [cleanGstin]);
      vendor = qRes.rows[0];
    }

    if (!vendor) {
      return res.status(404).json({ error: genericMismatchError });
    }

    // 2. Verify phone matches vendor's registered phone
    const registeredPhone = normalizePhone(vendor.phone);
    if (!registeredPhone || registeredPhone !== cleanPhone) {
      return res.status(400).json({ error: genericMismatchError });
    }

    // 3. Generate and store OTP (with expiry)
    const localDemoOtp = isDemoMode() && isLocalRequest(req);
    const otp = generateOtp(localDemoOtp);
    const otpExpiry = getOtpExpiry(10);

    await db.collection('vendors').updateOne(
      { id: vendor.id },
      { $set: { otp, otp_expires_at: otpExpiry, updated_at: new Date() } }
    );
    await query(
      'UPDATE vendors SET otp = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, otpExpiry, vendor.id]
    );

    // 4. Dispatch SMS or log in demo mode
    await sendOtp(cleanPhone, otp, localDemoOtp);

    const maskedPhone = cleanPhone.length >= 4
      ? '*'.repeat(cleanPhone.length - 4) + cleanPhone.slice(-4)
      : cleanPhone;

    res.json({
      message: `OTP sent successfully to registered mobile ending in ${maskedPhone.slice(-4)}`,
      phone_masked: maskedPhone,
      gstin: cleanGstin,
      ...(localDemoOtp ? { dev_otp: '123456', demo_mode: true } : {}),
      ...(process.env.OTP_DEBUG === 'true' ? { dev_otp: otp, debug_mode: true } : {})
    });
  } catch (err) {
    next(err);
  }
});

// ── VENDOR: Verify OTP ───────────────────────────────────────────────────────
router.post('/vendor/verify-otp', async (req, res, next) => {
  try {
    const { gstin, phone, otp } = req.body;
    if (!gstin || !otp) {
      return res.status(400).json({ error: 'GSTIN and OTP are required' });
    }

    const cleanGstin = String(gstin).trim().toUpperCase();
    const cleanOtp = String(otp).trim();
    const cleanPhone = phone ? normalizePhone(phone) : null;

    const db = getDb();
    let vendor = await db.collection('vendors').findOne({ gstin: cleanGstin });

    if (!vendor) {
      const result = await query('SELECT * FROM vendors WHERE gstin = $1', [cleanGstin]);
      vendor = result.rows[0];
    }

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found with this GSTIN' });
    }

    // Validate phone pairing if provided
    if (cleanPhone) {
      const regPhone = normalizePhone(vendor.phone);
      if (regPhone && regPhone !== cleanPhone) {
        return res.status(401).json({ error: 'Mobile number does not match registered vendor records' });
      }
    }

    // Validate OTP (with DEMO_MODE fixed OTP bypass)
    const demoActive = isDemoMode() && isLocalRequest(req);
    const isDemoOtp = demoActive && cleanOtp === '123456';
    const isStoredOtpValid = vendor.otp && String(vendor.otp).trim() === cleanOtp;

    if (!isDemoOtp && !isStoredOtpValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    if (!demoActive && vendor.otp_expires_at && new Date() > new Date(vendor.otp_expires_at)) {
      return res.status(401).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Mark verified, clear OTP
    await db.collection('vendors').updateOne(
      { id: vendor.id },
      { $set: { is_verified: true, otp: null, otp_expires_at: null, updated_at: new Date() } }
    );
    await query(
      'UPDATE vendors SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE id = $1',
      [vendor.id]
    );

    const token = signToken({
      id: vendor.id,
      role: 'vendor',
      gstin: vendor.gstin,
      name: vendor.business_name
    });

    res.json({
      message: 'Login successful',
      token,
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        owner_name: vendor.owner_name,
        gstin: vendor.gstin,
        phone: vendor.phone,
        address: vendor.address,
        latitude: vendor.latitude,
        longitude: vendor.longitude
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── INSPECTOR: Login ─────────────────────────────────────────────────────────
router.post('/inspector/login', async (req, res, next) => {
  try {
    const { gov_id, password } = req.body;
    if (!gov_id || !password) return res.status(400).json({ error: 'Government ID and password are required' });

    const cleanGovId = String(gov_id).trim().toUpperCase();
    const result = await query('SELECT * FROM inspectors WHERE gov_id = $1', [cleanGovId]);
    const inspector = result.rows[0];
    if (!inspector) return res.status(401).json({ error: 'Invalid credentials' });
    if (inspector.is_active === false) return res.status(403).json({ error: 'Account suspended. Contact admin.' });

    const isValid = await bcrypt.compare(password, inspector.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({
      id: inspector.id,
      role: 'inspector',
      gov_id: inspector.gov_id,
      name: inspector.full_name,
      zone: inspector.zone
    });

    res.json({
      message: 'Login successful',
      token,
      inspector: {
        id: inspector.id,
        full_name: inspector.full_name,
        gov_id: inspector.gov_id,
        zone: inspector.zone,
        designation: inspector.designation,
        baseLatitude: inspector.baseLatitude ?? inspector.base_latitude,
        baseLongitude: inspector.baseLongitude ?? inspector.base_longitude
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: Login ─────────────────────────────────────────────────────────────
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const result = await query('SELECT * FROM admins WHERE username = $1', [username.trim()]);
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: admin.id, role: 'admin', username: admin.username, name: admin.full_name });
    res.json({ message: 'Login successful', token, admin: { id: admin.id, username: admin.username, full_name: admin.full_name } });
  } catch (err) {
    next(err);
  }
});

// ── RESET PASSWORD: Request OTP (Inspector & Admin) ───────────────
router.post('/reset-password/request-otp', async (req, res, next) => {
  try {
    const { role, identifier } = req.body;
    if (!role || !identifier) {
      return res.status(400).json({ error: 'Role and identifier (Username / Gov ID / Mobile) are required' });
    }

    if (!['inspector', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Password reset is only applicable for Inspector and Admin' });
    }

    let user = null;
    let phone = null;

    if (role === 'inspector') {
      const result = await query(
        'SELECT * FROM inspectors WHERE (gov_id = $1 OR phone = $1)',
        [identifier.trim()]
      );
      user = result.rows[0];
      if (!user) {
        return res.status(404).json({ error: 'No inspector account found with this ID or Mobile number' });
      }
      if (user.is_active === false) {
        return res.status(403).json({ error: 'Account is deactivated. Please contact your department admin.' });
      }
      phone = user.phone || '9876500001';
    } else if (role === 'admin') {
      const result = await query(
        'SELECT * FROM admins WHERE (username = $1 OR phone = $1)',
        [identifier.trim()]
      );
      user = result.rows[0];
      if (!user) {
        return res.status(404).json({ error: 'No administrator account found with this Username or Mobile number' });
      }
      phone = user.phone || '9876500000';
    }

    const otp = generateOtp();
    const otpExpiry = getOtpExpiry(10);

    if (role === 'inspector') {
      await query(
        'UPDATE inspectors SET otp = $1, otp_expires_at = $2 WHERE id = $3',
        [otp, otpExpiry, user.id]
      );
    } else {
      await query(
        'UPDATE admins SET otp = $1, otp_expires_at = $2 WHERE id = $3',
        [otp, otpExpiry, user.id]
      );
    }

    await sendOtp(phone, otp);

    const maskedPhone = phone.length >= 4 
      ? '*'.repeat(Math.max(0, phone.length - 4)) + phone.slice(-4)
      : phone;

    res.json({
      message: `OTP sent successfully to registered mobile ending in ${maskedPhone.slice(-4)}`,
      phone_masked: maskedPhone,
      role,
      identifier: identifier.trim(),
      ...(isDemoMode() ? { dev_otp: '123456', demo_mode: true } : (process.env.NODE_ENV === 'development' && { dev_otp: otp }))
    });
  } catch (err) {
    next(err);
  }
});

// ── RESET PASSWORD: Verify OTP and Set New Password ───────────────
router.post('/reset-password/verify', async (req, res, next) => {
  try {
    const { role, identifier, otp, new_password } = req.body;
    if (!role || !identifier || !otp || !new_password) {
      return res.status(400).json({ error: 'Role, identifier, OTP, and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    let user = null;
    if (role === 'inspector') {
      const result = await query(
        'SELECT * FROM inspectors WHERE (gov_id = $1 OR phone = $1)',
        [identifier.trim()]
      );
      user = result.rows[0];
    } else if (role === 'admin') {
      const result = await query(
        'SELECT * FROM admins WHERE (username = $1 OR phone = $1)',
        [identifier.trim()]
      );
      user = result.rows[0];
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const demoActive = isDemoMode();
    const isDemoOtp = demoActive && String(otp).trim() === '123456';
    const isStoredOtpValid = user.otp && String(user.otp).trim() === String(otp).trim();

    if (!isDemoOtp && !isStoredOtpValid) {
      return res.status(401).json({ error: 'Invalid or incorrect OTP' });
    }

    if (!demoActive && user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    if (role === 'inspector') {
      await query(
        'UPDATE inspectors SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2',
        [passwordHash, user.id]
      );
    } else {
      await query(
        'UPDATE admins SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2',
        [passwordHash, user.id]
      );
    }

    res.json({
      message: 'Password reset successfully! You can now log in with your new password.',
      success: true
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
