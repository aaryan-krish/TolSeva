import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  ExternalLink,
  RefreshCw,
  KeyRound,
  ArrowLeft
} from 'lucide-react'
import { requestComplaintTrackingOtp, verifyComplaintTrackingOtp } from '../services/api.js'

export default function TrackComplaintPage() {
  const { trackingId: paramId } = useParams()
  const navigate = useNavigate()

  const [searchId, setSearchId] = useState(paramId || '')
  const [step, setStep] = useState('INPUT_ID') // 'INPUT_ID' | 'ENTER_OTP' | 'VIEW_STATUS'
  const [otp, setOtp] = useState('')
  const [phoneMasked, setPhoneMasked] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (paramId) {
      setSearchId(paramId)
      handleRequestOtp(paramId)
    }
  }, [paramId])

  async function handleRequestOtp(idToRequest) {
    const cleanId = String(idToRequest || searchId || '').trim()
    if (!cleanId) return

    setLoading(true)
    setError(null)
    try {
      const res = await requestComplaintTrackingOtp({ trackingId: cleanId })
      setPhoneMasked(res.data.phone_masked || '')
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp)
      }
      setStep('ENTER_OTP')
    } catch (err) {
      setComplaint(null)
      setError(
        err.response?.data?.error ||
        'No complaint found with this Tracking ID. Please verify the ID and try again.'
      )
      setStep('INPUT_ID')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    const cleanId = String(searchId || '').trim()
    const cleanOtp = String(otp || '').trim()
    if (!cleanId || !cleanOtp) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await verifyComplaintTrackingOtp({ trackingId: cleanId, otp: cleanOtp })
      setComplaint(res.data)
      setStep('VIEW_STATUS')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Invalid or expired verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleStartOver() {
    setSearchId('')
    setOtp('')
    setPhoneMasked('')
    setDevOtp('')
    setComplaint(null)
    setError(null)
    setStep('INPUT_ID')
    navigate('/track-complaint')
  }

  // Determine active step index (0: OPEN, 1: INVESTIGATING, 2: RESOLVED)
  const currentStatus = String(complaint?.status || '').toUpperCase()
  const stepIndex =
    currentStatus === 'RESOLVED' || currentStatus === 'CLOSED'
      ? 2
      : currentStatus === 'INVESTIGATING'
      ? 1
      : 0

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-br from-[#162F6A] via-[#1A387E] to-[#214AAB] text-white relative overflow-hidden py-12 px-4 shadow-sm border-b-4 border-[#5279D7]">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A3BBF3]" />
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#5279D7]" />
            <span className="text-[#D2DFFF] text-xs font-semibold tracking-wider uppercase">
              Legal Metrology Department • Citizen Grievance Redressal
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Track Citizen Complaint Status
          </h1>
          <p className="text-[#D2DFFF] text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Verify your registered contact to monitor real-time investigation progress, field audit results, and official actions taken by the Legal Metrology Department.
          </p>

          {/* Search Box - Visible in INPUT_ID step */}
          {step === 'INPUT_ID' && (
            <form onSubmit={e => { e.preventDefault(); handleRequestOtp(searchId) }} className="mt-8 max-w-2xl">
              <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-200">
                <div className="relative flex-1 flex items-center">
                  <Search size={20} className="text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. cmp-...)"
                    className="w-full pl-11 pr-4 py-3 text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none rounded-xl"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-3 px-7 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 rounded-xl"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Search size={16} /> Track Status
                    </>
                  )}
                </button>
              </div>
              <p className="text-2xs text-slate-400 mt-2 pl-2">
                💡 Tip: A verification code will be sent to the complainant's registered mobile number for privacy and security.
              </p>
            </form>
          )}
        </div>

        {/* Decorative lighting */}
        <div className="absolute right-0 -bottom-10 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
              <AlertCircle size={22} />
            </div>
            <h3 className="text-base font-bold text-red-950">Verification Notice</h3>
            <p className="text-sm text-red-800 max-w-md mx-auto mt-1 leading-relaxed">
              {error}
            </p>
            {step !== 'INPUT_ID' && (
              <button
                type="button"
                onClick={handleStartOver}
                className="mt-4 btn-outline text-xs py-1.5 px-4 bg-white"
              >
                Try Another Tracking ID
              </button>
            )}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm mb-6">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-base">Processing Request</h3>
            <p className="text-xs text-slate-500 mt-1">Connecting to Legal Metrology Registry Database...</p>
          </div>
        )}

        {/* STEP 2: Enter Verification OTP */}
        {step === 'ENTER_OTP' && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <KeyRound size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Security Verification Required</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                To protect citizen privacy, a 6-digit verification code has been dispatched to the complainant's registered mobile ending in <strong className="text-slate-900">{phoneMasked || 'registered number'}</strong>.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-mono">
                Tracking ID: <span className="font-bold">{searchId}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter 6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="input-field text-center text-xl tracking-[0.5em] font-bold py-3"
                  autoFocus
                  required
                />
              </div>

              {devOtp && (
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="w-full text-xs text-emerald-700 hover:text-emerald-800 font-medium py-1.5 px-2 bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                >
                  Demo Mode: Click to fill code ({devOtp})
                </button>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-primary w-full py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} /> Verify &amp; View Status
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRequestOtp(searchId)}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <ArrowLeft size={13} /> Change Tracking ID
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Display Sanitized Status */}
        {step === 'VIEW_STATUS' && !loading && complaint && (
          <div className="space-y-6">
            {/* Status Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Tracking ID:</span>
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                      {complaint.id}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    {complaint.category || 'Measurement Discrepancy'}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      Reported: {complaint.created_at ? new Date(complaint.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Official Record'}
                    </span>
                    {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} />
                        Last Updated: {new Date(complaint.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {currentStatus === 'RESOLVED' || currentStatus === 'CLOSED' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                      <CheckCircle2 size={16} /> Action Taken / Resolved
                    </span>
                  ) : currentStatus === 'INVESTIGATING' ? (
                    <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                      <Clock size={16} className="animate-spin text-indigo-600" /> Under Active Investigation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                      <Clock size={16} /> Grievance Registered (Open)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="pt-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Investigation &amp; Resolution Lifecycle
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Step 1 */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    stepIndex >= 0
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 0 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}>
                        ✓
                      </span>
                      <span className="font-bold text-xs">1. Grievance Lodged</span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-normal">
                      Verified via Citizen Mobile OTP and recorded in Legal Metrology Central Registry.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    stepIndex >= 1
                      ? 'bg-indigo-50/60 border-indigo-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {stepIndex >= 1 ? '✓' : '2'}
                      </span>
                      <span className="font-bold text-xs">2. Department Audit</span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-normal">
                      {stepIndex >= 1
                        ? 'Assigned to Inspector. Field calibration test and verification in progress.'
                        : 'Pending administrative assignment to regional inspection officer.'}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    stepIndex >= 2
                      ? 'bg-emerald-50/80 border-emerald-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        stepIndex >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {stepIndex >= 2 ? '✓' : '3'}
                      </span>
                      <span className="font-bold text-xs">3. Resolution &amp; Action</span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-normal">
                      {stepIndex >= 2
                        ? 'Inspection concluded. Enforcement action and official findings recorded.'
                        : 'Awaiting completion of inspection & administrative resolution.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Link if available */}
              {complaint.certificate_id && (
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Related Certificate Reference:</span>
                  <Link
                    to={`/verify/${encodeURIComponent(complaint.certificate_id)}`}
                    className="text-emerald-700 hover:text-emerald-800 font-mono font-bold hover:underline flex items-center gap-1"
                    target="_blank"
                  >
                    {complaint.certificate_id} <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* Actions & Helpline Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-amber-400">Need Immediate Assistance or Follow-up?</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  You can quote your Tracking ID <span className="font-mono text-amber-300 font-bold">{complaint.id}</span> to the Legal Metrology Consumer Toll-Free Desk at <strong className="text-white">1800-11-4000</strong> (Mon–Fri, 10 AM – 5 PM).
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-outline border-white text-white hover:bg-white hover:text-slate-900 text-xs py-2 px-4 whitespace-nowrap"
                >
                  Track Another Complaint
                </button>
                <Link to="/" className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
                  Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Initial Empty Guide */}
        {step === 'INPUT_ID' && !loading && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Enter Your Tracking ID Above</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Enter the Complaint Reference ID provided when submitting your grievance. For security and citizen data privacy, an OTP verification code will be sent to the complainant's phone before displaying investigation status.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
