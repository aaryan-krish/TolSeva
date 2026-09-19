import { useLanguage } from '../../context/LanguageContext'
import LanguageSelector from '../common/LanguageSelector'

export default function GovHeader() {
  const { t } = useLanguage()

  return (
    <>
      <div className="tricolor-strip" />
      <header className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0 p-1 shadow-md">
              <img src="/logo.png" alt="TolSeva Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-green-500 text-[11px] sm:text-xs font-semibold uppercase tracking-widest">{t('ministry')}</p>
              <h1 className="text-lg sm:text-2xl font-bold leading-tight mt-0.5">
                {t('portalTitle')}
              </h1>
              <p className="text-blue-200 text-xs sm:text-sm mt-0.5">{t('portalSubtitle')}</p>
            </div>
          </div>

          {/* Top Right: Helpline and Language Changing Option */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-green-500 text-xs font-semibold">{t('helpline')}</span>
              <span className="text-white font-bold text-sm">1800-11-4000</span>
              <span className="text-blue-200 text-xs">{t('officeHours')}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-medium text-green-500 uppercase tracking-wider hidden sm:block">{t('selectLanguage')}</span>
              <LanguageSelector variant="header" />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
