import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, LogOut, Users, ShieldCheck, Calendar, BarChart3, Search, X, MessageSquareWarning } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminDashboard, getAdminVendors, getAdminInspectors, getAdminAppointments, assignInspector, getAdminComplaints, createAdminComplaint, updateAdminComplaint, getAdminVendorDetails } from '../services/api.js'

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

  if (!auth || auth.role !== 'admin') { navigate('/'); return null }

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const [dashRes, vendRes, insRes, appRes, complaintRes] = await Promise.all([
          getAdminDashboard(), getAdminVendors(), getAdminInspectors(), getAdminAppointments(), getAdminComplaints()
        ])
        setStats(dashRes.data.stats)
        setVendors(vendRes.data.vendors)
        setInspectors(insRes.data.inspectors)
        setAppointments(appRes.data.appointments)
        setComplaints(complaintRes.data.complaints)
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
      setComplaints(current => current.map(complaint => complaint.id === id ? { ...complaint, ...response.data.complaint } : complaint))
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
          <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-2 text-sm border border-white/30 rounded px-3 py-2 hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Logout
          </button>
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
                  <h2 className="font-bold text-lg mb-4">Complaint Inbox ({complaints.length})</h2>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b">
                      {['Target', 'Category', 'Description', 'Date', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y">
                      {complaints.map(complaint => (
                        <tr key={complaint.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{complaint.type?.includes('VENDOR') ? complaint.vendor_business_name || complaint.vendorId : complaint.inspector_name || complaint.inspector_gov_id || complaint.inspectorId}</td>
                          <td className="px-4 py-3">{complaint.category}</td>
                          <td className="px-4 py-3 max-w-sm">{complaint.description}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(complaint.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <select value={complaint.status} onChange={e => handleComplaintStatus(complaint.id, e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1">
                              <option value="OPEN">OPEN</option>
                              <option value="INVESTIGATING">INVESTIGATING</option>
                              <option value="RESOLVED">RESOLVED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {complaints.length === 0 && <p className="text-center text-sm text-gray-500 py-8">No complaints found.</p>}
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