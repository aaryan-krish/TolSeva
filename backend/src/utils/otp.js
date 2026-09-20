/**
 * OTP utility with DEMO_MODE support
 * When DEMO_MODE=true, generates and validates fixed OTP '123456'.
 * In production or DEMO_MODE=false, generates a secure random 6-digit OTP.
 */

const DEMO_OTP = '123456';

function isDemoMode() {
  if (process.env.DEMO_MODE !== undefined) {
    return process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === true || process.env.DEMO_MODE === '1';
  }
  // Default to true in non-production environments
  return process.env.NODE_ENV !== 'production';
}

function isLocalRequest(req) {
  const hostname = String(req?.hostname || '').toLowerCase();
  return process.env.NODE_ENV !== 'production'
    && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1');
}

function generateOtp(useDemoOtp = isDemoMode()) {
  if (useDemoOtp) {
    return DEMO_OTP;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry(minutesFromNow = 10) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
  return expiry;
}

async function sendOtp(phone, otp, useDemoOtp = isDemoMode()) {
  if (useDemoOtp) {
    console.log(`\n📱 [DEMO MODE OTP] To: +91${phone} | OTP: ${otp} (Fixed Demo OTP: ${DEMO_OTP})\n`);
    return true;
  }
  console.log(`\n📱 [SIMULATED SMS] To: +91${phone} | OTP: ${otp} | Valid: 10 minutes\n`);
  return true;
}

function verifyOtpValue(enteredOtp, storedOtp, expiresAt) {
  const input = String(enteredOtp || '').trim();
  if (isDemoMode() && input === DEMO_OTP) {
    return { valid: true };
  }
  if (!storedOtp || input !== String(storedOtp).trim()) {
    return { valid: false, reason: 'Invalid OTP' };
  }
  if (expiresAt && new Date() > new Date(expiresAt)) {
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }
  return { valid: true };
}

module.exports = {
  DEMO_OTP,
  isDemoMode,
  isLocalRequest,
  generateOtp,
  getOtpExpiry,
  sendOtp,
  verifyOtpValue
};
