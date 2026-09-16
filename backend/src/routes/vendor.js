const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { query } = require('../config/db');

const vendorAuth = authenticate(['vendor']);

// ── GET /api/vendor/machines ─────────────────────────────────────────────────
router.get('/machines', vendorAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         i.*,
         CASE
           WHEN expiry_date < CURRENT_DATE THEN 'EXPIRED'
           WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
           WHEN expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'APPROACHING'
           ELSE 'VALID'
         END AS expiry_status,
         (expiry_date - CURRENT_DATE) AS days_until_expiry
       FROM instruments i
       WHERE vendor_id = $1
       ORDER BY expiry_date ASC NULLS LAST`,
      [req.user.id]
    );
    res.json({ machines: result.rows, total: result.rowCount });
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

    const result = await query(
      `INSERT INTO instruments
         (vendor_id, make, model, serial_no, instrument_type, capacity, unit, manufacture_year, installation_date, location_description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING')
       RETURNING *`,
      [req.user.id, make, model, serial_no, instrument_type, capacity, unit, manufacture_year, installation_date, location_description]
    );
    res.status(201).json({ message: 'Instrument registered successfully', machine: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Serial number already registered' });
    next(err);
  }
});

// ── GET /api/vendor/appointments ─────────────────────────────────────────────
router.get('/appointments', vendorAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, i.make, i.model, i.serial_no,
              ins.full_name AS inspector_name
       FROM appointments a
       LEFT JOIN instruments i ON a.instrument_id = i.id
       LEFT JOIN inspectors ins ON a.inspector_id = ins.id
       WHERE a.vendor_id = $1
       ORDER BY a.preferred_date DESC`,
      [req.user.id]
    );
    res.json({ appointments: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/vendor/appointments ────────────────────────────────────────────
router.post('/appointments', vendorAuth, async (req, res, next) => {
  try {
    const { instrument_id, preferred_date, preferred_time, purpose, vendor_notes } = req.body;
    if (!preferred_date || !purpose) {
      return res.status(400).json({ error: 'Preferred date and purpose are required' });
    }

    const result = await query(
      `INSERT INTO appointments (vendor_id, instrument_id, preferred_date, preferred_time, purpose, vendor_notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [req.user.id, instrument_id || null, preferred_date, preferred_time || null, purpose, vendor_notes || null]
    );
    res.status(201).json({ message: 'Appointment booked successfully', appointment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
