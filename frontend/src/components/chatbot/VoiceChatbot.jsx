import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  User,
  Scale
} from 'lucide-react'
import { askBot } from '../../services/api.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

// Helper to strip markdown symbols for clean Text-to-Speech playback
function cleanTextForSpeech(raw) {
  if (!raw) return ''
  return raw
    .replace(/[*#_`~>]/g, '') // remove markdown characters
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove links
    .replace(/\s+/g, ' ')
    .trim()
}

// Simple, safe inline markdown-style formatter for chat bubbles
function FormattedMessage({ text, isBot }) {
  if (!text) return null

  const lines = text.split('\n')

  return (
    <div className={`space-y-1.5 text-sm leading-relaxed ${isBot ? 'text-gray-800' : 'text-white'}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ')
        const isNumber = /^\d+\.\s/.test(trimmed)

        const formatInline = (str) => {
          const parts = []
          const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
          let lastIdx = 0
          let match

          while ((match = regex.exec(str)) !== null) {
            if (match.index > lastIdx) {
              parts.push(str.slice(lastIdx, match.index))
            }
            const token = match[0]
            if (token.startsWith('**') && token.endsWith('**')) {
              parts.push(
                <strong key={match.index} className={isBot ? 'font-semibold text-gray-950' : 'font-bold text-white'}>
                  {token.slice(2, -2)}
                </strong>
              )
            } else if (token.startsWith('`') && token.endsWith('`')) {
              parts.push(
                <code key={match.index} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-orange-700 font-mono">
                  {token.slice(1, -1)}
                </code>
              )
            }
            lastIdx = regex.lastIndex
          }
          if (lastIdx < str.length) {
            parts.push(str.slice(lastIdx))
          }
          return parts.length > 0 ? parts : str
        }

        if (isBullet) {
          const content = trimmed.replace(/^[*\-]\s+/, '')
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${isBot ? 'bg-orange-500' : 'bg-orange-200'}`} />
              <div className="flex-1">{formatInline(content)}</div>
            </div>
          )
        }

        if (isNumber) {
          const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/)
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className={`font-semibold flex-shrink-0 text-xs mt-0.5 ${isBot ? 'text-orange-600' : 'text-orange-200'}`}>
                  {numMatch[1]}
                </span>
                <div className="flex-1">{formatInline(numMatch[2])}</div>
              </div>
            )
          }
        }

        return <p key={idx}>{formatInline(line)}</p>
      })}
    </div>
  )
}

