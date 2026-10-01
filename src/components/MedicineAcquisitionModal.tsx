import React, { useState } from 'react';
import { Medicine, Pharmacy, PharmacyMedicine, UserProfile, Order } from '../types';
import { FarmaLinkDB, StorageService } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import { ClinicalButton } from './ClinicalPrecision';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  Sparkles,
  Store,
  Pill,
  Star,
  Calendar,
  CreditCard,
  Bell,
  ShieldCheck,
  Award,
  Clock,
  ThumbsUp,
} from 'lucide-react';

interface MedicineAcquisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine;
  pharmacy: Pharmacy;
  stock?: PharmacyMedicine | null;
  currentUser: UserProfile;
  onSuccess?: (order: Order) => void;
}

export const MedicineAcquisitionModal: React.FC<MedicineAcquisitionModalProps> = ({
  isOpen,
  onClose,
  medicine,
  pharmacy,
  stock,
  currentUser,
  onSuccess,
}) => {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [precoPago, setPrecoPago] = useState<string>(stock?.preco ? stock.preco.toString() : '');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_pickup' | 'mpesa' | 'emola' | 'pos_card'>('cash_on_pickup');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('Medicamento encontrado rapidamente com preço justo.');
  const [createReminder, setCreateReminder] = useState<boolean>(true);
  const [frequenciaHoras, setFrequenciaHoras] = useState<number>(8);
  const [diasTratamento, setDiasTratamento] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickReviewTags = [
    'Estoque Confirmado 📦',
    'Atendimento Ágil ⚡',
    'Preço Acessível 💰',
    'Farmacêutico Atencioso 👨‍⚕️',
    'Aceita M-Pesa / Cartão 💳',
  ];

  const handleAddTag = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev} • ${tag}` : tag));
    }
  };

  const handleConfirmAcquisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const valorNumerico = parseFloat(precoPago) || stock?.preco || null;
      const totalMzn = valorNumerico ? valorNumerico * quantidade : null;

      // 1. Criar pedido já em estado 'Concluído' com identificador FarmaLink Tete
      const order = FarmaLinkDB.createOrder({
        user_id: currentUser.user_id,
        user_nome: currentUser.nome,
        user_telefone: currentUser.telefone || '+258 84 000 0000',
        user_email: currentUser.email,
        pharmacy_id: pharmacy.id,
        pharmacy_nome: pharmacy.nome,
        pharmacy_telefone: pharmacy.telefone,
        medicine_id: medicine.id,
        medicine_nome: medicine.nome,
        medicine_concentracao: medicine.concentracao,
        quantidade,
        preco_unitario: valorNumerico,
        preco_total: totalMzn,
        observacao: 'Medicamento obtido e confirmado presencialmente pelo utente via FarmaLink Tete.',
        payment_method: paymentMethod,
        payment_status: 'paid',
        status: 'Concluído',
        status_note: 'Compra física validada e concluída via FarmaLink Tete.',
      });

      // 2. Registar Avaliação Verificada da Farmácia
      if (rating > 0 && comment.trim()) {
        try {
          StorageService.addPharmacyReview({
            pharmacy_id: pharmacy.id,
            user_id: currentUser.user_id,
            user_nome: currentUser.nome,
            user_bairro: currentUser.bairro || 'Cidade de Tete',
            rating,
            comment: comment.trim(),
            order_id: order.id,
            is_verified_buyer: true,
          });
        } catch {
          // fallback silent
        }
      }

      // 3. Opcional: Criar lembrete de toma automático no perfil de saúde
      if (createReminder) {
        try {
          const defaultTimes =
            frequenciaHoras === 8
              ? ['08:00', '16:00', '00:00']
              : frequenciaHoras === 12
              ? ['08:00', '20:00']
              : frequenciaHoras === 6
              ? ['06:00', '12:00', '18:00', '00:00']
              : ['08:00'];

          FarmaLinkDB.saveMedicationReminder({
            user_id: currentUser.user_id,
            medicine_nome: `${medicine.nome} ${medicine.concentracao}`,
            dosagem: `1 dose (${medicine.forma_farmaceutica || 'comprimido'})`,
            frequencia_horas: frequenciaHoras,
            horarios: defaultTimes,
            dias_duracao: diasTratamento,
            data_inicio: new Date().toISOString().split('T')[0],
            instrucoes: `Adquirido na ${pharmacy.nome}. Tomar conforme orientação médica e bula.`,
            ativo: true,
          });
        } catch {
          // ignore
        }
      }

      // 4. Sincronizar em nuvem no Firestore
      try {
        CloudSync.syncOrder(order);
      } catch {
        // ignore
      }

      // 5. Efeito de celebração
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess(order);

      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2400);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="medicine-acquisition-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Registo de Aquisição Direta</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Comprei este Medicamento!
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-md">
            Confirme que adquiriu este fármaco nesta farmácia para salvar no seu histórico e ajudar outros utentes em Tete.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Medicamento Registado com Sucesso!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Obrigado por utilizar o <strong>FarmaLink Tete</strong>. A sua compra na <strong>{pharmacy.nome}</strong> foi registada no seu histórico de saúde.
            </p>
            {createReminder && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-semibold inline-flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                <span>Lembrete de toma agendado a cada {frequenciaHoras} horas!</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleConfirmAcquisition} className="p-6 space-y-5 text-xs">
            {/* Pharmacy & Medicine Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Medicamento</span>
                  <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{medicine.nome}</span>
                  </h4>
                  <span className="text-xs font-semibold text-slate-600">
                    {medicine.concentracao} • {medicine.forma_farmaceutica || 'Comprimidos'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Farmácia</span>
                  <p className="font-bold text-slate-900 flex items-center justify-end gap-1">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pharmacy.nome}</span>
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">Bairro {pharmacy.bairro}</span>
                </div>
              </div>
            </div>

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quantidade Adquirida
                </label>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-slate-900 text-sm">{quantidade}</span>
                  <button
                    type="button"
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Preço Pago (MZN)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={precoPago}
                    onChange={(e) => setPrecoPago(e.target.value)}
                    placeholder="Ex: 120"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-[11px]">MZN</span>
                </div>
              </div>
            </div>

            {/* Payment Method used at counter */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Método de Pagamento Utilizado no Balcão
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'cash_on_pickup', label: 'Numerário', icon: '💵' },
                  { id: 'mpesa', label: 'M-Pesa', icon: '📲' },
                  { id: 'emola', label: 'e-Mola', icon: '📱' },
                  { id: 'pos_card', label: 'Cartão POS', icon: '💳' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id as any)}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      paymentMethod === item.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-sm block">{item.icon}</span>
                    <span className="text-[11px] block mt-0.5">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Review & Experience */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Avaliação do Atendimento & Estoque</label>
                <span className="text-amber-700 font-bold text-[11px]">
                  {rating === 5 ? '⭐⭐⭐⭐⭐ Excelente' : rating === 4 ? '⭐⭐⭐⭐ Muito Bom' : rating === 3 ? '⭐⭐⭐ Bom' : '⭐ Regular'}
                </span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickReviewTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:bg-emerald-100 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comentário sobre a disponibilidade do remédio ou atendimento..."
                rows={2}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>

            {/* Smart Feature: Auto Schedule Reminder */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createReminder}
                  onChange={(e) => setCreateReminder(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-emerald-950 block">
                    Agendar Lembretes de Toma no FarmaLink
                  </span>
                  <span className="text-[11px] text-emerald-800 leading-tight block mt-0.5">
                    O aplicativo emitirá avisos nos horários certos para você não esquecer de tomar este medicamento.
                  </span>
                </div>
              </label>

              {createReminder && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-900 block mb-1">Frequência</span>
                    <select
                      value={frequenciaHoras}
                      onChange={(e) => setFrequenciaHoras(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-950 text-xs"
                    >
                      <option value={6}>A cada 6 horas (4x/dia)</option>
                      <option value={8}>A cada 8 horas (3x/dia)</option>
                      <option value={12}>A cada 12 horas (2x/dia)</option>
                      <option value={24}>A cada 24 horas (1x/dia)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-900 block mb-1">Duração</span>
                    <select
                      value={diasTratamento}
                      onChange={(e) => setDiasTratamento(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-950 text-xs"
                    >
                      <option value={3}>3 dias</option>
                      <option value={5}>5 dias</option>
                      <option value={7}>7 dias</option>
                      <option value={10}>10 dias</option>
                      <option value={14}>14 dias</option>
                      <option value={30}>30 dias (Uso contínuo)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <ClinicalButton
                variant="primary"
                size="md"
                id="submit-acquisition-btn"
                isLoading={isSubmitting}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="font-black"
              >
                Confirmar Aquisição via FarmaLink
              </ClinicalButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
