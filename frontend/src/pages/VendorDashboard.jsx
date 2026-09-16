import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, RefreshCw, Building2, LogOut, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMachines, getAppointments } from '../services/api.js'
import MachineTable from '../components/vendor/MachineTable.jsx'
import AddMachineModal from '../components/vendor/AddMachineModal.jsx'
import AppointmentForm from '../components/vendor/AppointmentForm.jsx'

export default function VendorDashboard() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [machines, setMachines] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loadingMachines, setLoadingMachines] = useState(true)
  const [showAddMachine, setShowAddMachine] = useState(false)
  const [showAppointment, setShowAppointment] = useState(false)
  const [activeTab, setActiveTab] = useState('machines')

  if (!auth || auth.role !== 'vendor') { navigate('/'); return null }

  useEffect(() => { fetchMachines(); fetchAppointments() }, [])

  async function fetchMachines() {
    setLoadingMachines(true)
    try { const r = await getMachines(); setMachines(r.data.machines) }
    catch (e) { console.error(e) }
    finally { setLoadingMachines(false) }
  }

  async function fetchAppointments() {
    try { const r = await getAppointments(); setAppointments(r.data.appointments) }
    catch (e) { console.error(e) }
  }

  const expired = machines.filter(m => m.expiry_status === 'EXPIRED').length
  const expiringSoon = machines.filter(m => m.expiry_status === 'EXPIRING_SOON').length

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-navy-900 text-white px-4 py-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <Building2 size={20} className='text-gold-400' />
                <span className='text-gold-400 text-sm font-semibold'>Vendor Dashboard</span>
              </div>
              <h1 className='text-2xl font-bold'>{auth.user?.business_name}</h1>
              <p className='text-blue-200 text-sm'>GSTIN: {auth.user?.gstin}</p>
            </div>
            <button onClick={() => { logout(); navigate('/') }} className='flex items-center gap-2 text-sm border border-white/30 rounded px-3 py-2 hover:bg-white/10'>
              <LogOut size={16} /> Logout
            </button>
          </div>
          {expired > 0 && (
            <div className='mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold'>
              ⚠️ {expired} instrument(s) have expired certificates. Book a renewal appointment immediately.
            </div>
          )}
          {expiringSoon > 0 && expired === 0 && (
            <div className='mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold'>
              🔔 {expiringSoon} instrument(s) expiring within 30 days. Schedule renewal soon.
            </div>
          )}
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          {[
            { label: 'Total Instruments', value: machines.length, icon: '⚖️', color: 'border-navy-200 bg-navy-50' },
            { label: 'Active', value: machines.filter(m => m.status === 'ACTIVE').length, icon: '✅', color: 'border-green-200 bg-green-50' },
            { label: 'Expired', value: expired, icon: '❌', color: 'border-red-200 bg-red-50' },
            { label: 'Appointments', value: appointments.length, icon: '📅', color: 'border-amber-200 bg-amber-50' }
          ].map(stat => (
            <div key={stat.label} className={'border rounded-lg p-4 ' + stat.color}>
              <div className='text-2xl mb-1'>{stat.icon}</div>
              <div className='text-2xl font-extrabold text-gray-900'>{stat.value}</div>
              <div className='text-xs text-gray-600 font-medium'>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className='flex gap-1 mb-4 bg-gray-200 rounded-lg p-1 w-fit'>
          {[{ key: 'machines', label: 'My Instruments', icon: Package }, { key: 'appointments', label: 'Appointments', icon: Calendar }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (activeTab === key ? 'bg-white text-navy-900 shadow' : 'text-gray-600 hover:text-gray-900')}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {activeTab === 'machines' && (
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='font-bold text-lg text-navy-900'>Instrument Inventory</h2>
              <div className='flex gap-2'>
                <button onClick={fetchMachines} className='btn-outline text-sm py-1.5 flex items-center gap-1'><RefreshCw size={14} /> Refresh</button>
                <button onClick={() => setShowAddMachine(true)} className='btn-primary text-sm py-1.5 flex items-center gap-1'><Plus size={14} /> Add Machine</button>
                <button onClick={() => setShowAppointment(true)} className='btn-secondary text-sm py-1.5 flex items-center gap-1'><Calendar size={14} /> Book Appointment</button>
              </div>
            </div>
            <MachineTable machines={machines} loading={loadingMachines} />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='font-bold text-lg text-navy-900'>My Appointments</h2>
              <button onClick={() => setShowAppointment(true)} className='btn-primary text-sm py-1.5 flex items-center gap-1'><Calendar size={14} /> Book New</button>
            </div>
            {appointments.length === 0 ? (
              <div className='text-center py-10 text-gray-400'>
                <div className='text-4xl mb-3'>📅</div>
                <p>No appointments booked yet</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {appointments.map(a => (
                  <div key={a.id} className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='font-semibold'>{a.make} {a.model} - {a.serial_no}</p>
                        <p className='text-sm text-gray-600'>Purpose: {a.purpose?.replace('_', ' ')}</p>
                        <p className='text-sm text-gray-600'>Date: {new Date(a.preferred_date).toLocaleDateString('en-IN')}</p>
                        {a.inspector_name && <p className='text-sm text-gray-600'>Inspector: {a.inspector_name}</p>}
                      </div>
                      <span className={'text-xs font-bold px-2 py-1 rounded-full ' + (a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : a.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddMachine && <AddMachineModal onClose={() => setShowAddMachine(false)} onSuccess={() => { setShowAddMachine(false); fetchMachines() }} />}
      {showAppointment && <AppointmentForm machines={machines} onClose={() => setShowAppointment(false)} onSuccess={() => { setShowAppointment(false); fetchAppointments() }} />}
    </div>
  )
}