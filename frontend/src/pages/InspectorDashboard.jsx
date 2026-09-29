import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquareWarning,
  UserCheck,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  Building2,
  Calendar,
  ExternalLink,
  Plus,
  X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getAssignedVisits,
  getInspectorHistory,
  getInspectorComplaints,
  createInspectorComplaint
} from '../services/api.js'
import VisitList from '../components/inspector/VisitList.jsx'
import VerifyModal from '../components/inspector/VerifyModal.jsx'
import ProfileMenu from '../components/profile/ProfileMenu.jsx'

export default function InspectorDashboard() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'all_visits' | 'expired_visits' | 'approaching_visits' | 'history' | 'complaints' | 'profile'
  const [visits, setVisits] = useState([])
  const [history, setHistory] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingComplaints, setLoadingComplaints] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Report violation form state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm] = useState({
    vendorId: '',
    category: 'Tampered Weight / Seal Violation',
    description: '',
    evidenceUrl: ''
  })
  const [reportSaving, setReportSaving] = useState(false)
  const [reportMsg, setReportMsg] = useState('')

  if (!auth || auth.role !== 'inspector') {
    navigate('/')
    return null
  }

  useEffect(() => {
    fetchAllVisits()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    } else if (activeTab === 'complaints') {
      fetchComplaints()
    }
  }, [activeTab])

  async function fetchAllVisits() {
    setLoading(true)
    try {
      const res = await getAssignedVisits('all')
      setVisits(res.data.visits || [])
    } catch (e) {
      console.error('Error fetching assigned visits:', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const res = await getInspectorHistory()
      setHistory(res.data.history || [])
    } catch (e) {
      console.error('Error fetching history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function fetchComplaints() {
    setLoadingComplaints(true)
    try {
      const res = await getInspectorComplaints()
      setComplaints(res.data.complaints || [])
    } catch (e) {
      console.error('Error fetching complaints:', e)
    } finally {
      setLoadingComplaints(false)
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault()
    setReportSaving(true)
    setReportMsg('')
    try {
      await createInspectorComplaint(reportForm)
      setReportMsg('Violation report recorded successfully!')
      setReportForm({ vendorId: '', category: 'Tampered Weight / Seal Violation', description: '', evidenceUrl: '' })
      fetchComplaints()
      setTimeout(() => setShowReportModal(false), 1200)
    } catch (e) {
      console.error(e)
      setReportMsg(e.response?.data?.error || 'Failed to submit violation report')
    } finally {
      setReportSaving(false)
    }
  }

  // Counts & Categories
  const expiredVisits = useMemo(() => visits.filter(v => v.expiry_status === 'EXPIRED'), [visits])
  const approachingVisits = useMemo(() => visits.filter(v => v.expiry_status === 'EXPIRING_SOON' || v.expiry_status === 'APPROACHING'), [visits])

  // Filtered visits based on active tab and search query
  const displayedVisits = useMemo(() => {
    let list = visits
    if (activeTab === 'expired_visits') list = expiredVisits
    if (activeTab === 'approaching_visits') list = approachingVisits

    if (!searchQuery.trim()) return list

    const q = searchQuery.toLowerCase()
    return list.filter(v =>
      (v.business_name && v.business_name.toLowerCase().includes(q)) ||
      (v.make && v.make.toLowerCase().includes(q)) ||
      (v.model && v.model.toLowerCase().includes(q)) ||
      (v.serial_no && v.serial_no.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q))
    )
  }, [visits, expiredVisits, approachingVisits, activeTab, searchQuery])

  // Navigation Items
  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'all_visits', label: 'All Assigned Visits', icon: ClipboardList, badge: visits.length, badgeCls: 'bg-emerald-100 text-emerald-800' },
    { key: 'expired_visits', label: 'Urgent / Expired', icon: AlertTriangle, badge: expiredVisits.length, badgeCls: 'bg-red-100 text-red-700' },
    { key: 'approaching_visits', label: 'Approaching Expiry', icon: Clock, badge: approachingVisits.length, badgeCls: 'bg-amber-100 text-amber-800' },
    { key: 'history', label: 'Issued Certificates', icon: CheckCircle2, badge: history.length ? history.length : null, badgeCls: 'bg-blue-100 text-blue-700' },
    { key: 'complaints', label: 'Enforcement Reports', icon: MessageSquareWarning },
    { key: 'profile', label: 'Officer Profile', icon: UserCheck }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header Banner */}
      <div className="bg-emerald-800 text-white px-4 py-4 sm:py-5 shadow-sm border-b-2 border-emerald-900 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300"
              title="Toggle Sidebar Menu"
              aria-label="Toggle Sidebar Menu"
            >
              <span className="text-xl">☰</span>
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Shield size={18} className="text-amber-300" />
                <span className="text-amber-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">Legal Metrology Officer</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{auth.user?.full_name}</h1>
              <p className="text-emerald-100 text-xs sm:text-sm">
                Gov ID: <span className="font-mono font-semibold">{auth.user?.gov_id}</span> | Zone: <span className="font-medium">{auth.user?.zone || 'General Jurisdiction'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ProfileMenu variant="banner" />
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Fixed Collapsible Side Menu Bar */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } bg-white border-r border-gray-200 shadow-sm flex-shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden flex flex-col justify-between`}
        >
          <nav className="p-3 sm:p-4 space-y-1.5">
            {navItems.map(({ key, label, icon: Icon, badge, badgeCls }) => {
              const active = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setSearchQuery('') }}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between px-3'
                  } py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? label : ''}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? 'text-emerald-700' : 'text-gray-500'} />
                    {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!sidebarCollapsed && badge !== null && badge !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeCls || 'bg-gray-100 text-gray-700'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer Jurisdiction Summary */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/60 text-xs text-gray-500">
              <p className="font-semibold text-gray-700 mb-0.5">Jurisdiction Zone</p>
              <p className="truncate text-gray-600">{auth.user?.zone || 'All Districts'}</p>
              <p className="text-[11px] text-gray-400 mt-1">Legal Metrology Act, 2009</p>
            </div>
          )}
        </aside>

        {/* Dynamic Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* ══════════════ TAB 1: OVERVIEW / DASHBOARD ══════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Inspection Operations Overview</h2>
                <p className="text-sm text-gray-500 mt-1">Field visits and verification metrics for {auth.user?.full_name}</p>
              </div>

              {/* Urgent Expired Instruments Banner */}
              {expiredVisits.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                      <h4 className="font-bold text-red-900 text-sm sm:text-base">
                        {expiredVisits.length} Assigned Instrument(s) are Operating Beyond Expiry
                      </h4>
                      <p className="text-xs sm:text-sm text-red-700 mt-0.5">
                        These units require priority testing or enforcement action under Section 25.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('expired_visits')}
                    className="btn-primary text-xs sm:text-sm bg-red-600 hover:bg-red-700 border-none whitespace-nowrap py-2 px-3 sm:px-4"
                  >
                    View Urgent Queue
                  </button>
                </div>
              )}

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Total Assigned Visits',
                    value: visits.length,
                    icon: ClipboardList,
                    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    action: () => setActiveTab('all_visits')
                  },
                  {
                    title: 'Expired Instruments',
                    value: expiredVisits.length,
                    icon: AlertTriangle,
                    bg: 'bg-red-50 border-red-200 text-red-800',
                    action: () => setActiveTab('expired_visits')
                  },
                  {
                    title: 'Approaching Expiry',
                    value: approachingVisits.length,
                    icon: Clock,
                    bg: 'bg-amber-50 border-amber-200 text-amber-800',
                    action: () => setActiveTab('approaching_visits')
                  },
                  {
                    title: 'Valid / Scheduled',
                    value: visits.length - expiredVisits.length - approachingVisits.length,
                    icon: CheckCircle2,
                    bg: 'bg-blue-50 border-blue-200 text-blue-800',
                    action: () => setActiveTab('all_visits')
                  }
                ].map(stat => (
                  <div
                    key={stat.title}
                    onClick={stat.action}
                    className={`border rounded-xl p-5 ${stat.bg} cursor-pointer hover:shadow-md transition-all flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">{stat.title}</span>
                      <stat.icon size={20} />
                    </div>
                    <div className="text-3xl font-extrabold">{loading ? '...' : stat.value}</div>
                    <span className="text-xs font-semibold underline mt-2">View details →</span>
                  </div>
                ))}
              </div>

              {/* Priority Inspection Queue Preview */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="text-emerald-700" size={20} />
                    <h3 className="font-bold text-lg text-gray-900">Upcoming Inspection Visits</h3>
                  </div>
                  <button
                    onClick={fetchAllVisits}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 transition-colors"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
                  </div>
                ) : visits.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
                    <p className="font-semibold">No pending visits assigned.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {visits.slice(0, 5).map(v => (
                      <div key={v.id} className="py-3.5 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{v.business_name || 'Commercial Shop'}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                v.expiry_status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-700'
                                  : v.expiry_status === 'EXPIRING_SOON'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {v.expiry_status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {v.make} {v.model} (S/N: {v.serial_no}) • Preferred Date: {new Date(v.preferred_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                        >
                          Verify Instrument
                        </button>
                      </div>
                    ))}
                    {visits.length > 5 && (
                      <div className="pt-4 text-center">
                        <button
                          onClick={() => setActiveTab('all_visits')}
                          className="text-xs font-bold text-emerald-700 hover:underline"
                        >
                          View all {visits.length} assigned visits →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2, 3, 4: VISITS LISTS ══════════════ */}
          {(activeTab === 'all_visits' || activeTab === 'expired_visits' || activeTab === 'approaching_visits') && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {activeTab === 'all_visits' && 'All Assigned Field Visits'}
                    {activeTab === 'expired_visits' && 'Urgent: Expired Instruments'}
                    {activeTab === 'approaching_visits' && 'Approaching Expiry (Renewal Due)'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {displayedVisits.length} visits in current filter
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search vendor, serial, model..."
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-60 sm:w-72"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={fetchAllVisits}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    title="Refresh Visit List"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Sub-tabs / quick filter pills */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
                {[
                  { key: 'all_visits', label: `All (${visits.length})` },
                  { key: 'expired_visits', label: `🔴 Expired (${expiredVisits.length})` },
                  { key: 'approaching_visits', label: `🟡 Approaching (${approachingVisits.length})` }
                ].map(sub => (
                  <button
                    key={sub.key}
                    onClick={() => setActiveTab(sub.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeTab === sub.key
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Visit Cards List */}
              <VisitList visits={displayedVisits} loading={loading} onVerify={setSelectedVisit} />
            </div>
          )}

          {/* ══════════════ TAB 5: CERTIFICATES & HISTORY ══════════════ */}
          {activeTab === 'history' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Issued Verification Certificates</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Official stamps and QR certificates generated by {auth.user?.full_name}</p>
                </div>
                <button
                  onClick={fetchHistory}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm text-gray-700 w-fit"
                >
                  <RefreshCw size={14} /> Refresh Logs
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
                </div>
              ) : history.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <h3 className="font-semibold text-gray-700 text-base">No verification logs recorded yet</h3>
                  <p className="text-xs text-gray-500 mt-1">Complete an assigned visit verification to issue digital certificates.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold border-b">
                        <tr>
                          <th className="py-3 px-4">Certificate No</th>
                          <th className="py-3 px-4">Vendor & Business</th>
                          <th className="py-3 px-4">Instrument Details</th>
                          <th className="py-3 px-4">Result</th>
                          <th className="py-3 px-4">Valid Until</th>
                          <th className="py-3 px-4">Verified Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-700">
                              {item.certificate_no || item.certificateNo || 'N/A'}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-gray-900">{item.business_name || 'Vendor'}</p>
                              <p className="text-xs text-gray-500">{item.city || 'Commercial Zone'}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-medium text-gray-800">{item.make} {item.model}</p>
                              <p className="text-xs font-mono text-gray-500">S/N: {item.serial_no}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.test_result === 'PASS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.test_result === 'CONDITIONAL_PASS'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.test_result}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                              {item.valid_until ? new Date(item.valid_until).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-500">
                              {item.verified_at ? new Date(item.verified_at).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TAB 6: ENFORCEMENT REPORTS / COMPLAINTS ══════════════ */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Legal Metrology Enforcement Reports</h2>
                  <p className="text-sm text-gray-500 mt-0.5">File violation notices or inspect reported infractions under the Legal Metrology Act</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                  >
                    <Plus size={16} /> Report Vendor Infraction
                  </button>
                  <button
                    onClick={fetchComplaints}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {loadingComplaints ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
                </div>
              ) : complaints.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <MessageSquareWarning size={48} className="mx-auto mb-3 text-gray-300" />
                  <h3 className="font-semibold text-gray-700 text-base">No active enforcement reports or inquiries</h3>
                  <p className="text-xs text-gray-500 mt-1">Click "Report Vendor Infraction" to record a non-compliant scale or missing stamp.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map(c => (
                    <div key={c.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{c.category || 'Non-compliance Report'}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'IN_REVIEW'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.status || 'OPEN'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-gray-400 mt-0.5">ID: {c.id}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {c.description}
                      </p>
                      {c.adminNotes && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                          <strong>Admin Directive:</strong> {c.adminNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ TAB 7: OFFICER PROFILE ══════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Legal Metrology Officer Credentials</h2>
                <p className="text-sm text-gray-500 mt-0.5">Government authorization credentials and jurisdictional profile</p>
              </div>

              {/* ID Card Display */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border-4 border-amber-300/30 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow">
                      <img src="/logo.png" alt="Emblem" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">Government of India</p>
                      <h3 className="font-bold text-base sm:text-lg">Legal Metrology Department</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-amber-300 text-emerald-950 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                      Authorized Officer
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-emerald-300 text-xs uppercase font-medium">Officer Name</p>
                    <p className="font-bold text-lg text-white mt-0.5">{auth.user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-emerald-300 text-xs uppercase font-medium">Government ID</p>
                    <p className="font-mono font-bold text-base text-amber-200 mt-0.5">{auth.user?.gov_id}</p>
                  </div>
                  <div>
                    <p className="text-emerald-300 text-xs uppercase font-medium">Designation</p>
                    <p className="font-medium text-white mt-0.5">{auth.user?.designation || 'Senior Legal Metrology Inspector'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-300 text-xs uppercase font-medium">Department & Division</p>
                    <p className="font-medium text-white mt-0.5">{auth.user?.department || 'Department of Consumer Affairs'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-300 text-xs uppercase font-medium">Jurisdictional Zone</p>
                    <p className="font-medium text-white mt-0.5">{auth.user?.zone || 'Metro Region'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-300 text-xs uppercase font-medium">Contact / Official Phone</p>
                    <p className="font-mono text-white mt-0.5">{auth.user?.phone ? `+91 ${auth.user.phone}` : 'Registered on file'}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-700/60 flex items-center justify-between text-xs text-emerald-300">
                  <span>Enforcement Officer under Legal Metrology Act, 2009</span>
                  <span>TolSeva Verification System</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Verify Inspection Modal */}
      {selectedVisit && (
        <VerifyModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onSuccess={() => {
            setSelectedVisit(null)
            fetchAllVisits()
            if (activeTab === 'history') fetchHistory()
          }}
        />
      )}

      {/* Report Violation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquareWarning size={18} className="text-amber-300" /> Report Non-Compliant Vendor / Machine
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
              {reportMsg && (
                <div className={`p-3 rounded text-xs font-semibold ${reportMsg.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {reportMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Assigned Vendor (Optional)</label>
                <select
                  value={reportForm.vendorId}
                  onChange={e => setReportForm(f => ({ ...f, vendorId: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">-- General Field Inspection Report --</option>
                  {visits.map(v => (
                    <option key={v.id} value={v.vendor_id || v.vendorId}>
                      {v.business_name} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Violation Category *</label>
                <select
                  value={reportForm.category}
                  onChange={e => setReportForm(f => ({ ...f, category: e.target.value }))}
                  className="input-field text-sm"
                  required
                >
                  <option value="Tampered Weight / Seal Violation">Tampered Weight / Missing Seal</option>
                  <option value="Using Unverified Weighing Instrument">Using Unverified Weighing Instrument (Sec. 25)</option>
                  <option value="Inaccurate Reading Exceeding Maximum Permissible Error (MPE)">Inaccurate Reading Exceeding MPE</option>
                  <option value="Refusal to Provide Instrument for Verification">Refusal to Provide Instrument for Verification</option>
                  <option value="Fraudulent Measure / Non-Standard Unit Usage">Fraudulent Measure / Non-Standard Unit</option>
                  <option value="Other">Other Non-Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Observation & Enforcement Details *</label>
                <textarea
                  rows={4}
                  value={reportForm.description}
                  onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detail the non-compliance observed, physical condition of weights, discrepancy in grams/kilograms, or violations found during the inspection..."
                  className="input-field text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="btn-outline text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSaving}
                  className="btn-primary text-sm py-2 px-5"
                >
                  {reportSaving ? 'Submitting...' : 'Submit Violation Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}