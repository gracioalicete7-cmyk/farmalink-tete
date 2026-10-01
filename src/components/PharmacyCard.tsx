import React from 'react';
import { Pharmacy, UserLocation } from '../types';
import { calculateDistanceKm, formatDistance, isPharmacyOpen, getDirectionsUrl } from '../lib/geo';
import { AvailabilityBadge, ClinicalButton } from './ClinicalPrecision';
import { MapPin, Clock, Phone, CheckCircle2, ChevronRight, Navigation, MessageCircle, Share2, ShieldCheck } from 'lucide-react';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  userLocation?: UserLocation | null;
  onSelect: (pharmacyId: string) => void;
  availableCount?: number;
}

export const PharmacyCard: React.FC<PharmacyCardProps> = ({
  pharmacy,
  userLocation,
  onSelect,
  availableCount,
}) => {
  const isOpen = isPharmacyOpen(pharmacy.horario);
  const distanceKm = userLocation
    ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, pharmacy.latitude, pharmacy.longitude)
    : null;

  const handleSharePharmacy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = pharmacy.telefone.replace(/\D/g, '');
    const shareText = `🏥 *${pharmacy.nome}* no FarmaLink Tete\n📍 Bairro ${pharmacy.bairro}, Tete\n⏰ Horário: ${pharmacy.horario}\n📞 Contacto: ${pharmacy.telefone}\n\nEncontre farmácias e medicamentos em Tete: https://ais-pre-jhsmptx7oxss2uerqxxzgf-717826220782.europe-west2.run.app`;
    
    if (navigator.share) {
      navigator.share({
        title: `${pharmacy.nome} - FarmaLink Tete`,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const whatsappNumber = pharmacy.telefone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/258${whatsappNumber}?text=${encodeURIComponent(
    `Olá ${pharmacy.nome}! Encontrei a vossa farmácia no FarmaLink Tete e gostaria de mais informações.`
  )}`;

  return (
    <div
      id={`pharmacy-card-${pharmacy.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col justify-between group"
    >
      <div>
        {/* Header: Photo/Logo + Name, Bairro + Status Badge & Distance */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={pharmacy.logo_url || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=100&auto=format&fit=crop&q=80'}
                alt={pharmacy.nome}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              {pharmacy.is_verified && (
                <div
                  className={`absolute -bottom-1 -right-1 text-white rounded-full p-0.5 shadow-xs ${
                    pharmacy.status === 'Aprovação Provisória' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                  title={
                    pharmacy.status === 'Aprovação Provisória'
                      ? 'Homologação Provisória (Auditoria Posterior)'
                      : 'Farmácia Verificada e Autorizada DPS'
                  }
                >
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 break-words">
                {pharmacy.nome}
              </h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="break-words">{pharmacy.bairro}, {pharmacy.cidade}</span>
              </p>
              {pharmacy.director_name && (
                <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                  <span className="text-slate-400">Direcção:</span>{' '}
                  <span className="font-bold text-slate-800 break-words">{pharmacy.director_name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Status Badge & Distance */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <AvailabilityBadge
              status={isOpen ? 'duty_open' : 'duty_closed'}
              size="xs"
            />

            {/* Distance in Kilometers */}
            {distanceKm !== null ? (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 whitespace-nowrap">
                📍 {formatDistance(distanceKm)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Operating Hours & Contact */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium break-words">{pharmacy.horario}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <a href={`tel:${pharmacy.telefone}`} className="hover:underline text-slate-700 font-semibold break-all">
              {pharmacy.telefone}
            </a>
          </div>
        </div>

        {pharmacy.status === 'Pendente' ? (
          <div className="mt-2 inline-flex items-center text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-lg border border-amber-300/60">
            ⏳ Em Homologação DPS • Tete
          </div>
        ) : availableCount !== undefined && availableCount > 0 ? (
          <div className="mt-2 inline-flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50/90 px-2.5 py-0.5 rounded-lg border border-emerald-200/50">
            ✓ {availableCount} remédios em estoque
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
            ✓ Farmácia Activa na Plataforma
          </div>
        )}

        {/* Health Insurance & Convénios Badge */}
        {pharmacy.aceita_seguro && (
          <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
              {pharmacy.tipo_estabelecimento === 'farmacia_clinica' ? 'Clínica & Seguro' : 'Aceita Seguro'}
            </span>
            {pharmacy.seguradoras && pharmacy.seguradoras.slice(0, 2).map((seg, idx) => (
              <span key={idx} className="text-[9px] font-medium text-slate-700 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-sm truncate max-w-[120px]">
                {seg.split(' ')[0]}
              </span>
            ))}
            {pharmacy.seguradoras && pharmacy.seguradoras.length > 2 && (
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded-sm">
                +{pharmacy.seguradoras.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <a
          href={getDirectionsUrl(pharmacy.latitude, pharmacy.longitude, pharmacy.nome)}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[38px] px-2.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all select-none shrink-0"
          title="Abrir rota no Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Mapa</span>
        </a>

        {/* Quick WhatsApp Chat Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="min-h-[38px] px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-all select-none shrink-0"
          title="Falar no WhatsApp da farmácia"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden xs:inline">WhatsApp</span>
        </a>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleSharePharmacy}
          className="min-h-[38px] px-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          title="Partilhar farmácia no WhatsApp ou redes"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <ClinicalButton
          variant="primary"
          size="sm"
          id={`select-pharmacy-${pharmacy.id}`}
          onClick={() => onSelect(pharmacy.id)}
          icon={<ChevronRight className="w-4 h-4" />}
          className="flex-1 text-xs"
        >
          Ver
        </ClinicalButton>
      </div>
    </div>
  );
};
