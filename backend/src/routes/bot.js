const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { reply: "Too many requests. Please try again later.", source: "system", timestamp: new Date().toISOString() }
});

// Candidate Gemini models with auto-fallback to ensure 100% availability
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

// System prompt grounding the AI as Chat Wizard
const BASE_SYSTEM_INSTRUCTION = `You are "Chat Wizard", the intelligent and helpful AI Assistant for TolSeva — the National Legal Metrology Verification & Certification Platform under the Ministry of Consumer Affairs, Food & Public Distribution, Government of India.

IMPORTANT DISCLAIMER:
You must explicitly inform users that your answers are AI-generated and can be wrong. Always advise users to verify any legal statements, penalties, or official procedures against current official Government of India sources before taking action.

Your core mission:
Provide courteous and actionable assistance to vendors, shopkeepers, manufacturers, repairers, legal metrology inspectors, and Indian citizens regarding weights and measures, certification, and the Legal Metrology Act, 2009.

CORE KNOWLEDGE BASE:
1. Legal Metrology Act, 2009 & General Rules 2011:
   - Mandatory verification and stamping of all commercial weighing and measuring instruments before putting them to use (Section 24).
   - Re-verification period: Generally annual (every 12 months) for commercial weighing instruments, weighbridges, and fuel dispensers.
   - Offences and Penalties:
     * Section 25: Use of unverified weight or measure -> Fine up to ₹25,000. Second or subsequent offense: Imprisonment up to 1 year along with fine.
     * Section 27: Quotation or sale by non-standard units (e.g. seer, tola) -> Fine up to ₹10,000.
     * Section 28: Making or manufacturing non-standard weights/measures -> Fine up to ₹20,000.
     * Section 29: Sale of unverified weights/measures -> Fine up to ₹10,000. Second offense: Imprisonment up to 1 year.
     * Section 30: Penalty for giving short weight or measure (cheating consumer) -> Fine up to ₹10,000; second/subsequent up to ₹50,000 or 1 year imprisonment.
     * Section 36: Violation of Packaged Commodities Rules 2011 (such as selling above MRP, smudged/dual MRP stickers, missing net quantity, missing manufacturer details, missing customer care details) -> Fine up to ₹25,000 (first offense), up to ₹50,000 (second offense), up to ₹1,00,000 or 1 year jail (subsequent).
     * Section 49: Offenses by companies (Directors/partners held liable).

2. TolSeva Platform Operations:
   - Vendor Portal:
     * Login: 15-character GSTIN + 6-digit OTP sent to registered phone number.
     * Add Machine: Register Make, Model, Serial Number, Type (Counter Scale, Platform Scale, Weighbridge, Fuel Dispenser, Electronic Balance), Capacity, and Class of Accuracy (Class I to IV). Status begins as PENDING.
     * Book Appointment: Pick machine, preferred visit date, purpose (Initial Verification, Annual Renewal, Re-verification post-repair).
     * Expiry Monitoring: Status badges indicate green (Valid), orange (Expiring within 90 days), red (Expiring within 30 days), and dark red (Expired).
     * Digital Certificate: Once verified, download official PDF certificate containing the tamper-proof QR code.
   - Inspector Portal:
     * Authorized Legal Metrology Officers receive assigned visit queues.
     * Physical testing using calibrated standard weights and checking Maximum Permissible Error (MPE) tolerances.
     * Physical lead/wire sealing & digital stamping with QR code generation.
     * Recording complaints and field inspections.
   - Citizen / Consumer Services:
     * Scan QR Code on any verified shop balance to instantly inspect certificate validity and vendor name.
     * Public Complaints: File a report against short-weight fraud, non-stamped scales, or overpricing with photo evidence.
     * Track Complaint: Check real-time investigation status using the Tracking ID (e.g. CMP-XXXXXXXX).
   - Helplines & Support:
     * Toll-Free National Citizen Helpline: 1800-11-4000
     * Email: lmd.support@consumeraffairs.gov.in
     * Operating Hours: Monday to Friday, 10:00 AM – 5:00 PM IST

BEHAVIOR AND TONE:
- Introduce yourself as "Chat Wizard" ONLY upon the very first greeting (e.g., if the user says "hello" or asks "who are you?").
- STRICT CONVERSATIONAL CONTINUITY: Once a conversation has started, NEVER repeat "Hello, I am Chat Wizard" or re-introduce yourself. Jump straight into answering the user's question directly, clearly, and concisely.
- Do NOT add repetitive boilerplate opening greetings to every message. Treat the chat as an ongoing continuous dialogue.
- Provide clear, step-by-step guidance formatted with bullet points or numbered lists.
- Be concise, professional, and accessible to Indian vendors and everyday citizens.
- When citing laws, mention the relevant Section of the Legal Metrology Act, 2009.`;

