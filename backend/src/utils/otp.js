/**
 * OTP utility — generates 6-digit OTP and simulates SMS delivery
 * In production, replace console.log with real SMS gateway (Twilio/AWS SNS)
 */

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry(minutesFromNow = 10) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
  return expiry;
}

async function sendOtp(phone, otp) {
  // Simulate SMS dispatch
  console.log(`\n📱 [SIMULATED SMS] To: +91${phone} | OTP: ${otp} | Valid: 10 minutes\n`);
  // TODO: Integrate real SMS gateway
  // await twilioClient.messages.create({ to: phone, from: ..., body: `Your TolSeva OTP: ${otp}` });
  return true;
}

module.exports = { generateOtp, getOtpExpiry, sendOtp };
