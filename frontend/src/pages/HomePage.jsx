import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import StatCounter from '../components/home/StatCounter.jsx'
import InfoCards from '../components/home/InfoCards.jsx'
import { ArrowRight, Mic, ShieldCheck, FileCheck } from 'lucide-react'

export default function HomePage() {
  const { auth } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const dashboardLink = auth?.role === 'vendor' ? '/vendor'
    : auth?.role === 'inspector' ? '/inspector'
    : auth?.role === 'admin' ? '/admin' : null

  return (
    <div>
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 tricolor-strip" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-3 h-3 rounded-full bg-saffron" />
              <span className="inline-block w-3 h-3 rounded-full bg-white" />
              <span className="inline-block w-3 h-3 rounded-full bg-indiaGreen" />
              <span className="text-gold-400 text-sm font-semibold ml-1 tracking-wide uppercase">{t('govInitiative')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              {t('heroTitle')}{' '}
              <span className="text-gold-400">{t('heroHighlight')}</span>
            </h1>
            <p className="text-blue-200 text-lg mt-5 leading-relaxed">
              {t('heroSub')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {dashboardLink ? (
                <button onClick={() => navigate(dashboardLink)} className="btn-secondary flex items-center gap-2">
                  {t('goToDashboard')} <ArrowRight size={18} />
                </button>
              ) : null}
              <a href="#about" className="btn-outline border-white text-white hover:bg-white hover:text-navy-900 flex items-center gap-2">
                {t('learnMore')} <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -right-5 top-40 w-48 h-48 rounded-full bg-gold-500/10" />
      </section>

      <StatCounter />

      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-navy-900">{t('ourServices')}</h2>
            <p className="text-gray-600 mt-2">{t('servicesSub')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileCheck, title: t('instrumentReg'), desc: t('instrumentRegDesc'), color: 'bg-navy-900' },
              { icon: ShieldCheck, title: t('digitalVerify'), desc: t('digitalVerifyDesc'), color: 'bg-indiaGreen' },
              { icon: Mic, title: t('voiceAssist'), desc: t('voiceAssistDesc'), color: 'bg-gold-500' }
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="text-center p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className={color + " w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"}>
                  <Icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InfoCards />

      <section id="contact" className="py-16 bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">{t('contactDept')}</h2>
          <p className="text-blue-200 mb-8">Reach out for assistance, complaints, or inquiries</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { label: t('tollFree'), value: '1800-11-4000', icon: '📞' },
              { label: t('email'), value: 'lmd.support@consumeraffairs.gov.in', icon: '📧' },
              { label: t('officeHours'), value: 'Mon–Fri, 10:00 AM – 5:00 PM', icon: '🕙' }
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-6">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-gold-400 text-sm font-semibold">{item.label}</p>
                <p className="text-white font-medium mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}