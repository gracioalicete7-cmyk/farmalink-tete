import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Bell,
  Star,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
  Sparkles,
  Package,
  Share2,
} from 'lucide-react';
import { Pharmacy, UserProfile, Order, PharmacyReview, StockAlert } from '../types';
import { StorageService } from '../lib/storage';

interface DirectorAnalyticsSectionProps {
  pharmacy: Pharmacy;
  currentUser: UserProfile;
  orders: Order[];
}

export const DirectorAnalyticsSection: React.FC<DirectorAnalyticsSectionProps> = ({
  pharmacy,
  currentUser,
  orders,
}) => {
  const analyticsData = StorageService.getDirectorAnalytics(pharmacy.id);
  const reviews = StorageService.getPharmacyReviews(pharmacy.id);
  const stockAlerts = StorageService.getStockAlerts().filter(
    (a) => !a.pharmacy_id || a.pharmacy_id === pharmacy.id
  );

  const [filterPeriod, setFilterPeriod] = useState<'30' | '90' | 'all'>('30');
  const [replenishedSuccessId, setReplenishedSuccessId] = useState<string | null>(null);

  // Demand Chart Data
  const topDemandData = analyticsData.topSearchedMedicines.map((m) => ({
    name: m.nome.split(' ')[0],
    fullName: m.nome,
    procura: m.procura,
    disponibilidade: m.disponibilidade,
  }));

  // Peak Hours Chart Data
  const peakHoursData = analyticsData.peakHours.map((h) => ({
    hora: h.hora,
    pedidos: h.pedidos,
  }));

  // Rating Stats
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '4.8';

  const categoryDistribution = [
    { name: 'Antibióticos & Infecções', value: 38, color: '#059669' },
    { name: 'Analgesia & Febre', value: 27, color: '#0d9488' },
    { name: 'Anti-hipertensivos & Coração', value: 20, color: '#3b82f6' },
    { name: 'Antimaláricos & Outros', value: 15, color: '#f59e0b' },
  ];

  const handleSimulateRestock = (alert: StockAlert) => {
    setReplenishedSuccessId(alert.id);
    StorageService.deleteStockAlert(alert.id);
    setTimeout(() => setReplenishedSuccessId(null), 3000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Print / Export */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inteligência de Mercado Farmacêutico</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Relatórios & Procura de Medicamentos em Tete
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Análise em tempo real de tendências de busca, horários de pico e alertas de utentes na Província de Tete.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Official Header for Print Mode */}
      <div className="hidden print:block p-6 border-b-2 border-slate-800 text-slate-900 space-y-2">
        <h1 className="text-2xl font-black">FarmaLink Tete • Relatório Técnico de Gestão</h1>
        <p className="text-sm">
          <strong>Farmácia:</strong> {pharmacy.nome} • <strong>Director Técnico:</strong> {pharmacy.director_name || currentUser.nome}
        </p>
        <p className="text-xs text-slate-500">
          Emitido em: {new Date().toLocaleString('pt-MZ')} • Província de Tete, Moçambique
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Pedidos</span>
            <Package className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{orders.length}</p>
          <span className="text-[11px] text-emerald-700 font-bold">+18% vs mês anterior</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-teal-600">
            <span className="text-xs font-bold text-slate-500 uppercase">Alertas Reposição</span>
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stockAlerts.length}</p>
          <span className="text-[11px] text-amber-700 font-bold">Utentes aguardando stock</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold text-slate-500 uppercase">Avaliação Média</span>
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{avgRating} / 5.0</p>
          <span className="text-[11px] text-slate-500">{reviews.length} avaliações</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold text-slate-500 uppercase">Horário Mais Forte</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">17:00 - 19:00</p>
          <span className="text-[11px] text-blue-700 font-bold">Pós-laboral em Tete</span>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Procura de Medicamentos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Medicamentos Mais Procurados em Tete
                </h3>
                <p className="text-xs text-slate-500">Volume de buscas e reservas por mês</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(value: any) => [`${value} pesquisas/mês`, 'Procura em Tete']}
                  labelFormatter={(label: any, payload: any) => payload[0]?.payload?.fullName || label}
                />
                <Bar dataKey="procura" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Horários de Pico */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Horários de Pico de Pedidos
                </h3>
                <p className="text-xs text-slate-500">Fluxo horário de reservas e levantamentos</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(value: any) => [`${value} pedidos`, 'Volume']}
                />
                <Bar dataKey="pedidos" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Restock Waiting List (Alertas Ativos dos Cidadãos) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Lista de Espera de Reposição de Stock
              </h3>
              <p className="text-xs text-slate-500">
                Utentes em Tete que solicitaram ser notificados assim que houver stock destes fármacos
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full shrink-0">
            {stockAlerts.length} Utentes no Radar
          </span>
        </div>

        {stockAlerts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Nenhum alerta de stock pendente para a sua farmácia no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {stockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm">{alert.medicine_nome}</h4>
                    <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                      Alta Prioridade de Reposição
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Utente: <strong>{alert.user_nome}</strong> • Telefone: {alert.user_telefone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {replenishedSuccessId === alert.id ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Notificação Enviada ao Utente!
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulateRestock(alert)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Notificar Entrada de Stock</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Reviews & Feedback for Director */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Avaliações Recebidas da Comunidade
              </h3>
              <p className="text-xs text-slate-500">Transparência e satisfação dos utentes de Tete</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-bold text-slate-900">{rev.user_nome} ({rev.user_bairro})</h5>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(rev.created_at).toLocaleDateString('pt-MZ')}
                </span>
              </div>
              <p className="text-slate-700 italic">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
