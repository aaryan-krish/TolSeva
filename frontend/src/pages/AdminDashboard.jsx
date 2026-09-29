import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, LogOut, Users, ShieldCheck, Calendar, BarChart3, Search, X, MessageSquareWarning, AlertTriangle, ChevronDown, ChevronUp, Eye, Building2, Scale, ExternalLink, CheckCircle2, Clock, AlertOctagon } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminDashboard, getAdminVendors, getAdminInspectors, getAdminAppointments, assignInspector, getAdminComplaints, createAdminComplaint, updateAdminComplaint, getAdminVendorDetails } from '../services/api.js'
import ProfileMenu from '../components/profile/ProfileMenu.jsx'

export default function AdminDashboard() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [vendors, setVendors] = useState([])
  const [inspectors, setInspectors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const [vendorSearch, setVendorSearch] = useState('')
  const [activeVendorSearch, setActiveVendorSearch] = useState('')
  const [inspectorSearch, setInspectorSearch] = useState('')
  const [activeInspectorSearch, setActiveInspectorSearch] = useState('')
  const [complaints, setComplaints] = useState([])
  const [complaintForm, setComplaintForm] = useState({ targetType: 'vendor', targetId: '', instrumentId: '', category: '', description: '', otherCategory: '' })
  const [vendorInstruments, setVendorInstruments] = useState([])
  const [complaintSaving, setComplaintSaving] = useState(false)
  const [complaintDropdownOpen, setComplaintDropdownOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [vendorComplaintSearch, setVendorComplaintSearch] = useState('')
  const [vendorComplaintFilter, setVendorComplaintFilter] = useState('with_complaints')
  const [expandedVendorId, setExpandedVendorId] = useState(null)
  const [vendorSort, setVendorSort] = useState('complaints_desc')

  if (!auth || auth.role !== 'admin') { navigate('/'); return null }

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const [dashRes, vendRes, insRes, appRes, complaintRes] = await Promise.allSettled([
          getAdminDashboard(), getAdminVendors(), getAdminInspectors(), getAdminAppointments(), getAdminComplaints()
        ])
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data?.stats || null)
        if (vendRes.status === 'fulfilled') setVendors(vendRes.value.data?.vendors || [])
        if (insRes.status === 'fulfilled') setInspectors(insRes.value.data?.inspectors || [])
        if (appRes.status === 'fulfilled') setAppointments(appRes.value.data?.appointments || [])
        if (complaintRes.status === 'fulfilled') setComplaints(complaintRes.value.data?.complaints || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadAll()
  }, [])

  async function handleAssign(appointmentId, inspectorId) {
    setAssigningId(appointmentId)
    try {
      await assignInspector(appointmentId, inspectorId)
      const appRes = await getAdminAppointments()
      setAppointments(appRes.data.appointments)
    } catch (e) { console.error(e) }
    finally { setAssigningId(null) }
  }

  async function handleVendorSearch(e) {
    e.preventDefault()
    const search = vendorSearch.trim()
    setLoading(true)
    try {
      const vendRes = await getAdminVendors(1, search)
      setVendors(vendRes.data.vendors)
      setActiveVendorSearch(search)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function clearVendorSearch() {
    setVendorSearch('')
    setLoading(true)
    try {
      const vendRes = await getAdminVendors()
      setVendors(vendRes.data.vendors)
      setActiveVendorSearch('')
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function handleInspectorSearch(e) {
    e.preventDefault()
    const search = inspectorSearch.trim()
    setLoading(true)
    try {
      const insRes = await getAdminInspectors(search)
      setInspectors(insRes.data.inspectors)
      setActiveInspectorSearch(search)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function clearInspectorSearch() {
    setInspectorSearch('')
    setLoading(true)
    try {
      const insRes = await getAdminInspectors()
      setInspectors(insRes.data.inspectors)
      setActiveInspectorSearch('')
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function updateComplaintForm(e) {
    const { name, value } = e.target
    setComplaintForm(form => {
      const newForm = { ...form, [name]: value }
      if (name === 'targetType') {
        newForm.targetId = ''
        newForm.instrumentId = ''
        newForm.category = ''
        newForm.otherCategory = ''
        setVendorInstruments([])
      }
      return newForm
    })

    if (name === 'targetId' && complaintForm.targetType === 'vendor' && value) {
      try {
        const res = await getAdminVendorDetails(value)
        setVendorInstruments(res.data.instruments || [])
      } catch (err) {
        console.error(err)
        setVendorInstruments([])
      }
    }
  }

  async function handleComplaintSubmit(e) {
    e.preventDefault()
    setComplaintSaving(true)
    try {
      const submitData = { ...complaintForm }
      if (submitData.category === 'Other' && submitData.otherCategory) {
        submitData.category = submitData.otherCategory
      }
      const response = await createAdminComplaint(submitData)
      setComplaints(current => [response.data.complaint, ...current])
      setComplaintForm({ targetType: complaintForm.targetType, targetId: '', instrumentId: '', category: '', description: '', otherCategory: '' })
      setVendorInstruments([])
      setActiveTab('complaints')
    } catch (e) { console.error(e) }
    finally { setComplaintSaving(false) }
  }

  async function handleComplaintStatus(id, status) {
    try {
      const response = await updateAdminComplaint(id, { status })
      const updated = response.data.complaint
      setComplaints(current => current.map(complaint => complaint.id === id ? { ...complaint, ...updated } : complaint))
      setVendors(current => current.map(v => {
        if (!v.complaints || !v.complaints.some(c => c.id === id)) return v
        const updatedComps = v.complaints.map(c => c.id === id ? { ...c, ...updated } : c)
        return {
          ...v,
          complaints: updatedComps,
          open_complaints_count: updatedComps.filter(c => (c.status || 'OPEN').toUpperCase() === 'OPEN').length,
          investigating_complaints_count: updatedComps.filter(c => (c.status || '').toUpperCase() === 'INVESTIGATING').length,
          resolved_complaints_count: updatedComps.filter(c => (c.status || '').toUpperCase() === 'RESOLVED').length
        }
      }))
    } catch (e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-emerald-800 text-white px-4 py-6 shadow-sm border-b-2 border-emerald-900 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-white/10 rounded transition-colors" title="Toggle Sidebar">
              <span className="text-xl">☰</span>
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-amber-300" />
                <span className="text-amber-300 text-sm font-semibold tracking-wide">Admin Dashboard</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">System Administration</h1>
              <p className="text-emerald-100 text-sm">TolSeva National Control Panel</p>
            </div>
          </div>
          <ProfileMenu variant="banner" />
        </div>
      </div>

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Fixed Vertical Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 shadow-sm flex-shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden`}>
          <nav className="p-4 space-y-1.5">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2 px-4'} py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title={sidebarCollapsed ? "Overview" : ""}>
              <BarChart3 size={18} /> {!sidebarCollapsed && <span>Overview</span>}
            </button>
            <button onClick={() => setActiveTab('inspectors')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2 px-4'} py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'inspectors' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title={sidebarCollapsed ? "Inspector" : ""}>
              <ShieldCheck size={18} /> {!sidebarCollapsed && <span>Inspector</span>}
            </button>
            <button onClick={() => setActiveTab('vendors')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2 px-4'} py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'vendors' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title={sidebarCollapsed ? "Vendors" : ""}>
              <Users size={18} /> {!sidebarCollapsed && <span>Vendors</span>}
            </button>
            <button onClick={() => setActiveTab('vendor_complaints')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2 px-4'} py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'vendor_complaints' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title={sidebarCollapsed ? "Vendors by Complaints" : ""}>
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex items-center justify-between flex-1 truncate">
                  <span>Vendor Complaints</span>
                  {vendors.filter(v => (v.complaint_count || 0) > 0).length > 0 && (
                    <span className="ml-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      {vendors.filter(v => (v.complaint_count || 0) > 0).length}
                    </span>
                  )}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('complaints')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2 px-4'} py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'complaints' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title={sidebarCollapsed ? "Complaints" : ""}>
              <MessageSquareWarning size={18} /> {!sidebarCollapsed && <span>Complaints</span>}
            </button>
            <button onClick={() => setActiveTab('appointments')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2 px-4'} py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'appointments' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title={sidebarCollapsed ? "Appointments" : ""}>
              <Calendar size={18} /> {!sidebarCollapsed && <span>Appointments</span>}
            </button>

            <div className="pt-2 border-t mt-2">
              <button 
                onClick={() => setComplaintDropdownOpen(!complaintDropdownOpen)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-4'} py-2.5 rounded-md text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors`}
                title={sidebarCollapsed ? "Raise a complains" : ""}
              >
                <span className={`flex items-center ${!sidebarCollapsed ? 'gap-2' : ''}`}><MessageSquareWarning size={18} /> {!sidebarCollapsed && <span>Raise a complains</span>}</span>
                {!sidebarCollapsed && <span className="text-xs">{complaintDropdownOpen ? '▲' : '▼'}</span>}
              </button>
              
              {complaintDropdownOpen && !sidebarCollapsed && (
                <div className="pl-10 pr-2 py-1 space-y-1">
                  <button 
                    onClick={() => { setActiveTab('raise_complaint'); setComplaintForm(f => ({...f, targetType: 'inspector'})); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'raise_complaint' && complaintForm.targetType === 'inspector' ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    Inspector
                  </button>
                  <button 
                    onClick={() => { setActiveTab('raise_complaint'); setComplaintForm(f => ({...f, targetType: 'vendor'})); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'raise_complaint' && complaintForm.targetType === 'vendor' ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    Vendor
                  </button>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[
                    { label: 'Registered Vendors', value: stats.registered_vendors, icon: '🏪', color: 'bg-orange-50 border-orange-200' },
                    { label: 'Total Instruments', value: stats.total_instruments, icon: '⚖️', color: 'bg-emerald-50 border-emerald-200' },
                    { label: 'Pending Appointments', value: stats.pending_appointments, icon: '📅', color: 'bg-amber-50 border-amber-200' },
                    { label: 'Certificates Issued', value: stats.verifications_issued, icon: '📜', color: 'bg-green-50 border-green-200' },
                    { label: 'Expired Instruments', value: stats.expired_instruments, icon: '❌', color: 'bg-red-50 border-red-200' }
                  ].map(s => (
                    <div key={s.label} className={'border rounded-xl p-5 ' + s.color}>
                      <div className="text-3xl mb-2">{s.icon}</div>
                      <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
                      <div className="text-xs font-medium text-gray-600 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'vendors' && (
                <div className="card overflow-x-auto">
                  <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-bold text-lg">Registered Vendors ({vendors.length})</h2>
                      {activeVendorSearch && <p className="text-xs text-gray-500 mt-1">Showing results for GSTIN: {activeVendorSearch}</p>}
                    </div>
                    <form onSubmit={handleVendorSearch} className="flex gap-2 w-full md:w-auto">
                      <label className="sr-only" htmlFor="vendor-gstin-search">Search vendor by GSTIN</label>
                      <div className="relative flex-1 md:w-72">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          id="vendor-gstin-search"
                          value={vendorSearch}
                          onChange={e => setVendorSearch(e.target.value)}
                          placeholder="Search by GSTIN"
                          className="input-field pl-9 pr-9"
                        />
                        {vendorSearch && <button type="button" onClick={clearVendorSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700" title="Clear GSTIN search"><X size={16} /></button>}
                      </div>
                      <button type="submit" className="btn-primary flex items-center gap-2"><Search size={16} /> Search</button>
                    </form>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b">
                      {['Business Name', 'GSTIN', 'Owner', 'Phone', 'City/State', 'Instruments'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y">
                      {vendors.map(v => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{v.business_name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{v.gstin}</td>
                          <td className="px-4 py-3">{v.owner_name}</td>
                          <td className="px-4 py-3">{v.phone}</td>
                          <td className="px-4 py-3">{v.city}, {v.state}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{v.instrument_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {vendors.length === 0 && <p className="text-center text-sm text-gray-500 py-8">No vendors found for this GSTIN.</p>}
                </div>
              )}

              {activeTab === 'vendor_complaints' && (() => {
                const vendorsWithComplaints = vendors.filter(v => (v.complaint_count || 0) > 0)
                const totalVendorComplaints = vendors.reduce((acc, v) => acc + (v.complaint_count || 0), 0)
                const openVendorComplaints = vendors.reduce((acc, v) => acc + (v.open_complaints_count || 0), 0)
                const highRiskVendors = vendors.filter(v => (v.complaint_count || 0) >= 2)
                const cleanVendors = vendors.filter(v => (v.complaint_count || 0) === 0)

                const filteredList = vendors
                  .filter(v => {
                    const q = vendorComplaintSearch.trim().toLowerCase()
                    if (q) {
                      const matchesName = (v.business_name || '').toLowerCase().includes(q)
                      const matchesGstin = (v.gstin || '').toLowerCase().includes(q)
                      const matchesOwner = (v.owner_name || '').toLowerCase().includes(q)
                      const matchesCity = (v.city || '').toLowerCase().includes(q)
                      if (!matchesName && !matchesGstin && !matchesOwner && !matchesCity) return false
                    }
                    const count = v.complaint_count || 0
                    if (vendorComplaintFilter === 'with_complaints') return count > 0
                    if (vendorComplaintFilter === 'high_risk') return count >= 2
                    if (vendorComplaintFilter === 'clean') return count === 0
                    return true
                  })
                  .sort((a, b) => {
                    const countA = a.complaint_count || 0
                    const countB = b.complaint_count || 0
                    if (vendorSort === 'complaints_desc') return countB - countA
                    if (vendorSort === 'complaints_asc') return countA - countB
                    if (vendorSort === 'name_asc') return (a.business_name || '').localeCompare(b.business_name || '')
                    return 0
                  })

                return (
                  <div className="space-y-6">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                        <div className="text-2xl mb-1">🏪</div>
                        <div className="text-2xl font-extrabold text-gray-900">{vendors.length}</div>
                        <div className="text-xs font-medium text-gray-500 mt-1">Total Registered Establishments</div>
                      </div>

                      <div className="bg-red-50/80 border border-red-200 rounded-xl p-5 shadow-xs">
                        <div className="text-2xl mb-1">⚠️</div>
                        <div className="text-2xl font-extrabold text-red-950">{vendorsWithComplaints.length}</div>
                        <div className="text-xs font-semibold text-red-800 mt-1">Vendors with Complaints</div>
                      </div>

                      <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-5 shadow-xs">
                        <div className="text-2xl mb-1">📢</div>
                        <div className="text-2xl font-extrabold text-orange-950">{totalVendorComplaints}</div>
                        <div className="text-xs font-semibold text-orange-800 mt-1">Total Grievances Lodged</div>
                      </div>

                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 shadow-xs">
                        <div className="text-2xl mb-1">⏳</div>
                        <div className="text-2xl font-extrabold text-amber-950">{openVendorComplaints}</div>
                        <div className="text-xs font-semibold text-amber-800 mt-1">Unresolved / Open Inquiries</div>
                      </div>
                    </div>

                    {/* Table Container Card */}
                    <div className="card overflow-x-auto">
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                          <div>
                            <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                              <AlertTriangle size={20} className="text-amber-600" />
                              Vendors by Number of Complaints ({filteredList.length})
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Establishments ranked by volume of consumer and field complaints, verification discrepancies, and equipment tampering.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium">Sort by:</span>
                            <select
                              value={vendorSort}
                              onChange={e => setVendorSort(e.target.value)}
                              className="input-field text-xs py-1.5 px-2.5 max-w-[210px]"
                            >
                              <option value="complaints_desc">Most Complaints (Highest first)</option>
                              <option value="complaints_asc">Least Complaints (Lowest first)</option>
                              <option value="name_asc">Establishment Name (A to Z)</option>
                            </select>
                          </div>
                        </div>

                        {/* Filter Tabs & Search */}
                        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setVendorComplaintFilter('with_complaints')}
                              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                                vendorComplaintFilter === 'with_complaints'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              With Complaints ({vendorsWithComplaints.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setVendorComplaintFilter('high_risk')}
                              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                                vendorComplaintFilter === 'high_risk'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'bg-red-50 text-red-900 hover:bg-red-100 border border-red-200'
                              }`}
                            >
                              High Risk (2+) ({highRiskVendors.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setVendorComplaintFilter('all')}
                              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                                vendorComplaintFilter === 'all'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              All Vendors ({vendors.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setVendorComplaintFilter('clean')}
                              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                                vendorComplaintFilter === 'clean'
                                  ? 'bg-green-700 text-white shadow-xs'
                                  : 'bg-green-50 text-green-900 hover:bg-green-100 border border-green-200'
                              }`}
                            >
                              Clean Record ({cleanVendors.length})
                            </button>
                          </div>

                          <div className="relative w-full lg:w-80">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              value={vendorComplaintSearch}
                              onChange={e => setVendorComplaintSearch(e.target.value)}
                              placeholder="Search by vendor, GSTIN, city..."
                              className="input-field pl-9 pr-8 text-xs py-2 w-full"
                            />
                            {vendorComplaintSearch && (
                              <button
                                type="button"
                                onClick={() => setVendorComplaintSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vendors with Complaints Table */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-700">
                            <th className="px-4 py-3 text-left font-semibold">Vendor / Establishment</th>
                            <th className="px-4 py-3 text-left font-semibold">Location</th>
                            <th className="px-4 py-3 text-center font-semibold">Instruments</th>
                            <th className="px-4 py-3 text-center font-semibold">Total Complaints</th>
                            <th className="px-4 py-3 text-left font-semibold">Status Breakdown</th>
                            <th className="px-4 py-3 text-right font-semibold">Grievances</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredList.map(v => {
                            const count = v.complaint_count || 0
                            const isExpanded = expandedVendorId === v.id
                            const hasComplaints = count > 0

                            return (
                              <React.Fragment key={v.id}>
                                <tr className={`hover:bg-gray-50 transition-colors ${hasComplaints ? 'bg-orange-50/25' : ''}`}>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-gray-900">{v.business_name}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">GSTIN: {v.gstin || 'Unregistered'}</div>
                                    <div className="text-xs text-gray-600 mt-0.5">Owner: {v.owner_name} • {v.phone}</div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-700">
                                    <div>{v.city || 'N/A'}, {v.state || 'UP'}</div>
                                    {v.address && <div className="text-gray-500 text-2xs truncate max-w-[180px]">{v.address}</div>}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-gray-800 text-xs">
                                    <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                      {v.instrument_count || 0}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {count >= 3 ? (
                                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                                        <AlertOctagon size={13} /> {count} Complaints (High Risk)
                                      </span>
                                    ) : count > 0 ? (
                                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                                        <AlertTriangle size={13} /> {count} Complaint{count > 1 ? 's' : ''}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                        <CheckCircle2 size={13} /> 0 (Clean)
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    {count > 0 ? (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {v.open_complaints_count > 0 && (
                                          <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-2xs font-bold">
                                            {v.open_complaints_count} Open
                                          </span>
                                        )}
                                        {v.investigating_complaints_count > 0 && (
                                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-2xs font-bold">
                                            {v.investigating_complaints_count} Investigating
                                          </span>
                                        )}
                                        {v.resolved_complaints_count > 0 && (
                                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-2xs font-semibold">
                                            {v.resolved_complaints_count} Resolved
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs italic">No violations recorded</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {count > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedVendorId(isExpanded ? null : v.id)}
                                        className="btn-outline text-xs py-1 px-3 inline-flex items-center gap-1 bg-white hover:bg-gray-100 font-semibold text-gray-700 cursor-pointer shadow-2xs"
                                      >
                                        <Eye size={13} /> {isExpanded ? 'Hide' : 'View'} ({count})
                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 text-xs font-medium px-2">—</span>
                                    )}
                                  </td>
                                </tr>

                                {/* Expanded Complaints Row */}
                                {isExpanded && (
                                  <tr className="bg-gray-50/90 border-y border-gray-200">
                                    <td colSpan={6} className="p-4 sm:p-5">
                                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                          <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <MessageSquareWarning size={15} className="text-orange-600" />
                                            Complaints Filed Against: <span className="text-emerald-700">{v.business_name}</span> ({count})
                                          </h4>
                                          <span className="text-2xs text-gray-500 font-mono">Vendor ID: {v.id}</span>
                                        </div>

                                        <div className="space-y-2.5">
                                          {(v.complaints || []).map(c => (
                                            <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                                              <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-mono font-bold text-gray-900 text-2xs bg-white px-2 py-0.5 rounded border border-gray-200">
                                                    {c.id}
                                                  </span>
                                                  <span className="font-bold text-slate-800">{c.category || 'Discrepancy'}</span>
                                                  {c.type === 'PUBLIC_ABOUT_INSTRUMENT' && (
                                                    <span className="text-2xs font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                                      Citizen QR Report
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-slate-600 italic">"{c.description}"</p>
                                                <div className="text-2xs text-gray-500 flex items-center gap-3">
                                                  {c.complainant_name && <span>Reported by: <strong>{c.complainant_name}</strong></span>}
                                                  {c.complainant_phone && <span>Mobile: <strong>+91 {c.complainant_phone}</strong></span>}
                                                  <span>Date: {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-2xs text-gray-500 font-medium">Status:</span>
                                                <select
                                                  value={c.status}
                                                  onChange={e => handleComplaintStatus(c.id, e.target.value)}
                                                  className={`text-2xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer ${
                                                    c.status === 'RESOLVED'
                                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                      : c.status === 'INVESTIGATING'
                                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                                      : 'bg-amber-50 text-amber-900 border-amber-300'
                                                  }`}
                                                >
                                                  <option value="OPEN">OPEN</option>
                                                  <option value="INVESTIGATING">INVESTIGATING</option>
                                                  <option value="RESOLVED">RESOLVED</option>
                                                </select>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>

                      {filteredList.length === 0 && (
                        <div className="text-center py-12 text-gray-500 text-sm">
                          <p className="font-medium">No vendors match the selected filter criteria.</p>
                          <button
                            type="button"
                            onClick={() => { setVendorComplaintFilter('all'); setVendorComplaintSearch(''); }}
                            className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            Reset filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {activeTab === 'inspectors' && (
                <div className="card overflow-x-auto">
                  <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-bold text-lg">Inspectors ({inspectors.length})</h2>
                      {activeInspectorSearch && <p className="text-xs text-gray-500 mt-1">Showing results for ID: {activeInspectorSearch}</p>}
                    </div>
                    <form onSubmit={handleInspectorSearch} className="flex gap-2 w-full md:w-auto">
                      <label className="sr-only" htmlFor="inspector-id-search">Search inspector by ID</label>
                      <div className="relative flex-1 md:w-72">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          id="inspector-id-search"
                          value={inspectorSearch}
                          onChange={e => setInspectorSearch(e.target.value)}
                          placeholder="Search by Government ID"
                          className="input-field pl-9 pr-9"
                        />
                        {inspectorSearch && <button type="button" onClick={clearInspectorSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700" title="Clear inspector search"><X size={16} /></button>}
                      </div>
                      <button type="submit" className="btn-primary flex items-center gap-2"><Search size={16} /> Search</button>
                    </form>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b">
                      {['Name', 'Gov ID', 'Designation', 'Zone', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y">
                      {inspectors.map(i => (
                        <tr key={i.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{i.full_name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{i.gov_id}</td>
                          <td className="px-4 py-3">{i.designation}</td>
                          <td className="px-4 py-3">{i.zone}</td>
                          <td className="px-4 py-3">
                            <span className={i.is_active ? 'badge-valid' : 'badge-expired'}>{i.is_active ? 'Active' : 'Inactive'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inspectors.length === 0 && <p className="text-center text-sm text-gray-500 py-8">No inspectors found for this ID.</p>}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="card overflow-x-auto">
                  <h2 className="font-bold text-lg mb-4">All Appointments ({appointments.length})</h2>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b">
                      {['Business', 'Instrument', 'Date', 'Purpose', 'Status', 'Inspector', 'Assign'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y">
                      {appointments.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{a.business_name}</td>
                          <td className="px-4 py-3 text-xs">{a.make} {a.model}</td>
                          <td className="px-4 py-3">{new Date(a.preferred_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3">{a.purpose?.replace('_', ' ')}</td>
                          <td className="px-4 py-3">
                            <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{a.status}</span>
                          </td>
                          <td className="px-4 py-3">{a.inspector_name || '-'}</td>
                          <td className="px-4 py-3">
                            {a.status === 'PENDING' && (
                              <select onChange={e => { if (e.target.value) handleAssign(a.id, e.target.value) }} className="text-xs border border-gray-300 rounded px-2 py-1" disabled={assigningId === a.id} defaultValue="">
                                <option value="">Assign...</option>
                                {inspectors.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.zone})</option>)}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'complaints' && (
                <div className="card overflow-x-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-bold text-lg text-gray-900">Complaints &amp; Violations Registry</h2>
                      <p className="text-xs text-gray-500">Includes live citizen complaints filed via QR code scans and internal administrative reports.</p>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                      Total: {complaints.length}
                    </span>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        {['Source', 'Target Establishment / Machine', 'Complainant', 'Violation / Category', 'Description', 'Filed Date', 'Status & Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complaints.map(complaint => {
                        const isCitizen = complaint.type === 'PUBLIC_ABOUT_INSTRUMENT' || Boolean(complaint.complainant_phone)
                        const isInspector = complaint.type?.includes('INSPECTOR')
                        return (
                          <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                            {/* Source Badge */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isCitizen ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                  📱 Citizen QR Report
                                </span>
                              ) : isInspector ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  🛡️ Inspector Issue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  🏢 Vendor Dispute
                                </span>
                              )}
                            </td>

                            {/* Target Details */}
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">
                                {isInspector
                                  ? (complaint.inspector_name || complaint.inspector_gov_id || complaint.inspectorId)
                                  : (complaint.vendor_business_name || complaint.vendorId || 'Vendor Establishment')}
                              </div>
                              {complaint.instrument_make && (
                                <div className="text-2xs text-gray-500 font-mono mt-0.5">
                                  Machine: {complaint.instrument_make} {complaint.instrument_serial_no ? `(${complaint.instrument_serial_no})` : ''}
                                </div>
                              )}
                              {complaint.certificateId && (
                                <div className="text-2xs text-emerald-700 font-mono mt-0.5">
                                  Cert: {complaint.certificateId}
                                </div>
                              )}
                            </td>

                            {/* Complainant (Citizen / Admin) */}
                            <td className="px-4 py-3">
                              {isCitizen ? (
                                <div>
                                  <div className="font-semibold text-gray-900 text-xs">
                                    {complaint.complainant_name || 'Citizen'}
                                  </div>
                                  <div className="text-2xs text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                                    📱 +91 {complaint.complainant_phone}
                                    <span className="text-emerald-700 font-bold" title="Mobile verified with OTP">✓ Verified</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Department Admin</span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                              {complaint.category}
                            </td>

                            {/* Description */}
                            <td className="px-4 py-3 max-w-xs text-xs text-gray-600 leading-relaxed">
                              {complaint.description}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                              {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>

                            {/* Status & Decision Action */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <select
                                value={complaint.status}
                                onChange={e => handleComplaintStatus(complaint.id, e.target.value)}
                                className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors ${
                                  complaint.status === 'RESOLVED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : complaint.status === 'INVESTIGATING'
                                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="OPEN">🔴 OPEN</option>
                                <option value="INVESTIGATING">🟡 INVESTIGATING</option>
                                <option value="RESOLVED">🟢 RESOLVED</option>
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {complaints.length === 0 && <p className="text-center text-sm text-gray-500 py-8">No complaints in registry.</p>}
                </div>
              )}

              {activeTab === 'raise_complaint' && (
                <div className="card max-w-3xl">
                  <h2 className="font-bold text-lg mb-4">File Complaint Against {complaintForm.targetType === 'vendor' ? 'Vendor' : 'Inspector'}</h2>
                  <form onSubmit={handleComplaintSubmit} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Complaint Against *</label>
                      <select name="targetType" value={complaintForm.targetType} onChange={updateComplaintForm} className="input-field">
                        <option value="vendor">Vendor</option>
                        <option value="inspector">Inspector</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        {complaintForm.targetType === 'vendor' ? 'Vendor (Select by GSTIN)' : 'Inspector (Select by ID)'} *
                      </label>
                      <select name="targetId" value={complaintForm.targetId} onChange={updateComplaintForm} className="input-field" required>
                        <option value="">Select {complaintForm.targetType}</option>
                        {complaintForm.targetType === 'vendor'
                          ? vendors.map(v => <option key={v.id} value={v.id}>{v.business_name} ({v.gstin})</option>)
                          : inspectors.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.gov_id})</option>)}
                      </select>
                    </div>

                    {complaintForm.targetType === 'vendor' && (
                      <div>
                        <label className="block text-sm font-semibold mb-1">Select Machine/Instrument</label>
                        <select name="instrumentId" value={complaintForm.instrumentId} onChange={updateComplaintForm} className="input-field">
                          <option value="">General Complaint (No specific machine)</option>
                          {vendorInstruments.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.make} {inst.model} ({inst.serial_no})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold mb-1">{complaintForm.targetType === 'vendor' ? 'What fault?' : 'Reason'} *</label>
                      {complaintForm.targetType === 'vendor' ? (
                        <input name="category" value={complaintForm.category} onChange={updateComplaintForm} className="input-field" placeholder="e.g. QR code missing, scan issue" required />
                      ) : (
                        <select name="category" value={complaintForm.category} onChange={updateComplaintForm} className="input-field" required>
                          <option value="">Select Reason</option>
                          <option value="Not taking appointment">Not taking appointment</option>
                          <option value="Taking bribe">Taking bribe</option>
                          <option value="Making fake appointment">Making fake appointment</option>
                          <option value="Uploading fake details of vendor at inspection">Uploading fake details of vendor at inspection</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </div>

                    {complaintForm.targetType === 'inspector' && complaintForm.category === 'Other' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-1">Specify Reason *</label>
                        <input name="otherCategory" value={complaintForm.otherCategory} onChange={updateComplaintForm} className="input-field" placeholder="Type reason here..." required />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-1">Description *</label>
                      <textarea name="description" value={complaintForm.description} onChange={updateComplaintForm} className="input-field min-h-24" placeholder="Describe the complaint in detail" required />
                    </div>
                    <div className="md:col-span-2">
                      <button type="submit" disabled={complaintSaving} className="btn-primary">{complaintSaving ? 'Submitting...' : 'Submit Complaint'}</button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}