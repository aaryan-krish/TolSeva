import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Scale,
  FileText,
  User,
  Phone,
  Calendar,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  RefreshCw
} from 'lucide-react'
import { trackPublicComplaint } from '../services/api.js'

export default function TrackComplaintPage() {
  const { trackingId: paramId } = useParams()
  const navigate = useNavigate()

  const [searchId, setSearchId] = useState(paramId || '')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (paramId) {
      setSearchId(paramId)
      fetchStatus(paramId)
    }
  }, [paramId])

  async function fetchStatus(idToFetch) {
    const cleanId = String(idToFetch || '').trim()
    if (!cleanId) return

    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await trackPublicComplaint(cleanId)
      setComplaint(res.data)
    } catch (err) {
      setComplaint(null)
      setError(
        err.response?.data?.error ||
        'No complaint found with this Tracking ID. Please verify the ID and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (!searchId.trim()) return
    navigate(`/track-complaint/${encodeURIComponent(searchId.trim())}`)
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
      <section className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white relative overflow-hidden py-12 px-4 shadow-sm border-b-4 border-orange-600">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              Legal Metrology Department • Citizen Grievance Redressal
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Track Citizen Complaint Status
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Monitor real-time investigation progress, field audit results, and official actions taken by the Legal Metrology Department against reported measurement inaccuracies.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-2xl">
            <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-200">
              <div className="relative flex-1 flex items-center">
                <Search size={20} className="text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  placeholder="Enter Tracking ID (e.g. cmp-174...)"
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
                    <RefreshCw size={16} className="animate-spin" /> Tracking...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Track Status
                  </>
                )}
              </button>
            </div>
            <p className="text-2xs text-slate-400 mt-2 pl-2">
              💡 Tip: The Tracking ID was displayed on your confirmation screen when you reported the machine via QR code.
            </p>
          </form>
        </div>

        {/* Decorative lighting */}
        <div className="absolute right-0 -bottom-10 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-base">Retrieving Complaint Records</h3>
            <p className="text-xs text-slate-500 mt-1">Connecting to Legal Metrology Registry Database...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-red-950">Record Not Found</h3>
            <p className="text-sm text-red-800 max-w-md mx-auto mt-1 leading-relaxed">
              {error}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link to="/" className="btn-outline text-xs py-2 px-4 bg-white">
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Initial Empty State (if no param given yet) */}
        {!loading && !error && !complaint && !searched && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <Scale size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Enter Your Tracking ID Above</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Please enter the Tracking ID assigned when filing your report to inspect the current state of departmental investigation, inspector assignment, and punitive or corrective actions.
            </p>
          </div>
        )}

        {/* Success Complaint Details */}
        {!loading && complaint && (
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
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Calendar size={13} />
                    Reported on {complaint.created_at ? new Date(complaint.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Official Record'}
                  </p>
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
                        ? 'Assigned to Inspector. Field calibration test and evidence audit in progress.'
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
                        ? 'Inspection concluded. Official remarks & enforcement action recorded.'
                        : 'Awaiting completion of inspection & administrative resolution.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Action Notes / Official Findings */}
            {complaint.admin_notes && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-emerald-950 text-sm">
                        Official Department Action &amp; Resolution Remarks
                      </h3>
                      <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                        Admin Recorded
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-2 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-emerald-200 whitespace-pre-wrap font-medium">
                      {complaint.admin_notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Grievance Description & Complainant Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <FileText size={16} className="text-orange-600" />
                Citizen Complaint Report Summary
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1">Reported Issue Description:</p>
                <p className="whitespace-pre-wrap italic text-slate-600">
                  "{complaint.description}"
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500">Complainant Name:</span>
                  <span className="font-semibold text-slate-800">{complaint.complainant_name || 'Citizen'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500">Contact Number:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    +91 {complaint.complainant_phone_masked || '******'}
                  </span>
                  <span className="text-2xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Target Establishment & Machine Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Establishment / Vendor Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-700" />
                  Reported Establishment Details
                </h3>
                {complaint.vendor ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Business / Shop:</span>
                      <span className="font-bold text-slate-800 text-right">{complaint.vendor.business_name}</span>
                    </div>
                    {complaint.vendor.gstin && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">GSTIN:</span>
                        <span className="font-mono font-medium text-slate-800">{complaint.vendor.gstin}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-medium text-slate-800">
                        {[complaint.vendor.city, complaint.vendor.state].filter(Boolean).join(', ') || 'Registered Location'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Vendor information recorded under department registry.</p>
                )}
              </div>

              {/* Machine / Instrument Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Scale size={16} className="text-amber-600" />
                  Instrument / Stamping Information
                </h3>
                <div className="space-y-2.5 text-xs">
                  {complaint.instrument ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Instrument Model:</span>
                        <span className="font-bold text-slate-800 text-right">
                          {complaint.instrument.make} {complaint.instrument.model}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Serial Number:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {complaint.instrument.serial_no}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Capacity / Type:</span>
                        <span className="font-medium text-slate-800">
                          {complaint.instrument.capacity} {complaint.instrument.unit} ({complaint.instrument.instrument_type || 'Standard'})
                        </span>
                      </div>
                    </>
                  ) : null}

                  {complaint.certificate_id && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-slate-500">Certificate No:</span>
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
              </div>
            </div>

            {/* Helpline / Grievance Info Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-amber-400">Need Immediate Assistance or Additional Evidences?</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  You can provide photos, receipts, or escalate pending grievances to the Legal Metrology Consumer Toll-Free Desk at <strong className="text-white">1800-11-4000</strong> quoting your Tracking ID <span className="font-mono text-amber-300 font-bold">{complaint.id}</span>.
                </p>
              </div>
              <Link to="/" className="btn-outline border-white text-white hover:bg-white hover:text-slate-900 text-xs py-2 px-4 whitespace-nowrap shrink-0">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
