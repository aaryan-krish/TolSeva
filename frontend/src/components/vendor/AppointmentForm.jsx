import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
import { bookAppointment } from '../../services/api.js'

export default function AppointmentForm({ machines, onClose, onSuccess }) {
  const [form, setForm] = useState({ instrument_id: '', preferred_date: '', preferred_time: '', purpose: '', vendor_notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try { await bookAppointment(form); onSuccess() }
    catch (err) { setError(err.response?.data?.error || 'Failed to book appointment') }
    finally { setLoading(false) }
  }

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='bg-white w-full max-w-md rounded-xl shadow-2xl'>
        <div className='bg-saffron-600 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-white font-bold flex items-center gap-2'><Calendar size={18} /> Book Inspection Appointment</h2>
          <button onClick={onClose} className='text-white hover:text-green-500'><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {error && <div className='p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm'>{error}</div>}
          <div>
            <label className='block text-sm font-semibold mb-1'>Select Instrument</label>
            <select name='instrument_id' value={form.instrument_id} onChange={update} className='input-field'>
              <option value=''>All / New Instruments</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.make} {m.model} - S/N: {m.serial_no}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Purpose *</label>
            <select name='purpose' value={form.purpose} onChange={update} className='input-field' required>
              <option value=''>Select purpose...</option>
              <option value='NEW_REGISTRATION'>New Registration</option>
              <option value='RENEWAL'>Renewal</option>
              <option value='RE_INSPECTION'>Re-Inspection</option>
              <option value='COMPLAINT'>Complaint</option>
            </select>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold mb-1'>Preferred Date *</label>
              <input name='preferred_date' type='date' value={form.preferred_date} onChange={update} className='input-field' min={tomorrow.toISOString().split('T')[0]} required />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-1'>Preferred Time</label>
              <input name='preferred_time' type='time' value={form.preferred_time} onChange={update} className='input-field' />
            </div>
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Additional Notes</label>
            <textarea name='vendor_notes' value={form.vendor_notes} onChange={update} className='input-field' rows={2} placeholder='Any special instructions for the inspector...' />
          </div>
          <div className='flex gap-3 pt-2'>
            <button type='button' onClick={onClose} className='btn-outline flex-1'>Cancel</button>
            <button type='submit' disabled={loading} className='btn-primary flex-1'>{loading ? 'Booking...' : 'Book Appointment'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}