import { useState } from 'react'
import { X, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { changePassword } from '../../services/api.js'

export default function ChangePasswordModal({ onClose }) {
  const { auth } = useAuth()
  const isVendor = auth?.role === 'vendor'

  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.new_password.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }

    if (form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        current_password: form.current_password,
        new_password: form.new_password
      }
      const res = await changePassword(payload)
      setSuccess(res.data?.message || 'Password changed successfully!')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => {
        onClose()
      }, 1800)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to change password. Please check your current password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Change Password</h2>
              <p className="text-xs text-emerald-100">
                Update account credentials for <span className="font-semibold">{auth?.user?.business_name || auth?.user?.full_name || auth?.user?.username}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">
                Current Password {isVendor && <span className="font-normal text-gray-400">(optional if never set)</span>}
              </label>
            </div>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
                placeholder="Enter current password"
                className="input-field pr-10"
                required={!isVendor}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              New Password <span className="text-gray-400 font-normal">(min 6 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Enter new secure password"
                className="input-field pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className="input-field pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600 flex items-center gap-1.5">
              <Lock size={12} /> Security Reminder:
            </p>
            <p>Do not share your password with anyone. Use a strong password with a mix of letters, numbers, and symbols.</p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm py-2 px-5 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
