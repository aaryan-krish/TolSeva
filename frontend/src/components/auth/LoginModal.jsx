import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, Smartphone, Shield, Crown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { requestVendorOtp, verifyVendorOtp, inspectorLogin, adminLogin } from '../../services/api.js'

export default function LoginModal({ onClose }) {
  const [role, setRole] = useState('vendor')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ gstin: '', phone: '', otp: '', gov_id: '', password: '', username: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError('') }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Login to TolSeva</h2>
          <button onClick={onClose} className="text-white hover:text-gold-400"><X size={20} /></button>
        </div>
        <div className="flex border-b border-gray-200">
          {[{ key: 'vendor', label: 'Vendor', icon: Smartphone },
            { key: 'inspector', label: 'Inspector', icon: Shield },
            { key: 'admin', label: 'Admin', icon: Crown }].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setRole(key); setStep(1); setError('') }}
              className={"flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors " + (role === key ? 'border-b-2 border-navy-900 text-navy-900 bg-blue-50' : 'text-gray-500 hover:text-gray-700')}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}
          {role === 'vendor' && step === 1 && (
            <form onSubmit={handleVendorRequestOtp} className="space-y-4">
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
          {role === 'vendor' && step === 2 && (
            <form onSubmit={handleVendorVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">OTP sent to +91{form.phone}. <button type="button" className="text-navy-900 underline" onClick={() => setStep(1)}>Change</button></p>
              <div>
                <label className="block text-sm font-semibold mb-1">Enter OTP *</label>
                <input name="otp" value={form.otp} onChange={update} className="input-field text-center text-xl tracking-[0.5em] font-bold" placeholder="000000" maxLength={6} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Verifying...' : 'Verify & Login'}</button>
            </form>
          )}
          {role === 'inspector' && (
            <form onSubmit={handleInspectorLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Government ID *</label>
                <input name="gov_id" value={form.gov_id} onChange={update} className="input-field" placeholder="e.g. LMI-MH-001" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Password *</label>
                <div className="relative">
                  <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={update} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPwd(p => !p)}>
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Logging in...' : 'Login as Inspector'}</button>
            </form>
          )}
          {role === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Username *</label>
                <input name="username" value={form.username} onChange={update} className="input-field" placeholder="admin" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Password *</label>
                <div className="relative">
                  <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={update} className="input-field pr-10" placeholder="••••••••" required />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPwd(p => !p)}>
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