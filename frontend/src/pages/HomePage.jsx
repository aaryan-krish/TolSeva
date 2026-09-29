import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import StatCounter from '../components/home/StatCounter.jsx'
import InfoCards from '../components/home/InfoCards.jsx'
import { ArrowRight, Mic, ShieldCheck, FileCheck, Search } from 'lucide-react'

export default function HomePage() {
  const { auth } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [homeTrackingId, setHomeTrackingId] = useState('')

  const dashboardLink = auth?.role === 'vendor' ? '/vendor'
    : auth?.role === 'inspector' ? '/inspector'
    : auth?.role === 'admin' ? '/admin' : null

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-orange-700 via-orange-600 to-amber-700 text-white overflow-hidden shadow-inner">
        <div className="absolute top-0 left-0 right-0 h-1 tricolor-strip" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl">
            {/* National Tricolor Badge */}
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-white" />
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-white text-xs font-semibold tracking-wide uppercase">{t('govInitiative')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-sm">
              {t('heroTitle')}{' '}
              <span className="inline-block mt-1 sm:mt-0 bg-white text-emerald-800 px-3.5 py-0.5 rounded-lg shadow-md font-black border border-emerald-100">
                {t('heroHighlight')}
              </span>
            </h1>
            <p className="text-orange-100 text-lg md:text-xl mt-5 leading-relaxed max-w-2xl font-normal">
              {t('heroSub')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {dashboardLink ? (
                <button onClick={() => navigate(dashboardLink)} className="btn-secondary flex items-center gap-2 text-base px-6 py-3">
                  {t('goToDashboard')} <ArrowRight size={18} />
                </button>
              ) : null}
              <button
                onClick={() => navigate('/track-complaint')}
                className="bg-white text-orange-800 hover:bg-orange-50 border border-orange-200 flex items-center gap-2 text-base px-6 py-3 font-bold rounded-xl shadow-md transition-all hover:shadow-lg"
              >
                <Search size={18} className="text-orange-600" /> Track Complaint Status
              </button>
              <a href="#about" className="btn-outline border-white text-white hover:bg-white hover:text-orange-700 flex items-center gap-2 text-base px-6 py-3 font-semibold transition-colors">
                {t('learnMore')} <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
        {/* Subtle decorative elements */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </section>

      <StatCounter />

      {/* Citizen Grievance & Tracking Quick Section */}
      <section className="py-12 bg-gradient-to-b from-orange-50/50 to-white border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-3xl border-2 border-orange-200 shadow-xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 tricolor-strip" />
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  <ShieldCheck size={14} className="text-orange-600" /> Citizen Protection &amp; Grievance Cell
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  Track Your Complaint Status
                </h2>
                <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                  Have you filed a complaint regarding an inaccurate weighing scale, faulty meter, or tampering? Enter your Complaint Tracking ID below to see live inspection status, assigned inspector, and departmental resolution.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (homeTrackingId.trim()) {
                      navigate(`/track-complaint/${encodeURIComponent(homeTrackingId.trim())}`)
                    }
                  }}
                  className="mt-6 flex flex-col sm:flex-row gap-3"
                >
                  <div className="relative flex-1">
                    <Search size={18} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={homeTrackingId}
                      onChange={(e) => setHomeTrackingId(e.target.value)}
                      placeholder="Enter Tracking ID (e.g. cmp-174...)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl whitespace-nowrap shadow-md"
                  >
                    <Search size={16} /> Track Status <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-2xl shadow-inner border border-emerald-800/40">
                <h3 className="font-bold text-amber-400 text-base flex items-center gap-2">
                  <FileCheck size={20} /> Citizen Redressal SLA
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Under the Legal Metrology Act, every complaint lodged with authentic mobile OTP verification is audited by a designated district officer within 48 hours.
                </p>
                <div className="mt-5 space-y-3 pt-4 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Average Grievance Action:</span>
                    <strong className="text-white">Within 48–72 Hours</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>National Consumer Toll-Free:</span>
                    <strong className="text-amber-300 font-mono">1800-11-4000</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">Our Core Offerings</span>
            <h2 className="text-3xl font-extrabold text-gray-900">{t('ourServices')}</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{t('servicesSub')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileCheck, title: t('instrumentReg'), desc: t('instrumentRegDesc'), iconBg: 'bg-orange-100 text-orange-600', borderHover: 'hover:border-orange-500' },
              { icon: ShieldCheck, title: t('digitalVerify'), desc: t('digitalVerifyDesc'), iconBg: 'bg-emerald-100 text-emerald-700', borderHover: 'hover:border-emerald-500' },
              { icon: Mic, title: t('voiceAssist'), desc: t('voiceAssistDesc'), iconBg: 'bg-amber-100 text-amber-700', borderHover: 'hover:border-amber-500' }
            ].map(({ icon: Icon, title, desc, iconBg, borderHover }) => (
              <div key={title} className={`text-center p-8 rounded-xl border border-gray-200 bg-white hover:shadow-xl transition-all ${borderHover}`}>
                <div className={`${iconBg} w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-sm`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InfoCards />

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-emerald-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-extrabold mb-3 text-white">{t('contactDept')}</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">Reach out for official assistance, grievances, or legal metrology inquiries</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { label: t('tollFree'), value: '1800-11-4000', icon: '📞' },
              { label: t('email'), value: 'lmd.support@consumeraffairs.gov.in', icon: '📧' },
              { label: t('officeHours'), value: 'Mon–Fri, 10:00 AM – 5:00 PM', icon: '🕙' }
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-5 sm:p-6 hover:bg-white/15 transition-colors overflow-hidden">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">{item.label}</p>
                <p className="text-white font-medium mt-1 text-xs sm:text-sm md:text-base break-all" title={item.value}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      </section>
    </div>
  )
}