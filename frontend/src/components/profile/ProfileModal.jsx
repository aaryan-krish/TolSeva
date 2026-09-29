import { useState, useEffect } from 'react'
import { X, User, Building2, Shield, Crown, Phone, Mail, MapPin, KeyRound, CheckCircle, Copy, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getMe } from '../../services/api.js'

export default function ProfileModal({ onClose, onOpenChangePassword }) {
  const { auth } = useAuth()
  const [profileData, setProfileData] = useState(auth?.user || {})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const res = await getMe()
        if (res.data?.user) {
          setProfileData(res.data.user)
        }
      } catch (err) {
        // Fallback to auth.user
        console.warn('Could not fetch fresh profile, using cached data', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const role = auth?.role || 'user'
  const isVendor = role === 'vendor'
  const isInspector = role === 'inspector'
  const isAdmin = role === 'admin'

  const roleTitle = isVendor ? 'Registered Vendor' : isInspector ? 'Legal Metrology Inspector' : 'System Administrator'
  const RoleIcon = isVendor ? Building2 : isInspector ? Shield : Crown
  const roleBadgeColor = isVendor
    ? 'bg-orange-100 text-orange-800 border-orange-200'
    : isInspector
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-emerald-100 text-emerald-800 border-emerald-200'

  const displayName = profileData.business_name || profileData.full_name || profileData.username || 'User'
  const primaryId = profileData.gstin || profileData.gov_id || profileData.username || profileData.id || '-'
  const idLabel = isVendor ? 'GSTIN' : isInspector ? 'Government ID' : 'Username'

  function copyToClipboard(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <RoleIcon size={32} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleBadgeColor}`}>
                  {roleTitle}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-200">
                  <CheckCircle size={13} className="text-emerald-300" /> Active
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-snug">{displayName}</h2>
              <p className="text-xs text-emerald-100">
                {idLabel}: <span className="font-mono font-bold text-white">{primaryId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="text-xs text-center text-gray-400 py-1">Updating profile details...</div>
          )}

          {/* Quick ID Badge with Copy */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{idLabel}</p>
              <p className="text-sm font-mono font-bold text-gray-900">{primaryId}</p>
            </div>
            <button
              onClick={() => copyToClipboard(primaryId)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-emerald-50 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
            {profileData.owner_name && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <User size={14} /> Owner / Authorized Person
                </div>
                <div className="font-semibold text-gray-900">{profileData.owner_name}</div>
              </div>
            )}

            {(profileData.phone || profileData.mobile) && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Phone size={14} /> Registered Mobile
                </div>
                <div className="font-semibold text-gray-900">{profileData.phone || profileData.mobile}</div>
              </div>
            )}

            {profileData.email && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Mail size={14} /> Email Address
                </div>
                <div className="font-semibold text-gray-900 truncate" title={profileData.email}>
                  {profileData.email}
                </div>
              </div>
            )}

            {profileData.zone && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <MapPin size={14} /> Assigned Zone
                </div>
                <div className="font-semibold text-gray-900">{profileData.zone}</div>
              </div>
            )}

            {profileData.designation && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Shield size={14} /> Designation
                </div>
                <div className="font-semibold text-gray-900">{profileData.designation}</div>
              </div>
            )}

            {profileData.department && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Building2 size={14} /> Department
                </div>
                <div className="font-semibold text-gray-900">{profileData.department}</div>
              </div>
            )}

            {(profileData.city || profileData.state) && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <MapPin size={14} /> Location / Address
                </div>
                <div className="font-semibold text-gray-900">
                  {[profileData.address, profileData.city, profileData.state].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Department Note */}
          <div className="text-xs text-gray-500 bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl flex items-start gap-2.5">
            <span className="text-emerald-700 font-bold text-sm">ℹ</span>
            <div>
              <span className="font-semibold text-emerald-900">Official Portal Account:</span> Registered under the Legal Metrology Department, Government of India.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose()
              if (onOpenChangePassword) onOpenChangePassword()
            }}
            className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-4 py-2 rounded-lg transition-colors"
          >
            <KeyRound size={16} /> Change Password
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
