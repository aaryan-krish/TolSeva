/**
 * OTP utility with real SMS Gateway & DEV_MODE / DEMO_MODE support
 * 
 * - When DEV_MODE=true or DEMO_MODE=true (default in dev), uses fixed OTP '123456'.
 * - When DEV_MODE=false or DEMO_MODE=false (or NODE_ENV=production):
 *     1. Generates a secure random 6-digit OTP using crypto.randomInt.
 *     2. Dispatches real SMS to the 10-digit mobile number via real SMS APIs:
 *        - Fast2SMS (India fast OTP/SMS route)
 *        - Twilio (Global SMS API)
 *        - 2Factor.in (India transactional OTP)
 *        - MSG91 (India OTP service)
 *        - Custom SMS Webhook / Gateway
 *     3. Strictly validates OTP and expiration.
 */

const crypto = require('crypto');

const DEMO_OTP = '123456';

/**
 * Unified check for Dev / Demo mode.
 * Either DEV_MODE or DEMO_MODE can be used interchangeably — you only need to configure ONE.
 * - If DEV_MODE or DEMO_MODE is set to false/0/off/no: Real OTP & SMS gateway are active.
 * - If set to true/1/on/yes: Fixed demo OTP (123456) is active without SMS costs.
 * - Defaults to true in development, false in production.
 */
function isDevMode() {
  const envVal = process.env.DEV_MODE !== undefined 
    ? process.env.DEV_MODE 
    : process.env.DEMO_MODE;

  if (envVal !== undefined) {
    const val = String(envVal).toLowerCase().trim();
    return val !== 'false' && val !== '0' && val !== 'off' && val !== 'no';
  }
  return process.env.NODE_ENV !== 'production';
}

function isDemoMode() {
  return isDevMode();
}

function isLocalRequest(req) {
  const hostname = String(req?.hostname || '').toLowerCase();
  return process.env.NODE_ENV !== 'production'
    && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1');
}

/**
 * Generates an OTP:
 * - Fixed '123456' if useDemoOtp is true
 * - Cryptographically random 6-digit number (100000 - 999999) if false
 */
function generateOtp(useDemoOtp = isDemoMode()) {
  if (useDemoOtp) {
    return DEMO_OTP;
  }
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Returns an expiry date for the OTP (default 10 minutes).
 */
function getOtpExpiry(minutesFromNow = 10) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
  return expiry;
}

/**
 * Formats/normalizes phone number for Indian mobile (10 digits).
 */
function formatPhone(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  return cleaned.slice(-10);
}

/**
 * Sends a real SMS using the configured provider.
 */
