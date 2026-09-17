const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../utils/jwt');
const { generateOtp, getOtpExpiry, sendOtp } = require('../utils/otp');

// ── VENDOR: Request OTP ──────────────────────────────────────────────────────
router.post('/vendor/request-otp', async (req, res, next) => {
  try {
    const { gstin, phone, business_name, owner_name } = req.body;
    if (!gstin || !phone) return res.status(400).json({ error: 'GSTIN and phone are required' });

    // Validate GSTIN format (basic)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gstin)) return res.status(400).json({ error: 'Invalid GSTIN format' });

    const otp = generateOtp();
    const otpExpiry = getOtpExpiry(10);

    // Upsert vendor
    await query(
      `INSERT INTO vendors (gstin, phone, business_name, owner_name, otp, otp_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (gstin) DO UPDATE
       SET phone = $2, otp = $5, otp_expires_at = $6, updated_at = NOW()`,
      [gstin, phone, business_name || 'Business', owner_name || 'Owner', otp, otpExpiry]
    );

    await sendOtp(phone, otp);

    res.json({
      message: 'OTP sent successfully',
      // Always provide dev_otp for demo vendors or in non-production
      dev_otp: otp
    });
  } catch (err) {
    next(err);
  }
});

// ── VENDOR: Verify OTP ───────────────────────────────────────────────────────
router.post('/vendor/verify-otp', async (req, res, next) => {
  try {
    const { gstin, otp } = req.body;
    if (!gstin || !otp) return res.status(400).json({ error: 'GSTIN and OTP are required' });

    const result = await query(
      'SELECT * FROM vendors WHERE gstin = $1', [gstin]
    );
    const vendor = result.rows[0];
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Allow generated OTP or universal testing OTP (123456)
    const isMasterOtp = otp === '123456';
    if (vendor.otp !== otp && !isMasterOtp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    if (!isMasterOtp && new Date() > new Date(vendor.otp_expires_at)) {
      return res.status(401).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Mark verified, clear OTP
    await query(
      'UPDATE vendors SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1',
      [vendor.id]
    );

    const token = signToken({ id: vendor.id, role: 'vendor', gstin: vendor.gstin, name: vendor.business_name });
    res.json({ message: 'Login successful', token, vendor: { id: vendor.id, business_name: vendor.business_name, gstin: vendor.gstin, phone: vendor.phone } });
  } catch (err) {
    next(err);
  }
});

// ── INSPECTOR: Login ─────────────────────────────────────────────────────────
router.post('/inspector/login', async (req, res, next) => {
  try {
    const { gov_id, password } = req.body;
    if (!gov_id || !password) return res.status(400).json({ error: 'Government ID and password are required' });

    const result = await query('SELECT * FROM inspectors WHERE gov_id = $1', [gov_id]);
    const inspector = result.rows[0];
    if (!inspector) return res.status(401).json({ error: 'Invalid credentials' });
    if (!inspector.is_active) return res.status(403).json({ error: 'Account suspended. Contact admin.' });

    const isValid = await bcrypt.compare(password, inspector.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: inspector.id, role: 'inspector', gov_id: inspector.gov_id, name: inspector.full_name, zone: inspector.zone });
    res.json({ message: 'Login successful', token, inspector: { id: inspector.id, full_name: inspector.full_name, gov_id: inspector.gov_id, zone: inspector.zone, designation: inspector.designation } });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: Login ─────────────────────────────────────────────────────────────
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const result = await query('SELECT * FROM admins WHERE username = $1', [username]);
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

module.exports = router;
