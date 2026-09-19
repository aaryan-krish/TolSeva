const QRCode = require('qrcode');

/**
 * Builds a public URL QR payload for a verification certificate
 * and generates a base64 PNG data URL
 */
async function buildCertificateQR({
  certificateNo,
  instrumentId,
  serialNo,
  make,
  model,
  inspectorGovId,
  testResult,
  verifiedAt,
  validUntil
}) {
  const publicBaseUrl = process.env.PUBLIC_VERIFY_URL || process.env.APP_URL || 'https://tolseva.gov.in';
  const cleanBase = publicBaseUrl.replace(/\/+$/, '');
  
  // Set qrPayload to a full public URL rather than an arbitrary JSON string
  const payload = `${cleanBase}/verify/${encodeURIComponent(certificateNo)}`;

  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2
  });

  return { payload, qrDataUrl };
}

function generateCertificateNo(inspectorGovId) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LM/${inspectorGovId || 'INSP'}/${year}${month}/${rand}`;
}

module.exports = { buildCertificateQR, generateCertificateNo };
