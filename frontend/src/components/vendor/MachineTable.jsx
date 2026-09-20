import { AlertTriangle, CheckCircle, Clock, XCircle, Wrench, Download, QrCode } from 'lucide-react'

function ExpiryBadge({ status, daysUntilExpiry }) {
  if (status === 'EXPIRED' || daysUntilExpiry < 0) return <span className='badge-expired'><XCircle size={12} className='mr-1' />Expired</span>
  if (status === 'EXPIRING_SOON' || (daysUntilExpiry >= 0 && daysUntilExpiry <= 30)) return <span className='badge-expiring'><AlertTriangle size={12} className='mr-1' />Expiring in {daysUntilExpiry}d</span>
  if (status === 'APPROACHING' || (daysUntilExpiry > 30 && daysUntilExpiry <= 90)) return <span className='badge-approaching'><Clock size={12} className='mr-1' />Exp. in {daysUntilExpiry}d</span>
  if (status === 'VALID') return <span className='badge-valid'><CheckCircle size={12} className='mr-1' />Valid</span>
  return <span className='badge-pending'><Wrench size={12} className='mr-1' />Pending</span>
}

function StatusBadge({ status }) {
  const map = { ACTIVE: 'badge-valid', PENDING: 'badge-pending', EXPIRED: 'badge-expired', SUSPENDED: 'badge-expired' }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

function downloadCertificate(machine) {
  const certificate = machine.certificate
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>TolSeva Certificate ${certificate.certificate_no}</title><style>body{font-family:Arial,sans-serif;margin:48px;color:#17202a}main{max-width:720px;margin:auto;border:2px solid #047857;padding:36px}h1{color:#047857;text-align:center}h2{text-align:center;font-weight:normal}dl{display:grid;grid-template-columns:180px 1fr;gap:12px;margin-top:32px}dt{font-weight:bold;color:#64748b}dd{margin:0}footer{margin-top:40px;text-align:center;color:#64748b;font-size:12px}</style></head><body><main><h1>Legal Metrology Certificate</h1><h2>TolSeva Government Verification Portal</h2><dl><dt>Certificate Number</dt><dd>${certificate.certificate_no}</dd><dt>Instrument</dt><dd>${machine.make} ${machine.model}</dd><dt>Serial Number</dt><dd>${machine.serial_no}</dd><dt>Instrument Type</dt><dd>${machine.instrument_type}</dd><dt>Test Result</dt><dd>${certificate.test_result}</dd><dt>Valid Until</dt><dd>${certificate.valid_until || 'Not specified'}</dd></dl><footer>Verify online using the QR code associated with this certificate.</footer></main></body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${certificate.certificate_no.replace(/[^a-z0-9_-]/gi, '_')}.html`
  link.click()
  URL.revokeObjectURL(url)
}

export default function MachineTable({ machines, loading }) {
  if (loading) return (
    <div className='flex justify-center py-16'>
      <div className='animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full' />
    </div>
  )

  if (!machines.length) return (
    <div className='text-center py-16 text-gray-400'>
      <div className='text-5xl mb-4'>⚖️</div>
      <p className='font-semibold text-lg'>No instruments registered yet</p>
      <p className='text-sm mt-1'>Click Add Machine to register your first weighing instrument</p>
    </div>
  )

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='bg-gray-50 border-b-2 border-gray-200'>
            {['Make / Model', 'Serial No.', 'Type', 'Capacity', 'Expiry Date', 'Expiry Status', 'Reg. Status', 'Documents'].map(h => (
              <th key={h} className='px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap'>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-100'>
          {machines.map(m => (
            <tr key={m.id} className='hover:bg-gray-50 transition-colors'>
              <td className='px-4 py-3'>
                <div className='font-semibold text-gray-900'>{m.make}</div>
                <div className='text-gray-500 text-xs'>{m.model}</div>
              </td>
              <td className='px-4 py-3 font-mono text-xs text-gray-700'>{m.serial_no}</td>
              <td className='px-4 py-3 text-gray-700'>{m.instrument_type}</td>
              <td className='px-4 py-3 text-gray-700'>{m.capacity} {m.unit}</td>
              <td className='px-4 py-3 text-gray-700'>
                {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set'}
              </td>
              <td className='px-4 py-3'>
                <ExpiryBadge status={m.expiry_status} daysUntilExpiry={m.days_until_expiry} />
              </td>
              <td className='px-4 py-3'>
                <StatusBadge status={m.status} />
              </td>
              <td className='px-4 py-3'>
                {m.certificate ? (
                  <div className='flex items-center gap-2'>
                    <button type='button' onClick={() => downloadCertificate(m)} className='text-emerald-700 hover:text-emerald-900' title='Download certificate'><Download size={17} /></button>
                    <a href={m.certificate.qr_data_url} download={`${m.certificate.certificate_no.replace(/[^a-z0-9_-]/gi, '_')}-qr.png`} className='text-blue-700 hover:text-blue-900' title='Download QR code'><QrCode size={17} /></a>
                  </div>
                ) : <span className='text-xs text-gray-400'>No certificate</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}