// Comprehensive localized content for all 10 supported Indian languages
const LOCALIZED_DATA = {
  en: {
    greeting: `✨ **Namaste! I am Chat Wizard**, your AI Legal Metrology Assistant for TolSeva.\n\nI can help you with:\n* ⚖️ **Legal Metrology Act, 2009** & Penalties (Sections 25, 30)\n* 📝 **Weighing Machine Registration & Verification**\n* 📅 **Booking Inspector Inspection Visits**\n* 📦 **Packaged Commodities (MRP & Net Quantity)**\n* 📢 **Filing & Tracking Citizen Complaints**\n\nAsk me anything or tap a suggestion below!`,
    switchedNotice: `🌐 **Language switched to English.** Chat Wizard will now respond in English.`,
    placeholder: `Ask Chat Wizard anything...`,
    listening: `Listening... speak your question now`,
    quickTopics: `Quick Topics`,
    micHint: `🎙️ Click mic to speak`,
    actHint: `Legal Metrology Act, 2009`,
    prompts: [
      { label: '⚖️ Penalties under Act', query: 'What are the penalties under the Legal Metrology Act for unverified scales and short weight?' },
      { label: '📝 Register machine', query: 'How do I register a new weighing machine on TolSeva?' },
      { label: '📅 Book appointment', query: 'How do I book an inspection appointment for my instrument?' },
      { label: '📦 Packaged goods rules', query: 'What are the mandatory declarations under Legal Metrology Packaged Commodities Rules?' },
      { label: '🔍 Verify certificate', query: 'How can citizens verify the QR code on a shopkeeper weighing scale?' },
      { label: '🚨 Report fraud', query: 'How can I file a complaint against short weighment or dual MRP?' }
    ]
  },
  hi: {
    greeting: `✨ **नमस्ते! मैं तोलसेवा का चैट विज़ार्ड (Chat Wizard) हूँ**, आपका एआई विधिक मापविज्ञान सहायक।\n\nमैं आपकी निम्न विषयों में सहायता कर सकता हूँ:\n* ⚖️ **विधिक मापविज्ञान अधिनियम, 2009** व दंड (धारा 25, 30)\n* 📝 **तोल एवं माप उपकरणों का नया ऑनलाइन पंजीकरण**\n* 📅 **निरीक्षक जांच हेतु अपॉइंटमेंट बुकिंग**\n* 📦 **पैकेज्ड वस्तुएं (MRP व शुद्ध मात्रा नियम)**\n* 📢 **कम तोलने या धोखाधड़ी की शिकायत दर्ज व ट्रैक करना**\n\nकृपया अपना प्रश्न पूछें या नीचे दिए गए किसी विषय पर टैप करें!`,
    switchedNotice: `🌐 **भाषा बदलकर हिन्दी कर दी गई है।** अब चैट विज़ार्ड आपके सभी प्रश्नों के उत्तर हिन्दी में देगा।`,
    placeholder: `चैट विज़ार्ड से कुछ भी पूछें...`,
    listening: `सुन रहा हूँ... अब अपना प्रश्न बोलें`,
    quickTopics: `त्वरित विषय`,
    micHint: `🎙️ बोलने के लिए माइक दबाएं`,
    actHint: `विधिक मापविज्ञान अधिनियम, 2009`,
    prompts: [
      { label: '⚖️ कानून के तहत जुर्माना', query: 'बिना सत्यापन तोल मशीन और कम तोलने पर विधिक मापविज्ञान अधिनियम के तहत क्या जुर्माना है?' },
      { label: '📝 मशीन पंजीकरण', query: 'तोलसेवा पोर्टल पर नया तोल उपकरण कैसे पंजीकृत करें?' },
      { label: '📅 अपॉइंटमेंट बुक करें', query: 'निरीक्षक द्वारा सत्यापन के लिए अपॉइंटमेंट कैसे बुक करें?' },
      { label: '📦 पैकेज्ड वस्तु नियम', query: 'पैकेज्ड वस्तुओं पर आवश्यक घोषणाएं और एमआरपी के नियम क्या हैं?' },
      { label: '🔍 प्रमाणपत्र जांचें', query: 'दुकानदार के तराजू पर लगा क्यूआर कोड प्रमाणपत्र कैसे सत्यापित करें?' },
      { label: '🚨 शिकायत दर्ज करें', query: 'कम तोलने या अधिक दाम वसूलने पर शिकायत कैसे दर्ज करें?' }
    ]
  },
  mr: {
    greeting: `✨ **नमस्कार! मी तोलसेवा चॅट विझार्ड (Chat Wizard) आहे**, आपला एआय वैध मापनशास्त्र सहाय्यक.\n\nमी खालील विषयांवर आपल्याला मदत करू शकतो:\n* ⚖️ **वैध मापनशास्त्र कायदा, 2009** आणि दंड (कलम 25, 30)\n* 📝 **वजन आणि मापन उपकरणांची नवीन नोंदणी**\n* 📅 **तपासणीसाठी निरीक्षक भेटीचे बुकिंग**\n* 📦 **पॅकेज्ड वस्तूंचे नियम (MRP व निव्वळ प्रमाण)**\n* 📢 **नागरिक तक्रारी नोंदवणे आणि ट्रॅक करणे**\n\nआपला प्रश्न विचारा किंवा खालील विषयावर टॅप करा!`,
    switchedNotice: `🌐 **भाषा बदलून मराठी करण्यात आली आहे.** आता चॅट विझार्ड मराठीमध्ये उत्तरे देईल.`,
    placeholder: `चॅट विझार्डला काहीही विचारा...`,
    listening: `ऐकत आहे... कृपया आता बोला`,
    quickTopics: `महत्त्वाचे विषय`,
    micHint: `🎙️ बोलण्यासाठी माइकवर टॅप करा`,
    actHint: `वैध मापनशास्त्र कायदा, 2009`,
    prompts: [
      { label: '⚖️ कायद्यांतर्गत दंड', query: 'अवैध वजन काटे आणि कमी वजनासाठी काय दंड आहे?' },
      { label: '📝 उपकरण नोंदणी', query: 'तोलसेवावर नवीन वजन काटा कसा नोंदवावा?' },
      { label: '📅 अपॉइंटमेंट बुकिंग', query: 'तपासणीसाठी निरीक्षकांची अपॉइंटमेंट कशी बुक करावी?' },
      { label: '📦 पॅकेजिंग नियम', query: 'पॅकेज्ड वस्तूंवर एमआरपी आणि वजनाचे काय नियम आहेत?' },
      { label: '🔍 प्रमाणपत्र पडताळणी', query: 'क्यूआर कोड प्रमाणपत्र कसे तपासावे?' },
      { label: '🚨 तक्रार नोंदवा', query: 'कमी वजन दिल्यास तक्रार कशी नोंदवावी?' }
    ]
  },
  bn: {
    greeting: `✨ **নমস্কার! আমি তোলসেবা চ্যাট উইজার্ড (Chat Wizard)**, আপনার এআই লিগ্যাল মেট্রোলজি সহায়ক।\n\nআমি আপনাকে সাহায্য করতে পারি:\n* ⚖️ **লিগ্যাল মেট্রোলজি আইন, ২০০৯** ও জরিমানা (ধারা ২৫, ৩০)\n* 📝 **ওজন ও পরিমাপক যন্ত্রের নতুন নিবন্ধন**\n* 📅 **পরিদর্শকের পরিদর্শনের জন্য অ্যাপয়েন্টমেন্ট বুকিং**\n* 📦 **প্যাকেজড পণ্য সংক্রান্ত নিয়মাবলী (MRP ও পরিমাণ)**\n* 📢 **অভিযোগ দায়ের ও ট্র্যাক করা**\n\nযেকোনো প্রশ্ন জিজ্ঞাসা করুন বা নিচের বিকল্পে ট্যাপ করুন!`,
    switchedNotice: `🌐 **ভাষা বাংলায় পরিবর্তন করা হয়েছে।** চ্যাট উইজার্ড এখন বাংলায় উত্তর দেবে।`,
    placeholder: `চ্যাট উইজার্ডকে যেকোনো প্রশ্ন করুন...`,
    listening: `শুনছি... এখন আপনার প্রশ্ন বলুন`,
    quickTopics: `প্রয়োজনীয় বিষয়`,
    micHint: `🎙️ কথা বলতে মাইকে চাপুন`,
    actHint: `লিগ্যাল মেট্রোলজি আইন, ২০০৯`,
    prompts: [
      { label: '⚖️ আইনের অধীনে জরিমানা', query: 'যাচাইবিহীন স্কেল এবং ওজনে কম দেওয়ার জরিমানা কী?' },
      { label: '📝 যন্ত্র নিবন্ধন', query: 'তোলসেবায় নতুন ওজন যন্ত্র কীভাবে নিবন্ধন করবেন?' },
      { label: '📅 অ্যাপয়েন্টমেন্ট বুকিং', query: 'পরিদর্শনের জন্য অ্যাপয়েন্টমেন্ট কীভাবে বুক করবেন?' },
      { label: '📦 প্যাকেজিং নিয়ম', query: 'প্যাকেজড পণ্যে কী কী তথ্য থাকা বাধ্যতামূলক?' },
      { label: '🔍 কিউআর যাচাই', query: 'দোকানের স্কেলের কিউআর কোড কীভাবে যাচাই করবেন?' },
      { label: '🚨 অভিযোগ দায়ের', query: 'কম ওজন দেওয়ার বিরুদ্ধে কীভাবে অভিযোগ করবেন?' }
    ]
  },
  ta: {
    greeting: `✨ **வணக்கம்! நான் டோல்சேவா சாட் விசார்ட் (Chat Wizard)**, உங்கள் AI சட்ட அளவியல் உதவியாளர்.\n\nநான் உங்களுக்கு உதவக்கூடியவை:\n* ⚖️ **சட்ட அளவியல் சட்டம், 2009** & அபராதங்கள் (பிரிவு 25, 30)\n* 📝 **புதிய எடைக்கருவி பதிவு செய்தல்**\n* 📅 **ஆய்வாளர் ஆய்வுக்கான முன்பதிவு**\n* 📦 **பாக்கெட் செய்யப்பட்ட பொருட்கள் விதிமுறைகள்**\n* 📢 **புகார் பதிவு செய்தல் மற்றும் கண்காணித்தல்**\n\nஉங்கள் கேள்வியைக் கேளுங்கள்!`,
    switchedNotice: `🌐 **மொழி தமிழுக்கு மாற்றப்பட்டது.** சாட் விசார்ட் இப்போது தமிழில் பதிலளிக்கும்.`,
    placeholder: `சாட் விசார்டிடம் எதையும் கேளுங்கள்...`,
    listening: `கேட்கிறது... இப்போது பேசுங்கள்`,
    quickTopics: `முக்கிய தலைப்புகள்`,
    micHint: `🎙️ பேச மைக் பொத்தானை அழுத்தவும்`,
    actHint: `சட்ட அளவியல் சட்டம், 2009`,
    prompts: [
      { label: '⚖️ சட்ட அபராதங்கள்', query: 'சரிபார்க்கப்படாத எடைக்கருவிக்கு என்ன அபராதம்?' },
      { label: '📝 கருவி பதிவு', query: 'டோல்சேவாவில் புதிய எடைக்கருவியை எவ்வாறு பதிவு செய்வது?' },
      { label: '📅 முன்பதிவு செய்ய', query: 'ஆய்வாளர் ஆய்வுக்கு எவ்வாறு முன்பதிவு செய்வது?' },
      { label: '📦 பாக்கெட் விதிகள்', query: 'பாக்கெட் பொருட்களின் MRP விதிகள் யாவை?' },
      { label: '🔍 QR சரிபார்ப்பு', query: 'QR சான்றிதழை எவ்வாறு சரிபார்ப்பது?' },
      { label: '🚨 புகார் செய்ய', query: 'குறைவான எடைக்கு எவ்வாறு புகார் அளிப்பது?' }
    ]
  },
  te: {
    greeting: `✨ **నమస్కారం! నేను తోల్సేవ చాట్ విజార్డ్ (Chat Wizard)**, మీ AI లీగల్ మెట్రాలజీ సహాయకుడిని.\n\nనేను సహాయం చేయగల అంశాలు:\n* ⚖️ **లీగల్ మెట్రాలజీ చట్టం, 2009** మరియు జరిమానాలు (సెక్షన్ 25, 30)\n* 📝 **కొలత సాధనాల కొత్త నమోదు**\n* 📅 **ఇన్‌స్పెక్టర్ తనిఖీ అపాయింట్‌మెంట్ బుకింగ్**\n* 📦 **ప్యాక్ చేసిన వస్తువుల నిబంధనలు**\n* 📢 **ఫిర్యాదు దాఖలు మరియు ట్రాకింగ్**\n\nమీ ప్రశ్నను అడగండి!`,
    switchedNotice: `🌐 **భాష తెలుగులోకి మార్చబడింది.** చాట్ విజార్డ్ ఇప్పుడు తెలుగులో సమాధానం ఇస్తుంది.`,
    placeholder: `చాట్ విజార్డ్‌ని ఏదైనా అడగండి...`,
    listening: `వింటోంది... ఇప్పుడు మాట్లాడండి`,
    quickTopics: `శీఘ్ర విషయాలు`,
    micHint: `🎙️ మాట్లాడటానికి మైక్ నొక్కండి`,
    actHint: `లీగల్ మెట్రాలజీ చట్టం, 2009`,
    prompts: [
      { label: '⚖️ చట్టపరమైన జరిమానాలు', query: 'ధృవీకరించని కొలతలకు జరిమానా ఎంత?' },
      { label: '📝 పరికరాల నమోదు', query: 'కొత్త కొలత సాధనాన్ని ఎలా నమోదు చేయాలి?' },
      { label: '📅 అపాయింట్‌మెంట్ బుకింగ్', query: 'తనిఖీ కోసం అపాయింట్‌మెంట్ ఎలా బుక్ చేయాలి?' },
      { label: '📦 ప్యాకేజింగ్ నిబంధనలు', query: 'ప్యాక్ చేసిన వస్తువుల MRP నియమాలు ఏమిటి?' },
      { label: '🔍 QR ధృవీకరణ', query: 'QR కోడ్ సర్టిఫికెట్‌ను ఎలా ధృవీకరించాలి?' },
      { label: '🚨 ఫిర్యాదు చేయండి', query: 'తక్కువ బరువు ఇచ్చినప్పుడు ఎలా ఫిర్యాదు చేయాలి?' }
    ]
  },
  gu: {
    greeting: `✨ **નમસ્તે! હું તોલસેવા ચેટ વિઝાર્ડ (Chat Wizard) છું**, તમારો એઆઈ લીગલ મેટ્રોલોજી સહાયક.\n\nહું તમને નીચેની બાબતોમાં મદદ કરી શકું છું:\n* ⚖️ **લીગલ મેટ્રોલોજી એક્ટ, 2009** અને દંડ (કલમ 25, 30)\n* 📝 **તોલ અને માપન સાધનોની નવી નોંધણી**\n* 📅 **નિરીક્ષક તપાસ માટે એપોઇન્ટમેન્ટ બુકિંગ**\n* 📦 **પેકેજ્ડ વસ્તુઓના નિયમો (MRP અને નેટ વજન)**\n* 📢 **ગ્રાહક ફરિયાદ નોંધણી અને ટ્રેકિંગ**\n\nતમારો પ્રશ્ન પૂછો અથવા નીચે આપેલ વિષય પર ક્લિક કરો!`,
    switchedNotice: `🌐 **ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.** હવે ચેટ વિઝાર્ડ ગુજરાતીમાં જવાબ આપશે.`,
    placeholder: `ચેટ વિઝાર્ડને કંઈપણ પૂછો...`,
    listening: `સાંભળી રહ્યો છું... હવે બોલો`,
    quickTopics: `ઝડપી વિષયો`,
    micHint: `🎙️ બોલવા માટે માઇક દબાવો`,
    actHint: `લીગલ મેટ્રોલોજી એક્ટ, 2009`,
    prompts: [
      { label: '⚖️ કાયદા હેઠળ દંડ', query: 'ચકાસાયેલ ન હોય તેવા વજનકાંટા માટે શું દંડ છે?' },
      { label: '📝 સાધન નોંધણી', query: 'તોલસેવા પર નવું સાધન કેવી રીતે નોંધવું?' },
      { label: '📅 એપોઇન્ટમેન્ટ બુકિંગ', query: 'નિરીક્ષક મુલાકાત માટે એપોઇન્ટમેન્ટ કેવી રીતે લેવી?' },
      { label: '📦 પેકેજિંગ નિયમો', query: 'પેકેજ્ડ સામાન પર કઈ વિગતો ફરજિયાત છે?' },
      { label: '🔍 ક્યૂઆર ચકાસણી', query: 'દુકાનના વજનકાંટા પર ક્યૂઆર કોડ કેવી રીતે ચકાસવો?' },
      { label: '🚨 ફરિયાદ નોંધાવો', query: 'ઓછું વજન આપવા સામે કેવી રીતે ફરિયાદ કરવી?' }
    ]
  },
  kn: {
    greeting: `✨ **ನಮಸ್ಕಾರ! ನಾನು ತೋಲ್‌ಸೇವಾ ಚಾಟ್ ವಿಝಾರ್ಡ್ (Chat Wizard)**, ನಿಮ್ಮ AI ಲೀಗಲ್ ಮೆಟ್ರಾಲಜಿ ಸಹಾಯಕ.\n\nನಾನು ನಿಮಗೆ ಈ ಕೆಳಗಿನ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n* ⚖️ **ಲೀಗಲ್ ಮೆಟ್ರಾಲಜಿ ಕಾಯ್ದೆ, 2009** ಮತ್ತು ದಂಡಗಳು (ವಿಭಾಗ 25, 30)\n* 📝 **ತೂಕದ ಉಪಕರಣಗಳ ಹೊಸ ನೋಂದಣಿ**\n* 📅 **ಪರಿವೀಕ್ಷಕರ ಭೇಟಿಯ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕಿಂಗ್**\n* 📦 **ಪ್ಯಾಕ್ ಮಾಡಿದ ಸರಕುಗಳ ನಿಯಮಗಳು**\n* 📢 **ದೂರು ದಾಖಲಿಸುವುದು ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು**\n\nನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ!`,
    switchedNotice: `🌐 **ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.** ಚಾಟ್ ವಿಝಾರ್ಡ್ ಈಗ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತದೆ.`,
    placeholder: `ಚಾಟ್ ವಿಝಾರ್ಡ್ ಬಳಿ ಏನಾದರೂ ಕೇಳಿ...`,
    listening: `ಆಲಿಸುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ`,
    quickTopics: `ತ್ವರಿತ ವಿಷಯಗಳು`,
    micHint: `🎙️ ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ`,
    actHint: `ಲೀಗಲ್ ಮೆಟ್ರಾಲಜಿ ಕಾಯ್ದೆ, 2009`,
    prompts: [
      { label: '⚖️ ಕಾನೂನು ದಂಡಗಳು', query: 'ಪರಿಶೀಲಿಸದ ತೂಕದ ಯಂತ್ರಕ್ಕೆ ದಂಡವೇನು?' },
      { label: '📝 ಉಪಕರಣ ನೋಂದಣಿ', query: 'ಹೊಸ ತೂಕದ ಯಂತ್ರವನ್ನು ಹೇಗೆ ನೋಂದಾಯಿಸುವುದು?' },
      { label: '📅 ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್', query: 'ಪರಿಶೀಲನೆಗಾಗಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಹೇಗೆ ಬುಕ್ ಮಾಡುವುದು?' },
      { label: '📦 ಪ್ಯಾಕೇಜಿಂಗ್ ನಿಯಮ', query: 'ಪ್ಯಾಕ್ ಮಾಡಿದ ವಸ್ತುಗಳ ಮೇಲಿನ ನಿಯಮಗಳೇನು?' },
      { label: '🔍 QR ಪರಿಶೀಲನೆ', query: 'QR ಕೋಡ್ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸುವುದು?' },
      { label: '🚨 ದೂರು ನೀಡಿ', query: 'ಕಡಿಮೆ ತೂಕ ನೀಡಿದರೆ ದೂರು ದಾಖಲಿಸುವುದು ಹೇಗೆ?' }
    ]
  },
  ml: {
    greeting: `✨ **നമസ്കാരം! ഞാൻ തോൽസേവ ചാറ്റ് വിസാർഡ് (Chat Wizard)**, നിങ്ങളുടെ AI ലീഗൽ മെട്രോളജി സഹായി.\n\nഇനിപ്പറയുന്നവയിൽ ഞാൻ സഹായിക്കാം:\n* ⚖️ **ലീഗൽ മെട്രോളജി ആക്ട്, 2009** & പിഴകൾ (വകുപ്പ് 25, 30)\n* 📝 **അളവുതൂക്ക ഉപകരണ രജിസ്ട്രേഷൻ**\n* 📅 **ഇൻസ്പെക്ടർ പരിശോധനയ്ക്കുള്ള അപ്പോയിന്റ്മെന്റ്**\n* 📦 **പാക്കേജ്ഡ് ചരക്ക് നിയമങ്ങൾ**\n* 📢 **പരാതി രജിസ്റ്റർ ചെയ്യലും ട്രാക്കിംഗും**\n\nനിങ്ങളുടെ ചോദ്യം ചോദിക്കൂ!`,
    switchedNotice: `🌐 **ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.** ചാറ്റ് വിസാർഡ് ഇനി മലയാളത്തിൽ മറുപടി നൽകും.`,
    placeholder: `ചാറ്റ് വിസാർഡിനോട് ചോദിക്കൂ...`,
    listening: `ശ്രദ്ധിക്കുന്നു... സംസാരിക്കൂ`,
    quickTopics: `പ്രധാന വിഷയങ്ങൾ`,
    micHint: `🎙️ സംസാരിക്കാൻ മൈക്ക് അമർത്തുക`,
    actHint: `ലീഗൽ മെട്രോളജി ആക്ട്, 2009`,
    prompts: [
      { label: '⚖️ നിയമപരമായ പിഴകൾ', query: 'പരിശോധിക്കാത്ത അളവുതൂക്ക ഉപകരണങ്ങളുടെ പിഴ എന്താണ്?' },
      { label: '📝 ഉപകരണ രജിസ്ട്രേഷൻ', query: 'പുതിയ ഉപകരണം എങ്ങനെ രജിസ്റ്റർ ചെയ്യാം?' },
      { label: '📅 അപ്പോയിന്റ്മെന്റ്', query: 'പരിശോധനയ്ക്ക് അപ്പോയിന്റ്മെന്റ് എങ്ങനെ എടുക്കാം?' },
      { label: '📦 പാക്കേജിംഗ് നിയമം', query: 'പാക്ക് ചെയ്ത ഉൽപ്പന്നങ്ങളിലെ MRP നിയമങ്ങൾ എന്തൊക്കെയാണ്?' },
      { label: '🔍 QR പരിശോധന', query: 'QR കോഡ് സർട്ടിഫിക്കറ്റ് എങ്ങനെ പരിശോധിക്കാം?' },
      { label: '🚨 പരാതി നൽകുക', query: 'തൂക്കക്കുറവിനെതിരെ എങ്ങനെ പരാതി നൽകാം?' }
    ]
  },
  pa: {
    greeting: `✨ **ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੋਲਸੇਵਾ ਚੈਟ ਵਿਜ਼ਾਰਡ (Chat Wizard) ਹਾਂ**, ਤੁਹਾਡਾ AI ਲੀਗਲ ਮੈਟ੍ਰੋਲੋਜੀ ਸਹਾਇਕ।\n\nਮੈਂ ਹੇਠ ਲਿਖੇ ਵਿਸ਼ਿਆਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n* ⚖️ **ਲੀਗਲ ਮੈਟ੍ਰੋਲੋਜੀ ਐਕਟ, 2009** ਅਤੇ ਜੁਰਮਾਨੇ (ਧਾਰਾ 25, 30)\n* 📝 **ਤੋਲ ਯੰਤਰਾਂ ਦੀ ਨਵੀਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ**\n* 📅 **ਇੰਸਪੈਕਟਰ ਜਾਂਚ ਲਈ ਮੁਲਾਕਾਤ ਬੁਕਿੰਗ**\n* 📦 **ਪੈਕ ਕੀਤੀਆਂ ਵਸਤੂਆਂ ਦੇ ਨਿਯਮ**\n* 📢 **ਨਾਗਰਿਕ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰਨਾ ਅਤੇ ਟਰੈਕ ਕਰਨਾ**\n\nਆਪਣਾ ਸਵਾਲ ਪੁੱਛੋ!`,
    switchedNotice: `🌐 **ਭਾਸ਼ਾ ਬਦਲ ਕੇ ਪੰਜਾਬੀ ਕੀਤੀ ਗਈ ਹੈ।** ਚੈਟ ਵਿਜ਼ਾਰਡ ਹੁਣ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦੇਵੇਗਾ।`,
    placeholder: `ਚੈਟ ਵਿਜ਼ਾਰਡ ਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛੋ...`,
    listening: `ਸੁਣ ਰਿਹਾ ਹਾਂ... ਹੁਣ ਬੋਲੋ`,
    quickTopics: `ਮੁੱਖ ਵਿਸ਼ੇ`,
    micHint: `🎙️ ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ`,
    actHint: `ਲੀਗਲ ਮੈਟ੍ਰੋਲੋਜੀ ਐਕਟ, 2009`,
    prompts: [
      { label: '⚖️ ਕਾਨੂੰਨੀ ਜੁਰਮਾਨੇ', query: 'ਬਿਨਾਂ ਜਾਂਚੇ ਤੋਲ ਕਾਂਟੇ ਲਈ ਕੀ ਜੁਰਮਾਨਾ ਹੈ?' },
      { label: '📝 ਯੰਤਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ', query: 'ਤੋਲਸੇਵਾ ਤੇ ਨਵਾਂ ਯੰਤਰ ਕਿਵੇਂ ਰਜਿਸਟਰ ਕਰੀਏ?' },
      { label: '📅 ਮੁਲਾਕਾਤ ਬੁਕਿੰਗ', query: 'ਜਾਂਚ ਲਈ ਅਪਾਇੰਟਮੈਂਟ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?' },
      { label: '📦 ਪੈਕੇਜਿੰਗ ਨਿਯਮ', query: 'ਪੈਕ ਕੀਤੀਆਂ ਵਸਤੂਆਂ ਤੇ MRP ਦੇ ਕੀ ਨਿਯਮ ਹਨ?' },
      { label: '🔍 QR ਜਾਂਚ', query: 'ਕਿਊਆਰ ਕੋਡ ਸਰਟੀਫਿਕੇਟ ਦੀ ਜਾਂਚ ਕਿਵੇਂ ਕਰੀਏ?' },
      { label: '🚨 ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ', query: 'ਘੱਟ ਤੋਲਣ ਤੇ ਸ਼ਿਕਾਇਤ ਕਿਵੇਂ ਦਰਜ ਕਰੀਏ?' }
    ]
  }
};

