import React, { useState } from 'react';
import { FarmaLinkDB, StorageService } from '../lib/storage';
import { UserProfile, Order, OrderStatus } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { RealChatModal } from '../components/RealChatModal';
import { OrderVoucherModal } from '../components/OrderVoucherModal';
import { DeliveryTrackingModal } from '../components/DeliveryTrackingModal';
import { FarmaLinkLogo } from '../lib/logo';
import { ScreenHeader } from '../components/ScreenHeader';
import confetti from 'canvas-confetti';
import {
  FileText,
  Clock,
  Store,
  Pill,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Phone,
  RotateCcw,
  Calendar,
  Eye,
  Copy,
  Check,
  Printer,
  Share2,
  MessageSquare,
  Sparkles,
  Search,
  ShieldCheck,
  MapPin,
  QrCode,
  ArrowRight,
  HelpCircle,
  Truck,
  X,
  Star,
  Bell,
  Award,
} from 'lucide-react';

interface UserOrdersViewProps {
  currentUser: UserProfile;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

export const UserOrdersView: React.FC<UserOrdersViewProps> = ({ currentUser, onNavigate, onBack }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const [voucherOrder, setVoucherOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [confirmObtainedOrder, setConfirmObtainedOrder] = useState<Order | null>(null);
  const [obtainedRating, setObtainedRating] = useState<number>(5);
  const [obtainedComment, setObtainedComment] = useState<string>('Medicamento obtido com sucesso na farmácia.');
  const [obtainedScheduleReminder, setObtainedScheduleReminder] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const orders = FarmaLinkDB.getOrders({ userId: currentUser.user_id });

  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter === 'active' && ['Concluído', 'Cancelado', 'Rejeitado'].includes(order.status)) {
      return false;
    }
    if (statusFilter === 'completed' && order.status !== 'Concluído') {
      return false;
    }
    if (statusFilter === 'cancelled' && !['Cancelado', 'Rejeitado'].includes(order.status)) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMed = order.medicine_nome.toLowerCase().includes(q);
      const matchPharm = order.pharmacy_nome.toLowerCase().includes(q);
      const matchId = order.id.toLowerCase().includes(q);
      return matchMed || matchPharm || matchId;
    }

