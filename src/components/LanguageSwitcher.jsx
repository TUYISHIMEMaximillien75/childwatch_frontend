/**
 * LanguageSwitcher — dropdown with flags, RTL-aware
 * Can be placed in any sidebar footer or header.
 */
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English",     native: "English",    flag: "🇬🇧", dir: "ltr" },
  { code: "rw", name: "Kinyarwanda", native: "Kinyarwanda", flag: "🇷🇼", dir: "ltr" },
  { code: "fr", name: "French",      native: "Français",   flag: "🇫🇷", dir: "ltr" },
  { code: "ar", name: "Arabic",      native: "العربية",    flag: "🇸🇦", dir: "rtl" },
];

/**
 * @param {"light"|"dark"} mode  – "dark" for sidebar (white text), "light" for header
 * @param {"up"|"down"}    opens – which direction the dropdown opens
 */
export default function LanguageSwitcher({ mode = "light", opens = "down", className = "" }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === i18n.language?.slice(0, 2)) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = code => {
    i18n.changeLanguage(code);
    const lang = LANGUAGES.find(l => l.code === code);
    // Apply RTL if Arabic
    document.documentElement.setAttribute("dir", lang?.dir || "ltr");
    document.documentElement.setAttribute("lang", code);
    setOpen(false);
  };

  // Text colours based on mode
  const triggerClass = mode === "dark"
    ? "text-slate-300 hover:text-white hover:bg-white/10"
    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

  const menuClass = opens === "up"
    ? "bottom-full mb-2"
    : "top-full mt-2";

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl w-full text-left text-[12px] font-semibold transition-all ${triggerClass}`}
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">{current.flag} {current.native}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute ${menuClass} left-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-[9999] overflow-hidden py-1`}>
          <p className="px-3 pt-2 pb-1 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t("language.selectLanguage", "Select Language")}
          </p>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-[18px] leading-none">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 dark:text-slate-200 truncate">{lang.native}</p>
                <p className="text-[10px] text-slate-400 truncate">{lang.name}</p>
              </div>
              {current.code === lang.code && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

