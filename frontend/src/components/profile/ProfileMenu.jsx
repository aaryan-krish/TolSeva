import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, KeyRound, LogOut, ChevronDown, Building2, Shield, Crown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import ProfileModal from './ProfileModal.jsx'
import ChangePasswordModal from './ChangePasswordModal.jsx'

export default function ProfileMenu({ variant = 'navbar' }) {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  if (!auth) return null

  const role = auth.role
  const isVendor = role === 'vendor'
  const isInspector = role === 'inspector'
  const isAdmin = role === 'admin'

  const RoleIcon = isVendor ? Building2 : isInspector ? Shield : Crown
  const roleLabel = isVendor ? 'Vendor' : isInspector ? 'Inspector' : 'Administrator'

  const displayName = auth.user?.business_name || auth.user?.full_name || auth.user?.username || 'User'
  const identifier = auth.user?.gstin || auth.user?.gov_id || auth.user?.username || ''

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  // Button styling based on variant
  const isBanner = variant === 'banner'
  const buttonClasses = isBanner
    ? 'flex items-center gap-2 text-sm font-medium border border-white/30 rounded-lg px-3 py-2 bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer shadow-xs'
    : 'flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer shadow-2xs'

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        {/* Profile Trigger Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(prev => !prev)}
          className={buttonClasses}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isBanner ? 'bg-amber-400 text-emerald-950' : 'bg-orange-100 text-orange-700'
          }`}>
            <User size={15} />
          </div>
          <span className="max-w-[150px] truncate text-left">{displayName}</span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''} ${
              isBanner ? 'text-emerald-200' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100">
            {/* Header: User Summary */}
            <div className="px-4 py-3 bg-gray-50/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <RoleIcon size={11} /> {roleLabel}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
              {identifier && (
                <p className="text-xs font-mono text-gray-500 truncate mt-0.5">{identifier}</p>
              )}
            </div>

            {/* Menu Options */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setShowProfile(true)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left font-medium cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <User size={15} />
                </div>
                <div>
                  <span className="block font-semibold">Profile</span>
                  <span className="block text-2xs text-gray-400">View official account details</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setShowChangePassword(true)
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-left font-medium cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <KeyRound size={15} />
                </div>
                <div>
                  <span className="block font-semibold">Change Password</span>
                  <span className="block text-2xs text-gray-400">Update security credentials</span>
                </div>
              </button>
            </div>

            {/* Logout Option */}
            <div className="py-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left font-medium cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <LogOut size={15} />
                </div>
                <div>
                  <span className="block font-semibold">Logout</span>
                  <span className="block text-2xs text-red-400">Sign out of TolSeva portal</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onOpenChangePassword={() => {
            setShowProfile(false)
            setShowChangePassword(true)
          }}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>
  )
}
