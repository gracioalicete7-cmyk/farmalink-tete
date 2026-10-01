import React, { useState, useEffect, useMemo } from 'react';
import { FarmaLinkDB } from '../lib/storage';
import { Medicine, Pharmacy, PharmacyMedicine, UserLocation } from '../types';
import { MedicineCard } from '../components/MedicineCard';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { calculateDistanceKm, TETE_BAIRROS, isPharmacyOpen } from '../lib/geo';
import { QuickActionChip } from '../components/ClinicalPrecision';
import { sanitizeSearchTerm, detectMaliciousPayload } from '../lib/security';
import { VoiceSearchModal } from '../components/VoiceSearchModal';
import { VoiceSearchResult } from '../lib/voiceSearch';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Clock,
  Lock,
  Pill,
  HeartPulse,
  Baby,
  ShieldCheck,
  Tag,
  HelpCircle,
  Mic,
  X,
} from 'lucide-react';

interface MedicineSearchViewProps {
  userLocation: UserLocation | null;
  initialQuery?: string;
  initialCategory?: string;
  initialSymptom?: string;
  initialLabel?: string;
  onSelectMedicine: (medicineId: string) => void;
  onSelectPharmacy: (pharmacyId: string) => void;
  onOrderMedicine: (medicine: Medicine, pharmacy: Pharmacy, stock: PharmacyMedicine) => void;
  onRequestUserLocation: () => void;
  onBack?: () => void;
}

