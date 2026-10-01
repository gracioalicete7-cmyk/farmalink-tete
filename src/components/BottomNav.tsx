import React from 'react';
import { Home, Store, Search, MapPin, FileText, User, Building2, Shield, Menu, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { FarmaLinkDB } from '../lib/storage';
import { UserProfile } from '../types';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  currentUser: UserProfile;
  pendingOrdersCount?: number;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenMenu?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  pendingOrdersCount,
  onOpenAuthModal,
  onLogout,
  onOpenMenu,
  onGoBack,
  canGoBack = false,
}) => {
  const userOrders = FarmaLinkDB.getOrders({ userId: currentUser.user_id });
  const activeOrders = pendingOrdersCount !== undefined ? pendingOrdersCount : userOrders.filter(
    (o) => !['Concluído', 'Cancelado', 'Rejeitado'].includes(o.status)
  ).length;

  const isDirector = currentUser.role === 'director';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

  return (
    <div
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-t border-slate-200/90 px-2 pt-1.5 pb-2 shadow-xl safe-area-bottom"
    >
      {/* Quick Mobile Entrar / Sair Symbols Strip */}
      <div className="flex items-center justify-between px-2.5 py-1 mb-1 bg-slate-50 rounded-lg text-[11px] border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[150px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="truncate text-[10px] text-slate-600 font-semibold">{currentUser.nome}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onGoBack && canGoBack && (
            <button
              type="button"
              id="mobile-strip-exit-screen"
              onClick={onGoBack}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-2xs active:scale-95 transition-all mr-1"
              title="Sair desta tela e voltar à página anterior"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
              <span>Sair</span>
            </button>
          )}
          <button
            type="button"
            id="mobile-strip-entrar"
            onClick={() => onOpenAuthModal?.('login')}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-white font-medium text-[10px] shadow-2xs active:scale-95 transition-all"
            title="Entrar na conta"
          >
            <span>Entrar</span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
          </button>
          <button
            type="button"
            id="mobile-strip-sair"
            onClick={onLogout}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px] shadow-2xs active:scale-95 transition-all"
            title="Sair da conta"
          >
            <ArrowLeft className="w-3 h-3 text-slate-400" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 items-center justify-between max-w-lg mx-auto gap-0.5">
        {/* Início */}
        <button
          type="button"
          id="bottom-nav-home"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] ${
            currentTab === 'home'
              ? 'text-emerald-700 font-bold bg-emerald-50/70'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5px] text-emerald-700' : 'stroke-2 text-slate-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
            Início
          </span>
        </button>

        {/* Farmácias */}
        <button
          type="button"
          id="bottom-nav-pharmacies"
          onClick={() => onNavigate('pharmacies')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] ${
            currentTab === 'pharmacies' || currentTab === 'pharmacy-detail'
              ? 'text-emerald-700 font-bold bg-emerald-50/70'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <Store className={`w-5 h-5 ${currentTab === 'pharmacies' || currentTab === 'pharmacy-detail' ? 'stroke-[2.5px] text-emerald-700' : 'stroke-2 text-slate-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
            Farmácias
          </span>
        </button>

        {/* Remédios / Medicamentos */}
        <button
          type="button"
          id="bottom-nav-medicines"
          onClick={() => onNavigate('medicines')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] ${
            currentTab === 'medicines' || currentTab === 'medicine-detail'
              ? 'text-emerald-700 font-bold bg-emerald-50/70'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'medicines' || currentTab === 'medicine-detail' ? 'stroke-[2.5px] text-emerald-700' : 'stroke-2 text-slate-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
            Remédios
          </span>
        </button>

        {/* Pedidos e Reservas */}
        <button
          type="button"
          id="bottom-nav-orders"
          onClick={() => onNavigate('orders')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] relative ${
            currentTab === 'orders'
              ? 'text-emerald-700 font-bold bg-emerald-50/70'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${currentTab === 'orders' ? 'stroke-[2.5px] text-emerald-700' : 'stroke-2 text-slate-500'}`} />
            {activeOrders > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                {activeOrders}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
            Pedidos
          </span>
        </button>

        {/* Mapa */}
        <button
          type="button"
          id="bottom-nav-map"
          onClick={() => onNavigate('map')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] ${
            currentTab === 'map'
              ? 'text-emerald-700 font-bold bg-emerald-50/70'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <MapPin className={`w-5 h-5 ${currentTab === 'map' ? 'stroke-[2.5px] text-emerald-700' : 'stroke-2 text-slate-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
            Mapa
          </span>
        </button>

        {/* Painel Específico ou Menu Completo */}
        {isAdmin ? (
          <button
            type="button"
            id="bottom-nav-admin-portal"
            onClick={() => onNavigate('admin-portal')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] ${
              currentTab === 'admin-portal'
                ? 'text-blue-700 font-bold bg-blue-50/80'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Shield className={`w-5 h-5 ${currentTab === 'admin-portal' ? 'stroke-[2.5px] text-blue-700' : 'stroke-2 text-slate-500'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
              Admin
            </span>
          </button>
        ) : isDirector ? (
          <button
            type="button"
            id="bottom-nav-director-portal"
            onClick={() => onNavigate('director-portal')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all select-none min-h-[46px] ${
              currentTab === 'director-portal'
                ? 'text-emerald-700 font-bold bg-emerald-50/70'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Building2 className={`w-5 h-5 ${currentTab === 'director-portal' ? 'stroke-[2.5px] text-emerald-700' : 'stroke-2 text-slate-500'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight whitespace-nowrap">
              Director
            </span>
          </button>
        ) : (
          <button
            type="button"
            id="bottom-nav-menu-btn"
            onClick={() => {
              if (onOpenMenu) {
                onOpenMenu();
              } else {
                const btn = document.getElementById('header-menu-symbol-btn');
                btn?.click();
              }
            }}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-emerald-800 hover:text-emerald-950 font-bold active:scale-95 transition-all bg-emerald-50/80 border border-emerald-200/80 min-h-[46px]"
            title="Abrir Menu Completo FarmaLink"
          >
            <Menu className="w-5 h-5 text-emerald-700" />
            <span className="text-[10px] mt-0.5 tracking-tight text-center leading-tight font-bold whitespace-nowrap">
              Menu
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
