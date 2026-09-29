import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import LoginModal from '../auth/LoginModal.jsx'
import ProfileMenu from '../profile/ProfileMenu.jsx'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { auth, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const dashboardLink = auth?.role === 'vendor' ? '/vendor'
    : auth?.role === 'inspector' ? '/inspector'
    : auth?.role === 'admin' ? '/admin' : '/'

  // When user is logged in, hide the redundant white navbar bar
  if (auth) {
    return null
  }

  return (
    <>
      <nav className="bg-white border-b-2 border-orange-600 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to={auth ? dashboardLink : "/"} className="flex items-center gap-2">
              <img src="/logo.png" alt="TolSeva Logo" className="h-10 object-contain" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-5 lg:gap-6">
              {!auth && (
                <>
                  <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium text-sm transition-colors">{t('navHome')}</Link>
                  <a href="#about" className="text-gray-700 hover:text-orange-600 font-medium text-sm transition-colors">{t('navAbout')}</a>
                  <a href="#services" className="text-gray-700 hover:text-orange-600 font-medium text-sm transition-colors">{t('navServices')}</a>
                  <Link to="/track-complaint" className="text-gray-700 hover:text-orange-600 font-medium text-sm transition-colors flex items-center gap-1">
                    Track Complaint
                  </Link>
                  <a href="#contact" className="text-gray-700 hover:text-orange-600 font-medium text-sm transition-colors">{t('navContact')}</a>
                </>
              )}

              {auth ? (
                <ProfileMenu variant="navbar" />
              ) : (
                <button onClick={() => setShowLogin(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                  <LogIn size={16} /> {t('login')}
                </button>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              {auth && <ProfileMenu variant="navbar" />}
              <button className="p-2 text-gray-700" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 space-y-2">
            {!auth && (
              <>
                <Link to="/" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>{t('navHome')}</Link>
                <a href="#about" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>{t('navAbout')}</a>
                <a href="#services" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>{t('navServices')}</a>
                <Link to="/track-complaint" className="block py-2 text-orange-600 font-medium" onClick={() => setMenuOpen(false)}>Track Complaint</Link>
                <a href="#contact" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>{t('navContact')}</a>
              </>
            )}
            {!auth && (
              <button onClick={() => { setShowLogin(true); setMenuOpen(false) }} className="btn-primary w-full text-sm">{t('login')}</button>
            )}
          </div>
        )}
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}