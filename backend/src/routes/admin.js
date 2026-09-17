const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

const adminAuth = authenticate(['admin']);

// ── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', adminAuth, async (req, res, next) => {
  try {
    const [vendors, instruments, appointments, verifications, expired] = await Promise.all([
      query('SELECT COUNT(*) FROM vendors WHERE is_verified = TRUE'),
      query('SELECT COUNT(*) FROM instruments'),
      query("SELECT COUNT(*) FROM appointments WHERE status = 'PENDING'"),
      query('SELECT COUNT(*) FROM verification_logs'),
      query("SELECT COUNT(*) FROM instruments WHERE expiry_date < CURRENT_DATE AND status = 'ACTIVE'")
    ]);
    res.json({
      stats: {
        registered_vendors: parseInt(vendors.rows[0].count),
        total_instruments: parseInt(instruments.rows[0].count),
        pending_appointments: parseInt(appointments.rows[0].count),
        verifications_issued: parseInt(verifications.rows[0].count),
        expired_instruments: parseInt(expired.rows[0].count)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/vendors ───────────────────────────────────────────────────
router.get('/vendors', adminAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT v.*, COUNT(i.id) AS instrument_count
       FROM vendors v
       LEFT JOIN instruments i ON v.id = i.vendor_id
       WHERE v.is_verified = TRUE
       GROUP BY v.id
       ORDER BY v.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = await query('SELECT COUNT(*) FROM vendors WHERE is_verified = TRUE');
    res.json({ vendors: result.rows, total: parseInt(total.rows[0].count), page, limit });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/inspectors ────────────────────────────────────────────────
router.get('/inspectors', adminAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, gov_id, full_name, department, designation, zone, phone, email, is_active, created_at
       FROM inspectors ORDER BY full_name`
    );
    res.json({ inspectors: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/inspectors ───────────────────────────────────────────────
router.post('/inspectors', adminAuth, async (req, res, next) => {
  try {
    const { gov_id, full_name, department, designation, zone, phone, email, password } = req.body;
    if (!gov_id || !full_name || !password) return res.status(400).json({ error: 'gov_id, full_name, password required' });
    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO inspectors (gov_id, full_name, department, designation, zone, phone, email, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, gov_id, full_name, zone`,
      [gov_id, full_name, department, designation, zone, phone, email, password_hash]
    );
    res.status(201).json({ inspector: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Government ID already exists' });
    next(err);
  }
});

// ── PATCH /api/admin/appointments/:id/assign ─────────────────────────────────
router.patch('/appointments/:id/assign', adminAuth, async (req, res, next) => {
  try {
    const { inspector_id } = req.body;
    if (!inspector_id) return res.status(400).json({ error: 'Inspector ID required' });
    const result = await query(
      `UPDATE appointments
       SET inspector_id = $1, status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [inspector_id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/appointments/:id/confirm ────────────────────────────────
router.patch('/appointments/:id/confirm', adminAuth, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE appointments
       SET status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/appointments ──────────────────────────────────────────────
router.get('/appointments', adminAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, v.business_name, v.phone AS vendor_phone,
              i.make, i.model, i.serial_no,
              ins.full_name AS inspector_name
       FROM appointments a
       JOIN vendors v ON a.vendor_id = v.id
       LEFT JOIN instruments i ON a.instrument_id = i.id
       LEFT JOIN inspectors ins ON a.inspector_id = ins.id
       ORDER BY a.preferred_date DESC`
    );
    res.json({ appointments: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
