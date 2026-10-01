import React, { useState } from 'react';
import { X, Bell, CheckCircle2, ShieldAlert, Sparkles, Building2, Phone, Mail } from 'lucide-react';
import { Medicine, Pharmacy, UserProfile } from '../types';
import { StorageService } from '../lib/storage';

interface StockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  pharmacy?: Pharmacy | null;
  currentUser: UserProfile;
  onAlertCreated?: () => void;
}

export const StockAlertModal: React.FC<StockAlertModalProps> = ({
  isOpen,
  onClose,
  medicine,
  pharmacy,
  currentUser,
  onAlertCreated,
}) => {
  const [targetScope, setTargetScope] = useState<'any' | 'specific'>(pharmacy ? 'specific' : 'any');
  const [telefone, setTelefone] = useState(currentUser.telefone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !medicine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      StorageService.createStockAlert({
        user_id: currentUser.user_id,
        user_nome: currentUser.nome,
        user_telefone: telefone,
        user_email: email,
        medicine_id: medicine.id,
        medicine_nome: `${medicine.nome} (${medicine.concentracao})`,
        pharmacy_id: targetScope === 'specific' && pharmacy ? pharmacy.id : undefined,
        pharmacy_nome: targetScope === 'specific' && pharmacy ? pharmacy.nome : 'Qualquer farmácia em Tete',
      });

      setSavedSuccess(true);
      if (onAlertCreated) onAlertCreated();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 2200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-500 to-orange-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                Alerta de Reposição
              </span>
              <h3 className="text-xl font-black mt-1">Avisar Quando Disponível</h3>
            </div>
          </div>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Seja notificado assim que o stock for reposto nas farmácias da Província de Tete.
          </p>
        </div>

        {/* Content */}
        {savedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Alerta Criado com Sucesso!</h4>
            <p className="text-sm text-slate-600">
              Assim que <strong className="text-emerald-700">{medicine.nome}</strong> der entrada de stock, receberá uma notificação no FarmaLink e no seu telemóvel.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Medicamento Card */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{medicine.nome}</h4>
                <p className="text-xs text-slate-600">{medicine.principio_ativo} • {medicine.concentracao}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {medicine.forma_farmaceutica}
                </span>
              </div>
            </div>

            {/* Opção de Farmácia */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Onde deseja ser avisado?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTargetScope('any')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetScope === 'any'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <span className="text-xs font-bold">🗺️ Qualquer Farmácia em Tete</span>
                  <span className="text-[11px] text-slate-500 mt-1">Primeira farmácia que repuser</span>
                </button>

                {pharmacy && (
                  <button
                    type="button"
                    onClick={() => setTargetScope('specific')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      targetScope === 'specific'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold truncate">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{pharmacy.nome}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">{pharmacy.bairro}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Contactos */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contacto Telefónico (SMS / WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email para Notificação (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-4 h-4" />
                <span>Ativar Alerta</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
