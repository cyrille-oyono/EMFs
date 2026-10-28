import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'segmented';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#1A060A] border border-slate-200 dark:border-[#4A0E17] ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            theme === 'light'
              ? 'bg-white text-[#4A0E17] shadow-sm'
              : 'text-slate-600 dark:text-rose-200/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Clair</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#4A0E17] text-[#C99B2E] shadow-sm border border-[#C99B2E]/40'
              : 'text-slate-600 dark:text-rose-200/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-[#C99B2E]" />
          <span>Sombre</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-[#2B070E] text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-rose-200/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer bg-white/10 dark:bg-[#1A060A] text-white hover:bg-white/20 dark:hover:bg-[#2B070E] border border-white/20 dark:border-[#C99B2E]/40 shadow-xs ${className}`}
        title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-300 animate-in spin-in-180 duration-300" />
            <span>Mode Clair</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-[#C99B2E] animate-in spin-in-180 duration-300" />
            <span>Mode Sombre</span>
          </>
        )}
      </button>
    );
  }

  // Default: 'icon'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition cursor-pointer text-white hover:bg-white/10 dark:hover:bg-[#2B070E] border border-transparent hover:border-[#C99B2E]/30 relative group ${className}`}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
      ) : (
        <Moon className="w-4 h-4 text-amber-200 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      )}
      <span className="sr-only">{isDark ? 'Mode clair' : 'Mode sombre'}</span>
    </button>
  );
};
