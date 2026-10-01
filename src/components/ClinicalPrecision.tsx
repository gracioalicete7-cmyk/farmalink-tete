import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  Lock,
  Loader2,
  ChevronRight,
  Search,
  X,
  Phone,
  Pill,
} from 'lucide-react';

/* ==========================================================================
   1. CLINICAL BUTTON COMPONENT (Android Touch-Optimized >= 48px)
   ========================================================================== */
export type ButtonVariant = 'primary' | 'secondary' | 'dps' | 'danger' | 'outline' | 'ghost' | 'amber';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'fab';

export interface ClinicalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  badge?: string | number;
  subtext?: string;
}

export const ClinicalButton: React.FC<ClinicalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  badge,
  subtext,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles: Accessible touch targets, prevent text selection on touch, tactile active shrink
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight select-none touch-manipulation transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100 rounded-2xl';

  // Size styling: Guarantee Android minimum touch target (44px - 48px)
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[40px] px-3.5 py-2 text-xs gap-1.5',
    md: 'min-h-[48px] px-5 py-3 text-sm gap-2',
    lg: 'min-h-[54px] px-6 py-3.5 text-base gap-2.5',
    fab: 'min-h-[56px] min-w-[56px] p-4 rounded-full shadow-lg text-sm gap-2',
  };

  // Semantic clinical variants
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md focus-visible:ring-emerald-500 border border-emerald-600/30',
    secondary:
      'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs hover:shadow-xs focus-visible:ring-emerald-500',
    dps:
      'bg-blue-700 hover:bg-blue-800 text-white shadow-xs hover:shadow-md focus-visible:ring-blue-500 border border-blue-800/30',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md focus-visible:ring-rose-500 border border-rose-600/30',
    amber:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-md focus-visible:ring-amber-500 border border-amber-600/30',
    outline:
      'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400 focus-visible:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus-visible:ring-slate-300',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>A processar...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <div className="flex flex-col items-center leading-tight">
            <span>{children}</span>
            {subtext && <span className="text-[10px] opacity-85 font-normal">{subtext}</span>}
          </div>
          {badge !== undefined && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-current border border-white/30">
              {badge}
            </span>
          )}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

/* ==========================================================================
   2. AVAILABILITY & SANITARY STATUS BADGES
   ========================================================================== */
export type AvailabilityStatusType =
  | 'available'
  | 'low_stock'
  | 'out_of_stock'
  | 'duty_24h'
  | 'duty_open'
  | 'duty_closed'
  | 'prescription_req'
  | 'otc_free'
  | 'dps_approved'
  | 'special_control';

