import React from 'react';
import { X, ArrowLeft, Home } from 'lucide-react';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  exitLabel?: string;
  canGoBack?: boolean;
  historyDepth?: number;
  rightAction?: React.ReactNode;
  className?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Página anterior',
  exitLabel = 'Sair',
  canGoBack = true,
  historyDepth = 0,
  rightAction,
  className = '',
}) => {
  return (
    <div
      id="screen-navigation-header-bar"
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 mb-4 transition-all ${className}`}
    >
      {/* Back and Exit Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="screen-exit-x-btn"
          onClick={onBack}
          className="group inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 font-bold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          title="Sair desta tela e voltar à página anterior"
          aria-label="Sair e voltar à página anterior"
        >
          <div className="p-0.5 rounded-full bg-slate-200 group-hover:bg-rose-200 dark:bg-slate-700 dark:group-hover:bg-rose-900 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-700 group-hover:text-rose-700 dark:text-slate-200 dark:group-hover:text-rose-300 stroke-[2.5]" />
          </div>
          <span className="font-extrabold">{exitLabel}</span>
        </button>

        <button
          type="button"
          id="screen-back-step-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Voltar um passo na navegação"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{backLabel}</span>
          {historyDepth > 0 && (
            <span className="hidden xs:inline text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold">
              {historyDepth === 1 ? '1 passo até Início' : `${historyDepth} passos`}
            </span>
          )}
        </button>
      </div>

      {/* Screen Title Center / Text */}
      {title && (
        <div className="hidden md:flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {subtitle}
            </span>
          )}
        </div>
      )}

      {/* Right Action slot or Home shortcut */}
      <div className="flex items-center gap-2">
        {rightAction}
      </div>
    </div>
  );
};
