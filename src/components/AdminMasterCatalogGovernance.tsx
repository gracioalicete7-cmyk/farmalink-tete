import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Pill,
  Sparkles,
  Check,
  CheckCircle2,
  Plus,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
  Edit2,
  Tag,
  Stethoscope,
  X,
} from 'lucide-react';
import { MasterCatalogItem, getMasterMedicineCatalog } from '../data/masterMedicineCatalog';
import { Medicine, UserProfile } from '../types';
import { FarmaLinkDB } from '../lib/storage';
import { CloudSync } from '../lib/firestoreSync';

interface AdminMasterCatalogGovernanceProps {
  currentUser: UserProfile;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const AdminMasterCatalogGovernance: React.FC<AdminMasterCatalogGovernanceProps> = ({
  currentUser,
  onRefresh,
  showToast,
}) => {
  // Load full master catalog (5,000+ entries)
  const fullCatalog = useMemo(() => getMasterMedicineCatalog(), []);
  const provincialMedicines = useMemo(() => FarmaLinkDB.getMedicines(), []);

  // Fast mapping of currently active medicines in the province
  const activeKeysMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    provincialMedicines.forEach((m) => {
      const key = `${m.nome.toLowerCase().trim()}|${m.concentracao.toLowerCase().trim()}`;
      map.set(key, m);
    });
    return map;
  }, [provincialMedicines]);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState<'all' | 'otc' | 'rx'>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<'all' | 'published' | 'not_published'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Multi-selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Modal: Create New Official Master Medicine
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMedData, setNewMedData] = useState<Partial<Medicine>>({
    nome: '',
    principio_ativo: '',
    concentracao: '',
    forma_farmaceutica: 'Comprimidos',
    apresentacao: 'Caixa com 20 comprimidos',
    categoria: 'Analgésicos e Antipiréticos',
    precisa_receita: false,
    descricao: '',
  });

  // Modal: Issue Sanitary Alert / Recall
  const [recallItem, setRecallItem] = useState<MasterCatalogItem | null>(null);
  const [recallLotNumber, setRecallLotNumber] = useState('');
  const [recallReason, setRecallReason] = useState('');
  const [recallSeverity, setRecallSeverity] = useState<'Aviso' | 'Quarentena' | 'Recolha Imediata'>('Recolha Imediata');

  // Categories list with counts
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    fullCatalog.forEach((item) => {
      counts[item.categoria] = (counts[item.categoria] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [fullCatalog]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return fullCatalog.filter((item) => {
      // Search
      const matchSearch =
        !query ||
        item.nome.toLowerCase().includes(query) ||
        item.principio_ativo.toLowerCase().includes(query) ||
        item.fabricante_padrao.toLowerCase().includes(query) ||
        (item.codigo_atc && item.codigo_atc.toLowerCase().includes(query));

      // Category
      const matchCategory = selectedCategory === 'all' || item.categoria === selectedCategory;

      // Prescription
      const matchPrescription =
        prescriptionFilter === 'all' ||
        (prescriptionFilter === 'otc' && !item.precisa_receita) ||
        (prescriptionFilter === 'rx' && item.precisa_receita);

      // Provincial Publication Status
      const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
      const isPublished = activeKeysMap.has(key);
      const matchSyncStatus =
        syncStatusFilter === 'all' ||
        (syncStatusFilter === 'published' && isPublished) ||
        (syncStatusFilter === 'not_published' && !isPublished);

      return matchSearch && matchCategory && matchPrescription && matchSyncStatus;
    });
  }, [fullCatalog, searchTerm, selectedCategory, prescriptionFilter, syncStatusFilter, activeKeysMap]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCatalog.slice(start, start + itemsPerPage);
  }, [filteredCatalog, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Selection toggle
  const toggleSelectAllPage = () => {
    const next = new Set(selectedItemIds);
    const allPageSelected = paginatedItems.every((item) => next.has(item.id));
    if (allPageSelected) {
      paginatedItems.forEach((item) => next.delete(item.id));
    } else {
      paginatedItems.forEach((item) => next.add(item.id));
    }
    setSelectedItemIds(next);
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  // Publish single medicine to Provincial Catalog
  const handlePublishSingle = (item: MasterCatalogItem) => {
    const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
    const existing = activeKeysMap.get(key);

    const medId = existing?.id || `med-gov-${item.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const medToSave: Medicine = {
      id: medId,
      nome: item.nome,
      principio_ativo: item.principio_ativo,
      concentracao: item.concentracao,
      forma_farmaceutica: item.forma_farmaceutica,
      apresentacao: item.apresentacao,
      categoria: item.categoria,
      precisa_receita: item.precisa_receita,
      descricao: item.descricao,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.saveMedicine(medToSave, currentUser);
    CloudSync.syncMedicine(medToSave);
    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'PUBLICAR_MEDICAMENTO_MESTRE',
      entity: 'medicine',
      entity_id: medToSave.id,
      metadata: `Publicado "${medToSave.nome} (${medToSave.concentracao})" no catálogo oficial de Tete.`,
    });

    showToast(`Medicamento "${item.nome}" publicado oficialmente no Catálogo Provincial!`);
    onRefresh();
  };

  // Publish Selected Batch
  const handlePublishSelectedBatch = () => {
    if (selectedItemIds.size === 0) return;

    let addedCount = 0;
    const selectedItems = fullCatalog.filter((item) => selectedItemIds.has(item.id));

    selectedItems.forEach((item) => {
      const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
      const existing = activeKeysMap.get(key);

      const medId = existing?.id || `med-gov-${item.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      const medToSave: Medicine = {
        id: medId,
        nome: item.nome,
        principio_ativo: item.principio_ativo,
        concentracao: item.concentracao,
        forma_farmaceutica: item.forma_farmaceutica,
        apresentacao: item.apresentacao,
        categoria: item.categoria,
        precisa_receita: item.precisa_receita,
        descricao: item.descricao,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      FarmaLinkDB.saveMedicine(medToSave, currentUser);
      CloudSync.syncMedicine(medToSave);
      addedCount++;
    });

    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'PUBLICAR_LOTE_CATALOGO_MESTRE',
      entity: 'medicine',
      metadata: `Publicados ${addedCount} medicamentos do catálogo mestre no repositório provincial de Tete.`,
    });

    showToast(`${addedCount} medicamentos publicados com sucesso no catálogo oficial de Tete!`);
    setSelectedItemIds(new Set());
    onRefresh();
  };

  // Publish Essential Kit (20 Core Medicines)
  const handlePublishEssentialKit = () => {
    const coreItems = fullCatalog.slice(0, 20);
    let count = 0;
    coreItems.forEach((item) => {
      const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
      const existing = activeKeysMap.get(key);

      const medId = existing?.id || `med-gov-${item.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      const medToSave: Medicine = {
        id: medId,
        nome: item.nome,
        principio_ativo: item.principio_ativo,
        concentracao: item.concentracao,
        forma_farmaceutica: item.forma_farmaceutica,
        apresentacao: item.apresentacao,
        categoria: item.categoria,
        precisa_receita: item.precisa_receita,
        descricao: item.descricao,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      FarmaLinkDB.saveMedicine(medToSave, currentUser);
      CloudSync.syncMedicine(medToSave);
      count++;
    });

    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'PUBLICAR_KIT_ESSENCIAIS_PROVINCIA',
      entity: 'medicine',
      metadata: `Publicado Kit de 20 Medicamentos Essenciais prioritários para Tete.`,
    });

    showToast(`Kit com 20 medicamentos essenciais publicado e sincronizado no catálogo provincial!`);
    onRefresh();
  };

  // Create custom new official medicine
  const handleSaveCustomMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedData.nome?.trim() || !newMedData.principio_ativo?.trim()) {
      showToast('Nome comercial e Princípio Ativo são obrigatórios.');
      return;
    }

    const medId = `med-reg-${newMedData.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const fullMed: Medicine = {
      id: medId,
      nome: newMedData.nome.trim(),
      principio_ativo: newMedData.principio_ativo.trim(),
      concentracao: newMedData.concentracao?.trim() || 'Dose padrão',
      forma_farmaceutica: newMedData.forma_farmaceutica || 'Comprimidos',
      apresentacao: newMedData.apresentacao?.trim() || 'Embalagem de venda',
      categoria: newMedData.categoria || 'Geral',
      precisa_receita: !!newMedData.precisa_receita,
      descricao: newMedData.descricao?.trim() || 'Medicamento regulado pela Autoridade de Saúde da Província de Tete.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.saveMedicine(fullMed, currentUser);
    CloudSync.syncMedicine(fullMed);
    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'CADASTRAR_MEDICAMENTO_OFICIAL',
      entity: 'medicine',
      entity_id: fullMed.id,
      metadata: `Cadastrado novo medicamento regulado: "${fullMed.nome}" (${fullMed.principio_ativo}).`,
    });

    showToast(`Medicamento oficial "${fullMed.nome}" adicionado com sucesso!`);
    setShowCreateModal(false);
    onRefresh();
  };

  // Submit Sanitary Recall / Alert
  const handleConfirmRecall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recallItem) return;

    FarmaLinkDB.addAuditLog({
      user_id: currentUser.user_id,
      user_name: currentUser.nome,
      user_email: currentUser.email,
      action: 'ALERTA_SANITARIO_RECOLHA',
      entity: 'medicine',
      metadata: `[${recallSeverity.toUpperCase()}] Medicamento: ${recallItem.nome}. Lote: ${recallLotNumber || 'Todos'}. Motivo: ${recallReason}`,
    });

    showToast(`Alerta Sanitário (${recallSeverity}) emitido para ${recallItem.nome}. Registado na auditoria provincial.`);
    setRecallItem(null);
    setRecallLotNumber('');
    setRecallReason('');
    onRefresh();
  };

  // Export Master Catalog to CSV
  const handleExportMasterCsv = () => {
    const headers = [
      'ID_Mestre',
      'Nome_Comercial',
      'Principio_Ativo_DCI',
      'Concentracao',
      'Forma_Farmaceutica',
      'Apresentacao',
      'Categoria',
      'Receita_Obrigatoria',
      'Fabricante_Padrao',
      'Preco_Sugerido_MZN',
      'Codigo_ATC',
      'Ativo_Em_Tete',
    ];

    const rows = filteredCatalog.map((item) => {
      const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
      const isPublished = activeKeysMap.has(key) ? 'SIM' : 'NAO';
      return [
        `"${item.id}"`,
        `"${item.nome.replace(/"/g, '""')}"`,
        `"${item.principio_ativo.replace(/"/g, '""')}"`,
        `"${item.concentracao.replace(/"/g, '""')}"`,
        `"${item.forma_farmaceutica.replace(/"/g, '""')}"`,
        `"${item.apresentacao.replace(/"/g, '""')}"`,
        `"${item.categoria.replace(/"/g, '""')}"`,
        item.precisa_receita ? '"SIM (Rx)"' : '"NAO (OTC)"',
        `"${item.fabricante_padrao.replace(/"/g, '""')}"`,
        item.preco_sugerido_mzn,
        `"${item.codigo_atc || ''}"`,
        `"${isPublished}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_mestre_medicamentos_tete_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catálogo Mestre exportado em CSV com sucesso!');
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>Governança Regulatória do Catálogo Mestre • Província de Tete</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Controle do Catálogo Mestre ({fullCatalog.length.toLocaleString('pt-MZ')} Medicamentos)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium max-w-2xl leading-relaxed">
              Base oficial padronizada segundo o Formulário Nacional de Medicamentos do MISAU e diretrizes internacionais. O Administrador pode homologar novos fármacos, publicar itens em massa para a província e emitir alertas sanitários.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              id="admin-publish-essential-kit-btn"
              onClick={handlePublishEssentialKit}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Publica instantaneamente os 20 medicamentos de maior relevância epidemiológica para Tete"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Publicar Kit Essencial (20 Itens)</span>
            </button>

            <button
              type="button"
              id="admin-create-custom-med-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fármaco Oficial</span>
            </button>

            <button
              type="button"
              onClick={handleExportMasterCsv}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Exportar Base (CSV)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-800/60 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-emerald-300 text-[11px] block font-semibold">Total no Catálogo Mestre</span>
            <strong className="text-lg font-black text-white">{fullCatalog.length.toLocaleString('pt-MZ')} Fármacos</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-emerald-300 text-[11px] block font-semibold">Ativos no FarmaLink Tete</span>
            <strong className="text-lg font-black text-emerald-400">{provincialMedicines.length} Cadastrados</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-amber-300 text-[11px] block font-semibold">Exigem Receita Médica</span>
            <strong className="text-lg font-black text-amber-300">
              {fullCatalog.filter((m) => m.precisa_receita).length.toLocaleString('pt-MZ')} (Rx)
            </strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-teal-300 text-[11px] block font-semibold">Venda Livre (OTC)</span>
            <strong className="text-lg font-black text-teal-300">
              {fullCatalog.filter((m) => !m.precisa_receita).length.toLocaleString('pt-MZ')} (Livre)
            </strong>
          </div>
        </div>
      </div>

      {/* Main Governance Controls and Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="admin-master-catalog-search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar entre 5.000+ medicamentos por nome comercial, DCI, fabricante ou código ATC..."
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Categorias ({fullCatalog.length})</option>
              {categoriesList.map(([cat, count]) => (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              ))}
            </select>

            <select
              value={prescriptionFilter}
              onChange={(e) => {
                setPrescriptionFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Qualquer Regime</option>
              <option value="rx">Apenas Receita Obrigatória (Rx)</option>
              <option value="otc">Apenas Venda Livre (OTC)</option>
            </select>

            <select
              value={syncStatusFilter}
              onChange={(e) => {
                setSyncStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Estados</option>
              <option value="published">Já Ativos em Tete</option>
              <option value="not_published">Ainda Não Publicados</option>
            </select>
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {selectedItemIds.size > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-400 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
                {selectedItemIds.size}
              </span>
              <span className="text-xs font-bold text-emerald-950">
                medicamento(s) selecionado(s) para homologação provincial em lote
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedItemIds(new Set())}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                Desmarcar Todos
              </button>

              <button
                type="button"
                onClick={handlePublishSelectedBatch}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Publicar {selectedItemIds.size} Selecionados no FarmaLink Tete</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Counter & Pagination Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllPage}
              className="text-slate-700 hover:text-emerald-700 font-bold flex items-center gap-1.5"
            >
              {paginatedItems.length > 0 && paginatedItems.every((item) => selectedItemIds.has(item.id)) ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Selecionar Página</span>
            </button>
            <span>•</span>
            <span>
              Mostrando <strong>{paginatedItems.length}</strong> de <strong>{filteredCatalog.length.toLocaleString('pt-MZ')}</strong> medicamentos encontrados
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table of Master Medicines */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="py-3 px-2">Medicamento Comercial</th>
                <th className="py-3 px-2">Princípio Ativo (DCI)</th>
                <th className="py-3 px-2">Dosagem & Forma</th>
                <th className="py-3 px-2">Categoria Terapêutica</th>
                <th className="py-3 px-2">Regime de Receita</th>
                <th className="py-3 px-2">Status Provincial</th>
                <th className="py-3 px-3 text-right">Ações Regulatórias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => {
                const key = `${item.nome.toLowerCase().trim()}|${item.concentracao.toLowerCase().trim()}`;
                const isPublished = activeKeysMap.has(key);
                const isSelected = selectedItemIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'}`}
                  >
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-2 font-bold text-slate-900">
                      <div>
                        <p className="font-black text-slate-900 leading-snug">{item.nome}</p>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Fabricante: {item.fabricante_padrao}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-slate-700 font-semibold">
                      <span>{item.principio_ativo}</span>
                      {item.codigo_atc && (
                        <span className="block text-[10px] text-emerald-700 font-mono">
                          ATC: {item.codigo_atc}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-slate-600">
                      <strong className="text-emerald-800 font-bold block">{item.concentracao}</strong>
                      <span className="text-[10px] text-slate-400">
                        {item.forma_farmaceutica} • {item.apresentacao}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-slate-600 font-medium">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                        {item.categoria}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      {item.precisa_receita ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Receita Médica (Rx)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Venda Livre (OTC)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2">
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ativo em Tete</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Não publicado
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {!isPublished ? (
                        <button
                          type="button"
                          onClick={() => handlePublishSingle(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="Publicar este medicamento no catálogo oficial de Tete"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Publicar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublishSingle(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg inline-flex items-center gap-1 transition-all"
                          title="Sincronizar e atualizar ficha técnica deste medicamento"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Sincronizar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setRecallItem(item)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg border border-red-200 inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Emitir aviso ou recolha sanitária de lote"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        <span>Alerta</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredCatalog.length.toLocaleString('pt-MZ')} itens no filtro)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(1)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
            >
              Primeira
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="px-2 font-black text-slate-800">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
            >
              Próxima
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(totalPages)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
            >
              Última
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Cadastrar Novo Fármaco Oficial na Província */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Fármaco Oficial</h3>
                  <p className="text-xs text-slate-500">Regulação e homologação provincial de novo medicamento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nome Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paracetamol FarmaTete"
                    value={newMedData.nome || ''}
                    onChange={(e) => setNewMedData({ ...newMedData, nome: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Princípio Ativo (DCI) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paracetamol"
                    value={newMedData.principio_ativo || ''}
                    onChange={(e) => setNewMedData({ ...newMedData, principio_ativo: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Concentração / Dosagem *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 500 mg"
                    value={newMedData.concentracao || ''}
                    onChange={(e) => setNewMedData({ ...newMedData, concentracao: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Forma Farmacêutica</label>
                  <select
                    value={newMedData.forma_farmaceutica}
                    onChange={(e) => setNewMedData({ ...newMedData, forma_farmaceutica: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Comprimidos">Comprimidos</option>
                    <option value="Cápsulas">Cápsulas</option>
                    <option value="Xarope">Xarope</option>
                    <option value="Suspensão Oral">Suspensão Oral</option>
                    <option value="Solução Injetável">Solução Injetável</option>
                    <option value="Pomada / Creme">Pomada / Creme</option>
                    <option value="Gotas Oftálmicas">Gotas Oftálmicas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Categoria</label>
                  <select
                    value={newMedData.categoria}
                    onChange={(e) => setNewMedData({ ...newMedData, categoria: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Analgésicos e Antipiréticos">Analgésicos e Antipiréticos</option>
                    <option value="Antibióticos">Antibióticos</option>
                    <option value="Antimaláricos">Antimaláricos</option>
                    <option value="Anti-inflamatórios">Anti-inflamatórios</option>
                    <option value="Cardiovasculares">Cardiovasculares</option>
                    <option value="Antidiabéticos">Antidiabéticos</option>
                    <option value="Gastrointestinais">Gastrointestinais</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Saúde Materno-Infantil">Saúde Materno-Infantil</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Apresentação Padrão</label>
                <input
                  type="text"
                  placeholder="Ex: Caixa com 20 comprimidos em blister"
                  value={newMedData.apresentacao || ''}
                  onChange={(e) => setNewMedData({ ...newMedData, apresentacao: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Exige Prescrição Médica (Receita)?</p>
                  <p className="text-[11px] text-slate-500">Se ativo, utentes terão de anexar receita na reserva.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!newMedData.precisa_receita}
                  onChange={(e) => setNewMedData({ ...newMedData, precisa_receita: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Descrição / Instruções Regulatórias</label>
                <textarea
                  rows={2}
                  placeholder="Indicações terapêuticas, posologia padrão ou advertências sanitárias..."
                  value={newMedData.descricao || ''}
                  onChange={(e) => setNewMedData({ ...newMedData, descricao: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar no Catálogo Oficial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alerta Sanitário / Recolha de Lote */}
      {recallItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-red-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Emissão de Alerta Sanitário / Recall</h3>
                  <p className="text-xs text-slate-500">Notificação oficial para a rede de farmácias de Tete</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecallItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl text-xs text-red-950 space-y-1">
              <p className="font-bold">Medicamento Alvo: {recallItem.nome}</p>
              <p className="text-red-800">Princípio Ativo: {recallItem.principio_ativo} ({recallItem.concentracao})</p>
            </div>

            <form onSubmit={handleConfirmRecall} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Severidade da Notificação</label>
                <select
                  value={recallSeverity}
                  onChange={(e) => setRecallSeverity(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  <option value="Recolha Imediata">Recolha Imediata (Bloqueio total de comercialização)</option>
                  <option value="Quarentena">Quarentena Cautelar (Suspensão preventiva de lote)</option>
                  <option value="Aviso">Aviso Sanitário / Advertência Técnica</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Número do Lote Específico (ou "Todos os Lotes")</label>
                <input
                  type="text"
                  placeholder="Ex: LOT-2026-AB12 ou Todos"
                  value={recallLotNumber}
                  onChange={(e) => setRecallLotNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Justificativa Sanitária / Notificação do MISAU *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o motivo sanitário (ex: desvio de qualidade, suspeita de falsificação, instrução de recall pela DPS Tete)..."
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecallItem(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Emitir Alerta & Registar Auditoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