// Map language code to language name
function getLanguageName(code) {
  const map = {
    hi: 'Hindi',
    mr: 'Marathi',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
    en: 'English'
  };
  return map[code] || 'English';
}

// Multilingual Fallback Knowledge Base
const fallbackResponsesByLang = {
  hi: {
    identity: `🧙‍♂️ **नमस्ते! मैं तोलसेवा का चैट विज़ार्ड (Chat Wizard) हूँ**, आपका एआई विधिक मापविज्ञान सहायक।

मैं निम्न में आपकी सहायता कर सकता हूँ:
* ⚖️ **विधिक मापविज्ञान अधिनियम, 2009:** धारा 25 व 30 के अंतर्गत नियम व जुर्माने
* 📝 **उपकरण पंजीकरण:** तराजू, वेइंग मशीन व धर्मकांटा (Weighbridge) का पंजीकरण
* 📅 **निरीक्षण अपॉइंटमेंट:** सरकारी निरीक्षक द्वारा भौतिक सत्यापन हेतु समय बुक करना
* 🔍 **क्यूआर सत्यापन:** दुकानदार के डिजिटल प्रमाण पत्र की वैधता जांचना
* 📢 **नागरिक शिकायत:** कम तोलने या एमआरपी से अधिक दाम लेने पर शिकायत दर्ज करना

कृपया अपना प्रश्न पूछें!`,
    registration: `📝 **तोलसेवा पोर्टल पर नया उपकरण कैसे पंजीकृत करें:**

1. **लॉग इन करें:** अपना 15-अंकों का **GSTIN** और मोबाइल पर प्राप्त **OTP** दर्ज करें।
2. **मशीन इन्वेंटरी:** विक्रेता डैशबोर्ड पर जाएं और **"Add Machine"** बटन पर क्लिक करें।
3. **विवरण भरें:**
   - **Make & Model** (ब्रांड और मॉडल)
   - **Serial Number** (मशीन का सीरियल नंबर)
   - **Type** (काउंटर स्केल, प्लेटफॉर्म स्केल, वेइब्रिज आदि)
   - **Capacity व Accuracy Class** (Class I से IV)
4. **सबमिट करें:** उपकरण **PENDING** स्थिति में पंजीकृत हो जाएगा।
5. **अगला चरण:** सत्यापन हेतु निरीक्षक के लिए अपॉइंटमेंट बुक करें।`,
    appointment: `📅 **निरीक्षक सत्यापन अपॉइंटमेंट बुक करने की विधि:**

1. अपने **Vendor Dashboard** पर जाएं।
2. पंजीकृत मशीन के सामने **"Book Appointment"** पर क्लिक करें।
3. चुनें:
   - मशीन / उपकरण
   - पसंदीदा **निरीक्षण तिथि**
   - **उद्देश्य:** नया पंजीकरण, वार्षिक नवीनीकरण, या मरम्मत पश्चात पुनः सत्यापन
4. **Submit Booking** पर क्लिक करें। आपको एसएमएस द्वारा पुष्टि प्राप्त होगी।`,
    penalties: `⚖️ **विधिक मापविज्ञान अधिनियम, 2009 के मुख्य दंड व जुर्माने:**

* **धारा 25 (असत्यापित तोल/माप का उपयोग):**
  - पहली बार: **₹25,000 तक का जुर्माना**।
  - दूसरी बार या बार-बार: **1 वर्ष तक का कारावास** व जुर्माना।
* **धारा 30 (कम तोलना या ग्राहक को ठगना):**
  - कम वजन देने पर **₹10,000 तक का जुर्माना** (दोबारा करने पर ₹50,000 व/या 1 साल जेल)।
* **धारा 27 (अमानक इकाइयों में बिक्री):**
  - गैर-मानक इकाइयों (जैसे सेर, तोला) में बिक्री पर **₹10,000 तक जुर्माना**।
* **धारा 36 (पैकेज्ड कमोडिटीज नियम उल्लंघन):**
  - एमआरपी से अधिक वसूलने या लेबल छिपाने पर: पहली बार **₹25,000**, दूसरी बार **₹50,000**, आगे **₹1,00,000 या जेल**।`,
    contact: `📞 **विधिक मापविज्ञान राष्ट्रीय हेल्पलाइन:**

* **टोल-फ्री हेल्पलाइन:** 1800-11-4000 (सोम–शुक्र, सुबह 10 से शाम 5 बजे)
* **ईमेल:** lmd.support@consumeraffairs.gov.in
* **मंत्रालय:** उपभोक्ता मामले विभाग, कृषि भवन, नई दिल्ली
* आप किसी भी समय मुझसे (**चैट विज़ार्ड**) त्वरित सहायता ले सकते हैं!`
  },
  mr: {
    identity: `🧙‍♂️ **नमस्कार! मी तोलसेवा चॅट विझार्ड (Chat Wizard) आहे**, आपला एआय वैध मापनशास्त्र सहाय्यक.

मी आपल्याला खालील बाबींमध्ये मदत करू शकतो:
* ⚖️ **वैध मापनशास्त्र कायदा, 2009 चे नियम व दंड** (कलम 25, 30)
* 📝 **वजन काट्यांची ऑनलाइन नोंदणी व पडताळणी**
* 📅 **शासकीय निरीक्षकांच्या भेटीचे बुकिंग**
* 🔍 **क्यूआर कोड प्रमाणपत्राची त्वरित तपासणी**
* 📢 **कमी वजन किंवा दुहेरी एमआरपी विरोधात तक्रार नोंदवणे**

आपला प्रश्न विचारा!`,
    registration: `📝 **तोलसेवावर नवीन उपकरणाची नोंदणी कशी करावी:**

1. **लॉगिन:** आपला 15-अंकी **GSTIN** व मोबाईलवर आलेला **OTP** वापरून लॉगिन करा.
2. **मशीन इन्व्हेंटरी:** डॅशबोर्डवर **"Add Machine"** वर क्लिक करा.
3. **तपशील भरा:** मेक, मॉडेल, अनुक्रमांक (Serial No), वजन क्षमता आणि वर्ग.
4. **सबमिट करा:** मशीन **PENDING** म्हणून नोंदवले जाईल.
5. त्यानंतर निरीक्षकाची पडताळणीसाठी अपॉइंटमेंट बुक करा.`,
    penalties: `⚖️ **वैध मापनशास्त्र कायदा, 2009 अंतर्गत दंड:**

* **कलम 25 (अवैध/अप्रमाणित वजन काटे):**
  - दंड: **₹25,000 पर्यंत**; दुसऱ्या गुन्ह्यासाठी **1 वर्षापर्यंत तुरुंगवास** आणि दंड.
* **कलम 30 (कमी वजन देणे):**
  - ग्राहकाला कमी माल दिल्यास **₹10,000 पर्यंत दंड** (पुन्हा केल्यास ₹50,000 किंवा 1 वर्ष जेल).
* **कलम 36 (पॅकेजिंग नियम उल्लंघन):**
  - एमआरपीपेक्षा जास्त दर घेतल्यास **₹25,000 ते ₹1,00,000 पर्यंत दंड**.`
  },
  gu: {
    identity: `🧙‍♂️ **નમસ્તે! હું તોલસેવા ચેટ વિઝાર્ડ (Chat Wizard) છું**, તમારો એઆઈ લીગલ મેટ્રોલોજી સહાયક.

હું તમને નીચેની બાબતોમાં માર્ગદર્શન આપી શકું છું:
* ⚖️ **લીગલ મેટ્રોલોજી એક્ટ, 2009 ના નિયમો અને દંડ**
* 📝 **નવા વજનકાંટાની ઓનલાઇન નોંધણી**
* 📅 **સરકારી નિરીક્ષક તપાસ માટે એપોઇન્ટમેન્ટ**
* 🔍 **દુકાનદારના ક્યૂઆર કોડ પ્રમાણપત્રની ચકાસણી**
* 📢 **ઓછું વજન આપવા સામે નાગરિક ફરિયાદ**`,
    penalties: `⚖️ **લીગલ મેટ્રોલોજી એક્ટ હેઠળ દંડ:**

* **કલમ 25 (અચકાસાયેલ કાંટો વાપરવો):** **₹25,000 સુધી દંડ**; બીજી વાર **1 વર્ષની જેલ**.
* **કલમ 30 (ઓછું વજન આપવું):** **₹10,000 સુધી દંડ** (ફરીથી કરવા પર ₹50,000 કે જેલ).
* **કલમ 36 (MRP થી વધુ કિંમત વસૂલવી):** **₹25,000 થી ₹1,00,000 સુધી દંડ**.`
  },
  bn: {
    identity: `🧙‍♂️ **নমস্কার! আমি তোলসেবা চ্যাট উইজার্ড (Chat Wizard)**, আপনার এআই লিগ্যাল মেট্রোলজি সহায়ক।

আমি আপনাকে সাহায্য করতে পারি:
* ⚖️ **লিগ্যাল মেট্রোলজি আইন, ২০০৯ ও জরিমানা** (ধারা ২৫, ৩০)
* 📝 **ওজন ও পরিমাপক যন্ত্রের নতুন নিবন্ধন**
* 📅 **পরিদর্শকের অ্যাপয়েন্টমেন্ট বুকিং**
* 🔍 **ডিজিটাল কিউআর কোড শংসাপত্র যাচাই**
* 📢 **ওজনে কম দেওয়ার বিরুদ্ধে অভিযোগ দায়ের**`,
    penalties: `⚖️ **আইন অনুযায়ী জরিমানা:**

* **ধারা ২৫ (যাচাইবিহীন স্কেল ব্যবহার):** সর্বোচ্চ **₹২৫,০০০ জরিমানা**; পুনরাবৃত্তিতে **১ বছর পর্যন্ত কারাদণ্ড**।
* **ধারা ৩০ (ওজনে কম দেওয়া):** **₹১০,০০০ পর্যন্ত জরিমানা** (পরবর্তীতে ₹৫০,০০০ বা জেল)।
* **ধারা ৩৬ (প্যাকেজড পণ্যে অতিরিক্ত দাম নেওয়া):** **₹২৫,০০০ থেকে ₹১,০০,০০০ পর্যন্ত জরিমানা**।`
  },
  ta: {
    identity: `🧙‍♂️ **வணக்கம்! நான் டோல்சேவா சாட் விசார்ட் (Chat Wizard)**, உங்கள் AI சட்ட அளவியல் உதவியாளர்.

நான் உங்களுக்கு உதவக்கூடியவை:
* ⚖️ **சட்ட அளவியல் சட்டம், 2009 & அபராதங்கள்** (பிரிவு 25, 30)
* 📝 **எடைக்கருவிகள் பதிவு செய்தல்**
* 📅 **ஆய்வாளர் ஆய்வு முன்பதிவு**
* 🔍 **QR சான்றிதழ் சரிபார்ப்பு**
* 📢 **குறைந்த எடை மோசடி புகார் செய்தல்**`,
    penalties: `⚖️ **சட்ட அளவியல் அபராதங்கள்:**

* **பிரிவு 25 (சரிபார்க்கப்படாத எடைக்கருவி):** அபராதம் **₹25,000 வரை**; மீண்டும் செய்தால் **1 ஆண்டு சிறை**.
* **பிரிவு 30 (குறைந்த எடை கொடுத்தல்):** அபராதம் **₹10,000 வரை** (மீண்டும் செய்தால் ₹50,000).
* **பிரிவு 36 (MRP-க்கு மேல் விற்றல்):** அபராதம் **₹25,000 முதல் ₹1,00,000 வரை**.`
  },
  te: {
    identity: `🧙‍♂️ **నమస్కారం! నేను తోల్సేవ చాట్ విజార్డ్ (Chat Wizard)**, మీ AI లీగల్ మెట్రాలజీ సహాయకుడిని.

నేను మీకు సహాయం చేయగలను:
* ⚖️ **లీగల్ మెట్రాలజీ చట్టం, 2009 & జరిమానాలు** (సెక్షన్ 25, 30)
* 📝 **కొత్త కొలత సాధనాల నమోదు**
* 📅 **ఇన్‌స్పెక్టర్ తనిఖీ అపాయింట్‌మెంట్**
* 🔍 **QR కోడ్ సర్టిఫికెట్ తనిಖీ**
* 📢 **తక్కువ బరువుపై ఫిర్యాదు చేయడం**`,
    penalties: `⚖️ **చట్టపరమైన జరిమానాలు:**

* **సెక్షన్ 25 (ధృవీకరించని కొలతలు):** **₹25,000 వరకు జరిమానా**; మళ్లీ చేస్తే **1 సంవత్సరం జైలు**.
* **సెక్షన్ 30 (తక్కువ బరువు ఇవ్వడం):** **₹10,000 వరకు జరిమానా** (మళ్లీ చేస్తే ₹50,000).
* **సెక్షన్ 36 (MRP నిబంధనల ఉల్లంಘన):** **₹25,000 నుండి ₹1,00,000 వరకు జరిమానా**.`
  },
  kn: {
    identity: `🧙‍♂️ **ನಮಸ್ಕಾರ! ನಾನು ತೋಲ್‌ಸೇವಾ ಚಾಟ್ ವಿಝಾರ್ಡ್ (Chat Wizard)**, ನಿಮ್ಮ AI ಲೀಗಲ್ ಮೆಟ್ರಾಲಜಿ ಸಹಾಯಕ.

ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:
* ⚖️ **ಲೀಗಲ್ ಮೆಟ್ರಾಲಜಿ ಕಾಯ್ದೆ, 2009 ಮತ್ತು ದಂಡಗಳು** (ವಿಭಾಗ 25, 30)
* 📝 **ತೂಕದ ಯಂತ್ರಗಳ ನೋಂದಣಿ**
* 📅 **ಪರಿವೀಕ್ಷಕರ ಭೇಟಿಯ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್**
* 🔍 **QR ಪ್ರಮಾಣಪತ್ರ ಪರಿಶೀಲನೆ**
* 📢 **ತೂಕದಲ್ಲಿ ಮೋಸದ ವಿರುದ್ಧ ದೂರು**`,
    penalties: `⚖️ **ಕಾಯ್ದೆಯ ಅಡಿಯಲ್ಲಿ ದಂಡಗಳು:**

* **ವಿಭಾಗ 25 (ಪರಿಶೀಲಿಸದ ತೂಕದ ಯಂತ್ರ):** **₹25,000 ವರೆಗೆ ದಂಡ**; ಪುನರಾವರ್ತನೆಗೆ **1 ವರ್ಷ ಜೈಲು**.
* **ವಿಭಾಗ 30 (ಕಡಿಮೆ ತೂಕ ನೀಡುವುದು):** **₹10,000 ವರೆಗೆ ದಂಡ**.`
  },
  ml: {
    identity: `🧙‍♂️ **നമസ്കാരം! ഞാൻ തോൽസേവ ചാറ്റ് വിസാർഡ് (Chat Wizard)**, നിങ്ങളുടെ AI ലീഗൽ മെട്രോളജി സഹായി.

സഹായം ലഭ്യമായ മേഖലകൾ:
* ⚖️ **ലീഗൽ മെട്രോളജി ആക്ട്, 2009 & പിഴകൾ**
* 📝 **അളവുതൂക്ക ഉപകരണ രജിസ്ട്രേഷൻ**
* 📅 **ഇൻസ്പെക്ടർ അപ്പോയിന്റ്മെന്റ്**
* 🔍 **QR കോഡ് സർട്ടിഫിക്കറ്റ് പരിശോധന**
* 📢 **തൂക്കക്കുറവിനെതിരെ പരാതി നൽകൽ**`,
    penalties: `⚖️ **നിയമപരമായ പിഴകൾ:**

* **വകുപ്പ് 25 (പരിശോധിക്കാത്ത ഉപകരണം):** **₹25,000 വരെ പിഴ**; വീണ്ടും ആവർത്തിച്ചാൽ **1 വർഷം തടവ്**.
* **വകുപ്പ് 30 (തൂക്കക്കുറവ് നൽകൽ):** **₹10,000 വരെ പിഴ**.`
  },
  pa: {
    identity: `🧙‍♂️ **ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੋਲਸੇਵਾ ਚੈਟ ਵਿਜ਼ਾਰਡ (Chat Wizard) ਹਾਂ**, ਤੁਹਾਡਾ AI ਲੀਗਲ ਮੈਟ੍ਰੋਲੋਜੀ ਸਹਾਇਕ।

ਮੈਂ ਹੇਠ ਲਿਖੇ ਵਿਸ਼ਿਆਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:
* ⚖️ **ਲੀਗਲ ਮੈਟ੍ਰੋਲੋਜੀ ਐਕਟ, 2009 ਅਤੇ ਜੁਰਮਾਨੇ**
* 📝 **ਨਵੇਂ ਤੋਲ ਯੰਤਰਾਂ ਦੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ**
* 📅 **ਇੰਸਪੈਕਟਰ ਜਾਂਚ ਲਈ ਮੁਲਾਕਾਤ**
* 🔍 **ਕਿਊਆਰ ਕੋਡ ਸਰਟੀਫਿਕੇਟ ਦੀ ਜਾਂਚ**
* 📢 **ਘੱਟ ਤੋਲਣ ਤੇ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰਨਾ**`,
    penalties: `⚖️ **ਕਾਨੂੰਨੀ ਜੁਰਮਾਨੇ:**

* **ਧਾਰਾ 25 (ਬਿਨਾਂ ਜਾਂਚੇ ਕਾਂਟੇ):** **₹25,000 ਤੱਕ ਜੁਰਮਾਨਾ**; ਦੂਜੀ ਵਾਰ **1 ਸਾਲ ਦੀ ਕੈਦ**।
* **ਧਾਰਾ 30 (ਘੱਟ ਤੋਲਣਾ):** **₹10,000 ਤੱਕ ਜੁਰਮਾਨਾ**।`
  }
};