export interface AvailabilityBadgeProps {
  status: AvailabilityStatusType;
  labelOverride?: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulsing?: boolean;
  className?: string;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  status,
  labelOverride,
  label,
  size = 'sm',
  showIcon = true,
  pulsing,
  className = '',
}) => {
  const configs: Record<
    AvailabilityStatusType,
    {
      label: string;
      bg: string;
      text: string;
      border: string;
      icon: React.ElementType;
      pulseDot?: boolean;
    }
  > = {
    available: {
      label: 'Disponível',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      icon: CheckCircle2,
    },
    low_stock: {
      label: 'Baixo Stock (< 5 un.)',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: AlertTriangle,
    },
    out_of_stock: {
      label: 'Esgotado',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      border: 'border-rose-300',
      icon: XCircle,
    },
    duty_24h: {
      label: 'Plantão 24h Activo',
      bg: 'bg-teal-900',
      text: 'text-teal-100',
      border: 'border-teal-700',
      icon: Clock,
      pulseDot: true,
    },
    duty_open: {
      label: 'Aberta',
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-400',
      icon: CheckCircle2,
      pulseDot: true,
    },
    duty_closed: {
      label: 'Fechada',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: Clock,
    },
    prescription_req: {
      label: 'Receita Médica Obrigatória (R.M.)',
      bg: 'bg-amber-100',
      text: 'text-amber-950',
      border: 'border-amber-400',
      icon: Lock,
    },
    otc_free: {
      label: 'Venda Livre (MIP)',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      icon: Sparkles,
    },
    dps_approved: {
      label: 'Homologado DPS Tete',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-300',
      icon: ShieldCheck,
    },
    special_control: {
      label: 'Controlo Especial / Psicotrópico',
      bg: 'bg-purple-100',
      text: 'text-purple-950',
      border: 'border-purple-300',
      icon: AlertOctagon,
    },
  };

  const current = configs[status] || configs.available;
  const IconComponent = current.icon;
  const displayText = labelOverride || label || current.label;

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 font-bold',
    lg: 'text-sm sm:text-base px-4 py-2 gap-2.5 font-extrabold',
  };

  const isPulsing = pulsing !== undefined ? pulsing : current.pulseDot;

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border shadow-2xs whitespace-nowrap ${current.bg} ${current.text} ${current.border} ${sizeStyles[size]} ${className}`}
    >
      {isPulsing && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
        </span>
      )}
      {showIcon && !isPulsing && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{displayText}</span>
    </span>
  );
};

/* ==========================================================================
   3. CLINICAL TYPOGRAPHY & DATA FORMATTERS
   ========================================================================== */

/** Price formatted in Mozambican Meticais with clear visual hierarchy */
export interface PriceDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  periodText?: string;
  showCurrencyCode?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  size = 'md',
  periodText,
  showCurrencyCode = true,
  className = '',
}) => {
  const formatted = amount.toFixed(2).replace('.', ',');
  const [integerPart, decimalPart] = formatted.split(',');

  const sizeStyles = {
    sm: { integer: 'text-base font-black', decimal: 'text-xs font-bold', code: 'text-xs' },
    md: { integer: 'text-xl font-black', decimal: 'text-xs font-bold', code: 'text-xs font-bold' },
    lg: { integer: 'text-2xl sm:text-3xl font-black', decimal: 'text-sm font-bold', code: 'text-sm font-extrabold' },
    xl: { integer: 'text-3xl sm:text-4xl font-black', decimal: 'text-base font-bold', code: 'text-base font-black' },
  };

  const style = sizeStyles[size];

  return (
    <div className={`inline-flex items-baseline gap-1 text-emerald-950 font-sans ${className}`}>
      <span className={style.integer}>{integerPart}</span>
      <span className={`text-emerald-800 ${style.decimal}`}>,{decimalPart}</span>
      {showCurrencyCode && <span className={`text-emerald-700 ml-0.5 tracking-tight ${style.code}`}>MZN</span>}
      {periodText && <span className="text-xs text-slate-500 font-normal ml-1">{periodText}</span>}
    </div>
  );
};

/** Pharmaceutical Dosage badge with high visual clarity */
export const DosageBadge: React.FC<{ dosage: string; form?: string; className?: string }> = ({
  dosage,
  form,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-tight ${className}`}
  >
    <Pill className="w-3.5 h-3.5 text-slate-500 shrink-0" />
    <span>{dosage}</span>
    {form && <span className="text-slate-400 font-sans font-normal text-[10px]">({form})</span>}
  </span>
);

/** Sanitary License or DPS Registration Tag */
export const SanitaryTag: React.FC<{ code: string; label?: string; className?: string }> = ({
  code,
  label = 'DPS Tete',
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-mono font-bold ${className}`}
  >
    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
    <span className="font-sans font-medium text-blue-700">{label}:</span>
    <span>{code}</span>
  </span>
);

/* ==========================================================================
   4. ANDROID TOUCH CARD & CONTAINERS
   ========================================================================== */
export interface AndroidCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outline' | 'clinical-dark';
  interactive?: boolean;
}

export const AndroidCard: React.FC<AndroidCardProps> = ({
  children,
  variant = 'flat',
  interactive = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    flat: 'bg-white border border-slate-200 shadow-xs',
    elevated: 'bg-white border border-slate-200/80 shadow-md',
    outline: 'bg-slate-50/70 border border-slate-300 shadow-2xs',
    'clinical-dark': 'bg-slate-900 border border-slate-800 text-white shadow-lg',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer active:scale-[0.99] hover:border-emerald-400 hover:shadow-md transition-all touch-manipulation'
    : '';

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 transition-all ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* ==========================================================================
   5. ANDROID QUICK ACTION CHIP
   ========================================================================== */
export interface QuickActionChipProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  color?: 'emerald' | 'blue' | 'amber' | 'slate' | 'purple' | 'rose';
}

export const QuickActionChip: React.FC<QuickActionChipProps> = ({
  label,
  icon,
  active = false,
  onClick,
  count,
  color = 'emerald',
}) => {
  const activeColorStyles = {
    emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold ring-2 ring-emerald-500/20',
    blue: 'bg-blue-700 text-white border-blue-700 shadow-xs font-bold ring-2 ring-blue-500/20',
    amber: 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold ring-2 ring-amber-500/20',
    slate: 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold ring-2 ring-slate-700/20',
    purple: 'bg-purple-700 text-white border-purple-700 shadow-xs font-bold ring-2 ring-purple-500/20',
    rose: 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold ring-2 ring-rose-500/20',
  };

  const inactiveStyles =
    'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 font-medium';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2 rounded-2xl border text-xs sm:text-sm inline-flex items-center gap-2 transition-all active:scale-95 touch-manipulation select-none shrink-0 ${
        active ? activeColorStyles[color] : inactiveStyles
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
