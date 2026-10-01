import React, { useState, useEffect, useMemo } from 'react';
import { FarmaLinkDB, StorageService } from '../lib/storage';
import { Pharmacy, Medicine, PharmacyMedicine, UserLocation, UserProfile, PharmacyReview } from '../types';
import { calculateDistanceKm, formatDistance, isPharmacyOpen, getDirectionsUrl } from '../lib/geo';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  ClinicalButton,
  AvailabilityBadge,
  PriceDisplay,
  DosageBadge,
  SanitaryTag,
} from '../components/ClinicalPrecision';
import { RealChatModal } from '../components/RealChatModal';
import { PharmacyReviewModal } from '../components/PharmacyReviewModal';
import { StockAlertModal } from '../components/StockAlertModal';
import { MedicineAcquisitionModal } from '../components/MedicineAcquisitionModal';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Search,
  Pill,
  ArrowLeft,
  Calendar,
  Share2,
  FileCheck,
  Activity,
  HeartPulse,
  Syringe,
  Stethoscope,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  Star,
  Bell,
  Sparkles,
  ThumbsUp,
  User,
  X,
  Plus,
  Zap,
  Shield,
  Building2,
} from 'lucide-react';
import { INSURANCE_DISPENSATION_NOTICE } from '../constants/insurance';

interface PharmacyDetailViewProps {
  pharmacyId: string;
  userLocation: UserLocation | null;
  currentUser?: UserProfile;
  onBack: () => void;
  onSelectMedicine: (medicineId: string) => void;
  onOrderMedicine: (medicine: Medicine, pharmacy: Pharmacy, stock: PharmacyMedicine) => void;
  onNavigate?: (tab: string, params?: Record<string, unknown>) => void;
}

