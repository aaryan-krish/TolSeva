const express = require('express');
const router = express.Router();

// Rule-based knowledge base for Legal Metrology domain
const knowledgeBase = [
  {
    keywords: ['register', 'registration', 'new machine', 'new weighing', 'add instrument', 'पंजीकरण', 'नया'],
    response: 'To register a new weighing or measuring instrument: 1) Log in to your Vendor Dashboard using your GSTIN and OTP. 2) Click "Add Machine". 3) Fill in the Make, Model, Serial Number, Type, and Capacity. 4) Submit the form. Your instrument will be registered with PENDING status until an inspector verifies it.'
  },
  {
    keywords: ['appointment', 'book', 'schedule', 'inspection', 'visit', 'नियुक्ति', 'मुलाकात'],
    response: 'To book an inspection appointment: 1) Go to the Vendor Dashboard. 2) Click "Book Appointment". 3) Select the instrument, preferred date, and purpose (New Registration, Renewal, etc.). 4) Submit. An inspector will be assigned and you will be notified.'
  },
  {
    keywords: ['expire', 'expiry', 'renew', 'renewal', 'certificate', 'समाप्ति', 'नवीनीकरण'],
    response: 'Weighing and measuring instruments must be renewed annually under the Legal Metrology Act, 2009. You can check expiry dates on your Machine Inventory table — instruments expiring within 30 days are shown with a RED badge, within 90 days with ORANGE. Book a renewal appointment before expiry to avoid penalties.'
  },
  {
    keywords: ['otp', 'login', 'gstin', 'log in', 'sign in', 'लॉगिन', 'ओटीपी'],
    response: 'Vendor login uses your GSTIN (15-character GST Identification Number) and a One-Time Password (OTP) sent to your registered mobile number. Click "Vendor Login" on the homepage, enter your GSTIN and phone number, and use the OTP received via SMS to log in.'
  },
  {
    keywords: ['fine', 'penalty', 'legal', 'act', 'section', 'जुर्माना', 'दंड'],
    response: 'Under the Legal Metrology Act, 2009: Section 25 — Using unverified weights/measures: Fine up to ₹25,000 and/or 1 year imprisonment. Section 27 — Fraud in weights: Fine up to ₹50,000. Section 29 — Selling without proper stamps: Fine up to ₹10,000. Ensure all instruments are verified and renewed on time.'
  },
  {
    keywords: ['inspector', 'officer', 'verify', 'check', 'निरीक्षक', 'सत्यापन'],
    response: 'Inspectors are Government-authorized Legal Metrology Officers. They visit your business to physically test weighing and measuring instruments. After testing, they issue a digital certificate with a QR code. Inspections are conducted at your registered business address on the appointed date.'
  },
  {
    keywords: ['document', 'required', 'needed', 'submit', 'दस्तावेज', 'कागजात'],
    response: 'Documents required for instrument verification: 1) GSTIN Certificate, 2) Purchase invoice of the weighing/measuring instrument, 3) Previous verification certificate (for renewals), 4) Business address proof. Ensure all instruments are accessible to the inspector on the visit date.'
  },
  {
    keywords: ['contact', 'help', 'support', 'phone', 'email', 'संपर्क', 'मदद'],
    response: 'For assistance, contact the Legal Metrology Department helpline: Toll-free: 1800-11-4000 | Email: lmd.support@consumeraffairs.gov.in | Office hours: Mon–Fri, 10:00 AM – 5:00 PM. You can also use this voice assistant for instant guidance.'
  }
];

function getBotResponse(query, lang = 'en') {
  if (!query) return 'Please ask a question about instrument registration, appointments, or the Legal Metrology Act.';
  const q = query.toLowerCase();
  for (const item of knowledgeBase) {
    if (item.keywords.some(kw => q.includes(kw))) {
      return item.response;
    }
  }
  return 'I can help you with: registering instruments, booking appointments, checking expiry dates, understanding the Legal Metrology Act, required documents, and contacting the department. Please ask about any of these topics.';
}

// POST /api/bot/assist
router.post('/assist', async (req, res) => {
  const { query: userQuery, lang } = req.body;
  const reply = getBotResponse(userQuery, lang || 'en');
  res.json({ reply, timestamp: new Date().toISOString() });
});

module.exports = router;
