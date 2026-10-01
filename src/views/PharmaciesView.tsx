import React, { useState, useEffect, useMemo } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { Pharmacy, UserLocation } from '../types';
import { PharmacyCard } from '../components/PharmacyCard';
import { MapView } from '../components/MapView';
import { calculateDistanceKm, isPharmacyOpen, TETE_BAIRROS } from '../lib/geo';
import { QuickActionChip } from '../components/ClinicalPrecision';
import { VoiceSearchModal } from '../components/VoiceSearchModal';
import { VoiceSearchResult } from '../lib/voiceSearch';
import { ScreenHeader } from '../components/ScreenHeader';
import { Store, MapPin, Grid, Map, Search, Clock, Compass, Sparkles, Filter, CheckCircle2, Mic, X, ShieldCheck } from 'lucide-react';
import { MOZAMBIQUE_INSURANCE_COMPANIES } from '../constants/insurance';

interface PharmaciesViewProps {
  userLocation: UserLocation | null;
  onSelectPharmacy: (pharmacyId: string) => void;
  onRequestUserLocation: () => void;
  initialFilterNearby?: boolean;
  onBack?: () => void;
}

export const PharmaciesView: React.FC<PharmaciesViewProps> = ({
  userLocation,
  onSelectPharmacy,
  onRequestUserLocation,
  initialFilterNearby = false,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBairro, setSelectedBairro] = useState('Todos os Bairros');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [only24h, setOnly24h] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(initialFilterNearby);
  const [onlyInsurance, setOnlyInsurance] = useState(false);
  const [selectedInsurer, setSelectedInsurer] = useState('Todas as Seguradoras');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleVoiceSearchResult = (result: VoiceSearchResult) => {
    setSearchTerm(result.cleanedQuery);
    if (result.filterBairro) {
      setSelectedBairro(result.filterBairro);
    }
    if (result.filter24h) {
      setOnly24h(true);
    }
    if (result.filterOpen) {
      setOnlyOpen(true);
    }
  };

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('farmalink_storage_updated', handleUpdate);
    return () => window.removeEventListener('farmalink_storage_updated', handleUpdate);
  }, []);

  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const allPharmacies = useMemo(() => FarmaLinkDB.getPharmacies(), [refreshKey]);
  const approvedPharmacies = useMemo(() => FarmaLinkDB.getApprovedPharmacies(), [refreshKey]);
  const pendingPharmacies = useMemo(() => allPharmacies.filter((p) => p.status === 'Pendente'), [allPharmacies]);
  const allStocks = useMemo(() => FarmaLinkDB.getPharmacyMedicines(), [refreshKey]);

  const basePharmacies = useMemo(() => {
    if (statusFilter === 'approved') return approvedPharmacies;
    if (statusFilter === 'pending') return pendingPharmacies;
    return allPharmacies;
  }, [statusFilter, approvedPharmacies, pendingPharmacies, allPharmacies]);

  const filteredPharmacies = useMemo(() => {
    const termLower = searchTerm.toLowerCase().trim();

    return basePharmacies
      .filter((pharm) => {
        // Name, address and insurer search
        const matchesQuery =
          !termLower ||
          pharm.nome.toLowerCase().includes(termLower) ||
          pharm.endereco.toLowerCase().includes(termLower) ||
          pharm.bairro.toLowerCase().includes(termLower) ||
          pharm.director_name.toLowerCase().includes(termLower) ||
          (pharm.seguradoras && pharm.seguradoras.some((s) => s.toLowerCase().includes(termLower)));

        // Bairro filter
        const matchesBairro =
          selectedBairro === 'Todos os Bairros' ||
          pharm.bairro.toLowerCase().includes(selectedBairro.toLowerCase());

        // Open filter
        const matchesOpen = !onlyOpen || isPharmacyOpen(pharm.horario);

        // 24h filter
        const matches24h =
          !only24h ||
          pharm.horario.toLowerCase().includes('24') ||
          pharm.horario.toLowerCase().includes('permanente');

        // Health Insurance filter
        const matchesInsurance = !onlyInsurance || Boolean(pharm.aceita_seguro);

        // Specific Insurer filter
        const matchesInsurer =
          selectedInsurer === 'Todas as Seguradoras' ||
          (Boolean(pharm.aceita_seguro) &&
            pharm.seguradoras &&
            pharm.seguradoras.some(
              (s) =>
                s.toLowerCase().includes(selectedInsurer.toLowerCase()) ||
                selectedInsurer.toLowerCase().includes(s.toLowerCase())
            ));

        return matchesQuery && matchesBairro && matchesOpen && matches24h && matchesInsurance && matchesInsurer;
      })
      .sort((a, b) => {
        if (sortByDistance && userLocation) {
          const distA = calculateDistanceKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
          const distB = calculateDistanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
          return distA - distB;
        }
        // By default open pharmacies first
        const openA = isPharmacyOpen(a.horario) ? 1 : 0;
        const openB = isPharmacyOpen(b.horario) ? 1 : 0;
        if (openB !== openA) return openB - openA;
        return a.nome.localeCompare(b.nome);
      });
  }, [basePharmacies, searchTerm, selectedBairro, onlyOpen, only24h, sortByDistance, onlyInsurance, selectedInsurer, userLocation]);

  return (
    <div id="pharmacies-directory-view" className="space-y-4 pb-12">
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Directório de Farmácias"
          subtitle="Rede de Farmácias em Tete"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-emerald-600" />
              <span>Farmácias em Tete</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Consulte horários de funcionamento, localização GPS e disponibilidade nas farmácias autorizadas de Tete.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto border border-slate-200">
            <button
              type="button"
              id="view-mode-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all min-h-[40px] ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              id="view-mode-map-btn"
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all min-h-[40px] ${
                viewMode === 'map'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Mapa Interativo</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all min-h-[52px]">
            <Search className="w-5 h-5 text-emerald-600 ml-2 shrink-0" />
            <input
              id="pharmacy-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome da farmácia, bairro ou director técnico..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 font-medium focus:outline-none placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-200/60 rounded-lg shrink-0 cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              id="pharmacy-voice-search-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2.5 rounded-xl bg-teal-100/80 hover:bg-teal-200 text-teal-800 flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
              title="Pesquisar farmácia por voz"
            >
              <Mic className="w-4 h-4 text-teal-700 animate-pulse" />
              <span className="hidden sm:inline">Voz</span>
            </button>
          </div>
        </div>

        {/* Quick Action Filter Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({allPharmacies.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aprovadas ({approvedPharmacies.length})
            </button>
            {pendingPharmacies.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                Em Homologação ({pendingPharmacies.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <QuickActionChip
              label="Abertas Agora"
              active={onlyOpen}
              color="emerald"
              onClick={() => setOnlyOpen(!onlyOpen)}
            />

            <QuickActionChip
              label="Plantão 24 Horas"
              icon={<Clock className="w-3.5 h-3.5" />}
              active={only24h}
              color="blue"
              onClick={() => setOnly24h(!only24h)}
            />

            <QuickActionChip
              label="Aceitam Seguro 🛡️"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              active={onlyInsurance}
              color="emerald"
              onClick={() => setOnlyInsurance(!onlyInsurance)}
            />

            <QuickActionChip
              label="Mais Próximas de Mim"
              icon={<Compass className="w-3.5 h-3.5" />}
              active={sortByDistance}
              color="purple"
              onClick={() => {
                if (!userLocation) {
                  onRequestUserLocation();
                }
                setSortByDistance(!sortByDistance);
              }}
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 flex items-center gap-2 min-h-[44px]">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <select
                id="pharmacy-bairro-select"
                value={selectedBairro}
                onChange={(e) => setSelectedBairro(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                {TETE_BAIRROS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Asseguradora Selector */}
            <div className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 flex items-center gap-2 min-h-[44px]">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                id="pharmacy-insurer-select"
                value={selectedInsurer}
                onChange={(e) => {
                  setSelectedInsurer(e.target.value);
                  if (e.target.value !== 'Todas as Seguradoras') {
                    setOnlyInsurance(true);
                  }
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todas as Seguradoras">Todas as Asseguradoras</option>
                {MOZAMBIQUE_INSURANCE_COMPANIES.map((ins) => (
                  <option key={ins.id} value={ins.name}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Grid vs Interactive Map */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <MapView
            pharmacies={filteredPharmacies}
            userLocation={userLocation}
            onSelectPharmacy={onSelectPharmacy}
            onRequestUserLocation={onRequestUserLocation}
            selectedBairro={selectedBairro}
            onBairroChange={setSelectedBairro}
            height="h-[550px]"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Mostrando <span className="font-bold text-slate-900">{filteredPharmacies.length}</span> farmácias autorizadas em Tete
              {onlyInsurance && <span className="text-blue-700 font-bold ml-1">• com convénio de seguro</span>}
              {selectedInsurer !== 'Todas as Seguradoras' && <span className="text-blue-800 font-bold ml-1">({selectedInsurer})</span>}
            </span>
            {(onlyInsurance || selectedInsurer !== 'Todas as Seguradoras') && (
              <button
                type="button"
                onClick={() => {
                  setOnlyInsurance(false);
                  setSelectedInsurer('Todas as Seguradoras');
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
              >
                Limpar filtros de seguro
              </button>
            )}
          </div>

          {filteredPharmacies.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Nenhuma farmácia encontrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Verifique os filtros aplicados ou escolha outro bairro de Tete.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBairro('Todos os Bairros');
                  setOnlyOpen(false);
                  setOnly24h(false);
                  setSortByDistance(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Restaurar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPharmacies.map((pharm) => {
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
          )}
        </div>
      )}

      {/* Voice Search Modal */}
      {isVoiceModalOpen && (
        <VoiceSearchModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectSearch={handleVoiceSearchResult}
          defaultType="pharmacy"
        />
      )}
    </div>
  );
};

