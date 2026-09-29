import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Building2,
  Calendar,
  Shield,
  Phone,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  KeyRound,
  Send,
  HelpCircle
} from 'lucide-react'
import { getPublicCertificate, requestPublicOtp, verifyPublicOtp, submitPublicComplaint } from '../services/api.js'

export default function PublicVerifyPage() {
  const { certificateId } = useParams()
  const [loading, setLoading] = useState(true)
  const [certData, setCertData] = useState(null)
  const [error, setError] = useState('')

  // Complaint & OTP states
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [otpStep, setOtpStep] = useState('input') // 'input' | 'otp_sent' | 'verified'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpHint, setOtpHint] = useState('')

  // Complaint details
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [complaintSuccess, setComplaintSuccess] = useState(null)
  const [complaintError, setComplaintError] = useState('')

  useEffect(() => {
    async function fetchCert() {
      setLoading(true)
      setError('')
      try {
        const res = await getPublicCertificate(certificateId)
        setCertData(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Verification certificate not found in the national registry.')
      } finally {
        setLoading(false)
      }
    }
    if (certificateId) {
      fetchCert()
    }
  }, [certificateId])

  async function handleSendOtp(e) {
    e.preventDefault()
    setOtpError('')
    if (!name || name.trim().length < 2) {
      setOtpError('Please enter your full name')
      return
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number')
      return
    }

    setOtpLoading(true)
    try {
      const res = await requestPublicOtp({ name: name.trim(), phone: cleanPhone })
      setOtpStep('otp_sent')
      if (res.data?.dev_otp) {
        setOtpHint(res.data.dev_otp)
      }
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP. Please check your mobile number.')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setOtpError('')
    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    if (!otp || otp.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code')
      return
    }

    setOtpLoading(true)
    try {
      await verifyPublicOtp({ phone: cleanPhone, otp: otp.trim() })
      setOtpStep('verified')
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid OTP code. Please enter 123456 or try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleComplaintSubmit(e) {
    e.preventDefault()
    setComplaintError('')
    if (!category) {
      setComplaintError('Please select a reason for your complaint')
      return
    }
    if (!description || description.trim().length < 5) {
      setComplaintError('Please describe the fault or measurement discrepancy')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        certificateId: certData?.certificate_no || certificateId,
        instrumentId: certData?.instrument?.id || null,
        vendorId: certData?.business?.id || null,
        citizen_name: name.trim(),
        citizen_phone: phone.replace(/\D/g, '').slice(-10),
        otp: otp.trim(),
        category,
        description: description.trim()
      }
      const res = await submitPublicComplaint(payload)
      setComplaintSuccess(res.data)
    } catch (err) {
      setComplaintError(err.response?.data?.error || 'Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white py-8 px-4 border-b-4 border-orange-500 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🏛️
            </div>
            <div>
              <p className="text-2xs sm:text-xs font-bold uppercase tracking-widest text-emerald-200">
                Government of India • Ministry of Consumer Affairs
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Legal Metrology Verification Registry
              </h1>
              <p className="text-xs text-slate-300">
                Live Public Verification &amp; Consumer Protection Service
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/30 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            ← TolSeva Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-base font-semibold text-gray-800">Verifying Certificate Authenticity...</p>
            <p className="text-xs text-gray-500 mt-1">Connecting to Government National Metrology Registry</p>
          </div>
        ) : error || !certData ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Found</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-800 text-left mb-6">
              <strong>Caution:</strong> If a merchant or trader presents this QR code claiming it is verified, it does not exist in the official TolSeva registry. Please report unverified instruments to your local Legal Metrology Inspector.
            </div>
            <Link to="/" className="btn-primary inline-flex text-sm py-2 px-5">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`rounded-2xl p-6 border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${
              certData.status === 'VALID'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-red-50/80 border-red-300 text-red-950'
            }`}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  certData.status === 'VALID' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {certData.status === 'VALID' ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      certData.status === 'VALID'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-red-200 text-red-900'
                    }`}>
                      {certData.status === 'VALID' ? '✓ Officially Verified' : certData.status}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      Ref: {certData.certificate_no}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mt-1">
                    {certData.status === 'VALID'
                      ? 'Legal Stamping & Accuracy Verified'
                      : 'Expired or Invalid Stamping'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Verified on <span className="font-semibold">{certData.verified_date || 'Registry Record'}</span> • Valid Until: <span className="font-bold text-emerald-800">{certData.valid_until || '12 Months'}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <a
                  href="#report-section"
                  onClick={() => setShowComplaintForm(true)}
                  className="btn-outline flex items-center gap-1.5 text-xs py-2 px-4 whitespace-nowrap bg-white"
                >
                  <AlertCircle size={14} /> Report Fault / Inaccuracy
                </a>
              </div>
            </div>

            {/* Certificate Details Mirror */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-amber-400" />
                  <h3 className="font-bold text-sm">Official Certificate Details</h3>
                </div>
                <span className="text-xs text-slate-300 font-mono">Act 2009 Compliant</span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Establishment / Vendor */}
                <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 border-b border-gray-200 pb-2">
                    <Building2 size={15} /> Establishment / Vendor
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Business Name:</span>
                      <span className="font-bold text-gray-900">{certData.business?.name}</span>
                    </div>
                    {certData.business?.owner_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Owner:</span>
                        <span className="font-medium text-gray-800">{certData.business.owner_name}</span>
                      </div>
                    )}
                    {certData.business?.gstin && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">GSTIN:</span>
                        <span className="font-mono font-bold text-gray-900">{certData.business.gstin}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-gray-800 text-right">
                        {[certData.business?.address, certData.business?.city, certData.business?.state].filter(Boolean).join(', ') || 'Registered Location'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weighing Instrument */}
                <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 border-b border-gray-200 pb-2">
                    <span className="text-sm">⚖️</span> Instrument Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Make &amp; Model:</span>
                      <span className="font-bold text-gray-900">{certData.instrument?.make} {certData.instrument?.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Serial Number:</span>
                      <span className="font-mono font-bold text-gray-900">{certData.instrument?.serial_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Instrument Type:</span>
                      <span className="font-medium text-gray-800">{certData.instrument?.instrument_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Capacity &amp; Unit:</span>
                      <span className="font-bold text-gray-900">{certData.instrument?.capacity} {certData.instrument?.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Officer */}
                <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 border-b border-gray-200 pb-2">
                    <Shield size={15} /> Verifying Inspector
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Officer Name:</span>
                      <span className="font-bold text-gray-900">{certData.inspector?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Government ID:</span>
                      <span className="font-mono font-bold text-gray-800">{certData.inspector?.gov_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Designation:</span>
                      <span className="font-medium text-gray-800">{certData.inspector?.designation}</span>
                    </div>
                    {certData.inspector?.zone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Jurisdiction:</span>
                        <span className="font-medium text-gray-800">{certData.inspector.zone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certification Standard */}
                <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800 border-b border-gray-200 pb-2">
                    <Calendar size={15} /> Official Stamping
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Certificate No:</span>
                      <span className="font-mono font-bold text-emerald-800">{certData.certificate_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Test Outcome:</span>
                      <span className="font-bold text-emerald-700">✓ PASSED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Calibration Validity:</span>
                      <span className="font-bold text-gray-900">{certData.valid_until || '12 Months'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Seal Status:</span>
                      <span className="text-emerald-700 font-semibold">Government Calibrated Seal Intact</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Consumer Protection / Complaint Section */}
            <div id="report-section" className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm overflow-hidden">
              <div className="bg-orange-50 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-orange-950 flex items-center gap-2">
                    <AlertCircle size={18} className="text-orange-600" />
                    Report Inaccurate Measures or Faulty Machine
                  </h3>
                  <p className="text-xs text-orange-800 mt-0.5">
                    Empowering Indian Consumers: Direct dispatch to the Legal Metrology Department
                  </p>
                </div>
                {!showComplaintForm && (
                  <button
                    onClick={() => setShowComplaintForm(true)}
                    className="btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    File Complaint
                  </button>
                )}
              </div>

              {showComplaintForm && (
                <div className="p-6">
                  {complaintSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={28} />
                      </div>
                      <h4 className="text-lg font-bold text-emerald-950">Complaint Registered Successfully</h4>
                      <p className="text-sm text-emerald-800 max-w-md mx-auto">
                        Your report has been forwarded directly to the Legal Metrology Administration Control Panel. An inspector will be assigned for surprise audit and calibration testing.
                      </p>
                      <div className="inline-block bg-white border border-emerald-200 px-4 py-2 rounded-lg font-mono text-xs font-bold text-emerald-900">
                        Tracking ID: {complaintSuccess.complaint_id}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Step 1: Customer Mobile Verification */}
                      <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            otpStep === 'verified' ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'
                          }`}>
                            {otpStep === 'verified' ? '✓' : '1'}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">
                            Citizen Verification (Name &amp; Mobile)
                          </h4>
                          {otpStep === 'verified' && (
                            <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              Mobile Verified
                            </span>
                          )}
                        </div>

                        {otpError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium mb-3">
                            {otpError}
                          </div>
                        )}

                        {otpStep === 'input' && (
                          <form onSubmit={handleSendOtp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name *</label>
                              <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Ramesh Kumar"
                                className="input-field"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">10-Digit Mobile Number *</label>
                              <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                maxLength={10}
                                className="input-field"
                                required
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="submit"
                                disabled={otpLoading}
                                className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
                              >
                                {otpLoading ? 'Sending OTP...' : <><Send size={14} /> Send OTP</>}
                              </button>
                            </div>
                          </form>
                        )}

                        {otpStep === 'otp_sent' && (
                          <form onSubmit={handleVerifyOtp} className="space-y-3">
                            <p className="text-xs text-gray-600">
                              Enter the 6-digit OTP code sent to <span className="font-bold text-gray-900">+91 {phone}</span>
                            </p>
                            {otpHint && (
                              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg">
                                💡 <strong>Test OTP Code:</strong> <span className="font-mono font-bold text-amber-950">{otpHint}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                className="input-field max-w-[200px] text-center tracking-widest font-mono font-bold text-base"
                                required
                              />
                              <button
                                type="submit"
                                disabled={otpLoading}
                                className="btn-primary text-xs py-2.5 px-5"
                              >
                                {otpLoading ? 'Verifying...' : 'Verify OTP'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setOtpStep('input')}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                              >
                                Edit Mobile
                              </button>
                            </div>
                          </form>
                        )}

                        {otpStep === 'verified' && (
                          <div className="text-xs text-gray-700 flex items-center gap-2">
                            <span>Complainant: <strong>{name}</strong> (+91 {phone})</span>
                          </div>
                        )}
                      </div>

                      {/* Step 2: Complaint Details */}
                      <form onSubmit={handleComplaintSubmit} className={`space-y-4 ${otpStep !== 'verified' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">
                            2
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">
                            Measurement Dispute / Machine Fault Details
                          </h4>
                        </div>

                        {complaintError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                            {complaintError}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Discrepancy / Violation Reason *
                          </label>
                          <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="input-field"
                            required
                          >
                            <option value="">Select reason</option>
                            <option value="Inaccurate Measurement / Giving Less Quantity">Inaccurate Measurement / Giving Less Quantity (Under-weighing)</option>
                            <option value="Manipulated Machine / Broken or Tampered Seal">Manipulated Machine / Broken or Tampered Calibration Seal</option>
                            <option value="Faulty Digital Weight Display">Faulty Digital Weight Display / Unreadable Screen</option>
                            <option value="Refusal to Show Digital Weight Reading">Refusal to Show Digital Weight Reading to Customer</option>
                            <option value="Expired or Missing Stamping Certificate">Expired or Missing Stamping Certificate</option>
                            <option value="Charging Above Net Weight / Gross Weighing">Charging Above Net Weight / Adding Packing Weight</option>
                            <option value="Other Violation">Other Legal Metrology Violation</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Complaint Description &amp; What Happened *
                          </label>
                          <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Please specify what item you purchased, the expected weight vs actual weight received, or any other observed malpractice..."
                            className="input-field min-h-24"
                            required
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-2xs text-gray-500">
                            Note: Falsified complaints are discouraged under the Legal Metrology Consumer Act.
                          </p>
                          <button
                            type="submit"
                            disabled={submitting || otpStep !== 'verified'}
                            className="btn-primary text-sm py-2 px-6 flex items-center gap-2"
                          >
                            {submitting ? 'Submitting to Department...' : 'Submit Official Complaint'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