async function sendRealSms(phone, otp) {
  const cleanPhone = formatPhone(phone);
  const maskedPhone = cleanPhone.length >= 4
    ? '*'.repeat(cleanPhone.length - 4) + cleanPhone.slice(-4)
    : cleanPhone;

  let providerAttempted = null;

  // ── Provider 1: Fast2SMS (Recommended for India) ─────────────────────────
  if (process.env.FAST2SMS_API_KEY) {
    providerAttempted = 'Fast2SMS';
    try {
      // Try Route 'otp' first
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanPhone
        })
      });

      const data = await res.json();
      if (data && data.return === true) {
        console.log(`📱 [Fast2SMS] Real OTP successfully sent to +91${maskedPhone} (Request ID: ${data.request_id || 'OK'})`);
        return { success: true, provider: 'fast2sms', data };
      }

      // If route 'otp' failed (e.g. quick SMS account), try fallback quick route 'q'
      const fallbackRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: `Your TolSeva verification code is ${otp}. Valid for 10 minutes. Please do not share this OTP.`,
          numbers: cleanPhone
        })
      });

      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.return === true) {
        console.log(`📱 [Fast2SMS Quick] Real OTP sent to +91${maskedPhone}`);
        return { success: true, provider: 'fast2sms', data: fallbackData };
      }

      console.error(`❌ [Fast2SMS Error] Failed to send SMS to +91${maskedPhone}:`, data || fallbackData);
      return { success: false, provider: 'fast2sms', error: data?.message || 'Fast2SMS error' };
    } catch (err) {
      console.error(`❌ [Fast2SMS Network Error]`, err.message);
      return { success: false, provider: 'fast2sms', error: err.message };
    }
  }

  // ── Provider 2: Twilio (Global Standard) ──────────────────────────────────
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    providerAttempted = 'Twilio';
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID.trim();
      const token = process.env.TWILIO_AUTH_TOKEN.trim();
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const to = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', process.env.TWILIO_PHONE_NUMBER.trim());
      params.append('Body', `[TolSeva] Your OTP verification code is ${otp}. Valid for 10 minutes. Do not share.`);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await res.json();
      if (res.ok && data?.sid) {
        console.log(`📱 [Twilio] Real OTP successfully sent to ${to} (SID: ${data.sid})`);
        return { success: true, provider: 'twilio', data };
      }

      console.error(`❌ [Twilio Error] Failed to send SMS to ${to}:`, data);
      return { success: false, provider: 'twilio', error: data?.message || 'Twilio delivery failed' };
    } catch (err) {
      console.error(`❌ [Twilio Network Error]`, err.message);
      return { success: false, provider: 'twilio', error: err.message };
    }
  }

  // ── Provider 3: 2Factor.in (India OTP Specialist) ────────────────────────
  const twoFactorKey = process.env.TWO_FACTOR_API_KEY || process.env['2FACTOR_API_KEY'];
  if (twoFactorKey) {
    providerAttempted = '2Factor';
    try {
      const url = `https://2factor.in/v2/SMS/${twoFactorKey.trim()}/SMS/${cleanPhone}/${otp}/TolSeva`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data && (data.Status === 'Success' || data.status === 'Success')) {
        console.log(`📱 [2Factor] Real OTP successfully sent to +91${maskedPhone}`);
        return { success: true, provider: '2factor', data };
      }

      console.error(`❌ [2Factor Error] Failed to send SMS:`, data);
      return { success: false, provider: '2factor', error: data?.Details || '2Factor delivery failed' };
    } catch (err) {
      console.error(`❌ [2Factor Network Error]`, err.message);
      return { success: false, provider: '2factor', error: err.message };
    }
  }

  // ── Provider 4: MSG91 (India) ─────────────────────────────────────────────
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    providerAttempted = 'MSG91';
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID.trim()}&mobile=91${cleanPhone}&authkey=${process.env.MSG91_AUTH_KEY.trim()}&otp=${otp}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();

      if (data && data.type === 'success') {
        console.log(`📱 [MSG91] Real OTP successfully sent to +91${maskedPhone}`);
        return { success: true, provider: 'msg91', data };
      }

      console.error(`❌ [MSG91 Error] Failed to send SMS:`, data);
      return { success: false, provider: 'msg91', error: data?.message || 'MSG91 delivery failed' };
    } catch (err) {
      console.error(`❌ [MSG91 Network Error]`, err.message);
      return { success: false, provider: 'msg91', error: err.message };
    }
  }

  // ── Provider 5: Custom SMS Webhook / Gateway URL ─────────────────────────
  if (process.env.SMS_GATEWAY_URL) {
    providerAttempted = 'Custom Gateway';
    try {
      let url = process.env.SMS_GATEWAY_URL.trim();
      let res;
      if (url.includes('{phone}') || url.includes('{otp}')) {
        url = url.replace(/\{phone\}/g, cleanPhone).replace(/\{otp\}/g, otp);
        res = await fetch(url);
      } else {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            full_phone: `+91${cleanPhone}`,
            otp,
            message: `Your TolSeva verification code is ${otp}. Valid for 10 minutes.`
          })
        });
      }

      if (res.ok) {
        console.log(`📱 [Custom Gateway] Real OTP sent to +91${maskedPhone}`);
        return { success: true, provider: 'custom_gateway' };
      }

      console.error(`❌ [Custom Gateway Error] HTTP status: ${res.status}`);
      return { success: false, provider: 'custom_gateway', error: `HTTP ${res.status}` };
    } catch (err) {
      console.error(`❌ [Custom Gateway Network Error]`, err.message);
      return { success: false, provider: 'custom_gateway', error: err.message };
    }
  }

  // ── Fallback: Dev Mode is OFF, but no SMS provider key configured in .env ──
  console.warn(`
╔════════════════════════════════════════════════════════════════════════════════╗
║ ⚠️  REAL SMS NOTICE: DEV MODE IS OFF, BUT NO SMS API KEY IS CONFIGURED!       ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ Real OTP was generated, but no active SMS gateway was found in backend/.env.   ║
║                                                                                ║
║ To send real SMS messages to real phone numbers, add ONE of these to .env:     ║
║   1. Fast2SMS (India):                                                         ║
║      FAST2SMS_API_KEY=your_api_key_from_fast2sms.com                          ║
║                                                                                ║
║   2. Twilio (Global):                                                          ║
║      TWILIO_ACCOUNT_SID=AC...                                                  ║
║      TWILIO_AUTH_TOKEN=...                                                     ║
║      TWILIO_PHONE_NUMBER=+1...                                                 ║
║                                                                                ║
║   3. 2Factor.in (India):                                                       ║
║      TWO_FACTOR_API_KEY=...                                                    ║
║                                                                                ║
║   4. Custom SMS Webhook:                                                       ║
║      SMS_GATEWAY_URL=https://api.gateway.com/send?to={phone}&otp={otp}        ║
║                                                                                ║
║ 📱 Recipient: +91${maskedPhone}                                                ║
║ 🔑 Generated OTP: ${otp} (Valid for 10 minutes)                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
`);

  return {
    success: false,
    provider: 'none',
    warning: 'No SMS gateway credentials configured in backend/.env'
  };
}

/**
 * Master sendOtp function:
 * Checks useDemoOtp. If true, logs demo OTP.
 * If false, calls real SMS API.
 */
async function sendOtp(phone, otp, useDemoOtp = isDemoMode()) {
  if (useDemoOtp) {
    console.log(`\n📱 [DEMO MODE OTP] To: +91${phone} | OTP: ${otp} (Fixed Demo OTP: ${DEMO_OTP})\n`);
    return { success: true, provider: 'demo' };
  }
  return await sendRealSms(phone, otp);
}

/**
 * Validates an OTP entered by the user.
 */
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
  isDevMode,
  isLocalRequest,
  generateOtp,
  getOtpExpiry,
  sendOtp,
  sendRealSms,
  verifyOtpValue
};
