const QRCode = require('qrcode');

/**
 * Builds a structured QR payload for a verification certificate
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
  const payload = JSON.stringify({
    issuer: 'Legal Metrology Department, GoI',
    certNo: certificateNo,
    instrumentId,
    serialNo,
    make,
    model,
    inspector: inspectorGovId,
    result: testResult,
    verifiedAt,
    validUntil,
    verifyUrl: `https://tolseva.gov.in/verify/${certificateNo}`
  });

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
  return `LM/${inspectorGovId}/${year}${month}/${rand}`;
}

module.exports = { buildCertificateQR, generateCertificateNo };
