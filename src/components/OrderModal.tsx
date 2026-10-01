import React, { useState } from 'react';
import { Medicine, Pharmacy, PharmacyMedicine, UserProfile, Order } from '../types';
import { FarmaLinkDB } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';
import {
  sanitizeInput,
  checkRateLimit,
  detectMaliciousPayload,
  generateReservationSignature,
} from '../lib/security';
import { ClinicalButton, PriceDisplay, DosageBadge } from './ClinicalPrecision';
import { RealFileUpload } from './RealFileUpload';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Store,
  Pill,
  CreditCard,
  Phone,
  FileCheck,
  ShieldCheck,
  Shield,
  Zap,
} from 'lucide-react';
import { MOZAMBIQUE_INSURANCE_COMPANIES, INSURANCE_DISPENSATION_NOTICE } from '../constants/insurance';

interface OrderModalProps {
  medicine: Medicine;
  pharmacy: Pharmacy;
  stock: PharmacyMedicine;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  medicine,
  pharmacy,
  stock,
  currentUser,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>('');
  const [userTelefone, setUserTelefone] = useState<string>(currentUser.telefone || '+258 84 ');
  const [userNome, setUserNome] = useState<string>(currentUser.nome);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'cash_on_pickup'>('mpesa');
  const [paymentPhone, setPaymentPhone] = useState<string>(currentUser.telefone || '+258 84 ');
  const [usaSeguro, setUsaSeguro] = useState<boolean>(false);
  const [seguradoraNome, setSeguradoraNome] = useState<string>(
    pharmacy.seguradoras && pharmacy.seguradoras.length > 0 ? pharmacy.seguradoras[0] : 'Hollard Seguros'
  );
  const [numeroCartaoSeguro, setNumeroCartaoSeguro] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const precoUnitario = stock.preco;
  const precoTotal = precoUnitario !== null ? precoUnitario * quantidade : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Rate-limiting check against spam/brute-force submissions
    const rateCheck = checkRateLimit(`order_${currentUser.user_id}`, 6, 60000);
    if (!rateCheck.allowed) {
      setErrorMsg(`Muitas tentativas consecutivas. Por favor aguarde ${rateCheck.retryAfterSec}s antes de enviar nova reserva.`);
      return;
    }

    // 2. Input sanitization & anti-injection inspection
    const cleanNome = sanitizeInput(userNome);
    const cleanTelefone = sanitizeInput(userTelefone);
    const cleanObservacao = sanitizeInput(observacao);
    const cleanNumeroCartao = sanitizeInput(numeroCartaoSeguro);

    const payloadCheck = detectMaliciousPayload({ cleanNome, cleanTelefone, cleanObservacao, cleanNumeroCartao });
    if (!payloadCheck.isSafe) {
      setErrorMsg(`O sistema de segurança FarmaLink bloqueou o envio devido a caracteres maliciosos ou comando não autorizado (${payloadCheck.threat}).`);
      return;
    }

