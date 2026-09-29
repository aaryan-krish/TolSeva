import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import LanguageSelector from '../common/LanguageSelector'

export default function GovHeader() {
  const { t } = useLanguage()
  const { auth } = useAuth()

  const homeLink = auth?.role === 'vendor' ? '/vendor'
    : auth?.role === 'inspector' ? '/inspector'
    : auth?.role === 'admin' ? '/admin' : '/'

  return (
    <>
      <div className="tricolor-strip" />
      <header className="bg-gradient-to-r from-[#162F6A] via-[#1a397e] to-[#214AAB] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Link
              to={homeLink}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0 p-1 shadow-md hover:scale-105 transition-transform"
              title="TolSeva Home / Dashboard"
            >
              <img src="/logo.png" alt="TolSeva Logo" className="w-full h-full object-contain" />
            </Link>
            <div>
              <p className="text-[#A3BBF3] text-[11px] sm:text-xs font-semibold uppercase tracking-widest">{t('ministry')}</p>
              <Link to={homeLink} className="hover:underline">
                <h1 className="text-lg sm:text-2xl font-bold leading-tight mt-0.5 text-white">
                  {t('portalTitle')}
                </h1>
              </Link>
              <p className="text-[#D2DFFF] text-xs sm:text-sm mt-0.5">{t('portalSubtitle')}</p>
            </div>
          </div>

          {/* Top Right: Helpline and Language Changing Option */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[#A3BBF3] text-xs font-semibold">{t('helpline')}</span>
              <span className="text-white font-bold text-sm">1800-11-4000</span>
              <span className="text-[#D2DFFF] text-xs">{t('officeHours')}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-medium text-[#A3BBF3] uppercase tracking-wider hidden sm:block">{t('selectLanguage')}</span>
              <LanguageSelector variant="header" />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
