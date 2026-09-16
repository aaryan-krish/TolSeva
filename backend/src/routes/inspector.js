const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { query } = require('../config/db');
const { buildCertificateQR, generateCertificateNo } = require('../utils/qrPayload');

const inspectorAuth = authenticate(['inspector']);

// ── GET /api/inspector/assigned-visits ───────────────────────────────────────
router.get('/assigned-visits', inspectorAuth, async (req, res, next) => {
  try {
    const { filter } = req.query; // 'expired' | 'approaching' | 'all'

    let statusFilter = '';
    if (filter === 'expired') statusFilter = `AND i.expiry_date < CURRENT_DATE`;
    else if (filter === 'approaching') statusFilter = `AND i.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'`;

    const result = await query(
      `SELECT
         a.*,
         i.make, i.model, i.serial_no, i.instrument_type, i.expiry_date, i.capacity, i.unit,
         v.business_name, v.owner_name, v.phone AS vendor_phone, v.address,
         CASE
           WHEN i.expiry_date < CURRENT_DATE THEN 'EXPIRED'
           WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
           WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'APPROACHING'
           ELSE 'VALID'
         END AS expiry_status
       FROM appointments a
       JOIN instruments i ON a.instrument_id = i.id
       JOIN vendors v ON a.vendor_id = v.id
       WHERE a.inspector_id = $1
         AND a.status NOT IN ('COMPLETED','CANCELLED')
         ${statusFilter}
       ORDER BY i.expiry_date ASC, a.preferred_date ASC`,
      [req.user.id]
    );
    res.json({ visits: result.rows, total: result.rowCount });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/inspector/verify ───────────────────────────────────────────────
router.post('/verify', inspectorAuth, async (req, res, next) => {
  try {
    const { appointment_id, instrument_id, test_result, observations, error_percentage, photo_url, valid_months } = req.body;
    if (!instrument_id || !test_result) {
      return res.status(400).json({ error: 'Instrument ID and test result are required' });
    }

    // Get instrument details
    const instResult = await query('SELECT * FROM instruments WHERE id = $1', [instrument_id]);
    const instrument = instResult.rows[0];
    if (!instrument) return res.status(404).json({ error: 'Instrument not found' });

    // Generate certificate
    const certNo = generateCertificateNo(req.user.gov_id);
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + (valid_months || 12));

    const { payload: qrPayload, qrDataUrl } = await buildCertificateQR({
      certificateNo: certNo,
      instrumentId: instrument.id,
      serialNo: instrument.serial_no,
      make: instrument.make,
      model: instrument.model,
      inspectorGovId: req.user.gov_id,
      testResult: test_result,
      verifiedAt: new Date().toISOString(),
      validUntil: validUntil.toISOString().split('T')[0]
    });

    // Insert verification log
    const logResult = await query(
      `INSERT INTO verification_logs
         (appointment_id, instrument_id, inspector_id, test_result, observations, error_percentage, photo_url, qr_payload, certificate_no, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [appointment_id || null, instrument_id, req.user.id, test_result, observations, error_percentage || null, photo_url || null, qrPayload, certNo, validUntil.toISOString().split('T')[0]]
    );

    // Update instrument status and expiry
    const newStatus = test_result === 'PASS' || test_result === 'CONDITIONAL_PASS' ? 'ACTIVE' : 'SUSPENDED';
    await query(
      `UPDATE instruments
       SET status = $1, last_verified_at = NOW(), expiry_date = $2, updated_at = NOW()
       WHERE id = $3`,
      [newStatus, validUntil.toISOString().split('T')[0], instrument_id]
    );

    // Update appointment status
    if (appointment_id) {
      await query(`UPDATE appointments SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`, [appointment_id]);
    }

    res.status(201).json({
      message: 'Verification completed successfully',
      log: logResult.rows[0],
      certificate_no: certNo,
      qr_data_url: qrDataUrl,
      valid_until: validUntil.toISOString().split('T')[0]
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/inspector/certificate/:id ───────────────────────────────────────
router.get('/certificate/:id', inspectorAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT vl.*, i.make, i.model, i.serial_no, v.business_name
       FROM verification_logs vl
       JOIN instruments i ON vl.instrument_id = i.id
       JOIN vendors v ON i.vendor_id = v.id
       WHERE vl.id = $1 AND vl.inspector_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ certificate: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
