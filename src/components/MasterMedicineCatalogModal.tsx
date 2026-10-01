import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Package,
  Plus,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  FileSpreadsheet,
  X,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckSquare,
  Square,
  Tag,
  Stethoscope,
} from 'lucide-react';
import { MasterCatalogItem, getMasterMedicineCatalog } from '../data/masterMedicineCatalog';
import { Pharmacy, PharmacyMedicine, Medicine, UserProfile, MedicineAvailability } from '../types';
import { FarmaLinkDB } from '../lib/storage';

interface MasterMedicineCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacy: Pharmacy;
  currentUser: UserProfile;
  onSuccess: (count: number) => void;
  onOpenCustomRegister?: () => void;
}

export const MasterMedicineCatalogModal: React.FC<MasterMedicineCatalogModalProps> = ({
  isOpen,
  onClose,
  pharmacy,
  currentUser,
  onSuccess,
  onOpenCustomRegister,
}) => {
  // Load full master catalog
  const fullCatalog = useMemo(() => getMasterMedicineCatalog(), []);

  // Current pharmacy stock and medicines in FarmaLink DB
  const currentStocks = useMemo(() => FarmaLinkDB.getPharmacyMedicines(pharmacy.id), [pharmacy.id, isOpen]);
  const systemMedicines = useMemo(() => FarmaLinkDB.getMedicines(), [isOpen]);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState<'all' | 'otc' | 'rx'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'not_in_stock' | 'in_stock'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Multi-selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Single Quick Add Modal State
  const [quickAddItem, setQuickAddItem] = useState<MasterCatalogItem | null>(null);
  const [quickAddPrice, setQuickAddPrice] = useState<number>(100);
  const [quickAddQty, setQuickAddQty] = useState<number>(50);
  const [quickAddUnit, setQuickAddUnit] = useState<string>('caixas');
  const [quickAddValidade, setQuickAddValidade] = useState<string>('2027-12-31');
  const [quickAddLote, setQuickAddLote] = useState<string>('LOT-2026-MZ');
  const [quickAddDisponibilidade, setQuickAddDisponibilidade] = useState<MedicineAvailability>('Disponível');

  // Bulk Quick Add Modal State
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkDefaultPriceModifier, setBulkDefaultPriceModifier] = useState<number>(1.0); // 1.0 = preco sugerido
  const [bulkDefaultQty, setBulkDefaultQty] = useState<number>(40);
  const [bulkDefaultValidade, setBulkDefaultValidade] = useState<string>('2027-12-31');
  const [bulkDefaultLote, setBulkDefaultLote] = useState<string>('LOT-CAT-2026');

  // Fast mapping: check if catalog item is already in pharmacy stock
  const stockByMedKey = useMemo(() => {
    const map = new Map<string, PharmacyMedicine>();
    currentStocks.forEach((stock) => {
      const med = systemMedicines.find((m) => m.id === stock.medicine_id);
      if (med) {
        // match by name + concentration
        const key = `${med.nome.toLowerCase().trim()}|${med.concentracao.toLowerCase().trim()}`;
        map.set(key, stock);
      }
    });
    return map;
  }, [currentStocks, systemMedicines]);

  // Categories list with counts
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    fullCatalog.forEach((item) => {
      counts[item.categoria] = (counts[item.categoria] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [fullCatalog]);

  // Filtered Catalog Items
  const filteredItems = useMemo(() => {
    let list = fullCatalog;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.nome.toLowerCase().includes(q) ||
          item.principio_ativo.toLowerCase().includes(q) ||
          item.categoria.toLowerCase().includes(q) ||
          item.concentracao.toLowerCase().includes(q) ||
          item.fabricante_padrao.toLowerCase().includes(q) ||
          (item.codigo_atc && item.codigo_atc.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.categoria === selectedCategory);
    }

    // Prescription filter
    if (prescriptionFilter === 'otc') {
      list = list.filter((item) => !item.precisa_receita);
    } else if (prescriptionFilter === 'rx') {
      list = list.filter((item) => item.precisa_receita);
    }

    // Stock status filter
    if (stockStatusFilter !== 'all') {
      list = list.filter((item) => {
        const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
        const isInStock = stockByMedKey.has(key);
        return stockStatusFilter === 'in_stock' ? isInStock : !isInStock;
      });
    }

    return list;
  }, [fullCatalog, searchTerm, selectedCategory, prescriptionFilter, stockStatusFilter, stockByMedKey]);

  // Paginated slice
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Helper: Open single quick-add
  const handleOpenSingleQuickAdd = (item: MasterCatalogItem) => {
    const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
    const existingStock = stockByMedKey.get(key);

    setQuickAddItem(item);
    setQuickAddPrice(existingStock?.preco ?? item.preco_sugerido_mzn);
    setQuickAddQty(existingStock?.quantidade ?? 50);
    setQuickAddUnit(existingStock?.unidade || item.unidade_padrao);
    setQuickAddValidade(existingStock?.data_validade || '2027-12-31');
    setQuickAddLote(existingStock?.lote || `LOT-${item.nome.slice(0, 3).toUpperCase()}-2026`);
    setQuickAddDisponibilidade(existingStock?.disponibilidade || 'Disponível');
  };

  // Helper: Save single medicine to pharmacy stock
  const handleSaveSingleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddItem) return;

    // 1. Check or create master medicine in system
    let systemMed = systemMedicines.find(
      (m) =>
        m.nome.toLowerCase().trim() === quickAddItem.nome.toLowerCase().trim() &&
        m.concentracao.toLowerCase().trim() === quickAddItem.concentracao.toLowerCase().trim()
    );

    if (!systemMed) {
      const newMed: Medicine = {
        id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nome: quickAddItem.nome,
        principio_ativo: quickAddItem.principio_ativo,
        concentracao: quickAddItem.concentracao,
        forma_farmaceutica: quickAddItem.forma_farmaceutica,
        apresentacao: quickAddItem.apresentacao,
        fabricante: quickAddItem.fabricante_padrao,
        categoria: quickAddItem.categoria,
        precisa_receita: quickAddItem.precisa_receita,
        descricao: quickAddItem.descricao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      FarmaLinkDB.saveMedicine(newMed, currentUser);
      systemMed = newMed;
    }

    // 2. Save or update pharmacy stock
    const key = `${quickAddItem.nome.toLowerCase().trim()}|${quickAddItem.concentracao.toLowerCase().trim()}`;
    const existingStock = stockByMedKey.get(key);
    const now = new Date().toISOString();

    const stockItem: PharmacyMedicine = {
      id: existingStock?.id || `pm-${pharmacy.id}-${systemMed.id}-${Date.now()}`,
      pharmacy_id: pharmacy.id,
      medicine_id: systemMed.id,
      quantidade: Number(quickAddQty) || 0,
      unidade: quickAddUnit || 'caixas',
      preco: Number(quickAddPrice) || null,
      disponibilidade: quickAddDisponibilidade,
      data_validade: quickAddValidade || undefined,
      lote: quickAddLote || undefined,
      em_quarentena: false,
      ultima_atualizacao: now,
      created_at: existingStock?.created_at || now,
      updated_at: now,
    };

    FarmaLinkDB.savePharmacyMedicine(stockItem, currentUser);
    setQuickAddItem(null);
    onSuccess(1);
  };

  // Toggle single item selection
  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  // Select / Deselect All on current page
  const handleToggleSelectAllPage = () => {
    const allPageIds = paginatedItems.map((i) => i.id);
    const allSelected = allPageIds.every((id) => selectedItemIds.has(id));

    const next = new Set(selectedItemIds);
    if (allSelected) {
      allPageIds.forEach((id) => next.delete(id));
    } else {
      allPageIds.forEach((id) => next.add(id));
    }
    setSelectedItemIds(next);
  };

  // Bulk Add Process
  const handleExecuteBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.size === 0) return;

    const selectedCatalogItems = fullCatalog.filter((item) => selectedItemIds.has(item.id));
    let addedCount = 0;
    const now = new Date().toISOString();

    selectedCatalogItems.forEach((catItem) => {
      // 1. Ensure system medicine exists
      let systemMed = systemMedicines.find(
        (m) =>
          m.nome.toLowerCase().trim() === catItem.nome.toLowerCase().trim() &&
          m.concentracao.toLowerCase().trim() === catItem.concentracao.toLowerCase().trim()
      );

      if (!systemMed) {
        const newMed: Medicine = {
          id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nome: catItem.nome,
          principio_ativo: catItem.principio_ativo,
          concentracao: catItem.concentracao,
          forma_farmaceutica: catItem.forma_farmaceutica,
          apresentacao: catItem.apresentacao,
          fabricante: catItem.fabricante_padrao,
          categoria: catItem.categoria,
          precisa_receita: catItem.precisa_receita,
          descricao: catItem.descricao,
          created_at: now,
          updated_at: now,
        };
        FarmaLinkDB.saveMedicine(newMed, currentUser);
        systemMed = newMed;
      }

      // 2. Add or update stock
      const calculatedPrice = Math.round(catItem.preco_sugerido_mzn * bulkDefaultPriceModifier);
      const stockItem: PharmacyMedicine = {
        id: `pm-${pharmacy.id}-${systemMed.id}`,
        pharmacy_id: pharmacy.id,
        medicine_id: systemMed.id,
        quantidade: Number(bulkDefaultQty) || 30,
        unidade: catItem.unidade_padrao || 'caixas',
        preco: calculatedPrice,
        disponibilidade: 'Disponível',
        data_validade: bulkDefaultValidade || '2027-12-31',
        lote: bulkDefaultLote || `LOT-CAT-${new Date().getFullYear()}`,
        em_quarentena: false,
        ultima_atualizacao: now,
        created_at: now,
        updated_at: now,
      };

      FarmaLinkDB.savePharmacyMedicine(stockItem, currentUser);
      addedCount++;
    });

    setSelectedItemIds(new Set());
    setShowBulkAddModal(false);
    onSuccess(addedCount);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="master-catalog-title"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full h-[92vh] max-h-[900px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-emerald-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Formulário Oficial & Global (5.200+ Itens)
                </span>
                <span className="text-xs text-emerald-200/80 font-medium">
                  Farmácia: <strong className="text-white">{pharmacy.nome}</strong>
                </span>
              </div>
              <h2 id="master-catalog-title" className="text-base sm:text-xl font-black tracking-tight text-white mt-0.5">
                Catálogo Mestre Inteligente de Medicamentos
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCustomRegister && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomRegister();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>Cadastrar Não Listado</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Fechar Catálogo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Main Filter Controls */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Pesquisar por Medicamento, Princípio Ativo (DCI), Dosagem ou Fabricante..."
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Prescription Filter */}
            <div className="md:col-span-3">
              <select
                value={prescriptionFilter}
                onChange={(e) => {
                  setPrescriptionFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                <option value="all">Prescrição: Todas (Venda Livre & Receita)</option>
                <option value="otc">🟢 Venda Livre (MIP)</option>
                <option value="rx">🔴 Exige Receita Médica</option>
              </select>
            </div>

            {/* Stock Presence Filter */}
            <div className="md:col-span-3">
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                <option value="all">Estado: Todos os Medicamentos</option>
                <option value="not_in_stock">➕ Apenas Não Cadastrados na Minha Farmácia</option>
                <option value="in_stock">✅ Já em Stock na Minha Farmácia</option>
              </select>
            </div>
          </div>

          {/* Quick Category Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>Todos os Grupos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {fullCatalog.length}
              </span>
            </button>

            {categoriesList.map(([cat, count]) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar for Batch Selection */}
        <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAllPage}
              className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              {paginatedItems.length > 0 && paginatedItems.every((i) => selectedItemIds.has(i.id)) ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Selecionar todos da página ({paginatedItems.length})</span>
            </button>

            <span className="text-slate-400">|</span>

            <span className="text-slate-500 dark:text-slate-400">
              Apresentando <strong>{filteredItems.length}</strong> medicamentos encontrados
            </span>
          </div>

          {selectedItemIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {selectedItemIds.size} selecionado(s)
              </span>

              <button
                type="button"
                onClick={() => setShowBulkAddModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Adicionar Selecionados em Lote</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemIds(new Set())}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Limpar seleção"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Medicine List Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y-0">
          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                Nenhum medicamento encontrado no catálogo mestre
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente ajustar os termos de pesquisa ou filtros de categoria. Se for um produto exclusivo, você pode cadastrá-lo manualmente.
              </p>
              {onOpenCustomRegister && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomRegister();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Medicamento Não Listado</span>
                </button>
              )}
            </div>
          ) : (
            paginatedItems.map((item) => {
              const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
              const inStock = stockByMedKey.get(key);
              const isSelected = selectedItemIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600'
                      : inStock
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectItem(item.id)}
                      className="mt-1 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                          {item.nome}
                        </span>

                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {item.concentracao}
                        </span>

                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          {item.forma_farmaceutica}
                        </span>

                        {item.precisa_receita ? (
                          <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            Exige Receita
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                            Venda Livre
                          </span>
                        )}

                        {inStock && (
                          <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Em Stock ({inStock.quantidade} {inStock.unidade})</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap font-medium">
                        <span>
                          DCI (Princípio Ativo): <strong className="text-slate-700 dark:text-slate-200">{item.principio_ativo}</strong>
                        </span>
                        <span>•</span>
                        <span>{item.apresentacao}</span>
                        <span>•</span>
                        <span>Fab: <strong>{item.fabricante_padrao}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          {item.categoria}
                        </span>
                        {item.codigo_atc && (
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-500">
                            ATC: {item.codigo_atc}
                          </span>
                        )}
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Ref. Mercado: {item.preco_sugerido_mzn.toFixed(2)} MZN
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {inStock ? (
                      <button
                        type="button"
                        onClick={() => handleOpenSingleQuickAdd(item)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Ajustar Stock / Preço</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenSingleQuickAdd(item)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar ao Stock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination & Summary Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500 dark:text-slate-400">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredItems.length} itens no total)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            {/* Quick jump */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer flex items-center gap-1"
            >
              <span>Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SINGLE QUICK ADD MODAL */}
      {quickAddItem && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 dark:border-emerald-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Definição de Estoque & Preço
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {quickAddItem.nome}
                </h3>
                <p className="text-xs text-slate-500">
                  {quickAddItem.concentracao} • {quickAddItem.forma_farmaceutica} • {quickAddItem.apresentacao}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preço de Venda (MZN) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                      MT
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      step={0.5}
                      value={quickAddPrice}
                      onChange={(e) => setQuickAddPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Sugerido: {quickAddItem.preco_sugerido_mzn} MZN
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade em Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={quickAddQty}
                    onChange={(e) => setQuickAddQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="flex gap-1 mt-1.5">
                    {[10, 30, 50, 100].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuickAddQty(q)}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={quickAddUnit}
                    onChange={(e) => setQuickAddUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="caixas">Caixas</option>
                    <option value="frascos">Frascos</option>
                    <option value="unidades">Unidades</option>
                    <option value="embalagens">Embalagens</option>
                    <option value="bisnagas">Bisnagas</option>
                    <option value="tubos">Tubos</option>
                    <option value="saquetas">Saquetas</option>
                    <option value="blisters">Blisters</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disponibilidade
                  </label>
                  <select
                    value={quickAddDisponibilidade}
                    onChange={(e) => setQuickAddDisponibilidade(e.target.value as MedicineAvailability)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Pouca quantidade">Pouca quantidade</option>
                    <option value="Indisponível">Indisponível</option>
                  </select>
                </div>
              </div>

              {/* Lote & Validade */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Validade *
                    </label>
                    <input
                      type="date"
                      value={quickAddValidade}
                      onChange={(e) => setQuickAddValidade(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setFullYear(d.getFullYear() + 1);
                          setQuickAddValidade(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] bg-white dark:bg-slate-800 text-emerald-700 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded"
                      >
                        +1 Ano
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setFullYear(d.getFullYear() + 2);
                          setQuickAddValidade(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] bg-white dark:bg-slate-800 text-emerald-700 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded"
                      >
                        +2 Anos
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Número do Lote
                    </label>
                    <input
                      type="text"
                      value={quickAddLote}
                      onChange={(e) => setQuickAddLote(e.target.value)}
                      placeholder="Ex: LOT-MZ-2026-X"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAddItem(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar no Stock da Farmácia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ADD MODAL */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-300 dark:border-emerald-700 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Adição em Lote ({selectedItemIds.size} Medicamentos)
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Configurar Stock em Massa
                </h3>
                <p className="text-xs text-slate-500">
                  Os {selectedItemIds.size} medicamentos selecionados serão adicionados instantaneamente ao estoque da farmácia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBulkAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade Padrão Inicial por Medicamento *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={bulkDefaultQty}
                  onChange={(e) => setBulkDefaultQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ex: 40 caixas para cada um dos {selectedItemIds.size} itens.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preço Base Aplicado
                </label>
                <select
                  value={bulkDefaultPriceModifier}
                  onChange={(e) => setBulkDefaultPriceModifier(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="1.0">Preço Sugerido Padrão de Mercado (100%)</option>
                  <option value="0.9">Desconto Popular (-10% do mercado)</option>
                  <option value="1.1">Preço com Margem (+10%)</option>
                  <option value="1.2">Preço com Margem (+20%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Validade Padrão *
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkDefaultValidade}
                    onChange={(e) => setBulkDefaultValidade(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prefixo de Lote
                  </label>
                  <input
                    type="text"
                    value={bulkDefaultLote}
                    onChange={(e) => setBulkDefaultLote(e.target.value)}
                    placeholder="LOT-2026"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Importação Instantânea
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Após adicionar, poderá editar individualmente o preço, lote ou quantidade de qualquer item a qualquer momento na sua lista de estoque.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Adicionar {selectedItemIds.size} Itens Agora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
