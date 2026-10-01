import React, { useState, useEffect } from 'react';
import { FarmaLinkLogo } from '../lib/logo';
import { UserProfile, UserRole } from '../types';
import { FarmaLinkDB } from '../lib/storage';
import { NavMenuDrawer } from './NavMenuDrawer';
import { SecurityShieldModal } from './SecurityShieldModal';
import {
  Bell,
  User,
  Shield,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowRightToLine,
  ArrowRightFromLine,
  MapPin,
  Search,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Menu,
  X,
  Phone,
  Info,
  Clock,
  Package,
  Calendar,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  onUserChange?: (user: UserProfile) => void;
  onSwitchUser?: (user: UserProfile) => void;
  currentTab: string;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  unreadNotificationsCount?: number;
  onOpenMenu?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  historyDepth?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onSwitchUser,
  currentTab,
  onNavigate,
  onOpenAuth,
  onOpenAuthModal,
  onLogout,
  unreadNotificationsCount,
  onOpenMenu,
  onGoBack,
  canGoBack = false,
  historyDepth = 0,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<import('../types').NotificationItem | null>(null);
  const [, setHeaderRefresh] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const onStorage = () => {
      setTimeout(() => {
        if (isMounted) {
          setHeaderRefresh((k) => k + 1);
        }
      }, 0);
    };
    window.addEventListener('farmalink_storage_updated', onStorage);
    window.addEventListener('storage', onStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('farmalink_storage_updated', onStorage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleOpenMenuClick = () => {
    if (onOpenMenu) {
      onOpenMenu();
    } else {
      setIsMenuDrawerOpen(true);
    }
  };

  const updateUser = onUserChange || onSwitchUser || (() => {});
  const openAuth = onOpenAuth || onOpenAuthModal || (() => {});

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      const guestUser: UserProfile = {
        id: 'prof-guest',
        user_id: 'guest-1',
        nome: 'Visitante / Cidadão',
        email: 'visitante@farmalink.mz',
        telefone: '+258 84 000 0000',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      FarmaLinkDB.setCurrentUser(guestUser);
      updateUser(guestUser);
    }
    if (onNavigate) {
      onNavigate('home');
    }
    setShowUserMenu(false);
  };

  const handleLoginAction = () => {
    openAuth('login');
    setShowUserMenu(false);
  };

  const allProfiles = FarmaLinkDB.getProfiles();
  // Get user-specific notifications or general system notifications
  const rawNotifications = FarmaLinkDB.getNotifications(currentUser.user_id);
  // Also include broadcast/system notifications if any
  const allNotifications = FarmaLinkDB.getNotifications();
  const notifications = rawNotifications.length > 0 
    ? rawNotifications 
    : allNotifications.filter((n) => !n.user_id || n.user_id === currentUser.user_id || n.user_id === 'all' || currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const unreadCount = unreadNotificationsCount !== undefined ? unreadNotificationsCount : notifications.filter((n) => !n.lida).length;

  const pendingApprovalsCount = (currentUser.role === 'admin' || currentUser.role === 'superadmin')
    ? FarmaLinkDB.getPendingPharmacies().length
    : 0;

  const handleSwitchRole = (role: UserRole) => {
    const target = allProfiles.find((p) => p.role === role) || {
      id: `prof-${role}-1`,
      user_id: role === 'director' ? 'admin-1' : role === 'admin' ? 'admin-1' : 'user-1',
      nome:
        role === 'director'
          ? 'Dr. Grácio César (Director Técnico)'
          : role === 'admin'
          ? 'Grácio Hortêncio César (Licenciado em Farmácia)'
          : 'Utente FarmaLink Tete',
      email:
        role === 'director'
          ? 'gracioalicete7@gmail.com'
          : role === 'admin'
          ? 'gracioalicete7@gmail.com'
          : 'utente@farmalink.mz',
      role: role,
      status: 'active',
      telefone: '+258 84 123 4567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    FarmaLinkDB.setCurrentUser(target);
    updateUser(target);
    setShowRoleMenu(false);
    setShowUserMenu(false);

    // Auto-redirect to respective dashboard
    if (role === 'director') {
      onNavigate('director-portal', { tab: 'dashboard' });
    } else if (role === 'admin' || role === 'superadmin') {
      onNavigate('admin-portal');
    } else {
      onNavigate('home');
    }
  };

  const handleMarkNotifRead = (notif: import('../types').NotificationItem) => {
    FarmaLinkDB.markNotificationAsRead(notif.id);
    setSelectedNotification(notif);
    setShowNotifMenu(false);
  };

  const handleExecuteNotifAction = (link?: string) => {
    if (!link) {
      setSelectedNotification(null);
      return;
    }

    setSelectedNotification(null);

    // Route smartly based on notification target link
    if (link === 'director-orders' || link === 'director-orders-tab') {
      onNavigate('director-portal', { tab: 'orders' });
    } else if (link.startsWith('director-pharmacy:') || link.startsWith('pharmacy:')) {
      const pid = link.split(':')[1];
      onNavigate('director-portal', { pharmacyId: pid, tab: 'medicines' });
    } else if (link === 'director-pharmacy' || link === 'director-tab') {
      onNavigate('director-portal', { tab: 'medicines' });
    } else if (link === 'admin-approvals' || link === 'admin-pharmacies') {
      onNavigate('admin-portal', { tab: 'approvals' });
    } else if (link === 'admin-medicines') {
      onNavigate('admin-portal', { tab: 'medicines' });
    } else if (link === 'admin-stats') {
      onNavigate('admin-portal', { tab: 'stats' });
    } else if (link === 'orders' || link === 'user-orders') {
      onNavigate('orders');
    } else if (link === 'pharmacies') {
      onNavigate('pharmacies');
    } else if (link === 'medicines') {
      onNavigate('medicines');
    } else if (link === 'profile') {
      onNavigate('profile');
    } else {
      onNavigate(link);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'admin':
        return { label: 'Administrador', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'director':
        return { label: 'Director Técnico', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Utente / Cidadão', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <header id="main-app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner with Quick Role Switcher for seamless demonstration */}
      <div className="bg-slate-900 text-slate-200 px-3 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Província de Tete, MZ</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300">Medicamentos & Farmácias em tempo real</span>
          </div>

          {/* Persona quick switch and Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Alternar Perfil:</span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  id="role-btn-user"
                  onClick={() => handleSwitchRole('user')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    currentUser.role === 'user'
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Utente
                </button>
                <button
                  type="button"
                  id="role-btn-director"
                  onClick={() => handleSwitchRole('director')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    currentUser.role === 'director'
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Director Técnico
                </button>
                <button
                  type="button"
                  id="role-btn-admin"
                  onClick={() => handleSwitchRole('admin')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    currentUser.role === 'admin' || currentUser.role === 'superadmin'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Símbolo de Menu + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="header-menu-symbol-btn"
            onClick={handleOpenMenuClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl border border-slate-200 hover:border-emerald-300 font-bold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-95 group cursor-pointer"
            title="Abrir Menu Completo (Início, Farmácias, Remédios, etc.)"
          >
            <Menu className="w-4 h-4 text-slate-700 group-hover:text-emerald-700 transition-colors" />
            <span className="font-semibold text-xs hidden xs:inline sm:inline">Menu</span>
          </button>

          {/* Brand Logo */}
          <button
            type="button"
            id="header-brand-home-link"
            onClick={() => onNavigate('home')}
            className="text-left focus:outline-none"
          >
            <FarmaLinkLogo size="sm" showText={true} showSlogan={false} />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            type="button"
            id="nav-link-home"
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'home'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Início
          </button>
          <button
            type="button"
            id="nav-link-medicines"
            onClick={() => onNavigate('medicines')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'medicines'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pesquisar Medicamentos
          </button>
          <button
            type="button"
            id="nav-link-pharmacies"
            onClick={() => onNavigate('pharmacies')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'pharmacies'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Farmácias
          </button>
          <button
            type="button"
            id="nav-link-map"
            onClick={() => onNavigate('map')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'map'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Mapa de Tete
          </button>

          {/* Link direto para Meu Perfil na barra de navegação do computador */}
          <button
            type="button"
            id="nav-link-profile"
            onClick={() => onNavigate('profile')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>Meu Perfil</span>
          </button>

          {/* Role specific portals in header */}
          {currentUser.role === 'director' && (
            <button
              type="button"
              id="nav-link-director-portal"
              onClick={() => onNavigate('director-portal')}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentTab === 'director-portal'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Painel Farmácia</span>
            </button>
          )}

          {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <button
              type="button"
              id="nav-link-admin-portal"
              onClick={() => onNavigate('admin-portal', pendingApprovalsCount > 0 ? { tab: 'approvals' } : undefined)}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentTab === 'admin-portal'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Painel Administrativo</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse shadow-xs">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Right side Actions (Entrar, Sair, Notifications + User Menu) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Botão Entrar (Visível no Desktop/Tablet) */}
          <button
            type="button"
            id="header-btn-entrar"
            onClick={handleLoginAction}
            className="group hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs hover:shadow-sm active:scale-95"
            title="Entrar na conta"
          >
            <span>Entrar</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Botão Sair (Visível no Desktop/Tablet) */}
          <button
            type="button"
            id="header-btn-sair"
            onClick={handleLogoutAction}
            className="group hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95"
            title="Terminar sessão / Sair"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden xs:inline sm:inline">Sair</span>
          </button>

          {/* Escudo de Cibersegurança & Anti-Vírus FarmaLink */}
          <button
            type="button"
            id="header-security-shield-btn"
            onClick={() => setIsSecurityModalOpen(true)}
            className="group relative p-1.5 sm:p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all shadow-2xs hover:shadow-xs"
            title="Escudo de Cibersegurança & Proteção Ativa"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="sr-only">Segurança do Sistema</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="header-notif-btn"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Notificações"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifMenu && (
              <div
                id="header-notif-popover"
                className="absolute right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Notificações</span>
                    {unreadCount > 0 ? (
                      <span className="bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} novas
                      </span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {notifications.length} no total
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => FarmaLinkDB.markAllNotificationsAsRead(currentUser.user_id)}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs space-y-2">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">Sem notificações ativas</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Receberá aqui avisos sobre confirmação de reservas, alertas de stock e avisos de plantão farmacêutico em Tete.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkNotifRead(notif)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-start gap-2.5 ${
                          !notif.lida
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent'
                        }`}
                      >
                        <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          !notif.lida 
                            ? 'bg-emerald-600 text-white shadow-2xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <Bell className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{notif.titulo}</p>
                            {!notif.lida && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Não lida"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{notif.mensagem}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {new Date(notif.created_at).toLocaleTimeString('pt-MZ', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                              Ver detalhes →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Button / Menu - Otimizado e Elegante no Telemóvel e Computador */}
          <div className="shrink-0">
            <button
              type="button"
              id="header-user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border border-emerald-500/80 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 transition-all text-left shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ring-2 ring-emerald-500/20"
              title="Meu Perfil e Conta de Utilizador (Clique para abrir)"
            >
              {/* Avatar com Imagem ou Iniciais - Tamanho compacto no telemóvel (7x7 / 28px) e 8x8 no computador */}
              <div className="relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 shadow-2xs ring-1.5 ring-white overflow-hidden">
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser.nome.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                {/* Ponto indicador de estado ativo */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white sm:hidden"></span>
              </div>

              {/* Informação e Texto do Perfil no Computador e Tablet (oculto no telemóvel para não sobrecarregar) */}
              <div className="hidden sm:block leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[100px] sm:max-w-[120px]">
                    {currentUser.nome}
                  </span>
                  <span className="hidden lg:inline-block text-[10px] text-emerald-700 font-semibold">
                    (Perfil)
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-block text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              <ChevronDown className={`w-3 h-3 text-emerald-800 shrink-0 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Profile Panel - Abre no Lado ESQUERDO Superior da Tela */}
            {showUserMenu && (
              <>
                {/* Backdrop escuro suave para fechar ao clicar fora */}
                <div
                  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Card do Perfil ancorado no Canto Superior Esquerdo */}
                <div
                  id="header-user-popover"
                  className="fixed left-2 sm:left-6 top-16 sm:top-20 w-[calc(100vw-16px)] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in slide-in-from-left-4 duration-200"
                >
                  {/* Cabeçalho do Perfil com Avatar e Botão Fechar */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-emerald-100 shrink-0 overflow-hidden">
                        {currentUser.avatar_url ? (
                          <img
                            src={currentUser.avatar_url}
                            alt={currentUser.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{currentUser.nome.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{currentUser.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                        {currentUser.telefone && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{currentUser.telefone}</span>
                          </p>
                        )}
                        <div className="mt-1">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.bg}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Fechar Perfil"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Links e Opções de Navegação */}
                  <div className="py-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Meu Perfil Completo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('orders');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Meus Pedidos & Reservas</span>
                    </button>

                    {currentUser.role === 'director' && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('director-portal');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors border border-emerald-200/80 bg-emerald-50/50"
                      >
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>Painel do Director Técnico</span>
                      </button>
                    )}

                    {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('admin-portal', pendingApprovalsCount > 0 ? { tab: 'approvals' } : undefined);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-800 hover:bg-blue-50 flex items-center justify-between transition-colors border border-blue-200/80 bg-blue-50/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Painel de Administração Geral</span>
                        </div>
                        {pendingApprovalsCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse shadow-xs">
                            {pendingApprovalsCount}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('terms');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      <span>Termos & Privacidade</span>
                    </button>
                  </div>

                  {/* Ações de Sessão */}
                  <div className="pt-2 mt-1 border-t border-slate-100 space-y-1.5">
                    <button
                      type="button"
                      id="popover-btn-entrar"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLoginAction();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                        <span>Entrar com Outra Conta</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Login</span>
                    </button>

                    <button
                      type="button"
                      id="popover-btn-sair"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogoutAction();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50/80 hover:bg-rose-100 flex items-center justify-between transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4 text-rose-500 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Terminar Sessão</span>
                      </span>
                      <span className="text-[10px] text-rose-500 font-medium">Sair</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NavMenuDrawer - Símbolo de Menu Completo */}
      <NavMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        currentTab={currentTab}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onSwitchUser={updateUser}
        onOpenAuth={openAuth}
        onLogout={handleLogoutAction}
      />

      {/* Modal do Escudo de Cibersegurança e Anti-Vírus FarmaLink */}
      <SecurityShieldModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Modal Completo de Detalhes da Notificação */}
      {selectedNotification && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-detail-title"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-emerald-300 shrink-0 mt-0.5">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 mb-1.5">
                    {selectedNotification.tipo === 'order'
                      ? '📦 Pedido & Reserva'
                      : selectedNotification.tipo === 'pharmacy_approval'
                      ? '🏛️ Homologação / Farmácia'
                      : selectedNotification.tipo === 'stock'
                      ? '🔔 Alerta de Stock'
                      : 'ℹ️ Notificação do Sistema'}
                  </div>
                  <h3 id="notif-detail-title" className="text-base sm:text-lg font-black leading-snug">
                    {selectedNotification.titulo}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mensagem Oficial
                </p>
                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedNotification.mensagem}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium block text-[11px]">Data de Emissão</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {new Date(selectedNotification.created_at).toLocaleDateString('pt-MZ', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium block text-[11px]">Estado da Leitura</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Marcada como lida
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Fechar
                </button>

                {selectedNotification.link && (
                  <button
                    type="button"
                    onClick={() => handleExecuteNotifAction(selectedNotification.link)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>
                      {selectedNotification.link.includes('orders')
                        ? 'Ver Meus Pedidos'
                        : selectedNotification.link.includes('approvals')
                        ? 'Ver Homologações Pendentes'
                        : selectedNotification.link.includes('pharmacy') || selectedNotification.link.includes('director')
                        ? '💊 Gerir Medicamentos & Estoque'
                        : selectedNotification.link.includes('medicines')
                        ? 'Ver Catálogo de Medicamentos'
                        : 'Abrir Página do Alerta'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
