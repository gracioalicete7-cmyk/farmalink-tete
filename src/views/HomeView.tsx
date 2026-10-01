import React, { useState, useEffect, useMemo } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { UserLocation, Pharmacy, Medicine, PharmacyMedicine } from '../types';
import { AiSearchTicker } from '../components/AiSearchTicker';
import { PharmacyCard } from '../components/PharmacyCard';
import { MedicineCard } from '../components/MedicineCard';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { HomeHeroRealtimeDiscovery } from '../components/HomeHeroRealtimeDiscovery';
import { FeaturedPharmaciesCarousel } from '../components/FeaturedPharmaciesCarousel';
import { isPharmacyOpen, TETE_BAIRROS } from '../lib/geo';
import { QuickActionChip } from '../components/ClinicalPrecision';
import { OfflineHistoryService, CachedMedicineView, CachedPharmacyView } from '../lib/offlineHistory';
import {
  Search,
  MapPin,
  FileText,
  Store,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  HeartPulse,
  Building2,
  TrendingUp,
  Thermometer,
  Pill,
  Baby,
  Activity,
  Droplets,
  Bandage,
  ChevronDown,
  HelpCircle,
  Phone,
  ShieldAlert,
  Compass,
  WifiOff,
  History,
} from 'lucide-react';

interface HomeViewProps {
  userLocation: UserLocation | null;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  onSelectPharmacy: (pharmacyId: string) => void;
  onSelectMedicine: (medicineId: string) => void;
  onOrderMedicine: (medicine: Medicine, pharmacy: Pharmacy, stock: PharmacyMedicine) => void;
  onRequestUserLocation: () => void;
}

// Symptom & Clinical Need Categories for Tete
const HEALTH_CATEGORIES = [
  {
    id: 'malaria',
    symptomId: 'malaria',
    categoryFilter: 'Antimaláricos',
    title: 'Malária & Febre',
    subtitle: 'Coartem, Paracetamol, Testes Rápidos',
    icon: Thermometer,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200',
  },
  {
    id: 'antibioticos',
    symptomId: 'antibioticos',
    categoryFilter: 'Antibióticos',
    title: 'Antibióticos',
    subtitle: 'Amoxicilina, Azitromicina, Cipro',
    icon: Pill,
    color: 'from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200',
  },
  {
    id: 'dor-inflamacao',
    symptomId: 'dor-inflamacao',
    categoryFilter: 'Anti-inflamatórios e Analgésicos',
    title: 'Dor & Inflamação',
    subtitle: 'Ibuprofeno, Diclofenac, Paracetamol',
    icon: Activity,
    color: 'from-rose-500/10 to-pink-500/10 text-rose-700 border-rose-200',
  },
  {
    id: 'reidratacao',
    symptomId: 'reidratacao',
    categoryFilter: 'Reidratação e Eletrólitos',
    title: 'Digestão & SRO',
    subtitle: 'Sais de Reidratação Oral, Omeprazol',
    icon: Droplets,
    color: 'from-cyan-500/10 to-teal-500/10 text-cyan-700 border-cyan-200',
  },
  {
    id: 'hipertensao',
    symptomId: 'hipertensao',
    categoryFilter: 'Anti-hipertensor',
    title: 'Pressão & Coração',
    subtitle: 'Losartan, Amlodipina, Captopril, Atenolol',
    icon: HeartPulse,
    color: 'from-purple-500/10 to-violet-500/10 text-purple-700 border-purple-200',
  },
  {
    id: 'infantil',
    symptomId: 'infantil',
    categoryFilter: 'Saúde Pediátrica',
    title: 'Saúde Pediátrica',
    subtitle: 'Xaropes, Gotas, Zinco Pediátrico',
    icon: Baby,
    color: 'from-emerald-500/10 to-green-500/10 text-emerald-700 border-emerald-200',
  },
];

