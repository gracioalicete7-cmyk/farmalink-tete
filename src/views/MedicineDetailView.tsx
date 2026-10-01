import React, { useState } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { Medicine, Pharmacy, PharmacyMedicine, UserLocation, UserProfile } from '../types';
import { calculateDistanceKm, formatDistance, isPharmacyOpen, getDirectionsUrl } from '../lib/geo';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { MedicineAcquisitionModal } from '../components/MedicineAcquisitionModal';
import {
  ClinicalButton,
  AvailabilityBadge,
  PriceDisplay,
  DosageBadge,
  SanitaryTag,
} from '../components/ClinicalPrecision';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  Pill,
  Store,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Sparkles,
  Thermometer,
  ShieldCheck,
  Share2,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  X,
  ShoppingBag,
} from 'lucide-react';

interface MedicineDetailViewProps {
  medicineId: string;
  userLocation: UserLocation | null;
  currentUser?: UserProfile | null;
  onBack: () => void;
  onSelectMedicine?: (medicineId: string) => void;
  onSelectPharmacy: (pharmacyId: string) => void;
  onOrderMedicine: (medicine: Medicine, pharmacy: Pharmacy, stock: PharmacyMedicine) => void;
}

export const MedicineDetailView: React.FC<MedicineDetailViewProps> = ({
  medicineId,
  userLocation,
  currentUser,
  onBack,
  onSelectMedicine,
  onSelectPharmacy,
  onOrderMedicine,
}) => {
  const [acquisitionData, setAcquisitionData] = useState<{
    isOpen: boolean;
    pharmacy: Pharmacy | null;
    stock: PharmacyMedicine | null;
  }>({
    isOpen: false,
    pharmacy: null,
    stock: null,
  });

  const medicine = FarmaLinkDB.getMedicineById(medicineId);
  const allMedicines = FarmaLinkDB.getMedicines();
  const approvedPharmacies = FarmaLinkDB.getApprovedPharmacies();
  const allStocks = FarmaLinkDB.getPharmacyMedicines();

  if (!medicine) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Medicamento não encontrado</h2>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
        >
          Voltar à Pesquisa
        </button>
      </div>
    );
  }

  // Find all approved pharmacies that stock this medicine (excluding quarantine)
  const pharmacyStocks = allStocks
    .filter((s) => s.medicine_id === medicine.id && !s.em_quarentena)
    .map((stock) => {
      const pharmacy = approvedPharmacies.find((p) => p.id === stock.pharmacy_id);
      return pharmacy ? { stock, pharmacy } : null;
    })
    .filter((item): item is { stock: PharmacyMedicine; pharmacy: Pharmacy } => !!item)
    .sort((a, b) => {
      if (userLocation) {
        const distA = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          a.pharmacy.latitude,
          a.pharmacy.longitude
        );
        const distB = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          b.pharmacy.latitude,
          b.pharmacy.longitude
        );
        return distA - distB;
      }
      return a.pharmacy.nome.localeCompare(b.pharmacy.nome);
    });

  const availableCount = pharmacyStocks.filter(
    (s) => s.stock.disponibilidade === 'Disponível' || s.stock.disponibilidade === 'Pouca quantidade'
  ).length;

  // Find generic alternatives or bioequivalent medicines in Tete
  const equivalentMedicines = allMedicines.filter((m) => {
    if (m.id === medicine.id) return false;
    const samePrinciple =
      m.principio_ativo.toLowerCase().trim() === medicine.principio_ativo.toLowerCase().trim();
    const sameCategory = m.categoria && medicine.categoria && m.categoria === medicine.categoria;
    return samePrinciple || sameCategory;
  }).slice(0, 3);

  return (
    <div id="medicine-detail-view" className="space-y-4 pb-12">
      {/* Top Back Navigation with Exit Button */}
      <ScreenHeader
        title={medicine.nome}
        subtitle={`${medicine.principio_ativo} • ${medicine.concentracao}`}
        onBack={onBack}
        exitLabel="Sair"
        backLabel="Voltar para tela anterior"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const shareText = `💊 *${medicine.nome}* (${medicine.concentracao})\nPrincípio: ${medicine.principio_ativo}\n🏥 Disponível em ${availableCount} farmácias em Tete.\n\nConsulte disponibilidade no balcão e reserve no FarmaLink Tete:\nhttps://ais-pre-jhsmptx7oxss2uerqxxzgf-717826220782.europe-west2.run.app`;
                if (navigator.share) {
                  navigator.share({
                    title: `${medicine.nome} - FarmaLink Tete`,
                    text: shareText,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                  window.open(waUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">WhatsApp / Partilhar</span>
            </button>
            <SanitaryTag code={`MISAU-MZ-${medicine.id.toUpperCase()}`} label="Homologação" />
          </div>
        }
      />

      {/* Medicine Info Card with Clinical Precision */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <DosageBadge dosage={medicine.concentracao} form={medicine.forma_farmaceutica} />
              {medicine.precisa_receita ? (
                <AvailabilityBadge status="prescription_req" size="xs" />
              ) : (
                <AvailabilityBadge status="otc_free" size="xs" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {medicine.nome}
            </h1>

            <p className="text-sm text-slate-700">
              <strong className="text-slate-900">Princípio Ativo:</strong> {medicine.principio_ativo}
            </p>
          </div>

          {medicine.precisa_receita && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5 max-w-sm">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Receita Médica Obrigatória (R.M.)</p>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Apresentação física da receita médica emitida por profissional habilitado no ato do levantamento.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Specifications grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-500 font-semibold block text-[11px]">Forma Farmacêutica</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{medicine.forma_farmaceutica}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-500 font-semibold block text-[11px]">Apresentação</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{medicine.apresentacao}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-500 font-semibold block text-[11px]">Classe Terapêutica</span>
            <span className="font-bold text-emerald-800 text-sm mt-0.5 block">{medicine.categoria || 'Geral'}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-500 font-semibold block text-[11px]">Registo Sanitário</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{medicine.fabricante || 'Autorizado MISAU'}</span>
          </div>
        </div>

        {medicine.descricao && (
          <div className="text-xs sm:text-sm text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">Indicações & Informação Terapêutica:</p>
            <p className="leading-relaxed">{medicine.descricao}</p>
          </div>
        )}

        {/* Tropical Climate Advisory for Tete (Requirement #15 & Provincial Context) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
          <Thermometer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-950">Conservação Térmica (Clima Tropical de Tete):</p>
            <p className="text-amber-900 leading-relaxed">
              Dada a temperatura ambiente elevada na província de Tete (&gt;35°C), conserve este medicamento em local seco, fresco e ao abrigo da luz solar direta. Não armazene dentro de veículos ou exposto ao calor.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer (Requirement #15 & #40) */}
      <DisclaimerBanner />

      {/* Farmácias onde está disponível */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Farmácias em Tete com Disponibilidade</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {availableCount} de {pharmacyStocks.length} farmácias possuem estoque ativo
            </p>
          </div>
        </div>

        {pharmacyStocks.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            Nenhuma farmácia com estoque registrado para este medicamento no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {pharmacyStocks.map(({ stock, pharmacy }) => {
              const isOpen = isPharmacyOpen(pharmacy.horario);
              const distanceKm = userLocation
                ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, pharmacy.latitude, pharmacy.longitude)
                : null;
              const isAvailable = stock.disponibilidade === 'Disponível' || stock.disponibilidade === 'Pouca quantidade';

              const statusBadgeType =
                stock.disponibilidade === 'Disponível'
                  ? 'available'
                  : stock.disponibilidade === 'Pouca quantidade'
                  ? 'low_stock'
                  : 'out_of_stock';

              return (
                <div
                  key={pharmacy.id}
                  className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={pharmacy.logo_url}
                      alt={pharmacy.nome}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectPharmacy(pharmacy.id)}
                          className="font-extrabold text-slate-900 text-sm sm:text-base hover:text-emerald-700 text-left"
                        >
                          {pharmacy.nome}
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOpen ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {isOpen ? 'Aberta' : 'Fechada'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{pharmacy.bairro}, Tete</span>
                        {distanceKm !== null && (
                          <span className="font-bold text-emerald-800"> • {formatDistance(distanceKm)}</span>
                        )}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{pharmacy.horario}</span>
                        <span>•</span>
                        <a href={`tel:${pharmacy.telefone}`} className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {pharmacy.telefone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right space-y-1">
                      <div className="flex items-center sm:justify-end gap-2">
                        <AvailabilityBadge status={statusBadgeType} size="xs" />
                        <span className="text-xs font-bold text-slate-700">
                          {stock.quantidade} {stock.unidade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Preço sob consulta direta ao balcão
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <a
                        href={`https://wa.me/258${pharmacy.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá Farmácia ${pharmacy.nome}, vi no FarmaLink Tete que têm ${medicine.nome} (${medicine.concentracao} • ${medicine.forma_farmaceutica}) em stock no vosso balcão em ${pharmacy.bairro}. Gostaria de confirmar a disponibilidade e o valor para levantar.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 font-bold text-xs transition-colors shrink-0 shadow-2xs"
                        title="Consultar disponibilidade e preço no WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Botão para registar compra presencial rápida */}
                      {currentUser && (
                        <button
                          type="button"
                          id={`bought-here-btn-${pharmacy.id}`}
                          onClick={() => setAcquisitionData({ isOpen: true, pharmacy, stock })}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                          title="Registar que comprou este medicamento nesta farmácia via FarmaLink Tete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Comprei Aqui</span>
                        </button>
                      )}

                      {isAvailable && (
                        <ClinicalButton
                          variant="primary"
                          size="md"
                          id={`request-from-detail-${pharmacy.id}`}
                          onClick={() => onOrderMedicine(medicine, pharmacy, stock)}
                          icon={<Pill className="w-4 h-4" />}
                        >
                          Reservar
                        </ClinicalButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Equivalentes Genéricos / Alternativas Terapêuticas */}
      {equivalentMedicines.length > 0 && onSelectMedicine && (
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Medicamentos Alternativos & Equivalentes em Tete</span>
              </h3>
              <p className="text-xs text-slate-500">
                Opções com a mesma classe terapêutica ou princípio ativo disponíveis no mercado provincial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {equivalentMedicines.map((altMed) => (
              <div
                key={altMed.id}
                onClick={() => onSelectMedicine(altMed.id)}
                className="p-4 bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <DosageBadge dosage={altMed.concentracao} />
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">{altMed.nome}</h4>
                <p className="text-xs text-slate-500">{altMed.principio_ativo}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Aquisição / Confirmação Direta via FarmaLink Tete */}
      {acquisitionData.isOpen && acquisitionData.pharmacy && currentUser && (
        <MedicineAcquisitionModal
          isOpen={acquisitionData.isOpen}
          medicine={medicine}
          pharmacy={acquisitionData.pharmacy}
          stock={acquisitionData.stock}
          currentUser={currentUser}
          onClose={() => setAcquisitionData({ isOpen: false, pharmacy: null, stock: null })}
          onSuccess={() => {
            setAcquisitionData({ isOpen: false, pharmacy: null, stock: null });
          }}
        />
      )}
    </div>
  );
};

