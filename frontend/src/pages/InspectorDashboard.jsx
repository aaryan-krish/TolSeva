import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LogOut, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getAssignedVisits } from '../services/api.js'
import VisitList from '../components/inspector/VisitList.jsx'
import VerifyModal from '../components/inspector/VerifyModal.jsx'

export default function InspectorDashboard() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedVisit, setSelectedVisit] = useState(null)

  if (!auth || auth.role !== 'inspector') { navigate('/'); return null }

  useEffect(() => { fetchVisits() }, [filter])

  async function fetchVisits() {
    setLoading(true)
    try { const r = await getAssignedVisits(filter); setVisits(r.data.visits) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-saffron-600 text-white px-4 py-6'>
        <div className='max-w-5xl mx-auto flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <Shield size={18} className='text-green-500' />
              <span className='text-green-500 text-sm font-semibold'>Inspector Dashboard</span>
            </div>
            <h1 className='text-2xl font-bold'>{auth.user?.full_name}</h1>
            <p className='text-blue-200 text-sm'>ID: {auth.user?.gov_id} | Zone: {auth.user?.zone}</p>
          </div>
          <button onClick={() => { logout(); navigate('/') }} className='flex items-center gap-2 text-sm border border-white/30 rounded px-3 py-2 hover:bg-white/10'>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 py-6'>
        <div className='flex items-center gap-3 mb-6 flex-wrap'>
          <span className='flex items-center gap-1.5 text-sm font-semibold text-gray-700'><Filter size={15} /> Filter Visits:</span>
          {[{ key: 'all', label: 'All Assigned' }, { key: 'expired', label: '🔴 Expired' }, { key: 'approaching', label: '🟡 Approaching Expiry' }].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={'px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ' + (filter === key ? 'bg-saffron-600 text-white border-saffron-600' : 'bg-white text-gray-700 border-gray-300 hover:border-saffron-400')}>
              {label}
            </button>
          ))}
          <span className='ml-auto text-sm text-gray-500'>{visits.length} visit(s)</span>
        </div>

        <VisitList visits={visits} loading={loading} onVerify={setSelectedVisit} />
      </div>

      {selectedVisit && (
        <VerifyModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onSuccess={() => { setSelectedVisit(null); fetchVisits() }}
        />
      )}
    </div>
  )
}