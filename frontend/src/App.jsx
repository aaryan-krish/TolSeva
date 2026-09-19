import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import GovHeader from './components/layout/GovHeader.jsx'
import HomePage from './pages/HomePage.jsx'
import VendorDashboard from './pages/VendorDashboard.jsx'
import InspectorDashboard from './pages/InspectorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-saffron-600 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-green-500 mb-2">TolSeva</h4>
                <p className="text-gray-300">Unified Online Verification &amp; Certification Platform for Legal Metrology</p>
              </div>
              <div>
                <h4 className="font-bold text-green-500 mb-2">Quick Links</h4>
                <ul className="space-y-1 text-gray-300">
                  <li><a href="#about" className="hover:text-white">About Legal Metrology</a></li>
                  <li><a href="#services" className="hover:text-white">Our Services</a></li>
                  <li><a href="#contact" className="hover:text-white">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-green-500 mb-2">Helpline</h4>
                <p className="text-gray-300">Toll-free: 1800-11-4000</p>
                <p className="text-gray-300">lmd.support@consumeraffairs.gov.in</p>
                <p className="text-gray-300 mt-2">© 2026 Government of India</p>
              </div>
            </div>
          </footer>
          <VoiceChatbot />
        </div>
      </Router>
    </AuthProvider>
  </LanguageProvider>
  )
}

export default App
