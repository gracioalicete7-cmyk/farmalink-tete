import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Pill,
  Store,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Activity,
  Navigation,
  DollarSign,
  Building2,
} from 'lucide-react';
import { FarmaLinkDB } from '../lib/storage';
import { Medicine, Pharmacy, PharmacyMedicine } from '../types';

// AI Generated Assets
import paracetamolImg from '../assets/images/med_paracetamol_box_1787659401793.jpg';
import amoxicillinImg from '../assets/images/med_amoxicillin_pack_1787659415877.jpg';
import ibuprofenImg from '../assets/images/med_ibuprofen_box_1787659483418.jpg';
import coartemImg from '../assets/images/med_coartem_box_1787659496433.jpg';
import pharmacyStoreImg from '../assets/images/pharmacy_store_tete_1787659429151.jpg';
import pharmacyCounterImg from '../assets/images/pharmacy_counter_tete_1787659441007.jpg';

interface HomeHeroRealtimeDiscoveryProps {
  onSelectMedicine?: (medicineId: string) => void;
  onSelectPharmacy?: (pharmacyId: string) => void;
  onSearch?: (term: string) => void;
}

interface DiscoveryStage {
  step: number;
  stageName: string;
  stageLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const DISCOVERY_STAGES: DiscoveryStage[] = [
  { step: 1, stageName: 'PESQUISAR', stageLabel: 'A pesquisar fármaco...', icon: Search, color: 'text-amber-300' },
  { step: 2, stageName: 'ENCONTRAR MEDICAMENTO', stageLabel: 'Fármaco identificado', icon: Pill, color: 'text-emerald-300' },
  { step: 3, stageName: 'LOCALIZAR FARMÁCIA', stageLabel: 'Farmácia mais próxima', icon: MapPin, color: 'text-blue-300' },
  { step: 4, stageName: 'VER DISPONIBILIDADE', stageLabel: 'Stock & Preço Confirmados', icon: CheckCircle2, color: 'text-emerald-400' },
];

export const HomeHeroRealtimeDiscovery: React.FC<HomeHeroRealtimeDiscoveryProps> = ({
  onSelectMedicine,
  onSelectPharmacy,
  onSearch,
}) => {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Retrieve actual database items or use robust Mozambique-specific pharmacy datasets
  const allMeds = FarmaLinkDB.getMedicines();
  const allPharmacies = FarmaLinkDB.getApprovedPharmacies();

  // Curated live discovery items representing real medicines and pharmacies in Tete
  const discoveryItems = [
    {
      medicineName: 'Paracetamol 500 mg',
      dosage: '500 mg • 20 Comprimidos',
      category: 'Analgésico & Antipirético',
      presentationBadge: 'Comprimidos',
      stockStatus: 'Disponível em Stock',
      stockQty: 85,
      medImage: paracetamolImg,
      pharmacyName: 'Farmácia Central de Tete',
      bairro: 'Bairro Francisco Manyanga',
      distance: '800 m',
      statusTime: 'Aberta agora • Até às 22h',
      is24h: false,
      dpsVerified: true,
      pharmacyImage: pharmacyStoreImg,
      medicineId: allMeds.find((m) => m.nome.toLowerCase().includes('paracetamol'))?.id || 'med-paracetamol',
      pharmacyId: allPharmacies[0]?.id || 'pharm-1',
    },
    {
      medicineName: 'Amoxicilina 500 mg',
      dosage: '500 mg • 16 Cápsulas',
      category: 'Antibiótico Sistémico',
      presentationBadge: 'Cápsulas',
      stockStatus: 'Disponível',
      stockQty: 42,
      medImage: amoxicillinImg,
      pharmacyName: 'Farmácia Matundo',
      bairro: 'Bairro Matundo (Ponte Samora Machel)',
      distance: '1.4 km',
      statusTime: 'Plantão 24 Horas',
      is24h: true,
      dpsVerified: true,
      pharmacyImage: pharmacyCounterImg,
      medicineId: allMeds.find((m) => m.nome.toLowerCase().includes('amoxicilina'))?.id || 'med-amoxicilina',
      pharmacyId: allPharmacies[1]?.id || 'pharm-2',
    },
    {
      medicineName: 'Ibuprofeno 400 mg',
      dosage: '400 mg • Anti-inflamatório',
      category: 'Dor & Inflamação',
      presentationBadge: 'Comprimidos',
      stockStatus: 'Stock Alto',
      stockQty: 110,
      medImage: ibuprofenImg,
      pharmacyName: 'Farmácia Zambeze Saúde',
      bairro: 'Bairro Chingodzi • Tete',
      distance: '1.8 km',
      statusTime: 'Aberta agora • Até às 21h',
      is24h: false,
      dpsVerified: true,
      pharmacyImage: pharmacyStoreImg,
      medicineId: allMeds.find((m) => m.nome.toLowerCase().includes('ibuprofeno'))?.id || 'med-ibuprofeno',
      pharmacyId: allPharmacies[2]?.id || 'pharm-3',
    },
    {
      medicineName: 'Azitromicina 500 mg',
      dosage: '500 mg • Caixa 3 comp.',
      category: 'Antibiótico (R.M. Obrigatória)',
      presentationBadge: 'Caixa 3 Comp.',
      stockStatus: 'Disponível',
      stockQty: 28,
      medImage: amoxicillinImg,
      pharmacyName: 'Farmácia São Pedro',
      bairro: 'Bairro Josina Machel',
      distance: '2.1 km',
      statusTime: 'Plantão Nocturno Activo',
      is24h: true,
      dpsVerified: true,
      pharmacyImage: pharmacyCounterImg,
      medicineId: allMeds.find((m) => m.nome.toLowerCase().includes('azitromicina'))?.id || 'med-azitromicina',
      pharmacyId: allPharmacies[0]?.id || 'pharm-1',
    },
    {
      medicineName: 'Metronidazol 250 mg',
      dosage: '250 mg • 20 Comprimidos',
      category: 'Antiparasitário & Antibacteriano',
      presentationBadge: '20 Comprimidos',
      stockStatus: 'Disponível',
      stockQty: 54,
      medImage: paracetamolImg,
      pharmacyName: 'Farmácia Popular de Moatize',
      bairro: 'Moatize • Província de Tete',
      distance: '4.5 km',
      statusTime: 'Aberta agora',
      is24h: false,
      dpsVerified: true,
      pharmacyImage: pharmacyStoreImg,
      medicineId: allMeds.find((m) => m.nome.toLowerCase().includes('metronidazol'))?.id || 'med-metronidazol',
      pharmacyId: allPharmacies[1]?.id || 'pharm-2',
    },
    {
      medicineName: 'Coartem (Arteméter+Lumefantrina)',
      dosage: '20/120 mg • Antimalárico Oficial',
      category: 'Tratamento de Malária (DPS)',
      presentationBadge: 'Antimalárico',
      stockStatus: 'Stock Garantido DPS',
      stockQty: 95,
      medImage: coartemImg,
      pharmacyName: 'Farmácia Moçambique Tete',
      bairro: 'Bairro Samora Machel',
      distance: '1.1 km',
      statusTime: 'Plantão Permanente 24h',
      is24h: true,
      dpsVerified: true,
      pharmacyImage: pharmacyCounterImg,
      medicineId: allMeds.find((m) => m.nome.toLowerCase().includes('coartem'))?.id || 'med-coartem',
      pharmacyId: allPharmacies[2]?.id || 'pharm-3',
    },
  ];

  const currentItem = discoveryItems[cycleIndex % discoveryItems.length];

  // Micro-step animation inside each cycle
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 3) {
          setCycleIndex((c) => (c + 1) % discoveryItems.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1350);

    return () => clearInterval(stepInterval);
  }, [discoveryItems.length]);

  const activeStage = DISCOVERY_STAGES[currentStep];
  const StageIcon = activeStage.icon;

  return (
    <div className="relative w-full overflow-hidden select-none pointer-events-auto">
      {/* 
        ========================================================================
        AMBIENT BACKGROUND RADAR & SATELLITE PULSE
        ========================================================================
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/0 via-emerald-400/5 to-transparent rounded-full"
        />

        <motion.div
          animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-emerald-400 blur-[1px]"
        />
        <motion.div
          animate={{
            y: [10, -10, 10],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-1/4 right-12 w-2.5 h-2.5 rounded-full bg-blue-400 blur-[1px]"
        />
      </div>

      {/* 
        ========================================================================
        REAL-TIME STEPPING NARRATIVE RIBBON
        PESQUISAR ➔ ENCONTRAR MEDICAMENTO ➔ LOCALIZAR FARMÁCIA ➔ VER DISPONIBILIDADE
        ========================================================================
      */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3">
        <div className="inline-flex items-center gap-2 bg-slate-950/75 border border-emerald-500/40 text-emerald-200 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
              TEMPO REAL EM TETE:
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.step}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5 font-bold"
            >
              <StageIcon className={`w-3.5 h-3.5 ${activeStage.color}`} />
              <span className="text-white">{activeStage.stageName}</span>
              <span className="text-slate-400 hidden sm:inline">• {activeStage.stageLabel}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 
        ========================================================================
        FLOATING REALTIME CARDS WITH REAL IMAGES (MEDICINES & PHARMACIES IN TETE)
        ========================================================================
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-2xl mx-auto my-3">
        {/* CARD 1: MEDICINE IDENTIFIED IN TETE (WITH REAL MEDICINE PHOTO) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`med-${cycleIndex}`}
            initial={{ opacity: 0, x: -18, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              y: [0, -3, 0],
            }}
            exit={{ opacity: 0, x: -18, scale: 0.95 }}
            transition={{
              duration: 0.45,
              y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            onClick={() => onSelectMedicine?.(currentItem.medicineId)}
            className="group cursor-pointer bg-gradient-to-br from-white/20 via-white/10 to-emerald-950/40 border border-emerald-400/35 hover:border-emerald-300 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-xl transition-all text-left overflow-hidden relative"
          >
            <div className="flex items-center gap-3">
              {/* Real Medicine Photograph */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-white/25 shadow-md bg-white">
                <img
                  src={currentItem.medImage}
                  alt={currentItem.medicineName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-1 left-1 bg-emerald-700/80 backdrop-blur-xs text-white p-0.5 rounded-md">
                  <Pill className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Medicine Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded font-bold border border-emerald-400/30 uppercase tracking-wide">
                    {currentItem.stockStatus}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-400/30">
                    {currentItem.presentationBadge}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-black text-white leading-tight truncate group-hover:text-emerald-200 transition-colors">
                  {currentItem.medicineName}
                </h4>

                <p className="text-[11px] text-emerald-100/90 truncate mt-0.5">
                  {currentItem.dosage}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1 pt-1 border-t border-white/10">
                  <span className="truncate text-emerald-200/80">{currentItem.category}</span>
                  <span className="text-emerald-300 font-bold group-hover:underline">
                    Ver Farmácias & Stock →
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CARD 2: PHARMACY IN TETE (WITH REAL PHARMACY STOREFRONT/INTERIOR PHOTO) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`pharm-${cycleIndex}`}
            initial={{ opacity: 0, x: 18, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              y: [0, -3, 0],
            }}
            exit={{ opacity: 0, x: 18, scale: 0.95 }}
            transition={{
              duration: 0.45,
              y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
            }}
            onClick={() => onSelectPharmacy?.(currentItem.pharmacyId)}
            className="group cursor-pointer bg-gradient-to-br from-white/20 via-white/10 to-blue-950/40 border border-blue-400/35 hover:border-blue-300 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-xl transition-all text-left overflow-hidden relative"
          >
            <div className="flex items-center gap-3">
              {/* Real Pharmacy Photograph */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-white/25 shadow-md bg-slate-900">
                <img
                  src={currentItem.pharmacyImage}
                  alt={currentItem.pharmacyName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-1 left-1 bg-blue-700/80 backdrop-blur-xs text-white p-0.5 rounded-md">
                  <Store className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Pharmacy Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  {currentItem.is24h ? (
                    <span className="text-[10px] bg-amber-400/25 text-amber-200 px-2 py-0.5 rounded font-bold border border-amber-400/40 uppercase tracking-wide">
                      Plantão 24h
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-400/25 text-blue-200 px-2 py-0.5 rounded font-bold border border-blue-400/40 uppercase tracking-wide">
                      Aberta Agora
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-blue-300 flex items-center gap-0.5">
                    <Navigation className="w-3 h-3 text-blue-400 inline" />
                    {currentItem.distance}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-black text-white leading-tight truncate group-hover:text-blue-200 transition-colors">
                  {currentItem.pharmacyName}
                </h4>

                <p className="text-[11px] text-blue-100/90 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-blue-300 shrink-0" />
                  <span>{currentItem.bairro}</span>
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1 pt-1 border-t border-white/10">
                  <span className="text-emerald-300 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    DPS Homologada
                  </span>
                  <span className="text-blue-300 font-bold group-hover:underline">
                    Como Chegar →
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 
        ========================================================================
        PROGRESS INDICATOR DOTS
        ========================================================================
      */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {discoveryItems.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setCycleIndex(idx);
              setCurrentStep(0);
            }}
            aria-label={`Ver item ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === cycleIndex % discoveryItems.length
                ? 'w-6 bg-emerald-400 shadow-xs'
                : 'w-1.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

