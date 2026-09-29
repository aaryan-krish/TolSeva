import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import GovHeader from './components/layout/GovHeader.jsx'
import HomePage from './pages/HomePage.jsx'
import VendorDashboard from './pages/VendorDashboard.jsx'
import InspectorDashboard from './pages/InspectorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import PublicVerifyPage from './pages/PublicVerifyPage.jsx'
import TrackComplaintPage from './pages/TrackComplaintPage.jsx'
import VoiceChatbot from './components/chatbot/VoiceChatbot.jsx'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
          <GovHeader />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/vendor" element={<VendorDashboard />} />
              <Route path="/inspector" element={<InspectorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/verify/:certificateId" element={<PublicVerifyPage />} />
              <Route path="/track-complaint" element={<TrackComplaintPage />} />
              <Route path="/track-complaint/:trackingId" element={<TrackComplaintPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-slate-900 text-white pt-12 pb-6 border-t-4 border-orange-600">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-8 text-sm pb-8 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <img src="/logo.png" alt="TolSeva Logo" className="h-8 object-contain" />
                    <h4 className="font-bold text-orange-400 text-base">TolSeva</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">Unified Online Verification &amp; Certification Platform for Legal Metrology, Government of India.</p>
                </div>
                <div>
                  <h4 className="font-bold text-orange-400 mb-3 text-base">Quick Links</h4>
                  <ul className="space-y-2 text-slate-300">
                    <li><a href="#about" className="hover:text-white hover:underline transition-colors">About Legal Metrology</a></li>
                    <li><a href="#services" className="hover:text-white hover:underline transition-colors">Our Services</a></li>
                    <li><a href="/track-complaint" className="hover:text-white hover:underline transition-colors">Track Complaint Status</a></li>
                    <li><a href="#contact" className="hover:text-white hover:underline transition-colors">Contact Us &amp; Helplines</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-orange-400 mb-3 text-base">Citizen Helpline</h4>
                  <p className="text-slate-300">Toll-free: <span className="text-white font-semibold">1800-11-4000</span></p>
                  <p className="text-slate-300 mt-1">Email: <span className="text-white font-medium break-all">lmd.support@consumeraffairs.gov.in</span></p>
                  <p className="text-slate-400 text-xs mt-3">Ministry of Consumer Affairs, Food &amp; Public Distribution</p>
                </div>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <p>© 2026 Legal Metrology Department, Government of India. All Rights Reserved.</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>National Informatics Portal</span>
                </div>
              </div>
            </div>
            <div className="tricolor-strip mt-6" />
          </footer>
          <VoiceChatbot />
        </div>
      </Router>
    </AuthProvider>
  </LanguageProvider>
  )
}

export default App