// English default knowledge base
const englishKnowledge = [
  {
    category: 'identity',
    keywords: ['who are you', 'what is your name', 'chat wizard', 'who created you', 'what can you do'],
    response: `🧙‍♂️ **Namaste! I am Chat Wizard**, your official AI Assistant for **TolSeva** (Legal Metrology Department, Government of India).

Here is how I can assist you:
* ⚖️ **Legal Metrology Act, 2009:** Explain rules, sections, validity, and compliance obligations.
* 📝 **Instrument Registration:** Step-by-step guidance on registering weighing machines, balances, and weighbridges.
* 📅 **Inspection Appointments:** Help you book or reschedule physical verification with authorized inspectors.
* 🚨 **Fines & Penalties:** Details on penalties for unverified instruments (Section 25) and short weighment (Section 30).
* 🔍 **QR Verification:** How to scan and verify digital certificates on commercial scales.
* 📢 **Citizen Complaints:** Guidance on lodging and tracking complaints against weighing fraud or dual MRP.

Feel free to ask your question in English, Hindi, or any Indian regional language!`
  },
  {
    category: 'registration',
    keywords: ['register', 'registration', 'new machine', 'add machine', 'add instrument', 'new weighing'],
    response: `📝 **How to Register a New Instrument on TolSeva:**

1. **Log in:** Go to **Vendor Login** using your 15-character **GSTIN** and the OTP sent to your registered mobile.
2. **Open Machine Inventory:** From your Vendor Dashboard, click the **"Add Machine"** button.
3. **Fill in Details:**
   - **Make & Model** (e.g., Essae DS-852, Avery Weigh-Tronix)
   - **Serial Number** (as stamped on the machine plate)
   - **Type** (Counter Scale, Platform Scale, Weighbridge, Fuel Dispenser)
   - **Max Capacity & Accuracy Class** (Class I, II, III, or IV)
4. **Submit:** The instrument will be created with status **PENDING**.
5. **Next Step:** Book an inspection appointment so a Legal Metrology Officer can verify and stamp it.`
  },
  {
    category: 'appointment',
    keywords: ['appointment', 'book', 'schedule', 'inspection', 'visit', 'date'],
    response: `📅 **Booking an Inspection Appointment:**

1. Navigate to your **Vendor Dashboard**.
2. Click **"Book Appointment"** next to your registered instrument or from the quick actions.
3. Choose:
   - The **Machine / Instrument** to inspect
   - Preferred **Inspection Date**
   - **Purpose:** *New Registration*, *Annual Renewal*, or *Re-verification after Repair*
4. Click **Submit Booking**.
5. An authorized Legal Metrology Inspector will be assigned to your area and you will receive SMS confirmation.`
  },
  {
    category: 'penalties',
    keywords: ['fine', 'penalty', 'legal', 'act', 'section', 'punishment', 'imprisonment'],
    response: `⚖️ **Key Penalties under the Legal Metrology Act, 2009:**

* **Section 25 (Unverified Weights/Measures):**
  - Using unverified or non-stamped scale: Fine up to **₹25,000**.
  - Subsequent / repeat offense: **Imprisonment up to 1 year** plus fine.
* **Section 30 (Short Weight or Measure):**
  - Cheating consumers by delivering less than paid for: Fine up to **₹10,000** (repeat offense up to ₹50,000 and/or 1 year jail).
* **Section 27 (Non-standard Units):**
  - Quoting or selling in non-metric units: Fine up to **₹10,000**.
* **Section 28 (Making Non-standard Measures):**
  - Manufacturing non-standard weights: Fine up to **₹20,000**.
* **Section 29 (Selling Unverified Measures):**
  - Selling or delivering unverified measures: Fine up to **₹10,000**.
* **Section 36 (Packaged Commodities Violations):**
  - Selling above MRP or altering MRP labels: Fine up to **₹25,000** (1st offense), up to **₹50,000** (2nd), and up to **₹1,00,000** or 1 year jail for subsequent offenses.`
  },
  {
    category: 'contact',
    keywords: ['contact', 'help', 'support', 'phone', 'email', 'toll free', 'helpline'],
    response: `📞 **Official Legal Metrology Support & Helplines:**

* **National Toll-Free Helpline:** 1800-11-4000 (Toll-Free, Pan-India)
* **Official Email:** lmd.support@consumeraffairs.gov.in
* **Working Hours:** Monday to Friday, 10:00 AM – 5:00 PM IST
* **Ministry:** Department of Consumer Affairs, Krishi Bhawan, New Delhi - 110001
* **Online Assistant:** You can also ask me (**Chat Wizard**) anytime for instant step-by-step guidance!`
  }
];