    return true;
  });

  const activeCount = orders.filter(
    (o) => !['Concluído', 'Cancelado', 'Rejeitado'].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) => o.status === 'Concluído').length;
  const cancelledCount = orders.filter((o) => ['Cancelado', 'Rejeitado'].includes(o.status)).length;

  const handleCancelOrder = (orderId: string) => {
    FarmaLinkDB.updateOrderStatus(
      orderId,
      'Cancelado',
      'Cancelado a pedido do utente',
      currentUser
    );
    setConfirmCancelId(null);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(FarmaLinkDB.getOrderById(orderId) || null);
    }
    if (ticketOrder?.id === orderId) {
      setTicketOrder(FarmaLinkDB.getOrderById(orderId) || null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getPickupCode = (orderId: string) => {
    const clean = orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `FL-TETE-${clean.slice(-4) || '8842'}`;
  };

  const getWhatsAppLink = (order: Order) => {
    const phone = (order.pharmacy_telefone || '+258841234567').replace(/[^0-9]/g, '');
    const code = getPickupCode(order.id);
    const text = encodeURIComponent(
      `Olá ${order.pharmacy_nome}! Gostaria de confirmar o estado da minha reserva FarmaLink.\n` +
      `Código de Levantamento: ${code}\n` +
      `Medicamento: ${order.medicine_nome} (Qtd: ${order.quantidade})\n` +
      `Nome do Utente: ${order.user_nome}`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pronto para levantamento':
        return { bg: 'bg-emerald-600 text-white font-bold', border: 'border-emerald-600', icon: CheckCircle2 };
      case 'Disponível':
      case 'Reservado':
        return { bg: 'bg-emerald-100 text-emerald-800 font-bold', border: 'border-emerald-300', icon: CheckCircle2 };
      case 'Enviado':
      case 'Recebido':
      case 'Em análise':
        return { bg: 'bg-blue-100 text-blue-800 font-semibold', border: 'border-blue-300', icon: Clock };
      case 'Concluído':
        return { bg: 'bg-slate-100 text-slate-700 font-medium', border: 'border-slate-300', icon: CheckCircle2 };
      case 'Cancelado':
      case 'Rejeitado':
      case 'Não disponível':
        return { bg: 'bg-rose-100 text-rose-800 font-medium', border: 'border-rose-300', icon: XCircle };
      default:
        return { bg: 'bg-slate-100 text-slate-700', border: 'border-slate-300', icon: Clock };
    }
  };

  return (
    <div id="user-orders-view" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Navigation & Exit Bar */}
      {onBack && (
        <ScreenHeader
          title="Minhas Reservas & Pedidos"
          subtitle="Painel de Acompanhamento do Utente"
          onBack={onBack}
          exitLabel="Sair"
          backLabel="Página anterior"
        />
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Painel do Utente • FarmaLink Tete</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              <span>Minhas Reservas & Solicitações</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Consulte códigos de levantamento, histórico de pedidos e contacte as farmácias em Tete.
            </p>
          </div>

          <button
            type="button"
            id="orders-new-search-btn"
            onClick={() => onNavigate('medicines')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto hover:shadow-md active:scale-95"
          >
            <Pill className="w-4 h-4" />
            <span>Solicitar Novo Medicamento</span>
          </button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            id="filter-orders-all"
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span className="text-xs font-bold block">Todos os Pedidos</span>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>
              {orders.length}
            </p>
          </button>

          <button
            type="button"
            id="filter-orders-active"
            onClick={() => setStatusFilter('active')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/60 text-emerald-900'
            }`}
          >
            <span className="text-xs font-bold block">Em Andamento</span>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${statusFilter === 'active' ? 'text-white' : 'text-emerald-950'}`}>
              {activeCount}
            </p>
          </button>

          <button
            type="button"
            id="filter-orders-completed"
            onClick={() => setStatusFilter('completed')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'completed'
                ? 'bg-blue-700 text-white border-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/60 text-blue-900'
            }`}
          >
            <span className="text-xs font-bold block">Concluídos / Levantados</span>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${statusFilter === 'completed' ? 'text-white' : 'text-blue-950'}`}>
              {completedCount}
            </p>
          </button>

          <button
            type="button"
            id="filter-orders-cancelled"
            onClick={() => setStatusFilter('cancelled')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'cancelled'
                ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/60 text-rose-900'
            }`}
          >
            <span className="text-xs font-bold block">Cancelados / Rejeitados</span>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${statusFilter === 'cancelled' ? 'text-white' : 'text-rose-950'}`}>
              {cancelledCount}
            </p>
          </button>
        </div>

        {/* Live Search Box */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome do medicamento, farmácia ou código..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <DisclaimerBanner compact />

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Nenhum pedido encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Não foram encontradas solicitações com os filtros atuais. Realize uma busca no catálogo das farmácias de Tete.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('medicines')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Consultar Catálogo de Remédios
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;
            const canCancel = ['Enviado', 'Recebido', 'Em análise'].includes(order.status);
            const pickupCode = getPickupCode(order.id);
            const isReadyForPickup = order.status === 'Pronto para levantamento' || order.status === 'Reservado' || order.status === 'Disponível';

            return (
              <div
                key={order.id}
                id={`order-item-${order.id}`}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                      #{order.id.toUpperCase().slice(-6)}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{order.medicine_nome}</h3>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Qtd: {order.quantidade} un.
                    </span>
                    {isReadyForPickup && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Código: {pickupCode}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">{order.pharmacy_nome}</span>
                    </p>

                    {order.pharmacy_telefone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${order.pharmacy_telefone}`} className="text-emerald-700 hover:underline font-semibold">
                          {order.pharmacy_telefone}
                        </a>
                      </p>
                    )}
                  </div>

                  {order.usa_seguro && (
                    <div className="bg-blue-50/80 border border-blue-200 text-blue-950 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Seguro: {order.seguradora_nome || 'Convénio'} (Cartão: {order.numero_cartao_seguro || '—'})</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                        {order.autorizacao_seguro_status === 'autorizado'
                          ? '✓ Autorizado pela Seguradora'
                          : order.autorizacao_seguro_status === 'nao_autorizado'
                          ? '✕ Não Coberto'
                          : '⏳ Em Pré-Autorização'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(order.created_at).toLocaleDateString('pt-MZ')} às{' '}
                        {new Date(order.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    {order.preco_total !== null && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-extrabold text-emerald-800 text-sm">
                          Valor Estimado: {order.preco_total.toFixed(2).replace('.', ',')} MZN
                        </span>
                      </>
                    )}
                  </div>

                  {order.status_note && (
                    <div className="text-xs bg-slate-50 text-slate-700 p-2.5 rounded-2xl border border-slate-200/80">
                      <span className="font-bold text-slate-900">Nota da Farmácia:</span> {order.status_note}
                    </div>
                  )}
                </div>

                {/* Status Badge and Action Buttons */}
                <div className="flex flex-col lg:items-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs border ${badge.bg} ${badge.border}`}
                  >
                    <BadgeIcon className="w-4 h-4" />
                    <span>{order.status}</span>
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botão de Confirmação de Aquisição / Levantamento Concluído */}
                    {order.status !== 'Concluído' && order.status !== 'Cancelado' && order.status !== 'Rejeitado' && (
                      <button
                        type="button"
                        id={`btn-confirm-obtained-${order.id}`}
                        onClick={() => {
                          setConfirmObtainedOrder(order);
                          setObtainedRating(5);
                          setObtainedComment('Medicamento obtido com sucesso através do FarmaLink Tete.');
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                        title="Confirmar que já comprou / levantou este medicamento na farmácia"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Já Obtive / Comprei</span>
                      </button>
                    )}

                    {/* View Digital Pickup Ticket / Guia Oficial PDF */}
                    <button
                      type="button"
                      id={`btn-ticket-${order.id}`}
                      onClick={() => setVoucherOrder(order)}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      title="Ver e Imprimir Guia Oficial / Recibo em PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Guia / Recibo PDF</span>
                    </button>

                    {/* Rastreio Txopela / Estafeta */}
                    <button
                      type="button"
                      onClick={() => setTrackingOrder(order)}
                      className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs rounded-xl border border-teal-300 flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      title="Rastrear Entrega Txopela / Moto-Estafeta"
                    >
                      <Truck className="w-3.5 h-3.5 text-teal-700" />
                      <span>Rastrear Entrega</span>
                    </button>

                    {/* WhatsApp Quick Chat */}
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 active:scale-95"
                      title="Falar com a farmácia via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    {/* Details / Timeline */}
                    <button
                      type="button"
                      id={`view-order-details-${order.id}`}
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      title="Ver Histórico de Estados"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Histórico</span>
                    </button>

                    {canCancel && (
                      <button
                        type="button"
                        id={`cancel-order-${order.id}`}
                        onClick={() => setConfirmCancelId(order.id)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancellation Confirmation Dialog */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Cancelar Pedido?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem a certeza de que deseja cancelar esta solicitação de medicamento? A farmácia será informada imediatamente do cancelamento.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Manter Pedido
              </button>
              <button
                type="button"
                id="confirm-cancel-order-action"
                onClick={() => handleCancelOrder(confirmCancelId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIGITAL PICKUP TICKET MODAL ================= */}
      {ticketOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTicketOrder(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Ticket Seal */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 text-center relative">
              <button
                type="button"
                onClick={() => setTicketOrder(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
              <div className="flex justify-center mb-1">
                <FarmaLinkLogo size="sm" showText={true} />
              </div>
              <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                Comprovativo Oficial de Reserva Farmacêutica
              </p>
              <span className="text-[10px] text-slate-400">Província de Tete • República de Moçambique</span>
            </div>

            {/* Ticket Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Pickup Code Display */}
              <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-500 rounded-3xl p-5 text-center space-y-2">
                <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-widest block">
                  Código de Levantamento no Balcão
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-wider font-mono">
                  {getPickupCode(ticketOrder.id)}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getPickupCode(ticketOrder.id))}
                    className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 font-bold text-xs flex items-center gap-1 shadow-2xs transition-all"
                  >
                    {copiedCode === getPickupCode(ticketOrder.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Order Info Rows / Detailed Cost Breakdown & Pharmacy Details */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Medicamento:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{ticketOrder.medicine_nome}</span>
                    <span className="text-[11px] text-slate-500">{ticketOrder.quantidade} unidade(s)</span>
                  </div>
                </div>

                <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Farmácia Emitente:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{ticketOrder.pharmacy_nome}</span>
                    {ticketOrder.pharmacy_telefone && (
                      <span className="text-slate-500 text-[11px] block">{ticketOrder.pharmacy_telefone}</span>
                    )}
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      Alvará Sanitário DPS Homologado
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Utente / Titular:</span>
                  <span className="font-semibold text-slate-800">{ticketOrder.user_nome}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Data & Hora:</span>
                  <span className="text-slate-700">
                    {new Date(ticketOrder.created_at).toLocaleDateString('pt-MZ')} às{' '}
                    {new Date(ticketOrder.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Estado da Reserva:</span>
                  <span className="font-bold text-emerald-800">{ticketOrder.status}</span>
                </div>

                {/* Detailed Cost Breakdown */}
                {ticketOrder.preco_total !== null && (
                  <div className="pt-2 space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Preço Unitário Estimado:</span>
                      <span>{(ticketOrder.preco_total / ticketOrder.quantidade).toFixed(2).replace('.', ',')} MZN</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Quantidade:</span>
                      <span>{ticketOrder.quantidade}x</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Taxa de Reserva FarmaLink:</span>
                      <span className="text-emerald-700 font-bold">0,00 MZN (Gratuito)</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold text-slate-900">
                      <span className="text-xs">Valor Total a Pagar no Balcão:</span>
                      <span className="font-black text-emerald-800 text-sm">
                        {ticketOrder.preco_total.toFixed(2).replace('.', ',')} MZN
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Orientações Sanitárias de Levantamento:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  1. Apresente este código no balcão da farmácia.<br />
                  2. Para medicamentos sujeitos a receita médica, é obrigatório apresentar a receita física original válida emitida por profissional de saúde.<br />
                  3. O pagamento é realizado diretamente no balcão (Numerário, M-Pesa, E-Mola ou POS).
                </p>
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href={getWhatsAppLink(ticketOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Avisar Farmácia</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER STATUS TIMELINE MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Histórico e Auditoria do Pedido
                </span>
                <h3 className="font-bold text-slate-900 text-lg">#{selectedOrder.id.toUpperCase()}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <p className="font-bold text-slate-900 text-sm">{selectedOrder.medicine_nome}</p>
              <p className="text-slate-600">
                Farmácia: <span className="font-semibold text-slate-800">{selectedOrder.pharmacy_nome}</span>
              </p>
              <p className="text-slate-600">
                Quantidade solicitada: <span className="font-semibold text-slate-800">{selectedOrder.quantidade} unidades</span>
              </p>
              {selectedOrder.preco_total !== null && (
                <p className="text-slate-600">
                  Valor Estimado: <span className="font-bold text-emerald-800">{selectedOrder.preco_total.toFixed(2).replace('.', ',')} MZN</span>
                </p>
              )}

              {selectedOrder.payment_method && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-700">Pagamento:</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                    {selectedOrder.payment_method === 'mpesa'
                      ? 'M-Pesa (Vodacom)'
                      : selectedOrder.payment_method === 'emola'
                      ? 'e-Mola (Movitel)'
                      : 'No Balcão'}
                  </span>
                  {selectedOrder.payment_tx_id && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Ref: {selectedOrder.payment_tx_id}
                    </span>
                  )}
                </div>
              )}

              {selectedOrder.prescription_url && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 mt-2">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Receita Médica Anexada:</span>
                  </span>
                  {selectedOrder.prescription_url.startsWith('data:image') || selectedOrder.prescription_url.startsWith('http') ? (
                    <img
                      src={selectedOrder.prescription_url}
                      alt="Receita Médica"
                      className="w-full max-h-44 object-contain rounded-lg border border-emerald-200 bg-white"
                    />
                  ) : (
                    <p className="text-[11px] text-emerald-800">Ficheiro de receita anexado e verificado.</p>
                  )}
                </div>
              )}

              {selectedOrder.observacao && (
                <p className="text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200">
                  " {selectedOrder.observacao} "
                </p>
              )}
            </div>

            {/* Status Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-3">Linha do Tempo de Estados</h4>
              <div className="space-y-3 pl-2 border-l-2 border-emerald-500/40 ml-2">
                {FarmaLinkDB.getOrderStatusHistory(selectedOrder.id).map((history) => (
                  <div key={history.id} className="relative pl-4">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-500/20"></div>
                    <p className="font-bold text-slate-900 text-xs">{history.status}</p>
                    {history.note && <p className="text-[11px] text-slate-600 mt-0.5">{history.note}</p>}
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {new Date(history.created_at).toLocaleDateString('pt-MZ')} às{' '}
                      {new Date(history.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })} • por {history.changed_by_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setChatOrder(selectedOrder);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mensagem com a Farmácia</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const ord = selectedOrder;
                  setSelectedOrder(null);
                  setTicketOrder(ord);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs"
              >
                Abrir Comprovativo / Ticket
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Pharmacist Chat Modal */}
      {chatOrder && (
        <RealChatModal
          isOpen={!!chatOrder}
          onClose={() => setChatOrder(null)}
          pharmacyId={chatOrder.pharmacy_id}
          pharmacyNome={chatOrder.pharmacy_nome}
          currentUser={currentUser}
          orderId={chatOrder.id}
        />
      )}

      {/* Official PDF Voucher / Receipt Modal */}
      {voucherOrder && (
        <OrderVoucherModal
          isOpen={!!voucherOrder}
          onClose={() => setVoucherOrder(null)}
          order={voucherOrder}
        />
      )}

      {/* Real-time Txopela / Courier Delivery Tracker Modal */}
      {trackingOrder && (
        <DeliveryTrackingModal
          isOpen={!!trackingOrder}
          onClose={() => setTrackingOrder(null)}
          order={trackingOrder}
        />
      )}

      {/* ================= MODAL: CONFIRMAR AQUISIÇÃO / LEVANTAMENTO CONCLUÍDO ================= */}
      {confirmObtainedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmObtainedOrder(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setConfirmObtainedOrder(null)}
                className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Confirmação de Levantamento</span>
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white">
                Medicamento Obtido com Sucesso!
              </h3>
              <p className="text-xs text-emerald-100 mt-1">
                Ao confirmar, o estado da sua reserva passará a <strong>Concluído</strong> e ajudará outros utentes em Tete.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Medicamento</span>
                  <span className="font-mono text-[10px] text-slate-500">#{confirmObtainedOrder.id.slice(-6).toUpperCase()}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{confirmObtainedOrder.medicine_nome}</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{confirmObtainedOrder.pharmacy_nome}</span>
                </p>
              </div>

              {/* Rating */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Avaliar a Farmácia ({confirmObtainedOrder.pharmacy_nome})</label>
                  <span className="text-amber-600 font-bold text-[11px]">
                    {obtainedRating === 5 ? '⭐⭐⭐⭐⭐ Excelente' : obtainedRating === 4 ? '⭐⭐⭐⭐ Muito Bom' : '⭐⭐⭐ Bom'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setObtainedRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          obtainedRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={obtainedComment}
                  onChange={(e) => setObtainedComment(e.target.value)}
                  placeholder="Conte como foi o atendimento ou disponibilidade..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Medication Reminder Option */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={obtainedScheduleReminder}
                    onChange={(e) => setObtainedScheduleReminder(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Criar Lembretes de Toma para este Medicamento
                    </span>
                    <span className="text-[11px] text-emerald-800 leading-tight block mt-0.5">
                      Adicionar horários no seu painel de saúde FarmaLink Tete para tomar nos intervalos corretos.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmObtainedOrder(null)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  id="btn-finalize-obtained-order"
                  onClick={() => {
                    const orderId = confirmObtainedOrder.id;
                    // 1. Concluir pedido
                    FarmaLinkDB.updateOrderStatus(
                      orderId,
                      'Concluído',
                      'Medicamento obtido e confirmado pelo utente através do FarmaLink Tete.',
                      currentUser
                    );

                    // 2. Registar Avaliação
                    if (obtainedRating > 0 && obtainedComment.trim()) {
                      try {
                        StorageService.addPharmacyReview({
                          pharmacy_id: confirmObtainedOrder.pharmacy_id,
                          user_id: currentUser.user_id,
                          user_nome: currentUser.nome,
                          user_bairro: currentUser.bairro || 'Tete',
                          rating: obtainedRating,
                          comment: obtainedComment.trim(),
                          order_id: orderId,
                          is_verified_buyer: true,
                        });
                      } catch {
                        // ignore
                      }
                    }

                    // 3. Agendar Lembretes de Toma
                    if (obtainedScheduleReminder) {
                      try {
                        FarmaLinkDB.saveMedicationReminder({
                          user_id: currentUser.user_id,
                          medicine_nome: `${confirmObtainedOrder.medicine_nome} ${confirmObtainedOrder.medicine_concentracao || ''}`,
                          dosagem: '1 dose conforme receita/bula',
                          frequencia_horas: 8,
                          horarios: ['08:00', '16:00', '00:00'],
                          dias_duracao: 5,
                          data_inicio: new Date().toISOString().split('T')[0],
                          instrucoes: `Adquirido na ${confirmObtainedOrder.pharmacy_nome}.`,
                          ativo: true,
                        });
                      } catch {
                        // ignore
                      }
                    }

                    // 4. Confetti
                    confetti({
                      particleCount: 80,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
                    });

                    setConfirmObtainedOrder(null);
                    setRefreshKey((k) => k + 1);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Aquisição</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
