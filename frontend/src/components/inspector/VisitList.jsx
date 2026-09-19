import { MapPin, Phone, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

function PriorityBadge({ status }) {
  const map = {
    EXPIRED: { label: 'EXPIRED - URGENT', cls: 'badge-expired' },
    EXPIRING_SOON: { label: 'Expiring < 30d', cls: 'badge-expiring' },
    APPROACHING: { label: 'Expiring < 90d', cls: 'badge-approaching' },
    VALID: { label: 'Valid', cls: 'badge-valid' }
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-pending' }
  return <span className={cls}>{label}</span>
}

export default function VisitList({ visits, loading, onVerify }) {
  if (loading) return (
    <div className='flex justify-center py-16'>
      <div className='animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full' />
    </div>
  )

  if (!visits.length) return (
    <div className='text-center py-16 text-gray-400'>
      <CheckCircle size={48} className='mx-auto mb-4 text-green-400' />
      <p className='font-semibold text-lg'>No visits in queue</p>
      <p className='text-sm'>All assigned appointments are up to date</p>
    </div>
  )

  return (
    <div className='space-y-4'>
      {visits.map(visit => (
        <div key={visit.id} className='card border hover:shadow-lg transition-shadow'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2 flex-wrap'>
                <span className='font-bold text-emerald-600'>{visit.make} {visit.model}</span>
                <PriorityBadge status={visit.expiry_status} />
              </div>
              <p className='text-sm text-gray-600'>S/N: <span className='font-mono'>{visit.serial_no}</span> | Type: {visit.instrument_type}</p>
              <p className='text-sm text-gray-600'>Capacity: {visit.capacity} {visit.unit}</p>
              <div className='mt-3 pt-3 border-t border-gray-100 grid md:grid-cols-2 gap-2 text-sm'>
                <div className='flex items-center gap-1.5 text-gray-700'>
                  <MapPin size={14} className='text-emerald-600' />
                  <span>{visit.business_name}</span>
                </div>
                {visit.vendor_phone && (
                  <div className='flex items-center gap-1.5 text-gray-700'>
                    <Phone size={14} className='text-emerald-600' />
                    <span>+91 {visit.vendor_phone}</span>
                  </div>
                )}
                {visit.address && (
                  <div className='flex items-center gap-1.5 text-gray-600 md:col-span-2'>
                    <MapPin size={14} className='text-gray-400' />
                    <span className='text-xs'>{visit.address}</span>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                <span className='flex items-center gap-1'><AlertTriangle size={12} />Expiry: {visit.expiry_date ? new Date(visit.expiry_date).toLocaleDateString('en-IN') : 'N/A'}</span>
                <span className='flex items-center gap-1'><Clock size={12} />Visit: {new Date(visit.preferred_date).toLocaleDateString('en-IN')} {visit.preferred_time && ('at ' + visit.preferred_time)}</span>
              </div>
            </div>
            <button onClick={() => onVerify(visit)} className='btn-primary text-sm py-2 px-4 whitespace-nowrap flex-shrink-0'>Verify</button>
          </div>
        </div>
      ))}
    </div>
  )
}