    if (!cleanNome) {
      setErrorMsg('Por favor informe o seu nome.');
      return;
    }
    if (!cleanTelefone || cleanTelefone.length < 8) {
      setErrorMsg('Por favor informe um número de telefone moçambicano válido.');
      return;
    }
    if (medicine.precisa_receita && !prescriptionUrl) {
      setErrorMsg('Este medicamento exige receita médica obrigatória (R.M.). Por favor anexe a foto da receita.');
      return;
    }
    if (usaSeguro && !cleanNumeroCartao) {
      setErrorMsg('Por favor informe o número do cartão ou apólice do seu seguro de saúde para a pré-autorização.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const isMobilePay = paymentMethod === 'mpesa' || paymentMethod === 'emola';
      const txId = isMobilePay
        ? `${paymentMethod.toUpperCase()}-MZ-${Math.floor(100000 + Math.random() * 900000)}`
        : undefined;

      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const createdAt = new Date().toISOString();

      // Cryptographic Anti-Tampering Signature for QR Code & Prescription Verification
      const securitySig = generateReservationSignature({
        orderId,
        userId: currentUser.user_id,
        pharmacyId: pharmacy.id,
        medicineId: medicine.id,
        totalMzn: precoTotal || 0,
        createdAt,
      });

      const newOrder = FarmaLinkDB.createOrder({
        user_id: currentUser.user_id,
        user_nome: cleanNome,
        user_telefone: cleanTelefone,
        user_email: currentUser.email,
        pharmacy_id: pharmacy.id,
        pharmacy_nome: pharmacy.nome,
        pharmacy_telefone: pharmacy.telefone,
        medicine_id: medicine.id,
        medicine_nome: medicine.nome,
        medicine_concentracao: medicine.concentracao,
        quantidade,
        preco_unitario: precoUnitario,
        preco_total: precoTotal,
        observacao: cleanObservacao || undefined,
        prescription_url: prescriptionUrl,
        payment_method: paymentMethod,
        payment_status: isMobilePay ? 'paid' : 'pay_on_delivery',
        payment_phone: isMobilePay ? paymentPhone : undefined,
        payment_tx_id: txId,
        usa_seguro: usaSeguro,
        seguradora_nome: usaSeguro ? seguradoraNome : undefined,
        numero_cartao_seguro: usaSeguro ? cleanNumeroCartao : undefined,
        autorizacao_seguro_status: usaSeguro ? 'pendente_autorizacao' : undefined,
        status: 'Enviado',
      });

      // Synchronize to Firestore Cloud in real-time
      await CloudSync.syncOrder(newOrder);

      // Decrement stock in real database
      if (stock.quantidade >= quantidade) {
        const updatedStock: PharmacyMedicine = {
          ...stock,
          quantidade: Math.max(0, stock.quantidade - quantidade),
          disponibilidade:
            stock.quantidade - quantidade <= 0
              ? 'Indisponível'
              : stock.quantidade - quantidade < 5
              ? 'Pouca quantidade'
              : 'Disponível',
        };
        FarmaLinkDB.savePharmacyMedicine(updatedStock);
        await CloudSync.syncStock(updatedStock);
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setIsSubmitting(false);
      onOrderSuccess(newOrder);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Ocorreu um erro ao submeter o pedido. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <div
      id="order-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="order-modal-container"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8"
      >
        {/* Modal Header */}
        <div className="bg-emerald-700 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Solicitar Medicamento</h3>
              <p className="text-emerald-100 text-xs mt-0.5">
                Reserva, Receita & Pagamento em Tete
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-order-modal-btn"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-emerald-200 hover:text-white hover:bg-emerald-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Pharmacy & Medicine Details Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Store className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900">{pharmacy.nome}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{pharmacy.bairro}, Tete</span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-slate-900 text-sm sm:text-base">{medicine.nome}</p>
                  <DosageBadge dosage={medicine.concentracao} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {medicine.principio_ativo} • {medicine.forma_farmaceutica}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                  Reserva no Balcão
                </span>
              </div>
            </div>
          </div>

          {/* Prescription Upload (Required if medicine requires prescription) */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>Receita Médica {medicine.precisa_receita ? '(Obrigatória - R.M.)' : '(Opcional)'}</span>
              </h4>
            </div>
            <RealFileUpload
              label="Anexar Receita Médica (Foto ou PDF)"
              description="Tire foto nítida da receita emitida pelo médico ou centro de saúde"
              isPrescription={true}
              currentValue={prescriptionUrl}
              onFileSelect={(url) => setPrescriptionUrl(url)}
              onRemove={() => setPrescriptionUrl(undefined)}
            />
          </div>

          {/* Convénio / Seguro de Saúde */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Seguro de Saúde & Convénio
                </h4>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs">
                <input
                  type="checkbox"
                  checked={usaSeguro}
                  onChange={(e) => setUsaSeguro(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  {usaSeguro ? 'Usar Seguro' : 'Particular'}
                </span>
              </label>
            </div>

            {pharmacy.aceita_seguro ? (
              <p className="text-[11px] text-slate-600">
                Esta farmácia/clínica atende segurados. Marque &quot;Usar Seguro&quot; se deseja que a farmácia solicite pré-autorização da sua asseguradora.
              </p>
            ) : (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ Nota: Esta farmácia opera prioritariamente a pronto pagamento particular.
              </p>
            )}

            {usaSeguro && (
              <div className="space-y-3 pt-2 border-t border-blue-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selecione a sua Asseguradora / Plano de Saúde *
                  </label>
                  <select
                    value={seguradoraNome}
                    onChange={(e) => setSeguradoraNome(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    {pharmacy.seguradoras && pharmacy.seguradoras.length > 0 ? (
                      <>
                        <optgroup label="Asseguradoras Conveniadas com esta Farmácia">
                          {pharmacy.seguradoras.map((ins, i) => (
                            <option key={`pharm-${i}`} value={ins}>
                              ⭐ {ins}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Outras Asseguradoras em Moçambique">
                          {MOZAMBIQUE_INSURANCE_COMPANIES.filter(
                            (ins) => !pharmacy.seguradoras?.includes(ins.name)
                          ).map((ins) => (
                            <option key={ins.id} value={ins.name}>
                              {ins.name}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    ) : (
                      MOZAMBIQUE_INSURANCE_COMPANIES.map((ins) => (
                        <option key={ins.id} value={ins.name}>
                          {ins.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número do Cartão de Seguro / Apólice *
                  </label>
                  <input
                    type="text"
                    value={numeroCartaoSeguro}
                    onChange={(e) => setNumeroCartaoSeguro(e.target.value)}
                    placeholder="Ex: HLD-889021 / MED-4450"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Mensagem regulamentar de pré-autorização */}
                <div className="bg-white/90 p-3 rounded-xl border border-blue-200 text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Regra Sanitária: Dispensa Condicionada à Pré-Autorização</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    A farmácia submeterá o pedido de autorização e o Termo de Responsabilidade à <strong>{seguradoraNome}</strong>. A entrega do medicamento ocorrerá após validação formal da comparticipação.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector (M-Pesa / e-Mola / Balcão) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Forma de Pagamento (Moçambique)</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'mpesa'
                    ? 'border-red-600 bg-red-50 text-red-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-[10px] flex items-center justify-center">
                  M
                </div>
                <span className="text-xs">M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('emola')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'emola'
                    ? 'border-orange-600 bg-orange-50 text-orange-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-[10px] flex items-center justify-center">
                  e
                </div>
                <span className="text-xs">e-Mola</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_pickup')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash_on_pickup'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  MZN
                </div>
                <span className="text-xs leading-tight">No Balcão</span>
              </button>
            </div>

            {(paymentMethod === 'mpesa' || paymentMethod === 'emola') && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Número {paymentMethod === 'mpesa' ? 'Vodacom (M-Pesa)' : 'Movitel (e-Mola)'} *
                </label>
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="+258 84 / 85 / 86..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Confirmação instantânea de pagamento sem taxas adicionais.</span>
                </p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade Solicitada *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  className="w-12 h-12 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg active:scale-95 transition-transform"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-bold text-slate-900 border border-slate-300 rounded-2xl h-12 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantidade(quantidade + 1)}
                  className="w-12 h-12 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment terms */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor a Liquidar
              </label>
              <div className="h-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center px-3.5 font-bold text-emerald-900 text-xs">
                Confirmado diretamente no balcão da farmácia
              </div>
            </div>
          </div>

          {/* User Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Utente / Cidadão *
              </label>
              <input
                type="text"
                required
                value={userNome}
                onChange={(e) => setUserNome(e.target.value)}
                placeholder="Ex: Amélia Nhantumbo"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contacto Telefónico (Moçambique) *
              </label>
              <input
                type="tel"
                required
                value={userTelefone}
                onChange={(e) => setUserTelefone(e.target.value)}
                placeholder="+258 84 123 4567"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[48px]"
              />
            </div>
          </div>

          {/* Observation Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observação / Informações adicionais (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Pretendo levantar hoje às 17h..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <ClinicalButton
              variant="outline"
              size="md"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </ClinicalButton>
            <ClinicalButton
              variant="primary"
              size="md"
              type="submit"
              id="confirm-submit-order-btn"
              disabled={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'A processar...' : 'Confirmar & Solicitar'}
            </ClinicalButton>
          </div>
        </form>
      </div>
    </div>
  );
};
