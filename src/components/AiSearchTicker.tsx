import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, ArrowRight, Mic } from 'lucide-react';
import { FarmaLinkDB } from '../lib/storage';
import { Medicine } from '../types';
import { sanitizeSearchTerm, detectMaliciousPayload } from '../lib/security';
import { VoiceSearchModal } from './VoiceSearchModal';
import { VoiceSearchResult } from '../lib/voiceSearch';

interface AiSearchTickerProps {
  onSearch: (term: string) => void;
  onSelectMedicine?: (medicineId: string) => void;
  initialValue?: string;
  className?: string;
  autoFocus?: boolean;
}

const POPULAR_SEARCHES = [
  'Paracetamol 500 mg',
  'Coartem (Arteméter + Lumefantrina)',
  'Amoxicilina 500 mg',
  'Ibuprofeno 400 mg',
  'Azitromicina 500 mg',
  'Omeprazol 20 mg',
  'Ciprofloxacina 500 mg',
  'Sais de Reidratação Oral (SRO)',
  'Cetirizina 10 mg',
];

export const AiSearchTicker: React.FC<AiSearchTickerProps> = ({
  onSearch,
  onSelectMedicine,
  initialValue = '',
  className = '',
  autoFocus = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceResult = (result: VoiceSearchResult) => {
    setSearchTerm(result.cleanedQuery);
    onSearch(result.cleanedQuery);
  };

  // Cycling placeholder animation
  useEffect(() => {
    if (isFocused || searchTerm.length > 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % POPULAR_SEARCHES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isFocused, searchTerm]);

  // Live tolerant filtering
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const allMeds = FarmaLinkDB.getMedicines();
      const termLower = searchTerm.toLowerCase();
      const filtered = allMeds.filter(
        (m) =>
          m.nome.toLowerCase().includes(termLower) ||
          m.principio_ativo.toLowerCase().includes(termLower) ||
          m.concentracao.toLowerCase().includes(termLower) ||
          m.forma_farmaceutica.toLowerCase().includes(termLower) ||
          (m.categoria && m.categoria.toLowerCase().includes(termLower))
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setIsFocused(false);
    }
  };

  const handleSelectQuick = (query: string) => {
    setSearchTerm(query);
    onSearch(query);
    setIsFocused(false);
  };

  const handleSelectMed = (med: Medicine) => {
    setSearchTerm(med.nome);
    if (onSelectMedicine) {
      onSelectMedicine(med.id);
    } else {
      onSearch(med.nome);
    }
    setIsFocused(false);
  };

  return (
    <div id="ai-search-ticker-container" className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`flex items-center gap-2 bg-white rounded-2xl border-2 transition-all duration-200 shadow-md ${
            isFocused
              ? 'border-emerald-600 ring-4 ring-emerald-500/10 shadow-lg'
              : 'border-slate-200/90 hover:border-emerald-400'
          } p-1.5 sm:p-2`}
        >
          {/* Search Icon with AI pulse indicator */}
          <div className="pl-2.5 flex items-center gap-1.5 text-emerald-700">
            <Search className="w-5 h-5 shrink-0" />
            <div className="hidden sm:flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
              <Sparkles className="w-3 h-3 animate-spin text-emerald-600" style={{ animationDuration: '4s' }} />
              <span>IA</span>
            </div>
          </div>

          {/* Input field with simulated dynamic placeholder */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              id="ai-medicine-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const clean = sanitizeSearchTerm(e.target.value);
                detectMaliciousPayload(e.target.value);
                setSearchTerm(clean);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              autoFocus={autoFocus}
              placeholder={`Pesquisar ex: ${POPULAR_SEARCHES[tickerIndex]}`}
              className="w-full py-2 px-1 text-slate-900 placeholder:text-slate-400 font-medium text-sm sm:text-base focus:outline-none bg-transparent"
              autoComplete="off"
            />
          </div>

          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                onSearch('');
                inputRef.current?.focus();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          <button
            type="button"
            id="hero-voice-search-btn"
            onClick={() => setIsVoiceModalOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1 text-xs font-bold transition-all shrink-0 cursor-pointer border border-emerald-200"
            title="Pesquisar por voz"
          >
            <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />
            <span className="hidden sm:inline">Voz</span>
          </button>

          {/* Search Submit Button */}
          <button
            type="submit"
            id="submit-medicine-search-btn"
            className="px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Pesquisar</span>
            <ArrowRight className="w-4 h-4 hidden sm:inline" />
          </button>
        </div>
      </form>

      {/* Dynamic Animated Query Ticker pills */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-600 font-semibold text-[11px] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" /> Mais procurados em Tete:
        </span>
        {POPULAR_SEARCHES.slice(0, 4).map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectQuick(item.split(' ')[0])}
            className="shrink-0 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border border-slate-200/60"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Live Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div
          id="search-suggestions-dropdown"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span>Medicamentos encontrados</span>
            <span className="text-emerald-800">{suggestions.length} resultados</span>
          </div>
          <div className="py-1">
            {suggestions.map((med) => (
              <button
                key={med.id}
                type="button"
                onMouseDown={() => handleSelectMed(med)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 flex items-center justify-between group transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700">
                    {med.nome}{' '}
                    <span className="text-xs font-normal text-slate-500">({med.concentracao})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Princípio ativo: {med.principio_ativo} • {med.forma_farmaceutica}
                  </p>
                </div>
                <div className="text-xs font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  Ver farmácias
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Search Modal */}
      {isVoiceModalOpen && (
        <VoiceSearchModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectSearch={handleVoiceResult}
        />
      )}
    </div>
  );
};
