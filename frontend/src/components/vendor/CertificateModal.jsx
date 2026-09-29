import { useRef, useState, useEffect } from 'react'
import { X, Printer, Download, QrCode, CheckCircle, Shield, Building2, User, Calendar, ExternalLink } from 'lucide-react'
import QRCode from 'qrcode'

export default function CertificateModal({ machine, onClose }) {
  const cert = machine?.certificate
  const printRef = useRef(null)
  const [liveQrDataUrl, setLiveQrDataUrl] = useState(cert?.qr_data_url || null)

  const clientVerifyUrl = cert?.certificate_no
    ? `${window.location.origin}/verify/${encodeURIComponent(cert.certificate_no)}`
    : ''

  useEffect(() => {
    if (clientVerifyUrl) {
      QRCode.toDataURL(clientVerifyUrl, { width: 350, margin: 2 })
        .then(url => setLiveQrDataUrl(url))
        .catch(err => console.error('Error generating client QR code:', err))
    }
  }, [clientVerifyUrl])

  if (!machine || !cert) return null

  const vendor = cert.vendor || {}
  const inspector = cert.inspector || {}

  function handlePrint() {
    window.print()
  }

  function handleDownloadHtml() {
    const activeQrUrl = liveQrDataUrl || cert.qr_data_url || ''
    const activePayloadUrl = clientVerifyUrl || cert.qr_payload || ''
    const certHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Legal Metrology Certificate - ${cert.certificate_no}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1e293b; background: #fff; }
    .cert-container { max-width: 800px; margin: auto; border: 4px double #047857; padding: 32px; border-radius: 8px; position: relative; }
    .tricolor { height: 6px; background: linear-gradient(to right, #FF9933 33.3%, #FFFFFF 33.3% 66.6%, #138808 66.6%); margin-bottom: 20px; border-radius: 2px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .emblem { font-size: 32px; margin-bottom: 4px; }
    h1 { margin: 0; color: #065f46; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
    h2 { margin: 4px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; margin-top: 8px; }
    .cert-no { font-family: monospace; font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .section-title { font-weight: bold; font-size: 13px; color: #047857; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .label { color: #64748b; font-weight: 500; }
    .value { font-weight: 600; color: #0f172a; text-align: right; }
    .qr-section { margin-top: 24px; display: flex; align-items: center; justify-content: space-between; border-top: 2px dashed #cbd5e1; padding-top: 20px; }
    .qr-box { text-align: center; }
    .qr-box img { width: 140px; height: 140px; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px; }
    .qr-text { font-size: 11px; color: #64748b; max-width: 380px; line-height: 1.5; }
    .signature-box { text-align: right; margin-top: 10px; }
    .sign-line { width: 180px; border-top: 1px solid #0f172a; margin-top: 40px; margin-left: auto; }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="tricolor"></div>
    <div class="header">
      <div class="emblem">🏛️</div>
      <h2>Government of India • Ministry of Consumer Affairs</h2>
      <h1>Directorate of Legal Metrology</h1>
      <h2>Certificate of Verification &amp; Stamping</h2>
      <div class="cert-no">Certificate No: ${cert.certificate_no}</div>
      <div class="badge">STATUS: ${cert.test_result === 'PASS' ? 'VERIFIED &amp; APPROVED' : cert.test_result}</div>
    </div>

    <div class="grid">
      <div class="section">
        <div class="section-title">Establishment / Vendor Details</div>
        <div class="row"><span class="label">Business Name:</span><span class="value">${vendor.business_name || 'N/A'}</span></div>
        <div class="row"><span class="label">Owner Name:</span><span class="value">${vendor.owner_name || 'N/A'}</span></div>
        <div class="row"><span class="label">GSTIN:</span><span class="value" style="font-family:monospace;">${vendor.gstin || 'N/A'}</span></div>
        <div class="row"><span class="label">Address:</span><span class="value">${[vendor.address, vendor.city, vendor.state].filter(Boolean).join(', ') || 'N/A'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Weighing Instrument Details</div>
        <div class="row"><span class="label">Make &amp; Model:</span><span class="value">${machine.make} ${machine.model}</span></div>
        <div class="row"><span class="label">Serial Number:</span><span class="value" style="font-family:monospace;">${machine.serial_no}</span></div>
        <div class="row"><span class="label">Instrument Type:</span><span class="value">${machine.instrument_type}</span></div>
        <div class="row"><span class="label">Capacity &amp; Unit:</span><span class="value">${machine.capacity} ${machine.unit}</span></div>
      </div>
    </div>

    <div class="grid" style="margin-top: 12px;">
      <div class="section">
        <div class="section-title">Validity &amp; Inspection Dates</div>
        <div class="row"><span class="label">Verification Date:</span><span class="value">${cert.verified_at || 'Recent'}</span></div>
        <div class="row"><span class="label">Valid Until:</span><span class="value" style="color: #047857; font-weight:bold;">${cert.valid_until || 'Not specified'}</span></div>
        <div class="row"><span class="label">Verification Standard:</span><span class="value">Legal Metrology Act, 2009</span></div>
      </div>

      <div class="section">
        <div class="section-title">Verifying Officer Details</div>
        <div class="row"><span class="label">Inspector Name:</span><span class="value">${inspector.name || 'Authorized Inspector'}</span></div>
        <div class="row"><span class="label">Government ID:</span><span class="value" style="font-family:monospace;">${inspector.gov_id || 'LM-OFFICER'}</span></div>
        <div class="row"><span class="label">Designation:</span><span class="value">${inspector.designation || 'Legal Metrology Inspector'}</span></div>
        <div class="row"><span class="label">Jurisdiction / Zone:</span><span class="value">${inspector.zone || 'Central Zone'}</span></div>
      </div>
    </div>

    <div class="qr-section">
      <div class="qr-box">
        ${activeQrUrl ? `<img src="${activeQrUrl}" alt="Verification QR Code" />` : ''}
        <div style="font-size:10px; font-weight:bold; margin-top:4px; color:#047857;">SCAN TO VERIFY</div>
      </div>
      <div class="qr-text">
        <p><strong>Official Digital Security QR Code:</strong></p>
        <p>Scan this QR code with any smartphone camera to view live verification records on the TolSeva National Portal.</p>
        <p>Customers can also report inaccurate measurements or machine tampering directly through the scanned verification page.</p>
        <p style="font-size:10px; color:#94a3b8; font-family:monospace;">Verification URL: ${activePayloadUrl}</p>
      </div>
      <div class="signature-box">
        <div class="sign-line"></div>
        <div style="font-size:11px; font-weight:bold; color:#0f172a;">Authorized Signatory</div>
        <div style="font-size:10px; color:#64748b;">Legal Metrology Department</div>
      </div>
    </div>

    <div class="footer">
      This is a system-generated computer certificate issued under the provisions of Section 24 of the Legal Metrology Act, 2009.
      Tampering with this certificate or using unverified weights is a cognizable legal offense.
    </div>
  </div>
</body>
</html>`

    const blob = new Blob([certHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Certificate_${cert.certificate_no.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Print-specific style tag */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-certificate, #printable-certificate * { visibility: visible; }
          #printable-certificate { position: absolute; left: 0; top: 0; width: 100%; border: none; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm">📜 Legal Metrology Certificate</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{cert.certificate_no}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Print Certificate or Save as PDF"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Download HTML Certificate file"
            >
              <Download size={15} /> Download HTML
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto" id="printable-certificate" ref={printRef}>
          {/* Authentic Government Certificate Paper Look */}
          <div className="border-4 border-double border-emerald-800 rounded-xl p-6 sm:p-8 bg-gradient-to-b from-emerald-50/20 via-white to-orange-50/20 relative shadow-inner">
            {/* Tricolor Bar */}
            <div className="tricolor-strip rounded-full mb-6" />

            {/* Certificate Header */}
            <div className="text-center pb-5 border-b border-gray-200">
              <div className="text-3xl mb-1">🏛️</div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Government of India • Ministry of Consumer Affairs</h3>
              <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-900 tracking-wide mt-1">DIRECTORATE OF LEGAL METROLOGY</h1>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mt-0.5">Certificate of Verification &amp; Stamping</p>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                <span className="font-mono text-xs sm:text-sm font-bold bg-white px-3 py-1 border border-gray-300 rounded-md shadow-2xs">
                  Cert No: <span className="text-emerald-800">{cert.certificate_no}</span>
                </span>
                <span className="badge-valid text-xs font-bold px-3 py-1">
                  ✓ {cert.test_result === 'PASS' ? 'VERIFIED & PASSED' : cert.test_result}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* Vendor Section */}
              <div className="bg-white/80 border border-gray-200 rounded-xl p-4 shadow-2xs">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 border-b border-gray-100 pb-2 mb-2.5">
                  <Building2 size={14} /> Establishment / Vendor Details
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Business Name:</span><span className="font-bold text-gray-900">{vendor.business_name || 'Registered Establishment'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Owner Name:</span><span className="font-medium text-gray-800">{vendor.owner_name || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">GSTIN:</span><span className="font-mono font-bold text-gray-900">{vendor.gstin || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Address:</span><span className="font-medium text-gray-800 text-right">{[vendor.address, vendor.city, vendor.state].filter(Boolean).join(', ') || 'N/A'}</span></div>
                </div>
              </div>

              {/* Instrument Section */}
              <div className="bg-white/80 border border-gray-200 rounded-xl p-4 shadow-2xs">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 border-b border-gray-100 pb-2 mb-2.5">
                  <span className="text-sm">⚖️</span> Instrument Details
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Make &amp; Model:</span><span className="font-bold text-gray-900">{machine.make} {machine.model}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Serial Number:</span><span className="font-mono font-bold text-gray-900">{machine.serial_no}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Instrument Type:</span><span className="font-medium text-gray-800">{machine.instrument_type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Capacity &amp; Unit:</span><span className="font-bold text-gray-900">{machine.capacity} {machine.unit}</span></div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="bg-white/80 border border-gray-200 rounded-xl p-4 shadow-2xs">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 border-b border-gray-100 pb-2 mb-2.5">
                  <Calendar size={14} /> Validity &amp; Dates
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Verification Date:</span><span className="font-medium text-gray-900">{cert.verified_at ? new Date(cert.verified_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Official Registry'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Valid Until:</span><span className="font-bold text-emerald-700">{cert.valid_until ? new Date(cert.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Months'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Governing Act:</span><span className="font-medium text-gray-800">Legal Metrology Act, 2009</span></div>
                </div>
              </div>

              {/* Verifying Inspector Section */}
              <div className="bg-white/80 border border-gray-200 rounded-xl p-4 shadow-2xs">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 border-b border-gray-100 pb-2 mb-2.5">
                  <Shield size={14} /> Verifying Inspector
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Inspector Name:</span><span className="font-bold text-gray-900">{inspector.name || 'Legal Metrology Officer'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Government ID:</span><span className="font-mono font-bold text-gray-800">{inspector.gov_id || 'LM-OFFICER'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Designation:</span><span className="font-medium text-gray-800">{inspector.designation || 'Inspector of Legal Metrology'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Jurisdiction Zone:</span><span className="font-medium text-gray-800">{inspector.zone || 'Central'}</span></div>
                </div>
              </div>
            </div>

            {/* QR Code and Authenticity Verification Box */}
            <div className="mt-6 border-t-2 border-dashed border-gray-300 pt-5 flex flex-col sm:flex-row items-center justify-between gap-5 bg-white/60 p-4 rounded-xl">
              <div className="flex items-center gap-4">
                {(liveQrDataUrl || cert.qr_data_url) ? (
                  <div className="p-1.5 bg-white border border-emerald-600 rounded-lg shadow-xs text-center shrink-0">
                    <img src={liveQrDataUrl || cert.qr_data_url} alt="Verification QR Code" className="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
                    <span className="block text-2xs font-extrabold text-emerald-700 tracking-wider mt-0.5">SCAN TO VERIFY</span>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                    <QrCode size={32} />
                  </div>
                )}
                <div className="text-xs text-gray-600 space-y-1 max-w-sm">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" /> Official Security QR Code
                  </p>
                  <p>Scan with any mobile device to view real-time records on the TolSeva public portal.</p>
                  <p className="text-2xs text-gray-500">Customers can report inaccurate measures or machine faults directly via the QR code.</p>
                  {(clientVerifyUrl || cert.qr_payload) && (
                    <a
                      href={clientVerifyUrl || cert.qr_payload}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-2xs text-emerald-700 hover:text-emerald-800 font-semibold underline mt-0.5"
                    >
                      Open Public Verification Page <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Signature stamp placeholder */}
              <div className="text-center sm:text-right shrink-0">
                <div className="inline-block p-2 border-2 border-emerald-800/40 rounded-lg bg-emerald-50/50 mb-1 text-center">
                  <span className="text-2xs font-bold text-emerald-900 uppercase tracking-wider block">Legal Metrology Dept</span>
                  <span className="text-2xs text-emerald-700 block font-mono">SEAL &amp; STAMP</span>
                </div>
                <div className="w-32 border-t border-gray-400 mt-3 pt-1 text-2xs text-gray-500 font-semibold text-center sm:text-right">
                  Authorized Signatory
                </div>
              </div>
            </div>

            {/* Legal Disclaimer Footer */}
            <div className="text-center text-2xs text-gray-400 mt-5 pt-3 border-t border-gray-200 leading-relaxed">
              This digital certificate is issued under the Legal Metrology Act, 2009 &amp; Legal Metrology (General) Rules, 2011.
              It serves as conclusive proof of stamping and calibration. Tampering with calibrated seals is punishable by law.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