function getFallbackBotResponse(query, lang = 'en') {
  const q = (query || '').toLowerCase().trim();
  const langKey = lang.toLowerCase();

  // Check language-specific fallback pack first
  const langPack = fallbackResponsesByLang[langKey];
  if (langPack) {
    if (q.includes('penalty') || q.includes('fine') || q.includes('दंड') || q.includes('जुर्माना') || q.includes('ശിക്ഷ') || q.includes('தண்டனை') || q.includes('ਜੁਰਮਾਨਾ')) {
      if (langPack.penalties) return langPack.penalties;
    }
    if (q.includes('register') || q.includes('पंजीकरण') || q.includes('नोंदણી') || q.includes('ਨੰਬਰ') || q.includes('பதிவு')) {
      if (langPack.registration) return langPack.registration;
    }
    if (q.includes('appointment') || q.includes('मुलाकात') || q.includes('तપાસણી') || q.includes('booking')) {
      if (langPack.appointment) return langPack.appointment;
    }
    if (q.includes('who are you') || q.includes('who') || q.includes('name') || q.includes('ਕੌਣ') || q.includes('யார்') || q.includes('ಕೌಣ')) {
      if (langPack.identity) return langPack.identity;
    }
    // Return language identity greeting if available
    if (langPack.identity) return langPack.identity;
  }

  // English fallback search
  for (const item of englishKnowledge) {
    if (item.keywords.some(kw => q.includes(kw))) {
      return item.response;
    }
  }

  return `🧙‍♂️ **Chat Wizard Legal Metrology Assistant:**

I can assist you with:
* 📝 **Registering new instruments:** Weighing scales, counter balances, weighbridges, fuel dispensers.
* 📅 **Appointments & Renewals:** Scheduling annual inspector visits and checking expiry dates.
* ⚖️ **Legal Metrology Act, 2009:** Understanding penalties for unverified scales (Section 25) or short weight (Section 30).
* 📦 **Packaged Commodities Rules 2011:** Mandatory labels, net weight, and dual MRP restrictions.
* 🔍 **QR Verification:** Verifying merchant digital certificates online.
* 📢 **Citizen Complaints:** Filing and tracking complaints against weighing fraud.

Could you please rephrase or specify which topic you would like help with?`;
}

