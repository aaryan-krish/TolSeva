import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, LogOut, Users, ShieldCheck, Calendar, BarChart3, Search, X, MessageSquareWarning } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminDashboard, getAdminVendors, getAdminInspectors, getAdminAppointments, assignInspector, getAdminComplaints, createAdminComplaint, updateAdminComplaint } from '../services/api.js'

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
  const [complaintForm, setComplaintForm] = useState({ targetType: 'vendor', targetId: '', category: '', description: '' })
  const [complaintSaving, setComplaintSaving] = useState(false)

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

  function updateComplaintForm(e) {
    const { name, value } = e.target
    setComplaintForm(form => ({ ...form, [name]: value, ...(name === 'targetType' ? { targetId: '' } : {}) }))
  }

  async function handleComplaintSubmit(e) {
    e.preventDefault()
    setComplaintSaving(true)
    try {
      const response = await createAdminComplaint(complaintForm)
      setComplaints(current => [response.data.complaint, ...current])
      setComplaintForm({ targetType: complaintForm.targetType, targetId: '', category: '', description: '' })
    } catch (e) { console.error(e) }
    finally { setComplaintSaving(false) }
  }

  async function handleComplaintStatus(id, status) {
    try {
      const response = await updateAdminComplaint(id, { status })
      setComplaints(current => current.map(complaint => complaint.id === id ? { ...complaint, ...response.data.complaint } : complaint))
    } catch (e) { console.error(e) }
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'vendors', label: 'Vendors', icon: Users },
    { key: 'inspectors', label: 'Inspectors', icon: ShieldCheck },
    { key: 'appointments', label: 'Appointments', icon: Calendar },
    { key: 'complaints', label: 'Complaints', icon: MessageSquareWarning }
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-emerald-600 text-white px-4 py-6'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-1'><Crown size={18} className='text-orange-500' /><span className='text-orange-500 text-sm font-semibold'>Admin Dashboard</span></div>
            <h1 className='text-2xl font-bold'>System Administration</h1>
            <p className='text-blue-200 text-sm'>TolSeva Control Panel</p>
          </div>
          <button onClick={() => { logout(); navigate('/') }} className='flex items-center gap-2 text-sm border border-white/30 rounded px-3 py-2 hover:bg-white/10'><LogOut size={16} /> Logout</button>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='flex gap-1 bg-gray-200 rounded-lg p-1 w-fit mb-6'>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (activeTab === key ? 'bg-white text-emerald-600 shadow' : 'text-gray-600 hover:text-gray-900')}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='flex justify-center py-20'>
            <div className='animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full' />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                {[
                  { label: 'Registered Vendors', value: stats.registered_vendors, icon: '🏪', color: 'bg-blue-50 border-blue-200' },
                  { label: 'Total Instruments', value: stats.total_instruments, icon: '⚖️', color: 'bg-purple-50 border-purple-200' },
                  { label: 'Pending Appointments', value: stats.pending_appointments, icon: '📅', color: 'bg-amber-50 border-amber-200' },
                  { label: 'Certificates Issued', value: stats.verifications_issued, icon: '📜', color: 'bg-green-50 border-green-200' },
                  { label: 'Expired Instruments', value: stats.expired_instruments, icon: '❌', color: 'bg-red-50 border-red-200' }
                ].map(s => (
                  <div key={s.label} className={'border rounded-xl p-5 ' + s.color}>
                    <div className='text-3xl mb-2'>{s.icon}</div>
                    <div className='text-3xl font-extrabold text-gray-900'>{s.value}</div>
                    <div className='text-xs font-medium text-gray-600 mt-1'>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'vendors' && (
              <div className='card overflow-x-auto'>
                <div className='flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <h2 className='font-bold text-lg'>Registered Vendors ({vendors.length})</h2>
                    {activeVendorSearch && <p className='text-xs text-gray-500 mt-1'>Showing results for GSTIN: {activeVendorSearch}</p>}
                  </div>
                  <form onSubmit={handleVendorSearch} className='flex gap-2 w-full md:w-auto'>
                    <label className='sr-only' htmlFor='vendor-gstin-search'>Search vendor by GSTIN</label>
                    <div className='relative flex-1 md:w-72'>
                      <Search size={16} className='absolute left-3 top-2.5 text-gray-400' />
                      <input
                        id='vendor-gstin-search'
                        value={vendorSearch}
                        onChange={e => setVendorSearch(e.target.value)}
                        placeholder='Search by GSTIN'
                        className='input-field pl-9 pr-9'
                      />
                      {vendorSearch && <button type='button' onClick={clearVendorSearch} className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-700' title='Clear GSTIN search'><X size={16} /></button>}
                    </div>
                    <button type='submit' className='btn-primary flex items-center gap-2'><Search size={16} /> Search</button>
                  </form>
                </div>
                <table className='w-full text-sm'>
                  <thead><tr className='bg-gray-50 border-b'>
                    {['Business Name', 'GSTIN', 'Owner', 'Phone', 'City/State', 'Instruments'].map(h => (
                      <th key={h} className='px-4 py-3 text-left font-semibold text-gray-700'>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className='divide-y'>
                    {vendors.map(v => (
                      <tr key={v.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-3 font-semibold'>{v.business_name}</td>
                        <td className='px-4 py-3 font-mono text-xs'>{v.gstin}</td>
                        <td className='px-4 py-3'>{v.owner_name}</td>
                        <td className='px-4 py-3'>{v.phone}</td>
                        <td className='px-4 py-3'>{v.city}, {v.state}</td>
                        <td className='px-4 py-3 font-bold text-emerald-600'>{v.instrument_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vendors.length === 0 && <p className='text-center text-sm text-gray-500 py-8'>No vendors found for this GSTIN.</p>}
              </div>
            )}

            {activeTab === 'inspectors' && (
              <div className='card overflow-x-auto'>
                <div className='flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <h2 className='font-bold text-lg'>Inspectors ({inspectors.length})</h2>
                    {activeInspectorSearch && <p className='text-xs text-gray-500 mt-1'>Showing results for ID: {activeInspectorSearch}</p>}
                  </div>
                  <form onSubmit={handleInspectorSearch} className='flex gap-2 w-full md:w-auto'>
                    <label className='sr-only' htmlFor='inspector-id-search'>Search inspector by ID</label>
                    <div className='relative flex-1 md:w-72'>
                      <Search size={16} className='absolute left-3 top-2.5 text-gray-400' />
                      <input
                        id='inspector-id-search'
                        value={inspectorSearch}
                        onChange={e => setInspectorSearch(e.target.value)}
                        placeholder='Search by Government ID'
                        className='input-field pl-9 pr-9'
                      />
                      {inspectorSearch && <button type='button' onClick={clearInspectorSearch} className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-700' title='Clear inspector search'><X size={16} /></button>}
                    </div>
                    <button type='submit' className='btn-primary flex items-center gap-2'><Search size={16} /> Search</button>
                  </form>
                </div>
                <table className='w-full text-sm'>
                  <thead><tr className='bg-gray-50 border-b'>
                    {['Name', 'Gov ID', 'Designation', 'Zone', 'Status'].map(h => (
                      <th key={h} className='px-4 py-3 text-left font-semibold text-gray-700'>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className='divide-y'>
                    {inspectors.map(i => (
                      <tr key={i.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-3 font-semibold'>{i.full_name}</td>
                        <td className='px-4 py-3 font-mono text-xs'>{i.gov_id}</td>
                        <td className='px-4 py-3'>{i.designation}</td>
                        <td className='px-4 py-3'>{i.zone}</td>
                        <td className='px-4 py-3'>
                          <span className={i.is_active ? 'badge-valid' : 'badge-expired'}>{i.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inspectors.length === 0 && <p className='text-center text-sm text-gray-500 py-8'>No inspectors found for this ID.</p>}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className='card overflow-x-auto'>
                <h2 className='font-bold text-lg mb-4'>All Appointments ({appointments.length})</h2>
                <table className='w-full text-sm'>
                  <thead><tr className='bg-gray-50 border-b'>
                    {['Business', 'Instrument', 'Date', 'Purpose', 'Status', 'Inspector', 'Assign'].map(h => (
                      <th key={h} className='px-4 py-3 text-left font-semibold text-gray-700'>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className='divide-y'>
                    {appointments.map(a => (
                      <tr key={a.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-3'>{a.business_name}</td>
                        <td className='px-4 py-3 text-xs'>{a.make} {a.model}</td>
                        <td className='px-4 py-3'>{new Date(a.preferred_date).toLocaleDateString('en-IN')}</td>
                        <td className='px-4 py-3'>{a.purpose?.replace('_', ' ')}</td>
                        <td className='px-4 py-3'>
                          <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{a.status}</span>
                        </td>
                        <td className='px-4 py-3'>{a.inspector_name || '-'}</td>
                        <td className='px-4 py-3'>
                          {a.status === 'PENDING' && (
                            <select onChange={e => { if (e.target.value) handleAssign(a.id, e.target.value) }} className='text-xs border border-gray-300 rounded px-2 py-1' disabled={assigningId === a.id} defaultValue=''>
                              <option value=''>Assign...</option>
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
              <div className='space-y-6'>
                <div className='card'>
                  <h2 className='font-bold text-lg mb-4'>File Complaint Against Vendor or Inspector</h2>
                  <form onSubmit={handleComplaintSubmit} className='grid gap-4 md:grid-cols-2'>
                    <div>
                      <label className='block text-sm font-semibold mb-1'>Complaint Against *</label>
                      <select name='targetType' value={complaintForm.targetType} onChange={updateComplaintForm} className='input-field'>
                        <option value='vendor'>Vendor</option>
                        <option value='inspector'>Inspector</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-1'>{complaintForm.targetType === 'vendor' ? 'Vendor' : 'Inspector'} *</label>
                      <select name='targetId' value={complaintForm.targetId} onChange={updateComplaintForm} className='input-field' required>
                        <option value=''>Select {complaintForm.targetType}</option>
                        {complaintForm.targetType === 'vendor'
                          ? vendors.map(v => <option key={v.id} value={v.id}>{v.business_name} ({v.gstin})</option>)
                          : inspectors.map(i => <option key={i.id} value={i.id}>{i.full_name} ({i.gov_id})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-1'>Category *</label>
                      <input name='category' value={complaintForm.category} onChange={updateComplaintForm} className='input-field' placeholder='e.g. Compliance issue' required />
                    </div>
                    <div className='md:col-span-2'>
                      <label className='block text-sm font-semibold mb-1'>Description *</label>
                      <textarea name='description' value={complaintForm.description} onChange={updateComplaintForm} className='input-field min-h-24' placeholder='Describe the complaint' required />
                    </div>
                    <div className='md:col-span-2'>
                      <button type='submit' disabled={complaintSaving} className='btn-primary'>{complaintSaving ? 'Submitting...' : 'Submit Complaint'}</button>
                    </div>
                  </form>
                </div>

                <div className='card overflow-x-auto'>
                  <h2 className='font-bold text-lg mb-4'>Complaint Inbox ({complaints.length})</h2>
                  <table className='w-full text-sm'>
                    <thead><tr className='bg-gray-50 border-b'>
                      {['Target', 'Category', 'Description', 'Date', 'Status'].map(h => <th key={h} className='px-4 py-3 text-left font-semibold text-gray-700'>{h}</th>)}
                    </tr></thead>
                    <tbody className='divide-y'>
                      {complaints.map(complaint => (
                        <tr key={complaint.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 font-semibold'>{complaint.type?.includes('VENDOR') ? complaint.vendor_business_name || complaint.vendorId : complaint.inspector_name || complaint.inspector_gov_id || complaint.inspectorId}</td>
                          <td className='px-4 py-3'>{complaint.category}</td>
                          <td className='px-4 py-3 max-w-sm'>{complaint.description}</td>
                          <td className='px-4 py-3 whitespace-nowrap'>{new Date(complaint.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className='px-4 py-3'>
                            <select value={complaint.status} onChange={e => handleComplaintStatus(complaint.id, e.target.value)} className='text-xs border border-gray-300 rounded px-2 py-1'>
                              <option value='OPEN'>OPEN</option>
                              <option value='INVESTIGATING'>INVESTIGATING</option>
                              <option value='RESOLVED'>RESOLVED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {complaints.length === 0 && <p className='text-center text-sm text-gray-500 py-8'>No complaints found.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}