import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, LogOut, Users, ShieldCheck, Calendar, BarChart3, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAdminDashboard, getAdminVendors, getAdminInspectors, getAdminAppointments, assignInspector, confirmAppointment } from '../services/api.js'

export default function AdminDashboard() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [vendors, setVendors] = useState([])
  const [inspectors, setInspectors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [selectedInspectors, setSelectedInspectors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)

  if (!auth || auth.role !== 'admin') { navigate('/'); return null }

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const [dashRes, vendRes, insRes, appRes] = await Promise.all([
          getAdminDashboard(), getAdminVendors(), getAdminInspectors(), getAdminAppointments()
        ])
        setStats(dashRes.data.stats)
        setVendors(vendRes.data.vendors)
        setInspectors(insRes.data.inspectors)
        setAppointments(appRes.data.appointments)
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
      setSuccessMsg('Inspector assigned & appointment confirmed!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) { console.error(e) }
    finally { setAssigningId(null) }
  }

  async function handleConfirm(appointmentId) {
    setAssigningId(appointmentId)
    try {
      await confirmAppointment(appointmentId)
      const appRes = await getAdminAppointments()
      setAppointments(appRes.data.appointments)
      setSuccessMsg('Appointment confirmed successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) { console.error(e) }
    finally { setAssigningId(null) }
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'vendors', label: 'Vendors', icon: Users },
    { key: 'inspectors', label: 'Inspectors', icon: ShieldCheck },
    { key: 'appointments', label: 'Appointments', icon: Calendar }
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-navy-900 text-white px-4 py-6'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-1'><Crown size={18} className='text-gold-400' /><span className='text-gold-400 text-sm font-semibold'>Admin Dashboard</span></div>
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
              className={'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (activeTab === key ? 'bg-white text-navy-900 shadow' : 'text-gray-600 hover:text-gray-900')}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='flex justify-center py-20'>
            <div className='animate-spin w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full' />
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
                <h2 className='font-bold text-lg mb-4'>Registered Vendors ({vendors.length})</h2>
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
                        <td className='px-4 py-3 font-bold text-navy-900'>{v.instrument_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'inspectors' && (
              <div className='card overflow-x-auto'>
                <h2 className='font-bold text-lg mb-4'>Inspectors ({inspectors.length})</h2>
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
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className='card overflow-x-auto'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='font-bold text-lg'>All Appointments ({appointments.length})</h2>
                </div>
                {successMsg && (
                  <div className='mb-4 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 animate-fadeIn'>
                    <Check size={16} className='text-green-600' />
                    <span className='font-semibold'>{successMsg}</span>
                  </div>
                )}
                <table className='w-full text-sm'>
                  <thead><tr className='bg-gray-50 border-b'>
                    {['Business', 'Instrument', 'Date', 'Purpose', 'Status', 'Inspector', 'Action'].map(h => (
                      <th key={h} className='px-4 py-3 text-left font-semibold text-gray-700'>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className='divide-y'>
                    {appointments.map(a => {
                      const selectedId = selectedInspectors[a.id] ?? (a.inspector_id || '');
                      const isPending = a.status === 'PENDING';
                      const isConfirmed = a.status === 'CONFIRMED';
                      const isAssigning = assigningId === a.id;

                      return (
                        <tr key={a.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 font-medium'>{a.business_name}</td>
                          <td className='px-4 py-3 text-xs'>{a.make} {a.model}</td>
                          <td className='px-4 py-3'>{new Date(a.preferred_date).toLocaleDateString('en-IN')}</td>
                          <td className='px-4 py-3'>{a.purpose?.replace('_', ' ')}</td>
                          <td className='px-4 py-3'>
                            <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : isConfirmed ? 'bg-blue-100 text-blue-700' : a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{a.status}</span>
                          </td>
                          <td className='px-4 py-3 font-medium text-gray-800'>{a.inspector_name || '—'}</td>
                          <td className='px-4 py-3'>
                            {isPending ? (
                              <div className='flex items-center gap-2'>
                                <select
                                  value={selectedId}
                                  onChange={e => setSelectedInspectors(s => ({ ...s, [a.id]: e.target.value }))}
                                  className='text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-800 font-medium focus:ring-1 focus:ring-navy-900 focus:border-navy-900'
                                  disabled={isAssigning}
                                >
                                  <option value=''>Choose Inspector...</option>
                                  {inspectors.map(i => (
                                    <option key={i.id} value={i.id}>{i.full_name} ({i.zone})</option>
                                  ))}
                                </select>

                                {/* Confirmation Button */}
                                <button
                                  onClick={() => {
                                    if (selectedId) {
                                      handleAssign(a.id, selectedId);
                                    } else {
                                      handleConfirm(a.id);
                                    }
                                  }}
                                  disabled={isAssigning || (!selectedId && !a.inspector_id)}
                                  className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1 shadow-sm ${
                                    (!selectedId && !a.inspector_id)
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                                  }`}
                                >
                                  {isAssigning ? (
                                    <span className='animate-pulse'>Saving...</span>
                                  ) : (
                                    <>
                                      <Check size={13} />
                                      {a.inspector_id && !selectedInspectors[a.id] ? 'Confirm Visit' : 'Confirm & Assign'}
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : isConfirmed ? (
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded border border-green-200 flex items-center gap-1'>
                                  <Check size={12} /> Confirmed
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedInspectors(s => ({ ...s, [a.id]: a.inspector_id || '' }));
                                    handleAssign(a.id, a.inspector_id);
                                  }}
                                  className='text-xs text-blue-600 hover:underline'
                                >
                                  Reassign
                                </button>
                              </div>
                            ) : (
                              <span className='text-xs text-gray-400'>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}