// POST /api/bot/assist
router.post('/assist', apiLimiter, async (req, res) => {
  let { query: userQuery, lang = 'en', history = [] } = req.body;

  // Enforce size limits to prevent unexpected API usage
  if (userQuery) userQuery = userQuery.substring(0, 1000);
  if (Array.isArray(history)) {
    history = history.map(msg => ({
      ...msg,
      text: msg.text ? msg.text.substring(0, 1000) : ''
    })).slice(-10); // keep max 10 messages
  }

  const targetLang = getLanguageName(lang);

  if (!userQuery || !userQuery.trim()) {
    const greeting = fallbackResponsesByLang[lang]?.identity || '🧙‍♂️ Hello! I am Chat Wizard, your AI Legal Metrology Assistant. How can I assist you today?';
    return res.json({
      reply: greeting,
      source: 'system',
      timestamp: new Date().toISOString()
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If Gemini API key is configured, use Google GenAI
  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      // Dynamically ground the system prompt to enforce the selected user language
      const systemInstruction = `${BASE_SYSTEM_INSTRUCTION}

=======================================================
CURRENT USER LANGUAGE SELECTION: ${targetLang.toUpperCase()} (${lang})
CRITICAL LANGUAGE DIRECTIVE:
The user has chosen ${targetLang} as their portal language.
You MUST write your ENTIRE reply in ${targetLang}.
Use the official, standard script for ${targetLang} (e.g., Devanagari script for Hindi and Marathi, Bengali script for Bengali, Tamil script for Tamil, Gurmukhi script for Punjabi, etc.).
Do NOT respond in English unless the selected language is English or the user explicitly asks in English.
=======================================================`;

      // Build conversation contents with history ensuring strict alternating roles
      const contents = [];
      let isOngoing = false;

      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-8);
        let lastRole = null;

        for (const item of recentHistory) {
          if (!item.text || !item.text.trim()) continue;
          const role = item.role === 'user' ? 'user' : 'model';

          // Skip initial greeting if it is model before any user turn
          if (contents.length === 0 && role === 'model') continue;
          // Avoid consecutive identical roles in Gemini multi-turn payload
          if (role === lastRole) continue;

          contents.push({
            role,
            parts: [{ text: item.text.trim() }]
          });
          lastRole = role;
        }

        // If the last turn in history was user, pop it to avoid consecutive user turns
        if (lastRole === 'user' && contents.length > 0) {
          contents.pop();
        }

        if (contents.length > 0) {
          isOngoing = true;
        }
      }

      // Add conversational directive to prevent repeating introductions on ongoing turns
      const continuityDirective = isOngoing
        ? '\n\n[Context: Conversation is already ongoing. DO NOT repeat "Hello! I am Chat Wizard" or re-introduce yourself. Answer the user\'s question directly and concisely.]'
        : '';

      const languageDirective = targetLang !== 'English'
        ? `\n\n[Instruction: Reply completely in ${targetLang} language using its native script.]`
        : '';

      contents.push({
        role: 'user',
        parts: [{ text: `${userQuery}${continuityDirective}${languageDirective}` }]
      });

      // Try candidate models in order to handle temporary model load/503 spikes seamlessly
      for (const candidateModel of GEMINI_MODELS) {
        try {
          const config = {
            systemInstruction
          };
          if (candidateModel !== 'gemini-3.8-flash') {
            config.temperature = 0.7;
          }

          const response = await ai.models.generateContent({
            model: candidateModel,
            contents,
            config
          });

          const reply = response.text;
          if (reply && reply.trim()) {
            return res.json({
              reply: reply.trim(),
              source: `gemini (${candidateModel})`,
              lang: targetLang,
              timestamp: new Date().toISOString()
            });
          }
        } catch (modelErr) {
          console.warn(`Model ${candidateModel} failed (${modelErr.message.substring(0, 100)}).`);
          // If error is authentication/authorization or bad request, don't retry other models
          if (modelErr.status === 401 || modelErr.status === 403 || modelErr.status === 400 || modelErr.status === 404) {
            console.error(`Fatal API error (${modelErr.status}). Breaking fallback loop.`);
            break;
          }
        }
      }
    } catch (err) {
      console.warn('All Gemini AI model attempts failed, falling back to Chat Wizard Knowledge Engine:', err.message);
    }
  }

  // Graceful fallback to rich Legal Metrology knowledge engine in chosen language
  const reply = getFallbackBotResponse(userQuery, lang);
  res.json({
    reply,
    source: 'knowledge_engine',
    lang: targetLang,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
