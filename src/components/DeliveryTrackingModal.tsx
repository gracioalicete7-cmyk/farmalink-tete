import React from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Package,
  Bike,
  ShieldCheck,
  Building2,
  Navigation,
} from 'lucide-react';
import { Order, Pharmacy } from '../types';
import { StorageService } from '../lib/storage';

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  pharmacy?: Pharmacy | null;
}

export const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  pharmacy,
}) => {
  if (!isOpen || !order) return null;

  const currentStep = order.delivery_details?.tracking_step || (order.status === 'Concluído' ? 4 : order.status === 'Pronto para levantamento' ? 2 : order.status === 'Reservado' ? 3 : 1);
  const targetPharmacy = pharmacy || StorageService.getPharmacyById(order.pharmacy_id);

  const courierName = order.delivery_details?.courier_nome || 'Carlos Mutemba (Txopela Tete Express)';
  const courierPhone = order.delivery_details?.courier_telefone || '+258 84 888 1234';
  const courierVehicle = order.delivery_details?.courier_tipo === 'txopela' ? 'Txopela (Triciclo Motorizado)' : 'Moto-Estafeta Rápido';
  const courierPlate = order.delivery_details?.courier_matricula || 'TT-842-MC';

  const steps = [
    {
      step: 1,
      title: 'Pedido Confirmado',
      desc: 'A farmácia confirmou o pedido e a disponibilidade do medicamento.',
      time: 'Há 45 min',
      icon: CheckCircle2,
    },
    {
      step: 2,
      title: 'Medicamento Embalado',
      desc: 'Produto separado, verificado pelo farmacêutico e embalado com selo de segurança.',
      time: 'Há 25 min',
      icon: Package,
    },
    {
      step: 3,
      title: 'A Caminho com o Estafeta',
      desc: `O estafeta ${courierName.split(' ')[0]} já recolheu o pedido e está em trânsito para o seu bairro.`,
      time: 'Em curso (ETA: ~15-20 min)',
      icon: Bike,
    },
    {
      step: 4,
      title: 'Entregue ao Utente',
      desc: 'Entrega concluída com sucesso e confirmação de recepção no destino.',
      time: currentStep === 4 ? 'Concluído' : 'Pendente',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Truck className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Rastreio em Tempo Real
              </span>
              <h3 className="text-xl font-black mt-1">Entrega FarmaLink Express</h3>
            </div>
          </div>
          <p className="text-emerald-100 text-xs mt-1">
            Acompanhe o percurso do seu medicamento na Cidade de Tete
          </p>
        </div>

        {/* Status Tracker */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Card Resumo do Destino */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  Medicamento & Farmácia
                </span>
                <h4 className="text-sm font-bold text-slate-900">{order.medicine_nome}</h4>
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {order.pharmacy_nome}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Taxa de Entrega</span>
                <p className="text-sm font-black text-emerald-800">
                  {order.delivery_details?.taxa_entrega || 100} MZN
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200/70 flex items-start gap-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Destino da Entrega:</span>{' '}
                <span>
                  {order.delivery_details?.bairro_entrega || 'Bairro em Tete'}
                  {order.delivery_details?.endereco_detalhado ? `, ${order.delivery_details.endereco_detalhado}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Dados do Estafeta / Txopela */}
          {currentStep >= 2 && (
            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  🛵
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-teal-800 tracking-wide">
                    Estafeta Designado
                  </span>
                  <h5 className="text-sm font-bold text-slate-900">{courierName}</h5>
                  <p className="text-xs text-slate-500">{courierVehicle} • Matrícula: {courierPlate}</p>
                </div>
              </div>
              <a
                href={`tel:${courierPhone}`}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Ligar</span>
              </a>
            </div>
          )}

          {/* Timeline de 4 Passos */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Etapas da Entrega
            </h4>
            <div className="space-y-5 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {steps.map((s) => {
                const isCompleted = currentStep >= s.step;
                const isCurrent = currentStep === s.step;
                const IconComponent = s.icon;

                return (
                  <div key={s.step} className="flex items-start gap-4 relative">
                    {/* Step Circle */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Step Info */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h5
                          className={`text-sm font-bold ${
                            isCompleted ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {s.title}
                        </h5>
                        <span
                          className={`text-[11px] font-semibold ${
                            isCurrent ? 'text-emerald-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {s.time}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Entrega Segura com Protocolo Farmacêutico
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