export const MedicineSearchView: React.FC<MedicineSearchViewProps> = ({
  userLocation,
  initialQuery = '',
  initialCategory = '',
  initialSymptom = '',
  initialLabel = '',
  onSelectMedicine,
  onSelectPharmacy,
  onOrderMedicine,
  onRequestUserLocation,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedBairro, setSelectedBairro] = useState('Todos os Bairros');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'Todas as Categorias');
  const [activeSymptom, setActiveSymptom] = useState(initialSymptom || '');
  const [activeSymptomLabel, setActiveSymptomLabel] = useState(initialLabel || '');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyDuty24h, setOnlyDuty24h] = useState(false);
  const [prescriptionFilter, setPrescriptionFilter] = useState<'all' | 'rx_only' | 'otc_only'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'availability' | 'distance'>('availability');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSymptom) {
      setActiveSymptom(initialSymptom);
      setActiveSymptomLabel(initialLabel || '');
    }
  }, [initialSymptom, initialLabel]);

  const handleVoiceSearchResult = (result: VoiceSearchResult) => {
    setSearchTerm(result.cleanedQuery);
    if (result.filterBairro) {
      setSelectedBairro(result.filterBairro);
    }
    if (result.filter24h) {
      setOnlyDuty24h(true);
    }
  };

  const [storageTick, setStorageTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setStorageTick((t) => t + 1);
    window.addEventListener('farmalink_storage_updated', handleUpdate);
    return () => window.removeEventListener('farmalink_storage_updated', handleUpdate);
  }, []);

  const allMedicines = useMemo(() => FarmaLinkDB.getMedicines(), [storageTick]);
  const approvedPharmacies = useMemo(() => FarmaLinkDB.getApprovedPharmacies(), [storageTick]);
  const allStocks = useMemo(() => FarmaLinkDB.getPharmacyMedicines(), [storageTick]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allMedicines.forEach((m) => {
      if (m.categoria) set.add(m.categoria);
    });
    return ['Todas as Categorias', ...Array.from(set)];
  }, [allMedicines]);

  // Frequent search suggestions in Tete
  const popularKeywords = [
    { label: 'Coartem / Malária', query: 'Coartem' },
    { label: 'Paracetamol', query: 'Paracetamol' },
    { label: 'Amoxicilina', query: 'Amoxicilina' },
    { label: 'Omeprazol', query: 'Omeprazol' },
    { label: 'Losartan', query: 'Losartan' },
    { label: 'SRO (Sais Reidratação)', query: 'Sais' },
    { label: 'Ibuprofeno', query: 'Ibuprofeno' },
    { label: 'Ciprofloxacina', query: 'Ciprofloxacina' },
  ];

  // Filter and sort medicines
  const filteredMedicines = useMemo(() => {
    const termLower = searchTerm.toLowerCase().trim();

    return allMedicines
      .filter((med) => {
        // 1. Text search matching name, principio_ativo, concentracao, forma, categoria, descricao
        const matchesQuery =
          !termLower ||
          med.nome.toLowerCase().includes(termLower) ||
          med.principio_ativo.toLowerCase().includes(termLower) ||
          med.concentracao.toLowerCase().includes(termLower) ||
          med.forma_farmaceutica.toLowerCase().includes(termLower) ||
          (med.categoria && med.categoria.toLowerCase().includes(termLower)) ||
          (med.descricao && med.descricao.toLowerCase().includes(termLower));

        // 2. Symptom / Clinical Need match (Pesquisa por Sintomas & Necessidades)
        let matchesSymptom = true;
        if (activeSymptom) {
          const s = activeSymptom.toLowerCase();
          if (s === 'hipertensao') {
            matchesSymptom = Boolean(
              med.sintomas?.includes('hipertensao') ||
              med.categoria?.toLowerCase().includes('hipertens') ||
              med.categoria?.toLowerCase().includes('cardio') ||
              med.nome.toLowerCase().includes('losartan') ||
              med.nome.toLowerCase().includes('amlodipina') ||
              med.nome.toLowerCase().includes('captopril') ||
              med.nome.toLowerCase().includes('atenolol') ||
              med.principio_ativo.toLowerCase().includes('losartan') ||
              med.principio_ativo.toLowerCase().includes('amlodipina') ||
              med.principio_ativo.toLowerCase().includes('captopril') ||
              med.principio_ativo.toLowerCase().includes('atenolol')
            );
          } else if (s === 'malaria') {
            matchesSymptom = Boolean(
              med.sintomas?.includes('malaria') ||
              med.categoria?.toLowerCase().includes('antimalár') ||
              med.nome.toLowerCase().includes('coartem') ||
              med.nome.toLowerCase().includes('arteméter') ||
              med.principio_ativo.toLowerCase().includes('artemether') ||
              med.nome.toLowerCase().includes('paracetamol') // alívio da febre malárica
            );
          } else if (s === 'antibioticos') {
            matchesSymptom = Boolean(
              med.sintomas?.includes('antibioticos') ||
              med.categoria?.toLowerCase().includes('antibiótico') ||
              med.nome.toLowerCase().includes('amoxicilina') ||
              med.nome.toLowerCase().includes('azitromicina') ||
              med.nome.toLowerCase().includes('ciprofloxacina')
            );
          } else if (s === 'dor-inflamacao') {
            matchesSymptom = Boolean(
              med.sintomas?.includes('dor-inflamacao') ||
              med.categoria?.toLowerCase().includes('analgésic') ||
              med.categoria?.toLowerCase().includes('anti-inflamatór') ||
              med.nome.toLowerCase().includes('ibuprofeno') ||
              med.nome.toLowerCase().includes('diclofenac') ||
              med.nome.toLowerCase().includes('paracetamol')
            );
          } else if (s === 'reidratacao') {
            matchesSymptom = Boolean(
              med.sintomas?.includes('reidratacao') ||
              med.categoria?.toLowerCase().includes('reidratação') ||
              med.categoria?.toLowerCase().includes('gastro') ||
              med.nome.toLowerCase().includes('sais') ||
              med.nome.toLowerCase().includes('sro') ||
              med.nome.toLowerCase().includes('omeprazol') ||
              med.nome.toLowerCase().includes('zinco')
            );
          } else if (s === 'infantil') {
            matchesSymptom = Boolean(
              med.sintomas?.includes('infantil') ||
              med.categoria?.toLowerCase().includes('pediátr') ||
              med.forma_farmaceutica.toLowerCase().includes('xarope') ||
              med.forma_farmaceutica.toLowerCase().includes('suspensão') ||
              med.nome.toLowerCase().includes('pediátrico') ||
              med.nome.toLowerCase().includes('infantil') ||
              med.nome.toLowerCase().includes('zinco')
            );
          } else {
            matchesSymptom = Boolean(med.sintomas?.includes(s));
          }
        }

        // 3. Category filter
        let matchesCat = true;
        if (selectedCategory !== 'Todas as Categorias') {
          if (selectedCategory === 'Anti-hipertensor') {
            matchesCat = Boolean(
              med.categoria?.toLowerCase().includes('hipertens') ||
              med.sintomas?.includes('hipertensao') ||
              med.nome.toLowerCase().includes('losartan') ||
              med.nome.toLowerCase().includes('amlodipina') ||
              med.nome.toLowerCase().includes('captopril') ||
              med.nome.toLowerCase().includes('atenolol')
            );
          } else if (selectedCategory === 'Antimalárico' || selectedCategory === 'Antimaláricos') {
            matchesCat = Boolean(med.categoria?.toLowerCase().includes('antimalár'));
          } else if (selectedCategory === 'Antibiótico' || selectedCategory === 'Antibióticos') {
            matchesCat = Boolean(med.categoria?.toLowerCase().includes('antibiótico'));
          } else if (
            selectedCategory === 'Analgésico / Antipirético' ||
            selectedCategory === 'Analgésicos e Antipiréticos'
          ) {
            matchesCat = Boolean(
              med.categoria?.toLowerCase().includes('analgésic') ||
              med.categoria?.toLowerCase().includes('anti-inflamatór')
            );
          } else if (selectedCategory === 'Saúde Pediátrica') {
            matchesCat = Boolean(
              med.categoria?.toLowerCase().includes('pediátr') ||
              med.forma_farmaceutica.toLowerCase().includes('xarope') ||
              med.forma_farmaceutica.toLowerCase().includes('suspensão') ||
              med.nome.toLowerCase().includes('pediátrico')
            );
          } else {
            matchesCat = med.categoria === selectedCategory;
          }
        }

        // 4. Prescription filter
        const matchesRx =
          prescriptionFilter === 'all'
            ? true
            : prescriptionFilter === 'rx_only'
            ? med.precisa_receita
            : !med.precisa_receita;

        return matchesQuery && matchesSymptom && matchesCat && matchesRx;
      })
      .map((med) => {
        // Match stocks for approved pharmacies (excluding items under quarantine)
        let stocks = allStocks
          .filter((s) => s.medicine_id === med.id && !s.em_quarentena)
          .map((stock) => ({
            stock,
            pharmacy: approvedPharmacies.find((p) => p.id === stock.pharmacy_id)!,
          }))
          .filter((item) => item.pharmacy);

        // Filter by Bairro if selected
        if (selectedBairro !== 'Todos os Bairros') {
          stocks = stocks.filter((s) =>
            s.pharmacy.bairro.toLowerCase().includes(selectedBairro.toLowerCase())
          );
        }

        // Filter by 24h duty pharmacies
        if (onlyDuty24h) {
          stocks = stocks.filter(
            (s) =>
              s.pharmacy.horario.toLowerCase().includes('24') ||
              s.pharmacy.horario.toLowerCase().includes('permanente')
          );
        }

        // Filter by availability
        if (onlyAvailable) {
          stocks = stocks.filter(
            (s) =>
              s.stock.disponibilidade === 'Disponível' ||
              s.stock.disponibilidade === 'Pouca quantidade'
          );
        }

        // Calculate lowest price among available
        const minPrice = stocks.reduce((min, cur) => {
          if (cur.stock.preco === null) return min;
          return cur.stock.preco < min ? cur.stock.preco : min;
        }, 99999);

        // Calculate closest distance
        const minDistance =
          userLocation && stocks.length > 0
            ? Math.min(
                ...stocks.map((s) =>
                  calculateDistanceKm(
                    userLocation.latitude,
                    userLocation.longitude,
                    s.pharmacy.latitude,
                    s.pharmacy.longitude
                  )
                )
              )
            : 99999;

        return {
          medicine: med,
          stocks,
          minPrice: minPrice === 99999 ? null : minPrice,
          minDistance,
        };
      })
      .filter((item) => (onlyAvailable ? item.stocks.length > 0 : true))
      .sort((a, b) => {
        if (sortBy === 'availability') {
          const availA = a.stocks.filter((s) => s.stock.disponibilidade === 'Disponível').length;
          const availB = b.stocks.filter((s) => s.stock.disponibilidade === 'Disponível').length;
          return availB - availA;
        }
        if (sortBy === 'distance') {
          return a.minDistance - b.minDistance;
        }
        return a.medicine.nome.localeCompare(b.medicine.nome);
      });
  }, [
    allMedicines,
    approvedPharmacies,
    allStocks,
    searchTerm,
    selectedBairro,
    selectedCategory,
    prescriptionFilter,
    onlyDuty24h,
    onlyAvailable,
    sortBy,
    userLocation,
  ]);

  return (
    <div id="medicine-search-view" className="space-y-4 pb-12">
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Pesquisa de Medicamentos"
          subtitle="Catálogo Geral FarmaLink Tete"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Header with Title & Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Pesquisa de Medicamentos em Tete
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pesquise por nome comercial, princípio ativo, dosagem ou forma farmacêutica nas farmácias de Tete.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all min-h-[52px]">
            <Search className="w-5 h-5 text-emerald-600 ml-2 shrink-0" />
            <input
              id="medicine-search-input-field"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const clean = sanitizeSearchTerm(e.target.value);
                detectMaliciousPayload(e.target.value);
                setSearchTerm(clean);
              }}
              placeholder="Ex: Paracetamol, Amoxicilina, Coartem, Ibuprofeno..."
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
              id="medicine-voice-search-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
              title="Pesquisar medicamento por voz"
            >
              <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span className="hidden sm:inline">Voz</span>
            </button>
          </div>
        </div>

        {/* Quick Search Suggestions */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-slate-400" /> Mais buscados:
          </span>
          {popularKeywords.map((k) => (
            <button
              key={k.query}
              type="button"
              onClick={() => setSearchTerm(k.query)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all text-xs border ${
                searchTerm.toLowerCase() === k.query.toLowerCase()
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Quick Action Chips Bar (Ergonomic Touch Targets >= 44px) */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <QuickActionChip
            label="Todos"
            active={!onlyDuty24h && prescriptionFilter === 'all' && selectedCategory === 'Todas as Categorias' && !activeSymptom}
            onClick={() => {
              setOnlyDuty24h(false);
              setPrescriptionFilter('all');
              setSelectedCategory('Todas as Categorias');
              setActiveSymptom('');
              setActiveSymptomLabel('');
            }}
          />

          <QuickActionChip
            label="Plantão 24 Horas"
            icon={<Clock className="w-3.5 h-3.5" />}
            active={onlyDuty24h}
            color="emerald"
            onClick={() => setOnlyDuty24h(!onlyDuty24h)}
          />

          <QuickActionChip
            label="Venda Livre (MIP)"
            active={prescriptionFilter === 'otc_only'}
            color="blue"
            onClick={() =>
              setPrescriptionFilter(prescriptionFilter === 'otc_only' ? 'all' : 'otc_only')
            }
          />

          <QuickActionChip
            label="Receita Médica (R.M.)"
            icon={<Lock className="w-3.5 h-3.5" />}
            active={prescriptionFilter === 'rx_only'}
            color="amber"
            onClick={() =>
              setPrescriptionFilter(prescriptionFilter === 'rx_only' ? 'all' : 'rx_only')
            }
          />

          <QuickActionChip
            label="Anti-hipertensores & Coração"
            active={activeSymptom === 'hipertensao' || selectedCategory === 'Anti-hipertensor'}
            color="blue"
            onClick={() => {
              if (activeSymptom === 'hipertensao' || selectedCategory === 'Anti-hipertensor') {
                setActiveSymptom('');
                setActiveSymptomLabel('');
                setSelectedCategory('Todas as Categorias');
              } else {
                setActiveSymptom('hipertensao');
                setActiveSymptomLabel('Pressão & Coração');
                setSelectedCategory('Anti-hipertensor');
              }
            }}
          />

          <QuickActionChip
            label="Anti-maláricos"
            active={activeSymptom === 'malaria' || selectedCategory === 'Antimalárico' || selectedCategory === 'Antimaláricos'}
            color="rose"
            onClick={() => {
              if (activeSymptom === 'malaria' || selectedCategory === 'Antimalárico' || selectedCategory === 'Antimaláricos') {
                setActiveSymptom('');
                setActiveSymptomLabel('');
                setSelectedCategory('Todas as Categorias');
              } else {
                setActiveSymptom('malaria');
                setActiveSymptomLabel('Malária & Febre');
                setSelectedCategory('Antimaláricos');
              }
            }}
          />

          <QuickActionChip
            label="Antibióticos"
            active={activeSymptom === 'antibioticos' || selectedCategory === 'Antibiótico' || selectedCategory === 'Antibióticos'}
            onClick={() => {
              if (activeSymptom === 'antibioticos' || selectedCategory === 'Antibiótico' || selectedCategory === 'Antibióticos') {
                setActiveSymptom('');
                setActiveSymptomLabel('');
                setSelectedCategory('Todas as Categorias');
              } else {
                setActiveSymptom('antibioticos');
                setActiveSymptomLabel('Antibióticos');
                setSelectedCategory('Antibióticos');
              }
            }}
          />

          <QuickActionChip
            label="Dor & Febre"
            active={activeSymptom === 'dor-inflamacao' || selectedCategory === 'Analgésico / Antipirético'}
            color="purple"
            onClick={() => {
              if (activeSymptom === 'dor-inflamacao' || selectedCategory === 'Analgésico / Antipirético') {
                setActiveSymptom('');
                setActiveSymptomLabel('');
                setSelectedCategory('Todas as Categorias');
              } else {
                setActiveSymptom('dor-inflamacao');
                setActiveSymptomLabel('Dor & Inflamação');
                setSelectedCategory('Analgésico / Antipirético');
              }
            }}
          />

          <QuickActionChip
            label="Digestão & SRO"
            active={activeSymptom === 'reidratacao' || selectedCategory === 'Antiácido / Antiulceroso'}
            color="emerald"
            onClick={() => {
              if (activeSymptom === 'reidratacao' || selectedCategory === 'Antiácido / Antiulceroso') {
                setActiveSymptom('');
                setActiveSymptomLabel('');
                setSelectedCategory('Todas as Categorias');
              } else {
                setActiveSymptom('reidratacao');
                setActiveSymptomLabel('Digestão & SRO');
                setSelectedCategory('Antiácido / Antiulceroso');
              }
            }}
          />

          <QuickActionChip
            label="Saúde Pediátrica"
            active={activeSymptom === 'infantil' || selectedCategory === 'Saúde Pediátrica'}
            color="amber"
            onClick={() => {
              if (activeSymptom === 'infantil' || selectedCategory === 'Saúde Pediátrica') {
                setActiveSymptom('');
                setActiveSymptomLabel('');
                setSelectedCategory('Todas as Categorias');
              } else {
                setActiveSymptom('infantil');
                setActiveSymptomLabel('Saúde Pediátrica');
                setSelectedCategory('Saúde Pediátrica');
              }
            }}
          />
        </div>

        {/* Detailed Filters Bar */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Bairro Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Bairro em Tete</label>
            <select
              id="search-bairro-filter"
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            >
              {TETE_BAIRROS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Categoria Terapêutica</label>
            <select
              id="search-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ordenar Por</label>
            <select
              id="search-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            >
              <option value="relevance">Nome do Medicamento (A-Z)</option>
              <option value="availability">Maior Disponibilidade em Stock</option>
              <option value="distance">Mais Próximo (GPS)</option>
            </select>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-end">
            <label className="w-full flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors min-h-[44px]">
              <input
                id="search-only-available-check"
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800 text-xs select-none">Apenas com Estoque</span>
            </label>
          </div>
        </div>
      </div>

      <DisclaimerBanner compact />

      {/* Active Symptom / Clinical Need Banner */}
      {activeSymptom && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                Filtro por Sintoma & Necessidade Clínica
              </p>
              <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                {activeSymptomLabel || activeSymptom}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSymptom('');
              setActiveSymptomLabel('');
              setSelectedCategory('Todas as Categorias');
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
            <span>Remover filtro</span>
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs sm:text-sm font-semibold text-slate-600">
          Encontrados <span className="font-bold text-slate-900">{filteredMedicines.length}</span> medicamentos
          {searchTerm ? ` para "${searchTerm}"` : ''}
          {activeSymptomLabel ? ` (${activeSymptomLabel})` : ''}
        </p>

        {sortBy === 'distance' && !userLocation && (
          <button
            type="button"
            onClick={onRequestUserLocation}
            className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Ativar GPS para proximidade</span>
          </button>
        )}
      </div>

      {/* Results List */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Nenhum medicamento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente pesquisar por outro nome, princípio ativo ou limpe os filtros de disponibilidade e bairro.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setActiveSymptom('');
              setActiveSymptomLabel('');
              setSelectedBairro('Todos os Bairros');
              setSelectedCategory('Todas as Categorias');
              setOnlyAvailable(false);
              setOnlyDuty24h(false);
              setPrescriptionFilter('all');
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedicines.map(({ medicine, stocks }) => (
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
      )}

      {/* Voice Search Modal */}
      {isVoiceModalOpen && (
        <VoiceSearchModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectSearch={handleVoiceSearchResult}
          defaultType="medicine"
        />
      )}
    </div>
  );
};

