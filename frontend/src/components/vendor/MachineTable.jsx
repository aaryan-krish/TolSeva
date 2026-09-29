import { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, XCircle, Wrench, Download, QrCode, FileText } from 'lucide-react'
import QRCode from 'qrcode'
import CertificateModal from './CertificateModal.jsx'

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

export default function MachineTable({ machines, loading }) {
  const [selectedCertMachine, setSelectedCertMachine] = useState(null)

  async function handleDownloadQr(cert) {
    if (!cert?.certificate_no) return
    const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(cert.certificate_no)}`
    try {
      const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 500, margin: 2 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${cert.certificate_no.replace(/[^a-z0-9_-]/gi, '_')}-qr.png`
      link.click()
    } catch (e) {
      if (cert.qr_data_url) {
        const link = document.createElement('a')
        link.href = cert.qr_data_url
        link.download = `${cert.certificate_no.replace(/[^a-z0-9_-]/gi, '_')}-qr.png`
        link.click()
      }
    }
  }

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
    <>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-gray-50 border-b-2 border-gray-200'>
              {['Make / Model', 'Serial No.', 'Type', 'Capacity', 'Expiry Date', 'Expiry Status', 'Reg. Status', 'Certificate & QR'].map(h => (
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
                      <button
                        type='button'
                        onClick={() => setSelectedCertMachine(m)}
                        className='flex items-center gap-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer'
                        title='View and Print Official Certificate'
                      >
                        <FileText size={14} className='text-emerald-700' /> Certificate
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDownloadQr(m.certificate)}
                        className='p-1.5 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer'
                        title='Download QR code image'
                      >
                        <QrCode size={15} />
                      </button>
                    </div>
                  ) : (
                    <span className='text-xs text-gray-400 italic'>Pending verification</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCertMachine && (
        <CertificateModal
          machine={selectedCertMachine}
          onClose={() => setSelectedCertMachine(null)}
        />
      )}
    </>
  )
}