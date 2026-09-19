import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

export default function LanguageSelector({ variant = 'header' }) {
  const { language, changeLanguage, currentLangObj } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHeader = variant === 'header';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all border shadow-sm ${
          isHeader
            ? 'bg-saffron-500 hover:bg-saffron-500 text-white border-green-600/50 hover:border-green-500'
            : 'bg-gray-50 hover:bg-gray-100 text-saffron-600 border-gray-300'
        }`}
        title="Change language / भाषा बदलें"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Globe size={16} className={isHeader ? 'text-green-500' : 'text-saffron-500'} />
        <span className="font-bold">{currentLangObj.nativeName}</span>
        <span className={isHeader ? 'text-blue-200 text-xs hidden sm:inline' : 'text-gray-500 text-xs hidden sm:inline'}>
          ({currentLangObj.name})
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-60 sm:w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black/10 z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in duration-150">
          <div className="px-3.5 py-2 bg-saffron-600 text-white flex items-center justify-between">
            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Select Language / भाषा चुनें</span>
            <span className="text-[10px] bg-saffron-500 text-blue-200 px-1.5 py-0.5 rounded">10 Languages</span>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            {SUPPORTED_LANGUAGES.map(lang => {
              const active = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-saffron-50 text-saffron-600 font-bold border border-saffron-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-saffron-600'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{lang.nativeName}</span>
                    <span className="text-xs text-gray-500">{lang.name}</span>
                  </div>
                  {active && <Check size={16} className="text-saffron-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
