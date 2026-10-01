import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface DisclaimerProps {
  compact?: boolean;
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerProps> = ({ compact = false, className = '' }) => {
  if (compact) {
    return (
      <div
        id="disclaimer-compact-banner"
        className={`bg-amber-50/90 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2 ${className}`}
      >
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <span className="font-semibold">Aviso Importante:</span> A disponibilidade no FarmaLink Tete
          não constitui recomendação médica. Os pedidos representam solicitação de disponibilidade e não venda automática.
        </div>
      </div>
    );
  }

  return (
    <div
      id="disclaimer-full-banner"
      className={`bg-slate-50 border border-emerald-200/80 rounded-xl p-4 shadow-sm text-slate-700 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-lg shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm leading-relaxed space-y-1">
          <p className="font-bold text-slate-900 text-sm">
            Informação Legal & Responsabilidade de Saúde
          </p>
          <p className="text-slate-600">
            A disponibilidade de um medicamento no <span className="font-semibold text-emerald-800">FarmaLink Tete</span>{' '}
            não constitui recomendação ou prescrição médica. Para orientação sobre o diagnóstico e uso racional de
            medicamentos, consulte sempre um médico ou farmacêutico habilitado.
          </p>
          <p className="text-slate-500 text-xs italic">
            * O envio de um pedido através desta plataforma representa uma reserva/consulta prévia de disponibilidade e não constitui confirmação automática de venda.
          </p>
        </div>
      </div>
    </div>
  );
};
