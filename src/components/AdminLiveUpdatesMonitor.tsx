import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Store,
  Pill,
  ShoppingBag,
  User,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditLog, Order, Pharmacy, PharmacyMedicine, UserProfile } from '../types';
import { FarmaLinkDB } from '../lib/storage';

interface AdminLiveUpdatesMonitorProps {
  logs: AuditLog[];
  orders: Order[];
  pharmacies: Pharmacy[];
  inventory: PharmacyMedicine[];
  currentUser: UserProfile;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const AdminLiveUpdatesMonitor: React.FC<AdminLiveUpdatesMonitorProps> = ({
  logs,
  orders,
  pharmacies,
  inventory,
  currentUser,
  onRefresh,
  showToast,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'stock' | 'order' | 'pharmacy' | 'user' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const matchType = filterType === 'all' || log.entity === filterType;
      const matchSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q) ||
        (log.metadata && log.metadata.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [logs, filterType, searchQuery]);

  // Recent system events summary
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      showToast('Sem logs para exportar.');
      return;
    }
    const headers = ['ID', 'Data_Hora', 'Acao', 'Entidade', 'ID_Entidade', 'Executado_Por', 'Email_Utilizador', 'Detalhes_Metadata'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.created_at).toISOString()}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.entity}"`,
      `"${l.entity_id || ''}"`,
      `"${l.user_name.replace(/"/g, '""')}"`,
      `"${l.user_email || ''}"`,
      `"${(l.metadata || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_atualizacoes_farmalink_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Logs de auditoria e atualizações exportados com sucesso!');
  };

  const getActionBadge = (action: string, entity: string) => {
    if (action.includes('APROVAR') || action.includes('PUBLICAR') || action.includes('CONCLUIR')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (action.includes('ALERTA') || action.includes('RECOLHA') || action.includes('SUSPENDER') || action.includes('CANCELAR')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (action.includes('PRECO') || action.includes('ESTOQUE') || action.includes('STOCK')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-7 border border-slate-700 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-teal-900/80 border border-teal-500/40 text-teal-300 px-3 py-0.5 rounded-full text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>Acompanhamento Contínuo & Auditoria ao Vivo • Tete</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Monitor de Atualizações & Histórico de Operações
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Rastreamento imutável de todas as atualizações de estoque, alterações de preços por farmácias, novos pedidos de utentes, homologações sanitárias e acessos ao FarmaLink Tete.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onRefresh();
                showToast('Painel de atualizações sincronizado com a base de dados!');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Agora</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>Exportar Logs (CSV)</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700/70 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-slate-400 text-[11px] block font-medium">Total de Registos de Auditoria</span>
            <strong className="text-lg font-black text-white">{logs.length} Eventos</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-slate-400 text-[11px] block font-medium">Farmácias em Atividade</span>
            <strong className="text-lg font-black text-emerald-400">{pharmacies.filter((p) => p.status === 'Aprovada').length} Aprovadas</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-slate-400 text-[11px] block font-medium">Movimentações de Estoque</span>
            <strong className="text-lg font-black text-teal-300">{inventory.length} Itens Monitorados</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-slate-400 text-[11px] block font-medium">Pedidos / Reservas</span>
            <strong className="text-lg font-black text-amber-300">{orders.length} Transações</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por ação, responsável, farmácia ou medicamento..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Entidades ({logs.length})</option>
              <option value="stock">Estoque & Preços</option>
              <option value="pharmacy">Farmácias & Homologações</option>
              <option value="medicine">Medicamentos & Catálogo</option>
              <option value="order">Pedidos & Reservas</option>
              <option value="user">Utilizadores & Acessos</option>
              <option value="system">Sistema & Cloud</option>
            </select>
          </div>
        </div>

        {/* Live Feed List */}
        <div className="space-y-3 pt-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold">Nenhum registo de atividade encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md font-mono font-black text-[11px] border ${getActionBadge(log.action, log.entity)}`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      Entidade: {log.entity}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium">
                    Operador: <strong className="text-emerald-950 font-bold">{log.user_name}</strong>{' '}
                    <span className="text-slate-400 text-[11px]">({log.user_email || 'Sistema Provincial'})</span>
                  </p>

                  {log.metadata && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-slate-700 font-mono text-[11px] leading-relaxed">
                      {log.metadata}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                  <span className="text-[11px] font-bold text-slate-700">
                    {new Date(log.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(log.created_at).toLocaleDateString('pt-MZ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