// Interactive FAQ Data
const FAQS = [
  {
    question: 'Como encontro uma farmácia aberta de noite em Tete?',
    answer:
      'Clique em "Plantão Nocturno" no topo do ecrã ou use o filtro "Plantão 24 Horas" para ver instantaneamente quais as farmácias com escala de serviço activa nesta noite em Tete.',
  },
  {
    question: 'Como funciona a solicitação e reserva de medicamentos?',
    answer:
      'Ao encontrar o medicamento com estoque disponível na farmácia desejada, clique em "Solicitar". É gerado um código de pedido que você apresenta ao balcão da farmácia para levantar o produto com prioridade.',
  },
  {
    question: 'Preciso de receita médica para levantar os medicamentos?',
    answer:
      'Para medicamentos assinalados com o selo "Receita Médica Obrigatória (R.M.)" (como antibióticos e psicotrópicos), deve apresentar a receita médica original emitida por um profissional de saúde ao levantar na farmácia.',
  },
  {
    question: 'Como consulto os preços dos medicamentos?',
    answer:
      'Para manter a equidade entre as farmácias e focar na saúde e urgência do paciente, os preços são consultados diretamente com o balcão da farmácia através de um clique rápido no botão de WhatsApp ou chamada telefónica, ou presencialmente no momento do levantamento.',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  userLocation,
  onNavigate,
  onSelectPharmacy,
  onSelectMedicine,
  onOrderMedicine,
  onRequestUserLocation,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedHomeBairro, setSelectedHomeBairro] = useState<string>('Todos os Bairros');
  const [recentOfflineMeds, setRecentOfflineMeds] = useState<CachedMedicineView[]>(() =>
    OfflineHistoryService.getRecentMedicines()
  );
  const [recentOfflinePharms, setRecentOfflinePharms] = useState<CachedPharmacyView[]>(() =>
    OfflineHistoryService.getRecentPharmacies()
  );

  useEffect(() => {
    let isMounted = true;
    const handleUpdate = () => {
      setTimeout(() => {
        if (isMounted) {
          setRecentOfflineMeds(OfflineHistoryService.getRecentMedicines());
          setRecentOfflinePharms(OfflineHistoryService.getRecentPharmacies());
          setRefreshKey((k) => k + 1);
        }
      }, 0);
    };
    window.addEventListener('farmalink_offline_cache_updated', handleUpdate);
    window.addEventListener('farmalink_storage_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('farmalink_offline_cache_updated', handleUpdate);
      window.removeEventListener('farmalink_storage_updated', handleUpdate);
    };
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);
  const approvedPharmacies = useMemo(() => FarmaLinkDB.getApprovedPharmacies(), [refreshKey]);
  const allMedicines = useMemo(() => FarmaLinkDB.getMedicines(), [refreshKey]);
  const allStocks = useMemo(() => FarmaLinkDB.getPharmacyMedicines(), [refreshKey]);

  // Filtered Pharmacies based on selected Bairro
  const displayedPharmacies = approvedPharmacies
    .filter((p) =>
      selectedHomeBairro === 'Todos os Bairros'
        ? true
        : p.bairro.toLowerCase().includes(selectedHomeBairro.toLowerCase())
    )
    .slice(0, 8);

  // Top Open Pharmacies in Tete
  const openPharmacies = approvedPharmacies
    .filter((p) => isPharmacyOpen(p.horario))
    .slice(0, 3);

  // Popular Medicines with their stock info
  const popularMedicines = allMedicines.slice(0, 4).map((med) => {
    const medStocks = allStocks
      .filter((s) => s.medicine_id === med.id)
      .map((stock) => ({
        stock,
        pharmacy: approvedPharmacies.find((p) => p.id === stock.pharmacy_id)!,
      }))
      .filter((item) => item.pharmacy);
    return {
      medicine: med,
      stocks: medStocks,
    };
  });

  return (
    <div id="farmalink-home-view" className="space-y-6 sm:space-y-8 pb-12">
      {/* 1. Hero Area with Animated AI Search (Requirements #13 & #14) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 text-white rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl">
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Província de Tete • Moçambique</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Encontre medicamentos nas farmácias de <span className="text-emerald-300">Tete</span>.
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-medium max-w-xl mx-auto leading-relaxed">
            Consulte a disponibilidade real em stock, dosagens, farmácias de plantão e localização nos bairros de Tete.
          </p>

          {/* Real-time Discovery Animated Showcase (Medicines & Pharmacies in Tete) */}
          <div className="py-2">
            <HomeHeroRealtimeDiscovery
              onSelectMedicine={(medId) => onSelectMedicine(medId)}
              onSelectPharmacy={(pharmId) => onSelectPharmacy(pharmId)}
              onSearch={(term) => onNavigate('medicines', { query: term })}
            />
          </div>

          {/* AI Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <AiSearchTicker
              onSearch={(term) => onNavigate('medicines', { query: term })}
              onSelectMedicine={(medId) => onSelectMedicine(medId)}
            />
          </div>

          {/* Quick Stats Pills */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-emerald-100 font-medium">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs">
              <Store className="w-4 h-4 text-emerald-300" />
              <span>{approvedPharmacies.length} Farmácias Verificadas</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs">
              <HeartPulse className="w-4 h-4 text-emerald-300" />
              <span>{allMedicines.length}+ Medicamentos Catalogados</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>Farmácias 24 Horas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Emergency 24h Night-Duty Alert Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20">
            <Clock className="w-6 h-6 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Plantão Nocturno
              </span>
              <h3 className="font-extrabold text-white text-sm sm:text-base">
                Precisa de Farmácia Aberta Agora?
              </h3>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Consulte a escala oficial de serviço 24h e farmácias autorizadas de plantão permanente em Tete.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('pharmacies', { filterNearby: false })}
          className="inline-flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all shrink-0 min-h-[48px] shadow-sm"
        >
          <span>Ver Farmácias Abertas</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Mandatory Disclaimer Banner (Requirement #15) */}
      <DisclaimerBanner />

      {/* 4. Quick Action Shortcuts (Requirement #13) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          id="quick-shortcut-search-meds"
          onClick={() => onNavigate('medicines')}
          className="bg-white hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Pesquisar Medicamentos</h3>
          <p className="text-xs text-slate-500 mt-0.5">Por nome, dosagem ou princípio ativo</p>
        </button>

        <button
          type="button"
          id="quick-shortcut-nearby-pharmacies"
          onClick={() => {
            onRequestUserLocation();
            onNavigate('pharmacies', { filterNearby: true });
          }}
          className="bg-white hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Farmácias Próximas</h3>
          <p className="text-xs text-slate-500 mt-0.5">Calcular distância por GPS em Tete</p>
        </button>

        <button
          type="button"
          id="quick-shortcut-orders"
          onClick={() => onNavigate('orders')}
          className="bg-white hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Meus Pedidos</h3>
          <p className="text-xs text-slate-500 mt-0.5">Acompanhar estado de levantamento</p>
        </button>

        <button
          type="button"
          id="quick-shortcut-map"
          onClick={() => onNavigate('map')}
          className="bg-white hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Mapa das Farmácias</h3>
          <p className="text-xs text-slate-500 mt-0.5">Visualizar no mapa interativo de Tete</p>
        </button>
      </section>

      {/* Offline Cache & Recently Viewed Section (Requirement: Service Worker / Offline Support) */}
      {(recentOfflineMeds.length > 0 || recentOfflinePharms.length > 0) && (
        <section className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                  <span>Consultados Recentemente</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Disponível Offline
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Medicamentos e farmácias guardados em cache para acesso imediato mesmo sem rede
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentOfflineMeds.slice(0, 3).map((item) => (
              <button
                key={item.medicine.id}
                type="button"
                onClick={() => onSelectMedicine(item.medicine.id)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Pill className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                    {item.medicine.nome}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{item.medicine.concentracao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {item.stocks.length} {item.stocks.length === 1 ? 'farmácia com estoque' : 'farmácias com estoque'}
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {recentOfflinePharms.slice(0, 2).map((item) => (
              <button
                key={item.pharmacy.id}
                type="button"
                onClick={() => onSelectPharmacy(item.pharmacy.id)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                    {item.pharmacy.nome}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{item.pharmacy.bairro}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-blue-400 font-semibold">
                      {item.pharmacy.horario}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Pharmacies Carousel (Top Rated & Stock Availability in Tete) */}
      <FeaturedPharmaciesCarousel
        userLocation={userLocation}
        onSelectPharmacy={(pharmacyId) => onSelectPharmacy(pharmacyId)}
        onViewAll={() => onNavigate('pharmacies')}
      />

      {/* 5. Health Needs & Frequent Clinical Categories (Intuitive 1-Click Search) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Pesquisa Rápida por Sintomas & Necessidades</span>
            </h2>
            <p className="text-xs text-slate-500">
              Selecione o sintoma ou categoria clínica para consultar stock nas farmácias
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {HEALTH_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                id={`cat-card-${cat.id}`}
                onClick={() => onNavigate('medicines', { symptom: cat.symptomId, category: cat.categoryFilter, label: cat.title })}
                className={`p-4 rounded-2xl border bg-gradient-to-br ${cat.color} hover:scale-[1.03] active:scale-[0.98] transition-all text-left flex flex-col justify-between min-h-[120px] shadow-2xs group`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm leading-tight text-slate-900">
                    {cat.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Neighborhood Filter Strip (Bairros de Tete) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>Farmácias por Bairro de Tete</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Toque para filtrar</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TETE_BAIRROS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedHomeBairro(b)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                selectedHomeBairro === b
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </section>

      {/* 7. Highlighted Pharmacies Open Now (Requirements #9 & #13) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Farmácias em Destaque {selectedHomeBairro !== 'Todos os Bairros' ? `em ${selectedHomeBairro}` : 'em Tete'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Farmácias aprovadas com atendimento activo e disponibilidade confirmada
            </p>
          </div>
          <button
            type="button"
            id="view-all-pharmacies-link"
            onClick={() => onNavigate('pharmacies')}
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Ver todas ({approvedPharmacies.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {displayedPharmacies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayedPharmacies.map((pharm) => {
              const medCount = allStocks.filter((s) => s.pharmacy_id === pharm.id).length;
              return (
                <PharmacyCard
                  key={pharm.id}
                  pharmacy={pharm}
                  userLocation={userLocation}
                  onSelect={onSelectPharmacy}
                  availableCount={medCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 space-y-2">
            <Store className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Nenhuma farmácia encontrada {selectedHomeBairro !== 'Todos os Bairros' ? `no Bairro ${selectedHomeBairro}` : 'neste momento'}.
            </p>
            {selectedHomeBairro !== 'Todos os Bairros' && (
              <button
                type="button"
                onClick={() => setSelectedHomeBairro('Todos os Bairros')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Ver farmácias em todos os bairros de Tete
              </button>
            )}
          </div>
        )}
      </section>

      {/* 8. Most Searched Medicines in Tete (Requirement #13) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Medicamentos Mais Procurados</span>
            </h2>
            <p className="text-xs text-slate-500">
              Consulte disponibilidade e estoque em tempo real nas farmácias da cidade
            </p>
          </div>
          <button
            type="button"
            id="view-all-medicines-link"
            onClick={() => onNavigate('medicines')}
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Catálogo Completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularMedicines.map(({ medicine, stocks }) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              pharmacyStocks={stocks}
              userLocation={userLocation}
              onOrder={onOrderMedicine}
              onSelectMedicine={onSelectMedicine}
              onSelectPharmacy={onSelectPharmacy}
            />
          ))}
        </div>
      </section>

      {/* 9. Interactive 3-Step Guide ("Como Funciona o FarmaLink Tete") */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simples, Rápido & Seguro</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold">Como Usar o FarmaLink em 3 Passos</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Sem complicações: encontre o que precisa e levante na farmácia sem filas nem deslocações em vão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-2xl border border-white/10 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-base text-white">Pesquise o Medicamento</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Escreva o nome comercial ou princípio ativo. O sistema pesquisa instantaneamente em todas as farmácias de Tete.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-2xl border border-white/10 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 font-black text-lg flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-base text-white">Consulte Stock & Distâncias</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Veja em tempo real onde há estoque disponível, dosagens homologadas e qual farmácia está mais perto do seu bairro.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-2xl border border-white/10 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-300 text-slate-950 font-black text-lg flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-base text-white">Reserve ou Visite a Farmácia</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Solicite a reserva gratuita com um toque ou trace a rota no mapa para se dirigir diretamente ao balcão.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Emergency Health & Urgent Numbers in Tete */}
      <section className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-amber-950 text-base">
              Linhas Telefónicas de Urgência em Tete
            </h3>
            <p className="text-xs text-amber-800 font-medium">
              Hospital Provincial de Tete: <span className="font-bold">+258 25 222 222</span> • Linha Nacional de Saúde: <span className="font-bold">110</span>
            </p>
          </div>
        </div>

        <a
          href="tel:110"
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs rounded-xl transition-all shrink-0 flex items-center gap-2 shadow-2xs"
        >
          <Phone className="w-4 h-4" />
          <span>Ligar Linha 110 (Grátis)</span>
        </a>
      </section>

      {/* 11. Interactive FAQ Section (Dúvidas Frequentes) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Perguntas Frequentes (FAQ)
          </h2>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-100/70 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 12. Technical Director Banner call to register */}
      <section className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/60 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
            <Building2 className="w-3.5 h-3.5" />
            <span>Para Farmácias e Directores Técnicos</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">É Director Técnico de uma Farmácia em Tete?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Cadastre a sua farmácia no FarmaLink Tete. Faça a gestão do estoque, atualize preços em Meticais e receba solicitações de medicamentos de utentes de toda a província.
          </p>
        </div>

        <button
          type="button"
          id="home-register-pharmacy-btn"
          onClick={() => onNavigate('director-portal', { tab: 'register' })}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md transition-all shrink-0 flex items-center gap-2"
        >
          <span>Cadastrar Minha Farmácia</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
