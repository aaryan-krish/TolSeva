import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, Smartphone, Shield, Crown, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  requestVendorOtp,
  verifyVendorOtp,
  inspectorLogin,
  adminLogin,
  requestPasswordResetOtp,
  verifyPasswordReset
} from '../../services/api.js'

export default function LoginModal({ onClose }) {
  const [role, setRole] = useState('vendor')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ gstin: '', phone: '', otp: '', gov_id: '', password: '', username: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Password reset state for Inspector & Admin
  const [isResetting, setIsResetting] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [resetForm, setResetForm] = useState({ identifier: '', otp: '', newPassword: '', confirmPassword: '' })
  const [resetShowPwd, setResetShowPwd] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  function update(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function updateReset(e) {
    setResetForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function switchRole(key) {
    setRole(key)
    setStep(1)
    setIsResetting(false)
    setResetStep(1)
    setError('')
    setSuccessMsg('')
  }

  function startReset() {
    setIsResetting(true)
    setResetStep(1)
    setError('')
    setSuccessMsg('')
    const prefill = role === 'inspector' ? form.gov_id : form.username
    setResetForm({ identifier: prefill || '', otp: '', newPassword: '', confirmPassword: '' })
  }

  function fillDemoLogin() {
    if (role === 'vendor') {
      setForm(f => ({ ...f, gstin: '27AAPFU0939F1ZV', phone: '9811223344', otp: '123456' }))
    } else if (role === 'inspector') {
      setForm(f => ({ ...f, gov_id: 'LMI-MH-001', password: 'Inspector@123' }))
    } else {
      setForm(f => ({ ...f, username: 'admin', password: 'Admin@123' }))
    }
    setError('')
  }

  async function handleVendorRequestOtp(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await requestVendorOtp({ gstin: form.gstin, phone: form.phone })
      if (res.data.dev_otp) setForm(f => ({ ...f, otp: res.data.dev_otp }))
      setStep(2)
    } catch (err) { setError(err.response?.data?.error || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  async function handleVendorVerifyOtp(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await verifyVendorOtp({ gstin: form.gstin, otp: form.otp })
      login(res.data.token, res.data.vendor, 'vendor')
      onClose(); navigate('/vendor')
    } catch (err) { setError(err.response?.data?.error || 'Invalid OTP') }
    finally { setLoading(false) }
  }

  async function handleInspectorLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await inspectorLogin({ gov_id: form.gov_id, password: form.password })
      login(res.data.token, res.data.inspector, 'inspector')
      onClose(); navigate('/inspector')
    } catch (err) { setError(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  async function handleAdminLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await adminLogin({ username: form.username, password: form.password })
      login(res.data.token, res.data.admin, 'admin')
      onClose(); navigate('/admin')
    } catch (err) { setError(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  async function handleRequestResetOtp(e) {
    e.preventDefault()
    if (!resetForm.identifier.trim()) {
      setError('Please enter your Government ID / Username or registered phone')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await requestPasswordResetOtp({ role, identifier: resetForm.identifier.trim() })
      setMaskedPhone(res.data.phone_masked || '')
      if (res.data.dev_otp) {
        setResetForm(f => ({ ...f, otp: res.data.dev_otp }))
      }
      setResetStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyResetPassword(e) {
    e.preventDefault()
    if (!resetForm.otp || resetForm.otp.length !== 6) {
      setError('Please enter the valid 6-digit OTP')
      return
    }
    if (resetForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true); setError('')
    try {
      await verifyPasswordReset({
        role,
        identifier: resetForm.identifier.trim(),
        otp: resetForm.otp.trim(),
        new_password: resetForm.newPassword
      })
      setSuccessMsg('Password has been reset successfully! Please sign in with your new password.')
      // Pre-fill back in login form
      if (role === 'inspector') {
        setForm(f => ({ ...f, gov_id: resetForm.identifier.trim(), password: '' }))
      } else {
        setForm(f => ({ ...f, username: resetForm.identifier.trim(), password: '' }))
      }
      setIsResetting(false)
      setResetStep(1)
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isResetting && (
              <button
                type="button"
                onClick={() => { setIsResetting(false); setError(''); setSuccessMsg('') }}
                className="text-white hover:text-green-500 p-1 rounded transition-colors mr-1"
                title="Back to Login"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {isResetting ? 'Reset Password' : 'Login to TolSeva'}
              </h2>
              {isResetting && (
                <span className="text-xs text-green-400 capitalize">
                  {role} Account Password Recovery
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-green-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'vendor', label: 'Vendor', icon: Smartphone },
            { key: 'inspector', label: 'Inspector', icon: Shield },
            { key: 'admin', label: 'Admin', icon: Crown }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => switchRole(key)}
              className={"flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors " + (role === key ? 'border-b-2 border-emerald-600 text-emerald-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700')}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm flex items-start gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ═══════════ PASSWORD RESET VIEW (INSPECTOR & ADMIN) ═══════════ */}
          {isResetting && (
            <div>
              {resetStep === 1 ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                    <p className="font-semibold mb-1 flex items-center gap-1">
                      <KeyRound size={14} /> Password Reset via Registered Mobile
                    </p>
                    Enter your {role === 'inspector' ? 'Government ID (e.g. LMI-MH-001)' : 'Username (e.g. admin)'} or registered mobile number to receive a 6-digit verification code.
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      {role === 'inspector' ? 'Government ID or Registered Mobile *' : 'Username or Registered Mobile *'}
                    </label>
                    <input
                      name="identifier"
                      value={resetForm.identifier}
                      onChange={updateReset}
                      className="input-field"
                      placeholder={role === 'inspector' ? 'e.g. LMI-MH-001 or 9876500001' : 'e.g. admin or 9876500000'}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setIsResetting(false); setError('') }}
                      className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold underline"
                    >
                      ← Back to regular login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyResetPassword} className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-emerald-600">
                    <p className="font-medium">
                      Verification code dispatched to registered mobile ending in:
                    </p>
                    <p className="font-bold text-sm tracking-wider text-emerald-950 mt-0.5">
                      +91 {maskedPhone || '******'}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setResetStep(1); setError('') }}
                      className="text-emerald-500 underline mt-1.5 font-semibold text-xs inline-block"
                    >
                      Change ID / Mobile
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Enter 6-Digit OTP *</label>
                    <input
                      name="otp"
                      value={resetForm.otp}
                      onChange={updateReset}
                      className="input-field text-center text-xl tracking-[0.5em] font-bold"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">New Password *</label>
                    <div className="relative">
                      <input
                        name="newPassword"
                        type={resetShowPwd ? 'text' : 'password'}
                        value={resetForm.newPassword}
                        onChange={updateReset}
                        className="input-field pr-10"
                        placeholder="Minimum 6 characters"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setResetShowPwd(p => !p)}
                      >
                        {resetShowPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Confirm New Password *</label>
                    <input
                      name="confirmPassword"
                      type={resetShowPwd ? 'text' : 'password'}
                      value={resetForm.confirmPassword}
                      onChange={updateReset}
                      className="input-field"
                      placeholder="Re-enter new password"
                      minLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? 'Verifying & Updating...' : 'Set New Password'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setIsResetting(false); setResetStep(1); setError('') }}
                      className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold underline"
                    >
                      Cancel and back to login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ═══════════ REGULAR LOGIN VIEWS ═══════════ */}
          {!isResetting && role === 'vendor' && step === 1 && (
            <form onSubmit={handleVendorRequestOtp} className="space-y-4">
              {import.meta.env.DEV && (
                <button type="button" onClick={fillDemoLogin} className="btn-outline w-full text-sm">
                  Fill demo vendor login
                </button>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1">GSTIN *</label>
                <input name="gstin" value={form.gstin} onChange={update} className="input-field" placeholder="e.g. 27AAPFU0939F1ZV" maxLength={15} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Registered Mobile Number *</label>
                <div className="flex">
                  <span className="px-3 py-2.5 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md text-sm text-gray-600">+91</span>
                  <input name="phone" value={form.phone} onChange={update} className="input-field rounded-l-none" placeholder="9876543210" maxLength={10} required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending OTP...' : 'Send OTP'}</button>
              <p className="text-xs text-gray-500 text-center">OTP will be sent to your registered mobile number</p>
            </form>
          )}

          {!isResetting && role === 'vendor' && step === 2 && (
            <form onSubmit={handleVendorVerifyOtp} className="space-y-4">
              {import.meta.env.DEV && (
                <button type="button" onClick={fillDemoLogin} className="btn-outline w-full text-sm">
                  Fill demo OTP
                </button>
              )}
              <p className="text-sm text-gray-600">OTP sent to +91{form.phone}. <button type="button" className="text-emerald-600 underline" onClick={() => setStep(1)}>Change</button></p>
              <div>
                <label className="block text-sm font-semibold mb-1">Enter OTP *</label>
                <input name="otp" value={form.otp} onChange={update} className="input-field text-center text-xl tracking-[0.5em] font-bold" placeholder="000000" maxLength={6} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Verifying...' : 'Verify & Login'}</button>
            </form>
          )}

          {!isResetting && role === 'inspector' && (
            <form onSubmit={handleInspectorLogin} className="space-y-4">
              {import.meta.env.DEV && (
                <button type="button" onClick={fillDemoLogin} className="btn-outline w-full text-sm">
                  Fill demo inspector login
                </button>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1">Government ID *</label>
                <input name="gov_id" value={form.gov_id} onChange={update} className="input-field" placeholder="e.g. LMI-MH-001" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold">Password *</label>
                  <button
                    type="button"
                    onClick={startReset}
                    className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={update} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(p => !p)}>
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Logging in...' : 'Login as Inspector'}</button>
            </form>
          )}

          {!isResetting && role === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {import.meta.env.DEV && (
                <button type="button" onClick={fillDemoLogin} className="btn-outline w-full text-sm">
                  Fill demo admin login
                </button>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1">Username *</label>
                <input name="username" value={form.username} onChange={update} className="input-field" placeholder="admin" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold">Password *</label>
                  <button
                    type="button"
                    onClick={startReset}
                    className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={update} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(p => !p)}>
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Logging in...' : 'Login as Admin'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}