export default function VoiceChatbot() {
  const { language, currentLangObj, t } = useLanguage()
  const [open, setOpen] = useState(false)

  // Current localized content bundle based on active portal language
  const currentLangData = LOCALIZED_DATA[language] || LOCALIZED_DATA.en

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: currentLangData.greeting,
      source: 'system'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [activeSpeechIdx, setActiveSpeechIdx] = useState(null)

  const prevLangRef = useRef(language)
  const recognitionRef = useRef(null)
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const accumulatedRef = useRef('')
  const silenceTimerRef = useRef(null)
  const isListeningRef = useRef(false)

  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = !!SpeechRecognition

  // Helper to completely stop speech recognition and clear timers
  const stopListening = useCallback(() => {
    isListeningRef.current = false
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  // React immediately whenever user changes the portal language
  useEffect(() => {
    if (prevLangRef.current === language) return
    prevLangRef.current = language

    const langData = LOCALIZED_DATA[language] || LOCALIZED_DATA.en

    // Cancel any active speech when language switches
    synthRef.current?.cancel()
    setActiveSpeechIdx(null)
    stopListening()

    setMessages(prev => {
      // If conversation hasn't really started yet, update initial greeting to the newly chosen language
      const userMessageCount = prev.filter(m => m.role === 'user').length
      if (userMessageCount === 0) {
        return [{
          role: 'bot',
          text: langData.greeting,
          source: 'system'
        }]
      }

      // If active conversation exists, announce that Chat Wizard is now communicating in the new language
      return [
        ...prev,
        {
          role: 'bot',
          text: langData.switchedNotice,
          source: 'system'
        }
      ]
    })
  }, [language, stopListening])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  // Speak bot response using speech synthesis (ensuring microphone is OFF so it never listens to itself)
  const speak = useCallback((text, messageIdx = null) => {
    // 1. Terminate speech recognition immediately to prevent feedback loop!
    stopListening()

    if (!ttsEnabled || !synthRef.current) return
    synthRef.current.cancel()

    const clean = cleanTextForSpeech(text)
    if (!clean) return

    const utter = new SpeechSynthesisUtterance(clean)
    utter.lang = currentLangObj?.speechCode || 'en-IN'
    utter.rate = 0.95
    utter.pitch = 1

    if (messageIdx !== null) {
      setActiveSpeechIdx(messageIdx)
    }

    utter.onend = () => {
      setActiveSpeechIdx(null)
    }
    utter.onerror = () => {
      setActiveSpeechIdx(null)
    }

    synthRef.current.speak(utter)
  }, [ttsEnabled, currentLangObj, stopListening])

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    // Immediately stop mic and cancel ongoing TTS
    stopListening()
    synthRef.current?.cancel()
    setActiveSpeechIdx(null)

    setInput('')
    accumulatedRef.current = ''
    setError('')
    const newMessages = [...messages, { role: 'user', text }]
    setMessages(newMessages)
    setLoading(true)

    // Prepare history payload for conversational AI
    const historyPayload = newMessages
      .filter(m => m.source !== 'system' || m.role === 'user')
      .slice(-8)
      .map(m => ({ role: m.role, text: m.text }))

    try {
      const res = await askBot(text, language, historyPayload)
      const reply = res.data?.reply || 'I could not process your query. Please try again.'
      const source = res.data?.source || 'ai'

      const updated = [...newMessages, { role: 'bot', text: reply, source }]
      setMessages(updated)

      // Guarantee microphone is off before starting speech synthesis
      stopListening()
      speak(reply, updated.length - 1)
    } catch (err) {
      console.error('Chat Wizard request error:', err)
      setError('Chat Wizard could not connect to server. Please check your network.')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickPrompt(promptQuery) {
    sendMessage(promptQuery)
  }

  function handleResetChat() {
    synthRef.current?.cancel()
    setActiveSpeechIdx(null)
    stopListening()
    const langData = LOCALIZED_DATA[language] || LOCALIZED_DATA.en
    setMessages([{
      role: 'bot',
      text: langData.greeting,
      source: 'system'
    }])
    setError('')
  }

  function handleCopy(text, idx) {
    navigator.clipboard?.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  function toggleSpeechForMessage(text, idx) {
    if (activeSpeechIdx === idx) {
      synthRef.current?.cancel()
      setActiveSpeechIdx(null)
    } else {
      speak(text, idx)
    }
  }

  function startListening() {
    if (!supported) {
      setError('Voice recognition is not supported in this browser. Please type your query.')
      return
    }

    // Stop and cancel any active bot TTS audio before opening microphone!
    synthRef.current?.cancel()
    setActiveSpeechIdx(null)
    stopListening()

    setError('')
    accumulatedRef.current = ''
    setInput('')

    // Delay 200ms to flush any lingering speaker audio from output buffer
    setTimeout(() => {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = currentLangObj?.speechCode || 'en-IN'
        // continuous = true lets the user speak their entire sentence without cutting off prematurely
        recognition.continuous = true
        // interimResults = true gives real-time visual feedback in the input box
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (e) => {
          let interimText = ''
          let finalText = ''

          for (let i = 0; i < e.results.length; i++) {
            const part = e.results[i][0]?.transcript || ''
            if (e.results[i].isFinal) {
              finalText += (finalText ? ' ' : '') + part.trim()
            } else {
              interimText += (interimText ? ' ' : '') + part.trim()
            }
          }

          const combined = (finalText + (interimText ? ' ' + interimText : '')).trim()
          accumulatedRef.current = combined
          setInput(combined)

          // Reset silence timer on every speech packet received
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }

          // Give a generous 1800ms silence threshold before auto-sending the full sentence
          silenceTimerRef.current = setTimeout(() => {
            const toSend = accumulatedRef.current.trim()
            if (toSend) {
              stopListening()
              sendMessage(toSend)
            }
          }, 1800)
        }

        recognition.onerror = (e) => {
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('Speech recognition notice:', e.error)
            setError(`Voice input notice: ${e.error}. You can also type your query.`)
          }
          if (e.error !== 'no-speech') {
            stopListening()
          }
        }

        recognition.onend = () => {
          // If mic ended naturally and user had spoken something, send if silence timer expires
          if (isListeningRef.current) {
            const toSend = accumulatedRef.current.trim()
            if (toSend && !loading) {
              stopListening()
              sendMessage(toSend)
            } else {
              stopListening()
            }
          } else {
            setListening(false)
          }
        }

        recognitionRef.current = recognition
        isListeningRef.current = true
        recognition.start()
        setListening(true)
      } catch (err) {
        console.error('Voice recognition start error:', err)
        stopListening()
      }
    }, 200)
  }

  function handleStopListeningAndSend() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    const toSend = (accumulatedRef.current || input).trim()
    stopListening()
    if (toSend) {
      sendMessage(toSend)
    }
  }

  function handleCancelListening() {
    stopListening()
    setInput('')
    accumulatedRef.current = ''
  }

  function handleClose() {
    synthRef.current?.cancel()
    stopListening()
    setActiveSpeechIdx(null)
    setOpen(false)
  }

  return (
    <>
      {/* Floating Launcher Button */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 group flex items-center">
          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 px-4 py-3.5 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-2xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-orange-400"
            title={`${t('assistantTitle') || 'Chat Wizard'} • Ask AI`}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-200 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white animate-pulse" />
            </div>
            <div className="text-left font-bold text-sm tracking-wide flex items-center gap-1.5">
              <span>{t('assistantTitle') || 'Chat Wizard'}</span>
              <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI</span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Wizard Modal Box */}
      {open && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-orange-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ height: '580px', maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 px-4 py-3.5 flex items-center justify-between text-white flex-shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner relative">
                <Sparkles size={18} className="text-amber-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight tracking-wide">{t('assistantTitle') || 'Chat Wizard'}</h3>
                  <span className="text-[9px] bg-emerald-500/90 text-white font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                    {currentLangObj?.name || 'AI'}
                  </span>
                </div>
                <p className="text-orange-100 text-[11px] leading-tight opacity-90">{t('assistantSub') || 'AI Legal Metrology Assistant'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 text-orange-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setTtsEnabled(t => !t)}
                title={ttsEnabled ? 'Mute voice responses' : 'Enable voice responses'}
                className="p-1.5 text-orange-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={handleClose}
                title="Close Chat Wizard"
                className="p-1.5 text-orange-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const isSpeaking = activeSpeechIdx === i

              return (
                <div key={i} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Sparkles size={14} className="text-amber-200" />
                    </div>
                  )}

                  <div className={`group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-slate-200/80 rounded-bl-sm'
                  }`}>
                    <FormattedMessage text={msg.text} isBot={!isUser} />

                    {/* Bot Message Footer Actions */}
                    {!isUser && (
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-medium text-[10px] text-orange-700/80 uppercase">
                          {msg.source?.startsWith('gemini') ? '✨ Gemini AI' : '⚖️ Legal Metrology AI'}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleSpeechForMessage(msg.text, i)}
                            title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                            className={`p-1 rounded hover:bg-gray-100 transition-colors ${isSpeaking ? 'text-orange-600 animate-pulse' : 'text-gray-500'}`}
                          >
                            <Volume2 size={13} />
                          </button>
                          <button
                            onClick={() => handleCopy(msg.text, i)}
                            title="Copy response"
                            className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                          >
                            {copiedIdx === i ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <User size={14} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Localized Quick Suggestion Chips */}
            {messages.length <= 4 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles size={11} className="text-orange-500" /> {currentLangData.quickTopics}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentLangData.prompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPrompt(qp.query)}
                      disabled={loading}
                      className="text-xs bg-white hover:bg-orange-50 hover:border-orange-300 text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 transition-all text-left shadow-2xs hover:shadow-xs active:scale-95"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-2 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles size={14} className="text-amber-200 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-orange-600">
                      {currentLangData.listening || 'Chat Wizard is thinking'}
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 text-center">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Listening Overlay Status */}
          {listening && (
            <div className="bg-amber-50/95 border-t border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <div>
                  <span className="font-semibold text-amber-950">{currentLangData.listening}</span>
                  <span className="hidden sm:inline text-[11px] text-amber-700 ml-1.5">(pausing 1.8s auto-sends)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStopListeningAndSend}
                  disabled={!input.trim()}
                  className="px-2.5 py-1 rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Done &amp; Send
                </button>
                <button
                  type="button"
                  onClick={handleCancelListening}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium px-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-slate-200 p-3 bg-white flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage(input)
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={listening ? currentLangData.listening : currentLangData.placeholder}
                className="flex-1 text-sm bg-slate-50 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-gray-400"
                disabled={loading}
              />

              {supported && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={listening ? handleStopListeningAndSend : startListening}
                  className={`p-2.5 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
                    listening
                      ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700 disabled:opacity-40'
                  }`}
                  title={listening ? 'Click to finish and send' : currentLangData.micHint}
                >
                  {listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                title="Send message"
              >
                <Send size={17} />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-gray-400 px-2 mt-2">
              <span>{supported ? currentLangData.micHint : '⌨️ Type query'}</span>
              <span className="flex items-center gap-1">
                <Scale size={11} className="text-orange-600" /> {currentLangData.actHint}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}