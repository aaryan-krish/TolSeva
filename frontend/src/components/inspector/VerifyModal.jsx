import { useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { submitVerification } from '../../services/api.js'

export default function VerifyModal({ visit, onClose, onSuccess }) {
  const [form, setForm] = useState({ test_result: '', observations: '', error_percentage: '', valid_months: '12', photo_url: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cert, setCert] = useState(null)

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const payload = {
        appointment_id: visit.id,
        instrument_id: visit.instrument_id,
        test_result: form.test_result,
        observations: form.observations,
        error_percentage: form.error_percentage ? parseFloat(form.error_percentage) : null,
        valid_months: parseInt(form.valid_months) || 12,
        photo_url: form.photo_url || null
      }
      const res = await submitVerification(payload)
      setCert(res.data)
    } catch (err) { setError(err.response?.data?.error || 'Verification failed') }
    finally { setLoading(false) }
  }

  if (cert) return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='bg-white w-full max-w-md rounded-xl shadow-2xl'>
        <div className='bg-green-700 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-white font-bold flex items-center gap-2'><ShieldCheck size={18} /> Certificate Issued</h2>
          <button onClick={() => { onSuccess(); onClose() }} className='text-white'><X size={20} /></button>
        </div>
        <div className='p-6 text-center'>
          <div className='text-5xl mb-4'>🏅</div>
          <p className='text-green-700 font-bold text-lg'>Verification Successful!</p>
          <p className='text-sm text-gray-600 mt-2'>Certificate No:</p>
          <p className='font-mono font-bold text-saffron-600 text-sm mt-1'>{cert.certificate_no}</p>
          <p className='text-sm text-gray-600 mt-3'>Valid Until: <span className='font-semibold'>{new Date(cert.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></p>
          {cert.qr_data_url && (
            <div className='mt-4'>
              <p className='text-xs text-gray-500 mb-2'>Scan to verify certificate</p>
              <img src={cert.qr_data_url} alt='Certificate QR Code' className='mx-auto w-40 h-40 border border-gray-200 rounded' />
            </div>
          )}
          <button onClick={() => { onSuccess(); onClose() }} className='btn-primary w-full mt-6'>Done</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='bg-white w-full max-w-lg rounded-xl shadow-2xl'>
        <div className='bg-saffron-600 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-white font-bold'>Field Verification</h2>
          <button onClick={onClose} className='text-white hover:text-green-500'><X size={20} /></button>
        </div>
        <div className='px-6 py-3 bg-gray-50 border-b text-sm'>
          <p className='font-semibold'>{visit.make} {visit.model}</p>
          <p className='text-gray-600'>S/N: {visit.serial_no} | {visit.business_name}</p>
        </div>
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {error && <div className='p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm'>{error}</div>}
          <div>
            <label className='block text-sm font-semibold mb-1'>Test Result *</label>
            <div className='flex gap-3'>
              {[{ value: 'PASS', color: 'green' }, { value: 'FAIL', color: 'red' }, { value: 'CONDITIONAL_PASS', color: 'amber' }].map(({ value, color }) => (
                <label key={value} className='flex items-center gap-2 cursor-pointer'>
                  <input type='radio' name='test_result' value={value} checked={form.test_result === value} onChange={update} required className='sr-only' />
                  <span className={'px-3 py-1.5 rounded border-2 text-sm font-bold transition-colors ' + (form.test_result === value ? (color === 'green' ? 'bg-green-600 text-white border-green-600' : color === 'red' ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500') : 'border-gray-300 text-gray-600')}>{value.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold mb-1'>Error % (if any)</label>
              <input name='error_percentage' type='number' step='0.001' value={form.error_percentage} onChange={update} className='input-field' placeholder='0.000' />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-1'>Valid for (months)</label>
              <select name='valid_months' value={form.valid_months} onChange={update} className='input-field'>
                <option value='6'>6 months</option>
                <option value='12'>12 months</option>
                <option value='24'>24 months</option>
              </select>
            </div>
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Observations</label>
            <textarea name='observations' value={form.observations} onChange={update} className='input-field' rows={3} placeholder='Describe test findings, instrument condition...' />
          </div>
          <div>
            <label className='block text-sm font-semibold mb-1'>Photo URL (optional)</label>
            <input name='photo_url' value={form.photo_url} onChange={update} className='input-field' placeholder='https://... or leave blank' />
          </div>
          <div className='flex gap-3 pt-2'>
            <button type='button' onClick={onClose} className='btn-outline flex-1'>Cancel</button>
            <button type='submit' disabled={loading || !form.test_result} className='btn-primary flex-1'>{loading ? 'Processing...' : 'Issue Certificate'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}