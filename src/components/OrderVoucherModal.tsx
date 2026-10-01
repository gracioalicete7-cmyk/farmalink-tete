import React, { useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  MapPin,
  Building2,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  CreditCard,
  Truck,
} from 'lucide-react';
import { Order, Pharmacy } from '../types';
import { StorageService } from '../lib/storage';

interface OrderVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  pharmacy?: Pharmacy | null;
}

export const OrderVoucherModal: React.FC<OrderVoucherModalProps> = ({
  isOpen,
  onClose,
  order,
  pharmacy,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const reservationCode = order.reservation_code || `FLT-${order.id.replace(/[^0-9]/g, '').slice(-4) || '8942'}`;
  const targetPharmacy = pharmacy || StorageService.getPharmacyById(order.pharmacy_id);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `*FarmaLink Tete - Guia de Reserva / Levantamento*%0A%0A*Código:* ${reservationCode}%0A*Farmácia:* ${order.pharmacy_nome}%0A*Medicamento:* ${order.medicine_nome}%0A*Quantidade:* ${order.quantidade}%0A*Total:* ${order.preco_total ? `${order.preco_total} MZN` : 'A confirmar'}%0A*Utente:* ${order.user_nome} (${order.user_telefone})%0A*Estado:* ${order.status}%0A%0AApresente este código no balcão da farmácia em Tete.`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Container Principal */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Top Control Bar (não imprime) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Guia Oficial de Reserva FarmaLink</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Imprimir ou Guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Partilhar no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recibo Imprimível */}
        <div ref={printableRef} className="p-6 sm:p-8 bg-white text-slate-900 print:p-0">
          {/* Header do Recibo */}
          <div className="border-b-2 border-dashed border-slate-300 pb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
              <span>🇲🇿 Província de Tete • Moçambique</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">FarmaLink Tete</h2>
            <p className="text-xs text-slate-500 font-medium">Plataforma Digital de Acesso a Medicamentos</p>

            {/* Código de Reserva com QR Code Visual */}
            <div className="mt-5 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[11px] font-extrabold uppercase text-emerald-800 tracking-wider">
                  Código de Levantamento / Pedido
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-950 font-mono tracking-wider">
                    {reservationCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-emerald-200/80 hover:bg-emerald-300 text-emerald-900 transition-colors print:hidden cursor-pointer"
                    title="Copiar código"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Apresente este código no balcão para levantar o medicamento
                </p>
              </div>

              {/* QR Code Simulado / Renderizado em SVG */}
              <div className="bg-white p-2.5 rounded-xl border border-emerald-300 shadow-2xs shrink-0 flex flex-col items-center">
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Frame */}
                  <rect x="5" y="5" width="30" height="30" rx="4" fill="#047857" />
                  <rect x="10" y="10" width="20" height="20" rx="2" fill="white" />
                  <rect x="15" y="15" width="10" height="10" rx="1" fill="#047857" />

                  <rect x="65" y="5" width="30" height="30" rx="4" fill="#047857" />
                  <rect x="70" y="10" width="20" height="20" rx="2" fill="white" />
                  <rect x="75" y="15" width="10" height="10" rx="1" fill="#047857" />

                  <rect x="5" y="65" width="30" height="30" rx="4" fill="#047857" />
                  <rect x="10" y="70" width="20" height="20" rx="2" fill="white" />
                  <rect x="15" y="75" width="10" height="10" rx="1" fill="#047857" />

                  {/* Inner Data Patterns */}
                  <rect x="42" y="10" width="16" height="6" rx="1" fill="#047857" />
                  <rect x="42" y="22" width="16" height="6" rx="1" fill="#047857" />
                  <rect x="10" y="42" width="6" height="16" rx="1" fill="#047857" />
                  <rect x="22" y="42" width="10" height="6" rx="1" fill="#047857" />
                  <rect x="42" y="42" width="16" height="16" rx="2" fill="#065f46" />
                  <rect x="65" y="42" width="25" height="6" rx="1" fill="#047857" />
                  <rect x="75" y="52" width="15" height="10" rx="1" fill="#047857" />
                  <rect x="42" y="68" width="10" height="22" rx="1" fill="#047857" />
                  <rect x="58" y="72" width="32" height="6" rx="1" fill="#047857" />
                  <rect x="68" y="84" width="22" height="6" rx="1" fill="#047857" />
                </svg>
                <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Verificação Digital</span>
              </div>
            </div>
          </div>

          {/* Dados em Duas Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs">
            {/* Utente */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="font-extrabold uppercase text-slate-500 text-[10px] tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-700" />
                Dados do Utente
              </span>
              <p className="font-bold text-slate-900 text-sm">{order.user_nome}</p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                {order.user_telefone}
              </p>
              {order.user_email && <p className="text-slate-500 truncate">{order.user_email}</p>}
            </div>

            {/* Farmácia */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="font-extrabold uppercase text-slate-500 text-[10px] tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                Farmácia Responsável
              </span>
              <p className="font-bold text-slate-900 text-sm">{order.pharmacy_nome}</p>
              <p className="text-slate-600 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{targetPharmacy ? `${targetPharmacy.endereco}, ${targetPharmacy.bairro}` : 'Cidade de Tete'}</span>
              </p>
              {targetPharmacy?.director_name && (
                <p className="text-[11px] text-emerald-800 font-semibold">
                  Dir. Técnico: {targetPharmacy.director_name}
                </p>
              )}
            </div>
          </div>

          {/* Detalhes do Medicamento */}
          <div className="py-5 border-b border-slate-200">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-3">
              Item Reservado / Adquirido
            </h4>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div>
                <p className="font-bold text-slate-900 text-sm">{order.medicine_nome}</p>
                {order.medicine_concentracao && (
                  <p className="text-xs text-slate-500">{order.medicine_concentracao}</p>
                )}
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Qtd: {order.quantidade} {order.quantidade > 1 ? 'embalagens' : 'embalagem'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Valor a Liquidar</p>
                <p className="text-sm font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg">
                  No balcão da farmácia
                </p>
              </div>
            </div>
          </div>

          {/* Modalidade de Levantamento / Entrega & Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-5 border-b border-slate-200 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Modalidade:</span>
                <p className="text-slate-600">
                  {order.delivery_type === 'delivery'
                    ? `Entrega por Estafeta (${order.delivery_details?.bairro_entrega || 'Bairro em Tete'})`
                    : 'Levantamento no Balcão da Farmácia'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Pagamento:</span>
                <p className="text-slate-600 uppercase font-semibold">
                  {order.payment_method === 'mpesa'
                    ? 'M-Pesa (Pago / Verificado)'
                    : order.payment_method === 'emola'
                    ? 'e-Mola (Pago / Verificado)'
                    : 'No Balcão (Dinheiro / POS)'}
                </p>
              </div>
            </div>
          </div>

          {/* Instruções e Validade */}
          <div className="pt-5 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-start gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Validade da Reserva:</strong> Esta reserva é válida por 48 horas úteis após a confirmação pela farmácia. Se o medicamento exigir receita médica, deve apresentá-la obrigatoriamente no momento do levantamento.
              </p>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-2 text-[10px]">
              <span>Emitido em: {new Date(order.created_at).toLocaleString('pt-MZ')}</span>
              <span>FarmaLink Tete • V1.0 Moçambique</span>
            </div>
          </div>
        </div>

        {/* Footer Actions (não imprime) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Código Copiado!' : 'Copiar Código'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Recibo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
