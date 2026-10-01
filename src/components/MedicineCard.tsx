import React from 'react';
import { Medicine, PharmacyMedicine, Pharmacy, UserLocation } from '../types';
import { calculateDistanceKm, formatDistance, isPharmacyOpen } from '../lib/geo';
import { AvailabilityBadge, DosageBadge, ClinicalButton } from './ClinicalPrecision';
import { Pill, Clock, Store, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, MessageCircle, Share2, Phone, CheckCircle2 } from 'lucide-react';

interface MedicineCardProps {
  medicine: Medicine;
  pharmacyStocks: Array<{
    stock: PharmacyMedicine;
    pharmacy: Pharmacy;
  }>;
  userLocation?: UserLocation | null;
  onOrder: (medicine: Medicine, pharmacy: Pharmacy, stock: PharmacyMedicine) => void;
  onSelectMedicine?: (medicineId: string) => void;
  onSelectPharmacy?: (pharmacyId: string) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  pharmacyStocks,
  userLocation,
  onOrder,
  onSelectMedicine,
  onSelectPharmacy,
}) => {
  // Sort pharmacies by proximity if userLocation is available, else by availability & price
  const sortedStocks = [...pharmacyStocks].sort((a, b) => {
    if (userLocation) {
      const distA = calculateDistanceKm(userLocation.latitude, userLocation.longitude, a.pharmacy.latitude, a.pharmacy.longitude);
      const distB = calculateDistanceKm(userLocation.latitude, userLocation.longitude, b.pharmacy.latitude, b.pharmacy.longitude);
      return distA - distB;
    }
    // Sort available first, then alphabetically by pharmacy name
    if (a.stock.disponibilidade === 'Disponível' && b.stock.disponibilidade !== 'Disponível') return -1;
    if (b.stock.disponibilidade === 'Disponível' && a.stock.disponibilidade !== 'Disponível') return 1;
    return a.pharmacy.nome.localeCompare(b.pharmacy.nome);
  });

  const availableStocksCount = pharmacyStocks.filter(
    (s) => s.stock.disponibilidade === 'Disponível' || s.stock.disponibilidade === 'Pouca quantidade'
  ).length;

  const formatLastUpdated = (dateStr: string) => {
    const diffMin = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 60) return `Atualizado há ${Math.max(1, diffMin)} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `Atualizado há ${diffHours}h`;
    return `Atualizado a ${new Date(dateStr).toLocaleDateString('pt-MZ')}`;
  };

  return (
    <div
      id={`medicine-card-${medicine.id}`}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Name, Concentration, Category */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={() => onSelectMedicine && onSelectMedicine(medicine.id)}
                className="font-extrabold text-slate-900 text-base sm:text-lg hover:text-emerald-700 cursor-pointer transition-colors"
              >
                {medicine.nome}
              </h3>
              <DosageBadge dosage={medicine.concentracao} />
            </div>

            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">DCI / Princípio:</span> {medicine.principio_ativo}
            </p>
          </div>

          <div className="shrink-0">
            {medicine.precisa_receita ? (
              <AvailabilityBadge status="prescription_req" size="xs" />
            ) : (
              <AvailabilityBadge status="otc_free" size="xs" />
            )}
          </div>
        </div>

        {/* Pharmaceutical specs */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-600">
          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl font-semibold border border-slate-200/60">
            {medicine.forma_farmaceutica}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 font-medium">{medicine.apresentacao}</span>
          {medicine.categoria && (
            <>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                {medicine.categoria}
              </span>
            </>
          )}
        </div>

        {/* Pharmacy Availability List */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              Disponibilidade em Tete:
            </span>
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              {availableStocksCount} de {pharmacyStocks.length} farmácias
            </span>
          </div>

          {pharmacyStocks.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-500 border border-slate-200/60">
              Nenhuma farmácia com estoque registrado no momento em Tete.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {sortedStocks.map(({ stock, pharmacy }) => {
                const isOpen = isPharmacyOpen(pharmacy.horario);
                const distanceKm = userLocation
                  ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, pharmacy.latitude, pharmacy.longitude)
                  : null;

                const isAvailable = stock.disponibilidade === 'Disponível' || stock.disponibilidade === 'Pouca quantidade';

                return (
                  <div
                    key={`${pharmacy.id}-${stock.id}`}
                    className={`rounded-2xl p-3 sm:p-3.5 border transition-all ${
                      isAvailable
                        ? 'bg-slate-50/90 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30'
                        : 'bg-slate-100/50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectPharmacy && onSelectPharmacy(pharmacy.id)}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-emerald-700 text-left"
                          >
                            {pharmacy.nome}
                          </button>
                          <AvailabilityBadge
                            status={isOpen ? 'duty_open' : 'duty_closed'}
                            size="xs"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {pharmacy.bairro}
                          {distanceKm !== null && ` • 📍 ${formatDistance(distanceKm)}`}
                        </p>
                      </div>

                      {/* Stock Status Badge */}
                      <AvailabilityBadge
                        status={
                          stock.disponibilidade === 'Disponível'
                            ? 'available'
                            : stock.disponibilidade === 'Pouca quantidade'
                            ? 'low_stock'
                            : 'out_of_stock'
                        }
                        size="xs"
                      />
                    </div>

                    {/* Stock Details & Actions */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Disponível no Balcão</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • Preço sob consulta direta
                        </span>
                      </div>

                      {/* Action Buttons: WhatsApp Direct, Phone Call, Share & Solicitar Reserva */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <a
                          href={`https://wa.me/258${pharmacy.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá ${pharmacy.nome}! Vi no FarmaLink Tete que têm ${medicine.nome} (${medicine.concentracao} • ${medicine.forma_farmaceutica}) disponível no vosso balcão em ${pharmacy.bairro}. Gostaria de confirmar a disponibilidade e o valor para levantar.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition-all shadow-2xs text-xs font-bold"
                          title={`Falar com ${pharmacy.nome} no WhatsApp`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${pharmacy.telefone}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200"
                          title={`Ligar para ${pharmacy.nome}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-700" />
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const shareText = `💊 *${medicine.nome}* (${medicine.concentracao})\n🏥 Farmácia: *${pharmacy.nome}* (${pharmacy.bairro}, Tete)\n📦 Stock: Disponível no balcão\n📞 Contacto: ${pharmacy.telefone}\n\nConsulte no FarmaLink Tete: https://ais-pre-jhsmptx7oxss2uerqxxzgf-717826220782.europe-west2.run.app`;
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
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200 cursor-pointer"
                          title="Partilhar este medicamento no WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-slate-700" />
                        </button>

                        {isAvailable && (
                          <ClinicalButton
                            size="sm"
                            variant="primary"
                            id={`order-btn-${pharmacy.id}-${medicine.id}`}
                            onClick={() => onOrder(medicine, pharmacy, stock)}
                            icon={<ArrowRight className="w-3.5 h-3.5" />}
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
        </div>
      </div>
    </div>
  );
};