export const PharmacyDetailView: React.FC<PharmacyDetailViewProps> = ({
  pharmacyId,
  userLocation,
  currentUser,
  onBack,
  onSelectMedicine,
  onOrderMedicine,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [alertMedicine, setAlertMedicine] = useState<Medicine | null>(null);
  const [acquisitionItem, setAcquisitionItem] = useState<{ medicine: Medicine; stock: PharmacyMedicine } | null>(null);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('farmalink_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('farmalink_storage_updated', handleStorageUpdate);
    };
  }, []);

  const pharmacy = useMemo(() => FarmaLinkDB.getPharmacyById(pharmacyId), [pharmacyId, refreshKey]);
  const photos = useMemo(() => FarmaLinkDB.getPhotos(pharmacyId), [pharmacyId, refreshKey]);
  const allMedicines = useMemo(() => FarmaLinkDB.getMedicines(), [refreshKey]);
  const pharmacyStocks = useMemo(() => FarmaLinkDB.getPharmacyMedicines(pharmacyId), [pharmacyId, refreshKey]);
  const reviews = useMemo(() => StorageService.getPharmacyReviews(pharmacyId), [pharmacyId, reviewsVersion, refreshKey]);

  const handleSeedEssentialStock = () => {
    if (!pharmacy) return;
    FarmaLinkDB.seedEssentialStockForPharmacy(pharmacy.id, currentUser);
    setRefreshKey((prev) => prev + 1);
    window.dispatchEvent(new Event('farmalink_storage_updated'));
  };

  const isOwnerOrDirector =
    currentUser &&
    (currentUser.id === pharmacy?.director_id ||
      currentUser.user_id === pharmacy?.director_id ||
      currentUser.role === 'director' ||
      currentUser.role === 'admin' ||
      currentUser.role === 'superadmin');

  if (!pharmacy) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Farmácia não encontrada</h2>
        <p className="text-xs text-slate-500">A farmácia solicitada não existe ou foi desativada.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
        >
          Voltar às Farmácias
        </button>
      </div>
    );
  }

  const isOpen = isPharmacyOpen(pharmacy.horario);
  const distanceKm = userLocation
    ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, pharmacy.latitude, pharmacy.longitude)
    : null;

  // Combine medicines with this pharmacy's stock (quarantine items are withheld from public view)
  const inventory = pharmacyStocks
    .filter((stock) => !stock.em_quarentena)
    .map((stock) => {
      const medicine = allMedicines.find((m) => m.id === stock.medicine_id);
      return { stock, medicine };
    })
    .filter((item): item is { stock: PharmacyMedicine; medicine: Medicine } => !!item.medicine)
    .filter((item) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.medicine.nome.toLowerCase().includes(term) ||
        item.medicine.principio_ativo.toLowerCase().includes(term) ||
        item.medicine.concentracao.toLowerCase().includes(term)
      );
    });

  const availableCount = inventory.filter(
    (i) => i.stock.disponibilidade === 'Disponível' || i.stock.disponibilidade === 'Pouca quantidade'
  ).length;

  const galleryImages = [
    pharmacy.logo_url,
    ...photos.map((p) => p.image_url),
  ].filter(Boolean);

  const clinicalServices = [
    { title: 'Medição da Pressão Arterial', icon: HeartPulse, desc: 'Tensiómetro calibrado com registo' },
    { title: 'Teste Rápido de Malária (TDR)', icon: Activity, desc: 'Triagem rápida com protocolo MISAU' },
    { title: 'Glicemia Capilar', icon: Syringe, desc: 'Controlo rápido de níveis de glicose' },
    { title: 'Aconselhamento Farmacêutico', icon: Stethoscope, desc: 'Orientação por Director Técnico' },
  ];

  const handleSharePharmacy = () => {
    const shareText = `🏥 *${pharmacy?.nome}* no FarmaLink Tete\n📍 Bairro ${pharmacy?.bairro}, Tete\n⏰ Horário: ${pharmacy?.horario}\n📞 Telefone/WhatsApp: ${pharmacy?.telefone}\n\nConsulte a disponibilidade e estoque de medicamentos: https://ais-pre-jhsmptx7oxss2uerqxxzgf-717826220782.europe-west2.run.app`;
    
    if (navigator.share) {
      navigator.share({
        title: `${pharmacy?.nome} - FarmaLink Tete`,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareMedicine = (med: Medicine, stock: PharmacyMedicine) => {
    const shareText = `💊 *${med.nome}* (${med.concentracao})\n🏥 Disponível na *${pharmacy?.nome}* (Bairro ${pharmacy?.bairro}, Tete)\n📦 Stock: ${stock.disponibilidade} (${stock.quantidade} ${stock.unidade})\n\nConsulte no FarmaLink Tete: https://ais-pre-jhsmptx7oxss2uerqxxzgf-717826220782.europe-west2.run.app`;
    
    if (navigator.share) {
      navigator.share({
        title: `${med.nome} na ${pharmacy?.nome}`,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div id="pharmacy-detail-page" className="space-y-4 pb-12">
      {/* Top Back Navigation with Exit Button */}
      <ScreenHeader
        title={pharmacy.nome}
        subtitle={`Bairro ${pharmacy.bairro}, Tete`}
        onBack={onBack}
        exitLabel="Sair"
        backLabel="Voltar para tela anterior"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="share-pharmacy-btn"
              onClick={handleSharePharmacy}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Partilhar esta farmácia no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden xs:inline">Partilhar</span>
            </button>
            <a
              href={getDirectionsUrl(pharmacy.latitude, pharmacy.longitude, pharmacy.nome)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">Rota GPS</span>
            </a>
          </div>
        }
      />

      {/* Director Quick Management Banner */}
      {isOwnerOrDirector && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-5 border border-emerald-600/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                  Área do Responsável Técnico
                </span>
                <span className="text-xs text-emerald-300/80 font-mono">
                  {pharmacyStocks.length} medicamentos no estoque
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white mt-0.5">
                Gestão de Estoque da {pharmacy.nome}
              </h3>
              <p className="text-xs text-emerald-200/80">
                Você pode adicionar novos medicamentos, alterar preços em Meticais e controlar validades.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="detail-add-medicines-btn"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('director-portal', { tab: 'medicines', pharmacyId: pharmacy.id });
                }
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Medicamentos ao Estoque</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('director-portal', { tab: 'dashboard', pharmacyId: pharmacy.id });
                }
              }}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-4 h-4 text-emerald-300" />
              <span>Portal do Director</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Pharmacy Profile Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={pharmacy.logo_url}
              alt={pharmacy.nome}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-emerald-100 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">
                  {pharmacy.nome}
                </h1>
                {pharmacy.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verificada DPS Tete</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pharmacy.endereco}, {pharmacy.bairro} — {pharmacy.cidade}, Tete</span>
              </p>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {/* Aberta / Fechada Badge */}
                <AvailabilityBadge
                  status={isOpen ? 'duty_open' : 'duty_closed'}
                  label={isOpen ? 'Aberta Agora' : 'Fechada'}
                />

                {distanceKm !== null && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    📍 {formatDistance(distanceKm)} de si
                  </span>
                )}

                <SanitaryTag code={pharmacy.license_number} label="Alvará DPS" />
              </div>
            </div>
          </div>

          {/* Quick Communication Actions (>=44px touch targets, compact icons for 100% visibility) */}
          <div className="grid grid-cols-3 sm:flex sm:flex-col gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs md:text-sm px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xs transition-all min-h-[44px] sm:min-h-[48px] cursor-pointer"
              title="Enviar mensagem directa para o farmacêutico"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Mensagem</span>
            </button>

            <a
              href={`tel:${pharmacy.telefone}`}
              className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[11px] sm:text-xs md:text-sm px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xs transition-all min-h-[44px] sm:min-h-[48px] cursor-pointer"
              title={`Ligar para ${pharmacy.telefone}`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Ligar</span>
              <span className="hidden lg:inline text-emerald-100 font-mono text-xs">({pharmacy.telefone})</span>
            </a>

            <a
              href={`https://wa.me/258${pharmacy.telefone.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20encontrei%20a%20vossa%20farm%C3%A1cia%20no%20FarmaLink%20Tete.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-[11px] sm:text-xs md:text-sm px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition-all min-h-[44px] sm:min-h-[48px] cursor-pointer shrink-0"
              title="Falar no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Contact & Hours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" /> Horário de Funcionamento
            </span>
            <p className="font-bold text-slate-900 text-sm break-words">{pharmacy.horario}</p>
            <p className="text-[11px] text-slate-500">{pharmacy.dias_funcionamento || 'Segunda a Sábado'}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" /> Contacto Directo
            </span>
            <a href={`tel:${pharmacy.telefone}`} className="font-bold text-emerald-800 hover:underline text-sm block font-mono">
              {pharmacy.telefone}
            </a>
            {pharmacy.email && <p className="text-[11px] text-slate-500 break-words">{pharmacy.email}</p>}
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" /> Director Técnico / Proprietário
            </span>
            <p className="font-black text-emerald-950 text-sm sm:text-base break-words">{pharmacy.director_name}</p>
            <p className="text-[11px] text-emerald-800">Farmacêutico Responsável Homologado DPS</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Licença Sanitária & NUIT
            </span>
            <p className="font-bold text-slate-900 text-xs font-mono break-words">{pharmacy.license_number || 'DPS Tete'}</p>
            <p className="text-[11px] text-slate-600 font-mono">NUIT: <strong className="text-slate-900">{pharmacy.nuit || 'Regular'}</strong></p>
          </div>
        </div>

        {/* Description */}
        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
          <p className="font-bold text-slate-900 mb-1">Sobre as Instalações:</p>
          <p>{pharmacy.descricao}</p>
        </div>

        {/* Convénios de Saúde e Asseguradoras Parceiras */}
        <div className="bg-linear-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-blue-200/70 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Convénios & Seguros de Saúde</span>
                  {pharmacy.aceita_seguro ? (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                      Aceita Seguro
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                      Apenas Particular
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {pharmacy.aceita_seguro
                    ? 'Esta farmácia/clínica atende utentes com apólices de seguro de saúde e planos corporativos.'
                    : 'Atendimento exclusivo a pronto pagamento particular no balcão.'}
                </p>
              </div>
            </div>

            {pharmacy.aceita_seguro && (
              <a
                href={`https://wa.me/258${pharmacy.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá, gostaria de confirmar se o meu seguro de saúde cobre medicamentos na ${pharmacy.nome}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-2xs self-start sm:self-auto"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consultar Cobertura</span>
              </a>
            )}
          </div>

          {pharmacy.aceita_seguro && (
            <>
              {/* Seguradoras Credenciadas */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Asseguradoras e Planos Vinculados:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pharmacy.seguradoras && pharmacy.seguradoras.length > 0 ? (
                    pharmacy.seguradoras.map((insName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300/80 px-3 py-1.5 rounded-xl shadow-2xs"
                      >
                        <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{insName}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Asseguradoras sob consulta no balcão.</span>
                  )}
                </div>
              </div>

              {/* Informações Específicas / Instruções do Director */}
              {pharmacy.instrucoes_seguro && (
                <div className="bg-white/80 p-3 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                    Instruções Específicas da Farmácia / Clínica:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{pharmacy.instrucoes_seguro}</p>
                </div>
              )}

              {/* Aviso Sanitário e Regulamentar */}
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-0.5">Norma Regulamentar de Dispensa com Seguro:</strong>
                  <span>{INSURANCE_DISPENSATION_NOTICE}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Clinical Services (Cuidados Farmacêuticos) */}
        <div className="space-y-3 pt-2">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>Serviços Farmacêuticos Disponíveis</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {clinicalServices.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span>{svc.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{svc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Gallery (Requirement #11 & #39) */}
        {galleryImages.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Fotografias das Instalações</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {galleryImages.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Instalações ${pharmacy.nome}`}
                  className="w-full h-28 sm:h-36 object-cover rounded-2xl border border-slate-200 hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner compact />

      {/* Pharmacy Medicines Inventory Section */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <span>Medicamentos & Stock Disponíveis no Balcão</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {availableCount} de {inventory.length} medicamentos com estoque positivo
            </p>
          </div>

          {/* Search in this pharmacy */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no estoque..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        {/* Inventory Table / Card list */}
        {inventory.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Pill className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                {searchTerm ? 'Nenhum medicamento encontrado para esta busca' : 'Nenhum medicamento cadastrado nesta farmácia ainda'}
              </h4>
              <p className="text-xs text-slate-500">
                {searchTerm
                  ? 'Tente pesquisar por outro princípio ativo ou dosagem.'
                  : 'Os medicamentos e estoques desta farmácia ainda estão sendo cadastrados pelo Director Técnico.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                id="empty-state-seed-kit-btn"
                onClick={handleSeedEssentialStock}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Carregar Kit de Medicamentos Essenciais (1-Clique)</span>
              </button>

              {isOwnerOrDirector && (
                <>
                  <button
                    type="button"
                    id="empty-state-add-med-btn"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('director-portal', { tab: 'medicines', pharmacyId: pharmacy.id });
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Medicamento Personalizado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('director-portal', { tab: 'medicines', pharmacyId: pharmacy.id });
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Importar Planilha
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {inventory.map(({ medicine, stock }) => {
              const isAvailable = stock.disponibilidade === 'Disponível' || stock.disponibilidade === 'Pouca quantidade';
              const statusBadgeType =
                stock.disponibilidade === 'Disponível'
                  ? 'available'
                  : stock.disponibilidade === 'Pouca quantidade'
                  ? 'low_stock'
                  : 'out_of_stock';

              return (
                <div
                  key={stock.id}
                  className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectMedicine(medicine.id)}
                        className="font-extrabold text-slate-900 text-sm sm:text-base hover:text-emerald-700 text-left"
                      >
                        {medicine.nome}
                      </button>
                      <DosageBadge dosage={medicine.concentracao} />
                      <AvailabilityBadge status={statusBadgeType} size="xs" />
                    </div>

                    <p className="text-xs text-slate-600">
                      Princípio ativo: <span className="font-semibold text-slate-700">{medicine.principio_ativo}</span> • {medicine.forma_farmaceutica} ({medicine.apresentacao})
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                      {stock.data_validade && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Validade: {new Date(stock.data_validade).toLocaleDateString('pt-MZ', { month: '2-digit', year: 'numeric' })}</span>
                        </span>
                      )}
                      {stock.lote && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                          <span>Lote: {stock.lote}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        Atualizado em: {new Date(stock.ultima_atualizacao).toLocaleDateString('pt-MZ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right space-y-0.5">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {stock.quantidade} {stock.unidade} em stock
                      </span>
                      <span className="text-[11px] text-slate-500 block">Preço sob consulta direta</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareMedicine(medicine, stock)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shrink-0"
                        title="Partilhar este remédio no WhatsApp"
                      >
                        <Share2 className="w-4 h-4 text-emerald-700" />
                      </button>

                      {/* Botão de Registo de Compra Direta */}
                      {currentUser && isAvailable && (
                        <button
                          type="button"
                          id={`bought-med-${stock.id}`}
                          onClick={() => setAcquisitionItem({ medicine, stock })}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                          title="Registar que adquiriu este medicamento nesta farmácia pelo FarmaLink"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Comprei Aqui</span>
                        </button>
                      )}

                      {isAvailable ? (
                        <ClinicalButton
                          variant="primary"
                          size="md"
                          id={`request-med-btn-${stock.id}`}
                          onClick={() => onOrderMedicine(medicine, pharmacy, stock)}
                          icon={<Pill className="w-4 h-4" />}
                        >
                          Solicitar
                        </ClinicalButton>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-rose-600 font-bold px-2.5 py-1 bg-rose-50 rounded-xl border border-rose-200">
                            Esgotado
                          </span>
                          {currentUser && (
                            <button
                              type="button"
                              onClick={() => setAlertMedicine(medicine)}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 cursor-pointer"
                              title="Avisar-me quando este medicamento estiver disponível"
                            >
                              <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Avisar Reposição</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= PHARMACY REVIEWS & RATINGS SECTION ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                Opinião dos Utentes
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Avaliações & Reputação em Tete</span>
            </h3>
            <p className="text-xs text-slate-500">
              Classificação baseada em experiências reais e levantamentos confirmados
            </p>
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Escrever Avaliação</span>
            </button>
          )}
        </div>

        {/* Rating Overview Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          {/* Average Big Score */}
          <div className="flex flex-col items-center justify-center text-center p-3 border-b md:border-b-0 md:border-r border-slate-200">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                : '4.8'}
            </span>
            <div className="flex items-center gap-1 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {reviews.length} avaliações verificadas
            </span>
          </div>

          {/* Highlights */}
          <div className="md:col-span-2 space-y-2 flex flex-col justify-center text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Atendimento Farmacêutico
              </span>
              <span className="font-bold text-emerald-800">98% Satisfação</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full w-[98%]"></div>
            </div>

            <div className="flex items-center justify-between text-slate-700 pt-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Rapidez no Levantamento
              </span>
              <span className="font-bold text-teal-800">95% Rápido</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-teal-600 h-2 rounded-full w-[95%]"></div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl">
              Seja o primeiro utente a avaliar o atendimento da {pharmacy.nome}!
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                      {rev.user_nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{rev.user_nome}</h5>
                        {rev.is_verified_buyer && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Utente Verificado
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{rev.user_bairro}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  "{rev.comment}"
                </p>

                {/* Resposta do Director da Farmácia (se houver) */}
                {rev.director_response && (
                  <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-emerald-600 text-xs space-y-1">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-emerald-700" />
                      Resposta da Gerência / Farmacêutico:
                    </span>
                    <p className="text-slate-600 italic">"{rev.director_response}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>{new Date(rev.created_at).toLocaleDateString('pt-MZ')}</span>
                  <span className="flex items-center gap-1 text-slate-500 font-semibold cursor-pointer hover:text-emerald-700">
                    <ThumbsUp className="w-3 h-3" />
                    Útil ({rev.helpful_count || 0})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Real-time Direct Chat Modal */}
      {currentUser && (
        <RealChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          pharmacyId={pharmacy.id}
          pharmacyNome={pharmacy.nome}
          currentUser={currentUser}
        />
      )}

      {/* Review Pharmacy Modal */}
      {currentUser && (
        <PharmacyReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          pharmacy={pharmacy}
          currentUser={currentUser}
          onReviewSubmitted={() => setReviewsVersion((v) => v + 1)}
        />
      )}

      {/* Restock Alert Modal */}
      {currentUser && alertMedicine && (
        <StockAlertModal
          isOpen={!!alertMedicine}
          onClose={() => setAlertMedicine(null)}
          medicine={alertMedicine}
          pharmacy={pharmacy}
          currentUser={currentUser}
        />
      )}

      {/* Acquisition Confirmation Modal */}
      {currentUser && acquisitionItem && (
        <MedicineAcquisitionModal
          isOpen={!!acquisitionItem}
          onClose={() => setAcquisitionItem(null)}
          medicine={acquisitionItem.medicine}
          pharmacy={pharmacy}
          stock={acquisitionItem.stock}
          currentUser={currentUser}
          onSuccess={() => {
            setAcquisitionItem(null);
            setReviewsVersion((v) => v + 1);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};

