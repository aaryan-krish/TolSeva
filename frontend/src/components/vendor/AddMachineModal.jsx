import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { addMachine } from '../../services/api.js'

const INSTRUMENT_TYPES = [
  'Electronic Platform Scale', 'Mechanical Platform Scale', 'Counter Scale',
  'Bench Scale', 'Floor Scale', 'Truck Weighbridge', 'Retail Weighing Scale',
  'Weighing Balance', 'Tape Measure', 'Thermometer', 'Pressure Gauge',
  'Fuel Dispenser', 'Water Meter', 'Electricity Meter', 'Other'
]

export default function AddMachineModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ make: '', model: '', serial_no: '', instrument_type: '', capacity: '', unit: 'kg', manufacture_year: '', installation_date: '', location_description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try { await addMachine(form); onSuccess() }
    catch (err) { setError(err.response?.data?.error || 'Failed to register instrument') }
    finally { setLoading(false) }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='bg-white w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] flex flex-col'>
        <div className='bg-emerald-600 px-6 py-4 flex items-center justify-between flex-shrink-0'>
          <h2 className='text-white font-bold flex items-center gap-2'><Plus size={18} /> Register New Instrument</h2>
          <button onClick={onClose} className='text-white hover:text-green-500'><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className='p-6 space-y-4 overflow-y-auto'>
          {error && <div className='p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm'>{error}</div>}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold mb-1'>Make / Brand *</label>
              <input name='make' value={form.make} onChange={update} className='input-field' placeholder='e.g. Essae Teraoka' required />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-1'>Model *</label>
              <input name='model' value={form.model} onChange={update} className='input-field' placeholder='e.g. DS-852' required />
            </div>
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Serial Number *</label>
            <input name='serial_no' value={form.serial_no} onChange={update} className='input-field' placeholder='Unique serial number' required />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Instrument Type *</label>
            <select name='instrument_type' value={form.instrument_type} onChange={update} className='input-field' required>
              <option value=''>Select type...</option>
              {INSTRUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold mb-1'>Capacity</label>
              <input name='capacity' value={form.capacity} onChange={update} className='input-field' placeholder='e.g. 150' />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-1'>Unit</label>
              <select name='unit' value={form.unit} onChange={update} className='input-field'>
                <option>kg</option><option>g</option><option>L</option><option>mL</option>
                <option>m</option><option>cm</option><option>mm</option><option>deg C</option><option>bar</option>
              </select>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold mb-1'>Manufacture Year</label>
              <input name='manufacture_year' type='number' value={form.manufacture_year} onChange={update} className='input-field' placeholder='2020' min='1990' max={new Date().getFullYear()} />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-1'>Installation Date</label>
              <input name='installation_date' type='date' value={form.installation_date} onChange={update} className='input-field' />
            </div>
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Location / Description</label>
            <textarea name='location_description' value={form.location_description} onChange={update} className='input-field' rows={2} placeholder='e.g. Shop floor, main entrance counter' />
          </div>
          <div className='flex gap-3 pt-2'>
            <button type='button' onClick={onClose} className='btn-outline flex-1'>Cancel</button>
            <button type='submit' disabled={loading} className='btn-primary flex-1'>{loading ? 'Registering...' : 'Register Instrument'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}