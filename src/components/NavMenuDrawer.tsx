import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Shield,
  Store,
  Building2,
  Search,
  MapPin,
  FileText,
  User,
  ExternalLink,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Phone,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  PlusCircle,
  SlidersHorizontal,
  Layers,
  HeartHandshake,
  Activity,
  AlertTriangle,
  FileCheck,
  Zap,
  KeyRound,
  Palette,
  Smartphone,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { FarmaLinkLogo } from '../lib/logo';
import { FarmaLinkDB } from '../lib/storage';

interface NavMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  currentUser: UserProfile;
  onSwitchUser?: (user: UserProfile) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
}

export const NavMenuDrawer: React.FC<NavMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigate,
  currentUser,
  onSwitchUser,
  onOpenAuth,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open and focus search
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const approvedPharmacies = FarmaLinkDB.getApprovedPharmacies();
  const pendingPharmacies = FarmaLinkDB.getPendingPharmacies();
  const medicines = FarmaLinkDB.getMedicines();
  const userOrders = FarmaLinkDB.getOrders({ userId: currentUser.user_id });
  const pendingOrdersCount = userOrders.filter(
    (o) =>
      o.status === 'Enviado' ||
      o.status === 'Recebido' ||
      o.status === 'Em análise' ||
      o.status === 'Reservado' ||
      o.status === 'Pronto para levantamento'
  ).length;

  const handleItemClick = (tab: string, params?: Record<string, unknown>) => {
    onNavigate(tab, params);
    onClose();
  };

  const handleRoleSwitch = (role: UserRole) => {
    const allProfiles = FarmaLinkDB.getProfiles();
    const target = allProfiles.find((p) => p.role === role) || {
      id: `prof-${role}-1`,
      user_id: role === 'director' ? 'dir-1' : role === 'admin' ? 'admin-1' : 'user-1',
      nome:
        role === 'director'
          ? 'Dr. Mário Cossa (Director Técnico)'
          : role === 'admin'
          ? 'Grácio Hortêncio César (Administrador Geral)'
          : 'Amélia Nhantumbo (Utente)',
      email:
        role === 'director'
          ? 'mario.cossa@farmaciacentral.co.mz'
          : role === 'admin'
          ? 'gracioalicete7@gmail.com'
          : 'amelia.utente@farmalink.mz',
      role: role,
      status: 'active',
      telefone: '+258 84 123 4567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.setCurrentUser(target);
    onSwitchUser?.(target);
    onClose();

    if (role === 'admin') {
      onNavigate('admin-portal');
    } else if (role === 'director') {
      onNavigate('director-portal', { tab: 'dashboard' });
    } else {
      onNavigate('home');
    }
  };

  // Main menu destinations items definition
  const allNavCards = [
    {
      id: 'home',
      tab: 'home',
      title: 'Início',
      subtitle: 'Página Inicial & Busca Inteligente',
      description: 'Pesquisa centralizada de medicamentos, farmácias de plantão 24h e destaques da província de Tete.',
      icon: Home,
      color: 'emerald',
      badge: 'Principal',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      category: 'principal',
      keywords: ['inicio', 'home', 'principal', 'busca', 'tete', 'plantao', 'destaque'],
    },
    {
      id: 'pharmacies',
      tab: 'pharmacies',
      title: 'Farmácias Cadastradas & Aprovadas',
      subtitle: 'Diretório Oficial Homologado DPS Tete',
      description: 'Catálogo de farmácias com alvará sanitário válido, localização por bairros, contactos e estoques.',
      icon: Store,
      color: 'teal',
      badge: `${approvedPharmacies.length} Homologadas`,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      category: 'principal',
      keywords: ['farmacias', 'aprovadas', 'cadastradas', 'bairros', 'chingodzi', 'matundo', 'degue', 'plantao'],
    },
    {
      id: 'medicines',
      tab: 'medicines',
      title: 'Pesquisa de Medicamentos',
      subtitle: 'Stock Real, Dosagens & Localização em Tete',
      description: 'Consulte disponibilidade, genéricos vs marcas, bula simplificada e faça reservas imediatas.',
      icon: Search,
      color: 'cyan',
      badge: `${medicines.length}+ Medicamentos`,
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      category: 'principal',
      keywords: ['medicamentos', 'remedios', 'comprimidos', 'pesquisa', 'precos', 'meticais', 'mzn', 'genericos'],
    },
    {
      id: 'map',
      tab: 'map',
      title: 'Mapa Geográfico de Tete',
      subtitle: 'Geolocalização & Cálculo de Rotas',
      description: 'Visualização interativa das farmácias na Cidade e Província de Tete, com cálculo de distância.',
      icon: MapPin,
      color: 'amber',
      badge: 'Interativo',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      category: 'principal',
      keywords: ['mapa', 'rotas', 'localizacao', 'gps', 'distancia', 'cidade de tete', 'moatize'],
    },
    {
      id: 'director-portal',
      tab: 'director-portal',
      title: 'Painel do Director Técnico',
      subtitle: 'Gestão de Farmácia, Estoque e Pedidos',
      description: 'Cadastro de farmácias com motivação técnica, gestão de estoque, pedidos de reserva e relatórios sanitários.',
      icon: Building2,
      color: 'emerald',
      badge: 'Director Técnico',
      badgeColor: 'bg-emerald-600 text-white border-emerald-700',
      category: 'gestao',
      keywords: ['director', 'tecnico', 'painel', 'gestao', 'estoque', 'pedidos', 'farmacia', 'cadastro', 'motivacao'],
      onClick: () => {
        if (currentUser.role !== 'director') {
          handleRoleSwitch('director');
        } else {
          handleItemClick('director-portal', { tab: 'dashboard' });
        }
      },
    },
    {
      id: 'admin-portal',
      tab: 'admin-portal',
      title: 'Painel do Administrador',
      subtitle: 'Homologação Sanitária, Motivações & Auditoria',
      description: 'Aprovação de cadastros de farmácias, análise de motivações técnicas, catálogo de medicamentos e utilizadores.',
      icon: Shield,
      color: 'blue',
      badge: pendingPharmacies.length > 0 ? `${pendingPharmacies.length} Pendentes` : 'Administração',
      badgeColor: pendingPharmacies.length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-blue-600 text-white',
      category: 'gestao',
      keywords: ['admin', 'administrador', 'aprovacao', 'homologacao', 'motivo', 'alvara', 'auditoria', 'usuarios'],
      onClick: () => {
        if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
          handleRoleSwitch('admin');
        } else {
          handleItemClick('admin-portal', pendingPharmacies.length > 0 ? { tab: 'approvals' } : undefined);
        }
      },
    },
    {
      id: 'orders',
      tab: 'orders',
      title: 'Minhas Reservas & Pedidos',
      subtitle: 'Acompanhamento em Tempo Real',
      description: 'Histórico de reservas de medicamentos, códigos para levantamento rápido no balcão e status do pedido.',
      icon: FileText,
      color: 'indigo',
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Ativos` : `${userOrders.length} Totais`,
      badgeColor: pendingOrdersCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800',
      category: 'servicos',
      keywords: ['pedidos', 'reservas', 'compras', 'levantamento', 'historico', 'balcao'],
    },
    {
      id: 'auth',
      tab: 'auth',
      title: 'Login & Registo por Perfil',
      subtitle: 'Utente, Director Técnico & Administrador DPS',
      description: 'Aceda ou crie a sua conta com formulários e campos específicos para cada perfil de utilizador em Moçambique.',
      icon: KeyRound,
      color: 'emerald',
      badge: '3 Perfis Distintos',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      category: 'servicos',
      keywords: ['login', 'registo', 'entrar', 'cadastrar', 'perfil', 'senha', 'autenticacao', 'director', 'admin', 'utente'],
    },
    {
      id: 'profile',
      tab: 'profile',
      title: 'Meu Perfil & Segurança',
      subtitle: 'Dados Pessoais, Telefone e Endereço',
      description: 'Gerencie seu perfil de acesso, número de telefone para notificações via SMS/WhatsApp e credenciais.',
      icon: User,
      color: 'violet',
      badge: currentUser.role,
      badgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
      category: 'servicos',
      keywords: ['perfil', 'conta', 'telefone', 'seguranca', 'senha', 'endereco', 'usuario'],
    },
    {
      id: 'register-pharmacy',
      tab: 'director-portal',
      params: { tab: 'cadastro' },
      title: 'Registar Nova Farmácia',
      subtitle: 'Formulário Oficial de Credenciamento',
      description: 'Submeta o alvará sanitário da DPS Tete, dados do Director Técnico e carta de motivação com os propósitos da unidade.',
      icon: PlusCircle,
      color: 'rose',
      badge: 'Credenciamento DPS',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      category: 'servicos',
      keywords: ['registar', 'cadastrar', 'nova farmacia', 'alvara', 'dps', 'submissao', 'credenciamento'],
      onClick: () => {
        if (currentUser.role !== 'director') {
          const allProfiles = FarmaLinkDB.getProfiles();
          const target = allProfiles.find((p) => p.role === 'director') || currentUser;
          FarmaLinkDB.setCurrentUser(target);
          onSwitchUser?.(target);
        }
        handleItemClick('director-portal', { tab: 'cadastro' });
      },
    },
    {
      id: 'help',
      tab: 'help',
      title: 'Centro de Ajuda & FAQ',
      subtitle: 'Perguntas Frequentes, Suporte WhatsApp & DPS',
      description: 'Esclareça dúvidas sobre pedidos, pagamentos M-Pesa/e-Mola, cadastro de farmácias e canais de apoio em Tete.',
      icon: HelpCircle,
      color: 'teal',
      badge: 'Suporte 24h',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      category: 'servicos',
      keywords: ['ajuda', 'suporte', 'faq', 'duvidas', 'whatsapp', 'perguntas', 'atendimento', 'contacto'],
    },
    {
      id: 'terms',
      tab: 'terms',
      title: 'Regulamento & Políticas Sanitárias',
      subtitle: 'Termos de Uso e Normas da DPS Tete',
      description: 'Diretrizes oficiais da Direcção Provincial de Saúde de Tete, privacidade de dados e termos da plataforma FarmaLink.',
      icon: FileCheck,
      color: 'slate',
      badge: 'Oficial DPS',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      category: 'servicos',
      keywords: ['termos', 'regulamento', 'privacidade', 'dps', 'saude', 'tete', 'leis', 'farmaceutico'],
    },
    {
      id: 'design-system',
      tab: 'design-system',
      title: 'Sistema de Design (Clinical Precision)',
      subtitle: 'Guia de Estilo, Tipografia & Acessibilidade Android',
      description: 'Componentes estandardizados para botões (≥48px), estados de stock, tipografia médica de alta legibilidade sob luz solar de Tete e contraste WCAG AAA.',
      icon: Palette,
      color: 'emerald',
      badge: 'Android UI / UX',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      category: 'servicos',
      keywords: ['design', 'sistema', 'styleguide', 'guia', 'botoes', 'tipografia', 'android', 'acessibilidade', 'cores', 'precision', 'clinical', 'componentes'],
    },
  ];

  const filteredNavCards = allNavCards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      card.title.toLowerCase().includes(query) ||
      card.subtitle.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query) ||
      card.keywords.some((k) => k.includes(query))
    );
  });

  return (
    <div
      id="fullscreen-menu-modal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 text-slate-100 backdrop-blur-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Top Bar / Header */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <FarmaLinkLogo size="md" showText={true} showSlogan={false} />
            <div className="hidden sm:block pl-3 border-l border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                Menu Geral de Navegação
              </span>
              <span className="text-[12px] text-slate-400">Província de Tete • Moçambique</span>
            </div>
          </div>

          {/* Quick Search inside Fullscreen Menu */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar opções do menu (ex: administrador, farmácias, estoque)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="fullscreen-menu-close-btn"
              onClick={onClose}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 group cursor-pointer"
              title="Fechar Menu (ESC)"
            >
              <span className="hidden xs:inline">Fechar</span>
              <X className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-transform" />
              <span className="hidden sm:inline-block text-[10px] bg-slate-900 px-1.5 py-0.5 rounded-md text-slate-400 border border-slate-800">
                ESC
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar no menu..."
              className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex-1 space-y-8">
        {/* User Status and Role Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          {/* Ambient light badge */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            {/* Left: User Identity Info */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center shadow-lg shrink-0">
                {currentUser.nome.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {currentUser.nome}
                  </h2>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      currentUser.role === 'admin' || currentUser.role === 'superadmin'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                        : currentUser.role === 'director'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {currentUser.role === 'admin' || currentUser.role === 'superadmin'
                      ? 'Administrador Geral / Gestor da Plataforma'
                      : currentUser.role === 'director'
                      ? 'Director Técnico'
                      : 'Utente'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                  {currentUser.email} • {currentUser.telefone || '+258 84 000 0000'}
                </p>
              </div>
            </div>

            {/* Right: Quick Role Switcher + Auth Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block w-full sm:w-auto sm:inline mr-1">
                Alternar Perfil:
              </span>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  id="menu-switch-utente"
                  onClick={() => handleRoleSwitch('user')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentUser.role === 'user'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Utente
                </button>
                <button
                  type="button"
                  id="menu-switch-director"
                  onClick={() => handleRoleSwitch('director')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentUser.role === 'director'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Director Técnico
                </button>
                <button
                  type="button"
                  id="menu-switch-admin"
                  onClick={() => handleRoleSwitch('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentUser.role === 'admin' || currentUser.role === 'superadmin'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Administrador
                </button>
              </div>

              {/* Login / Sair Actions */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
                <button
                  type="button"
                  id="menu-btn-entrar"
                  onClick={() => {
                    onOpenAuth?.('login');
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  id="menu-btn-sair"
                  onClick={() => {
                    onLogout?.();
                    onNavigate?.('home');
                    onClose();
                  }}
                  className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-800/50 transition-all cursor-pointer"
                  title="Terminar sessão"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: All Nav Cards in Full Screen Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Todas as Secções e Funcionalidades Ativas</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Selecione qualquer módulo abaixo para navegar instantaneamente
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full hidden sm:inline-block">
              {filteredNavCards.length} Módulos Disponíveis
            </span>
          </div>

          {filteredNavCards.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
              <p className="text-base font-bold text-slate-300">Nenhum módulo encontrado para "{searchQuery}"</p>
              <p className="text-xs">Tente pesquisar por termos como "farmácia", "remédio", "mapa", "admin" ou "director".</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Limpar Busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredNavCards.map((card) => {
                const Icon = card.icon;
                const isCurrent = currentTab === card.tab;

                return (
                  <div
                    key={card.id}
                    id={`menu-card-${card.id}`}
                    onClick={() => {
                      if (card.onClick) {
                        card.onClick();
                      } else {
                        handleItemClick(card.tab, card.params);
                      }
                    }}
                    className={`group relative p-5 sm:p-6 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden text-left ${
                      isCurrent
                        ? 'bg-gradient-to-b from-slate-900 to-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:translate-y-[-2px]'
                    }`}
                  >
                    {/* Background accent hover glow */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        card.color === 'emerald'
                          ? 'bg-emerald-500/15'
                          : card.color === 'blue'
                          ? 'bg-blue-500/15'
                          : card.color === 'amber'
                          ? 'bg-amber-500/15'
                          : card.color === 'teal'
                          ? 'bg-teal-500/15'
                          : card.color === 'cyan'
                          ? 'bg-cyan-500/15'
                          : card.color === 'indigo'
                          ? 'bg-indigo-500/15'
                          : 'bg-slate-500/15'
                      }`}
                    />

                    {/* Card Header: Icon + Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-md ${
                            card.color === 'emerald'
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                              : card.color === 'blue'
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : card.color === 'teal'
                              ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                              : card.color === 'cyan'
                              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                              : card.color === 'amber'
                              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                              : card.color === 'indigo'
                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                              : card.color === 'violet'
                              ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                              : card.color === 'rose'
                              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${card.badgeColor}`}
                        >
                          {card.badge}
                        </span>
                      </div>

                      {/* Card Title & Subtitle */}
                      <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        <span>{card.title}</span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        )}
                      </h4>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5 mb-2">
                        {card.subtitle}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Card Footer Action */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                      <span className="flex items-center gap-1">
                        {isCurrent ? (
                          <span className="text-emerald-400 font-bold">Secção Atual</span>
                        ) : (
                          <span>Aceder ao Módulo</span>
                        )}
                      </span>
                      <div className="p-1.5 rounded-xl bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white transition-all transform group-hover:translate-x-1">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Provincial Stats Strip */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 block">
              {approvedPharmacies.length}
            </span>
            <span className="text-xs text-slate-400 font-medium block">Farmácias Aprovadas DPS</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 block">
              {medicines.length}+
            </span>
            <span className="text-xs text-slate-400 font-medium block">Medicamentos Catalogados</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 block">
              6
            </span>
            <span className="text-xs text-slate-400 font-medium block">Bairros com Cobertura</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-400 block">
              24h
            </span>
            <span className="text-xs text-slate-400 font-medium block">Serviço de Plantão Ativo</span>
          </div>
        </div>

        {/* Bottom Support & DPS Disclaimer */}
        <div className="border-t border-slate-800 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>FarmaLink Tete • Plataforma de Gestão Farmacêutica em Moçambique</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleItemClick('terms')}
              className="hover:text-emerald-400 transition-colors"
            >
              Termos Sanitários DPS
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleItemClick('home')}
              className="hover:text-emerald-400 transition-colors"
            >
              Suporte & WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
